import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'golden-palace-pos-super-secure-key-2026';

export interface PosUser {
  id: number;
  uid: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN' | 'INVENTORY';
  phone?: string | null;
}

export interface AuthRequest extends Request {
  user?: PosUser;
}

export const signUserToken = (user: PosUser): string => {
  return jwt.sign(
    {
      id: user.id,
      uid: user.uid,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح: يرجى تسجيل الدخول أولاً' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Try POS JWT token
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as PosUser;
    if (decoded && decoded.id) {
      req.user = decoded;
      return next();
    }
  } catch {
    // If not local JWT, attempt Firebase ID Token
  }

  // 2. Try Firebase ID Token
  try {
    const firebaseDecoded = await adminAuth.verifyIdToken(token);
    // Find or create user in DB
    const existing = await db.select().from(users).where(eq(users.uid, firebaseDecoded.uid));
    if (existing.length > 0) {
      req.user = {
        id: existing[0].id,
        uid: existing[0].uid,
        username: existing[0].username,
        email: existing[0].email,
        fullName: existing[0].fullName,
        role: existing[0].role as PosUser['role'],
        phone: existing[0].phone,
      };
      return next();
    } else {
      // Upsert user as Admin or Manager if email matches restaurant owner
      const email = firebaseDecoded.email || 'user@goldenpalace.dz';
      const role = email.includes('admin') ? 'ADMIN' : 'CASHIER';
      const inserted = await db.insert(users).values({
        uid: firebaseDecoded.uid,
        username: email.split('@')[0],
        email: email,
        passwordHash: 'FIREBASE_AUTH',
        fullName: firebaseDecoded.name || 'مستخدم مسجل',
        role: role,
        pin: '1234',
      }).returning();

      req.user = {
        id: inserted[0].id,
        uid: inserted[0].uid,
        username: inserted[0].username,
        email: inserted[0].email,
        fullName: inserted[0].fullName,
        role: inserted[0].role as PosUser['role'],
      };
      return next();
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'جلسة تسجيل الدخول غير صالحة أو منتهية' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
    }
    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: 'عذراً، ليس لديك صلاحية للقيام بهذه العملية' });
  };
};
