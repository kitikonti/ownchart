/**
 * E2E tests for PNG export.
 *
 * Verifies that the PNG export pipeline produces valid downloadable files.
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
  deselectAllColumns,
} from './fixtures/export-helpers';

// Export tests are heavy — only run on Chromium
test.skip(({ browserName }) => browserName !== 'chromium', 'Export: Chromium only');

// Exports can be slow (offscreen render + canvas capture)
test.setTimeout(60_000);

test.describe('PNG Export', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithExportData(page);
  });

  test('downloads valid PNG with correct filename', async ({ page }) => {
    await setProjectTitle(page, 'My Test Project');
    await openExportDialog(page);
    await selectFormat(page, 'PNG');
    const download = await clickExportAndWaitForDownload(page);

    // Verify filename contains the project name
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/my[_-]test[_-]project/i);
    expect(filename).toMatch(/\.png$/i);

    // Verify it's a valid PNG
    await assertValidPng(download);
  });

  test('default options produce valid non-empty PNG', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PNG');
    const download = await clickExportAndWaitForDownload(page);

    const buffer = await assertValidPng(download);
    // A chart with 6 tasks should produce a reasonably sized image
    expect(buffer.length).toBeGreaterThan(5000);
  });

  test('custom zoom (0.5x) exports successfully', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PNG');
    const dialog = page.getByRole('dialog');

    // Switch to custom zoom mode
    const customZoomRadio = dialog.getByRole('radio', { name: /custom zoom/i });
    await customZoomRadio.click();

    // Set zoom to 50%
    const zoomInput = dialog.getByRole('spinbutton', { name: /zoom percentage/i });
    await zoomInput.fill('50');

    const download = await clickExportAndWaitForDownload(page);
    await assertValidPng(download);
  });

  test('transparent background exports successfully', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PNG');
    const dialog = page.getByRole('dialog');

    // Enable transparent background checkbox
    const transparentCheckbox = dialog.getByLabel(/transparent background/i);
    await transparentCheckbox.check();

    const download = await clickExportAndWaitForDownload(page);
    await assertValidPng(download);
  });

  test('fit-to-width mode exports successfully', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PNG');
    const dialog = page.getByRole('dialog');

    // Switch to fit-to-width zoom mode
    const fitToWidthRadio = dialog.getByRole('radio', { name: /fit to width/i });
    await fitToWidthRadio.click();

    const download = await clickExportAndWaitForDownload(page);
    await assertValidPng(download);
  });

  test('export with all columns deselected (chart only)', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PNG');
    await deselectAllColumns(page);

    const download = await clickExportAndWaitForDownload(page);
    await assertValidPng(download);
  });
});
