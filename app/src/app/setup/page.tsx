'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import Loading from '@/components/Loading';
import SetupProgress from '@/components/setup/SetupProgress';
import WelcomeStep from '@/components/setup/steps/WelcomeStep';
import ContextStep from '@/components/setup/steps/ContextStep';
import ProjectsStep from '@/components/setup/steps/ProjectsStep';
import MetricsStep from '@/components/setup/steps/MetricsStep';
import ReviewStep from '@/components/setup/steps/ReviewStep';

export default function Setup() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    businessDescription: '',
    successDefinition: '',
    biggestChallenge: '',
    projects: [] as any[],
    metrics: [] as any[],
  });

  const totalSteps = 5;
  const stepLabels = [
    'Welcome',
    'Business Context',
    'Key Projects',
    'Success Metrics',
    'Review & Launch',
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateSetupData = (data: Partial<typeof setupData>) => {
    setSetupData({ ...setupData, ...data });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-accent-lavender/5 via-transparent to-accent-beige/5 pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Progress indicator */}
        {currentStep > 1 && (
          <SetupProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepLabel={stepLabels[currentStep - 1]}
          />
        )}

        {/* Step content with fade transition */}
        <div className="animate-fadeIn">
          {currentStep === 1 && (
            <WelcomeStep onContinue={handleNext} />
          )}

          {currentStep === 2 && (
            <ContextStep
              data={{
                businessDescription: setupData.businessDescription,
                successDefinition: setupData.successDefinition,
                biggestChallenge: setupData.biggestChallenge,
              }}
              onUpdate={(data) => updateSetupData(data)}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <ProjectsStep
              projects={setupData.projects}
              onUpdate={(projects) => updateSetupData({ projects })}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <MetricsStep
              metrics={setupData.metrics}
              onUpdate={(metrics) => updateSetupData({ metrics })}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 5 && (
            <ReviewStep
              setupData={setupData}
              onBack={handleBack}
              onComplete={async () => {
                if (!user) return;

                try {
                  // Transform data to match API format
                  const apiData = {
                    business_description: setupData.businessDescription,
                    success_definition: setupData.successDefinition,
                    biggest_challenge: setupData.biggestChallenge,
                    projects: setupData.projects.map(p => ({
                      name: p.name,
                      description: p.description,
                      goal: p.goal
                    })),
                    metrics: setupData.metrics.map(m => ({
                      name: m.name,
                      current_value: m.currentValue,
                      target_value: m.targetValue,
                      unit: m.unit,
                      source: m.source
                    }))
                  };

                  await apiClient.setup.complete(user.id, apiData);
                  router.push('/dashboard');
                } catch (error) {
                  console.error('Error completing setup:', error);
                  alert('Failed to save setup data. Please try again.');
                }
              }}
            />
          )}
        </div>

        {/* Back button for steps 2-5 */}
        {currentStep > 1 && currentStep < 5 && (
          <button
            onClick={handleBack}
            className="mt-8 flex items-center gap-2 body-small text-foreground/60 hover:text-foreground transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
      </div>
    </div>
  );
}

