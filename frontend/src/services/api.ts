import axios from 'axios';
import { ContentData, ContentType } from '../types';

const API = import.meta.env.VITE_BACKEND_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }
});

export const getNonce = (address: string) =>
  axios.post(`${API}/auth/nonce`, { address });

export const verifySignature = (address: string, signature: string) =>
  axios.post(`${API}/auth/verify`, { address, signature });

// Changed: added chatId param
export const generateContent = (prompt: string, type: ContentType, chatId: string) =>
  axios.post<ContentData & { hash: string; explorerUrl: string }>(
    `${API}/api/generate`,
    { prompt, type, chatId },
    authHeader()
  );

export const getLibrary = () =>
  axios.get<(ContentData & { hash: string })[]>(`${API}/api/library`, authHeader());

