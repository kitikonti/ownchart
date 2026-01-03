import { test, expect } from '@playwright/test';

test('homepage loads with correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ownchart/i);
});

test('app renders without errors', async ({ page }) => {
  await page.goto('/');
  // Check that the root div is present (basic smoke test)
  const root = page.locator('#root');
  await expect(root).toBeVisible();
});

test('has functional UI', async ({ page }) => {
  await page.goto('/');
  // Verify at least some UI elements are present
  await expect(page.locator('button').first()).toBeVisible();
});
