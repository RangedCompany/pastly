import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-google",
  outputDir: "./test-results/google",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3102",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command:
      "npm run build && npm run start -- --hostname 127.0.0.1 --port 3102",
    url: "http://127.0.0.1:3102",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      // No remote project: the browser intercepts the outgoing authorize request.
      NEXT_PUBLIC_SUPABASE_URL: "https://google-auth-test.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3102",
      NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "true",
    },
  },
});
