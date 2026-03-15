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
  activateAndEdit,
  assertDefaultColumnLayout,
} from './fixtures/helpers';

test.describe('Task Inline Editing', () => {
  test.beforeEach(async ({ appPage: page }) => {
    await createTask(page, 'Original Task');
  });

  test('has expected column layout', async ({ appPage: page }) => {
    await assertDefaultColumnLayout(page, 'Original Task');
  });

  test('edits task name via click and F2', async ({ appPage: page }) => {
    await activateAndEdit(page, 'Original Task', 'name', 'Renamed Task', 'Name');

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

    const grid = getGrid(page);
    await expect(grid.getByText('Original Task', { exact: true })).toBeVisible();
    await expect(grid.getByText('Should Not Save', { exact: true })).not.toBeVisible();
  });

  test('edits a date cell', async ({ appPage: page }) => {
    await activateAndEdit(page, 'Original Task', 'startDate', '2025-06-15', 'Start Date');

    // Verify the date is displayed in the row
    const grid = getGrid(page);
    const row = grid.getByRole('row').filter({ hasText: 'Original Task' });
    await expect(row).toContainText('2025');
  });
});
