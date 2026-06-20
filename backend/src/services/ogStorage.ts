import { ethers } from 'ethers';
import { ContentData } from '../types';
import fs from 'fs';
import path from 'path';
import os from 'os';

let ZgFile: any, Indexer: any;

const loadSDK = async () => {
  if (!ZgFile) {
    console.log('[0G] Loading 0G SDK...');
    const sdk = await import('@0gfoundation/0g-storage-ts-sdk');
    ZgFile = sdk.ZgFile;
    Indexer = sdk.Indexer;
    console.log('[0G] SDK loaded');
  }
};

const getRpcUrl = () => {
  const url = process.env.OG_EVM_RPC;
  if (!url) throw new Error('OG_EVM_RPC missing in.env');
  return url;
};

const getIndexerRpc = () => {
  const url = process.env.OG_INDEXER_RPC;
  if (!url) throw new Error('OG_INDEXER_RPC missing in.env');
  return url;
};

const getPrivateKey = () => {
  const pk = process.env.OG_PRIVATE_KEY;
  if (!pk) throw new Error('OG_PRIVATE_KEY missing in.env');
  if (!pk.startsWith('0x')) throw new Error('OG_PRIVATE_KEY must start with 0x');
  return pk;
};

const getSigner = () => {
  const pk = getPrivateKey();
  const rpc = getRpcUrl();
  const provider = new ethers.JsonRpcProvider(rpc);
  return new ethers.Wallet(pk, provider);
};

const getIndexer = async () => {
  await loadSDK();
  return new Indexer(getIndexerRpc());
};

const getTmpPath = (name: string) => path.join(os.tmpdir(), name);

export const uploadTo0G = async (data: ContentData) => {
  await loadSDK();

  const tmpPath = getTmpPath(`${data.id}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));

  let file: any;

  try {
    file = await ZgFile.fromFilePath(tmpPath);

    const indexer = await getIndexer();
    const signer = getSigner();

    const [tx, err] = await indexer.upload(file, getRpcUrl(), signer);

    if (err) {
      console.error("[0G] upload error:", err);
      throw new Error(err);
    }

    // ✅ SUPER ROBUST ROOT HASH EXTRACTION
    const rootHash =
      tx?.rootHash ||
      tx?.data?.rootHash ||
      tx?.output?.rootHash ||
      tx?.result?.rootHash ||
      (Array.isArray(tx?.rootHashes) ? tx.rootHashes[0] : null) ||
      (Array.isArray(tx) ? tx?.[0]?.rootHash : null);

    const txHash =
      tx?.txHash ||
      tx?.transactionHash ||
      tx?.hash ||
      tx?.output?.txHash ||
      tx?.data?.txHash ||
      "";

    if (!rootHash) {
      console.error("❌ FULL 0G RESPONSE:", tx);
      throw new Error("Missing rootHash from 0G response");
    }

    console.log("[0G SUCCESS]");
    console.log("rootHash:", rootHash);
    console.log("txHash:", txHash);

    return { rootHash, txHash };

  } catch (e) {
    console.error("[0G UPLOAD FAILED]", e);
    throw e;
  } finally {
    if (file) await file.close().catch(() => {});
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
};


export const downloadFrom0G = async (rootHash: string): Promise<ContentData> => {
  if (!rootHash) throw new Error('rootHash is required');
  await loadSDK();
  const indexer = await getIndexer();
  const tmpPath = getTmpPath(`dl_${Date.now()}`);

  try {
    const err = await indexer.download(rootHash, tmpPath, true);
    if (err!== null) throw new Error(`Download error: ${err}`);
    const buf = fs.readFileSync(tmpPath);
    return JSON.parse(buf.toString()) as ContentData;
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
};

const getManifestPath = () => path.join(os.tmpdir(), '0g_manifests.json');

type ManifestEntry = { rootHash: string; txHash?: string | null };

const readManifests = (): Record<string, ManifestEntry[]> => {
  try {
    const rawAny = JSON.parse(fs.readFileSync(getManifestPath(), 'utf-8')) as Record<string, any[]>;
    const out: Record<string, ManifestEntry[]> = {};
    for (const k of Object.keys(rawAny)) {
      const arr = (rawAny[k] || []).map((e: any) => {
        if (!e) return null;
        if (typeof e === 'string') return { rootHash: e, txHash: null };
        if (typeof e === 'object' && e.rootHash) return { rootHash: e.rootHash, txHash: e.txHash ?? null };
        return null;
      }).filter(Boolean) as ManifestEntry[];
      if (arr.length) out[k] = arr;
    }
    return out;
  } catch {
    return {};
  }
};

const writeManifests = (data: Record<string, ManifestEntry[]>) => {
  fs.writeFileSync(getManifestPath(), JSON.stringify(data));
};

export const savePendingEntry = async (userAddress: string, pendingId: string): Promise<void> => {
  const manifests = readManifests();
  const addr = userAddress.toLowerCase();
  if (!manifests[addr]) manifests[addr] = [];
  const pendingRoot = `PENDING:${pendingId}`;
  if (!manifests[addr].find(x => x.rootHash === pendingRoot)) {
    manifests[addr].push({ rootHash: pendingRoot, txHash: null });
    writeManifests(manifests);
  }
};

export const saveUserHash = async (userAddress: string, rootHash: string, txHash?: string | null): Promise<void> => {
  if (!rootHash) {
    console.warn('[0G] saveUserHash called with empty rootHash - ignoring');
    return;
  }

  const manifests = readManifests();
  const addr = userAddress.toLowerCase();
  if (!manifests[addr]) manifests[addr] = [];

  // If there is a pending entry, replace the earliest pending with actual rootHash
  const pendingIndex = manifests[addr].findIndex(x => typeof x.rootHash === 'string' && x.rootHash.startsWith('PENDING:'));
  if (pendingIndex !== -1) {
    manifests[addr][pendingIndex] = { rootHash, txHash: txHash ?? null };
  } else if (!manifests[addr].find(x => x.rootHash === rootHash)) {
    manifests[addr].push({ rootHash, txHash: txHash ?? null });
  }

  writeManifests(manifests);
};

export const savePendingData = async (userAddress: string, data: any): Promise<void> => {
  try {
    const pendingPath = path.join(os.tmpdir(), `0g_pending_${userAddress.toLowerCase()}_${data.id}.json`);
    fs.writeFileSync(pendingPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('[0G] savePendingData failed', e);
  }
};

export const readPendingData = async (userAddress: string, pendingId: string): Promise<any | null> => {
  try {
    const pendingPath = path.join(os.tmpdir(), `0g_pending_${userAddress.toLowerCase()}_${pendingId}.json`);
    if (!fs.existsSync(pendingPath)) return null;
    const buf = fs.readFileSync(pendingPath, 'utf-8');
    return JSON.parse(buf);
  } catch (e) {
    return null;
  }
};

export const getUserHashes = async (userAddress: string): Promise<ManifestEntry[]> => {
  const manifests = readManifests();
  return manifests[userAddress.toLowerCase()] || [];
};
