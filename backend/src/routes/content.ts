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
    if (!prompt ||!type) return res.status(400).json({ error: 'Missing prompt or type' });

    // 1. Generate content - must succeed or we fail fast
    const result = await generateWithAI(prompt, type);
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

    // Process final items first, then pending. Dedupe by content ID
    const seenIds = new Set<string>();
    const data = [];

    for (const { rootHash, txHash } of hashes.reverse()) {
      try {
        let item: ContentData | null = null;

        if (rootHash.startsWith('PENDING:')) {
          const pendingId = rootHash.split(':')[1];
          item = await readPendingData(user, pendingId);
          if (item) {
            item = {...item, hash: null, txHash: null, storage: 'PENDING_0G' as const };
          }
        } else {
          item = await downloadFrom0G(rootHash);
          item = {...item, hash: rootHash, txHash, storage: '0G_GALILEO' as const };
        }

        if (item &&!seenIds.has(item.id)) {
          seenIds.add(item.id);
          data.push(item);
        }
      } catch (e: any) {
        console.warn(`[LIBRARY] Skipping hash ${rootHash}:`, e.message);
      }
    }

    return res.json(data.sort((a, b) => b!.createdAt - a!.createdAt));
  } catch (err: any) {
    return res.status(500).json({ error: 'Library failed', detail: err.message });
  }
});

// NEW: Check status of a pending content (for polling txHash)
router.get('/generate/status/:contentId', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address;
  const { contentId } = req.params;

  try {
    const hashes = await getUserHashes(user);
    
    // Look for this content ID in the manifest
    for (const { rootHash, txHash } of hashes) {
      // Check if this is a completed upload with our content
      if (!rootHash.startsWith('PENDING:')) {
        try {
          const item = await downloadFrom0G(rootHash);
          if (item?.id === contentId) {
            return res.json({
              contentId,
              txHash: txHash || null,
              storage: '0G_GALILEO',
              rootHash
            });
          }
        } catch (e) {
          // Continue searching
        }
      }
    }

    // Not found in 0G yet - still pending
    return res.json({
      contentId,
      txHash: null,
      storage: 'PENDING_0G'
    });

  } catch (err: any) {
    return res.status(500).json({ error: 'Status check failed', detail: err.message });
  }
});

export default router;
