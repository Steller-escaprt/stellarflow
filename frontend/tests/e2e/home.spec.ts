import { test, expect } from '@playwright/test';

test.describe('StellarFlow E2E', () => {
  test('homepage loads and displays app branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=StellarFlow').first()).toBeVisible();
  });

  test('backend health endpoint responds successfully', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      service: 'stellar-flow-backend',
      status: 'ok',
    });
  });
});
