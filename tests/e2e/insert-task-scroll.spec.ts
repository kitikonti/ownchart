/**
 * E2E tests for issue #78: Scroll to task does not work when using
 * "create task above/below".
 *
 * Verifies that inserting a task via the row number cell hover buttons
 * auto-scrolls the timeline to show the new task bar.
 */

import { test, expect, createTask, getTaskRow } from './fixtures/helpers';

const CHART_CONTAINER = '.gantt-chart-scroll-container';
const TASK_BAR = 'g.task-bar';

/**
 * Check if an SVG element's bounding box overlaps the chart container's
 * visible scroll viewport. Returns true if any part of the element is visible.
 */
async function isSvgElementInViewport(
  page: import('@playwright/test').Page,
  svgSelector: string,
  containerSelector: string,
): Promise<boolean> {
  return page.evaluate(
    ({ svgSel, contSel }) => {
      const el = document.querySelector(svgSel);
      const container = document.querySelector(contSel);
      if (!el || !container) return false;

      const bbox = (el as SVGGraphicsElement).getBBox();
      const { scrollLeft, clientWidth } = container as HTMLElement;

      return bbox.x + bbox.width >= scrollLeft && bbox.x <= scrollLeft + clientWidth;
    },
    { svgSel: svgSelector, contSel: containerSelector },
  );
}

/**
 * Hover over a row number cell to reveal insert controls, then click the
 * insert above or insert below button.
 */
async function insertTaskViaRowButton(
  page: import('@playwright/test').Page,
  taskName: string,
  position: 'above' | 'below',
  rowNumber: number,
): Promise<void> {
  const row = getTaskRow(page, taskName);
  const rowNumberCell = row.getByRole('gridcell').first();

  // Hover to reveal insert controls
  await rowNumberCell.hover();

  // Click the insert button
  const insertButton = page.getByLabel(`Insert ${position} row ${rowNumber}`);
  await expect(insertButton).toBeAttached();
  await insertButton.click();
}

test.describe('Insert Task Above/Below — Auto-Scroll (#78)', () => {
  test('insert below auto-scrolls timeline to show new task bar', async ({ appPage: page }) => {
    // 1. Create an initial task
    await createTask(page, 'Reference Task');

    // Verify its task bar is visible
    const taskBar = page.locator(TASK_BAR).first();
    await expect(taskBar).toBeAttached();
    const initiallyVisible = await isSvgElementInViewport(page, TASK_BAR, CHART_CONTAINER);
    expect(initiallyVisible).toBe(true);

    // 2. Scroll timeline far left (away from today / task area)
    await page.evaluate((sel) => {
      const container = document.querySelector(sel) as HTMLElement;
      if (container) container.scrollLeft = 0;
    }, CHART_CONTAINER);
    await page.waitForTimeout(300);

    // 3. Verify task bars are now off-screen
    const afterScrollVisible = await isSvgElementInViewport(page, TASK_BAR, CHART_CONTAINER);
    expect(afterScrollVisible).toBe(false);

    // 4. Insert a task below via the row number hover button
    await insertTaskViaRowButton(page, 'Reference Task', 'below', 1);

    // 5. Wait for the new task to appear in the grid
    await expect(page.locator(TASK_BAR)).toHaveCount(2);
    await page.waitForTimeout(300);

    // 6. Verify the timeline auto-scrolled to show a task bar
    const anyTaskVisible = await isSvgElementInViewport(
      page,
      `${TASK_BAR}:last-of-type`,
      CHART_CONTAINER,
    );
    expect(anyTaskVisible).toBe(true);
  });

  test('insert above auto-scrolls timeline to show new task bar', async ({ appPage: page }) => {
    // 1. Create an initial task
    await createTask(page, 'Reference Task');

    const taskBar = page.locator(TASK_BAR).first();
    await expect(taskBar).toBeAttached();

    // 2. Scroll timeline far left
    await page.evaluate((sel) => {
      const container = document.querySelector(sel) as HTMLElement;
      if (container) container.scrollLeft = 0;
    }, CHART_CONTAINER);
    await page.waitForTimeout(300);

    const afterScrollVisible = await isSvgElementInViewport(page, TASK_BAR, CHART_CONTAINER);
    expect(afterScrollVisible).toBe(false);

    // 3. Insert a task above via the row number hover button
    await insertTaskViaRowButton(page, 'Reference Task', 'above', 1);

    // 4. Wait for the new task to appear
    await expect(page.locator(TASK_BAR)).toHaveCount(2);
    await page.waitForTimeout(300);

    // 5. Verify auto-scroll happened
    const anyTaskVisible = await isSvgElementInViewport(
      page,
      `${TASK_BAR}:first-of-type`,
      CHART_CONTAINER,
    );
    expect(anyTaskVisible).toBe(true);
  });
});
