export interface ContentData {
  id: string;
  chatId: string;
  userAddress: string;
  type: 'tweet' | 'blog' | 'linkedin' | 'marketing';
  prompt: string;
  content: string;
  wordCount: number;
  qualityScore: number;
  createdAt: number;
  updatedAt?: number;
  hash?: string | null;
  txHash?: string | null;
  storage?: '0G_GALILEO' | 'PENDING_0G' | 'FAILED';
  status?: string;
}

export type ContentType = 'tweet' | 'blog' | 'linkedin' | 'marketing';
