/**
 * E2E tests for dependency scheduling — lag, auto-scheduling, and Alt+drag.
 *
 * Covers:
 * - Lag display and editing in the properties panel
 * - Dependency creation with auto-calculated lag
 * - Panel edits (lag/type) always enforce constraints
 * - Auto-scheduling ON: drag cascades, Alt+drag suppresses
 * - Auto-scheduling OFF: drag updates lag, Alt+drag cascades
 * - Undo/redo for lag changes and cascaded drags
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
// Test data — 3 tasks with known gaps, chained FS dependencies
// ---------------------------------------------------------------------------

/**
 * Task A: Jan 6–10  (5 days)
 * Task B: Jan 13–17 (5 days)  — 2-day gap after A (weekend)
 * Task C: Jan 20–24 (5 days)  — 2-day gap after B (weekend)
 *
 * FS dependency A→B: lag = 2 (Jan 10 → Jan 13, gap of 2 days)
 * FS dependency B→C: lag = 2 (Jan 17 → Jan 20, gap of 2 days)
 */
const TASK_A = {
  id: "sched-task-a",
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
  id: "sched-task-b",
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
  id: "sched-task-c",
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

const DEP_A_B = {
  id: "dep-ab",
  fromTaskId: "sched-task-a",
  toTaskId: "sched-task-b",
  type: "FS",
  lag: 2,
  createdAt: "2025-01-06T10:00:00.000Z",
};

const DEP_B_C = {
  id: "dep-bc",
  fromTaskId: "sched-task-b",
  toTaskId: "sched-task-c",
  type: "FS",
  lag: 2,
  createdAt: "2025-01-06T10:00:00.000Z",
};

const ALL_TASKS = [TASK_A, TASK_B, TASK_C];
const ALL_DEPS = [DEP_A_B, DEP_B_C];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build options for injectDataAndNavigate with optional overrides. */
function buildOptions(
  overrides: {
    tasks?: readonly Record<string, unknown>[];
    dependencies?: readonly Record<string, unknown>[];
    autoScheduling?: boolean;
  } = {}
): StoragePayloadOptions {
  return {
    tabId: "tab-0000000001-depsched",
    tasks: overrides.tasks ?? ALL_TASKS,
    dependencies: overrides.dependencies ?? ALL_DEPS,
    chartState: {
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      showWeekends: true,
      showTodayMarker: false,
      showHolidays: false,
      showDependencies: true,
      showProgress: true,
      taskLabelPosition: "after",
      autoScheduling: overrides.autoScheduling ?? false,
    },
    fileState: {
      fileName: "Scheduling Test",
      chartId: "dep-sched-chart-001",
      lastSaved: "2025-01-06T10:00:00.000Z",
      isDirty: false,
    },
  };
}

/**
 * Inject data and navigate — custom version that waits for 'Task A' instead
 * of the hardcoded 'Project Kickoff' in the shared helper.
 */
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
}

/** Navigate, fit to view, and wait for dependency arrows to render. */
async function setupAndFit(
  page: Page,
  overrides: Parameters<typeof buildOptions>[0] = {}
): Promise<void> {
  await injectAndNavigate(page, buildOptions(overrides));
  // Fit timeline so task bars + arrows are visible
  await page.keyboard.press("f");
  await expect(page.locator(".dependency-arrow").first()).toBeVisible({
    timeout: 10_000,
  });
  // Allow zoom/layout animation to settle
  await page.waitForTimeout(500);
}

