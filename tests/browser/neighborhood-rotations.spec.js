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
  { menu: "AMZ: Ohana", station: "Premium Mains", item: "Huli Huli Chicken", category: "entree", price: 11.75, trueCost: 3.45, calories: 410, enticingDescription: "Grilled island-style chicken.", allergens: "Soy" },
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
  { menu: "AMZ: Carvery", station: "Premium Mains", item: "Herb Roasted Turkey", category: "entree", price: 12.25, trueCost: 3.8, calories: 390 },
  { menu: "AMZ: Carvery", station: "Sides", item: "Roasted Root Vegetables", category: "side", price: 3.25, trueCost: 0.9, calories: 180 },
];

function rotationRecord({ id, parent = "", type, cafe, week, status = "Submitted", stationKey = "", selectionType = "", item = "", menu = "", slot = 1, promoName = "", promoDays = "" }) {
  return {
    "Record ID": id,
    "Parent Record ID": parent,
    "Record Type": type,
    Status: status,
    District: "North",
    "Café / Unit": cafe,
    "Date Range Label": week,
    "Station Key": stationKey,
    "Selection Type": selectionType,
    "Menu Item / Selection": item,
    "Menu / Concept": menu,
    "Slot Number": slot,
    "Promotion Override Enabled": Boolean(promoName),
    "Promotion Name": promoName,
    "Promotion Days": promoDays,
    "Submitted At": "Aug 1, 2026, 8:00 AM",
    "Updated At": "Aug 1, 2026, 8:00 AM",
  };
}

function submittedProjectionRecords({ week, promo = false, mobyStatus = "Submitted" }) {
  const suffix = week.startsWith("Aug 31") ? "0831" : "0907";
  const parent = (cafe) => `rotation|${suffix}|North|${cafe}`;
  const header = (cafe) => rotationRecord({ id: parent(cafe), type: "Rotation Header", cafe, week, status: cafe === "Moby" ? mobyStatus : "Submitted" });
  const child = (cafe, localId, fields) => rotationRecord({ id: `${parent(cafe)}|${localId}`, parent: parent(cafe), cafe, week, ...fields });
  const mobyChild = (localId, fields) => child("Moby", localId, { status: mobyStatus, ...fields });
  const dawsonRows = promo ? [
    child("Dawson", "moby-promo-menu", { type: "Station Selection", stationKey: "mobyPopUpPromotion", selectionType: "Menu Name", item: "One Day Showcase", menu: "One Day Showcase", promoName: "One Day Showcase", promoDays: "Tuesday" }),
    child("Dawson", "moby-promo-entree", { type: "Station Selection", stationKey: "mobyPopUpPromotion", selectionType: "Entrée", item: "Huli Huli Chicken", menu: "One Day Showcase", promoName: "One Day Showcase", promoDays: "Tuesday" }),
  ] : [
    child("Dawson", "moby-menu", { type: "Station Selection", stationKey: "mobyPopUp", selectionType: "Menu Name", item: "AMZ: Carvery", menu: "AMZ: Carvery" }),
    child("Dawson", "moby-entree", { type: "Station Selection", stationKey: "mobyPopUp", selectionType: "Entrée", item: "Herb Roasted Turkey", menu: "AMZ: Carvery" }),
    child("Dawson", "moby-side", { type: "Station Selection", stationKey: "mobyPopUp", selectionType: "Side", item: "Roasted Root Vegetables", menu: "AMZ: Carvery" }),
  ];
  return [
    header("Dawson"),
    ...dawsonRows,
    header("Moby"),
    mobyChild("global-block", { type: "Global Block", stationKey: "global", menu: "AMZ: Ohana" }),
    mobyChild("global-entree", { type: "Global Selection", stationKey: "global", selectionType: "Entrée", item: "Huli Huli Chicken", menu: "AMZ: Ohana" }),
    mobyChild("pizza", { type: "Station Selection", stationKey: "pizza", selectionType: "LTO", item: "Mac Salad", menu: "Moby Pizza" }),
    header("Cricket"),
    child("Cricket", "global-block", { type: "Global Block", stationKey: "global", menu: "AMZ: Carvery" }),
    child("Cricket", "global-entree", { type: "Global Selection", stationKey: "global", selectionType: "Entrée", item: "Herb Roasted Turkey", menu: "AMZ: Carvery" }),
  ];
}

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

