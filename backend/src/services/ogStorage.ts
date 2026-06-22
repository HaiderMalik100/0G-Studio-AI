import { ethers } from 'ethers';
import { ContentData } from '../types';
import fs from 'fs';
import path from 'path';
import os from 'os';

let ZgFile: any, Indexer: any;

const loadSDK = async () => {
  if (!ZgFile) {
    console.log('Loading 0G SDK...');
    const sdk = await import('@0gfoundation/0g-storage-ts-sdk');
    ZgFile = sdk.ZgFile;
    Indexer = sdk.Indexer;
    console.log('0G SDK loaded');
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

export const uploadTo0G = async (data: ContentData): Promise<{ rootHash: string; txHash: string }> => {
  await loadSDK();
  console.log(`[0G UPLOAD START] ${data.id}`);

  const tmpPath = getTmpPath(`${data.id}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));

  let file: any = null;
  try {
    file = await ZgFile.fromFilePath(tmpPath);

    const [tree, treeErr] = await file.merkleTree();
    if (treeErr!== null) throw new Error(`Merkle tree error: ${treeErr}`);

    const indexer = await getIndexer();
    const signer = getSigner();

    const [tx, uploadErr] = await indexer.upload(file, getRpcUrl(), signer);
    if (uploadErr!== null) throw new Error(`Upload error: ${uploadErr}`);

    const rootHash =
      tx?.rootHash ||
      tx?.data?.rootHash ||
      tx?.output?.rootHash ||
      (Array.isArray(tx?.rootHashes)? tx.rootHashes[0] : null);

    const txHash =
      tx?.txHash ||
      tx?.transactionHash ||
      tx?.hash ||
      null;

    if (!rootHash) {
      console.error("FULL TX RESPONSE:", JSON.stringify(tx, (k, v) => typeof v === 'bigint'? v.toString() : v));
      throw new Error("Missing rootHash from 0G response");
    }

    console.log(`TX: https://chainscan-galileo.0g.ai/tx/${txHash}`);
    console.log(`File: https://storagescan-galileo.0g.ai/#/data/${rootHash}`);

    return { rootHash, txHash: txHash || '' };

  } catch (e: any) {
    console.error(`[0G ERROR]`, e.message || e);
    throw new Error(`0G upload failed: ${e.message || e}`);
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

// REMOVED: All manifest, savePendingEntry, saveUserHash, savePendingData, readPendingData, getUserHashes
// MongoDB handles all of this now
