import { execSync } from 'node:child_process';
import * as mariadb from 'mariadb';
import { TEST_DATABASE_URL } from '../vitest.config.js';

// runs once before all tests: an empty kb_test with every migration applied
export default async function setup() {
  const url = new URL(TEST_DATABASE_URL);
  const database = url.pathname.slice(1);
  // a guard, so a wrong url can never wipe the demo database
  if (!database.endsWith('_test')) throw new Error(`refusing to reset "${database}", the test database must end in _test`);

  const connection = await mariadb.createConnection({
    host: url.hostname,
    port: Number(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  });
  await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await connection.query(`CREATE DATABASE \`${database}\``);
  await connection.end();

  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }, stdio: 'pipe' });
}
