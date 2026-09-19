import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
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

const secondTransfer = {
  ...existingTransfer,
  "Record ID": "transfer|second%20transfer",
  title: "Second Transfer",
  departingUnit: "Nessie",
  receivingUnit: "Dawson",
  updatedAt: "2026-09-07T12:00:00.000Z",
};

async function mockTransferStorage(page) {
  const writes = [];
  await page.route("**/api/traffic/weekly", (route) => route.fulfill({ json: { ok: true, status: "live", days: [], totalVisitors: 0 } }));
  await page.route("**/api/recipe-library?scope=all", (route) => route.fulfill({ json: { ok: true, source: "test-live-menu-library", rows: [{ menu: "AMZ: Ohana", item: "Huli Huli Chicken", mrn: "33065.1", portion: "1 piece", trueCost: 2.5 }] } }));
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") return route.fulfill({ json: { ok: true, records: [existingTransfer, secondTransfer] } });
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
  await page.getByRole("textbox", { name: "From G/L 1", exact: true }).fill("4111001");
  await page.getByRole("textbox", { name: "To G/L 1", exact: true }).fill("4111002");
  await page.getByLabel("Event ID").fill("EVENT-42");
  await expect(page.getByLabel("Receiving profit center")).toHaveValue("30159");
  await expect(page.getByLabel("Receiving profit center")).toHaveAttribute("readonly", "");

  const transferTable = page.getByRole("table");
  await expect(transferTable.getByText("$2.50", { exact: true })).toBeVisible();
  await expect(page.getByTestId("transfer-total")).toHaveText("$5.00");

  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByText(/Saved to shared storage/)).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0].action).toBe("createTransfer");
  expect(writes[0].records[0]["Record ID"]).toBe("transfer|qa%20dawson%20to%20nessie");
  expect(writes[0].records[0].items[0]).toMatchObject({ menu: "AMZ: Ohana", item: "Huli Huli Chicken", itemWasteCost: 2.5, quantity: 2 });
  expect(writes[0].records[0]).toMatchObject({ s4ExportVersion: 1, departingProfitCenter: "28676", receivingProfitCenter: "30159", eventId: "EVENT-42" });
  expect(writes[0].records[0].items[0]).toMatchObject({ fromGlAccount: "4111001", toGlAccount: "4111002", description: "Huli Huli Chicken - QA Dawson to Nessie" });
  expect(writes[0].records[0].items[0]).not.toHaveProperty("glGroups");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export S4 Excel" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const workbook = XLSX.readFile(path);
  expect(workbook.SheetNames).toEqual(["Template", "Guidelines"]);
  const transferRows = XLSX.utils.sheet_to_json(workbook.Sheets.Template, { header: 1 });
  expect(transferRows[1]).toEqual(["4111001", "30159", "4111002", "Huli Huli Chicken - QA Dawson to Nessie", 5, "EVENT-42"]);

  await page.getByRole("button", { name: "Copy Transfer" }).click();
  await expect(page.getByLabel("Globally unique title")).toHaveValue("");
  await expect(page.getByLabel("Departing unit")).toHaveValue("Dawson");
  await expect(page.getByLabel("Transfer date")).not.toHaveValue("");
  await expect(page.getByLabel("Event ID")).toHaveValue("");
  await expect(page.getByText(/Copied into a new draft with current Item \+ Waste Costs/i)).toBeVisible();

  await page.getByLabel("Search transfers").fill("Existing");
  const existingCard = page.locator("article").filter({ hasText: "Existing Transfer" });
  await expect(existingCard).toBeVisible();
  await existingCard.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByTestId("transfer-total")).toHaveText("$5.00");
  await page.getByLabel("Globally unique title").fill("Legacy transfer sanitized");
  await page.getByLabel("Transfer date").fill("2026-09-11");
  await page.getByRole("textbox", { name: "From G/L 1", exact: true }).fill("4111001");
  await page.getByRole("textbox", { name: "To G/L 1", exact: true }).fill("4111002");
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
  await expect(page.getByRole("button", { name: "Export S4 Excel" })).toBeDisabled();
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
  await expect(page.getByRole("button", { name: "Export S4 Excel" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Copy Transfer" })).toBeDisabled();
});

test("Transfer Tool stages legacy saved transfers and exports one exact S4 workbook per transfer in a ZIP without writes", async ({ page }) => {
  const writes = await mockTransferStorage(page);
  await openTool(page, /open transfer tool/i, /^Transfer Tool$/);
  await page.getByLabel("Select Existing Transfer for batch export").check();
  await page.getByLabel("Select Second Transfer for batch export").check();
  await expect(page.getByRole("heading", { name: "Complete S4 fields" })).toBeVisible();
  const existingStage = page.locator("details").filter({ hasText: "Existing Transfer" });
  await existingStage.getByText("Existing Transfer needs S4 fields").click();
  await existingStage.getByLabel("Mobile From G/L 1").fill("4111001");
  await existingStage.getByLabel("Mobile To G/L 1").fill("4111002");
  await page.getByLabel("Existing Transfer event ID").fill("BATCH-7");
  const secondStage = page.locator("details").filter({ hasText: "Second Transfer" });
  await secondStage.getByText("Second Transfer needs S4 fields").click();
  await secondStage.getByLabel("Mobile From G/L 1").fill("4111003");
  await secondStage.getByLabel("Mobile To G/L 1").fill("4111004");
  await page.getByLabel("Second Transfer event ID").fill("BATCH-8");
  await expect(page.getByLabel("Existing Transfer receiving profit center")).toHaveValue("30159");
  await expect(page.getByLabel("Second Transfer receiving profit center")).toHaveValue("28676");
  expect(writes).toHaveLength(0);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export selected as ZIP (2)" }).click();
  const download = await downloadPromise;
  const zip = await JSZip.loadAsync(await readFile(await download.path()));
  const workbookNames = Object.keys(zip.files).filter((name) => name.endsWith(".xlsx"));
  expect(workbookNames).toEqual(["Existing Transfer Expense Transfer.xlsx", "Second Transfer Expense Transfer.xlsx"]);
  const workbookBytes = await zip.file(workbookNames[0]).async("nodebuffer");
  const workbook = XLSX.read(workbookBytes, { type: "buffer" });
  expect(workbook.SheetNames).toEqual(["Template", "Guidelines"]);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Template, { header: 1 });
  expect(rows[1]).toEqual(["4111001", "30159", "4111002", "Huli Huli Chicken - Existing Transfer", 3, "BATCH-7"]);
  const secondWorkbookBytes = await zip.file(workbookNames[1]).async("nodebuffer");
  const secondWorkbook = XLSX.read(secondWorkbookBytes, { type: "buffer" });
  const secondRows = XLSX.utils.sheet_to_json(secondWorkbook.Sheets.Template, { header: 1 });
  expect(secondRows[1]).toEqual(["4111003", "28676", "4111004", "Huli Huli Chicken - Second Transfer", 3, "BATCH-8"]);
  expect(writes).toHaveLength(0);
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
