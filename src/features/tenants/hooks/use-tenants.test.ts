import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import { createTenant, deleteTenant, fetchTenants, updateTenant, type Tenant } from '../api/tenants-api';
import { useCreateTenant, useDeleteTenant, useTenants, useUpdateTenant } from './use-tenants';

vi.mock('../api/tenants-api', () => ({
  fetchTenants: vi.fn(),
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
  deleteTenant: vi.fn(),
}));

const mockFetchTenants = vi.mocked(fetchTenants);
const mockCreateTenant = vi.mocked(createTenant);
const mockUpdateTenant = vi.mocked(updateTenant);
const mockDeleteTenant = vi.mocked(deleteTenant);

const MOCK_TENANTS: Tenant[] = [
  { id: '1', slug: 'vela', name: 'Vela Corp', primaryColor: '#0052cc', logoUrl: null, createdAt: '2026-01-01T00:00:00.000Z' },
];

describe('useTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches every tenant from the API', async () => {
    mockFetchTenants.mockResolvedValue(MOCK_TENANTS);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useTenants(), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_TENANTS);
  });

  it('surfaces query errors', async () => {
    mockFetchTenants.mockRejectedValue(new Error('network down'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useTenants(), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates the tenants query after a successful mutation', async () => {
    const createdTenant: Tenant = {
      id: '2',
      slug: 'sicredi',
      name: 'Sicredi',
      primaryColor: null,
      logoUrl: null,
      createdAt: '2026-01-02T00:00:00.000Z',
    };
    mockCreateTenant.mockResolvedValue(createdTenant);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ name: 'Sicredi', slug: 'sicredi' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tenants'] });
  });

  it('does not invalidate the tenants query when the mutation fails', async () => {
    mockCreateTenant.mockRejectedValue(new Error('failed'));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ name: 'Sicredi', slug: 'sicredi' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('useUpdateTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the tenant and invalidates the tenants query on success', async () => {
    const updatedTenant: Tenant = {
      id: '1',
      slug: 'vela',
      name: 'Vela Corp Updated',
      primaryColor: '#0052cc',
      logoUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    mockUpdateTenant.mockResolvedValue(updatedTenant);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ id: '1', input: { name: 'Vela Corp Updated' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdateTenant).toHaveBeenCalledWith('1', { name: 'Vela Corp Updated' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tenants'] });
  });

  it('does not invalidate the tenants query when the mutation fails', async () => {
    mockUpdateTenant.mockRejectedValue(new Error('slug taken'));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ id: '1', input: { name: 'Vela Corp Updated' } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('useDeleteTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes the deleted tenant from the cache on success', async () => {
    mockDeleteTenant.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['tenants'], MOCK_TENANTS);

    const { result } = renderHook(() => useDeleteTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ id: '1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteTenant).toHaveBeenCalledWith('1', { force: undefined });
    expect(queryClient.getQueryData(['tenants'])).toEqual([]);
  });

  it('passes force through to the API when cascade-deleting', async () => {
    mockDeleteTenant.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['tenants'], MOCK_TENANTS);

    const { result } = renderHook(() => useDeleteTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ id: '1', force: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteTenant).toHaveBeenCalledWith('1', { force: true });
  });

  it('leaves the cache untouched when the mutation fails', async () => {
    mockDeleteTenant.mockRejectedValue(new Error('tenant still has users'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['tenants'], MOCK_TENANTS);

    const { result } = renderHook(() => useDeleteTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate({ id: '1' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(['tenants'])).toEqual(MOCK_TENANTS);
  });
});
