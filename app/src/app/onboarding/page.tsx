'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import Loading from '@/components/Loading';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import StageScreen from '@/components/onboarding/StageScreen';
import GoalScreen from '@/components/onboarding/GoalScreen';
import ChallengeScreen from '@/components/onboarding/ChallengeScreen';
import PromptScreen from '@/components/onboarding/PromptScreen';
import GeneratingScreen from '@/components/onboarding/GeneratingScreen';
import ResultScreen from '@/components/onboarding/ResultScreen';

type OnboardingStep = 'welcome' | 'stage' | 'goal' | 'challenge' | 'prompt' | 'generating' | 'result';

interface UserContext {
  stage: string;
  goal: string;
  challenge?: string;
}

export default function OnboardingNew() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<OnboardingStep>('welcome');
  
  // Context data
  const [context, setContext] = useState<UserContext>({
    stage: '',
    goal: '',
    challenge: ''
  });
  
  // Prompt data
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [artifact, setArtifact] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleStageSelect = (stage: string) => {
    setContext({ ...context, stage });
    setStep('goal');
  };

  const handleGoalSelect = (goal: string) => {
    setContext({ ...context, goal });
    setStep('challenge');
  };

  const handleChallengeSubmit = (challenge: string) => {
    setContext({ ...context, challenge });
    setStep('prompt');
  };

  const handleSkipChallenge = () => {
    setStep('prompt');
  };

  const handlePromptSubmit = async () => {
    if (!prompt.trim() || !user) return;

    setGenerating(true);
    setStep('generating');

    try {
      console.log('Generating artifact with:', { userId: user.id, prompt, context });
      const response = await apiClient.artifacts.generate(user.id, prompt, context);

      console.log('Artifact generated:', response);
      setArtifact(response.artifact);
      setStep('result');
    } catch (error: any) {
      console.error('Error generating artifact:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);

      let errorMessage = 'Unknown error';
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail);
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Failed to generate artifact: ${errorMessage}`);
      setStep('prompt');
    } finally {
      setGenerating(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Welcome Screen */}
        {step === 'welcome' && (
          <WelcomeScreen onContinue={() => setStep('stage')} />
        )}

        {/* Stage Selection */}
        {step === 'stage' && (
          <StageScreen 
            onSelect={handleStageSelect}
            onBack={() => setStep('welcome')}
          />
        )}

        {/* Goal Selection */}
        {step === 'goal' && (
          <GoalScreen 
            onSelect={handleGoalSelect}
            onBack={() => setStep('stage')}
          />
        )}

        {/* Challenge Input */}
        {step === 'challenge' && (
          <ChallengeScreen
            goal={context.goal}
            onSubmit={handleChallengeSubmit}
            onSkip={handleSkipChallenge}
            onBack={() => setStep('goal')}
          />
        )}

        {/* Prompt Input */}
        {step === 'prompt' && (
          <PromptScreen 
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handlePromptSubmit}
            onBack={() => setStep('challenge')}
          />
        )}

        {/* Generating */}
        {step === 'generating' && (
          <GeneratingScreen />
        )}

        {/* Result */}
        {step === 'result' && artifact && (
          <ResultScreen 
            artifact={artifact}
            onGoToDashboard={handleGoToDashboard}
          />
        )}
      </div>
    </div>
  );
}

