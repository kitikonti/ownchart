/**
 * E2E tests for timeline scroll positioning.
 *
 * Verifies that:
 * 1. Fresh app opens with today visible in the timeline
 * 2. Creating the first task shows it in the viewport
 * 3. Creating a task after scrolling away auto-scrolls to show the task
 *
 * These tests catch the regression from issue #76 where the timeline
 * opened at CW52 2025 instead of showing today's date.
 */

import {
  test,
  expect,
  createTask,
  createTasks,
  isSvgElementInViewport,
  scrollContainerTo,
  CHART_CONTAINER,
  OUTER_SCROLL,
  TODAY_MARKER,
  TASK_BAR,
} from './fixtures/helpers';

test.describe('Timeline Scroll Positioning', () => {
  test('fresh app opens with today marker in the visible viewport', async ({ appPage: page }) => {
    // The today marker should be rendered (showTodayMarker defaults to true)
    const todayMarker = page.locator(TODAY_MARKER);
    await expect(todayMarker).toBeAttached();

    // Verify it's actually within the visible scroll range, not just in the DOM.
    // Use expect.poll to retry — webkit needs time to settle the initial scroll position.
    await expect
      .poll(() => isSvgElementInViewport(page, TODAY_MARKER, CHART_CONTAINER), { timeout: 5000 })
      .toBe(true);
  });

  test('creating the first task shows the task bar in the viewport', async ({ appPage: page }) => {
    // Create a task (on an empty chart, it defaults to today's date)
    await createTask(page, 'First Task');

    // Wait for the task bar to render in the chart
    const taskBar = page.locator(TASK_BAR).first();
    await expect(taskBar).toBeAttached();

    // Verify the task bar is within the visible scroll range
    const isVisible = await isSvgElementInViewport(page, TASK_BAR, CHART_CONTAINER);
    expect(isVisible).toBe(true);
  });

  test('creating a task after scrolling away auto-scrolls to show the task bar', async ({ appPage: page }) => {
    // 1. Verify today marker is initially visible (poll for webkit scroll settling)
    const todayMarker = page.locator(TODAY_MARKER);
    await expect(todayMarker).toBeAttached();
    await expect
      .poll(() => isSvgElementInViewport(page, TODAY_MARKER, CHART_CONTAINER), { timeout: 5000 })
      .toBe(true);

    // 2. Scroll the timeline to the far left (away from today)
    await scrollContainerTo(page, CHART_CONTAINER, 0);

    // 3. Today marker should now be off-screen
    // (scrollLeft=0 shows dateRange.min which is ~90 days before today)
    const afterScrollVisible = await isSvgElementInViewport(page, TODAY_MARKER, CHART_CONTAINER);
    expect(afterScrollVisible).toBe(false);

    // 4. Create a task (defaults to today's date on empty chart)
    await createTask(page, 'After Scroll Task');

    // 5. Wait for the task bar to render and auto-scroll to settle
    const taskBar = page.locator(TASK_BAR).first();
    await expect(taskBar).toBeAttached();

    // 6. Verify the task bar is now visible in the viewport (poll for scroll settling)
    await expect
      .poll(() => isSvgElementInViewport(page, TASK_BAR, CHART_CONTAINER), { timeout: 5000 })
      .toBe(true);
  });

  test('Alt+T scrolls timeline to show today', async ({ appPage: page }) => {
    // 1. Create a task so the timeline has content
    await createTask(page, 'Anchor Task');

    // 2. Scroll the timeline to the far left (away from today)
    await scrollContainerTo(page, CHART_CONTAINER, 0);

    // 3. Today marker should be off-screen
    const todayMarker = page.locator(TODAY_MARKER);
    await expect(todayMarker).toBeAttached();
    const offScreen = await isSvgElementInViewport(page, TODAY_MARKER, CHART_CONTAINER);
    expect(offScreen).toBe(false);

    // 4. Press Alt+T to scroll to today
    await page.keyboard.press('Alt+t');
    await page.waitForTimeout(300);

    // 5. Today marker should now be visible
    const afterCtrlT = await isSvgElementInViewport(page, TODAY_MARKER, CHART_CONTAINER);
    expect(afterCtrlT).toBe(true);
  });
});

