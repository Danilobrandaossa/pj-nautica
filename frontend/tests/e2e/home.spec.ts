import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test('App shell loads and matches snapshot', async ({ page }) => {
    await page.goto('/');
    // Navbar or shell element present
    await expect(page.locator('header, nav, [data-testid="app-shell"]').first()).toBeVisible();
    await expect(page).toHaveScreenshot('home-shell.png');
  });
});







