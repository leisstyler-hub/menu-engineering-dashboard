import { expect, test } from "@playwright/test";
import { SMARTSHEET_COLUMNS, SMARTSHEET_RECORD_TYPES, SMARTSHEET_SELECTION_TYPES } from "../../src/integrations/smartsheet/contract.js";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

const week = "Jul 6, 2026 - Jul 10, 2026";
const parentId = `rotation|2026-07-06|South|Re:Invent`;

function baseRecord(recordId, recordType, status = "Submitted") {
  return {
    [SMARTSHEET_COLUMNS.recordId]: recordId,
    [SMARTSHEET_COLUMNS.parentRecordId]: recordId === parentId ? "" : parentId,
    [SMARTSHEET_COLUMNS.recordType]: recordType,
    [SMARTSHEET_COLUMNS.status]: status,
    [SMARTSHEET_COLUMNS.district]: "South",
    [SMARTSHEET_COLUMNS.cafeUnit]: "Re:Invent",
    [SMARTSHEET_COLUMNS.weekStartDate]: "2026-07-06",
    [SMARTSHEET_COLUMNS.weekEndDate]: "2026-07-10",
    [SMARTSHEET_COLUMNS.dateRangeLabel]: week,
    [SMARTSHEET_COLUMNS.stationKey]: "global",
    [SMARTSHEET_COLUMNS.submittedBy]: "Browser Smoke",
    [SMARTSHEET_COLUMNS.submittedAt]: "Jul 1, 12:50 PM",
    [SMARTSHEET_COLUMNS.updatedAt]: "Jul 1, 12:50 PM",
  };
}

function globalBlock(blockId, title, menu, index) {
  const recordId = `${parentId}|global|${blockId}`;
  return {
    ...baseRecord(recordId, SMARTSHEET_RECORD_TYPES.globalBlock),
    [SMARTSHEET_COLUMNS.menuConcept]: menu,
    [SMARTSHEET_COLUMNS.menuBlockLabel]: title,
    [SMARTSHEET_COLUMNS.globalBlockId]: recordId,
    [SMARTSHEET_COLUMNS.globalBlockIndex]: index,
    [SMARTSHEET_COLUMNS.globalBlockDays]: title === "Friday" ? "Friday, Next Monday" : title.replace(" + ", ", "),
  };
}

function selection(blockId, menu, item, slotNumber) {
  return {
    ...baseRecord(`${parentId}|global-selection|${blockId}|${slotNumber}|${item}`, SMARTSHEET_RECORD_TYPES.globalSelection),
    [SMARTSHEET_COLUMNS.menuConcept]: menu,
    [SMARTSHEET_COLUMNS.globalBlockId]: `${parentId}|global|${blockId}`,
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
