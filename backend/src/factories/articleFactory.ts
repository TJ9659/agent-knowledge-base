import type { Prisma } from '../generated/prisma/client.js';
import type { ArticleStatus } from '../generated/prisma/enums.js';

interface ArticleOverrides {
  title?: string;
  content?: string;
  status?: ArticleStatus;
}

let seq = 0;

export function buildArticle(
  refs: { categoryId: number; authorId: number },
  overrides: ArticleOverrides = {},
): Prisma.ArticleUncheckedCreateInput {
  seq += 1;
  return {
    title: `Test article ${seq}`,
    content: `# Test article ${seq}\n\n**When to use:** testing.\n\n## Steps\n1. Do the thing.`,
    status: 'DRAFT',
    ...overrides,
    ...refs,
  };
}
