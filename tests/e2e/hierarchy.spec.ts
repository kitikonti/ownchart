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
  getCell,
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

    // Both tasks should still be visible
    await expect(grid.getByText('Parent Task', { exact: true })).toBeVisible();
    await expect(grid.getByText('Child Task', { exact: true })).toBeVisible();

    // Verify the child is now indented: its name cell should have paddingLeft > 0
    const childNameCell = getCell(page, 'Child Task', 'name');
    const paddingLeft = await childNameCell.evaluate((el) => {
      const innerDiv = el.querySelector('[style*="padding-left"]');
      return innerDiv ? parseInt(getComputedStyle(innerDiv).paddingLeft, 10) : 0;
    });
    expect(paddingLeft).toBeGreaterThan(0);
  });

  test('outdents a child task back to root level', async ({ appPage: page }) => {
    await createTasks(page, ['Parent Task', 'Child Task']);
    const grid = getGrid(page);

    // Indent first
    await selectTask(page, 'Child Task');
    await page.keyboard.press('Alt+Shift+ArrowRight');

    // Verify indentation was applied
    const childNameCell = getCell(page, 'Child Task', 'name');
    const paddingAfterIndent = await childNameCell.evaluate((el) => {
      const innerDiv = el.querySelector('[style*="padding-left"]');
      return innerDiv ? parseInt(getComputedStyle(innerDiv).paddingLeft, 10) : 0;
    });
    expect(paddingAfterIndent).toBeGreaterThan(0);

    // Now outdent
    await page.keyboard.press('Alt+Shift+ArrowLeft');

    // Both tasks should be at root level — padding should be back to 0
    await expect(grid.getByText('Parent Task', { exact: true })).toBeVisible();
    await expect(grid.getByText('Child Task', { exact: true })).toBeVisible();

    const paddingAfterOutdent = await childNameCell.evaluate((el) => {
      const innerDiv = el.querySelector('[style*="padding-left"]');
      return innerDiv ? parseInt(getComputedStyle(innerDiv).paddingLeft, 10) : 0;
    });
    expect(paddingAfterOutdent).toBe(0);
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
