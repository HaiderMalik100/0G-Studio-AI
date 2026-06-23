import { MongoClient, Db, Collection } from 'mongodb';
import { ContentData } from '../types';

let client: MongoClient;
let db: Db;

export let chats: Collection<ContentData & { _id?: any; updatedAt?: number }>;

export const connectMongo = async (): Promise<void> => {
  if (db) return; // prevent reconnect
  
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI missing in .env');
  
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    });
    
    await client.connect();
    db = client.db('ogstudio');
    chats = db.collection('chats');
    
    client.on('close', () => console.warn('MongoDB connection closed'));
    client.on('error', (e) => console.error('MongoDB error:', e));
    
    await chats.createIndex({ userAddress: 1, createdAt: -1 });
    await chats.createIndex({ id: 1 }, { unique: true });
    await chats.createIndex({ chatId: 1 });
    
    console.log('✅ MongoDB connected');
  } catch (e: any) {
    console.error('❌ MongoDB connection failed:', e.message);
    throw e;
  }
};

export const keepAlive = () => {
  setInterval(() => {
    if (db) db.command({ ping: 1 }).catch(() => {});
  }, 300000);
};

export const closeMongo = async (): Promise<void> => {
  try {
    await client?.close();
    console.log('MongoDB disconnected');
  } catch (e) {
    console.error('Error closing Mongo:', e);
  }
};

// Only for local dev. Hostinger handles shutdown.
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', closeMongo);
}
// REMOVE THIS LINE: process.on('SIGTERM', closeMongo);
