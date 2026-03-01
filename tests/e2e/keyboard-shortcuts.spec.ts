/**
 * E2E tests for keyboard shortcut filtering.
 *
 * These tests cover behaviour that cannot be reliably tested in jsdom — in
 * particular, the `target.isContentEditable` guard that suppresses all app
 * shortcuts when the user is typing inside a contentEditable element.
 */

import { test, expect } from "@playwright/test";

// Pre-dismiss the welcome tour so it never interferes with the tests.
test.use({
  storageState: undefined,
});

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
    // Inject a transparent contentEditable div and move keyboard focus into it.
    await page.evaluate(() => {
      const div = document.createElement("div");
      div.setAttribute("contenteditable", "true");
      div.setAttribute("id", "e2e-ce-test");
      div.style.cssText =
        "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;";
      document.body.appendChild(div);
      div.focus();
    });

    // Confirm our element has focus before sending keys.
    const isFocused = await page.evaluate(
      () => document.activeElement?.id === "e2e-ce-test",
    );
    expect(isFocused).toBe(true);

    // Press '?' — on US keyboards this is Shift+/.  The shortcut hook opens
    // the help dialog when no contentEditable is focused.
    await page.keyboard.press("Shift+/");

    // The help dialog must NOT appear because the contentEditable guard should
    // have suppressed the event before any shortcut handler ran.
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Cleanup.
    await page.evaluate(() => {
      document.getElementById("e2e-ce-test")?.remove();
    });
  });

  test("single-key shortcut (D) does not fire when a contentEditable element is focused", async ({
    page,
  }) => {
    // Inject contentEditable and focus it.
    await page.evaluate(() => {
      const div = document.createElement("div");
      div.setAttribute("contenteditable", "true");
      div.setAttribute("id", "e2e-ce-test-d");
      div.style.cssText =
        "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;";
      document.body.appendChild(div);
      div.focus();
    });

    const isFocused = await page.evaluate(
      () => document.activeElement?.id === "e2e-ce-test-d",
    );
    expect(isFocused).toBe(true);

    // Press 'd' with the element focused.  This should be a no-op — the
    // shortcut handler must not intercept the event.
    const defaultPrevented = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          // Listen in the capture phase so we run first; we resolve after the
          // bubble phase has completed (setTimeout 0) to include the app's
          // bubble-phase handler result.
          window.addEventListener(
            "keydown",
            (e) => {
              setTimeout(() => resolve(e.defaultPrevented), 0);
            },
            { once: true, capture: true },
          );
        }),
    );

    await page.keyboard.press("d");
    // defaultPrevented will be false because the isTextInput guard returns
    // early without calling preventDefault().
    expect(await defaultPrevented).toBe(false);

    await page.evaluate(() => {
      document.getElementById("e2e-ce-test-d")?.remove();
    });
  });
});
