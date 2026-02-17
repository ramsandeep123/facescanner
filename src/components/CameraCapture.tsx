import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, SwitchCamera, X, Check } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please ensure you've granted camera permissions.");
      setIsLoading(false);
    }
  }, [stream]);

  const switchCamera = () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image for front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    
    // Stop the stream after capture
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    // Convert base64 to file
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        onCapture(file);
      });
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  // Start camera on mount
  useState(() => {
    startCamera(facingMode);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={handleClose}
          className="w-12 h-12 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-medium text-lg shadow-sm">Take Photo</span>
        {!capturedImage && (
          <button
            onClick={switchCamera}
            className="w-12 h-12 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <SwitchCamera className="w-6 h-6" />
          </button>
        )}
        {capturedImage && <div className="w-12" />}
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-8 z-10">
            <div className="text-center max-w-xs glass-panel border-white/10">
              <Camera className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white mb-6">{error}</p>
              <Button
                className="w-full glass-button text-white border-none"
                onClick={() => startCamera(facingMode)}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                facingMode === "user" ? "scale-x-[-1]" : ""
              }`}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-white/70 text-sm">Starting camera...</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Face guide overlay */}
        {!capturedImage && !error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative w-[80vw] max-w-sm h-[60vh] max-h-[500px] border-2 border-dashed border-white/40 rounded-[45%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 whitespace-nowrap">
                  <span className="text-white/90 text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                    Position face within frame
                  </span>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 pb-12 flex items-center justify-center gap-8 absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent">
        {capturedImage ? (
          <div className="flex gap-6 w-full max-w-sm">
            <Button
              variant="outline"
              size="lg"
              onClick={retakePhoto}
              className="flex-1 h-14 rounded-full border-white/20 text-white bg-black/40 hover:bg-white/10 backdrop-blur-md"
            >
              Retake
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={confirmPhoto}
              className="flex-1 h-14 rounded-full glass-button text-white border-none gap-2 hover:scale-105 transition-transform"
            >
              <Check className="w-5 h-5" />
              Use Photo
            </Button>
          </div>
        ) : (
          <button
            onClick={capturePhoto}
            disabled={isLoading || !!error}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50 transition-all hover:scale-110 active:scale-95 hover:border-primary shadow-lg shadow-black/20"
          >
            <div className="w-16 h-16 rounded-full bg-white transition-colors hover:bg-primary" />
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
