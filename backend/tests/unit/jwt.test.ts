import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { generateRefreshToken, hashToken, signAccessToken, verifyAccessToken } from '../../src/utils/jwt.js';

describe('access tokens', () => {
  it('round-trips the user id and role', () => {
    const token = signAccessToken({ id: 7, role: 'EDITOR' });
    expect(verifyAccessToken(token)).toEqual({ id: 7, role: 'EDITOR' });
  });

  it('rejects a token signed with another secret', () => {
    const forged = jwt.sign({ sub: '1', role: 'ADMIN' }, 'not-the-real-secret-not-the-real-secret');
    expect(() => verifyAccessToken(forged)).toThrow('Invalid or expired token');
  });

  it('rejects a token with an unknown role', () => {
    const token = jwt.sign({ sub: '1', role: 'SUPERUSER' }, process.env.JWT_ACCESS_SECRET!);
    expect(() => verifyAccessToken(token)).toThrow('Invalid or expired token');
  });
});

describe('refresh tokens', () => {
  it('are random every time', () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });

  it('hash the same way every time, and never equal the token', () => {
    const token = generateRefreshToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});
