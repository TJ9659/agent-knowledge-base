import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText, readPdf } from '../../src/lib/gemini.js';
import { ADMIN, AGENT, api, bearer, EDITOR, EDITOR2, login, reseed } from '../helpers.js';

// a fake gemini: tests decide what it replies, nothing is sent to google
vi.mock('../../src/lib/gemini.js', () => ({
  isGeminiEnabled: () => true,
  embedText: async () => null,
  generateText: vi.fn(),
  readPdf: vi.fn(),
}));

const reply = vi.mocked(generateText);
const pdfReply = vi.mocked(readPdf);
const tokens: string[] = [];
let editor: string;

beforeAll(async () => {
  reseed();
  // ask allows 10 questions a minute per user, so questions are spread over a few accounts
  for (const email of [AGENT, ADMIN, EDITOR2]) tokens.push((await login(email)).token);
  editor = (await login(EDITOR)).token;
});

beforeEach(() => {
  reply.mockReset();
  pdfReply.mockReset();
});

let turn = 0;
const ask = (question: string) =>
  api()
    .post('/api/ask')
    .set(bearer(tokens[turn++ % tokens.length]!))
    .send({ question });
const promptSent = () => String(reply.mock.calls[0]?.[0].prompt);
// the articles part only, the question is added after them
const articlesSent = () => promptSent().split('QUESTION:')[0];

describe('Ask the KB', () => {
  it('sends the matching published articles and returns only the ones the answer cites', async () => {
    reply.mockResolvedValue('1. Verify the caller. [1]\n2. Raise a refund request. [1]');
    const res = await ask('Customer was charged twice, what do I do?');

    expect(res.status).toBe(200);
    expect(promptSent()).toContain('[1] Handling a double charge');
    expect(res.body.sources).toEqual([expect.objectContaining({ ref: 1, title: 'Handling a double charge' })]);
  });

  it('reads citations written as [1, 2]', async () => {
    reply.mockResolvedValue('1. Do both. [1, 2]');
    const res = await ask('Customer was charged twice');
    expect(res.body.sources.map((source: { ref: number }) => source.ref)).toEqual([1, 2]);
  });

  it('never sends a draft to the AI', async () => {
    reply.mockResolvedValue('No article covers this.');
    await ask('eSIM activation guide');
    expect(articlesSent()).not.toContain('eSIM activation guide');
  });

  it('splits general advice from article-based steps', async () => {
    reply.mockResolvedValue('1. Check auto-renew. [1]\nGENERAL ADVICE\n1. Restart the phone.');
    const res = await ask('why did the data plan change');

    expect(res.body.answer).toBe('1. Check auto-renew. [1]');
    expect(res.body.general).toBe('1. Restart the phone.');
  });

  it('refuses an off-topic question', async () => {
    reply.mockResolvedValue('OFF_TOPIC');
    const res = await ask('what is the capital of France');

    expect(res.body.answer).toBe('I can only help with customer service questions.');
    expect(res.body.sources).toEqual([]);
  });

  it('asks once more when a question that matched articles is called off topic', async () => {
    reply.mockResolvedValueOnce('OFF_TOPIC').mockResolvedValueOnce('1. Check the coverage map. [1]');
    const res = await ask('internet is really slow');

    expect(reply).toHaveBeenCalledTimes(2);
    expect(res.body.sources).toHaveLength(1);
  });

  it("doesn't call the AI when there is nothing to search for", async () => {
    const res = await ask('what do I do?');

    expect(reply).not.toHaveBeenCalled();
    expect(res.body.answer).toContain('No article covers this');
  });

  it('returns 503 when every model fails', async () => {
    reply.mockResolvedValue(null);
    expect((await ask('Customer was charged twice')).status).toBe(503);
  });
});

describe('PDF import', () => {
  const pdf = Buffer.from('%PDF-1.7\n%test');
  const importPdf = () =>
    api().post('/api/articles/import').set(bearer(editor)).attach('file', pdf, { filename: 'sop.pdf', contentType: 'application/pdf' });

  it('returns the form fields without saving anything', async () => {
    const fields = { title: 'SIM swap', whenToUse: 'the SIM is lost', steps: '1. Verify the caller.', customer: '', escalate: '', more: '' };
    pdfReply.mockResolvedValue(JSON.stringify(fields));
    const before = (await api().get('/api/articles/mine').set(bearer(editor))).body.total;

    const res = await importPdf();

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fields);
    expect((await api().get('/api/articles/mine').set(bearer(editor))).body.total).toBe(before);
  });

  it('refuses a reply with no steps or broken JSON', async () => {
    pdfReply.mockResolvedValue(JSON.stringify({ title: 'Menu', whenToUse: '', steps: '', customer: '', escalate: '', more: '' }));
    expect((await importPdf()).status).toBe(400);

    pdfReply.mockResolvedValue('not json');
    expect((await importPdf()).status).toBe(400);
  });

  it('returns 503 when every model fails', async () => {
    pdfReply.mockResolvedValue(null);
    expect((await importPdf()).status).toBe(503);
  });
});
