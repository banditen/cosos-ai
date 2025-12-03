'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, CheckCircle2, ArrowRight, Calendar, Mail, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SetupAnalysisProps {
  userId: string;
  connectedIntegrations: string[];
  priority: string;
  onComplete: () => void;
}

interface AnalysisResult {
  priorities: string[];
  insight: string;
  synced: {
    emails?: number;
    events?: number;
    issues?: number;
  };
}

export default function SetupAnalysis({
  userId,
  connectedIntegrations,
  priority,
  onComplete,
}: SetupAnalysisProps) {
  const [status, setStatus] = useState<'syncing' | 'analyzing' | 'done' | 'error'>('syncing');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    try {
      setStatus('syncing');
      
      // Sync connected integrations
      const syncResults: AnalysisResult['synced'] = {};
      
      if (connectedIntegrations.includes('gmail')) {
        try {
          const res = await fetch(`${API_URL}/api/v1/sync/gmail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, days_back: 3, max_results: 50 }),
          });
          if (res.ok) {
            const data = await res.json();
            syncResults.emails = data.emails_synced || 0;
          }
        } catch (e) { console.error('Gmail sync error:', e); }
        
        try {
          const res = await fetch(`${API_URL}/api/v1/sync/calendar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, days_back: 7, days_forward: 7 }),
          });
          if (res.ok) {
            const data = await res.json();
            syncResults.events = data.events_synced || 0;
          }
        } catch (e) { console.error('Calendar sync error:', e); }
      }

      if (connectedIntegrations.includes('linear')) {
        try {
          const res = await fetch(`${API_URL}/api/v1/linear/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
          });
          if (res.ok) {
            const data = await res.json();
            syncResults.issues = data.issues_synced || 0;
          }
        } catch (e) { console.error('Linear sync error:', e); }
      }

      setStatus('analyzing');
      
      // Generate quick insights based on synced data and priority
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI analysis
      
      // Mock analysis result - in production this would call an AI endpoint
      const analysisResult: AnalysisResult = {
        priorities: [
          `Focus on: ${priority}`,
          syncResults.events ? `${syncResults.events} meetings this week` : 'Review your calendar',
          syncResults.emails ? `${syncResults.emails} emails to process` : 'Inbox ready',
        ].filter(Boolean),
        insight: generateInsight(priority, syncResults),
        synced: syncResults,
      };

      setResult(analysisResult);
      setStatus('done');
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Something went wrong. You can still continue to the dashboard.');
      setStatus('error');
    }
  };

  const generateInsight = (priority: string, synced: AnalysisResult['synced']): string => {
    if (synced.events && synced.events > 10) {
      return `You have a busy week ahead with ${synced.events} meetings. Consider blocking focus time for "${priority}".`;
    }
    if (synced.emails && synced.emails > 30) {
      return `${synced.emails} emails synced. Cosos will help prioritize what matters for "${priority}".`;
    }
    return `Your tools are connected! Cosos is ready to help you with "${priority}".`;
  };

  return (
    <div className="animate-fadeIn text-center">
      {status === 'syncing' && (
        <div className="py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Syncing your data...</h2>
          <p className="text-muted-foreground text-sm">This only takes a moment</p>
        </div>
      )}

      {status === 'analyzing' && (
        <div className="py-16">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold mb-2">Analyzing your priorities...</h2>
          <p className="text-muted-foreground text-sm">Finding insights in your data</p>
        </div>
      )}

      {status === 'done' && result && (
        <div className="py-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">You're all set!</h2>
          <p className="text-muted-foreground text-sm mb-8">Here's what Cosos found</p>

          <Card className="p-6 text-left mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm">{result.insight}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {result.synced.emails !== undefined && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {result.synced.emails} emails
                </span>
              )}
              {result.synced.events !== undefined && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {result.synced.events} events
                </span>
              )}
            </div>
          </Card>

          <Button onClick={onComplete} size="lg" className="gap-2">
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="py-16">
          <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Almost there!</h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <Button onClick={onComplete} className="gap-2">
            Continue to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

