interface SetupProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

export default function SetupProgress({ currentStep, totalSteps, stepLabel }: SetupProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-12">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="body-small font-medium text-foreground/40">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="body-small text-foreground/20">•</span>
          <span className="body-small text-foreground/60">{stepLabel}</span>
        </div>
        <span className="body-small font-medium text-action">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-1 bg-accent-beige/40 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-action rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

