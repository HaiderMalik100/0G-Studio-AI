import { MongoClient, Db, Collection } from 'mongodb';
import { ContentData } from '../types';

let client: MongoClient;
let db: Db;

export let chats: Collection<ContentData & { _id?: any; updatedAt?: number }>;

export const connectMongo = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI missing in .env');
  
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    
    db = client.db('ogstudio');
    chats = db.collection('chats');
    
    // Indexes: fast user queries + unique content
    await chats.createIndex({ userAddress: 1, createdAt: -1 });
    await chats.createIndex({ id: 1 }, { unique: true });
    await chats.createIndex({ chatId: 1 });
    
    console.log('✅ MongoDB connected');
  } catch (e: any) {
    console.error('❌ MongoDB connection failed:', e.message);
    throw e;
  }
};

export const closeMongo = async (): Promise<void> => {
  try {
    await client?.close();
    console.log('MongoDB disconnected');
  } catch (e) {
    console.error('Error closing Mongo:', e);
  }
};

// Graceful shutdown
process.on('SIGINT', closeMongo);
process.on('SIGTERM', closeMongo);