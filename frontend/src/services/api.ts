import axios from 'axios';
import { ContentType } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt'); // Changed from 'token' to 'jwt' to match useAuth
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// FIX: Add back missing exports
export const getNonce = (address: string) =>
  api.post('/auth/nonce', { address });

export const verifySignature = (address: string, signature: string) =>
  api.post('/auth/verify', { address, signature });

export const generateContent = (
  prompt: string,
  type: ContentType,
  chatId: string
) => api.post('/api/content/generate', { prompt, type, chatId });

export const getLibrary = (params: { limit?: number; offset?: number } = {}) =>
  api.get('/api/content/library', { params }).then(r => r.data);

export const getContentStatus = (contentId: string) =>
  api.get(`/api/content/generate/status/${contentId}`).then(r => r.data);