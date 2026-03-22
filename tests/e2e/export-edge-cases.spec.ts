/**
 * E2E tests for export edge cases.
 *
 * Covers cross-cutting scenarios: empty projects, hidden tasks,
 * special characters, hierarchy, and dialog interaction details.
 * Runs only on Chromium — export rendering is heavy and browser-specific.
 */

import { test, expect } from '@playwright/test';
import {
  setupWithExportData,
  setProjectTitle,
  openExportDialog,
  selectFormat,
  clickExportAndWaitForDownload,
  assertValidPng,
  assertValidSvg,
} from './fixtures/export-helpers';

// Export tests are heavy — only run on Chromium
test.skip(({ browserName }) => browserName !== 'chromium', 'Export: Chromium only');

// Exports can be slow
test.setTimeout(60_000);

// ---------------------------------------------------------------------------
// Empty project export
// ---------------------------------------------------------------------------

test.describe('Empty project export', () => {
  test.beforeEach(async ({ page }) => {
    // Setup WITHOUT data — just dismiss welcome tour
    await page.addInitScript(() => {
      localStorage.setItem('ownchart-welcome-dismissed', 'true');
      localStorage.setItem('ownchart-tour-completed', 'true');
    });
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.getByRole('grid', { name: 'Task spreadsheet' })).toBeVisible();
  });

  test('PNG export of empty project either downloads or shows error', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PNG');
    const dialog = page.getByRole('dialog');
    const exportButton = dialog.getByRole('button', { name: /^Export/ });

    // Try exporting — an empty project may either succeed with a minimal
    // image or show an error. Both are acceptable; a crash is not.
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 }).catch(() => null);
    await exportButton.click();

    const download = await downloadPromise;
    if (download) {
      // If a download happened, it should be a valid PNG
      await assertValidPng(download);
    } else {
      // If no download, there should be an error message in the dialog
      await expect(dialog.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    }
  });

  test('SVG export of empty project either downloads or shows error', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'SVG');
    const dialog = page.getByRole('dialog');
    const exportButton = dialog.getByRole('button', { name: /^Export/ });

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 }).catch(() => null);
    await exportButton.click();

    const download = await downloadPromise;
    if (download) {
      await assertValidSvg(download);
    } else {
      await expect(dialog.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    }
  });
});

// ---------------------------------------------------------------------------
// Special characters in filename
// ---------------------------------------------------------------------------

test.describe('Filename sanitization', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithExportData(page);
  });

  test('special characters in project title produce safe filename', async ({ page }) => {
    await setProjectTitle(page, 'Q1/Q2: Budget <2025> Plan');
    await openExportDialog(page);
    await selectFormat(page, 'PNG');

    const download = await clickExportAndWaitForDownload(page);
    const filename = download.suggestedFilename();

    // Filename should not contain filesystem-unsafe characters
    expect(filename).not.toMatch(/[<>:"/\\|?*]/);
    expect(filename).toMatch(/\.png$/i);
  });

  test('PDF filename with special characters is sanitized', async ({ page }) => {
    await setProjectTitle(page, 'Project "Alpha" v2.0');
    await openExportDialog(page);
    await selectFormat(page, 'PDF');

    const download = await clickExportAndWaitForDownload(page);
    const filename = download.suggestedFilename();

    expect(filename).not.toMatch(/[<>:"/\\|?*]/);
    expect(filename).toMatch(/\.pdf$/i);
  });
});

// ---------------------------------------------------------------------------
// Hidden tasks
// ---------------------------------------------------------------------------

test.describe('Hidden tasks in export', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithExportData(page);
  });

  test('hidden rows are excluded from SVG export', async ({ page }) => {
    // Hide "Testing & QA" via context menu
    const grid = page.getByRole('grid', { name: 'Task spreadsheet' });
    const row = grid.getByRole('row').filter({ hasText: 'Testing & QA' });
    const rowNumberCell = row.getByRole('gridcell').first();
    await rowNumberCell.click({ button: 'right' });

    // Click "Hide Row" in context menu
    const hideMenuItem = page.getByRole('menuitem', { name: /hide/i });
    await hideMenuItem.click();

    // Verify task is no longer visible in the table
    await expect(grid.getByText('Testing & QA')).not.toBeVisible();

    // Open export dialog — should show hidden row count
    await openExportDialog(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/hidden/i)).toBeVisible();

    // Export SVG and verify hidden task is NOT in the output
    await selectFormat(page, 'SVG');
    const download = await clickExportAndWaitForDownload(page);
    const content = await assertValidSvg(download);

    // "Testing & QA" should not appear in SVG
    expect(content).not.toContain('Testing');
    // Other tasks should still be present
    expect(content).toContain('Project Kickoff');
    expect(content).toContain('Design Phase');
  });
});

