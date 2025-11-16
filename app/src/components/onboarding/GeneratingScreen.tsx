'use client';

import { useEffect, useState } from 'react';
import { Search, Grid3x3, Sparkles, Check, Loader2, LucideIcon } from 'lucide-react';

const steps: { label: string; icon: LucideIcon }[] = [
  { label: 'Analyzing your request', icon: Search },
  { label: 'Generating structure', icon: Grid3x3 },
  { label: 'Adding intelligence', icon: Sparkles },
];

export default function GeneratingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Animated icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-accent-beige rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-action border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="heading-2 text-foreground mb-2">
            Building your artifact...
          </h2>
          <p className="body text-foreground/60">
            This will take about 10 seconds
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3 max-w-md mx-auto">
          {steps.map((step, index) => {
            const IconComponent = index === currentStep ? Loader2 : step.icon;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-action/10 text-action'
                    : index < currentStep
                    ? 'text-foreground/40'
                    : 'text-foreground/20'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${index === currentStep ? 'animate-spin' : ''}`} />
                <span className="body-small font-medium">
                  {step.label}
                </span>
                {index < currentStep && (
                  <Check className="w-5 h-5 ml-auto" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

