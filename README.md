# Nexus AI — AI Content Studio on 0G


Generate tweets, blogs, LinkedIn posts and marketing copy with AI. Every creation is anchored to 0G Storage with a public transaction hash. Instant in-app access + verifiable on-chain permanence.

**Live Demo:** https://0gstudioai.online

**Built for:** 0G Zero Cup Hackathon 2026

---

## Demo

![Nexus AI Demo](./demo.gif)

1. Connect wallet
2. Type a prompt → Get AI content in seconds
3. Click the txhash to verify it on 0G Explorer
4. Find all chats in your sidebar instantly

---

## Problem

1. **You don't own AI outputs** - Notion AI, Jasper, etc. can delete or censor your work.
2. **Web3 tools feel slow** - Users won't wait 10s for "decentralized" UX.
3. **No proof of origin** - Creators can't prove they wrote something first.

## Solution

Nexus AI gives you ChatGPT-like speed. Under the hood, every generation is pushed to 0G Storage and timestamped on 0G Chain. You get a txhash. If this app disappears, your content still exists on 0G forever.

---

## Key Features

| Feature | Description |
| --- | --- |
| **On-Chain Provenance** | Every generation gets a 0G txhash. Click to verify on 0G Explorer. |
| **Instant Chat History** | Sidebar loads immediately. Resume any conversation like ChatGPT. |
| **Format-Aware AI** | Select Tweet, Blog, LinkedIn, or Marketing. AI adapts tone + length automatically. |
| **Wallet Login** | MetaMask / RainbowKit. No email, no passwords. |
| **Exit-Proof** | Even if Nexus shuts down, pull your content from 0G using the txhash. |
| **One-Click Verify** | Public link to prove content exists and hasn't been altered. |

---

## How It Works

1. **Connect Wallet** - Your wallet is your account.
2. **Pick Format** - Tweet, Blog, LinkedIn, Marketing.
3. **Enter Prompt** - Describe what you want.
4. **Generate** - AI streams content in <3s.
5. **Auto-Anchored** - We commit the result to 0G Storage and show you the txhash.

---

## Tech Stack

**Frontend**
React 18, TypeScript, Vite, TailwindCSS, RainbowKit, Wagmi, Ethers.js

**Backend**
Node.js, Express, MongoDB, OpenAI GPT-4o API

**Web3 / 0G**
0G Storage SDK, 0G Chain RPC, Solidity (for future contracts)

**Infra**
Nginx, PM2, Ubuntu 22.04

---

## 0G Integration

Nexus AI uses 0G as the permanence layer:

1. **Upload**: After AI generation, we serialize prompt + output to JSON and upload to 0G Storage.
2. **Commit**: We take the 0G storage root hash and commit it on 0G Chain. This gives us a txhash.
3. **Display**: The txhash is shown in the UI. Anyone can verify.
4. **Retrieve**: Users or third parties can fetch the content directly from 0G using the txhash, no Nexus backend needed.

Why this matters: 0G provides censorship resistance + permanence. We provide speed + UX. Remove 0G and the core value prop dies.

---

## Getting Started

### 1. Prerequisites
- Node.js 18+
- Gemini/Groq API key
- 0G RPC + private key with testnet 0G tokens

### 2. Clone + Install
```bash
git clone https://github.com/HaiderMalik100/0G-Studio-AI.git
cd 0G-Studio-AI

# Install frontend
cd frontend
npm install

# Install backend
cd../backend
npm install