// ---------------------------------------------------------------------------
// Hierarchy in export
// ---------------------------------------------------------------------------

test.describe('Hierarchy export', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithExportData(page);
  });

  test('SVG export includes group and child tasks', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'SVG');

    const download = await clickExportAndWaitForDownload(page);
    const content = await assertValidSvg(download);

    // Group task
    expect(content).toContain('Phase 1');
    // Child tasks
    expect(content).toContain('Design Phase');
    expect(content).toContain('Development Sprint 1');
    // Milestones
    expect(content).toContain('Project Kickoff');
    expect(content).toContain('Launch');
  });
});

// ---------------------------------------------------------------------------
// Export dialog interaction
// ---------------------------------------------------------------------------

test.describe('Export dialog options', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithExportData(page);
  });

  test('format-specific options show only for their format', async ({ page }) => {
    await openExportDialog(page);
    const dialog = page.getByRole('dialog');

    // PDF is default — should show page size and orientation
    await expect(dialog.getByLabel('Page Size')).toBeVisible();
    await expect(dialog.getByRole('radio', { name: /landscape/i })).toBeVisible();

    // Switch to PNG — should show scale options, NOT page size
    await selectFormat(page, 'PNG');
    await expect(dialog.getByText(/current view/i).first()).toBeVisible();
    await expect(dialog.getByLabel('Page Size')).not.toBeVisible();

    // Switch to SVG — should show scale options, NOT page size
    await selectFormat(page, 'SVG');
    await expect(dialog.getByText(/current view/i).first()).toBeVisible();
    await expect(dialog.getByLabel('Page Size')).not.toBeVisible();
  });

  test('export button starts enabled and triggers download', async ({ page }) => {
    await openExportDialog(page);
    const dialog = page.getByRole('dialog');
    const exportButton = dialog.getByRole('button', { name: /^Export/ });

    // Before export, button should be enabled
    await expect(exportButton).toBeEnabled();

    // Clicking export should trigger a download
    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('column checkboxes toggle correctly', async ({ page }) => {
    await openExportDialog(page);
    const dialog = page.getByRole('dialog');

    // Expand "Layout Options" collapsible section
    await dialog.getByRole('button', { name: /layout options/i }).click();

    // All columns should be checked by default
    const nameCheckbox = dialog.getByLabel('Name');
    await expect(nameCheckbox).toBeChecked();

    // Uncheck Name
    await nameCheckbox.uncheck();
    await expect(nameCheckbox).not.toBeChecked();

    // Re-check Name
    await nameCheckbox.check();
    await expect(nameCheckbox).toBeChecked();
  });

  test('date range mode switching works', async ({ page }) => {
    await openExportDialog(page);
    const dialog = page.getByRole('dialog');

    // Date range uses RadioOptionCard with native radio inputs
    // "Entire project" is checked by default
    const entireProjectRadio = dialog.getByRole('radio', { name: /entire project/i });
    const customRadio = dialog.getByRole('radio', { name: /custom range/i });

    await expect(entireProjectRadio).toBeChecked();

    // Switch to custom — date pickers should appear
    await customRadio.click();
    await expect(customRadio).toBeChecked();
    await expect(dialog.getByLabel('Custom start date')).toBeVisible();
    await expect(dialog.getByLabel('Custom end date')).toBeVisible();

    // Switch back to entire project
    await entireProjectRadio.click();
    await expect(entireProjectRadio).toBeChecked();
  });
});
