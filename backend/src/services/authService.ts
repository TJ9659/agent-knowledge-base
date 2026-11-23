import { env } from '../config/env.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import type { AuthUser } from '../types/express.js';
import { HttpError } from '../utils/HttpError.js';
import { generateRefreshToken, hashToken, signAccessToken } from '../utils/jwt.js';
import { verifyPassword } from '../utils/password.js';

async function issueTokens(user: AuthUser) {
  const refreshToken = generateRefreshToken();
  await refreshTokenRepository.create({
    tokenHash: hashToken(refreshToken),
    userId: user.id,
    expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
  });
  return { accessToken: signAccessToken(user), refreshToken };
}

async function getPublicUser(id: number) {
  const user = await userRepository.findById(id);
  if (!user) throw HttpError.unauthorized();
  return user;
}

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmailWithPassword(email);

    // same message for unknown email and wrong password so emails cant be guessed
    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      throw HttpError.unauthorized('Invalid email or password');
    }
    if (!user.isActive) {
      throw HttpError.forbidden('Account is deactivated');
    }

    const tokens = await issueTokens({ id: user.id, role: user.role });
    return { ...tokens, user: await getPublicUser(user.id) };
  },

  // rotates the token: old one is deleted, a new pair is issued
  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw HttpError.unauthorized('Missing refresh token');

    const tokenHash = hashToken(refreshToken);
    const stored = await refreshTokenRepository.findByHash(tokenHash);
    if (!stored) throw HttpError.unauthorized('Invalid refresh token');

    await refreshTokenRepository.deleteByHash(tokenHash);

    if (stored.expiresAt < new Date() || !stored.user.isActive) {
      throw HttpError.unauthorized('Invalid refresh token');
    }

    const tokens = await issueTokens({ id: stored.user.id, role: stored.user.role });
    return { ...tokens, user: await getPublicUser(stored.user.id) };
  },

  // removes tokens nobody came back to refresh before they expired
  async cleanupExpiredTokens() {
    const { count } = await refreshTokenRepository.deleteExpired();
    return count;
  },

  async logout(refreshToken: string | undefined) {
    if (refreshToken) {
      await refreshTokenRepository.deleteByHash(hashToken(refreshToken));
    }
  },

  me(userId: number) {
    return getPublicUser(userId);
  },
};
