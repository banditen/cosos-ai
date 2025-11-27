'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import * as Icons from 'lucide-react';
import { MetricCardConfig } from '@/types/artifact';

interface MetricCardProps {
  config: MetricCardConfig;
}

export default function MetricCard({ config }: MetricCardProps) {
  const { title, value, target, unit, icon, description } = config;

  // Get the icon component dynamically
  const IconComponent = icon && Icons[icon as keyof typeof Icons] 
    ? Icons[icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>
    : null;

  // Calculate progress percentage if target is provided
  const progress = target && typeof value === 'number' && typeof target === 'number'
    ? (value / target) * 100
    : undefined;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground/70">
            {title}
          </CardTitle>
          {IconComponent && (
            <IconComponent className="w-4 h-4 text-action" />
          )}
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-foreground/60">{unit}</span>
            )}
            {target && (
              <span className="text-sm text-foreground/40">
                / {target}{unit}
              </span>
            )}
          </div>
          
          {progress !== undefined && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-foreground/60">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

