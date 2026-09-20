import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import XLSX from "xlsx";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

const allocations = [
  { ingredientMrn: "1744", ingredientName: "Chicken Thigh", quantity: 4, unit: "ounce", recipeYield: 4, unitPrice: 1.5, glCode: "4111003", allocationPerPortion: 1.5 },
  { ingredientMrn: "7203", ingredientName: "Soy Sauce", quantity: 1, unit: "ounce", recipeYield: 4, unitPrice: 4, glCode: "4111005", allocationPerPortion: 1 },
];

const existingTransfer = {
  "Record ID": "transfer|existing%20transfer", "Record Type": "Transfer", title: "Existing Transfer", departingUnit: "Dawson", receivingUnit: "Nessie", transferDate: "2026-09-08", updatedAt: "2026-09-08T12:00:00.000Z",
  items: [{ catalogId: "amz: ohana|huli huli chicken|33065.1|1 piece", menu: "AMZ: Ohana", item: "Huli Huli Chicken", mrn: "33065.1", portion: "1 piece", itemWasteCost: 2.5, allocationPerPortion: 2.5, ingredientAllocations: allocations, quantity: 2 }],
};
const secondTransfer = { ...existingTransfer, "Record ID": "transfer|second%20transfer", title: "Second Transfer", departingUnit: "Nessie", receivingUnit: "Dawson", updatedAt: "2026-09-07T12:00:00.000Z" };

async function mockTransferStorage(page, { huliComponents = allocations, huliUnpricedComponents = [], huliCost = 2.5 } = {}) {
  const writes = [];
  await page.route("**/api/traffic/weekly", (route) => route.fulfill({ json: { ok: true, status: "live", days: [], totalVisitors: 0 } }));
  await page.route("**/api/recipe-library?scope=all", (route) => route.fulfill({ json: { ok: true, source: "test-live-menu-library", rows: [{ menu: "AMZ: Ohana", item: "Huli Huli Chicken", mrn: "33065.1", portion: "1 piece", trueCost: huliCost }] } }));
  await page.route("**/api/transfer-breakdown?mrn=*", (route) => {
    const mrn = new URL(route.request().url()).searchParams.get("mrn");
    return mrn === "33065.1" ? route.fulfill({ json: { ok: true, components: huliComponents, unpricedComponents: huliUnpricedComponents, pricingComplete: huliUnpricedComponents.length === 0, allocationPerPortion: huliComponents.reduce((sum, component) => sum + Number(component.allocationPerPortion || 0), 0), resource: { title: "Ingredient Costing 9.19.26" } } }) : route.fulfill({ status: 404, json: { ok: false, message: "No ingredient mapping is available for this menu item." } });
  });
  await page.route("**/api/storage/records**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { ok: true, records: [existingTransfer, secondTransfer] } });
    const body = route.request().postDataJSON(); writes.push(body);
    return route.fulfill({ status: body.action === "createTransfer" ? 201 : 200, json: { ok: true, synced: 1 } });
  });
  return writes;
}

test("Transfer Tool expands a selected item into automatic ingredient G/L rows and exports them", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const writes = await mockTransferStorage(page);
  await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  await page.getByLabel("Globally unique title").fill("QA Dawson to Nessie");
  await page.getByLabel("Departing unit").selectOption("Dawson");
  await page.getByLabel("Receiving unit").selectOption("Nessie");
  await page.getByLabel("Menu 1", { exact: true }).selectOption("AMZ: Ohana");
  await page.getByLabel("Item 1", { exact: true }).selectOption({ label: "Huli Huli Chicken · 33065.1 · 1 piece" });
  await expect(page.getByText("Automatic ingredient G/L allocation").last()).toBeVisible();
  await expect(page.getByText("Chicken Thigh").last()).toBeVisible();
  await expect(page.getByText("4111003").last()).toBeVisible();
  await page.getByLabel("Item count 1", { exact: true }).fill("2");
  await page.getByLabel("Event ID").fill("EVENT-42");
  await expect(page.getByTestId("transfer-total")).toHaveText("$5.00");
  await page.getByRole("button", { name: "Save Draft" }).click();
  expect(writes[0].records[0].items[0]).toMatchObject({ allocationPerPortion: 2.5, ingredientAllocations: allocations, quantity: 2 });
  expect(writes[0].records[0].items[0]).not.toHaveProperty("fromGlAccount");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export S4 Excel" }).click();
  const workbook = XLSX.readFile(await (await downloadPromise).path());
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Template, { header: 1 });
  expect(rows.slice(1, 3)).toEqual([
    ["4111003", "30159", "4111003", "Huli Huli Chicken Chicken Th - QA Dawson to Nessie", 3, "EVENT-42"],
    ["4111005", "30159", "4111005", "Huli Huli Chicken Soy Sauce - QA Dawson to Nessie", 2, "EVENT-42"],
  ]);
  await expectNoAppProtection(page); expectNoUnexpectedPageErrors(pageErrors);
});

