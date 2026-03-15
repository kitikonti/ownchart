/**
 * E2E tests for the context menu.
 *
 * Covers opening, closing, keyboard navigation, and executing actions.
 */

import {
  test,
  expect,
  createTask,
  getGrid,
  getTaskRow,
  selectTask,
} from './fixtures/helpers';

test.describe('Context Menu', () => {
  test.beforeEach(async ({ appPage: page }) => {
    await createTask(page, 'Context Task');
  });

  test('opens context menu on right-click', async ({ appPage: page }) => {
    const row = getTaskRow(page, 'Context Task');
    await row.click({ button: 'right' });

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
  });

  test('closes context menu when clicking outside', async ({ appPage: page }) => {
    const row = getTaskRow(page, 'Context Task');
    await row.click({ button: 'right' });

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Click the grid background — a reliable non-menu target
    const grid = getGrid(page);
    await grid.click({ position: { x: 5, y: 5 }, force: true });
    await expect(menu).not.toBeVisible();
  });

  test('navigates menu items with keyboard and closes with Escape', async ({
    appPage: page,
  }) => {
    const row = getTaskRow(page, 'Context Task');
    await row.click({ button: 'right' });

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Arrow down should focus items
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // Escape should close the menu
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
  });

  test('hides a task via context menu action', async ({ appPage: page }) => {
    // Select the task first (hide requires selection)
    await selectTask(page, 'Context Task');

    // Right-click to open context menu
    const row = getTaskRow(page, 'Context Task');
    await row.click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Click "Hide Row" — deterministic action that's always available for selected rows
    const hideItem = menu.getByRole('menuitem', { name: /hide/i });
    await hideItem.click();

    // Menu should close and the task should no longer be visible
    await expect(menu).not.toBeVisible();
    const grid = getGrid(page);
    await expect(grid.getByText('Context Task', { exact: true })).not.toBeVisible();
  });
});
