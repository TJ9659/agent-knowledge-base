import { prisma } from '../lib/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';

// everything except passwordHash, use for anything sent back to the client
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export const userRepository = {
  // includes passwordHash, only for login
  findByEmailWithPassword(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: number) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  },

  existsByEmail(email: string) {
    return prisma.user.count({ where: { email } }).then((count) => count > 0);
  },

  async list({ skip, take }: { skip: number; take: number }) {
    const [rows, total] = await prisma.$transaction([
      prisma.user.findMany({ select: publicUserSelect, orderBy: { id: 'asc' }, skip, take }),
      prisma.user.count(),
    ]);
    return { rows, total };
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, select: publicUserSelect });
  },

  update(id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, select: publicUserSelect });
  },
};
