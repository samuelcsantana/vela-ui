import type { Page } from '@playwright/test';
import type { AuthUser } from '../src/features/auth/store/auth-store';

// Must stay in sync with webServer.env.VITE_API_URL in playwright.config.ts.
export const API_URL = 'http://localhost:3333/api';

export const VELA_TENANT_ID = '11111111-1111-4111-8111-111111111111';
export const ACME_TENANT_ID = '22222222-2222-4222-8222-222222222222';

export const VELA_ADMIN: AuthUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  email: 'admin@vela.com',
  role: 'VELA_ADMIN',
  tenantId: VELA_TENANT_ID,
};

export const TENANT_ADMIN: AuthUser = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  email: 'tenantadmin@vela.com',
  role: 'ADMIN',
  tenantId: VELA_TENANT_ID,
};

export const MEMBER: AuthUser = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  email: 'guest@vela.com',
  role: 'MEMBER',
  tenantId: VELA_TENANT_ID,
};

export const ACME_TENANT = {
  id: ACME_TENANT_ID,
  name: 'Acme Corp',
  slug: 'acme',
  primaryColor: '#ff5733',
  logoUrl: null,
  createdAt: '2026-07-01T12:00:00.000Z',
};

export const VELA_TENANT = {
  id: VELA_TENANT_ID,
  name: 'Vela Admin',
  slug: 'vela',
  primaryColor: null,
  logoUrl: null,
  createdAt: '2026-06-01T12:00:00.000Z',
};

export const GLOBAL_METRICS = {
  scope: 'GLOBAL',
  totalTenants: 12,
  totalUsers: 87,
  usersByTenant: [
    { tenantId: VELA_TENANT_ID, tenantName: 'Vela Admin', tenantSlug: 'vela', userCount: 60 },
    { tenantId: ACME_TENANT_ID, tenantName: 'Acme Corp', tenantSlug: 'acme', userCount: 27 },
  ],
  recentSignups: [
    {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      email: 'newest@acme.com',
      role: 'MEMBER',
      tenantId: ACME_TENANT_ID,
      createdAt: '2026-07-10T09:30:00.000Z',
    },
  ],
};

export const TENANT_METRICS = {
  scope: 'TENANT',
  totalUsers: 9,
  usersByRole: [
    { role: 'ADMIN', count: 2 },
    { role: 'MEMBER', count: 7 },
  ],
};

// Seeds the zustand-persisted session (localStorage key `vela-ui-auth`)
// before the app boots, so protected routes render without driving the login
// form in every test. The login form itself is exercised in rbac-dashboard.
export async function seedSession(page: Page, user: AuthUser) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    ['vela-ui-auth', JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 })],
  );
}

export async function mockDashboardMetrics(page: Page, metrics: unknown) {
  await page.route(`${API_URL}/metrics/dashboard`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(metrics) }),
  );
}
