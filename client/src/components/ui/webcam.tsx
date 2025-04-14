import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onClear: () => void;
  photoDataUrl?: string;
}

export function WebcamCapture({ onCapture, onClear, photoDataUrl }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isCaptureMode, setIsCaptureMode] = useState(!photoDataUrl);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");

  // Get available camera devices
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        setAvailableDevices(videoDevices);
        
        if (videoDevices.length > 0 && !currentDeviceId) {
          setCurrentDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    }

    getDevices();
  }, [currentDeviceId]);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
        setIsCaptureMode(false);
      }
    }
  }, [onCapture]);

  const retake = useCallback(() => {
    onClear();
    setIsCaptureMode(true);
  }, [onClear]);

  // Video constraints
  const videoConstraints = {
    width: 320,
    height: 320,
    facingMode: "user",
    deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined
  };

  return (
    <div className="webcam-container">
      {isCaptureMode ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={320}
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 inset-x-0 flex justify-center">
            <Button 
              onClick={capture} 
              variant="secondary" 
              className="bg-white/90 hover:bg-white"
              size="icon"
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>
          
          {availableDevices.length > 1 && (
            <div className="absolute top-2 right-2">
              <select 
                className="bg-white/80 text-black text-xs rounded p-1"
                value={currentDeviceId}
                onChange={(e) => setCurrentDeviceId(e.target.value)}
              >
                {availableDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${availableDevices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      ) : (
        <>
          {photoDataUrl && (
            <img src={photoDataUrl} alt="Visitor" className="w-full h-full object-cover" />
          )}
          <div className="absolute bottom-2 right-2 space-x-2">
            <Button 
              onClick={retake} 
              variant="secondary" 
              size="icon"
              className="bg-white/90 hover:bg-white"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
