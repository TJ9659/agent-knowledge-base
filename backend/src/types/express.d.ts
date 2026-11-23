import type { Role } from '../generated/prisma/enums.js';

export interface AuthUser {
  id: number;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      // set by authenticate middleware after access token is verified
      user?: AuthUser;
    }
  }
}
