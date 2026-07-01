import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import type { User } from '../api/mock-api';
import { createUser, fetchUsers } from '../api/mock-api';
import { useCreateUser, useUsers } from './use-users';

vi.mock('../api/mock-api', () => ({
  fetchUsers: vi.fn(),
  createUser: vi.fn(),
}));

const mockFetchUsers = vi.mocked(fetchUsers);
const mockCreateUser = vi.mocked(createUser);

const MOCK_USERS: User[] = [
  { id: '1', name: 'Ana Silva', email: 'ana@velaui.demo', role: 'admin', tenantId: 'tenant-alpha' },
];

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches users using the search term and exposes the result', async () => {
    mockFetchUsers.mockResolvedValue(MOCK_USERS);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useUsers({ search: 'ana', page: 1 }), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchUsers).toHaveBeenCalledWith('ana');
    expect(result.current.data).toEqual(MOCK_USERS);
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

  it('optimistically appends the new user to matching cached queries', async () => {
    let resolveCreate: (user: User) => void = () => {};
    mockCreateUser.mockImplementation(
      () =>
        new Promise<User>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const queryClient = createTestQueryClient();
    const cacheKey = ['users', { search: undefined, page: 1 }];
    queryClient.setQueryData(cacheKey, MOCK_USERS);

    const { result } = renderHook(() => useCreateUser(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ name: 'New User', email: 'new@velaui.demo', role: 'editor' });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<User[]>(cacheKey);
      expect(cached).toHaveLength(2);
    });

    const cached = queryClient.getQueryData<User[]>(cacheKey);
    expect(cached?.[1]).toMatchObject({
      name: 'New User',
      email: 'new@velaui.demo',
      role: 'editor',
      tenantId: 'tenant-alpha',
    });
    expect(cached?.[1].id).toMatch(/^optimistic-/);

    resolveCreate({ id: 'server-id', name: 'New User', email: 'new@velaui.demo', role: 'editor', tenantId: 'tenant-alpha' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('seeds the cache with just the optimistic user when no data was cached yet', async () => {
    mockFetchUsers.mockImplementation(() => new Promise<User[]>(() => {}));
    mockCreateUser.mockImplementation(() => new Promise<User>(() => {}));

    const queryClient = createTestQueryClient();
    const cacheKey = ['users', { search: undefined, page: 1 }];

    const { result } = renderHook(
      () => ({
        users: useUsers({ search: undefined, page: 1 }),
        createUser: useCreateUser(),
      }),
      { wrapper: createQueryWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.users.isLoading).toBe(true));
    expect(queryClient.getQueryData(cacheKey)).toBeUndefined();

    act(() => {
      result.current.createUser.mutate({ name: 'New User', email: 'new@velaui.demo', role: 'editor' });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<User[]>(cacheKey);
      expect(cached).toHaveLength(1);
    });
    expect(queryClient.getQueryData<User[]>(cacheKey)?.[0].id).toMatch(/^optimistic-/);
  });

  it('reverts the optimistic update and invalidates queries when the mutation fails', async () => {
    mockCreateUser.mockRejectedValue(new Error('failed'));
    const queryClient = createTestQueryClient();
    const cacheKey = ['users', { search: undefined, page: 1 }];
    queryClient.setQueryData(cacheKey, MOCK_USERS);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateUser(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ name: 'New User', email: 'new@velaui.demo', role: 'editor' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(cacheKey)).toEqual(MOCK_USERS);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });

  it('invalidates the users query after a successful mutation', async () => {
    const createdUser: User = {
      id: 'server-id',
      name: 'New User',
      email: 'new@velaui.demo',
      role: 'editor',
      tenantId: 'tenant-alpha',
    };
    mockCreateUser.mockResolvedValue(createdUser);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateUser(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ name: 'New User', email: 'new@velaui.demo', role: 'editor' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });
});
