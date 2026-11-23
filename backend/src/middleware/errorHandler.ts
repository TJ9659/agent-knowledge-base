import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/HttpError.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ status: err.status, message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 400,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
    return;
  }

  // bad json body from express.json()
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ status: 400, message: 'Invalid JSON body' });
    return;
  }

  console.error(err);
  res.status(500).json({ status: 500, message: 'Internal server error' });
};
