import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchDashboardMetrics, type DashboardMetrics } from '../api/dashboard-api';

const DASHBOARD_METRICS_QUERY_KEY = ['dashboard-metrics'] as const;

export function useDashboardMetrics(): UseQueryResult<DashboardMetrics, Error> {
  return useQuery({
    queryKey: DASHBOARD_METRICS_QUERY_KEY,
    queryFn: fetchDashboardMetrics,
  });
}
