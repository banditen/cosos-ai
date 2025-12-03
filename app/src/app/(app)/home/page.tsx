'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plug, Bot, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/chat/chat-interface';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasIntegrations, setHasIntegrations] = useState(false);

  const checkIntegrations = useCallback(async (userId: string) => {
    try {
      const [slackRes, notionRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/slack/status?user_id=${userId}`),
        fetch(`${API_URL}/api/v1/notion/status?user_id=${userId}`),
      ]);

      const slackStatus = slackRes.ok ? await slackRes.json() : { connected: false };
      const notionStatus = notionRes.ok ? await notionRes.json() : { connected: false };

      setHasIntegrations(slackStatus.connected || notionStatus.connected);
    } catch (e) {
      console.error('Failed to check integrations:', e);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      await checkIntegrations(user.id);
      setLoading(false);
    };
    loadData();
  }, [router, checkIntegrations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action"></div>
      </div>
    );
  }

  const getStartedSteps = [
    {
      title: 'Connect your tools',
      description: 'Link Slack, Linear, Notion to build business context',
      icon: Plug,
      href: '/integrations',
      status: 'todo',
    },
    {
      title: 'Add your knowledge',
      description: 'Import strategy docs, OKRs, and business context',
      icon: BookOpen,
      href: '/knowledge',
      status: 'todo',
    },
    {
      title: 'Create your first agent',
      description: 'Build specialized agents for strategic Q&A',
      icon: Bot,
      href: '/agents',
      status: 'todo',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-2 text-foreground">Welcome to Cosos</h1>
        <p className="body text-foreground/70 mt-2">
          Your business context intelligence layer
        </p>
      </div>

      {/* Value Proposition */}
      <Card className="mb-8 bg-gradient-to-br from-action/5 to-action/10 border-action/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-action/10">
              <Sparkles className="w-6 h-6 text-action" />
            </div>
            <div>
              <h2 className="heading-3 text-foreground mb-2">
                The intelligence layer for your existing tools
              </h2>
              <p className="body text-foreground/70">
                Connect your tools, add your business context, and let Cosos understand your strategy.
                Ask questions, track decisions, and maintain team alignment—all powered by AI that actually understands your business.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Get Started Steps */}
      <div className="mb-8">
        <h2 className="heading-3 text-foreground mb-4">Get Started</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {getStartedSteps.map((step) => (
            <Card
              key={step.title}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => router.push(step.href)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-action/10 group-hover:bg-action/20 transition-colors">
                    <step.icon className="w-5 h-5 text-action" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center justify-between">
                      {step.title}
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-action transition-colors" />
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      {hasIntegrations && user ? (
        <Card className="h-[500px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-action" />
              Ask Cosos
            </CardTitle>
            <CardDescription>
              Ask strategic questions about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)]">
            <ChatInterface userId={user.id} className="h-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              Ask Cosos
            </CardTitle>
            <CardDescription>
              Connect your tools to enable strategic Q&A
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" disabled className="text-muted-foreground">
                What are our Q4 priorities?
              </Button>
              <Button variant="outline" size="sm" disabled className="text-muted-foreground">
                Why did we make this decision?
              </Button>
              <Button variant="outline" size="sm" disabled className="text-muted-foreground">
                Is the team aligned on goals?
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <Button variant="link" className="p-0 h-auto text-xs" onClick={() => router.push('/integrations')}>
                Connect integrations
              </Button>
              {' '}to enable strategic Q&A
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

