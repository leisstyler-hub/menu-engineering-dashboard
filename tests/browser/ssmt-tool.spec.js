import { expect, test } from "@playwright/test";
import XLSX from "xlsx";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors } from "./smoke-helpers.js";

test("SSMT opens behind passcode and separates pricing from menu building", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.goto("/");

  await expect(page.getByRole("button", { name: /open ssmt/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /open ssmt/i }).click();

  await expect(page.getByRole("heading", { name: /^SSMT$/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/passcode required/i)).toBeVisible();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();

  await expect(page.getByRole("button", { name: "Pricing Structure", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu Selector / New Menu", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Pricing Structure", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Pricing Structure$/ })).toBeVisible();
  await expect(page.getByText(/AUS, BNA, BOS, BWI, DEN, IAD, JFK, LAX, SAN, SNA, SEA, SJC, WAS, YVR, YYZ, MCO/i)).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "SEA price + category" })).toBeVisible();
  await page.getByLabel(/New pricing category/i).fill("Smoke test price");
  await page.getByLabel(/New SEA price/i).fill("$12.34");
  await page.getByRole("button", { name: /Add pricing row/i }).click();
  await expect(page.getByText("$12.34 - Smoke test price")).toBeVisible();

  await page.getByLabel("Tier pricing for $12.34 - Smoke test price").check();
  await expect(page.getByLabel(/Tier 1 price for .*Smoke test price/)).toHaveValue("$12.34");
  await expect(page.getByLabel(/Tier 2 price for .*Smoke test price/)).toHaveValue("");
  await page.getByLabel(/Tier 1 price for .*Smoke test price/).fill("10.00");
  await page.getByLabel(/Tier 2 price for .*Smoke test price/).fill("12.00");
  await expect(page.getByText("$10.00 - Smoke test price")).toBeVisible();
  await page.getByLabel("Tier pricing for $10.00 - Smoke test price").uncheck();
  await expect(page.getByLabel("SEA price for $12.34 - Smoke test price")).toHaveValue("$12.34");
  await expect(page.getByLabel("AUS price for $12.34 - Smoke test price")).toHaveValue("");
  await page.getByLabel("Tier pricing for $12.34 - Smoke test price").check();
  await expect(page.getByLabel(/Tier 1 price for .*Smoke test price/)).toHaveValue("10.00");
  await expect(page.getByLabel(/Tier 2 price for .*Smoke test price/)).toHaveValue("12.00");

  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Menu Selector$/ })).toBeVisible();
  await expect(page.getByText(/Loading current SSMT seed data/i)).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByTestId("ssmt-handoff-Experience review").getByRole("heading", { name: /Experience Team/i })).toBeVisible();
  await expect(page.getByTestId("ssmt-handoff-IT programming").getByRole("heading", { name: /IT Team/i })).toBeVisible();
  await expect(page.getByTestId(/ssmt-phase-count-/)).toHaveCount(0);
  await expect(page.getByText(/Core\/Global IT complete/i)).toHaveCount(0);
  await expect(page.getByText(/Needs completion/i).first()).toBeVisible();
  await page.getByLabel(/New menu name/i).fill("Smoke Test Promo Menu");
  await page.getByLabel(/New menu type/i).selectOption("Promotion");
  await page.getByRole("button", { name: /Create menu/i }).click();

  await expect(page.getByRole("heading", { name: /^Smoke Test Promo Menu$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Back to menu selection/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pricing table/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Delete menu/i })).toBeVisible();
  await expect(page.getByText(/Pending IT complete/i)).toHaveCount(0);

  await page.getByLabel(/Active start/i).fill("2026-09-01");
  await page.getByLabel(/Active end/i).fill("2026-09-30");
  await expect(page.getByLabel(/Active start/i)).toHaveValue("2026-09-01");
  await expect(page.getByLabel(/Active end/i)).toHaveValue("2026-09-30");

  await page.getByText("Edit signal").click();
  await expect(page.getByLabel(/Active start/i)).toBeVisible();

  await page.getByRole("button", { name: /Add divider/i }).click();
  await page.getByLabel(/Divider title/i).first().fill("Grill");
  await expect(page.getByLabel(/Divider title/i).first()).toHaveValue("Grill");

  const labelInput = page.getByLabel(/Item label/i).first();
  await labelInput.fill("smoke test label");
  await expect(labelInput).toHaveValue("SMOKE TEST LABEL");

  const descriptionInput = page.getByLabel(/Description/i).first();
  await descriptionInput.fill("Needs Sentence Case");
  await expect(descriptionInput).toHaveValue("needs sentence case");

  const categoryInput = page.getByLabel(/Category for/i).first();
  await categoryInput.fill("Typed Category");
  await expect(categoryInput).toHaveValue("Typed Category");

  const fixyInput = page.getByLabel(/Fixy for/i).first();
  await fixyInput.fill("GRILL 1");
  await expect(fixyInput).toHaveValue("GRILL 1");

  await expect(page.getByLabel(/SEA price for/i).first()).toBeVisible();
  await page.getByLabel(/SEA price for/i).first().selectOption({ label: "$10.00 - Smoke test price" });
  await expect(page.getByLabel(/SEA price for/i).first()).not.toHaveValue("");
  await expect(page.getByLabel(/Area prices for/i).first()).toContainText("AUS");
  await expect(page.getByLabel(/Area prices for/i).first()).toContainText("MCO");
  const areaPriceCell = page.getByLabel(/Area prices for/i).first();
  const expectedAreas = ["AUS", "BNA", "BOS", "BWI", "DEN", "IAD", "JFK", "LAX", "SAN", "SNA", "SEA", "SJC", "WAS", "YVR", "YYZ", "MCO"];
  const renderedAreas = await areaPriceCell.locator("button").evaluateAll((buttons) =>
    buttons.map((button) => button.querySelector("span")?.textContent.trim() || "")
  );
  expect(renderedAreas).toEqual(expectedAreas);
  expect(renderedAreas.some((area) => /^\+\d+$/.test(area))).toBe(false);
  const renderedAreaPrices = await areaPriceCell.locator("button").evaluateAll((buttons) =>
    Object.fromEntries(buttons.map((button) => {
      const spans = button.querySelectorAll("span");
      return [spans[0]?.textContent.trim() || "", spans[1]?.textContent.trim() || ""];
    }))
  );
  expect(renderedAreaPrices).toMatchObject({ AUS: "12.00", BNA: "12.00", YVR: "12.00", YYZ: "12.00", SEA: "10.00", MCO: "10.00" });

  const caloriesInput = page.getByLabel(/Calories for/i).first();
  await caloriesInput.fill("540");
  await expect(caloriesInput).toHaveValue("540");

  await page.getByRole("button", { name: /view modifiers/i }).first().click();
  const modifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await expect(modifierDialog).toBeVisible();
  await expect(modifierDialog.getByText(/copy places a modifier group on the SSMT clipboard/i)).toBeVisible();
  await expect(modifierDialog.getByText(/No modifier groups attached/i)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(modifierDialog).toHaveCount(0);

  await page.getByRole("button", { name: /flag for change/i }).first().click();
  const flagDialog = page.getByRole("dialog", { name: /flag for change/i });
  await expect(flagDialog).toBeVisible();
  await expect(flagDialog.getByLabel(/Reason/i)).toHaveValue("Description correction");
  await flagDialog.getByLabel(/Note/i).fill("description needs review");
  await flagDialog.getByRole("button", { name: /report/i }).click();
  await expect(page.getByText(/alexander\.neuse@compass-usa\.com/i)).toBeVisible();
  await expect(page.getByText(/tyler\.leiss@compass-usa\.com/i)).toBeVisible();

  await page.getByRole("button", { name: /Delete menu/i }).click();
  const deleteDialog = page.getByRole("dialog", { name: /Delete menu/i });
  await expect(deleteDialog).toBeVisible();
  await expect(deleteDialog.getByLabel(/Retype menu name/i)).toBeVisible();
  await expect(deleteDialog.getByRole("button", { name: "Delete menu", exact: true })).toBeDisabled();
  await deleteDialog.getByLabel(/Retype menu name/i).fill("Smoke Test");
  await expect(deleteDialog.getByRole("button", { name: "Delete menu", exact: true })).toBeDisabled();
  await deleteDialog.getByLabel(/Retype menu name/i).fill("Smoke Test Promo Menu");
  await expect(deleteDialog.getByRole("button", { name: "Delete menu", exact: true })).toBeEnabled();
  await deleteDialog.getByRole("button", { name: "Delete menu", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Menu Selector$/ })).toBeVisible();

  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^The Daily/i }).click();
  await expect(page.getByText(/Active dates are only required for Promotion and Thompson Hospitality/i)).toBeVisible();
  await expect(page.getByText(/Workbook value needs pricing structure match/i).first()).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT moves a menu with the in-menu bucket selector without freezing", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const bucketMenuName = "BUCKET MOVE TEST MENU";
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByLabel(/New menu name/i).fill(bucketMenuName);
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();
  await expect(page.getByRole("heading", { name: bucketMenuName })).toBeVisible();
  const moveStartedAt = Date.now();
  await page.getByLabel(/Menu bucket/i).selectOption("Global");
  expect(Date.now() - moveStartedAt).toBeLessThan(1_000);
  await page.getByRole("button", { name: /Back to menu selection/i }).click();

  const coreGroup = page.getByTestId("ssmt-menu-group-Core");
  const globalGroup = page.getByTestId("ssmt-menu-group-Global");
  await expect(coreGroup.locator(`[data-menu-name="${bucketMenuName}"]`)).toHaveCount(0);
  await expect(globalGroup.locator(`[data-menu-name="${bucketMenuName}"]`)).toBeVisible();

  // Bucket moves flow through the same autosave effects as every other edit and must stay
  // responsive before and after those effects settle.
  await expect(page.getByRole("button", { name: "Menu Selector / New Menu", exact: true })).toBeEnabled();
  await page.waitForTimeout(600);
  await expect(page.getByRole("heading", { name: /^Menu Selector$/ })).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT shows clickable Experience and IT handoff queues below the selector", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const handoffMenus = [
    { id: "experience-handoff", name: "Experience Handoff Menu", type: "Core", phase: "Experience review", status: "Experience review", items: [] },
    { id: "it-handoff", name: "IT Handoff Menu", type: "Global", phase: "IT programming", status: "IT programming", items: [] },
    { id: "draft-menu", name: "Draft Menu", type: "Core", phase: "Culinary draft", status: "Culinary draft", items: [] },
  ];
  await page.addInitScript(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.searchParams.get("tool") === "SSMT") {
      await route.fulfill({ json: { ok: true, source: "supabase", records: [{ "Record ID": "ssmt|workspace|current", "Record Type": "SSMT Workspace", Status: "Shared", menus: handoffMenus, priceBook: [], modifierGroups: [], selectedMenuId: "draft-menu", updatedAt: "2026-09-24T18:00:00.000Z" }] } });
      return;
    }
    if (request.method() === "POST") { await route.fulfill({ json: { ok: true, source: "supabase", synced: 1 } }); return; }
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  const selector = page.getByTestId("ssmt-menu-selector");
  const experienceQueue = selector.getByTestId("ssmt-handoff-Experience review");
  const itQueue = selector.getByTestId("ssmt-handoff-IT programming");
  await expect(experienceQueue.getByRole("heading", { name: /Experience Team/i })).toBeVisible();
  await expect(experienceQueue.getByText(/1 menu ready for Experience Department review/i)).toBeVisible();
  await expect(itQueue.getByRole("heading", { name: /IT Team/i })).toBeVisible();
  await expect(itQueue.getByText(/1 menu ready for IT programming/i)).toBeVisible();
  await expect(selector.getByTestId(/ssmt-phase-count-/)).toHaveCount(0);
  await experienceQueue.getByRole("button", { name: /Experience Handoff Menu/i }).click();
  await expect(page.getByRole("heading", { name: "Experience Handoff Menu" })).toBeVisible();
  await page.getByRole("button", { name: /Back to menu selection/i }).click();
  await itQueue.getByRole("button", { name: /IT Handoff Menu/i }).click();
  await expect(page.getByRole("heading", { name: "IT Handoff Menu" })).toBeVisible();
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
test("SSMT groups menus by type and supports row editing, ordering, and saved phase status", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  // Downstream-visible throwaway menu. Must NOT match the /smoke.?test/i filter in
  // ssmtDerivedMenuSource.js, since this test asserts the menu reaches the
  // downstream preview once it is IT complete. Deleted on teardown below.
  const orderingMenuName = `Ordering Regression ${Date.now()}`;
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await expect(page.getByText(/Loading current SSMT seed data/i)).toHaveCount(0, { timeout: 20_000 });

  const firstCoreGroup = page.getByTestId("ssmt-menu-group-Core");
  const globalGroup = page.getByTestId("ssmt-menu-group-Global");
  const menuLibraryGroup = page.getByTestId("ssmt-menu-group-Menu Library");
  const promotionsGroup = page.getByTestId("ssmt-menu-group-Promotion");
  const thompsonGroup = page.getByTestId("ssmt-menu-group-Thompson Hospitality");
  await expect(firstCoreGroup).toBeVisible();
  await expect(globalGroup).toBeVisible();
  await expect(menuLibraryGroup).toBeVisible();
  await expect(promotionsGroup).toBeVisible();
  await expect(thompsonGroup).toBeVisible();

  await expect(firstCoreGroup).toHaveClass(/border-emerald-400/);
  await expect(globalGroup).toHaveClass(/border-sky-400/);
  await expect(menuLibraryGroup).toHaveClass(/border-violet-400/);
  await expect(promotionsGroup).toHaveClass(/border-amber-400/);
  await expect(thompsonGroup).toHaveClass(/border-fuchsia-400/);

  const groupOrder = await page.getByTestId(/ssmt-menu-group-/).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-menu-type")));
  expect(groupOrder).toEqual(["Core", "Global", "Menu Library", "Promotion", "Thompson Hospitality"]);

  const coreNames = await firstCoreGroup.locator("[data-menu-name]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-menu-name")));
  expect([...coreNames].sort((a, b) => a.localeCompare(b))).toEqual(coreNames);
  const globalNames = await globalGroup.locator("[data-menu-name]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-menu-name")));
  expect([...globalNames].sort((a, b) => a.localeCompare(b))).toEqual(globalNames);
  expect(globalNames).toEqual(expect.arrayContaining([
    "Andes",
    "Anisa",
    "Atlas Noodle",
    "Balti",
    "Bibimbowl",
    "Bowld",
    "Cevicheria",
    "Chatwalla",
    "Chiang Mai",
    "Ciudad",
    "Cypress",
    "Global Grains",
    "Harvest & Co",
    "House of Teriyaki",
    "Lemongrass Lime",
    "Lotus",
    "Masaya",
    "Ohana",
    "Pho",
    "Piccola Italia",
    "Poke",
    "Porto",
    "Q Bowl",
    "Retail Extensions",
    "Roam BBQ",
    "Saffron",
    "SE: Birria",
    "SE: Fried Rice",
    "SE: Naanwich",
    "SE: Pho Dip",
    "SE: Quesadilla",
    "Smokehouse BBQ",
    "Smoothies",
    "Sushi",
    "Tavola Nova",
    "Yakisoba",
  ]));

  await page.getByLabel(/New menu name/i).fill(orderingMenuName);
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();
  await expect(page.getByRole("heading", { name: orderingMenuName })).toBeVisible();

  await page.getByRole("button", { name: /Lock item NEW ITEM/i }).click();
  await page.getByLabel(/Phase/i).selectOption("IT complete");
  await page.getByRole("button", { name: /Back to menu selection/i }).click();
  await page.locator(`[data-menu-name="${orderingMenuName}"]`).click();
  await expect(page.getByLabel(/Phase/i)).toHaveValue("IT complete");
  await expect(page.getByTestId("ssmt-workspace-sync")).toContainText(/Shared SSMT workspace saved/i, { timeout: 20_000 });

  await page.reload();
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.locator(`[data-menu-name="${orderingMenuName}"]`).click();
  await expect(page.getByLabel(/Phase/i)).toHaveValue("IT complete");

  await page.getByRole("button", { name: /Unlock item NEW ITEM/i }).click();
  await page.getByRole("button", { name: /Add item/i }).click();
  const labels = page.getByLabel(/Item label/i);
  await expect(labels).toHaveCount(2);
  await labels.nth(0).fill("alpha item");
  await labels.nth(1).fill("beta item");
  await expect(labels.nth(0)).toHaveValue("ALPHA ITEM");
  await expect(labels.nth(1)).toHaveValue("BETA ITEM");

  await page.getByRole("button", { name: /Add divider/i }).click();
  await page.getByLabel(/Divider title/i).fill("Soups");
  await page.getByTestId(/ssmt-row-divider/).dragTo(page.getByTestId(/ssmt-row-item/).first());
  await expect(page.getByTestId("ssmt-builder-body").locator("tr").first()).toHaveAttribute("data-row-kind", "divider");

  await page.getByRole("button", { name: /Add sub menu/i }).click();
  const submenuRow = page.getByTestId(/ssmt-row-submenu/).first();
  await expect(submenuRow).toBeVisible();
  await expect(submenuRow).toHaveAttribute("data-row-kind", "submenu");
  await submenuRow.getByLabel(/Sub menu title/i).fill("Curated Sandwiches");
  await submenuRow.dragTo(page.getByTestId(/ssmt-row-item/).nth(1));
  const submenuBackground = await submenuRow.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(submenuBackground).toBe("rgb(238, 242, 255)");

  await expect(page.getByRole("columnheader", { name: "Fixy" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "FOH / Fixy" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "SEA price" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Category", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Secondary category" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Scan & Pay" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Area prices" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Calories" })).toBeVisible();
  const builderHeaderOrder = await page.getByRole("columnheader").allInnerTexts();
  expect(builderHeaderOrder.map((text) => text.toUpperCase())).toEqual([
    "MOVE", "DIET", "FIXY", "LABEL", "DESCRIPTION", "MRN", "CALORIES",
    "SEA PRICE", "CATEGORY", "SECONDARY CATEGORY", "VEGAN / VEGETARIAN", "SCAN & PAY", "PHOTO LINK", "AREA PRICES", "ACTIONS",
  ]);

  const scanPayInput = page.getByLabel(/Scan and Pay UPC for/i).first();
  await scanPayInput.fill("012345678905");
  await expect(scanPayInput).toHaveValue("012345678905");

  const fixyInput = page.getByLabel(/Fixy for/i).first();
  await fixyInput.fill("station a");
  await expect(fixyInput).toHaveValue("station a");
  const mrnInput = page.getByLabel(/MRN for/i).first();
  await mrnInput.fill("123456.78");
  await expect(mrnInput).toHaveValue("123456.78");
  await expect(page.getByText(/^N\/A$/).first()).toBeVisible();

  await page.getByLabel(/Category for/i).first().fill("entree");
  await page.getByLabel(/Secondary category for/i).first().fill("grill");
  await expect(page.getByLabel(/Category for/i).first()).toHaveValue("entree");
  await expect(page.getByLabel(/Secondary category for/i).first()).toHaveValue("grill");

  await page.getByRole("button", { name: /Lock item BETA ITEM/i }).click();
  await page.getByLabel(/Current SSMT phase/i).selectOption("IT complete");
  await expect(page.getByTestId("ssmt-derived-source-preview")).toContainText(`AMZ: ${orderingMenuName} - Curated Sandwiches`);

  await submenuRow.getByRole("button", { name: /Delete sub menu/i }).click();
  await page.getByRole("dialog", { name: /Delete sub menu/i }).getByLabel(/Confirm delete Curated Sandwiches/i).check();
  await page.getByRole("dialog", { name: /Delete sub menu/i }).getByRole("button", { name: "Delete sub menu", exact: true }).click();
  await expect(page.getByTestId(/ssmt-row-submenu/)).toHaveCount(0);

  await page.getByRole("button", { name: /Unlock item BETA ITEM/i }).click();
  await page.getByRole("button", { name: /Delete item ALPHA ITEM/i }).click();
  const itemDeleteDialog = page.getByRole("dialog", { name: /Delete item/i });
  await expect(itemDeleteDialog).toBeVisible();
  await itemDeleteDialog.getByLabel(/Confirm delete ALPHA ITEM/i).check();
  await itemDeleteDialog.getByRole("button", { name: "Delete item", exact: true }).click();
  await expect(page.getByLabel(/Item label/i).first()).toHaveValue("BETA ITEM");

  // Teardown: delete this throwaway menu so it does not leak into the shared SSMT
  // workspace (a single live Supabase row). Post-deploy live runs write to prod,
  // so without this cleanup every run left a permanent "IT complete" Core menu
  // that surfaced in the Menu Library / Neighborhood Rotations selectors. Mirrors
  // the sibling test's cleanup of its own "Smoke Test Promo Menu".
  await page.getByRole("button", { name: /Delete menu/i }).click();
  const deleteDialog = page.getByRole("dialog", { name: /Delete menu/i });
  await deleteDialog.getByLabel(/Retype menu name/i).fill(orderingMenuName);
  await expect(deleteDialog.getByRole("button", { name: "Delete menu", exact: true })).toBeEnabled();
  await deleteDialog.getByRole("button", { name: "Delete menu", exact: true }).click();
  await expect(page.getByRole("heading", { name: orderingMenuName })).toHaveCount(0);
  await expect(page.getByTestId("ssmt-workspace-sync")).toContainText(/Shared SSMT workspace saved/i, { timeout: 20_000 });

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

// This test runs entirely against a mocked "**/api/storage/records**" route — never the
// real shared Supabase workspace. A 2026-09-19 incident showed a browser test that hit the
// live SSMT record directly (goto "/" + real Save) can save mid-load state over
// ssmt|workspace|current and wipe bucket/phase assignments and Divider/Sub Menu rows in
// production. See ARCHITECTURE_RULES.md / GOVERNANCE.md: verification must use isolated
// fixtures, never the live record.
test("SSMT shares one item across multiple sub menus without duplicating its saved record", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const savedBodies = [];
  const sharedSubmenuFixture = () => ({
    id: "shared-submenu-menu",
    name: "Shared Submenu Fixture",
    centricMenuName: "",
    webtritionMasterMenuName: "",
    sourceSheet: "Shared storage test",
    includeReason: "Created in SSMT",
    type: "Core",
    phase: "IT complete",
    status: "Draft",
    activeStart: "",
    activeEnd: "",
    completedAt: "",
    editSignal: false,
    flags: [],
    downstreamEligibleAfter: "IT complete",
    items: [
      { id: "submenu-amaz", recordType: "divider", dividerKind: "submenu", title: "Amaz Lebanese" },
      {
        id: "shared-mezze",
        label: "SHARED MEZZE",
        name: "SHARED MEZZE",
        description: "",
        mrn: "111111.11",
        category: "Entree",
        fohColumn: "IT 1",
        secondaryCategory: "",
        brandMenu: "",
        calories: "",
        priceSelectorId: "",
        seaPrice: "$8.00",
        workbookSeaPrice: "",
        priceReviewStatus: "Pricing structure match",
        areaPrices: { AUS: "$8.00", SEA: "$8.00", MCO: "$8.00" },
        modifierGroups: [],
        additionalSubmenuIds: [],
        lockedForCentric: false,
      },
      { id: "submenu-persian", recordType: "divider", dividerKind: "submenu", title: "Persian" },
      {
        id: "persian-rice",
        label: "PERSIAN RICE",
        name: "PERSIAN RICE",
        description: "",
        mrn: "222222.22",
        category: "Entree",
        fohColumn: "IT 1",
        secondaryCategory: "",
        brandMenu: "",
        calories: "",
        priceSelectorId: "",
        seaPrice: "$7.00",
        workbookSeaPrice: "",
        priceReviewStatus: "Pricing structure match",
        areaPrices: { AUS: "$7.00", SEA: "$7.00", MCO: "$7.00" },
        modifierGroups: [],
        additionalSubmenuIds: [],
        lockedForCentric: false,
      },
    ],
  });
  let currentMenus = [sharedSubmenuFixture()];

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.searchParams.get("tool") === "SSMT") {
      await route.fulfill({
        json: {
          ok: true,
          source: "supabase",
          records: [
            {
              "Record ID": "ssmt|workspace|current",
              "Record Type": "SSMT Workspace",
              Status: "Shared",
              menus: currentMenus,
              priceBook: [],
              modifierGroups: [],
              selectedMenuId: "shared-submenu-menu",
              updatedAt: "2026-09-19T06:00:00.000Z",
            },
          ],
        },
      });
      return;
    }
    if (request.method() === "POST") {
      const body = request.postDataJSON();
      savedBodies.push(body);
      const savedRecord = (body?.records || []).find((candidate) => candidate?.["Record ID"] === "ssmt|workspace|current");
      if (savedRecord?.menus) currentMenus = savedRecord.menus;
      await route.fulfill({ json: { ok: true, source: "supabase", synced: 1, message: "Saved 1 row to Supabase." } });
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^Shared Submenu Fixture/i }).click();
  await expect(page.getByRole("heading", { name: /^Shared Submenu Fixture$/ })).toBeVisible();

  const lebaneseSection = page.getByTestId(/ssmt-builder-section-submenu/).nth(0);
  const persianSection = page.getByTestId(/ssmt-builder-section-submenu/).nth(1);
  await expect(lebaneseSection).toContainText("1 item");
  await expect(lebaneseSection).not.toContainText("shared");
  await expect(persianSection).toContainText("1 item");
  await expect(page.getByTestId("ssmt-derived-source-preview")).toContainText("AMZ: Shared Submenu Fixture - Amaz Lebanese (1)");
  await expect(page.getByTestId("ssmt-derived-source-preview")).toContainText("AMZ: Shared Submenu Fixture - Persian (1)");

  await page.getByRole("button", { name: /Also in for SHARED MEZZE/i }).click();
  await expect(page.getByRole("checkbox", { name: /Persian/i })).not.toBeChecked();
  await page.getByRole("checkbox", { name: /Persian/i }).check();
  await page.getByRole("button", { name: /Close Also in sub menus/i }).click();

  await expect(lebaneseSection).toContainText("1 item · 1 shared");
  await expect(persianSection).toContainText("2 items · 1 shared");
  expect(await page.getByLabel("Item label").evaluateAll((inputs) => inputs.filter((input) => input.value === "SHARED MEZZE").length)).toBe(2);
  await expect(page.getByTestId("ssmt-derived-source-preview")).toContainText("AMZ: Shared Submenu Fixture - Amaz Lebanese (1)");
  await expect(page.getByTestId("ssmt-derived-source-preview")).toContainText("AMZ: Shared Submenu Fixture - Persian (2)");

  await page.getByRole("button", { name: /Save menu/i }).click();
  await expect(page.getByTestId("ssmt-workspace-sync")).toContainText(/Shared SSMT workspace saved/i, { timeout: 20_000 });

  await expect.poll(() => {
    const record = savedBodies
      .flatMap((body) => body?.records || [])
      .find((candidate) => candidate?.["Record ID"] === "ssmt|workspace|current");
    return record?.menus?.find((menu) => menu.id === "shared-submenu-menu")
      ?.items?.find((item) => item.id === "shared-mezze")
      ?.additionalSubmenuIds;
  }).toEqual(["submenu-persian"]);

  await page.reload();
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^Shared Submenu Fixture/i }).click();
  expect(await page.getByLabel("Item label").evaluateAll((inputs) => inputs.filter((input) => input.value === "SHARED MEZZE").length)).toBe(2);
  await page.getByRole("button", { name: /Also in for SHARED MEZZE/i }).first().click();
  await expect(page.getByRole("checkbox", { name: /Persian/i })).toBeChecked();
  await page.getByRole("button", { name: /Close Also in sub menus/i }).click();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT selector and builder keep dense records and wide tables usable without bottom-only scrolling", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();

  const selectorGrid = page.getByTestId("ssmt-menu-selector-grid");
  await expect(selectorGrid).toBeVisible();
  const selectorColumns = await selectorGrid.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(selectorColumns).toBeGreaterThanOrEqual(4);

  for (const type of ["Core", "Global", "Promotion", "Thompson Hospitality"]) {
    const box = await page.getByTestId(`ssmt-menu-group-${type}`).boundingBox();
    expect(box?.y).toBeGreaterThanOrEqual(0);
    expect((box?.y || 0) + (box?.height || 0)).toBeLessThanOrEqual(900);
  }

  await page.getByRole("button", { name: /^The Daily/i }).click();
  const builderScroll = page.getByTestId("ssmt-builder-scroll");
  await expect(builderScroll).toBeVisible();
  const scrollMetrics = await builderScroll.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      maxHeight: style.maxHeight,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    };
  });
  expect(scrollMetrics.overflowX).toBe("auto");
  expect(scrollMetrics.overflowY).toBe("auto");
  expect(scrollMetrics.maxHeight).not.toBe("none");
  expect(scrollMetrics.scrollWidth).toBeGreaterThan(scrollMetrics.clientWidth);

  const labelInput = page.getByLabel(/Item label/i).first();
  await labelInput.fill("roasted poblano chicken torta with avocado crema");
  const labelWidth = await labelInput.evaluate((node) => node.getBoundingClientRect().width);
  expect(labelWidth).toBeGreaterThanOrEqual(300);

  const descriptionInput = page.getByLabel(/Description/i).first();
  await descriptionInput.fill("fire roasted poblano chicken layered with avocado crema, crisp vegetables, pickled onions, and a citrus chile finish");
  const descriptionFits = await descriptionInput.evaluate((node) => node.scrollHeight <= node.clientHeight + 4);
  expect(descriptionFits).toBe(true);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT Fixy field keeps Peruvian Shrimp readable", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^The Daily/i }).click();

  const fixyInput = page.getByLabel(/Fixy for/i).first();
  await fixyInput.fill("Peruvian Shrimp");
  await expect(fixyInput).toHaveValue("Peruvian Shrimp");
  const fixyWidth = await fixyInput.evaluate((node) => node.getBoundingClientRect().width);
  const photoLinkWidth = await page.getByLabel(/Photo link for/i).first().evaluate((node) => node.getBoundingClientRect().width);
  expect(fixyWidth).toBeGreaterThanOrEqual(215);
  expect(fixyWidth - photoLinkWidth).toBeGreaterThanOrEqual(50);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT builder locks at a readable maximized desktop width and shows more menu rows", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 3000, height: 1200 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^The Daily/i }).click();
  for (let index = 0; index < 12; index += 1) {
    await page.getByRole("button", { name: /Add item/i }).click();
  }

  const builderScroll = page.getByTestId("ssmt-builder-scroll");
  await expect(builderScroll).toBeVisible();
  const builderMetrics = await builderScroll.evaluate((node) => {
    const rows = Array.from(node.querySelectorAll("tbody tr[data-row-kind='item']"));
    const firstRowHeight = rows[0]?.getBoundingClientRect().height || 0;
    const rowTop = rows[0]?.getBoundingClientRect().top || 0;
    const scrollBottom = node.getBoundingClientRect().bottom;
    const visibleRows = rows.filter((row) => {
      const box = row.getBoundingClientRect();
      return box.top >= rowTop - 1 && box.bottom <= scrollBottom + 1;
    }).length;
    return {
      width: node.getBoundingClientRect().width,
      firstRowHeight,
      visibleRows,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    };
  });
  expect(builderMetrics.width).toBeGreaterThanOrEqual(2520);
  expect(builderMetrics.width).toBeLessThanOrEqual(2780);
  expect(builderMetrics.firstRowHeight).toBeLessThanOrEqual(83);
  expect(builderMetrics.visibleRows).toBeGreaterThanOrEqual(10);
  expect(builderMetrics.scrollWidth).toBeLessThanOrEqual(builderMetrics.clientWidth + 4);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT item locks enable Centric copy fields and gate phase advancement", async ({ page, context }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1800, height: 950 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByLabel(/New menu name/i).fill("Centric Copy Lock Test");
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();
  await page.getByRole("button", { name: /Add item/i }).click();

  const phasePanel = page.getByTestId("ssmt-phase-panel");
  await expect(phasePanel).toBeVisible();
  await expect(phasePanel.getByText(/0 of 2 item rows locked/i)).toBeVisible();
  const phaseSelect = page.getByLabel(/Current SSMT phase/i);
  const experienceOptionDisabled = await phaseSelect.locator("option", { hasText: "Experience review" }).evaluate((option) => option.disabled);
  expect(experienceOptionDisabled).toBe(true);

  await page.getByLabel(/Item label/i).first().fill("centric paste item");
  await page.getByLabel(/MRN for/i).first().fill("123456.78");
  await page.getByLabel(/Category for/i).first().fill("Entree");
  await page.getByLabel(/SEA price for/i).first().selectOption({ index: 1 });

  const firstPriceButton = page.getByRole("button", { name: /Copy AUS price for CENTRIC PASTE ITEM/i }).first();
  const priceFontSize = await firstPriceButton.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
  expect(priceFontSize).toBeGreaterThanOrEqual(11);
  await expect(firstPriceButton).toBeDisabled();

  const rowFills = await page.getByTestId("ssmt-builder-body").locator("tr[data-row-kind='item']").evaluateAll((rows) => rows.slice(0, 2).map((row) => getComputedStyle(row).backgroundColor));
  expect(new Set(rowFills).size).toBeGreaterThan(1);

  await page.getByRole("button", { name: /Lock item CENTRIC PASTE ITEM/i }).click();
  await expect(phasePanel.getByText(/1 of 2 item rows locked/i)).toBeVisible();
  await expect(page.getByLabel(/MRN for CENTRIC PASTE ITEM/i)).toHaveAttribute("readonly", "");
  await expect(firstPriceButton).toBeEnabled();

  // Photo Link is IT-reference metadata, not part of the Centric lock/copy workflow —
  // it must stay editable even after the item locks for Centric.
  const photoLinkInput = page.getByLabel(/Photo link for CENTRIC PASTE ITEM/i);
  await expect(photoLinkInput).not.toHaveAttribute("readonly");
  await photoLinkInput.fill("https://example.com/photos/centric-paste-item.jpg");
  await expect(photoLinkInput).toHaveValue("https://example.com/photos/centric-paste-item.jpg");

  await page.getByLabel(/MRN for CENTRIC PASTE ITEM/i).click();
  await expect(page.getByText(/MRN copied for Centric/i)).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("123456.78");

  const seaPriceButton = page.getByRole("button", { name: /Copy SEA price for CENTRIC PASTE ITEM/i });
  const seaPriceText = await seaPriceButton.evaluate((node) => node.textContent.match(/\$[0-9.]+/)?.[0] || "");
  expect(seaPriceText).toMatch(/^\$/); // display keeps the currency symbol
  await expect(page.getByLabel("SEA price for CENTRIC PASTE ITEM", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Delete item CENTRIC PASTE ITEM/i })).toBeDisabled();
  await seaPriceButton.click();
  await expect(page.getByText(/SEA price copied for Centric/i)).toBeVisible();
  // Copy strips the $ — Centric wants just the number + decimal point.
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(seaPriceText.replace(/[^0-9.]/g, ""));

  await page.getByRole("button", { name: /Lock item NEW ITEM/i }).click();
  await expect(phasePanel.getByText(/2 of 2 item rows locked/i)).toBeVisible();
  const enabledAfterLock = await phaseSelect.locator("option", { hasText: "Experience review" }).evaluate((option) => option.disabled);
  expect(enabledAfterLock).toBe(false);
  await phaseSelect.selectOption("Experience review");
  await expect(phaseSelect).toHaveValue("Experience review");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT loads and saves item lock state through shared storage", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const savedBodies = [];
  const sharedMenu = {
    id: "shared-lock-menu",
    name: "Shared Lock Menu",
    sourceSheet: "Shared storage test",
    includeReason: "Created in SSMT",
    type: "Core",
    phase: "Culinary draft",
    status: "Draft",
    activeStart: "",
    activeEnd: "",
    completedAt: "",
    editSignal: false,
    downstreamEligibleAfter: "IT complete",
    items: [
      {
        id: "shared-lock-item",
        label: "REMOTE LOCKED ITEM",
        name: "REMOTE LOCKED ITEM",
        description: "shared saved row",
        mrn: "444444.44",
        category: "Entree",
        fohColumn: "IT 1",
        secondaryCategory: "",
        brandMenu: "",
        calories: "",
        priceSelectorId: "",
        seaPrice: "$9.99",
        workbookSeaPrice: "",
        priceReviewStatus: "Pricing structure match",
        areaPrices: { AUS: "$9.99", SEA: "$9.99", MCO: "$9.99" },
        modifierGroups: [],
        lockedForCentric: true,
      },
    ],
  };

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.searchParams.get("tool") === "SSMT") {
      await route.fulfill({
        json: {
          ok: true,
          source: "supabase",
          records: [
            {
              "Record ID": "ssmt|workspace|current",
              "Record Type": "SSMT Workspace",
              Status: "Shared",
              menus: [
                sharedMenu,
                { id: "legacy-andes", name: "Andes", type: "Core", items: [] },
                { id: "legacy-global-grains", name: "Global Grains", type: "Global", items: [] },
              ],
              priceBook: [],
              modifierGroups: [],
              selectedMenuId: "shared-lock-menu",
              updatedAt: "2026-08-31T04:30:00.000Z",
            },
          ],
        },
      });
      return;
    }
    if (request.method() === "POST") {
      savedBodies.push(request.postDataJSON());
      await route.fulfill({ json: { ok: true, source: "supabase", synced: 1, message: "Saved 1 row to Supabase." } });
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();

  await expect(page.getByRole("button", { name: /^Shared Lock Menu/i })).toBeVisible();
  await expect(page.getByTestId("ssmt-menu-group-Global").getByRole("button", { name: /^Andes/i })).toBeVisible();
  await page.getByRole("button", { name: /^Shared Lock Menu/i }).click();
  await expect(page.getByTestId("ssmt-phase-panel").getByText(/1 of 1 item rows locked/i)).toBeVisible();
  await expect(page.getByLabel(/MRN for REMOTE LOCKED ITEM/i)).toHaveAttribute("readonly", "");

  await page.getByRole("button", { name: /Unlock item REMOTE LOCKED ITEM/i }).click();
  await expect(page.getByTestId("ssmt-phase-panel").getByText(/0 of 1 item rows locked/i)).toBeVisible();

  const photoLinkInput = page.getByLabel(/Photo link for REMOTE LOCKED ITEM/i);
  await expect(photoLinkInput).toHaveValue("");
  await photoLinkInput.fill("https://example.com/photos/remote-locked-item.jpg");
  await expect(photoLinkInput).toHaveValue("https://example.com/photos/remote-locked-item.jpg");

  const dietaryPreferenceSelect = page.getByLabel(/Vegan or vegetarian for REMOTE LOCKED ITEM/i);
  await expect(dietaryPreferenceSelect).toHaveValue("");
  await expect(dietaryPreferenceSelect.locator('option[value=""]')).toHaveText("");
  await expect(page.getByLabel(/Dietary tag for REMOTE LOCKED ITEM/i)).toHaveCount(0);
  await dietaryPreferenceSelect.selectOption("Vegan");
  await expect(dietaryPreferenceSelect).toHaveValue("Vegan");
  const veganBadge = page.getByLabel(/Dietary tag for REMOTE LOCKED ITEM: Vegan/i);
  await expect(veganBadge).toHaveText("VN");
  await expect(veganBadge).toHaveClass(/bg-emerald-600/);
  await dietaryPreferenceSelect.selectOption("Vegetarian");
  const vegetarianBadge = page.getByLabel(/Dietary tag for REMOTE LOCKED ITEM: Vegetarian/i);
  await expect(vegetarianBadge).toHaveText("V");
  await expect(vegetarianBadge).toHaveClass(/bg-lime-300/);
  await dietaryPreferenceSelect.selectOption("Vegan");

  await page.getByRole("button", { name: /Save menu/i }).click();

  await expect.poll(() => {
    const record = savedBodies
      .flatMap((body) => body?.records || [])
      .find((candidate) => candidate?.["Record ID"] === "ssmt|workspace|current");
    return record?.menus?.find((menu) => menu.id === "shared-lock-menu")
      ?.items?.find((item) => item.id === "shared-lock-item")
      ?.lockedForCentric;
  }).toBe(false);

  await expect.poll(() => {
    const record = savedBodies
      .flatMap((body) => body?.records || [])
      .find((candidate) => candidate?.["Record ID"] === "ssmt|workspace|current");
    return record?.menus?.find((menu) => menu.id === "shared-lock-menu")
      ?.items?.find((item) => item.id === "shared-lock-item")
      ?.photoLink;
  }).toBe("https://example.com/photos/remote-locked-item.jpg");

  await expect.poll(() => {
    const record = savedBodies
      .flatMap((body) => body?.records || [])
      .find((candidate) => candidate?.["Record ID"] === "ssmt|workspace|current");
    return record?.menus?.find((menu) => menu.id === "shared-lock-menu")
      ?.items?.find((item) => item.id === "shared-lock-item")
      ?.dietaryPreference;
  }).toBe("Vegan");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT manual saves recover failed shared saves and keep flags plus modifier clipboard slots", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const savedBodies = [];
  let postCount = 0;
  const smokeMenuName = `Manual Save SSMT ${Date.now()}`;

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.searchParams.get("tool") === "SSMT") {
      await route.fulfill({ json: { ok: true, source: "supabase", records: [] } });
      return;
    }
    if (request.method() === "POST") {
      postCount += 1;
      savedBodies.push(request.postDataJSON());
      if (postCount === 1) {
        await route.fulfill({ status: 500, json: { ok: false, message: "Simulated shared save failure." } });
        return;
      }
      await route.fulfill({ json: { ok: true, source: "supabase", synced: 1, message: "Saved 1 row to Supabase." } });
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();

  await expect(page.getByRole("button", { name: /Save SSMT workspace/i })).toBeVisible();
  await page.getByLabel(/New menu name/i).fill(smokeMenuName);
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();
  await expect(page.getByRole("heading", { name: smokeMenuName })).toBeVisible();
  await expect(page.getByTestId("ssmt-workspace-sync")).toContainText(/failed|local cache/i, { timeout: 20_000 });

  await expect(page.getByRole("button", { name: /Save menu/i })).toBeVisible();
  await page.getByLabel(/Item label/i).first().fill("flagged sandwich");
  await page.getByRole("button", { name: /view modifiers/i }).first().click();
  const modifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await expect(modifierDialog).toBeVisible();
  await expect(modifierDialog.getByText(/Slot 1/i)).toBeVisible();
  await expect(modifierDialog.getByText(/Slot 4/i)).toBeVisible();
  await expect(modifierDialog.getByText(/Empty slot/i)).toHaveCount(4);

  await modifierDialog.getByRole("button", { name: /Add modifier group/i }).click();
  const modifierGroupName = modifierDialog.getByLabel(/Modifier group name/i).last();
  await modifierGroupName.fill("");
  const renameStartedAt = Date.now();
  await modifierGroupName.pressSequentially("Sauce Rules", { delay: 20 });
  expect(Date.now() - renameStartedAt).toBeLessThan(1_500);
  await modifierGroupName.blur();
  await modifierDialog.getByLabel(/Modifier name/i).last().fill("Chile Crisp");
  await modifierDialog.getByRole("button", { name: /Save group to slot 1/i }).click();
  await expect(modifierDialog.getByText(/Slot 1: Sauce Rules/i)).toBeVisible();
  await modifierDialog.getByRole("button", { name: /Clear slot 1/i }).click();
  await expect(modifierDialog.getByText(/Slot 1: Empty slot/i)).toBeVisible();
  await modifierDialog.getByRole("button", { name: /Save group to slot 1/i }).click();
  await expect(modifierDialog.getByText(/Slot 1: Sauce Rules/i)).toBeVisible();
  await modifierDialog.getByRole("button", { name: /Save modifiers/i }).click();
  await expect(page.getByTestId("ssmt-workspace-sync")).toContainText(/Shared SSMT workspace saved/i, { timeout: 20_000 });
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Add item/i }).click();
  await page.getByLabel(/Item label/i).last().fill("second sandwich");
  await page.getByRole("button", { name: /mods \(0\)/i }).last().click();
  const secondModifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await secondModifierDialog.getByRole("button", { name: /Paste slot 1/i }).click();
  await expect(secondModifierDialog.getByLabel(/Modifier group name/i)).toHaveValue("Sauce Rules");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Flag for change/i }).first().click();
  let flagDialog = page.getByRole("dialog", { name: /flag for change/i });
  await flagDialog.getByLabel(/Reason/i).selectOption("Missing / wrong modifier");
  await flagDialog.getByLabel(/Note/i).fill("needs sauce defaults");
  await flagDialog.getByRole("button", { name: /Save flag/i }).click();
  await expect(page.getByText(/1 saved item flag/i)).toBeVisible();

  await page.getByRole("button", { name: /Flag for change/i }).last().click();
  flagDialog = page.getByRole("dialog", { name: /flag for change/i });
  await flagDialog.getByLabel(/Reason/i).selectOption("Price assignment question");
  await flagDialog.getByLabel(/Note/i).fill("confirm premium tier");
  await flagDialog.getByRole("button", { name: /Save flag/i }).click();
  await expect(page.getByText(/2 saved item flags/i)).toBeVisible();

  const reportLink = page.getByRole("link", { name: /Report flags \(2\)/i });
  await expect(reportLink).toBeVisible();
  const reportHref = decodeURIComponent(await reportLink.getAttribute("href"));
  expect(reportHref).toContain("mailto:alexander.neuse@compass-usa.com,tyler.leiss@compass-usa.com");
  expect(reportHref).toContain("needs sauce defaults");
  expect(reportHref).toContain("confirm premium tier");
  expect(reportHref).toContain("Timestamp:");

  await page.getByRole("button", { name: /Save menu/i }).click();
  await expect.poll(() => {
    const record = savedBodies
      .flatMap((body) => body?.records || [])
      .reverse()
      .find((candidate) => candidate?.["Record ID"] === "ssmt|workspace|current");
    const menu = record?.menus?.find((candidate) => candidate.name === smokeMenuName);
    return {
      flags: menu?.flags?.length || 0,
      slotOne: record?.modifierClipboardSlots?.[0]?.group?.name || "",
      secondItemMods: menu?.items?.find((item) => item.label === "SECOND SANDWICH")?.modifierGroups?.length || 0,
    };
  }).toEqual({ flags: 2, slotOne: "Sauce Rules", secondItemMods: 1 });

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT menu names require edit mode and cross-system reference names persist", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const savedBodies = [];
  const smokeMenuName = `Editable Name SSMT ${Date.now()}`;
  const renamedMenuName = `${smokeMenuName} Renamed`;

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.searchParams.get("tool") === "SSMT") {
      await route.fulfill({ json: { ok: true, source: "supabase", records: [] } });
      return;
    }
    if (request.method() === "POST") {
      savedBodies.push(request.postDataJSON());
      await route.fulfill({ json: { ok: true, source: "supabase", synced: 1, message: "Saved 1 row to Supabase." } });
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await expect(page.getByText(/Loading current SSMT seed data/i)).toHaveCount(0, { timeout: 20_000 });

  await page.getByLabel(/New menu name/i).fill(smokeMenuName);
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();

  await expect(page.getByLabel(/^Menu name$/i)).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: /Edit menu name/i }).click();
  await page.getByLabel(/^Menu name$/i).fill(renamedMenuName);
  await page.getByRole("button", { name: /Done editing menu name/i }).click();
  await expect(page.getByLabel(/^Menu name$/i)).toHaveAttribute("readonly", "");
  await page.getByLabel(/Centric menu name/i).fill("Centric Reference Name");
  await page.getByLabel(/Webtrition Master Menu name/i).fill("Webtrition Master Reference");
  await expect(page.getByRole("heading", { name: renamedMenuName })).toBeVisible();
  await page.getByRole("button", { name: /Lock item NEW ITEM/i }).click();
  await page.getByLabel(/Current SSMT phase/i).selectOption("IT complete");
  await expect(page.getByTestId("ssmt-derived-source-preview")).toContainText(`AMZ: ${renamedMenuName}`);

  await page.getByRole("button", { name: /Save menu/i }).click();
  await expect.poll(() => {
    const record = savedBodies
      .flatMap((body) => body?.records || [])
      .reverse()
      .find((candidate) => candidate?.["Record ID"] === "ssmt|workspace|current");
    const savedMenu = record?.menus?.find((menu) => menu.name === renamedMenuName);
    return savedMenu ? {
      centricMenuName: savedMenu.centricMenuName,
      webtritionMasterMenuName: savedMenu.webtritionMasterMenuName,
    } : null;
  }).toEqual({
    centricMenuName: "Centric Reference Name",
    webtritionMasterMenuName: "Webtrition Master Reference",
  });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export SSMT/i }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`${renamedMenuName} SSMT Export.xlsx`);

  await page.getByRole("button", { name: /Back to menu selection/i }).click();
  await expect(page.locator(`[data-menu-name="${renamedMenuName}"]`)).toBeVisible();
  await expect(page.locator(`[data-menu-name="${smokeMenuName}"]`)).toHaveCount(0);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT selected-menu export downloads a Centric-shaped workbook", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByLabel(/New menu name/i).fill("Export Button Test");
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();

  await page.getByLabel(/Item label/i).first().fill("export sandwich");
  await page.getByLabel(/Description/i).first().fill("export ready description");
  await page.getByLabel(/MRN for/i).first().fill("321654.98");
  await page.getByLabel(/Category for/i).first().fill("Food");
  await page.getByLabel(/Secondary category for/i).first().fill("Entree");
  await page.getByLabel(/SEA price for/i).first().selectOption({ index: 1 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export SSMT/i }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("Export Button Test SSMT Export.xlsx");

  const downloadPath = await download.path();
  const workbook = XLSX.readFile(downloadPath);
  expect(workbook.SheetNames).toEqual(["Glossary", "Brand", "Menus", "Categories", "Items", "Modifier Groups", "Modifiers", "Relationships"]);
  const brandRows = XLSX.utils.sheet_to_json(workbook.Sheets.Brand, { header: 1, raw: false, defval: "" });
  expect(brandRows[1][2]).toBe("");
  const itemRows = XLSX.utils.sheet_to_json(workbook.Sheets.Items, { header: 1, raw: false, defval: "" });
  expect(itemRows[1][3]).toBe("EXPORT SANDWICH");
  expect(itemRows[1][4]).toBe("EXPORT SANDWICH");
  expect(itemRows[1][8]).toBe("export ready description");
  expect(itemRows[1][11]).toBe("");
  expect(itemRows[1][25]).toBe("321654.98");
  const relationshipRows = XLSX.utils.sheet_to_json(workbook.Sheets.Relationships, { header: 1, raw: false, defval: "" });
  expect(relationshipRows.map((row) => row.slice(0, 3).join("|"))).toContain("Item|EXPORT SANDWICH|FOOD");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT modifier groups are editable with typed group metadata and line-level pricing fields", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.route("**/api/storage/records**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { ok: true, source: "supabase", records: [] } });
      return;
    }
    if (route.request().method() === "POST") {
      await route.fulfill({ json: { ok: true, source: "supabase", synced: 1, message: "Saved 1 row to Supabase." } });
      return;
    }
    await route.continue();
  });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Pricing Structure", exact: true }).click();
  await page.getByLabel(/New pricing category/i).fill("Modifier Free");
  await page.getByLabel(/New SEA price/i).fill("$0.00");
  await page.getByLabel(/New price modifier only/i).check();
  await page.getByRole("button", { name: /Add pricing row/i }).click();
  const modifierFreePricingRow = page.getByRole("row", { name: /Modifier Free/i });
  await modifierFreePricingRow.getByLabel(/SEA price for/i).fill("0.00");
  await expect(modifierFreePricingRow.locator("td").first()).toHaveText("$0.00 - Modifier Free");
  const otherAreas = ["AUS", "BNA", "BOS", "BWI", "DEN", "IAD", "JFK", "LAX", "SAN", "SNA", "SJC", "WAS", "YVR", "YYZ", "MCO"];
  for (const area of otherAreas) {
    await modifierFreePricingRow.getByLabel(new RegExp(`^${area} price for`, "i")).fill("$0.00");
  }
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByLabel(/New menu name/i).fill("Smoke Test Modifiers");
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();

  const itemPriceLabels = await page.getByLabel(/SEA price for/i).first().locator("option").evaluateAll((options) => options.slice(1).map((option) => option.textContent.trim()));
  const itemNonModifierPrices = itemPriceLabels.filter((label) => !/modifier/i.test(label)).map((label) => Number(label.match(/\$([0-9.]+)/)?.[1])).filter(Number.isFinite);
  expect(itemNonModifierPrices).toEqual([...itemNonModifierPrices].sort((left, right) => right - left));

  await expect(page.getByRole("button", { name: /mods \(0\)/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /mods \(0\)/i }).first().click();
  const modifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await expect(modifierDialog).toBeVisible();
  await expect(modifierDialog.getByText(/No modifier groups attached/i)).toBeVisible();
  await modifierDialog.getByRole("button", { name: /Add modifier group/i }).click();
  await expect(modifierDialog.getByLabel(/Modifier name/i)).toHaveCount(1);

  await modifierDialog.getByLabel(/Modifier group name/i).last().fill("Sauce Rules");
  await modifierDialog.getByLabel(/Modifier group type/i).last().selectOption("Addition");
  await modifierDialog.getByLabel(/Minimum selections/i).last().fill("0");
  await modifierDialog.getByLabel(/Maximum selections/i).last().fill("3");

  const editableGroup = modifierDialog.getByTestId(/ssmt-modifier-group/).last();
  await expect(editableGroup).toHaveAttribute("data-modifier-type", "Addition");
  await expect(editableGroup).toHaveClass(/border-amber-400/);
  await expect(editableGroup.getByLabel(/Minimum selections/i)).toHaveValue("0");
  await expect(editableGroup.getByLabel(/Maximum selections/i)).toHaveValue("3");
  const minLabelBox = await editableGroup.getByText("Min selections", { exact: true }).boundingBox();
  const maxLabelBox = await editableGroup.getByText("Max selections", { exact: true }).boundingBox();
  const addModifierButtonBox = await editableGroup.getByRole("button", { name: /Add modifier item line/i }).boundingBox();
  expect(minLabelBox.x + minLabelBox.width).toBeLessThanOrEqual(maxLabelBox.x);
  expect(addModifierButtonBox.y).toBeGreaterThan(maxLabelBox.y + maxLabelBox.height);

  const modifierPriceOptions = await modifierDialog.getByLabel(/Modifier price/i).last().locator("option").evaluateAll((options) => options.slice(1).map((option) => ({ label: option.textContent.trim(), kind: option.dataset.priceKind })));
  const firstNonModifierIndex = modifierPriceOptions.findIndex((option) => option.kind === "standard");
  expect(firstNonModifierIndex).toBeGreaterThan(0);
  expect(modifierPriceOptions.slice(0, firstNonModifierIndex).every((option) => option.kind === "modifier")).toBe(true);
  for (const priceGroup of [modifierPriceOptions.slice(0, firstNonModifierIndex), modifierPriceOptions.slice(firstNonModifierIndex)]) {
    const values = priceGroup.map(({ label }) => Number(label.match(/\$([0-9.]+)/)?.[1])).filter(Number.isFinite);
    expect(values).toEqual([...values].sort((left, right) => left - right));
  }

  await modifierDialog.getByLabel(/Modifier name/i).last().fill("Chile Crisp");
  await modifierDialog.getByLabel(/Modifier description/i).last().fill("spicy crunchy oil");
  await modifierDialog.getByLabel(/Modifier MRN/i).last().fill("123456.78");
  await modifierDialog.getByLabel(/Modifier calories/i).last().fill("80");
  await modifierDialog.getByLabel(/Modifier price/i).last().selectOption({ label: "$0.00 - Modifier Free" });
  const zeroPriceAreaValues = await editableGroup.locator("tbody tr").last().locator("td").nth(5).locator("span > span:last-child").allTextContents();
  expect(zeroPriceAreaValues).toHaveLength(16);
  expect(zeroPriceAreaValues.every((value) => Number(value.replace(/[$,]/g, "")) === 0)).toBe(true);
  await modifierDialog.getByLabel(/Modifier price/i).last().selectOption({ label: "$2.55 - Core Side / Global Side" });
  await expect(modifierDialog.getByLabel(/Modifier name/i).last()).toHaveValue("chile crisp");

  await expect(editableGroup).toContainText("AUS");
  await expect(editableGroup).toContainText("MCO");
  await expect(modifierDialog.getByLabel(/Modifier MRN/i).last()).toHaveValue("123456.78");
  await editableGroup.getByRole("button", { name: /Lock modifier group Sauce Rules/i }).click();
  await expect(editableGroup.getByLabel(/Modifier group name/i)).toHaveAttribute("readonly", "");
  await expect(editableGroup).toHaveCSS("border-color", "rgb(5, 150, 105)");
  await expect(editableGroup.locator(":scope > div").first()).toHaveClass(/bg-amber-100/);
  await expect(editableGroup.locator(":scope > div").first().locator("span").first()).toHaveClass(/bg-amber-700/);
  await editableGroup.getByRole("button", { name: /Unlock modifier group Sauce Rules/i }).click();
  await editableGroup.getByRole("button", { name: /Save group to slot 1/i }).click();
  await expect(modifierDialog.getByText(/Sauce Rules saved to slot 1/i)).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Add item/i }).click();
  await page.getByRole("button", { name: /mods \(0\)/i }).last().click();
  const secondModifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await secondModifierDialog.getByRole("button", { name: /Paste modifier group/i }).click();
  await expect(secondModifierDialog.getByLabel(/Modifier group name/i)).toHaveValue("Sauce Rules");

  await secondModifierDialog.getByRole("button", { name: /Delete modifier item line/i }).last().click();
  await page.getByRole("dialog", { name: /Delete modifier item/i }).getByLabel(/Confirm delete/i).check();
  await page.getByRole("dialog", { name: /Delete modifier item/i }).getByRole("button", { name: "Delete modifier item", exact: true }).click();
  const modifierNamesAfterDelete = await secondModifierDialog.getByLabel(/Modifier name/i).evaluateAll((nodes) => nodes.map((node) => node.value));
  expect(modifierNamesAfterDelete).not.toContain("chile crisp");

  await secondModifierDialog.getByTestId(/ssmt-modifier-group/).last().getByRole("button", { name: /Delete modifier group/i }).click();
  await page.getByRole("dialog", { name: /Delete modifier group/i }).getByLabel(/Confirm delete Sauce Rules/i).check();
  await page.getByRole("dialog", { name: /Delete modifier group/i }).getByRole("button", { name: "Delete modifier group", exact: true }).click();
  const groupNamesAfterDelete = await secondModifierDialog.getByLabel(/Modifier group name/i).evaluateAll((nodes) => nodes.map((node) => node.value));
  expect(groupNamesAfterDelete).not.toContain("Sauce Rules");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT Mods badge turns red/green with modifier group lock state and gates item locking", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByLabel(/New menu name/i).fill("Mods Gate Test");
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();

  const itemRow = page
    .locator("tr[data-row-kind='item']")
    .filter({ has: page.getByRole("button", { name: /Lock item NEW ITEM/i }) })
    .first();
  const modsButton = itemRow.getByRole("button", { name: /View modifiers Mods \(0\)/i });
  const lockButton = itemRow.getByRole("button", { name: /Lock item NEW ITEM/i });

  await expect(modsButton).toHaveClass(/bg-green-700/);
  await expect(lockButton).toBeEnabled();

  await modsButton.click();
  const modifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await modifierDialog.getByRole("button", { name: /Add modifier group/i }).click();
  await modifierDialog.getByLabel(/Modifier group name/i).last().fill("Choose Sauce");
  await page.keyboard.press("Escape");

  const modsButtonAfterAdd = itemRow.getByRole("button", { name: /View modifiers Mods \(1\)/i });
  await expect(modsButtonAfterAdd).toHaveClass(/bg-red-600/);
  await expect(lockButton).toBeDisabled();

  await modsButtonAfterAdd.click();
  const reopenedDialog = page.getByRole("dialog", { name: /modifier/i });
  await reopenedDialog.getByRole("button", { name: /Lock modifier group Choose Sauce/i }).click();
  await page.keyboard.press("Escape");

  await expect(modsButtonAfterAdd).toHaveClass(/bg-green-700/);
  await expect(lockButton).toBeEnabled();
  await lockButton.click();
  await expect(itemRow.getByRole("button", { name: /Unlock item NEW ITEM/i })).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT keeps ten modifier groups attached after save, close, and reopen", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.route("**/api/storage/records**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { ok: true, source: "supabase", records: [] } });
      return;
    }
    await route.fulfill({ json: { ok: true, source: "supabase", synced: 1, message: "Saved 1 row to Supabase." } });
  });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByLabel(/New menu name/i).fill("Ten Modifier Groups Test");
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();

  const itemRow = page
    .locator("tr[data-row-kind='item']")
    .filter({ has: page.getByRole("button", { name: /Lock item NEW ITEM/i }) })
    .first();
  await itemRow.getByRole("button", { name: /View modifiers Mods \(0\)/i }).click();

  const modifierDialog = page.getByRole("dialog", { name: /modifier/i });
  for (let groupNumber = 1; groupNumber <= 10; groupNumber += 1) {
    await modifierDialog.getByRole("button", { name: /Add modifier group/i }).click();
    const groupName = modifierDialog.getByLabel(/Modifier group name/i).last();
    await groupName.fill(`Modifier Group ${groupNumber}`);
    await groupName.blur();
  }

  await expect(modifierDialog.getByLabel(/Modifier group name/i)).toHaveCount(10);
  await modifierDialog.getByRole("button", { name: /Save modifiers/i }).click();
  await page.keyboard.press("Escape");
  await expect(itemRow.getByRole("button", { name: /View modifiers Mods \(10\)/i })).toBeVisible();

  await itemRow.getByRole("button", { name: /View modifiers Mods \(10\)/i }).click();
  const reopenedDialog = page.getByRole("dialog", { name: /modifier/i });
  await expect(reopenedDialog.getByLabel(/Modifier group name/i)).toHaveCount(10);
  await expect(reopenedDialog.getByLabel(/Modifier group name/i).last()).toHaveValue("Modifier Group 10");
  await expect(reopenedDialog.getByRole("button", { name: /Add modifier group/i })).toBeDisabled();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
