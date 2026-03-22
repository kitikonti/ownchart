/**
 * Shared helpers for export E2E tests.
 *
 * Provides sample data injection, download interception, and file validation
 * utilities used across all export test files (PNG, PDF, SVG).
 */

import { expect, type Page, type Download } from '@playwright/test';

// ---------------------------------------------------------------------------
// Sample data — injected via localStorage for consistent export content
// ---------------------------------------------------------------------------

const SAMPLE_TASKS = [
  {
    id: 'export-task-1',
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
    id: 'export-task-2',
    name: 'Design Phase',
    startDate: '2025-01-07',
    endDate: '2025-01-17',
    duration: 11,
    progress: 75,
    color: '#0F6CBD',
    order: 1,
    type: 'task',
    parent: 'export-task-4',
    metadata: {},
  },
  {
    id: 'export-task-3',
    name: 'Development Sprint 1',
    startDate: '2025-01-20',
    endDate: '2025-02-07',
    duration: 19,
    progress: 30,
    color: '#2B88D8',
    order: 2,
    type: 'task',
    parent: 'export-task-4',
    metadata: {},
  },
  {
    id: 'export-task-4',
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
    id: 'export-task-5',
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
  {
    id: 'export-task-6',
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

const SAMPLE_DEPENDENCIES = [
  { from: 'export-task-4', to: 'export-task-5', type: 'finish-to-start' },
  { from: 'export-task-5', to: 'export-task-6', type: 'finish-to-start' },
];

const SAMPLE_CHART_STATE = {
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showWeekends: true,
  showTodayMarker: false,
  showHolidays: false,
  showDependencies: true,
  showProgress: true,
  taskLabelPosition: 'after' as const,
};

const SAMPLE_FILE_STATE = {
  fileName: 'Export Test Project',
  chartId: 'export-chart-001',
  lastSaved: '2025-01-06T10:00:00.000Z',
  isDirty: false,
};

function buildStoragePayload(tabId: string): string {
  return JSON.stringify({
    version: 2,
    charts: {
      [tabId]: {
        tabId,
        lastActive: Date.now(),
        tasks: SAMPLE_TASKS,
        dependencies: SAMPLE_DEPENDENCIES,
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
export async function setupWithExportData(page: Page): Promise<void> {
  const tabId = 'tab-0000000001-export001';
  const payload = buildStoragePayload(tabId);

  await page.addInitScript(
    ({ tabId, payload }) => {
      localStorage.setItem('ownchart-welcome-dismissed', 'true');
      localStorage.setItem('ownchart-tour-completed', 'true');
      localStorage.setItem('ownchart-multi-tab-state', payload);
      sessionStorage.setItem('ownchart-tab-id', tabId);
    },
    { tabId, payload },
  );

  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await expect(
    page.getByLabel('Task spreadsheet').getByText('Project Kickoff'),
  ).toBeVisible({ timeout: 10_000 });
}

/** Set a project title via the top bar. Handles both empty and pre-existing titles. */
export async function setProjectTitle(page: Page, title: string): Promise<void> {
  // The title button has title="Click to edit project title" — use that as a stable selector
  const titleButton = page.getByTitle('Click to edit project title');
  await titleButton.click();
  const titleInput = page.getByRole('textbox', { name: 'Project title' });
  await titleInput.fill(title);
  await titleInput.press('Enter');
}

// ---------------------------------------------------------------------------
// Export dialog helpers
// ---------------------------------------------------------------------------

/** Open the export dialog via keyboard shortcut. */
export async function openExportDialog(page: Page): Promise<void> {
  await page.keyboard.press('Control+e');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Export Gantt Chart')).toBeVisible();
}

/** Select an export format in the dialog. */
export async function selectFormat(
  page: Page,
  format: 'PNG' | 'PDF' | 'SVG',
): Promise<void> {
  const dialog = page.getByRole('dialog');
  const formatGroup = dialog.getByRole('radiogroup', { name: 'Export format' });
  await formatGroup.getByRole('radio', { name: format }).click();
}

/**
 * Click the export button and wait for the download event.
 * Returns the Download object for validation.
 */
export async function clickExportAndWaitForDownload(page: Page): Promise<Download> {
  const dialog = page.getByRole('dialog');
  const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
  const exportButton = dialog.getByRole('button', { name: /^Export/ });
  await exportButton.click();
  return downloadPromise;
}

// ---------------------------------------------------------------------------
// File validation helpers
// ---------------------------------------------------------------------------

/** Read a Download stream into a Buffer. */
export async function downloadToBuffer(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Download stream is null');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Assert the download is a valid PNG (magic bytes check + minimum size). */
export async function assertValidPng(download: Download): Promise<Buffer> {
  const buffer = await downloadToBuffer(download);
  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  expect(buffer.length).toBeGreaterThan(1000);
  expect(buffer.subarray(0, 4).toString('hex')).toBe('89504e47');
  return buffer;
}

/** Assert the download is a valid PDF (magic bytes check + minimum size). */
export async function assertValidPdf(download: Download): Promise<Buffer> {
  const buffer = await downloadToBuffer(download);
  expect(buffer.length).toBeGreaterThan(1000);
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  return buffer;
}

/** Assert the download is a valid SVG (XML structure check). */
export async function assertValidSvg(download: Download): Promise<string> {
  const buffer = await downloadToBuffer(download);
  const content = buffer.toString('utf-8');
  expect(content).toContain('<svg');
  expect(content).toContain('</svg>');
  return content;
}
