import { argosScreenshot } from "@argos-ci/playwright"
import { expect, test } from "@playwright/test"

const pages = [
  "/",
  "/docs/",
  "/docs/installation/",
  "/docs/pages/",
  "/docs/layouts/",
  "/docs/components/",
  "/docs/components/section/",
  "/docs/components/typography/",
  "/docs/components/header/",
  "/docs/components/tile/"
]

for (const path of pages) {
  test(path, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await argosScreenshot(page, path === "/" ? "home" : path.replace(/^\/|\/$/g, ""))
  })
}
