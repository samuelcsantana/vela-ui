import { test, expect } from '@playwright/test';
import { ACME_TENANT, API_URL } from './helpers';

// /$slug/login fetches the tenant's public branding before any
// authentication happens (GET /tenants/:slug is public in vela-core) and
// applies the tenant's primary color as a CSS custom property.
test.describe('white-label tenant login', () => {
  test('renders the tenant name and applies its brand color', async ({ page }) => {
    await page.route(`${API_URL}/tenants/acme`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ACME_TENANT) }),
    );

    await page.goto('/acme/login');

    await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible();
    await expect(page.getByText('Sign in to your workspace')).toBeVisible();

    const brandColor = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--tenant-brand'),
    );
    expect(brandColor).toBe('#ff5733');

    // The tenant's backgroundColor white-labels the page itself (#1f2937 = rgb(31, 41, 55)).
    await expect(page.getByRole('main')).toHaveCSS('background-color', 'rgb(31, 41, 55)');
  });

  test('shows the not-found screen for a slug that does not exist', async ({ page }) => {
    await page.route(`${API_URL}/tenants/does-not-exist`, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Tenant not found' }),
      }),
    );

    await page.goto('/does-not-exist/login');

    await expect(page.getByText('Back to login')).toBeVisible();
  });
});
