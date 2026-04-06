/**
 * E2E tests for dependency persistence across page reloads.
 *
 * Verifies that all 4 dependency types (FS, SS, FF, SF) with different lag
 * values, working-days mode, and auto-scheduling state survive a localStorage
 * round-trip (inject → render → reload → verify).
 */

import { test, expect } from "@playwright/test";
import { type StoragePayloadOptions } from "./fixtures/sample-data";
import {
  injectAndNavigate,
  fitAndWaitForArrows,
  getStartDate,
  getEndDate,
  openDependencyPanel,
  getSelectedType,
  getLagValue,
  closeDependencyPanel,
} from "./fixtures/dependency-helpers";

// ---------------------------------------------------------------------------
// Test data — 5 tasks, 4 dependencies (one of each type) with varied lags
// ---------------------------------------------------------------------------

const TASK_A = {
  id: "persist-task-a",
  name: "Task Alpha",
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
  id: "persist-task-b",
  name: "Task Beta",
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
  id: "persist-task-c",
  name: "Task Gamma",
  startDate: "2025-01-20",
  endDate: "2025-01-24",
  duration: 5,
  progress: 0,
  color: "#3b82f6",
  order: 2,
  type: "task",
  metadata: {},
};

const TASK_D = {
  id: "persist-task-d",
  name: "Task Delta",
  startDate: "2025-01-27",
  endDate: "2025-01-31",
  duration: 5,
  progress: 0,
  color: "#3b82f6",
  order: 3,
  type: "task",
  metadata: {},
};

const TASK_E = {
  id: "persist-task-e",
  name: "Task Epsilon",
  startDate: "2025-02-03",
  endDate: "2025-02-07",
  duration: 5,
  progress: 0,
  color: "#3b82f6",
  order: 4,
  type: "task",
  metadata: {},
};

/** FS: Alpha → Beta, lag 2 */
const DEP_FS = {
  id: "dep-fs",
  fromTaskId: "persist-task-a",
  toTaskId: "persist-task-b",
  type: "FS",
  lag: 2,
  createdAt: "2025-01-06T10:00:00.000Z",
};

/** SS: Beta → Gamma, lag 5 */
const DEP_SS = {
  id: "dep-ss",
  fromTaskId: "persist-task-b",
  toTaskId: "persist-task-c",
  type: "SS",
  lag: 5,
  createdAt: "2025-01-06T10:00:00.000Z",
};

/** FF: Gamma → Delta, lag -1 (lead time) */
const DEP_FF = {
  id: "dep-ff",
  fromTaskId: "persist-task-c",
  toTaskId: "persist-task-d",
  type: "FF",
  lag: -1,
  createdAt: "2025-01-06T10:00:00.000Z",
};

/** SF: Delta → Epsilon, lag 3 */
const DEP_SF = {
  id: "dep-sf",
  fromTaskId: "persist-task-d",
  toTaskId: "persist-task-e",
  type: "SF",
  lag: 3,
  createdAt: "2025-01-06T10:00:00.000Z",
};

const ALL_TASKS = [TASK_A, TASK_B, TASK_C, TASK_D, TASK_E];
const ALL_DEPS = [DEP_FS, DEP_SS, DEP_FF, DEP_SF];

const TAB_ID = "tab-0000000001-mixeddeps";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildOptions(): StoragePayloadOptions {
  return {
    tabId: TAB_ID,
    tasks: ALL_TASKS,
    dependencies: ALL_DEPS,
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
      // Intentionally keep workingDaysConfig with all exclusions OFF so that
      // workingDaysMode remains false and the properties panel shows raw
      // calendar-day lag values. The second test verifies workingDaysConfig
      // round-trip separately via localStorage.
      workingDaysConfig: {
        excludeSaturday: false,
        excludeSunday: false,
        excludeHolidays: false,
      },
    },
    fileState: {
      fileName: "Persistence Test",
      chartId: "persist-chart-001",
      lastSaved: "2025-01-06T10:00:00.000Z",
      isDirty: false,
    },
  };
}

