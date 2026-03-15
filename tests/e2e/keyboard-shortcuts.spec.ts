/**
 * E2E tests for keyboard shortcut filtering.
 *
 * These tests cover behaviour that cannot be reliably tested in jsdom — in
 * particular, the `target.isContentEditable` guard that suppresses all app
 * shortcuts when the user is typing inside a contentEditable element.
 */

import { test, expect, type Page } from "@playwright/test";

// Pre-dismiss the welcome tour so it never interferes with the tests.
test.use({
  storageState: undefined,
});

const CE_STYLE = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;";

/** Inject a hidden contentEditable element, focus it, and assert focus. */
async function injectContentEditable(page: Page, id: string): Promise<void> {
  await page.evaluate(
    ({ id, style }) => {
      const div = document.createElement("div");
      div.setAttribute("contenteditable", "true");
      div.id = id;
      div.style.cssText = style;
      document.body.appendChild(div);
      div.focus();
    },
    { id, style: CE_STYLE },
  );

  const isFocused = await page.evaluate(
    (elId) => document.activeElement?.id === elId,
    id,
  );
  expect(isFocused).toBe(true);
}

/** Remove a previously injected contentEditable element. */
async function removeContentEditable(page: Page, id: string): Promise<void> {
  await page.evaluate((elId) => document.getElementById(elId)?.remove(), id);
}

test.beforeEach(async ({ page }) => {
  // Suppress the welcome tour by setting the localStorage flag before the app
  // boots.  The key is defined in uiSlice as WELCOME_DISMISSED_KEY.
  await page.addInitScript(() => {
    localStorage.setItem("ownchart-welcome-dismissed", "true");
    localStorage.setItem("ownchart-tour-completed", "true");
  });

  await page.goto("/");
  // Wait for the app to be interactive.
  await expect(page.locator("#root")).toBeVisible();
});

test.describe("contentEditable shortcut filtering", () => {
  test("? shortcut does not open help panel when a contentEditable element is focused", async ({
    page,
  }) => {
    await injectContentEditable(page, "e2e-ce-test");

    // Press '?' — on US keyboards this is Shift+/.  The shortcut hook opens
    // the help dialog when no contentEditable is focused.
    await page.keyboard.press("Shift+/");

    // The help dialog must NOT appear because the contentEditable guard should
    // have suppressed the event before any shortcut handler ran.
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await removeContentEditable(page, "e2e-ce-test");
  });

  test("single-key shortcut (D) does not fire when a contentEditable element is focused", async ({
    page,
  }) => {
    await injectContentEditable(page, "e2e-ce-test-d");

    // Press 'd' with the element focused.  This should be a no-op — the
    // shortcut handler must not intercept the event.
    //
    // Awaiting page.evaluate() guarantees the keydown listener is registered
    // before the subsequent keyboard.press() fires the event.
    const E2E_KEY = "__e2eDefaultPrevented";
    await page.evaluate((key) => {
      const w = window as unknown as Record<string, unknown>;
      window.addEventListener(
        "keydown",
        (e) => {
          // Defer so the app's bubble-phase handler has already run.
          setTimeout(() => {
            w[key] = e.defaultPrevented;
          }, 0);
        },
        { once: true, capture: true },
      );
    }, E2E_KEY);

    await page.keyboard.press("d");

    // Wait for the deferred setTimeout(0) in the listener to write the result.
    await page.waitForFunction(
      (key) => key in (window as unknown as Record<string, unknown>),
      E2E_KEY,
    );
    const defaultPrevented = await page.evaluate(
      (key) => (window as unknown as Record<string, unknown>)[key],
      E2E_KEY,
    );
    // defaultPrevented will be false because the isTextInput guard returns
    // early without calling preventDefault().
    expect(defaultPrevented).toBe(false);

    await page.evaluate((key) => {
      delete (window as unknown as Record<string, unknown>)[key];
    }, E2E_KEY);
    await removeContentEditable(page, "e2e-ce-test-d");
  });
});
