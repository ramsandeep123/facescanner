import { useState } from "react";
import Header from "@/components/Header";
import CameraCapture from "@/components/CameraCapture";
import EyeColorEditor from "@/components/EyeColorEditor";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles } from "lucide-react";

const EyeColor = () => {
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {!isCameraOpen && !capturedImage && (
        <main className="pt-24 pb-12 px-4 container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] relative overflow-hidden">
          {/* Background Glow Effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -z-10 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] -z-10 animate-pulse delay-700" />

          <div className="max-w-2xl text-center space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-white hover:scale-105 transition-transform cursor-default">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium tracking-wide">Virtual Try-On</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              Change Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Eye Color
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto font-light leading-relaxed">
              Experiment with 10 different colored contact lenses instantly. 
              Find the perfect match for your eyes before you buy.
            </p>

            <div className="pt-8">
              <Button
                onClick={() => setIsCameraOpen(true)}
                size="lg"
                className="px-8 py-6 rounded-full text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-105 transition-all border border-white/20"
              >
                <Camera className="w-6 h-6 mr-3" />
                Take a Photo
              </Button>
            </div>
          </div>
        </main>
      )}

      {isCameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            setCapturedImage(file);
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {capturedImage && !isCameraOpen && (
        <div className="pt-16">
          <EyeColorEditor
            imageFile={capturedImage}
            onRetake={() => {
              setCapturedImage(null);
              setIsCameraOpen(true);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EyeColor;
