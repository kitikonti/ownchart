/**
 * E2E tests: working-days file format (checklist #23, #25).
 *
 * #23 — Storage payload carries version: 2
 * #25 — Opening a file with WD settings applies them (WD mode active from file)
 */

import { test, expect } from "@playwright/test";
import { injectAndNavigate, getStartDate } from "./fixtures/dependency-helpers";
import { activateAndEdit } from "./fixtures/helpers";
import { WD_CHART_STATE, type StoragePayloadOptions } from "./fixtures/sample-data";

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const TASK_A = {
  id: "task-1",
  name: "Task A",
  startDate: "2025-01-06",
  endDate: "2025-01-31",
  duration: 26,
  progress: 0,
  color: "#3b82f6",
  order: 0,
  type: "task" as const,
  metadata: {},
};

const TASK_B = {
  id: "task-2",
  name: "Task B",
  startDate: "2025-02-03",
  endDate: "2025-02-07",
  duration: 5,
  progress: 0,
  color: "#3b82f6",
  order: 1,
  type: "task" as const,
  metadata: {},
};

const DEP_AB = {
  id: "dep-1",
  fromTaskId: "task-1",
  toTaskId: "task-2",
  type: "FS",
  lag: 0,
  createdAt: "2025-01-06T10:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Working-days file format", () => {
  test("#23 — storage payload carries version: 2", async ({ page }) => {
    const options: StoragePayloadOptions = {
      tabId: "tab-1111111111-wdfile",
      tasks: [TASK_A, TASK_B],
      dependencies: [DEP_AB],
      chartState: WD_CHART_STATE,
    };

    await injectAndNavigate(page, options, "Task A");

    const raw = await page.evaluate(() =>
      localStorage.getItem("ownchart-multi-tab-state")
    );
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(2);
  });

  test("#25 — opening file with WD settings applies WD mode", async ({
    page,
  }) => {
    const options: StoragePayloadOptions = {
      tabId: "tab-2222222222-wdfile",
      tasks: [TASK_A],
      chartState: WD_CHART_STATE,
    };

    await injectAndNavigate(page, options, "Task A");

    // Change start date to Saturday 2025-01-11 — WD mode should snap to Monday
    await activateAndEdit(page, "Task A", "startDate", "2025-01-11", "Start Date");

    const startDate = await getStartDate(page, "Task A");
    expect(startDate).toBe("01/13/2025");
  });
});
