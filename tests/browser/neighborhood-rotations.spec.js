import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";
import { SMARTSHEET_DATABASE_STORAGE_KEY } from "../../src/integrations/smartsheet/contract.js";

const districts = {
  South: ["Doppler", "Day 1", "Nitro", "Re:Invent"],
  North: ["Dawson", "Nessie", "Cricket", "Moby", "Commissary", "Atlas"],
  East: ["Astra", "Bingo", "Sonic", "Blueshift", "Eclipse", "Grace"],
  LAX: ["LAX22", "LAX35", "LAX75", "LAX78", "SNA3"],
};

const futureWeeks = ["Jul 13, 2026 - Jul 17, 2026", "Jul 20, 2026 - Jul 24, 2026"];
const smokeMenuItems = [
  { menu: "AMZ: Ohana", station: "Premium Mains", item: "Huli Huli Chicken", category: "entree", price: 11.75 },
  { menu: "AMZ: Ohana", station: "Sides", item: "Mac Salad", category: "side", price: 2.55 },
  { menu: "AMZ: Lotus", station: "Premium Mains", item: "Pork Hung Lay", category: "entree", price: 11.75 },
  { menu: "AMZ: Lotus", station: "Sides", item: "Papaya Salad", category: "side", price: 2.55 },
  { menu: "AMZ: Saffron", station: "Premium Mains", item: "Chicken Apricot Tagine", category: "entree", price: 11.75 },
  { menu: "AMZ: Saffron", station: "Sides", item: "Citrus Almond Rice", category: "side", price: 2.55 },
  { menu: "AMZ: Maya", station: "Premium Mains", item: "Chicken Adobo", category: "entree", price: 11.75 },
  { menu: "AMZ: Chang Mai", station: "Premium Mains", item: "Pork Hung Lay", category: "entree", price: 11.75 },
  { menu: "AMZ: Grill Core", station: "Location Spotlights", item: "Char Siu Pork", category: "entree", price: 11.75 },
  { menu: "AMZ: Cafe Express Curated Salads", station: "Curated Salads", item: "Baja Crunch Salad", category: "entree", price: 11.45 },
  { menu: "AMZ: Cafe Express Curated Sandwiches", station: "Curated Sandwiches", item: "Chicken Caesar Wrap", category: "entree", price: 9.9 },
  { menu: "AMZ: Fish Market", station: "Fish Market", item: "Steelhead Croquettes", category: "entree", price: 11.75 },
  { menu: "AMZ: Fresh Five", station: "Grill", item: "Fresh 5 Black Bean Burger", category: "entree", price: 5 },
];

function exactName(name) {
  return new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

async function stubEmptyRotationBackbone(page, { onStorageWrite = null, getStorageRecords = null } = {}) {
  await page.route("**/api/recipe-library**", async (route) => {
    await route.fulfill({
      json: {
        ok: true,
        source: "browser-smoke-menuworks",
        rows: smokeMenuItems,
      },
    });
  });
  await page.route("**/api/storage/records**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: {
          ok: true,
          state: "synced",
          source: "supabase",
          records: getStorageRecords ? getStorageRecords() : [],
          count: getStorageRecords ? getStorageRecords().length : 0,
          message: `Loaded ${getStorageRecords ? getStorageRecords().length : 0} smoke rotation rows.`,
        },
      });
      return;
    }
    if (onStorageWrite) {
      onStorageWrite(route.request().postDataJSON());
    }
    await route.fulfill({ json: { ok: true, source: "supabase", records: [] } });
  });
  await page.route("**/api/smartsheet/records**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { ok: true, records: [] } });
      return;
    }
    await route.fulfill({ json: { ok: true, message: "Smartsheet smoke stub." } });
  });
}

test("Neighborhood Rotations opens planner and gives a visible blocked-submit reason", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);

  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("button", { name: /^Doppler$/i }).click();

  await expect(page.getByRole("heading", { name: /^Doppler$/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Planner Remote Control/i)).toBeVisible();
  await expect(page.getByText(/Global Rotation/i)).toBeVisible();

  const submitButton = page.getByRole("button", { name: /Submit/i });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toHaveAttribute("aria-disabled", "true");
  await expect(submitButton).toHaveAttribute("title", /Global Menu|entree|station/i);
  await expect(page.getByText(/Submit blocked/i)).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Neighborhood Rotations opens every cafe selector for future weeks", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubEmptyRotationBackbone(page);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);

  for (const week of futureWeeks) {
    await page.locator("select").first().selectOption({ label: week });

    for (const [district, cafes] of Object.entries(districts)) {
      await page.getByRole("button", { name: exactName(district) }).click();

      for (const cafe of cafes) {
        await page.getByRole("button", { name: exactName(cafe) }).click();
        await expect(page.getByRole("heading", { name: exactName(cafe) })).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(/Planner Remote Control/i)).toBeVisible();
        await expect(page.getByText(/System Status/i)).toBeVisible();
        await expectNoAppProtection(page);
      }
    }
  }

  expectNoUnexpectedPageErrors(pageErrors);
});

