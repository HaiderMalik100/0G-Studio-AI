import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { generateWithAI } from '../services/ai';
import { addTo0GQueue } from '../services/ogQueue';
import { chats } from '../db/mongo';
import { ContentData } from '../types';

const router = Router();

router.post('/generate', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address.toLowerCase();
  
  try {
    const { prompt, type, chatId } = req.body;
    if (!prompt?.trim() || !type) {
      return res.status(400).json({ error: 'Missing prompt or type' });
    }

    // 1. Generate AI content - fail fast if this errors
    const result = await generateWithAI(prompt, type);
    
    const id = uuid();
    const data: ContentData = {
      id,
      chatId: chatId || uuid(),
      userAddress: user,
      type,
      prompt: prompt.trim(),
      content: result.content,
      wordCount: result.wordCount,
      qualityScore: result.qualityScore,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      hash: null,
      txHash: null,
      storage: 'PENDING_0G'
    };

    // 2. Save to Mongo FIRST - instant, this is source of truth
    await chats.insertOne(data);

    // 3. Return to frontend IMMEDIATELY - don't wait for 0G
    res.json({
      ...data,
      status: 'GENERATED'
    });

    // 4. Upload to 0G in background - never blocks response
    addTo0GQueue(data);

  } catch (err: any) {
    console.error('GENERATE ERROR:', err);
    return res.status(500).json({ 
      error: 'Generation failed', 
      detail: err.message 
    });
  }
});

router.get('/library', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address.toLowerCase();
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    // FAST: Read only from MongoDB. No 0G calls = 50ms response
    const data = await chats
      .find({ userAddress: user })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .project({ _id: 0 }) // remove Mongo _id from response
      .toArray();

    const total = await chats.countDocuments({ userAddress: user });
    
    res.json({ 
      data, 
      hasMore: offset + data.length < total,
      total 
    });
  } catch (err: any) {
    console.error('LIBRARY ERROR:', err);
    return res.status(500).json({ 
      error: 'Library failed', 
      detail: err.message 
    });
  }
});

// Poll this to get txHash after 0G upload completes
router.get('/generate/status/:contentId', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!.address.toLowerCase();
  const { contentId } = req.params;

  try {
    const item = await chats.findOne(
      { id: contentId, userAddress: user },
      { projection: { _id: 0, id: 1, txHash: 1, storage: 1, hash: 1 } }
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json({
      contentId: item.id,
      txHash: item.txHash || null,
      storage: item.storage,
      rootHash: item.hash || null
    });
  } catch (err: any) {
    console.error('STATUS ERROR:', err);
    return res.status(500).json({ 
      error: 'Status check failed', 
      detail: err.message 
    });
  }
});

export default router;
