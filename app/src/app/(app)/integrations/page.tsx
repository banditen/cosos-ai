'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plug, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Strategic Q&A, decision tracking, goal reminders',
    icon: '/integrations/slack.svg',
    category: 'Communication',
    status: 'available',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Understand strategy docs, OKRs, decisions',
    icon: '/integrations/notion.svg',
    category: 'Knowledge Base',
    status: 'available',
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Connect tickets to business objectives',
    icon: '/integrations/linear.svg',
    category: 'Project Management',
    status: 'coming_soon',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link code changes to business impact',
    icon: '/integrations/github.svg',
    category: 'Development',
    status: 'coming_soon',
  },
];

interface ConnectionStatus {
  connected: boolean;
  last_sync_at?: string;
  workspace_name?: string;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>({});

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      await loadConnectionStatuses(user.id);
      setLoading(false);
    };
    loadData();
  }, [router]);

  // Handle OAuth callback success/error
  useEffect(() => {
    const oauthSuccess = searchParams.get('oauth_success');
    const oauthError = searchParams.get('oauth_error');

    if (oauthSuccess) {
      toast.success(`${oauthSuccess.charAt(0).toUpperCase() + oauthSuccess.slice(1)} connected successfully!`);
      window.history.replaceState({}, '', '/integrations');
      if (user) loadConnectionStatuses(user.id);
    }
    if (oauthError) {
      toast.error(`Connection failed: ${oauthError}`);
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams, user]);

  const loadConnectionStatuses = async (userId: string) => {
    const newStatuses: Record<string, ConnectionStatus> = {};

    // Check Slack status
    try {
      const slackRes = await fetch(`${API_URL}/api/v1/slack/status?user_id=${userId}`);
      if (slackRes.ok) newStatuses.slack = await slackRes.json();
    } catch (e) { console.error('Slack status error:', e); }

    // Check Notion status
    try {
      const notionRes = await fetch(`${API_URL}/api/v1/notion/status?user_id=${userId}`);
      if (notionRes.ok) newStatuses.notion = await notionRes.json();
    } catch (e) { console.error('Notion status error:', e); }

    setStatuses(newStatuses);
  };

  const handleConnect = async (integrationId: string) => {
    if (!user) return;
    setConnecting(integrationId);

    try {
      const res = await fetch(`${API_URL}/api/v1/${integrationId}/oauth/url?user_id=${user.id}`);
      if (!res.ok) throw new Error('Failed to get OAuth URL');
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      toast.error(`Failed to connect ${integrationId}`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!user) return;
    setConnecting(integrationId);

    try {
      const res = await fetch(
        `${API_URL}/api/v1/${integrationId}/disconnect?user_id=${user.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to disconnect');
      toast.success(`${integrationId} disconnected`);
      await loadConnectionStatuses(user.id);
    } catch (error) {
      toast.error(`Failed to disconnect ${integrationId}`);
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="heading-2 text-foreground">Integrations</h1>
          <p className="body text-foreground/70 mt-2">
            Connect your tools to build business context
          </p>
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const status = statuses[integration.id];
          const isConnected = status?.connected;
          const isComingSoon = integration.status === 'coming_soon';
          const isConnecting = connecting === integration.id;

          return (
            <Card key={integration.id} className={isComingSoon ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Plug className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {integration.name}
                        {isConnected && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                        {isComingSoon && (
                          <Badge variant="outline" className="text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {status?.workspace_name || integration.category}
                      </CardDescription>
                    </div>
                  </div>
                  {!isComingSoon && (
                    <div className="flex gap-2">
                      {isConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(integration.id)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(integration.id)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
                {isConnected && status?.last_sync_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last synced: {new Date(status.last_sync_at).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MCP Section */}
      <div className="mt-8">
        <h2 className="heading-3 text-foreground mb-4">Model Context Protocol (MCP)</h2>
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center">
            <Plug className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Connect custom data sources via MCP servers
            </p>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Add MCP Server
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

