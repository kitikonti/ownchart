/**
 * Regression test for the test03.ownchart panel-edit bug reported by the
 * user against #82.
 *
 * Reproduces the EXACT user steps:
 *   1. Open the test03 fixture (alpha → bravo, FS lag=2, WD mode ON, US)
 *   2. Click the dependency arrow to open the panel
 *   3. Change the lag input from "2" to "3" and press Enter
 *
 * Expected after the edit:
 *   - bravo.startDate = Mon 2026-04-20 (3 working days from alpha.end)
 *   - panel still shows "3" (round-trip stable)
 *
 * Observed (the bug, before fix):
 *   - bravo.startDate is way past Mon 2026-04-20 (visible 5-day gap)
 *   - panel shows "3" (because the display path re-interprets the
 *     double-converted value back to ~3 working days)
 *
 * Root cause: the panel bridge in ChartCanvas.tsx still routes through
 * lagWorkingToCalendar / lagCalendarToWorking, which were written for
 * the pre-#82 "stored as calendar days, display as working days"
 * contract. The cascade now expects "stored as working days when WD
 * mode is on" (D1 in #79). The two contracts disagree, so the user's
 * working-day input gets converted to calendar days on store, then
 * re-interpreted as working days on cascade.
 *
 * This file builds the fixture data inline rather than loading the
 * .ownchart file, so the test runs without filesystem coupling.
 */

import { test, expect, type Page } from "@playwright/test";
import {
  buildStoragePayload,
  type StoragePayloadOptions,
} from "./fixtures/sample-data";
import {
  getStartDate,
  openDependencyPanel,
  getLagInput,
} from "./fixtures/dependency-helpers";

// SVG drag relies on pixel-accurate boundingBox() — Chromium only.
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Chromium only — SVG drag coordinates"
);

// ─── Fixture: alpha + bravo from test03.ownchart ────────────────────────────
//
// alpha: Wed 2026-04-08 → Tue 2026-04-14 (5 working days)
// bravo: Fri 2026-04-17 → Thu 2026-04-23 (5 working days)
// FS dep alpha→bravo, lag=2 (initial — gap = Wed 15, Thu 16 → 2 working days)
// WD mode ON, Sat+Sun excluded, US holidays excluded.

const TASK_ALPHA = {
  id: "test03-alpha",
  name: "alpha",
  startDate: "2026-04-08",
  endDate: "2026-04-14",
  duration: 7,
  progress: 0,
  color: "#0F6CBD",
  order: 0,
  type: "task",
  metadata: {},
};

const TASK_BRAVO = {
  id: "test03-bravo",
  name: "bravo",
  startDate: "2026-04-17",
  endDate: "2026-04-23",
  duration: 7,
  progress: 0,
  color: "#0F6CBD",
  order: 1,
  type: "task",
  metadata: {},
};

const DEP_ALPHA_BRAVO = {
  id: "test03-dep",
  fromTaskId: "test03-alpha",
  toTaskId: "test03-bravo",
  type: "FS",
  lag: 2,
  createdAt: "2026-04-08T18:33:19.634Z",
};

function buildOptions(): StoragePayloadOptions {
  return {
    // Use the exact same shape as dependency-scheduling.spec.ts which is
    // known to work. Only the task data differs.
    tabId: "tab-0000000001-test03bug",
    tasks: [TASK_ALPHA, TASK_BRAVO],
    dependencies: [DEP_ALPHA_BRAVO],
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
        excludeHolidays: true,
      },
      holidayRegion: "US",
    },
    fileState: {
      fileName: "test03",
      chartId: "test03-chart-001",
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
    page.getByLabel("Task spreadsheet").getByText("alpha")
  ).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("f");
  await expect(page.locator(".dependency-arrow").first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

// ─── The failing test ──────────────────────────────────────────────────────

test.describe("Bug repro: test03.ownchart panel-edit lag (#82)", () => {
  test("changing lag from 2 to 3 in WD mode moves bravo to Mon 2026-04-20 (currently broken)", async ({
    page,
  }) => {
    await injectAndNavigate(page, buildOptions());

    // Sanity: starting position. bravo starts Fri Apr 17 because the
    // initial calendar lag of 2 places it 2 calendar days after alpha's
    // end (Tue Apr 14 + 1 + 2 = Fri 17). The display unit is working
    // days (mode is on), and the gap Wed 15 → Thu 16 contains 2 working
    // days, so the panel correctly shows "2".
    expect(await getStartDate(page, "alpha")).toBe("04/08/2026");
    expect(await getStartDate(page, "bravo")).toBe("04/17/2026");

    // Open the dependency properties panel.
    await openDependencyPanel(page, "alpha", "bravo");
    const lagInput = getLagInput(page);
    await expect(lagInput).toHaveValue("2");

    // Change to "3" and press Enter (the user's exact action).
    await lagInput.fill("3");
    await lagInput.press("Enter");

    // The cascade should run via the WD-aware path. With FS lag=3wd from
    // alpha ending Tue Apr 14:
    //   dayAfterPred = Wed Apr 15
    //   3 working days from Wed = Wed (1), Thu (2), Fri (3) — successor
    //   anchored on the (lag+1)th working day = Mon Apr 20.
    // So bravo.startDate must be Mon 04/20/2026.
    //
    // CURRENT BUG: bravo lands further forward (around Wed 04/22) because
    // the panel bridge double-converts the input through
    // lagWorkingToCalendar BEFORE the cascade re-interprets the stored
    // value as working days.
    expect(await getStartDate(page, "bravo")).toBe("04/20/2026");

    // The panel must still show "3" (round-trip stable).
    await expect(lagInput).toHaveValue("3");
  });
});
