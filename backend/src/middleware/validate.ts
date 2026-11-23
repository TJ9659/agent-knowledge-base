import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

// parses req.body, a ZodError goes to errorHandler as a 400
export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}
