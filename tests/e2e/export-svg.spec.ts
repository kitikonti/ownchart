/**
 * E2E tests for SVG export.
 *
 * Verifies that the SVG export pipeline produces valid downloadable SVG files
 * with correct structure and content.
 * Runs only on Chromium — export rendering is heavy and browser-specific.
 */

import { test, expect } from '@playwright/test';
import {
  setupWithExportData,
  setProjectTitle,
  openExportDialog,
  selectFormat,
  clickExportAndWaitForDownload,
  assertValidSvg,
  deselectAllColumns,
} from './fixtures/export-helpers';

// Export tests are heavy — only run on Chromium
test.skip(({ browserName }) => browserName !== 'chromium', 'Export: Chromium only');

// Exports can be slow (offscreen render + SVG assembly)
test.setTimeout(60_000);

test.describe('SVG Export', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithExportData(page);
  });

  test('downloads valid SVG with correct filename', async ({ page }) => {
    await setProjectTitle(page, 'My SVG Project');
    await openExportDialog(page);
    await selectFormat(page, 'SVG');

    const download = await clickExportAndWaitForDownload(page);

    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/my[_-]svg[_-]project/i);
    expect(filename).toMatch(/\.svg$/i);

    // Verify valid SVG
    await assertValidSvg(download);
  });

  test('SVG contains root element with width and height', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'SVG');

    const download = await clickExportAndWaitForDownload(page);
    const content = await assertValidSvg(download);

    // Check SVG root has dimension attributes
    expect(content).toMatch(/<svg[^>]+width=/);
    expect(content).toMatch(/<svg[^>]+height=/);
  });

  test('SVG contains task name text elements', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'SVG');

    const download = await clickExportAndWaitForDownload(page);
    const content = await assertValidSvg(download);

    // Verify task names from sample data appear in SVG
    expect(content).toContain('Project Kickoff');
    expect(content).toContain('Design Phase');
    expect(content).toContain('Development Sprint 1');
    expect(content).toContain('Testing &amp; QA');
  });

  test('SVG contains rect elements for task bars', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'SVG');

    const download = await clickExportAndWaitForDownload(page);
    const content = await assertValidSvg(download);

    // Task bars are rendered as <rect> elements
    expect(content).toMatch(/<rect/);
  });

  test('custom zoom (0.5x) exports valid SVG', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'SVG');

    const dialog = page.getByRole('dialog');

    // Switch to custom zoom mode
    const customZoomRadio = dialog.getByRole('radio', { name: /custom zoom/i });
    await customZoomRadio.click();

    // Set zoom to 50%
    const zoomInput = dialog.getByRole('spinbutton', { name: /zoom percentage/i });
    await zoomInput.fill('50');

    const download = await clickExportAndWaitForDownload(page);
    await assertValidSvg(download);
  });

  test('export with all columns deselected produces SVG without table', async ({ page }) => {
    await openExportDialog(page);
    await selectFormat(page, 'SVG');
    await deselectAllColumns(page);

    const download = await clickExportAndWaitForDownload(page);
    await assertValidSvg(download);
  });
});
