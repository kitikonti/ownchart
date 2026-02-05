import { test, expect } from "@playwright/test";

test.describe("Branding", () => {
  test("favicon loads correctly", async ({ page }) => {
    await page.goto("/");

    const favicon = await page.locator(
      'link[rel="icon"][type="image/svg+xml"]',
    );
    await expect(favicon).toHaveAttribute("href", "/icons/favicon.svg");

    const manifest = await page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute("href", "/manifest.json");
  });

  test("ribbon logo appears", async ({ page }) => {
    await page.goto("/");

    const logo = await page.locator('svg[aria-label="OwnChart"]');
    await expect(logo).toBeVisible();
  });

  test("manifest is valid", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);

    const json = await response?.json();
    expect(json.name).toBe("OwnChart");
    expect(json.icons.length).toBeGreaterThan(0);
  });

  test("theme color meta tag exists", async ({ page }) => {
    await page.goto("/");

    const themeColor = await page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute("content", "#0F6CBD");
  });
});