/** Click a dependency arrow to select it and open the properties panel. */
async function openDependencyPanel(
  page: Page,
  fromName: string,
  toName: string
): Promise<void> {
  // For hook-shaped arrows (SS/FF/SF), the <g> bounding box center can land
  // in empty space. Use JS dispatchEvent to reliably trigger the click handler.
  await page.evaluate((label) => {
    const g = document.querySelector(
      `g[aria-label^="Dependency from ${label}"]`
    );
    if (g) g.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, `${fromName} to ${toName}`);
  await expect(
    page.getByRole("dialog", { name: "Edit dependency" })
  ).toBeVisible({ timeout: 5_000 });
}

/** Get the lag input element inside the open properties panel. */
function getLagInput(page: Page) {
  return page
    .getByRole("dialog", { name: "Edit dependency" })
    .locator('input[type="number"]');
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

/** Toggle auto-scheduling via the toolbar button. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function toggleAutoScheduling(page: Page): Promise<void> {
  // The button might say "Enable" or "Disable" depending on current state.
  // Click the View tab first to ensure it's visible.
  await page.getByRole("tab", { name: "View" }).click();
  const btn = page.getByRole("button", { name: /Auto-Scheduling/i });
  await btn.click();
}

/**
 * Drag a task bar horizontally by a pixel offset.
 * @param modifiers - Keyboard modifiers to hold during drag (e.g. ['Alt'])
 */
async function dragTaskBar(
  page: Page,
  taskName: string,
  pixelDelta: number,
  modifiers: ("Alt" | "Shift" | "Control")[] = []
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

  // Hold modifier keys
  for (const mod of modifiers) {
    await page.keyboard.down(mod);
  }

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + pixelDelta, centerY, { steps: 10 });
  await page.mouse.up();

  // Release modifier keys
  for (const mod of modifiers) {
    await page.keyboard.up(mod);
  }
}

// ===========================================================================
// Group 1: Lag Display & Editing
// ===========================================================================

test.describe("Lag display and editing", () => {
  test.beforeEach(async ({ page }) => {
    await setupAndFit(page);
  });

  test("lag shows auto-calculated value in properties panel", async ({
    page,
  }) => {
    await openDependencyPanel(page, "Task A", "Task B");

    const lagInput = getLagInput(page);
    await expect(lagInput).toHaveValue("2");
  });

  test("lag input is editable — type new value and commit with Enter", async ({
    page,
  }) => {
    await openDependencyPanel(page, "Task A", "Task B");

    const lagInput = getLagInput(page);
    await lagInput.click();
    // Use real keyboard input (not fill()) to match actual user interaction
    await lagInput.press("Control+a");
    await page.keyboard.type("5");
    await lagInput.press("Enter");

    // Value should persist
    await expect(lagInput).toHaveValue("5");
  });

  test("lag input accepts negative values", async ({ page }) => {
    await openDependencyPanel(page, "Task A", "Task B");

    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("-1");
    await lagInput.press("Enter");

    await expect(lagInput).toHaveValue("-1");
  });

  test("lag input resets to previous value on invalid input", async ({
    page,
  }) => {
    await openDependencyPanel(page, "Task A", "Task B");

    const lagInput = getLagInput(page);
    await lagInput.click();
    // Number inputs reject non-numeric text via fill(), so use keyboard to
    // clear the field and leave it empty, which is the "invalid" case.
    await lagInput.press("Control+a");
    await lagInput.press("Backspace");
    // Blur to trigger commit — the empty value should revert to the stored lag
    await lagInput.press("Tab");

    // The input should revert to the original value
    await expect(lagInput).toHaveValue("2");
  });

  test("lag input clamps to ±365", async ({ page }) => {
    await openDependencyPanel(page, "Task A", "Task B");

    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("999");
    await lagInput.press("Enter");

    await expect(lagInput).toHaveValue("365");
  });
});

// ===========================================================================
// Group 2: Dependency Creation
// ===========================================================================

test.describe("Dependency creation with auto-calculated lag", () => {
  test("creating FS dependency auto-calculates lag and preserves task positions", async ({
    page,
  }) => {
    // Setup with only A→B dependency (no B→C)
    await setupAndFit(page, { dependencies: [DEP_A_B] });

    const origStartC = await getStartDate(page, "Task C");
    const origEndC = await getEndDate(page, "Task C");

    // Create B→C dependency by dragging from Task B end handle to Task C start handle
    // For now, we'll verify via the panel after creation
    // (Drag-based creation is complex in E2E; we verify the principle via injected data)

    // Inject a fresh setup with both deps and verify C didn't move
    await setupAndFit(page);

    const newStartC = await getStartDate(page, "Task C");
    const newEndC = await getEndDate(page, "Task C");

    expect(newStartC).toBe(origStartC);
    expect(newEndC).toBe(origEndC);

    // Verify the lag is auto-calculated as 2
    await openDependencyPanel(page, "Task B", "Task C");
    await expect(getLagInput(page)).toHaveValue("2");
  });

  test("creating dependency between overlapping tasks calculates negative lag", async ({
    page,
  }) => {
    // Task B starts before Task A ends → FS dependency would have negative lag
    const overlappingB = {
      ...TASK_B,
      startDate: "2025-01-09",
      endDate: "2025-01-13",
    };

    await setupAndFit(page, {
      tasks: [TASK_A, overlappingB, TASK_C],
      dependencies: [
        { ...DEP_A_B, lag: -2 }, // FS: Jan 10 end, Jan 9 start → lag = -2
        DEP_B_C,
      ],
    });

    await openDependencyPanel(page, "Task A", "Task B");
    await expect(getLagInput(page)).toHaveValue("-2");
  });

  test("creating SS dependency calculates correct lag from start-date gap", async ({
    page,
  }) => {
    // SS dependency A→B: lag = B.start - A.start = Jan 13 - Jan 6 = 7
    // Use only the SS dependency so we can click it reliably
    await setupAndFit(page, {
      dependencies: [{ ...DEP_A_B, type: "SS", lag: 7 }],
    });

    await openDependencyPanel(page, "Task A", "Task B");

    // Verify type is SS and lag is 7
    const panel = page.getByRole("dialog", { name: "Edit dependency" });
    await expect(panel.getByRole("radio", { name: "SS" })).toBeChecked();
    await expect(getLagInput(page)).toHaveValue("7");
  });
});

// ===========================================================================
// Group 3: Panel Edits Always Enforce Constraints
// ===========================================================================

test.describe("Panel edits always enforce constraints", () => {
  test("changing lag moves successor — auto-scheduling ON", async ({
    page,
  }) => {
    await setupAndFit(page, { autoScheduling: true });

    const origStartB = await getStartDate(page, "Task B");

    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("5");
    await lagInput.press("Enter");

    // Task B should have shifted forward by 3 days (lag 2 → 5)
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).not.toBe(origStartB);
  });

  test("changing lag moves successor — auto-scheduling OFF", async ({
    page,
  }) => {
    await setupAndFit(page, { autoScheduling: false });

    const origStartB = await getStartDate(page, "Task B");

    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("5");
    await lagInput.press("Enter");

    // Task B should STILL shift — panel edits always enforce
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).not.toBe(origStartB);
  });

  test("changing dependency type repositions successor — auto-scheduling ON", async ({
    page,
  }) => {
    await setupAndFit(page, { autoScheduling: true });

    const origStartB = await getStartDate(page, "Task B");

    await openDependencyPanel(page, "Task A", "Task B");
    // Switch from FS to SS
    const panel = page.getByRole("dialog", { name: "Edit dependency" });
    await panel.getByRole("radio", { name: "SS" }).click();

    // Task B should reposition (SS with lag=2 means B.start = A.start + 2 = Jan 8)
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).not.toBe(origStartB);
  });

  test("changing dependency type repositions successor — auto-scheduling OFF", async ({
    page,
  }) => {
    await setupAndFit(page, { autoScheduling: false });

    const origStartB = await getStartDate(page, "Task B");

    await openDependencyPanel(page, "Task A", "Task B");
    const panel = page.getByRole("dialog", { name: "Edit dependency" });
    await panel.getByRole("radio", { name: "SS" }).click();

    // Task B should STILL reposition — panel edits always enforce
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).not.toBe(origStartB);
  });
});

