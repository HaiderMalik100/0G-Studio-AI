import { uploadTo0G, saveUserHash } from "./ogStorage";

const queue: any[] = [];
let processing = false;

const MAX_RETRIES = 3;

export const addTo0GQueue = (data: any) => {
  console.log("[0G QUEUE] Added:", data.id);

  queue.push({ ...data, retries: 0 });
  processQueue();
};

const sleep = (ms: number) =>
  new Promise((r) => setTimeout(r, ms));

const processQueue = async () => {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const item = queue[0];

    try {
      console.log(
        `[0G QUEUE] Uploading ${item.id} attempt ${item.retries + 1}`
      );

      const result = await uploadTo0G(item);

      if (!result?.rootHash) {
        throw new Error("No rootHash returned");
      }

      console.log("[0G QUEUE] SUCCESS:", result);

      await saveUserHash(
        item.userAddress,
        result.rootHash,
        result.txHash || null
      );

      queue.shift();

    } catch (err: any) {
      console.error("[0G QUEUE ERROR]", item.id, err.message);

      item.retries++;

      queue.shift();

      if (item.retries < MAX_RETRIES) {
        console.log(`[0G RETRY] ${item.id} -> ${item.retries}`);

        queue.push(item);
        await sleep(5000 * item.retries);
      } else {
        console.error("[0G DROPPED]", item.id);
      }
    }
  }

  processing = false;
};