'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface SetupWelcomeProps {
  userName: string;
  onContinue: () => void;
}

export default function SetupWelcome({ userName, onContinue }: SetupWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="mb-8">
        <Image
          src="/cosos_logo.png"
          alt="Cosos"
          width={120}
          height={32}
          className="mx-auto"
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="text-sm text-muted-foreground">AI-powered operations</span>
      </div>

      <h1 className="text-3xl font-semibold text-foreground mb-3">
        Welcome, {userName}!
      </h1>
      
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Let's get you set up in 2 minutes. Connect your tools and see what Cosos can do for you.
      </p>

      <Button 
        onClick={onContinue}
        size="lg"
        className="gap-2"
      >
        Get Started
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-xs text-muted-foreground mt-6">
        No credit card required • Free to start
      </p>
    </div>
  );
}

