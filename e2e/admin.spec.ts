import { test, expect } from "@playwright/test";

/**
 * Admin gate + sign-in (M6). Uses the interim password gate (default "admin" in
 * non-production; M7 replaces it with Google OAuth + is_admin). Verifies the
 * protected area is not reachable without a session and that sign-in works.
 */

test.describe("admin access control", () => {
  test("unauthenticated /admin redirects to the login page", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole("heading", { name: /Admin sign-in/i }),
    ).toBeVisible();
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/Admin password/i).fill("wrong-password");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/Incorrect password/i)).toBeVisible();
  });

  test("correct password signs in and reaches the dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/Admin password/i).fill("admin");
    await page.getByRole("button", { name: /Sign in/i }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: /Data health/i }),
    ).toBeVisible();
    // Protected nav is present.
    await expect(page.getByRole("link", { name: /Review queue/i })).toBeVisible();
  });
});
