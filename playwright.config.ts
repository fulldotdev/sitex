import { createArgosReporterOptions } from "@argos-ci/playwright/reporter"
import { defineConfig } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL
if (process.env.GITHUB_ACTIONS && !baseURL) {
  throw new Error("GitHub browser tests require an exact Netlify deployment")
}

export default defineConfig({
  testDir: "./tests",
  forbidOnly: !!process.env.CI,
  workers: 2,
  reporter: [
    ["list"],
    [
      "@argos-ci/playwright/reporter",
      createArgosReporterOptions({
        uploadToArgos: !!process.env.CI,
      }),
    ],
  ],
  use: {
    baseURL: baseURL || "http://127.0.0.1:4175",
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "nl-NL",
    timezoneId: "Europe/Amsterdam",
    screenshot: "only-on-failure",
    launchOptions: {
      args: ["--disable-lcd-text", "--font-render-hinting=none"],
    },
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "mobile-webkit",
      // A compact engine check. This is not a physical iPhone.
      grep: /(?:^|\s)(?:homepage|\/|\/contact\/?)$/,
      use: {
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        launchOptions: {},
      },
    },
  ],
  webServer: baseURL
    ? undefined
    : {
        command:
          "pnpm --filter docs exec vp preview --host 127.0.0.1 --port 4175",
        url: "http://127.0.0.1:4175",
      },
})
