import { api } from '../../../lib/api';
import type { UserRole } from '../../auth/store/auth-store';

export interface TenantUserCount {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  userCount: number;
}

export interface RecentSignup {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  createdAt: string;
}

export interface RoleUserCount {
  role: UserRole;
  count: number;
}

// VELA_ADMIN sees system-wide metrics across every tenant.
export interface GlobalDashboardMetrics {
  scope: 'GLOBAL';
  totalTenants: number;
  totalUsers: number;
  usersByTenant: TenantUserCount[];
  recentSignups: RecentSignup[];
}

// ADMIN and MEMBER only see metrics scoped to their own tenant.
export interface TenantDashboardMetrics {
  scope: 'TENANT';
  totalUsers: number;
  usersByRole: RoleUserCount[];
}

export type DashboardMetrics = GlobalDashboardMetrics | TenantDashboardMetrics;

// GET /api/metrics/dashboard — any authenticated user; response shape depends on role (see scope).
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await api.get<DashboardMetrics>('/metrics/dashboard');
  return data;
}
