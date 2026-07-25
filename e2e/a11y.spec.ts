import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility checks (axe-core) on the key user-facing pages.
 * Asserts zero serious/critical WCAG 2 A/AA violations — a meaningful gate that
 * catches real barriers (contrast, names, roles, landmarks) without failing on
 * minor/needs-review items. Runs in the seeded E2E job, so it navigates to a
 * destination/trail rather than hard-coding slugs.
 */

async function seriousViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  return results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
}

test.describe("accessibility (axe)", () => {
  test("home page", async ({ page }) => {
    await page.goto("/");
    const v = await seriousViolations(page);
    expect(v.map((x) => x.id).join(", ")).toBe("");
  });

  test("explore page", async ({ page }) => {
    await page.goto("/explore");
    const v = await seriousViolations(page);
    expect(v.map((x) => x.id).join(", ")).toBe("");
  });

  test("a destination page", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href^="/destinations/"]').first().click();
    await expect(page).toHaveURL(/\/destinations\/[a-z0-9-]+$/);
    const v = await seriousViolations(page);
    expect(v.map((x) => x.id).join(", ")).toBe("");
  });

  test("a trail page", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href^="/destinations/"]').first().click();
    await page.locator('a[href^="/trails/"]').first().click();
    await expect(page).toHaveURL(/\/trails\/[a-z0-9-]+$/);
    const v = await seriousViolations(page);
    expect(v.map((x) => x.id).join(", ")).toBe("");
  });
});