test("SSMT Mods badge counts only reliably-linked groups, not stale free-text refs", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1800, height: 950 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await expect(page.getByText(/Loading current SSMT seed data/i)).toHaveCount(0, { timeout: 20_000 });

  // Reported defect: Andes "PERUVIAN STEWED TOFU" carries three free-text modifier refs
  // ("BASE CHOICE", "Choose 2 Sides", "Choose Sauce") that match no real authored group.
  // The badge must read the real linked count (0) and match the empty dialog, not the raw ref length (3).
  await page.locator('[data-menu-name="Andes"]').click();
  const tofuRow = page
    .locator("tr[data-row-kind='item']")
    .filter({ has: page.getByRole("button", { name: /Lock item PERUVIAN STEWED TOFU/i }) });
  const tofuMods = tofuRow.getByRole("button", { name: /View modifiers Mods \(\d+\)/i });
  await expect(tofuMods).toHaveAccessibleName(/Mods \(0\)/i);
  await tofuMods.click();
  const tofuDialog = page.getByRole("dialog", { name: /modifier/i });
  await expect(tofuDialog.getByText(/No modifier groups attached/i)).toBeVisible();
  await page.keyboard.press("Escape");

  // Fresh-build path must still count: a group created in the dialog is linked by id and
  // must make the badge read (1) after the dialog closes — guards against over-tightening the match.
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByLabel(/New menu name/i).fill("Badge Count Test");
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();

  const newRow = page
    .locator("tr[data-row-kind='item']")
    .filter({ has: page.getByRole("button", { name: /Lock item NEW ITEM/i }) })
    .first();
  await newRow.getByRole("button", { name: /View modifiers Mods \(0\)/i }).click();
  const buildDialog = page.getByRole("dialog", { name: /modifier/i });
  await buildDialog.getByRole("button", { name: /Add modifier group/i }).click();
  await buildDialog.getByLabel(/Modifier group name/i).last().fill("Choose Sauce");
  await page.keyboard.press("Escape");
  await expect(newRow.getByRole("button", { name: /View modifiers Mods \(1\)/i })).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT modifier editor opens wider, prominent, and dense for item lines", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^The Daily/i }).click();

  const modifierButton = page.getByRole("button", { name: /view modifiers/i }).first();
  await expect(modifierButton).toBeVisible();
  const modifierButtonStyle = await modifierButton.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      color: style.color,
    };
  });
  expect(modifierButtonStyle.backgroundColor).toBe("rgb(21, 128, 61)");
  expect(modifierButtonStyle.borderColor).toBe("rgb(22, 101, 52)");
  expect(modifierButtonStyle.color).toBe("rgb(255, 255, 255)");

  await modifierButton.click();
  const modifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await expect(modifierDialog).toBeVisible();
  await modifierDialog.getByRole("button", { name: /Add modifier group/i }).click();
  const modifierDialogMetrics = await modifierDialog.evaluate((node) => {
    const tableScroll = node.querySelector("table")?.parentElement;
    const firstItemRow = node.querySelector("tbody tr");
    const firstItemCell = firstItemRow?.querySelector("td");
    const firstCellStyle = firstItemCell ? getComputedStyle(firstItemCell) : null;
    return {
      dialogWidth: node.getBoundingClientRect().width,
      tableClientWidth: tableScroll?.clientWidth || 0,
      tableScrollWidth: tableScroll?.scrollWidth || 0,
      firstItemRowHeight: firstItemRow?.getBoundingClientRect().height || 0,
      firstItemBorderColor: firstCellStyle?.borderBottomColor || "",
    };
  });
  expect(modifierDialogMetrics.dialogWidth).toBeGreaterThanOrEqual(1300);
  expect(modifierDialogMetrics.tableScrollWidth).toBeLessThanOrEqual(modifierDialogMetrics.tableClientWidth + 4);
  expect(modifierDialogMetrics.firstItemRowHeight).toBeLessThanOrEqual(76);
  expect(modifierDialogMetrics.firstItemBorderColor).toBe("rgb(148, 163, 184)");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT builder uses polished grouped sections and keeps modifier group titles clean", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1680, height: 950 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^The Daily/i }).click();

  const builderSections = page.getByTestId("ssmt-builder-sections");
  await expect(builderSections).toBeVisible();
  await expect(page.getByTestId("ssmt-builder-section-main").first()).toContainText(/Main Menu Items/i);

  await page.getByRole("button", { name: /Add sub menu/i }).click();
  await page.getByRole("button", { name: /Add divider/i }).click();
  const submenuSection = page.getByTestId(/ssmt-builder-section-submenu/).last();
  const dividerSection = page.getByTestId(/ssmt-builder-section-divider/).last();
  await expect(submenuSection).toContainText(/Sub Menu/i);
  await expect(dividerSection).toContainText(/Divider/i);
  await page.getByTestId(/ssmt-row-submenu/).last().dragTo(page.getByTestId(/ssmt-row-item/).nth(1));
  await page.getByTestId(/ssmt-row-divider/).last().dragTo(page.getByTestId(/ssmt-row-item/).nth(3));

  const sectionMetrics = await page.evaluate(() => {
    const main = document.querySelector('[data-testid="ssmt-builder-section-main"]');
    const submenu = document.querySelector('[data-testid^="ssmt-builder-section-submenu"]');
    const divider = document.querySelector('[data-testid^="ssmt-builder-section-divider"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="ssmt-builder-body"] tr[data-row-kind]'));
    const metricForItem = (row) => {
      const firstCell = row?.querySelector("td");
      return {
        tone: row?.getAttribute("data-section-tone") || "",
        border: firstCell ? getComputedStyle(firstCell).borderBottomColor : "",
        background: row ? getComputedStyle(row).backgroundColor : "",
      };
    };
    const firstItem = rows.find((row) => row.getAttribute("data-row-kind") === "item");
    const itemAfter = (kind) => {
      const sectionIndex = rows.findIndex((row) => row.getAttribute("data-row-kind") === kind);
      return rows.slice(sectionIndex + 1).find((row) => row.getAttribute("data-row-kind") === "item");
    };
    return {
      mainBorder: main ? getComputedStyle(main).borderColor : "",
      submenuBorder: submenu ? getComputedStyle(submenu).borderColor : "",
      dividerBorder: divider ? getComputedStyle(divider).borderColor : "",
      mainRadius: main ? getComputedStyle(main).borderRadius : "",
      mainItem: metricForItem(firstItem),
      submenuItem: metricForItem(itemAfter("submenu")),
      dividerItem: metricForItem(itemAfter("divider")),
    };
  });
  expect(sectionMetrics.mainBorder).toBe("rgb(125, 211, 252)");
  expect(sectionMetrics.submenuBorder).toBe("rgb(96, 165, 250)");
  expect(sectionMetrics.dividerBorder).toBe("rgb(251, 191, 36)");
  expect(Number.parseFloat(sectionMetrics.mainRadius)).toBeLessThanOrEqual(8);
  expect(sectionMetrics.mainItem).toMatchObject({ tone: "main", border: "rgb(186, 230, 253)" });
  expect(sectionMetrics.submenuItem).toMatchObject({ tone: "submenu", border: "rgb(191, 219, 254)" });
  expect(sectionMetrics.dividerItem).toMatchObject({ tone: "divider", border: "rgb(253, 230, 138)" });

  await page.getByRole("button", { name: /view modifiers/i }).first().click();
  const modifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await expect(modifierDialog).toBeVisible();
  await modifierDialog.getByRole("button", { name: /Add modifier group/i }).click();
  const modifierGroup = modifierDialog.getByTestId(/ssmt-modifier-group/).last();
  await modifierGroup.getByLabel(/Modifier group name/i).fill("Sauce Rules");
  await expect(modifierGroup).not.toContainText(/choices\s*\//i);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT dividers and sub menus rotate through distinct colors on one menu", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1680, height: 950 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^The Daily/i }).click();

  for (let index = 0; index < 4; index += 1) {
    await page.getByRole("button", { name: /Add divider/i }).click();
    await page.getByRole("button", { name: /Add sub menu/i }).click();
  }

  const dividerBorders = await page
    .getByTestId(/ssmt-builder-section-divider/)
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).borderColor));
  const submenuBorders = await page
    .getByTestId(/ssmt-builder-section-submenu/)
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).borderColor));

  expect(dividerBorders).toEqual([
    "rgb(251, 113, 133)",
    "rgb(251, 146, 60)",
    "rgb(251, 113, 133)",
    "rgb(251, 146, 60)",
  ]);
  expect(submenuBorders).toEqual([
    "rgb(129, 140, 248)",
    "rgb(34, 211, 238)",
    "rgb(129, 140, 248)",
    "rgb(34, 211, 238)",
  ]);

  const sectionBorders = await page
    .locator('[data-testid^="ssmt-builder-section-divider"], [data-testid^="ssmt-builder-section-submenu"]')
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).borderColor));
  expect(sectionBorders).toEqual([
    "rgb(251, 113, 133)",
    "rgb(129, 140, 248)",
    "rgb(251, 146, 60)",
    "rgb(34, 211, 238)",
    "rgb(251, 113, 133)",
    "rgb(129, 140, 248)",
    "rgb(251, 146, 60)",
    "rgb(34, 211, 238)",
  ]);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT second flag click on a flagged item prompts edit or clear", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1680, height: 950 });
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^The Daily/i }).click();

  // First flag on an item saves normally.
  await page.getByRole("button", { name: /Flag for change/i }).first().click();
  const flagDialog = page.getByRole("dialog", { name: /Flag for change/i });
  await expect(flagDialog).toBeVisible();
  await flagDialog.getByRole("button", { name: /Save flag and report/i }).click();

  // The item now shows a flagged state; clicking Flag again offers edit or clear.
  const flaggedButton = page.getByRole("button", { name: /Edit or clear flag/i }).first();
  await expect(flaggedButton).toBeVisible();
  await flaggedButton.click();

  const actionDialog = page.getByRole("dialog", { name: /already flagged/i });
  await expect(actionDialog).toBeVisible();
  await expect(actionDialog.getByRole("button", { name: /Edit flag/i })).toBeVisible();
  await expect(actionDialog.getByRole("button", { name: /Clear flag/i })).toBeVisible();

  // Edit opens the flag editor in update mode without adding a duplicate.
  await actionDialog.getByRole("button", { name: /Edit flag/i }).click();
  const editDialog = page.getByRole("dialog", { name: /Edit item flag/i });
  await expect(editDialog).toBeVisible();
  await editDialog.getByRole("button", { name: /Update flag/i }).click();
  await expect(page.getByRole("button", { name: /Edit or clear flag/i })).toHaveCount(1);

  // Second click again, this time clear the flag.
  await page.getByRole("button", { name: /Edit or clear flag/i }).first().click();
  await page
    .getByRole("dialog", { name: /already flagged/i })
    .getByRole("button", { name: /Clear flag/i })
    .click();
  await expect(page.getByRole("button", { name: /Edit or clear flag/i })).toHaveCount(0);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("SSMT collects hibernated menus into a sixth bucket shown on demand", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const menuName = `Hibernate Bucket ${Date.now()}`;
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await expect(page.getByText(/Loading current SSMT seed data/i)).toHaveCount(0, { timeout: 20_000 });

  // Create a fresh Core menu, then return to the selector grid.
  await page.getByLabel(/New menu name/i).fill(menuName);
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();
  await expect(page.getByRole("heading", { name: menuName })).toBeVisible();
  await page.getByRole("button", { name: /Back to menu selection/i }).click();

  const coreGroup = page.getByTestId("ssmt-menu-group-Core");
  const card = page.locator(`[data-menu-name="${menuName}"]`).locator("xpath=ancestor::div[1]");
  // Starts active in the Core bucket; no sixth bucket exists yet.
  await expect(coreGroup.locator(`[data-menu-name="${menuName}"]`)).toBeVisible();
  await expect(page.getByTestId("ssmt-menu-group-Hibernated")).toHaveCount(0);

  // Hibernate it — with "Show hibernated" off it drops out of view entirely.
  await card.getByRole("button", { name: "Hibernate", exact: true }).click();
  await expect(page.locator(`[data-menu-name="${menuName}"]`)).toHaveCount(0);

  // Turning on "Show hibernated" reveals a dedicated sixth bucket holding it,
  // and it no longer bleeds into the Core bucket.
  await page.getByRole("checkbox", { name: /Show hibernated menus/i }).check();
  const hibernatedGroup = page.getByTestId("ssmt-menu-group-Hibernated");
  await expect(hibernatedGroup).toBeVisible();
  await expect(hibernatedGroup.locator(`[data-menu-name="${menuName}"]`)).toBeVisible();
  await expect(coreGroup.locator(`[data-menu-name="${menuName}"]`)).toHaveCount(0);

  const order = await page.getByTestId(/ssmt-menu-group-/).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-menu-type")));
  expect(order[order.length - 1]).toBe("Hibernated");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Audit describes SSMT app and Webtrition sources without old Excel as ongoing truth", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: /open audit/i }).click();

  await expect(page.getByRole("heading", { name: /^Menu Audit Tool$/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/SSMT app records/i)).toBeVisible();
  await expect(page.getByText(/Webtrition Report Menu Index/i)).toBeVisible();
  await expect(page.getByText(/Shopping Lists/i)).toBeVisible();
  await expect(page.getByText(/Recipes are the remaining missing data layer/i)).toBeVisible();
  await expect(page.getByText(/Old SSMT Excel/i)).toHaveCount(0);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});


