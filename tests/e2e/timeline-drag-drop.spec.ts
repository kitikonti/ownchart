/**
 * E2E tests for timeline drag & drop.
 *
 * Covers moving task bars and resizing them via mouse drag on the SVG chart.
 */

import { test, expect, createTask, getCell } from './fixtures/helpers';

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
    expect(box).not.toBeNull();

    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Drag the task bar 150 pixels to the right
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 150, centerY, { steps: 10 });
      await page.mouse.up();

      // The start date should have changed
      const newStartDate = await startCell.textContent();
      expect(newStartDate).not.toBe(originalStartDate);
    }
  });

  test('resizes a task bar from the right edge', async ({ appPage: page }) => {
    // Read the original end date
    const endCell = getCell(page, 'Drag Task', 'endDate');
    const originalEndDate = await endCell.textContent();

    // Get the task bar's bounding box
    const taskBar = page.locator('.task-bar').first();
    const box = await taskBar.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      // Position at the right edge of the bar for resize
      const rightEdgeX = box.x + box.width - 2;
      const centerY = box.y + box.height / 2;

      // Drag the right edge further right
      await page.mouse.move(rightEdgeX, centerY);
      await page.mouse.down();
      await page.mouse.move(rightEdgeX + 120, centerY, { steps: 10 });
      await page.mouse.up();

      // The end date should have changed (extended)
      const newEndDate = await endCell.textContent();
      expect(newEndDate).not.toBe(originalEndDate);
    }
  });
});
