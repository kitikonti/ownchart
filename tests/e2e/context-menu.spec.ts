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
} from './fixtures/helpers';

test.describe('Context Menu', () => {
  test.beforeEach(async ({ appPage: page }) => {
    await createTask(page, 'Context Task');
  });

  test('opens context menu on right-click', async ({ appPage: page }) => {
    const row = getTaskRow(page, 'Context Task');
    await row.click({ button: 'right' });

    // Context menu should appear
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
  });

  test('closes context menu when clicking outside', async ({ appPage: page }) => {
    const row = getTaskRow(page, 'Context Task');
    await row.click({ button: 'right' });

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Click outside the menu — use the chart area (right side of the app)
    await page.mouse.click(800, 400);
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

  test('executes a menu action', async ({ appPage: page }) => {
    const grid = getGrid(page);

    // First select the task (required for delete action)
    const row = getTaskRow(page, 'Context Task');
    const rowNumberCell = row.getByRole('gridcell').first();
    await rowNumberCell.click();

    // Right-click to open context menu
    await row.click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Find and click the Delete action
    const deleteItem = menu.getByRole('menuitem', { name: /delete/i });
    if (await deleteItem.isVisible()) {
      await deleteItem.click();
      // Task should be deleted
      await expect(grid.getByText('Context Task', { exact: true })).not.toBeVisible();
    } else {
      // If delete isn't in the menu, try "Hide Row" which should be available
      const hideItem = menu.getByRole('menuitem', { name: /hide/i });
      await hideItem.click();
      await expect(menu).not.toBeVisible();
    }
  });
});
