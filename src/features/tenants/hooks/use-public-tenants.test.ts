import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import { fetchPublicTenants, type PublicTenant } from '../api/tenants-api';
import { usePublicTenants } from './use-public-tenants';

vi.mock('../api/tenants-api', () => ({
  fetchPublicTenants: vi.fn(),
}));

const mockFetchPublicTenants = vi.mocked(fetchPublicTenants);

const MOCK_PUBLIC_TENANTS: PublicTenant[] = [{ id: '1', name: 'Vela Corp', slug: 'vela' }];

describe('usePublicTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the public tenant list', async () => {
    mockFetchPublicTenants.mockResolvedValue(MOCK_PUBLIC_TENANTS);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => usePublicTenants(), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_PUBLIC_TENANTS);
  });

  it('surfaces query errors', async () => {
    mockFetchPublicTenants.mockRejectedValue(new Error('network down'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => usePublicTenants(), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
