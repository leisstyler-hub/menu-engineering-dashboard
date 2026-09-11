import { expect, test } from "@playwright/test";
import XLSX from "xlsx";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

const existingTransfer = {
  "Record ID": "transfer|existing%20transfer",
  "Record Type": "Transfer",
  title: "Existing Transfer",
  departingUnit: "Dawson",
  receivingUnit: "Nessie",
  transferDate: "2026-09-08",
  updatedAt: "2026-09-08T12:00:00.000Z",
  items: [{
    catalogId: "amz: ohana|huli huli chicken|33065.1|1 piece",
    menu: "AMZ: Ohana",
    item: "Huli Huli Chicken",
    mrn: "33065.1",
    portion: "1 piece",
    itemWasteCost: 1.5,
    quantity: 2,
    glGroups: [{ gl: "4111001", name: "Legacy mapping", amount: 1.5 }],
  }],
};

async function mockTransferStorage(page) {
  const writes = [];
  await page.route("**/api/traffic/weekly", (route) => route.fulfill({ json: { ok: true, status: "live", days: [], totalVisitors: 0 } }));
  await page.route("**/api/recipe-library?scope=all", (route) => route.fulfill({ json: { ok: true, source: "test-live-menu-library", rows: [{ menu: "AMZ: Ohana", item: "Huli Huli Chicken", mrn: "33065.1", portion: "1 piece", trueCost: 2.5 }] } }));
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") return route.fulfill({ json: { ok: true, records: [existingTransfer] } });
    const body = request.postDataJSON();
    writes.push(body);
    return route.fulfill({ status: body.action === "createTransfer" ? 201 : 200, json: { ok: true, synced: 1 } });
  });
  return writes;
}

test("Transfer Tool creates, costs, saves, copies, searches, and exports a shared draft", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const writes = await mockTransferStorage(page);

  await page.goto("/");
  const tile = page.getByRole("main").locator('[data-tool-title="Transfer Tool"]');
  await expect(tile.getByText("Draft", { exact: true })).toBeVisible();
  await tile.getByRole("button", { name: "Open Transfer Tool" }).click();
  await expect(page.getByRole("heading", { name: "Transfer Tool" })).toBeVisible();
  await expect(page.getByText(/Item \+ Waste Cost is live from the platform catalog/i)).toBeVisible();
  await expect(page.getByText(/G\/L Breakdown/i)).toHaveCount(0);

  await page.getByLabel("Globally unique title").fill("QA Dawson to Nessie");
  await page.getByLabel("Departing unit").selectOption("Dawson");
  await page.getByLabel("Receiving unit").selectOption("Nessie");
  await page.getByLabel("Menu 1", { exact: true }).selectOption("AMZ: Ohana");
  await page.getByLabel("Item 1", { exact: true }).selectOption({ label: "Huli Huli Chicken · 33065.1 · 1 piece" });
  await page.getByLabel("Item count 1", { exact: true }).fill("2");

  const transferTable = page.getByRole("table");
  await expect(transferTable.getByText("$2.50", { exact: true })).toBeVisible();
  await expect(page.getByTestId("transfer-total")).toHaveText("$5.00");

  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByText(/Saved to shared storage/)).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0].action).toBe("createTransfer");
  expect(writes[0].records[0]["Record ID"]).toBe("transfer|qa%20dawson%20to%20nessie");
  expect(writes[0].records[0].items[0]).toMatchObject({ menu: "AMZ: Ohana", item: "Huli Huli Chicken", itemWasteCost: 2.5, quantity: 2 });
  expect(writes[0].records[0].items[0]).not.toHaveProperty("glGroups");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Excel" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const workbook = XLSX.readFile(path);
  expect(workbook.SheetNames).toEqual(["Transfer"]);
  const transferRows = XLSX.utils.sheet_to_json(workbook.Sheets.Transfer, { header: 1 });
  expect(transferRows.flat()).toContain("Huli Huli Chicken");
  expect(transferRows.flat()).not.toContain("G/L Breakdown");

  await page.getByRole("button", { name: "Copy Transfer" }).click();
  await expect(page.getByLabel("Globally unique title")).toHaveValue("");
  await expect(page.getByLabel("Departing unit")).toHaveValue("Dawson");
  await expect(page.getByText(/Copied into a new draft with current Item \+ Waste Costs/i)).toBeVisible();

  await page.getByLabel("Search transfers").fill("Existing");
  await expect(page.getByRole("heading", { name: "Existing Transfer" })).toBeVisible();
  await page.getByRole("heading", { name: "Existing Transfer" }).locator("xpath=ancestor::article").getByRole("button", { name: "Copy" }).click();
  await expect(page.getByTestId("transfer-total")).toHaveText("$5.00");
  await page.getByLabel("Globally unique title").fill("Legacy transfer sanitized");
  await page.getByRole("button", { name: "Save Draft" }).click();
  expect(writes).toHaveLength(2);
  expect(writes[1].records[0].items[0]).not.toHaveProperty("glGroups");
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Transfer Tool gates stale costs during delayed or failed live refresh", async ({ page }) => {
  let releaseCosts;
  const costGate = new Promise((resolve) => { releaseCosts = resolve; });
  await page.route("**/api/traffic/weekly", (route) => route.fulfill({ json: { ok: true, status: "live", days: [], totalVisitors: 0 } }));
  await page.route("**/api/storage/records**", (route) => route.fulfill({ json: { ok: true, records: [existingTransfer] } }));
  await page.route("**/api/recipe-library?scope=all", async (route) => {
    await costGate;
    await route.fulfill({ json: { ok: true, source: "delayed-live-catalog", rows: [{ menu: "AMZ: Ohana", item: "Huli Huli Chicken", mrn: "33065.1", portion: "1 piece", trueCost: 2.75 }] } });
  });
  await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  await page.getByLabel("Menu 1", { exact: true }).selectOption("AMZ: Ohana");
  await expect(page.getByLabel("Item 1", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save Draft" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Export Excel" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Copy Transfer" })).toBeDisabled();
  releaseCosts();
  await expect(page.getByText(/Live Item \+ Waste Costs verified from delayed-live-catalog for 1 of 1,515 catalog entries/i)).toBeVisible();
  await expect(page.getByLabel("Item 1", { exact: true })).toBeEnabled();
  await page.getByLabel("Item 1", { exact: true }).selectOption({ label: "Blistered Green Beans · 176734 · 4 ounce" });
  await expect(page.getByRole("table").getByText("Unavailable", { exact: true })).toBeVisible();
  await page.getByLabel("Globally unique title").fill("Partial live response blocked");
  await page.getByLabel("Departing unit").selectOption("Dawson");
  await page.getByLabel("Receiving unit").selectOption("Nessie");
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByText(/Every selected item needs an Item \+ Waste Cost/i)).toBeVisible();

  await page.unroute("**/api/recipe-library?scope=all");
  await page.route("**/api/recipe-library?scope=all", (route) => route.fulfill({ status: 503, json: { ok: false, message: "Cost source offline" } }));
  await page.reload();
  await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  await expect(page.getByText(/Cost source offline/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Save Draft" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Export Excel" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Copy Transfer" })).toBeDisabled();
});

test("Transfer Tool blocks duplicate titles and stays contained on a phone", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await mockTransferStorage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, /open transfer tool/i, /^Transfer Tool$/);

  await page.getByLabel("Globally unique title").fill(" existing   transfer ");
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByText(/Titles must be globally unique/i)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(8);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
