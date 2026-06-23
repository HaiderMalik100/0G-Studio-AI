import { uploadTo0G } from './ogStorage';
import { ContentData } from '../types';
import { chats } from '../db/mongo';

interface QueueItem extends ContentData {
  retries: number;
}

const queue: QueueItem[] = [];
let isProcessing = false;
const MAX_RETRIES = 3;

export const addTo0GQueue = (data: ContentData) => {
  console.log(`[0G QUEUE] Added item ${data.id} to queue`);
  queue.push({...data, retries: 0 });
  if (!isProcessing) processQueue();
};

const processQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  while (queue.length > 0) {
    const item = queue[0];

    try {
      // Check Mongo is ready
      if (!chats) {
        console.error(`[0G QUEUE] Mongo not ready, requeue ${item.id}`);
        await new Promise(r => setTimeout(r, 2000));
        continue; // Don't shift, retry
      }

      console.log(`[0G QUEUE] Uploading ${item.id}, attempt ${item.retries + 1}`);
      const { rootHash, txHash } = await uploadTo0G(item);

      if (!rootHash) throw new Error('uploadTo0G returned empty rootHash');

      const result = await chats.updateOne(
        { id: item.id },
        {
          $set: {
            hash: rootHash,
            txHash: txHash || null,
            storage: '0G_GALILEO',
            updatedAt: Date.now()
          }
        }
      );

      if (result.matchedCount === 0) {
        console.error(`[0G QUEUE] WARNING: No Mongo doc found for ${item.id}`);
      }

      console.log(`[0G QUEUE] SUCCESS: ${item.id} -> tx: ${txHash} root: ${rootHash}`);
      queue.shift();

    } catch (err: any) {
      console.error(`[0G QUEUE] FAILED ${item.id}:`, err.message);
      item.retries++;
      queue.shift();

      if (item.retries >= MAX_RETRIES) {
        console.error(`[0G QUEUE] DROPPED ${item.id} after ${MAX_RETRIES} retries`);
        if (chats) { // Check chats exists before using
          await chats.updateOne(
            { id: item.id },
            { $set: { storage: 'FAILED', updatedAt: Date.now() } }
          ).catch(() => {});
        }
      } else {
        console.log(`[0G QUEUE] RETRY ${item.id} -> ${item.retries}`);
        queue.push(item);
        await new Promise(r => setTimeout(r, 5000 * item.retries));
      }
    }
  }

  isProcessing = false;
  console.log(`[0G QUEUE] Queue empty`);
};
