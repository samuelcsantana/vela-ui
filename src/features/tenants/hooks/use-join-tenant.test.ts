import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import { joinTenant, type JoinTenantResult } from '../api/tenants-api';
import { useJoinTenant } from './use-join-tenant';

vi.mock('../api/tenants-api', () => ({
  joinTenant: vi.fn(),
}));

const mockJoinTenant = vi.mocked(joinTenant);

const JOIN_INPUT = { tenantId: 'tenant-1', role: 'MEMBER' as const, email: 'new@vela.com', password: 'secret123' };

const MOCK_RESULT: JoinTenantResult = {
  id: 'user-1',
  email: 'new@vela.com',
  role: 'MEMBER',
  tenantId: 'tenant-1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useJoinTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins the tenant with the given input', async () => {
    mockJoinTenant.mockResolvedValue(MOCK_RESULT);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useJoinTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate(JOIN_INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockJoinTenant.mock.calls[0][0]).toEqual(JOIN_INPUT);
    expect(result.current.data).toEqual(MOCK_RESULT);
  });

  it('surfaces mutation errors', async () => {
    mockJoinTenant.mockRejectedValue(new Error('email taken'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useJoinTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate(JOIN_INPUT);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
