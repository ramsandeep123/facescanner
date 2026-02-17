import { Upload, Scan, Glasses } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Photo",
    description: "Take a front-facing photo or upload an existing one. Ensure good lighting and a neutral expression."
  },
  {
    icon: Scan,
    title: "AI Analysis",
    description: "Our intelligent system analyzes your facial features to determine your unique face shape."
  },
  {
    icon: Glasses,
    title: "Get Recommendations",
    description: "Receive personalized frame suggestions tailored to complement and enhance your features."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">
            Three simple steps to finding your perfect frames
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative p-8 rounded-2xl glass-card border-white/5 hover:bg-white/10 group"
            >
              <div className="absolute -top-6 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20 rotate-3 group-hover:rotate-6 transition-transform">
                {index + 1}
              </div>
              
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-white/10">
                <step.icon className="w-8 h-8 text-purple-400" />
              </div>
              
              <h3 className="text-2xl font-serif font-semibold text-white mb-4">
                {step.title}
              </h3>
              
              <p className="text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
