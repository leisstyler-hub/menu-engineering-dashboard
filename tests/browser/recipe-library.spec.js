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
  await expect(itemCard.getByText("36g", { exact: true })).toHaveCount(2);
  await expect(itemCard.getByText("36g protein")).toHaveCount(0);
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

test("mobile Menu Library item detail drawer scrolls through all tabs to bottom content and stays closable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem("culinaryToolsMenuEngineeringItems_v3", JSON.stringify([
      {
        id: "mobile-drawer-scroll",
        mrn: "MOBILE-2",
        menu: "AMZ: Anisa",
        station: "Anisa",
        category: "Main Entree",
        recipeName: "Zaffron Ember Chicken Plate",
        displayName: "Zaffron Ember Chicken Plate",
        item: "Zaffron Ember Chicken Plate",
        enticingDescription: "Mobile drawer scroll coverage row with enough detail to exercise the card drawer.",
        allergens: ["Milk", "Wheat"],
        portion: "1 each",
        portionOz: 8,
        price: 11.75,
        trueCost: 2.57,
        calories: 650,
        protein_g: 42,
      },
    ]));
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open library/i }).click();
  await page.getByRole("button", { name: /Zaffron Ember Chicken Plate/i }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Zaffron Ember Chicken Plate/i })).toBeVisible();

  const drawer = dialog.locator(".recipe-library-drawer");
  const geometry = await drawer.evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
    documentOverflowsHorizontally: document.documentElement.scrollWidth > window.innerWidth,
  }));
  expect(geometry.scrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.clientWidth);
  expect(geometry.documentOverflowsHorizontally, JSON.stringify(geometry)).toBe(false);
  expect(geometry.scrollHeight, JSON.stringify(geometry)).toBeGreaterThan(geometry.clientHeight);

  const scrollDrawerToBottom = () => drawer.evaluate((node) => {
    node.scrollTo(0, node.scrollHeight);
    return { scrollTop: node.scrollTop, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight };
  });

  const inPhoneViewport = async (locator) => locator.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  });

  const afterFirstScroll = await scrollDrawerToBottom();
  expect(afterFirstScroll.scrollTop + afterFirstScroll.clientHeight, JSON.stringify(afterFirstScroll)).toBeGreaterThanOrEqual(afterFirstScroll.scrollHeight - 2);
  const nutritionTab = dialog.getByRole("button", { name: /^nutrition$/i });
  expect(await inPhoneViewport(nutritionTab), "nutrition tab should stay reachable via the sticky tab bar after scrolling").toBe(true);

  await nutritionTab.click();
  await scrollDrawerToBottom();
  const cholesterolLabel = dialog.getByText("Cholesterol", { exact: true });
  expect(await inPhoneViewport(cholesterolLabel), "bottom nutrition row should be reachable by scrolling").toBe(true);

  await dialog.getByRole("button", { name: /^files$/i }).click();
  await scrollDrawerToBottom();
  const recipeFileSlot = dialog.getByText("No recipe uploaded", { exact: true });
  expect(await inPhoneViewport(recipeFileSlot), "Files tab bottom content should be reachable by scrolling").toBe(true);

  const persistentClose = page.getByRole("button", { name: "Close library card (persistent)" });
  await expect(persistentClose).toBeVisible();
  expect(await inPhoneViewport(persistentClose), "persistent close control should stay reachable after scrolling").toBe(true);
  await persistentClose.click();
  await expect(dialog).toHaveCount(0);
});

test("mobile Menu Library persistent close control stays hidden until scrolled past the header and never overlaps the header close button or food photo", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem("culinaryToolsMenuEngineeringItems_v3", JSON.stringify([
      {
        id: "mobile-drawer-photo-overlap",
        mrn: "PHOTO-MOBILE-1",
        menu: "AMZ: Anisa",
        station: "Anisa",
        category: "Main Entree",
        recipeName: "Zaffron Ember Chicken Plate",
        displayName: "Zaffron Ember Chicken Plate",
        item: "Zaffron Ember Chicken Plate",
        enticingDescription: "Photo-present mobile drawer overlap coverage row.",
        allergens: ["Milk", "Wheat"],
        portion: "1 each",
        portionOz: 8,
        price: 11.75,
        trueCost: 2.57,
        calories: 650,
        protein_g: 42,
      },
    ]));
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open library/i }).click();
  await page.getByRole("button", { name: /Zaffron Ember Chicken Plate/i }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Zaffron Ember Chicken Plate/i })).toBeVisible();

  const headerClose = dialog.getByRole("button", { name: "Close library card", exact: true });
  const persistentClose = page.getByRole("button", { name: "Close library card (persistent)" });
  const dishPhoto = dialog.getByAltText("zaffron ember chicken plate photo");
  await expect(dishPhoto).toBeVisible({ timeout: 20_000 });
  await expect(headerClose).toBeVisible();
  await expect(persistentClose).toHaveCount(0);

  const drawer = dialog.locator(".recipe-library-drawer");
  await drawer.evaluate((node) => node.scrollTo(0, node.scrollHeight));
  await expect(persistentClose).toBeVisible();

  const overlap = await dialog.evaluate((node) => {
    const persistent = node.querySelector('[aria-label="Close library card (persistent)"]');
    const header = node.querySelector('[aria-label="Close library card"]');
    const photo = node.querySelector('img[alt="zaffron ember chicken plate photo"]');
    const intersects = (first, second) => {
      const a = first.getBoundingClientRect();
      const b = second.getBoundingClientRect();
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    };
    return {
      closeOverlapsHeader: intersects(persistent, header),
      closeOverlapsPhoto: intersects(persistent, photo),
    };
  });
  expect(overlap.closeOverlapsHeader, JSON.stringify(overlap)).toBe(false);
  expect(overlap.closeOverlapsPhoto, JSON.stringify(overlap)).toBe(false);

  await persistentClose.click();
  await expect(dialog).toHaveCount(0);
});

test("desktop Menu Library item detail drawer keeps its existing layout and hides the mobile-only close control", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    window.localStorage.setItem("culinaryToolsMenuEngineeringItems_v3", JSON.stringify([
      {
        id: "desktop-drawer-check",
        mrn: "DESKTOP-1",
        menu: "AMZ: Anisa",
        station: "Anisa",
        category: "Main Entree",
        recipeName: "Zaffron Ember Chicken Plate",
        displayName: "Zaffron Ember Chicken Plate",
        item: "Zaffron Ember Chicken Plate",
        enticingDescription: "Desktop drawer regression row.",
        allergens: ["Milk", "Wheat"],
        portion: "1 each",
        portionOz: 8,
        price: 11.75,
        trueCost: 2.57,
        calories: 650,
        protein_g: 42,
      },
    ]));
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open library/i }).click();
  await page.getByRole("button", { name: /Zaffron Ember Chicken Plate/i }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Zaffron Ember Chicken Plate/i })).toBeVisible();

  await expect(dialog.getByRole("button", { name: /^overview$/i })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^nutrition$/i })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^files$/i })).toBeVisible();

  const drawer = dialog.locator(".recipe-library-drawer");
  await expect(drawer).toHaveCSS("overflow-y", "hidden");
  const bodyOverflowY = await drawer.evaluate((node) => getComputedStyle(node.lastElementChild).overflowY);
  expect(bodyOverflowY).toBe("auto");

  await expect(page.getByRole("button", { name: "Close library card (persistent)" })).toBeHidden();

  await dialog.getByRole("button", { name: "Close library card", exact: true }).click();
  await expect(dialog).toHaveCount(0);
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
