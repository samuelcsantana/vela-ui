import { describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import { createUser, fetchUsers, type User } from './users-api';

vi.mock('../../../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const MOCK_USERS: User[] = [
  { id: '1', email: 'ana@velaui.demo', role: 'ADMIN', tenantId: 'tenant-alpha', createdAt: '2026-01-01T00:00:00.000Z' },
];

describe('fetchUsers', () => {
  it('gets /users and returns the response data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: MOCK_USERS });

    const users = await fetchUsers();

    expect(api.get).toHaveBeenCalledWith('/users');
    expect(users).toEqual(MOCK_USERS);
  });
});

describe('createUser', () => {
  it('posts /users with the given input and returns the created user', async () => {
    const createdUser: User = {
      id: '2',
      email: 'new@velaui.demo',
      role: 'MEMBER',
      tenantId: 'tenant-alpha',
      createdAt: '2026-01-02T00:00:00.000Z',
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: createdUser });

    const input = { email: 'new@velaui.demo', password: 'secret123', tenantId: 'tenant-alpha' };
    const result = await createUser(input);

    expect(api.post).toHaveBeenCalledWith('/users', input);
    expect(result).toEqual(createdUser);
  });
});
