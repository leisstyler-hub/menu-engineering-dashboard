import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import XLSX from "xlsx";

import { COMMISSARY_PREP_BOARD_PILOT_WEEK, buildOrderRecord, deliCycleForWeek, emptyDeliOrder, emptyGrillOrder, emptyQuantities, firstOpenWeek } from "../../src/features/commissary-ordering/commissaryModel.js";
import { COMMISSARY_ORDER_ITEMS, COMMISSARY_PREVIOUS_ORDER_ITEMS } from "../../src/features/commissary-ordering/commissaryCatalog.js";
import { buildCommissaryMetadataRecord } from "../../src/features/commissary-ordering/commissaryMetadata.js";
import { GRILL_LTO_PROGRAM } from "../../src/features/commissary-ordering/grillLtoCatalog.js";
import { DELI_ORDERING_PROGRAM } from "../../src/features/commissary-ordering/deliCycleCatalog.js";
import { GLOBAL_ORDERING_PROGRAM } from "../../src/features/commissary-ordering/globalCycleCatalog.js";
import { BREAKFAST_ORDERING_PROGRAM } from "../../src/features/commissary-ordering/breakfastCatalog.js";
import { DAILY_GLOBAL_PROGRAMS } from "../../src/features/commissary-ordering/dailyGlobalCatalog.js";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

async function mockOrders(page, records = [], rotationRecords = []) {
  const writes = [];
  const grillItems = [...new Map([...GRILL_LTO_PROGRAM.cycleWeeks.flatMap((week) => [...week.setA, ...week.setB]), ...GRILL_LTO_PROGRAM.coreItems].map((item, index) => [item.mrn, {
    menu: GRILL_LTO_PROGRAM.menu,
    item: item.name,
    mrn: item.mrn,
    portion: item.category === "side" ? "1 serving" : "1 sandwich",
    trueCost: Number((3 + index / 10).toFixed(4)),
  }])).values()];
  const deliItems = [...new Map(DELI_ORDERING_PROGRAM.cycleWeeks.flatMap((week) => week.items).map((item, index) => [item.mrn, {
    menu: DELI_ORDERING_PROGRAM.menu,
    item: item.name,
    mrn: item.mrn,
    portion: "1 sandwich",
    trueCost: Number((2.5 + index / 10).toFixed(4)),
  }])).values()];
  const globalItems = [...new Map(GLOBAL_ORDERING_PROGRAM.cycleWeeks.flatMap(({ menus }) => menus.flatMap(({ items }) => items)).map((item, index) => [`${item.menu}|${item.mrn}|${item.portion}`, {
    menu: item.menu,
    item: item.name,
    mrn: item.mrn,
    portion: item.portion,
    trueCost: Number((1.5 + index / 100).toFixed(4)),
  }])).values()];
  const breakfastItems = BREAKFAST_ORDERING_PROGRAM.items.map((item, index) => ({ menu: BREAKFAST_ORDERING_PROGRAM.menu, item: item.name, mrn: item.mrn, portion: item.portion, trueCost: Number((2 + index / 10).toFixed(4)) }));
  const dailyGlobalItems = [...new Map(Object.values(DAILY_GLOBAL_PROGRAMS).flatMap((program) => program.cycleWeeks.flatMap(({ days }) => days.flatMap((day) => [day.animal, day.vegetarian].map((item) => ({ menu: day.menu, item: item.name, mrn: item.mrn, portion: item.portion, trueCost: 4.25 }))))).map((item) => [`${item.menu}|${item.mrn}`, item])).values()];
  await page.route("**/api/recipe-library?scope=all", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, source: "supabase-recipe-items", rows: [...grillItems, ...deliItems, ...globalItems, ...breakfastItems, ...dailyGlobalItems] }) }));
  await page.route("**/api/storage/records**", async (route) => {
    if (route.request().method() === "GET") {
      const requestedRecords = new URL(route.request().url()).searchParams.get("tool") === "rotation" ? rotationRecords : records;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, records: requestedRecords }) });
    }
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
  await page.getByLabel("Your cafe").selectOption("Cricket");
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

