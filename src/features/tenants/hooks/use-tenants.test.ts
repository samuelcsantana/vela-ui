import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import { createTenant, fetchTenants, type Tenant } from '../api/tenants-api';
import { useCreateTenant, useTenants } from './use-tenants';

vi.mock('../api/tenants-api', () => ({
  fetchTenants: vi.fn(),
  createTenant: vi.fn(),
}));

const mockFetchTenants = vi.mocked(fetchTenants);
const mockCreateTenant = vi.mocked(createTenant);

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
