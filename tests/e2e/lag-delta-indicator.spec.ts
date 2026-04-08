/**
 * E2E spec for the live lag-delta indicator pill (#82 stage 4).
 *
 * Verifies that during a drag with auto-scheduling OFF, the floating
 * "Xd → Yd" pill appears anchored to the affected dependency arrow's
 * successor end, and disappears on mouseup.
 *
 * Mirrors the data setup pattern from dependency-scheduling.spec.ts so the
 * fixture stays consistent (Task A → Task B with FS lag=2). Drag is done
 * manually (not via the dragTaskBar helper) because the pill is only
 * visible BETWEEN mouse.move and mouse.up — the helper releases the mouse
 * eagerly and the pill would be cleared before any assertion could run.
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

// ─── Fixture (mirrors dependency-scheduling.spec.ts) ────────────────────────

const TASK_A = {
  id: "lagdelta-task-a",
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
  id: "lagdelta-task-b",
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

const DEP_A_B = {
  id: "dep-lagdelta-ab",
  fromTaskId: "lagdelta-task-a",
  toTaskId: "lagdelta-task-b",
  type: "FS",
  lag: 2,
  createdAt: "2025-01-06T10:00:00.000Z",
};

function buildOptions(): StoragePayloadOptions {
  return {
    tabId: "tab-0000000001-lagdelta",
    tasks: [TASK_A, TASK_B],
    dependencies: [DEP_A_B],
    chartState: {
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      showWeekends: true,
      showTodayMarker: false,
      showHolidays: false,
      showDependencies: true,
      showProgress: true,
      taskLabelPosition: "after",
      // The pill only appears in auto-update-lag mode.
      autoScheduling: false,
    },
    fileState: {
      fileName: "Lag Delta Test",
      chartId: "lag-delta-chart-001",
      lastSaved: "2025-01-06T10:00:00.000Z",
      isDirty: false,
    },
  };
}

async function injectAndNavigate(
  page: Page,
  options: StoragePayloadOptions,
  /** Visible task name used as the load-complete signal. */
  waitForTaskName: string = "Task A"
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
    page.getByLabel("Task spreadsheet").getByText(waitForTaskName)
  ).toBeVisible({ timeout: 10_000 });
  // Fit timeline so the dep arrow has predictable coordinates.
  await page.keyboard.press("f");
  await expect(page.locator(".dependency-arrow").first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Lag-delta indicator pill", () => {
  test("appears during drag with auto-scheduling OFF and disappears on mouseup", async ({
    page,
  }) => {
    await injectAndNavigate(page, buildOptions());

    // Locate the successor task bar (Task B). We drag IT, not Task A,
    // because the pill anchors on the first incoming dependency — and
    // for Task B that's the dep we just configured.
    const taskB = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Task B")') })
      .first();
    const box = await taskB.boundingBox();
    expect(box, "Task B bar must be visible").not.toBeNull();
    const { x, y, width, height } = box!;
    const cx = x + width / 2;
    const cy = y + height / 2;

    // Pill must NOT be present before the drag.
    await expect(page.locator('[data-testid="lag-delta-indicator"]')).toHaveCount(0);

    // Start the drag manually so we can assert mid-gesture.
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 100, cy, { steps: 10 });

    // The pill should now be visible. The selector matches the data-testid
    // we set in LagDeltaIndicator.tsx.
    const pill = page.locator('[data-testid="lag-delta-indicator"]');
    await expect(pill).toBeVisible({ timeout: 2_000 });
    // It should reference the configured dependency.
    await expect(pill).toHaveAttribute("data-dep-id", "dep-lagdelta-ab");
    // The text should match the Xd → Yd arrow form. We don't pin the
    // exact numbers because the calendar-day delta depends on the
    // pixels-per-day scale, but the format is invariant. The leading
    // `−?` matches the Unicode minus sign used by formatLagValue.
    const text = await pill.locator("text").textContent();
    expect(text).toMatch(/^−?\d+d → −?\d+d$/u);

    // Release — pill must disappear.
    await page.mouse.up();
    await expect(pill).toHaveCount(0, { timeout: 2_000 });
  });

  test("does NOT appear when auto-scheduling is ON", async ({ page }) => {
    const opts = buildOptions();
    await injectAndNavigate(page, {
      ...opts,
      chartState: { ...opts.chartState, autoScheduling: true },
    });

    const taskB = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Task B")') })
      .first();
    const box = await taskB.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width, height } = box!;
    const cx = x + width / 2;
    const cy = y + height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 100, cy, { steps: 10 });

    // Cascade-mode drag must not show the pill.
    await expect(
      page.locator('[data-testid="lag-delta-indicator"]')
    ).toHaveCount(0);

    await page.mouse.up();
  });

  // ─── Alt modifier inverts auto-scheduling for the gesture (#82 follow-up) ──
  //
  // The user expects Alt to be a *temporary inversion* of the auto-scheduling
  // toggle for one drag. The pill must follow the EFFECTIVE mode of the
  // gesture (which considers Alt), not the static store flag:
  //
  //   auto ON  + no Alt → cascade  → no pill
  //   auto ON  + Alt    → lag      → pill ✓
  //   auto OFF + no Alt → lag      → pill ✓
  //   auto OFF + Alt    → cascade  → no pill

  test("Alt+drag with auto-scheduling ON shows the pill (cascade is suppressed)", async ({
    page,
  }) => {
    const opts = buildOptions();
    await injectAndNavigate(page, {
      ...opts,
      chartState: { ...opts.chartState, autoScheduling: true },
    });

    const taskB = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Task B")') })
      .first();
    const box = await taskB.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width, height } = box!;
    const cx = x + width / 2;
    const cy = y + height / 2;

    await page.keyboard.down("Alt");
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 100, cy, { steps: 10 });

    // The gesture is in lag-update mode (Alt inverted ON to OFF), so the
    // pill MUST appear.
    const pill = page.locator('[data-testid="lag-delta-indicator"]');
    await expect(pill).toBeVisible({ timeout: 2_000 });

    await page.mouse.up();
    await page.keyboard.up("Alt");
  });

  test("pill appears the moment Alt is pressed mid-drag (no mouse movement needed)", async ({
    page,
  }) => {
    // Regression for F044: pressing Alt during a drag must refresh the pill
    // immediately, without waiting for the next mousemove. The previous
    // version of the indicator only updated inside the RAF tick driven by
    // mousemove, so a stationary user would see stale visibility until
    // they jiggled the mouse.
    const opts = buildOptions();
    await injectAndNavigate(page, {
      ...opts,
      chartState: { ...opts.chartState, autoScheduling: true },
    });

    const taskB = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Task B")') })
      .first();
    const box = await taskB.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width, height } = box!;
    const cx = x + width / 2;
    const cy = y + height / 2;

    // Start a drag with auto-sched ON and no Alt → no pill yet.
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 100, cy, { steps: 10 });
    await expect(
      page.locator('[data-testid="lag-delta-indicator"]')
    ).toHaveCount(0);

    // Press Alt without moving the mouse — pill MUST appear within the
    // keydown listener, not on a future mousemove.
    await page.keyboard.down("Alt");
    await expect(
      page.locator('[data-testid="lag-delta-indicator"]')
    ).toBeVisible({ timeout: 1_000 });

    // Release Alt without moving — pill MUST disappear immediately.
    await page.keyboard.up("Alt");
    await expect(
      page.locator('[data-testid="lag-delta-indicator"]')
    ).toHaveCount(0, { timeout: 1_000 });

    await page.mouse.up();
  });

  test("Alt+drag with auto-scheduling OFF hides the pill (cascade is forced)", async ({
    page,
  }) => {
    // Default fixture has autoScheduling: false.
    await injectAndNavigate(page, buildOptions());

    const taskB = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("Task B")') })
      .first();
    const box = await taskB.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width, height } = box!;
    const cx = x + width / 2;
    const cy = y + height / 2;

    await page.keyboard.down("Alt");
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 100, cy, { steps: 10 });

    // Alt inverts OFF → ON → cascade mode → pill must NOT show.
    await expect(
      page.locator('[data-testid="lag-delta-indicator"]')
    ).toHaveCount(0);

    await page.mouse.up();
    await page.keyboard.up("Alt");
  });
});