async function expectExpandedRemoteLabelsContained(page, viewport) {
  await page.setViewportSize(viewport);
  await stubEmptyRotationBackbone(page);
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: exactName("South") }).click();
  await page.getByRole("button", { name: exactName("Doppler") }).click();

  const remote = page.getByLabel("Planner Remote Control");
  await remote.getByRole("button", { name: "Expand", exact: true }).click();

  for (const actionName of ["Copy", "Load", "Upload", "Generate Menu", "View/Print", "Save Draft", "Submit"]) {
    const action = remote.getByRole("button", { name: actionName, exact: true });
    const label = action.locator("span");
    await expect(label).toBeVisible();
    const bounds = await action.evaluate((button) => {
      const text = button.querySelector("span");
      const buttonBox = button.getBoundingClientRect();
      const textBox = text.getBoundingClientRect();
      return {
        button: { left: buttonBox.left, top: buttonBox.top, right: buttonBox.right, bottom: buttonBox.bottom },
        text: { left: textBox.left, top: textBox.top, right: textBox.right, bottom: textBox.bottom },
      };
    });
    expect(bounds.text.left, `${actionName} label left edge`).toBeGreaterThanOrEqual(bounds.button.left - 1);
    expect(bounds.text.top, `${actionName} label top edge`).toBeGreaterThanOrEqual(bounds.button.top - 1);
    expect(bounds.text.right, `${actionName} label right edge`).toBeLessThanOrEqual(bounds.button.right + 1);
    expect(bounds.text.bottom, `${actionName} label bottom edge`).toBeLessThanOrEqual(bounds.button.bottom + 1);
  }
}

test("Neighborhood Rotations opens planner and gives a visible blocked-submit reason", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);

  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("button", { name: /^Doppler$/i }).click();

  await expect(page.getByRole("heading", { name: /^Doppler$/ })).toBeVisible({ timeout: 20_000 });
  const remote = page.getByLabel("Planner Remote Control");
  await expect(remote).toBeVisible();
  await expect(remote.getByRole("button", { name: "Save Draft", exact: true })).toBeVisible();
  await expect(remote.getByRole("button", { name: "Submit", exact: true })).toBeVisible();
  await expect(remote.getByText("Save Draft", { exact: true })).toHaveCount(0);
  await expect(remote.getByRole("status")).toHaveAttribute("aria-label", /Draft.*Submit blocked/i);

  const expandButton = remote.getByRole("button", { name: "Expand", exact: true });
  await expect(expandButton).toHaveAttribute("aria-expanded", "false");
  await expandButton.click();
  await expect(remote.getByText("Planner Remote Control", { exact: true })).toBeVisible();
  await expect(remote.getByText("Save Draft", { exact: true })).toBeVisible();
  await expect(remote.getByRole("button", { name: "Collapse", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/Global Rotation/i)).toBeVisible();

  const submitButton = remote.getByRole("button", { name: "Submit", exact: true });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toHaveAttribute("aria-disabled", "true");
  await expect(submitButton).toHaveAttribute("title", /Global Menu|entree|station/i);
  await expect(page.getByText(/Submit blocked/i)).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Planner Remote Control keeps expanded labels inside every button", async ({ page }) => {
  await expectExpandedRemoteLabelsContained(page, { width: 930, height: 700 });
  await expectExpandedRemoteLabelsContained(page, { width: 360, height: 800 });
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
        const remote = page.getByLabel("Planner Remote Control");
        await expect(remote).toBeVisible();
        await expect(remote.getByRole("button", { name: "Expand", exact: true })).toHaveAttribute("aria-expanded", "false");
        await expect(remote.getByRole("button", { name: "Save Draft", exact: true })).toBeVisible();
        await expect(remote.getByRole("button", { name: "Submit", exact: true })).toBeVisible();
        await expect(remote.getByText("Save Draft", { exact: true })).toHaveCount(0);
        await expect(page.getByText(/System Status/i)).toBeVisible();
        await expectNoAppProtection(page);
      }
    }
  }

  expectNoUnexpectedPageErrors(pageErrors);
});

