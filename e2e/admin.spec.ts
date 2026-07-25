import { test, expect } from "@playwright/test";

/**
 * Admin gate + sign-in (M7). The gate is now an authenticated Auth.js session
 * carrying the `isAdmin` role (replaces the interim password gate). E2E signs
 * in via the non-production /api/dev-login helper, which mints a real DB session
 * (admin=1 sets the role) — the same path used for the saved-destinations flow.
 */

test.describe("admin access control", () => {
  test("unauthenticated /admin redirects to the sign-in page", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole("heading", { name: /Admin sign-in/i }),
    ).toBeVisible();
    // The Google sign-in affordance is present (no password field anymore).
    await expect(
      page.getByRole("button", { name: /Sign in with Google/i }),
    ).toBeVisible();
  });

  test("a signed-in NON-admin is refused and told why", async ({ page }) => {
    // Mint an ordinary (non-admin) session, then try to reach /admin.
    await page.goto("/api/dev-login?email=plainuser@example.com&next=/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByText(/doesn.t have admin access/i)).toBeVisible();
  });

  test("an admin session reaches the dashboard", async ({ page }) => {
    // Mint an admin session and land on the dashboard.
    await page.goto("/api/dev-login?email=admin@example.com&admin=1&next=/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: /Data health/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Review queue/i })).toBeVisible();
  });
});