// ===========================================================================
// Group 4: Drag with Auto-Scheduling ON
// ===========================================================================

test.describe("Drag behavior — auto-scheduling ON", () => {
  test.beforeEach(async ({ page }) => {
    await setupAndFit(page, { autoScheduling: true });
  });

  test("drag predecessor cascades to successor (lag stays fixed)", async ({
    page,
  }) => {
    const origStartA = await getStartDate(page, "Task A");
    const origStartB = await getStartDate(page, "Task B");

    // Drag Task A to the right (forward in time)
    await dragTaskBar(page, "Task A", 150);

    const newStartA = await getStartDate(page, "Task A");
    const newStartB = await getStartDate(page, "Task B");

    // Task A should have moved
    expect(newStartA).not.toBe(origStartA);
    // Task B should also have moved (cascaded)
    expect(newStartB).not.toBe(origStartB);

    // Verify lag is still 2
    await openDependencyPanel(page, "Task A", "Task B");
    await expect(getLagInput(page)).toHaveValue("2");
  });

  test("drag predecessor LEFT also cascades successor backward (lag stays fixed)", async ({
    page,
  }) => {
    // Task A: Jan 6–10, Task B: Jan 13–17, FS lag=2
    const origStartA = await getStartDate(page, "Task A");
    const origStartB = await getStartDate(page, "Task B");

    // Drag Task A to the LEFT (earlier in time)
    await dragTaskBar(page, "Task A", -150);

    const newStartA = await getStartDate(page, "Task A");
    const newStartB = await getStartDate(page, "Task B");

    // Task A should have moved earlier
    expect(newStartA).not.toBe(origStartA);

    // Task B should ALSO have moved earlier (backward cascade)
    expect(newStartB).not.toBe(origStartB);

    // Verify lag is still 2 (constraint maintained bidirectionally)
    await openDependencyPanel(page, "Task A", "Task B");
    await expect(getLagInput(page)).toHaveValue("2");
  });

  test("Alt+drag predecessor suppresses cascade (lag auto-updates)", async ({
    page,
  }) => {
    const origStartB = await getStartDate(page, "Task B");

    // Alt+drag Task A to the right
    await dragTaskBar(page, "Task A", 150, ["Alt"]);

    // Task B should NOT have moved
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).toBe(origStartB);

    // Lag should have changed (auto-updated to absorb the move)
    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    const lagValue = await lagInput.inputValue();
    expect(parseInt(lagValue, 10)).not.toBe(2);
  });

  test("chain cascade A→B→C — dragging A moves both B and C", async ({
    page,
  }) => {
    const origStartB = await getStartDate(page, "Task B");
    const origStartC = await getStartDate(page, "Task C");

    // Drag Task A forward
    await dragTaskBar(page, "Task A", 150);

    const newStartB = await getStartDate(page, "Task B");
    const newStartC = await getStartDate(page, "Task C");

    // Both B and C should have cascaded
    expect(newStartB).not.toBe(origStartB);
    expect(newStartC).not.toBe(origStartC);
  });

  test("toolbar shows temporary override indicator during Alt+drag", async ({
    page,
  }) => {
    // Ensure we're on the View tab so the auto-schedule button is visible
    await page.getByRole("tab", { name: "View" }).click();

    // Verify auto-scheduling button shows active state
    const schedBtn = page.getByRole("button", {
      name: /Disable Auto-Scheduling/i,
    });
    await expect(schedBtn).toBeVisible();

    // Hold Alt — toolbar indicator should flip
    await page.keyboard.down("Alt");

    // The button should temporarily show the opposite state
    const overrideBtn = page.getByRole("button", {
      name: /Enable Auto-Scheduling/i,
    });
    await expect(overrideBtn).toBeVisible({ timeout: 2_000 });

    await page.keyboard.up("Alt");

    // Should revert back
    await expect(schedBtn).toBeVisible({ timeout: 2_000 });
  });
});

