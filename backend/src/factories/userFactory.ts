import type { Prisma } from '../generated/prisma/client.js';
import type { Role } from '../generated/prisma/enums.js';
import { hashPassword } from '../utils/password.js';

interface UserOverrides {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
  isProtected?: boolean;
}

let seq = 0;

export async function buildUser(overrides: UserOverrides = {}): Promise<Prisma.UserCreateInput> {
  seq += 1;
  const { password = 'Password123!', ...rest } = overrides;
  return {
    name: `Test User ${seq}`,
    email: `user${seq}@nexora.test`,
    role: 'AGENT',
    isActive: true,
    ...rest,
    passwordHash: await hashPassword(password),
  };
}
