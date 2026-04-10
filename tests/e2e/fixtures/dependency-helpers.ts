/**
 * Shared helpers for dependency-related E2E tests.
 *
 * Extracts common patterns from dependency-scheduling, working-days-drag-duration,
 * and dependency-persistence test files to reduce duplication.
 */

import { expect, type Page, type Locator } from "@playwright/test";
import {
  buildStoragePayload,
  type StoragePayloadOptions,
} from "./sample-data";
import { getCell } from "./helpers";

// ---------------------------------------------------------------------------
// Data injection
// ---------------------------------------------------------------------------

/**
 * Inject test data via localStorage and navigate to the app.
 *
 * Waits for `waitForTaskName` to appear in the task spreadsheet before
 * resolving — each test provides its own first-task name.
 */
export async function injectAndNavigate(
  page: Page,
  options: StoragePayloadOptions,
  waitForTaskName: string
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
}

/**
 * Fit the timeline to view and wait for dependency arrows to render.
 * Call after injectAndNavigate when tests need visible arrows.
 */
export async function fitAndWaitForArrows(page: Page): Promise<void> {
  await page.keyboard.press("f");
  await expect(page.locator(".dependency-arrow").first()).toBeVisible({
    timeout: 10_000,
  });
  // Allow zoom/layout animation to settle
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Table cell readers
// ---------------------------------------------------------------------------

/** Read a task's start date from the table (returns display format, e.g. "01/06/2025"). */
export async function getStartDate(
  page: Page,
  taskName: string
): Promise<string> {
  const cell = getCell(page, taskName, "startDate");
  const text = await cell.textContent();
  return text?.trim() ?? "";
}

/** Read a task's end date from the table. */
export async function getEndDate(
  page: Page,
  taskName: string
): Promise<string> {
  const cell = getCell(page, taskName, "endDate");
  const text = await cell.textContent();
  return text?.trim() ?? "";
}

/** Read a task's duration from the table. */
export async function getDuration(
  page: Page,
  taskName: string
): Promise<string> {
  const cell = getCell(page, taskName, "duration");
  const text = await cell.textContent();
  return text?.trim() ?? "";
}

// ---------------------------------------------------------------------------
// Dependency properties panel
// ---------------------------------------------------------------------------

/**
 * Click a dependency arrow to select it and open the properties panel.
 *
 * Uses JS dispatchEvent to reliably trigger the click handler — for
 * hook-shaped arrows (SS/FF/SF) the `<g>` bounding box center can land
 * in empty space, making Playwright's native click unreliable.
 */
export async function openDependencyPanel(
  page: Page,
  fromName: string,
  toName: string
): Promise<void> {
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
export function getLagInput(page: Page): Locator {
  return page
    .getByRole("dialog", { name: "Edit dependency" })
    .locator('input[type="number"]');
}

/** Read the lag value from the properties panel input. */
export async function getLagValue(page: Page): Promise<string> {
  const dialog = page.getByRole("dialog", { name: "Edit dependency" });
  const lagInput = dialog.locator('input[type="number"]');
  return await lagInput.inputValue();
}

/** Read the selected dependency type from the properties panel. */
export async function getSelectedType(page: Page): Promise<string> {
  const dialog = page.getByRole("dialog", { name: "Edit dependency" });
  const radiogroup = dialog.getByRole("radiogroup", {
    name: "Dependency type",
  });
  const checked = radiogroup.getByRole("radio", { checked: true });
  return (await checked.textContent()) ?? "";
}

/** Close the dependency properties panel with Escape. */
export async function closeDependencyPanel(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Edit dependency" })
  ).not.toBeVisible();
}

// ---------------------------------------------------------------------------
// Date / working-day assertion helpers
// ---------------------------------------------------------------------------

/** Parse the table's display format ("MM/DD/YYYY") into a Date. */
export function parseDisplayDate(displayDate: string): Date {
  const [m, d, y] = displayDate.split("/").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Assert that a displayed date falls on a working day (Mon-Fri).
 * @param displayDate - Date in "MM/DD/YYYY" format
 * @param label - Human-readable label for error messages
 */
export function assertWorkingDay(displayDate: string, label: string): void {
  const dow = parseDisplayDate(displayDate).getDay();
  expect(
    dow,
    `${label} should be a working day (Mon-Fri) but landed on ${displayDate} (dow=${dow})`
  ).toBeGreaterThanOrEqual(1);
  expect(dow).toBeLessThanOrEqual(5);
}

// ---------------------------------------------------------------------------
// Task bar resize
// ---------------------------------------------------------------------------

/**
 * Resize a task bar by dragging its left or right edge.
 *
 * Uses the background rect (first visible rect inside the task-bar group)
 * for edge detection instead of the group bounding box — this avoids the
 * text label extending the measured width when taskLabelPosition is "after".
 *
 * @param direction - Which edge to drag: 'left' (start) or 'right' (end)
 * @param pixelDelta - Positive = extend outward, negative = shrink
 */
export async function resizeTaskBar(
  page: Page,
  taskName: string,
  direction: "left" | "right",
  pixelDelta: number
): Promise<void> {
  const taskBar = page
    .locator(".task-bar")
    .filter({
      has: page.locator(`text:has-text("${taskName}")`),
    })
    .first();

  // Use the background rect (second rect — first is inside <defs> clipPath)
  // to get the actual bar geometry, not the group + label bounding box.
  const bgRect = taskBar.locator("rect").nth(1);
  const box = await bgRect.boundingBox();
  expect(box, `Background rect for "${taskName}" should be visible`).not.toBeNull();
  const { x, y, width, height } = box!;

  const edgeX = direction === "left" ? x + 3 : x + width - 3;
  const centerY = y + height / 2;

  await page.mouse.move(edgeX, centerY);
  await page.mouse.down();
  await page.mouse.move(edgeX + pixelDelta, centerY, { steps: 10 });
  await page.mouse.up();
}

// ---------------------------------------------------------------------------
// Task bar drag
// ---------------------------------------------------------------------------

/**
 * Drag a task bar horizontally by a pixel offset.
 * @param modifiers - Keyboard modifiers to hold during drag (e.g. ['Alt'])
 */
export async function dragTaskBar(
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

  for (const mod of modifiers) {
    await page.keyboard.down(mod);
  }

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + pixelDelta, centerY, { steps: 10 });
  await page.mouse.up();

  for (const mod of modifiers) {
    await page.keyboard.up(mod);
  }
}
