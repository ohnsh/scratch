// https://github.com/bluenviron/mediamtx/blob/main/internal/servers/webrtc/reader.js

// Removed bulky code for detecting supported audio codecs that aren't advertised by default.

/**
 * @callback OnError
 * @param {string} err - error.
 */

/**
 * @callback OnTrack
 * @param {RTCTrackEvent} evt - track event.
 */

/**
 * @callback OnDataChannel
 * @param {RTCDataChannelEvent} evt - data channel event.
 */

/**
 * @typedef {object} Conf
 * @property {string} url - absolute URL of the WHEP endpoint.
 * @property {string} [user] - username.
 * @property {string} [pass] - password.
 * @property {string} [token] - token.
 * @property {OnError} onError - called when there's an error.
 * @property {OnTrack} onTrack - called when there's a track available.
 * @property {OnDataChannel} onDataChannel - called when there's a data channel available.
 */

/** WebRTC/WHEP reader. */
export class MediaMTXWebRTCReader {
  /**
   * Create a MediaMTXWebRTCReader.
   * @param {Conf} conf - configuration.
   */
  constructor(conf) {
    this.retryPause = 2000;
    this.conf = conf;
    this.restartTimeout = null;
    this.pc = null;
    this.offerData = null;
    this.sessionUrl = null;
    this.queuedCandidates = [];
  
    this.state = 'running';
    this.#start();
  }

  /**
   * Close the reader and all its resources.
   */
  close() {
    this.state = 'closed';

    if (this.pc !== null) {
      this.pc.close();
    }

    if (this.restartTimeout !== null) {
      clearTimeout(this.restartTimeout);
    }
  }

