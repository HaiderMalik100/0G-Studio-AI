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
  updatedAt?: number; // Add this
  hash?: string | null; // rootHash for 0G download
  txHash?: string | null; // transaction hash for explorer
  storage?: '0G_GALILEO' | 'PENDING_0G' | 'FAILED';
  status?: string;
}
