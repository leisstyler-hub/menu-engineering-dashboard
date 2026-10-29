import { expect, test } from "@playwright/test";
import XLSX from "xlsx";

import { addDays, buildOrderRecord, emptyQuantities, firstOpenWeek } from "../../src/features/commissary-ordering/commissaryModel.js";
import { COMMISSARY_ORDER_ITEMS } from "../../src/features/commissary-ordering/commissaryCatalog.js";
import { buildCommissaryMetadataRecord } from "../../src/features/commissary-ordering/commissaryMetadata.js";
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

test("cafe and service-week controls stay separated at mobile, tablet, and desktop widths", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await mockOrders(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    const cafeBox = await page.getByLabel("Your cafe").boundingBox();
    const weekBox = await page.getByLabel("Service week").boundingBox();
    expect(cafeBox).not.toBeNull();
    expect(weekBox).not.toBeNull();

    const overlapWidth = Math.min(cafeBox.x + cafeBox.width, weekBox.x + weekBox.width) - Math.max(cafeBox.x, weekBox.x);
    const overlapHeight = Math.min(cafeBox.y + cafeBox.height, weekBox.y + weekBox.height) - Math.max(cafeBox.y, weekBox.y);
    expect(overlapWidth > 0 && overlapHeight > 0, `${viewport.width}px controls overlap`).toBe(false);
    expect(cafeBox.x).toBeGreaterThanOrEqual(0);
    expect(weekBox.x).toBeGreaterThanOrEqual(0);
    expect(cafeBox.x + cafeBox.width).toBeLessThanOrEqual(viewport.width);
    expect(weekBox.x + weekBox.width).toBeLessThanOrEqual(viewport.width);
  }

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("ordering grid is the only horizontal slider and stops at the final item", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await mockOrders(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Nessie");
  const scroller = page.getByRole("table").locator("..");
  await expect(scroller).toBeVisible();

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    const metrics = await page.evaluate(() => {
      const horizontalScrollers = [...document.querySelectorAll("*")].filter((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return ["auto", "scroll"].includes(style.overflowX)
          && node.scrollWidth > node.clientWidth + 1
          && rect.width > 10
          && rect.height > 10;
      });
      return {
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        horizontalScrollerCount: horizontalScrollers.length,
      };
    });
    expect(metrics.documentWidth, `${viewport.width}px document overflow`).toBe(metrics.viewportWidth);
    expect(metrics.horizontalScrollerCount, `${viewport.width}px horizontal sliders`).toBe(1);

    await scroller.evaluate((node) => { node.scrollLeft = node.scrollWidth - node.clientWidth; });
    const scrollerBox = await scroller.boundingBox();
    const finalHeaderBox = await page.getByRole("columnheader").last().boundingBox();
    expect(scrollerBox).not.toBeNull();
    expect(finalHeaderBox).not.toBeNull();
    expect(Math.abs((finalHeaderBox.x + finalHeaderBox.width) - (scrollerBox.x + scrollerBox.width))).toBeLessThanOrEqual(1.5);
  }

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Commissary Ordering Tool requires cafe selection and saves separate delivery quantities", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const writes = await mockOrders(page, [buildCommissaryMetadataRecord()]);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await expect(page.getByText("Select your cafe to begin")).toBeVisible();
  await expect(page.getByLabel("Your cafe").locator("option")).toContainText([
    "Select cafe",
    "SEA39 Nessie Cafe",
    "SEA20 Cricket Cafe",
    "SEA27 Dawson Cafe",
    "Sonic",
    "Blueshift",
    "Bingo",
    "Grace",
    "Everest",
    "Dynamo",
    "Gemini",
    "Astra",
    "Eclipse",
    "Odyssey",
  ]);
  await expect(page.getByLabel("Your cafe")).not.toContainText(/\bPC\s+\d{5}\b/);
  await page.getByLabel("Your cafe").selectOption("Nessie");
  await expect(page.getByText("Frozen Peas", { exact: true })).toBeVisible();
  await expect(page.getByText("Blanched Green Beans", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/requires mixing/i)).toHaveCount(0);
  await expect(page.getByText(/new recipe/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /generate transfer/i })).toBeDisabled();
  await page.getByLabel("Friday delivery Sliced Cucumber quantity").fill("1");
  await page.getByLabel("Monday delivery Sliced Cucumber quantity").fill("2");
  await page.getByLabel("Wednesday delivery Sliced Cucumber quantity").fill("1");
  await page.getByLabel("Monday delivery Frozen Peas quantity").fill("1.25");
  const cucumber = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Sliced Cucumber");
  const saveButton = page.getByRole("button", { name: /save shared order/i });
  const generateButton = page.getByRole("button", { name: /generate transfer/i });
  await expect(generateButton).toBeEnabled();
  expect((await generateButton.boundingBox()).y).toBeGreaterThan((await saveButton.boundingBox()).y);
  const transferDownload = page.waitForEvent("download");
  await generateButton.click();
  const transferFile = await transferDownload;
  expect(transferFile.suggestedFilename()).toMatch(/Commissary Salad Bar Nessie.*Expense Transfer\.xlsx/);
  const transferWorkbook = XLSX.readFile(await transferFile.path());
  const transferRows = XLSX.utils.sheet_to_json(transferWorkbook.Sheets[transferWorkbook.SheetNames[0]], { header: 1, defval: "" });
  expect(transferRows).toContainEqual(expect.arrayContaining(["4111009", "30159", "4111009", expect.stringContaining("Frozen Peas"), 11.35]));
  const bomDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /generate prep list/i }).click();
  const prepListFile = await bomDownload;
  expect(prepListFile.suggestedFilename()).toMatch(/Commissary Salad Bar Prep List.*\.xlsx/);
  const bomWorkbook = XLSX.readFile(await prepListFile.path(), { cellStyles: true });
  expect(bomWorkbook.SheetNames).toEqual(["Consolidated Prep List", "Friday Delivery Map", "Monday Delivery Map", "Wednesday Delivery Map", "Power Automate"]);
  expect(bomWorkbook.Sheets["Consolidated Prep List"].A1.s.fgColor.rgb).toBe("17365D");
  const prepRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Consolidated Prep List"], { header: 1, defval: "" });
  expect(prepRows[2].slice(0, 3)).toEqual(["Ingredient / item", "Total quantity", "Order unit"]);
  expect(bomWorkbook.Workbook.Sheets.find((sheet) => sheet.name === "Power Automate")?.Hidden).toBe(1);
  expect(bomWorkbook.Sheets["Monday Delivery Map"].A4.s.fgColor.rgb).toBe("D9EAF7");
  const fridayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Friday Delivery Map"], { header: 1, defval: "" });
  const mondayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Monday Delivery Map"], { header: 1, defval: "" });
  const wednesdayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Wednesday Delivery Map"], { header: 1, defval: "" });
  expect(fridayRows).toContainEqual(expect.arrayContaining(["Nessie", "Sliced Cucumber", cucumber.mrn, 1]));
  expect(mondayRows).toContainEqual(expect.arrayContaining(["Nessie", "Sliced Cucumber", cucumber.mrn, 2]));
  expect(mondayRows).toContainEqual(expect.arrayContaining(["Nessie", "Frozen Peas", "4877", 1.25]));
  expect(wednesdayRows).toContainEqual(expect.arrayContaining(["Nessie", "Sliced Cucumber", cucumber.mrn, 1]));
  await saveButton.click();
  await expect(page.getByText(/Nessie's order.*was saved/i)).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0].context.tool).toBe("commissaryOrders");
  expect(writes[0].records[0].orderUnitVersion).toBe(2);
  expect(writes[0].records[0].commissaryMetadataVersion).toBe(2);
  expect(writes[0].records[0].quantities[cucumber.id]).toEqual({ friday: 1, monday: 2, wednesday: 1 });
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("locked commissary week is read-only and exposes Prep List and exact-template S4 exports", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const openWeek = firstOpenWeek();
  const lockedWeek = addDays(openWeek, -7);
  const quantities = emptyQuantities();
  quantities[COMMISSARY_ORDER_ITEMS[0].id] = { friday: 1, monday: 2, wednesday: 1 };
  const record = buildOrderRecord({ cafe: "Nessie", weekStart: lockedWeek, quantities, now: new Date(`${lockedWeek}T12:00:00Z`) });
  await mockOrders(page, [record]);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Nessie");
  await page.getByLabel("Service week").selectOption(lockedWeek);
  await expect(page.getByText("Ordering closed")).toBeVisible();
  await expect(page.getByText(/please contact commissary executive chef to adjust pars/i)).toBeVisible();
  await expect(page.getByLabel("Monday delivery Sliced Cucumber quantity")).toBeDisabled();
  await expect(page.getByLabel("Friday delivery Sliced Cucumber quantity")).toBeDisabled();
  await expect(page.getByRole("button", { name: /download combined prep list/i })).toBeEnabled();
  const transferDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /download nessie s4 transfer/i }).click();
  expect((await transferDownload).suggestedFilename()).toMatch(/Commissary Salad Bar Nessie.*Expense Transfer\.xlsx/);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Prep List View is vertical, touch friendly, translated, and saves hold-to-check progress", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const lockedWeek = addDays(firstOpenWeek(), -7);
  const quantities = emptyQuantities();
  quantities[COMMISSARY_ORDER_ITEMS[0].id] = { friday: 2, monday: 2, wednesday: 1 };
  quantities[COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Frozen Peas").id] = { friday: 1.25, monday: 1.25, wednesday: 0 };
  const record = buildOrderRecord({ cafe: "Nessie", weekStart: lockedWeek, quantities, now: new Date(`${lockedWeek}T12:00:00Z`) });
  const writes = await mockOrders(page, [record]);
  await page.setViewportSize({ width: 820, height: 1180 });
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByRole("button", { name: "Prep List View" }).click();

  const prepView = page.getByTestId("commissary-prep-list-view");
  await expect(prepView).toBeVisible();
  await expect(page.getByLabel("Your cafe")).toHaveCount(0);
  await expect(prepView.getByText("Sliced Cucumber", { exact: true })).toBeVisible();
  const cucumber = COMMISSARY_ORDER_ITEMS[0];
  const quantityBlock = prepView.getByTestId(`prep-quantity-${cucumber.id}`);
  const cafeBreakdown = prepView.getByTestId(`prep-cafes-${cucumber.id}`);
  await expect(quantityBlock).toContainText("2 gal");
  await expect(cafeBreakdown).toHaveText("Nessie 2");
  const quantityBox = await quantityBlock.boundingBox();
  const cafeBox = await cafeBreakdown.boundingBox();
  expect(cafeBox.y).toBeGreaterThan(quantityBox.y);
  const overflow = await prepView.evaluate((node) => node.scrollWidth > node.clientWidth + 1);
  expect(overflow).toBe(false);

  await page.getByRole("switch", { name: "Spanish translation" }).click();
  await expect(prepView.getByText("Entrega del viernes", { exact: true })).toBeVisible();
  await expect(prepView.getByText("Lista de preparación", { exact: true })).toBeVisible();
  await expect(prepView.getByText("Pepino en rodajas", { exact: true })).toBeVisible();
  const checkbox = page.getByRole("button", { name: /mantenga presionado.*pepino en rodajas/i });
  await checkbox.dispatchEvent("pointerdown", { pointerType: "touch", button: 0 });
  await page.waitForTimeout(650);
  await checkbox.dispatchEvent("pointerup", { pointerType: "touch", button: 0 });
  await expect(checkbox).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].context.tool).toBe("commissaryOrders");
  expect(writes[0].records[0]["Record Type"]).toBe("Commissary Prep Progress");
  expect(writes[0].records[0].completed.friday).toContain(COMMISSARY_ORDER_ITEMS[0].id);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
