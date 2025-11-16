'use client';

import {
  TrendingUp,
  MapPin,
  Target,
  Route,
  AlertTriangle,
  CheckCircle2,
  Zap,
  LucideIcon
} from 'lucide-react';

interface ArtifactDisplayProps {
  artifact: any;
}

export default function ArtifactDisplay({ artifact }: ArtifactDisplayProps) {
  const { type, title, description, content } = artifact;

  // Route to specific display based on type
  if (type === 'mrr_tracker') {
    return <MRRTrackerDisplay title={title} description={description} content={content} />;
  }

  // Default display for other types
  return <DefaultArtifactDisplay title={title} description={description} content={content} />;
}

// MRR Tracker specific display
function MRRTrackerDisplay({ title, description, content }: any) {
  return (
    <div className="bg-white rounded-xl border-2 border-accent-beige p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-accent-beige pb-6">
        <div className="flex items-start gap-3 mb-2">
          <TrendingUp className="w-6 h-6 text-action mt-1" />
          <div>
            <h2 className="heading-2 text-foreground">{title}</h2>
            {description && (
              <p className="body text-foreground/60 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Current State */}
      {content.current_state && (
        <Section title="Current State" icon={MapPin}>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="heading-3 text-foreground">
                ${content.current_state.estimated_mrr?.toLocaleString() || 0}
              </span>
              <span className="body-small text-foreground/50">MRR</span>
            </div>
            <p className="body-small text-foreground/60">
              {content.current_state.reasoning}
            </p>
          </div>
        </Section>
      )}

      {/* Target */}
      {content.target && (
        <Section title="Target" icon={Target}>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="heading-3 text-action">
                ${content.target.amount?.toLocaleString() || 0}
              </span>
              <span className="body-small text-foreground/50">
                {content.target.timeframe}
              </span>
            </div>
          </div>
        </Section>
      )}

      {/* The Path */}
      {content.the_path && (
        <Section title="The Path" icon={Route}>
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-lg">
              <div>
                <p className="body-small text-foreground/50 mb-1">Monthly growth needed</p>
                <p className="body font-medium text-foreground">
                  {content.the_path.required_monthly_growth_rate}
                </p>
              </div>
              <div>
                <p className="body-small text-foreground/50 mb-1">New customers/month</p>
                <p className="body font-medium text-foreground">
                  {content.the_path.required_new_customers_per_month}
                </p>
              </div>
            </div>

            {/* Milestones */}
            {content.the_path.monthly_milestones && (
              <div className="space-y-2">
                {content.the_path.monthly_milestones.slice(0, 6).map((milestone: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <span className="body-small text-foreground">{milestone.month}</span>
                    <div className="flex items-center gap-3">
                      <span className="body-small font-medium text-foreground">
                        ${milestone.target_mrr?.toLocaleString()}
                      </span>
                      {milestone.is_achievable ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Reality Check */}
      {content.reality_check && (
        <Section title="Reality Check" icon={CheckCircle2}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="body-small text-foreground/50">Confidence:</span>
              <span className="body-small font-medium text-foreground capitalize">
                {content.reality_check.confidence_level}
              </span>
            </div>
            {content.reality_check.biggest_risks && (
              <div>
                <p className="body-small text-foreground/50 mb-2">Biggest risks:</p>
                <ul className="space-y-1">
                  {content.reality_check.biggest_risks.map((risk: string, index: number) => (
                    <li key={index} className="body-small text-foreground/70 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Next Actions */}
      {content.next_actions && content.next_actions.length > 0 && (
        <Section title="Next Actions" icon={Zap}>
          <div className="space-y-2">
            {content.next_actions.map((action: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-background rounded-lg"
              >
                <Zap className="w-5 h-5 text-action mt-0.5" />
                <div className="flex-1">
                  <p className="body-small text-foreground">{action.action}</p>
                  <span className={`body-small ${
                    action.priority === 'high' ? 'text-red-600' : 'text-foreground/50'
                  }`}>
                    {action.priority} priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// Default display for other artifact types
function DefaultArtifactDisplay({ title, description, content }: any) {
  return (
    <div className="bg-white rounded-xl border-2 border-accent-beige p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-accent-beige pb-6">
        <h2 className="heading-2 text-foreground">{title}</h2>
        {description && (
          <p className="body text-foreground/60 mt-2">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        <pre className="body-small text-foreground/70 whitespace-pre-wrap bg-background p-4 rounded-lg overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>

      {/* Note */}
      {content.note && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="body-small text-yellow-800">{content.note}</p>
        </div>
      )}
    </div>
  );
}

// Section component for consistent styling
function Section({ title, icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  const IconComponent = icon;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <IconComponent className="w-5 h-5 text-foreground/60" />
        <h3 className="heading-4 text-foreground">{title}</h3>
      </div>
      <div className="pl-7">
        {children}
      </div>
    </div>
  );
}

