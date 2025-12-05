'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BookOpen, Upload, Link2, FileText, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface KnowledgeSource {
  id: string;
  source_type: string;
  name: string;
  status: string;
  last_sync_at: string | null;
  document_count: number;
}

export default function KnowledgePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);

  const loadSources = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (e) {
      console.error('Failed to load sources:', e);
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
      await loadSources(user.id);
      setLoading(false);
    };
    loadData();
  }, [router, loadSources]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader breadcrumbs={[{ label: 'Knowledge' }]} />

      <div className="flex-1 overflow-auto p-6">
        {/* Add Knowledge Options */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card
          className="border-dashed border-2 hover:border-action/50 transition-colors cursor-pointer"
          onClick={() => router.push('/integrations')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-action/10">
                <Link2 className="w-5 h-5 text-action" />
              </div>
              <CardTitle className="text-sm">Connect Integration</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Notion, Slack, and more
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 hover:border-action/50 transition-colors cursor-pointer opacity-60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-action/10">
                <Upload className="w-5 h-5 text-action" />
              </div>
              <CardTitle className="text-sm">Upload Documents</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              PDF, Markdown (coming soon)
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 hover:border-action/50 transition-colors cursor-pointer opacity-60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-action/10">
                <FileText className="w-5 h-5 text-action" />
              </div>
              <CardTitle className="text-sm">Add Manually</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Goals, decisions (coming soon)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Sources */}
      {sources.length > 0 ? (
        <div className="space-y-4">
          <h2 className="heading-3 text-foreground">Connected Sources</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {sources.map((source) => (
              <Card key={source.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{source.name}</CardTitle>
                        <CardDescription className="text-xs capitalize">
                          {source.source_type}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={source.status === 'active' ? 'secondary' : 'outline'}>
                      {source.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{source.document_count || 0} documents</span>
                    {source.last_sync_at && (
                      <span>Synced {new Date(source.last_sync_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-action" />
            <h2 className="heading-3 mb-3 text-foreground">No knowledge sources yet</h2>
            <p className="body text-foreground/70 mb-6 max-w-md mx-auto">
              Connect integrations or upload documents to build your business context.
            </p>
            <Button onClick={() => router.push('/integrations')}>
              Connect Integration
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

