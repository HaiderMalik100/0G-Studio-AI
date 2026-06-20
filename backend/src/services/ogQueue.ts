import { uploadTo0G, saveUserHash } from './ogStorage';
import { ContentData } from '../types';

interface QueueItem extends ContentData {
  retries: number;
}

const queue: QueueItem[] = [];
let isProcessing = false;
const MAX_RETRIES = 5;

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
      console.log(`[0G QUEUE] Uploading ${item.id}, attempt ${item.retries + 1}`);
      const { rootHash, txHash } = await uploadTo0G(item);

      if (!rootHash) {
        throw new Error('uploadTo0G returned empty rootHash');
      }

      // Save manifest only once for the final uploaded content
      await saveUserHash(item.userAddress, rootHash, txHash);

      console.log(`[0G QUEUE] SUCCESS: ${item.id} -> tx: ${txHash} root: ${rootHash}`);
      queue.shift();

    } catch (err: any) {
      console.error(`[0G QUEUE] FAILED ${item.id}:`, err?.stack || err);
      item.retries++;
      if (item.retries >= MAX_RETRIES) {
        console.error(`[0G QUEUE] DROPPED ${item.id} after ${MAX_RETRIES} retries`);
        queue.shift();
      } else {
        queue.shift();
        queue.push(item);
        const backoff = ['marketing','linkedin'].includes(item.type as string) ? 30000 : 10000;
        console.log(`[0G QUEUE] Retrying ${item.id} after ${backoff}ms`);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }

  isProcessing = false;
  console.log(`[0G QUEUE] Queue empty`);
};

