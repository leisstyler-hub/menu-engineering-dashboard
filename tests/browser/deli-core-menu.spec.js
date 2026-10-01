import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

const allRows = JSON.parse(await readFile(new URL("../../src/data/menuItems.json", import.meta.url), "utf8"));
const deliRows = allRows.filter((row) => row.menu === "AMZ: Deli Core");
const menuSummary = { menu: "AMZ: Deli Core", count: deliRows.length, categories: 1, quality: { total: deliRows.length, priced: deliRows.length, costed: deliRows.length, described: deliRows.length, allergenRows: deliRows.length, photoRows: 0, missingPhotoRows: deliRows.length, priceCoverage: 100, costCoverage: 100, descriptionCoverage: 100, allergenCoverage: 100, photoCoverage: 0 } };

async function mockTraffic(page) {
  await page.route("**/api/traffic/weekly", (route) => route.fulfill({ json: { ok: true, status: "live", days: [], totalVisitors: 0 } }));
}

test("Deli Core appears with all 41 costed SSMT-described items in Menu Library", async ({ page }) => {
  const errors = collectUnexpectedPageErrors(page);
  await mockTraffic(page);
  await page.route("**/api/recipe-library?scope=summary", (route) => route.fulfill({ json: { ok: true, source: "supabase-recipe-items", menus: [menuSummary], summary: menuSummary.quality } }));
  await page.route("**/api/recipe-library?scope=menu*", (route) => route.fulfill({ json: { ok: true, source: "supabase-recipe-items", menus: [menuSummary], selectedMenu: "AMZ: Deli Core", rows: deliRows, selectedSummary: menuSummary.quality, summary: menuSummary.quality } }));

  await openTool(page, /open library/i, /^Menu Library$/);
  await expect(page.getByRole("button", { name: /AMZ: Deli Core/ })).toBeVisible();
  await page.getByRole("button", { name: /AMZ: Deli Core/ }).click();
  await expect(page.getByRole("heading", { name: "AMZ: Deli Core", exact: true })).toBeVisible();
  await expect(page.getByText("41 visible of 41 items.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /Chimichurri Steak Sandwich/i })).toBeVisible();
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(errors);
});

test("Deli Core is selectable in Transfer Tool with Item + Waste costs", async ({ page }) => {
  const errors = collectUnexpectedPageErrors(page);
  await mockTraffic(page);
  await page.route("**/api/recipe-library?scope=all", (route) => route.fulfill({ json: { ok: true, source: "supabase-recipe-items", rows: deliRows } }));
  await page.route("**/api/storage/records**", (route) => route.fulfill({ json: { ok: true, records: [] } }));
  await page.route("**/api/transfer-breakdown?mrn=*", (route) => route.fulfill({ status: 404, json: { ok: false, message: "No ingredient mapping is available for this menu item." } }));

  await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  await page.getByLabel("Menu 1", { exact: true }).selectOption("AMZ: Deli Core");
  await expect(page.getByLabel("Item 1", { exact: true }).locator("option")).toHaveCount(42);
  await page.getByLabel("Item 1", { exact: true }).selectOption({ index: 1 });
  await expect(page.getByRole("table").getByText("Item + Waste / portion", { exact: true })).toBeVisible();
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(errors);
});

test("Deli Core is selectable in Cafe Tasting", async ({ page }) => {
  await page.route("**/api/smartsheet/records?dataset=cafe-tasting&diagnostic=columns", (route) => route.fulfill({ json: { ok: true, rawColumns: [
    { title: "Cafe Name", options: ["test cafe"] },
    { title: "Station Name", options: ["Deli"] },
    { title: "Taster", contactOptions: [{ email: "alex@example.com", name: "Alex" }] },
  ] } }));
  await page.route("**/api/smartsheet/records?dataset=cafe-tasting-routing", (route) => route.fulfill({ json: { ok: true, records: [{ __smartsheetRowId: 1, Cafe: "test cafe", "Chef Contact": "chef@example.com", "Director Contact": "director@example.com" }] } }));
  await page.route("**/api/recipe-library?scope=summary", (route) => route.fulfill({ json: { menus: [menuSummary] } }));
  await page.route("**/api/recipe-library?scope=menu*", (route) => route.fulfill({ json: { rows: deliRows } }));

  await page.goto("/?tool=cafeTasting");
  await page.getByLabel("Cafe Name").selectOption("test cafe");
  await page.getByLabel("Menu").selectOption("AMZ: Deli Core");
  await expect(page.getByLabel("Entree / Item 1").locator("option", { hasText: /Chimichurri Steak Sandwich/ })).toHaveCount(1);
});
