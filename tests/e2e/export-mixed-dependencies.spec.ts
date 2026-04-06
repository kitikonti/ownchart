/**
 * E2E test for SVG export with all 4 dependency types (FS, SS, FF, SF).
 *
 * Injects 5 tasks with 4 dependencies (one of each type), exports to SVG,
 * and verifies the exported SVG contains 4 dependency arrow groups.
 * Runs only on Chromium — export rendering is heavy and browser-specific.
 */

import { test, expect, type Page } from '@playwright/test';
import { buildStoragePayload, DEFAULT_CHART_STATE } from './fixtures/sample-data';
import {
  openExportDialog,
  selectFormat,
  clickExportAndWaitForDownload,
  assertValidSvg,
} from './fixtures/export-helpers';

// Export tests are heavy — only run on Chromium
test.skip(({ browserName }) => browserName !== 'chromium', 'Export: Chromium only');

// Exports can be slow (offscreen render + SVG assembly)
test.setTimeout(60_000);

// ---------------------------------------------------------------------------
// Test data: 5 tasks with 4 dependency types
// ---------------------------------------------------------------------------

const TAB_ID = 'tab-0000000001-svgexport';

const TASKS = [
  {
    id: 'dep-task-a',
    name: 'Task A',
    startDate: '2025-01-06',
    endDate: '2025-01-10',
    duration: 5,
    progress: 0,
    color: '#0F6CBD',
    order: 0,
    type: 'task',
    metadata: {},
  },
  {
    id: 'dep-task-b',
    name: 'Task B',
    startDate: '2025-01-13',
    endDate: '2025-01-17',
    duration: 5,
    progress: 0,
    color: '#0F6CBD',
    order: 1,
    type: 'task',
    metadata: {},
  },
  {
    id: 'dep-task-c',
    name: 'Task C',
    startDate: '2025-01-06',
    endDate: '2025-01-10',
    duration: 5,
    progress: 0,
    color: '#2B88D8',
    order: 2,
    type: 'task',
    metadata: {},
  },
  {
    id: 'dep-task-d',
    name: 'Task D',
    startDate: '2025-01-13',
    endDate: '2025-01-17',
    duration: 5,
    progress: 0,
    color: '#2B88D8',
    order: 3,
    type: 'task',
    metadata: {},
  },
  {
    id: 'dep-task-e',
    name: 'Task E',
    startDate: '2025-01-20',
    endDate: '2025-01-24',
    duration: 5,
    progress: 0,
    color: '#059669',
    order: 4,
    type: 'task',
    metadata: {},
  },
];

const DEPENDENCIES = [
  {
    id: 'dep-fs-001',
    fromTaskId: 'dep-task-a',
    toTaskId: 'dep-task-b',
    type: 'FS',
    lag: 0,
    createdAt: '2025-01-06T10:00:00.000Z',
  },
  {
    id: 'dep-ss-001',
    fromTaskId: 'dep-task-a',
    toTaskId: 'dep-task-c',
    type: 'SS',
    lag: 0,
    createdAt: '2025-01-06T10:01:00.000Z',
  },
  {
    id: 'dep-ff-001',
    fromTaskId: 'dep-task-c',
    toTaskId: 'dep-task-d',
    type: 'FF',
    lag: 0,
    createdAt: '2025-01-06T10:02:00.000Z',
  },
  {
    id: 'dep-sf-001',
    fromTaskId: 'dep-task-d',
    toTaskId: 'dep-task-e',
    type: 'SF',
    lag: 0,
    createdAt: '2025-01-06T10:03:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Setup helper (custom — waits for Task A instead of Project Kickoff)
// ---------------------------------------------------------------------------

async function injectDependencyData(page: Page): Promise<void> {
  const options = {
    tabId: TAB_ID,
    tasks: TASKS,
    dependencies: DEPENDENCIES,
    chartState: {
      ...DEFAULT_CHART_STATE,
      showDependencies: true,
    },
    fileState: {
      fileName: 'Dependency Export Test',
      chartId: `${TAB_ID}-chart`,
      lastSaved: '2025-01-06T10:00:00.000Z',
      isDirty: false,
    },
  };
  const payload = buildStoragePayload(options);

  await page.addInitScript(
    ({ tabId, payload }) => {
      localStorage.setItem('ownchart-welcome-dismissed', 'true');
      localStorage.setItem('ownchart-tour-completed', 'true');
      localStorage.setItem('ownchart-multi-tab-state', payload);
      sessionStorage.setItem('ownchart-tab-id', tabId);
    },
    { tabId: TAB_ID, payload },
  );

  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await expect(
    page.getByLabel('Task spreadsheet').getByText('Task A'),
  ).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

test.describe('SVG Export — Mixed Dependency Types', () => {
  test.beforeEach(async ({ page }) => {
    await injectDependencyData(page);
  });

  test('SVG export contains 4 dependency arrow elements for FS, SS, FF, SF', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'SVG');

    const download = await clickExportAndWaitForDownload(page);
    const content = await assertValidSvg(download);

    // Each dependency arrow is rendered as a <g> with class "dependency-arrow"
    // and an aria-label "Dependency from {name} to {name}".
    const arrowMatches = content.match(/class="dependency-arrow/g);
    expect(arrowMatches, 'Expected 4 dependency arrow groups in SVG').toHaveLength(4);

    // Verify each dependency pair is present via aria-labels
    expect(content).toContain('Dependency from Task A to Task B');
    expect(content).toContain('Dependency from Task A to Task C');
    expect(content).toContain('Dependency from Task C to Task D');
    expect(content).toContain('Dependency from Task D to Task E');

    // Each arrow group should contain a <polygon> arrowhead
    const polygonMatches = content.match(/<polygon/g);
    expect(
      polygonMatches?.length,
      'Expected at least 4 polygon arrowheads in SVG',
    ).toBeGreaterThanOrEqual(4);
  });
});
