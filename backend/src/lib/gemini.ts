import { ApiError, GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

// null when no key is set, so the ai features can say they are unavailable instead of crashing
const client = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

// tried in order, the next one is used when a model is busy, out of quota or too slow
const MODELS = env.GEMINI_MODELS.split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const TIMEOUT_MS = 10_000;

// "this model can't answer right now", so another model might
// 400 is not here: a bad key or bad request fails the same way on every model
const TRY_NEXT_STATUSES = [403, 404, 408, 429, 500, 502, 503, 504];

interface GenerateInput {
  prompt: string;
  instructions: string;
  temperature?: number;
}

export function isGeminiEnabled() {
  return client !== null;
}

function shouldTryNext(err: unknown) {
  if (err instanceof ApiError) return TRY_NEXT_STATUSES.includes(err.status);
  // a timeout or a network error
  return true;
}

function describe(err: unknown) {
  if (err instanceof Error && err.name === 'AbortError') return `no answer within ${TIMEOUT_MS / 1000}s`;
  if (err instanceof ApiError) return `${err.status} ${err.message.slice(0, 120)}`;
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

// returns the text from the first model that answers, or null when none of them could
export async function generateText({ prompt, instructions, temperature = 0.2 }: GenerateInput) {
  if (!client) return null;

  for (const model of MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction: instructions, temperature, abortSignal: AbortSignal.timeout(TIMEOUT_MS) },
      });
      return response.text?.trim() ?? '';
    } catch (err) {
      console.warn(`gemini ${model} failed: ${describe(err)}`);
      if (!shouldTryNext(err)) break;
    }
  }
  return null;
}
