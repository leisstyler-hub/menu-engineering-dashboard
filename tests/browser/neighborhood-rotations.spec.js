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
  { menu: "AMZ: Breakfast", station: "Premium Mains", item: "Biscuits and Gravy", category: "entree", price: 9, trueCost: 1.0215 },
  { menu: "AMZ: Ohana", station: "Premium Mains", item: "Huli Huli Chicken", category: "entree", price: 11.75, trueCost: 3.45, calories: 410, enticingDescription: "Grilled island-style chicken.", allergens: "Soy" },
  { menu: "AMZ: Ohana", station: "Sides", item: "Mac Salad", category: "side", price: 2.55 },
  { menu: "AMZ: Ohana", station: "Sides", item: "Jasmine Rice", category: "side", recipeCategory: "Grain", price: 2.55, trueCost: 0.5 },
  { menu: "AMZ: Ohana", station: "Sides", item: "Rice Noodle Salad", category: "side", recipeCategory: "Side Salad", price: 2.55, trueCost: 0.2 },
  { menu: "AMZ: Ohana", station: "Sides", item: "Blistered Green Beans", category: "side", recipeCategory: "Vegetable", price: 2.55, trueCost: 0.3 },
  { menu: "AMZ: Ohana", station: "Sides", item: "Cucumber Carrot Slaw", category: "side", recipeCategory: "Vegetable", price: 2.55, trueCost: 0.6 },
  { menu: "AMZ: Ohana", station: "Sub Recipes", item: "Huli Huli Glaze", category: "subRecipe", trueCost: 0.25 },
  { menu: "AMZ: Ohana", station: "Extensions", item: "Guava Lemonade", category: "extension", price: 3.25, trueCost: 0.01 },
  { menu: "AMZ: Piccola Italia", station: "Premium Mains", item: "Spaghetti Bolognese", category: "entree", price: 13, trueCost: 2 },
  { menu: "AMZ: Piccola Italia", station: "Sides", item: "Balsamic Glazed Carrots", category: "side", price: 2.55, trueCost: 0.5 },
  { menu: "AMZ: Piccola Italia", station: "Sides", item: "Garlic Bread", category: "side", price: 2.55, trueCost: 0.8 },
  { menu: "AMZ: Piccola Italia", station: "Sub Recipes", item: "Marinara", category: "subRecipe", trueCost: 0.2 },
  { menu: "AMZ: Smokehouse BBQ", station: "Premium Mains", item: "Bbq Chicken Thighs", category: "entree", price: 11.75, trueCost: 1.106 },
  { menu: "AMZ: Smokehouse BBQ", station: "Premium Mains", item: "Braised Shredded Pork", category: "entree", price: 11.75, trueCost: 1.471 },
  { menu: "AMZ: Smokehouse BBQ", station: "Sides", item: "Mac & Cheese", category: "side", recipeCategory: "Starch/Grain > Pasta", price: 2.55, trueCost: 0.184 },
  { menu: "AMZ: Smokehouse BBQ", station: "Sides", item: "Spicy Collard Greens", category: "side", recipeCategory: "Vegetable > Other Vegetable", price: 2.55, trueCost: 0.199 },
  { menu: "AMZ: Smokehouse BBQ", station: "Sides", item: "Bbq Baked Beans", category: "side", recipeCategory: "Vegetable > Legume", price: 2.55, trueCost: 0.331 },
  { menu: "AMZ: Smokehouse BBQ", station: "Sides", item: "Grilled Corn", category: "side", recipeCategory: "Vegetable > Other Vegetable", price: 2.55, trueCost: 0.336 },
  { menu: "AMZ: Smokehouse BBQ", station: "Sub Recipes", item: "Carochina Mustard Sauce", category: "subRecipe", trueCost: 0.222 },
  { menu: "AMZ: Smokehouse BBQ", station: "Extensions", item: "Pecan Pie", category: "extension", price: 4.25, trueCost: 1.533 },
  { menu: "AMZ: Lotus", station: "Premium Mains", item: "Pork Hung Lay", category: "entree", price: 11.75 },
  { menu: "AMZ: Lotus", station: "Sides", item: "Papaya Salad", category: "side", price: 2.55 },
  { menu: "AMZ: Saffron", station: "Premium Mains", item: "Chicken Apricot Tagine", category: "entree", price: 11.75 },
  { menu: "AMZ: Saffron", station: "Sides", item: "Citrus Almond Rice", category: "side", price: 2.55 },
  { menu: "AMZ: Maya", station: "Premium Mains", item: "Chicken Adobo", category: "entree", price: 11.75 },
  { menu: "AMZ: Chang Mai", station: "Premium Mains", item: "Pork Hung Lay", category: "entree", price: 11.75 },
  { menu: "AMZ: Grill Core", station: "Spotlights", item: "crispy buffalo chicken wrap", category: "entree", price: 11.45, trueCost: 3.0893, mrn: "132547.5", portion: "1 sandwich" },
  { menu: "AMZ: Grill Core", station: "Spotlights", item: "carolina bbq burger", category: "entree", price: 11.45, trueCost: 2.9227, mrn: "63329.3", portion: "1 each" },
  { menu: "AMZ: Cafe Express Curated Salads", station: "Curated Salads", item: "Baja Crunch Salad", category: "entree", price: 11.45 },
  { menu: "AMZ: Cafe Express Curated Sandwiches", station: "Curated Sandwiches", item: "Chicken Caesar Wrap", category: "entree", price: 9.9 },
  { menu: "AMZ: Cafe Express Soup", station: "Soup", item: "Tomato Basil Soup", category: "entree", portion: "12 floz", portionOz: 11.71, price: 5.15, trueCost: 1.2, calories: 180, enticingDescription: "Creamy tomato soup with basil." },
  { menu: "AMZ: Cafe Express Soup", station: "Soup", item: "Chicken Noodle Soup", category: "entree", portion: "12 floz", price: 5.15, trueCost: 0.9, calories: 160, enticingDescription: "Chicken and noodles in a savory broth." },
  { menu: "AMZ: Cafe Express Soup", station: "Soup", item: "Vegetable Minestrone Soup", category: "entree", portion: "12 floz", price: 5.15, trueCost: null, calories: 140, enticingDescription: "Vegetable soup with pasta and beans." },
  { menu: "AMZ: Fish Market", station: "Fish Market", item: "Steelhead Croquettes", category: "entree", price: 15.5, trueCost: 1.2688, mrn: "194276", portion: "2 each" },
  { menu: "AMZ: Fresh Five", station: "Grill", item: "Fresh 5 Black Bean Burger", category: "entree", price: 5 },
  { menu: "AMZ: Carvery", station: "Premium Mains", item: "Herb Roasted Turkey", category: "entree", price: 12.25, trueCost: 3.8, calories: 390 },
  { menu: "AMZ: Carvery", station: "Sides", item: "Roasted Root Vegetables", category: "side", price: 3.25, trueCost: 0.9, calories: 180 },
  { menu: "AMZ: Balti", station: "Premium Mains", item: "Balti Chicken", category: "entree", price: 11.75 },
  { menu: "AMZ: House of Teriyaki", station: "Teriyaki", item: "Chicken Teriyaki", category: "entree", price: 11.75, trueCost: 2.0768, mrn: "83244.7", portion: "6 oz portion", calories: 375 },
  { menu: "AMZ: House of Teriyaki", station: "Teriyaki", item: "Cucumber Salad", category: "side", price: 2.55, trueCost: 0.9397, mrn: "76874", portion: "4 ounce", calories: 125 },
  { menu: "AMZ: House of Teriyaki", station: "Teriyaki", item: "Teriyaki Sauce", category: "subRecipe", trueCost: 0.1989, mrn: "83233", portion: "2 ounce" },
  { menu: "AMZ: Anisa", station: "Lebanese Menu", item: "chicken souvlaki kebab plate", category: "entree", price: 11.75, trueCost: 1.9089, mrn: "216051", portion: "1 each" },
  { menu: "AMZ: Anisa", station: "Lebanese Menu", item: "Grilled Vegetables", category: "side", price: 2.55, trueCost: 0.6853, mrn: "172546", portion: "4 ounce" },
  { menu: "AMZ: Anisa", station: "Persian Menu", item: "crispy saffron rice with yogurt and eggs", category: "side", price: 2.55, trueCost: 1.104, mrn: "191654", portion: "1 cup" },
  { menu: "AMZ: Anisa", station: "Lebanese Menu", item: "harissa relish", category: "subRecipe", trueCost: 0.49, mrn: "191490", portion: "2 floz" },
  { menu: "AMZ: Anisa", station: "Persian Menu", item: "mezze butter", category: "subRecipe", trueCost: 0.4232, mrn: "191736", portion: "2 oz portion" },
  { menu: "AMZ: Anisa", station: "Persian Menu", item: "sumac onion relish", category: "subRecipe", trueCost: 0.3775, mrn: "191726", portion: "1/4 cup" },
];

