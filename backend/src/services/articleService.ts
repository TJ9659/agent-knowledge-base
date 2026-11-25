import { embedText } from '../lib/gemini.js';
import { articleRepository, type ArticleRecord } from '../repositories/articleRepository.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import type { ArticleListQuery, CreateArticleInput, UpdateArticleInput } from '../schemas/article.schemas.js';
import type { PaginationQuery } from '../schemas/common.js';
import type { AuthUser } from '../types/express.js';
import { HttpError } from '../utils/HttpError.js';
import { toSnippet } from '../utils/snippet.js';

// ask the kb searches by this vector, a gemini failure leaves it null and never stops the save
async function refreshEmbedding(article: { id: number; title: string; content: string }) {
  const embedding = await embedText(`${article.title}\n\n${article.content}`, 'article');
  await articleRepository.saveEmbedding(article.id, embedding);
}

// list pages get a short snippet instead of the full content
function toListItem({ content, ...article }: ArticleRecord) {
  return { ...article, snippet: toSnippet(content) };
}

function canView(user: AuthUser, article: ArticleRecord) {
  return article.status === 'PUBLISHED' || user.role === 'ADMIN' || article.author.id === user.id;
}

function assertCanModify(user: AuthUser, article: ArticleRecord) {
  if (user.role !== 'ADMIN' && article.author.id !== user.id) {
    throw HttpError.forbidden('You can only change your own articles');
  }
}

async function assertCategoryExists(categoryId: number) {
  if (!(await categoryRepository.findById(categoryId))) {
    throw HttpError.badRequest('Category not found');
  }
}

// 404 instead of 403 for drafts so their existence is not leaked
async function getVisibleOrThrow(user: AuthUser, id: number) {
  const article = await articleRepository.findById(id);
  if (!article || !canView(user, article)) throw HttpError.notFound('Article not found');
  return article;
}

export const articleService = {
  async list(user: AuthUser, { page, pageSize, q, categoryId, status }: ArticleListQuery) {
    // only admins can ask for drafts, everyone else gets published
    const statusFilter = user.role === 'ADMIN' ? (status === 'ALL' ? undefined : (status ?? 'PUBLISHED')) : 'PUBLISHED';
    const filter = { status: statusFilter, categoryId, skip: (page - 1) * pageSize, take: pageSize };

    // with q the results are ranked by relevance, without it newest first
    const { rows, total } = q
      ? await articleRepository.search({ ...filter, q })
      : await articleRepository.list(filter);
    return { data: rows.map(toListItem), page, pageSize, total };
  },

  // own drafts and published, for the my articles page
  async listMine(user: AuthUser, { page, pageSize }: PaginationQuery) {
    const { rows, total } = await articleRepository.list({
      authorId: user.id,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data: rows.map(toListItem), page, pageSize, total };
  },

  getById(user: AuthUser, id: number) {
    return getVisibleOrThrow(user, id);
  },

  async create(user: AuthUser, input: CreateArticleInput) {
    await assertCategoryExists(input.categoryId);
    const article = await articleRepository.create({ ...input, authorId: user.id });
    await refreshEmbedding(article);
    return article;
  },

  async update(user: AuthUser, id: number, input: UpdateArticleInput) {
    const article = await getVisibleOrThrow(user, id);
    assertCanModify(user, article);
    if (input.categoryId) await assertCategoryExists(input.categoryId);
    const updated = await articleRepository.update(id, input);
    // only a new title or content changes the meaning
    if (input.title !== undefined || input.content !== undefined) await refreshEmbedding(updated);
    return updated;
  },

  // for the seed and npm run db:embed, fills in articles saved while gemini was down or before embeddings existed
  async embedMissing() {
    const missing = await articleRepository.findWithoutEmbedding();
    let embedded = 0;
    for (const article of missing) {
      const embedding = await embedText(`${article.title}\n\n${article.content}`, 'article');
      if (!embedding) continue;
      await articleRepository.saveEmbedding(article.id, embedding);
      embedded++;
    }
    return { embedded, missing: missing.length };
  },

  async remove(user: AuthUser, id: number) {
    const article = await getVisibleOrThrow(user, id);
    assertCanModify(user, article);
    await articleRepository.delete(id);
  },
};
