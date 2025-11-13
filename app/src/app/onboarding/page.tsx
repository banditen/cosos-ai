'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import Loading from '@/components/Loading';

export default function Onboarding() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessMission: '',
    businessStage: '',
    quarterlyGoals: '',
    currentChallenges: '',
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitContext = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const context = {
        business_mission: formData.businessMission,
        business_stage: formData.businessStage,
        quarterly_goals: formData.quarterlyGoals.split('\n').filter(g => g.trim()),
        current_challenges: formData.currentChallenges.split('\n').filter(c => c.trim()),
        tone_preference: 'professional',
      };

      await apiClient.onboarding.saveContext(user.id, context);
      setStep(2);
    } catch (error) {
      console.error('Error saving context:', error);
      alert('Failed to save context. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!user) return;

    try {
      const { url } = await apiClient.auth.getGoogleOAuthUrl(user.id);
      window.location.href = url;
    } catch (error) {
      console.error('Error getting OAuth URL:', error);
      alert('Failed to connect Google. Please try again.');
    }
  };

  const handleSkipToSync = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="body-small font-medium text-foreground">Step {step} of 2</span>
            <span className="body-small text-foreground/60">{step === 1 ? 'Business Context' : 'Connect Tools'}</span>
          </div>
          <div className="w-full bg-accent-beige rounded-full h-2">
            <div
              className="bg-action h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {step === 1 && (
          <div className="card">
            <h1 className="text-3xl font-bold mb-2">Welcome to Cosos! 👋</h1>
            <p className="text-gray-600 mb-8">
              Let's get to know your business so we can provide the best insights.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your mission? What are you building? *
                </label>
                <textarea
                  name="businessMission"
                  value={formData.businessMission}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="e.g., Building an AI Chief of Staff for founders to help them execute, prioritize, and plan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What stage is your business at? *
                </label>
                <select
                  name="businessStage"
                  value={formData.businessStage}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select...</option>
                  <option value="idea">Idea Stage</option>
                  <option value="mvp">Building MVP</option>
                  <option value="launched">Launched</option>
                  <option value="scaling">Scaling</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are your top 3 goals this quarter? (one per line)
                </label>
                <textarea
                  name="quarterlyGoals"
                  value={formData.quarterlyGoals}
                  onChange={handleInputChange}
                  rows={4}
                  className="input"
                  placeholder="e.g., Launch MVP by Nov 30&#10;Get 10 beta users&#10;Achieve 80% daily engagement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are your biggest challenges right now? (one per line)
                </label>
                <textarea
                  name="currentChallenges"
                  value={formData.currentChallenges}
                  onChange={handleInputChange}
                  rows={4}
                  className="input"
                  placeholder="e.g., Too many emails to process&#10;Hard to prioritize tasks&#10;Context switching between projects"
                />
              </div>

              <button
                onClick={handleSubmitContext}
                disabled={saving || !formData.businessMission || !formData.businessStage}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <h1 className="text-3xl font-bold mb-2">Connect Your Tools 🔗</h1>
            <p className="text-gray-600 mb-8">
              Connect Gmail and Calendar so Cosos can analyze your communications and schedule.
            </p>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">📧</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Gmail & Google Calendar</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      We'll analyze your emails and calendar events to provide personalized insights.
                      Your data is encrypted and never shared.
                    </p>
                    <button onClick={handleConnectGoogle} className="btn-primary">
                      Connect Google Account
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleSkipToSync}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

