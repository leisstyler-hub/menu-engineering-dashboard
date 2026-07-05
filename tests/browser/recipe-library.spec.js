import { expect, test } from "@playwright/test";

test("Recipe Library opens without app protection or scoped-state crashes", async ({ page }) => {
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
        station: "Recipe Library",
        category: "Main Entree",
        recipeName: "Smoke Test Chicken",
        displayName: "Smoke Test Chicken",
        item: "Smoke Test Chicken",
        enticingDescription: "Browser smoke row used to verify the Recipe Library opens.",
        allergens: ["Milk"],
        portion: "1 each",
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

  await expect(page.getByRole("heading", { name: /^Recipe Library$/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Menu Index/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Supabase|Server fallback|Local override/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Something broke in this view/i)).toHaveCount(0);
  await expect(page.getByText(/databaseSource is not defined/i)).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});
