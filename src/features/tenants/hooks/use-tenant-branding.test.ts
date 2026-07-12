import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../auth/store/auth-store';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import { fetchTenants, type Tenant } from '../api/tenants-api';
import { DEFAULT_BRAND_COLOR } from '../theme';
import { TENANT_BRAND_CSS_VAR, useTenantBranding } from './use-tenant-branding';

vi.mock('../api/tenants-api', () => ({
  fetchTenants: vi.fn(),
}));

const mockFetchTenants = vi.mocked(fetchTenants);

const MOCK_TENANTS: Tenant[] = [
  {
    id: 'tenant-alpha',
    slug: 'vela',
    name: 'Vela Corp',
    primaryColor: '#123456',
    logoUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tenant-beta',
    slug: 'unknown-slug',
    name: 'No Color Co',
    primaryColor: null,
    logoUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('useTenantBranding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.style.removeProperty(TENANT_BRAND_CSS_VAR);
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('does not fetch tenants when there is no logged-in user', () => {
    const queryClient = createTestQueryClient();
    renderHook(() => useTenantBranding(), { wrapper: createQueryWrapper(queryClient) });

    expect(mockFetchTenants).not.toHaveBeenCalled();
  });

  it("sets the CSS variable to the matching tenant's primaryColor", async () => {
    mockFetchTenants.mockResolvedValue(MOCK_TENANTS);
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@vela.com', role: 'ADMIN', tenantId: 'tenant-alpha' },
      isAuthenticated: true,
    });
    const queryClient = createTestQueryClient();

    renderHook(() => useTenantBranding(), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue(TENANT_BRAND_CSS_VAR)).toBe('#123456'),
    );
  });

  it('falls back to the fallback map keyed by slug when primaryColor is null', async () => {
    mockFetchTenants.mockResolvedValue([{ ...MOCK_TENANTS[0], primaryColor: null }]);
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@vela.com', role: 'ADMIN', tenantId: 'tenant-alpha' },
      isAuthenticated: true,
    });
    const queryClient = createTestQueryClient();

    renderHook(() => useTenantBranding(), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue(TENANT_BRAND_CSS_VAR)).toBe('#4f46e5'),
    );
  });

  it('falls back to the default brand color when no tenant matches', async () => {
    mockFetchTenants.mockResolvedValue(MOCK_TENANTS);
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@vela.com', role: 'ADMIN', tenantId: 'unknown-tenant' },
      isAuthenticated: true,
    });
    const queryClient = createTestQueryClient();

    renderHook(() => useTenantBranding(), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue(TENANT_BRAND_CSS_VAR)).toBe(DEFAULT_BRAND_COLOR),
    );
  });
});
