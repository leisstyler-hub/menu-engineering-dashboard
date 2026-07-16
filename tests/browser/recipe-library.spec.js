import { expect, test } from "@playwright/test";

test("Menu Library opens without app protection or scoped-state crashes and shows Webtrition weight", async ({ page }) => {
  const pageErrors = [];

  page.on("pageerror", (error) => {
    if (!/Unexpected token '<'/i.test(error.message)) {
      pageErrors.push(error.message);
    }
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("culinaryToolsMenuEngineeringItems_v3", JSON.stringify([
      {
        id: "browser-smoke-recipe",
        mrn: "SMOKE-1",
        menu: "Browser Smoke Menu",
        station: "Menu Library",
        category: "Main Entree",
        recipeName: "Smoke Test Chicken",
        displayName: "Smoke Test Chicken",
        item: "Smoke Test Chicken",
        enticingDescription: "Browser smoke row used to verify the Menu Library opens.",
        allergens: ["Milk"],
        portion: "1 each",
        portionOz: 8,
        price: 11.75,
        trueCost: 2.57,
        calories: 375,
        protein_g: 36,
      },
    ]));
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: /open library/i })).toBeVisible();
  await page.getByRole("button", { name: /open library/i }).click();

  await expect(page.getByRole("heading", { name: /^Menu Library$/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Menu Index/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/8 oz/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Supabase|Server fallback|Local override/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Recipe instructions not attached yet", { exact: true })).toHaveCount(0);

  const itemCard = page.getByRole("button", { name: /Smoke Test Chicken/ }).first();
  await expect(itemCard).toBeVisible();
  const propertyLabels = itemCard.locator("[data-library-property-label]");
  await expect(propertyLabels).toHaveCount(5);
  const labelsFit = await propertyLabels.evaluateAll((labels) => labels.every((label) => (
    label.scrollWidth <= label.clientWidth
    && label.scrollHeight <= label.clientHeight
    && getComputedStyle(label).wordBreak !== "break-all"
  )));
  expect(labelsFit).toBe(true);

  await expect(page.getByText(/Something broke in this view/i)).toHaveCount(0);
  await expect(page.getByText(/databaseSource is not defined/i)).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});

test("curated menu banner and dish photo load together for Anisa", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("culinaryToolsMenuEngineeringItems_v3", JSON.stringify([
      {
        id: "browser-photo-anisa",
        mrn: "PHOTO-1",
        menu: "AMZ: Anisa",
        station: "Anisa",
        category: "Main Entree",
        recipeName: "Zaffron Ember Chicken Plate",
        displayName: "Zaffron Ember Chicken Plate",
        item: "Zaffron Ember Chicken Plate",
        portion: "1 each",
        price: 11.75,
        calories: 650,
        protein_g: 42,
      },
    ]));
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open library/i }).click();

  await expect(page.getByAltText("Anisa menu group photo")).toBeVisible({ timeout: 20_000 });
  const dishPhoto = page.getByAltText("zaffron ember chicken plate photo").first();
  await expect(dishPhoto).toBeVisible({ timeout: 20_000 });
  await expect(dishPhoto).toHaveAttribute("src", "/assets/recipe-library/anisa/zaffron-ember-chicken-plate.jpg");
});
