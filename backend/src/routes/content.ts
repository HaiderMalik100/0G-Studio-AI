import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { generateWithGroq } from '../services/groq';
import { addTo0GQueue } from '../services/ogQueue'; // Use queue instead of direct upload
import { getUserHashes, downloadFrom0G, savePendingEntry, savePendingData, readPendingData } from '../services/ogStorage';

const router = Router();

router.post('/generate', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address;

  try {
    const { prompt, type, chatId } = req.body;

    if (!prompt || !type || !chatId)
      return res.status(400).json({ error: 'Missing fields' });

    const result = await generateWithGroq(prompt, type);

    const data = {
      id: uuid(),
      chatId,
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

    addTo0GQueue(data);

  } catch (err: any) {
    console.error('GENERATE ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/library', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address;
  try {
    const hashes = await getUserHashes(user); // Now returns { rootHash, txHash }[]
    const data = await Promise.all(
      hashes.map(async ({ rootHash, txHash }) => {
        try {
          if (typeof rootHash === 'string' && rootHash.startsWith('PENDING:')) {
            const pendingId = rootHash.split(':')[1];
            const pending = await readPendingData(user, pendingId);
            if (pending) {
              return { ...pending, hash: null, txHash: null, storage: 'PENDING_0G' as const, status: 'PENDING' };
            }
            // fallback placeholder
            return { id: pendingId, chatId: null, userAddress: user, type: 'unknown', content: '', wordCount: 0, qualityScore: 0, createdAt: Date.now(), hash: null, txHash: null, storage: 'PENDING_0G' as const, status: 'PENDING' };
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