test("Neighborhood Rotations opens Re:Invent when browser storage cannot cache Smartsheet records", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubEmptyRotationBackbone(page);
  await page.addInitScript((storageKey) => {
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = (key, value) => {
      if (key === storageKey) {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      }
      return originalSetItem(key, value);
    };
  }, SMARTSHEET_DATABASE_STORAGE_KEY);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: exactName("South") }).click();
  await page.getByRole("button", { name: exactName("Re:Invent") }).click();

  await expect(page.getByRole("heading", { name: /^Re:Invent$/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Planner Remote Control/i)).toBeVisible();
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Split-global future week selectors remove menus already chosen in another block", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubEmptyRotationBackbone(page);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);

  for (const cafe of ["Re:Invent", "Blueshift"]) {
    await page.getByRole("button", { name: cafe === "Re:Invent" ? exactName("South") : exactName("East") }).click();
    await page.locator("select").first().selectOption({ label: "Jul 20, 2026 - Jul 24, 2026" });
    await page.getByRole("button", { name: exactName(cafe) }).click();
    await expect(page.getByRole("heading", { name: exactName(cafe) })).toBeVisible({ timeout: 20_000 });

    const selects = page.locator("select");
    const firstBlockMenu = selects.nth(1);
    const secondBlockMenu = selects.nth(2);
    const menuValue = await firstBlockMenu.evaluate((select) => Array.from(select.options).find((option) => option.value)?.value || "");

    expect(menuValue).not.toBe("");
    await firstBlockMenu.selectOption(menuValue);
    await expect.poll(async () => secondBlockMenu.evaluate((select) => Array.from(select.options).map((option) => option.value))).not.toContain(menuValue);
    await expectNoAppProtection(page);
  }

  expectNoUnexpectedPageErrors(pageErrors);
});

test("Cafes without a Global station are never blocked by Global requirements", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubEmptyRotationBackbone(page);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: exactName("North") }).click();

  for (const cafe of ["Commissary", "Atlas"]) {
    await page.getByRole("button", { name: exactName(cafe) }).click();
    await expect(page.getByRole("heading", { name: exactName(cafe) })).toBeVisible({ timeout: 20_000 });
    const blocker = page.getByText(/Submit is blocked until these are fixed/i).locator("xpath=..", { hasText: /Add at least one item/i });
    await expect(blocker).toBeVisible();
    await expect(blocker).not.toContainText(/Global Menu|Global entree/i);
  }

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Dawson Carvery promotion override replaces normal Carvery fields and saves isolated promo rows", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const storageWrites = [];
  let storedRecords = [];
  await stubEmptyRotationBackbone(page, {
    onStorageWrite: (body) => {
      storageWrites.push(body);
      storedRecords = body.records || [];
    },
    getStorageRecords: () => storedRecords,
  });

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Dawson") }).click();

  const carverySection = page.getByRole("heading", { name: "Carvery Rotations" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(carverySection).toBeVisible({ timeout: 20_000 });
  await expect(carverySection.getByText("choose here").first()).toBeVisible();

  await carverySection.getByLabel("Promotion Override").check();
  await expect(carverySection.getByText("Carvery Promotion Override Active")).toBeVisible();
  await expect(carverySection.getByText("choose here")).toHaveCount(0);

  await carverySection.getByPlaceholder("Dawson Carvery promo").fill("Harvest Carvery");
  await carverySection.getByRole("button", { name: "Monday", exact: true }).click();
  await carverySection.getByRole("button", { name: "Wednesday", exact: true }).click();

  const proteinSelect = carverySection.locator("select").first();
  const proteinValue = await proteinSelect.evaluate((select) => Array.from(select.options).find((option) => option.value && option.value !== "__write_in__")?.value || "");
  expect(proteinValue).not.toBe("");
  await proteinSelect.selectOption(proteinValue);

  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);

  const savedRecords = storageWrites.at(-1)?.records || [];
  const promoRows = savedRecords.filter((record) => record["Station Key"] === "carveryPromotion");
  expect(promoRows.length).toBeGreaterThanOrEqual(2);
  expect(promoRows.some((record) => record["Selection Type"] === "Menu Name" && record["Promotion Name"] === "Harvest Carvery")).toBe(true);
  expect(promoRows.some((record) => record["Promotion Days"] === "Monday, Wednesday")).toBe(true);
  expect(savedRecords.filter((record) => record["Station Key"] === "carvery")).toHaveLength(0);

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Dawson") }).click();
  const recalledCarvery = page.getByRole("heading", { name: "Carvery Rotations" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(recalledCarvery.getByText("Carvery Promotion Override Active")).toBeVisible();
  await expect(recalledCarvery.getByPlaceholder("Dawson Carvery promo")).toHaveValue("Harvest Carvery");
  await expect(recalledCarvery.getByText("choose here")).toHaveCount(0);
  await expect(recalledCarvery.locator("select").first()).toHaveValue(proteinValue);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
