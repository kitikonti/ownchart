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
// Task creation helpers
// ---------------------------------------------------------------------------

/**
 * Create a task by clicking the placeholder row, typing a name, and pressing Enter.
 *
 * The placeholder name cell requires two clicks: first click activates the cell,
 * second click enters edit mode (shows the input). We target the outer div
 * specifically to avoid matching the inner input element (same aria-label).
 */
export async function createTask(page: Page, name: string): Promise<void> {
  // Target the placeholder div cell (not the input — both share aria-label)
  const placeholderCell = page.locator('div[aria-label="New task name"]');
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
    page.getByRole('grid', { name: 'Task spreadsheet' }).getByText(name, { exact: true })
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
  return page
    .getByRole('grid', { name: 'Task spreadsheet' })
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
 * Default column order: rowNumber(0), color(1), name(2), startDate(3),
 * endDate(4), duration(5), progress(6).
 */
const COLUMN_INDEX: Record<string, number> = {
  'rowNumber': 0,
  'color': 1,
  'name': 2,
  'startDate': 3,
  'endDate': 4,
  'duration': 5,
  'progress': 6,
};

/**
 * Get a specific cell within a task row by column name.
 * Uses nth-child indexing based on default column order.
 */
export function getCell(page: Page, taskName: string, column: string): Locator {
  const index = COLUMN_INDEX[column];
  if (index === undefined) {
    throw new Error(`Unknown column: ${column}. Use one of: ${Object.keys(COLUMN_INDEX).join(', ')}`);
  }
  return getTaskRow(page, taskName).getByRole('gridcell').nth(index);
}

/**
 * Activate a cell (single click) and then enter edit mode (second click or F2).
 */
export async function editCell(
  page: Page,
  taskName: string,
  column: string,
  value: string
): Promise<void> {
  const cell = getCell(page, taskName, column);
  // First click to activate — wait for state update
  await cell.click();
  await expect(cell).toHaveAttribute('aria-selected', 'true');
  // Second click to enter edit mode
  await cell.click();
  const input = cell.locator('input');
  await expect(input).toBeVisible();
  await input.fill(value);
  await input.press('Enter');
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
