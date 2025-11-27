'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TextBlockConfig } from '@/types/artifact';
import { cn } from '@/lib/utils';

interface TextBlockProps {
  config: TextBlockConfig;
}

export default function TextBlock({ config }: TextBlockProps) {
  const { text, variant = 'default' } = config;

  const variantStyles = {
    default: {
      container: 'bg-card border-border',
      icon: null,
      iconColor: '',
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
    },
  };

  const style = variantStyles[variant];
  const IconComponent = style.icon;

  return (
    <Card className={cn('border', style.container)}>
      <CardContent className="pt-4">
        <div className="flex gap-3">
          {IconComponent && (
            <IconComponent className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.iconColor)} />
          )}
          <p className="text-sm text-foreground/80 leading-relaxed">
            {text}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

