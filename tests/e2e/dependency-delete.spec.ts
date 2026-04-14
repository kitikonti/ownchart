/**
 * E2E tests for deleting dependencies via keyboard (Delete/Backspace).
 *
 * Verifies that focusing the arrow's SVG `<g>` and pressing Delete or
 * Backspace removes the dependency directly via the element's onKeyDown
 * handler — no properties panel needed.
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

/**
 * Focus the dependency arrow's SVG `<g>` element.
 *
 * Previous approaches all broke in at least one browser engine:
 * - Playwright `click()` — Firefox rejects clicks on SVG `<g>` outside
 *   viewport (microsoft/playwright#22082)
 * - `dispatchEvent(new MouseEvent('click'))` — panel opens but keyboard
 *   focus lands on the panel's lag input, making Delete act as "edit number"
 *   instead of "delete dependency"
 * - `evaluate(el => el.click())` — WebKit: SVG `<g>` lacks `.click()`
 *
 * The fix: use `locator.focus()` which calls native `SVGElement.focus()` —
 * supported across all browsers since April 2018 (MDN). The `<g>` has
 * `tabIndex={0}` so it is focusable, and the component's `onKeyDown`
 * handles Delete/Backspace directly without needing the panel open.
 */
async function focusDependencyArrow(page: Page): Promise<void> {
  const arrow = page.locator('g[aria-label^="Dependency from"]').first();
  await arrow.focus();
  await expect(arrow).toBeFocused();
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

  test('Delete key removes focused dependency arrow', async ({ page }) => {
    await expect(page.locator('.dependency-arrow')).toHaveCount(1);

    // Focus the arrow directly — its onKeyDown handles Delete without the panel
    await focusDependencyArrow(page);

    // Press Delete — should remove the dependency
    await page.keyboard.press('Delete');

    // The dependency arrow should be gone
    await expect(page.locator('.dependency-arrow')).toHaveCount(0);
  });

  test('Backspace key removes focused dependency arrow', async ({ page }) => {
    await expect(page.locator('.dependency-arrow')).toHaveCount(1);

    await focusDependencyArrow(page);

    // Press Backspace — should also remove the dependency
    await page.keyboard.press('Backspace');

    await expect(page.locator('.dependency-arrow')).toHaveCount(0);
  });
});
