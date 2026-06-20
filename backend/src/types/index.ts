import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: { address: string };
}

export type ContentType = 'tweet' | 'blog' | 'linkedin' | 'marketing';

export interface ContentData {
  id: string;
  chatId: string;
  userAddress: string;
  type: ContentType;
  prompt: string;
  content: string;
  wordCount: number;
  qualityScore: number;
  createdAt: number;
  hash?: string | null; // rootHash for download
  txHash?: string | null; // transaction hash for explorer
  storage?: '0G_GALILEO' | 'PENDING_0G' | 'FAILED';
  status?: string;
}

