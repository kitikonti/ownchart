/**
 * Regression test for the test04.ownchart bug reported by the user:
 * dragging a successor onto a non-working day (Saturday) doesn't refresh
 * the lag-delta pill, even though the working-day lag SHOULD change once
 * the visual position crosses into the weekend (because the dropped
 * position semantically snaps forward to the next working day).
 *
 * Repro:
 *   - alpha: Mon 2026-05-11 → Fri 2026-05-15
 *   - bravo: Fri 2026-05-22 → Fri 2026-05-29 (FS lag=4 working days)
 *   - WD mode ON, US holidays ON (so Mon 2026-05-25 is Memorial Day)
 *   - Auto-scheduling OFF
 *
 * User actions and expected pill behaviour:
 *   1. Drag bravo LEFT by 1 day (Fri → Thu) → pill shows "4d → 3d" ✓
 *      (this currently works because Thu is a working day)
 *   2. Drag bravo RIGHT by 1 day (Fri → Sat) → pill SHOULD show "4d → 5d"
 *      (currently broken: pill doesn't appear because Sat is not a
 *      working day, and the inverse counter rounds the count down)
 *
 * Root cause: lagFromAnchor in calculateInitialLagWD counts working days
 * inclusively from lagZero to target without snapping target forward to
 * the next working day. The forward direction (kthWorkingDayFrom) DOES
 * snap forward, so the two are not perfect inverses for non-working-day
 * targets — the pill ends up reading the same lag value as the previous
 * (working-day) frame, computeLagDeltaForPreview returns null, and the
 * pill stays hidden.
 */

import { test, expect, type Page } from "@playwright/test";
import {
  buildStoragePayload,
  type StoragePayloadOptions,
} from "./fixtures/sample-data";

// SVG drag relies on pixel-accurate boundingBox() — Chromium only.
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Chromium only — SVG drag coordinates"
);

// ─── Fixture mirrors test04.ownchart ────────────────────────────────────────
//
// May 2026 calendar (US holidays):
//   Mon 11 Tue 12 Wed 13 Thu 14 Fri 15  ← alpha
//   Sat 16 Sun 17                        ← weekend
//   Mon 18 Tue 19 Wed 20 Thu 21 Fri 22  ← bravo starts here
//   Sat 23 Sun 24                        ← weekend
//   Mon 25 (Memorial Day — US holiday)
//   Tue 26 Wed 27 Thu 28 Fri 29          ← bravo ends Fri 29

const TASK_ALPHA = {
  id: "wd-bug-alpha",
  name: "alpha",
  startDate: "2026-05-11",
  endDate: "2026-05-15",
  duration: 5,
  progress: 0,
  color: "#0F6CBD",
  order: 0,
  type: "task",
  metadata: {},
};

const TASK_BRAVO = {
  id: "wd-bug-bravo",
  name: "bravo",
  startDate: "2026-05-22",
  endDate: "2026-05-29",
  duration: 8,
  progress: 0,
  color: "#0F6CBD",
  order: 1,
  type: "task",
  metadata: {},
};

const DEP_ALPHA_BRAVO = {
  id: "wd-bug-dep",
  fromTaskId: "wd-bug-alpha",
  toTaskId: "wd-bug-bravo",
  type: "FS",
  // 4 working days: Mon 18 (1), Tue 19 (2), Wed 20 (3), Thu 21 (4) →
  // bravo anchored on the 5th wd from dayAfter alpha = Fri 22.
  lag: 4,
  createdAt: "2026-04-08T18:33:19.634Z",
};

function buildOptions(): StoragePayloadOptions {
  return {
    tabId: "tab-0000000001-wdpill",
    tasks: [TASK_ALPHA, TASK_BRAVO],
    dependencies: [DEP_ALPHA_BRAVO],
    chartState: {
      zoom: 1, // 25 px/day so 1-day drag = 25 px
      panOffset: { x: 0, y: 0 },
      showWeekends: true,
      showTodayMarker: false,
      showHolidays: false,
      showDependencies: true,
      showProgress: true,
      taskLabelPosition: "after",
      autoScheduling: false, // pill mode
      workingDaysMode: true,
      workingDaysConfig: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: true,
      },
      holidayRegion: "US",
    },
    fileState: {
      fileName: "test04",
      chartId: "test04-chart-001",
      lastSaved: "2026-04-08T19:42:42.758Z",
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

test.describe("Lag-delta pill on non-working-day target", () => {
  test("dragging bravo from Fri to Sat refreshes the pill (4d → 5d)", async ({
    page,
  }) => {
    await injectAndNavigate(page, buildOptions());

    const bravo = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("bravo")') })
      .first();
    const box = await bravo.boundingBox();
    expect(box, "bravo bar must be visible").not.toBeNull();
    const { x, y, width, height } = box!;
    const cx = x + width / 2;
    const cy = y + height / 2;

    // Find a pixel offset that produces a 1-day visual movement. With
    // zoom=1 and 25 px/day, +30 px is well past 1 day's threshold (the
    // drag handler rounds to the nearest day).
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 30, cy, { steps: 5 });

    // Pill MUST be visible because the working-day lag has changed:
    // bravo's effective position is now Sat 23 → snaps to Tue 26
    // (Mon 25 is Memorial Day) → 5 working days from dayAfter alpha
    // → lag = 5 (was 4).
    const pill = page.locator('[data-testid="lag-delta-indicator"]');
    await expect(pill).toBeVisible({ timeout: 2_000 });

    // Optional: assert the format. The exact numbers come from the
    // working-day count, not the calendar drag distance.
    const text = await pill.locator("text").textContent();
    expect(text).toMatch(/^4d → \d+d$/u);

    await page.mouse.up();
  });

  test("dragging bravo from Fri to Thu also refreshes the pill (4d → 3d, baseline)", async ({
    page,
  }) => {
    // Sanity check that the LEFT direction works — proves the test
    // infrastructure can detect a working-day → working-day delta.
    await injectAndNavigate(page, buildOptions());

    const bravo = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("bravo")') })
      .first();
    const box = await bravo.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width, height } = box!;
    const cx = x + width / 2;
    const cy = y + height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 30, cy, { steps: 5 });

    const pill = page.locator('[data-testid="lag-delta-indicator"]');
    await expect(pill).toBeVisible({ timeout: 2_000 });
    const text = await pill.locator("text").textContent();
    expect(text).toBe("4d → 3d");

    await page.mouse.up();
  });
});
