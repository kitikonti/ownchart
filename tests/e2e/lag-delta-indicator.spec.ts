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
    page.getByLabel("Task spreadsheet").getByText("Task A")
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
    // pixels-per-day scale, but the format is invariant.
    const text = await pill.locator("text").textContent();
    expect(text).toMatch(/^[\u22120-9\d]+d → [\u22120-9\d]+d$/);

    // Release — pill must disappear.
    await page.mouse.up();
    await expect(pill).toHaveCount(0, { timeout: 2_000 });
  });

  test("does NOT appear when auto-scheduling is ON", async ({ page }) => {
    await injectAndNavigate(page, {
      ...buildOptions(),
      chartState: { ...buildOptions().chartState, autoScheduling: true },
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
});
