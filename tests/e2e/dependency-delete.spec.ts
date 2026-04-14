/**
 * E2E tests for deleting dependencies via keyboard (Delete/Backspace).
 *
 * Verifies that pressing Delete or Backspace removes the selected dependency
 * when the properties panel is open.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  injectDataAndNavigate,
  DEFAULT_SAMPLE_TASKS,
} from './fixtures/sample-data';

// ---------------------------------------------------------------------------
// Test data — single FS dependency between two of the sample tasks
// ---------------------------------------------------------------------------

const TEST_DEPENDENCIES = [
  {
    id: 'dep-1',
    fromTaskId: 'sample-task-2',
    toTaskId: 'sample-task-3',
    type: 'FS',
    createdAt: '2025-01-06T10:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupWithDependency(page: Page): Promise<void> {
  await injectDataAndNavigate(page, {
    tabId: 'tab-0000000001-depdelete001',
    tasks: DEFAULT_SAMPLE_TASKS,
    dependencies: TEST_DEPENDENCIES,
    fileState: {
      fileName: 'Dependency Delete Test',
      chartId: 'dep-delete-chart-001',
      lastSaved: '2025-01-06T10:00:00.000Z',
      isDirty: false,
    },
  });
}

/** Select the dependency arrow and open the properties panel. */
async function clickDependencyArrow(page: Page): Promise<void> {
  // Use the aria-label on the SVG group to find the arrow
  const arrow = page.locator('g[aria-label^="Dependency from"]').first();
  // Firefox/WebKit reject Playwright's click() on SVG <g> elements outside
  // the viewport (microsoft/playwright#22082). Native DOM .click() fires a
  // real bubbling event that React picks up, bypassing viewport checks.
  await arrow.evaluate(el => (el as SVGGElement).click());
  // Panel has aria-label="Edit dependency"
  await expect(
    page.getByRole('dialog', { name: 'Edit dependency' }),
  ).toBeVisible({ timeout: 5_000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Dependency deletion via keyboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithDependency(page);
    // Fit timeline so arrows are visible, then wait for layout to settle
    await page.keyboard.press('f');
    await expect(page.locator('.dependency-arrow').first()).toBeVisible({
      timeout: 10_000,
    });
    // Allow zoom/layout animation to complete
    await page.waitForTimeout(500);
  });

  test('Delete key removes dependency when properties panel is open', async ({
    page,
  }) => {
    await expect(page.locator('.dependency-arrow')).toHaveCount(1);

    // Click the arrow to select it (opens properties panel)
    await clickDependencyArrow(page);

    // Press Delete — should remove the dependency
    await page.keyboard.press('Delete');

    // The dependency arrow should be gone
    await expect(page.locator('.dependency-arrow')).toHaveCount(0);

    // The properties panel should also close
    await expect(page.getByRole('dialog', { name: 'Edit dependency' })).not.toBeVisible();
  });

  test('Backspace key removes dependency when properties panel is open', async ({
    page,
  }) => {
    await expect(page.locator('.dependency-arrow')).toHaveCount(1);

    await clickDependencyArrow(page);

    // Press Backspace — should also remove the dependency
    await page.keyboard.press('Backspace');

    await expect(page.locator('.dependency-arrow')).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Edit dependency' })).not.toBeVisible();
  });
});
