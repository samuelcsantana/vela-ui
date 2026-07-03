import { describe, expect, it } from 'vitest';
import { mockTenantAdminDashboard, mockVelaAdminDashboard } from './mock-data';

describe('mockVelaAdminDashboard', () => {
  it('includes a totalCompanies KPI and a company-scoped distribution chart', () => {
    expect(mockVelaAdminDashboard.kpis.map((kpi) => kpi.id)).toContain('totalCompanies');
    expect(mockVelaAdminDashboard.kpis).toHaveLength(4);
    expect(mockVelaAdminDashboard.userGrowth).toHaveLength(6);
    expect(mockVelaAdminDashboard.distributionLabelKey).toBe('dashboard.charts.usersByCompany');
  });
});

describe('mockTenantAdminDashboard', () => {
  it('excludes cross-tenant KPIs and scopes the distribution chart by role', () => {
    expect(mockTenantAdminDashboard.kpis.map((kpi) => kpi.id)).not.toContain('totalCompanies');
    expect(mockTenantAdminDashboard.kpis).toHaveLength(4);
    expect(mockTenantAdminDashboard.userGrowth).toHaveLength(6);
    expect(mockTenantAdminDashboard.distributionLabelKey).toBe('dashboard.charts.usersByRole');
  });
});