// ─── Non-working-day target regression ─────────────────────────────────────
//
// Reproduces the test04.ownchart bug: dragging a successor onto a non-
// working day (Saturday) used to leave the pill hidden because the
// inverse counter rounded the WD count down to the previous Friday's
// value. The fix snaps the target forward in lagFromAnchor so the
// inverse stays symmetric with kthWorkingDayFrom.
//
// May 2026 calendar (US holidays):
//   Mon 11 Tue 12 Wed 13 Thu 14 Fri 15  ← alpha
//   Sat 16 Sun 17                        ← weekend
//   Mon 18 Tue 19 Wed 20 Thu 21 Fri 22  ← bravo starts here
//   Sat 23 Sun 24                        ← weekend
//   Mon 25 (Memorial Day — US holiday)
//   Tue 26 Wed 27 Thu 28 Fri 29          ← bravo ends Fri 29

const TASK_ALPHA_MAY = {
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

const TASK_BRAVO_MAY = {
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

const DEP_ALPHA_BRAVO_MAY = {
  id: "wd-bug-dep",
  fromTaskId: "wd-bug-alpha",
  toTaskId: "wd-bug-bravo",
  type: "FS",
  // 4 working days: Mon 18 (1), Tue 19 (2), Wed 20 (3), Thu 21 (4) →
  // bravo anchored on the 5th wd from dayAfter alpha = Fri 22.
  lag: 4,
  createdAt: "2026-04-08T18:33:19.634Z",
};

function buildMayOptions(): StoragePayloadOptions {
  return {
    // Suffix must match TAB_ID_REGEX = /^tab-\d+-[a-z0-9]+$/ — no dashes
    // allowed in the trailing slug, otherwise getTabId() rejects the
    // injected sessionStorage value and the chart loads empty.
    tabId: "tab-0000000001-wdpillmay",
    tasks: [TASK_ALPHA_MAY, TASK_BRAVO_MAY],
    dependencies: [DEP_ALPHA_BRAVO_MAY],
    chartState: {
      zoom: 1, // 25 px/day so 1-day drag = 25 px
      panOffset: { x: 0, y: 0 },
      showWeekends: true,
      showTodayMarker: false,
      showHolidays: false,
      showDependencies: true,
      showProgress: true,
      taskLabelPosition: "after",
      autoScheduling: false,
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

test.describe("Lag-delta pill on non-working-day target", () => {
  test("dragging bravo from Fri to Sat refreshes the pill (4d → 5d)", async ({
    page,
  }) => {
    await injectAndNavigate(page, buildMayOptions(), "alpha");

    const bravo = page
      .locator(".task-bar")
      .filter({ has: page.locator('text:has-text("bravo")') })
      .first();
    const box = await bravo.boundingBox();
    expect(box, "bravo bar must be visible").not.toBeNull();
    const { x, y, width, height } = box!;
    const cx = x + width / 2;
    const cy = y + height / 2;

    // 30px right at zoom=1 (25 px/day) → 1-day visual movement.
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 30, cy, { steps: 5 });

    // Pill MUST be visible because the working-day lag has changed:
    // bravo's effective position is now Sat 23 → snaps forward to Tue 26
    // (Mon 25 is Memorial Day) → 5 working days from dayAfter alpha
    // → lag = 5 (was 4).
    const pill = page.locator('[data-testid="lag-delta-indicator"]');
    await expect(pill).toBeVisible({ timeout: 2_000 });

    const text = await pill.locator("text").textContent();
    expect(text).toMatch(/^4d → \d+d$/u);

    await page.mouse.up();
  });

  test("dragging bravo from Fri to Thu also refreshes the pill (4d → 3d, baseline)", async ({
    page,
  }) => {
    // Sanity check that the LEFT direction works — proves the test
    // infrastructure can detect a working-day → working-day delta.
    await injectAndNavigate(page, buildMayOptions(), "alpha");

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
