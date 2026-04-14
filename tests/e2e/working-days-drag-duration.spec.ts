/**
 * E2E test: working-days drag preserves calendar duration.
 *
 * Scenario (mirrors test02.ownchart):
 *   alpha: Mon Apr 6 – Fri Apr 10 (5 cal days, 5 working days)
 *   bravo: Mon Apr 13 – Fri Apr 17 (5 cal days, 5 working days)
 *   charlie: Mon Apr 20 – Fri Apr 24 (5 cal days, 5 working days)
 *   FS deps: alpha→bravo→charlie, lag=0
 *   autoScheduling=true, workingDaysMode=true, excludeSat+Sun
 *
 * Regression guard: dragging bravo right triggers auto-schedule snap-back.
 * With WD mode, tasks use Mon–Fri ranges so snap-back preserves the same
 * dates without weekend interference.
 */

import { test, expect } from "@playwright/test";
import { type StoragePayloadOptions } from "./fixtures/sample-data";
import {
  injectAndNavigate,
  fitAndWaitForArrows,
  getStartDate,
  getEndDate,
  getDuration,
  dragTaskBar,
} from "./fixtures/dependency-helpers";

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
  endDate: "2026-04-10",
  duration: 5,
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
  endDate: "2026-04-17",
  duration: 5,
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
  endDate: "2026-04-24",
  duration: 5,
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

async function setupAndFit(
  page: import("@playwright/test").Page
): Promise<void> {
  await injectAndNavigate(page, buildOptions(), "alpha");
  await fitAndWaitForArrows(page);
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

    // Sanity check: bravo starts Mon Apr 13, ends Fri Apr 17
    expect(initialStart).toContain("04/13/2026");
    expect(initialEnd).toContain("04/17/2026");

    // Drag bravo ~3 weeks to the right (large enough pixel delta)
    await dragTaskBar(page, "bravo", DRAG_PIXEL_DELTA);

    // Wait for auto-schedule snap-back to complete
    await page.waitForTimeout(500);

    // After snap-back, bravo should have the same dates as before
    const afterStart = await getStartDate(page, "bravo");
    const afterEnd = await getEndDate(page, "bravo");
    const afterDuration = await getDuration(page, "bravo");

    // The start date should snap back to the constrained position
    expect(afterStart).toContain("04/13/2026");

    // Regression: before the fix, the end date would shift because the
    // drag code shortened the calendar span to match the working-day
    // count, and snap-back used that shortened duration. Now pre-drag
    // durations are preserved.
    expect(afterEnd).toContain("04/17/2026");
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

    // Bravo should snap back to Mon-Fri (Apr 13-17) after each drag.
    // Before the fix, repeated drags would shrink it progressively.
    expect(afterStart).toContain("04/13/2026");
    expect(afterEnd).toContain("04/17/2026");
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
    expect(afterCharlieEnd).toContain("04/24/2026");
    expect(afterCharlieDuration).toBe(initialCharlieDuration);
  });
});
