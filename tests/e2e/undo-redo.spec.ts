/**
 * E2E tests for undo/redo functionality.
 *
 * Covers undoing and redoing task creation, name edits, and deletion.
 */

import {
  test,
  expect,
  createTask,
  getGrid,
  getCell,
  selectTask,
} from './fixtures/helpers';

test.describe('Undo / Redo', () => {
  test('undoes task creation', async ({ appPage: page }) => {
    await createTask(page, 'Undo Me');
    const grid = getGrid(page);
    await expect(grid.getByText('Undo Me', { exact: true })).toBeVisible();

    // Undo — task should disappear
    await page.keyboard.press('Control+z');
    await expect(grid.getByText('Undo Me', { exact: true })).not.toBeVisible();
  });

  test('redoes task creation after undo', async ({ appPage: page }) => {
    await createTask(page, 'Redo Me');
    const grid = getGrid(page);

    // Undo
    await page.keyboard.press('Control+z');
    await expect(grid.getByText('Redo Me', { exact: true })).not.toBeVisible();

    // Redo — task should reappear
    await page.keyboard.press('Control+Shift+z');
    await expect(grid.getByText('Redo Me', { exact: true })).toBeVisible();
  });

  test('undoes task name edit', async ({ appPage: page }) => {
    await createTask(page, 'Before Edit');
    const grid = getGrid(page);

    // Edit the name
    const nameCell = getCell(page, 'Before Edit', 'name');
    await nameCell.click();
    await expect(nameCell).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('F2');
    const input = page.getByLabel('Edit Name');
    await expect(input).toBeVisible();
    await input.fill('After Edit');
    await input.press('Enter');

    // Verify edit applied
    await expect(grid.getByText('After Edit', { exact: true })).toBeVisible();

    // Undo — should revert to original name
    await page.keyboard.press('Control+z');
    await expect(grid.getByText('Before Edit', { exact: true })).toBeVisible();
    await expect(grid.getByText('After Edit', { exact: true })).not.toBeVisible();
  });

  test('undoes task deletion', async ({ appPage: page }) => {
    await createTask(page, 'Delete Me');
    const grid = getGrid(page);

    // Select and delete the task
    await selectTask(page, 'Delete Me');
    await page.keyboard.press('Delete');
    await expect(grid.getByText('Delete Me', { exact: true })).not.toBeVisible();

    // Undo — task should be restored
    await page.keyboard.press('Control+z');
    await expect(grid.getByText('Delete Me', { exact: true })).toBeVisible();
  });
});
