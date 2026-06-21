import { uploadTo0G, saveUserHash, savePendingEntry, savePendingData } from './ogStorage';
import { ContentData } from '../types';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface QueueItem extends ContentData {
  retries: number;
  addedAt: number;
}

const QUEUE_PATH = path.join(os.tmpdir(), '0g_queue.json');
const MAX_RETRIES = 3;
let isProcessing = false;

const readQueue = (): QueueItem[] => {
  try {
    return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  } catch {
    return [];
  }
};

const writeQueue = (q: QueueItem[]) => {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(q));
};

export const addTo0GQueue = (data: ContentData) => {
  console.log(`[0G QUEUE] Added ${data.id}`);
  
  savePendingEntry(data.userAddress, data.id);
  savePendingData(data.userAddress, data);
  
  const queue = readQueue();
  queue.push({...data, retries: 0, addedAt: Date.now() });
  writeQueue(queue);
  
  if (!isProcessing) processQueue();
};

const processQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  while (true) {
    const queue = readQueue();
    if (queue.length === 0) break;

    const item = queue[0];
    try {
      console.log(`[0G QUEUE] Uploading ${item.id}, attempt ${item.retries + 1}`);
      const { rootHash, txHash } = await uploadTo0G(item);
      await saveUserHash(item.userAddress, rootHash, txHash);
      console.log(`[0G QUEUE] SUCCESS: ${item.id}`);
      
      writeQueue(queue.slice(1)); // Remove on success
    } catch (err: any) {
      console.error(`[0G QUEUE] FAILED ${item.id}:`, err.message);
      item.retries++;
      
      if (item.retries >= MAX_RETRIES) {
        console.error(`[0G QUEUE] DROPPED ${item.id}`);
        writeQueue(queue.slice(1));
      } else {
        item.addedAt = Date.now();
        writeQueue([...queue.slice(1), item]); // Move to end
        await new Promise(r => setTimeout(r, 5000 * item.retries));
      }
    }
  }

  isProcessing = false;
};

// CRITICAL: Resume queue on server restart
processQueue();
