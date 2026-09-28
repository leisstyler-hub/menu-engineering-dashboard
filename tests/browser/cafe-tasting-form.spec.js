import { expect, test } from "@playwright/test";
async function prepareCafeTastingPage(page, { installed = false, ios = false } = {}) {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.addInitScript(({ installedMode, iosMode }) => {
    window.sessionStorage.setItem("culinaryToolsBrandEntranceSeen", "true");
    if (iosMode) {
      Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1" });
    }
    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const result = originalMatchMedia(query);
      Object.defineProperty(result, "matches", {
        configurable: true,
        value: query.includes("max-width: 1024px")
          || query.includes("pointer: coarse")
          || (installedMode && query.includes("display-mode: standalone")),
      });
      return result;
    };
  }, { installedMode: installed, iosMode: ios });
}

test("Cafe Tasting groups and deduplicates items and shows inferred submission info", async ({ page }) => {
  await prepareCafeTastingPage(page);
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
  await expect(page.getByLabel("Cafe Name").locator("option")).toHaveText(["Select a cafe", "test cafe"]);
  await page.getByLabel("Cafe Name").selectOption("test cafe");
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
test("Cafe Tasting discreetly recommends home-screen install and keeps a manual path after session dismissal", async ({ page }) => {
  await prepareCafeTastingPage(page);

  await page.goto("/?tool=cafeTasting");

  await expect(page.getByRole("img", { name: "Compass One Culinary" })).toBeVisible();
  await expect(page.getByText("Keep Cafe Tasting handy", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Home Screen" })).toBeVisible();

  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByText("Keep Cafe Tasting handy", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Install app" })).toBeVisible();

  await page.reload();
  await expect(page.getByText("Keep Cafe Tasting handy", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Install app" }).click();
  await expect(page.getByRole("dialog", { name: "Install Cafe Tasting" })).toBeVisible();
});

test("Cafe Tasting persistent opt-out survives reload while the manual install button remains", async ({ page }) => {
  await prepareCafeTastingPage(page);

  await page.goto("/?tool=cafeTasting");
  await page.getByRole("button", { name: "Don't ask again" }).click();

  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("cafeTastingInstallPromptDismissed"))).toBe("true");
  await page.reload();
  await expect(page.getByText("Keep Cafe Tasting handy", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Install app" })).toBeVisible();
});

test("Cafe Tasting suppresses install controls when already installed", async ({ page }) => {
  await prepareCafeTastingPage(page, { installed: true });

  await page.goto("/?tool=cafeTasting");

  await expect(page.getByText("Keep Cafe Tasting handy", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Install app" })).toHaveCount(0);
});

test("Cafe Tasting gives iPad home-screen instructions when native install is unavailable", async ({ page }) => {
  await prepareCafeTastingPage(page, { ios: true });

  await page.goto("/?tool=cafeTasting");
  await page.getByRole("button", { name: "Add to Home Screen" }).click();

  const dialog = page.getByRole("dialog", { name: "Install Cafe Tasting" });
  await expect(dialog).toContainText("Share");
  await expect(dialog).toContainText("Add to Home Screen");
});
