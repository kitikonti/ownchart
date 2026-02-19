import { test, expect, devices } from "@playwright/test";

test.describe("Mobile block screen", () => {
  test("shows block screen on mobile device", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPhone 13"],
    });
    const page = await context.newPage();
    await page.goto("/");

    await expect(
      page.getByText("Desktop browser required")
    ).toBeVisible();
    await expect(page.getByText("ownchart.app")).toBeVisible();

    await context.close();
  });

  test("'Continue anyway' dismisses block screen", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPhone 13"],
    });
    const page = await context.newPage();
    await page.goto("/");

    await page.getByText("Continue anyway").click();

    await expect(
      page.getByText("Desktop browser required")
    ).not.toBeVisible();

    await context.close();
  });

  test("does not show block screen on desktop", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText("Desktop browser required")
    ).not.toBeVisible();
  });
});
