import { expect, test } from "@playwright/test";
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
  await expect(modifierDialog.getByText(/copy creates an independent modifier group/i)).toBeVisible();
  await modifierDialog.getByRole("button", { name: /copy group/i }).first().click();
  await expect(modifierDialog.getByText(/added as an independent modifier group/i)).toBeVisible();
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
  await expect(deleteDialog.getByLabel(/Retype menu name/i)).toHaveCount(0);
  await expect(deleteDialog.getByRole("button", { name: "Delete menu", exact: true })).toBeDisabled();
  await deleteDialog.getByLabel(/Confirm delete Smoke Test Promo Menu/i).check();
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
  await page.goto("/");

  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();

  const firstCoreGroup = page.getByTestId("ssmt-menu-group-Core");
  const globalGroup = page.getByTestId("ssmt-menu-group-Global");
  const promotionsGroup = page.getByTestId("ssmt-menu-group-Promotion");
  const thompsonGroup = page.getByTestId("ssmt-menu-group-Thompson Hospitality");
  await expect(firstCoreGroup).toBeVisible();
  await expect(globalGroup).toBeVisible();
  await expect(promotionsGroup).toBeVisible();
  await expect(thompsonGroup).toBeVisible();

  await expect(firstCoreGroup).toHaveClass(/border-emerald-400/);
  await expect(globalGroup).toHaveClass(/border-sky-400/);
  await expect(promotionsGroup).toHaveClass(/border-amber-400/);
  await expect(thompsonGroup).toHaveClass(/border-fuchsia-400/);

  const groupOrder = await page.getByTestId(/ssmt-menu-group-/).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-menu-type")));
  expect(groupOrder).toEqual(["Core", "Global", "Promotion", "Thompson Hospitality"]);

  const coreNames = await firstCoreGroup.getByRole("button").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-menu-name")));
  expect([...coreNames].sort((a, b) => a.localeCompare(b))).toEqual(coreNames);

  await page.getByLabel(/New menu name/i).fill("Smoke Test Ordering");
  await page.getByLabel(/New menu type/i).selectOption("Core");
  await page.getByRole("button", { name: /Create menu/i }).click();
  await expect(page.getByRole("heading", { name: /^Smoke Test Ordering$/ })).toBeVisible();

  await page.getByLabel(/Phase/i).selectOption("IT complete");
  await page.getByRole("button", { name: /Back to menu selection/i }).click();
  await page.getByRole("button", { name: /^Smoke Test Ordering/i }).click();
  await expect(page.getByLabel(/Phase/i)).toHaveValue("IT complete");

  await page.reload();
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await page.getByRole("button", { name: "Menu Selector / New Menu", exact: true }).click();
  await page.getByRole("button", { name: /^Smoke Test Ordering/i }).click();
  await expect(page.getByLabel(/Phase/i)).toHaveValue("IT complete");

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

  await page.getByRole("button", { name: /view modifiers/i }).first().click();
  const modifierDialog = page.getByRole("dialog", { name: /modifier/i });
  await expect(modifierDialog).toBeVisible();
  await modifierDialog.getByRole("button", { name: /Add modifier group/i }).click();

  await modifierDialog.getByLabel(/Modifier group name/i).last().fill("Sauce Rules");
  await modifierDialog.getByLabel(/Modifier group type/i).last().selectOption("Addition");
  await modifierDialog.getByRole("button", { name: /Add modifier item line/i }).last().click();

  await modifierDialog.getByLabel(/Modifier name/i).last().fill("Chile crisp");
  await modifierDialog.getByLabel(/Modifier description/i).last().fill("spicy crunchy oil");
  await modifierDialog.getByLabel(/Modifier MRN/i).last().fill("123456.78");
  await modifierDialog.getByLabel(/Modifier calories/i).last().fill("80");
  await modifierDialog.getByLabel(/Modifier price/i).last().selectOption({ label: "$2.55 - Core Side / Global Side" });

  const editableGroup = modifierDialog.getByTestId(/ssmt-modifier-group/).last();
  await expect(editableGroup).toContainText("AUS");
  await expect(editableGroup).toContainText("MCO");
  await expect(modifierDialog.getByLabel(/Modifier MRN/i).last()).toHaveValue("123456.78");

  await editableGroup.getByRole("button", { name: /Delete modifier item line/i }).last().click();
  await page.getByRole("dialog", { name: /Delete modifier item/i }).getByLabel(/Confirm delete/i).check();
  await page.getByRole("dialog", { name: /Delete modifier item/i }).getByRole("button", { name: "Delete modifier item", exact: true }).click();
  const modifierNamesAfterDelete = await modifierDialog.getByLabel(/Modifier name/i).evaluateAll((nodes) => nodes.map((node) => node.value));
  expect(modifierNamesAfterDelete).not.toContain("Chile crisp");

  await editableGroup.getByRole("button", { name: /Delete modifier group/i }).click();
  await page.getByRole("dialog", { name: /Delete modifier group/i }).getByLabel(/Confirm delete Sauce Rules/i).check();
  await page.getByRole("dialog", { name: /Delete modifier group/i }).getByRole("button", { name: "Delete modifier group", exact: true }).click();
  const groupNamesAfterDelete = await modifierDialog.getByLabel(/Modifier group name/i).evaluateAll((nodes) => nodes.map((node) => node.value));
  expect(groupNamesAfterDelete).not.toContain("Sauce Rules");

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
