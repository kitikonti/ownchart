/**
 * E2E tests for the logo feature in the PDF export dialog.
 *
 * Covers enabling the logo checkbox, upload section visibility,
 * file upload, logo preview, and removal.
 */

import { test, expect } from './fixtures/helpers';
import path from 'node:path';

// A minimal 1×1 PNG for testing (68 bytes)
const TEST_LOGO_PATH = path.resolve(__dirname, 'fixtures/test-logo.png');

test.describe('Export Dialog — Logo Feature', () => {
  test.beforeEach(async ({ appPage: page }) => {
    // Open export dialog and switch to PDF
    await page.keyboard.press('Control+e');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const formatGroup = dialog.getByRole('radiogroup', { name: 'Export format' });
    await formatGroup.getByRole('radio', { name: 'PDF' }).click();
  });

  test('Logo checkbox in header shows upload section', async ({ appPage: page }) => {
    const dialog = page.getByRole('dialog');

    // Logo upload section should not be visible initially (showLogo defaults to false)
    await expect(dialog.getByText('Upload Logo')).not.toBeVisible();

    // Enable Logo in the header
    const headerLogoCheckbox = dialog.getByRole('checkbox', { name: 'Logo' }).first();
    await headerLogoCheckbox.check();

    // Upload section should now be visible
    await expect(dialog.getByText('Upload Logo (PNG, JPG, SVG)')).toBeVisible();
    await expect(dialog.getByText('Max 512 KB')).toBeVisible();
  });

  test('Logo checkbox in footer also shows upload section', async ({ appPage: page }) => {
    const dialog = page.getByRole('dialog');

    // Enable Logo in the footer (second checkbox)
    const footerLogoCheckbox = dialog.getByRole('checkbox', { name: 'Logo' }).last();
    await footerLogoCheckbox.check();

    // Upload section should be visible
    await expect(dialog.getByText('Upload Logo (PNG, JPG, SVG)')).toBeVisible();
  });

  test('upload logo, verify preview, and remove', async ({ appPage: page }) => {
    const dialog = page.getByRole('dialog');

    // Enable Logo checkbox
    const headerLogoCheckbox = dialog.getByRole('checkbox', { name: 'Logo' }).first();
    await headerLogoCheckbox.check();

    // Upload a test logo
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_LOGO_PATH);

    // Should show the uploaded logo info
    await expect(dialog.getByText('test-logo.png')).toBeVisible();
    await expect(dialog.getByAltText('Project logo')).toBeVisible();

    // Remove button should be visible
    const removeButton = dialog.getByRole('button', { name: 'Remove logo' });
    await expect(removeButton).toBeVisible();

    // Remove the logo
    await removeButton.click();

    // Upload section should reappear
    await expect(dialog.getByText('Upload Logo (PNG, JPG, SVG)')).toBeVisible();
    await expect(dialog.getByText('test-logo.png')).not.toBeVisible();
  });

  test('disabling all logo checkboxes hides upload section', async ({ appPage: page }) => {
    const dialog = page.getByRole('dialog');

    // Enable Logo in header
    const headerLogoCheckbox = dialog.getByRole('checkbox', { name: 'Logo' }).first();
    await headerLogoCheckbox.check();
    await expect(dialog.getByText('Upload Logo (PNG, JPG, SVG)')).toBeVisible();

    // Disable Logo in header
    await headerLogoCheckbox.uncheck();

    // Upload section should disappear
    await expect(dialog.getByText('Upload Logo (PNG, JPG, SVG)')).not.toBeVisible();
  });
});