test("Transfer Tool requires chef G/L review before balancing unresolved component cost", async ({ page }) => {
  const huliComponents = [{ ingredientMrn: "substitute", ingredientName: "Arugula", quantity: 1, unit: "ounce", recipeYield: 1, unitPrice: 2.2, glCode: "4111012", allocationPerPortion: 2.2, isSubstitutePrice: true, priceSourceMrn: "source-arugula", priceSourceNote: "Substitute price used: closest Ingredient Snapshot name match (Arugula)." }];
  const huliUnpricedComponents = [{ ingredientMrn: "missing", ingredientName: "Chef sauce", quantity: 1, unit: "ounce", recipeYield: 1, glCode: "4111011", allocationPerPortion: null }];
  const writes = await mockTransferStorage(page, { huliComponents, huliUnpricedComponents, huliCost: 2.5 });
  await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  await page.getByLabel("Globally unique title").fill("QA Substitute and balance");
  await page.getByLabel("Departing unit").selectOption("Dawson");
  await page.getByLabel("Receiving unit").selectOption("Nessie");
  await page.getByLabel("Menu 1", { exact: true }).selectOption("AMZ: Ohana");
  await page.getByLabel("Item 1", { exact: true }).selectOption({ label: "Huli Huli Chicken · 33065.1 · 1 piece" });
  await expect(page.getByText(/Substitute price used/i).last()).toBeVisible();
  await expect(page.getByText(/Chef review · remaining \$0\.30/i).last()).toBeVisible();
  await expect(page.getByTestId("transfer-total")).toHaveText("$2.50");
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByText(/Choose one chef-reviewed G\/L code/i).last()).toBeVisible();
  await page.getByLabel("Chef-reviewed G/L for Huli Huli Chicken").last().selectOption("4111012");
  await page.getByRole("button", { name: "Save Draft" }).click();
  const savedAllocations = writes[0].records[0].items[0].ingredientAllocations;
  expect(savedAllocations).toEqual(expect.arrayContaining([expect.objectContaining({ isSubstitutePrice: true }), expect.objectContaining({ isResidualCostBalance: true, glCode: "4111012", allocationPerPortion: 0.3 })]));
});

test("Transfer Tool blocks an item with no ingredient mapping", async ({ page }) => {
  await mockTransferStorage(page); await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  await page.getByLabel("Menu 1", { exact: true }).selectOption("AMZ: Ohana");
  await page.getByLabel("Item 1", { exact: true }).selectOption({ label: "Blistered Green Beans · 176734 · 4 ounce" });
  await expect(page.locator('[role="alert"]').filter({ hasText: "No ingredient mapping is available" }).last()).toBeVisible();
  await page.getByLabel("Globally unique title").fill("Missing allocation"); await page.getByLabel("Departing unit").selectOption("Dawson"); await page.getByLabel("Receiving unit").selectOption("Nessie");
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByText(/needs a priced ingredient allocation/i)).toBeVisible();
});

test("Transfer Tool retains the current cafe profit-center mappings", async ({ page }) => {
  await mockTransferStorage(page); await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  await page.getByLabel("Receiving unit").selectOption("Astra"); await expect(page.getByLabel("Receiving profit center")).toHaveValue("62844");
  await page.getByLabel("Receiving unit").selectOption("LAX78"); await expect(page.getByLabel("Receiving profit center")).toHaveValue("64002");
});

test("Transfer Tool batch export uses stored automatic allocations without writes", async ({ page }) => {
  const writes = await mockTransferStorage(page); await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  await page.getByLabel("Include Existing Transfer in batch export").check(); await page.getByLabel("Include Second Transfer in batch export").check();
  await expect(page.getByRole("heading", { name: "Review ingredient allocations" })).toBeVisible();
  await page.locator("details").filter({ hasText: "Existing Transfer" }).locator("summary").click();
  await page.locator("details").filter({ hasText: "Second Transfer" }).locator("summary").click();
  await page.getByLabel("Existing Transfer event ID").fill("BATCH-7"); await page.getByLabel("Second Transfer event ID").fill("BATCH-8");
  const downloadPromise = page.waitForEvent("download"); await page.getByRole("button", { name: "Download selected transfers (2)" }).click();
  const zip = await JSZip.loadAsync(await readFile(await (await downloadPromise).path()));
  expect(Object.keys(zip.files).filter((name) => name.endsWith(".xlsx"))).toEqual(["Existing Transfer Expense Transfer.xlsx", "Second Transfer Expense Transfer.xlsx"]);
  expect(writes).toHaveLength(0);
});

test("Transfer Tool deletes one saved draft after one confirmation", async ({ page }) => {
  const writes = await mockTransferStorage(page); await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  const existingCard = page.locator("article").filter({ hasText: "Existing Transfer" });
  page.on("dialog", (dialog) => dialog.accept()); await existingCard.getByRole("button", { name: "Delete Existing Transfer" }).click();
  await expect(existingCard).toHaveCount(0); expect(writes.at(-1)).toMatchObject({ action: "deleteTransfer", recordId: "transfer|existing%20transfer" });
});
