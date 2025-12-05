'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { supabase } from '@/lib/supabase';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const INTEGRATIONS = [
  {
    id: 'linear',
    name: 'Linear',
    description: 'Track issues, projects, and team progress',
    icon: 'simple-icons:linear',
    status: 'available',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Strategic Q&A, decision tracking, goal reminders',
    icon: 'simple-icons:slack',
    status: 'available',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Understand strategy docs, OKRs, decisions',
    icon: 'simple-icons:notion',
    status: 'available',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link code changes to business impact',
    icon: 'simple-icons:github',
    status: 'coming_soon',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Track important emails and communication',
    icon: 'simple-icons:gmail',
    status: 'coming_soon',
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync meetings and events',
    icon: 'simple-icons:googlecalendar',
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

    // Check all integration statuses
    const statusChecks = [
      { id: 'linear', endpoint: 'linear' },
      { id: 'slack', endpoint: 'slack' },
      { id: 'notion', endpoint: 'notion' },
    ];

    await Promise.all(
      statusChecks.map(async ({ id, endpoint }) => {
        try {
          const res = await fetch(`${API_URL}/api/v1/${endpoint}/status?user_id=${userId}`);
          if (res.ok) newStatuses[id] = await res.json();
        } catch (e) { console.error(`${id} status error:`, e); }
      })
    );

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
    <div className="flex flex-col h-full">
      <PageHeader breadcrumbs={[{ label: 'Integrations' }]} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl">
          {/* Integration List */}
          <div className="space-y-3">
            {INTEGRATIONS.map((integration) => {
              const status = statuses[integration.id];
              const isConnected = status?.connected;
              const isComingSoon = integration.status === 'coming_soon';
              const isConnecting = connecting === integration.id;

              return (
                <Card key={integration.id} className={isComingSoon ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-background border flex items-center justify-center">
                          <Icon icon={integration.icon} className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{integration.name}</span>
                            {isConnected && (
                              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                <Check className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                            {isComingSoon && (
                              <Badge variant="outline" className="text-xs h-5 px-1.5">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {status?.workspace_name || integration.description}
                          </p>
                        </div>
                      </div>
                      {!isComingSoon && (
                        <div>
                          {isConnected ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleDisconnect(integration.id)}
                              disabled={isConnecting}
                            >
                              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() => handleConnect(integration.id)}
                              disabled={isConnecting}
                            >
                              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* MCP Section */}
          <div className="mt-8">
            <h2 className="font-heading text-base font-medium mb-3">Model Context Protocol (MCP)</h2>
            <Card className="border-dashed border-2">
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
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
      </div>
    </div>
  );
}

