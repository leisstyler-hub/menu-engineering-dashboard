import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

const savedDescription = "Updated by browser smoke through the Supabase save path.";

function summaryPayload() {
  return {
    ok: true,
    source: "supabase-recipe-items",
    scope: "summary",
    menus: [
      {
        menu: "AMZ: Smoke Menu",
        count: 1,
        categories: 1,
        quality: {
          total: 1,
          priced: 1,
          costed: 1,
          described: 1,
          allergenRows: 1,
          photoRows: 0,
          missingPhotoRows: 1,
          priceCoverage: 100,
          costCoverage: 100,
          descriptionCoverage: 100,
          allergenCoverage: 100,
          photoCoverage: 0,
        },
      },
    ],
    summary: {
      total: 1,
      priced: 1,
      costed: 1,
      described: 1,
      allergenRows: 1,
      photoRows: 0,
      missingPhotoRows: 1,
      priceCoverage: 100,
      costCoverage: 100,
      descriptionCoverage: 100,
      allergenCoverage: 100,
      photoCoverage: 0,
    },
  };
}

function smokeRow(description = "Original smoke description.") {
  return {
    id: "smoke-item-1",
    item_key: "smoke-item-1",
    mrn: "SMOKE-123",
    menu: "AMZ: Smoke Menu",
    station: "Smoke Station",
    category: "entree",
    recipeCategory: "Main Entree > Chicken Entree",
    recipeName: "Smoke Test Chicken",
    displayName: "Smoke Test Chicken",
    item: "Smoke Test Chicken",
    enticingDescription: description,
    allergenSummary: "Milk",
    allergens: ["Milk"],
    portion: "8 ounce",
    price: 11.75,
    trueCost: 3.25,
    calories: 410,
    protein_g: 38,
    recipeDocuments: [],
    dataSource: "supabase-recipe-library",
  };
}

test("Recipe Library edit saves through the Supabase API path", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const posts = [];

  await page.route("**/api/recipe-library?**", async (route) => {
    const url = new URL(route.request().url());
    const scope = url.searchParams.get("scope");
    if (scope === "summary") {
      await route.fulfill({ json: summaryPayload() });
      return;
    }
    await route.fulfill({
      json: {
        ...summaryPayload(),
        scope: "menu",
        selectedMenu: "AMZ: Smoke Menu",
        selectedSummary: summaryPayload().summary,
        rows: [smokeRow()],
      },
    });
  });

  await page.route("**/api/recipe-library", async (route) => {
    const body = route.request().postDataJSON();
    posts.push(body);
    await route.fulfill({
      json: {
        ok: true,
        source: "supabase-recipe-items",
        message: "Recipe Library card saved to Supabase.",
        row: smokeRow(body.patch.description),
      },
    });
  });

  await openTool(page, /open library/i, /^Recipe Library$/);
  await expect(page.getByText("Supabase")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Smoke Test Chicken/i }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("heading", { name: /Smoke Test Chicken/i })).toBeVisible();
  await page.getByRole("button", { name: /Edit card/i }).click();
  await drawer.getByLabel("Description").fill(savedDescription);
  await page.getByRole("button", { name: /Save card/i }).click();

  await expect(page.getByText("Recipe Library card saved to Supabase.")).toBeVisible({ timeout: 20_000 });
  expect(posts).toHaveLength(1);
  expect(posts[0]).toMatchObject({
    action: "updateRecipeItem",
    patch: { description: savedDescription },
  });
  expect(posts[0].itemKey).toContain("smoke-item-1");
  await expect(drawer.getByText(savedDescription).first()).toBeVisible();
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
