/**
 * E2E tests for file save & load operations.
 *
 * Uses store-level serialization via page.evaluate() since the
 * File System Access API cannot be automated in headless browsers.
 * Also tests the File menu UI surface.
 */

import { test, expect, createTasks, getGrid } from './fixtures/helpers';

test.describe('File Save & Load', () => {
  test('round-trips task data through multi-tab persistence', async ({
    appPage: page,
  }) => {
    // Create some tasks
    await createTasks(page, ['Persist Task A', 'Persist Task B', 'Persist Task C']);
    const grid = getGrid(page);
    await expect(grid.getByText('Persist Task A', { exact: true })).toBeVisible();
    await expect(grid.getByText('Persist Task B', { exact: true })).toBeVisible();
    await expect(grid.getByText('Persist Task C', { exact: true })).toBeVisible();

    // Wait for the debounced multi-tab persistence to save (200ms debounce)
    await page.waitForFunction(
      () => {
        const state = localStorage.getItem('ownchart-multi-tab-state');
        if (!state) return false;
        // Verify our tasks are in the persisted state
        return state.includes('Persist Task A');
      },
      { timeout: 5000 }
    );

    // Read the multi-tab state from localStorage
    const multiTabState = await page.evaluate(() => {
      return localStorage.getItem('ownchart-multi-tab-state');
    });
    expect(multiTabState).toBeTruthy();

    // Read the tab ID from session storage
    const tabId = await page.evaluate(() => {
      return sessionStorage.getItem('ownchart-tab-id');
    });
    expect(tabId).toBeTruthy();

    // Reload the page with the same persisted state
    await page.addInitScript(
      ({ state, id }) => {
        localStorage.setItem('ownchart-welcome-dismissed', 'true');
        localStorage.setItem('ownchart-tour-completed', 'true');
        localStorage.setItem('ownchart-multi-tab-state', state!);
        sessionStorage.setItem('ownchart-tab-id', id!);
      },
      { state: multiTabState, id: tabId }
    );
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();

    // Verify all tasks are restored
    const restoredGrid = getGrid(page);
    await expect(
      restoredGrid.getByText('Persist Task A', { exact: true })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      restoredGrid.getByText('Persist Task B', { exact: true })
    ).toBeVisible();
    await expect(
      restoredGrid.getByText('Persist Task C', { exact: true })
    ).toBeVisible();
  });

  test('file menu shows correct items', async ({ appPage: page }) => {
    // Click the File menu trigger (has aria-haspopup)
    const fileBtn = page.locator('button[aria-haspopup="true"]', { hasText: 'File' });
    await fileBtn.click();

    // Verify menu items are visible (File menu uses role="menu")
    const menu = page.getByRole('menu', { name: 'File menu' });
    await expect(menu).toBeVisible();

    // Menu items include shortcut text, so use getByText to match the label span
    await expect(menu.getByText('New', { exact: true })).toBeVisible();
    await expect(menu.getByText('Open', { exact: true })).toBeVisible();
    await expect(menu.getByText('Save', { exact: true })).toBeVisible();
    await expect(menu.getByText('Save As...', { exact: true })).toBeVisible();
    await expect(menu.getByText('Export', { exact: true })).toBeVisible();

    // Close the menu
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
  });
});
