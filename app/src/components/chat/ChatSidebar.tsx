'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSidebarProps {
  userId: string;
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  placeholder?: string;
}

export interface ChatSidebarRef {
  sendMessage: (message: string) => void;
}

export const ChatSidebar = forwardRef<ChatSidebarRef, ChatSidebarProps>(({
  userId,
  isOpen,
  title = 'Ask Cosos',
  subtitle = 'Ask about your business',
  placeholder = 'Ask about your business...',
}, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/context/ask?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          conversation_id: conversationId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation_id);
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'No response' }]);
      } else {
        const error = await response.json().catch(() => ({}));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: error.detail || 'Sorry, something went wrong.'
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to Cosos.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => sendMessage(input);

  // Expose sendMessage to parent
  useImperativeHandle(ref, () => ({
    sendMessage
  }));

  if (!isOpen) return null;

  return (
    <div className="w-[360px] flex flex-col bg-background border-l h-full">
      <div className="px-4 py-3 border-b shrink-0">
        <h3 className="font-heading font-medium text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>Ask me about your business</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-action text-action-foreground'
                  : 'bg-accent/50'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:my-2 [&>ol]:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
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

      <div className="p-4 border-t shrink-0">
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
            placeholder={placeholder}
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
  );
});

ChatSidebar.displayName = 'ChatSidebar';

