import jwt from 'jsonwebtoken';
import { UserRole } from '../db/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_change_me';

interface TokenPayload {
  id: number;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    const err = new Error('Invalid or expired token') as Error & { status: number };
    err.status = 401;
    throw err;
  }
}
