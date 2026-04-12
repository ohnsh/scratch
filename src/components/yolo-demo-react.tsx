import { useRef, useState, useEffect } from 'react'
import DetectionOverlay from './detection-overlay'
import { ObjectDetector } from '@/vendor/yolov12-onnx/object-detector'
import type { Detection } from '@/vendor/yolov12-onnx/types'

export default function YoloDemo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraSelected, setIsCameraSelected] = useState(false)
  const { detections } = useVideoObjectDetector(videoRef)
  const { stream } = useUserMedia(isCameraSelected)

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

function useVideoObjectDetector(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const detectorRef = useRef<ObjectDetector>(null!)
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const contextRef = useRef<CanvasRenderingContext2D>(null!)
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)

  if (!detectorRef.current) {
    detectorRef.current = new ObjectDetector()
    detectorRef.current.initialize().then(() => {
      if (!videoRef.current) {
        throw new Error('videoRef not initialized before ObjectDetector.')
      }
      setLoading(false)
      detectLoop()
    })
  }

  if (!canvasRef.current) {
    // Create hidden canvas for frame extraction
    canvasRef.current = document.createElement('canvas')
    // hat tip to edge console for the `willReadFrequently` tip.
    // Helps the browser optimize by storing the bitmap on the CPU instead of the GPU.
    contextRef.current = canvasRef.current.getContext('2d' /*, { willReadFrequently: true }*/)!
  }

  const getImageData = () => {
    const video = videoRef.current!
    const canvas = canvasRef.current
    const ctx = contextRef.current

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error('<video> element has zero width or height.')
    }

    // Update canvas size if video size changed
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for processing
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  // Start detection loop
  const detectLoop = async () => {
    const frame = getImageData()
    try {
      const newDetections = await detectorRef.current.detectObjects(frame)
      setDetections(newDetections)
    } catch (err) {
      console.error('Detection error:', err)
    }

    setTimeout(detectLoop, 200)
  }

  // videoRef.current.addEventListener('loadeddata', () => { })

  return { loading, detections }
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
