import { Settings, Zap, Mail, Calendar, LayoutGrid } from 'lucide-react';

interface WelcomeStepProps {
  onContinue: () => void;
}

export default function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div className="max-w-xl mx-auto text-center">
      {/* Logo/Icon */}
      <div className="mb-6 inline-block">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-lavender/30 to-action/20 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
            <Settings className="w-6 h-6 text-action" />
          </div>
        </div>
      </div>

      {/* Heading */}
      <h1 className="heading-1 mb-3 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
        Welcome to Cosos
      </h1>

      <p className="body text-foreground/60 mb-8">
        Set up your command center in ~15 minutes.
      </p>

      {/* What you'll do */}
      <div className="grid gap-3 mb-8 text-left">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-accent-beige/50 hover:border-action/20 transition-all duration-200">
          <div className="w-8 h-8 rounded-lg bg-accent-lavender/20 flex items-center justify-center flex-shrink-0">
            <span className="text-base">📋</span>
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium text-foreground mb-0.5">
              Map your key projects
            </h3>
            <p className="body-small text-foreground/60">
              Define the 3-5 major things you're working on
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-accent-beige/50 hover:border-action/20 transition-all duration-200">
          <div className="w-8 h-8 rounded-lg bg-accent-lavender/20 flex items-center justify-center flex-shrink-0">
            <span className="text-base">📊</span>
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium text-foreground mb-0.5">
              Set your success metrics
            </h3>
            <p className="body-small text-foreground/60">
              Choose the numbers that tell you if you're winning
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-accent-beige/50 hover:border-action/20 transition-all duration-200">
          <div className="w-8 h-8 rounded-lg bg-accent-lavender/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-action" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium text-foreground mb-0.5">
              Get your first insight
            </h3>
            <p className="body-small text-foreground/60">
              See what's happening in your business right now
            </p>
          </div>
        </div>
      </div>

      {/* Connected integrations */}
      <div className="mb-8 p-4 rounded-xl bg-accent-beige/20 border border-accent-beige/50">
        <p className="body-small text-foreground/60 mb-2">
          Connected:
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-white border border-accent-beige flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-foreground/60" />
            <span className="body-small font-medium text-foreground">Gmail</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white border border-accent-beige flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-foreground/60" />
            <span className="body-small font-medium text-foreground">Calendar</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white border border-accent-beige flex items-center gap-1.5">
            <LayoutGrid className="w-3 h-3 text-foreground/60" />
            <span className="body-small font-medium text-foreground">Linear</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onContinue}
        className="btn-primary group relative overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-1.5">
          Let's Begin
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </button>

      {/* Time estimate */}
      <p className="body-small text-foreground/40 mt-4">
        ~15 minutes
      </p>
    </div>
  );
}