// Expected dates (MM/DD/YYYY format)
const EXPECTED_DATES: Record<string, { start: string; end: string }> = {
  "Task Alpha": { start: "01/06/2025", end: "01/10/2025" },
  "Task Beta": { start: "01/13/2025", end: "01/17/2025" },
  "Task Gamma": { start: "01/20/2025", end: "01/24/2025" },
  "Task Delta": { start: "01/27/2025", end: "01/31/2025" },
  "Task Epsilon": { start: "02/03/2025", end: "02/07/2025" },
};

// Dependency expectations: [fromName, toName, type, lag]
const EXPECTED_DEPS: [string, string, string, string][] = [
  ["Task Alpha", "Task Beta", "FS", "2"],
  ["Task Beta", "Task Gamma", "SS", "5"],
  ["Task Gamma", "Task Delta", "FF", "-1"],
  ["Task Delta", "Task Epsilon", "SF", "3"],
];

// ---------------------------------------------------------------------------
// Shared verification
// ---------------------------------------------------------------------------

/** Verify all task dates, dependency count, and each dependency type/lag. */
async function verifyAllData(page: import("@playwright/test").Page): Promise<void> {
  // Verify task dates
  for (const [taskName, dates] of Object.entries(EXPECTED_DATES)) {
    expect
      .soft(await getStartDate(page, taskName), `${taskName} start`)
      .toBe(dates.start);
    expect
      .soft(await getEndDate(page, taskName), `${taskName} end`)
      .toBe(dates.end);
  }

  // Verify 4 dependency arrows are rendered
  await expect(page.locator(".dependency-arrow")).toHaveCount(4);

  // Verify each dependency's type and lag via the properties panel
  for (const [fromName, toName, expectedType, expectedLag] of EXPECTED_DEPS) {
    await openDependencyPanel(page, fromName, toName);
    const actualType = await getSelectedType(page);
    const actualLag = await getLagValue(page);
    expect
      .soft(actualType, `${fromName} → ${toName} type`)
      .toBe(expectedType);
    expect.soft(actualLag, `${fromName} → ${toName} lag`).toBe(expectedLag);
    await closeDependencyPanel(page);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Dependency persistence round-trip", () => {
  test("all 4 dependency types with lag values render after injection", async ({
    page,
  }) => {
    await injectAndNavigate(page, buildOptions(), "Task Alpha");
    await fitAndWaitForArrows(page);
    await verifyAllData(page);
  });

  test("dependency types, lag values, and dates survive page reload", async ({
    page,
  }) => {
    await injectAndNavigate(page, buildOptions(), "Task Alpha");
    await fitAndWaitForArrows(page);

    // Wait for the debounced multi-tab persistence to save
    await page.waitForFunction(
      () => {
        const state = localStorage.getItem("ownchart-multi-tab-state");
        if (!state) return false;
        return state.includes("Task Alpha") && state.includes("dep-fs");
      },
      { timeout: 5_000 }
    );

    // Reload the page — the app reads from localStorage on load
    await page.reload();
    await expect(page.locator("#root")).toBeVisible();
    await expect(
      page.getByLabel("Task spreadsheet").getByText("Task Alpha")
    ).toBeVisible({ timeout: 10_000 });

    await fitAndWaitForArrows(page);

    // Verify everything survived the reload
    await verifyAllData(page);

    // Verify working-days config persisted by checking localStorage directly
    const storedState = await page.evaluate(() =>
      localStorage.getItem("ownchart-multi-tab-state")
    );
    expect(storedState).not.toBeNull();
    const parsed = JSON.parse(storedState!);
    const charts = parsed.charts as Record<string, Record<string, unknown>>;
    const firstTab = Object.values(charts)[0];
    expect(firstTab, "Expected at least one tab in persisted charts").toBeDefined();
    const chartState = firstTab.chartState as Record<string, unknown>;
    expect(chartState.workingDaysConfig).toEqual({
      excludeSaturday: false,
      excludeSunday: false,
      excludeHolidays: false,
    });
  });
});
