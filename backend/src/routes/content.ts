import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { generateWithGroq } from '../services/groq';
import { addTo0GQueue } from '../services/ogQueue';
import { getUserHashes, downloadFrom0G, readPendingData } from '../services/ogStorage';
import { ContentData } from '../types';

const router = Router();

router.post('/generate', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address;
  try {
    const { prompt, type, chatId } = req.body;
    if (!prompt ||!type) return res.status(400).json({ error: 'Missing prompt or type' });

    // 1. Generate content - must succeed or we fail fast
    const result = await generateWithGroq(prompt, type);
    const data: ContentData = {
      id: uuid(),
      chatId: chatId || uuid(), // Handle if frontend doesn't send chatId
      userAddress: user,
      type,
      prompt,
      content: result.content,
      wordCount: result.wordCount,
      qualityScore: result.qualityScore,
      createdAt: Date.now()
    };

    // 2. Send to frontend IMMEDIATELY - don't wait for 0G
    res.json({
     ...data,
      hash: null,
      txHash: null,
      storage: 'PENDING_0G',
      status: 'GENERATED'
    });

    // 3. Upload to 0G in background - never blocks response
    addTo0GQueue(data);

  } catch (err: any) {
    console.error('GENERATE ERROR:', err);
    return res.status(500).json({ error: 'Generation failed', detail: err.message });
  }
});

router.get('/library', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address;
  try {
    const hashes = await getUserHashes(user);
    const data = await Promise.all(
      hashes.map(async ({ rootHash, txHash }) => {
        try {
          // Handle pending entries
          if (rootHash.startsWith('PENDING:')) {
            const pendingId = rootHash.split(':')[1];
            const pendingData = await readPendingData(user, pendingId);
            if (pendingData) {
              return {...pendingData, hash: null, txHash: null, storage: 'PENDING_0G' as const };
            }
            return null;
          }

          const item = await downloadFrom0G(rootHash);
          return {...item, hash: rootHash, txHash, storage: '0G_GALILEO' as const };
        } catch (e: any) {
          console.warn(`[LIBRARY] Skipping hash ${rootHash} - download failed:`, e.message);
          return null;
        }
      })
    );
    return res.json(data.filter(Boolean).sort((a, b) => b!.createdAt - a!.createdAt));
  } catch (err: any) {
    return res.status(500).json({ error: 'Library failed', detail: err.message });
  }
});

export default router;
