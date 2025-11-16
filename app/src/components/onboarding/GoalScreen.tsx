'use client';

import { Compass, TrendingUp, Users, Rocket, Wallet, CheckCircle2, MoreHorizontal, ArrowLeft, LucideIcon } from 'lucide-react';

interface GoalScreenProps {
  onSelect: (goal: string) => void;
  onBack: () => void;
}

const goals: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'find-pmf', label: 'Find product-market fit', icon: Compass },
  { id: 'grow-revenue', label: 'Grow revenue', icon: TrendingUp },
  { id: 'improve-retention', label: 'Improve retention', icon: Users },
  { id: 'ship-faster', label: 'Ship faster', icon: Rocket },
  { id: 'raise-funding', label: 'Raise funding', icon: Wallet },
  { id: 'reduce-chaos', label: 'Reduce chaos', icon: CheckCircle2 },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
];

export default function GoalScreen({ onSelect, onBack }: GoalScreenProps) {
  return (
    <div className="space-y-12 animate-fade-in">
      {/* Question */}
      <div className="text-center">
        <h1 className="heading-1 text-foreground">
          What's your primary goal right now?
        </h1>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {goals.map((goal) => {
          const IconComponent = goal.icon;
          return (
            <button
              key={goal.id}
              onClick={() => onSelect(goal.id)}
              className="group p-6 bg-white border-2 border-accent-beige rounded-xl hover:border-action hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-3"
            >
              <IconComponent className="w-8 h-8 text-foreground/60 group-hover:text-action transition-colors" />
              <span className="body font-medium text-foreground text-center">
                {goal.label}
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

