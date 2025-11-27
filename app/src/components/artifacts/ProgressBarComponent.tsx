'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressBarConfig } from '@/types/artifact';

interface ProgressBarComponentProps {
  config: ProgressBarConfig;
}

export default function ProgressBarComponent({ config }: ProgressBarComponentProps) {
  const { title, value, max, showPercentage = true, description } = config;

  const percentage = (value / max) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={percentage} className="h-3" />
          <div className="flex justify-between text-xs text-foreground/60">
            <span>
              {value} / {max}
            </span>
            {showPercentage && (
              <span>{Math.round(percentage)}%</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

