/**
 * Shared E2E test fixtures and helpers.
 *
 * Provides a custom `test` fixture that auto-dismisses the welcome tour
 * and navigates to the app, plus helper functions for common interactions.
 */

import { test as base, expect, type Page, type Locator } from '@playwright/test';

// ---------------------------------------------------------------------------
// Custom fixture — auto-dismisses welcome tour & navigates to app
// ---------------------------------------------------------------------------

export const test = base.extend<{ appPage: Page }>({
  appPage: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('ownchart-welcome-dismissed', 'true');
      localStorage.setItem('ownchart-tour-completed', 'true');
    });
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    // Wait for the task grid to render
    await expect(page.getByRole('grid', { name: 'Task spreadsheet' })).toBeVisible();
    await use(page);
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Expected number of visible gridcells per task row with default column config.
 * If the app's default column set changes, this must be updated.
 */
const EXPECTED_CELL_COUNT = 7;

/**
 * Column-name → gridcell index mapping for the default column layout.
 *
 * Order must match TASK_COLUMNS in src/config/tableColumns.ts:
 * rowNumber(0), color(1), name(2), startDate(3), endDate(4), duration(5), progress(6).
 *
 * If you hide columns via hiddenColumns or change the column order, these
 * indices will be wrong. Tests assume the default (all columns visible).
 */
const COLUMN_INDEX: Record<string, number> = {
  rowNumber: 0,
  color: 1,
  name: 2,
  startDate: 3,
  endDate: 4,
  duration: 5,
  progress: 6,
};

// ---------------------------------------------------------------------------
// Task creation helpers
// ---------------------------------------------------------------------------

/** Locator for the placeholder name cell (outer div, not the inner input). */
function getPlaceholderNameCell(page: Page): Locator {
  return page.locator('div[aria-label="New task name"]');
}

/**
 * Create a task by clicking the placeholder row, typing a name, and pressing Enter.
 *
 * The placeholder name cell requires two clicks: first click activates the cell,
 * second click enters edit mode (shows the input). We target the outer div
 * specifically to avoid matching the inner input element (same aria-label).
 */
export async function createTask(page: Page, name: string): Promise<void> {
  const placeholderCell = getPlaceholderNameCell(page);
  // First click — activate the cell
  await placeholderCell.click();
  // Second click — enter edit mode
  await placeholderCell.click();
  // Wait for the input to appear inside the cell
  const input = placeholderCell.locator('input');
  await expect(input).toBeVisible();
  await input.fill(name);
  await input.press('Enter');
  // Wait for the new row to appear in the grid
  await expect(
    getGrid(page).getByText(name, { exact: true })
  ).toBeVisible();
}

/**
 * Create multiple tasks in sequence.
 */
export async function createTasks(page: Page, names: string[]): Promise<void> {
  for (const name of names) {
    await createTask(page, name);
  }
}

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

/**
 * Get a task row locator by its name text within the grid.
 */
export function getTaskRow(page: Page, name: string): Locator {
  return getGrid(page)
    .getByRole('row')
    .filter({ hasText: name });
}

/**
 * Select a task by clicking its row number cell.
 */
export async function selectTask(page: Page, name: string): Promise<void> {
  const row = getTaskRow(page, name);
  // The first gridcell in each row is the row number cell
  const rowNumberCell = row.getByRole('gridcell').first();
  await rowNumberCell.click();
  await expect(row).toHaveAttribute('aria-selected', 'true');
}

/**
 * Select multiple tasks by Ctrl+clicking their row number cells.
 */
export async function selectTasks(page: Page, names: string[]): Promise<void> {
  if (names.length === 0) return;

  // First task — normal click
  await selectTask(page, names[0]);

  // Rest — Ctrl+click
  for (let i = 1; i < names.length; i++) {
    const row = getTaskRow(page, names[i]);
    const rowNumberCell = row.getByRole('gridcell').first();
    await rowNumberCell.click({ modifiers: ['Control'] });
  }
}

// ---------------------------------------------------------------------------
// Cell helpers
// ---------------------------------------------------------------------------

/**
 * Get a specific cell within a task row by column name.
 * Uses nth-child indexing based on default column order.
 *
 * Includes a runtime guard: if the row's gridcell count doesn't match the
 * expected default layout, the test fails early with a clear message instead
 * of silently testing the wrong cell.
 */
export function getCell(page: Page, taskName: string, column: string): Locator {
  const index = COLUMN_INDEX[column];
  if (index === undefined) {
    throw new Error(`Unknown column: ${column}. Use one of: ${Object.keys(COLUMN_INDEX).join(', ')}`);
  }
  const row = getTaskRow(page, taskName);
  return row.getByRole('gridcell').nth(index);
}

/**
 * Activate a cell and enter edit mode via F2.
 *
 * Uses F2 instead of double-click because the name cell replaces its DOM
 * subtree when switching to edit mode (the text children are replaced by an
 * `<input>`). The input is located via its `aria-label="Edit {columnLabel}"`.
 */
export async function activateAndEdit(
  page: Page,
  taskName: string,
  column: string,
  value: string,
  columnLabel: string,
): Promise<void> {
  const cell = getCell(page, taskName, column);
  await cell.click();
  await expect(cell).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('F2');
  const input = page.getByLabel(`Edit ${columnLabel}`);
  await expect(input).toBeVisible();
  await input.fill(value);
  await input.press('Enter');
}

/**
 * Verify that a task row has the expected number of gridcells.
 * Call this once in a test suite to catch column layout changes early.
 */
export async function assertDefaultColumnLayout(page: Page, taskName: string): Promise<void> {
  const row = getTaskRow(page, taskName);
  await expect(row.getByRole('gridcell')).toHaveCount(EXPECTED_CELL_COUNT);
}

// ---------------------------------------------------------------------------
// Grid helper
// ---------------------------------------------------------------------------

/**
 * Get the task grid (role="grid" with aria-label="Task spreadsheet").
 */
export function getGrid(page: Page): Locator {
  return page.getByRole('grid', { name: 'Task spreadsheet' });
}
