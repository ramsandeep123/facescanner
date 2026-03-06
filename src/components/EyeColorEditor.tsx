import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Loader2, ZoomIn, ZoomOut, Search } from "lucide-react";
import { analyzeFace, initializeFaceDetector } from "@/lib/faceAnalysis";
import { useToast } from "@/hooks/use-toast";

const LENS_COLORS = [
  { name: "Blue", hex: "#0077ff" },
  { name: "Green", hex: "#00ff44" },
  { name: "Hazel", hex: "#c99c3b" },
  { name: "Violet", hex: "#8a2be2" },
  { name: "Gray", hex: "#888888" },
  { name: "Brown", hex: "#5c3a21" },
  { name: "Honey", hex: "#e6ab22" },
  { name: "Turquoise", hex: "#40e0d0" },
  { name: "Amethyst", hex: "#9966cc" },
  { name: "Sapphire", hex: "#0f52ba" },
];

interface EyeColorEditorProps {
  imageFile: File;
  onRetake: () => void;
}

const EyeColorEditor = ({ imageFile, onRetake }: EyeColorEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [landmarks, setLandmarks] = useState<any[] | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0, bgLeft: 0, bgTop: 0, bgWidth: 0, bgHeight: 0, show: false });
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const loadImage = async () => {
      setIsAnalyzing(true);
      
      try {
        await initializeFaceDetector();
      } catch (err) {
        console.error("Failed to init face detector:", err);
      }

      const url = URL.createObjectURL(imageFile);
      const img = new Image();
      img.src = url;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      imageRef.current = img;

      try {
        const result = await analyzeFace(img);
        setLandmarks(result.landmarks.keypoints);
        draw(img, result.landmarks.keypoints, selectedColor);
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Face Detection Failed",
          description: err.message || "Could not detect eyes clearly.",
        });
        draw(img, null, null); // fallback to original image
      } finally {
        setIsAnalyzing(false);
      }
    };
    loadImage();
  }, [imageFile]);

  const handleZoomIn = () => setZoom(z => Math.min(4, z + 0.5));
  const handleZoomOut = () => {
    setZoom(z => {
      const newZoom = Math.max(1, z - 0.5);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMagnifierActive) return;
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleMouseLeave = () => {
    setIsDragging(false);
    setMagnifierPos(prev => ({ ...prev, show: false }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && zoom > 1 && !isMagnifierActive) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
      return;
    }

    if (!isMagnifierActive || !canvasRef.current) return;

    const containerRect = e.currentTarget.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();

    const containerX = e.clientX - containerRect.left;
    const containerY = e.clientY - containerRect.top;

    const isOverCanvas =
      e.clientX >= canvasRect.left && e.clientX <= canvasRect.right &&
      e.clientY >= canvasRect.top && e.clientY <= canvasRect.bottom;

    if (!isOverCanvas) {
      setMagnifierPos(prev => ({ ...prev, show: false }));
      return;
    }

    const magnifierZoom = 2.5;
    const px = e.clientX - canvasRect.left;
    const py = e.clientY - canvasRect.top;
    const bgLeft = 75 - (px * magnifierZoom);
    const bgTop = 75 - (py * magnifierZoom);

    setMagnifierPos({
      x: containerX,
      y: containerY,
      bgLeft,
      bgTop,
      bgWidth: canvasRect.width * magnifierZoom,
      bgHeight: canvasRect.height * magnifierZoom,
      show: true,
    });
  };

  useEffect(() => {
    if (imageRef.current && landmarks) {
      draw(imageRef.current, landmarks, selectedColor);
    }
  }, [selectedColor]);

  const draw = (img: HTMLImageElement, keypoints: any[] | null, colorHex: string | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match image to prevent stretching
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (!colorHex || !keypoints) return;

    // Left eye contour indices
    const leftEyeContour = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    // Right eye contour indices
    const rightEyeContour = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

    const drawIris = (
      contour: number[],
      irisCenterIndex: number,
      irisRightIndex: number
    ) => {
      ctx.save();

      // Create clipping mask for the eye shape
      ctx.beginPath();
      contour.forEach((idx, i) => {
        const pt = keypoints[idx];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.clip();

      // Iris bounds
      const center = keypoints[irisCenterIndex];
      const rightEdge = keypoints[irisRightIndex];
      const radius = Math.hypot(rightEdge.x - center.x, rightEdge.y - center.y) * 1.05;

      // Inner glowing pattern attempt
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = 0.6;
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = 0.5;
      ctx.fill();

      // Inner shadow/depth
      const gradient = ctx.createRadialGradient(center.x, center.y, radius * 0.3, center.x, center.y, radius);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.restore();
    };

    // Left iris center: 468, left iris right edge: 469
    drawIris(leftEyeContour, 468, 469);
    // Right iris center: 473, right iris right edge: 474
    drawIris(rightEyeContour, 473, 474);

    setCanvasDataUrl(canvas.toDataURL("image/jpeg", 0.9));
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "optic-eye-color.jpg";
    link.click();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-black">
      {/* Canvas Area */}
      <div 
        className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/95 p-4"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {isAnalyzing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
            <p className="text-white text-lg font-medium tracking-wide animate-pulse">Detecting eyes...</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] ${isAnalyzing ? 'opacity-50 blur-sm' : 'opacity-100'}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center",
            cursor: zoom > 1 && !isMagnifierActive ? (isDragging ? "grabbing" : "grab") : (isMagnifierActive ? "crosshair" : "default"),
            transition: isDragging ? "none" : "transform 0.3s ease-out, opacity 0.5s",
          }}
        />

        {isMagnifierActive && magnifierPos.show && canvasDataUrl && (
          <div
            className="absolute pointer-events-none border-[3px] border-white/80 rounded-full shadow-[0_0_25px_rgba(0,0,0,0.8)] z-50 overflow-hidden bg-black"
            style={{
              left: magnifierPos.x - 75,
              top: magnifierPos.y - 75,
              width: 150,
              height: 150,
              backgroundImage: `url(${canvasDataUrl})`,
              backgroundPosition: `${magnifierPos.bgLeft}px ${magnifierPos.bgTop}px`,
              backgroundSize: `${magnifierPos.bgWidth}px ${magnifierPos.bgHeight}px`,
              backgroundRepeat: "no-repeat"
            }}
          >
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
            <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-white/20" />
          </div>
        )}
      </div>

      {/* Editor Controls */}
      <div className="bg-gray-950 border-t border-white/10 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold text-lg tracking-wide">Select Lens Color</h3>
            <div className="flex gap-3 items-center">
              <div className="flex gap-2 mr-2 bg-white/5 rounded-full px-2 py-1.5 border border-white/10 items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="w-8 h-8 p-0 rounded-full text-white hover:bg-white/20"
                  disabled={zoom <= 1}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="w-8 h-8 p-0 rounded-full text-white hover:bg-white/20"
                  disabled={zoom >= 4}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
                <Button
                  variant={isMagnifierActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsMagnifierActive(!isMagnifierActive)}
                  className={`w-8 h-8 p-0 rounded-full ${isMagnifierActive ? "bg-blue-600 border-none text-white hover:bg-blue-700" : "text-white hover:bg-white/20"}`}
                  title="Magnifier Tool"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onRetake}
                className="border-white/20 text-white hover:bg-white/10 rounded-full px-6"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={downloadImage}
                disabled={isAnalyzing}
                className="glass-button text-white border-none rounded-full px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105 transition-transform"
              >
                <Download className="w-4 h-4 mr-2" />
                Save Image
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 hide-scrollbar">
            <div className="flex gap-4 min-w-max px-2 mt-5">
              <button
                onClick={() => setSelectedColor(null)}
                className="flex flex-col items-center gap-2 group transition-all"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                    selectedColor === null
                      ? "border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      : "border-transparent bg-white/5 group-hover:bg-white/10"
                  }`}
                >
                  <span className="text-white/70 text-xs font-medium">Original</span>
                </div>
              </button>
              
              {LENS_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.hex)}
                  className="flex flex-col items-center gap-3 group transition-all"
                >
                  <div
                    className={`w-14 h-14 rounded-full border-2 transition-all duration-300 relative overflow-hidden ${
                      selectedColor === color.hex
                        ? "border-white scale-110 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        : "border-white/20 group-hover:scale-105 group-hover:border-white/50"
                    }`}
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${color.hex} 0%, #000 120%)`,
                      boxShadow: selectedColor === color.hex ? `0 0 20px ${color.hex}88` : 'none'
                    }}
                  >
                    <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      selectedColor === color.hex ? "text-white" : "text-white/50 group-hover:text-white/80"
                    }`}
                  >
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EyeColorEditor;
