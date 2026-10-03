import { expect, test } from "@playwright/test";

import { addDays, buildOrderRecord, emptyQuantities, firstOpenWeek } from "../../src/features/commissary-ordering/commissaryModel.js";
import { COMMISSARY_ORDER_ITEMS } from "../../src/features/commissary-ordering/commissaryCatalog.js";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

async function mockOrders(page, records = []) {
  const writes = [];
  await page.route("**/api/storage/records**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, records }) });
    writes.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, synced: 1 }) });
  });
  return writes;
}

test("Commissary Ordering Tool requires cafe selection and saves separate delivery quantities", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const writes = await mockOrders(page);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await expect(page.getByText("Select your cafe to begin")).toBeVisible();
  await page.getByLabel("Your cafe").selectOption("Nessie");
  await expect(page.getByText(/requires mixing/i)).toHaveCount(0);
  await expect(page.getByText(/new recipe/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /generate transfer/i })).toBeDisabled();
  await page.getByLabel("Monday delivery Sliced Cucumber quantity").fill("2");
  await page.getByLabel("Wednesday delivery Sliced Cucumber quantity").fill("1");
  const saveButton = page.getByRole("button", { name: /save shared order/i });
  const generateButton = page.getByRole("button", { name: /generate transfer/i });
  await expect(generateButton).toBeEnabled();
  expect((await generateButton.boundingBox()).y).toBeGreaterThan((await saveButton.boundingBox()).y);
  const transferDownload = page.waitForEvent("download");
  await generateButton.click();
  expect((await transferDownload).suggestedFilename()).toMatch(/Commissary Salad Bar Nessie.*Expense Transfer\.xlsx/);
  await saveButton.click();
  await expect(page.getByText(/Nessie's order.*was saved/i)).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0].context.tool).toBe("commissaryOrders");
  const cucumber = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Sliced Cucumber");
  expect(writes[0].records[0].quantities[cucumber.id]).toEqual({ monday: 2, wednesday: 1 });
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("locked commissary week is read-only and exposes BOM and exact-template S4 exports", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const openWeek = firstOpenWeek();
  const lockedWeek = addDays(openWeek, -7);
  const quantities = emptyQuantities();
  quantities[COMMISSARY_ORDER_ITEMS[0].id] = { monday: 2, wednesday: 1 };
  const record = buildOrderRecord({ cafe: "Nessie", weekStart: lockedWeek, quantities, now: new Date(`${lockedWeek}T12:00:00Z`) });
  await mockOrders(page, [record]);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Nessie");
  await page.getByLabel("Service week").selectOption(lockedWeek);
  await expect(page.getByText("Ordering closed")).toBeVisible();
  await expect(page.getByText(/please contact commissary executive chef to adjust pars/i)).toBeVisible();
  await expect(page.getByLabel("Monday delivery Sliced Cucumber quantity")).toBeDisabled();
  await expect(page.getByRole("button", { name: /download combined bom/i })).toBeEnabled();
  const transferDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /download nessie s4 transfer/i }).click();
  expect((await transferDownload).suggestedFilename()).toMatch(/Commissary Salad Bar Nessie.*Expense Transfer\.xlsx/);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
