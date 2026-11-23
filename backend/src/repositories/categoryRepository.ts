import { prisma } from '../lib/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';

const categorySelect = { id: true, name: true } satisfies Prisma.CategorySelect;

export const categoryRepository = {
  // articleCount only counts published articles since that is what agents can see
  async listWithCounts() {
    const rows = await prisma.category.findMany({
      select: { ...categorySelect, _count: { select: { articles: { where: { status: 'PUBLISHED' } } } } },
      orderBy: { name: 'asc' },
    });
    return rows.map(({ _count, ...category }) => ({ ...category, articleCount: _count.articles }));
  },

  findById(id: number) {
    return prisma.category.findUnique({ where: { id }, select: categorySelect });
  },

  // excludeId lets a rename keep its own name
  existsByName(name: string, excludeId?: number) {
    return prisma.category
      .count({ where: { name, ...(excludeId ? { id: { not: excludeId } } : {}) } })
      .then((count) => count > 0);
  },

  async articleStats() {
    const rows = await prisma.$queryRaw<
      { id: number; name: string; total: bigint | number; published: unknown; drafts: unknown }[]
    >`
      SELECT c.id, c.name,
             COUNT(a.id) AS total,
             COALESCE(SUM(a.status = 'PUBLISHED'), 0) AS published,
             COALESCE(SUM(a.status = 'DRAFT'), 0) AS drafts
      FROM Category c
      LEFT JOIN Article a ON a.categoryId = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name`;

    // COUNT comes back as bigint and SUM as decimal, json needs plain numbers
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      total: Number(row.total),
      published: Number(row.published),
      drafts: Number(row.drafts),
    }));
  },

  countArticles(id: number) {
    return prisma.article.count({ where: { categoryId: id } });
  },

  create(name: string) {
    return prisma.category.create({ data: { name }, select: categorySelect });
  },

  update(id: number, name: string) {
    return prisma.category.update({ where: { id }, data: { name }, select: categorySelect });
  },

  delete(id: number) {
    return prisma.category.delete({ where: { id } });
  },
};
