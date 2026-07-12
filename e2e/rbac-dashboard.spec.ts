import { test, expect } from '@playwright/test';
import {
  API_URL,
  GLOBAL_METRICS,
  MEMBER,
  mockDashboardMetrics,
  seedSession,
  TENANT_METRICS,
  VELA_ADMIN,
} from './helpers';

// The heart of the multi-tenant demo: the same dashboard route renders
// platform-wide metrics for VELA_ADMIN (scope: GLOBAL) and tenant-scoped
// metrics for everyone else (scope: TENANT) - driven by the `scope`
// discriminant contract with vela-core.
test.describe('RBAC-scoped dashboard', () => {
  test('VELA_ADMIN logs in through the form and sees platform-wide metrics', async ({ page }) => {
    await page.route(`${API_URL}/auth/login`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...VELA_ADMIN, createdAt: '2026-06-01T12:00:00.000Z' }),
      }),
    );
    await mockDashboardMetrics(page, GLOBAL_METRICS);

    await page.goto('/login');
    await page.getByLabel('Email').fill(VELA_ADMIN.email);
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Total Companies')).toBeVisible();
    await expect(page.getByText('12', { exact: true })).toBeVisible();
    await expect(page.getByText('87', { exact: true })).toBeVisible();
    await expect(page.getByText('Users by Company')).toBeVisible();
    await expect(page.getByText('Recent Signups')).toBeVisible();
    await expect(page.getByText('newest@acme.com')).toBeVisible();
  });

  test('MEMBER sees only tenant-scoped metrics, never the global view', async ({ page }) => {
    await seedSession(page, MEMBER);
    await mockDashboardMetrics(page, TENANT_METRICS);

    await page.goto('/');

    await expect(page.getByText('Admins')).toBeVisible();
    await expect(page.getByText('Members')).toBeVisible();
    await expect(page.getByText('Users by Role')).toBeVisible();

    // Global-only widgets must not leak into the tenant-scoped view.
    await expect(page.getByText('Total Companies')).not.toBeVisible();
    await expect(page.getByText('Recent Signups')).not.toBeVisible();
  });
});
