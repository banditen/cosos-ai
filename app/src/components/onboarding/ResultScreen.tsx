'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import ArtifactRenderer from '@/components/artifacts/ArtifactRenderer';
import { Artifact } from '@/types/artifact';

interface ResultScreenProps {
  artifact: Artifact;
  onGoToDashboard: () => void;
}

export default function ResultScreen({ artifact, onGoToDashboard }: ResultScreenProps) {
  const [artifactData, setArtifactData] = useState(artifact);

  const handleDataUpdate = (artifactId: string, updatedData: Record<string, any>) => {
    // Update local state
    setArtifactData({
      ...artifactData,
      content: {
        ...artifactData.content,
        data: updatedData
      }
    });
  };

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
            {artifactData.title}
          </h1>
          <p className="body text-foreground/60">
            {artifactData.description || "Here's what I created for you"}
          </p>
        </div>
      </div>

      {/* Artifact preview */}
      <div className="max-w-6xl mx-auto">
        <ArtifactRenderer
          artifact={artifactData}
          onDataUpdate={handleDataUpdate}
        />
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
          Your artifact has been saved and is ready to use
        </p>
      </div>
    </div>
  );
}

