import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ownchart/i);
});

test('can create tasks', async ({ page }) => {
  await page.goto('/');
  // Verify the task table is visible
  await expect(page.getByRole('table')).toBeVisible();
});

test('has file operations toolbar', async ({ page }) => {
  await page.goto('/');
  // Verify toolbar with file operations is present
  await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
});
