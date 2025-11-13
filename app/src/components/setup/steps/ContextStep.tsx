'use client';

import { useState } from 'react';
import { Building2, Target, MessageCircle, Sparkles, TrendingUp, Clock, Users, DollarSign, Rocket } from 'lucide-react';
import apiClient from '@/lib/api';

interface ContextStepProps {
  data: {
    businessDescription: string;
    successDefinition: string;
    biggestChallenge: string;
  };
  onUpdate: (data: Partial<ContextStepProps['data']>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function ContextStep({ data, onUpdate, onContinue, onBack }: ContextStepProps) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const isValid = data.businessDescription.trim().length > 0 && data.successDefinition.trim().length > 0;

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError('');

    try {
      const result = await apiClient.analysis.analyzeWebsite(websiteUrl);
      if (result.success) {
        onUpdate({ businessDescription: result.description });
      }
    } catch (error: any) {
      console.error('Error analyzing website:', error);
      setAnalysisError(error.response?.data?.detail || 'Failed to analyze website. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="heading-2 mb-2">Tell us about your business</h1>
        <p className="body text-foreground/60">
          This helps Cosos understand what matters most to you.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Question 1 */}
        <div className="card hover:border-action/20 transition-all duration-300 focus-within:border-action/40">
          <label className="block mb-2">
            <span className="font-heading text-base font-medium text-foreground mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-action" />
              What are you building?
            </span>
            <span className="body-small text-foreground/60">
              Enter your website URL for AI analysis, or write it yourself.
            </span>
          </label>

          {/* Website URL input */}
          <div className="mb-3 flex gap-2">
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="input flex-1"
              disabled={isAnalyzing}
            />
            <button
              onClick={handleAnalyzeWebsite}
              disabled={!websiteUrl.trim() || isAnalyzing}
              className="btn-secondary whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              title="Analyze website with AI"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze
                </span>
              )}
            </button>
          </div>

          {analysisError && (
            <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200">
              <p className="body-small text-red-600">{analysisError}</p>
            </div>
          )}

          <textarea
            value={data.businessDescription}
            onChange={(e) => onUpdate({ businessDescription: e.target.value })}
            rows={3}
            className="input resize-none"
            placeholder="We're building an AI-powered analytics platform..."
          />
          <div className="mt-1.5 flex justify-end">
            <span className={`body-small ${data.businessDescription.length > 50 ? 'text-action' : 'text-foreground/40'}`}>
              {data.businessDescription.length} chars
            </span>
          </div>
        </div>

        {/* Question 2 */}
        <div className="card hover:border-action/20 transition-all duration-300 focus-within:border-action/40">
          <label className="block mb-2">
            <span className="font-heading text-base font-medium text-foreground mb-1 flex items-center gap-2">
              <Target className="w-4 h-4 text-action" />
              What does success look like in 6 months?
            </span>
            <span className="body-small text-foreground/60">
              Paint a picture of where you want to be.
            </span>
          </label>
          <textarea
            value={data.successDefinition}
            onChange={(e) => onUpdate({ successDefinition: e.target.value })}
            rows={3}
            className="input resize-none"
            placeholder="100 paying customers, $50k MRR, proven product-market fit..."
          />
        </div>

        {/* Question 3 - Optional */}
        <div className="card hover:border-action/20 transition-all duration-300">
          <label className="block mb-2">
            <span className="font-heading text-base font-medium text-foreground mb-1 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-action" />
              Biggest challenge? <span className="text-foreground/40 font-normal text-xs">(optional)</span>
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'Finding product-market fit', icon: Target },
              { value: 'Growing revenue/MRR', icon: TrendingUp },
              { value: 'Managing time and priorities', icon: Clock },
              { value: 'Building the right team', icon: Users },
              { value: 'Raising capital', icon: DollarSign },
              { value: 'Scaling operations', icon: Rocket },
            ].map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => onUpdate({ biggestChallenge: option.value })}
                  className={`p-2.5 rounded-lg text-left transition-all duration-200 ${
                    data.biggestChallenge === option.value
                      ? 'bg-action/10 border-2 border-action text-foreground'
                      : 'bg-white border border-accent-beige hover:border-action/40 hover:bg-accent-lavender/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-action" />
                    <span className="body-small font-medium">{option.value}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={onContinue}
          disabled={!isValid}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <span className="flex items-center gap-1.5">
            Continue
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>

      {/* Helper text */}
      {!isValid && (
        <p className="mt-4 text-center body-small text-foreground/40">
          Please answer the first two questions to continue
        </p>
      )}
    </div>
  );
}

