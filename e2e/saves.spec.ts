import { test, expect } from "@playwright/test";

/**
 * Auth + saved destinations (M7). Uses the non-production dev-login endpoint to
 * get a real database session without live Google OAuth. Covers the PRD's core
 * "qualified save" flow: sign in → save a destination → see it on /saved.
 */

test.describe("saved destinations", () => {
  test("signed-out save shows a sign-in prompt, not a broken action", async ({
    page,
  }) => {
    await page.goto("/destinations/zion-narrows-basecamp");
    await expect(
      page.getByRole("link", { name: /Save this destination/i }),
    ).toBeVisible();
  });

  test("sign in → save → appears on /saved → unsave", async ({ page }) => {
    // Dev login (non-production only) mints a DB session.
    await page.goto(
      "/api/dev-login?next=" + encodeURIComponent("/destinations/zion-narrows-basecamp"),
    );
    await expect(page).toHaveURL(/\/destinations\/zion-narrows-basecamp/);

    // Header reflects the signed-in state.
    await expect(page.getByRole("link", { name: "Saved" })).toBeVisible();

    // Save it.
    await page.getByRole("button", { name: /^♡ Save$/ }).click();
    await expect(page.getByRole("button", { name: /♥ Saved/ })).toBeVisible();

    // It shows on the saved page.
    await page.goto("/saved");
    await expect(
      page.getByRole("link", { name: /Zion Narrows Basecamp/i }),
    ).toBeVisible();

    // Unsave from the destination page.
    await page.goto("/destinations/zion-narrows-basecamp");
    await page.getByRole("button", { name: /♥ Saved/ }).click();
    await expect(page.getByRole("button", { name: /^♡ Save$/ })).toBeVisible();
  });

  test("account data export downloads JSON without secrets", async ({
    page,
  }) => {
    await page.goto("/api/dev-login?next=" + encodeURIComponent("/account"));
    // page.request shares the browser context's session cookie.
    const res = await page.request.get("/api/account/export");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.profile).toBeTruthy();
    expect(JSON.stringify(body)).not.toMatch(/access_token|id_token|refresh_token/);
  });
});
