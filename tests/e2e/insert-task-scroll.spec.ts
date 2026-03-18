/**
 * E2E tests for issue #78: Scroll to task does not work when using
 * "create task above/below".
 *
 * Verifies that inserting a task via the row number cell hover buttons
 * auto-scrolls the timeline to show the new task bar.
 */

import {
  test,
  expect,
  createTask,
  insertTaskViaRowButton,
  isSvgElementInViewport,
  scrollContainerTo,
  CHART_CONTAINER,
  TASK_BAR,
} from './fixtures/helpers';

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
    await scrollContainerTo(page, CHART_CONTAINER, 0);

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
    await scrollContainerTo(page, CHART_CONTAINER, 0);

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
