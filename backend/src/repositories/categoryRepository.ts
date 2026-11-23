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
