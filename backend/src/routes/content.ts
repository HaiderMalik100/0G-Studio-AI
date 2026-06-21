import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { generateWithAI } from '../services/ai';
import { addTo0GQueue } from '../services/ogQueue';
import { getUserHashes, downloadFrom0G, readPendingData } from '../services/ogStorage';
import { ContentData } from '../types';

const router = Router();

router.post('/generate', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address;
  try {
    const { prompt, type, chatId } = req.body;
    if (!prompt || !type) return res.status(400).json({ error: 'Missing prompt or type' });

   const result = await generateWithAI(prompt, type);
    const data: ContentData = {
      id: uuid(),
      chatId: chatId || uuid(),
      userAddress: user,
      type,
      prompt,
      content: result.content,
      wordCount: result.wordCount,
      qualityScore: result.qualityScore,
      createdAt: Date.now()
    };

    res.json({
      ...data,
      hash: null,
      txHash: null,
      storage: 'PENDING_0G',
      status: 'GENERATED'
    });

    // CRITICAL: Catch errors so they don't crash the request
    Promise.resolve().then(() => addTo0GQueue(data)).catch(err => {
      console.error('[0G QUEUE ADD FAILED]', err.message);
    });

  } catch (err: any) {
    console.error('GENERATE ERROR:', err);
    return res.status(500).json({ error: 'Generation failed', detail: err.message });
  }
});

router.get('/library', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address;
  try {
    const hashes = await getUserHashes(user);
    const seenIds = new Set<string>();
    const data = [];

    for (const { rootHash, txHash } of hashes.reverse()) {
      try {
        let item: ContentData | null = null;

        if (rootHash.startsWith('PENDING:')) {
          const pendingId = rootHash.split(':')[1];
          item = await readPendingData(user, pendingId);
          if (item) {
            item = { ...item, hash: null, txHash: null, storage: 'PENDING_0G' as const };
          }
        } else {
          item = await downloadFrom0G(rootHash);
          item = { ...item, hash: rootHash, txHash, storage: '0G_GALILEO' as const };
        }

        if (item && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          data.push(item);
        }
      } catch (e: any) {
        console.warn(`[LIBRARY] Skipping hash ${rootHash}:`, e.message);
      }
    }

    return res.json(data.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0)));
  } catch (err: any) {
    return res.status(500).json({ error: 'Library failed', detail: err.message });
  }
});

router.get('/status/:id', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address;
  try {
    const hashes = await getUserHashes(user);
    
    // Check pending first
    const pendingEntry = hashes.find(h => h.rootHash === `PENDING:${req.params.id}`);
    if (pendingEntry) {
      const item = await readPendingData(user, req.params.id);
      if (item) {
        return res.json({ ...item, hash: null, txHash: null, storage: 'PENDING_0G' });
      }
    }
    
    // Check finalized
    for (const { rootHash, txHash } of hashes) {
      if (rootHash.startsWith('PENDING:')) continue;
      try {
        const item = await downloadFrom0G(rootHash);
        if (item.id === req.params.id) {
          return res.json({ ...item, hash: rootHash, txHash, storage: '0G_GALILEO' });
        }
      } catch {}
    }
    
    return res.json({ id: req.params.id, storage: 'PENDING_0G', txHash: null });
  } catch {
    return res.json({ id: req.params.id, storage: 'PENDING_0G', txHash: null });
  }
});

export default router;
