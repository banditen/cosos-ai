'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, PanelRight, PanelRightClose, ArrowUp, MoreHorizontal, Play, FileText, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ArtifactRenderer from '@/components/artifacts/ArtifactRenderer';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageHeader } from '@/components/page-header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'thinking';
  content: string;
}

// Product Spec (Phase 1) - the blueprint
interface ProductSpec {
  title: string;
  description?: string;
  spec: string; // Markdown document
}

// UI Components (Phase 2) - generated from spec
interface UIContent {
  components: any[];
  data: Record<string, any>;
}

interface SavedArtifact {
  id: string;
  title: string;
  phase: 'spec' | 'ui';
}

interface StreamEvent {
  type: 'thinking' | 'building' | 'spec' | 'message' | 'done' | 'error';
  content: any;
}

const WELCOME_EXAMPLES = [
  'MRR dashboard to track monthly revenue',
  'OKR tracker for quarterly goals',
  'Customer health scorecard',
  'Investor update template',
  'Team sprint board',
];

export default function NewArtifactPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Phase 1: Product Spec
  const [productSpec, setProductSpec] = useState<ProductSpec | null>(null);

  // Phase 2: UI Components (generated from spec)
  const [uiContent, setUiContent] = useState<UIContent | null>(null);

  // Current view: 'spec' shows the spec document, 'ui' shows the rendered components
  const [viewMode, setViewMode] = useState<'spec' | 'ui'>('spec');

  const [savedArtifact, setSavedArtifact] = useState<SavedArtifact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingUI, setIsGeneratingUI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [isEditingSpec, setIsEditingSpec] = useState(false);
  const [editableSpec, setEditableSpec] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      setPageLoading(false);

      // Add welcome message with a small delay for smooth appearance
      const firstName = user.user_metadata?.full_name?.split(' ')[0] ||
                       user.email?.split('@')[0] ||
                       'there';
      const randomExample = WELCOME_EXAMPLES[Math.floor(Math.random() * WELCOME_EXAMPLES.length)];

      setTimeout(() => {
        setMessages([{
          role: 'system',
          content: `Hi ${firstName}, let's build something magical! First, I'll help you define what you want to build in a **Product Spec** — then we'll generate the UI. For example, try: **${randomExample}**`
        }]);
      }, 400);
    };
    checkUser();
  }, [router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Phase 1: Generate Product Spec from conversation
  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Add a "thinking" placeholder message
    setMessages(prev => [...prev, { role: 'thinking', content: 'Understanding your request...' }]);

    try {
      // Filter out system/thinking messages from conversation history
      const conversationHistory = messages
        .filter(m => m.role !== 'system' && m.role !== 'thinking')
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const response = await fetch(
        `${API_URL}/api/v1/artifacts/spec/stream?user_id=${user.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userMessage,
            conversation_history: conversationHistory,
            spec: productSpec?.spec,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create spec');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let finalMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));

              switch (event.type) {
                case 'thinking':
                case 'building':
                  // Update the thinking message
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const thinkingIdx = newMessages.findIndex(m => m.role === 'thinking');
                    if (thinkingIdx !== -1) {
                      newMessages[thinkingIdx] = { role: 'thinking', content: event.content };
                    }
                    return newMessages;
                  });
                  break;

                case 'spec':
                  // Set the product spec
                  const specData = event.content;
                  setProductSpec({
                    title: specData.title,
                    description: specData.description,
                    spec: specData.spec
                  });
                  // Auto-save the spec
                  autoSaveSpec(specData);
                  break;

                case 'message':
                  finalMessage = event.content;
                  break;

                case 'done':
                  // Replace thinking message with final assistant message
                  setMessages(prev => {
                    const newMessages = prev.filter(m => m.role !== 'thinking');
                    return [...newMessages, { role: 'assistant', content: finalMessage }];
                  });
                  break;

                case 'error':
                  throw new Error(event.content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      // Remove thinking message and add error
      setMessages(prev => {
        const newMessages = prev.filter(m => m.role !== 'thinking');
        return [...newMessages, {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.'
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save spec when created or updated
  const autoSaveSpec = async (specData: { title: string; description?: string; spec: string }) => {
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      if (savedArtifact) {
        // Update existing artifact
        await fetch(
          `${API_URL}/api/v1/artifacts/${savedArtifact.id}?user_id=${user.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: specData.title,
              description: specData.description,
              spec: specData.spec,
            }),
          }
        );
        setSavedArtifact(prev => prev ? { ...prev, title: specData.title } : null);
      } else {
        // Create new artifact with spec
        const response = await fetch(
          `${API_URL}/api/v1/artifacts/generate?user_id=${user.id}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: specData.title,
              title_override: specData.title,
              description_override: specData.description,
              spec: specData.spec,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSavedArtifact({
            id: data.artifact.id,
            title: data.artifact.title,
            phase: 'spec'
          });
        }
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Phase 2: Generate UI from Product Spec
  const handleGenerateUI = async () => {
    if (!productSpec || !user || isGeneratingUI) return;

    setIsGeneratingUI(true);
    try {
      const response = await fetch(
        `${API_URL}/api/v1/artifacts/generate-ui?user_id=${user.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spec: productSpec.spec,
            title: productSpec.title,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate UI');
      }

      const data = await response.json();
      setUiContent({
        components: data.components,
        data: data.data || {}
      });
      setViewMode('ui');

      // Update saved artifact with UI content
      if (savedArtifact) {
        await fetch(
          `${API_URL}/api/v1/artifacts/${savedArtifact.id}?user_id=${user.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: {
                components: data.components,
                data: data.data || {}
              },
              phase: 'ui'
            }),
          }
        );
        setSavedArtifact(prev => prev ? { ...prev, phase: 'ui' } : null);
      }
    } catch (error) {
      console.error('Error generating UI:', error);
    } finally {
      setIsGeneratingUI(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Start editing the spec
  const handleStartEdit = () => {
    if (productSpec) {
      setEditableSpec(productSpec.spec);
      setIsEditingSpec(true);
    }
  };

  // Save edited spec
  const handleSaveEdit = async () => {
    if (!productSpec || !user) return;

    const updatedSpec = {
      ...productSpec,
      spec: editableSpec
    };
    setProductSpec(updatedSpec);
    setIsEditingSpec(false);

    // Auto-save the updated spec
    await autoSaveSpec(updatedSpec);
  };

  // Parse message to extract questions
  const parseMessageWithQuestions = (content: string) => {
    // Look for questions pattern (numbered list at the end)
    const questionPatterns = [
      /(?:Here are (?:some|a few) questions|I have (?:some|a few) questions|To refine|To help me|A few questions)[:\s]*([\s\S]*?)$/i,
      /(?:\n\n|\n)(\d+\.\s+.+(?:\n\d+\.\s+.+)*)\s*$/,
    ];

    for (const pattern of questionPatterns) {
      const match = content.match(pattern);
      if (match) {
        const mainMessage = content.slice(0, match.index).trim();
        const questionsText = match[1] || match[0];
        const questions = questionsText
          .split(/\n/)
          .map(q => q.replace(/^\d+\.\s*/, '').trim())
          .filter(q => q.length > 0 && q.endsWith('?'));

        if (questions.length > 0) {
          return { mainMessage, questions };
        }
      }
    }

    return { mainMessage: content, questions: [] };
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Artifacts', href: '/artifacts' },
          { label: productSpec?.title || 'New Artifact', icon: <Sparkles className="h-3.5 w-3.5" /> },
        ]}
        actions={
          <>
            {/* View mode toggle - only show when we have both spec and UI */}
            {productSpec && uiContent && (
              <div className="flex items-center border rounded-lg p-0.5 mr-2">
                <Button
                  variant={viewMode === 'spec' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setViewMode('spec')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Spec
                </Button>
                <Button
                  variant={viewMode === 'ui' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setViewMode('ui')}
                >
                  <Play className="h-3 w-3 mr-1" />
                  UI
                </Button>
              </div>
            )}
            {savedArtifact && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {isSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
                {savedArtifact.phase === 'ui' ? 'Saved' : 'Draft'}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setChatOpen(!chatOpen)}
            >
              {chatOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Main content - split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Spec or UI Preview */}
        <div className={`flex-1 overflow-auto p-6 ${chatOpen ? 'border-r' : ''} bg-accent/5`}>
          {productSpec ? (
            <div className="max-w-4xl mx-auto">
              {/* Show Spec or UI based on viewMode */}
              {viewMode === 'spec' || !uiContent ? (
                <>
                  {/* Product Spec Document */}
                  <div className="bg-background rounded-xl border shadow-sm relative group">
                    {/* Edit button */}
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
                      /* Editable textarea */
                      <div className="p-4">
                        <textarea
                          value={editableSpec}
                          onChange={(e) => setEditableSpec(e.target.value)}
                          className="w-full min-h-[400px] font-mono text-sm bg-transparent border-0 resize-none focus:outline-none focus:ring-0"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingSpec(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Rendered markdown with better styling */
                      <div className="p-6 prose prose-sm dark:prose-invert max-w-none
                        [&>h1]:text-xl [&>h1]:font-semibold [&>h1]:mb-4 [&>h1]:pb-2 [&>h1]:border-b [&>h1]:border-border
                        [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-foreground
                        [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mt-4 [&>h3]:mb-2
                        [&>p]:text-sm [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-3
                        [&>ul]:my-2 [&>ul]:pl-5 [&>ul]:list-disc
                        [&>ul>li]:text-sm [&>ul>li]:text-muted-foreground [&>ul>li]:my-1
                        [&>ol]:my-2 [&>ol]:pl-5 [&>ol]:list-decimal
                        [&>ol>li]:text-sm [&>ol>li]:text-muted-foreground [&>ol>li]:my-1
                        [&_strong]:text-foreground [&_strong]:font-medium">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{productSpec.spec}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Generate UI Button */}
                  {!uiContent && !isEditingSpec && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={handleGenerateUI}
                        disabled={isGeneratingUI}
                        className="gap-2"
                      >
                        {isGeneratingUI ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating UI...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Build from Spec
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                /* Rendered UI Components */
                <ArtifactRenderer
                  artifact={{
                    id: savedArtifact?.id || 'preview',
                    user_id: user?.id || '',
                    type: 'custom',
                    title: productSpec.title,
                    description: productSpec.description,
                    prompt: messages[0]?.content || '',
                    content: { components: uiContent.components, data: uiContent.data },
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }}
                  showHeader={false}
                />
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h2 className="text-lg font-medium mb-2">Define Your Artifact</h2>
                <p className="text-sm text-muted-foreground">
                  Describe what you want to build. I'll create a Product Spec first, then generate the UI.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat Panel */}
        {chatOpen && (
        <div className="w-[400px] flex flex-col bg-background border-l">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-medium">Artifact Builder</h2>
            <p className="text-xs text-muted-foreground">Chat to refine your artifact</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((message, index) => {
              // Parse assistant messages for questions
              const isAssistant = message.role === 'assistant';
              const parsed = isAssistant ? parseMessageWithQuestions(message.content) : null;

              return (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{
                    animation: 'fadeSlideIn 0.3s ease-out forwards',
                    animationDelay: `${index * 50}ms`,
                    opacity: 0
                  }}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.role === 'thinking'
                        ? 'bg-muted/50 border border-border/30 italic text-muted-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'system' ? (
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span dangerouslySetInnerHTML={{
                          __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }} />
                      </div>
                    ) : message.role === 'thinking' ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                        <span>{message.content}</span>
                      </div>
                    ) : isAssistant && parsed?.questions.length ? (
                      /* Assistant message with questions */
                      <div className="space-y-3">
                        <span className="whitespace-pre-wrap">{parsed.mainMessage}</span>
                        <div className="pt-2 border-t border-border/30 space-y-1.5">
                          {parsed.questions.map((q, i) => (
                            <button
                              key={i}
                              className="block w-full text-left text-xs px-2 py-1.5 rounded-lg bg-background/50 hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                              onClick={() => setInput(q)}
                            >
                              {i + 1}. {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Custom animation keyframes */}
          <style jsx>{`
            @keyframes fadeSlideIn {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Input - Send button inside textarea */}
          <div className="p-4 border-t">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build..."
                className="min-h-[80px] resize-none text-sm pr-12 rounded-xl"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

