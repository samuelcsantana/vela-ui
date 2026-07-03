import { api } from '../../../lib/api';
import type { UserRole } from '../../auth/store/auth-store';

// Mirrors the response of POST /api/users in swagger.json exactly.
export interface CreatedUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  createdAt: string;
}

// Mirrors the response of GET /api/users in swagger.json exactly. `tenant` is scoped
// server-side: VELA_ADMIN sees every user across every tenant, ADMIN only their own.
export interface User extends CreatedUser {
  tenant: {
    name: string;
    slug: string;
  };
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users');
  return data;
}

export interface CreateUserInput {
  email: string;
  password: string;
  tenantId: string;
  role: 'ADMIN' | 'MEMBER';
}

export async function createUser(input: CreateUserInput): Promise<CreatedUser> {
  const { data } = await api.post<CreatedUser>('/users', input);
  return data;
}
