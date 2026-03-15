/**
 * E2E tests for the toolbar and ribbon UI.
 *
 * Covers tab switching, toggle button state, and view toggle shortcuts.
 */

import { test, expect } from './fixtures/helpers';

test.describe('Toolbar & Ribbon', () => {
  test('switches ribbon tabs', async ({ appPage: page }) => {
    // Use role-based selectors instead of hardcoded IDs
    const homeTab = page.getByRole('tab', { name: 'Home' });
    const viewTab = page.getByRole('tab', { name: 'View' });
    const formatTab = page.getByRole('tab', { name: 'Format' });
    const helpTab = page.getByRole('tab', { name: 'Help' });
    const panel = page.locator('#ribbon-tabpanel');

    // Home tab is active by default
    await expect(homeTab).toHaveAttribute('aria-selected', 'true');

    // Switch to View tab
    await viewTab.click();
    await expect(viewTab).toHaveAttribute('aria-selected', 'true');
    await expect(homeTab).toHaveAttribute('aria-selected', 'false');
    await expect(panel.getByLabel('Zoom in')).toBeVisible();

    // Switch to Format tab
    await formatTab.click();
    await expect(formatTab).toHaveAttribute('aria-selected', 'true');
    await expect(viewTab).toHaveAttribute('aria-selected', 'false');

    // Switch to Help tab
    await helpTab.click();
    await expect(helpTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Home
    await homeTab.click();
    await expect(homeTab).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByLabel('Add new task')).toBeVisible();
  });

  test('toggle buttons reflect state changes', async ({ appPage: page }) => {
    // Switch to View tab to access toggle buttons
    await page.getByRole('tab', { name: 'View' }).click();

    // Find the "Show Today Marker" toggle
    const todayToggle = page.getByRole('button', { name: /Today Marker/i });
    await expect(todayToggle).toBeVisible();

    // Read initial pressed state
    const initialState = await todayToggle.getAttribute('aria-pressed');

    // Click to toggle
    await todayToggle.click();
    const newState = await todayToggle.getAttribute('aria-pressed');
    expect(newState).not.toBe(initialState);

    // Click again to toggle back
    await todayToggle.click();
    const restoredState = await todayToggle.getAttribute('aria-pressed');
    expect(restoredState).toBe(initialState);
  });

  test('keyboard shortcuts toggle view settings', async ({ appPage: page }) => {
    // Switch to View tab to observe toggle states
    await page.getByRole('tab', { name: 'View' }).click();

    // Press "D" to toggle dependencies
    const depsToggle = page.getByRole('button', { name: /Dependencies/i });
    const initialDeps = await depsToggle.getAttribute('aria-pressed');
    await page.keyboard.press('d');
    const newDeps = await depsToggle.getAttribute('aria-pressed');
    expect(newDeps).not.toBe(initialDeps);

    // Press "D" again to restore
    await page.keyboard.press('d');
    const restoredDeps = await depsToggle.getAttribute('aria-pressed');
    expect(restoredDeps).toBe(initialDeps);
  });
});
