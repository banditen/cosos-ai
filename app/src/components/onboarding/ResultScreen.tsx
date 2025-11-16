'use client';

import { Check } from 'lucide-react';
import ArtifactDisplay from '@/components/artifacts/ArtifactDisplay';

interface ResultScreenProps {
  artifact: any;
  onGoToDashboard: () => void;
}

export default function ResultScreen({ artifact, onGoToDashboard }: ResultScreenProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Success header */}
      <div className="text-center space-y-4 pb-8 border-b border-accent-beige">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div>
          <h1 className="heading-1 text-foreground mb-2">
            Your artifact is ready!
          </h1>
          <p className="body text-foreground/60">
            Here's what I created for you
          </p>
        </div>
      </div>

      {/* Artifact display */}
      <div className="max-w-4xl mx-auto">
        <ArtifactDisplay artifact={artifact} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 pt-8">
        <button
          onClick={onGoToDashboard}
          className="px-8 py-4 bg-action text-white rounded-lg hover:bg-action/90 transition-colors body font-medium"
        >
          Go to Dashboard
        </button>
      </div>

      {/* Next steps hint */}
      <div className="text-center pt-4">
        <p className="body-small text-foreground/50">
          You can create more artifacts anytime from your dashboard
        </p>
      </div>
    </div>
  );
}

