/**
 * E2E tests for the export dialog.
 *
 * Covers opening/closing the dialog, switching formats, and cancelling.
 */

import { test, expect } from './fixtures/helpers';

test.describe('Export Dialog', () => {
  test('opens with Ctrl+E and closes with Escape', async ({ appPage: page }) => {
    // Open export dialog
    await page.keyboard.press('Control+e');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Export Gantt Chart')).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('switches export format', async ({ appPage: page }) => {
    await page.keyboard.press('Control+e');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Format selector uses role="radiogroup" with role="radio" buttons
    const formatGroup = dialog.getByRole('radiogroup', { name: 'Export format' });

    // Default is PDF — verify it's checked
    const pdfRadio = formatGroup.getByRole('radio', { name: 'PDF' });
    await expect(pdfRadio).toHaveAttribute('aria-checked', 'true');

    // Click PNG
    const pngRadio = formatGroup.getByRole('radio', { name: 'PNG' });
    await pngRadio.click();
    await expect(pngRadio).toHaveAttribute('aria-checked', 'true');
    await expect(pdfRadio).toHaveAttribute('aria-checked', 'false');

    // Verify export button text changed
    await expect(dialog.getByRole('button', { name: 'Export PNG' })).toBeVisible();

    // Click SVG
    const svgRadio = formatGroup.getByRole('radio', { name: 'SVG' });
    await svgRadio.click();
    await expect(svgRadio).toHaveAttribute('aria-checked', 'true');
    await expect(dialog.getByRole('button', { name: 'Export SVG' })).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('closes with Cancel button', async ({ appPage: page }) => {
    await page.keyboard.press('Control+e');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Click Cancel
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
