import { env } from './config/env.js';
import { app } from './app.js';
import { startTokenCleanup } from './jobs/tokenCleanup.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}/api`);
});

const cleanupTimer = startTokenCleanup();

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  clearInterval(cleanupTimer);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