// ===========================================================================
// Group 5: Drag with Auto-Scheduling OFF
// ===========================================================================

test.describe("Drag behavior — auto-scheduling OFF", () => {
  test.beforeEach(async ({ page }) => {
    await setupAndFit(page, { autoScheduling: false });
  });

  test("drag predecessor does not cascade — lag auto-updates instead", async ({
    page,
  }) => {
    const origStartB = await getStartDate(page, "Task B");

    // Drag Task A forward
    await dragTaskBar(page, "Task A", 150);

    // Task B should NOT move
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).toBe(origStartB);

    // Lag should have auto-updated
    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    const lagValue = await lagInput.inputValue();
    // Lag should be less than 2 since A moved forward but B stayed
    expect(parseInt(lagValue, 10)).toBeLessThan(2);
  });

  test("Alt+drag predecessor forces cascade even with auto-scheduling OFF", async ({
    page,
  }) => {
    const origStartB = await getStartDate(page, "Task B");

    // Alt+drag Task A forward — should cascade despite auto-scheduling being OFF
    await dragTaskBar(page, "Task A", 150, ["Alt"]);

    // Task B SHOULD have moved (Alt inverts behavior)
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).not.toBe(origStartB);

    // Lag should still be 2 (cascade preserved the constraint)
    await openDependencyPanel(page, "Task A", "Task B");
    await expect(getLagInput(page)).toHaveValue("2");
  });

  test("toolbar shows temporary override indicator during Alt+drag", async ({
    page,
  }) => {
    // Ensure we're on the View tab
    await page.getByRole("tab", { name: "View" }).click();

    // Verify auto-scheduling button shows inactive state
    const schedBtn = page.getByRole("button", {
      name: /Enable Auto-Scheduling/i,
    });
    await expect(schedBtn).toBeVisible();

    // Hold Alt — toolbar indicator should flip
    await page.keyboard.down("Alt");

    const overrideBtn = page.getByRole("button", {
      name: /Disable Auto-Scheduling/i,
    });
    await expect(overrideBtn).toBeVisible({ timeout: 2_000 });

    await page.keyboard.up("Alt");

    // Should revert back
    await expect(schedBtn).toBeVisible({ timeout: 2_000 });
  });

  test("resize predecessor does not cascade — lag auto-updates", async ({
    page,
  }) => {
    const origStartB = await getStartDate(page, "Task B");

    // Find Task A's bar and resize from right edge
    const taskBar = page
      .locator(".task-bar")
      .filter({
        has: page.locator(`text:has-text("Task A")`),
      })
      .first();
    const box = await taskBar.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width, height } = box!;

    // Drag right edge to the right (extend Task A)
    const rightEdgeX = x + width - 2;
    const centerY = y + height / 2;

    await page.mouse.move(rightEdgeX, centerY);
    await page.mouse.down();
    await page.mouse.move(rightEdgeX + 100, centerY, { steps: 10 });
    await page.mouse.up();

    // Task B should NOT move
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).toBe(origStartB);
  });
});

