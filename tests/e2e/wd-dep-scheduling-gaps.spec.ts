/**
 * E2E tests for WD dependency scheduling gaps (#82).
 *
 * Covers checklist items:
 *   #2 — FS lag=0 snaps past holidays (Thanksgiving)
 *   #4 — Negative lag (lag=-1wd)
 *   #6 — Hidden tasks still participate in scheduling
 *   #9 — Calendar mode panel edits still work
 */

import { test, expect } from "@playwright/test";
import {
  injectAndNavigate,
  fitAndWaitForArrows,
  getStartDate,
  dragTaskBar,
  openDependencyPanel,
  getLagInput,
  closeDependencyPanel,
  assertWorkingDay,
} from "./fixtures/dependency-helpers";
import type { StoragePayloadOptions } from "./fixtures/sample-data";

test.describe("WD dependency scheduling gaps (#82)", () => {
  // -------------------------------------------------------------------------
  // #2 — FS lag=0 snaps past holidays (Thanksgiving)
  // -------------------------------------------------------------------------

  test("FS lag=0 snaps past holidays (Thanksgiving)", async ({ page }) => {
    // Pred ends Tue 11/25. Succ at Wed 11/26 with FS lag=0.
    // We'll use panel edit to change pred's endDate to Wed 11/26.
    // Then cascade: FS lag=0, next WD after Wed 11/26 = Thu 11/27 = Thanksgiving → skip → Fri 11/28.
    const PRED = {
      id: "thanks-pred",
      name: "Stage A",
      startDate: "2025-11-24", // Mon
      endDate: "2025-11-26", // Wed (before Thanksgiving)
      duration: 3,
      progress: 0,
      color: "#3b82f6",
      order: 0,
      type: "task",
      metadata: {},
    };

    // Succ initially at Wed 11/26 — valid FS lag=0 if pred ended Tue.
    // After we change lag from some initial value, cascade will fire.
    const SUCC = {
      id: "thanks-succ",
      name: "Stage B",
      startDate: "2025-11-26", // Wed (before Thanksgiving)
      endDate: "2025-11-28",
      duration: 3,
      progress: 0,
      color: "#10b981",
      order: 1,
      type: "task",
      metadata: {},
    };

    const DEP = {
      id: "thanks-dep",
      fromTaskId: "thanks-pred",
      toTaskId: "thanks-succ",
      type: "FS",
      lag: -1, // Initially -1 so succ can be at 11/26
      createdAt: "2025-11-01T00:00:00.000Z",
    };

    const options: StoragePayloadOptions = {
      tabId: "tab-1111111111-thanks",
      tasks: [PRED, SUCC],
      dependencies: [DEP],
      chartState: {
        zoom: 1,
        panOffset: { x: 0, y: 0 },
        showWeekends: true,
        showTodayMarker: false,
        showHolidays: true,
        showDependencies: true,
        showProgress: true,
        taskLabelPosition: "after",
        autoScheduling: true,
        workingDaysMode: true,
        workingDaysConfig: {
          excludeSaturday: true,
          excludeSunday: true,
          excludeHolidays: true,
        },
        holidayRegion: "US",
      },
      fileState: {
        fileName: "Thanksgiving Test",
        chartId: "thanks-chart-001",
        lastSaved: "2025-11-01T10:00:00.000Z",
        isDirty: false,
      },
    };

    await injectAndNavigate(page, options, "Stage A");
    await fitAndWaitForArrows(page);

    // Change lag from -1 to 0 via panel — this triggers cascade
    await openDependencyPanel(page, "Stage A", "Stage B");
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("0");
    await lagInput.press("Tab");
    await closeDependencyPanel(page);

    // FS lag=0: anchor = next day after pred end (Wed 11/26) = Thu 11/27
    // Thu 11/27 = Thanksgiving (US holiday) → skip → Fri 11/28
    const succStart = await getStartDate(page, "Stage B");
    expect(succStart).toBe("11/28/2025");
    assertWorkingDay(succStart, "Stage B start");
  });

  // -------------------------------------------------------------------------
  // #4 — Negative lag (lag=-1wd)
  // -------------------------------------------------------------------------

  test("negative lag — panel edit to lag=-1 overlaps successor", async ({
    page,
  }) => {
    // Start with pred Mon-Fri and succ at the FS anchor (Mon 01/13) with lag=0
    const PRED = {
      id: "neg-pred",
      name: "Pred",
      startDate: "2025-01-06", // Mon
      endDate: "2025-01-10", // Fri
      duration: 5,
      progress: 0,
      color: "#3b82f6",
      order: 0,
      type: "task",
      metadata: {},
    };

    const SUCC = {
      id: "neg-succ",
      name: "Succ",
      startDate: "2025-01-13", // Mon (valid FS lag=0 position)
      endDate: "2025-01-17",
      duration: 5,
      progress: 0,
      color: "#10b981",
      order: 1,
      type: "task",
      metadata: {},
    };

    const DEP = {
      id: "neg-dep",
      fromTaskId: "neg-pred",
      toTaskId: "neg-succ",
      type: "FS",
      lag: 0,
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const options: StoragePayloadOptions = {
      tabId: "tab-1111111111-neglag",
      tasks: [PRED, SUCC],
      dependencies: [DEP],
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
      fileState: {
        fileName: "Negative Lag Test",
        chartId: "neg-lag-chart-001",
        lastSaved: "2025-01-01T10:00:00.000Z",
        isDirty: false,
      },
    };

    await injectAndNavigate(page, options, "Pred");
    await fitAndWaitForArrows(page);

    // Change lag from 0 to -1 via panel — this triggers cascade
    await openDependencyPanel(page, "Pred", "Succ");
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("-1");
    await lagInput.press("Tab");
    await closeDependencyPanel(page);

    // FS lag=-1 WD: anchor = predEnd+1 = Mon 01/13, then -1 WD = Fri 01/10
    const succStart = await getStartDate(page, "Succ");
    expect(succStart).toBe("01/10/2025");
    assertWorkingDay(succStart, "Succ start");
  });

  // -------------------------------------------------------------------------
  // #6 — Hidden tasks still participate in scheduling
  // -------------------------------------------------------------------------

  test("hidden tasks still participate in scheduling", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Chromium only");

    const TASK_A = {
      id: "hide-a",
      name: "Task A",
      startDate: "2025-01-06",
      endDate: "2025-01-10",
      duration: 5,
      progress: 0,
      color: "#3b82f6",
      order: 0,
      type: "task",
      metadata: {},
    };

    const TASK_B = {
      id: "hide-b",
      name: "Task B",
      startDate: "2025-01-13",
      endDate: "2025-01-17",
      duration: 5,
      progress: 0,
      color: "#3b82f6",
      order: 1,
      type: "task",
      metadata: {},
    };

    const TASK_C = {
      id: "hide-c",
      name: "Task C",
      startDate: "2025-01-20",
      endDate: "2025-01-24",
      duration: 5,
      progress: 0,
      color: "#3b82f6",
      order: 2,
      type: "task",
      metadata: {},
    };

    const DEP_AB = {
      id: "dep-ab",
      fromTaskId: "hide-a",
      toTaskId: "hide-b",
      type: "FS",
      lag: 0,
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const DEP_BC = {
      id: "dep-bc",
      fromTaskId: "hide-b",
      toTaskId: "hide-c",
      type: "FS",
      lag: 0,
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const options: StoragePayloadOptions = {
      tabId: "tab-1111111111-hidden",
      tasks: [TASK_A, TASK_B, TASK_C],
      dependencies: [DEP_AB, DEP_BC],
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
        hiddenTaskIds: ["hide-b"],
      },
      fileState: {
        fileName: "Hidden Tasks Test",
        chartId: "hidden-chart-001",
        lastSaved: "2025-01-01T10:00:00.000Z",
        isDirty: false,
      },
    };

    await injectAndNavigate(page, options, "Task A");

    // Task B should NOT be visible (it is hidden)
    await expect(
      page.getByLabel("Task spreadsheet").getByText("Task B")
    ).not.toBeVisible();

    // Press 'f' to fit and wait for arrows
    await page.keyboard.press("f");
    // Some arrows may be hidden with B hidden, but the dep A→B or B→C
    // may still render; wait a moment for layout to settle.
    await page.waitForTimeout(500);

    // Capture Task C's start date before the drag
    const cStartBefore = await getStartDate(page, "Task C");

    // Drag Task A right by ~150px to shift it forward
    await dragTaskBar(page, "Task A", 150);
    await page.waitForTimeout(500);

    // Task C's start should have changed — cascade went through hidden B
    const cStartAfter = await getStartDate(page, "Task C");
    expect(cStartAfter).not.toBe(cStartBefore);
  });

  // -------------------------------------------------------------------------
  // #9 — Calendar mode panel edits still work (WD OFF)
  // -------------------------------------------------------------------------

  test("calendar mode panel edits still work (WD OFF)", async ({ page }) => {
    const PRED = {
      id: "cal-pred",
      name: "Cal Pred",
      startDate: "2025-01-06",
      endDate: "2025-01-10",
      duration: 5,
      progress: 0,
      color: "#3b82f6",
      order: 0,
      type: "task",
      metadata: {},
    };

    const SUCC = {
      id: "cal-succ",
      name: "Cal Succ",
      startDate: "2025-01-13",
      endDate: "2025-01-17",
      duration: 5,
      progress: 0,
      color: "#10b981",
      order: 1,
      type: "task",
      metadata: {},
    };

    const DEP = {
      id: "cal-dep",
      fromTaskId: "cal-pred",
      toTaskId: "cal-succ",
      type: "FS",
      lag: 2,
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const options: StoragePayloadOptions = {
      tabId: "tab-1111111111-calmod",
      tasks: [PRED, SUCC],
      dependencies: [DEP],
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
        workingDaysMode: false,
      },
      fileState: {
        fileName: "Calendar Mode Test",
        chartId: "cal-mode-chart-001",
        lastSaved: "2025-01-01T10:00:00.000Z",
        isDirty: false,
      },
    };

    await injectAndNavigate(page, options, "Cal Pred");
    await fitAndWaitForArrows(page);

    // Open dependency panel and change lag from 2 to 5
    await openDependencyPanel(page, "Cal Pred", "Cal Succ");
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("5");
    await lagInput.press("Tab");
    await closeDependencyPanel(page);

    // FS lag=5 in calendar days: pred ends 01/10, anchor = 01/11, + 5 = 01/16
    const succStart = await getStartDate(page, "Cal Succ");
    expect(succStart).toBe("01/16/2025");
  });
});