function rotationRecord({ id, parent = "", type, cafe, week, district = "North", status = "Submitted", stationKey = "", selectionType = "", item = "", menu = "", slot = 1, promoName = "", promoDays = "" }) {
  return {
    "Record ID": id,
    "Parent Record ID": parent,
    "Record Type": type,
    Status: status,
    District: district,
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

function submittedProjectionRecords({ week, promo = false, mobyStatus = "Submitted", includeMobyRecords = true, normalMenu = "AMZ: Carvery", normalEntree = "Herb Roasted Turkey", normalSide = "Roasted Root Vegetables" }) {
  const suffix = new Date(`${week.split(" - ")[0]} 12:00:00`).toISOString().slice(0, 10);
  const parent = (cafe) => `rotation|${suffix}|North|${cafe}`;
  const header = (cafe) => rotationRecord({ id: parent(cafe), type: "Rotation Header", cafe, week, status: cafe === "Moby" ? mobyStatus : "Submitted" });
  const child = (cafe, localId, fields) => rotationRecord({ id: `${parent(cafe)}|${localId}`, parent: parent(cafe), cafe, week, ...fields });
  const mobyChild = (localId, fields) => child("Moby", localId, { status: mobyStatus, ...fields });
  const dawsonRows = promo ? [
    child("Dawson", "moby-promo-menu", { type: "Station Selection", stationKey: "mobyPopUpPromotion", selectionType: "Menu Name", item: "One Day Showcase", menu: "One Day Showcase", promoName: "One Day Showcase", promoDays: "Tuesday" }),
    child("Dawson", "moby-promo-entree", { type: "Station Selection", stationKey: "mobyPopUpPromotion", selectionType: "Entrée", item: "Huli Huli Chicken", menu: "One Day Showcase", promoName: "One Day Showcase", promoDays: "Tuesday" }),
  ] : [
    child("Dawson", "moby-menu", { type: "Station Selection", stationKey: "mobyPopUp", selectionType: "Menu Name", item: normalMenu, menu: normalMenu }),
    child("Dawson", "moby-entree", { type: "Station Selection", stationKey: "mobyPopUp", selectionType: "Entrée", item: normalEntree, menu: normalMenu }),
    child("Dawson", "moby-side", { type: "Station Selection", stationKey: "mobyPopUp", selectionType: "Side", item: normalSide, menu: normalMenu }),
  ];
  const mobyRows = includeMobyRecords ? [
    header("Moby"),
    mobyChild("global-block", { type: "Global Block", stationKey: "global", menu: "AMZ: Ohana" }),
    mobyChild("global-entree", { type: "Global Selection", stationKey: "global", selectionType: "Entrée", item: "Huli Huli Chicken", menu: "AMZ: Ohana" }),
    mobyChild("pizza", { type: "Station Selection", stationKey: "pizza", selectionType: "LTO", item: "Mac Salad", menu: "Moby Pizza" }),
  ] : [];
  return [
    header("Dawson"),
    ...dawsonRows,
    ...mobyRows,
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

test("North Commissary cafe label stays inside its selector button", async ({ page }) => {
  await stubEmptyRotationBackbone(page);
  for (const width of [240, 1024]) {
    await page.setViewportSize({ width, height: 768 });
    await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
    await page.getByRole("button", { name: exactName("North") }).click();

    const button = page.getByRole("button", { name: exactName("Commissary") });
    const label = button.getByText("Commissary", { exact: true });
    await expect(button).toBeVisible();
    const [buttonBox, labelBox, labelMetrics] = await Promise.all([
      button.boundingBox(),
      label.boundingBox(),
      label.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, overflowWrap: getComputedStyle(element).overflowWrap })),
    ]);
    expect(buttonBox).not.toBeNull();
    expect(labelBox).not.toBeNull();
    expect(labelBox.x).toBeGreaterThanOrEqual(buttonBox.x);
    expect(labelBox.y).toBeGreaterThanOrEqual(buttonBox.y);
    expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(buttonBox.x + buttonBox.width);
    expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(buttonBox.y + buttonBox.height);
    expect(labelMetrics.scrollWidth).toBeLessThanOrEqual(labelMetrics.clientWidth);
    expect(labelMetrics.overflowWrap).toBe("anywhere");
  }
});

test("Nessie Global reference picker preserves exact plate builds while rollout remains planner-only", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const pilotWeek = "Aug 17, 2026 - Aug 21, 2026";
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
  await page.locator("select").first().selectOption({ label: pilotWeek });
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Nessie") }).click();

  const globalSection = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(globalSection.locator('option[value^="AMZ+RA:"]')).toHaveCount(0);
  await expect(globalSection.locator('option[value="AMZ: Breakfast"]')).toHaveCount(1);
  await expect(globalSection.locator('option[value="AMZ: Cafe Express Soup"]')).toHaveCount(1);
  await expect(globalSection.locator('option[value="AMZ: Wok"]')).toHaveCount(1);
  await globalSection.locator("select").first().selectOption("AMZ: Smokehouse BBQ");
  const pickerGroup = (title) => globalSection.getByText(title, { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  const plateAnalytics = globalSection.getByTestId("nessie-global-reference-plate-cost");
  await expect(plateAnalytics.getByText("Menu-Specific Plate Cost", { exact: true })).toBeVisible();
  await expect(plateAnalytics.getByText("Item + Waste Cost", { exact: true })).toBeVisible();
  await expect(globalSection.getByText("Selected Mix Food Cost %", { exact: true })).toHaveCount(0);
  const smokehouseEntrees = pickerGroup("Entrees").locator("select");
  await smokehouseEntrees.nth(0).selectOption({ label: "BBQ Chicken Thighs" });
  await smokehouseEntrees.nth(1).selectOption({ label: "Braised Shredded Pork" });
  const chickenReferenceId = await smokehouseEntrees.nth(0).inputValue();
  const porkReferenceId = await smokehouseEntrees.nth(1).inputValue();
  const smokehouseSides = pickerGroup("Sides").locator("select");
  await smokehouseSides.nth(0).selectOption({ label: "Bbq Baked Beans" });
  await smokehouseSides.nth(1).selectOption({ label: "Spicy Collard Greens" });
  await smokehouseSides.nth(2).selectOption({ label: "Grilled Corn" });
  await pickerGroup("Cornbread").locator("select").first().selectOption({ label: "Cornbread" });
  const subRecipes = pickerGroup("Sub Recipe").locator("select");
  await subRecipes.nth(0).selectOption({ label: "Barbecue Sauce" });
  await subRecipes.nth(1).selectOption({ label: "Carochina Mustard Sauce" });
  const barbecueReferenceId = await subRecipes.nth(0).inputValue();
  await pickerGroup("Extensions").locator("select").first().selectOption({ label: "Pecan Pie" });
  const chickenPlate = plateAnalytics.getByTestId("reference-plate-171040");
  const porkPlate = plateAnalytics.getByTestId("reference-plate-44948.1");
  await expect(chickenPlate).toContainText(/\$2\.11.*\$2\.39/);
  await expect(chickenPlate).toContainText(/18\.0%.*20\.3%/);
  await expect(porkPlate).toContainText(/\$2\.68.*\$2\.96/);
  await expect(porkPlate).toContainText(/22\.8%.*25\.2%/);
  await expect(plateAnalytics).toContainText("Cost $1.56 · Sell $3.85 · Food cost 40.6%");
  await expect(chickenPlate).not.toContainText("pecan pie");
  const restoredCardStyles = await plateAnalytics.evaluate((panel) => {
    const plate = panel.querySelector('[data-testid="reference-plate-171040"]');
    const summaryLabel = Array.from(panel.querySelectorAll("p")).find((element) => element.textContent === "Selected Plate Cost Range");
    const summary = summaryLabel?.parentElement;
    return {
      panelPadding: getComputedStyle(panel).paddingTop,
      platePadding: plate ? getComputedStyle(plate).paddingTop : "",
      plateRadius: plate ? getComputedStyle(plate).borderRadius : "",
      plateContained: plate ? plate.scrollWidth <= plate.clientWidth : false,
      summaryPadding: summary ? getComputedStyle(summary).paddingTop : "",
    };
  });
  expect(parseFloat(restoredCardStyles.panelPadding)).toBeGreaterThanOrEqual(18);
  expect(parseFloat(restoredCardStyles.platePadding)).toBeGreaterThanOrEqual(14);
  expect(parseFloat(restoredCardStyles.plateRadius)).toBeGreaterThanOrEqual(14);
  expect(parseFloat(restoredCardStyles.summaryPadding)).toBeGreaterThanOrEqual(14);
  expect(restoredCardStyles.plateContained).toBe(true);
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);
  const savedGlobalRows = (storageWrites.at(-1)?.records || []).filter((record) => record["Station Key"] === "global" && record["Record Type"] === "Global Selection");
  const savedHeader = (storageWrites.at(-1)?.records || []).find((record) => record["Record Type"] === "Rotation Header" && record["Café / Unit"] === "Nessie");
  expect(savedHeader["Projected True Cost Low"]).toBeCloseTo(2.1104, 4);
  expect(savedHeader["Projected True Cost High"]).toBeCloseTo(2.9583, 4);
  expect(savedHeader).toMatchObject({ "Food Cost Range Low %": 18, "Food Cost Range High %": 25.2 });
  expect(savedGlobalRows.find((record) => record["MRN"] === "171040")).toMatchObject({ "Menu / Concept": "AMZ: Smokehouse BBQ", "Station / Sub-Concept": "Big City BBQ", Portion: "5 oz portion", "True Cost": 0.9622, Price: 11.75 });
  expect(savedGlobalRows.find((record) => record["MRN"] === "140479")).toMatchObject({ "Menu / Concept": "AMZ: Smokehouse BBQ", "Station / Sub-Concept": "Big City BBQ", Portion: "4 ounce", "True Cost": 0.2839 });
  expect(savedGlobalRows.find((record) => record["MRN"] === "184229")).toMatchObject({ "Menu / Concept": "AMZ: Smokehouse BBQ", "Selection Type": "Sub Recipe", Portion: "2 ounce", "True Cost": 0.1786 });
  expect(savedGlobalRows.find((record) => record["MRN"] === "84769")).toMatchObject({ "Menu / Concept": "AMZ: Smokehouse BBQ", "Station / Sub-Concept": "Big City BBQ", Portion: "1 slice", "True Cost": 1.5618, Price: 3.85 });

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: pilotWeek });
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Nessie") }).click();
  const recalledGlobal = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  const recalledPickerGroup = (title) => recalledGlobal.getByText(title, { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(recalledGlobal.locator("select").first()).toHaveValue("AMZ: Smokehouse BBQ");
  await expect(recalledPickerGroup("Entrees").locator("select").nth(0)).toHaveValue(chickenReferenceId);
  await expect(recalledPickerGroup("Entrees").locator("select").nth(1)).toHaveValue(porkReferenceId);
  await expect(recalledPickerGroup("Sub Recipe").locator("select").nth(0)).toHaveValue(barbecueReferenceId);
  await expect(recalledGlobal.getByTestId("reference-plate-171040")).toContainText(/\$2\.11.*\$2\.39/);

  await recalledGlobal.locator("select").first().selectOption("AMZ: Piccola Italia");
  const piccolaEntrees = recalledPickerGroup("Entrees").locator("select");
  await piccolaEntrees.nth(0).selectOption({ label: "Spaghetti Bolognese" });
  await piccolaEntrees.nth(1).selectOption({ label: "Fresh Vegetable Lasagna" });
  const piccolaSides = recalledPickerGroup("Sides").locator("select");
  await piccolaSides.nth(0).selectOption({ label: "Balsamic Glazed Carrots" });
  await piccolaSides.nth(1).selectOption({ label: "Lemon Green Beans With Capers" });
  await recalledPickerGroup("Garlic Bread").locator("select").first().selectOption({ label: "Garlic Bread" });
  const writesBeforeIncompleteSave = storageWrites.length;
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(writesBeforeIncompleteSave);
  const incompleteHeader = (storageWrites.at(-1)?.records || []).find((record) => record["Record Type"] === "Rotation Header" && record["Café / Unit"] === "Nessie");
  expect(incompleteHeader).toMatchObject({ "Projected True Cost Low": "", "Projected True Cost High": "", "Food Cost Range Low %": "", "Food Cost Range High %": "" });

  await recalledGlobal.locator("select").first().selectOption("AMZ: Ohana");
  await recalledPickerGroup("Entrees").locator("select").first().selectOption({ label: "Huli Huli Chicken" });
  const ohanaRiceValue = await recalledPickerGroup("Rice").locator("option", { hasText: "jasmine rice" }).first().getAttribute("value");
  await recalledGlobal.locator("select").first().selectOption("AMZ: Lotus");
  await recalledPickerGroup("Entrees").locator("select").first().selectOption({ label: "Beef And Broccoli" });
  const lotusRiceValue = await recalledPickerGroup("Base").locator("option", { hasText: "jasmine rice" }).first().getAttribute("value");
  expect(ohanaRiceValue).not.toBe(lotusRiceValue);
  expect(ohanaRiceValue).toContain("AMZ: Ohana");
  expect(lotusRiceValue).toContain("AMZ: Lotus");

  await recalledGlobal.locator("select").first().selectOption("AMZ: Wok");
  await expect(recalledGlobal.getByText("Reference Station", { exact: true })).toBeVisible();
  const stationSelect = recalledGlobal.locator("select").nth(1);
  await expect(stationSelect.locator('option[value="Bibimbap - Wok"]')).toHaveCount(1);
  await expect(stationSelect.locator('option[value="Japanese - Wok"]')).toHaveCount(1);
  await expect(stationSelect.locator('option[value="Thai - Wok"]')).toHaveCount(1);

  await recalledGlobal.locator("select").first().selectOption("AMZ: Breakfast");
  await recalledGlobal.locator("select").nth(1).selectOption("Plates");
  await recalledPickerGroup("Entrees").locator("select").first().selectOption({ label: "Breakfast Plate" });
  await recalledPickerGroup("Side").locator("select").first().selectOption({ label: "Fresh Fruit Cup" });
  const breakfastPrimaryId = await recalledPickerGroup("Entrees").locator("select").first().inputValue();
  const breakfastSideId = await recalledPickerGroup("Side").locator("select").first().inputValue();
  const breakfastPlate = recalledGlobal.getByTestId("reference-plate-210366");
  await expect(breakfastPlate).toContainText("$2.32");
  await expect(breakfastPlate).toContainText("21.3%");

  const writesBeforeBreakfastSave = storageWrites.length;
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(writesBeforeBreakfastSave);
  const breakfastRecords = storageWrites.at(-1)?.records || [];
  const breakfastComponent = breakfastRecords.find((record) => record["Station Key"] === "global" && record["Selection Type"] === "Side");
  const breakfastBlock = breakfastRecords.find((record) => record["Record Type"] === "Global Block");
  const breakfastPrimary = breakfastRecords.find((record) => record["Station Key"] === "global" && record["Selection Type"] === "Entrée");
  expect(breakfastComponent).toMatchObject({ "Station / Sub-Concept": "Sides & More", MRN: "13158.4", Portion: "4 oz parfait", "True Cost": 0.4283 });
  storedRecords = [
    breakfastComponent,
    ...breakfastRecords.filter((record) => ![breakfastComponent, breakfastBlock, breakfastPrimary].includes(record)),
    breakfastBlock,
    breakfastPrimary,
  ].filter(Boolean);

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: pilotWeek });
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Nessie") }).click();
  const shuffledBreakfast = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  const shuffledBreakfastGroup = (title) => shuffledBreakfast.getByText(title, { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(shuffledBreakfast.locator("select").first()).toHaveValue("AMZ: Breakfast");
  await expect(shuffledBreakfast.locator("select").nth(1)).toHaveValue("Plates");
  await expect(shuffledBreakfastGroup("Entrees").locator("select").first()).toHaveValue(breakfastPrimaryId);
  await expect(shuffledBreakfastGroup("Side").locator("select").first()).toHaveValue(breakfastSideId);
  await expect(shuffledBreakfast.getByTestId("reference-plate-210366")).toContainText("21.3%");

  await page.locator("select").first().selectOption({ label: "Aug 24, 2026 - Aug 28, 2026" });
  const adjacentGlobal = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await adjacentGlobal.locator("select").first().selectOption("AMZ: Ohana");
  await expect(adjacentGlobal.getByTestId("nessie-global-reference-plate-cost")).toBeVisible();
  await expect(adjacentGlobal.getByText("Selected Mix Food Cost %", { exact: true })).toHaveCount(0);

  await page.locator("select").first().selectOption({ label: "Jul 20, 2026 - Jul 24, 2026" });
  const historicalGlobal = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await historicalGlobal.locator("select").first().selectOption("AMZ: Ohana");
  await expect(historicalGlobal.getByText("Selected Mix Food Cost %", { exact: true })).toBeVisible();
  await expect(historicalGlobal.getByTestId("nessie-global-reference-plate-cost")).toHaveCount(0);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("reference plate cost rolls out by menu across current and future planners only", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const rolloutWeek = "Aug 24, 2026 - Aug 28, 2026";
  const storageWrites = [];
  await stubEmptyRotationBackbone(page, { onStorageWrite: (body) => storageWrites.push(body) });

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: rolloutWeek });
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Dawson") }).click();

  const global = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await global.locator("select").first().selectOption("AMZ: Ohana");
  const picker = (title) => global.getByText(title, { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await picker("Entrees").locator("select").first().selectOption({ label: "Huli Huli Chicken" });
  await picker("Sides").locator("select").nth(0).selectOption({ label: "Jasmine Rice" });
  await picker("Sides").locator("select").nth(1).selectOption({ label: "Blistered Green Beans" });
  await picker("Sides").locator("select").nth(2).selectOption({ label: "Cucumber Carrot Slaw" });
  await picker("Extensions").locator("select").first().selectOption({ label: "Guava Lemonade" });
  const globalReference = global.getByTestId("nessie-global-reference-plate-cost");
  await expect(globalReference).toContainText("$3.91");
  await expect(globalReference).toContainText("33.3%");
  await expect(globalReference).toContainText("Cost $0.86 · Sell $3.85 · Food cost 22.4%");
  await expect(global.getByText("Selected Mix Food Cost %", { exact: true })).toHaveCount(0);

  await picker("Sides").locator("select").nth(3).selectOption("__write_in__");
  await picker("Sides").locator("input").last().fill("Unmapped Mixed Plate Item");
  await expect(globalReference).toContainText("Reference data unavailable");
  await expect(globalReference).not.toContainText("$3.91");
  await expect(globalReference).not.toContainText("33.3%");
  await expect(globalReference.getByText("Plate cost range", { exact: true })).toHaveCount(0);

  await global.locator("select").first().selectOption("AMZ: Breakfast");
  await picker("Entrees").locator("select").first().selectOption("__write_in__");
  await picker("Entrees").locator("input").first().fill("Biscuits and Gravy");
  await expect(globalReference).toContainText("Reference data unavailable");
  await expect(globalReference).not.toContainText("Select an entrée");
  await expect(globalReference.getByText("Plate cost range", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);
  const dawsonHeader = (storageWrites.at(-1)?.records || []).find((record) => record["Record Type"] === "Rotation Header" && record["Café / Unit"] === "Dawson");
  expect(dawsonHeader["Projected True Cost Low"]).not.toBeCloseTo(3.91, 2);

  await page.getByRole("button", { name: "Results", exact: true }).click();
  await expect(page.getByText("Food Cost Reference", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Chef Planner", exact: true }).click();

  const carvery = page.getByRole("heading", { name: "Carvery Rotations" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(carvery.getByTestId("nessie-global-reference-plate-cost")).toBeVisible();
  await carvery.getByLabel("Promotion Override").check();
  await expect(carvery.getByTestId("nessie-global-reference-plate-cost")).toHaveCount(0);

  await global.getByLabel("Promotion Override").check();
  await expect(global.getByTestId("nessie-global-reference-plate-cost")).toHaveCount(0);
  await global.getByRole("button", { name: "Clear Override", exact: true }).click();
  await global.locator("select").first().selectOption("AMZ: Maya");
  await expect(global.getByTestId("nessie-global-reference-plate-cost")).toHaveCount(0);
  await expect(global.getByText("Selected Mix Food Cost %", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: exactName("Nessie") }).click();
  const wok = page.getByRole("heading", { name: "Wok Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(wok.getByTestId("nessie-global-reference-plate-cost")).toBeVisible();
  const wokEntrees = wok.getByText("Wok Entrees", { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await wokEntrees.locator("select").first().selectOption("__write_in__");
  await wokEntrees.locator("input").first().fill("Unmapped Wok Test Item");
  await expect(wok.getByTestId("nessie-global-reference-plate-cost")).toContainText("Reference data unavailable");

  await page.getByRole("button", { name: exactName("Commissary") }).click();
  const soup = page.getByRole("heading", { name: "Soup LTOs" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(soup.getByTestId("soup-portion-costing")).toBeVisible();

  await page.getByRole("button", { name: exactName("East") }).click();
  await page.getByRole("button", { name: exactName("Blueshift") }).click();
  const lotus = page.getByRole("heading", { name: "Lotus W&P" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(lotus.getByTestId("nessie-global-reference-plate-cost")).toBeVisible();

  await page.locator("select").first().selectOption({ label: "Jul 20, 2026 - Jul 24, 2026" });
  await expect(page.locator('[data-reference-plate-cost="true"]')).toHaveCount(0);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("reference plate cost covers split, Nitro, Moby Pop-Up, and LAX planner paths", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const rolloutWeek = "Aug 31, 2026 - Sep 4, 2026";
  await stubEmptyRotationBackbone(page);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: rolloutWeek });

  await page.getByRole("button", { name: exactName("South") }).click();
  await page.getByRole("button", { name: exactName("Nitro") }).click();
  let global = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await global.locator("select").first().selectOption("AMZ: Ohana");
  await expect(global.locator('[data-reference-plate-cost="true"]')).toHaveCount(2);
  await global.getByLabel("Promotion Override").check();
  await expect(global.locator('[data-reference-plate-cost="true"]')).toHaveCount(0);

  await page.getByRole("button", { name: exactName("Re:Invent") }).click();
  global = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await global.locator("select").first().selectOption("AMZ: Ohana");
  await expect(global.locator('[data-reference-plate-cost="true"]')).toHaveCount(1);

  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Dawson") }).click();
  const moby = page.getByRole("heading", { name: "Moby Pop-Up" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await moby.getByLabel("Moby Pop-Up Menu").selectOption("AMZ: Carvery");
  await expect(moby.getByTestId("nessie-global-reference-plate-cost")).toBeVisible();
  await moby.getByLabel("Promotion Override").check();
  await expect(moby.getByTestId("nessie-global-reference-plate-cost")).toHaveCount(0);

  await page.getByRole("button", { name: exactName("LAX") }).click();
  await page.getByRole("button", { name: exactName("LAX22") }).click();
  global = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await global.locator("select").first().selectOption("AMZ: Ohana");
  await expect(global.getByTestId("nessie-global-reference-plate-cost")).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Fish Market and Core Grill calculate automatic operator-ready plate options", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const storageWrites = [];
  await stubEmptyRotationBackbone(page, { onStorageWrite: (body) => storageWrites.push(body) });

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: "Aug 31, 2026 - Sep 4, 2026" });
  await page.getByRole("button", { name: exactName("South") }).click();
  await page.getByRole("button", { name: exactName("Re:Invent") }).click();

  const fish = page.getByRole("heading", { name: "Fish Market LTO" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await fish.locator("select").first().selectOption({ label: "Steelhead Croquettes" });
  const fishCost = fish.getByTestId("nessie-global-reference-plate-cost");
  await expect(fishCost).toContainText("Automatic plate build: entrée + 2 unique Fish Market sides + 1 sauce");
  await expect(fishCost).not.toContainText(/Select .*Side|Select .*Sub Recipe/i);
  const fishLow = fishCost.getByTestId("fish-market-lowest-194276");
  const fishHigh = fishCost.getByTestId("fish-market-highest-194276");
  await expect(fishLow).toContainText("brown rice");
  await expect(fishLow).toContainText("Roasted Potatoes");
  await expect(fishLow).toContainText("tartar sauce");
  await expect(fishLow).toContainText("$1.96");
  await expect(fishLow).toContainText("12.6%");
  await expect(fishHigh).toContainText("garlic lemon broccolini");
  await expect(fishHigh).toContainText("garden salad");
  await expect(fishHigh).toContainText("chimichurri sauce");
  await expect(fishHigh).toContainText("$5.53");
  await expect(fishHigh).toContainText("35.7%");

  const grill = page.getByRole("heading", { name: "Core Grill Additions" }).locator("xpath=ancestor::div[contains(@class,'rounded-3xl')][1]");
  const grillSelects = grill.locator("select");
  const optionValue = (select, labelToken) => select.evaluate((element, expected) => Array.from(element.options).find((option) => option.label.toLowerCase().includes(expected.toLowerCase()))?.value || "", labelToken);
  const crispyValue = await optionValue(grillSelects.nth(0), "buffalo");
  const carolinaValue = await optionValue(grillSelects.nth(1), "carolina");
  expect(crispyValue).not.toBe("");
  expect(carolinaValue).not.toBe("");
  await grillSelects.nth(0).selectOption(crispyValue);
  await grillSelects.nth(1).selectOption(carolinaValue);
  const grillCost = grill.getByTestId("nessie-global-reference-plate-cost");
  await expect(grillCost).toContainText("No side selection needed");
  for (const mrn of ["132547.5", "63329.3"]) {
    const options = grillCost.getByTestId(`grill-side-options-${mrn}`);
    await expect(options.getByTestId(`grill-side-option-${mrn}`)).toHaveCount(4);
    for (const side of ["Sweet Potato Fries", "Waffle Fries", "Onion Rings", "garden salad"]) await expect(options.getByText(side, { exact: true })).toHaveCount(1);
  }
  await expect(grillCost.getByTestId("grill-side-options-132547.5")).toContainText(/\$3\.48.*30\.4%/s);
  await expect(grillCost.getByTestId("grill-side-options-132547.5")).toContainText(/\$3\.62.*31\.7%/s);
  await expect(grillCost.getByTestId("grill-side-options-132547.5")).toContainText(/\$4\.50.*39\.3%/s);
  await expect(grillCost.getByTestId("grill-side-options-132547.5")).toContainText(/\$4\.51.*39\.4%/s);

  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);
  const savedNames = (storageWrites.at(-1)?.records || []).map((record) => record["Menu Item / Selection"]);
  for (const inferred of ["brown rice", "Roasted Potatoes", "tartar sauce", "Sweet Potato Fries", "Waffle Fries", "Onion Rings", "garden salad"]) expect(savedNames).not.toContain(inferred);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Teriyaki and Anisa Sub Recipe selections satisfy normalized plate builds", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubEmptyRotationBackbone(page);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: "Aug 31, 2026 - Sep 4, 2026" });
  await page.getByRole("button", { name: exactName("South") }).click();
  await page.getByRole("button", { name: exactName("Nitro") }).click();
  let global = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await global.locator("select").first().selectOption("AMZ: House of Teriyaki");
  const nitroBlock = global.getByRole("heading", { name: "Monday + Tuesday Proteins" }).locator("xpath=ancestor::div[contains(@class,'rounded-3xl')][1]");
  const nitroPicker = (title) => nitroBlock.getByText(title, { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await nitroPicker("Entrees").locator("select").first().selectOption({ label: "Chicken Teriyaki" });
  await nitroPicker("Sides").locator("select").first().selectOption({ label: "Cucumber Salad" });
  await nitroPicker("Sub Recipes").locator("select").first().selectOption({ label: "Teriyaki Sauce" });
  const teriyakiCost = nitroBlock.getByTestId("nessie-global-reference-plate-cost");
  await expect(teriyakiCost.getByTestId("reference-plate-83244.7")).toContainText("$3.22");
  await expect(teriyakiCost.getByTestId("reference-plate-83244.7")).toContainText("27.4%");
  await expect(teriyakiCost).not.toContainText("Plate Add");

  await page.getByRole("button", { name: exactName("East") }).click();
  await page.getByRole("button", { name: exactName("Blueshift") }).click();
  global = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  const anisaBlock = global.getByRole("heading", { name: "Monday + Tuesday" }).locator("xpath=ancestor::div[contains(@class,'rounded-3xl')][1]");
  await anisaBlock.locator("select").first().selectOption("AMZ: Anisa");
  const anisaPicker = (title) => anisaBlock.getByText(title, { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await anisaPicker("Entrees").locator("select").first().selectOption("chicken souvlaki kebab plate");
  await anisaPicker("Sides").locator("select").nth(0).selectOption("Grilled Vegetables");
  await anisaPicker("Sides").locator("select").nth(1).selectOption("crispy saffron rice with yogurt and eggs");
  await anisaPicker("Sub Recipes").locator("select").nth(0).selectOption("harissa relish");
  await anisaPicker("Sub Recipes").locator("select").nth(1).selectOption("mezze butter");
  await anisaPicker("Sub Recipes").locator("select").nth(2).selectOption("sumac onion relish");
  const anisaCost = anisaBlock.getByTestId("nessie-global-reference-plate-cost");
  const anisaPlate = anisaCost.getByTestId("reference-plate-216051");
  await expect(anisaPlate).toContainText(/\$4\.50.*\$4\.61/);
  await expect(anisaPlate).toContainText(/38\.3%.*39\.2%/);
  await expect(anisaCost).not.toContainText("Plate Add");
  await expect(anisaCost).not.toContainText(/Select .*Sub Recipe/i);

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
        const remote = page.getByLabel("Planner Remote Control");
        await expect(remote).toBeVisible();
        await expect(remote.getByRole("button", { name: "Expand", exact: true })).toHaveAttribute("aria-expanded", "false");
        await expect(remote.getByRole("button", { name: "Save Draft", exact: true })).toBeVisible();
        await expect(remote.getByRole("button", { name: "Submit", exact: true })).toBeVisible();
        await expect(remote.getByText("Save Draft", { exact: true })).toHaveCount(0);
        await expect(page.getByText(/System Status/i)).toBeVisible();
        await expect(page.getByRole("heading", { name: "Soup LTOs" })).toBeVisible();
        await expectNoAppProtection(page);
      }
    }
  }

  expectNoUnexpectedPageErrors(pageErrors);
});

test("Every cafe gets ten optional weekday soup slots with fixed 12 oz and 16 oz economics", async ({ page }) => {
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
  await page.getByRole("button", { name: exactName("Atlas") }).click();

  const soup = page.getByRole("heading", { name: "Soup LTOs" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(soup.getByText("optional", { exact: true })).toBeVisible();
  await expect(soup.locator("select")).toHaveCount(10);
  for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday"]) {
    await expect(soup.getByTestId(`soup-day-${day}`).locator("select")).toHaveCount(2);
  }
  await expect(soup.locator('option[value="Tomato Basil Soup"]')).toHaveCount(10);
  await expect(soup.locator('option[value="Huli Huli Chicken"]')).toHaveCount(0);
  await expect(soup.locator('option[value="__write_in__"]')).toHaveCount(0);
  await expect(soup.getByLabel("Monday Soup 1", { exact: true })).toBeVisible();
  await expect(soup.getByLabel("Friday Soup 2", { exact: true })).toBeVisible();

  await soup.getByTestId("soup-day-friday").locator("select").nth(1).selectOption("Tomato Basil Soup");
  const costing = soup.getByTestId("soup-portion-costing");
  await expect(costing.getByTestId("soup-cost-12oz")).toContainText("Cost $1.20");
  await expect(costing.getByTestId("soup-cost-12oz")).toContainText("Retail $5.00 · Food cost 24.0%");
  await expect(costing.getByTestId("soup-cost-16oz")).toContainText("Cost $1.60");
  await expect(costing.getByTestId("soup-cost-16oz")).toContainText("Retail $6.10 · Food cost 26.2%");
  await soup.getByTestId("soup-day-thursday").locator("select").first().selectOption("Vegetable Minestrone Soup");
  await expect(costing.getByText("Cost unavailable").first()).toBeVisible();

  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);
  const soupRecord = (storageWrites.at(-1)?.records || []).find((record) => record["Station Key"] === "soup" && record["Menu Item / Selection"] === "Tomato Basil Soup");
  expect(soupRecord).toMatchObject({
    "Menu / Concept": "AMZ: Cafe Express Soup",
    "Station / Sub-Concept": "Soup",
    "Menu Item / Selection": "Tomato Basil Soup",
    "Slot Number": 10,
  });
  const missingCostSoupRecord = (storageWrites.at(-1)?.records || []).find((record) => record["Station Key"] === "soup" && record["Menu Item / Selection"] === "Vegetable Minestrone Soup");
  expect(missingCostSoupRecord).toMatchObject({ "True Cost": "", "Food Cost %": "", "Slot Number": 7 });

  await page.reload();
  await page.getByRole("button", { name: /open rotations/i }).click();
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Atlas") }).click();
  const recalledSoup = page.getByRole("heading", { name: "Soup LTOs" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(recalledSoup.getByTestId("soup-day-friday").locator("select").nth(1)).toHaveValue("Tomato Basil Soup");
  await expect(recalledSoup.getByTestId("soup-day-thursday").locator("select").first()).toHaveValue("Vegetable Minestrone Soup");
  await expect(recalledSoup.getByTestId("soup-day-monday").locator("select").first()).toHaveValue("");

  await recalledSoup.getByTestId("soup-day-friday").locator("select").nth(1).selectOption("");
  await recalledSoup.getByTestId("soup-day-thursday").locator("select").first().selectOption("");
  const grill = page.getByRole("heading", { name: "Core Grill Additions" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await grill.locator("select").first().selectOption("crispy buffalo chicken wrap");
  const freshFive = page.getByRole("heading", { name: "Fresh $5" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await freshFive.locator("select").first().selectOption("Fresh 5 Black Bean Burger");
  await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeEnabled();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Legacy non-Cafe-Express soup rows are neither displayed, costed, nor re-saved", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const legacyWeek = "Aug 24, 2026 - Aug 28, 2026";
  const parent = "rotation|2026-08-24|North|Atlas";
  const storageWrites = [];
  const storedRecords = [
    rotationRecord({ id: parent, type: "Rotation Header", cafe: "Atlas", week: legacyWeek, status: "Draft" }),
    rotationRecord({ id: `${parent}|soup|base|LTO|1|Fresh 5 Black Bean Burger`, parent, type: "Station Selection", cafe: "Atlas", week: legacyWeek, status: "Draft", stationKey: "soup", selectionType: "LTO", item: "Fresh 5 Black Bean Burger", menu: "AMZ: Fresh Five", slot: 1 }),
  ];
  await stubEmptyRotationBackbone(page, {
    onStorageWrite: (body) => storageWrites.push(body),
    getStorageRecords: () => storedRecords,
  });

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: legacyWeek });
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Atlas") }).click();

  const soup = page.getByRole("heading", { name: "Soup LTOs" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(soup.getByLabel("Monday Soup 1", { exact: true })).toHaveValue("");
  await expect(soup.getByTestId("soup-portion-costing")).not.toContainText("Fresh 5 Black Bean Burger");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);
  expect((storageWrites.at(-1)?.records || []).filter((record) => record["Station Key"] === "soup")).toHaveLength(0);

  await expectNoAppProtection(page);
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

test("submitted Dawson Moby Pop-Up replaces only Moby Global presentation without persisting the projection", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const storageWrites = [];
  const normalWeek = "Aug 31, 2026 - Sep 4, 2026";
  const promoWeek = "Sep 7, 2026 - Sep 11, 2026";
  const draftWeek = "Oct 5, 2026 - Oct 9, 2026";
  const records = [
    ...submittedProjectionRecords({ week: normalWeek }),
    ...submittedProjectionRecords({ week: promoWeek, promo: true, mobyStatus: "Draft" }),
    ...submittedProjectionRecords({ week: draftWeek, includeMobyRecords: false, normalMenu: "AMZ: House of Teriyaki", normalEntree: "Chicken Teriyaki", normalSide: "Cucumber Salad" }),
  ];
  await stubEmptyRotationBackbone(page, { getStorageRecords: () => records, onStorageWrite: (body) => storageWrites.push(body) });

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
  await expect(promoMobyCard).toContainText("required stations");

  await promoMobyCard.click();
  const remote = page.getByLabel("Planner Remote Control");
  await remote.getByRole("button", { name: "View/Print", exact: true }).click();
  const printPreview = page.getByText("Weekly Rotation Packet", { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-3xl')][1]");
  await expect(printPreview).toContainText("One Day Showcase");
  await expect(printPreview).toContainText("Dawson Moby Pop-Up - Tuesday");
  await expect(printPreview).toContainText("Mac Salad");

  await remote.getByRole("button", { name: "Hide View", exact: true }).click();
  await page.getByRole("button", { name: "Executive View", exact: true }).click();
  await page.locator("select").first().selectOption({ label: draftWeek });
  const draftMobyCard = page.getByRole("button", { name: "Open Moby planner" });
  await expect(draftMobyCard).toContainText("AMZ: House of Teriyaki");
  await expect(draftMobyCard).toContainText("open");
  await draftMobyCard.click();
  const projectedGlobal = page.getByRole("heading", { name: "Global Station", exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(projectedGlobal).toContainText("Automatically supplied by Dawson");
  await expect(projectedGlobal).toContainText("AMZ: House of Teriyaki");
  await expect(projectedGlobal).toContainText("Chicken Teriyaki");
  await expect(projectedGlobal).toContainText("Cucumber Salad");
  await expect(projectedGlobal).toContainText("Dawson override active");
  await expect(projectedGlobal.locator("select")).toHaveCount(0);
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);
  const savedMobyRows = storageWrites.at(-1)?.records || [];
  expect(savedMobyRows.some((record) => record["Station Key"] === "global")).toBe(false);
  expect(savedMobyRows.some((record) => ["AMZ: House of Teriyaki", "Chicken Teriyaki", "Cucumber Salad"].includes(record["Menu Item / Selection"]))).toBe(false);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Everest Commissary belongs to Blueshift instead of Bingo", async ({ page }) => {
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
  await expect(page.getByRole("heading", { name: "Everest Commissary" })).toHaveCount(0);
  await expect(page.getByLabel("Jump to planner station")).not.toContainText("Everest Commissary");

  await page.getByRole("button", { name: exactName("Blueshift") }).click();
  await expect(page.getByRole("heading", { name: exactName("Blueshift") })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Everest Commissary" })).toBeVisible();
  await expect(page.getByLabel("Jump to planner station")).toContainText("Everest Commissary");
  await expect(page.getByText("Blueshift Commissary Station", { exact: true })).toBeVisible();

  const everest = page.getByRole("heading", { name: "Everest Commissary" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await everest.locator('input[placeholder="Type menu name"]').fill("Everest Blueshift Feature");
  await everest.getByPlaceholder("Entree 1 - Type item name").fill("Everest Curry Bowl");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);

  const savedRecords = storageWrites.at(-1)?.records || [];
  const everestRows = savedRecords.filter((record) => record["Station Key"] === "commissaryEverest");
  expect(everestRows.length).toBeGreaterThanOrEqual(2);
  expect(everestRows.some((record) => record["Menu Item / Selection"] === "Everest Blueshift Feature")).toBe(true);
  expect(everestRows.some((record) => record["Menu Item / Selection"] === "Everest Curry Bowl")).toBe(true);

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: exactName("East") }).click();
  await page.getByRole("button", { name: exactName("Blueshift") }).click();
  const recalledEverest = page.getByRole("heading", { name: "Everest Commissary" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(recalledEverest.locator('input[placeholder="Type menu name"]')).toHaveValue("Everest Blueshift Feature");
  await expect(recalledEverest.getByPlaceholder("Entree 1 - Type item name")).toHaveValue("Everest Curry Bowl");

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

test("Grace Global shows a Wednesday-Tuesday cycle and save/reload recall keeps the selected Global menu", async ({ page }) => {
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
  await page.getByRole("button", { name: exactName("Grace") }).click();
  await expect(page.getByRole("heading", { name: exactName("Grace") })).toBeVisible({ timeout: 20_000 });

  await expect(page.getByText(/Grace changes Global every Wednesday\./i)).toBeVisible();
  await expect(page.getByText("Monday + Tuesday Carryover")).toBeVisible();

  const globalSection = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(globalSection).toBeVisible();
  const menuSelect = globalSection.locator("select").first();
  await menuSelect.selectOption("AMZ: Ohana");
  const entreeSelect = globalSection.locator("select").nth(1);
  await entreeSelect.selectOption("Huli Huli Chicken");

  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);

  const savedRecords = storageWrites.at(-1)?.records || [];
  const globalRows = savedRecords.filter((record) => record["Café / Unit"] === "Grace" && record["Station Key"] === "global");
  expect(globalRows.some((record) => record["Record Type"] === "Global Block" && record["Menu / Concept"] === "AMZ: Ohana")).toBe(true);
  expect(globalRows.some((record) => record["Record Type"] === "Global Selection" && record["Menu Item / Selection"] === "Huli Huli Chicken" && record["Menu / Concept"] === "AMZ: Ohana")).toBe(true);

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: exactName("East") }).click();
  await page.getByRole("button", { name: exactName("Grace") }).click();
  const recalledGlobalSection = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await expect(recalledGlobalSection).toBeVisible({ timeout: 20_000 });
  await expect(recalledGlobalSection.locator("select").first()).toHaveValue("AMZ: Ohana");
  await expect(recalledGlobalSection.locator("select").nth(1)).toHaveValue("Huli Huli Chicken");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("East AMZ: Balti duplicate is exempt and does not block Astra from submitting alongside Bingo", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const week = "Jul 13, 2026 - Jul 17, 2026";
  const bingoParent = "rotation|balti-exempt|East|Bingo";
  const records = [
    rotationRecord({ id: bingoParent, type: "Rotation Header", cafe: "Bingo", week, district: "East", status: "Submitted" }),
    rotationRecord({ id: `${bingoParent}|global-block`, parent: bingoParent, type: "Global Block", cafe: "Bingo", week, district: "East", stationKey: "global", menu: "AMZ: Balti" }),
    rotationRecord({ id: `${bingoParent}|global-entree`, parent: bingoParent, type: "Global Selection", cafe: "Bingo", week, district: "East", stationKey: "global", selectionType: "Entrée", item: "Balti Chicken", menu: "AMZ: Balti" }),
  ];
  const storageWrites = [];
  let storedRecords = records;
  await stubEmptyRotationBackbone(page, {
    onStorageWrite: (body) => {
      storageWrites.push(body);
      storedRecords = body.records || [];
    },
    getStorageRecords: () => storedRecords,
  });

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: week });
  await page.getByRole("button", { name: exactName("East") }).click();
  await page.getByRole("button", { name: exactName("Astra") }).click();
  await expect(page.getByRole("heading", { name: exactName("Astra") })).toBeVisible({ timeout: 20_000 });

  const globalSection = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await globalSection.locator("select").first().selectOption("AMZ: Balti");
  await globalSection.locator("select").nth(1).selectOption("Balti Chicken");
  const freshFive = page.getByRole("heading", { name: "Fresh $5" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await freshFive.locator("select").first().selectOption("Fresh 5 Black Bean Burger");

  const remote = page.getByLabel("Planner Remote Control");
  await remote.getByRole("button", { name: "Expand", exact: true }).click();
  const submitButton = remote.getByRole("button", { name: "Submit", exact: true });
  await expect(submitButton).toHaveAttribute("aria-disabled", "false");
  await expect(page.getByText(/already selected by/i)).toHaveCount(0);
  await expect(page.getByText(/choose a different global menu/i)).toHaveCount(0);

  await submitButton.click();
  await expect(page.getByText("Fix this before submitting", { exact: true })).toHaveCount(0);
  await expect.poll(() => storageWrites.length).toBeGreaterThan(0);
  const savedRecords = storageWrites.at(-1)?.records || [];
  expect(savedRecords.some((record) => record["Café / Unit"] === "Astra" && record.Status === "Submitted" && record["Menu / Concept"] === "AMZ: Balti")).toBe(true);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("North cafes may select the same Global Menu without a district duplicate blocker", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const week = "Jul 20, 2026 - Jul 24, 2026";
  const dawsonParent = "rotation|north-duplicate-allowed|North|Dawson";
  const records = [
    rotationRecord({ id: dawsonParent, type: "Rotation Header", cafe: "Dawson", week, district: "North", status: "Submitted" }),
    rotationRecord({ id: `${dawsonParent}|global-block`, parent: dawsonParent, type: "Global Block", cafe: "Dawson", week, district: "North", stationKey: "global", menu: "AMZ: Ohana" }),
    rotationRecord({ id: `${dawsonParent}|global-entree`, parent: dawsonParent, type: "Global Selection", cafe: "Dawson", week, district: "North", stationKey: "global", selectionType: "Entrée", item: "Huli Huli Chicken", menu: "AMZ: Ohana" }),
  ];
  await stubEmptyRotationBackbone(page, { getStorageRecords: () => records });

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: week });
  await page.getByRole("button", { name: exactName("North") }).click();
  await page.getByRole("button", { name: exactName("Nessie") }).click();
  await expect(page.getByRole("heading", { name: exactName("Nessie") })).toBeVisible({ timeout: 20_000 });

  const globalSection = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await globalSection.locator("select").first().selectOption("AMZ: Ohana");
  await globalSection.locator("select").nth(1).selectOption("Huli Huli Chicken");

  const remote = page.getByLabel("Planner Remote Control");
  await remote.getByRole("button", { name: "Expand", exact: true }).click();
  const submitButton = remote.getByRole("button", { name: "Submit", exact: true });
  await expect(submitButton).toHaveAttribute("aria-disabled", "true");
  await expect(submitButton).toHaveAttribute("title", /required station/i);
  await expect(submitButton).not.toHaveAttribute("title", /already selected|different Global Menu|duplicate/i);
  await expect(page.getByText(/already selected by|choose a different global menu/i)).toHaveCount(0);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("East non-Balti Global Menu duplicate still blocks submission (regression)", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const week = "Jul 20, 2026 - Jul 24, 2026";
  const bingoParent = "rotation|non-balti-conflict|East|Bingo";
  const records = [
    rotationRecord({ id: bingoParent, type: "Rotation Header", cafe: "Bingo", week, district: "East", status: "Submitted" }),
    rotationRecord({ id: `${bingoParent}|global-block`, parent: bingoParent, type: "Global Block", cafe: "Bingo", week, district: "East", stationKey: "global", menu: "AMZ: Ohana" }),
    rotationRecord({ id: `${bingoParent}|global-entree`, parent: bingoParent, type: "Global Selection", cafe: "Bingo", week, district: "East", stationKey: "global", selectionType: "Entrée", item: "Huli Huli Chicken", menu: "AMZ: Ohana" }),
  ];
  await stubEmptyRotationBackbone(page, { getStorageRecords: () => records });

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.locator("select").first().selectOption({ label: week });
  await page.getByRole("button", { name: exactName("East") }).click();
  await page.getByRole("button", { name: exactName("Astra") }).click();
  await expect(page.getByRole("heading", { name: exactName("Astra") })).toBeVisible({ timeout: 20_000 });

  const globalSection = page.getByRole("heading", { name: "Global Station" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await globalSection.locator("select").first().selectOption("AMZ: Ohana");
  await globalSection.locator("select").nth(1).selectOption("Huli Huli Chicken");
  const freshFive = page.getByRole("heading", { name: "Fresh $5" }).locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  await freshFive.locator("select").first().selectOption("Fresh 5 Black Bean Burger");

  const remote = page.getByLabel("Planner Remote Control");
  await remote.getByRole("button", { name: "Expand", exact: true }).click();
  const submitButton = remote.getByRole("button", { name: "Submit", exact: true });
  await expect(submitButton).toHaveAttribute("aria-disabled", "true");
  await expect(submitButton).toHaveAttribute("title", /already selected by 1 other caf/i);

  await submitButton.click({ force: true });
  const blockedModal = page.getByRole("dialog", { name: "Fix this before submitting" });
  await expect(blockedModal).toBeVisible();
  await expect(blockedModal.getByText(/AMZ: Ohana is already selected by 1 other caf.*Choose a different Global Menu/i)).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