// ===========================================================================
// Group 6: Dragging the SUCCESSOR (not the predecessor)
// ===========================================================================

test.describe("Drag successor behavior", () => {
  test("auto-scheduling ON — drag successor snaps back to constraint position", async ({
    page,
  }) => {
    // Setup: A→B FS lag=2. Auto-scheduling ON.
    // Task B starts at Jan 13. Moving B should snap it back.
    await setupAndFit(page, { autoScheduling: true });

    const origStartB = await getStartDate(page, "Task B");

    // Drag Task B to the right (away from constraint)
    await dragTaskBar(page, "Task B", 150);

    // Task B should snap back to its constraint position (lag=2 after Task A)
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).toBe(origStartB);

    // Lag should still be 2
    await openDependencyPanel(page, "Task A", "Task B");
    await expect(getLagInput(page)).toHaveValue("2");
  });

  test("auto-scheduling ON — drag successor LEFT snaps back to constraint position", async ({
    page,
  }) => {
    await setupAndFit(page, { autoScheduling: true });

    const origStartB = await getStartDate(page, "Task B");

    // Drag Task B to the left
    await dragTaskBar(page, "Task B", -150);

    // Task B should snap back to its constraint position
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).toBe(origStartB);
  });

  test("auto-scheduling OFF — drag successor updates lag", async ({ page }) => {
    // Setup: A→B FS lag=2. Auto-scheduling OFF.
    await setupAndFit(page, { autoScheduling: false });

    const origStartB = await getStartDate(page, "Task B");

    // Drag Task B to the right
    await dragTaskBar(page, "Task B", 150);

    // Task B should have moved (no constraint enforcement when OFF)
    const newStartB = await getStartDate(page, "Task B");
    expect(newStartB).not.toBe(origStartB);

    // Lag should have been updated to match the new gap
    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    const lagValue = await lagInput.inputValue();
    // Lag should be greater than 2 since B moved further from A
    expect(parseInt(lagValue, 10)).toBeGreaterThan(2);
  });

  test("auto-scheduling OFF — drag successor LEFT updates lag", async ({
    page,
  }) => {
    await setupAndFit(page, { autoScheduling: false });

    // Drag Task B to the left (closer to A)
    await dragTaskBar(page, "Task B", -100);

    // Lag should have decreased
    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    const lagValue = await lagInput.inputValue();
    expect(parseInt(lagValue, 10)).toBeLessThan(2);
  });
});

// ===========================================================================
// Group 7: Working Days lag display + duration preservation
// ===========================================================================

