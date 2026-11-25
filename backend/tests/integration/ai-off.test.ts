import { beforeAll, describe, expect, it } from 'vitest';
import { AGENT, api, bearer, EDITOR, login, reseed } from '../helpers.js';

// no GEMINI_API_KEY in tests, so this is what someone without a key sees
let agent: string;
let editor: string;

beforeAll(async () => {
  reseed();
  agent = (await login(AGENT)).token;
  editor = (await login(EDITOR)).token;
});

const fakePdf = Buffer.from('%PDF-1.7\n%fake but starts like a pdf');

describe('without a Gemini key', () => {
  it('Ask the KB says the AI is unavailable', async () => {
    const res = await api().post('/api/ask').set(bearer(agent)).send({ question: 'Customer was charged twice' });
    expect(res.status).toBe(503);
    expect(res.body.message).toContain('AI unavailable');
  });

  it('PDF import says the AI is unavailable', async () => {
    const res = await api().post('/api/articles/import').set(bearer(editor)).attach('file', fakePdf, { filename: 'sop.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(503);
  });

  it('articles still save', async () => {
    const categories = await api().get('/api/categories').set(bearer(editor));
    const res = await api()
      .post('/api/articles')
      .set(bearer(editor))
      .send({ title: 'Saved without AI', content: '# Saved without AI\n\n## Steps\n1. Test.', categoryId: categories.body[0].id });
    expect(res.status).toBe(201);
  });
});

describe('ask and import checks that run before the AI', () => {
  it('ask needs a token and a 5 to 500 character question', async () => {
    expect((await api().post('/api/ask').send({ question: 'charged twice' })).status).toBe(401);
    expect((await api().post('/api/ask').set(bearer(agent)).send({ question: 'hi' })).status).toBe(400);
  });

  it('import is for editors and admins only', async () => {
    const res = await api().post('/api/articles/import').set(bearer(agent)).attach('file', fakePdf, { filename: 'sop.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(403);
  });

  it('import needs a file', async () => {
    expect((await api().post('/api/articles/import').set(bearer(editor))).status).toBe(400);
  });

  it('import refuses a file that only claims to be a PDF', async () => {
    const res = await api()
      .post('/api/articles/import')
      .set(bearer(editor))
      .attach('file', Buffer.from('just some text'), { filename: 'notes.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('This file is not a PDF');
  });

  it('import refuses a file over 5 MB', async () => {
    const big = Buffer.concat([Buffer.from('%PDF'), Buffer.alloc(5 * 1024 * 1024 + 1)]);
    const res = await api().post('/api/articles/import').set(bearer(editor)).attach('file', big, { filename: 'big.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(413);
  });
});
