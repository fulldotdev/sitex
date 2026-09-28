import { argosScreenshot } from "@argos-ci/playwright";
import { expect, test } from "@playwright/test";

const pages = ["/", "/docs/installation/", "/docs/components/header/"];
for (const path of pages) {
  test(path, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await argosScreenshot(
      page,
      path === "/" ? "home" : path.replace(/^\/|\/$/g, ""),
    );
  });
}
