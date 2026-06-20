import { Router } from 'express';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

const router = Router();
const nonces: Record<string, string> = {};

router.post('/nonce', (req, res) => {
  const { address } = req.body;
  const nonce = `0G Creator Login: ${Date.now()}`;
  nonces[address.toLowerCase()] = nonce;
  res.json({ nonce });
});

router.post('/verify', (req, res) => {
  const { address, signature } = req.body;
  const nonce = nonces[address.toLowerCase()];
  if (!nonce) return res.status(400).json({ error: 'Nonce expired' });
  const recovered = ethers.verifyMessage(nonce, signature);
  if (recovered.toLowerCase()!== address.toLowerCase()) {
    return res.status(401).json({ error: 'Bad signature' });
  }
  delete nonces[address.toLowerCase()];
  const token = jwt.sign({ address }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.json({ token });
});

export default router;
