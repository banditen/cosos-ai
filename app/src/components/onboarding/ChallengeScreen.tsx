'use client';

import { useState } from 'react';
import { Edit3, ArrowLeft } from 'lucide-react';

interface ChallengeScreenProps {
  goal?: string;
  onSubmit: (challenge: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

const challengeOptions: Record<string, string[]> = {
  'find-pmf': [
    'Not sure who our ideal customer is',
    'Low engagement with our product',
    'Struggling to get user feedback',
  ],
  'grow-revenue': [
    'Low conversion from free to paid',
    'High churn rate',
    'Pricing strategy unclear',
  ],
  'improve-retention': [
    'Users not coming back',
    'Low feature adoption',
    'Unclear value proposition',
  ],
  'ship-faster': [
    'Too many bugs and technical debt',
    'Slow development cycles',
    'Unclear priorities',
  ],
  'raise-funding': [
    'Metrics not investor-ready',
    'Unclear growth story',
    'Need better reporting',
  ],
  'reduce-chaos': [
    'Too many tools and dashboards',
    'No single source of truth',
    'Team alignment issues',
  ],
  'other': [],
};

export default function ChallengeScreen({ goal, onSubmit, onSkip, onBack }: ChallengeScreenProps) {
  const [challenge, setChallenge] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const options = goal ? challengeOptions[goal] || [] : [];

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setChallenge(option);
  };

  const handleCustomClick = () => {
    setShowCustomInput(true);
    setSelectedOption(null);
    setChallenge('');
  };

  const handleSubmit = () => {
    if (challenge.trim()) {
      onSubmit(challenge);
    } else {
      onSkip();
    }
  };

  return (
    <div className="space-y-12 animate-fade-in max-w-2xl mx-auto">
      {/* Question */}
      <div className="text-center">
        <h1 className="heading-1 text-foreground mb-4">
          What's your biggest challenge right now?
        </h1>
        <p className="body text-foreground/60">
          Optional — helps me give better recommendations
        </p>
      </div>

      {/* Options */}
      {options.length > 0 && !showCustomInput && (
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionSelect(option)}
              className={`w-full p-4 text-left bg-white border-2 rounded-xl transition-all ${
                selectedOption === option
                  ? 'border-action bg-action/5'
                  : 'border-accent-beige hover:border-action/50'
              }`}
            >
              <span className="body text-foreground">{option}</span>
            </button>
          ))}
          <button
            onClick={handleCustomClick}
            className="w-full p-4 text-left bg-white border-2 border-accent-beige rounded-xl hover:border-action/50 transition-all flex items-center gap-2"
          >
            <Edit3 className="w-5 h-5 text-foreground/60" />
            <span className="body text-foreground/60">Something else...</span>
          </button>
        </div>
      )}

      {/* Custom text area */}
      {(showCustomInput || options.length === 0) && (
        <div>
          <textarea
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            placeholder="e.g., We're struggling to convert free users to paid..."
            className="w-full h-40 p-6 bg-white border-2 border-accent-beige rounded-xl focus:border-action focus:outline-none resize-none body text-foreground placeholder:text-foreground/40"
            autoFocus
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onSkip}
          className="px-6 py-3 body text-foreground/60 hover:text-foreground transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-action text-white rounded-lg hover:bg-action/90 transition-colors body font-medium"
        >
          Continue
        </button>
      </div>

      {/* Back button */}
      <div className="flex justify-center pt-4">
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

