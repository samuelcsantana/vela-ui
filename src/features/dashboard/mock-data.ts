// Portfolio project: the backend has no analytics endpoints yet, so the dashboard
// renders these fixed mock datasets instead of fetching. Swapping in a real API later
// only requires replacing the two constants below with query results of the same shape.

export type KpiId = 'totalCompanies' | 'totalUsers' | 'activeUsers' | 'mrr' | 'newSignups' | 'teamAdmins';

export interface KpiMetric {
  id: KpiId;
  value: string;
}

export interface MonthlyGrowthPoint {
  month: string;
  users: number;
}

export interface DistributionSlice {
  name: string;
  value: number;
}

export interface DashboardData {
  kpis: KpiMetric[];
  userGrowth: MonthlyGrowthPoint[];
  distribution: DistributionSlice[];
  distributionLabelKey: string;
}

// VELA_ADMIN is the platform root: KPIs and charts span every tenant.
export const mockVelaAdminDashboard: DashboardData = {
  kpis: [
    { id: 'totalCompanies', value: '12' },
    { id: 'totalUsers', value: '1,240' },
    { id: 'activeUsers', value: '890' },
    { id: 'mrr', value: '$48,750' },
  ],
  userGrowth: [
    { month: 'Jan', users: 620 },
    { month: 'Feb', users: 710 },
    { month: 'Mar', users: 845 },
    { month: 'Apr', users: 960 },
    { month: 'May', users: 1080 },
    { month: 'Jun', users: 1240 },
  ],
  distribution: [
    { name: 'Vela Corp', value: 420 },
    { name: 'Sicredi', value: 310 },
    { name: 'Nubank', value: 260 },
    { name: 'Acme Inc', value: 250 },
  ],
  distributionLabelKey: 'dashboard.charts.usersByCompany',
};

// A tenant ADMIN only ever sees their own company: no cross-tenant KPIs or breakdowns.
export const mockTenantAdminDashboard: DashboardData = {
  kpis: [
    { id: 'totalUsers', value: '45' },
    { id: 'activeUsers', value: '38' },
    { id: 'newSignups', value: '12' },
    { id: 'teamAdmins', value: '4' },
  ],
  userGrowth: [
    { month: 'Jan', users: 22 },
    { month: 'Feb', users: 27 },
    { month: 'Mar', users: 31 },
    { month: 'Apr', users: 35 },
    { month: 'May', users: 40 },
    { month: 'Jun', users: 45 },
  ],
  distribution: [
    { name: 'MEMBER', value: 41 },
    { name: 'ADMIN', value: 4 },
  ],
  distributionLabelKey: 'dashboard.charts.usersByRole',
};
