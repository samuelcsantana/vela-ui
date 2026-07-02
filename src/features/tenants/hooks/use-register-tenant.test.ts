import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import { registerTenant } from '../api/tenants-api';
import { useRegisterTenant } from './use-register-tenant';

vi.mock('../api/tenants-api', () => ({
  registerTenant: vi.fn(),
}));

const mockRegisterTenant = vi.mocked(registerTenant);

const REGISTER_VALUES = {
  companyName: 'Vela Corp',
  slug: 'vela-corp',
  email: 'admin@vela.com',
  password: 'secret123',
};

const MOCK_RESULT = { tenantId: 'tenant-1', userId: 'user-1' };

describe('useRegisterTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the tenant and invalidates cached lists on success', async () => {
    mockRegisterTenant.mockResolvedValue(MOCK_RESULT);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRegisterTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate(REGISTER_VALUES);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRegisterTenant.mock.calls[0][0]).toEqual(REGISTER_VALUES);
    expect(result.current.data).toEqual(MOCK_RESULT);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tenants'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });

  it('surfaces an error when registration fails', async () => {
    mockRegisterTenant.mockRejectedValue(new Error('slug taken'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useRegisterTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate(REGISTER_VALUES);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
