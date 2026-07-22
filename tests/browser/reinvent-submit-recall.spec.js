import { expect, test } from "@playwright/test";
import { NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, SMARTSHEET_COLUMNS, SMARTSHEET_RECORD_TYPES, SMARTSHEET_SELECTION_TYPES } from "../../src/integrations/smartsheet/contract.js";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

const week = "Jul 6, 2026 - Jul 10, 2026";
const parentId = `rotation|2026-07-06|South|Re:Invent`;
const currentWeek = "Jul 20, 2026 - Jul 24, 2026";
const currentParentId = `rotation|2026-07-20|South|Re:Invent`;
const augustWeek = "Aug 10, 2026 - Aug 14, 2026";
const augustParentId = `rotation|2026-08-10|South|Re:Invent`;
const recoveryWeek = "Jul 13, 2026 - Jul 17, 2026";
const recoveryParentId = `rotation|2026-07-13|South|Re:Invent`;
const dopplerWeek = "Aug 10, 2026 - Aug 14, 2026";
const dopplerParentId = `rotation|2026-08-10|South|Doppler`;
const dopplerPreviousWeek = "Aug 3, 2026 - Aug 7, 2026";
const dopplerPreviousParentId = `rotation|2026-08-03|South|Doppler`;
const nitroWeek = "Oct 12, 2026 - Oct 16, 2026";
const nitroParentId = `rotation|2026-10-12|South|Nitro`;

function baseRecord(recordId, recordType, status = "Submitted", overrides = {}) {
  const activeParentId = overrides.parentId || parentId;
  const activeWeek = overrides.week || week;
  const activeCafe = overrides.cafe || "Re:Invent";
  const weekStartDate = overrides.weekStartDate || "2026-07-06";
  const weekEndDate = overrides.weekEndDate || "2026-07-10";
  return {
    [SMARTSHEET_COLUMNS.recordId]: recordId,
    [SMARTSHEET_COLUMNS.parentRecordId]: recordId === activeParentId ? "" : activeParentId,
    [SMARTSHEET_COLUMNS.recordType]: recordType,
    [SMARTSHEET_COLUMNS.status]: status,
    [SMARTSHEET_COLUMNS.district]: "South",
    [SMARTSHEET_COLUMNS.cafeUnit]: activeCafe,
    [SMARTSHEET_COLUMNS.weekStartDate]: weekStartDate,
    [SMARTSHEET_COLUMNS.weekEndDate]: weekEndDate,
    [SMARTSHEET_COLUMNS.dateRangeLabel]: activeWeek,
    [SMARTSHEET_COLUMNS.stationKey]: "global",
    [SMARTSHEET_COLUMNS.submittedBy]: "Browser Smoke",
    [SMARTSHEET_COLUMNS.submittedAt]: "Jul 1, 12:50 PM",
    [SMARTSHEET_COLUMNS.updatedAt]: "Jul 1, 12:50 PM",
  };
}

function globalBlock(blockId, title, menu, index, overrides = {}) {
  const activeParentId = overrides.parentId || parentId;
  const recordId = `${activeParentId}|global|${blockId}`;
  return {
    ...baseRecord(recordId, SMARTSHEET_RECORD_TYPES.globalBlock, "Submitted", overrides),
    [SMARTSHEET_COLUMNS.menuConcept]: menu,
    [SMARTSHEET_COLUMNS.menuBlockLabel]: title,
    [SMARTSHEET_COLUMNS.globalBlockId]: recordId,
    [SMARTSHEET_COLUMNS.globalBlockIndex]: index,
    [SMARTSHEET_COLUMNS.globalBlockDays]: title === "Friday" ? "Friday, Next Monday" : title.replace(" + ", ", "),
  };
}

function selection(blockId, menu, item, slotNumber, overrides = {}) {
  const activeParentId = overrides.parentId || parentId;
  return {
    ...baseRecord(`${activeParentId}|global-selection|${blockId}|${slotNumber}|${item}`, SMARTSHEET_RECORD_TYPES.globalSelection, "Submitted", overrides),
    [SMARTSHEET_COLUMNS.menuConcept]: menu,
    [SMARTSHEET_COLUMNS.globalBlockId]: `${activeParentId}|global|${blockId}`,
    [SMARTSHEET_COLUMNS.menuBlockLabel]: blockId,
    [SMARTSHEET_COLUMNS.selectionType]: SMARTSHEET_SELECTION_TYPES.entree,
    [SMARTSHEET_COLUMNS.menuItemSelection]: item,
    [SMARTSHEET_COLUMNS.slotNumber]: slotNumber,
  };
}

function stationSelection(stationKey, selectionType, item, slotNumber, overrides = {}) {
  const activeParentId = overrides.parentId || parentId;
  return {
    ...baseRecord(`${activeParentId}|${stationKey}|${selectionType}|${slotNumber}|${item}`, SMARTSHEET_RECORD_TYPES.stationSelection, "Submitted", overrides),
    [SMARTSHEET_COLUMNS.stationKey]: stationKey,
    [SMARTSHEET_COLUMNS.selectionType]: selectionType,
    [SMARTSHEET_COLUMNS.menuItemSelection]: item,
    [SMARTSHEET_COLUMNS.slotNumber]: slotNumber,
  };
}

function menuRow(menu, station, item, category = "entree", price = 11.75) {
  return {
    menu,
    station,
    item,
    recipeName: item,
    displayName: item,
    category,
    recipeCategory: category,
    price,
    sellPrice: price,
    trueCost: price > 4 ? 2.5 : 0.5,
    calories: price > 4 ? 420 : 180,
    allergens: "",
    enticingDescription: `${item} smoke selector row`,
  };
}

