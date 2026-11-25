import { isGeminiEnabled } from '../lib/gemini.js';
import { prisma } from '../lib/prisma.js';
import { articleService } from '../services/articleService.js';

async function main() {
  if (!isGeminiEnabled()) {
    console.log('No GEMINI_API_KEY set, so no embeddings were made. Ask the KB will use keyword search only.');
    return;
  }
  const { embedded, missing } = await articleService.embedMissing();
  console.log(`Embedded ${embedded} of ${missing} articles that had no embedding`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
