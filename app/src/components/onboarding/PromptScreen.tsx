'use client';

import { ArrowLeft } from 'lucide-react';

interface PromptScreenProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const examples = [
  'Track our path to $100k MRR by end of year',
  'Figure out why our activation rate dropped last month',
  'Create a dashboard for our weekly team standup',
  'Analyze our customer feedback and find patterns',
  'Monitor our product velocity and flag bottlenecks',
  'Help me prepare for our board meeting next week',
];

export default function PromptScreen({ prompt, setPrompt, onSubmit, onBack }: PromptScreenProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="text-4xl">✨</div>
        <h1 className="heading-1 text-foreground">
          What would you like me to help you with first?
        </h1>
        <p className="body text-foreground/60">
          Be specific — the more detail you give me, the better I can help.
        </p>
      </div>

      {/* Prompt input */}
      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you need..."
          className="w-full h-48 p-6 bg-white border-2 border-accent-beige rounded-xl focus:border-action focus:outline-none resize-none body-large text-foreground placeholder:text-foreground/40"
          autoFocus
        />
        <p className="body-small text-foreground/40 mt-2 text-right">
          Press ⌘ + Enter to submit
        </p>
      </div>

      {/* Examples */}
      <div className="space-y-3">
        <p className="body-small text-foreground/50">
          Examples:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)} // Remove emoji
              className="text-left p-3 bg-white border border-accent-beige rounded-lg hover:border-action hover:shadow-sm transition-all body-small text-foreground/70"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={onSubmit}
          disabled={!prompt.trim()}
          className="px-12 py-4 bg-action text-white rounded-lg hover:bg-action/90 transition-colors body font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate
        </button>
      </div>

      {/* Back button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 body-small text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
}

