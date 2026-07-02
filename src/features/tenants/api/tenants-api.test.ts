import { describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import {
  createTenant,
  fetchPublicTenants,
  fetchTenantBySlug,
  fetchTenants,
  joinTenant,
  updateTenant,
  type PublicTenant,
  type Tenant,
} from './tenants-api';

vi.mock('../../../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const MOCK_TENANTS: Tenant[] = [
  {
    id: 'tenant-1',
    slug: 'vela',
    name: 'Vela Corp',
    primaryColor: '#0052cc',
    logoUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const MOCK_PUBLIC_TENANTS: PublicTenant[] = [{ id: 'tenant-1', name: 'Vela Corp', slug: 'vela' }];

describe('fetchTenants', () => {
  it('gets /tenants and returns the response data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: MOCK_TENANTS });

    const tenants = await fetchTenants();

    expect(api.get).toHaveBeenCalledWith('/tenants');
    expect(tenants).toEqual(MOCK_TENANTS);
  });
});

describe('createTenant', () => {
  it('posts /tenants with the given input and returns the created tenant', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });

    const input = { name: 'Vela Corp', slug: 'vela', primaryColor: '#0052cc' };
    const result = await createTenant(input);

    expect(api.post).toHaveBeenCalledWith('/tenants', input);
    expect(result).toEqual(MOCK_TENANTS[0]);
  });
});

describe('fetchTenantBySlug', () => {
  it('gets /tenants/{slug} and returns the response data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });

    const tenant = await fetchTenantBySlug('vela');

    expect(api.get).toHaveBeenCalledWith('/tenants/vela');
    expect(tenant).toEqual(MOCK_TENANTS[0]);
  });
});

describe('updateTenant', () => {
  it('patches /tenants/{id} with only the given fields and returns the updated tenant', async () => {
    const updated = { ...MOCK_TENANTS[0], name: 'Vela Corp Updated' };
    vi.mocked(api.patch).mockResolvedValueOnce({ data: updated });

    const result = await updateTenant('tenant-1', { name: 'Vela Corp Updated' });

    expect(api.patch).toHaveBeenCalledWith('/tenants/tenant-1', { name: 'Vela Corp Updated' });
    expect(result).toEqual(updated);
  });
});

describe('fetchPublicTenants', () => {
  it('gets /tenants/public and returns the response data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: MOCK_PUBLIC_TENANTS });

    const tenants = await fetchPublicTenants();

    expect(api.get).toHaveBeenCalledWith('/tenants/public');
    expect(tenants).toEqual(MOCK_PUBLIC_TENANTS);
  });
});

describe('joinTenant', () => {
  it('posts /auth/register with the given input and returns the created user', async () => {
    const mockResult = { id: 'user-1', email: 'new@vela.com', role: 'MEMBER', tenantId: 'tenant-1', createdAt: '2026-01-01T00:00:00.000Z' };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult });

    const input = { tenantId: 'tenant-1', role: 'MEMBER' as const, email: 'new@vela.com', password: 'secret123' };
    const result = await joinTenant(input);

    expect(api.post).toHaveBeenCalledWith('/auth/register', input);
    expect(result).toEqual(mockResult);
  });
});
