import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, AGENT, api, articleId, bearer, EDITOR, login, reseed } from '../helpers.js';

let agent: string;
let editor: string;
let admin: string;
let priyasArticle: number;
let danielsDraft: number;
let categoryId: number;

beforeAll(async () => {
  reseed();
  agent = (await login(AGENT)).token;
  editor = (await login(EDITOR)).token;
  admin = (await login(ADMIN)).token;
  priyasArticle = await articleId(admin, 'Refund and cancellation policy');
  danielsDraft = await articleId(admin, 'eSIM activation guide');
  const categories = await api().get('/api/categories').set(bearer(agent));
  categoryId = categories.body[0].id;
});

const newArticle = () => ({
  title: 'Test article',
  content: '# Test article\n\n**When to use:** testing.\n\n## Steps\n1. Test.',
  categoryId,
});

describe('reading', () => {
  it('lists only published articles, without the full content', async () => {
    const res = await api().get('/api/articles').query({ pageSize: 50 }).set(bearer(agent));

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(17);
    expect(res.body.data.every((article: { status: string }) => article.status === 'PUBLISHED')).toBe(true);
    expect(res.body.data[0]).toHaveProperty('snippet');
    expect(res.body.data[0]).not.toHaveProperty('content');
  });

  it("hides someone else's draft with a 404, so agents can't tell it exists", async () => {
    expect((await api().get(`/api/articles/${danielsDraft}`).set(bearer(agent))).status).toBe(404);
  });

  it('shows a draft to its author and to admins', async () => {
    expect((await api().get(`/api/articles/${danielsDraft}`).set(bearer(editor))).status).toBe(200);
    expect((await api().get(`/api/articles/${danielsDraft}`).set(bearer(admin))).status).toBe(200);
  });

  it('ignores ?status=DRAFT for anyone but an admin', async () => {
    const asAgent = await api().get('/api/articles').query({ status: 'DRAFT' }).set(bearer(agent));
    const asAdmin = await api().get('/api/articles').query({ status: 'DRAFT' }).set(bearer(admin));

    expect(asAgent.body.data.every((article: { status: string }) => article.status === 'PUBLISHED')).toBe(true);
    expect(asAdmin.body.total).toBe(3);
  });
});

describe('writing', () => {
  it('refuses an agent', async () => {
    expect((await api().post('/api/articles').set(bearer(agent)).send(newArticle())).status).toBe(403);
  });

  it('lets an editor create, edit and delete their own article', async () => {
    const created = await api().post('/api/articles').set(bearer(editor)).send(newArticle());
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('DRAFT');

    const mine = await api().get('/api/articles/mine').set(bearer(editor));
    expect(mine.body.data.some((article: { id: number }) => article.id === created.body.id)).toBe(true);

    const updated = await api().put(`/api/articles/${created.body.id}`).set(bearer(editor)).send({ status: 'PUBLISHED' });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('PUBLISHED');

    expect((await api().delete(`/api/articles/${created.body.id}`).set(bearer(editor))).status).toBe(204);
    expect((await api().get(`/api/articles/${created.body.id}`).set(bearer(editor))).status).toBe(404);
  });

  it("stops an editor changing someone else's article", async () => {
    expect((await api().put(`/api/articles/${priyasArticle}`).set(bearer(editor)).send({ title: 'Hijacked' })).status).toBe(403);
    expect((await api().delete(`/api/articles/${priyasArticle}`).set(bearer(editor))).status).toBe(403);
  });

  it("lets an admin change anyone's article", async () => {
    const res = await api().put(`/api/articles/${priyasArticle}`).set(bearer(admin)).send({ title: 'Refund and cancellation policy' });
    expect(res.status).toBe(200);
  });

  it('takes the author from the token, not the request body', async () => {
    const res = await api().post('/api/articles').set(bearer(editor)).send({ ...newArticle(), authorId: 1 });
    const me = await api().get('/api/auth/me').set(bearer(editor));

    expect(res.body.author.id).toBe(me.body.id);
    await api().delete(`/api/articles/${res.body.id}`).set(bearer(editor));
  });

  it('rejects a missing category and an empty update', async () => {
    expect((await api().post('/api/articles').set(bearer(editor)).send({ ...newArticle(), categoryId: 999999 })).status).toBe(400);
    expect((await api().put(`/api/articles/${danielsDraft}`).set(bearer(editor)).send({})).status).toBe(400);
  });
});

describe('search', () => {
  const firstTitle = async (q: string) => {
    const res = await api().get('/api/articles').query({ q }).set(bearer(agent));
    return res.body.data[0]?.title;
  };

  it('matches the start of a word', async () => {
    expect(await firstTitle('ref')).toBe('Refund and cancellation policy');
  });

  it('matches other forms of a word and ranks all-word matches first', async () => {
    expect(await firstTitle('charged twice')).toBe('Handling a double charge');
  });

  it('never returns drafts', async () => {
    const res = await api().get('/api/articles').query({ q: 'eSIM activation' }).set(bearer(agent));
    expect(res.body.data.some((article: { title: string }) => article.title === 'eSIM activation guide')).toBe(false);
  });

  it('treats search operators as plain text', async () => {
    expect((await api().get('/api/articles').query({ q: '+refund -"drop' }).set(bearer(agent))).status).toBe(200);
  });
});
