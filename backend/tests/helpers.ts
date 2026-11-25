import { execSync } from 'node:child_process';
import request from 'supertest';
import { app } from '../src/app.js';

export const PASSWORD = 'Password123!';
export const ADMIN = 'admin@nexora.test';
export const EDITOR = 'editor@nexora.test';
export const EDITOR2 = 'editor2@nexora.test';
export const AGENT = 'agent@nexora.test';
export const DEACTIVATED = 'agent2@nexora.test';

export const api = () => request(app);

// puts the demo data back, so each test file starts from the same state
export function reseed() {
  execSync('npx tsx prisma/seed.ts', { env: process.env, stdio: 'pipe' });
}

// logs in and returns the access token and the refresh cookie
export async function login(email: string) {
  const res = await api().post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return { token: res.body.accessToken as string, cookie: res.headers['set-cookie'] as unknown as string[], user: res.body.user };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

// seed ids change on every reseed, so tests look articles up by title
export async function articleId(token: string, title: string) {
  const res = await api().get('/api/articles').query({ q: title, status: 'ALL', pageSize: 50 }).set(bearer(token));
  const found = res.body.data.find((article: { title: string }) => article.title === title);
  if (!found) throw new Error(`no article titled "${title}"`);
  return found.id as number;
}
