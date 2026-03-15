/**
 * E2E tests for task creation flows.
 *
 * Covers creating tasks via the placeholder row and the ribbon button,
 * and verifying that cancellation with Escape works correctly.
 */

import { test, expect, createTask, getGrid } from './fixtures/helpers';

test.describe('Task Creation', () => {
  test('creates a task via the placeholder row', async ({ appPage: page }) => {
    await createTask(page, 'My First Task');

    // Verify task appears in the table
    const grid = getGrid(page);
    await expect(grid.getByText('My First Task', { exact: true })).toBeVisible();

    // Verify a new empty placeholder row still exists
    await expect(page.locator('div[aria-label="New task name"]')).toBeVisible();
  });

  test('creates a task via the Add Task ribbon button', async ({ appPage: page }) => {
    // Ensure Home tab is active (default)
    await expect(page.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');

    // Click the "Add new task" button in the ribbon
    await page.getByLabel('Add new task').click();

    // A new task row should appear in the grid
    const grid = getGrid(page);
    const rows = grid.locator('.task-table-row');
    await expect(rows).toHaveCount(1);
  });

  test('cancels task creation with Escape', async ({ appPage: page }) => {
    const placeholderCell = page.locator('div[aria-label="New task name"]');
    // First click to activate, second to edit
    await placeholderCell.click();
    await placeholderCell.click();

    // Type something but then cancel
    const input = placeholderCell.locator('input');
    await expect(input).toBeVisible();
    await input.fill('Should Not Exist');
    await input.press('Escape');

    // No task row should have been created
    const grid = getGrid(page);
    const taskRows = grid.locator('.task-table-row');
    await expect(taskRows).toHaveCount(0);

    // Placeholder should still show
    await expect(placeholderCell).toBeVisible();
  });
});
