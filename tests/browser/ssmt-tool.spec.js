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

  const fixyInput = page.getByLabel(/FOH \/ Fixy for/i).first();
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
