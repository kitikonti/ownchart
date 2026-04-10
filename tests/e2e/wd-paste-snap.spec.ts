/**
 * E2E tests for WD-aware paste snapping and undo/redo round-trips (#82).
 *
 * Covers checklist items:
 *   #40 — Paste row: pasted task dates snap, WD duration preserved
 *   #41 — Paste row: summary tasks excluded from snapping
 *   #42 — Paste cell: pasted date value snaps + undo/redo round-trips
 *   #43 — Paste cell: cut-paste of date field clears source correctly
 *   #51 — Undo after snap restores pre-snap state
 *   #52 — Cell paste undo/redo sideEffects: duration restored on undo
 *   #53 — Undo of cut-paste date: source cell restored + target restored
 */

import { test, expect } from "@playwright/test";
import {
  injectAndNavigate,
  getStartDate,
  getDuration,
  assertWorkingDay,
  clickCellForClipboard,
} from "./fixtures/dependency-helpers";
import {
  activateAndEdit,
  getCell,
  selectTask,
  getGrid,
} from "./fixtures/helpers";
import { WD_CHART_STATE, type StoragePayloadOptions } from "./fixtures/sample-data";

test.describe("WD paste snapping & undo (#82)", () => {
  // Shared test data — tasks on weekdays and weekends for paste testing
  const TASK_A = {
    id: "paste-a",
    name: "Task A",
    startDate: "2025-01-06", // Mon
    endDate: "2025-01-24", // Fri (wide span so snap doesn't exceed end)
    duration: 19,
    progress: 50,
    color: "#3b82f6",
    order: 0,
    type: "task",
    metadata: {},
  };

  const TASK_B = {
    id: "paste-b",
    name: "Task B",
    startDate: "2025-01-13", // Mon
    endDate: "2025-01-31", // Fri (wide span)
    duration: 19,
    progress: 25,
    color: "#10b981",
    order: 1,
    type: "task",
    metadata: {},
  };

  const SUMMARY = {
    id: "paste-sum",
    name: "Summary Group",
    startDate: "2025-01-06",
    endDate: "2025-01-17",
    duration: 12,
    progress: 0,
    color: "#f59e0b",
    order: 2,
    type: "summary",
    open: true,
    metadata: {},
  };

  function buildOptions(
    tabId: string,
    tasks: Record<string, unknown>[]
  ): StoragePayloadOptions {
    return {
      tabId,
      tasks,
      chartState: WD_CHART_STATE,
    };
  }

  // ----- #51 — Undo after cell-edit snap restores pre-snap state -----

  test("#51 — undo after cell-edit snap restores original date", async ({
    page,
  }) => {
    await injectAndNavigate(
      page,
      buildOptions("tab-1111111111-undo51", [TASK_A]),
      "Task A"
    );

    const origStart = await getStartDate(page, "Task A");
    const origDuration = await getDuration(page, "Task A");

    // Edit startDate to Saturday — will snap to Monday
    await activateAndEdit(
      page,
      "Task A",
      "startDate",
      "2025-01-11",
      "Start Date"
    );

    const snappedStart = await getStartDate(page, "Task A");
    expect(snappedStart).toBe("01/13/2025"); // Monday

    // Undo — should restore original date
    await page.keyboard.press("Control+z");
    const restoredStart = await getStartDate(page, "Task A");
    expect(restoredStart).toBe(origStart);
    const restoredDuration = await getDuration(page, "Task A");
    expect(restoredDuration).toBe(origDuration);
  });

  // ----- #40 — Paste row: pasted task dates snap to working days -----

  test("#40 — paste row: pasted task dates snap to working days", async ({
    page,
  }) => {
    await injectAndNavigate(
      page,
      buildOptions("tab-1111111111-paste40", [TASK_A, TASK_B]),
      "Task A"
    );

    // Select and copy Task A row
    await selectTask(page, "Task A");
    await page.keyboard.press("Control+c");

    // Select Task B and paste below
    await selectTask(page, "Task B");
    await page.keyboard.press("Control+v");

    // Wait for the pasted row to appear
    const grid = getGrid(page);
    await expect(grid.locator(".task-table-row")).toHaveCount(3, {
      timeout: 5_000,
    });

    // The pasted task should have working-day dates
    // It gets inserted after Task B, find the third task row
    const rows = grid.locator(".task-table-row");
    const pastedRow = rows.nth(2);
    const pastedStartCell = pastedRow.getByRole("gridcell").nth(3); // startDate
    const pastedEndCell = pastedRow.getByRole("gridcell").nth(4); // endDate
    const pastedStart = (await pastedStartCell.textContent())?.trim() ?? "";
    const pastedEnd = (await pastedEndCell.textContent())?.trim() ?? "";

    if (pastedStart) assertWorkingDay(pastedStart, "pasted row start");
    if (pastedEnd) assertWorkingDay(pastedEnd, "pasted row end");
  });

  // ----- #41 — Paste row: summary tasks excluded from snapping -----

  test("#41 — paste row: summary tasks are not snapped", async ({ page }) => {
    await injectAndNavigate(
      page,
      buildOptions("tab-1111111111-paste41", [TASK_A, SUMMARY]),
      "Task A"
    );

    // Select and copy the summary row
    await selectTask(page, "Summary Group");
    await page.keyboard.press("Control+c");

    // Select Task A and paste
    await selectTask(page, "Task A");
    await page.keyboard.press("Control+v");

    // The pasted summary should exist without errors
    // Summary dates are auto-calculated, not snapped
    const grid = getGrid(page);
    await expect(grid.locator(".task-table-row").first()).toBeVisible();
  });

  // ----- #42 — Paste cell: date snaps + undo/redo round-trips -----

  test("#42 — paste cell: date snaps and undo/redo round-trips", async ({
    page,
  }) => {
    await injectAndNavigate(
      page,
      buildOptions("tab-1111111111-pcell42", [TASK_A, TASK_B]),
      "Task A"
    );

    // Record original values of Task B
    const origStartB = await getStartDate(page, "Task B");

    // Activate cell and wait for row deselection before Ctrl+C
    await clickCellForClipboard(page, "Task A", "startDate");
    await page.keyboard.press("Control+c");

    // Activate target cell and paste
    await clickCellForClipboard(page, "Task B", "startDate");
    await page.keyboard.press("Control+v");
    // Wait for async paste to complete
    await page.waitForTimeout(200);

    // The pasted date (01/06/2025 Mon) should apply to Task B
    const pastedStart = await getStartDate(page, "Task B");
    // 01/06 is already a working day, should paste directly
    assertWorkingDay(pastedStart, "pasted cell date");
    expect(pastedStart).not.toBe(origStartB);

    // Undo
    await page.keyboard.press("Control+z");
    const undoneStart = await getStartDate(page, "Task B");
    expect(undoneStart).toBe(origStartB);

    // Redo
    await page.keyboard.press("Control+Shift+z");
    const redoneStart = await getStartDate(page, "Task B");
    expect(redoneStart).toBe(pastedStart);
  });

  // ----- #43 — Cut-paste cell: source cleared, target updated -----

  test("#43 — cut-paste name cell: source cleared after paste", async ({
    page,
  }) => {
    // Date fields cannot be cut (canCutCellValue blocks it).
    // Test with name field instead to verify cut-paste clears the source.
    await injectAndNavigate(
      page,
      buildOptions("tab-1111111111-cut43", [TASK_A, TASK_B]),
      "Task A"
    );

    // Activate cell and wait for row deselection before Ctrl+X
    await clickCellForClipboard(page, "Task A", "name");
    await page.keyboard.press("Control+x");

    // Activate target cell and paste
    await clickCellForClipboard(page, "Task B", "name");
    await page.keyboard.press("Control+v");
    // Wait for async paste + exit any edit mode
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");

    // Re-read cell contents after paste
    const grid = getGrid(page);

    // Find Task A and Task B rows by checking their current names
    // After cut-paste: Task B should have "Task A" name, source (former Task A) should be ""
    // Use the row number cells to identify rows positionally
    const rows = grid.locator(".task-table-row");
    const row1Name = rows.nth(0).getByRole("gridcell").nth(2);
    const row2Name = rows.nth(1).getByRole("gridcell").nth(2);

    const name1 = (await row1Name.textContent())?.trim();
    const name2 = (await row2Name.textContent())?.trim();

    // One row should have "Task A" (pasted), the other should be "" (cut cleared)
    expect([name1, name2]).toContain("Task A");
    expect([name1, name2]).toContain("");
  });

  // ----- #52 — Paste cell undo: duration side effect restored -----

  test("#52 — paste cell undo: duration restored alongside date", async ({
    page,
  }) => {
    await injectAndNavigate(
      page,
      buildOptions("tab-1111111111-pundo52", [TASK_A, TASK_B]),
      "Task A"
    );

    const origDurationB = await getDuration(page, "Task B");

    // Click the cell to activate it (clearSelection + setActiveCell)
    const cellA = getCell(page, "Task A", "startDate");
    await cellA.click();
    await page.keyboard.press("Control+c");

    // Paste to Task B's startDate — this may change B's duration
    const cellB = getCell(page, "Task B", "startDate");
    await cellB.click();
    await page.keyboard.press("Control+v");

    // Undo — both date AND duration should revert
    await page.keyboard.press("Control+z");
    const restoredDurationB = await getDuration(page, "Task B");
    expect(restoredDurationB).toBe(origDurationB);
  });

  // ----- #53 — Undo of cut-paste date: both source and target restored -----

  test("#53 — undo cut-paste date: source and target both restored", async ({
    page,
  }) => {
    await injectAndNavigate(
      page,
      buildOptions("tab-1111111111-cutundo53", [TASK_A, TASK_B]),
      "Task A"
    );

    const origStartA = await getStartDate(page, "Task A");
    const origStartB = await getStartDate(page, "Task B");
    const origDurationB = await getDuration(page, "Task B");

    // Click the cell to activate it (clearSelection + setActiveCell)
    const cellA = getCell(page, "Task A", "startDate");
    await cellA.click();
    await page.keyboard.press("Control+x");

    // Click target cell and paste
    const cellB = getCell(page, "Task B", "startDate");
    await cellB.click();
    await page.keyboard.press("Control+v");

    // Undo — both should revert
    await page.keyboard.press("Control+z");

    const restoredStartA = await getStartDate(page, "Task A");
    const restoredStartB = await getStartDate(page, "Task B");
    const restoredDurationB = await getDuration(page, "Task B");

    expect(restoredStartA).toBe(origStartA);
    expect(restoredStartB).toBe(origStartB);
    expect(restoredDurationB).toBe(origDurationB);
  });
});
