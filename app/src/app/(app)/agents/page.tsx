'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

interface Agent {
  id: string;
  name: string;
  description?: string;
  integrations: string[];
  created_at: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      // TODO: Load agents from backend
      setAgents([]);
      setLoading(false);
    };
    loadData();
  }, [router]);

  const handleCreateNew = () => {
    router.push('/agents/new');
  };

  const handleViewAgent = (agentId: string) => {
    router.push(`/agents/${agentId}`);
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
      <PageHeader
        breadcrumbs={[{ label: 'Agents' }]}
        actions={
          <Button onClick={handleCreateNew} size="sm" className="gap-2 h-7">
            <Plus className="w-3.5 h-3.5" />
            Create Agent
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Agents Grid */}
      {agents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Bot className="w-12 h-12 mx-auto mb-4 text-action" />
            <h2 className="heading-3 mb-3 text-foreground">No agents yet</h2>
            <p className="body text-foreground/70 mb-6 max-w-md mx-auto">
              Create your first agent to automate tasks using your connected integrations and knowledge.
            </p>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewAgent(agent.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-action/10">
                    <Bot className="w-5 h-5 text-action" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    {agent.description && (
                      <CardDescription className="text-xs line-clamp-2">
                        {agent.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {agent.integrations.map((integration) => (
                    <span
                      key={integration}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted"
                    >
                      {integration}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agent Templates */}
      <div className="mt-8">
        <h2 className="heading-3 text-foreground mb-4">Quick Start Templates</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-dashed border-2 hover:border-action/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Sparkles className="w-6 h-6 mb-2 text-action" />
              <h3 className="font-medium text-sm mb-1">Strategic Q&A</h3>
              <p className="text-xs text-muted-foreground">
                Answer questions about your business strategy and goals
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 hover:border-action/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Sparkles className="w-6 h-6 mb-2 text-action" />
              <h3 className="font-medium text-sm mb-1">Decision Tracker</h3>
              <p className="text-xs text-muted-foreground">
                Track decisions and their outcomes across your tools
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 hover:border-action/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <Sparkles className="w-6 h-6 mb-2 text-action" />
              <h3 className="font-medium text-sm mb-1">Goal Alignment</h3>
              <p className="text-xs text-muted-foreground">
                Monitor if work aligns with business objectives
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}

