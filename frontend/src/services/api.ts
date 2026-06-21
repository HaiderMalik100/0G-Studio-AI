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
  axios.post<ContentData & { hash: string | null; txHash: string | null; storage: string; status: string }>(
    `${API}/api/content/generate`, // <- FIXED
    { prompt, type, chatId },
    authHeader()
  );

export const getLibrary = () =>
  axios.get<(ContentData & { hash: string | null; txHash: string | null; storage: string })[]>(
    `${API}/api/content/library`, // <- FIXED
    authHeader()
  );


export const getContentStatus = (id: string) =>
  axios.get<ContentData & { hash: string | null; txHash: string | null; storage: string }>(
    `${API}/api/content/status/${id}`,
    authHeader()
  );


export const checkGenerationStatus = (contentId: string) =>
  axios.get<ContentData & { hash: string | null; txHash: string | null; storage: string }>(
    `${API}/api/content/generate/status/${contentId}`,
    authHeader()
  );
