/**
 * Shared helpers for export E2E tests.
 *
 * Provides export dialog interaction, download interception, and file validation
 * utilities used across all export test files (PNG, PDF, SVG).
 */

import { expect, type Page, type Download } from '@playwright/test';
import {
  DEFAULT_SAMPLE_TASKS,
  EXPORT_EXTRA_TASKS,
  DEFAULT_SAMPLE_DEPENDENCIES,
  injectDataAndNavigate,
} from './sample-data';

// Re-export for convenience — tests only need to import from export-helpers
export { setupEmptyProject } from './sample-data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Timeout for waiting on export downloads (ms). Exports are slow due to offscreen rendering. */
const EXPORT_DOWNLOAD_TIMEOUT = 60_000;

/** Column labels in the export dialog's "Layout Options" section. */
export const EXPORT_COLUMN_LABELS = [
  'Color',
  'Name',
  'Start Date',
  'End Date',
  'Duration',
  'Progress',
] as const;

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/** Dismiss welcome tour + inject export sample data (6 tasks with dependencies). */
export async function setupWithExportData(page: Page): Promise<void> {
  await injectDataAndNavigate(page, {
    tabId: 'tab-0000000001-export001',
    tasks: [...DEFAULT_SAMPLE_TASKS, ...EXPORT_EXTRA_TASKS],
    dependencies: DEFAULT_SAMPLE_DEPENDENCIES,
    fileState: {
      fileName: 'Export Test Project',
      chartId: 'export-chart-001',
      lastSaved: '2025-01-06T10:00:00.000Z',
      isDirty: false,
    },
  });
}

/** Set a project title via the top bar. Handles both empty and pre-existing titles. */
export async function setProjectTitle(page: Page, title: string): Promise<void> {
  // The title button has title="Click to edit project title" — stable across all title states
  const titleButton = page.getByTitle('Click to edit project title');
  await titleButton.click();
  const titleInput = page.getByRole('textbox', { name: 'Project title' });
  await titleInput.fill(title);
  await titleInput.press('Enter');
  // Wait for the button text to update so subsequent actions see the new title
  await expect(titleButton).toContainText(title);
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
  const downloadPromise = page.waitForEvent('download', { timeout: EXPORT_DOWNLOAD_TIMEOUT });
  const exportButton = dialog.getByRole('button', { name: /^Export/ });
  await exportButton.click();
  return downloadPromise;
}

/**
 * Expand the "Layout Options" collapsible and uncheck all column checkboxes.
 * Useful for testing chart-only (no table) exports.
 */
export async function deselectAllColumns(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /layout options/i }).click();
  for (const label of EXPORT_COLUMN_LABELS) {
    const checkbox = dialog.getByLabel(label);
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }
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
