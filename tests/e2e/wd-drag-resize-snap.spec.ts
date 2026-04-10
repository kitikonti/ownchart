/**
 * E2E tests for WD-aware drag, resize, and multi-select snapping (#82).
 *
 * Covers checklist items:
 *   #12 — Resize respects WD context
 *   #13 — Creating dep by drag computes initial lag in WD
 *   #33 — Drag-move: task dropped on weekend snaps to next working day
 *   #36 — Multi-select drag: secondary task bar previews snap consistently
 */

import { test, expect } from "@playwright/test";
import {
  injectAndNavigate,
  getStartDate,
  getEndDate,
  dragTaskBar,
  resizeTaskBar,
  assertWorkingDay,
  parseDisplayDate,
  openDependencyPanel,
  getLagValue,
  closeDependencyPanel,
} from "./fixtures/dependency-helpers";
import { selectTasks } from "./fixtures/helpers";
import { WD_CHART_STATE, type StoragePayloadOptions } from "./fixtures/sample-data";

test.describe("WD drag / resize snapping (#82)", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Chromium only — SVG drag coordinates"
  );

  // ----- #33 — Drag-move snaps to next working day -----

  test("#33 — drag-move: task dropped on weekend snaps to working day", async ({
    page,
  }) => {
    // Use a larger task (Mon-Fri week) so the bar is big enough to drag reliably
    const options: StoragePayloadOptions = {
      tabId: "tab-1111111111-drag33",
      tasks: [
        {
          id: "drag-task",
          name: "Drag Me",
          startDate: "2025-01-06", // Mon
          endDate: "2025-01-10", // Fri (5 days → visible bar)
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "task",
          metadata: {},
        },
      ],
      chartState: WD_CHART_STATE,
    };

    await injectAndNavigate(page, options, "Drag Me");
    // Fit to view so the task bar is visible and properly sized
    await page.keyboard.press("f");
    // Wait for the task bar to be visible in the timeline
    const taskBar = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Drag Me")') })
      .first();
    await expect(taskBar).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(500);

    const origStart = await getStartDate(page, "Drag Me");

    // Drag right — use a large delta to ensure the task moves past the weekend
    await dragTaskBar(page, "Drag Me", 200);

    const newStart = await getStartDate(page, "Drag Me");
    // The task must have moved
    expect(newStart).not.toBe(origStart);
    // And it must land on a working day
    assertWorkingDay(newStart, "drag-move start");
    const newEnd = await getEndDate(page, "Drag Me");
    assertWorkingDay(newEnd, "drag-move end");
  });

  // ----- #12 — Resize respects WD context -----

  test("#12 — resize right edge: end date snaps to working day", async ({
    page,
  }) => {
    const options: StoragePayloadOptions = {
      tabId: "tab-1111111111-resz12",
      tasks: [
        {
          id: "resize-task",
          name: "Resize Me",
          startDate: "2025-01-06", // Mon
          endDate: "2025-01-09", // Thu
          duration: 4,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "task",
          metadata: {},
        },
      ],
      chartState: WD_CHART_STATE,
    };

    await injectAndNavigate(page, options, "Resize Me");
    await page.keyboard.press("f");
    const taskBar = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Resize Me")') })
      .first();
    await expect(taskBar).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(500);

    // Resize right edge to the right — extend past the weekend
    await resizeTaskBar(page, "Resize Me", "right", 200);

    const newEnd = await getEndDate(page, "Resize Me");
    assertWorkingDay(newEnd, "resized end");
    // End date must be after original Thu
    const endDate = parseDisplayDate(newEnd);
    expect(endDate.getTime()).toBeGreaterThan(
      new Date(2025, 0, 9).getTime()
    );
  });

  // ----- #36 — Multi-select drag: all tasks snap to working days -----

  test("#36 — multi-select drag: all tasks land on working days", async ({
    page,
  }) => {
    const options: StoragePayloadOptions = {
      tabId: "tab-1111111111-multi36",
      tasks: [
        {
          id: "ms-a",
          name: "Multi A",
          startDate: "2025-01-06",
          endDate: "2025-01-08",
          duration: 3,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "task",
          metadata: {},
        },
        {
          id: "ms-b",
          name: "Multi B",
          startDate: "2025-01-09",
          endDate: "2025-01-10",
          duration: 2,
          progress: 0,
          color: "#10b981",
          order: 1,
          type: "task",
          metadata: {},
        },
        {
          id: "ms-c",
          name: "Multi C",
          startDate: "2025-01-13",
          endDate: "2025-01-15",
          duration: 3,
          progress: 0,
          color: "#f59e0b",
          order: 2,
          type: "task",
          metadata: {},
        },
      ],
      chartState: WD_CHART_STATE,
    };

    await injectAndNavigate(page, options, "Multi A");
    await page.keyboard.press("f");
    const firstBar = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Multi A")') })
      .first();
    await expect(firstBar).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(500);

    // Select all three tasks
    await selectTasks(page, ["Multi A", "Multi B", "Multi C"]);

    // Drag the primary task right — use large delta to push past a weekend
    await dragTaskBar(page, "Multi A", 200);

    // All three must land on working days
    for (const name of ["Multi A", "Multi B", "Multi C"]) {
      const start = await getStartDate(page, name);
      const end = await getEndDate(page, name);
      assertWorkingDay(start, `${name} start`);
      assertWorkingDay(end, `${name} end`);
    }
  });

  // ----- #13 — Creating dep by drag computes initial lag in WD -----

  test("#13 — dep creation by drag: initial lag is in working days", async ({
    page,
  }) => {
    // Task A: Mon 01/06 - Fri 01/10
    // Task B: Mon 01/20 - Fri 01/24
    // Gap: 7 working days between A end and B start
    const options: StoragePayloadOptions = {
      tabId: "tab-1111111111-depdr13",
      tasks: [
        {
          id: "dep-src",
          name: "Source",
          startDate: "2025-01-06",
          endDate: "2025-01-10",
          duration: 5,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          type: "task",
          metadata: {},
        },
        {
          id: "dep-tgt",
          name: "Target",
          startDate: "2025-01-20",
          endDate: "2025-01-24",
          duration: 5,
          progress: 0,
          color: "#10b981",
          order: 1,
          type: "task",
          metadata: {},
        },
      ],
      chartState: WD_CHART_STATE,
    };

    await injectAndNavigate(page, options, "Source");
    await page.keyboard.press("f");
    const srcBar = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Source")') })
      .first();
    await expect(srcBar).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(500);

    // Use the background rect for accurate bounding box (not group + label)
    const srcRect = srcBar.locator('[data-testid="task-bar-bg"]');
    const srcBox = await srcRect.boundingBox();
    expect(srcBox).not.toBeNull();

    // Hover over Source bar to reveal connection handles
    const srcCenterX = srcBox!.x + srcBox!.width / 2;
    const srcCenterY = srcBox!.y + srcBox!.height / 2;
    await page.mouse.move(srcCenterX, srcCenterY);
    await page.waitForTimeout(300);

    // The "end" connection handle is a circle 10px to the right of the bar edge.
    // Mousedown on it to start dependency drag.
    const endHandleX = srcBox!.x + srcBox!.width + 10;
    await page.mouse.move(endHandleX, srcCenterY);
    await page.waitForTimeout(200);
    await page.mouse.down();

    // Drag to the Target bar
    const tgtBar = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Target")') })
      .first();
    const tgtRect = tgtBar.locator('[data-testid="task-bar-bg"]');
    const tgtBox = await tgtRect.boundingBox();
    expect(tgtBox).not.toBeNull();
    const tgtCenterX = tgtBox!.x + tgtBox!.width / 2;
    const tgtCenterY = tgtBox!.y + tgtBox!.height / 2;

    await page.mouse.move(tgtCenterX, tgtCenterY, { steps: 15 });
    await page.mouse.up();

    // Wait for dep arrow to appear
    await expect(page.locator(".dependency-arrow")).toBeVisible({
      timeout: 5_000,
    });

    // Open the panel to verify lag value
    await openDependencyPanel(page, "Source", "Target");
    const lag = await getLagValue(page);
    // The lag should be in working days — gap from Fri 01/10 to Mon 01/20
    // FS anchor = day after pred end = Sat 01/11, snaps to Mon 01/13
    // Working days from Mon 01/13 to Mon 01/20 (exclusive) = 5 working days
    // So lag should be 5 (wd)
    expect(Number(lag)).toBeGreaterThanOrEqual(0);
    // Verify it's a reasonable working-day lag (not calendar days which would be 9)
    expect(Number(lag)).toBeLessThanOrEqual(7);
    await closeDependencyPanel(page);
  });
});
