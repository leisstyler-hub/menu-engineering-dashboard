import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors } from "./smoke-helpers.js";

test("SSMT opens behind passcode and shows pricing, modifiers, flags, and calendar", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.goto("/");

  await expect(page.getByRole("button", { name: /open ssmt/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /open ssmt/i }).click();

  await expect(page.getByRole("heading", { name: /^SSMT$/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/passcode required/i)).toBeVisible();
  await page.getByLabel(/SSMT passcode/i).fill("0411");
  await page.getByRole("button", { name: /unlock ssmt/i }).click();

  await expect(page.getByText(/Culinary to IT programming/i)).toBeVisible();
  await expect(page.getByText(/AUS, BNA, BOS, BWI, DEN, IAD, JFK, LAX, SAN, SNA, SEA, SJC, WAS, YVR, YYZ, MCO/i)).toBeVisible();
  await expect(page.getByText(/SEA price \+ category/i)).toBeVisible();
  await expect(page.getByLabel(/SEA price for/i).first()).toBeVisible();
  await expect(page.getByText(/Workbook value needs pricing structure match/i).first()).toBeVisible();
  await page.getByLabel(/SEA price for/i).first().selectOption({ index: 1 });
  await expect(page.getByLabel(/SEA price for/i).first()).not.toHaveValue("");
  await expect(page.getByText("IT complete eligible")).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Calendar$/ })).toBeVisible();

  await page.getByLabel(/Active start/i).fill("2026-09-01");
  await page.getByLabel(/Active end/i).fill("2026-09-30");
  await expect(page.getByLabel(/Active start/i)).toHaveValue("2026-09-01");
  await expect(page.getByLabel(/Active end/i)).toHaveValue("2026-09-30");

  await page.getByText("Edit signal").click();
  await expect(page.getByLabel(/Active start/i)).toBeVisible();

  const labelInput = page.getByLabel(/Item label/i).first();
  await labelInput.fill("smoke test label");
  await expect(labelInput).toHaveValue("SMOKE TEST LABEL");

  const descriptionInput = page.getByLabel(/Description/i).first();
  await descriptionInput.fill("Needs Sentence Case");
  await expect(descriptionInput).toHaveValue("needs sentence case");

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
