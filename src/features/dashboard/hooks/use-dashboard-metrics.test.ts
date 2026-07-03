import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/react-query';
import { fetchDashboardMetrics, type TenantDashboardMetrics } from '../api/dashboard-api';
import { useDashboardMetrics } from './use-dashboard-metrics';

vi.mock('../api/dashboard-api', () => ({
  fetchDashboardMetrics: vi.fn(),
}));

const mockFetchDashboardMetrics = vi.mocked(fetchDashboardMetrics);

const MOCK_METRICS: TenantDashboardMetrics = {
  scope: 'TENANT',
  totalUsers: 45,
  usersByRole: [
    { role: 'ADMIN', count: 4 },
    { role: 'MEMBER', count: 41 },
  ],
};

describe('useDashboardMetrics', () => {
  it('fetches the dashboard metrics from the API', async () => {
    mockFetchDashboardMetrics.mockResolvedValue(MOCK_METRICS);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_METRICS);
  });

  it('surfaces query errors', async () => {
    mockFetchDashboardMetrics.mockRejectedValue(new Error('network down'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper: createQueryWrapper(queryClient) });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
