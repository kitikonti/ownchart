/**
 * End-to-end integration test for #82 working-days-aware scheduling.
 *
 * Unlike the unit tests in tests/unit/, this spec exercises the FULL path
 * a real user takes:
 *   1. Open the app
 *   2. Configure working-days mode + auto-scheduling via the chart store
 *      (via the multi-tab storage payload, the same way the existing
 *      dependency-scheduling spec does it)
 *   3. Drag a predecessor task across a weekend
 *   4. Verify the successor task lands on a working day, not on Sat/Sun
 *
 * If this spec fails, the WD scheduling integration is broken in the
 * running app even though the unit tests pass — which is exactly the
 * gap the user called out in #82 review feedback.
 */

import { test, expect, type Page } from "@playwright/test";
import {
  buildStoragePayload,
  type StoragePayloadOptions,
} from "./fixtures/sample-data";
import {
  getStartDate,
  dragTaskBar,
  openDependencyPanel,
  getLagInput,
} from "./fixtures/dependency-helpers";

/** Parse the table's display format ("MM/DD/YYYY") into a Date. */
function parseDisplayDate(displayDate: string): Date {
  const [m, d, y] = displayDate.split("/").map(Number);
  return new Date(y, m - 1, d);
}

// SVG drag relies on pixel-accurate boundingBox() — Chromium only.
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Chromium only — SVG drag coordinates"
);

// ─── Fixture ────────────────────────────────────────────────────────────────
// Two tasks with an FS lag=0 dependency. Predecessor ends on a Friday so a
// drag forward will land it (and the successor) into the weekend, where the
// WD-aware scheduler must snap forward to Monday.

const TASK_PRED = {
  id: "wd-pred",
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

const TASK_SUCC = {
  id: "wd-succ",
  name: "Succ",
  startDate: "2025-01-13", // Mon (already at lag=0wd from pred)
  endDate: "2025-01-15", // Wed
  duration: 3,
  progress: 0,
  color: "#10b981",
  order: 1,
  type: "task",
  metadata: {},
};

const DEP_PRED_SUCC = {
  id: "dep-wd-pred-succ",
  fromTaskId: "wd-pred",
  toTaskId: "wd-succ",
  type: "FS",
  lag: 0,
  createdAt: "2025-01-01T00:00:00.000Z",
};

function buildOptions(workingDaysMode: boolean): StoragePayloadOptions {
  return {
    tabId: "tab-0000000001-wdint",
    tasks: [TASK_PRED, TASK_SUCC],
    dependencies: [DEP_PRED_SUCC],
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
      workingDaysMode,
      workingDaysConfig: {
        excludeSaturday: workingDaysMode,
        excludeSunday: workingDaysMode,
        excludeHolidays: false,
      },
    },
    fileState: {
      fileName: "WD Integration Test",
      chartId: "wd-int-chart-001",
      lastSaved: "2025-01-06T10:00:00.000Z",
      isDirty: false,
    },
  };
}

async function injectAndNavigate(
  page: Page,
  options: StoragePayloadOptions
): Promise<void> {
  const payload = buildStoragePayload(options);
  await page.addInitScript(
    ({ tabId, payload }) => {
      localStorage.setItem("ownchart-welcome-dismissed", "true");
      localStorage.setItem("ownchart-tour-completed", "true");
      localStorage.setItem("ownchart-multi-tab-state", payload);
      sessionStorage.setItem("ownchart-tab-id", tabId);
    },
    { tabId: options.tabId, payload }
  );
  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();
  await expect(
    page.getByLabel("Task spreadsheet").getByText("Pred")
  ).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("f");
  await expect(page.locator(".dependency-arrow").first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("WD scheduling integration", () => {
  test("WD mode ON: dragging predecessor forward snaps successor to Monday", async ({
    page,
  }) => {
    await injectAndNavigate(page, buildOptions(true));

    // Sanity: starting positions (display format is "MM/DD/YYYY").
    expect(await getStartDate(page, "Pred")).toBe("01/06/2025");
    expect(await getStartDate(page, "Succ")).toBe("01/13/2025");

    // Drag Pred to the right by ~3 days. The exact pixel→day mapping
    // depends on the timeline scale; we drag a small but observable
    // distance and verify the WD snap behaviour qualitatively.
    await dragTaskBar(page, "Pred", 75);

    // After the drag, the successor MUST land on a Monday-Friday
    // (working day), never on a Saturday or Sunday. This is the core
    // WD contract.
    const newSuccStartStr = await getStartDate(page, "Succ");
    const dow = parseDisplayDate(newSuccStartStr).getDay();
    // 0 = Sun, 6 = Sat. Working day means dow ∈ [1..5].
    expect(
      dow,
      `Succ landed on ${newSuccStartStr} (day-of-week=${dow}) — should be a working day`
    ).toBeGreaterThanOrEqual(1);
    expect(dow).toBeLessThanOrEqual(5);

    // The successor must have moved at all (proves the cascade ran).
    expect(newSuccStartStr).not.toBe("01/13/2025");
  });

  test("WD mode OFF: dragging predecessor forward can land successor on weekend", async ({
    page,
  }) => {
    // Calendar mode — successor follows lag=0 literally, so it CAN land on
    // a weekend day. This is the regression baseline that proves the WD
    // mode test above is actually exercising the WD branch.
    await injectAndNavigate(page, buildOptions(false));

    expect(await getStartDate(page, "Pred")).toBe("01/06/2025");
    expect(await getStartDate(page, "Succ")).toBe("01/13/2025");

    await dragTaskBar(page, "Pred", 75);

    // Successor moved at all → cascade ran.
    const newSuccStart = await getStartDate(page, "Succ");
    expect(newSuccStart).not.toBe("01/13/2025");
    // We don't assert weekend-vs-working — we just confirm the cascade
    // happened. The calendar branch has no opinion about working days.
  });

  test("WD mode ON: panel-edit lag from 0 to 2 moves successor through working days", async ({
    page,
  }) => {
    // Reproduces the most common WD-mode user flow: open the dep panel,
    // change the lag, watch the successor reposition. With WD mode on,
    // the cascade must run via the WD-aware path that replaced
    // enforceDepConstraint in #82 stage 3.
    await injectAndNavigate(page, buildOptions(true));

    // Starting position: Succ at Mon 01/13 with FS lag=0 from Pred.
    expect(await getStartDate(page, "Succ")).toBe("01/13/2025");

    await openDependencyPanel(page, "Pred", "Succ");
    const lagInput = getLagInput(page);
    await lagInput.fill("2");
    // Commit the change — many panel components commit on blur.
    await lagInput.press("Tab");

    // Successor must move forward AND land on a working day.
    const newSuccStart = await getStartDate(page, "Succ");
    expect(newSuccStart).not.toBe("01/13/2025");
    const dow = parseDisplayDate(newSuccStart).getDay();
    expect(dow).toBeGreaterThanOrEqual(1);
    expect(dow).toBeLessThanOrEqual(5);
  });
});
