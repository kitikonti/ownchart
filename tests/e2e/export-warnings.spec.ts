/**
 * E2E tests for export dialog warnings when header/footer options
 * are enabled but the corresponding content is missing.
 */

import { test, expect } from './fixtures/helpers';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_LOGO_PATH = path.resolve(__dirname, 'fixtures/test-logo.png');

const TITLE_WARNING =
  'Project title is enabled but not yet defined. To set a title, use the title field in the top bar.';
const LOGO_WARNING =
  'Logo is enabled but no image has been uploaded yet. Use the upload area below to add a logo.';

test.describe('Export Dialog — Missing Content Warnings', () => {
  test.beforeEach(async ({ appPage: page }) => {
    // Open export dialog and switch to PDF
    await page.keyboard.press('Control+e');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const formatGroup = dialog.getByRole('radiogroup', {
      name: 'Export format',
    });
    await formatGroup.getByRole('radio', { name: 'PDF' }).click();
  });

  test('shows title warning when project title checkbox is on but no title is set', async ({
    appPage: page,
  }) => {
    const dialog = page.getByRole('dialog');

    // "Project title" is checked by default in header — warning should be visible
    // since no project title has been set
    const warning = dialog.getByRole('alert').filter({ hasText: TITLE_WARNING });
    await expect(warning).toBeVisible();
  });

  test('title warning disappears when project title is set', async ({
    appPage: page,
  }) => {
    const dialog = page.getByRole('dialog');

    // Warning should initially be visible
    const warning = dialog.getByRole('alert').filter({ hasText: TITLE_WARNING });
    await expect(warning).toBeVisible();

    // Close dialog, set a project title, reopen
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Click the project title button to enter editing mode, then type a title
    await page.getByRole('button', { name: 'Untitled' }).click();
    const titleInput = page.getByRole('textbox', { name: 'Project title' });
    await titleInput.fill('My Project');
    await titleInput.press('Enter');

    // Reopen export dialog as PDF
    await page.keyboard.press('Control+e');
    await expect(dialog).toBeVisible();
    const formatGroup = dialog.getByRole('radiogroup', {
      name: 'Export format',
    });
    await formatGroup.getByRole('radio', { name: 'PDF' }).click();

    // Warning should be gone
    await expect(warning).not.toBeVisible();
  });

  test('title warning disappears when all title checkboxes are unchecked', async ({
    appPage: page,
  }) => {
    const dialog = page.getByRole('dialog');

    // Warning should initially be visible
    const warning = dialog.getByRole('alert').filter({ hasText: TITLE_WARNING });
    await expect(warning).toBeVisible();

    // Uncheck "Project title" in header (it's checked by default)
    const headerTitleCheckbox = dialog
      .getByRole('checkbox', { name: 'Project title' })
      .first();
    await headerTitleCheckbox.uncheck();

    // Warning should disappear
    await expect(warning).not.toBeVisible();
  });

  test('shows logo warning when logo checkbox is on but no logo is uploaded', async ({
    appPage: page,
  }) => {
    const dialog = page.getByRole('dialog');

    // Logo warning should NOT be visible initially (logo checkbox is off by default)
    const warning = dialog.getByRole('alert').filter({ hasText: LOGO_WARNING });
    await expect(warning).not.toBeVisible();

    // Enable Logo in the header
    const headerLogoCheckbox = dialog
      .getByRole('checkbox', { name: 'Logo' })
      .first();
    await headerLogoCheckbox.check();

    // Logo warning should now be visible
    await expect(warning).toBeVisible();
  });

  test('logo warning disappears after uploading a logo', async ({
    appPage: page,
  }) => {
    const dialog = page.getByRole('dialog');

    // Enable Logo checkbox
    const headerLogoCheckbox = dialog
      .getByRole('checkbox', { name: 'Logo' })
      .first();
    await headerLogoCheckbox.check();

    // Warning should be visible
    const warning = dialog.getByRole('alert').filter({ hasText: LOGO_WARNING });
    await expect(warning).toBeVisible();

    // Upload a logo
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_LOGO_PATH);

    // Warning should disappear after upload
    await expect(warning).not.toBeVisible();
  });

  test('logo warning disappears when logo checkbox is unchecked', async ({
    appPage: page,
  }) => {
    const dialog = page.getByRole('dialog');

    // Enable Logo checkbox
    const headerLogoCheckbox = dialog
      .getByRole('checkbox', { name: 'Logo' })
      .first();
    await headerLogoCheckbox.check();

    // Warning visible
    const warning = dialog.getByRole('alert').filter({ hasText: LOGO_WARNING });
    await expect(warning).toBeVisible();

    // Uncheck Logo
    await headerLogoCheckbox.uncheck();

    // Warning gone
    await expect(warning).not.toBeVisible();
  });
});