const smokeMenuRows = [
  menuRow("AMZ: Roam BBQ", "Global", "Smoked Brisket"),
  menuRow("AMZ: Cypress", "Global", "Chicken Souvlaki Gyro"),
  menuRow("AMZ: Cypress", "Global", "Spiced Jasmine Rice", "side", 2.55),
  menuRow("AMZ: Lotus", "Global", "Pork Hung Lay"),
  menuRow("AMZ: Saffron", "Global", "Chicken Apricot Tagine"),
  menuRow("AMZ: Fish Market", "Fish Market", "Steelhead Croquettes"),
  menuRow("AMZ: Cafe Express Curated Sandwiches", "Curated Sandwiches", "Chicken Caesar Wrap"),
  menuRow("AMZ: Cafe Express Curated Sandwiches", "Curated Sandwiches", "Caprese Sandwich"),
  menuRow("AMZ: Grill Core", "Location Spotlights", "Diablo Burger"),
];

function savedReInventRecords() {
  return [
    {
      ...baseRecord(parentId, SMARTSHEET_RECORD_TYPES.rotationHeader),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 3,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    globalBlock("monTue", "Monday + Tuesday", "AMZ: Ohana", 1),
    globalBlock("wedThu", "Wednesday + Thursday", "AMZ: Lotus", 2),
    globalBlock("friCarry", "Friday", "AMZ: Saffron", 3),
    selection("monTue", "AMZ: Ohana", "Huli Huli Chicken", 1),
    selection("wedThu", "AMZ: Lotus", "Pork Hung Lay", 1),
    selection("friCarry", "AMZ: Saffron", "Chicken Apricot Tagine", 1),
  ];
}

function savedReInventCompleteRecords(menu = "AMZ: Roam BBQ") {
  return [
    {
      ...baseRecord(parentId, SMARTSHEET_RECORD_TYPES.rotationHeader),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 8,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    globalBlock("monTue", "Monday + Tuesday", menu, 1),
    globalBlock("wedThu", "Wednesday + Thursday", "AMZ: Lotus", 2),
    globalBlock("friCarry", "Friday", "AMZ: Saffron", 3),
    selection("monTue", menu, "Smoked Brisket", 1),
    selection("wedThu", "AMZ: Lotus", "Pork Hung Lay", 1),
    selection("friCarry", "AMZ: Saffron", "Chicken Apricot Tagine", 1),
    stationSelection("fishMarket", SMARTSHEET_SELECTION_TYPES.lto, "Steelhead Croquettes", 1),
    stationSelection("deli", SMARTSHEET_SELECTION_TYPES.lto, "Chicken Caesar Wrap", 1),
    stationSelection("deli", SMARTSHEET_SELECTION_TYPES.lto, "Caprese Sandwich", 2),
    stationSelection("grill", SMARTSHEET_SELECTION_TYPES.locationSpotlight, "Diablo Burger", 1),
  ];
}

function asLiveSupabasePayloadRows(records = []) {
  return records.map((record) => {
    const next = { ...record };
    if (Object.prototype.hasOwnProperty.call(next, SMARTSHEET_COLUMNS.cafeUnit)) {
      next["Café / Unit"] = next[SMARTSHEET_COLUMNS.cafeUnit];
      delete next[SMARTSHEET_COLUMNS.cafeUnit];
    }
    if (Object.prototype.hasOwnProperty.call(next, SMARTSHEET_COLUMNS.menuItemSelection)) {
      next["Menu Item Selection"] = next[SMARTSHEET_COLUMNS.menuItemSelection];
      delete next[SMARTSHEET_COLUMNS.menuItemSelection];
    }
    if (next[SMARTSHEET_COLUMNS.selectionType] === SMARTSHEET_SELECTION_TYPES.entree) {
      next[SMARTSHEET_COLUMNS.selectionType] = "Entrée";
    }
    return next;
  });
}

function asLiveWeekStartOnlyRows(records = []) {
  return asLiveSupabasePayloadRows(records).map((record) => {
    const next = { ...record };
    delete next[SMARTSHEET_COLUMNS.dateRangeLabel];
    delete next.dateRangeLabel;
    delete next.week;
    return next;
  });
}

function savedReInventRecordsWithStaleLegacyMenu() {
  return [
    {
      ...baseRecord(parentId, SMARTSHEET_RECORD_TYPES.rotationHeader),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 5,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    {
      ...baseRecord(`${parentId}|global-block|AMZ: Ohana`, SMARTSHEET_RECORD_TYPES.globalBlock),
      [SMARTSHEET_COLUMNS.menuConcept]: "AMZ: Ohana",
      [SMARTSHEET_COLUMNS.menuBlockLabel]: "Global",
      [SMARTSHEET_COLUMNS.globalBlockId]: `${parentId}|global`,
      [SMARTSHEET_COLUMNS.globalBlockIndex]: 1,
      [SMARTSHEET_COLUMNS.globalBlockDays]: "Monday, Tuesday, Wednesday, Thursday, Friday",
    },
    globalBlock("monTue", "Monday + Tuesday", "AMZ: Cypress", 1),
    globalBlock("wedThu", "Wednesday + Thursday", "AMZ: Lotus", 2),
    globalBlock("friCarry", "Friday", "AMZ: Saffron", 3),
    selection("monTue", "AMZ: Cypress", "Chicken Souvlaki Gyro", 1),
    selection("monTue", "AMZ: Cypress", "Spiced Jasmine Rice", 2),
    selection("wedThu", "AMZ: Lotus", "Pork Hung Lay", 1),
    selection("friCarry", "AMZ: Saffron", "Chicken Apricot Tagine", 1),
  ];
}

function withTimestamps(record, timestamp) {
  return {
    ...record,
    [SMARTSHEET_COLUMNS.submittedAt]: timestamp,
    [SMARTSHEET_COLUMNS.updatedAt]: timestamp,
  };
}

function savedReInventRecordsWithStaleSameBlockRows() {
  const freshTimestamp = "Jul 21, 6:55 PM";
  const staleTimestamp = "Jul 22, 9:00 PM";
  const staleSelectionTimestamp = "Jul 22, 9:00 PM";
  const staleBlock = {
    ...baseRecord(`${parentId}|global|monTue|stale-roam-bbq`, SMARTSHEET_RECORD_TYPES.globalBlock),
    [SMARTSHEET_COLUMNS.menuConcept]: "AMZ: Roam BBQ",
    [SMARTSHEET_COLUMNS.menuBlockLabel]: "Monday + Tuesday",
    [SMARTSHEET_COLUMNS.globalBlockId]: `${parentId}|global|monTue`,
    [SMARTSHEET_COLUMNS.globalBlockIndex]: 1,
    [SMARTSHEET_COLUMNS.globalBlockDays]: "Monday, Tuesday",
  };
  const staleSelection = {
    ...selection("monTue", "AMZ: Roam BBQ", "Smoked Brisket", 1),
    [SMARTSHEET_COLUMNS.recordId]: `${parentId}|global-selection|monTue|stale-roam-bbq|1|Smoked Brisket`,
    [SMARTSHEET_COLUMNS.menuConcept]: "AMZ: Roam BBQ",
    [SMARTSHEET_COLUMNS.globalBlockId]: `${parentId}|global|monTue`,
  };
  return [
    withTimestamps({
      ...baseRecord(parentId, SMARTSHEET_RECORD_TYPES.rotationHeader),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 7,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    }, freshTimestamp),
    withTimestamps(globalBlock("monTue", "Monday + Tuesday", "AMZ: Cypress", 1), freshTimestamp),
    withTimestamps(globalBlock("wedThu", "Wednesday + Thursday", "AMZ: Lotus", 2), freshTimestamp),
    withTimestamps(globalBlock("friCarry", "Friday", "AMZ: Saffron", 3), freshTimestamp),
    withTimestamps(selection("monTue", "AMZ: Cypress", "Chicken Souvlaki Gyro", 1), freshTimestamp),
    withTimestamps(selection("monTue", "AMZ: Cypress", "Spiced Jasmine Rice", 2), freshTimestamp),
    withTimestamps(staleBlock, staleTimestamp),
    withTimestamps(staleSelection, staleSelectionTimestamp),
  ];
}

function savedReInventRecordsWithRawLabelStaleRows() {
  const freshTimestamp = "Jul 21, 7:15 PM";
  const staleSelectionTimestamp = "Jul 22, 9:00 PM";
  const rawLabelStaleSelection = {
    ...selection("monTue", "AMZ: Roam BBQ", "Smoked Brisket", 1),
    [SMARTSHEET_COLUMNS.recordId]: `${parentId}|global-selection|monTue|1|Smoked Brisket`,
    [SMARTSHEET_COLUMNS.globalBlockId]: "",
    [SMARTSHEET_COLUMNS.menuBlockLabel]: "monTue",
    [SMARTSHEET_COLUMNS.menuConcept]: "AMZ: Roam BBQ",
  };
  return [
    withTimestamps({
      ...baseRecord(parentId, SMARTSHEET_RECORD_TYPES.rotationHeader),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 7,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    }, freshTimestamp),
    withTimestamps(globalBlock("monTue", "Monday + Tuesday", "AMZ: Cypress", 1), freshTimestamp),
    withTimestamps(globalBlock("wedThu", "Wednesday + Thursday", "AMZ: Lotus", 2), freshTimestamp),
    withTimestamps(globalBlock("friCarry", "Friday", "AMZ: Saffron", 3), freshTimestamp),
    withTimestamps(selection("monTue", "AMZ: Cypress", "Chicken Souvlaki Gyro", 1), freshTimestamp),
    withTimestamps(selection("monTue", "AMZ: Cypress", "Spiced Jasmine Rice", 2), freshTimestamp),
    withTimestamps(rawLabelStaleSelection, staleSelectionTimestamp),
  ];
}

function savedReInventRecordsWithWrongBlockMenus() {
  const overrides = {
    parentId: augustParentId,
    week: augustWeek,
    cafe: "Re:Invent",
    weekStartDate: "2026-08-10",
    weekEndDate: "2026-08-14",
  };
  return [
    {
      ...baseRecord(augustParentId, SMARTSHEET_RECORD_TYPES.rotationHeader, "Submitted", overrides),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 6,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    globalBlock("monTue", "Monday + Tuesday", "AMZ: Cypress", 1, overrides),
    globalBlock("wedThu", "Wednesday + Thursday", "AMZ: Cypress", 2, overrides),
    globalBlock("friCarry", "Friday", "AMZ: Cypress", 3, overrides),
    selection("monTue", "AMZ+RA: Andes", "Aji De Gallina", 1, overrides),
    selection("monTue", "AMZ+RA: Andes", "Peruvian Roasted Potatoes", 2, overrides),
    selection("wedThu", "AMZ+RA: K-Town", "Korean Fried Chicken", 1, overrides),
    selection("wedThu", "AMZ+RA: K-Town", "Kimchi Fried Rice", 2, overrides),
    selection("friCarry", "AMZ+RA: House of Teriyaki", "Portobello Tofu Teriyaki", 1, overrides),
    selection("friCarry", "AMZ+RA: House of Teriyaki", "Steamed Jasmine Rice", 2, overrides),
  ];
}

function savedReInventSubmittedBlocksWithDraftSelections() {
  const overrides = {
    parentId: currentParentId,
    week: currentWeek,
    cafe: "Re:Invent",
    weekStartDate: "2026-07-20",
    weekEndDate: "2026-07-24",
  };
  const draftSelection = (blockId, menu, item, slotNumber) => ({
    ...selection(blockId, menu, item, slotNumber, overrides),
    [SMARTSHEET_COLUMNS.status]: "Draft",
    [SMARTSHEET_COLUMNS.submittedAt]: "",
  });
  return [
    {
      ...baseRecord(currentParentId, SMARTSHEET_RECORD_TYPES.rotationHeader, "Submitted", overrides),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 6,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    globalBlock("monTue", "Monday + Tuesday", "AMZ: Cypress", 1, overrides),
    globalBlock("wedThu", "Wednesday + Thursday", "AMZ: House of Teriyaki", 2, overrides),
    globalBlock("friCarry", "Friday", "AMZ: Andes", 3, overrides),
    draftSelection("monTue", "AMZ: Cypress", "Chicken Souvlaki Plate", 1),
    draftSelection("monTue", "AMZ: Cypress", "Spiced Jasmine Rice", 2),
    draftSelection("wedThu", "AMZ: House of Teriyaki", "Beef Teriyaki", 1),
    draftSelection("wedThu", "AMZ: House of Teriyaki", "Steamed Jasmine Rice", 2),
    draftSelection("friCarry", "AMZ: Andes", "Aji De Gallina", 1),
    draftSelection("friCarry", "AMZ: Andes", "Peruvian Roasted Potatoes", 2),
  ];
}

function savedStaleReInventWeekAfterCurrentWeek() {
  const staleParentId = "rotation|2026-07-27|South|Re:Invent";
  const overrides = {
    parentId: staleParentId,
    week: "Jul 27, 2026 - Jul 31, 2026",
    cafe: "Re:Invent",
    weekStartDate: "2026-07-27",
    weekEndDate: "2026-07-31",
  };
  return [
    {
      ...baseRecord(staleParentId, SMARTSHEET_RECORD_TYPES.rotationHeader, "Submitted", overrides),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 3,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    globalBlock("monTue", "Monday + Tuesday", "AMZ: Roam BBQ", 1, overrides),
    globalBlock("wedThu", "Wednesday + Thursday", "AMZ: Lotus", 2, overrides),
    globalBlock("friCarry", "Friday", "AMZ: Ohana", 3, overrides),
    selection("monTue", "AMZ: Roam BBQ", "Smoked Brisket", 1, overrides),
    selection("wedThu", "AMZ: Lotus", "Pork Hung Lay", 1, overrides),
    selection("friCarry", "AMZ: Ohana", "Huli Huli Chicken", 1, overrides),
  ];
}

function savedReInventRecoveryWeekOutOfOrderRecords() {
  const overrides = {
    parentId: recoveryParentId,
    week: recoveryWeek,
    cafe: "Re:Invent",
    weekStartDate: "2026-07-13",
    weekEndDate: "2026-07-17",
  };
  return [
    ...savedReInventRecords(),
    {
      ...baseRecord(recoveryParentId, SMARTSHEET_RECORD_TYPES.rotationHeader, "Submitted", overrides),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 4,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    globalBlock("friCarry", "Friday", "AMZ: Cypress", 3, overrides),
    selection("friCarry", "AMZ: Cypress", "Chicken Souvlaki Gyro", 1, overrides),
    selection("friCarry", "AMZ: Cypress", "Spiced Jasmine Rice", 2, overrides),
    globalBlock("monTue", "Monday + Tuesday", "AMZ: Saffron", 1, overrides),
    selection("monTue", "AMZ: Saffron", "Chicken Apricot Tagine", 1, overrides),
    globalBlock("wedThu", "Wednesday + Thursday", "AMZ: Lemongrass + Lime", 2, overrides),
    selection("wedThu", "AMZ: Lemongrass + Lime", "Lemongrass Chicken", 1, overrides),
    selection("wedThu", "AMZ: Lemongrass + Lime", "Thai Sweet + Sour Slaw", 2, overrides),
  ];
}

function promoSelection(item, selectionType, slotNumber, overrides = {}) {
  const activeParentId = overrides.parentId || parentId;
  return {
    ...baseRecord(`${activeParentId}|promotion|base|${selectionType}|${slotNumber}|${item}`, SMARTSHEET_RECORD_TYPES.stationSelection, "Submitted", overrides),
    [SMARTSHEET_COLUMNS.stationKey]: "promotion",
    [SMARTSHEET_COLUMNS.menuConcept]: overrides.promotionName || "Summer Crop Menu",
    [SMARTSHEET_COLUMNS.selectionType]: selectionType,
    [SMARTSHEET_COLUMNS.menuItemSelection]: item,
    [SMARTSHEET_COLUMNS.slotNumber]: slotNumber,
  };
}

function savedReInventFullWeekPromoWithStaleGlobalRows() {
  const overrides = {
    parentId: augustParentId,
    week: augustWeek,
    cafe: "Re:Invent",
    weekStartDate: "2026-08-10",
    weekEndDate: "2026-08-14",
    promotionName: "Summer Crop Menu",
  };
  return [
    {
      ...baseRecord(augustParentId, SMARTSHEET_RECORD_TYPES.rotationHeader, "Submitted", overrides),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 5,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
      [SMARTSHEET_COLUMNS.foodCostRangeLowPct]: 6.6,
      [SMARTSHEET_COLUMNS.foodCostRangeHighPct]: 43.5,
    },
    {
      ...globalBlock("promotion-override", "Promotion Override", "", 1, overrides),
      [SMARTSHEET_COLUMNS.menuConcept]: "",
      [SMARTSHEET_COLUMNS.globalBlockId]: `${augustParentId}|global|promotion-override`,
      [SMARTSHEET_COLUMNS.promotionOverrideEnabled]: true,
      [SMARTSHEET_COLUMNS.promotionName]: "Summer Crop Menu",
      [SMARTSHEET_COLUMNS.promotionDays]: "Monday, Tuesday, Wednesday, Thursday, Friday",
    },
    promoSelection("Summer Crop Chicken", SMARTSHEET_SELECTION_TYPES.entree, 1, overrides),
    promoSelection("Summer Corn Salad", SMARTSHEET_SELECTION_TYPES.side, 1, overrides),
    promoSelection("Watermelon Fresca", SMARTSHEET_SELECTION_TYPES.extension, 1, overrides),
    globalBlock("monTue", "Monday + Tuesday", "AMZ: Cypress", 1, overrides),
    globalBlock("wedThu", "Wednesday + Thursday", "AMZ: Cypress", 2, overrides),
    globalBlock("friCarry", "Friday", "AMZ: Cypress", 3, overrides),
    selection("monTue", "AMZ: Cypress", "Chicken Souvlaki Gyro", 1, overrides),
    selection("wedThu", "AMZ: Cypress", "Spiced Jasmine Rice", 2, overrides),
    selection("friCarry", "AMZ: Cypress", "Chicken Souvlaki Gyro", 1, overrides),
  ];
}

function savedDopplerRecordsWithWrongGlobalBlockMenu() {
  const overrides = {
    parentId: dopplerParentId,
    week: dopplerWeek,
    cafe: "Doppler",
    weekStartDate: "2026-08-10",
    weekEndDate: "2026-08-14",
  };
  return [
    {
      ...baseRecord(dopplerParentId, SMARTSHEET_RECORD_TYPES.rotationHeader, "Submitted", overrides),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 2,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    {
      ...globalBlock("base", "Global", "AMZ: Cypress", 1, overrides),
      [SMARTSHEET_COLUMNS.globalBlockId]: "",
      [SMARTSHEET_COLUMNS.menuBlockLabel]: "",
    },
    selection("base", "AMZ+RA: Andes", "Aji De Gallina", 1, overrides),
    selection("base", "AMZ+RA: Andes", "Peruvian Roasted Potatoes", 2, overrides),
  ];
}

function savedDopplerFullWeekRecords() {
  const previousOverrides = {
    parentId: dopplerPreviousParentId,
    week: dopplerPreviousWeek,
    cafe: "Doppler",
    weekStartDate: "2026-08-03",
    weekEndDate: "2026-08-07",
  };
  return [
    {
      ...baseRecord(dopplerPreviousParentId, SMARTSHEET_RECORD_TYPES.rotationHeader, "Submitted", previousOverrides),
      [SMARTSHEET_COLUMNS.savedEntryCount]: 2,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    {
      ...globalBlock("base", "Global", "AMZ: Cypress", 1, previousOverrides),
      [SMARTSHEET_COLUMNS.globalBlockId]: "",
      [SMARTSHEET_COLUMNS.menuBlockLabel]: "",
    },
    selection("base", "AMZ: Cypress", "Chicken Souvlaki Gyro", 1, previousOverrides),
    selection("base", "AMZ: Cypress", "Spiced Jasmine Rice", 2, previousOverrides),
    ...savedDopplerRecordsWithWrongGlobalBlockMenu(),
  ];
}

async function stubRotationReads(page, records = [], mirrorRecords = []) {
  await page.route("**/api/recipe-library**", async (route) => {
    await route.fulfill({
      json: {
        ok: true,
        source: "smoke-menu-rows",
        rows: smokeMenuRows,
        count: smokeMenuRows.length,
      },
    });
  });
  await page.route("**/api/storage/records**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: {
          ok: true,
          state: "synced",
          source: "supabase",
          records,
          count: records.length,
          message: `Loaded ${records.length} smoke rotation rows.`,
        },
      });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/smartsheet/records**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { ok: true, records: mirrorRecords } });
      return;
    }
    await route.fulfill({ json: { ok: true, message: "Smartsheet smoke stub." } });
  });
}

async function stubMutableRotationStorage(page, initialRecords = []) {
  let records = [...initialRecords];
  await page.route("**/api/recipe-library**", async (route) => {
    await route.fulfill({
      json: {
        ok: true,
        source: "smoke-menu-rows",
        rows: smokeMenuRows,
        count: smokeMenuRows.length,
      },
    });
  });
  await page.route("**/api/storage/records**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: {
          ok: true,
          state: "synced",
          source: "supabase",
          records,
          count: records.length,
          message: `Loaded ${records.length} smoke rotation rows.`,
        },
      });
      return;
    }

    let body = {};
    try {
      body = route.request().postDataJSON();
    } catch {
      body = {};
    }
    if (body?.action === "upsertRecords") {
      const nextRecords = body.records || [];
      const replaceParentRecordIds = new Set((body.context?.replaceParentRecordIds || []).map(String));
      const nextRecordIds = new Set(nextRecords.map((record) => String(record[SMARTSHEET_COLUMNS.recordId] || "")));
      records = [
        ...records.filter((record) => {
          const recordId = String(record[SMARTSHEET_COLUMNS.recordId] || "");
          const parentRecordId = String(record[SMARTSHEET_COLUMNS.parentRecordId] || "");
          const replacedFamily = Array.from(replaceParentRecordIds).some((replacementParentId) => (
            recordId === replacementParentId
            || parentRecordId === replacementParentId
            || recordId.startsWith(`${replacementParentId}|`)
          ));
          if (nextRecordIds.has(recordId)) return false;
          if (replacedFamily) return false;
          return true;
        }),
        ...nextRecords,
      ];
      await route.fulfill({
        json: {
          ok: true,
          state: "synced",
          source: "supabase",
          synced: nextRecords.length,
          deletedStale: 0,
          message: `Saved ${nextRecords.length} smoke rotation rows.`,
        },
      });
      return;
    }

    await route.fulfill({ json: { ok: true, state: "synced", source: "supabase", records } });
  });
  await page.route("**/api/smartsheet/records**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { ok: true, records: [] } });
      return;
    }
    await route.fulfill({ json: { ok: true, message: "Smartsheet smoke stub." } });
  });
}

