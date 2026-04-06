/**
 * E2E test: working-days drag preserves calendar duration.
 *
 * Reproduces a bug where dragging a task with auto-scheduling ON and
 * working-days mode ON causes the task's calendar duration to shrink.
 *
 * Scenario (mirrors test02.ownchart):
 *   alpha: Mon Apr 6 – Sun Apr 12 (7 cal days, 5 working days)
 *   bravo: Mon Apr 13 – Sun Apr 19 (7 cal days, 5 working days)
 *   charlie: Mon Apr 20 – Sun Apr 26 (7 cal days, 5 working days)
 *   FS deps: alpha→bravo→charlie, lag=0
 *   autoScheduling=true, workingDaysMode=true, excludeSat+Sun
 *
 * Regression guard: dragging bravo right triggers auto-schedule snap-back.
 * Before the fix, the task would end up Mon–Fri (5 cal days) instead of
 * Mon–Sun (7 cal days) because the drag shortened the calendar span to
 * match working-day count, and snap-back used that shortened duration.
 */

import { test, expect, type Page } from "@playwright/test";
import {
  buildStoragePayload,
  type StoragePayloadOptions,
} from "./fixtures/sample-data";
import { getCell } from "./fixtures/helpers";

// SVG drag relies on pixel-accurate boundingBox() — Chromium only.
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Chromium only — SVG drag coordinates"
);

// ---------------------------------------------------------------------------
// Test data — mirrors test02.ownchart
// ---------------------------------------------------------------------------

const ALPHA = {
  id: "wdrag-alpha",
  name: "alpha",
  startDate: "2026-04-06",
  endDate: "2026-04-12",
  duration: 7,
  progress: 0,
  color: "#0F6CBD",
  order: 0,
  type: "task",
  metadata: {},
};

const BRAVO = {
  id: "wdrag-bravo",
  name: "bravo",
  startDate: "2026-04-13",
  endDate: "2026-04-19",
  duration: 7,
  progress: 0,
  color: "#0F6CBD",
  order: 1,
  type: "task",
  metadata: {},
};

const CHARLIE = {
  id: "wdrag-charlie",
  name: "charlie",
  startDate: "2026-04-20",
  endDate: "2026-04-26",
  duration: 7,
  progress: 0,
  color: "#0F6CBD",
  order: 2,
  type: "task",
  metadata: {},
};

const DEP_ALPHA_BRAVO = {
  id: "wdrag-dep-ab",
  fromTaskId: "wdrag-alpha",
  toTaskId: "wdrag-bravo",
  type: "FS",
  lag: 0,
  createdAt: "2026-04-06T10:00:00.000Z",
};

const DEP_BRAVO_CHARLIE = {
  id: "wdrag-dep-bc",
  fromTaskId: "wdrag-bravo",
  toTaskId: "wdrag-charlie",
  type: "FS",
  lag: 0,
  createdAt: "2026-04-06T10:00:00.000Z",
};

const ALL_TASKS = [ALPHA, BRAVO, CHARLIE];
const ALL_DEPS = [DEP_ALPHA_BRAVO, DEP_BRAVO_CHARLIE];

/**
 * Pixel displacement for drag operations. Must be large enough to move the
 * task several weeks at the fit-to-view zoom level (~32 px/day) so that
 * auto-scheduling snap-back is triggered reliably.
 */
const DRAG_PIXEL_DELTA = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildOptions(): StoragePayloadOptions {
  return {
    tabId: "tab-0000000001-wdragtest",
    tasks: ALL_TASKS,
    dependencies: ALL_DEPS,
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
      fileName: "Working Days Drag Test",
      chartId: "wdrag-chart-001",
      lastSaved: "2026-04-06T10:00:00.000Z",
      isDirty: false,
    },
  };
}

async function injectAndNavigate(page: Page): Promise<void> {
  const options = buildOptions();
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
    page.getByLabel("Task spreadsheet").getByText("alpha")
  ).toBeVisible({ timeout: 10_000 });
}

