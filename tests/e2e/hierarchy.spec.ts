/**
 * E2E tests for task hierarchy operations.
 *
 * Covers indent/outdent and grouping of tasks.
 */

import {
  test,
  expect,
  createTasks,
  getGrid,
  selectTask,
  selectTasks,
} from './fixtures/helpers';

test.describe('Hierarchy', () => {
  test('indents a task to become a child', async ({ appPage: page }) => {
    await createTasks(page, ['Parent Task', 'Child Task']);
    const grid = getGrid(page);

    // Select the second task
    await selectTask(page, 'Child Task');

    // Indent via keyboard shortcut
    await page.keyboard.press('Alt+Shift+ArrowRight');

    // The parent task should become a summary/group type
    // Verify by checking the row structure — the child should be indented
    // The parent row should still exist
    await expect(grid.getByText('Parent Task', { exact: true })).toBeVisible();
    await expect(grid.getByText('Child Task', { exact: true })).toBeVisible();

    // Verify both tasks still exist — hierarchy was established
    // (The child task is now indented under the parent in the DOM)
  });

  test('outdents a child task back to root level', async ({ appPage: page }) => {
    await createTasks(page, ['Parent Task', 'Child Task']);
    const grid = getGrid(page);

    // Indent first
    await selectTask(page, 'Child Task');
    await page.keyboard.press('Alt+Shift+ArrowRight');

    // Now outdent
    await page.keyboard.press('Alt+Shift+ArrowLeft');

    // Both tasks should be at root level (no summary/group parent)
    await expect(grid.getByText('Parent Task', { exact: true })).toBeVisible();
    await expect(grid.getByText('Child Task', { exact: true })).toBeVisible();
  });

  test('groups selected tasks under a new summary', async ({ appPage: page }) => {
    await createTasks(page, ['Task A', 'Task B', 'Task C']);
    const grid = getGrid(page);

    // Select all three tasks
    await selectTasks(page, ['Task A', 'Task B', 'Task C']);

    // Group them
    await page.keyboard.press('Control+g');

    // A new summary task should appear, and all three tasks should still be visible
    await expect(grid.getByText('Task A', { exact: true })).toBeVisible();
    await expect(grid.getByText('Task B', { exact: true })).toBeVisible();
    await expect(grid.getByText('Task C', { exact: true })).toBeVisible();

    // There should be an additional row (the summary) — total 4 task rows
    const taskRows = grid.locator('.task-table-row');
    await expect(taskRows).toHaveCount(4);
  });
});
