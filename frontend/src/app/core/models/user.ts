export type Role = 'ADMIN' | 'EDITOR' | 'AGENT';

// how each role is written on screen
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  AGENT: 'Agent',
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

// what the admin create-user form sends
export interface UserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

// what an admin can change on an existing user
export type UserChanges = Partial<Pick<User, 'name' | 'role' | 'isActive'>>;

export interface AuthResponse {
  accessToken: string;
  user: User;
}
