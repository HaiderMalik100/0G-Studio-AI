import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as { address: string };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export type { AuthRequest }; // add this line if not there
