/**
 * Visual Regression Tests
 *
 * Screenshot-based tests that catch unintended visual changes to the UI.
 * Uses Playwright's built-in toHaveScreenshot() for pixel comparison.
 * Only runs on Chromium to avoid cross-browser rendering differences.
 *
 * Run locally:  npx playwright test visual-regression --project=chromium
 *
 * Generate / update baseline snapshots (MUST use Docker — CI runs Linux):
 *
 *   npm run test:vrt:update   # generate/update baselines (auto-fixes file ownership)
 *   npm run test:vrt           # verify snapshots match
 *
 * Commit the generated PNGs in the -snapshots/ directory.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Fixed viewport for deterministic screenshots
test.use({
  viewport: { width: 1280, height: 720 },
  storageState: undefined,
});

// Pixel tolerance — accounts for sub-pixel font rendering differences
const SCREENSHOT_OPTS = { maxDiffPixelRatio: 0.01 } as const;

/**
 * Mask elements whose content changes between runs (version string) so they
 * don't break screenshot comparisons on every release.
 */
function dynamicMasks(
  page: import("@playwright/test").Page,
  ...extra: import("@playwright/test").Locator[]
): { mask: import("@playwright/test").Locator[] } {
  return {
    mask: [page.getByLabel("About OwnChart"), ...extra],
  };
}

// ---------------------------------------------------------------------------
// Sample data — injected via localStorage to get a consistent populated state
// ---------------------------------------------------------------------------

const SAMPLE_TASKS = [
  {
    id: "vrt-task-1",
    name: "Project Kickoff",
    startDate: "2025-01-06",
    endDate: "2025-01-06",
    duration: 1,
    progress: 100,
    color: "#0F6CBD",
    order: 0,
    type: "milestone",
    metadata: {},
  },
  {
    id: "vrt-task-2",
    name: "Design Phase",
    startDate: "2025-01-07",
    endDate: "2025-01-17",
    duration: 11,
    progress: 75,
    color: "#0F6CBD",
    order: 1,
    type: "task",
    parent: "vrt-task-4",
    metadata: {},
  },
  {
    id: "vrt-task-3",
    name: "Development Sprint 1",
    startDate: "2025-01-20",
    endDate: "2025-02-07",
    duration: 19,
    progress: 30,
    color: "#2B88D8",
    order: 2,
    type: "task",
    parent: "vrt-task-4",
    metadata: {},
  },
  {
    id: "vrt-task-4",
    name: "Phase 1",
    startDate: "2025-01-07",
    endDate: "2025-02-07",
    duration: 32,
    progress: 50,
    color: "#0F6CBD",
    order: 3,
    type: "group",
    open: true,
    metadata: {},
  },
  {
    id: "vrt-task-5",
    name: "Testing & QA",
    startDate: "2025-02-10",
    endDate: "2025-02-21",
    duration: 12,
    progress: 0,
    color: "#059669",
    order: 4,
    type: "task",
    metadata: {},
  },
];

const SAMPLE_CHART_STATE = {
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showWeekends: true,
  showTodayMarker: false, // Disable — moves daily, breaks screenshots
  showHolidays: false,
  showDependencies: true,
  showProgress: true,
  taskLabelPosition: "after" as const,
};

const SAMPLE_FILE_STATE = {
  fileName: "Visual Test Project",
  chartId: "vrt-chart-001",
  lastSaved: "2025-01-06T10:00:00.000Z",
  isDirty: false,
};

