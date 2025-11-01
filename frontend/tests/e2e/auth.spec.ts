import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('Login page renders and matches snapshot', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Embarcações|Sistema/i);
    await expect(page.locator('h1')).toHaveText(/Sistema de Embarcações/i);
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('Shows validation errors when submitting empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    // Expect at least one input to be invalid
    await expect(page.locator('input:invalid')).toHaveCountGreaterThan(0);
  });
});







