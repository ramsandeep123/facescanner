import { FaceShape } from "@/lib/faceShapeData";
import { Check, X } from "lucide-react";

interface FaceShapeCardProps {
  shape: FaceShape;
  isSelected?: boolean;
  onClick?: () => void;
}

const FaceShapeCard = ({ shape, isSelected, onClick }: FaceShapeCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-500 group overflow-hidden ${
        isSelected
          ? "border-primary/50 bg-white/5 shadow-[0_0_30px_-5px_hsl(263_70%_50%_/_0.3)] scale-[1.02]"
          : "glass-card border-white/5 hover:border-white/20 hover:bg-white/5"
      }`}
    >
      {/* Selection Glow */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50 transition-opacity" />
      )}

      <div className="relative z-10 flex items-center gap-5 mb-5">
        <div
          className={`w-16 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
            isSelected ? "border-2 border-primary/50 shadow-lg shadow-primary/20" : "border border-white/10 bg-white/5 group-hover:border-white/30"
          }`}
          style={{
            borderRadius: shape.id === "round" ? "50%" :
                         shape.id === "square" ? "20%" :
                         shape.id === "oval" ? "50% / 60%" :
                         shape.id === "heart" ? "50% 50% 50% 50% / 40% 40% 60% 60%" :
                         shape.id === "oblong" ? "40% / 50%" :
                         "50% 10% / 35%"
          }}
        />
        <div>
          <h3 className={`text-2xl font-serif font-bold tracking-tight mb-1 ${isSelected ? "text-gradient" : "text-white group-hover:text-primary/90 transition-colors"}`}>
            {shape.name}
          </h3>
          <p className="text-sm text-slate-400 font-medium">
            Face Shape
          </p>
        </div>
        
        {isSelected && (
          <div className="ml-auto w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-fade-in">
            <Check className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      
      <p className="text-slate-300 leading-relaxed text-sm mb-6 relative z-10">
        {shape.description}
      </p>
      
      <div className="space-y-4 relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Best Frames
          </p>
          <div className="flex flex-wrap gap-2">
            {shape.recommendations.slice(0, 3).map((rec, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  isSelected
                    ? "bg-primary/20 border-primary/30 text-white"
                    : "bg-white/5 border-white/10 text-slate-300 group-hover:border-white/20"
                }`}
              >
                <Check className="w-3 h-3 text-primary" />
                {rec}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Avoid
          </p>
          <div className="flex flex-wrap gap-2">
            {shape.avoidStyles.slice(0, 2).map((avoid, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-slate-400"
              >
                <X className="w-3 h-3 text-slate-500" />
                {avoid}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceShapeCard;
