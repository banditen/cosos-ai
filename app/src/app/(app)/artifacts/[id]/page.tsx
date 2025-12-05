'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import ArtifactRenderer from '@/components/artifacts/ArtifactRenderer';
import ArtifactActions from '@/components/artifacts/ArtifactActions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Check, Loader2, FileText, LayoutDashboard, ArrowUp, PanelRight, PanelRightClose, Sparkles, ArrowLeft, Play } from 'lucide-react';
import { Artifact } from '@/types/artifact';
import { notifyArtifactChanged } from '@/lib/events';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageHeader } from '@/components/page-header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ArtifactViewPage() {
  const router = useRouter();
  const params = useParams();
  const artifactId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);

  // View mode: spec or ui
  const [viewMode, setViewMode] = useState<'spec' | 'ui'>('spec');

  // Editing
  const [isEditingSpec, setIsEditingSpec] = useState(false);
  const [editableSpec, setEditableSpec] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Chat
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    setUser(user);
    await loadArtifact(artifactId, user.id);
    setLoading(false);
  };

  const loadArtifact = async (id: string, userId: string) => {
    try {
      setError(null);
      const loadedArtifact = await apiClient.artifacts.get(id, userId);
      setArtifact(loadedArtifact);

      // Load conversation history if exists
      if (loadedArtifact.conversation_history && loadedArtifact.conversation_history.length > 0) {
        setMessages(loadedArtifact.conversation_history);
      }

      // Set view mode based on phase
      if (loadedArtifact.phase === 'ui' && loadedArtifact.content?.components?.length > 0) {
        setViewMode('ui');
      } else {
        setViewMode('spec');
      }
    } catch (error) {
      console.error('Error loading artifact:', error);
      setError('Failed to load artifact.');
    }
  };

  const handleStartEdit = () => {
    if (artifact?.spec) {
      setEditableSpec(artifact.spec);
      setIsEditingSpec(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!artifact || !user) return;

    setIsSaving(true);
    try {
      await apiClient.artifacts.update(artifact.id, user.id, { spec: editableSpec });
      await loadArtifact(artifactId, user.id);
      setIsEditingSpec(false);
      notifyArtifactChanged();
    } catch (error) {
      console.error('Error saving spec:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !artifact || !user || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/artifacts/spec/stream?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
          current_spec: artifact.spec,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'spec') {
                  // Update artifact spec
                  await apiClient.artifacts.update(artifact.id, user.id, {
                    spec: data.content.spec,
                    title: data.content.title,
                    description: data.content.description,
                  });
                  await loadArtifact(artifactId, user.id);
                } else if (data.type === 'message') {
                  setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
                }
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateUI = async () => {
    if (!artifact || !user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/artifacts/generate-ui?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: artifact.spec,
          title: artifact.title,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await apiClient.artifacts.update(artifact.id, user.id, {
          content: result,
          phase: 'ui' as any,
        });
        await loadArtifact(artifactId, user.id);
        setViewMode('ui');
      }
    } catch (error) {
      console.error('Error generating UI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !artifact) return;
    await apiClient.artifacts.delete(artifact.id, user.id);
    notifyArtifactChanged();
    router.push('/artifacts');
  };

  const handleRename = async (newTitle: string) => {
    if (!user || !artifact) return;
    await apiClient.artifacts.update(artifact.id, user.id, { title: newTitle });
    await loadArtifact(artifactId, user.id);
    notifyArtifactChanged();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action"></div>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="text-center py-12">
        <h2 className="heading-2 mb-3">{error || 'Artifact not found'}</h2>
        <Button onClick={() => router.push('/artifacts')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Artifacts
        </Button>
      </div>
    );
  }

  const hasUI = artifact.content?.components?.length > 0;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Artifacts', href: '/artifacts' },
          { label: artifact.title, icon: <Sparkles className="h-3.5 w-3.5" /> },
        ]}
        actions={
          <>
            {/* View toggle */}
            {hasUI && (
              <div className="flex border rounded-md overflow-hidden text-xs">
                <button
                  onClick={() => setViewMode('spec')}
                  className={`px-3 py-1 flex items-center gap-1 ${viewMode === 'spec' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                >
                  <FileText className="h-3 w-3" />
                  Spec
                </button>
                <button
                  onClick={() => setViewMode('ui')}
                  className={`px-3 py-1 flex items-center gap-1 ${viewMode === 'ui' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                >
                  <LayoutDashboard className="h-3 w-3" />
                  UI
                </button>
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setChatOpen(!chatOpen)}>
              {chatOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </Button>
            <ArtifactActions
              artifactId={artifact.id}
              artifactTitle={artifact.title}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          </>
        }
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Spec or UI */}
        <div className={`flex-1 overflow-auto p-6 ${chatOpen ? 'border-r' : ''} bg-accent/5`}>
          <div className="max-w-4xl mx-auto">
            {viewMode === 'spec' ? (
              <>
                {/* Spec view */}
                {artifact.spec ? (
                  <div className="bg-background rounded-xl border shadow-sm relative group">
                    {!isEditingSpec && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-xs"
                        onClick={handleStartEdit}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    {isEditingSpec ? (
                      <div className="p-4">
                        <textarea
                          value={editableSpec}
                          onChange={(e) => setEditableSpec(e.target.value)}
                          className="w-full min-h-[400px] font-mono text-sm bg-transparent border-0 resize-none focus:outline-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                          <Button variant="ghost" size="sm" onClick={() => setIsEditingSpec(false)}>Cancel</Button>
                          <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 prose prose-sm dark:prose-invert max-w-none
                        [&>h1]:text-xl [&>h1]:font-semibold [&>h1]:mb-4 [&>h1]:pb-2 [&>h1]:border-b
                        [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3
                        [&>p]:text-sm [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-3
                        [&>ul]:my-2 [&>ul]:pl-5 [&>ul]:list-disc
                        [&>ul>li]:text-sm [&>ul>li]:text-muted-foreground [&>ul>li]:my-1
                        [&_strong]:text-foreground [&_strong]:font-medium">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.spec}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No Product Spec defined yet.</p>
                  </div>
                )}

                {/* Generate UI button */}
                {artifact.spec && !hasUI && !isEditingSpec && (
                  <div className="mt-6 flex justify-center">
                    <Button onClick={handleGenerateUI} disabled={isLoading} className="gap-2">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Build from Spec
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* UI view */
              <ArtifactRenderer artifact={artifact} onDataUpdate={async () => {}} />
            )}
          </div>
        </div>

        {/* Right: Chat */}
        {chatOpen && (
          <div className="w-[360px] flex flex-col bg-background">
            <div className="px-4 py-3 border-b">
              <h3 className="font-medium text-sm">Chat</h3>
              <p className="text-xs text-muted-foreground">Refine your artifact</p>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <p>Ask me to refine the spec</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-action text-action-foreground'
                        : 'bg-accent/50'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-accent/50 px-3 py-2 rounded-xl">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Refine the spec..."
                  className="min-h-[60px] pr-10 resize-none text-sm"
                />
                <Button
                  size="icon"
                  className="absolute bottom-2 right-2 h-7 w-7 rounded-full"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
