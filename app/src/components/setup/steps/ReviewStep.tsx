'use client';

import { useState } from 'react';
import { Sparkles, Target, FolderKanban, BarChart3 } from 'lucide-react';

interface ReviewStepProps {
  setupData: {
    businessDescription: string;
    successDefinition: string;
    biggestChallenge: string;
    projects: any[];
    metrics: any[];
  };
  onBack: () => void;
  onComplete: () => void;
}

export default function ReviewStep({ setupData, onBack, onComplete }: ReviewStepProps) {
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    setIsActivating(true);
    
    // TODO: Save setup data to backend
    // await apiClient.setup.complete(setupData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onComplete();
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-lavender/30 to-action/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-action" />
        </div>
        <h1 className="heading-2 mb-3">Your Command Center is Ready</h1>
        <p className="body text-foreground/60 max-w-xl mx-auto">
          Review your setup and activate Cosos to start getting daily insights.
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-6 mb-12">
        {/* Business Context */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-lavender/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-action" />
            </div>
            <h3 className="font-heading text-lg font-medium text-foreground">
              Business Context
            </h3>
          </div>
          <div className="space-y-3 pl-13">
            <div>
              <p className="body-small text-foreground/60 mb-1">What you're building:</p>
              <p className="body text-foreground">{setupData.businessDescription}</p>
            </div>
            <div>
              <p className="body-small text-foreground/60 mb-1">Success in 6 months:</p>
              <p className="body text-foreground">{setupData.successDefinition}</p>
            </div>
            {setupData.biggestChallenge && (
              <div>
                <p className="body-small text-foreground/60 mb-1">Biggest challenge:</p>
                <p className="body text-foreground">{setupData.biggestChallenge}</p>
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-lavender/20 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-action" />
              </div>
              <h3 className="font-heading text-lg font-medium text-foreground">
                Your Projects ({setupData.projects.length})
              </h3>
            </div>
            <button onClick={onBack} className="body-small text-action hover:underline">
              Edit
            </button>
          </div>
          <div className="space-y-3 pl-13">
            {setupData.projects.map((project, index) => (
              <div key={project.id} className="pb-3 border-b border-accent-beige last:border-0 last:pb-0">
                <p className="font-medium text-foreground mb-1">{project.name}</p>
                <p className="body-small text-foreground/60">{project.goal}</p>
                {project.deadline && (
                  <p className="body-small text-foreground/40 mt-1">
                    Target: {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-lavender/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-action" />
              </div>
              <h3 className="font-heading text-lg font-medium text-foreground">
                Your Metrics ({setupData.metrics.length})
              </h3>
            </div>
            <button onClick={onBack} className="body-small text-action hover:underline">
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-13">
            {setupData.metrics.map((metric) => (
              <div key={metric.id} className="p-3 rounded-xl bg-accent-beige/20">
                <p className="font-medium text-foreground mb-1">{metric.name}</p>
                <p className="body-small text-foreground/60">
                  {metric.currentValue} → {metric.targetValue} {metric.unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-accent-lavender/10 to-accent-beige/10 border border-accent-lavender/20">
        <h3 className="font-heading font-medium text-foreground mb-4">What happens next:</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-action/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-action">1</span>
            </div>
            <p className="body-small text-foreground/80">
              We'll analyze your existing data from Gmail, Calendar, and Linear
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-action/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-action">2</span>
            </div>
            <p className="body-small text-foreground/80">
              You'll get your first insight in about 30 seconds
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-action/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-action">3</span>
            </div>
            <p className="body-small text-foreground/80">
              Starting tomorrow at 7am, you'll receive daily insights about your projects and metrics
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={handleActivate}
          disabled={isActivating}
          className="btn-primary px-12 py-4 text-lg disabled:opacity-60 disabled:cursor-not-allowed group relative overflow-hidden"
        >
          {isActivating ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Activating Cosos...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Activate Cosos
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

