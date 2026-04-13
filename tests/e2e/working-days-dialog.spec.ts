/**
 * E2E tests for the Working Days config-change dialog (#83).
 *
 * The dialog appears when the user changes WD settings on a project with
 * tasks. It offers two options: keep positions (default) or keep durations.
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
  tasks = [WEEK_TASK, FIT_TASK]
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
  tasks = [WEEK_TASK, FIT_TASK]
): Promise<void> {
  await injectAndNavigate(
    page,
    buildOptions(tasks),
    tasks[0]?.name ?? "Week Task"
  );
}

async function openWorkingDaysDropdown(
  page: import("@playwright/test").Page
): Promise<void> {
  await page.getByRole("tab", { name: "Format" }).click();
  await page
    .getByRole("button", { name: "Working Days", exact: false })
    .click();
}

test.describe("Working Days config-change dialog", () => {
  test("dialog appears with two options and Preview button", async ({
    page,
  }) => {
    await setup(page);
    await openWorkingDaysDropdown(page);

    await page.getByLabel("Exclude Saturdays").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText("Update Working Days")).toBeVisible();
    // Both options visible
    await expect(dialog.getByText("Keep task positions")).toBeVisible();
    await expect(dialog.getByText("Keep durations & lags")).toBeVisible();
    // Preview button
    await expect(
      dialog.getByRole("button", { name: "Preview changes" })
    ).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
  });

  test("Cancel leaves everything unchanged", async ({ page }) => {
    await setup(page);
    await openWorkingDaysDropdown(page);

    await page.getByLabel("Exclude Saturdays").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();

    const endDate = await getEndDate(page, "Week Task");
    expect(endDate).toBe("04/12/2026");
  });

  test("Keep positions (default): dates stay, Apply succeeds", async ({
    page,
  }) => {
    await setup(page);
    await openWorkingDaysDropdown(page);

    await page.getByLabel("Exclude Saturdays").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Default is "keep positions" — just click Apply
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog).not.toBeVisible();

    // Task dates should NOT have moved
    const startDate = await getStartDate(page, "Week Task");
    const endDate = await getEndDate(page, "Week Task");
    expect(startDate).toBe("04/06/2026");
    expect(endDate).toBe("04/12/2026");
  });

  test("empty chart: no dialog, config changes silently", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ownchart-welcome-dismissed", "true");
      localStorage.setItem("ownchart-tour-completed", "true");
    });
    await page.goto("/");
    await expect(page.locator("#root")).toBeVisible();
    await expect(
      page.getByRole("grid", { name: "Task spreadsheet" })
    ).toBeVisible();

    await page.getByRole("tab", { name: "Format" }).click();
    await page
      .getByRole("button", { name: "Working Days", exact: false })
      .click();
    await page.getByLabel("Exclude Saturdays").click();

    await page.waitForTimeout(500);
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("Undo reverts config after keep-positions apply", async ({ page }) => {
    await setup(page);
    await openWorkingDaysDropdown(page);

    await page.getByLabel("Exclude Saturdays").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
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
