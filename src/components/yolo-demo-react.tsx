import { useRef, useState, useEffect } from 'react'
import UserMedia from './UserMedia.astro'
import DetectionOverlay from './detection-overlay'
import { ObjectDetector } from '@/vendor/yolov12-onnx/object-detector'
import { VideoProcessor } from '@/vendor/yolov12-onnx/video-processor'
import type { Detection } from '@/vendor/yolov12-onnx/types'

export default function YoloDemo() {
  const [detections, setDetections] = useState<Detection[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const detectorRef = useRef<ObjectDetector>(null!)
  const processorRef = useRef<VideoProcessor>(null!)
  const [isCameraSelected, setIsCameraSelected] = useState(false)
  const { stream } = useUserMedia(isCameraSelected)

  if (!detectorRef.current) {
    detectorRef.current = new ObjectDetector()
    detectorRef.current.initialize().then(() => {
      if (!videoRef.current) {
        throw new Error('videoRef not initialized in effect')
      }
      processorRef.current.startProcessing()

      detectLoop()
    })
  }

  if (!processorRef.current) {
    processorRef.current = new VideoProcessor(
      () => {},
      () => {} // Stats callback, idk
    )
  }

  useEffect(() => {
    if (!videoRef.current) {
      throw new Error('videoRef not available in effect.')
    }
    if (stream) {
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = (e) => {
        videoRef.current?.play()
      }
      return () => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = null
        }
      }
    }
  }, [stream])

  const videoLoaded = () => {
    processorRef.current.setVideo(videoRef.current!)
  }

  // Start detection loop
  const detectLoop = async () => {
    const frame = processorRef.current.getCurrentFrame()
    if (frame) {
      try {
        const newDetections = await detectorRef.current.detectObjects(frame)
        setDetections(newDetections)
      } catch (err) {
        console.error('Detection error:', err)
      }
    }

    // Continue loop if processing and not paused
    if (!processorRef.current.isProcessingStopped()) {
      requestAnimationFrame(detectLoop)
    }
  }

  const activateCamera = () => {
    setIsCameraSelected(true)
  }
  const deactivateCamera = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraSelected(false)
  }

  // Gemini recommendation for full-screen on mobile:
  // width: 100vw; height: 100vh; object-fit: cover;
  const videoWidth = videoRef.current?.videoWidth ?? 0
  const videoHeight = videoRef.current?.videoHeight ?? 0

  return (
    <>
      <div className="not-content yolo-demo" style={{ position: 'relative' }}>
        {/* <UserMedia /> */}
        <video
          ref={videoRef}
          controls
          playsInline
          // autoPlay
          crossOrigin="anonymous"
          style={{ maxWidth: '100%' }}
          onLoadedData={videoLoaded}
        >
          <source type="video/mp4" src="https://media.ohn.sh/doggos-short-2026-04-09.mp4" />
        </video>
        <DetectionOverlay
          detections={detections}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
        />
      </div>
      <div className="not-content">
        {isCameraSelected ? (
          <button onClick={deactivateCamera}>Switch to Video</button>
        ) : (
          <button onClick={activateCamera}>Switch to Camera</button>
        )}
      </div>
    </>
  )
}

function useUserMedia(active: boolean) {
  const streamRef = useRef<MediaStream>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (active) {
      navigator.mediaDevices
        .enumerateDevices()
        .then(async (_devices) => {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { height: 1080, aspectRatio: 16 / 9, facingMode: 'environment' /*user*/ },
          })
          streamRef.current = stream
          setLoaded(true)
        })
        .catch((error) => {
          console.error('Error accessing user media:', error)
        })
    } else {
      for (const track of streamRef.current?.getTracks() ?? []) {
        track.stop()
      }
      streamRef.current = null
      setLoaded(false)
    }
  }, [active])

  return { loaded, stream: streamRef.current }
}
