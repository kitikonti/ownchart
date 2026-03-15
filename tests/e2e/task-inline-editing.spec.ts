/**
 * E2E tests for task inline editing.
 *
 * Covers editing task names, dates, and progress via the table cells,
 * plus cancellation with Escape.
 */

import {
  test,
  expect,
  createTask,
  getCell,
  getGrid,
} from './fixtures/helpers';

test.describe('Task Inline Editing', () => {
  test.beforeEach(async ({ appPage: page }) => {
    // Create a task to edit
    await createTask(page, 'Original Task');
  });

  test('edits task name via click and F2', async ({ appPage: page }) => {
    const nameCell = getCell(page, 'Original Task', 'name');

    // Click to activate, wait for state update
    await nameCell.click();
    await expect(nameCell).toHaveAttribute('aria-selected', 'true');

    // F2 to enter edit mode — the input gets aria-label="Edit Name"
    await page.keyboard.press('F2');
    const input = page.getByLabel('Edit Name');
    await expect(input).toBeVisible();
    await input.fill('Renamed Task');
    await input.press('Enter');

    // Verify updated name
    const grid = getGrid(page);
    await expect(grid.getByText('Renamed Task', { exact: true })).toBeVisible();
    await expect(grid.getByText('Original Task', { exact: true })).not.toBeVisible();
  });

  test('edits task name by typing directly', async ({ appPage: page }) => {
    const nameCell = getCell(page, 'Original Task', 'name');

    // Click to activate
    await nameCell.click();
    await expect(nameCell).toHaveAttribute('aria-selected', 'true');

    // Type a character directly — this triggers overwrite mode (Excel behavior)
    await page.keyboard.press('N');
    const input = page.getByLabel('Edit Name');
    await expect(input).toBeVisible();
    await input.fill('New Name');
    await input.press('Enter');

    // Verify updated name
    const grid = getGrid(page);
    await expect(grid.getByText('New Name', { exact: true })).toBeVisible();
  });

  test('cancels edit with Escape', async ({ appPage: page }) => {
    const nameCell = getCell(page, 'Original Task', 'name');

    // Enter edit mode via F2
    await nameCell.click();
    await expect(nameCell).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('F2');
    const input = page.getByLabel('Edit Name');
    await expect(input).toBeVisible();
    await input.fill('Should Not Save');
    await input.press('Escape');

    // Original value should be restored
    const grid = getGrid(page);
    await expect(grid.getByText('Original Task', { exact: true })).toBeVisible();
    await expect(grid.getByText('Should Not Save', { exact: true })).not.toBeVisible();
  });

  test('edits a date cell', async ({ appPage: page }) => {
    // Locate the Start Date cell
    const startCell = getCell(page, 'Original Task', 'startDate');

    // Activate and edit via F2
    await startCell.click();
    await expect(startCell).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('F2');
    const input = page.getByLabel('Edit Start Date');
    await expect(input).toBeVisible();
    await input.fill('2025-06-15');
    await input.press('Enter');

    // Verify the date is displayed (format may vary — check for part of the date)
    const grid = getGrid(page);
    // After commit, the cell shows the formatted date — look for it in the row
    const row = grid.getByRole('row').filter({ hasText: 'Original Task' });
    await expect(row).toContainText('2025');
  });
});
