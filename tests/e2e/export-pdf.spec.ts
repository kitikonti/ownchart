/**
 * E2E tests for PDF export.
 *
 * Verifies that the PDF export pipeline produces valid downloadable files
 * with correct page settings, headers, footers, and logo support.
 * Runs only on Chromium — export rendering is heavy and browser-specific.
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  setupWithExportData,
  setProjectTitle,
  openExportDialog,
  selectFormat,
  clickExportAndWaitForDownload,
  assertValidPdf,
} from './fixtures/export-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_LOGO_PATH = path.resolve(__dirname, 'fixtures/test-logo.png');

// Export tests are heavy — only run on Chromium
test.skip(({ browserName }) => browserName !== 'chromium', 'Export: Chromium only');

// Exports can be slow (offscreen render + PDF generation)
test.setTimeout(60_000);

test.describe('PDF Export', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithExportData(page);
  });

  test('downloads valid PDF with correct filename', async ({ page }) => {
    await setProjectTitle(page, 'My PDF Project');
    await openExportDialog(page);
    await selectFormat(page, 'PDF');

    const download = await clickExportAndWaitForDownload(page);

    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/my[_-]pdf[_-]project/i);
    expect(filename).toMatch(/\.pdf$/i);

    // Verify valid PDF
    await assertValidPdf(download);
  });

  test('default A4 landscape produces valid PDF', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PDF');

    const download = await clickExportAndWaitForDownload(page);
    const buffer = await assertValidPdf(download);
    expect(buffer.length).toBeGreaterThan(5000);
  });

  test('A3 page size exports successfully', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PDF');

    const dialog = page.getByRole('dialog');
    const pageSizeSelect = dialog.getByLabel('Page Size');
    await pageSizeSelect.selectOption('a3');

    const download = await clickExportAndWaitForDownload(page);
    await assertValidPdf(download);
  });

  test('portrait orientation exports successfully', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PDF');

    const dialog = page.getByRole('dialog');
    const portraitButton = dialog.getByRole('radio', { name: /portrait/i });
    await portraitButton.click();

    const download = await clickExportAndWaitForDownload(page);
    await assertValidPdf(download);
  });

  test('header with project title exports successfully', async ({ page }) => {
    await setProjectTitle(page, 'Header Test');
    await openExportDialog(page);
    await selectFormat(page, 'PDF');

    // Project title checkbox in header is enabled by default
    // Just verify export works with a title set
    const download = await clickExportAndWaitForDownload(page);
    await assertValidPdf(download);
  });

  test('logo in header exports successfully', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'PDF');

    const dialog = page.getByRole('dialog');

    // Enable logo in header
    const headerLogoCheckbox = dialog.getByRole('checkbox', { name: 'Logo' }).first();
    await headerLogoCheckbox.check();

    // Upload a test logo
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_LOGO_PATH);

    // Wait for logo preview
    await expect(dialog.getByText('test-logo.png')).toBeVisible();

    const download = await clickExportAndWaitForDownload(page);
    await assertValidPdf(download);
  });
});
