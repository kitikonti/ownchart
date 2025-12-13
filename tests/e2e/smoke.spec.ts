import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/gantt/i);
});

test('displays app title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /gantt chart application/i })).toBeVisible();
});

test('shows Phase 0 status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/phase 0: foundation/i)).toBeVisible();
});
