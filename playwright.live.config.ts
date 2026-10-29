import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { defineConfig, devices } from "@playwright/test";

if (existsSync(".env.local")) loadEnvFile(".env.local");

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "PASTLY_TEST_USER_A_EMAIL",
  "PASTLY_TEST_USER_A_PASSWORD",
  "PASTLY_TEST_USER_B_EMAIL",
  "PASTLY_TEST_USER_B_PASSWORD",
];
if (
  process.env.PASTLY_INTEGRATION_CONFIRM !== "dedicated-test-project" ||
  required.some((key) => !process.env[key])
) {
  throw new Error(
    "Tests navigateur réels non exécutés : configurez le projet de test et les deux comptes dans .env.local.",
  );
}

export default defineConfig({
  testDir: "./e2e-live",
  outputDir: "./test-results/live",
  workers: 1,
  timeout: 120000,
  use: {
    baseURL: "http://127.0.0.1:3101",
    actionTimeout: 15000,
    navigationTimeout: 20000,
    channel: "chrome",
    // Les saisies de mots de passe ne doivent pas se retrouver dans une trace.
    trace: "off",
    video: "off",
    screenshot: "off",
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
      "npm run build && npm run start -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
