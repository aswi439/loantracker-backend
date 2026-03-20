// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import admin from '../services/firebaseAdmin';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: { uid: string; role: string; _id: string };
}

// Verify JWT issued by our backend (used for most API calls)
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { uid: string; role: string; _id: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Verify Firebase ID token (used only for auth endpoints)
export async function verifyFirebaseToken(idToken: string) {
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded;
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}
