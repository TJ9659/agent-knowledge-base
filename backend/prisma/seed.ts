import { prisma } from '../src/lib/prisma.js';
import { buildArticle } from '../src/factories/articleFactory.js';
import { isGeminiEnabled } from '../src/lib/gemini.js';
import { articleService } from '../src/services/articleService.js';
import { buildUser } from '../src/factories/userFactory.js';
import { articles } from './seed-data/articles.js';
import { categories } from './seed-data/categories.js';
import { DEMO_PASSWORD, users } from './seed-data/users.js';

async function main() {
  // wipe in fk order so the seed can be run again
  await prisma.refreshToken.deleteMany();
  await prisma.article.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const userIds = new Map<string, number>();
  for (const user of users) {
    const created = await prisma.user.create({ data: await buildUser({ ...user, password: DEMO_PASSWORD }) });
    userIds.set(created.email, created.id);
  }

  const categoryIds = new Map<string, number>();
  for (const name of categories) {
    const created = await prisma.category.create({ data: { name } });
    categoryIds.set(name, created.id);
  }

  for (const { authorEmail, category, ...article } of articles) {
    const authorId = userIds.get(authorEmail);
    const categoryId = categoryIds.get(category);
    if (!authorId || !categoryId) {
      throw new Error(`Missing author or category for "${article.title}"`);
    }
    await prisma.article.create({ data: buildArticle({ authorId, categoryId }, article) });
  }

  const published = articles.filter((a) => a.status === 'PUBLISHED').length;
  console.log(
    `Seeded ${users.length} users, ${categories.length} categories, ${articles.length} articles ` +
      `(${published} published, ${articles.length - published} drafts)`,
  );

  // optional, the seed still works without a key and ask the kb falls back to keyword search
  if (isGeminiEnabled()) {
    const { embedded, missing } = await articleService.embedMissing();
    console.log(`Embedded ${embedded} of ${missing} articles`);
  } else {
    console.log('No GEMINI_API_KEY set, skipped embeddings');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
