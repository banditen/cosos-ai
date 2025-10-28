// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserContext {
  id: string;
  user_id: string;
  business_type?: string;
  business_stage?: string;
  key_goals?: string[];
  pain_points?: string[];
  work_hours?: {
    start: string;
    end: string;
  };
  timezone?: string;
  created_at: string;
  updated_at: string;
}

// Brief types
export interface Priority {
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  estimated_time?: string;
  related_project?: string;
}

export interface TimeBlock {
  start_time: string;
  end_time: string;
  purpose: string;
  reasoning: string;
}

export interface QuickWin {
  task: string;
  estimated_time: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Flag {
  type: 'warning' | 'opportunity' | 'blocker';
  title: string;
  description: string;
  action?: string;
}

export interface DailyBrief {
  id: string;
  user_id: string;
  brief_date: string;
  priorities: Priority[];
  time_blocks: TimeBlock[];
  quick_wins: QuickWin[];
  flags: Flag[];
  summary?: string;
  created_at: string;
  updated_at: string;
}

// Project types
export interface Project {
  id: string;
  user_id: string;
  initiative_id?: string;
  name: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  priority: 'high' | 'medium' | 'low';
  start_date?: string;
  target_date?: string;
  completion_date?: string;
  progress_percentage?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Initiative {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  priority: 'high' | 'medium' | 'low';
  start_date?: string;
  target_date?: string;
  completion_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Integration types
export interface Integration {
  id: string;
  user_id: string;
  provider: 'google' | 'microsoft';
  integration_type: 'gmail' | 'calendar' | 'both';
  access_token: string;
  refresh_token?: string;
  token_expiry?: string;
  is_active: boolean;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

