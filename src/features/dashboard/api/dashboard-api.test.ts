import { describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import { fetchDashboardMetrics, type GlobalDashboardMetrics } from './dashboard-api';

vi.mock('../../../lib/api', () => ({
  api: { get: vi.fn() },
}));

describe('fetchDashboardMetrics', () => {
  it('gets /metrics/dashboard and returns the response data', async () => {
    const mockMetrics: GlobalDashboardMetrics = {
      scope: 'GLOBAL',
      totalTenants: 12,
      totalUsers: 1240,
      usersByTenant: [{ tenantId: 'tenant-1', tenantName: 'Vela Corp', tenantSlug: 'vela', userCount: 420 }],
      recentSignups: [
        { id: 'user-1', email: 'ana@velaui.demo', role: 'MEMBER', tenantId: 'tenant-1', createdAt: '2026-01-01T00:00:00.000Z' },
      ],
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockMetrics });

    const result = await fetchDashboardMetrics();

    expect(api.get).toHaveBeenCalledWith('/metrics/dashboard');
    expect(result).toEqual(mockMetrics);
  });
});
