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

// boolean mode with a * on each word, so "ref" also finds "refund"
// mysql's own operators are stripped first, otherwise "+-()" in a search is a syntax error
function toPrefixQuery(q: string) {
  return q
    .replace(/[+\-@*()~<>"]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .map((word) => `${word}*`)
    .join(' ');
}

// "charged" becomes "charg", so charg* also finds "charge" and "charging"
function toStem(word: string) {
  const stem = word.replace(/(ing|ed|es|s)$/, '');
  return stem.length >= 4 ? stem : word;
}

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

  async search({ q, ...filter }: ArticleSearchFilter) {
    const prefixQuery = toPrefixQuery(q);
    // nothing searchable left, e.g. only symbols or short words, so show the normal list
    if (!prefixQuery) return articleRepository.list(filter);

    const { status, categoryId, skip, take } = filter;
    const match = Prisma.sql`MATCH(title, content) AGAINST (${prefixQuery} IN BOOLEAN MODE)`;
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

  // ask the kb: prefix matches find the articles, plain matches break ties
  searchPublished(words: string[], limit: number) {
    const prefixQuery = words.map((word) => `${toStem(word)}*`).join(' ');
    const plainQuery = words.join(' ');
    return prisma.$queryRaw<{ id: number; title: string; content: string }[]>`
      SELECT id, title, content
      FROM Article
      WHERE status = 'PUBLISHED'
        AND MATCH(title, content) AGAINST (${prefixQuery} IN BOOLEAN MODE)
      ORDER BY MATCH(title, content) AGAINST (${prefixQuery} IN BOOLEAN MODE) DESC,
        MATCH(title, content) AGAINST (${plainQuery} IN NATURAL LANGUAGE MODE) DESC
      LIMIT ${limit}`;
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
