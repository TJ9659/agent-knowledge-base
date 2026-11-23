import { prisma } from '../lib/prisma.js';

export const refreshTokenRepository = {
  create(data: { tokenHash: string; userId: number; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, role: true, isActive: true } } },
    });
  },

  // deleteMany so it doesnt throw if the token is already gone
  deleteByHash(tokenHash: string) {
    return prisma.refreshToken.deleteMany({ where: { tokenHash } });
  },

  deleteAllForUser(userId: number) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  },

  deleteExpired() {
    return prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  },
};
