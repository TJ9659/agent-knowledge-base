import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, AGENT, api, bearer, EDITOR, login, PASSWORD, reseed } from '../helpers.js';

let admin: string;
let agent: string;
let adminId: number;

beforeAll(async () => {
  reseed();
  const session = await login(ADMIN);
  admin = session.token;
  adminId = session.user.id;
  agent = (await login(AGENT)).token;
});

const userId = async (email: string) => {
  const res = await api().get('/api/users').query({ pageSize: 50 }).set(bearer(admin));
  return res.body.data.find((user: { email: string }) => user.email === email).id as number;
};

describe('users', () => {
  it('are admin only', async () => {
    expect((await api().get('/api/users').set(bearer(agent))).status).toBe(403);
  });

  it('never include the password hash', async () => {
    const res = await api().get('/api/users').set(bearer(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.every((user: object) => !('passwordHash' in user))).toBe(true);
  });

  it('can be created, and the new account can log in', async () => {
    const created = await api()
      .post('/api/users')
      .set(bearer(admin))
      .send({ name: 'Test Agent', email: 'Test.Agent@Nexora.test ', password: PASSWORD, role: 'AGENT' });

    expect(created.status).toBe(201);
    expect(created.body.email).toBe('test.agent@nexora.test');
    expect((await api().post('/api/auth/login').send({ email: 'test.agent@nexora.test', password: PASSWORD })).status).toBe(200);
  });

  it('refuses an email that is already taken', async () => {
    const editorId = await userId(EDITOR);
    expect((await api().put(`/api/users/${editorId}`).set(bearer(admin)).send({ email: AGENT })).status).toBe(409);
  });

  it('protects the system admin: only the name can change', async () => {
    expect((await api().put(`/api/users/${adminId}`).set(bearer(admin)).send({ role: 'EDITOR' })).status).toBe(403);
    expect((await api().put(`/api/users/${adminId}`).set(bearer(admin)).send({ email: 'new@nexora.test' })).status).toBe(403);
    expect((await api().delete(`/api/users/${adminId}`).set(bearer(admin))).status).toBe(403);
    expect((await api().put(`/api/users/${adminId}`).set(bearer(admin)).send({ name: 'Admin User' })).status).toBe(200);
  });

  it('stops an admin deactivating themselves', async () => {
    await api().post('/api/users').set(bearer(admin)).send({ name: 'Second Admin', email: 'admin2@nexora.test', password: PASSWORD, role: 'ADMIN' });
    const second = await login('admin2@nexora.test');

    expect((await api().delete(`/api/users/${second.user.id}`).set(bearer(second.token))).status).toBe(400);
  });

  it('deactivates instead of deleting, which ends sessions and blocks login until reactivated', async () => {
    const { cookie } = await login(AGENT);
    const id = await userId(AGENT);

    expect((await api().delete(`/api/users/${id}`).set(bearer(admin))).status).toBe(204);
    expect((await api().post('/api/auth/refresh').set('Cookie', cookie)).status).toBe(401);
    expect((await api().post('/api/auth/login').send({ email: AGENT, password: PASSWORD })).status).toBe(403);

    expect((await api().put(`/api/users/${id}`).set(bearer(admin)).send({ isActive: true })).status).toBe(200);
    expect((await api().post('/api/auth/login').send({ email: AGENT, password: PASSWORD })).status).toBe(200);
  });
});

describe('categories', () => {
  it('can be read by anyone signed in, with published counts', async () => {
    const res = await api().get('/api/categories').set(bearer(agent));
    const total = res.body.reduce((sum: number, category: { articleCount: number }) => sum + category.articleCount, 0);

    expect(res.status).toBe(200);
    expect(total).toBe(17);
  });

  it('can only be changed by an admin', async () => {
    expect((await api().post('/api/categories').set(bearer(agent)).send({ name: 'Nope' })).status).toBe(403);
  });

  it('refuse a duplicate name', async () => {
    expect((await api().post('/api/categories').set(bearer(admin)).send({ name: 'Policies' })).status).toBe(409);
  });

  it('can be added, renamed and deleted while empty', async () => {
    const created = await api().post('/api/categories').set(bearer(admin)).send({ name: 'Test category' });
    expect(created.status).toBe(201);

    const renamed = await api().put(`/api/categories/${created.body.id}`).set(bearer(admin)).send({ name: 'Renamed category' });
    expect(renamed.body.name).toBe('Renamed category');

    expect((await api().delete(`/api/categories/${created.body.id}`).set(bearer(admin))).status).toBe(204);
  });

  it("can't be deleted while articles use them", async () => {
    const categories = await api().get('/api/categories').set(bearer(admin));
    const billing = categories.body.find((category: { name: string }) => category.name === 'Billing & Payments');
    const res = await api().delete(`/api/categories/${billing.id}`).set(bearer(admin));

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/still has \d+ articles/);
  });

  it('report published and draft counts to admins only', async () => {
    const res = await api().get('/api/stats/categories').set(bearer(admin));
    const total = res.body.reduce((sum: number, row: { total: number }) => sum + row.total, 0);
    const drafts = res.body.reduce((sum: number, row: { drafts: number }) => sum + row.drafts, 0);

    expect(total).toBe(20);
    expect(drafts).toBe(3);
    expect((await api().get('/api/stats/categories').set(bearer(agent))).status).toBe(403);
  });
});
