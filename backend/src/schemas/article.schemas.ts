import { z } from 'zod';
import { ArticleStatus } from '../generated/prisma/enums.js';
import { paginationQuerySchema } from './common.js';

// content is TEXT (64kb), 15k chars stays under it even with 4 byte characters
const articleFields = z.object({
  title: z.string().trim().min(3).max(150),
  content: z.string().trim().min(1).max(15_000),
  categoryId: z.number().int().positive(),
  status: z.enum(ArticleStatus),
});

export const createArticleSchema = articleFields.extend({
  status: z.enum(ArticleStatus).default(ArticleStatus.DRAFT),
});

// no defaults here, a missing field must stay untouched
export const updateArticleSchema = articleFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

// empty query values like ?categoryId= are treated as not sent
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const articleListQuerySchema = paginationQuerySchema.extend({
  categoryId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  status: z.preprocess(emptyToUndefined, z.enum(['DRAFT', 'PUBLISHED', 'ALL']).optional()),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>;