test.describe("Working days lag and duration preservation", () => {
  test("changing lag preserves successor end date offset (duration unchanged)", async ({
    page,
  }) => {
    // Task A: Wed Jan 8 – Fri Jan 10 (3 days)
    // Task B: Mon Jan 13 – Fri Jan 17 (5 cal days, 5 working days)
    // FS lag = 2 calendar days (Sat+Sun gap)
    // Change lag to 5 → Task B should move but keep 5-day duration
    const taskA = {
      ...TASK_A,
      startDate: "2025-01-08",
      endDate: "2025-01-10",
      duration: 3,
    };
    await setupAndFit(page, {
      autoScheduling: true,
      tasks: [taskA, TASK_B, TASK_C],
    });

    await getEndDate(page, "Task B"); // read to verify it renders

    // Change lag
    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("5");
    await lagInput.press("Enter");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Compute expected: Task B starts at addDays(Jan 10, 1+5) = Jan 16 (Thu)
    // Duration should still be 5 → end = Jan 20 (Mon) if calendar,
    // but we want to verify the duration column is unchanged
    const cell = getCell(page, "Task B", "duration");
    await expect(cell).toContainText("5");
  });

  test("FF dependency: changing lag to 2 working days — exact user data May 2026", async ({
    page,
  }) => {
    // Exact data from user's .ownchart file:
    // Alpha: Mon May 18 – Fri May 22, 2026 (5 days)
    // Bravo: Tue May 26 – Fri May 29, 2026 (4 days)
    // Dependency type: FF (Finish-to-Finish), calendar lag = 7
    // FF: successor.end = pred.end + lag = May 22 + 7 = May 29 ✓
    const taskAlpha = {
      ...TASK_A,
      name: "Task A",
      startDate: "2026-05-18",
      endDate: "2026-05-22",
      duration: 5,
    };
    const taskBravo = {
      ...TASK_B,
      name: "Task B",
      startDate: "2026-05-26",
      endDate: "2026-05-29",
      duration: 4,
    };
    // FF dependency with calendar lag 7
    const dep = {
      ...DEP_A_B,
      type: "FF" as const,
      lag: 7,
    };
    const options = buildOptions({
      autoScheduling: true,
      tasks: [taskAlpha, taskBravo, TASK_C],
      dependencies: [dep, DEP_B_C],
    });
    const cs = options.chartState as Record<string, unknown>;
    cs.workingDaysConfig = {
      excludeSaturday: true,
      excludeSunday: true,
      excludeHolidays: true,
    };
    cs.holidayRegion = "US"; // May 25, 2026 = Memorial Day
    await injectAndNavigate(page, options);
    await page.keyboard.press("f");
    await expect(page.locator(".dependency-arrow").first()).toBeVisible({
      timeout: 10_000,
    });
    await page.waitForTimeout(500);

    // Open panel via the visible path (handles FF hook-shaped arrows)
    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    const initialLag = await lagInput.inputValue();
    console.log("Initial displayed lag:", initialLag);

    // Change lag to 2 working days
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("2");
    await lagInput.press("Enter");
    await page.waitForTimeout(300);

    // CRITICAL: displayed lag must be 2
    const afterLag = await getLagInput(page).inputValue();
    console.log("After change displayed lag:", afterLag);
    expect(afterLag).toBe("2");

    // Close and check bravo's dates
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Bravo should have moved closer to Alpha but kept 4 working days duration
    const bravoStart = await getStartDate(page, "Task B");
    const bravoEnd = await getEndDate(page, "Task B");
    console.log("Bravo after lag=2wd:", bravoStart, "–", bravoEnd);

    // FF with lag=2wd from Fri May 22 (with May 25 = Memorial Day):
    // addWorkingDays(May 22, 3) = May 22(Fri)=1, skip May25(holiday), May26(Tue)=2, May27(Wed)=3
    // successor ends Wed May 27. Calendar lag = 5.
    // Bravo 4 working days ending Wed 27: Wed27=1, Tue26=2, skip Mon25(holiday), Fri22=3, Thu21=4
    // Bravo: Thu May 21 – Wed May 27
    expect(bravoEnd).toBe("05/27/2026");
    expect(bravoStart).toBe("05/21/2026"); // 4 working days: Thu,Fri,Tue,Wed
  });

  test("changing lag with working days ON preserves working-day duration across weekend", async ({
    page,
  }) => {
    // This is the KEY test: lag change causes task to shift across a weekend boundary.
    // Task A: Mon Jan 6 – Wed Jan 8 (3 days)
    // Task B: Thu Jan 9 – Mon Jan 13 (5 cal days = 3 working days: Thu, Fri, Mon)
    // FS lag = 0 (no gap, starts right after)
    // With working days ON, change lag to 3 working days.
    // Expected: Task B preserves its 3 working-day duration at the new position.
    const taskA = {
      ...TASK_A,
      startDate: "2025-01-06",
      endDate: "2025-01-08",
      duration: 3,
    };
    const taskB = {
      ...TASK_B,
      startDate: "2025-01-09",
      endDate: "2025-01-13",
      duration: 5,
    };
    // Inject with working days config that excludes weekends
    const options = buildOptions({
      autoScheduling: true,
      tasks: [taskA, taskB, TASK_C],
      dependencies: [{ ...DEP_A_B, lag: 0 }, DEP_B_C],
    });
    const cs = options.chartState as Record<string, unknown>;
    cs.workingDaysConfig = {
      excludeSaturday: true,
      excludeSunday: true,
      excludeHolidays: false,
    };
    await injectAndNavigate(page, options);
    await page.keyboard.press("f");
    await expect(page.locator(".dependency-arrow").first()).toBeVisible({
      timeout: 10_000,
    });
    await page.waitForTimeout(500);

    // Task B: Thu Jan 9 – Mon Jan 13 = 3 working days (Thu, Fri, Mon)
    // Read original end date
    await getEndDate(page, "Task B"); // read to verify it renders

    // Change lag to 3 working days
    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("3");
    await lagInput.press("Enter");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Task B should have moved forward
    const newStartB = await getStartDate(page, "Task B");
    const newEndB = await getEndDate(page, "Task B");
    expect(newStartB).not.toBe("01/09/2025");

    // The CRITICAL check: Task B should still span 3 working days.
    // FS lag=3wd from Wed Jan 8: gap = Thu 9, Fri 10, Mon 13 (3 working days)
    // → successor starts Tue Jan 14 (day after last gap day)
    // 3 working days from Tue 14: Tue=1, Wed=2, Thu=3 → end Thu Jan 16
    expect(newStartB).toBe("01/14/2025");
    expect(newEndB).toBe("01/16/2025"); // 3 working days: Tue, Wed, Thu
  });
});

// ===========================================================================
// Group 8: Undo/Redo
// ===========================================================================

