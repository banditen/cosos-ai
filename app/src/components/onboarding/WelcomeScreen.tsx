'use client';

import Image from 'next/image';
import { Wallet, TrendingUp, Presentation, Rocket } from 'lucide-react';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="text-center space-y-8 animate-fade-in">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Image
          src="/logo.png"
          alt="Cosos"
          width={200}
          height={64}
          className="object-contain"
          priority
        />
      </div>

      {/* Headline */}
      <div className="space-y-4">
        <h1 className="heading-1 text-foreground">
          Your AI Operating Partner
        </h1>
        <p className="body-large text-foreground/70 max-w-2xl mx-auto">
          Tell me what you need, and I'll build it for you in 10 seconds.
        </p>
      </div>

      {/* Examples */}
      <div className="max-w-xl mx-auto space-y-3 text-left">
        <p className="body-small text-foreground/50 text-center mb-4">
          Examples of what I can create:
        </p>
        <div className="space-y-2">
          <div className="body text-foreground/70 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-foreground/50" />
            Track your path to $100k MRR
          </div>
          <div className="body text-foreground/70 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-foreground/50" />
            Analyze your retention and find drop-off points
          </div>
          <div className="body text-foreground/70 flex items-center gap-3">
            <Presentation className="w-5 h-5 text-foreground/50" />
            Prepare for your next board meeting
          </div>
          <div className="body text-foreground/70 flex items-center gap-3">
            <Rocket className="w-5 h-5 text-foreground/50" />
            Monitor product velocity and flag bottlenecks
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-8">
        <button
          onClick={onContinue}
          className="px-8 py-4 bg-action text-white rounded-lg hover:bg-action/90 transition-colors body font-medium"
        >
          Get started
        </button>
      </div>

      {/* Footer */}
      <p className="body-small text-foreground/40 pt-8">
        Takes less than 2 minutes
      </p>
    </div>
  );
}

