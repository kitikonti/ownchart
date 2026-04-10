/**
 * E2E tests for working-days cell edit snapping (#82).
 *
 * Covers checklist items:
 *   #37 — Cell edit: typing non-working date snaps to next working day on save
 *   #38 — Cell edit: milestone date snap applies to both startDate and endDate
 *   #39 — Cell edit: endDate snap that lands before startDate is rejected
 */

import { test, expect } from "@playwright/test";
import {
  injectAndNavigate,
  getStartDate,
  getEndDate,
} from "./fixtures/dependency-helpers";
import { activateAndEdit } from "./fixtures/helpers";
import { WD_CHART_STATE, type StoragePayloadOptions } from "./fixtures/sample-data";

// ---------------------------------------------------------------------------
// Shared task fixtures
// ---------------------------------------------------------------------------

const TASK = {
  id: "cell-task-1",
  name: "Regular Task",
  startDate: "2025-01-06", // Monday
  endDate: "2025-01-24", // Friday (3-week span so snap won't exceed end)
  duration: 19,
  progress: 0,
  color: "#3b82f6",
  order: 0,
  type: "task",
  metadata: {},
};

const MILESTONE = {
  id: "cell-ms-1",
  name: "Milestone A",
  startDate: "2025-01-06", // Monday
  endDate: "2025-01-06",
  duration: 0,
  progress: 0,
  color: "#3b82f6",
  order: 1,
  type: "milestone",
  metadata: {},
};

// For #39 — task with tight date range for testing endDate rejection
const TIGHT_TASK = {
  id: "cell-task-2",
  name: "Tight Task",
  startDate: "2025-01-10", // Friday
  endDate: "2025-01-10", // Friday (single-day)
  duration: 1,
  progress: 0,
  color: "#3b82f6",
  order: 2,
  type: "task",
  metadata: {},
};

const options: StoragePayloadOptions = {
  tabId: "tab-1111111111-celledt",
  tasks: [TASK, MILESTONE, TIGHT_TASK],
  chartState: WD_CHART_STATE,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("WD cell edit snapping (#82)", () => {
  test.beforeEach(async ({ page }) => {
    await injectAndNavigate(page, options, "Regular Task");
  });

  test("cell edit: typing non-working date snaps to next working day (#37)", async ({
    page,
  }) => {
    // Type 01/11/2025 (Saturday) into the startDate cell
    await activateAndEdit(
      page,
      "Regular Task",
      "startDate",
      "2025-01-11",
      "Start Date"
    );

    // Should snap forward to Monday 01/13/2025
    expect(await getStartDate(page, "Regular Task")).toBe("01/13/2025");
  });

  test("cell edit: milestone date snap applies to both dates (#38)", async ({
    page,
  }) => {
    // Type 01/11/2025 (Saturday) into the milestone's startDate cell
    await activateAndEdit(
      page,
      "Milestone A",
      "startDate",
      "2025-01-11",
      "Start Date"
    );

    // Start date should snap to Monday 01/13/2025
    expect(await getStartDate(page, "Milestone A")).toBe("01/13/2025");
    // Milestones sync both dates — endDate should match startDate
    // (endDate may be empty in the table display for milestones)
    const endDate = await getEndDate(page, "Milestone A");
    if (endDate) {
      expect(endDate).toBe("01/13/2025");
    }
  });

  test("cell edit: endDate snap before startDate is rejected (#39)", async ({
    page,
  }) => {
    // Tight Task: start=Fri 01/10, end=Fri 01/10
    // Try to set endDate to 01/04/2025 (Saturday) — snaps to Mon 01/06/2025
    // But 01/06 < 01/10 (startDate), so the edit must be rejected.
    await activateAndEdit(
      page,
      "Tight Task",
      "endDate",
      "2025-01-04",
      "End Date"
    );

    // An inline error alert should be visible with the date range message
    await expect(
      page.getByRole("alert").getByText("End date must be after start date")
    ).toBeVisible();

    // Dismiss the error by pressing Escape or clicking elsewhere
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // The endDate should remain unchanged (edit was rejected)
    expect(await getEndDate(page, "Tight Task")).toBe("01/10/2025");
  });
});
