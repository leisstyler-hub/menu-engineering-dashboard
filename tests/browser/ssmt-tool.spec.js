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
  await deleteDialog.getByLabel(/Retype menu name/i).fill("Smoke Test");
  await expect(deleteDialog.getByRole("button", { name: /Delete permanently/i })).toBeDisabled();
  await deleteDialog.getByLabel(/Retype menu name/i).fill("Smoke Test Promo Menu");
  await expect(deleteDialog.getByRole("button", { name: /Delete permanently/i })).toBeEnabled();
  await deleteDialog.getByRole("button", { name: /Delete permanently/i }).click();
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

  await expect(firstCoreGroup).toHaveClass(/border-emerald-300/);
  await expect(globalGroup).toHaveClass(/border-sky-300/);
  await expect(promotionsGroup).toHaveClass(/border-amber-300/);
  await expect(thompsonGroup).toHaveClass(/border-fuchsia-300/);

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
  await expect(page.getByLabel(/Item label/i).first()).toHaveValue("BETA ITEM");

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
