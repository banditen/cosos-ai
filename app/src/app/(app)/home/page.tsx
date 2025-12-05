'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Clock, Plug, TrendingUp, PanelRight, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatSidebar, ChatSidebarRef } from '@/components/chat/ChatSidebar';
import { PageHeader } from '@/components/page-header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ProgressData {
  completedIssues: number;
  inProgressIssues: number;
  totalIssues: number;
  recentlyCompleted: { title: string; completed_at: string }[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasIntegrations, setHasIntegrations] = useState(false);
  const [progress, setProgress] = useState<ProgressData>({
    completedIssues: 0,
    inProgressIssues: 0,
    totalIssues: 0,
    recentlyCompleted: [],
  });
  const [chatOpen, setChatOpen] = useState(true);
  const chatRef = useRef<ChatSidebarRef>(null);

  const handleQuickAction = (message: string) => {
    setChatOpen(true);
    // Small delay to ensure chat is open before sending
    setTimeout(() => {
      chatRef.current?.sendMessage(message);
    }, 100);
  };

  const loadProgressData = useCallback(async (userId: string) => {
    try {
      // Check if any integrations are connected
      const [linearRes, slackRes, notionRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/linear/status?user_id=${userId}`).catch(() => null),
        fetch(`${API_URL}/api/v1/slack/status?user_id=${userId}`).catch(() => null),
        fetch(`${API_URL}/api/v1/notion/status?user_id=${userId}`).catch(() => null),
      ]);

      const linear = linearRes?.ok ? (await linearRes.json()).connected : false;
      const slack = slackRes?.ok ? (await slackRes.json()).connected : false;
      const notion = notionRes?.ok ? (await notionRes.json()).connected : false;

      setHasIntegrations(linear || slack || notion);

      // Get Linear issue stats
      const [completedRes, inProgressRes, totalRes, recentRes] = await Promise.all([
        supabase.from('linear_issues')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('state_type', 'completed'),
        supabase.from('linear_issues')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('state_type', 'started'),
        supabase.from('linear_issues')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_archived', false),
        supabase.from('linear_issues')
          .select('title, completed_at')
          .eq('user_id', userId)
          .eq('state_type', 'completed')
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(5),
      ]);

      setProgress({
        completedIssues: completedRes.count || 0,
        inProgressIssues: inProgressRes.count || 0,
        totalIssues: totalRes.count || 0,
        recentlyCompleted: recentRes.data || [],
      });
    } catch (e) {
      console.error('Failed to load progress:', e);
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
      await loadProgressData(user.id);
      setLoading(false);
    };
    loadData();
  }, [router, loadProgressData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action"></div>
      </div>
    );
  }

  const hasProgress = progress.totalIssues > 0;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
                    user?.email?.split('@')[0] || 'there';

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[{ label: 'Home' }]}
        actions={
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setChatOpen(!chatOpen)}>
            {chatOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl">
            {/* Welcome Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-heading font-medium mb-1">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-muted-foreground">Here&apos;s what&apos;s happening</p>
            </div>

          {hasIntegrations && hasProgress ? (
            <>
              {/* Progress Stats */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent">
                        <CheckCircle2 className="w-4 h-4 text-action" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-medium">{progress.completedIssues}</p>
                        <p className="text-xs text-muted-foreground">Issues completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent">
                        <Clock className="w-4 h-4 text-action" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-medium">{progress.inProgressIssues}</p>
                        <p className="text-xs text-muted-foreground">In progress</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent">
                        <TrendingUp className="w-4 h-4 text-action" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-medium">
                          {progress.totalIssues > 0
                            ? Math.round((progress.completedIssues / progress.totalIssues) * 100)
                            : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">Completion rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recently Completed */}
              {progress.recentlyCompleted.length > 0 && (
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-heading">Recently Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {progress.recentlyCompleted.map((issue, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-action flex-shrink-0" />
                          <span className="truncate">{issue.title}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-heading">Ask Cosos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleQuickAction('What should I focus on today?')}
                    >
                      What should I focus on today?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleQuickAction('Summarize my progress')}
                    >
                      Summarize my progress
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleQuickAction("What's blocked?")}
                    >
                      What&apos;s blocked?
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Empty state */
            <Card className="text-center py-12">
              <CardContent>
                <div className="p-3 rounded-lg bg-accent inline-block mb-4">
                  <Plug className="w-8 h-8 text-action" />
                </div>
                <h3 className="font-heading text-lg font-medium mb-2">Connect your tools</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Link Linear, Slack, or Notion to see your progress
                </p>
                <Button onClick={() => router.push('/integrations')}>
                  Connect Integrations
                </Button>
              </CardContent>
            </Card>
          )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {user && (
          <ChatSidebar
            ref={chatRef}
            userId={user.id}
            isOpen={chatOpen}
          />
        )}
      </div>
    </div>
  );
}

