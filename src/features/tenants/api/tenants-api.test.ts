import { describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import { createTenant, fetchTenants, type Tenant } from './tenants-api';

vi.mock('../../../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
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

    const input = { name: 'Vela Corp', slug: 'vela' };
    const result = await createTenant(input);

    expect(api.post).toHaveBeenCalledWith('/tenants', input);
    expect(result).toEqual(MOCK_TENANTS[0]);
  });
});
