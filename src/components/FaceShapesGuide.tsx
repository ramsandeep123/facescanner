import { faceShapes } from "@/lib/faceShapeData";
import FaceShapeCard from "./FaceShapeCard";

const FaceShapesGuide = () => {
  return (
    <section id="face-shapes" className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Face Shape <span className="text-gradient">Guide</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">
            Understanding your face shape is key to finding frames that flatter your features
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {faceShapes.map((shape) => (
            <FaceShapeCard key={shape.id} shape={shape} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaceShapesGuide;