async function selectMenuItemInBlock(block, itemPattern) {
  const selects = block.locator("select");
  const count = await selects.count();
  for (let index = 1; index < count; index += 1) {
    const select = selects.nth(index);
    const options = await select.locator("option").allTextContents();
    const optionIndex = options.findIndex((text) => itemPattern.test(text));
    if (optionIndex >= 0) {
      await select.selectOption({ index: optionIndex });
      return;
    }
  }
  throw new Error(`Could not find selector option matching ${itemPattern}`);
}

function savedNitroRecords(menu, itemPrefix, count, source = "primary") {
  const overrides = {
    parentId: nitroParentId,
    week: nitroWeek,
    cafe: "Nitro",
    weekStartDate: "2026-10-12",
    weekEndDate: "2026-10-16",
  };
  const blocks = [
    ["nitroMonTue", "Monday + Tuesday Proteins"],
    ["nitroWedFri", "Wednesday + Friday Proteins"],
  ];
  return [
    {
      ...baseRecord(nitroParentId, SMARTSHEET_RECORD_TYPES.rotationHeader, "Submitted", overrides),
      [SMARTSHEET_COLUMNS.savedEntryCount]: count * blocks.length,
      [SMARTSHEET_COLUMNS.historyInclude]: true,
    },
    ...blocks.flatMap(([blockId, title], blockIndex) => [
      globalBlock(blockId, title, menu, blockIndex + 1, overrides),
      ...Array.from({ length: count }, (_, itemIndex) => selection(
        blockId,
        menu,
        `${itemPrefix} ${source} ${blockIndex + 1}-${itemIndex + 1}`,
        itemIndex + 1,
        overrides,
      )),
    ]),
  ];
}

