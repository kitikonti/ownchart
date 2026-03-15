/**
 * E2E tests for timeline drag & drop.
 *
 * Covers moving task bars and resizing them via mouse drag on the SVG chart.
 */

import { test, expect, createTask, getCell } from './fixtures/helpers';

// SVG drag simulation via page.mouse relies on pixel-accurate boundingBox()
// coordinates. Firefox and WebKit compute different SVG bounding boxes than
// Chromium, causing the drag delta to be zero. Skip on non-Chromium engines.
test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only — SVG drag coordinates');

test.describe('Timeline Drag & Drop', () => {
  test.beforeEach(async ({ appPage: page }) => {
    await createTask(page, 'Drag Task');
    // Press F to fit-to-view so the task bar is visible in the viewport
    await page.keyboard.press('f');
    // Wait for the task bar to render in the chart
    await expect(page.locator('.task-bar').first()).toBeVisible();
  });

  test('moves a task bar by dragging', async ({ appPage: page }) => {
    // Read the original start date from the table
    const startCell = getCell(page, 'Drag Task', 'startDate');
    const originalStartDate = await startCell.textContent();

    // Get the task bar's bounding box
    const taskBar = page.locator('.task-bar').first();
    const box = await taskBar.boundingBox();
    // boundingBox returns null if the element is not visible — the beforeEach
    // already asserted visibility, so this should never be null
    expect(box).not.toBeNull();
    const { x, y, width, height } = box!;

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Drag the task bar 150 pixels to the right
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 150, centerY, { steps: 10 });
    await page.mouse.up();

    // The start date should have changed
    const newStartDate = await startCell.textContent();
    expect(newStartDate).not.toBe(originalStartDate);
  });

  test('resizes a task bar from the right edge', async ({ appPage: page }) => {
    // Read the original end date
    const endCell = getCell(page, 'Drag Task', 'endDate');
    const originalEndDate = await endCell.textContent();

    // Get the task bar's bounding box
    const taskBar = page.locator('.task-bar').first();
    const box = await taskBar.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width, height } = box!;

    // Position at the right edge of the bar for resize
    const rightEdgeX = x + width - 2;
    const centerY = y + height / 2;

    // Drag the right edge further right
    await page.mouse.move(rightEdgeX, centerY);
    await page.mouse.down();
    await page.mouse.move(rightEdgeX + 120, centerY, { steps: 10 });
    await page.mouse.up();

    // The end date should have changed (extended)
    const newEndDate = await endCell.textContent();
    expect(newEndDate).not.toBe(originalEndDate);
  });
});