test("Planner Remote Control keeps every action visible and keyboard operable on phones", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await stubEmptyRotationBackbone(page);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: exactName("South") }).click();
  await page.getByRole("button", { name: exactName("Doppler") }).click();

  const remote = page.getByLabel("Planner Remote Control");
  await expect(remote).toBeVisible();
  const remoteBox = await remote.boundingBox();
  expect(remoteBox).not.toBeNull();

  const actionNames = ["Copy", "Load", "Upload", "Generate Menu", "View/Print", "Save Draft", "Submit"];
  await remote.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(remote.getByRole("button", { name: "Load", exact: true })).toBeEnabled();

  for (const actionName of actionNames) {
    const action = remote.getByRole("button", { name: actionName, exact: true });
    await expect(action).toBeVisible();
    const actionBox = await action.boundingBox();
    expect(actionBox).not.toBeNull();
    expect(actionBox.x).toBeGreaterThanOrEqual(remoteBox.x - 1);
    expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(remoteBox.x + remoteBox.width + 1);
  }

  await page.evaluate((labels) => {
    window.__remoteKeyboardActivations = [];
    document.addEventListener("click", (event) => {
      const button = event.target.closest('div[aria-label="Planner Remote Control"] button');
      const label = button?.getAttribute("aria-label");
      if (!labels.includes(label)) return;
      window.__remoteKeyboardActivations.push(label);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }, actionNames);

  await remote.getByRole("button", { name: "Copy", exact: true }).focus();
  for (const actionName of actionNames) {
    await expect(remote.getByRole("button", { name: actionName, exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
  }
  await expect.poll(() => page.evaluate(() => window.__remoteKeyboardActivations)).toEqual(actionNames);
  await expect(remote.getByRole("button", { name: "Expand", exact: true })).toBeFocused();

  await expectNoAppProtection(page);
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
  await expect(page.getByLabel("Planner Remote Control")).toBeVisible();
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
    const remote = page.getByLabel("Planner Remote Control");
    await remote.getByRole("button", { name: "Expand", exact: true }).click();
    const blocker = page.getByText(/Submit is blocked until these are fixed/i).locator("xpath=..", { hasText: /Add at least one item/i });
    await expect(blocker).toBeVisible();
    await expect(blocker).not.toContainText(/Global Menu|Global entree/i);
    await remote.getByRole("button", { name: "Collapse", exact: true }).click();
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

test("Dawson Moby Pop-Up starts Aug 31, uses Global or Carvery menus, and recalls an isolated day promo", async ({ page }) => {
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
  await page.locator("select").first().selectOption({ label: "Aug 24, 2026 - Aug 28, 2026" });
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Dawson") }).click();
  await expect(page.getByRole("heading", { name: "Moby Pop-Up" })).toHaveCount(0);

  await page.locator("select").first().selectOption({ label: "Aug 31, 2026 - Sep 4, 2026" });
  await expect(page.getByRole("heading", { name: "Moby Pop-Up" })).toBeVisible({ timeout: 20_000 });
  const mobySection = page.getByRole("heading", { name: "Moby Pop-Up" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(mobySection.getByText("Service runs Tuesday through Thursday only")).toBeVisible();
  await expect(mobySection.getByText(/Required station starting September 1/i)).toBeVisible();
  await expect(page.getByLabel("Planner Remote Control").getByRole("button", { name: "Submit", exact: true })).toHaveAttribute("title", /Moby Pop-Up/);

  const menuSelect = mobySection.getByLabel("Moby Pop-Up Menu");
  await expect(menuSelect.locator('option[value="AMZ: Ohana"]')).toHaveCount(1);
  await expect(menuSelect.locator('option[value="AMZ: Carvery"]')).toHaveCount(1);
  await menuSelect.selectOption("AMZ: Ohana");
  await expect(mobySection.getByText("2 slots")).toHaveCount(2);
  await expect(mobySection.getByText("3 slots")).toHaveCount(1);
  await expect(mobySection.getByText("1 slot")).toHaveCount(1);

  const normalEntree = mobySection.locator("select").nth(1);
  await normalEntree.selectOption("Huli Huli Chicken");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);
  let savedRecords = storageWrites.at(-1)?.records || [];
  const normalRows = savedRecords.filter((record) => record["Station Key"] === "mobyPopUp");
  expect(normalRows.some((record) => record["Selection Type"] === "Menu Name" && record["Menu / Concept"] === "AMZ: Ohana")).toBe(true);
  expect(normalRows).toContainEqual(expect.objectContaining({
    "Menu Item / Selection": "Huli Huli Chicken",
    Price: 11.75,
    "True Cost": 3.45,
    Calories: 410,
  }));

  await menuSelect.selectOption("AMZ: Carvery");
  await expect(mobySection.locator("select").nth(1).locator('option[value="Herb Roasted Turkey"]')).toHaveCount(1);
  await expect(mobySection.locator("select").nth(3).locator('option[value="Roasted Root Vegetables"]')).toHaveCount(1);
  await mobySection.locator("select").nth(1).selectOption("Herb Roasted Turkey");
  await mobySection.locator("select").nth(3).selectOption("Roasted Root Vegetables");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(1);
  savedRecords = storageWrites.at(-1)?.records || [];
  const carveryRows = savedRecords.filter((record) => record["Station Key"] === "mobyPopUp");
  expect(carveryRows.some((record) => record["Selection Type"] === "Menu Name" && record["Menu / Concept"] === "AMZ: Carvery")).toBe(true);
  expect(carveryRows.some((record) => record["Selection Type"] === "Entrée" && record["Menu Item / Selection"] === "Herb Roasted Turkey")).toBe(true);
  expect(carveryRows.some((record) => record["Selection Type"] === "Side" && record["Menu Item / Selection"] === "Roasted Root Vegetables")).toBe(true);

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: "Aug 31, 2026 - Sep 4, 2026" });
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Dawson") }).click();
  const recalledNormalMoby = page.getByRole("heading", { name: "Moby Pop-Up" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(recalledNormalMoby.getByLabel("Moby Pop-Up Menu")).toHaveValue("AMZ: Carvery");
  await expect(recalledNormalMoby.locator("select").nth(1)).toHaveValue("Herb Roasted Turkey");
  await expect(recalledNormalMoby.locator("select").nth(3)).toHaveValue("Roasted Root Vegetables");

  await recalledNormalMoby.getByLabel("Promotion Override").check();
  await expect(recalledNormalMoby.getByText("Moby Pop-Up Promotion Override Active")).toBeVisible();
  await expect(recalledNormalMoby.getByLabel("Moby Pop-Up Menu")).toHaveCount(0);
  await expect(recalledNormalMoby.getByRole("button", { name: "Monday", exact: true })).toHaveCount(0);
  await expect(recalledNormalMoby.getByRole("button", { name: "Friday", exact: true })).toHaveCount(0);
  await recalledNormalMoby.getByPlaceholder("Moby Pop-Up promo").fill("One Day Showcase");
  await recalledNormalMoby.getByRole("button", { name: "Tuesday", exact: true }).click();
  const promoEntree = recalledNormalMoby.locator("select").first();
  await promoEntree.selectOption("Huli Huli Chicken");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(2);

  savedRecords = storageWrites.at(-1)?.records || [];
  const promoRows = savedRecords.filter((record) => record["Station Key"] === "mobyPopUpPromotion");
  expect(promoRows.length).toBeGreaterThanOrEqual(2);
  expect(promoRows.some((record) => record["Promotion Name"] === "One Day Showcase" && record["Promotion Days"] === "Tuesday")).toBe(true);
  expect(savedRecords.filter((record) => record["Station Key"] === "mobyPopUp")).toHaveLength(0);

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: "Aug 31, 2026 - Sep 4, 2026" });
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Dawson") }).click();
  const recalledMoby = page.getByRole("heading", { name: "Moby Pop-Up" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(recalledMoby.getByText("Moby Pop-Up Promotion Override Active")).toBeVisible();
  await expect(recalledMoby.getByPlaceholder("Moby Pop-Up promo")).toHaveValue("One Day Showcase");
  await expect(recalledMoby.getByRole("button", { name: "Tuesday", exact: true })).toHaveClass(/bg-purple-600/);
  await expect(recalledMoby.locator("select").first()).toHaveValue("Huli Huli Chicken");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("submitted Dawson Moby Pop-Up replaces only Moby Global presentation without changing duplicate reporting", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const normalWeek = "Aug 31, 2026 - Sep 4, 2026";
  const promoWeek = "Sep 7, 2026 - Sep 11, 2026";
  const records = [...submittedProjectionRecords({ week: normalWeek }), ...submittedProjectionRecords({ week: promoWeek, promo: true, mobyStatus: "Draft" })];
  await stubEmptyRotationBackbone(page, { getStorageRecords: () => records });

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: "Executive View", exact: true }).click();
  await page.locator("select").first().selectOption({ label: normalWeek });

  const mobyCard = page.getByRole("button", { name: "Open Moby planner" });
  await expect(mobyCard).toContainText("Dawson Moby Pop-Up - Tuesday-Thursday");
  await expect(mobyCard).toContainText("AMZ: Carvery");
  await expect(mobyCard).toContainText("1 entrees");
  await expect(mobyCard).not.toContainText("duplicate");

  await mobyCard.click();
  const submittedRecap = page.getByText("Submitted Menu Recap", { exact: true }).locator("xpath=ancestor::section[1]");
  await expect(submittedRecap).toContainText("Dawson Moby Pop-Up - Tuesday-Thursday");
  await expect(submittedRecap).toContainText("AMZ: Carvery");
  await expect(submittedRecap).toContainText("Herb Roasted Turkey");
  await expect(submittedRecap).toContainText("Pizza");
  await expect(submittedRecap).toContainText("Mac Salad");

  await page.getByRole("button", { name: "Results", exact: true }).click();
  await page.locator("select").nth(1).selectOption({ label: "Moby" });
  const mobyResult = page.getByRole("button", { name: /Aug 31.*Moby.*AMZ: Carvery/i });
  await expect(mobyResult).toBeVisible();
  await mobyResult.click();
  const detail = page.getByText("Saved Selection Detail", { exact: true }).locator("xpath=ancestor::section[1]");
  await expect(detail).toContainText("Global Station - Dawson Moby Pop-Up");
  await expect(detail).toContainText("Herb Roasted Turkey");
  await expect(detail).toContainText("Roasted Root Vegetables");
  await expect(detail).toContainText("Pizza");
  await expect(detail).toContainText("Mac Salad");

  await page.getByRole("button", { name: "Executive View", exact: true }).click();
  await page.locator("select").first().selectOption({ label: promoWeek });
  const promoMobyCard = page.getByRole("button", { name: "Open Moby planner" });
  await expect(promoMobyCard).toContainText("Dawson Moby Promo - Tuesday");
  await expect(promoMobyCard).toContainText("One Day Showcase");
  await expect(promoMobyCard).toContainText("open");
  await expect(promoMobyCard).toContainText("0/5");

  await promoMobyCard.click();
  const remote = page.getByLabel("Planner Remote Control");
  await remote.getByRole("button", { name: "View/Print", exact: true }).click();
  const printPreview = page.getByText("Weekly Rotation Packet", { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-3xl')][1]");
  await expect(printPreview).toContainText("One Day Showcase");
  await expect(printPreview).toContainText("Dawson Moby Pop-Up - Tuesday");
  await expect(printPreview).toContainText("Mac Salad");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Bingo Global shows a Wednesday-Tuesday cycle and both Grill Fresh $5 slots save and recall independently", async ({ page }) => {
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
  await page.getByRole("button", { name: exactName("East") }).click();
  await page.getByRole("button", { name: exactName("Bingo") }).click();
  await expect(page.getByRole("heading", { name: exactName("Bingo") })).toBeVisible({ timeout: 20_000 });

  await expect(page.getByText(/Bingo changes Global every Wednesday\./i)).toBeVisible();

  const grillFreshFive = page.getByRole("heading", { name: "Grill Fresh $5" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(grillFreshFive).toBeVisible();
  await expect(grillFreshFive.getByText("Grill Fresh $5 1", { exact: true })).toBeVisible();
  await expect(grillFreshFive.getByText("Grill Fresh $5 2", { exact: true })).toBeVisible();

  const slotSelects = grillFreshFive.locator("select");
  await expect(slotSelects).toHaveCount(2);
  const slot1Value = await slotSelects.nth(0).evaluate((select) => Array.from(select.options).find((option) => option.value && option.value !== "__write_in__")?.value || "");
  const slot2Value = await slotSelects.nth(1).evaluate((select) => Array.from(select.options).find((option) => option.value && option.value !== "__write_in__")?.value || "");
  expect(slot1Value).not.toBe("");
  expect(slot2Value).not.toBe("");
  await slotSelects.nth(0).selectOption(slot1Value);
  await slotSelects.nth(1).selectOption(slot2Value);

  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);

  const savedRecords = storageWrites.at(-1)?.records || [];
  const grillFreshFiveRows = savedRecords.filter((record) => record["Station Key"] === "grillFreshFive");
  expect(grillFreshFiveRows.length).toBe(2);
  expect(grillFreshFiveRows.some((record) => record["Slot Number"] === 1)).toBe(true);
  expect(grillFreshFiveRows.some((record) => record["Slot Number"] === 2)).toBe(true);

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: exactName("East") }).click();
  await page.getByRole("button", { name: exactName("Bingo") }).click();
  const recalledGrillFreshFive = page.getByRole("heading", { name: "Grill Fresh $5" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(recalledGrillFreshFive).toBeVisible({ timeout: 20_000 });
  const recalledSelects = recalledGrillFreshFive.locator("select");
  await expect(recalledSelects).toHaveCount(2);
  await expect(recalledSelects.nth(0)).toHaveValue(slot1Value);
  await expect(recalledSelects.nth(1)).toHaveValue(slot2Value);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
