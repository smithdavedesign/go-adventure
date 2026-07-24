import { test, expect } from "@playwright/test";

/**
 * Walking-skeleton discovery flow + the binding zero-result relaxation behavior.
 *
 * The relaxation test is a PRD launch requirement (Search: Zero-Result Constraint
 * Relaxation — "The zero-result + relaxation state is a required Playwright test
 * case"). It asserts the app never shows a hard dead-end "no results" state for a
 * filter combination the corpus can satisfy after relaxing one constraint.
 *
 * Assumes the seed corpus (npm run db:seed): Mount Whitney is the only "expert"
 * destination and its budget ($700+) exceeds $250, so expert + ≤$250 has zero
 * exact matches but recovers by relaxing budget.
 */

test.describe("discovery walking skeleton", () => {
  test("home → destination → trail is reachable in a few clicks", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /start with the adventure/i }),
    ).toBeVisible();

    // One click from home to a destination card (whichever is featured first).
    await page.locator('a[href^="/destinations/"]').first().click();
    await expect(page).toHaveURL(/\/destinations\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Into the destination's first listed trail.
    await page.locator('a[href^="/trails/"]').first().click();
    await expect(page).toHaveURL(/\/trails\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("explore shows all seeded destinations with no filters", async ({
    page,
  }) => {
    await page.goto("/explore");
    // 6 seeded destinations → at least several cards present.
    const cards = page.locator('a[href^="/destinations/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(6);
  });

  test("keyword search narrows results and tolerates a typo", async ({
    page,
  }) => {
    await page.goto("/explore");
    await page.getByRole("searchbox", { name: /search destinations/i }).fill("zionn");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/q=zionn/);
    await expect(
      page.getByRole("link", { name: /Zion Narrows Basecamp/i }),
    ).toBeVisible();
  });
});

test.describe("zero-result constraint relaxation (binding PRD requirement)", () => {
  test("relaxes the strictest constraint instead of a dead-end no-results", async ({
    page,
  }) => {
    // Expert difficulty under $250 has no exact match in the seed corpus.
    await page.goto("/explore?difficulty=expert&maxBudget=250");

    // NEVER a hard dead end.
    await expect(page.getByText(/^No results found$/i)).toHaveCount(0);

    // Transparency banner is shown and labeled.
    const banner = page.getByRole("status");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/no exact matches/i);

    // The relaxed constraint is shown as a removable chip.
    const chip = page.getByRole("button", { name: /Remove filter: Budget up to \$250/i });
    await expect(chip).toBeVisible();

    // And real results are shown (the expert destination, with budget relaxed).
    await expect(
      page.getByRole("link", { name: /Mount Whitney Approach/i }),
    ).toBeVisible();

    // Removing the chip commits the relaxation: budget leaves the URL, the
    // non-relaxed constraint (difficulty) stays.
    await chip.click();
    await expect(page).toHaveURL(/difficulty=expert/);
    await expect(page).not.toHaveURL(/maxBudget/);
  });

  test("a truly impossible search still offers a path forward, never a dead end", async ({
    page,
  }) => {
    await page.goto("/explore?q=zzzznomatch");
    await expect(
      page.getByRole("link", { name: /Explore all destinations/i }),
    ).toBeVisible();
  });
});
