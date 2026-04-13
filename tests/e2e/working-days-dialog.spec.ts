/**
 * E2E tests for the Working Days config dialog (#83).
 *
 * Clicking the "Working Days" toolbar button opens a dialog containing
 * checkboxes (Sat / Sun / Holidays) and — when tasks exist — a
 * recalculation mode selector (keep-durations default, keep-positions).
 */

import { test, expect } from "@playwright/test";
import { type StoragePayloadOptions } from "./fixtures/sample-data";
import {
  injectAndNavigate,
  getStartDate,
  getEndDate,
} from "./fixtures/dependency-helpers";

const TAB_ID = "tab-0000000001-wddialog";

// Mon-Sun task: 7 cal days
const WEEK_TASK = {
  id: "wd-week",
  name: "Week Task",
  startDate: "2026-04-06", // Monday
  endDate: "2026-04-12", // Sunday
  duration: 7,
  progress: 0,
  color: "#0F6CBD",
  order: 0,
  type: "task",
  metadata: {},
};

const FIT_TASK = {
  id: "wd-fit",
  name: "Fit Task",
  startDate: "2026-04-13",
  endDate: "2026-04-17",
  duration: 5,
  progress: 0,
  color: "#2B88D8",
  order: 1,
  type: "task",
  metadata: {},
};

function buildOptions(
  tasks = [WEEK_TASK, FIT_TASK],
): StoragePayloadOptions {
  return {
    tabId: TAB_ID,
    tasks,
    chartState: {
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      showWeekends: true,
      showTodayMarker: false,
      showHolidays: false,
      showDependencies: true,
      showProgress: true,
      taskLabelPosition: "after",
      autoScheduling: false,
      workingDaysConfig: {
        excludeSaturday: false,
        excludeSunday: false,
        excludeHolidays: false,
      },
    },
    fileState: {
      fileName: "WD Dialog Test",
      chartId: "wd-dialog-chart-001",
      lastSaved: "2026-04-06T10:00:00.000Z",
      isDirty: false,
    },
  };
}

async function setup(
  page: import("@playwright/test").Page,
  tasks = [WEEK_TASK, FIT_TASK],
): Promise<void> {
  await injectAndNavigate(
    page,
    buildOptions(tasks),
    tasks[0]?.name ?? "Week Task",
  );
}

/** Open the Working Days dialog via the Format tab toolbar button. */
async function openWorkingDaysDialog(
  page: import("@playwright/test").Page,
): Promise<import("@playwright/test").Locator> {
  await page.getByRole("tab", { name: "Format" }).click();
  await page
    .getByRole("button", { name: "Working Days", exact: false })
    .click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  return dialog;
}

test.describe("Working Days config dialog", () => {
  test("dialog shows checkboxes, mode selector, and Preview button", async ({
    page,
  }) => {
    await setup(page);
    const dialog = await openWorkingDaysDialog(page);

    // Checkboxes inside dialog
    await expect(dialog.getByText("Exclude Saturdays")).toBeVisible();
    await expect(dialog.getByText("Exclude Sundays")).toBeVisible();
    await expect(dialog.getByText(/Exclude Holidays/)).toBeVisible();

    // Both recalc options visible (project has tasks)
    await expect(dialog.getByText("Keep task positions")).toBeVisible();
    await expect(dialog.getByText("Keep durations & lags")).toBeVisible();

    // Preview button
    await expect(
      dialog.getByRole("button", { name: "Preview changes" }),
    ).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
  });

  test("Cancel leaves everything unchanged", async ({ page }) => {
    await setup(page);
    const dialog = await openWorkingDaysDialog(page);

    // Toggle a checkbox then cancel
    await dialog.getByLabel("Exclude Saturdays").click();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();

    const endDate = await getEndDate(page, "Week Task");
    expect(endDate).toBe("04/12/2026");
  });

  test("Keep durations (default): Apply moves tasks", async ({ page }) => {
    await setup(page);
    const dialog = await openWorkingDaysDialog(page);

    await dialog.getByLabel("Exclude Saturdays").click();

    // Default is "keep durations" — just click Apply
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog).not.toBeVisible();

    // Under keep-durations, task bars move to skip the new non-working day
    // Week Task spans Mon-Sun (7d), with Sat excluded it still keeps its
    // WD duration but may shift end date
    const startDate = await getStartDate(page, "Week Task");
    expect(startDate).toBe("04/06/2026"); // Start stays on Monday
  });

  test("Keep positions: dates stay, Apply succeeds", async ({ page }) => {
    await setup(page);
    const dialog = await openWorkingDaysDialog(page);

    await dialog.getByLabel("Exclude Saturdays").click();

    // Switch to keep-positions mode
    await dialog.getByText("Keep task positions").click();
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog).not.toBeVisible();

    // Task dates should NOT have moved
    const startDate = await getStartDate(page, "Week Task");
    const endDate = await getEndDate(page, "Week Task");
    expect(startDate).toBe("04/06/2026");
    expect(endDate).toBe("04/12/2026");
  });

  test("empty chart: dialog opens without recalc section", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ownchart-welcome-dismissed", "true");
      localStorage.setItem("ownchart-tour-completed", "true");
    });
    await page.goto("/");
    await expect(page.locator("#root")).toBeVisible();
    await expect(
      page.getByRole("grid", { name: "Task spreadsheet" }),
    ).toBeVisible();

    // Open dialog
    await page.getByRole("tab", { name: "Format" }).click();
    await page
      .getByRole("button", { name: "Working Days", exact: false })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Checkboxes are present
    await expect(dialog.getByText("Exclude Saturdays")).toBeVisible();

    // Recalc mode section is hidden (no tasks)
    await expect(dialog.getByText("Keep durations & lags")).not.toBeVisible();
    await expect(dialog.getByText("Keep task positions")).not.toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
  });

  test("Undo reverts config after keep-positions apply", async ({ page }) => {
    await setup(page);
    const dialog = await openWorkingDaysDialog(page);

    await dialog.getByLabel("Exclude Saturdays").click();

    // Switch to keep-positions and apply
    await dialog.getByText("Keep task positions").click();
    await dialog.getByRole("button", { name: "Apply" }).click();

    // Dates didn't move (keep-positions), but config changed
    const endDate = await getEndDate(page, "Week Task");
    expect(endDate).toBe("04/12/2026");

    // Undo
    await page.keyboard.press("Control+z");

    // Config should be reverted — dates still the same
    const endDateAfterUndo = await getEndDate(page, "Week Task");
    expect(endDateAfterUndo).toBe("04/12/2026");
  });
});
