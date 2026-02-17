import { FaceAnalysisResult } from "@/lib/faceAnalysis";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface ConfidenceDisplayProps {
  confidenceFactors?: FaceAnalysisResult["confidenceFactors"];
  overallConfidence: number;
}

const ConfidenceDisplay = ({ confidenceFactors, overallConfidence }: ConfidenceDisplayProps) => {
  if (!confidenceFactors) return null;

  const getConfidenceColor = (value: number) => {
    if (value >= 0.8) return "text-green-600";
    if (value >= 0.6) return "text-yellow-600";
    return "text-orange-600";
  };

  const getConfidenceIcon = (value: number) => {
    if (value >= 0.8) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (value >= 0.6) return <Info className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-orange-600" />;
  };

  const getConfidenceLabel = (value: number) => {
    if (value >= 0.8) return "Excellent";
    if (value >= 0.6) return "Good";
    return "Fair";
  };

  const factors = [
    {
      label: "Measurement Quality",
      value: confidenceFactors.measurementQuality,
      description: "Accuracy of facial measurements",
    },
    {
      label: "Facial Symmetry",
      value: confidenceFactors.symmetry,
      description: "Balance between left and right sides",
    },
    {
      label: "Landmark Stability",
      value: confidenceFactors.landmarkStability,
      description: "Consistency of detected landmarks",
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-background shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-serif font-semibold text-foreground">
          Detection Confidence
        </h4>
        <Badge variant="secondary" className="gap-1.5">
          {getConfidenceIcon(confidenceFactors.overallConfidence)}
          {getConfidenceLabel(confidenceFactors.overallConfidence)}
        </Badge>
      </div>

      <div className="space-y-3">
        {factors.map((factor) => (
          <div key={factor.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{factor.label}</span>
              <span className={`font-medium ${getConfidenceColor(factor.value)}`}>
                {Math.round(factor.value * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  factor.value >= 0.8
                    ? "bg-green-600"
                    : factor.value >= 0.6
                    ? "bg-yellow-600"
                    : "bg-orange-600"
                }`}
                style={{ width: `${factor.value * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{factor.description}</p>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Overall Confidence</span>
          <span className={`text-lg font-bold ${getConfidenceColor(confidenceFactors.overallConfidence)}`}>
            {Math.round(confidenceFactors.overallConfidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceDisplay;
