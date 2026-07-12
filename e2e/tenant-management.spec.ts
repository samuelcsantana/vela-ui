import { test, expect } from '@playwright/test';
import { ACME_TENANT, API_URL, seedSession, TENANT_ADMIN, VELA_ADMIN, VELA_TENANT } from './helpers';

async function mockTenantsList(page: import('@playwright/test').Page) {
  await page.route(`${API_URL}/tenants`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([VELA_TENANT, ACME_TENANT]),
    }),
  );
}

test.describe('tenant management (VELA_ADMIN)', () => {
  test('lists tenants and exposes the create action', async ({ page }) => {
    await seedSession(page, VELA_ADMIN);
    await mockTenantsList(page);

    await page.goto('/tenants');

    await expect(page.getByRole('button', { name: 'New Tenant' })).toBeVisible();
    await expect(page.getByText('Acme Corp')).toBeVisible();
    await expect(page.getByText('Vela Admin').first()).toBeVisible();
  });

  test('deleting a tenant that still has users escalates to the cascade double-confirmation', async ({
    page,
  }) => {
    await seedSession(page, VELA_ADMIN);
    await mockTenantsList(page);

    // First DELETE (no force) answers 409 TENANT_HAS_USERS; the retry with
    // ?force=true succeeds - mirroring vela-core's contract exactly.
    await page.route(`${API_URL}/tenants/${ACME_TENANT.id}*`, (route) => {
      const isForced = route.request().url().includes('force=true');

      if (isForced) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Tenant deleted successfully' }),
        });
      }

      return route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'TENANT_HAS_USERS', userCount: 3 }),
      });
    });

    await page.goto('/tenants');

    const acmeRow = page.getByRole('row').filter({ hasText: 'Acme Corp' });
    await acmeRow.getByRole('button', { name: 'Delete tenant' }).click();

    // Standard confirmation first...
    await expect(page.getByText('Are you absolutely sure?')).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    // ...then the 409 escalates to the cascade warning with the user count.
    await expect(page.getByText('Attention: Cascade Deletion')).toBeVisible();
    await expect(page.getByText(/3 user\(s\)/)).toBeVisible();

    await page.getByRole('button', { name: 'Delete Company and Users' }).click();

    await expect(page.getByText('Attention: Cascade Deletion')).not.toBeVisible();
  });
});

test.describe('tenant management (tenant ADMIN)', () => {
  test('hides the create and delete actions outside the VELA_ADMIN role', async ({ page }) => {
    await seedSession(page, TENANT_ADMIN);
    await mockTenantsList(page);

    await page.goto('/tenants');

    // The table itself is visible to any authenticated user...
    await expect(page.getByText('Acme Corp')).toBeVisible();

    // ...but the mutations are platform-root only.
    await expect(page.getByRole('button', { name: 'New Tenant' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete tenant' })).not.toBeVisible();
  });
});
