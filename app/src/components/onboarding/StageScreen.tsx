'use client';

import { Lightbulb, Rocket, Sprout, TrendingUp, Building2, ArrowLeft, LucideIcon } from 'lucide-react';

interface StageScreenProps {
  onSelect: (stage: string) => void;
  onBack: () => void;
}

const stages: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'pre-launch', label: 'Pre-launch', icon: Lightbulb },
  { id: 'early-revenue', label: 'Early revenue', icon: Rocket },
  { id: 'seed', label: 'Seed', icon: Sprout },
  { id: 'series-a', label: 'Series A', icon: TrendingUp },
  { id: 'series-b-plus', label: 'Series B+', icon: Building2 },
];

export default function StageScreen({ onSelect, onBack }: StageScreenProps) {
  return (
    <div className="space-y-12 animate-fade-in">
      {/* Question */}
      <div className="text-center">
        <h1 className="heading-1 text-foreground">
          What stage are you at?
        </h1>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {stages.map((stage) => {
          const IconComponent = stage.icon;
          return (
            <button
              key={stage.id}
              onClick={() => onSelect(stage.id)}
              className="group p-6 bg-white border-2 border-accent-beige rounded-xl hover:border-action hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-3"
            >
              <IconComponent className="w-8 h-8 text-foreground/60 group-hover:text-action transition-colors" />
              <span className="body font-medium text-foreground">
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Back button */}
      <div className="flex justify-center pt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 body-small text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
}

