import { useEffect, useRef } from 'react';
import { ContentData } from '../types';
import { getContentStatus } from '../services/api';

export const useTxHashPoller = (
  items: ContentData[],
  onUpdate: (id: string, data: Partial<ContentData>) => void
) => {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const attemptsRef = useRef<Map<string, number>>(new Map());
  const startTimesRef = useRef<Map<string, number>>(new Map());
  const MAX_POLL_DURATION = 5 * 60 * 1000; // 5 min

  useEffect(() => {
    const pending = items.filter(i => i.storage === 'PENDING_0G' && !i.txHash);

    pending.forEach(item => {
      if (timersRef.current.has(item.id)) return;

      const startTime = startTimesRef.current.get(item.id) || Date.now();
      startTimesRef.current.set(item.id, startTime);

      const poll = async () => {
        const attempts = attemptsRef.current.get(item.id) || 0;

        // Stop after 5 min
        if (Date.now() - startTime > MAX_POLL_DURATION) {
          onUpdate(item.id, { storage: 'FAILED' });
          timersRef.current.delete(item.id);
          attemptsRef.current.delete(item.id);
          startTimesRef.current.delete(item.id);
          return;
        }

        try {
          const data = await getContentStatus(item.id);
          
          if (data.txHash && data.storage === '0G_GALILEO') {
            onUpdate(item.id, {
              txHash: data.txHash,
              hash: data.rootHash,
              storage: '0G_GALILEO',
              updatedAt: Date.now()
            });
            timersRef.current.delete(item.id);
            attemptsRef.current.delete(item.id);
            startTimesRef.current.delete(item.id);
          } else {
            attemptsRef.current.set(item.id, attempts + 1);
            const delay = Math.min(3000 + attempts * 500, 15000);
            timersRef.current.set(item.id, setTimeout(poll, delay));
          }
        } catch (e) {
          attemptsRef.current.set(item.id, attempts + 1);
          timersRef.current.set(item.id, setTimeout(poll, 5000));
        }
      };

      poll();
    });

    // Cleanup removed items
    const pendingIds = new Set(pending.map(i => i.id));
    timersRef.current.forEach((timer, id) => {
      if (!pendingIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
        attemptsRef.current.delete(id);
        startTimesRef.current.delete(id);
      }
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
      attemptsRef.current.clear();
      startTimesRef.current.clear();
    };
  }, [items, onUpdate]);
};
