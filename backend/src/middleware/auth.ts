import type { RequestHandler } from 'express';
import type { Role } from '../generated/prisma/enums.js';
import { HttpError } from '../utils/HttpError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw HttpError.unauthorized('Missing access token');
  }

  req.user = verifyAccessToken(header.slice('Bearer '.length));
  next();
};

// use after authenticate, e.g. authorize('ADMIN') or authorize('EDITOR', 'ADMIN')
export function authorize(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      throw HttpError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw HttpError.forbidden('You do not have permission to do this');
    }
    next();
  };
}
