import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import type { CreatedUser, User } from '../api/users-api';
import { createUser, deleteUser, fetchUsers, updateUser } from '../api/users-api';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from './use-users';

vi.mock('../api/users-api', () => ({
  fetchUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

const mockFetchUsers = vi.mocked(fetchUsers);
const mockCreateUser = vi.mocked(createUser);
const mockUpdateUser = vi.mocked(updateUser);
const mockDeleteUser = vi.mocked(deleteUser);

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

describe('useUpdateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateUser with id and input, and invalidates the users query on success', async () => {
    const updatedUser: CreatedUser = {
      id: '1',
      email: 'updated@velaui.demo',
      role: 'MEMBER',
      tenantId: 'tenant-alpha',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    mockUpdateUser.mockResolvedValue(updatedUser);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateUser(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ id: '1', input: { email: 'updated@velaui.demo', role: 'MEMBER' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdateUser).toHaveBeenCalledWith('1', { email: 'updated@velaui.demo', role: 'MEMBER' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });

  it('does not invalidate the users query when the mutation fails', async () => {
    mockUpdateUser.mockRejectedValue(new Error('failed'));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateUser(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ id: '1', input: { email: 'bad@velaui.demo' } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('useDeleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteUser with the user id and invalidates the users query on success', async () => {
    mockDeleteUser.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteUser(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // TanStack Query passes the mutation context as the second argument when
    // mutationFn is a direct reference (not wrapped in an arrow function).
    expect(mockDeleteUser).toHaveBeenCalledWith('1', expect.any(Object));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });

  it('does not invalidate the users query when the mutation fails', async () => {
    mockDeleteUser.mockRejectedValue(new Error('failed'));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteUser(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
