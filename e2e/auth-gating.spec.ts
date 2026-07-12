import { test, expect } from '@playwright/test';
import { MEMBER, mockDashboardMetrics, seedSession, TENANT_METRICS } from './helpers';

test.describe('route protection', () => {
  test('redirects an unauthenticated visitor from the dashboard to /login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Vela UI' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('redirects an unauthenticated visitor from /tenants to /login', async ({ page }) => {
    await page.goto('/tenants');

    await expect(page).toHaveURL('/login');
  });

  test('bounces a MEMBER from the admin-only /users back to the dashboard', async ({ page }) => {
    await seedSession(page, MEMBER);
    await mockDashboardMetrics(page, TENANT_METRICS);

    await page.goto('/users');

    // The /users beforeLoad guard only admits ADMIN and VELA_ADMIN.
    await expect(page).toHaveURL('/');
  });
});
