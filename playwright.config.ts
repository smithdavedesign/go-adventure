import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Tests live in ./e2e (outside src/, so Vitest doesn't pick them up).
 *
 * The app under test reads the database, so the local Postgres+PostGIS container
 * must be up and seeded (`docker compose up -d && npm run db:seed`) before
 * running. In CI the e2e job provisions and seeds a Postgres service first.
 */
const PORT = 3101;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "line",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
