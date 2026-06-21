import { useEffect, useRef } from 'react';
import { ContentData } from '../types';

interface PollingConfig {
  initialInterval?: number;
  maxInterval?: number;
  backoffMultiplier?: number;
}

export const useTxHashPoller = (
  messages: ContentData[],
  onUpdate: (contentId: string, txHash: string) => void,
  config: PollingConfig = {}
) => {
  const {
    initialInterval = 3000,      // Start at 3 seconds
    maxInterval = 30000,         // Max 30 seconds
    backoffMultiplier = 1.5,
  } = config;

  const intervalsRef = useRef<Map<string, { timerId: number; currentInterval: number }>>(
    new Map()
  );

  useEffect(() => {
    // Find all pending messages
    const pendingMessages = messages.filter(
      (m) => m.storage === 'PENDING_0G' && !m.txHash
    );

    pendingMessages.forEach((msg) => {
      // Skip if already polling this message
      if (intervalsRef.current.has(msg.id)) return;

      let currentInterval = initialInterval;

      const poll = async () => {
        try {
          const response = await fetch(`/api/content/generate/status/${msg.id}`);
          const data = await response.json();

          if (data.txHash && data.storage === '0G_GALILEO') {
            // Found the txHash! Notify parent and stop polling
            onUpdate(msg.id, data.txHash);
            
            const timer = intervalsRef.current.get(msg.id);
            if (timer) {
              clearInterval(timer.timerId);
              intervalsRef.current.delete(msg.id);
            }
          } else {
            // Still pending, increase interval with backoff
            currentInterval = Math.min(
              currentInterval * backoffMultiplier,
              maxInterval
            );
          }
        } catch (err) {
          console.error(`Failed to poll status for ${msg.id}:`, err);
        }
      };

      // Initial immediate poll
      poll();

      // Set up recurring poll with backoff
      const timerId = window.setInterval(poll, currentInterval) as unknown as number;
      intervalsRef.current.set(msg.id, { timerId, currentInterval });
    });

    // Cleanup function
    return () => {
      // Clear intervals for messages that are no longer pending
      const pendingIds = new Set(pendingMessages.map((m) => m.id));
      
      intervalsRef.current.forEach((timer, contentId) => {
        if (!pendingIds.has(contentId)) {
          clearInterval(timer.timerId);
          intervalsRef.current.delete(contentId);
        }
      });
    };
  }, [messages, onUpdate, initialInterval, maxInterval, backoffMultiplier]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(({ timerId }) => clearInterval(timerId));
      intervalsRef.current.clear();
    };
  }, []);
};