function buildStoragePayload(tabId: string): string {
  return JSON.stringify({
    version: 2,
    charts: {
      [tabId]: {
        tabId,
        lastActive: Date.now(), // Must be recent — cleanupInactiveTabs() deletes tabs older than 24h
        tasks: SAMPLE_TASKS,
        dependencies: [],
        chartState: SAMPLE_CHART_STATE,
        fileState: SAMPLE_FILE_STATE,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/** Dismiss welcome tour + inject sample data via localStorage. */
async function setupWithData(
  page: import("@playwright/test").Page
): Promise<void> {
  // The tab ID is generated on app boot — we inject data keyed to a known ID
  // and also set the tab-id so the app picks up our data.
  const tabId = "tab-0000000001-vrt0001";
  const payload = buildStoragePayload(tabId);

  await page.addInitScript(
    ({ tabId, payload }) => {
      localStorage.setItem("ownchart-welcome-dismissed", "true");
      localStorage.setItem("ownchart-tour-completed", "true");
      localStorage.setItem("ownchart-multi-tab-state", payload);
      // The app generates its own tab ID via sessionStorage; override it.
      sessionStorage.setItem("ownchart-tab-id", tabId);
    },
    { tabId, payload }
  );

  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();
  // Wait for tasks to render — the first task name should be in the table.
  // Use getByLabel to scope to the table (avoids strict-mode violation from
  // the duplicate SVG <text> label on the timeline).
  await expect(
    page.getByLabel("Task spreadsheet").getByText("Project Kickoff")
  ).toBeVisible({ timeout: 5000 });
}

/** Dismiss welcome tour, load empty app. */
async function setupEmpty(
  page: import("@playwright/test").Page
): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("ownchart-welcome-dismissed", "true");
    localStorage.setItem("ownchart-tour-completed", "true");
  });

  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests — Empty State
// ---------------------------------------------------------------------------

// Visual regression tests only run on Chromium — cross-browser pixel comparison is unreliable.
test.skip(({ browserName }) => browserName !== "chromium", "VRT: Chromium only");

test.describe("Empty State", () => {
  test("app shell with empty project", async ({ page }) => {
    await setupEmpty(page);
    // Wait for ribbon to be interactive
    await expect(page.getByRole("tab", { name: "Home" })).toBeVisible();
    // Mask the timeline region — without tasks the timeline shows the current
    // month/week labels and a today marker, both of which change over time.
    await expect(page).toHaveScreenshot("empty-app-shell.png", {
      ...SCREENSHOT_OPTS,
      ...dynamicMasks(page, page.getByLabel("Timeline", { exact: true })),
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — Ribbon & Toolbar
// ---------------------------------------------------------------------------

test.describe("Ribbon Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await setupWithData(page);
  });

  test("Home tab toolbar", async ({ page }) => {
    // Home is the default active tab
    await expect(page.getByRole("tab", { name: "Home" })).toBeVisible();
    const toolbar = page.locator('[role="tabpanel"]');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveScreenshot(
      "ribbon-home-tab.png",
      SCREENSHOT_OPTS
    );
  });

  test("View tab toolbar", async ({ page }) => {
    await page.getByRole("tab", { name: "View" }).click();
    const toolbar = page.locator('[role="tabpanel"]');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveScreenshot(
      "ribbon-view-tab.png",
      SCREENSHOT_OPTS
    );
  });

  test("Format tab toolbar", async ({ page }) => {
    await page.getByRole("tab", { name: "Format" }).click();
    const toolbar = page.locator('[role="tabpanel"]');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveScreenshot(
      "ribbon-format-tab.png",
      SCREENSHOT_OPTS
    );
  });

  test("Help tab toolbar", async ({ page }) => {
    await page.getByRole("tab", { name: "Help" }).click();
    const toolbar = page.locator('[role="tabpanel"]');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveScreenshot(
      "ribbon-help-tab.png",
      SCREENSHOT_OPTS
    );
  });
});

// ---------------------------------------------------------------------------
// Tests — File Menu
// ---------------------------------------------------------------------------

test.describe("File Menu", () => {
  test("file menu dropdown open", async ({ page }) => {
    await setupWithData(page);
    await page.getByRole("button", { name: "File" }).click();
    // Wait for the menu to animate in
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveScreenshot("file-menu-open.png", SCREENSHOT_OPTS);
  });
});

// ---------------------------------------------------------------------------
// Tests — Task Table
// ---------------------------------------------------------------------------

test.describe("Task Table", () => {
  test("table with sample tasks", async ({ page }) => {
    await setupWithData(page);
    const table = page.locator(".task-table-container");
    await expect(table).toBeVisible();
    await expect(table).toHaveScreenshot(
      "task-table-populated.png",
      SCREENSHOT_OPTS
    );
  });
});

// ---------------------------------------------------------------------------
// Tests — Status Bar
// ---------------------------------------------------------------------------

test.describe("Status Bar", () => {
  test("status bar with project loaded", async ({ page }) => {
    await setupWithData(page);
    const statusBar = page.locator(".status-bar");
    await expect(statusBar).toBeVisible();
    await expect(statusBar).toHaveScreenshot("status-bar.png", {
      ...SCREENSHOT_OPTS,
      ...dynamicMasks(page),
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — Full App with Data
// ---------------------------------------------------------------------------

test.describe("Full App Layout", () => {
  test("app with sample project loaded", async ({ page }) => {
    await setupWithData(page);
    // Press "F" to trigger fitToView — centres the timeline on the task range.
    // Without this the timeline stays at the left edge (90 days before tasks).
    await page.keyboard.press("f");
    // Wait for the double-rAF scroll to complete (scrollLeft becomes > 0)
    await page.waitForFunction(
      () => {
        const el = document.querySelector(".gantt-chart-scroll-container");
        return el && el.scrollLeft > 0;
      },
      { timeout: 5000 }
    );
    await expect(page).toHaveScreenshot("full-app-with-data.png", {
      ...SCREENSHOT_OPTS,
      ...dynamicMasks(page),
    });
  });
});
