import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardView } from './DashboardView';
import { mockTenantAdminDashboard, mockVelaAdminDashboard } from './mock-data';

const { mockUseAuthStore } = vi.hoisted(() => ({
  mockUseAuthStore: vi.fn(),
}));

vi.mock('../auth/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { role: string } | undefined }) => unknown) => mockUseAuthStore(selector),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => (options ? `${key}:${JSON.stringify(options)}` : key) }),
}));

vi.mock('./components/KpiCard', () => ({
  KpiCard: ({ label, value }: { label: string; value: string }) => (
    <div data-testid="kpi-card" data-label={label} data-value={value} />
  ),
}));

vi.mock('./components/UserGrowthChart', () => ({
  UserGrowthChart: ({ data }: { data: unknown }) => <div data-testid="user-growth-chart" data-chart-data={JSON.stringify(data)} />,
}));

vi.mock('./components/UserDistributionChart', () => ({
  UserDistributionChart: ({ data }: { data: unknown }) => (
    <div data-testid="user-distribution-chart" data-chart-data={JSON.stringify(data)} />
  ),
}));

describe('DashboardView', () => {
  it('renders the welcome heading and subtitle', () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'ADMIN' } }));
    render(<DashboardView />);

    expect(screen.getByRole('heading', { name: `dashboard.welcome:${JSON.stringify({ appName: 'common.appName' })}` })).toBeInTheDocument();
    expect(screen.getByText('dashboard.subtitle')).toBeInTheDocument();
  });

  it('renders the VELA_ADMIN dataset, including the totalCompanies KPI and company distribution chart', () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
    render(<DashboardView />);

    const kpiCards = screen.getAllByTestId('kpi-card');
    expect(kpiCards).toHaveLength(4);
    expect(kpiCards.map((card) => card.getAttribute('data-label'))).toEqual([
      'dashboard.kpis.totalCompanies',
      'dashboard.kpis.totalUsers',
      'dashboard.kpis.activeUsers',
      'dashboard.kpis.mrr',
    ]);
    expect(screen.getByTestId('user-growth-chart')).toHaveAttribute(
      'data-chart-data',
      JSON.stringify(mockVelaAdminDashboard.userGrowth),
    );
    expect(screen.getByTestId('user-distribution-chart')).toHaveAttribute(
      'data-chart-data',
      JSON.stringify(mockVelaAdminDashboard.distribution),
    );
    expect(screen.getByText('dashboard.charts.usersByCompany')).toBeInTheDocument();
  });

  it('renders the tenant-scoped dataset for a plain ADMIN, hiding the totalCompanies KPI', () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'ADMIN' } }));
    render(<DashboardView />);

    const kpiCards = screen.getAllByTestId('kpi-card');
    expect(kpiCards).toHaveLength(4);
    expect(kpiCards.map((card) => card.getAttribute('data-label'))).not.toContain('dashboard.kpis.totalCompanies');
    expect(screen.getByTestId('user-growth-chart')).toHaveAttribute(
      'data-chart-data',
      JSON.stringify(mockTenantAdminDashboard.userGrowth),
    );
    expect(screen.getByTestId('user-distribution-chart')).toHaveAttribute(
      'data-chart-data',
      JSON.stringify(mockTenantAdminDashboard.distribution),
    );
    expect(screen.getByText('dashboard.charts.usersByRole')).toBeInTheDocument();
  });

  it('falls back to the tenant-scoped dataset when the role is neither VELA_ADMIN nor ADMIN', () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'MEMBER' } }));
    render(<DashboardView />);

    expect(screen.getByText('dashboard.charts.usersByRole')).toBeInTheDocument();
  });
});
