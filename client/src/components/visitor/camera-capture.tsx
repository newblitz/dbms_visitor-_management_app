import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Repeat, Image } from "lucide-react";
import Webcam from "react-webcam";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCapture: (imageUrl: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if browser supports getUserMedia
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setError("Your browser doesn't support camera access");
    }
  }, []);
  
  const handleUserMediaError = (error: string | DOMException) => {
    console.error("Camera access error:", error);
    setHasCamera(false);
    setError(
      error instanceof DOMException
        ? `Camera access denied: ${error.message}`
        : "Failed to access camera. Please check permissions."
    );
  };
  
  const handleUserMedia = () => {
    setIsCameraReady(true);
    setError(null);
  };
  
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden flex flex-col items-center justify-center",
      "border-2 border-dashed w-full"
    )}>
      {hasCamera ? (
        <div className="w-full">
          <div className="relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ 
                width: 1280, 
                height: 720, 
                facingMode: "user" 
              }}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="w-full h-full"
              style={{ minHeight: "200px" }}
            />
            
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <div className="text-center p-4">
                  <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p>Initializing camera...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-3 flex justify-center">
            <Button 
              onClick={capturePhoto}
              disabled={!isCameraReady}
              className="flex items-center"
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture Photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center">
          <div className="rounded-full bg-muted p-3 mx-auto w-fit mb-4">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">{error || "Camera not available"}</p>
          <Button variant="outline" size="sm" className="mx-auto">
            <Image className="mr-2 h-4 w-4" />
            Upload Photo
          </Button>
        </div>
      )}
    </Card>
  );
}
