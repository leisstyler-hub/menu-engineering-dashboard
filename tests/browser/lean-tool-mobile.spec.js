import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

test("Lean Tool mobile tracker opens with usable primary controls", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await openTool(page, /open lean tool/i, /^Fast DOWNTIME observation tracker$/i);

  await expect(page.getByRole("button", { name: /^Tracker$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Results$/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /What are they doing\?/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Start$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Complete$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Reset$/ })).toBeVisible();
  await expect(page.getByText(/Observation Timer/i)).toBeVisible();
  await expect(page.getByText(/^Activity$/i)).toBeVisible();
  await expect(page.getByText("DOWNTIME Waste", { exact: true })).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(8);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
