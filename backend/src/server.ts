import dotenv from 'dotenv';
dotenv.config(); // MUST BE FIRST LINE BEFORE ANY OTHER IMPORTS

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://og-studio-ai.app"
  ],
  credentials: true
}));


app.use(express.json());

console.log("========== SERVER START ==========");
console.log("PORT:", process.env.PORT);
console.log("GROQ KEY LOADED:",!!process.env.GROQ_API_KEY);
console.log("OG RPC LOADED:",!!process.env.OG_EVM_RPC);

app.use('/auth', authRoutes);
app.use('/api', contentRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'backend running' });
});

const requestedPort = Number(process.env.PORT || 3001);

const startServer = (port: number) => {
  const server = app.listen(port, () => {
    console.log(`Backend running on ${port}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && port < requestedPort + 10) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy, trying ${nextPort}...`);
      server.close(() => startServer(nextPort));
      return;
    }

    console.error('Server startup error:', error);
    process.exit(1);
  });
};

startServer(requestedPort);