async function setupAndFit(page: Page): Promise<void> {
  await injectAndNavigate(page);
  // Fit timeline so task bars are visible
  await page.keyboard.press("f");
  await expect(page.locator(".dependency-arrow").first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

/** Read a task's start date from the table. */
async function getStartDate(page: Page, taskName: string): Promise<string> {
  const cell = getCell(page, taskName, "startDate");
  const text = await cell.textContent();
  return text?.trim() ?? "";
}

/** Read a task's end date from the table. */
async function getEndDate(page: Page, taskName: string): Promise<string> {
  const cell = getCell(page, taskName, "endDate");
  const text = await cell.textContent();
  return text?.trim() ?? "";
}

/** Read a task's duration from the table. */
async function getDuration(page: Page, taskName: string): Promise<string> {
  const cell = getCell(page, taskName, "duration");
  const text = await cell.textContent();
  return text?.trim() ?? "";
}

/** Drag a task bar horizontally by a pixel offset. */
async function dragTaskBar(
  page: Page,
  taskName: string,
  pixelDelta: number
): Promise<void> {
  const taskBar = page
    .locator(".task-bar")
    .filter({
      has: page.locator(`text:has-text("${taskName}")`),
    })
    .first();

  const box = await taskBar.boundingBox();
  expect(box, `Task bar for "${taskName}" should be visible`).not.toBeNull();
  const { x, y, width, height } = box!;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + pixelDelta, centerY, { steps: 10 });
  await page.mouse.up();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Working-days drag duration preservation", () => {
  test("dragging bravo right and snapping back preserves original calendar duration", async ({
    page,
  }) => {
    await setupAndFit(page);

    // Record initial dates
    const initialStart = await getStartDate(page, "bravo");
    const initialEnd = await getEndDate(page, "bravo");
    const initialDuration = await getDuration(page, "bravo");

    // Sanity check: bravo starts Mon Apr 13, ends Sun Apr 19
    expect(initialStart).toContain("04/13/2026");
    expect(initialEnd).toContain("04/19/2026");

    // Drag bravo ~3 weeks to the right (large enough pixel delta)
    // At zoom=1 fit, we need enough pixels to move 21+ days.
    // Use a large delta to ensure significant displacement.
    await dragTaskBar(page, "bravo", DRAG_PIXEL_DELTA);

    // Wait for auto-schedule snap-back to complete
    await page.waitForTimeout(500);

    // After snap-back, bravo should have the same dates as before
    const afterStart = await getStartDate(page, "bravo");
    const afterEnd = await getEndDate(page, "bravo");
    const afterDuration = await getDuration(page, "bravo");

    // The start date should snap back to the constrained position
    expect(afterStart).toContain("04/13/2026");

    // Regression: before the fix, the end date would shift from Sunday
    // (Apr 19) to Friday or Saturday because the drag code shortened the
    // calendar span to match the working-day count, and snap-back used
    // that shortened duration. Now pre-drag durations are preserved.
    expect(afterEnd).toContain("04/19/2026");
    expect(afterDuration).toBe(initialDuration);
  });

  test("repeated drags do not progressively shrink bravo's duration", async ({
    page,
  }) => {
    await setupAndFit(page);

    // Perform multiple drag-and-snap-back cycles with large pixel deltas
    for (let i = 0; i < 3; i++) {
      await dragTaskBar(page, "bravo", DRAG_PIXEL_DELTA);
      await page.waitForTimeout(500);
    }

    const afterStart = await getStartDate(page, "bravo");
    const afterEnd = await getEndDate(page, "bravo");

    // Bravo should snap back to Mon-Sun (Apr 13-19) after each drag.
    // Before the fix, repeated drags would shrink it progressively.
    expect(afterStart).toContain("04/13/2026");
    expect(afterEnd).toContain("04/19/2026");
  });

  test("charlie also preserves its calendar duration after bravo drag cascade", async ({
    page,
  }) => {
    await setupAndFit(page);

    const initialCharlieDuration = await getDuration(page, "charlie");

    // Drag bravo right — auto-schedule should cascade to charlie too
    await dragTaskBar(page, "bravo", DRAG_PIXEL_DELTA);
    await page.waitForTimeout(500);

    const afterCharlieStart = await getStartDate(page, "charlie");
    const afterCharlieEnd = await getEndDate(page, "charlie");
    const afterCharlieDuration = await getDuration(page, "charlie");

    // Charlie should also snap back to original position
    expect(afterCharlieStart).toContain("04/20/2026");
    expect(afterCharlieEnd).toContain("04/26/2026");
    expect(afterCharlieDuration).toBe(initialCharlieDuration);
  });
});