test("Commissary Ordering Tool autosaves separate delivery quantities without a Save button", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const writes = await mockOrders(page, [buildCommissaryMetadataRecord()]);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await expect(page.getByText("Select your cafe to begin")).toBeVisible();
  await expect(page.getByLabel("Your cafe").locator("option")).toContainText([
    "Select cafe",
    "Nessie 30159",
    "Cricket 22472",
    "Dawson 28675",
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
    "Doppler",
    "Day 1",
    "Nitro",
    "Re:Invent",
    "Brazil Coffee",
    "Roxanne Coffee",
    "Arizona Coffee",
    "Zoka Coffee",
  ]);
  await expect(page.getByLabel("Your cafe")).not.toContainText(/\bPC\s+\d{5}\b/);
  await page.getByLabel("Your cafe").selectOption("Cricket");
  await expect(page.getByText("Green Peas", { exact: true })).toBeVisible();
  await expect(page.getByText("Frozen Peas", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Blanched Green Beans", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/requires mixing/i)).toHaveCount(0);
  await expect(page.getByText(/new recipe/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /generate transfer/i })).toBeDisabled();
  await page.getByLabel("Grill Set A sandwich").selectOption({ index: 1 });
  await page.getByLabel("Grill Set B sandwich").selectOption({ index: 1 });
  await page.getByLabel(/^Friday \d+\/\d+ English Cucumbers, Fresh, Sliced, Half quantity$/).fill("1");
  await page.getByLabel(/^Monday \d+\/\d+ English Cucumbers, Fresh, Sliced, Half quantity$/).fill("2");
  await page.getByLabel(/^Wednesday \d+\/\d+ English Cucumbers, Fresh, Sliced, Half quantity$/).fill("1");
  await page.getByLabel(/^Monday \d+\/\d+ Green Peas quantity$/).fill("1.25");
  const cucumber = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "English Cucumbers, Fresh, Sliced, Half");
  await expect(page.getByRole("button", { name: /^save order$/i })).toHaveCount(0);
  await expect(page.getByText("Saved automatically", { exact: true })).toBeVisible();
  const generateButton = page.getByRole("button", { name: /generate transfer/i });
  await expect(generateButton).toBeEnabled();
  const transferDownload = page.waitForEvent("download");
  await generateButton.click();
  const transferFile = await transferDownload;
  expect(transferFile.suggestedFilename()).toMatch(/Commissary Order Cricket.*Expense Transfer\.xlsx/);
  const transferWorkbook = XLSX.readFile(await transferFile.path());
  const transferRows = XLSX.utils.sheet_to_json(transferWorkbook.Sheets[transferWorkbook.SheetNames[0]], { header: 1, defval: "" });
  expect(transferRows).toContainEqual(expect.arrayContaining(["4111009", "22472", "4111009", expect.stringContaining("Green Peas"), 14.18]));
  const bomDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /^prep list$/i }).click();
  const prepListFile = await bomDownload;
  expect(prepListFile.suggestedFilename()).toMatch(/Cricket Commissary Prep List.*\.xlsx/);
  const bomWorkbook = XLSX.readFile(await prepListFile.path(), { cellStyles: true });
  expect(bomWorkbook.SheetNames).toEqual(["Friday Prep List", "Monday Prep List", "Wednesday Prep List", "Friday Delivery Map", "Monday Delivery Map", "Wednesday Delivery Map", "Power Automate"]);
  expect(bomWorkbook.Sheets["Monday Prep List"].A1.s.fgColor.rgb).toBe("17365D");
  const prepRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Monday Prep List"], { header: 1, defval: "" });
  expect(prepRows[2].slice(0, 3)).toEqual(["Ingredient / item", "Total quantity", "Order unit"]);
  expect(bomWorkbook.Workbook.Sheets.find((sheet) => sheet.name === "Power Automate")?.Hidden).toBe(1);
  expect(bomWorkbook.Sheets["Monday Delivery Map"].A4.s.fgColor.rgb).toBe("D9EAF7");
  const fridayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Friday Delivery Map"], { header: 1, defval: "" });
  const mondayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Monday Delivery Map"], { header: 1, defval: "" });
  const wednesdayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Wednesday Delivery Map"], { header: 1, defval: "" });
  expect(fridayRows).toContainEqual(expect.arrayContaining(["Cricket", "Salad Bar", "English Cucumbers, Fresh, Sliced, Half", cucumber.mrn, 1]));
  expect(mondayRows).toContainEqual(expect.arrayContaining(["Cricket", "Salad Bar", "English Cucumbers, Fresh, Sliced, Half", cucumber.mrn, 2]));
  expect(mondayRows).toContainEqual(expect.arrayContaining(["Cricket", "Salad Bar", "Green Peas", "62341", 1.5]));
  expect(wednesdayRows).toContainEqual(expect.arrayContaining(["Cricket", "Salad Bar", "English Cucumbers, Fresh, Sliced, Half", cucumber.mrn, 1]));
  expect(writes).toHaveLength(1);
  expect(writes[0].context.tool).toBe("commissaryOrders");
  expect(writes[0].records[0].orderUnitVersion).toBe(2);
  expect(writes[0].records[0].commissaryMetadataVersion).toBe(7);
  expect(writes[0].records[0].quantities[cucumber.id]).toEqual({ friday: 1, monday: 2, wednesday: 1 });
  const packetDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /packout packet/i }).click();
  const packetFile = await packetDownload;
  expect(packetFile.suggestedFilename()).toBe(`Commissary Packout Packet ${firstOpenWeek()}.pdf`);
  expect(new TextDecoder().decode((await readFile(await packetFile.path())).subarray(0, 8))).toBe("%PDF-1.4");
  expect(writes).toHaveLength(2);
  expect(writes[1].records[0]["Record Type"]).toBe("Commissary Packout Packet");
  expect(writes[1].records[0].packet.pages.length).toBeGreaterThan(0);
  expect(writes[1].records[0].packet.pages.every(({ cafe }) => cafe === "Cricket")).toBe(true);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Roxanne receives submitted Dawson Pop-Up and Salad items and exports separate source sheets", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-24T20:00:00Z") });
  const parent = "rotation|2026-11-30|North|Dawson";
  const breakfastItem = BREAKFAST_ORDERING_PROGRAM.items.find(({ mrn }) => mrn === "17350.24");
  const savedRoxanneOrder = buildOrderRecord({
    cafe: "Roxanne Coffee",
    weekStart: "2026-11-30",
    quantities: emptyQuantities("2026-11-30"),
    breakfast: {
      selections: [breakfastItem.id],
      quantities: { [breakfastItem.id]: { friday: 3, monday: 0, wednesday: 0 } },
      items: { [breakfastItem.id]: { ...breakfastItem, item: breakfastItem.name, itemWasteCost: 2.75 } },
    },
    now: new Date("2026-11-19T18:00:00.000Z"),
  });
  const rotationRecords = [
    { "Record ID": parent, "Record Type": "Rotation Header", Status: "Submitted", "Submitted At": "2026-11-24T18:00:00.000Z", "Roxanne Pop-Up Global": true, "Roxanne Pop-Up Carvery": true },
    { "Record ID": `${parent}|global|entree|1`, "Parent Record ID": parent, "Record Type": "Global Selection", Status: "Submitted", "Station Key": "global", "Selection Type": "Entrée", "Menu / Concept": "AMZ: Porto", "Menu Item / Selection": "Piri Piri Chicken", MRN: "121026", Portion: "1 piece", "True Cost": 3.25 },
    { "Record ID": `${parent}|carvery|protein|1`, "Parent Record ID": parent, "Record Type": "Station Selection", Status: "Submitted", "Station Key": "carvery", "Selection Type": "Rotating Protein", "Menu / Concept": "AMZ: Carvery", "Menu Item / Selection": "Herb Roasted Turkey", MRN: "9631", Portion: "5 oz portion", "True Cost": 3.8 },
    { "Record ID": `${parent}|salad|lto|1`, "Parent Record ID": parent, "Record Type": "Station Selection", Status: "Submitted", "Station Key": "salad", "Selection Type": "LTO", "Menu / Concept": "AMZ: Cafe Express Salad", "Menu Item / Selection": "Greek Salad", MRN: "144662", Portion: "1 salad", "True Cost": 4.1 },
  ];
  const writes = await mockOrders(page, [savedRoxanneOrder], rotationRecords);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Roxanne Coffee");
  await page.getByLabel("Service week").selectOption("2026-11-30");
  await expect(page.getByTestId("roxanne-dawson-order")).toContainText("Piri Piri Chicken");
  await expect(page.getByTestId("roxanne-dawson-order")).toContainText("Herb Roasted Turkey");
  await expect(page.getByTestId("roxanne-dawson-order")).toContainText("Greek Salad");
  await expect(page.getByTestId("roxanne-dawson-order").locator("h4")).toHaveText(["Pop-Up", "Composed Salad"]);
  await expect(page.getByLabel(/Piri Piri Chicken Friday .* Roxanne quantity/)).toHaveCount(0);
  await page.getByLabel(/Piri Piri Chicken Monday .* Roxanne quantity/).fill("4");
  await page.getByLabel(/Greek Salad Monday .* Roxanne quantity/).fill("2");
  await expect.poll(() => writes.filter((write) => write.records?.[0]?.["Record Type"] === "Commissary Order").length).toBe(1);
  const saved = writes.find((write) => write.records?.[0]?.["Record Type"] === "Commissary Order").records[0];
  expect(Object.values(saved.roxanneDawson.quantities).some(({ monday }) => monday === 4)).toBe(true);
  expect(Object.values(saved.roxanneDawson.quantities).some(({ monday }) => monday === 2)).toBe(true);
  expect(Object.values(saved.roxanneDawson.quantities).every(({ friday }) => !friday)).toBe(true);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /generate transfers/i }).click();
  const download = await downloadPromise;
  const workbook = XLSX.read(await readFile(await download.path()), { type: "buffer", cellStyles: true });
  expect(workbook.SheetNames).toEqual(["SEA20 Cricket", "SEA27 Dawson"]);
  await expect(page.getByRole("button", { name: "Prep List View" })).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Roxanne shows source-present soups, disables uncosted ordering, and keeps the current Flatbread cycle", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-24T20:00:00Z") });
  const parent = "rotation|2026-11-30|North|Cricket";
  const rotationRecords = [
    { "Record ID": parent, "Record Type": "Rotation Header", Status: "Submitted", "Submitted At": "2026-11-24T19:00:00.000Z" },
    { "Record ID": `${parent}|soup|1`, "Parent Record ID": parent, "Record Type": "Station Selection", Status: "Submitted", "Station Key": "soup", "Slot Number": 1, "Menu Item / Selection": "Chicken Noodle Soup", MRN: "1001", Portion: "12 fl oz", "True Cost": 2.25 },
    { "Record ID": `${parent}|soup|2`, "Parent Record ID": parent, "Record Type": "Station Selection", Status: "Submitted", "Station Key": "soup", "Slot Number": 2, "Menu Item / Selection": "Tomato Basil Soup", MRN: "1002", Portion: "12 oz", "True Cost": 1.75 },
    { "Record ID": `${parent}|soup|3`, "Parent Record ID": parent, "Record Type": "Station Selection", Status: "Submitted", "Station Key": "soup", "Slot Number": 3, "Menu Item / Selection": "Uncosted Soup", MRN: "62071.1", Portion: "12 oz", "True Cost": 0 },
  ];
  const writes = await mockOrders(page, [], rotationRecords);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Roxanne Coffee");
  await page.getByLabel("Service week").selectOption("2026-11-30");
  const soups = page.getByTestId("roxanne-soup-order");
  const flatbreads = page.getByTestId("roxanne-flatbread-order");
  await expect(soups).toContainText("Chicken Noodle Soup");
  await expect(soups).toContainText("Tomato Basil Soup");
  await expect(soups).toContainText("Uncosted Soup");
  await expect(soups).toContainText("Cost unavailable");
  await expect(flatbreads.getByText("Chicken Pesto Flatbread", { exact: true })).toBeVisible();
  await expect(flatbreads.getByText("Quattro Formaggi Flatbread", { exact: true })).toBeVisible();
  await page.getByLabel("Monday Soup 1 bain quantity").fill("8");
  await page.getByLabel(/Chicken Pesto Flatbread Monday .* quantity/).fill("5");
  await expect.poll(() => writes.length).toBeGreaterThan(0);
  const saved = writes.at(-1).records[0];
  expect(Object.values(saved.roxanneSoup.items).map(({ mrn }) => mrn).sort()).toEqual(["1001", "1002", "62071.1"]);
  const uncostedId = Object.entries(saved.roxanneSoup.items).find(([, item]) => item.mrn === "62071.1")?.[0];
  expect(uncostedId).toBeTruthy();
  expect(Object.values(saved.roxanneSoup.quantities[uncostedId]).every((quantity) => quantity === 0)).toBe(true);
  expect(saved.roxanneFlatbreads.cycleWeek).toBe(1);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("an edited order keeps autosaving after the operator navigates to the live prep board", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const writes = await mockOrders(page, [buildCommissaryMetadataRecord()]);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Cricket");
  await page.getByLabel("Service week").selectOption(COMMISSARY_PREP_BOARD_PILOT_WEEK);
  await page.getByLabel(/^Friday \d+\/\d+ English Cucumbers, Fresh, Sliced, Half quantity$/).fill("3");
  await page.getByRole("button", { name: "Prep Board" }).click();
  await expect.poll(() => writes.filter((write) => write.records?.[0]?.["Record Type"] === "Commissary Order").length).toBe(1);
  const orderWrite = writes.find((write) => write.records?.[0]?.["Record Type"] === "Commissary Order");
  const cucumber = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "English Cucumbers, Fresh, Sliced, Half");
  expect(orderWrite.records[0].weekStart).toBe(COMMISSARY_PREP_BOARD_PILOT_WEEK);
  expect(orderWrite.records[0].quantities[cucumber.id].friday).toBe(3);
  await expect(page.getByTestId("tabbed-prep-board").getByText("English Cucumbers, Fresh, Sliced, Half", { exact: true })).toBeVisible();
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Grill LTO starts Cycle Week 1 on November 16 with Set A and Set B whole-sandwich orders", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-10T20:00:00Z") });
  const writes = await mockOrders(page);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Cricket");
  await page.getByLabel("Service week").selectOption("2026-11-16");
  await expect(page.getByText("Green Peas", { exact: true })).toBeVisible();
  await expect(page.getByText("Frozen Peas", { exact: true })).toHaveCount(0);

  const global = page.getByTestId("commissary-global-order");
  await expect(global.getByText(/Cycle Week 1/i)).toBeVisible();
  await expect(page.getByLabel("Global menu").locator("option")).toContainText(["Select menu", "Porto", "Taco Total"]);
  const globalOption = GLOBAL_ORDERING_PROGRAM.cycleWeeks[0].menus[0].items[0];
  const globalSauce = GLOBAL_ORDERING_PROGRAM.cycleWeeks[0].menus[0].items.find(({ mrn }) => mrn === "120722");
  await page.getByLabel("Global menu").selectOption(globalOption.menu);
  await page.getByLabel("Entrees 1").selectOption(globalOption.id);
  await page.getByLabel(`${globalOption.name} Friday 11/13 portion quantity`).fill("4");
  await expect(global.getByText("Optional sauces", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Optional sauces 1").locator("option")).toContainText(["Piri Piri Dipping Sauce", "Piri-naise Dipping Sauce"]);
  await page.getByLabel("Optional sauces 1").selectOption(globalSauce.id);
  await page.getByLabel(`${globalSauce.name} Friday 11/13 portion quantity`).fill("4");

  const grill = page.getByTestId("commissary-grill-order");
  await expect(grill.getByText(/Cycle Week 1/i)).toBeVisible();
  await expect(grill).toHaveAttribute("data-density", "compact");
  await expect(page.getByLabel("Your cafe")).toContainText("Cricket 22472");
  await expect(page.getByLabel("Grill Set A sandwich").locator("option")).toContainText(["Select sandwich", "ATX Burger", "Mushroom Swiss Burger"]);
  await expect(page.getByLabel("Grill Set B sandwich").locator("option")).toContainText(["Select sandwich", "Diablo Burger", "Southwest Burger"]);
  await page.getByLabel("Grill Set A sandwich").selectOption("77139.72");
  await page.getByLabel("Grill Set B sandwich").selectOption("77139.68");
  const grillLto = page.getByTestId("commissary-grill-lto");
  const [grillLtoBox, setABox, setBBox] = await Promise.all([
    grillLto.boundingBox(),
    page.getByLabel("Grill Set A sandwich").locator("xpath=ancestor::section[1]").boundingBox(),
    page.getByLabel("Grill Set B sandwich").locator("xpath=ancestor::section[1]").boundingBox(),
  ]);
  expect(grillLtoBox?.height, "Grill LTO ordering should remain compact while retaining both sets").toBeLessThan(420);
  expect(Math.abs((setABox?.y ?? 0) - (setBBox?.y ?? 0)), "Set A and Set B should share the desktop row").toBeLessThan(3);
  await expect(grill).toContainText("Item + Waste");
  await expect(grill).toContainText("Friday 11/13");
  await expect(grill).toContainText("Monday 11/16");
  await expect(grill).toContainText("Wednesday 11/18");
  await page.getByLabel("Set A Friday 11/13 sandwich quantity").fill("10");
  await page.getByLabel("Set A Monday 11/16 sandwich quantity").fill("20");
  await page.getByLabel("Set B Wednesday 11/18 sandwich quantity").fill("15");
  const core = page.getByTestId("commissary-grill-core");
  await expect(core).toContainText("Optional core sandwiches and sides");
  await expect(core.locator("xpath=ancestor::*[@data-testid='commissary-grill-order']")).toHaveCount(1);
  expect(await grill.evaluate((node) => {
    const lto = node.querySelector('[data-testid="commissary-grill-lto"]');
    const coreSection = node.querySelector('[data-testid="commissary-grill-core"]');
    return Boolean(lto && coreSection && (lto.compareDocumentPosition(coreSection) & Node.DOCUMENT_POSITION_FOLLOWING));
  })).toBe(true);
  await page.getByLabel("Smashburger Monday 11/16 quantity").fill("6");
  await page.getByLabel("Santa Fe Black Bean Burger Monday 11/16 quantity").fill("6");
  await page.getByLabel("Grilled Chicken Sandwich Monday 11/16 quantity").fill("6");
  await page.getByLabel("Grilled Vegetables Monday 11/16 quantity").fill("6");
  const deli = page.getByTestId("commissary-deli-order");
  await expect(deli.getByText(/Cycle Week 1/i)).toBeVisible();
  await expect(deli.locator("section")).toHaveCount(5);
  await expect(deli).toContainText("Mediterranean Turkey Wrap");
  await expect(deli).not.toContainText("Shrimp Avocado Corn Wrap");
  await page.getByLabel("Mediterranean Turkey Wrap Monday 11/16 sandwich quantity").fill("12");
  await page.clock.runFor(600);
  await expect(page.getByText("Saved automatically", { exact: true })).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0].records[0].grill.cycleWeek).toBe(1);
  expect(writes[0].records[0].grill.selections).toEqual({ A: "77139.72", B: "77139.68" });
  expect(writes[0].records[0].grill.quantities.A).toEqual({ friday: 10, monday: 20, wednesday: 0 });
  expect(writes[0].records[0].grill.quantities.B).toEqual({ friday: 0, monday: 0, wednesday: 15 });
  expect(writes[0].records[0].grill.core.quantities["147955.17"]).toEqual({ friday: 0, monday: 6, wednesday: 0 });
  expect(writes[0].records[0].deli.cycleWeek).toBe(1);
  expect(writes[0].records[0].deli.quantities["190990"]).toEqual({ friday: 0, monday: 12, wednesday: 0 });
  expect(writes[0].records[0].global.cycleWeek).toBe(1);
  expect(writes[0].records[0].global.menu).toBe(globalOption.menu);
  expect(writes[0].records[0].global.selections.entrees[0]).toBe(globalOption.id);
  expect(writes[0].records[0].global.quantities[globalOption.id]).toEqual({ friday: 4, monday: 0, wednesday: 0 });
  expect(writes[0].records[0].global.selections.sauces[0]).toBe(globalSauce.id);
  expect(writes[0].records[0].global.quantities[globalSauce.id]).toEqual({ friday: 4, monday: 0, wednesday: 0 });

  const prepDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /^prep list$/i }).click();
  const workbook = XLSX.readFile(await (await prepDownload).path());
  const prepRows = XLSX.utils.sheet_to_json(workbook.Sheets["Monday Prep List"], { header: 1, defval: "" });
  const fridayPrepRows = XLSX.utils.sheet_to_json(workbook.Sheets["Friday Prep List"], { header: 1, defval: "" });
  expect(prepRows.some((row) => row[0] === "AMZ: Smashburger Patty")).toBe(false);
  expect(prepRows.some((row) => /black bean burger|grilled chicken breast|salt,?\s*kosher/i.test(String(row[0])))).toBe(false);
  expect(prepRows).toContainEqual(expect.arrayContaining(["Avocado, Hand Scooped, Wholly Avocado, Fresh", 0.5, "gallon"]));
  expect(prepRows).toContainEqual(expect.arrayContaining(["EUR: Pickled Red Onions", 0.5, "gallon"]));
  expect(prepRows).toContainEqual(expect.arrayContaining(["EURNA: Pickled Jalapenos", 0.5, "gallon"]));
  expect(prepRows).toContainEqual(expect.arrayContaining(["Turkey, Breast, Deli, Smoked, Butterball", 3, "pound"]));
  expect(prepRows[2]).toEqual(["Ingredient / item", "Total quantity", "Order unit", "Production section", "Finished dish"]);
  expect(prepRows.some((row) => row.includes("Production family"))).toBe(false);
  expect(fridayPrepRows.some((row) => row[0] === "Piri Piri Marinade/Base" && row[4] === "Piri Piri Chicken")).toBe(true);
  const mondayRows = XLSX.utils.sheet_to_json(workbook.Sheets["Monday Delivery Map"], { header: 1, defval: "" });
  expect(mondayRows.some((row) => row[2] === "AMZ: Smashburger Patty")).toBe(false);
  const chowChowRows = mondayRows.filter((row) => row[0] === "Cricket" && row[1] === "Grill" && String(row[3]) === "168231");
  expect(chowChowRows).toHaveLength(1);
  expect(chowChowRows[0]).toEqual(expect.arrayContaining(["Cricket", "Grill", "EUR: Upcycled Chow Chow Aioli", "168231"]));
  expect(chowChowRows[0][4]).toBeGreaterThan(0);
  expect(chowChowRows[0][5]).toBe("gallon");
  expect(chowChowRows[0][6]).toContain("ATX Burger");
  expect(chowChowRows[0][6]).toContain("Smashburger");
  expect(mondayRows).toContainEqual(expect.arrayContaining(["Cricket", "Deli", "Mediterranean Turkey Wrap", "190990", 12, "sandwich", "Mediterranean Turkey Wrap"]));
  expect(mondayRows.some((row) => row[6] === "Mediterranean Turkey Wrap" && row[2] !== "Mediterranean Turkey Wrap")).toBe(false);
  expect(mondayRows.some((row) => /\bbun\b/i.test(String(row[2])))).toBe(false);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Global Taco prep displays approved cut produce as rounded volume", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-10T20:00:00Z") });
  await mockOrders(page);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Cricket");
  await page.getByLabel("Service week").selectOption("2026-11-16");
  const tacoMenu = GLOBAL_ORDERING_PROGRAM.cycleWeeks[0].menus.find(({ menu }) => menu === "AMZ: Taco Total");
  const pico = tacoMenu.items.find(({ name }) => name === "Pico De Gallo");
  await page.getByLabel("Global menu").selectOption(tacoMenu.menu);
  await page.getByLabel("Optional sauces 1").selectOption(pico.id);
  await page.getByLabel("Pico De Gallo Friday 11/13 portion quantity").fill("24");
  await page.clock.runFor(600);
  await expect(page.getByText("Saved automatically", { exact: true })).toBeVisible();
  const prepDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /^prep list$/i }).click();
  const workbook = XLSX.readFile(await (await prepDownload).path());
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Friday Prep List"], { header: 1, defval: "" });
  expect(rows).toContainEqual(expect.arrayContaining(["Onions, Yellow, Fresh, Chopped, Fine", expect.any(Number), "gallon"]));
  expect(rows).toContainEqual(expect.arrayContaining(["Peppers, Chili, Jalapeno, Fresh, Chopped", expect.any(Number), "gallon"]));
  expect(rows).toContainEqual(expect.arrayContaining(["Tomatoes, Roma, Fresh, Small Diced, 1/4\"", expect.any(Number), "gallon"]));
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("each cafe sees only its assigned commissary stations", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await mockOrders(page);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Service week").selectOption("2026-11-16");

  await page.getByLabel("Your cafe").selectOption("Grace");
  await expect(page.getByTestId("commissary-global-order")).toBeVisible();
  await expect(page.getByTestId("commissary-grill-order")).toBeVisible();
  await expect(page.getByTestId("commissary-deli-order")).toBeVisible();
  await expect(page.getByText("Salad bar", { exact: true })).toBeHidden();

  await page.getByLabel("Your cafe").selectOption("Dynamo");
  await expect(page.getByTestId("commissary-global-order")).toHaveCount(0);
  await expect(page.getByTestId("commissary-deli-order")).toBeVisible();
  await expect(page.getByTestId("commissary-grill-order")).toHaveCount(0);
  await expect(page.getByText("Salad bar", { exact: true })).toBeHidden();

  await page.getByLabel("Your cafe").selectOption("Bingo");
  await expect(page.getByTestId("commissary-global-order")).toBeVisible();
  await expect(page.getByText("Salad bar", { exact: true })).toBeVisible();
  await expect(page.getByTestId("commissary-grill-order")).toBeVisible();
  await expect(page.getByTestId("commissary-deli-order")).toHaveCount(0);

  await page.getByLabel("Your cafe").selectOption("Roxanne Coffee");
  await expect(page.getByTestId("commissary-breakfast-order")).toBeVisible();
  await expect(page.getByTestId("commissary-deli-order")).toBeVisible();
  await expect(page.getByTestId("commissary-global-order")).toHaveCount(0);
  await expect(page.getByTestId("commissary-grill-order")).toHaveCount(0);
  await expect(page.getByText("Salad bar", { exact: true })).toBeHidden();

  await page.getByLabel("Your cafe").selectOption("Doppler");
  await expect(page.getByTestId("commissary-breakfast-order")).toHaveCount(0);
  await expect(page.getByTestId("commissary-global-order")).toBeVisible();
  await expect(page.getByTestId("commissary-deli-order")).toBeVisible();
  await expect(page.getByTestId("commissary-grill-order")).toHaveCount(0);
  await expect(page.getByText("Salad bar", { exact: true })).toBeVisible();

  await page.getByLabel("Your cafe").selectOption("Atlas");
  await expect(page.getByTestId("commissary-grill-order")).toBeVisible();
  await expect(page.getByTestId("commissary-grill-core")).toBeVisible();
  await expect(page.getByTestId("commissary-global-order")).toHaveCount(0);
  await expect(page.getByText("Salad bar", { exact: true })).toBeHidden();
  await page.getByLabel("Service week").selectOption("2026-11-09");
  await expect(page.getByTestId("commissary-grill-core")).toBeVisible();
  await expect(page.getByTestId("commissary-grill-order")).toBeVisible();
  await expect(page.getByTestId("commissary-grill-lto")).toHaveCount(0);

  await page.getByLabel("Service week").selectOption("2026-11-16");
  await page.getByLabel("Your cafe").selectOption("Frontier");
  await expect(page.getByTestId("commissary-global-order")).toBeVisible();
  await expect(page.getByText("Salad bar", { exact: true })).toBeVisible();
  await expect(page.getByTestId("commissary-grill-order")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Gemini, Eclipse and selectable sites use the seven-day continuous 2,2,2 Global rotation", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-10T20:00:00Z") });
  const writes = await mockOrders(page);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Service week").selectOption("2026-12-07");
  await page.getByLabel("Your cafe").selectOption("Gemini");
  await expect(page.getByTestId("commissary-daily-global-order")).toBeVisible();
  await expect(page.getByTestId("commissary-global-order")).toHaveCount(0);
  await expect(page.getByTestId("commissary-daily-global-order").getByText("Comes with:")).toHaveCount(14);
  await expect(page.getByLabel("Monday lunch animal plate quantity").locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]")).toContainText("Jasmine Rice");
  await expect(page.getByLabel("Monday lunch animal plate quantity").locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]")).toContainText("Teriyaki Sauce");
  const weeklyOrderBox = await page.getByRole("heading", { name: "Week 12/7–12/11 order" }).boundingBox();
  const dailyGlobalBox = await page.getByTestId("commissary-daily-global-order").boundingBox();
  expect(weeklyOrderBox.y).toBeLessThan(dailyGlobalBox.y);
  await expect(page.getByText("House of Teriyaki", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Porto", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Cypress", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Bibimbowl", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Monday lunch animal plate quantity").fill("12");
  await page.getByLabel("Monday dinner animal plate quantity").fill("7");
  await expect.poll(() => writes.length).toBeGreaterThan(0);
  const record = writes.at(-1).records[0];
  expect(record.dailyGlobal.cycleWeek).toBe(1);
  expect(record.dailyGlobal.quantities.monday).toEqual({ lunch: { animal: 12, vegetarian: 0 }, dinner: { animal: 7, vegetarian: 0 } });
  expect(record.global.menu).toBe("");
  await page.getByLabel("Your cafe").selectOption("Eclipse");
  await expect(page.getByTestId("commissary-daily-global-order")).toBeVisible();
  await expect(page.getByTestId("commissary-deli-order")).toBeVisible();
  await expect(page.getByText("House of Teriyaki", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Porto", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Your cafe").selectOption("Sonic");
  await expect(page.getByTestId("commissary-daily-global-order")).toBeVisible();
  await expect(page.getByTestId("commissary-global-order")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Salad whole-unit controls and the retired Ham Banh Mi roster are enforced", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-10T20:00:00Z") });
  const priorSpringMix = COMMISSARY_PREVIOUS_ORDER_ITEMS.find((row) => row.name === "Spring Mix");
  const standingQuantities = emptyQuantities("2026-12-28");
  standingQuantities[priorSpringMix.id] = { friday: 1, monday: 0, wednesday: 0 };
  const standingRecord = buildOrderRecord({ cafe: "Cricket", weekStart: "2026-12-28", quantities: standingQuantities, now: new Date("2026-12-22T12:00:00Z") });
  await mockOrders(page, [standingRecord]);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Cricket");
  await page.getByLabel("Service week").selectOption("2026-11-16");
  const ranch = page.getByLabel("Monday 11/16 Ranch Dressing quantity");
  await ranch.fill("0.5");
  await expect(ranch).toHaveValue("0");
  const springMix = page.getByLabel("Monday 11/16 Spring Mix quantity");
  await springMix.fill("0.5");
  await expect(springMix).toHaveValue("0");
  const cheddar = page.getByLabel("Monday 11/16 Shredded Cheddar Cheese quantity");
  await cheddar.fill("0.5");
  await expect(cheddar).toHaveValue("0");
  await page.getByLabel("Service week").selectOption("2026-12-28");
  await expect(page.getByText("Saved standing unit", { exact: true })).toBeVisible();
  await expect(page.getByText("Spring Mix", { exact: true })).toHaveCount(2);
  await page.getByLabel("Service week").selectOption("2026-11-30");
  await expect(page.getByTestId("commissary-deli-order")).not.toContainText("Banh Mi Ham Sandwich");
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Zoka Coffee orders the Supabase-backed croissant through Cricket Breakfast and Deli routing", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-10T20:00:00Z") });
  const writes = await mockOrders(page);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Zoka Coffee");
  await page.getByLabel("Service week").selectOption("2026-11-16");
  const option = BREAKFAST_ORDERING_PROGRAM.items.find(({ mrn }) => mrn === "17350.24");
  await expect(page.getByTestId("commissary-breakfast-order")).toBeVisible();
  await expect(page.getByTestId("commissary-deli-order")).toBeVisible();
  await expect(page.getByTestId("commissary-global-order")).toHaveCount(0);
  await expect(page.getByTestId("commissary-grill-order")).toHaveCount(0);
  await page.getByLabel("Add breakfast item").selectOption(option.id);
  const breakfast = page.getByTestId("commissary-breakfast-order");
  await expect(breakfast).toContainText(option.name);
  await expect(breakfast).toContainText("Item + Waste");
  await page.getByLabel(`${option.name} Monday 11/16 breakfast quantity`).fill("12");
  await page.clock.runFor(600);
  await expect(page.getByText("Saved automatically", { exact: true })).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0].records[0].cafe).toBe("Zoka Coffee");
  expect(writes[0].records[0].breakfast.selections).toEqual([option.id]);
  expect(writes[0].records[0].breakfast.quantities[option.id]).toEqual({ friday: 0, monday: 12, wednesday: 0 });
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("locked Dawson recalls its ATX Burger order read-only and exposes only its exact-template S4 export", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-12T20:00:00Z") });
  const lockedWeek = "2026-11-16";
  const quantities = emptyQuantities(lockedWeek);
  quantities[COMMISSARY_ORDER_ITEMS.find((row) => row.name === "English Cucumbers, Fresh, Sliced, Half").id] = { friday: 1, monday: 2, wednesday: 1 };
  const lockedGrill = emptyGrillOrder(lockedWeek);
  lockedGrill.selections.A = "77139.72";
  lockedGrill.items.A = { mrn: "77139.72", item: "ATX Burger", portion: "1 each", itemWasteCost: 3.3634 };
  lockedGrill.quantities.A = { friday: 10, monday: 14, wednesday: 8 };
  const record = buildOrderRecord({ cafe: "Dawson", weekStart: lockedWeek, quantities, grill: lockedGrill, now: new Date(`${lockedWeek}T12:00:00Z`) });
  await mockOrders(page, [record]);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Dawson");
  await page.getByLabel("Service week").selectOption(lockedWeek);
  await expect(page.getByText("Ordering closed")).toBeVisible();
  await expect(page.getByText(/please contact commissary executive chef to adjust pars/i)).toBeVisible();
  await expect(page.getByLabel(/^Monday \d+\/\d+ English Cucumbers, Fresh, Sliced, Half quantity$/)).toBeDisabled();
  await expect(page.getByLabel(/^Friday \d+\/\d+ English Cucumbers, Fresh, Sliced, Half quantity$/)).toBeDisabled();
  await expect(page.getByLabel("Grill Set A sandwich")).toHaveValue("77139.72");
  await expect(page.getByLabel(/^Set A Friday \d+\/\d+ sandwich quantity$/)).toHaveValue("10");
  await expect(page.getByLabel(/^Set A Monday \d+\/\d+ sandwich quantity$/)).toHaveValue("14");
  await expect(page.getByLabel(/^Set A Wednesday \d+\/\d+ sandwich quantity$/)).toHaveValue("8");
  await expect(page.getByRole("button", { name: /download combined prep list/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Prep List View" })).toHaveCount(0);
  const transferDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /download dawson s4 transfer/i }).click();
  expect((await transferDownload).suggestedFilename()).toMatch(/Commissary Order Dawson.*Expense Transfer\.xlsx/);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Prep List View is vertical, touch friendly, translated, and saves hold-to-check progress", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-12T20:00:00Z") });
  const lockedWeek = "2026-11-16";
  const cucumber = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "English Cucumbers, Fresh, Sliced, Half");
  const quantities = emptyQuantities(lockedWeek);
  quantities[cucumber.id] = { friday: 2, monday: 2, wednesday: 1 };
  quantities[COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Green Peas").id] = { friday: 1.25, monday: 1.25, wednesday: 0 };
  const prepGrill = emptyGrillOrder(lockedWeek);
  prepGrill.selections.A = "77139.72";
  prepGrill.items.A = { mrn: "77139.72", item: "ATX Burger", portion: "1 each", itemWasteCost: 3.3634 };
  prepGrill.quantities.A = { friday: 4, monday: 0, wednesday: 0 };
  const nessieDeli = emptyDeliOrder(lockedWeek);
  nessieDeli.items["190990"] = { mrn: "190990", item: "Mediterranean Turkey Wrap", portion: "1 wrap", itemWasteCost: 3.25 };
  nessieDeli.quantities["190990"] = { friday: 5, monday: 0, wednesday: 0 };
  const record = buildOrderRecord({ cafe: "Nessie", weekStart: lockedWeek, quantities, grill: prepGrill, deli: nessieDeli, now: new Date(`${lockedWeek}T12:00:00Z`) });
  const dawsonDeli = emptyDeliOrder(lockedWeek);
  dawsonDeli.items["190990"] = { mrn: "190990", item: "Mediterranean Turkey Wrap", portion: "1 wrap", itemWasteCost: 3.25 };
  dawsonDeli.quantities["190990"] = { friday: 5, monday: 0, wednesday: 0 };
  const dawsonRecord = buildOrderRecord({ cafe: "Dawson", weekStart: lockedWeek, quantities: emptyQuantities(lockedWeek), deli: dawsonDeli, now: new Date(`${lockedWeek}T12:00:00Z`) });
  const bingoQuantities = emptyQuantities(lockedWeek);
  bingoQuantities[cucumber.id] = { friday: 3, monday: 0, wednesday: 0 };
  const bingoRecord = buildOrderRecord({ cafe: "Bingo", weekStart: lockedWeek, quantities: bingoQuantities, now: new Date(`${lockedWeek}T12:00:00Z`) });
  const writes = await mockOrders(page, [record, dawsonRecord, bingoRecord]);
  await page.setViewportSize({ width: 820, height: 1180 });
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await expect(page.getByRole("button", { name: "Prep List View" })).toHaveCount(0);
  await page.getByLabel("Your cafe").selectOption("Cricket");
  await page.getByLabel("Service week").selectOption(lockedWeek);
  await page.getByRole("button", { name: "Prep List View" }).click();

  const prepView = page.getByTestId("commissary-prep-list-view");
  await expect(prepView).toBeVisible();
  await expect(prepView.getByText("Select your commissary hub", { exact: true })).toBeVisible();
  await expect(prepView.getByRole("button", { name: "Cricket", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(prepView.getByRole("button", { name: "Sonic", exact: true })).toHaveCount(0);
  await expect(prepView.getByRole("button", { name: "Blueshift", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Your cafe")).toHaveCount(0);
  const stationSelector = prepView.getByRole("navigation", { name: "Select prep station" });
  await expect(stationSelector.getByRole("button", { name: "All stations" })).toHaveAttribute("aria-pressed", "true");
  const finishedCounts = prepView.getByTestId("finished-prep-counts");
  await expect(finishedCounts).toBeVisible();
  await expect(finishedCounts.getByText("Mediterranean Turkey Wrap", { exact: true })).toBeVisible();
  await expect(finishedCounts.getByTestId("finished-prep-quantity-prep-finished|deli|190990")).toContainText("10 sandwich");
  await expect(finishedCounts.getByTestId("finished-prep-cafes-prep-finished|deli|190990")).toContainText("Nessie 5");
  await expect(finishedCounts.getByTestId("finished-prep-cafes-prep-finished|deli|190990")).toContainText("Dawson 5");
  const finishedCheckbox = finishedCounts.getByRole("button", { name: /touch and hold to change.*mediterranean turkey wrap/i });
  await finishedCheckbox.click();
  await expect(finishedCheckbox).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].records[0].completed.friday).toContain("prep-finished|deli|190990");
  await stationSelector.getByRole("button", { name: "Grill", exact: true }).click();
  await expect(prepView.getByText("English Cucumbers, Fresh, Sliced, Half", { exact: true })).toHaveCount(0);
  await expect(prepView.getByText(/Upcycled Chow Chow Aioli/i)).toBeVisible();
  await stationSelector.getByRole("button", { name: "Salad Bar", exact: true }).click();
  await expect(prepView.getByText("English Cucumbers, Fresh, Sliced, Half", { exact: true })).toBeVisible();
  const quantityBlock = prepView.getByTestId(`prep-quantity-${cucumber.id}`);
  const cafeBreakdown = prepView.getByTestId(`prep-cafes-${cucumber.id}`);
  await expect(quantityBlock).toContainText("2 gal");
  await expect(cafeBreakdown).toHaveText("Nessie 2");
  const quantityBox = await quantityBlock.boundingBox();
  const cafeBox = await cafeBreakdown.boundingBox();
  expect(cafeBox.y).toBeGreaterThan(quantityBox.y);
  const overflow = await prepView.evaluate((node) => node.scrollWidth > node.clientWidth + 1);
  expect(overflow).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileItemBox = await prepView.getByText("English Cucumbers, Fresh, Sliced, Half", { exact: true }).boundingBox();
  const mobileQuantityBox = await quantityBlock.boundingBox();
  const mobilePrepBox = await prepView.boundingBox();
  expect(mobileQuantityBox.y).toBeGreaterThan(mobileItemBox.y);
  expect(mobileItemBox.x + mobileItemBox.width).toBeLessThanOrEqual(mobilePrepBox.x + mobilePrepBox.width + 1);
  expect(mobileQuantityBox.x + mobileQuantityBox.width).toBeLessThanOrEqual(mobilePrepBox.x + mobilePrepBox.width + 1);
  expect(await prepView.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(false);

  await page.getByRole("switch", { name: "Spanish translation" }).click();
  await expect(prepView.getByText(/^Viernes \d+\/\d+$/)).toBeVisible();
  await expect(prepView.getByText("Lista de preparación", { exact: true })).toBeVisible();
  await expect(prepView.getByText("Pepinos ingleses frescos, cortados por la mitad", { exact: true })).toBeVisible();
  const checkbox = page.getByRole("button", { name: /mantenga presionado.*pepinos ingleses frescos, cortados por la mitad/i });
  await checkbox.dispatchEvent("pointerdown", { pointerType: "touch", button: 0 });
  await page.waitForTimeout(650);
  await checkbox.dispatchEvent("pointerup", { pointerType: "touch", button: 0 });
  await expect(checkbox).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => writes.length).toBe(2);
  expect(writes[1].context.tool).toBe("commissaryOrders");
  expect(writes[1].records[0]["Record Type"]).toBe("Commissary Prep Progress");
  expect(writes[1].records[0].hub).toBe("Cricket");
  expect(writes[1].records[0].completed.friday).toContain(cucumber.id);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("January 4 opens the live tabbed Production, Assembly, and Pack Out board without waiting for cutoff", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.clock.install({ time: new Date("2026-11-15T20:00:00Z") });
  const deliOption = deliCycleForWeek(COMMISSARY_PREP_BOARD_PILOT_WEEK).items[0];
  const nessieDeli = emptyDeliOrder(COMMISSARY_PREP_BOARD_PILOT_WEEK);
  nessieDeli.items[deliOption.mrn] = { mrn: deliOption.mrn, item: deliOption.name, portion: "1 sandwich", itemWasteCost: 3.25 };
  nessieDeli.quantities[deliOption.mrn] = { friday: 5, monday: 4, wednesday: 3 };
  const dawsonDeli = emptyDeliOrder(COMMISSARY_PREP_BOARD_PILOT_WEEK);
  dawsonDeli.items[deliOption.mrn] = { mrn: deliOption.mrn, item: deliOption.name, portion: "1 sandwich", itemWasteCost: 3.25 };
  dawsonDeli.quantities[deliOption.mrn] = { friday: 2, monday: 2, wednesday: 2 };
  const nessieSalad = emptyQuantities(COMMISSARY_PREP_BOARD_PILOT_WEEK);
  const cucumber = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "English Cucumbers, Fresh, Sliced, Half");
  nessieSalad[cucumber.id] = { friday: 0.25, monday: 0.25, wednesday: 0.25 };
  const records = [
    buildOrderRecord({ cafe: "Nessie", weekStart: COMMISSARY_PREP_BOARD_PILOT_WEEK, quantities: nessieSalad, deli: nessieDeli, now: new Date("2026-11-15T20:00:00Z") }),
    buildOrderRecord({ cafe: "Dawson", weekStart: COMMISSARY_PREP_BOARD_PILOT_WEEK, quantities: emptyQuantities(COMMISSARY_PREP_BOARD_PILOT_WEEK), deli: dawsonDeli, now: new Date("2026-11-15T20:00:00Z") }),
  ];
  const writes = await mockOrders(page, records);
  await page.setViewportSize({ width: 820, height: 1180 });
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Cricket");
  await page.getByLabel("Service week").selectOption(COMMISSARY_PREP_BOARD_PILOT_WEEK);
  await page.getByRole("button", { name: "Prep Board" }).click();

  const board = page.getByTestId("tabbed-prep-board");
  await expect(board).toBeVisible();
  await expect(board.getByText("Live production", { exact: true })).toBeVisible();
  await expect(board.getByText("Week 1/4–1/8", { exact: true })).toBeVisible();
  const phaseNav = board.getByRole("navigation", { name: "Prep board phases" });
  await expect(phaseNav.getByRole("button", { name: /Production/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Tabbed Prep Board ready", { exact: true })).toBeVisible();
  const roundedCucumber = board.getByText("English Cucumbers, Fresh, Sliced, Half", { exact: true }).locator("xpath=ancestor::article");
  await expect(roundedCucumber).toContainText("0.5 gallon");
  await expect(roundedCucumber).toContainText("Rounded prep volume");
  const productionRow = board.locator('[data-testid^="prep-board-row-prep-board|production|"]').first();
  await expect(productionRow).toBeVisible();
  await productionRow.getByRole("button").click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].records[0].weekStart).toBe(COMMISSARY_PREP_BOARD_PILOT_WEEK);
  expect(writes[0].records[0].completed.friday.some((id) => id.startsWith("prep-board|production|"))).toBe(true);

  await phaseNav.getByRole("button", { name: /Assembly/ }).click();
  await expect(board.getByText(deliOption.name, { exact: true })).toBeVisible();
  await expect(board.getByText(/inputs ready|waiting on production|ready/i).first()).toBeVisible();
  await phaseNav.getByRole("button", { name: /Pack Out/ }).click();
  await expect(board.getByText("Nessie · Deli", { exact: true }).first()).toBeVisible();
  await expect(board.getByText("Dawson · Deli", { exact: true }).first()).toBeVisible();
  await expect(board).toContainText("5 sandwich");
  expect(await board.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(board).toBeVisible();
  expect(await board.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(false);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});


test("one-week reopening closes an already open tab at Thursday 5 PM and preserves next Wednesday", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-29T23:59:58Z") });
  const writes = await mockOrders(page);
  await openTool(page, /open commissary ordering/i, /^Commissary Ordering Tool$/);
  await page.getByLabel("Your cafe").selectOption("Nessie");
  await page.getByLabel("Service week").selectOption("2026-11-02");
  await expect(page.getByText("Cutoff: Thursday 10/29 at 5:00 PM Pacific.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save order", exact: true })).toHaveCount(0);
  await expect(page.getByLabel(/^Friday \d+\/\d+ English Cucumbers, Fresh, Sliced, Half quantity$/)).toBeEnabled();
  await page.clock.fastForward(3000);
  await expect(page.getByText("Ordering closed", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/^Friday \d+\/\d+ English Cucumbers, Fresh, Sliced, Half quantity$/)).toBeDisabled();
  await page.getByLabel("Service week").selectOption("2026-11-09");
  await expect(page.getByText("Cutoff: Wednesday 11/4 at 5:00 PM Pacific.", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/^Friday \d+\/\d+ English Cucumbers, Fresh, Sliced, Half quantity$/)).toBeEnabled();
  expect(writes).toHaveLength(0);
});
