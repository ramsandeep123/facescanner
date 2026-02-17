import { Button } from "@/components/ui/button";
import { ArrowDown, Sparkles } from "lucide-react";

const HeroSection = () => {
  const scrollToAnalyze = () => {
    document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] -z-10 animate-pulse delay-700" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-white mb-8 animate-fade-in hover:scale-105 transition-transform cursor-default">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium tracking-wide">AI-Powered Face Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-8 animate-fade-in-up text-balance leading-tight tracking-tight">
            Find Your Perfect <br />
            <span className="text-gradient">Frame Match</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto animate-fade-in-up opacity-0 delay-200 text-balance font-light leading-relaxed">
            Discover the ideal glasses for your unique face shape. Our intelligent analysis 
            provides personalized recommendations to help you look and feel your best.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up opacity-0 delay-300">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <button 
                onClick={scrollToAnalyze}
                className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 border border-white/20 shadow-xl"
              >
                <Sparkles className="w-5 h-5 text-white" />
                Analyze Face Shape
              </button>
            </div>
            <button 
              onClick={() => document.getElementById("face-shapes")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-4 glass text-white rounded-full font-medium text-lg hover:bg-white/10 transition-colors"
            >
              Learn About Shapes
            </button>
          </div>
          
          <div className="mt-24 animate-bounce opacity-50">
            <ArrowDown className="w-6 h-6 text-white mx-auto" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
