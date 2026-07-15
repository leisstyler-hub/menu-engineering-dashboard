import { expect, test } from "@playwright/test";
import { SMARTSHEET_COLUMNS, SMARTSHEET_RECORD_TYPES, SMARTSHEET_SELECTION_TYPES } from "../../src/integrations/smartsheet/contract.js";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

const week = "Jul 6, 2026 - Jul 10, 2026";
const parentId = `rotation|2026-07-06|South|Re:Invent`;
const augustWeek = "Aug 10, 2026 - Aug 14, 2026";
const augustParentId = `rotation|2026-08-10|South|Re:Invent`;
const recoveryWeek = "Jul 13, 2026 - Jul 17, 2026";
const recoveryParentId = `rotation|2026-07-13|South|Re:Invent`;
const dopplerWeek = "Aug 10, 2026 - Aug 14, 2026";
const dopplerParentId = `rotation|2026-08-10|South|Doppler`;
const dopplerPreviousWeek = "Aug 3, 2026 - Aug 7, 2026";
const dopplerPreviousParentId = `rotation|2026-08-03|South|Doppler`;

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
    globalBlock("thuFri", "Thursday + Friday", "AMZ: Cypress", 2, overrides),
    selection("thuFri", "AMZ: Cypress", "Chicken Souvlaki Gyro", 1, overrides),
    selection("thuFri", "AMZ: Cypress", "Spiced Jasmine Rice", 2, overrides),
    globalBlock("tueWed", "Tuesday + Wednesday", "AMZ: Lemongrass + Lime", 1, overrides),
    selection("tueWed", "AMZ: Lemongrass + Lime", "Lemongrass Chicken", 1, overrides),
    selection("tueWed", "AMZ: Lemongrass + Lime", "Thai Sweet + Sour Slaw", 2, overrides),
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

async function stubRotationReads(page, records = []) {
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
      await route.fulfill({ json: { ok: true, records: [] } });
      return;
    }
    await route.fulfill({ json: { ok: true, message: "Smartsheet smoke stub." } });
  });
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

test("Re:Invent recall prefers the chef-selected split menu rows over stale block defaults", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedReInventRecordsWithWrongBlockMenus());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: augustWeek });
  await page.getByRole("button", { name: /^Re:Invent$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap.getByText("AMZ+RA: Andes").first()).toBeVisible();
  await expect(recap.getByText("AMZ+RA: K-Town").first()).toBeVisible();
  await expect(recap.getByText("AMZ+RA: House of Teriyaki").first()).toBeVisible();
  await expect(recap.getByText("AMZ: Cypress")).toHaveCount(0);
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
  await expect(card).toContainText(/Monday[\s\S]*AMZ: Saffron[\s\S]*Tuesday \+ Wednesday[\s\S]*AMZ: Lemongrass \+ Lime[\s\S]*Thursday \+ Friday[\s\S]*AMZ: Cypress/);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Doppler recall prefers submitted global selections over a stale Cypress block row", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubRotationReads(page, savedDopplerRecordsWithWrongGlobalBlockMenu());

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);
  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("combobox").first().selectOption({ label: dopplerWeek });
  await page.getByRole("button", { name: /^Doppler$/i }).click();

  const recap = page.getByText("Submitted Menu Recap").locator("xpath=ancestor::section[1]");
  await expect(recap).toBeVisible({ timeout: 20_000 });
  await expect(recap.getByText("AMZ+RA: Andes").first()).toBeVisible();
  await expect(recap.getByText("AMZ: Cypress")).toHaveCount(0);
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
  await expect(card).toContainText(/Monday \+ Tuesday[\s\S]*AMZ: Cypress[\s\S]*Wednesday-Friday[\s\S]*AMZ\+RA: Andes/);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