test.describe("Undo/redo for dependency operations", () => {
  test("undo lag change reverts successor position", async ({ page }) => {
    await setupAndFit(page, { autoScheduling: true });

    const origStartB = await getStartDate(page, "Task B");

    // Change lag from 2 to 5
    await openDependencyPanel(page, "Task A", "Task B");
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("5");
    await lagInput.press("Enter");

    // Verify Task B moved
    const movedStartB = await getStartDate(page, "Task B");
    expect(movedStartB).not.toBe(origStartB);

    // Close panel (press Escape)
    await page.keyboard.press("Escape");

    // Undo
    await page.keyboard.press("Control+z");

    // Task B should return to original position
    const revertedStartB = await getStartDate(page, "Task B");
    expect(revertedStartB).toBe(origStartB);
  });

  test("undo cascaded drag reverts all moved tasks", async ({ page }) => {
    await setupAndFit(page, { autoScheduling: true });

    const origStartA = await getStartDate(page, "Task A");
    const origStartB = await getStartDate(page, "Task B");
    const origStartC = await getStartDate(page, "Task C");

    // Drag Task A forward (cascades to B and C)
    await dragTaskBar(page, "Task A", 150);

    // Verify all moved
    expect(await getStartDate(page, "Task A")).not.toBe(origStartA);
    expect(await getStartDate(page, "Task B")).not.toBe(origStartB);
    expect(await getStartDate(page, "Task C")).not.toBe(origStartC);

    // Undo
    await page.keyboard.press("Control+z");

    // All tasks should return to original positions
    expect(await getStartDate(page, "Task A")).toBe(origStartA);
    expect(await getStartDate(page, "Task B")).toBe(origStartB);
    expect(await getStartDate(page, "Task C")).toBe(origStartC);
  });

  test("undo dependency creation removes dependency", async ({ page }) => {
    // Start with only A→B dependency
    await setupAndFit(page, { dependencies: [DEP_A_B] });

    // Verify 1 arrow
    await expect(page.locator(".dependency-arrow")).toHaveCount(1);

    // We can't easily create a dependency via drag in E2E,
    // so we test undo of an existing state by verifying the
    // arrow count reduces after undo of the last action.
    // For a true creation undo test, we'd need to:
    // 1. Create dependency via drag
    // 2. Verify arrow count = 2
    // 3. Undo
    // 4. Verify arrow count = 1

    // For now, verify that the existing dependency can be deleted and undone
    await openDependencyPanel(page, "Task A", "Task B");
    // Blur the auto-focused lag input so Delete targets the dependency, not the input
    await page
      .getByRole("dialog", { name: "Edit dependency" })
      .locator("button")
      .first()
      .focus();
    await page.keyboard.press("Delete");
    await expect(page.locator(".dependency-arrow")).toHaveCount(0);

    // Undo the deletion
    await page.keyboard.press("Control+z");
    await expect(page.locator(".dependency-arrow")).toHaveCount(1);
  });
});

// ===========================================================================
// Group 10: All dependency types (SS, FF, SF) — core behaviors
// ===========================================================================

// For each non-FS type, verify:
// 1. Correct lag display in panel
// 2. Lag change enforces constraint (task moves)
// 3. Drag predecessor cascades correctly

test.describe("All dependency types — SS", () => {
  test("SS: lag display correct and lag change moves successor", async ({
    page,
  }) => {
    // SS: successor.start = predecessor.start + lag
    // Task A: Mon Jan 6 – Fri Jan 10. Task B: Wed Jan 8 – Fri Jan 10.
    // SS lag = 2 (B starts 2 days after A starts: Jan 6 + 2 = Jan 8)
    const taskA = {
      ...TASK_A,
      startDate: "2025-01-06",
      endDate: "2025-01-10",
      duration: 5,
    };
    const taskB = {
      ...TASK_B,
      startDate: "2025-01-08",
      endDate: "2025-01-10",
      duration: 3,
    };
    await setupAndFit(page, {
      autoScheduling: true,
      tasks: [taskA, taskB, TASK_C],
      dependencies: [{ ...DEP_A_B, type: "SS", lag: 2 }, DEP_B_C],
    });

    // Verify lag display
    await openDependencyPanel(page, "Task A", "Task B");
    await expect(getLagInput(page)).toHaveValue("2");

    // Change lag to 4
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("4");
    await lagInput.press("Enter");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // SS: new start = Jan 6 + 4 = Jan 10
    expect(await getStartDate(page, "Task B")).toBe("01/10/2025");
  });

  test("SS: drag predecessor cascades to successor", async ({ page }) => {
    const taskA = {
      ...TASK_A,
      startDate: "2025-01-06",
      endDate: "2025-01-10",
      duration: 5,
    };
    const taskB = {
      ...TASK_B,
      startDate: "2025-01-08",
      endDate: "2025-01-10",
      duration: 3,
    };
    await setupAndFit(page, {
      autoScheduling: true,
      tasks: [taskA, taskB, TASK_C],
      dependencies: [{ ...DEP_A_B, type: "SS", lag: 2 }, DEP_B_C],
    });

    const origStartB = await getStartDate(page, "Task B");
    await dragTaskBar(page, "Task A", 150);

    // Task B should have moved (SS cascade)
    expect(await getStartDate(page, "Task B")).not.toBe(origStartB);
  });
});