test("SSMT blocks duplicate menu names and rapid double-submit with mocked storage", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const existingMenu = {
    id: "menu-andes",
    name: "AMZ: Andes",
    type: "Core",
    phase: "Culinary draft",
    status: "Draft",
    items: [],
    flags: [],
  };
  let currentMenus = [existingMenu];

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.searchParams.get("tool") === "SSMT") {
      await route.fulfill({
        json: {
          ok: true,
          source: "supabase",
          records: [{
            "Record ID": "ssmt|workspace|current",
            "Record Type": "SSMT Workspace",
            Status: "Shared",
            menus: currentMenus,
            priceBook: [],
            modifierGroups: [],
            modifierClipboardSlots: [],
            selectedMenuId: "menu-andes",
            updatedAt: "2026-09-22T14:00:00.000Z",
          }],
        },
      });
      return;
    }
    if (request.method() === "POST") {
      const body = request.postDataJSON();
      const savedRecord = (body?.records || []).find((candidate) => candidate?.["Record ID"] === "ssmt|workspace|current");
      if (savedRecord?.menus) currentMenus = savedRecord.menus;
      await route.fulfill({ json: { ok: true, source: "supabase", synced: 1, message: "Saved 1 row to Supabase." } });
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await expect(page.getByText(/Loading current SSMT seed data/i)).toHaveCount(0, { timeout: 20_000 });

  await page.getByLabel(/New menu name/i).fill("  andes  ");
  await page.getByRole("button", { name: /Create menu/i }).click();
  await expect(page.getByRole("alert")).toHaveText('A menu named "andes" already exists.');
  await expect(page.locator('[data-menu-name="AMZ: Andes"]')).toHaveCount(1);
  await expect(page.getByRole("heading", { name: /^Menu Selector$/ })).toBeVisible();

  const uniqueName = "Rapid Submit Menu";
  await page.getByLabel(/New menu name/i).fill(uniqueName);
  await page.getByRole("button", { name: /Create menu/i }).evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page.getByRole("heading", { name: uniqueName })).toBeVisible();
  await page.getByRole("button", { name: /Back to menu selection/i }).click();
  await expect(page.locator(`[data-menu-name="${uniqueName}"]`)).toHaveCount(1);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
