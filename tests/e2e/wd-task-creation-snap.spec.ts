/**
 * E2E tests for working-days-aware task creation snapping (#82).
 *
 * Verifies WD feature checklist items:
 *   #45 — New task: start snaps forward to working day, WD duration computed
 *   #46 — Insert below: start snaps forward to working day
 *   #47 — Insert above: end snaps backward to working day
 */

import { test, expect } from "@playwright/test";
import {
  injectAndNavigate,
  getStartDate,
  assertWorkingDay,
  parseDisplayDate,
} from "./fixtures/dependency-helpers";
import { createTask, insertTaskViaRowButton, getGrid } from "./fixtures/helpers";
import type { StoragePayloadOptions } from "./fixtures/sample-data";

// ─── Fixture ────────────────────────────────────────────────────────────────

const REF_TASK = {
  id: "ref-task-1",
  name: "Reference",
  startDate: "2025-01-13", // Monday
  endDate: "2025-01-17", // Friday
  duration: 5,
  progress: 0,
  color: "#3b82f6",
  order: 0,
  type: "task",
  metadata: {},
};

const options: StoragePayloadOptions = {
  tabId: "tab-1111111111-taskcrt",
  tasks: [REF_TASK],
  chartState: {
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    showWeekends: true,
    showTodayMarker: false,
    showHolidays: false,
    showDependencies: true,
    showProgress: true,
    taskLabelPosition: "after",
    autoScheduling: true,
    workingDaysMode: true,
    workingDaysConfig: {
      excludeSaturday: true,
      excludeSunday: true,
      excludeHolidays: false,
    },
  },
};

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("WD task creation snapping (#82)", () => {
  test("#46 insert below: start snaps forward to working day", async ({
    page,
  }) => {
    await injectAndNavigate(page, options, "Reference");

    // Insert a new task below "Reference" (row 1)
    await insertTaskViaRowButton(page, "Reference", "below", 1);

    // Exit edit mode so dates are committed
    await page.keyboard.press("Escape");

    // Wait for the new task row to appear
    const grid = getGrid(page);
    await expect(grid.locator(".task-table-row")).toHaveCount(2, {
      timeout: 5_000,
    });

    // The new task is below Reference — it's the second .task-table-row
    const newTaskRow = grid.locator(".task-table-row").nth(1);
    const startCell = newTaskRow.getByRole("gridcell").nth(3); // startDate column
    const startText = (await startCell.textContent())?.trim() ?? "";

    // Start date must be on or after Monday 01/20/2025 (next working day after Fri 01/17)
    assertWorkingDay(startText, "insert-below start");
    const startDate = parseDisplayDate(startText);
    const mondayAfterRef = new Date(2025, 0, 20); // Mon Jan 20
    expect(
      startDate.getTime(),
      `Start date ${startText} should be >= 01/20/2025`
    ).toBeGreaterThanOrEqual(mondayAfterRef.getTime());
  });

  test("#47 insert above: end snaps backward to working day", async ({
    page,
  }) => {
    await injectAndNavigate(page, options, "Reference");

    // Insert a new task above "Reference" (row 1)
    await insertTaskViaRowButton(page, "Reference", "above", 1);

    // Exit edit mode so dates are committed
    await page.keyboard.press("Escape");

    // Wait for the new row to appear
    const grid = getGrid(page);
    await expect(grid.locator(".task-table-row")).toHaveCount(2, {
      timeout: 5_000,
    });

    // The new task is above Reference — it's the first .task-table-row
    const newTaskRow = grid.locator(".task-table-row").nth(0);
    const endCell = newTaskRow.getByRole("gridcell").nth(4); // endDate column
    const endText = (await endCell.textContent())?.trim() ?? "";

    // End date must be on or before Friday 01/10/2025 (last working day before Mon 01/13)
    assertWorkingDay(endText, "insert-above end");
    const endDate = parseDisplayDate(endText);
    const fridayBeforeRef = new Date(2025, 0, 10); // Fri Jan 10
    expect(
      endDate.getTime(),
      `End date ${endText} should be <= 01/10/2025`
    ).toBeLessThanOrEqual(fridayBeforeRef.getTime());
  });

  test("#45 new task: start snaps to working day when today is Saturday", async ({
    page,
  }) => {
    // Install fake clock at Saturday Jan 11, 2025 — BEFORE navigation
    await page.clock.install({ time: new Date(2025, 0, 11, 12, 0, 0) });
    await injectAndNavigate(page, options, "Reference");

    // Create a new task via the placeholder row
    await createTask(page, "Weekend Task");

    // The new task's start date must be on a working day (snapped from Saturday)
    const startDate = await getStartDate(page, "Weekend Task");
    assertWorkingDay(startDate, "new task start");
  });
});
