/**
 * Shared sample data and storage injection for E2E tests.
 *
 * Provides a consistent set of tasks, chart state, and file state that can be
 * injected via localStorage for any test that needs a populated project.
 *
 * Used by: export-helpers.ts, visual-regression.spec.ts
 */

import { expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Task fixtures
// ---------------------------------------------------------------------------

/**
 * Default sample tasks covering all task types: milestones, regular tasks,
 * a group with children, and dependencies. Uses a fixed date range
 * (Jan-Feb 2025) so timeline rendering is deterministic.
 */
export const DEFAULT_SAMPLE_TASKS = [
  {
    id: 'sample-task-1',
    name: 'Project Kickoff',
    startDate: '2025-01-06',
    endDate: '2025-01-06',
    duration: 1,
    progress: 100,
    color: '#0F6CBD',
    order: 0,
    type: 'milestone',
    metadata: {},
  },
  {
    id: 'sample-task-2',
    name: 'Design Phase',
    startDate: '2025-01-07',
    endDate: '2025-01-17',
    duration: 11,
    progress: 75,
    color: '#0F6CBD',
    order: 1,
    type: 'task',
    parent: 'sample-task-4',
    metadata: {},
  },
  {
    id: 'sample-task-3',
    name: 'Development Sprint 1',
    startDate: '2025-01-20',
    endDate: '2025-02-07',
    duration: 19,
    progress: 30,
    color: '#2B88D8',
    order: 2,
    type: 'task',
    parent: 'sample-task-4',
    metadata: {},
  },
  {
    id: 'sample-task-4',
    name: 'Phase 1',
    startDate: '2025-01-07',
    endDate: '2025-02-07',
    duration: 32,
    progress: 50,
    color: '#0F6CBD',
    order: 3,
    type: 'group',
    open: true,
    metadata: {},
  },
  {
    id: 'sample-task-5',
    name: 'Testing & QA',
    startDate: '2025-02-10',
    endDate: '2025-02-21',
    duration: 12,
    progress: 0,
    color: '#059669',
    order: 4,
    type: 'task',
    metadata: {},
  },
];

/** Additional tasks for export tests (extends the default set). */
export const EXPORT_EXTRA_TASKS = [
  {
    id: 'sample-task-6',
    name: 'Launch',
    startDate: '2025-02-24',
    endDate: '2025-02-24',
    duration: 1,
    progress: 0,
    color: '#DC2626',
    order: 5,
    type: 'milestone',
    metadata: {},
  },
];

/** Dependencies between sample tasks. */
export const DEFAULT_SAMPLE_DEPENDENCIES = [
  { from: 'sample-task-4', to: 'sample-task-5', type: 'finish-to-start' },
  { from: 'sample-task-5', to: 'sample-task-6', type: 'finish-to-start' },
];

// ---------------------------------------------------------------------------
// Chart & file state defaults
// ---------------------------------------------------------------------------

export const DEFAULT_CHART_STATE = {
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showWeekends: true,
  showTodayMarker: false, // Disable — moves daily, breaks deterministic tests
  showHolidays: false,
  showDependencies: true,
  showProgress: true,
  taskLabelPosition: 'after' as const,
};

// ---------------------------------------------------------------------------
// Storage payload builder
// ---------------------------------------------------------------------------

export interface StoragePayloadOptions {
  tabId: string;
  tasks?: readonly Record<string, unknown>[];
  dependencies?: readonly Record<string, unknown>[];
  chartState?: Record<string, unknown>;
  fileState?: Record<string, unknown>;
}

/**
 * Build a multi-tab storage JSON payload for injection via localStorage.
 *
 * Uses `Date.now()` for `lastActive` so the cleanup logic (which deletes
 * tabs older than 24h) doesn't remove our injected data.
 */
export function buildStoragePayload({
  tabId,
  tasks = DEFAULT_SAMPLE_TASKS,
  dependencies = [],
  chartState = DEFAULT_CHART_STATE,
  fileState,
}: StoragePayloadOptions): string {
  const resolvedFileState = fileState ?? {
    fileName: 'Test Project',
    chartId: `${tabId}-chart`,
    lastSaved: '2025-01-06T10:00:00.000Z',
    isDirty: false,
  };

  return JSON.stringify({
    version: 2,
    charts: {
      [tabId]: {
        tabId,
        lastActive: Date.now(),
        tasks,
        dependencies,
        chartState,
        fileState: resolvedFileState,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Page setup helpers
// ---------------------------------------------------------------------------

/**
 * Dismiss the welcome tour and inject sample data, then navigate and wait
 * for the first task to render.
 */
export async function injectDataAndNavigate(
  page: Page,
  options: StoragePayloadOptions,
): Promise<void> {
  const payload = buildStoragePayload(options);

  await page.addInitScript(
    ({ tabId, payload }) => {
      localStorage.setItem('ownchart-welcome-dismissed', 'true');
      localStorage.setItem('ownchart-tour-completed', 'true');
      localStorage.setItem('ownchart-multi-tab-state', payload);
      sessionStorage.setItem('ownchart-tab-id', tabId);
    },
    { tabId: options.tabId, payload },
  );

  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  // Wait for tasks to render — scope to table to avoid strict-mode violation
  // from duplicate SVG <text> labels on the timeline.
  await expect(
    page.getByLabel('Task spreadsheet').getByText('Project Kickoff'),
  ).toBeVisible({ timeout: 10_000 });
}

/** Dismiss welcome tour and navigate to an empty project. */
export async function setupEmptyProject(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('ownchart-welcome-dismissed', 'true');
    localStorage.setItem('ownchart-tour-completed', 'true');
  });

  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.getByRole('grid', { name: 'Task spreadsheet' })).toBeVisible();
}
