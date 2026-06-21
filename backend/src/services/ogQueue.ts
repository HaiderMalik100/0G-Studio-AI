import { uploadTo0G, saveUserHash, savePendingEntry, savePendingData } from './ogStorage';
import { ContentData } from '../types';

interface QueueItem extends ContentData {
  retries: number;
}

const queue: QueueItem[] = [];
let isProcessing = false;
const MAX_RETRIES = 3;

export const addTo0GQueue = (data: ContentData) => {
  console.log(`[0G QUEUE] Added item ${data.id} to queue`);

  // Save pending state so UI can show it immediately
  savePendingEntry(data.userAddress, data.id);
  savePendingData(data.userAddress, data);

  queue.push({...data, retries: 0 });
  if (!isProcessing) processQueue();
};

const processQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  while (queue.length > 0) {
    const item = queue[0];

    try {
      console.log(`[0G QUEUE] Uploading ${item.id}, attempt ${item.retries + 1}`);
      const { rootHash, txHash } = await uploadTo0G(item);

      if (!rootHash) {
        throw new Error('uploadTo0G returned empty rootHash');
      }

      await saveUserHash(item.userAddress, rootHash, txHash);

      console.log(`[0G QUEUE] SUCCESS: ${item.id} -> tx: ${txHash} root: ${rootHash}`);
      queue.shift(); // Only remove on success

    } catch (err: any) {
      console.error(`[0G QUEUE] FAILED ${item.id}:`, err.message);
      item.retries++;

      queue.shift(); // Remove failed attempt

      if (item.retries >= MAX_RETRIES) {
        console.error(`[0G QUEUE] DROPPED ${item.id} after ${MAX_RETRIES} retries`);
      } else {
        console.log(`[0G QUEUE] RETRY ${item.id} -> ${item.retries}`);
        queue.push(item); // Re-queue at end
        await new Promise(r => setTimeout(r, 5000 * item.retries)); // Exponential backoff
      }
    }
  }

  isProcessing = false;
  console.log(`[0G QUEUE] Queue empty`);
};
