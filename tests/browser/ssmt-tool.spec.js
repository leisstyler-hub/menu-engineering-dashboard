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

  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Menu Selector$/ })).toBeVisible();
  await expect(page.getByText(/Loading current SSMT seed data/i)).toHaveCount(0, { timeout: 20_000 });
  await page.getByLabel(/New menu name/i).fill("Smoke Test Promo Menu");
  await page.getByLabel(/New menu type/i).selectOption("Promotion");
  await page.getByRole("button", { name: /Create menu/i }).click();

  await expect(page.getByRole("heading", { name: /^Smoke Test Promo Menu$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Back to menu selection/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pricing table/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Delete menu/i })).toBeVisible();

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
  await page.getByLabel(/SEA price for/i).first().selectOption({ label: "$12.34 - Smoke test price" });
  await expect(page.getByLabel(/SEA price for/i).first()).not.toHaveValue("");
  await expect(page.getByLabel(/Area prices for/i).first()).toContainText("AUS");
  await expect(page.getByLabel(/Area prices for/i).first()).toContainText("MCO");

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

test("SSMT groups menus by type and supports row editing, ordering, and saved phase status", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const smokeMenuName = `Smoke Test Ordering ${Date.now()}`;
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

  await page.getByLabel(/New menu name/i).fill(smokeMenuName);
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();
  await expect(page.getByRole("heading", { name: smokeMenuName })).toBeVisible();

  await page.getByRole("button", { name: /Lock item NEW ITEM/i }).click();
  await page.getByLabel(/Phase/i).selectOption("IT complete");
  await page.getByRole("button", { name: /Back to menu selection/i }).click();
  await page.locator(`[data-menu-name="${smokeMenuName}"]`).click();
  await expect(page.getByLabel(/Phase/i)).toHaveValue("IT complete");
  await expect(page.getByTestId("ssmt-workspace-sync")).toContainText(/Shared SSMT workspace saved/i, { timeout: 20_000 });

  await page.reload();
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.locator(`[data-menu-name="${smokeMenuName}"]`).click();
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
  expect(submenuBackground).toBe("rgb(236, 253, 245)");

  await expect(page.getByRole("columnheader", { name: "Fixy" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "FOH / Fixy" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "SEA price" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Category", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Secondary category" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Area prices" })).toBeVisible();

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
  await expect(page.getByTestId("ssmt-derived-source-preview")).toContainText(`AMZ: ${smokeMenuName} - Curated Sandwiches`);

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
  expect(builderMetrics.width).toBeLessThanOrEqual(2700);
  expect(builderMetrics.firstRowHeight).toBeLessThanOrEqual(82);
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

  await page.getByLabel(/MRN for CENTRIC PASTE ITEM/i).click();
  await expect(page.getByText(/MRN copied for Centric/i)).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("123456.78");

  const seaPriceButton = page.getByRole("button", { name: /Copy SEA price for CENTRIC PASTE ITEM/i });
  const seaPriceText = await seaPriceButton.evaluate((node) => node.textContent.match(/\$[0-9.]+/)?.[0] || "");
  await expect(page.getByLabel("SEA price for CENTRIC PASTE ITEM", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Delete item CENTRIC PASTE ITEM/i })).toBeDisabled();
  await seaPriceButton.click();
  await expect(page.getByText(/SEA price copied for Centric/i)).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(seaPriceText);

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
  await page.getByRole("button", { name: /Save menu/i }).click();

  await expect.poll(() => {
    const record = savedBodies
      .flatMap((body) => body?.records || [])
      .find((candidate) => candidate?.["Record ID"] === "ssmt|workspace|current");
    return record?.menus?.find((menu) => menu.id === "shared-lock-menu")
      ?.items?.find((item) => item.id === "shared-lock-item")
      ?.lockedForCentric;
  }).toBe(false);

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
  await modifierDialog.getByLabel(/Modifier group name/i).last().fill("Sauce Rules");
  await modifierDialog.getByLabel(/Modifier name/i).last().fill("Chile Crisp");
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

test("SSMT selected menu names are editable and persist into export plus downstream preview", async ({ page }) => {
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

  await page.getByLabel(/Menu name/i).fill(renamedMenuName);
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
    return record?.menus?.some((menu) => menu.name === renamedMenuName) || false;
  }).toBe(true);

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
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByLabel(/New menu name/i).fill("Smoke Test Modifiers");
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();

  await expect(page.getByRole("button", { name: /mods \(0\)/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /mods \(0\)/i }).first().click();
  const modifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await expect(modifierDialog).toBeVisible();
  await expect(modifierDialog.getByText(/No modifier groups attached/i)).toBeVisible();
  await modifierDialog.getByRole("button", { name: /Add modifier group/i }).click();
  await expect(modifierDialog.getByLabel(/Modifier name/i)).toHaveCount(1);

  await modifierDialog.getByLabel(/Modifier group name/i).last().fill("Sauce Rules");
  await modifierDialog.getByLabel(/Modifier group type/i).last().selectOption("Addition");

  await modifierDialog.getByLabel(/Modifier name/i).last().fill("Chile Crisp");
  await modifierDialog.getByLabel(/Modifier description/i).last().fill("spicy crunchy oil");
  await modifierDialog.getByLabel(/Modifier MRN/i).last().fill("123456.78");
  await modifierDialog.getByLabel(/Modifier calories/i).last().fill("80");
  await modifierDialog.getByLabel(/Modifier price/i).last().selectOption({ label: "$2.55 - Core Side / Global Side" });
  await expect(modifierDialog.getByLabel(/Modifier name/i).last()).toHaveValue("chile crisp");

  const editableGroup = modifierDialog.getByTestId(/ssmt-modifier-group/).last();
  await expect(editableGroup).toContainText("AUS");
  await expect(editableGroup).toContainText("MCO");
  await expect(modifierDialog.getByLabel(/Modifier MRN/i).last()).toHaveValue("123456.78");
  await editableGroup.getByRole("button", { name: /Lock modifier group Sauce Rules/i }).click();
  await expect(editableGroup.getByLabel(/Modifier group name/i)).toHaveAttribute("readonly", "");
  await editableGroup.getByRole("button", { name: /Unlock modifier group Sauce Rules/i }).click();
  await editableGroup.getByRole("button", { name: /Copy group to clipboard/i }).click();
  await expect(modifierDialog.getByText(/Sauce Rules copied to modifier clipboard/i)).toBeVisible();
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

  const sectionMetrics = await page.evaluate(() => {
    const main = document.querySelector('[data-testid="ssmt-builder-section-main"]');
    const submenu = document.querySelector('[data-testid^="ssmt-builder-section-submenu"]');
    const divider = document.querySelector('[data-testid^="ssmt-builder-section-divider"]');
    return {
      mainBorder: main ? getComputedStyle(main).borderColor : "",
      submenuBorder: submenu ? getComputedStyle(submenu).borderColor : "",
      dividerBorder: divider ? getComputedStyle(divider).borderColor : "",
      mainRadius: main ? getComputedStyle(main).borderRadius : "",
    };
  });
  expect(sectionMetrics.mainBorder).toBe("rgb(125, 211, 252)");
  expect(sectionMetrics.submenuBorder).toBe("rgb(52, 211, 153)");
  expect(sectionMetrics.dividerBorder).toBe("rgb(167, 139, 250)");
  expect(Number.parseFloat(sectionMetrics.mainRadius)).toBeLessThanOrEqual(8);

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
