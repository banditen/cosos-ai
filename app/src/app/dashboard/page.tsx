'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import DebugPanel from '@/components/DebugPanel';
import type { DailyBrief } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Check if user has completed onboarding
      try {
        await apiClient.onboarding.getContext(user.id);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // No user context, redirect to onboarding
          router.push('/onboarding');
          return;
        }
      }

      setUser(user);
      await loadBrief(user.id);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadBrief = async (userId: string) => {
    try {
      const data = await apiClient.briefs.get(userId);
      setBrief(data);
    } catch (error) {
      console.error('Error loading brief:', error);
      // Brief might not exist yet
    }
  };

  const handleGenerateBrief = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const data = await apiClient.briefs.generate(user.id);
      setBrief(data);
    } catch (error) {
      console.error('Error generating brief:', error);
      alert('Failed to generate brief. Please make sure you have synced your Gmail and Calendar.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSyncAll = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      // First, check if user has connected Gmail/Calendar
      // If not, redirect to OAuth
      try {
        await apiClient.sync.syncAll(user.id);
        alert('Successfully synced Gmail and Calendar!');
      } catch (syncError: any) {
        // If sync fails, likely need to connect first
        if (syncError.response?.status === 404 || syncError.response?.status === 500) {
          // Get OAuth URL and redirect
          const { url } = await apiClient.auth.getGoogleOAuthUrl(user.id);
          window.open(url, '_blank');
          alert('Please connect your Google account in the new tab, then try syncing again.');
        } else {
          throw syncError;
        }
      }
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Failed to sync. Please try again or check the console for details.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="btn-secondary disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : '🔄 Sync Data'}
            </button>
            <button
              onClick={handleGenerateBrief}
              disabled={generating}
              className="btn-primary disabled:opacity-50"
            >
              {generating ? 'Generating...' : '✨ Generate Brief'}
            </button>
          </div>
        </div>

        {!brief ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">No Brief Yet</h2>
            <p className="text-gray-600 mb-6">
              Generate your first daily brief to get started!
            </p>
            <button onClick={handleGenerateBrief} className="btn-primary">
              Generate Today's Brief
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            {brief.summary && (
              <div className="card">
                <h2 className="text-xl font-bold mb-3">📝 Summary</h2>
                <p className="text-gray-700">{brief.summary}</p>
              </div>
            )}

            {/* Priorities */}
            {brief.priorities && brief.priorities.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">🎯 Top Priorities</h2>
                <div className="space-y-4">
                  {brief.priorities.map((priority, index) => (
                    <div
                      key={index}
                      className="border-l-4 pl-4 py-2"
                      style={{
                        borderColor:
                          priority.urgency === 'high'
                            ? '#ef4444'
                            : priority.urgency === 'medium'
                            ? '#f59e0b'
                            : '#10b981',
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900">{priority.title}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            priority.urgency === 'high'
                              ? 'bg-red-100 text-red-800'
                              : priority.urgency === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {priority.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{priority.description}</p>
                      {priority.estimated_time && (
                        <p className="text-xs text-gray-500 mt-1">⏱️ {priority.estimated_time}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Blocks */}
            {brief.time_blocks && brief.time_blocks.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">📅 Time Blocks</h2>
                <div className="space-y-3">
                  {brief.time_blocks.map((block, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-gray-700">
                          {block.start_time} - {block.end_time}
                        </div>
                      </div>
                      <div className="font-medium text-gray-900 mb-1">{block.purpose}</div>
                      <div className="text-sm text-gray-600">{block.reasoning}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Wins */}
              {brief.quick_wins && brief.quick_wins.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-bold mb-4">⚡ Quick Wins</h2>
                  <div className="space-y-3">
                    {brief.quick_wins.map((win, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <input type="checkbox" className="mt-1" />
                        <div className="flex-1">
                          <p className="text-gray-900">{win.task}</p>
                          <p className="text-xs text-gray-500">
                            ⏱️ {win.estimated_time} • Impact: {win.impact}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flags */}
              {brief.flags && brief.flags.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-bold mb-4">🚩 Flags</h2>
                  <div className="space-y-3">
                    {brief.flags.map((flag, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          flag.type === 'warning'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : flag.type === 'blocker'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-green-50 border border-green-200'
                        }`}
                      >
                        <h3 className="font-semibold text-sm text-gray-900">{flag.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{flag.description}</p>
                        {flag.action && (
                          <p className="text-xs text-gray-700 mt-2 font-medium">→ {flag.action}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  );
}

