'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import SetupWelcome from '@/components/setup/steps/SetupWelcome';
import SetupIntegrations from '@/components/setup/steps/SetupIntegrations';
import SetupContext from '@/components/setup/steps/SetupContext';
import SetupAnalysis from '@/components/setup/steps/SetupAnalysis';

type SetupStep = 'welcome' | 'integrations' | 'context' | 'analysis';

interface SetupData {
  role: string;
  priority: string;
  companyName: string;
  connectedIntegrations: string[];
}

export default function Setup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<SetupStep>('welcome');
  const [setupData, setSetupData] = useState<SetupData>({
    role: '',
    priority: '',
    companyName: '',
    connectedIntegrations: [],
  });

  // Check for OAuth callback success/error
  useEffect(() => {
    const oauthSuccess = searchParams.get('oauth_success');
    const oauthError = searchParams.get('oauth_error');
    const provider = searchParams.get('provider');

    if (oauthSuccess === 'true' && provider) {
      // Show success toast
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      toast.success(`${providerName} connected successfully!`);

      // Update connected integrations
      setSetupData(prev => ({
        ...prev,
        connectedIntegrations: [...new Set([...prev.connectedIntegrations, provider])]
      }));

      // Return to integrations step
      setStep('integrations');

      // Clean up URL params
      window.history.replaceState({}, '', '/setup');

      // Reload integrations from database
      if (user) {
        loadIntegrations(user.id);
      }
    }

    if (oauthError) {
      toast.error(`Connection failed: ${decodeURIComponent(oauthError)}`);
      setStep('integrations');
      window.history.replaceState({}, '', '/setup');
    }
  }, [searchParams, user]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Load existing integrations
      await loadIntegrations(user.id);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadIntegrations = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('integrations')
        .select('provider')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (data && data.length > 0) {
        setSetupData(prev => ({
          ...prev,
          connectedIntegrations: data.map(i => i.provider)
        }));
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  };

  const handleIntegrationConnect = (provider: string) => {
    setSetupData(prev => ({
      ...prev,
      connectedIntegrations: [...new Set([...prev.connectedIntegrations, provider])]
    }));
  };

  const handleContextSubmit = async (role: string, priority: string, companyName: string) => {
    setSetupData(prev => ({ ...prev, role, priority, companyName }));

    // Save to user_context
    if (user) {
      try {
        await supabase.from('user_context').upsert({
          user_id: user.id,
          company_stage: role,
          business_mission: priority,
          company_industry: companyName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch (error) {
        console.error('Error saving context:', error);
      }
    }

    setStep('analysis');
  };

  const handleComplete = () => {
    router.push('/home');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-accent-lavender/5 via-transparent to-accent-beige/5 pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-6 py-12">
        {step === 'welcome' && (
          <SetupWelcome
            userName={user?.user_metadata?.full_name?.split(' ')[0] || 'there'}
            onContinue={() => setStep('integrations')}
          />
        )}

        {step === 'integrations' && (
          <SetupIntegrations
            userId={user?.id}
            connectedIntegrations={setupData.connectedIntegrations}
            onConnect={handleIntegrationConnect}
            onContinue={() => setStep('context')}
            onBack={() => setStep('welcome')}
          />
        )}

        {step === 'context' && (
          <SetupContext
            onSubmit={handleContextSubmit}
            onBack={() => setStep('integrations')}
          />
        )}

        {step === 'analysis' && (
          <SetupAnalysis
            userId={user?.id}
            connectedIntegrations={setupData.connectedIntegrations}
            priority={setupData.priority}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}

