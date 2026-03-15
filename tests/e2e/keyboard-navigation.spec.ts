/**
 * E2E tests for keyboard navigation in the task table.
 *
 * Covers Tab/Shift+Tab cell movement, arrow key navigation,
 * and Enter/Escape for editing.
 */

import { test, expect, createTask, getGrid, getCell } from './fixtures/helpers';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ appPage: page }) => {
    await createTask(page, 'Task Alpha');
    await createTask(page, 'Task Beta');
  });

  test('Tab and Shift+Tab navigate between cells', async ({ appPage: page }) => {
    // Click the name cell (column index 2) of Task Alpha to activate it
    const nameCell = getCell(page, 'Task Alpha', 'name');
    await nameCell.click();
    await expect(nameCell).toHaveAttribute('aria-selected', 'true');

    // Press Tab twice: name → type (invisible) → startDate (visible)
    // The "type" field is editable but not rendered as a column
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Wait for the startDate cell to become active
    const startDateCell = getCell(page, 'Task Alpha', 'startDate');
    await expect(startDateCell).toHaveAttribute('aria-selected', 'true');

    // Name cell should no longer be selected
    await expect(nameCell).toHaveAttribute('aria-selected', 'false');

    // Shift+Tab twice to go back to name (startDate → type → name)
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(nameCell).toHaveAttribute('aria-selected', 'true');
  });

  test('arrow keys navigate the grid', async ({ appPage: page }) => {
    // Click the name cell of Task Alpha
    const alphaNameCell = getCell(page, 'Task Alpha', 'name');
    await alphaNameCell.click();
    await expect(alphaNameCell).toHaveAttribute('aria-selected', 'true');

    // Press ArrowDown to move to Task Beta's name cell
    await page.keyboard.press('ArrowDown');
    const betaNameCell = getCell(page, 'Task Beta', 'name');
    await expect(betaNameCell).toHaveAttribute('aria-selected', 'true');

    // Press ArrowUp to go back to Task Alpha
    await page.keyboard.press('ArrowUp');
    const alphaAgain = getCell(page, 'Task Alpha', 'name');
    await expect(alphaAgain).toHaveAttribute('aria-selected', 'true');
  });

  test('Enter starts editing and Escape exits', async ({ appPage: page }) => {
    // Click the name cell to activate it
    const nameCell = getCell(page, 'Task Alpha', 'name');
    await nameCell.click();
    await expect(nameCell).toHaveAttribute('aria-selected', 'true');

    // Press Enter to start editing — the input gets aria-label="Edit Name"
    await page.keyboard.press('Enter');
    const input = page.getByLabel('Edit Name');
    await expect(input).toBeVisible();

    // Press Escape to exit edit mode without changes
    await page.keyboard.press('Escape');
    await expect(input).not.toBeVisible();

    // Original text should still be there
    const grid = getGrid(page);
    await expect(grid.getByText('Task Alpha', { exact: true })).toBeVisible();
  });
});
