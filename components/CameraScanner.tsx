import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertTriangle } from 'lucide-react';

interface CameraScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          videoRef.current.setAttribute('playsinline', 'true'); // iOS fix
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Brak dostępu do kamery. Sprawdź uprawnienia lub użyj wprowadzania ręcznego.");
      }
    };

    const tick = () => {
      if (!isScanning) return;
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Use global jsQR if available
          // @ts-ignore
          const code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          }) : null;

          if (code && code.data && code.data.length > 0) {
            setIsScanning(false);
            onScan(code.data);
            return; 
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      setIsScanning(false);
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array to run once

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-4 right-4 z-50">
        <button onClick={onClose} className="bg-gray-800/80 p-2 rounded-full text-white">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-6 text-red-400">
            <AlertTriangle size={48} className="mx-auto mb-4" />
            <p>{error}</p>
            <button onClick={onClose} className="mt-4 bg-gray-700 px-4 py-2 rounded text-white">
              Zamknij
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay UI */}
            <div className="absolute inset-0 border-2 border-inpost-yellow opacity-50 m-12 rounded-lg pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-20 left-0 right-0 text-center">
              <p className="bg-black/60 text-white inline-block px-4 py-2 rounded-full text-sm font-mono">
                Nakieruj na kod QR lub kreskowy
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};