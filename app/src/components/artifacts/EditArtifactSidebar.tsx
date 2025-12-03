'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import apiClient from '@/lib/api';
import type { Artifact } from '@/types/artifact';
import { notifyArtifactChanged } from '@/lib/events';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface EditArtifactSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifact: Artifact;
  userId: string;
  onArtifactUpdated: () => void;
}

export default function EditArtifactSidebar({
  open,
  onOpenChange,
  artifact,
  userId,
  onArtifactUpdated,
}: EditArtifactSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load stored conversation history or show default message
  useEffect(() => {
    if (artifact.conversation_history && artifact.conversation_history.length > 0) {
      // Load existing conversation
      setMessages(artifact.conversation_history as Message[]);
    } else {
      // Show default welcome message
      setMessages([
        {
          role: 'assistant' as const,
          content: `I'm here to help you improve "${artifact.title}". What would you like to change or add?`,
        },
      ]);
    }
  }, [artifact]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const newMessages: Message[] = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build conversation history (exclude the initial greeting)
      const conversationHistory = newMessages
        .slice(1) // Skip the initial assistant greeting
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Call API to edit artifact with AI
      const response = await apiClient.artifacts.editWithAI(
        artifact.id,
        userId,
        userMessage,
        conversationHistory
      );

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          content: response.assistant_message,
        },
      ]);

      // Notify parent component to refresh the artifact
      onArtifactUpdated();

      // Notify sidebar to refresh
      notifyArtifactChanged();
    } catch (error) {
      console.error('Error updating artifact:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="heading-3">Edit Artifact</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="body-small text-muted-foreground">
          Tell me what you'd like to change about "{artifact.title}"
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-action text-white'
                    : 'bg-accent-beige text-foreground'
                }`}
              >
                <p className="body-small whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-accent-beige text-foreground rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you'd like to change..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

