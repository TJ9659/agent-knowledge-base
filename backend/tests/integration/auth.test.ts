import { beforeAll, describe, expect, it } from 'vitest';
import { AGENT, api, bearer, DEACTIVATED, login, PASSWORD, reseed } from '../helpers.js';

beforeAll(reseed);

describe('login', () => {
  it('returns an access token, the public user and a refresh cookie', async () => {
    const res = await api().post('/api/auth/login').send({ email: AGENT, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: AGENT, role: 'AGENT' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toContain('refresh_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/auth');
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const wrongPassword = await api().post('/api/auth/login').send({ email: AGENT, password: 'nope-nope' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'nobody@nexora.test', password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('refuses a deactivated account', async () => {
    const res = await api().post('/api/auth/login').send({ email: DEACTIVATED, password: PASSWORD });
    expect(res.status).toBe(403);
  });

  it('rejects a bad body before touching the database', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('protected routes', () => {
  it('need a token', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
  });

  it('refuse a made-up token', async () => {
    expect((await api().get('/api/auth/me').set(bearer('not.a.token'))).status).toBe(401);
  });

  it('return the user for a valid token', async () => {
    const { token } = await login(AGENT);
    const res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(AGENT);
  });
});

describe('refresh and logout', () => {
  it('rotates the refresh token, so an old one stops working', async () => {
    const { cookie: first } = await login(AGENT);

    const refreshed = await api().post('/api/auth/refresh').set('Cookie', first);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    const second = refreshed.headers['set-cookie'] as unknown as string[];

    // the first cookie was used once already
    expect((await api().post('/api/auth/refresh').set('Cookie', first)).status).toBe(401);
    // the new one still works
    expect((await api().post('/api/auth/refresh').set('Cookie', second)).status).toBe(200);
  });

  it('refuses a refresh with no cookie', async () => {
    expect((await api().post('/api/auth/refresh')).status).toBe(401);
  });

  it('ends the session on logout', async () => {
    const { cookie } = await login(AGENT);

    expect((await api().post('/api/auth/logout').set('Cookie', cookie)).status).toBe(204);
    expect((await api().post('/api/auth/refresh').set('Cookie', cookie)).status).toBe(401);
  });
});
