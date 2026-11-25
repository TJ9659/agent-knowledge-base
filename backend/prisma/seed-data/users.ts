import type { Role } from '../../src/generated/prisma/enums.js';

export const DEMO_PASSWORD = 'Password123!';

export const users: { name: string; email: string; role: Role; isActive: boolean; isProtected?: boolean }[] = [
  { name: 'Admin User', email: 'admin@nexora.test', role: 'ADMIN', isActive: true, isProtected: true },
  { name: 'Daniel Tan', email: 'editor@nexora.test', role: 'EDITOR', isActive: true },
  { name: 'Priya Nair', email: 'editor2@nexora.test', role: 'EDITOR', isActive: true },
  { name: 'Hafiz Ismail', email: 'agent@nexora.test', role: 'AGENT', isActive: true },
  { name: 'Mei Ling Wong', email: 'agent2@nexora.test', role: 'AGENT', isActive: false },
];
