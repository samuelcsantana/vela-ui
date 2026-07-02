import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import { createUser } from '../../users/api/users-api';
import { createTenant } from '../api/tenants-api';
import { useRegisterTenant } from './use-register-tenant';

vi.mock('../api/tenants-api', () => ({
  createTenant: vi.fn(),
}));

vi.mock('../../users/api/users-api', () => ({
  createUser: vi.fn(),
}));

const mockCreateTenant = vi.mocked(createTenant);
const mockCreateUser = vi.mocked(createUser);

const REGISTER_VALUES = {
  companyName: 'Vela Corp',
  slug: 'vela-corp',
  email: 'admin@vela.com',
  password: 'secret123',
};

const MOCK_TENANT = {
  id: 'tenant-1',
  slug: 'vela-corp',
  name: 'Vela Corp',
  primaryColor: null,
  logoUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const MOCK_USER = {
  id: 'user-1',
  email: 'admin@vela.com',
  role: 'ADMIN',
  tenantId: 'tenant-1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useRegisterTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the tenant, then the user under that tenant, and invalidates cached lists', async () => {
    mockCreateTenant.mockResolvedValue(MOCK_TENANT);
    mockCreateUser.mockResolvedValue(MOCK_USER);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRegisterTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate(REGISTER_VALUES);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCreateTenant).toHaveBeenCalledWith({ name: 'Vela Corp', slug: 'vela-corp' });
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'admin@vela.com',
      password: 'secret123',
      tenantId: 'tenant-1',
    });
    expect(result.current.data).toEqual({ tenantId: 'tenant-1', userId: 'user-1' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tenants'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });

  it('does not create a user when tenant creation fails', async () => {
    mockCreateTenant.mockRejectedValue(new Error('slug taken'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useRegisterTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate(REGISTER_VALUES);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('surfaces an error when user creation fails after the tenant was created', async () => {
    mockCreateTenant.mockResolvedValue(MOCK_TENANT);
    mockCreateUser.mockRejectedValue(new Error('email taken'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useRegisterTenant(), { wrapper: createQueryWrapper(queryClient) });

    act(() => {
      result.current.mutate(REGISTER_VALUES);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
