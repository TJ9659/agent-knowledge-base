import { ApiError, GoogleGenAI, type ContentListUnion, type GenerateContentConfig } from '@google/genai';
import { env } from '../config/env.js';

// null when no key is set, so the ai features can say they are unavailable instead of crashing
const client = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

// tried in order, the next one is used when a model is busy, out of quota or too slow
const MODELS = env.GEMINI_MODELS.split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const TIMEOUT_MS = 5_000;
// reading a whole pdf takes longer than answering a question
const PDF_TIMEOUT_MS = 30_000;
const EMBEDDING_DIMENSIONS = 768;
// a model that just failed is skipped for a minute, so the next questions don't wait on it again
const COOLDOWN_MS = 60_000;
const failedAt = new Map<string, number>();

// "this model can't answer right now", so another model might
// 400 is not here: a bad key or bad request fails the same way on every model
const TRY_NEXT_STATUSES = [403, 404, 408, 429, 500, 502, 503, 504];

interface GenerateInput {
  prompt: string;
  instructions: string;
  temperature?: number;
}

interface ReadPdfInput {
  pdf: Buffer;
  instructions: string;
  // the json shape the answer must follow, gemini sticks to it so the reply never needs cutting apart
  schema: object;
}

export function isGeminiEnabled() {
  return client !== null;
}

function shouldTryNext(err: unknown) {
  if (err instanceof ApiError) return TRY_NEXT_STATUSES.includes(err.status);
  // a timeout or a network error
  return true;
}

function isCoolingDown(model: string) {
  const time = failedAt.get(model);
  return time !== undefined && Date.now() - time < COOLDOWN_MS;
}

// models that failed recently go last instead of first, so they still get a chance if nothing else works
function modelsInOrder() {
  return [...MODELS.filter((model) => !isCoolingDown(model)), ...MODELS.filter(isCoolingDown)];
}

function describe(err: unknown) {
  if (err instanceof Error && err.name === 'AbortError') return 'timed out';
  if (err instanceof ApiError) return `${err.status} ${err.message.slice(0, 120)}`;
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

// tries each model in turn, returns the first answer's text or null when none of them could answer
async function firstAnswer(contents: ContentListUnion, config: GenerateContentConfig, timeoutMs: number) {
  if (!client) return null;

  for (const model of modelsInOrder()) {
    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config: { ...config, abortSignal: AbortSignal.timeout(timeoutMs) },
      });
      failedAt.delete(model);
      return response.text?.trim() ?? '';
    } catch (err) {
      console.warn(`gemini ${model} failed: ${describe(err)}`);
      if (!shouldTryNext(err)) break;
      failedAt.set(model, Date.now());
    }
  }
  return null;
}

export function generateText({ prompt, instructions, temperature = 0.2 }: GenerateInput) {
  return firstAnswer(prompt, { systemInstruction: instructions, temperature }, TIMEOUT_MS);
}

// gemini reads the pdf itself, scanned pages included, and answers in the given json shape
export function readPdf({ pdf, instructions, schema }: ReadPdfInput) {
  const contents = [
    { inlineData: { mimeType: 'application/pdf', data: pdf.toString('base64') } },
    { text: 'Turn this document into a knowledge base article.' },
  ];
  const config = {
    systemInstruction: instructions,
    temperature: 0.1,
    responseMimeType: 'application/json',
    responseJsonSchema: schema,
  };
  return firstAnswer(contents, config, PDF_TIMEOUT_MS);
}

// the meaning vector of a text, or null when gemini can't make one right now
// articles and questions use different task types, gemini tunes each side for search
export async function embedText(text: string, purpose: 'article' | 'question') {
  if (!client) return null;

  try {
    const response = await client.models.embedContent({
      model: env.GEMINI_EMBEDDING_MODEL,
      contents: text,
      config: {
        taskType: purpose === 'article' ? 'RETRIEVAL_DOCUMENT' : 'RETRIEVAL_QUERY',
        outputDimensionality: EMBEDDING_DIMENSIONS,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });
    return response.embeddings?.[0]?.values ?? null;
  } catch (err) {
    console.warn(`gemini embedding failed: ${describe(err)}`);
    return null;
  }
}