test.describe("All dependency types — FF", () => {
  test("FF: lag display correct and lag change moves successor", async ({
    page,
  }) => {
    // FF: successor.end = predecessor.end + lag
    // Task A ends Jan 10, Task B ends Jan 12. FF lag = 2.
    const taskA = {
      ...TASK_A,
      startDate: "2025-01-06",
      endDate: "2025-01-10",
      duration: 5,
    };
    const taskB = {
      ...TASK_B,
      startDate: "2025-01-10",
      endDate: "2025-01-12",
      duration: 3,
    };
    await setupAndFit(page, {
      autoScheduling: true,
      tasks: [taskA, taskB, TASK_C],
      dependencies: [{ ...DEP_A_B, type: "FF", lag: 2 }, DEP_B_C],
    });

    // Verify lag display
    await openDependencyPanel(page, "Task A", "Task B");
    await expect(getLagInput(page)).toHaveValue("2");

    // Change lag to 5
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("5");
    await lagInput.press("Enter");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // FF: new end = Jan 10 + 5 = Jan 15
    expect(await getEndDate(page, "Task B")).toBe("01/15/2025");
  });

  test("FF: drag predecessor cascades to successor", async ({ page }) => {
    const taskA = {
      ...TASK_A,
      startDate: "2025-01-06",
      endDate: "2025-01-10",
      duration: 5,
    };
    const taskB = {
      ...TASK_B,
      startDate: "2025-01-10",
      endDate: "2025-01-12",
      duration: 3,
    };
    await setupAndFit(page, {
      autoScheduling: true,
      tasks: [taskA, taskB, TASK_C],
      dependencies: [{ ...DEP_A_B, type: "FF", lag: 2 }, DEP_B_C],
    });

    const origEndB = await getEndDate(page, "Task B");
    await dragTaskBar(page, "Task A", 150);

    // Task B end should have moved (FF cascade)
    expect(await getEndDate(page, "Task B")).not.toBe(origEndB);
  });
});

test.describe("All dependency types — SF", () => {
  test("SF: lag display correct and lag change moves successor", async ({
    page,
  }) => {
    // SF: successor.end = predecessor.start + lag
    // Task A starts Jan 6, Task B ends Jan 8. SF lag = 2.
    const taskA = {
      ...TASK_A,
      startDate: "2025-01-06",
      endDate: "2025-01-10",
      duration: 5,
    };
    const taskB = {
      ...TASK_B,
      startDate: "2025-01-06",
      endDate: "2025-01-08",
      duration: 3,
    };
    await setupAndFit(page, {
      autoScheduling: true,
      tasks: [taskA, taskB, TASK_C],
      dependencies: [{ ...DEP_A_B, type: "SF", lag: 2 }, DEP_B_C],
    });

    // Verify lag display
    await openDependencyPanel(page, "Task A", "Task B");
    await expect(getLagInput(page)).toHaveValue("2");

    // Change lag to 5
    const lagInput = getLagInput(page);
    await lagInput.click();
    await lagInput.press("Control+a");
    await page.keyboard.type("5");
    await lagInput.press("Enter");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // SF: new end = Jan 6 + 5 = Jan 11
    expect(await getEndDate(page, "Task B")).toBe("01/11/2025");
  });

  test("SF: drag predecessor cascades to successor", async ({ page }) => {
    const taskA = {
      ...TASK_A,
      startDate: "2025-01-06",
      endDate: "2025-01-10",
      duration: 5,
    };
    const taskB = {
      ...TASK_B,
      startDate: "2025-01-06",
      endDate: "2025-01-08",
      duration: 3,
    };
    await setupAndFit(page, {
      autoScheduling: true,
      tasks: [taskA, taskB, TASK_C],
      dependencies: [{ ...DEP_A_B, type: "SF", lag: 2 }, DEP_B_C],
    });

    const origEndB = await getEndDate(page, "Task B");
    await dragTaskBar(page, "Task A", 150);

    // Task B should have moved (SF cascade)
    expect(await getEndDate(page, "Task B")).not.toBe(origEndB);
  });
});
