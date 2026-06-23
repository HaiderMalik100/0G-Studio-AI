import dotenv from "dotenv";

dotenv.config();

// server.ts - MUST BE LINE 1
const _origStringify = JSON.stringify;
JSON.stringify = function(val: any, replacer?: any, space?: any) {
  const safe = (k: string, v: any) => typeof v === 'bigint' ? v.toString() : v;
  return _origStringify(val, safe, space);
};

import express from "express";
import cors from "cors";
import { connectMongo, keepAlive } from "./db/mongo"; // add keepAlive
import authRoutes from "./routes/auth";
import contentRoutes from "./routes/content";

dotenv.config();

const app = express();

/**
 * =========================
 * CORS CONFIG (PRODUCTION SAFE)
 * =========================
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  
  "https://0g-nexus-ai.netlify.app/",
  "https://www.0gstudioai.online" // ADD THIS - this fixes CORS
];


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("CORS Not Allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.options("*", cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.use(express.json({ limit: '10mb' }));

/**
 * =========================
 * DEBUG LOGS
 * =========================
 */
console.log("========== SERVER START ==========");
console.log("PORT:", process.env.PORT);
console.log("GROQ KEY LOADED:", !!process.env.GROQ_API_KEY);
console.log("OG RPC LOADED:", !!process.env.OG_EVM_RPC);
console.log("MONGO URI LOADED:", !!process.env.MONGO_URI);

/**
 * =========================
 * ROUTES
 * =========================
 */
app.use("/auth", authRoutes);
app.use("/api/content", contentRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "backend running",
    time: new Date().toISOString()
  });
});

/**
 * =========================
 * SERVER START (ROBUST)
 * =========================
 */
const requestedPort = Number(process.env.PORT || 3001);

const startServer = async (port: number) => {
  try {
    await connectMongo();
    keepAlive(); 
    
    const server = app.listen(port, () => {
      console.log(`🚀 Backend running on port ${port}`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" && port < requestedPort + 10) {
        console.warn(`⚠ Port ${port} busy, trying ${port + 1}...`);
        server.close(() => startServer(port + 1));
        return;
      }
      console.error("❌ Server error:", error);
      process.exit(1);
    });

  } catch (e: any) {
    console.error("❌ Startup failed:", e.message);
    process.exit(1);
  }
};

startServer(requestedPort);

/**
 * =========================
 * ERROR HANDLERS
 * =========================
 */
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exit(1);
});
