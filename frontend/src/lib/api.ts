import axios from 'axios';

// In production, API is served from the same origin
// In development, use VITE_API_URL or localhost
const API_BASE_URL = import.meta.env.PROD
  ? '' // Same origin in production
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const domainsApi = {
  getAll: () => api.get('/api/domains'),
  getById: (id: string) => api.get(`/api/domains/${id}`),
  create: (data: any) => api.post('/api/domains', data),
  update: (id: string, data: any) => api.put(`/api/domains/${id}`, data),
  delete: (id: string) => api.delete(`/api/domains/${id}`),
};

export const mcpsApi = {
  getAll: () => api.get('/api/mcps'),
  getById: (id: string) => api.get(`/api/mcps/${id}`),
  create: (data: any) => api.post('/api/mcps', data),
  update: (id: string, data: any) => api.put(`/api/mcps/${id}`, data),
  delete: (id: string) => api.delete(`/api/mcps/${id}`),
};

export const agentsApi = {
  getAll: () => api.get('/api/agents'),
  getById: (id: string) => api.get(`/api/agents/${id}`),
  create: (data: any) => api.post('/api/agents', data),
  update: (id: string, data: any) => api.put(`/api/agents/${id}`, data),
  delete: (id: string) => api.delete(`/api/agents/${id}`),
  getCategories: () => api.get('/api/agents/categories/all'),
};

export const workflowsApi = {
  getAll: () => api.get('/api/workflows'),
  getById: (id: string) => api.get(`/api/workflows/${id}`),
  create: (data: any) => api.post('/api/workflows', data),
  update: (id: string, data: any) => api.put(`/api/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/api/workflows/${id}`),
};

export const toolsApi = {
  getAll: () => api.get('/api/tools'),
  getById: (id: string) => api.get(`/api/tools/${id}`),
  create: (data: any) => api.post('/api/tools', data),
  update: (id: string, data: any) => api.put(`/api/tools/${id}`, data),
  delete: (id: string) => api.delete(`/api/tools/${id}`),
};