test.describe('Scroll Position Restore', () => {
  test('browser reload restores vertical scroll position', async ({ appPage: page }) => {
    // 1. Create enough tasks to require vertical scrolling
    const taskNames = Array.from({ length: 30 }, (_, i) => `Task ${i + 1}`);
    await createTasks(page, taskNames);

    // 2. Scroll vertically to a significant offset
    const targetScrollTop = 400;
    await page.evaluate(({ sel, top }) => {
      const container = document.querySelector(sel) as HTMLElement;
      if (container) container.scrollTop = top;
    }, { sel: OUTER_SCROLL, top: targetScrollTop });
    await page.waitForTimeout(300);

    // Verify scrollTop was applied
    const scrollTopBefore = await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement;
      return el?.scrollTop ?? 0;
    }, OUTER_SCROLL);
    expect(scrollTopBefore).toBeGreaterThanOrEqual(targetScrollTop - 10);

    // 3. Wait for localStorage persistence (scrollTop saved)
    await page.waitForFunction(
      () => {
        const state = localStorage.getItem('ownchart-multi-tab-state');
        if (!state) return false;
        const parsed = JSON.parse(state);
        const charts = parsed.charts || {};
        const chart = Object.values(charts)[0] as { chartState?: { scrollTop?: number } } | undefined;
        return (chart?.chartState?.scrollTop ?? 0) >= 300;
      },
      { timeout: 5000 }
    );

    // 4. Capture storage for reload
    const multiTabState = await page.evaluate(
      () => localStorage.getItem('ownchart-multi-tab-state')
    );
    const tabId = await page.evaluate(
      () => sessionStorage.getItem('ownchart-tab-id')
    );
    if (!multiTabState || !tabId) {
      throw new Error('Persistence state not found');
    }

    // 5. Reload with the same persisted state
    await page.addInitScript(
      ({ state, id }) => {
        localStorage.setItem('ownchart-welcome-dismissed', 'true');
        localStorage.setItem('ownchart-tour-completed', 'true');
        localStorage.setItem('ownchart-multi-tab-state', state);
        sessionStorage.setItem('ownchart-tab-id', id);
      },
      { state: multiTabState, id: tabId }
    );
    await page.goto('/');
    await expect(page.getByRole('grid', { name: 'Task spreadsheet' })).toBeVisible();
    await page.waitForTimeout(500);

    // 6. Verify scrollTop was restored (not 0 = top of list)
    const scrollTopAfter = await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement;
      return el?.scrollTop ?? 0;
    }, OUTER_SCROLL);

    // Should be close to the saved value (pixel-based, no conversion needed)
    expect(scrollTopAfter).toBeGreaterThanOrEqual(300);
  });

  test('browser reload restores horizontal scroll position (task bar visibility)', async ({ appPage: page }) => {
    // 1. Create a task so timeline has a task bar
    await createTask(page, 'Scroll Test Task');

    // 2. Verify the task bar is initially visible (near today)
    const taskBar = page.locator(TASK_BAR).first();
    await expect(taskBar).toBeAttached();
    const visibleBefore = await isSvgElementInViewport(page, TASK_BAR, CHART_CONTAINER);
    expect(visibleBefore).toBe(true);

    // 3. Scroll timeline to the far left so the task bar goes off-screen
    await scrollContainerTo(page, CHART_CONTAINER, 0);

    // 4. Verify the task bar is now off-screen
    const offScreenBefore = await isSvgElementInViewport(page, TASK_BAR, CHART_CONTAINER);
    expect(offScreenBefore).toBe(false);

    // 5. Wait for localStorage persistence
    await page.waitForFunction(
      () => {
        const state = localStorage.getItem('ownchart-multi-tab-state');
        if (!state) return false;
        const parsed = JSON.parse(state);
        const charts = parsed.charts || {};
        const chart = Object.values(charts)[0] as { chartState?: { viewAnchorDate?: string } } | undefined;
        return !!chart?.chartState?.viewAnchorDate;
      },
      { timeout: 5000 }
    );

    // 6. Capture storage for reload
    const multiTabState = await page.evaluate(
      () => localStorage.getItem('ownchart-multi-tab-state')
    );
    const tabId = await page.evaluate(
      () => sessionStorage.getItem('ownchart-tab-id')
    );
    if (!multiTabState || !tabId) {
      throw new Error('Persistence state not found');
    }

    // 7. Reload with the same persisted state
    await page.addInitScript(
      ({ state, id }) => {
        localStorage.setItem('ownchart-welcome-dismissed', 'true');
        localStorage.setItem('ownchart-tour-completed', 'true');
        localStorage.setItem('ownchart-multi-tab-state', state);
        sessionStorage.setItem('ownchart-tab-id', id);
      },
      { state: multiTabState, id: tabId }
    );
    await page.goto('/');
    await expect(page.getByRole('grid', { name: 'Task spreadsheet' })).toBeVisible();
    await page.waitForTimeout(500);

    // 8. Task bar should still be off-screen (horizontal scroll position restored)
    //    If scroll wasn't restored, the default position would show the task bar
    const offScreenAfter = await isSvgElementInViewport(page, TASK_BAR, CHART_CONTAINER);
    expect(offScreenAfter).toBe(false);
  });

});
