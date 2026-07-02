import { api } from '../../../lib/api';

// Mirrors the response of GET/POST /api/users in swagger.json exactly.
export interface User {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  createdAt: string;
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users');
  return data;
}

export interface CreateUserInput {
  email: string;
  password: string;
  tenantId: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await api.post<User>('/users', input);
  return data;
}
