import { rateLimit } from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 429, message: 'Too many login attempts, try again later' },
});

// per user, protects the free gemini quota, use after authenticate
export const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => String(req.user?.id),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 429, message: 'Too many questions, wait a minute and try again' },
});

// reading a pdf costs more than a question, so fewer are allowed
export const importLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req) => String(req.user?.id),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 429, message: 'Too many imports, wait a minute and try again' },
});
