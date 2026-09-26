import { expect, test } from "@playwright/test";

test("Cafe Tasting groups and deduplicates items and shows inferred submission info", async ({ page }) => {
  await page.route("**/api/smartsheet/records?dataset=cafe-tasting&diagnostic=columns", (route) => route.fulfill({ json: { ok: true, rawColumns: [
    { title: "Cafe Name", options: ["test cafe"] },
    { title: "Station Name", options: ["Global", "Salad"] },
    { title: "Taster", contactOptions: [{ email: "one@example.com", name: "One" }] },
  ] } }));
  await page.route("**/api/smartsheet/records?dataset=cafe-tasting-routing", (route) => route.fulfill({ json: { ok: true, records: [{ __smartsheetRowId: 1, Cafe: "test cafe", "Chef Contact": "chef@example.com", "Director Contact": "director@example.com" }] } }));
  await page.route("**/api/recipe-library?scope=summary", (route) => route.fulfill({ json: { menus: [{ menu: "AMZ: Greens & Grains" }] } }));
  await page.route("**/api/recipe-library?scope=menu*", (route) => route.fulfill({ json: { rows: [
    { id: 1, displayName: "Chicken", category: "entree", portionOz: 6 },
    { id: 2, displayName: "Chicken", category: "entree", portionOz: 6 },
    { id: 3, displayName: "Rice", category: "side", portionOz: 4 },
    { id: 4, displayName: "Sauce", category: "subRecipe", portionOz: 1 },
    { id: 5, displayName: "Cookie", category: "extension", portionOz: 2 },
  ] } }));

  await page.goto("/?tool=cafeTasting");
  await page.getByLabel("Cafe Name").fill("test cafe");
  await page.getByLabel("Menu").selectOption("AMZ: Greens & Grains");

  const selector = page.getByLabel("Entree / Item 1");
  await expect(selector.locator("optgroup")).toHaveCount(4);
  await expect(selector.locator("optgroup").evaluateAll((groups) => groups.map((group) => group.label))).resolves.toEqual(["Entree", "Sides", "Sub Recipes", "Extensions"]);
  await expect(selector.locator("option", { hasText: "Chicken (6 oz)" })).toHaveCount(1);
  await expect(page.getByLabel("Station Name")).toHaveCount(0);
  await expect(page.getByText("Submission Info", { exact: true })).toBeVisible();
  await expect(page.getByText("Salad", { exact: true })).toBeVisible();
  await expect(page.getByText(/chef@example.com/)).toBeVisible();
  await expect(page.getByText(/director@example.com/)).toBeVisible();
});
