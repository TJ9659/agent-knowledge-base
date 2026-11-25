import { defineConfig } from 'vitest/config';

// a separate database, so tests never touch the demo data in kb
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'mysql://kb:kb_password@localhost:3307/kb_test';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: './tests/globalSetup.ts',
    // these win over backend/.env, gemini is off unless a test fakes it
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      GEMINI_API_KEY: '',
    },
    // the integration tests share one database, so files run one at a time
    fileParallelism: false,
  },
});
