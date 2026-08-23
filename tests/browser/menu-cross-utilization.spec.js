import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

test("Menu Cross Utilization Tool opens with pillar strategy and the full menu list", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);

  await expect(page.getByText("Amazon Region (FBE000)", { exact: true })).toBeVisible();
  await expect(page.getByText("Report date 2026-08-03", { exact: true })).toBeVisible();
  await expect(page.getByText(/guidance only, not an automatic rotation rule/i)).toBeVisible();

  await expect(page.getByRole("heading", { name: "Cuisine pillar groupings" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Base Station Infrastructure" })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Menu cross-utilization list" })).toBeVisible();
  const chickleRow = page.getByRole("row", { name: /Chickle/ });
  await expect(chickleRow).toBeVisible();
  await expect(chickleRow.getByText("no ingredient data")).toBeVisible();
  await expect(page.getByRole("row", { name: /^Andes/ })).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Cross Utilization Tool pairwise matrix shows overlap detail in the required field order", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await page.getByRole("button", { name: /open pairwise matrix/i }).click();

  await expect(page.getByRole("heading", { name: "Ingredient overlap by menu pair" })).toBeVisible();
  await expect(page.getByText("Chickle has no ingredient data and is excluded from this grid.")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Chickle" })).toHaveCount(0);
  await expect(page.getByText("Pillar cross-utilization %")).toBeVisible();
  await expect(page.getByTestId("pillar-cross-use-Latin").getByText(/\d+%/)).toBeVisible();

  await page.getByTitle(/Andes × Cevicheria:/).click();

  const andesCevicheriaCell = page.getByTitle(/Andes .* Cevicheria:/).first();
  await expect(andesCevicheriaCell).toContainText(/\d+%/);
  const cellBox = await andesCevicheriaCell.boundingBox();
  expect(cellBox?.width).toBeGreaterThanOrEqual(34);
  expect(cellBox?.height).toBeGreaterThanOrEqual(34);
  const background = await andesCevicheriaCell.evaluate((element) => getComputedStyle(element).backgroundColor);
  const channels = background.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  expect(channels[0]).toBeGreaterThan(channels[1]);
  expect(channels[0]).toBeGreaterThan(channels[2]);

  const detail = page.locator("aside", { hasText: "Pair Detail" });
  await expect(detail.getByRole("heading", { name: "Andes × Cevicheria" })).toBeVisible();
  await expect(detail.getByText("% Overlap")).toBeVisible();
  await expect(detail.getByText(/shared ingredients \(ingredient\/purchasing overlap only\)/i)).toBeVisible();
  await expect(detail.getByText(/Shared ingredients \(\d+\)/)).toBeVisible();
  await expect(detail.getByText(/Ordering \/ reuse opportunity/i)).toBeVisible();
  await expect(detail.getByText(/not proof of a shared recipe/i)).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Cross Utilization Tool stays usable on tablet and mobile viewports", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await page.setViewportSize({ width: 820, height: 1180 });
  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await expect(page.getByRole("heading", { name: "Cuisine pillar groupings" })).toBeVisible();
  let horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(8);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Menu Cross Utilization Tool" })).toBeVisible();
  await expect(page.getByRole("button", { name: /open pairwise matrix/i })).toBeVisible();
  horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(8);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
