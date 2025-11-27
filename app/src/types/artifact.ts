// Artifact types for prompt-driven artifact generation

export type ArtifactComponentType = 
  | 'MetricCard'
  | 'DataList'
  | 'ProgressBar'
  | 'InputForm'
  | 'TextBlock';

export interface MetricCardConfig {
  title: string;
  value: number | string;
  target?: number | string;
  unit?: string;
  icon?: string; // Lucide icon name
  description?: string;
}

export interface DataListConfig {
  title: string;
  items: any[];
  fields: string[];
  emptyMessage?: string;
}

export interface ProgressBarConfig {
  title: string;
  value: number;
  max: number;
  showPercentage?: boolean;
  description?: string;
}

export interface InputFormConfig {
  title: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit?: string; // Action name to trigger
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
}

export interface TextBlockConfig {
  text: string;
  variant?: 'default' | 'info' | 'warning' | 'success';
}

export interface ArtifactComponent {
  id: string;
  type: ArtifactComponentType;
  config: MetricCardConfig | DataListConfig | ProgressBarConfig | InputFormConfig | TextBlockConfig;
}

export interface ArtifactContent {
  components: ArtifactComponent[];
  data: Record<string, any>; // User-entered data
}

export interface Artifact {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description?: string;
  prompt: string;
  content: ArtifactContent;
  metadata?: Record<string, any>;
  status: 'active' | 'archived' | 'deleted';
  integrations_connected?: string[];
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ArtifactCreateRequest {
  prompt: string;
  context?: {
    stage?: string;
    goal?: string;
    challenge?: string;
  };
}

export interface ArtifactResponse {
  artifact: Artifact;
  message?: string;
}