  static #unquoteCredential(v) {
    return JSON.parse(`"${v}"`);
  }

  static #linkToIceServers(links) {
    return (links !== null) ? links.split(', ').map((link) => {
      const m = link.match(/^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i);
      const ret = {
        urls: [m[1]],
      };

      if (m[3] !== undefined) {
        ret.username = this.#unquoteCredential(m[3]);
        ret.credential = this.#unquoteCredential(m[4]);
        ret.credentialType = 'password';
      }

      return ret;
    }) : [];
  }

  static #parseOffer(sdp) {
    const ret = {
      iceUfrag: '',
      icePwd: '',
      medias: [],
    };

    for (const line of sdp.split('\r\n')) {
      if (line.startsWith('m=')) {
        ret.medias.push(line.slice('m='.length));
      } else if (ret.iceUfrag === '' && line.startsWith('a=ice-ufrag:')) {
        ret.iceUfrag = line.slice('a=ice-ufrag:'.length);
      } else if (ret.icePwd === '' && line.startsWith('a=ice-pwd:')) {
        ret.icePwd = line.slice('a=ice-pwd:'.length);
      }
    }

    return ret;
  }

  static #reservePayloadType(payloadTypes) {
    // everything is valid between 30 and 127, except for interval between 64 and 95
    // https://chromium.googlesource.com/external/webrtc/+/refs/heads/master/call/payload_type.h#29
    for (let i = 30; i <= 127; i++) {
      if ((i <= 63 || i >= 96) && !payloadTypes.includes(i.toString())) {
        const pl = i.toString();
        payloadTypes.push(pl);
        return pl;
      }
    }
    throw Error('unable to find a free payload type');
  }

  static #enableStereoOpus(section) {
    let opusPayloadFormat = '';
    const lines = section.split('\r\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('a=rtpmap:') && lines[i].toLowerCase().includes('opus/')) {
        opusPayloadFormat = lines[i].slice('a=rtpmap:'.length).split(' ')[0];
        break;
      }
    }

    if (opusPayloadFormat === '') {
      return section;
    }

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`a=fmtp:${opusPayloadFormat} `)) {
        if (!lines[i].includes('stereo')) {
          lines[i] += ';stereo=1';
        }
        if (!lines[i].includes('sprop-stereo')) {
          lines[i] += ';sprop-stereo=1';
        }
      }
    }

    return lines.join('\r\n');
  }

  static #editOffer(sdp) {
    const sections = sdp.split('m=');

    const payloadTypes = sections.slice(1)
      .map((s) => s.split('\r\n')[0].split(' ').slice(3))
      .reduce((prev, cur) => [...prev, ...cur], []);

    for (let i = 1; i < sections.length; i++) {
      if (sections[i].startsWith('audio')) {
        sections[i] = this.#enableStereoOpus(sections[i]);

        break;
      }
    }

    return sections.join('m=');
  }

  static #generateSdpFragment(od, candidates) {
    const candidatesByMedia = {};
    for (const candidate of candidates) {
      const mid = candidate.sdpMLineIndex;
      if (candidatesByMedia[mid] === undefined) {
        candidatesByMedia[mid] = [];
      }
      candidatesByMedia[mid].push(candidate);
    }

    let frag = `a=ice-ufrag:${od.iceUfrag}\r\n`
      + `a=ice-pwd:${od.icePwd}\r\n`;

    let mid = 0;

    for (const media of od.medias) {
      if (candidatesByMedia[mid] !== undefined) {
        frag += `m=${media}\r\n`
          + `a=mid:${mid}\r\n`;

        for (const candidate of candidatesByMedia[mid]) {
          frag += `a=${candidate.candidate}\r\n`;
        }
      }
      mid++;
    }

    return frag;
  }

  #handleError(err) {
    if (this.state === 'running') {
      if (this.pc !== null) {
        this.pc.close();
        this.pc = null;
      }

      this.offerData = null;

      if (this.sessionUrl !== null) {
        fetch(this.sessionUrl, {
          method: 'DELETE',
        });
        this.sessionUrl = null;
      }

      this.queuedCandidates = [];
      this.state = 'restarting';

      this.restartTimeout = window.setTimeout(() => {
        this.restartTimeout = null;
        this.state = 'running';
        this.#start();
      }, this.retryPause);

      if (this.conf.onError !== undefined) {
        this.conf.onError(`${err}, retrying in some seconds`);
      }
    } else if (this.state === 'getting_codecs') {
      this.state = 'failed';

      if (this.conf.onError !== undefined) {
        this.conf.onError(err);
      }
    }
  }

  #start() {
    this.#requestICEServers()
      .then((iceServers) => this.#setupPeerConnection(iceServers))
      .then((offer) => this.#sendOffer(offer))
      .then((answer) => this.#setAnswer(answer))
      .catch((err) => {
        this.#handleError(err.toString());
      });
  }

  #authHeader() {
    if (this.conf.user !== undefined && this.conf.user !== '') {
      const credentials = btoa(`${this.conf.user}:${this.conf.pass}`);
      return {'Authorization': `Basic ${credentials}`};
    }
    if (this.conf.token !== undefined && this.conf.token !== '') {
      return {'Authorization': `Bearer ${this.conf.token}`};
    }
    return {};
  }

  #requestICEServers() {
    return fetch(this.conf.url, {
      method: 'OPTIONS',
      headers: {
        ...this.#authHeader(),
      },
    })
      .then((res) => MediaMTXWebRTCReader.#linkToIceServers(res.headers.get('Link')));
  }

  #setupPeerConnection(iceServers) {
    if (this.state !== 'running') {
      throw new Error('closed');
    }

    this.pc = new RTCPeerConnection({
      iceServers,
      // https://webrtc.org/getting-started/unified-plan-transition-guide
      sdpSemantics: 'unified-plan',
    });

    const direction = 'recvonly';
    this.pc.addTransceiver('video', { direction });
    this.pc.addTransceiver('audio', { direction });

    // using data channels requires creating a data channel locally
    this.pc.createDataChannel('');

    this.pc.onicecandidate = (evt) => this.#onLocalCandidate(evt);
    this.pc.onconnectionstatechange = () => this.#onConnectionState();
    this.pc.ontrack = (evt) => this.conf.onTrack?.(evt);
    this.pc.ondatachannel = (evt) => this.conf.onDataChannel?.(evt);

    return this.pc.createOffer()
      .then((offer) => {
        offer.sdp = MediaMTXWebRTCReader.#editOffer(offer.sdp);
        this.offerData = MediaMTXWebRTCReader.#parseOffer(offer.sdp);

        return this.pc.setLocalDescription(offer)
          .then(() => offer.sdp);
      });
  }

  #sendOffer(offer) {
    if (this.state !== 'running') {
      throw new Error('closed');
    }

    return fetch(this.conf.url, {
      method: 'POST',
      headers: {
        ...this.#authHeader(),
        'Content-Type': 'application/sdp',
      },
      body: offer,
    })
      .then((res) => {
        switch (res.status) {
          case 201:
            break;
          case 404:
            throw new Error('stream not found');
          case 400:
            return res.json().then((e) => { throw new Error(e.error); });
          default:
            throw new Error(`bad status code ${res.status}`);
        }

        this.sessionUrl = new URL(res.headers.get('location'), this.conf.url).toString();

        return res.text();
      });
  }

  #setAnswer(answer) {
    if (this.state !== 'running') {
      throw new Error('closed');
    }

    return this.pc.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: answer,
    }))
      .then(() => {
        if (this.state !== 'running') {
          return;
        }

        if (this.queuedCandidates.length !== 0) {
          this.#sendLocalCandidates(this.queuedCandidates);
          this.queuedCandidates = [];
        }
      });
  }

  #onLocalCandidate(evt) {
    if (this.state !== 'running') {
      return;
    }

    if (evt.candidate !== null) {
      if (this.sessionUrl === null) {
        this.queuedCandidates.push(evt.candidate);
      } else {
        this.#sendLocalCandidates([evt.candidate]);
      }
    }
  }

  #sendLocalCandidates(candidates) {
    fetch(this.sessionUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/trickle-ice-sdpfrag',
        'If-Match': '*',
      },
      body: MediaMTXWebRTCReader.#generateSdpFragment(this.offerData, candidates),
    })
      .then((res) => {
        switch (res.status) {
          case 204:
            break;
          case 404:
            throw new Error('stream not found');
          default:
            throw new Error(`bad status code ${res.status}`);
        }
      })
      .catch((err) => {
        this.#handleError(err.toString());
      });
  }

  #onConnectionState() {
    if (this.state !== 'running') {
      return;
    }

    // "closed" can arrive before "failed" and without
    // the close() method being called at all.
    // It happens when the other peer sends a termination
    // message like a DTLS CloseNotify.
    if (this.pc.connectionState === 'failed'
      || this.pc.connectionState === 'closed'
    ) {
      this.#handleError('peer connection closed');
    }
  }
}