'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Check, Loader2, Mail, Calendar, ListTodo, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  available: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail & Calendar',
    description: 'Sync emails and calendar events',
    icon: <Mail className="w-5 h-5" />,
    endpoint: 'auth/google',
    available: true,
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Sync issues and projects',
    icon: <ListTodo className="w-5 h-5" />,
    endpoint: 'linear/oauth',
    available: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect team messages',
    icon: <MessageSquare className="w-5 h-5" />,
    endpoint: 'slack/oauth',
    available: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync docs and databases',
    icon: <Calendar className="w-5 h-5" />,
    endpoint: 'notion/oauth',
    available: true,
  },
];

interface SetupIntegrationsProps {
  userId: string;
  connectedIntegrations: string[];
  onConnect: (provider: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function SetupIntegrations({
  userId,
  connectedIntegrations,
  onContinue,
  onBack,
}: SetupIntegrationsProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (integration: Integration) => {
    if (!userId) return;
    setConnecting(integration.id);

    try {
      const res = await fetch(`${API_URL}/api/v1/${integration.endpoint}/url?user_id=${userId}`);
      if (!res.ok) throw new Error('Failed to get OAuth URL');
      const { url } = await res.json();
      
      // Store current step in localStorage to restore after OAuth
      localStorage.setItem('setup_return_step', 'integrations');
      
      window.location.href = url;
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect ${integration.name}`);
      setConnecting(null);
    }
  };

  const hasConnections = connectedIntegrations.length > 0;

  return (
    <div className="animate-fadeIn">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Connect your tools
      </h1>
      <p className="text-muted-foreground mb-8">
        Connect at least one tool to get started. Cosos will analyze your data and provide insights.
      </p>

      <div className="grid gap-3 mb-8">
        {INTEGRATIONS.map((integration) => {
          const isConnected = connectedIntegrations.includes(integration.id);
          const isConnecting = connecting === integration.id;

          return (
            <Card
              key={integration.id}
              className={`p-4 flex items-center justify-between transition-all ${
                isConnected ? 'border-green-500/50 bg-green-500/5' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-500/10 text-green-600' : 'bg-muted'}`}>
                  {integration.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">{integration.description}</p>
                </div>
              </div>

              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Check className="w-4 h-4" />
                  Connected
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect(integration)}
                  disabled={isConnecting || !integration.available}
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Connect'
                  )}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={onContinue} disabled={!hasConnections} className="gap-2">
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {!hasConnections && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Connect at least one integration to continue
        </p>
      )}
    </div>
  );
}

