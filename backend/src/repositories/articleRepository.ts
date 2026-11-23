import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
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

export type ArticleSearchFilter = ArticleListFilter & { q: string };

// findMany ignores the order of ids, so put the rows back in that order
async function findByIdsInOrder(ids: number[]) {
  const rows = await prisma.article.findMany({ where: { id: { in: ids } }, select: articleSelect });
  return ids.flatMap((id) => rows.find((row) => row.id === id) ?? []);
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

  async search({ q, status, categoryId, skip, take }: ArticleSearchFilter) {
    const match = Prisma.sql`MATCH(title, content) AGAINST (${q} IN NATURAL LANGUAGE MODE)`;
    const where = Prisma.sql`${match}
      ${status ? Prisma.sql`AND status = ${status}` : Prisma.empty}
      ${categoryId ? Prisma.sql`AND categoryId = ${categoryId}` : Prisma.empty}`;

    const [hits, [count]] = await prisma.$transaction([
      prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM Article WHERE ${where}
        ORDER BY ${match} DESC, updatedAt DESC
        LIMIT ${take} OFFSET ${skip}`,
      prisma.$queryRaw<{ total: bigint }[]>`SELECT COUNT(*) AS total FROM Article WHERE ${where}`,
    ]);

    const rows = await findByIdsInOrder(hits.map((hit) => hit.id));
    return { rows, total: Number(count?.total ?? 0) };
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
