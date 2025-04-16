import { useEffect, useRef, useState } from 'react';
import { Button } from './button';
import { Camera, RefreshCw } from 'lucide-react';

interface WebcamCaptureProps {
  onImageCapture: (imageData: string) => void;
  width?: number;
  height?: number;
}

export function WebcamCapture({ onImageCapture, width = 320, height = 240 }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startWebcam = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access webcam. Please ensure your camera is connected and you have granted permission.");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach((track) => {
        track.stop();
      });
      
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      
      if (context) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        
        context.drawImage(videoRef.current, 0, 0, width, height);
        
        const imageData = canvasRef.current.toDataURL('image/png');
        setCapturedImage(imageData);
        onImageCapture(imageData);
        
        // Stop the webcam after capturing
        stopWebcam();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startWebcam();
  };

  useEffect(() => {
    // Start webcam when component mounts
    startWebcam();
    
    // Cleanup function to stop webcam when component unmounts
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="relative overflow-hidden rounded-lg border border-gray-300 bg-black mb-4" style={{ width, height }}>
        {!capturedImage ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ width, height }}
            className={isStreaming ? "block" : "hidden"}
          />
        ) : (
          <img 
            src={capturedImage} 
            alt="Captured" 
            style={{ width, height }}
          />
        )}
        
        {/* Hidden canvas used for capturing from video */}
        <canvas ref={canvasRef} className="hidden" />
        
        {!isStreaming && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-4">
              <Camera className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Loading camera...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        {!capturedImage && isStreaming ? (
          <Button 
            onClick={captureImage}
            type="button"
            variant="default"
            size="sm"
          >
            <Camera className="mr-2 h-4 w-4" />
            Capture Photo
          </Button>
        ) : capturedImage ? (
          <Button 
            onClick={retakePhoto}
            type="button"
            variant="outline"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retake
          </Button>
        ) : null}
      </div>
    </div>
  );
}