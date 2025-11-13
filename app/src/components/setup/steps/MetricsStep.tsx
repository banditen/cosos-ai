'use client';

import { useState } from 'react';
import { BarChart3, DollarSign, Users, Clock, TrendingUp, CreditCard } from 'lucide-react';
import MetricCard, { AddMetricCard } from '../MetricCard';

interface Metric {
  id: string;
  name: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  source: 'manual' | 'stripe' | 'linear' | 'calculated';
}

interface MetricsStepProps {
  metrics: Metric[];
  onUpdate: (metrics: Metric[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

const commonMetrics = [
  { name: 'MRR', unit: 'USD', icon: DollarSign },
  { name: 'Active Users', unit: 'users', icon: Users },
  { name: 'Runway', unit: 'months', icon: Clock },
  { name: 'Conversion Rate', unit: '%', icon: TrendingUp },
];

export default function MetricsStep({ metrics, onUpdate, onContinue, onBack }: MetricsStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addMetric = (template?: { name: string; unit: string }) => {
    const newMetric: Metric = {
      id: `metric-${Date.now()}`,
      name: template?.name || '',
      currentValue: '0',
      targetValue: '',
      unit: template?.unit || '',
      source: 'manual',
    };
    onUpdate([...metrics, newMetric]);
    setEditingId(newMetric.id);
  };

  const updateMetric = (updatedMetric: Metric) => {
    onUpdate(metrics.map(m => m.id === updatedMetric.id ? updatedMetric : m));
  };

  const deleteMetric = (id: string) => {
    onUpdate(metrics.filter(m => m.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleEdit = (metric: Metric) => {
    if (editingId === metric.id) {
      if (metric.name.trim() && metric.targetValue.trim()) {
        setEditingId(null);
      }
    } else {
      setEditingId(metric.id);
    }
  };

  const isValid = metrics.length >= 1 && metrics.every(m => m.name.trim() && m.targetValue.trim());
  const canAddMore = metrics.length < 7;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="heading-2 mb-2 flex items-center justify-center gap-2">
          <BarChart3 className="w-6 h-6 text-action" />
          Success Metrics
        </h1>
        <p className="body text-foreground/60">
          What 3-5 numbers tell you if you're winning?
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid gap-3 mb-6">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            onEdit={updateMetric}
            onDelete={deleteMetric}
            isEditing={editingId === metric.id}
          />
        ))}

        {/* Add metric button */}
        {canAddMore && (
          <AddMetricCard onClick={() => addMetric()} />
        )}
      </div>

      {/* Quick add common metrics */}
      {canAddMore && (
        <div className="mb-6">
          <p className="body-small text-foreground/60 mb-3 text-center">
            {metrics.length === 0 ? 'Start with a common metric:' : 'Quick add:'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {commonMetrics
              .filter(template => !metrics.some(m => m.name === template.name))
              .map((template) => (
                <button
                  key={template.name}
                  onClick={() => addMetric(template)}
                  className="p-2.5 rounded-lg bg-white border border-accent-beige hover:border-action/40 hover:bg-accent-lavender/5 transition-all duration-200 group"
                  title={`Add ${template.name}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {(() => {
                      const IconComponent = template.icon;
                      return <IconComponent className="w-5 h-5 text-action group-hover:scale-110 transition-transform duration-200" />;
                    })()}
                    <span className="body-small font-medium text-foreground group-hover:text-action transition-colors duration-200">
                      {template.name}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Stripe auto-populate suggestion */}
      {metrics.length > 0 && !metrics.some(m => m.name === 'MRR') && (
        <div className="mb-8 p-6 rounded-2xl bg-white border-2 border-dashed border-accent-beige hover:border-action/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-lavender/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-action" />
              </div>
              <div>
                <h3 className="font-heading font-medium text-foreground mb-1">
                  Auto-track MRR from Stripe
                </h3>
                <p className="body-small text-foreground/60">
                  We can automatically track your revenue
                </p>
              </div>
            </div>
            <button
              onClick={() => addMetric({ name: 'MRR', unit: 'USD' })}
              className="btn-secondary"
            >
              Add MRR
            </button>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!isValid}
          className="btn-primary px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <span className="flex items-center gap-2">
            Continue
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>

      {/* Validation message */}
      {!isValid && metrics.length > 0 && (
        <p className="mt-4 text-center body-small text-foreground/40">
          Please complete all metric details to continue
        </p>
      )}

      {metrics.length === 0 && (
        <p className="mt-4 text-center body-small text-foreground/40">
          Add at least one metric to continue
        </p>
      )}
    </div>
  );
}

