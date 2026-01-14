import React, { useEffect, useRef } from "react"
import jsQR from "jsqr"

type Props = { onScan: (payload: string) => void; onCancel: () => void }

export default function CameraScanner({ onScan, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(true)
  let stream: MediaStream | null = null

  useEffect(() => {
    activeRef.current = true
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(s => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.setAttribute("playsinline", "true")
          videoRef.current.play()
          requestAnimationFrame(scan)
        }
      })
      .catch(onCancel)
    return () => {
      activeRef.current = false
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const scan = () => {
    if (!activeRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(img.data, canvas.width, canvas.height)
      if (code?.data) {
        activeRef.current = false
        stream?.getTracks().forEach(t => t.stop())
        onScan(code.data)
        return
      }
    }
    requestAnimationFrame(scan)
  }

  return (<><video ref={videoRef} className="w-full h-full object-cover" /><canvas ref={canvasRef} style={{ display: "none" }} /></>)
}