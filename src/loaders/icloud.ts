export default async (token: string) => {
  const webstream = await api(token, 'webstream', { streamCtag: null })
  const photoGuids = webstream.photos.map(({ photoGuid }) => photoGuid)
  const webasseturls = await api(token, 'webasseturls', { photoGuids })

  return { webstream, photoGuids, webasseturls }
}

async function api(token: string, path: string, body: any) {
  const url = `https://p${partition(token)}-sharedstreams.icloud.com/${token}/sharedstreams/${path}`
  body = JSON.stringify(body)

  const resp = await fetch(url, { method: 'POST', body })
  if (!resp.ok) {
    throw resp
  }
  return resp.json()
}

function partition(token: string) {
  const version = token[0]
  const base62part = token.slice(1, version === 'A' ? 2 : 3)
  const part = base62ToInt(base62part)

  // const i = token.indexOf(";")
  // let photoGuid = null
  // if (i >= 0) {
  //   photoGuid = token.slice(i + 1)
  // }
  // token = token.replace(";" + photoGuid, "")

  return part < 10 ? `0${part}` : part.toString()
}

function base62ToInt(str: string) {
  const BASE_62_CHAR_SET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  let total = 0
  for (const c of str) {
    total = total * 62 + BASE_62_CHAR_SET.indexOf(c);
  }
  return total
}


/*
    },
    generateNewUrlToken: function() {
        var e = this.token
          , t = this.photoGuid;
        return t && (e += ";" + t),
        e
    },
    },b
*/
