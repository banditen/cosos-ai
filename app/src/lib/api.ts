import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API client functions
export const apiClient = {
  // Auth endpoints
  auth: {
    getGoogleOAuthUrl: async (userId: string): Promise<{ url: string }> => {
      const response = await api.get(`/api/v1/auth/google/url?user_id=${userId}`);
      return response.data;
    },
  },

  // Onboarding endpoints
  onboarding: {
    saveContext: async (userId: string, context: any) => {
      const response = await api.post(`/api/v1/onboarding/context?user_id=${userId}`, context);
      return response.data;
    },
    getContext: async (userId: string) => {
      const response = await api.get(`/api/v1/onboarding/context?user_id=${userId}`);
      return response.data;
    },
  },

  // Sync endpoints
  sync: {
    syncGmail: async (userId: string, daysBack: number = 7) => {
      const response = await api.post(`/api/v1/sync/gmail?user_id=${userId}&days_back=${daysBack}`);
      return response.data;
    },
    syncCalendar: async (userId: string, daysForward: number = 7) => {
      const response = await api.post(`/api/v1/sync/calendar?user_id=${userId}&days_forward=${daysForward}`);
      return response.data;
    },
    syncAll: async (userId: string) => {
      const response = await api.post(`/api/v1/sync/all?user_id=${userId}`);
      return response.data;
    },
  },

  // Brief endpoints
  briefs: {
    generate: async (userId: string, date?: string) => {
      const params = new URLSearchParams({ user_id: userId });
      if (date) params.append('brief_date', date);
      const response = await api.post(`/api/v1/briefs/generate?${params.toString()}`);
      return response.data;
    },
    get: async (userId: string, date?: string) => {
      const params = new URLSearchParams({ user_id: userId });
      if (date) params.append('brief_date', date);
      const response = await api.get(`/api/v1/briefs?${params.toString()}`);
      return response.data;
    },
    submitFeedback: async (briefId: string, feedback: any) => {
      const response = await api.post(`/api/v1/briefs/${briefId}/feedback`, feedback);
      return response.data;
    },
  },

  // Analysis endpoints
  analysis: {
    analyzeWebsite: async (url: string): Promise<{ description: string; success: boolean }> => {
      const response = await api.post('/api/v1/analysis/website', { url });
      return response.data;
    },
  },

  // Setup endpoints
  setup: {
    complete: async (userId: string, data: any) => {
      const response = await api.post(`/api/v1/setup/complete?user_id=${userId}`, data);
      return response.data;
    },
  },

  // Project endpoints
  projects: {
    list: async (userId: string, status?: string) => {
      const params = new URLSearchParams({ user_id: userId });
      if (status) params.append('status', status);
      const response = await api.get(`/api/v1/projects?${params.toString()}`);
      return response.data;
    },
    get: async (projectId: string) => {
      const response = await api.get(`/api/v1/projects/${projectId}`);
      return response.data;
    },
    create: async (userId: string, project: any) => {
      const response = await api.post(`/api/v1/projects?user_id=${userId}`, project);
      return response.data;
    },
    update: async (projectId: string, project: any) => {
      const response = await api.put(`/api/v1/projects/${projectId}`, project);
      return response.data;
    },
    delete: async (projectId: string) => {
      const response = await api.delete(`/api/v1/projects/${projectId}`);
      return response.data;
    },
  },

  // Initiative endpoints
  initiatives: {
    list: async (userId: string, status?: string) => {
      const params = new URLSearchParams({ user_id: userId });
      if (status) params.append('status', status);
      const response = await api.get(`/api/v1/initiatives?${params.toString()}`);
      return response.data;
    },
    get: async (initiativeId: string) => {
      const response = await api.get(`/api/v1/initiatives/${initiativeId}`);
      return response.data;
    },
    create: async (userId: string, initiative: any) => {
      const response = await api.post(`/api/v1/initiatives?user_id=${userId}`, initiative);
      return response.data;
    },
    update: async (initiativeId: string, initiative: any) => {
      const response = await api.put(`/api/v1/initiatives/${initiativeId}`, initiative);
      return response.data;
    },
    delete: async (initiativeId: string) => {
      const response = await api.delete(`/api/v1/initiatives/${initiativeId}`);
      return response.data;
    },
  },
};

export default apiClient;

