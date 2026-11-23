import { prisma } from '../lib/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { ArticleStatus } from '../generated/prisma/enums.js';

const articleSelect = {
  id: true,
  title: true,
  content: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  author: { select: { id: true, name: true } },
} satisfies Prisma.ArticleSelect;

export type ArticleRecord = Prisma.ArticleGetPayload<{ select: typeof articleSelect }>;

export interface ArticleListFilter {
  status?: ArticleStatus;
  categoryId?: number;
  authorId?: number;
  skip: number;
  take: number;
}

export const articleRepository = {
  async list({ status, categoryId, authorId, skip, take }: ArticleListFilter) {
    const where: Prisma.ArticleWhereInput = { status, categoryId, authorId };
    const [rows, total] = await prisma.$transaction([
      prisma.article.findMany({ where, select: articleSelect, orderBy: { updatedAt: 'desc' }, skip, take }),
      prisma.article.count({ where }),
    ]);
    return { rows, total };
  },

  findById(id: number) {
    return prisma.article.findUnique({ where: { id }, select: articleSelect });
  },

  create(data: Prisma.ArticleUncheckedCreateInput) {
    return prisma.article.create({ data, select: articleSelect });
  },

  update(id: number, data: Prisma.ArticleUncheckedUpdateInput) {
    return prisma.article.update({ where: { id }, data, select: articleSelect });
  },

  delete(id: number) {
    return prisma.article.delete({ where: { id } });
  },
};
