import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import type { CreatedUser, User } from '../api/users-api';
import { createUser, fetchUsers } from '../api/users-api';
import { useCreateUser, useUsers } from './use-users';

vi.mock('../api/users-api', () => ({
  fetchUsers: vi.fn(),
  createUser: vi.fn(),
}));

const mockFetchUsers = vi.mocked(fetchUsers);
const mockCreateUser = vi.mocked(createUser);

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'ana@velaui.demo',
    role: 'ADMIN',
    tenantId: 'tenant-alpha',
    createdAt: '2026-01-01T00:00:00.000Z',
    tenant: { name: 'Vela Corp', slug: 'vela' },
  },
  {
    id: '2',
    email: 'bruno@velaui.demo',
    role: 'MEMBER',
    tenantId: 'tenant-alpha',
    createdAt: '2026-01-02T00:00:00.000Z',
    tenant: { name: 'Vela Corp', slug: 'vela' },
  },
];

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches every user from the API', async () => {
    mockFetchUsers.mockResolvedValue(MOCK_USERS);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useUsers({ search: undefined, page: 1 }), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchUsers).toHaveBeenCalled();
    expect(result.current.data).toEqual(MOCK_USERS);
  });

  it('filters the fetched users by a case-insensitive, trimmed email match', async () => {
    mockFetchUsers.mockResolvedValue(MOCK_USERS);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useUsers({ search: '  ANA  ', page: 1 }), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([MOCK_USERS[0]]);
  });

  it('surfaces query errors', async () => {
    mockFetchUsers.mockRejectedValue(new Error('network down'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useUsers({ search: undefined, page: 1 }), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useCreateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates the users query after a successful mutation', async () => {
    const createdUser: CreatedUser = {
      id: 'server-id',
      email: 'new@velaui.demo',
      role: 'MEMBER',
      tenantId: 'tenant-alpha',
      createdAt: '2026-01-03T00:00:00.000Z',
    };
    mockCreateUser.mockResolvedValue(createdUser);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateUser(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ email: 'new@velaui.demo', password: 'secret123', tenantId: 'tenant-alpha', role: 'MEMBER' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCreateUser.mock.calls[0][0]).toEqual({
      email: 'new@velaui.demo',
      password: 'secret123',
      tenantId: 'tenant-alpha',
      role: 'MEMBER',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });

  it('does not invalidate the users query when the mutation fails', async () => {
    mockCreateUser.mockRejectedValue(new Error('failed'));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateUser(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ email: 'new@velaui.demo', password: 'secret123', tenantId: 'tenant-alpha', role: 'MEMBER' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
