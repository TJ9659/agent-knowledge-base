import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Role } from '../generated/prisma/enums.js';
import type { AuthUser } from '../types/express.js';
import { HttpError } from './HttpError.js';

interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(user: AuthUser) {
  const payload: AccessTokenPayload = { sub: String(user.id), role: user.role };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as Partial<AccessTokenPayload>;
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || !payload.role || !Object.values(Role).includes(payload.role)) {
      throw new Error('bad payload');
    }
    return { id, role: payload.role };
  } catch {
    throw HttpError.unauthorized('Invalid or expired token');
  }
}

// refresh tokens are random strings, only their hash is stored in the db
export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