function savedNitroRecordsWithMismatchedCanonicalMenu() {
  const overrides = {
    parentId: nitroParentId,
    week: nitroWeek,
    cafe: "Nitro",
    weekStartDate: "2026-10-12",
    weekEndDate: "2026-10-16",
  };
  return [
    ...savedNitroRecords("AMZ: Ciudad", "Ciudad item", 2, "mismatched"),
    {
      ...globalBlock("base", "Global", "AMZ: Anisa", 1, overrides),
      [SMARTSHEET_COLUMNS.globalBlockId]: "",
      [SMARTSHEET_COLUMNS.menuBlockLabel]: "",
    },
  ];
}

test("Re:Invent saved split global blocks recall as the submitted menus", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventRecords());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: week });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap.getByText("Monday + Tuesday").first()).toBeVisible();
  await expect(recap.getByText("AMZ: Ohana").first()).toBeVisible();
  await expect(recap.getByText("Wednesday + Thursday").first()).toBeVisible();
  await expect(recap.getByText("AMZ: Lotus").first()).toBeVisible();
  await expect(recap.getByText("Friday").first()).toBeVisible();
  await expect(recap.getByText("AMZ: Saffron").first()).toBeVisible();
  await expect(page.getByText(new RegExp("AMZ: Ohana\\s*/\\s*AMZ: Lotus\\s*/\\s*AMZ: Ohana", "i"))).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent split-block recall ignores a stale legacy one-week menu after resubmit", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventRecordsWithStaleLegacyMenu());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: week });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Chicken Souvlaki Gyro/);
  await expect(recap).toContainText(/Wednesday \+ Thursday[\s\S]*AMZ: Lotus/);
  await expect(recap).toContainText(/Friday[\s\S]*AMZ: Saffron/);

  const card = page.getByRole("button", { name: /Open Re:Invent planner/i }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Wednesday \+ Thursday[\s\S]*AMZ: Lotus[\s\S]*Friday[\s\S]*AMZ: Saffron/);
  await expect(card.getByText("AMZ: Ohana")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent split-block recall keeps newest same-block resubmission over stale rows", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventRecordsWithStaleSameBlockRows());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: week });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Chicken Souvlaki Gyro/);
  await expect(recap).toContainText(/Wednesday \+ Thursday[\s\S]*AMZ: Lotus/);
  await expect(recap).toContainText(/Friday[\s\S]*AMZ: Saffron/);
  await expect(recap.getByText("AMZ: Roam BBQ")).toHaveCount(0);
  await expect(recap.getByText("Smoked Brisket")).toHaveCount(0);

  const card = page.getByRole("button", { name: /Open Re:Invent planner/i }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress/);
  await expect(card.getByText("AMZ: Roam BBQ")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent edit and resubmit keeps changed Monday-Tuesday menu after leaving and returning", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubMutableRotationStorage(page, savedReInventCompleteRecords());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: week });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const firstRecap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(firstRecap).toBeVisible({ timeout: 20_000 });
  await expect(firstRecap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Roam BBQ/);
  await firstRecap.getByLabel(/Edit and resubmit/i).click({ force: true, noWaitAfter: true });

  const monTueEditor = page.getByText("Global Block 1").locator("xpath=ancestor::div[contains(@class,'rounded-3xl')][1]");
  await expect(monTueEditor).toBeVisible({ timeout: 20_000 });
  await monTueEditor.locator("select").first().selectOption({ label: "AMZ: Cypress" });
  await selectMenuItemInBlock(monTueEditor, /Chicken Souvlaki/i);

  await expect(page.getByRole("button", { name: /^Submit$/i })).toBeEnabled({ timeout: 10_000 });
  await page.getByRole("button", { name: /^Submit$/i }).click();

  const submittedRecap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(submittedRecap).toBeVisible({ timeout: 20_000 });
  await expect(submittedRecap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Chicken Souvlaki/);
  await expect(submittedRecap.getByText("AMZ: Roam BBQ")).toHaveCount(0);

  await page.getByRole("button", { name: /Back to Platform/i }).click();
  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: week });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recalledRecap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recalledRecap).toBeVisible({ timeout: 20_000 });
  await expect(recalledRecap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Chicken Souvlaki/);
  await expect(recalledRecap.getByText("AMZ: Roam BBQ")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent recall reads live Supabase café and entrée column shapes", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, asLiveSupabasePayloadRows(savedReInventCompleteRecords("AMZ: Cypress")));

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: week });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Smoked Brisket/);
  await expect(recap.getByText("AMZ: Roam BBQ")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent split-block recall rejects raw-label stale rows after leaving and returning", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventRecordsWithRawLabelStaleRows());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: week });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Chicken Souvlaki Gyro/);
  await expect(recap.getByText("AMZ: Roam BBQ")).toHaveCount(0);
  await expect(recap.getByText("Smoked Brisket")).toHaveCount(0);

  const card = page.getByRole("button", { name: /Open Re:Invent planner/i }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress/);
  await expect(card.getByText("AMZ: Roam BBQ")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent recall ignores stale child rows that disagree with submitted Global Block menus", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventRecordsWithWrongBlockMenus());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: augustWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap.getByText("AMZ: Cypress").first()).toBeVisible();
  await expect(recap.getByText("Aji De Gallina")).toHaveCount(0);
  await expect(recap.getByText("Korean Fried Chicken")).toHaveCount(0);
  await expect(recap.getByText("Portobello Tofu Teriyaki")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent submitted blocks recover saved item rows that were previously written as Draft", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventSubmittedBlocksWithDraftSelections());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: currentWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Chicken Souvlaki Plate/);
  await expect(recap).toContainText(/Wednesday \+ Thursday[\s\S]*AMZ: House of Teriyaki[\s\S]*Beef Teriyaki/);
  await expect(recap).toContainText(/Friday[\s\S]*AMZ: Andes[\s\S]*Aji De Gallina/);
  const card = page.getByRole("button", { name: /Open Re:Invent planner/i }).first();
  await expect(card).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Wednesday \+ Thursday[\s\S]*AMZ: House of Teriyaki[\s\S]*Friday[\s\S]*AMZ: Andes/);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent shared database recall replaces stale local browser cache", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventSubmittedBlocksWithDraftSelections());
  await page.addInitScript(([storageKey, staleKey]) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      [staleKey]: {
        status: "Submitted",
        submittedAt: "Jul 1, 12:50 PM",
        updatedAt: "Jul 1, 12:50 PM",
        globalBlocks: {
          monTue: {
            menu: "AMZ: Roam BBQ",
            station: "",
            entrees: ["Smoked Brisket", "", ""],
            sides: ["Mac & Cheese", "", "", ""],
            subRecipes: ["", "", "", ""],
            extensions: ["", ""],
          },
        },
      },
    }));
  }, [NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, `${currentWeek}|South|Re:Invent`]);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: currentWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Chicken Souvlaki Plate/);
  await expect(recap.getByText("AMZ: Roam BBQ")).toHaveCount(0);
  await expect(recap.getByText("Smoked Brisket")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent rebuilt records isolate global blocks from other saved weeks", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, [
    ...savedReInventSubmittedBlocksWithDraftSelections(),
    ...savedStaleReInventWeekAfterCurrentWeek(),
  ]);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: currentWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Chicken Souvlaki Plate/);
  await expect(recap).toContainText(/Wednesday \+ Thursday[\s\S]*AMZ: House of Teriyaki/);
  await expect(recap).toContainText(/Friday[\s\S]*AMZ: Andes/);
  await expect(recap.getByText("AMZ: Roam BBQ")).toHaveCount(0);
  await expect(recap.getByText("Smoked Brisket")).toHaveCount(0);

  const storedBlocks = await page.evaluate(([storageKey, rotationKey]) => {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    return stored[rotationKey]?.globalBlocks || {};
  }, [NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, `${currentWeek}|South|Re:Invent`]);
  expect(storedBlocks.monTue?.menu).toBe("AMZ: Cypress");
  expect(storedBlocks.wedThu?.menu).toBe("AMZ: House of Teriyaki");
  expect(storedBlocks.friCarry?.menu).toBe("AMZ: Andes");
  expect(storedBlocks.monTue?.menu).not.toBe("AMZ: Roam BBQ");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent shared database recall maps week-start rows over stale display-week cache", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, asLiveWeekStartOnlyRows(savedReInventSubmittedBlocksWithDraftSelections()));
  await page.addInitScript(([storageKey, staleKey]) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      [staleKey]: {
        status: "Submitted",
        submittedAt: "Jul 21, 10:30 PM",
        updatedAt: "Jul 21, 10:30 PM",
        globalBlocks: {
          monTue: {
            menu: "AMZ: Roam BBQ",
            entrees: ["Huli Huli Chicken", "", ""],
            sides: ["Brown Rice", "", "", ""],
            subRecipes: ["", "", "", ""],
            extensions: ["", ""],
          },
          wedThu: {
            menu: "AMZ: Lotus",
            entrees: ["Pork Hung Lay", "", ""],
            sides: ["", "", "", ""],
            subRecipes: ["", "", "", ""],
            extensions: ["", ""],
          },
          friCarry: {
            menu: "AMZ: Ohana",
            entrees: ["Huli Huli Chicken", "", ""],
            sides: ["", "", "", ""],
            subRecipes: ["", "", "", ""],
            extensions: ["", ""],
          },
        },
      },
    }));
  }, [NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, `${currentWeek}|South|Re:Invent`]);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: currentWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Chicken Souvlaki Plate/);
  await expect(recap.getByText("AMZ: Roam BBQ")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent future week stays blank when shared database has no saved rotation", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, []);
  await page.addInitScript(([storageKey, staleKey]) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      [staleKey]: {
        status: "Submitted",
        submittedAt: "Jul 1, 12:50 PM",
        updatedAt: "Jul 1, 12:50 PM",
        globalBlocks: {
          monTue: {
            menu: "AMZ: Roam BBQ",
            entrees: ["Smoked Brisket", "", ""],
            sides: ["Mac & Cheese", "", "", ""],
            subRecipes: ["", "", "", ""],
            extensions: ["", ""],
          },
        },
      },
    }));
  }, [NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, `${augustWeek}|South|Re:Invent`]);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: augustWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  await expect(page.getByText("Submitted Menu Recap")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByRole("button", { name: /^Submit$/i })).toBeDisabled({ timeout: 20_000 });
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent leadership card shows the full recovery week in calendar order", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventRecoveryWeekOutOfOrderRecords());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: recoveryWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const card = page.getByRole("button", { name: /Open Re:Invent planner/i }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Saffron[\s\S]*Wednesday \+ Thursday[\s\S]*AMZ: Lemongrass \+ Lime[\s\S]*Friday[\s\S]*AMZ: Cypress/);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Re:Invent full-week promo recall ignores stale normal global rows", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventFullWeekPromoWithStaleGlobalRows());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: augustWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const card = page.getByRole("button", { name: /Open Re:Invent planner/i }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText(/Monday-Friday[\s\S]*Summer Crop Menu/);
  await expect(card.getByText("AMZ: Cypress")).toHaveCount(0);
  await expect(card.getByText(/6\.6%\s*–\s*43\.5%/)).toHaveCount(0);

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap.getByText("Summer Crop Menu").first()).toBeVisible();
  await expect(recap.getByText("Summer Crop Chicken").first()).toBeVisible();
  await expect(recap.getByText("Summer Corn Salad").first()).toBeVisible();
  await expect(recap.getByText("Watermelon Fresca").first()).toBeVisible();
  await expect(recap.getByText("AMZ: Cypress")).toHaveCount(0);
  await expect(recap.getByText("Chicken Souvlaki Gyro")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("edit and resubmit state clears when switching cafes", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, [
    ...savedReInventRecordsWithWrongBlockMenus(),
    ...savedDopplerRecordsWithWrongGlobalBlockMenu()
  ]);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: augustWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const reInventRecap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(reInventRecap).toBeVisible({ timeout: 20_000 });
  await reInventRecap.getByLabel(/Edit and resubmit/i).click({ force: true, noWaitAfter: true });
  await expect(page.getByRole("heading", { name: /^Re:Invent$/i }).first()).toBeVisible();

  await page.getByRole("button", { name: /^Doppler$/i }).click();
  const dopplerRecap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(dopplerRecap).toBeVisible({ timeout: 20_000 });
  await expect(dopplerRecap.getByRole("heading", { name: /^Doppler$/i })).toBeVisible();
  await expect(dopplerRecap.getByText("AMZ: Cypress").first()).toBeVisible();
  await expect(dopplerRecap.getByText("AMZ+RA: Andes")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Doppler recall keeps the submitted global block menu over mismatched child rows", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedDopplerRecordsWithWrongGlobalBlockMenu());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: dopplerWeek });
  await page.getByRole("button", { name: /^Doppler$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap.getByText("AMZ: Cypress").first()).toBeVisible();
  await expect(recap.getByText("AMZ+RA: Andes")).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Doppler leadership card shows Monday-Tuesday carryover and Wednesday-Friday current menu", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedDopplerFullWeekRecords());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: dopplerWeek });
  await page.getByRole("button", { name: /^Doppler$/i }).click();

  const card = page.getByRole("button", { name: /Open Doppler planner/i }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Wednesday-Friday[\s\S]*AMZ: Cypress/);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Nitro recall uses current Supabase rows instead of stale Smartsheet child rows", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const currentRows = savedNitroRecords("AMZ: Anisa", "Anisa item", 2, "current");
  const staleMirrorRows = savedNitroRecords("AMZ: Ciudad", "Ciudad item", 6, "stale");
  await stubRotationReads(page, currentRows, staleMirrorRows);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: nitroWeek });
  await page.getByRole("button", { name: /^Nitro$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap.getByText("AMZ: Anisa")).toHaveCount(3);
  await expect(recap.getByText("AMZ: Ciudad")).toHaveCount(0);
  await expect(recap.getByText(/Anisa item current/i)).toHaveCount(4);
  await expect(recap.getByText(/Ciudad item stale/i)).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Nitro submitted recall ignores stale Draft children mixed into the Supabase family", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const currentRows = savedNitroRecords("AMZ: Anisa", "Anisa item", 2, "current");
  const staleDraftChildren = savedNitroRecords("AMZ: Ciudad", "Ciudad item", 6, "stale")
    .filter((record) => record[SMARTSHEET_COLUMNS.recordType] === SMARTSHEET_RECORD_TYPES.globalSelection)
    .map((record) => ({
      ...record,
      [SMARTSHEET_COLUMNS.status]: "Draft",
      [SMARTSHEET_COLUMNS.updatedAt]: "Jul 1, 8:00 AM",
      [SMARTSHEET_COLUMNS.submittedAt]: "",
    }));
  await stubRotationReads(page, [...currentRows, ...staleDraftChildren]);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: nitroWeek });
  await page.getByRole("button", { name: /^Nitro$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap.getByText("AMZ: Anisa")).toHaveCount(3);
  await expect(recap.getByText("AMZ: Ciudad")).toHaveCount(0);
  await expect(recap.getByText(/Anisa item current/i)).toHaveCount(4);
  await expect(recap.getByText(/Ciudad item stale/i)).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Nitro recall rejects child blocks that conflict with the saved weekly menu", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedNitroRecordsWithMismatchedCanonicalMenu());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: nitroWeek });
  await page.getByRole("button", { name: /^Nitro$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap.getByText("AMZ: Anisa")).toHaveCount(3);
  await expect(recap.getByText("AMZ: Ciudad")).toHaveCount(0);
  await expect(recap.getByText(/Ciudad item mismatched/i)).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
