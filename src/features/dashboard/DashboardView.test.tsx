import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GlobalDashboardMetrics, TenantDashboardMetrics } from './api/dashboard-api';
import { DashboardView } from './DashboardView';

const { mockUseDashboardMetrics } = vi.hoisted(() => ({
  mockUseDashboardMetrics: vi.fn(),
}));

vi.mock('./hooks/use-dashboard-metrics', () => ({
  useDashboardMetrics: () => mockUseDashboardMetrics(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => (options ? `${key}:${JSON.stringify(options)}` : key) }),
}));

vi.mock('./components/KpiCard', () => ({
  KpiCard: ({ label, value }: { label: string; value: string }) => (
    <div data-testid="kpi-card" data-label={label} data-value={value} />
  ),
}));

vi.mock('./components/UserDistributionChart', () => ({
  UserDistributionChart: ({ data }: { data: unknown }) => (
    <div data-testid="user-distribution-chart" data-chart-data={JSON.stringify(data)} />
  ),
}));

vi.mock('./components/RecentSignupsList', () => ({
  RecentSignupsList: ({ signups }: { signups: unknown }) => (
    <div data-testid="recent-signups-list" data-signups={JSON.stringify(signups)} />
  ),
}));

vi.mock('./components/DashboardSkeleton', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton" />,
}));

const GLOBAL_METRICS: GlobalDashboardMetrics = {
  scope: 'GLOBAL',
  totalTenants: 12,
  totalUsers: 1240,
  usersByTenant: [
    { tenantId: 'tenant-1', tenantName: 'Vela Corp', tenantSlug: 'vela', userCount: 420 },
    { tenantId: 'tenant-2', tenantName: 'Sicredi', tenantSlug: 'sicredi', userCount: 310 },
  ],
  recentSignups: [
    { id: 'user-1', email: 'ana@velaui.demo', role: 'MEMBER', tenantId: 'tenant-1', createdAt: '2026-01-01T00:00:00.000Z' },
  ],
};

const TENANT_METRICS: TenantDashboardMetrics = {
  scope: 'TENANT',
  totalUsers: 45,
  usersByRole: [
    { role: 'ADMIN', count: 4 },
    { role: 'MEMBER', count: 41 },
  ],
};

describe('DashboardView', () => {
  it('renders the welcome heading and subtitle', () => {
    mockUseDashboardMetrics.mockReturnValue({ data: TENANT_METRICS, isLoading: false, isError: false });
    render(<DashboardView />);

    expect(screen.getByRole('heading', { name: `dashboard.welcome:${JSON.stringify({ appName: 'common.appName' })}` })).toBeInTheDocument();
    expect(screen.getByText('dashboard.subtitle')).toBeInTheDocument();
  });

  it('shows the skeleton while loading, and nothing else', () => {
    mockUseDashboardMetrics.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<DashboardView />);

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-card')).not.toBeInTheDocument();
  });

  it('shows an error message when the request fails', () => {
    mockUseDashboardMetrics.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<DashboardView />);

    expect(screen.getByRole('alert')).toHaveTextContent('dashboard.error');
    expect(screen.queryByTestId('kpi-card')).not.toBeInTheDocument();
  });

  it('renders nothing below the header when settled with no data', () => {
    mockUseDashboardMetrics.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    render(<DashboardView />);

    expect(screen.queryByTestId('kpi-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
  });

  describe('GLOBAL scope (VELA_ADMIN)', () => {
    it('renders totalCompanies and totalUsers KPIs, the tenant distribution chart, and recent signups', () => {
      mockUseDashboardMetrics.mockReturnValue({ data: GLOBAL_METRICS, isLoading: false, isError: false });
      render(<DashboardView />);

      const kpiCards = screen.getAllByTestId('kpi-card');
      expect(kpiCards).toHaveLength(2);
      expect(kpiCards[0]).toHaveAttribute('data-label', 'dashboard.kpis.totalCompanies');
      expect(kpiCards[0]).toHaveAttribute('data-value', '12');
      expect(kpiCards[1]).toHaveAttribute('data-label', 'dashboard.kpis.totalUsers');
      expect(kpiCards[1]).toHaveAttribute('data-value', '1,240');

      expect(screen.getByText('dashboard.charts.usersByCompany')).toBeInTheDocument();
      expect(screen.getByTestId('user-distribution-chart')).toHaveAttribute(
        'data-chart-data',
        JSON.stringify([
          { name: 'Vela Corp', value: 420 },
          { name: 'Sicredi', value: 310 },
        ]),
      );

      expect(screen.getByText('dashboard.recentSignups.title')).toBeInTheDocument();
      expect(screen.getByTestId('recent-signups-list')).toHaveAttribute(
        'data-signups',
        JSON.stringify(GLOBAL_METRICS.recentSignups),
      );
    });
  });

  describe('TENANT scope (ADMIN/MEMBER)', () => {
    it('renders totalUsers, admins, and members KPIs derived from usersByRole, the role distribution chart, and no recent signups card', () => {
      mockUseDashboardMetrics.mockReturnValue({ data: TENANT_METRICS, isLoading: false, isError: false });
      render(<DashboardView />);

      const kpiCards = screen.getAllByTestId('kpi-card');
      expect(kpiCards).toHaveLength(3);
      expect(kpiCards[0]).toHaveAttribute('data-label', 'dashboard.kpis.totalUsers');
      expect(kpiCards[0]).toHaveAttribute('data-value', '45');
      expect(kpiCards[1]).toHaveAttribute('data-label', 'dashboard.kpis.admins');
      expect(kpiCards[1]).toHaveAttribute('data-value', '4');
      expect(kpiCards[2]).toHaveAttribute('data-label', 'dashboard.kpis.members');
      expect(kpiCards[2]).toHaveAttribute('data-value', '41');

      expect(screen.getByText('dashboard.charts.usersByRole')).toBeInTheDocument();
      expect(screen.getByTestId('user-distribution-chart')).toHaveAttribute(
        'data-chart-data',
        JSON.stringify([
          { name: 'ADMIN', value: 4 },
          { name: 'MEMBER', value: 41 },
        ]),
      );

      expect(screen.queryByTestId('recent-signups-list')).not.toBeInTheDocument();
      expect(screen.queryByText('dashboard.recentSignups.title')).not.toBeInTheDocument();
    });

    it('defaults admins and members to 0 when usersByRole omits them', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: { scope: 'TENANT', totalUsers: 0, usersByRole: [] } satisfies TenantDashboardMetrics,
        isLoading: false,
        isError: false,
      });
      render(<DashboardView />);

      const kpiCards = screen.getAllByTestId('kpi-card');
      expect(kpiCards[1]).toHaveAttribute('data-value', '0');
      expect(kpiCards[2]).toHaveAttribute('data-value', '0');
    });
  });
});
