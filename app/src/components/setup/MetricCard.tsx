'use client';

import { useState } from 'react';
import { DollarSign, Users, Clock, BarChart3 } from 'lucide-react';

interface Metric {
  id: string;
  name: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  source: 'manual' | 'stripe' | 'linear' | 'calculated';
}

interface MetricCardProps {
  metric: Metric;
  onEdit: (metric: Metric) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
}

const sourceLabels = {
  manual: 'Manual',
  stripe: 'Stripe (auto-tracked)',
  linear: 'Linear (auto-tracked)',
  calculated: 'Calculated',
};

const metricIcons: Record<string, any> = {
  MRR: DollarSign,
  Revenue: DollarSign,
  Users: Users,
  'Active Users': Users,
  Customers: Users,
  Runway: Clock,
  'Conversion Rate': BarChart3,
  default: BarChart3,
};

export default function MetricCard({ metric, onEdit, onDelete, isEditing = false }: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = metricIcons[metric.name] || metricIcons.default;

  if (isEditing) {
    return (
      <div className="card border-2 border-action/20 bg-accent-lavender/5">
        <div className="space-y-4">
          <div>
            <label className="block body-small font-medium text-foreground/60 mb-2">
              Metric Name
            </label>
            <input
              type="text"
              value={metric.name}
              onChange={(e) => onEdit({ ...metric, name: e.target.value })}
              className="input"
              placeholder="e.g., MRR"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block body-small font-medium text-foreground/60 mb-2">
                Current Value
              </label>
              <input
                type="text"
                value={metric.currentValue}
                onChange={(e) => onEdit({ ...metric, currentValue: e.target.value })}
                className="input"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block body-small font-medium text-foreground/60 mb-2">
                Target Value
              </label>
              <input
                type="text"
                value={metric.targetValue}
                onChange={(e) => onEdit({ ...metric, targetValue: e.target.value })}
                className="input"
                placeholder="10,000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block body-small font-medium text-foreground/60 mb-2">
                Unit
              </label>
              <input
                type="text"
                value={metric.unit}
                onChange={(e) => onEdit({ ...metric, unit: e.target.value })}
                className="input"
                placeholder="USD, users, etc."
              />
            </div>

            <div>
              <label className="block body-small font-medium text-foreground/60 mb-2">
                Source
              </label>
              <select
                value={metric.source}
                onChange={(e) => onEdit({ ...metric, source: e.target.value as Metric['source'] })}
                className="input"
              >
                <option value="manual">Manual</option>
                <option value="stripe">Stripe</option>
                <option value="linear">Linear</option>
                <option value="calculated">Calculated</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = metric.targetValue !== '0' 
    ? (parseFloat(metric.currentValue.replace(/,/g, '')) / parseFloat(metric.targetValue.replace(/,/g, ''))) * 100 
    : 0;

  return (
    <div
      className="group relative card hover:border-action/30 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(metric)}
    >
      {/* Hover gradient effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-accent-lavender/5 to-transparent rounded-card transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-lavender/20 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-action" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-medium text-foreground">
                {metric.name}
              </h3>
              <p className="body-small text-foreground/40">
                {sourceLabels[metric.source]}
              </p>
            </div>
          </div>
          
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(metric.id);
            }}
            className={`p-2 rounded-lg hover:bg-red-50 text-foreground/40 hover:text-red-600 transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Values */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-heading font-medium text-foreground">
            {metric.currentValue}
          </span>
          <span className="body-small text-foreground/40">→</span>
          <span className="body text-foreground/60">
            {metric.targetValue} {metric.unit}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-accent-beige/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-action rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function AddMetricCard({ onClick }: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full card border-2 border-dashed border-accent-beige hover:border-action/40 hover:bg-accent-lavender/5 transition-all duration-300 min-h-[140px] flex items-center justify-center group"
    >
      <div className="text-center">
        <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-accent-beige group-hover:bg-action/10 flex items-center justify-center transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
          <svg className="w-6 h-6 text-foreground/40 group-hover:text-action transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="body font-medium text-foreground/60 group-hover:text-action transition-colors duration-300">
          Add Metric
        </span>
      </div>
    </button>
  );
}

