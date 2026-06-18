import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { ArrowLeft, AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clipboard, Printer, Save, Send, Upload } from "lucide-react";

import MENUWORKS_ITEMS from "../../data/menuItems.json";
import { loadRecordsFromSmartsheet, syncRecordsToSmartsheet } from "../../integrations/smartsheet/client.js";
import { NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, SMARTSHEET_COLUMNS, SMARTSHEET_DATABASE_STORAGE_KEY, SMARTSHEET_RECORD_TYPES, SMARTSHEET_SELECTION_TYPES, STATION_SMARTSHEET_LABELS } from "../../integrations/smartsheet/contract.js";
import { APP_VERSION_STAMP } from "../../shared/appConfig.js";
import { money, pct, titleCase } from "../../shared/formatting.js";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";

const DISTRICTS = {
  South: ["Doppler", "Day 1", "Nitro", "Re:Invent"],
  North: ["Dawson", "Nessie", "Cricket", "Moby", "Commissary", "Atlas"],
  East: ["Astra", "Bingo", "Sonic", "Blueshift", "Eclipse", "Grace"],
  LAX: ["LAX22", "LAX35", "LAX75", "LAX78", "SNA3"]
};

const CAFE_STATION_CONFIG = {
  Nitro: ["global", "carvery", "grill", "pizza"],
  Doppler: ["global", "salad", "grill", "pizza", "deli"],
  "Day 1": ["global", "noodles", "grill", "salad", "fishMarket", "deli"],
  "Re:Invent": ["fishMarket", "global", "deli", "grill"],
  Dawson: ["global", "carvery", "grill", "salad", "freshFive"],
  Nessie: ["wok", "global", "grill", "deli", "salad", "freshFive"],
  Cricket: ["global", "grill", "deli", "pizza", "freshFive"],
  Moby: ["global", "pizza", "salad", "deli", "freshFive"],
  Commissary: ["deli", "salad", "pizza", "freshFive", "soup"],
  Atlas: ["grill", "freshFive"],
  LAX22: ["global", "grill", "salad", "freshFive"],
  LAX35: ["global", "grill", "salad", "freshFive"],
  LAX75: ["global", "grill", "salad", "freshFive"],
  LAX78: ["global", "grill", "salad", "freshFive"],
  SNA3: ["global", "grill", "salad", "freshFive"],
  Astra: ["global", "grill", "freshFive"],
  Bingo: ["global", "fishMarket", "grill", "grillFreshFive", "salad", "saladFreshFive", "commissaryEverest"],
  Sonic: ["global", "grill", "freshFive", "salad", "deli"],
  Blueshift: ["global", "lotusWp", "grill", "salad", "deli", "fishMarket", "freshFive"],
  Eclipse: ["global", "stationTakeover", "freshFive"],
  Grace: ["streetBeets", "global", "grill", "freshFive", "salad"]
};

const MENU_CONFLICT_GROUPS = {
  South: [
    {
      label: "South neighborhood rotation",
      cafes: ["Nitro", "Day 1", "Doppler"],
      note: "Nitro/Frontier, Day 1, and Doppler cannot run the same Global Menu. Re:Invent is an exception."
    }
  ]
};

const STATION_LABELS = {
  global: "Global Station",
  noodles: "Noodle Station",
  wok: "Wok Station",
  grill: "Grill Station",
  salad: "Salad LTOs",
  pizza: "Pizza / Flatbread LTOs",
  deli: "Deli LTOs",
  fishMarket: "Fish Market LTO",
  carvery: "Carvery Station",
  freshFive: "Fresh $5",
  grillFreshFive: "Grill Fresh $5",
  saladFreshFive: "Salad Fresh $5",
  soup: "Soup LTOs",
  streetBeets: "Street Beets",
  commissaryEverest: "Commissary to Everest",
  lotusWp: "Lotus W&P",
  stationTakeover: "Station Takeover"
};

const formatDateKey = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const getMonday = (date = new Date()) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = next.getDate() - day + (day === 0 ? -6 : 1);
  next.setDate(diff);
  next.setHours(0, 0, 0, 0);
  return next;
};
const dateLabel = (date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const makeWeekOption = (monday) => `${dateLabel(monday)} - ${dateLabel(addDays(monday, 4))}`;
const parseDateLabel = (label = "") => {
  const parsed = new Date(String(label).trim());
  return Number.isNaN(parsed.getTime()) ? "" : formatDateKey(parsed);
};
const parseWeekStart = (weekLabel = "") => {
  const raw = String(weekLabel || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.split("|")[0].trim();
  return parseDateLabel(raw.split(" - ")[0]);
};
const parseWeekEnd = (weekLabel = "") => {
  const raw = String(weekLabel || "").trim();
  const parts = raw.split(" - ");
  if (parts.length > 1) return parseDateLabel(parts[1]);
  const start = parseWeekStart(weekLabel);
  if (!start) return "";
  return formatDateKey(addDays(new Date(`${start}T00:00:00`), 4));
};
const ROTATION_CYCLE_START = new Date("2026-01-05T00:00:00");
const weekIndexFromLabel = (weekLabel = "") => {
  const start = parseWeekStart(weekLabel);
  if (!start) return 0;
  const weekStart = new Date(`${start}T00:00:00`);
  if (Number.isNaN(weekStart.getTime())) return 0;
  return Math.max(0, Math.round((weekStart - ROTATION_CYCLE_START) / (7 * 24 * 60 * 60 * 1000)));
};
const isReInventFridayMondayWeek = (weekLabel = "") => (weekIndexFromLabel(weekLabel) + 1) % 2 === 0;
const ROTATION_WEEKS = Array.from({ length: 160 }, (_, index) => makeWeekOption(addDays(ROTATION_CYCLE_START, index * 7)));
const DEFAULT_ROTATION_WEEK = makeWeekOption(getMonday(new Date()));
const previousRotationWeek = (weekLabel = "") => {
  const index = ROTATION_WEEKS.indexOf(weekLabel);
  if (index > 0) return ROTATION_WEEKS[index - 1];
  const start = parseWeekStart(weekLabel);
  if (!start) return "";
  return makeWeekOption(addDays(new Date(`${start}T00:00:00`), -7));
};

const ROLLING_HISTORY_WEEK_COUNT = 26;
const ROLLING_ROTATION_WEEKS = ROTATION_WEEKS.slice(0, ROLLING_HISTORY_WEEK_COUNT);

function blankCustomStations() {
  return {
    streetBeets: {
      entrees: ["", ""],
      entreeCalories: ["", ""],
      sides: ["", "", ""],
      sideCalories: ["", "", ""],
      subRecipes: ["", ""],
      subRecipeCalories: ["", ""],
      extensions: [""],
      extensionCalories: [""]
    },
    commissaryEverest: {
      menuName: "",
      entrees: ["", ""],
      hotSides: [""],
      coldSides: ["", "", "", ""],
      rice: [""]
    },
    stationTakeover: {
      enabled: false,
      menuName: "",
      entrees: ["", ""],
      sides: ["", "", "", ""],
      subRecipes: ["", "", ""],
      extensions: ["", ""]
    }
  };
}

function cloneArrayWithLength(values = [], length = 0) {
  return Array.from({ length }, (_, index) => values[index] || "");
}

function cloneCustomStations(source = {}) {
  const blank = blankCustomStations();
  return Object.fromEntries(Object.entries(blank).map(([stationKey, station]) => [
    stationKey,
    Object.fromEntries(Object.entries(station).map(([field, value]) => [
      field,
      Array.isArray(value) ? cloneArrayWithLength(source?.[stationKey]?.[field] || value, value.length) : source?.[stationKey]?.[field] ?? value
    ]))
  ]));
}

const EMPTY_ROTATION = {
  menu: "",
  station: "",
  entrees: ["", "", ""],
  sides: ["", "", "", ""],
  subRecipes: ["", "", "", ""],
  extensions: ["", ""],
  grill: { regionalSpecial: "", locationSpotlight: "", promoActive: false, promoItem: "" },
  ltos: {
    salad: ["", ""],
    pizza: ["", ""],
    deli: ["", ""],
    fishMarket: [""],
    freshFive: ["", "", "", "", ""],
    grillFreshFive: [""],
    saladFreshFive: [""],
    soup: ["", ""],
    lotusEntrees: ["", "", "", ""],
    lotusSides: ["", "", "", "", "", ""],
    noodles: [""],
    wokEntrees: ["", "", ""],
    wokSides: ["", ""],
    wokBase: [""],
    wokSubRecipes: ["", ""]
  },
  carvery: {
    protein1: "",
    protein2: "",
    vegetable1: "",
    vegetable2: "",
    vegetable3: "",
    starch: "",
    hotSide1: "",
    coldSide1: "",
    coldSide2: ""
  },
  uploadedLtos: {},
  promotionOverride: { enabled: false, name: "", days: [], returnDays: [], returnMode: "same", returnMenu: "" },
  globalBlocks: {},
  customStations: blankCustomStations(),
  status: "Draft",
  submittedBy: "",
  updatedAt: "",
  submittedAt: ""
};

const rotationKey = (week, district, cafe) => `${week}|${district}|${cafe}`;
const rotationRecordParentId = (week, district, cafe) => `rotation|${parseWeekStart(week) || week}|${district}|${cafe}`;
const makeDatabaseRecordId = (...parts) => parts.filter(Boolean).join("|").replace(/\s+/g, " ").trim();
const compactValues = (values = []) => values.filter((value) => String(value || "").trim());
const selectedRowForName = (name, candidateRows = MENUWORKS_ITEMS) => findBestRowForName(name, candidateRows) || findBestRowForName(name) || makeUploadedItem(name);
const parseCaloriesNote = (note = "") => {
  const match = String(note || "").match(/Calories:\s*([0-9]+)/i);
  return match ? match[1] : "";
};
const parsePromoRecoveryNotes = (note = "") => {
  const text = String(note || "");
  const returnMode = /Return mode:\s*new/i.test(text) ? "new" : "same";
  const menuMatch = text.match(/Return menu:\s*([^;]+)/i);
  return {
    returnMode,
    returnMenu: menuMatch ? menuMatch[1].trim() : ""
  };
};
const promoRecoveryNotes = (promo = {}) => {
  const mode = promo.returnMode === "new" ? "new" : "same";
  const returnMenu = mode === "new" ? String(promo.returnMenu || "").trim() : "";
  const parts = ["Promotion override is isolated to this cafe/week. Return-to-cycle days restore coverage without changing future weeks.", `Return mode: ${mode}`];
  if (returnMenu) parts.push(`Return menu: ${returnMenu}`);
  return parts.join("; ");
};

function baseDatabaseRecord({ parentId, recordId, recordType, status, district, cafe, week, stationKey, stationDisplayName, notes }) {
  return {
    [SMARTSHEET_COLUMNS.recordId]: recordId,
    [SMARTSHEET_COLUMNS.parentRecordId]: parentId || "",
    [SMARTSHEET_COLUMNS.recordType]: recordType,
    [SMARTSHEET_COLUMNS.status]: status || "Draft",
    [SMARTSHEET_COLUMNS.district]: district || "",
    [SMARTSHEET_COLUMNS.cafeUnit]: cafe || "",
    [SMARTSHEET_COLUMNS.weekStartDate]: parseWeekStart(week),
    [SMARTSHEET_COLUMNS.weekEndDate]: parseWeekEnd(week),
    [SMARTSHEET_COLUMNS.dateRangeLabel]: week || "",
    [SMARTSHEET_COLUMNS.station]: stationKey ? (STATION_SMARTSHEET_LABELS[stationKey] || stationKey) : "",
    [SMARTSHEET_COLUMNS.stationDisplayName]: stationDisplayName || (stationKey ? stationLabel(cafe, stationKey) : ""),
    [SMARTSHEET_COLUMNS.stationKey]: stationKey || "",
    [SMARTSHEET_COLUMNS.notes]: notes || "",
  };
}

function selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey, selectionType, itemName, sortOrder, slotNumber, candidateRows }) {
  const row = selectedRowForName(itemName, candidateRows);
  const price = getPrice(row);
  const trueCost = getTrueCost(row);
  const foodCost = price ? Number(trueCost || 0) / Number(price) : null;
  return {
    ...baseDatabaseRecord({
      parentId,
      recordId: makeDatabaseRecordId(parentId, stationKey, selectionType, slotNumber, itemName),
      recordType: stationKey === "global" ? SMARTSHEET_RECORD_TYPES.globalSelection : SMARTSHEET_RECORD_TYPES.stationSelection,
      status: rotation.status || "Draft",
      district,
      cafe,
      week,
      stationKey,
    }),
    [SMARTSHEET_COLUMNS.slotNumber]: slotNumber,
    [SMARTSHEET_COLUMNS.menuConcept]: rotation.menu || "",
    [SMARTSHEET_COLUMNS.stationSubConcept]: rotation.station || "",
    [SMARTSHEET_COLUMNS.selectionType]: selectionType,
    [SMARTSHEET_COLUMNS.menuItemSelection]: getDisplayName(row) || titleCase(itemName),
    [SMARTSHEET_COLUMNS.mrn]: row.mrn || row.MRN || "",
    [SMARTSHEET_COLUMNS.portion]: row.portion || row.Portion || "",
    [SMARTSHEET_COLUMNS.menuItemSortOrder]: sortOrder,
    [SMARTSHEET_COLUMNS.price]: price ?? "",
    [SMARTSHEET_COLUMNS.trueCost]: trueCost ?? "",
    [SMARTSHEET_COLUMNS.calories]: getCalories(row) ?? "",
    [SMARTSHEET_COLUMNS.foodCostPct]: foodCost == null ? "" : Number((foodCost * 100).toFixed(1)),
    [SMARTSHEET_COLUMNS.enticingDescription]: getDescription(row),
    [SMARTSHEET_COLUMNS.dietTags]: getDiet(row),
    [SMARTSHEET_COLUMNS.allergens]: getAllergens(row),
  };
}

function buildDatabaseRecordsForRotation({ week, district, cafe, rotation }) {
  if (!week || !district || !cafe) return [];
  const parentId = rotationRecordParentId(week, district, cafe);
  const selected = selectedItems(rotation, cafe);
  const costRange = selectedTrueCostRange(selected);
  const fcRange = selectedFoodCostRange(selected);
  const header = {
    ...baseDatabaseRecord({
      parentId: "",
      recordId: parentId,
      recordType: SMARTSHEET_RECORD_TYPES.rotationHeader,
      status: rotation.status || "Draft",
      district,
      cafe,
      week,
      notes: "Generated by Culinary Tools Platform. Smartsheet column labels are database-aligned."
    }),
    [SMARTSHEET_COLUMNS.submittedBy]: rotation.submittedBy || "",
    [SMARTSHEET_COLUMNS.submittedAt]: rotation.submittedAt || "",
    [SMARTSHEET_COLUMNS.updatedBy]: rotation.submittedBy || "",
    [SMARTSHEET_COLUMNS.updatedAt]: rotation.updatedAt || "",
    [SMARTSHEET_COLUMNS.savedEntryCount]: selected.length,
    [SMARTSHEET_COLUMNS.projectedTrueCostLow]: costRange.low ?? "",
    [SMARTSHEET_COLUMNS.projectedTrueCostHigh]: costRange.high ?? "",
    [SMARTSHEET_COLUMNS.foodCostRangeLowPct]: fcRange.low == null ? "" : Number((fcRange.low * 100).toFixed(1)),
    [SMARTSHEET_COLUMNS.foodCostRangeHighPct]: fcRange.high == null ? "" : Number((fcRange.high * 100).toFixed(1)),
    [SMARTSHEET_COLUMNS.historyInclude]: true,
  };

  const cycleConfig = globalCycleConfig(cafe, week);
  const promo = rotation.promotionOverride || EMPTY_ROTATION.promotionOverride;
  const globalBlock = rotation.menu || promo.enabled ? {
    ...baseDatabaseRecord({
      parentId,
      recordId: makeDatabaseRecordId(parentId, "global-block", rotation.menu || promo.name || "promotion-override"),
      recordType: SMARTSHEET_RECORD_TYPES.globalBlock,
      status: rotation.status || "Draft",
      district,
      cafe,
      week,
      stationKey: "global",
    }),
    [SMARTSHEET_COLUMNS.menuConcept]: rotation.menu || "",
    [SMARTSHEET_COLUMNS.stationSubConcept]: rotation.station || "",
    [SMARTSHEET_COLUMNS.menuBlockLabel]: promo.enabled ? "Promotion Override" : cycleConfig.title,
    [SMARTSHEET_COLUMNS.menuBlockType]: promo.enabled ? "Promotion Override" : cycleConfig.blockType,
    [SMARTSHEET_COLUMNS.globalBlockId]: makeDatabaseRecordId(parentId, "global"),
    [SMARTSHEET_COLUMNS.globalBlockIndex]: 1,
    [SMARTSHEET_COLUMNS.globalBlockDays]: cycleConfig.days,
    [SMARTSHEET_COLUMNS.isReadOnly]: false,
    [SMARTSHEET_COLUMNS.startedPreviousWeek]: Boolean(cycleConfig.startedPreviousWeek),
    [SMARTSHEET_COLUMNS.continuesNextWeek]: Boolean(cycleConfig.continuesNextWeek),
    [SMARTSHEET_COLUMNS.nextWeekCarryoverDays]: cycleConfig.nextWeekCarryoverDays || "",
    [SMARTSHEET_COLUMNS.allowedOverlapGroup]: district === "North" && ["Cricket", "Moby"].includes(cafe) ? "North Commissary Global" : "",
    [SMARTSHEET_COLUMNS.promotionOverrideEnabled]: Boolean(promo.enabled),
    [SMARTSHEET_COLUMNS.promotionName]: promo.name || "",
    [SMARTSHEET_COLUMNS.promotionDays]: (promo.days || []).join(", "),
    [SMARTSHEET_COLUMNS.returnToCycleDays]: (promo.returnDays || []).join(", "),
    [SMARTSHEET_COLUMNS.breaksNormalCycle]: Boolean(promo.enabled),
    [SMARTSHEET_COLUMNS.cycleRecoveryNotes]: promo.enabled ? promoRecoveryNotes(promo) : "",
  } : null;

  const selectionRows = [];
  const pushSelections = (stationKey, selectionType, values, offset = 0, sourceRotation = rotation, blockId = "", candidateRows = MENUWORKS_ITEMS) => {
    compactValues(values).forEach((itemName, index) => {
      const rec = selectionDatabaseRecord({ parentId, district, cafe, week, rotation: sourceRotation, stationKey, selectionType, itemName, sortOrder: offset + index + 1, slotNumber: index + 1, candidateRows });
      if (blockId) {
        rec[SMARTSHEET_COLUMNS.globalBlockId] = makeDatabaseRecordId(parentId, "global", blockId);
        rec[SMARTSHEET_COLUMNS.menuBlockLabel] = blockId;
      }
      selectionRows.push(rec);
    });
  };
  const pushCustomSelection = (stationKey, selectionType, itemName, slotNumber, sortOrder, notes = "", candidateRows = MENUWORKS_ITEMS) => {
    if (!String(itemName || "").trim()) return;
    const rec = selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey, selectionType, itemName, sortOrder, slotNumber, candidateRows });
    if (notes) rec[SMARTSHEET_COLUMNS.notes] = notes;
    selectionRows.push(rec);
  };
  const pushCustomerMenuEdit = ({ target, itemName, slotNumber, sortOrder }) => {
    if (!String(itemName || "").trim()) return;
    const rec = selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey: "customerMenu", selectionType: SMARTSHEET_SELECTION_TYPES.customerMenuReplacement, itemName, sortOrder, slotNumber });
    rec[SMARTSHEET_COLUMNS.recordType] = SMARTSHEET_RECORD_TYPES.customerMenuEdit;
    rec[SMARTSHEET_COLUMNS.station] = "Customer Menu";
    rec[SMARTSHEET_COLUMNS.stationDisplayName] = "Bingo Customer Menu";
    rec[SMARTSHEET_COLUMNS.menuBlockLabel] = "Bingo Grill PowerPoint";
    rec[SMARTSHEET_COLUMNS.menuBlockType] = "PowerPoint Page 3";
    rec[SMARTSHEET_COLUMNS.notes] = `${target}. PowerPoint page 3. Replace highlighted text only, keep text box, font, size, and formatting, then remove highlight.`;
    selectionRows.push(rec);
  };

  const reInventBlockRows = [];
  if (cafe === "Re:Invent") {
    reInventGlobalBlockLayout(week).filter((blockInfo) => !blockInfo.readOnly).forEach((blockInfo, blockIndex) => {
      const block = getRotationGlobalBlock(rotation, blockInfo.id);
      if (!block.menu) return;
      const blockRecordId = makeDatabaseRecordId(parentId, "global", blockInfo.id);
      reInventBlockRows.push({
        ...baseDatabaseRecord({ parentId, recordId: blockRecordId, recordType: SMARTSHEET_RECORD_TYPES.globalBlock, status: rotation.status || "Draft", district, cafe, week, stationKey: "global" }),
        [SMARTSHEET_COLUMNS.menuConcept]: block.menu || "",
        [SMARTSHEET_COLUMNS.stationSubConcept]: block.station || "",
        [SMARTSHEET_COLUMNS.menuBlockLabel]: blockInfo.title,
        [SMARTSHEET_COLUMNS.menuBlockType]: blockInfo.continuesNextWeek ? "Two-Day Carryover" : "Two-Day",
        [SMARTSHEET_COLUMNS.globalBlockId]: blockRecordId,
        [SMARTSHEET_COLUMNS.globalBlockIndex]: blockIndex + 1,
        [SMARTSHEET_COLUMNS.globalBlockDays]: blockInfo.days.join(", "),
        [SMARTSHEET_COLUMNS.isReadOnly]: false,
        [SMARTSHEET_COLUMNS.startedPreviousWeek]: Boolean(blockInfo.startedPreviousWeek),
        [SMARTSHEET_COLUMNS.continuesNextWeek]: Boolean(blockInfo.continuesNextWeek),
        [SMARTSHEET_COLUMNS.nextWeekCarryoverDays]: blockInfo.continuesNextWeek ? "Next Monday" : "",
        [SMARTSHEET_COLUMNS.promotionOverrideEnabled]: Boolean(promo.enabled),
        [SMARTSHEET_COLUMNS.promotionName]: promo.name || "",
        [SMARTSHEET_COLUMNS.promotionDays]: (promo.days || []).join(", "),
        [SMARTSHEET_COLUMNS.returnToCycleDays]: (promo.returnDays || []).join(", "),
        [SMARTSHEET_COLUMNS.breaksNormalCycle]: Boolean(promo.enabled),
      });
      pushSelections("global", SMARTSHEET_SELECTION_TYPES.entree, block.entrees || [], blockIndex * 1000, block, blockInfo.id);
      pushSelections("global", SMARTSHEET_SELECTION_TYPES.side, block.sides || [], blockIndex * 1000 + 100, block, blockInfo.id);
      pushSelections("global", SMARTSHEET_SELECTION_TYPES.subRecipe, block.subRecipes || [], blockIndex * 1000 + 200, block, blockInfo.id);
      pushSelections("global", SMARTSHEET_SELECTION_TYPES.extension, block.extensions || [], blockIndex * 1000 + 300, block, blockInfo.id);
    });
  }

  const extraGlobalBlockRows = [];
  if (cafe !== "Re:Invent") {
    const blocksForSave = cafe === "Nitro" && !hasNitroSplitBlocks(rotation) && rotation.menu
      ? Object.fromEntries(nitroGlobalBlockLayout().map((block) => [block.id, hydrateNitroBlock(rotation, block.id)]))
      : (rotation.globalBlocks || {});
    Object.entries(blocksForSave || {}).forEach(([blockId, block], blockIndex) => {
      if (!block?.menu) return;
      const blockRecordId = makeDatabaseRecordId(parentId, "global", blockId);
      const meta = menuBlockMeta(blockId);
      extraGlobalBlockRows.push({
        ...baseDatabaseRecord({ parentId, recordId: blockRecordId, recordType: SMARTSHEET_RECORD_TYPES.globalBlock, status: rotation.status || "Draft", district, cafe, week, stationKey: "global" }),
        [SMARTSHEET_COLUMNS.menuConcept]: block.menu || "",
        [SMARTSHEET_COLUMNS.stationSubConcept]: block.station || "",
        [SMARTSHEET_COLUMNS.menuBlockLabel]: meta.label,
        [SMARTSHEET_COLUMNS.menuBlockType]: meta.type,
        [SMARTSHEET_COLUMNS.globalBlockId]: blockRecordId,
        [SMARTSHEET_COLUMNS.globalBlockIndex]: blockIndex + 10,
        [SMARTSHEET_COLUMNS.globalBlockDays]: meta.days,
        [SMARTSHEET_COLUMNS.isReadOnly]: false,
      });
      pushSelections("global", SMARTSHEET_SELECTION_TYPES.entree, block.entrees || [], 1600 + blockIndex * 400, block, blockId);
      pushSelections("global", SMARTSHEET_SELECTION_TYPES.side, block.sides || [], 1700 + blockIndex * 400, block, blockId);
      pushSelections("global", SMARTSHEET_SELECTION_TYPES.subRecipe, block.subRecipes || [], 1800 + blockIndex * 400, block, blockId);
      pushSelections("global", SMARTSHEET_SELECTION_TYPES.extension, block.extensions || [], 1900 + blockIndex * 400, block, blockId);
    });
  }

  if (cafe !== "Re:Invent" && cafe !== "Nitro") {
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.entree, rotation.entrees || [], 0);
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.side, rotation.sides || [], 100);
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.subRecipe, rotation.subRecipes || [], 200);
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.extension, rotation.extensions || [], 300);
  }
  pushSelections("grill", SMARTSHEET_SELECTION_TYPES.locationSpotlight, [rotation.grill?.regionalSpecial, rotation.grill?.locationSpotlight], 400);
  if (rotation.grill?.promoActive) {
    pushSelections("grill", SMARTSHEET_SELECTION_TYPES.grillPromo, [rotation.grill?.promoItem], 420);
  }
  ["salad", "pizza", "deli", "fishMarket", "freshFive", "grillFreshFive", "saladFreshFive", "soup"].forEach((stationKey, stationIndex) => {
    pushSelections(stationKey, SMARTSHEET_SELECTION_TYPES.lto, rotation.ltos?.[stationKey] || [], 500 + stationIndex * 100, rotation, "", stationPool(stationKey));
  });
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokEntree, rotation.ltos?.wokEntrees || [], 1000, rotation, "", stationPool("wokEntrees"));
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokSide, rotation.ltos?.wokSides || [], 1100, rotation, "", stationPool("wokSides"));
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokBase, rotation.ltos?.wokBase || [], 1200, rotation, "", stationPool("wokBase"));
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokSubRecipe, rotation.ltos?.wokSubRecipes || [], 1300, rotation, "", stationPool("wokSubRecipes"));
  pushSelections("lotusWp", SMARTSHEET_SELECTION_TYPES.entree, rotation.ltos?.lotusEntrees || [], 1320, rotation, "", stationPool("lotusAsianEntrees"));
  pushSelections("lotusWp", SMARTSHEET_SELECTION_TYPES.side, rotation.ltos?.lotusSides || [], 1340, rotation, "", stationPool("lotusAsianSides"));
  Object.entries(rotation.carvery || {}).filter(([, value]) => value).forEach(([field, value], index) => {
    const type = field.includes("protein") ? SMARTSHEET_SELECTION_TYPES.carveryProtein : field.includes("vegetable") ? SMARTSHEET_SELECTION_TYPES.carveryVegetable : field.includes("starch") ? SMARTSHEET_SELECTION_TYPES.carveryStarch : field.includes("hot") ? SMARTSHEET_SELECTION_TYPES.carveryHotSide : SMARTSHEET_SELECTION_TYPES.carveryColdSide;
    selectionRows.push(selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey: "carvery", selectionType: type, itemName: value, sortOrder: 1400 + index, slotNumber: index + 1 }));
  });

  const streetBeets = rotation.customStations?.streetBeets || blankCustomStations().streetBeets;
  (streetBeets.entrees || []).forEach((value, index) => pushCustomSelection("streetBeets", SMARTSHEET_SELECTION_TYPES.entree, value, index + 1, 1500 + index, streetBeets.entreeCalories?.[index] ? `Calories: ${streetBeets.entreeCalories[index]}` : ""));
  (streetBeets.sides || []).forEach((value, index) => pushCustomSelection("streetBeets", SMARTSHEET_SELECTION_TYPES.side, value, index + 1, 1510 + index, streetBeets.sideCalories?.[index] ? `Calories: ${streetBeets.sideCalories[index]}` : ""));
  (streetBeets.subRecipes || []).forEach((value, index) => pushCustomSelection("streetBeets", SMARTSHEET_SELECTION_TYPES.subRecipe, value, index + 1, 1520 + index, streetBeets.subRecipeCalories?.[index] ? `Calories: ${streetBeets.subRecipeCalories[index]}` : ""));
  (streetBeets.extensions || []).forEach((value, index) => pushCustomSelection("streetBeets", SMARTSHEET_SELECTION_TYPES.extension, value, index + 1, 1530 + index, streetBeets.extensionCalories?.[index] ? `Calories: ${streetBeets.extensionCalories[index]}` : ""));

  const commissary = rotation.customStations?.commissaryEverest || blankCustomStations().commissaryEverest;
  pushCustomSelection("commissaryEverest", SMARTSHEET_SELECTION_TYPES.menuName, commissary.menuName, 1, 1540);
  (commissary.entrees || []).forEach((value, index) => pushCustomSelection("commissaryEverest", SMARTSHEET_SELECTION_TYPES.entree, value, index + 1, 1550 + index));
  (commissary.hotSides || []).forEach((value, index) => pushCustomSelection("commissaryEverest", SMARTSHEET_SELECTION_TYPES.hotSide, value, index + 1, 1560 + index));
  (commissary.coldSides || []).forEach((value, index) => pushCustomSelection("commissaryEverest", SMARTSHEET_SELECTION_TYPES.coldSide, value, index + 1, 1570 + index));
  (commissary.rice || []).forEach((value, index) => pushCustomSelection("commissaryEverest", SMARTSHEET_SELECTION_TYPES.riceDish, value, index + 1, 1580 + index));

  const takeover = rotation.customStations?.stationTakeover || blankCustomStations().stationTakeover;
  if (takeover.enabled) {
    pushCustomSelection("stationTakeover", SMARTSHEET_SELECTION_TYPES.menuName, takeover.menuName, 1, 1590);
    (takeover.entrees || []).forEach((value, index) => pushCustomSelection("stationTakeover", SMARTSHEET_SELECTION_TYPES.entree, value, index + 1, 1600 + index));
    (takeover.sides || []).forEach((value, index) => pushCustomSelection("stationTakeover", SMARTSHEET_SELECTION_TYPES.side, value, index + 1, 1610 + index));
    (takeover.subRecipes || []).forEach((value, index) => pushCustomSelection("stationTakeover", SMARTSHEET_SELECTION_TYPES.subRecipe, value, index + 1, 1620 + index));
    (takeover.extensions || []).forEach((value, index) => pushCustomSelection("stationTakeover", SMARTSHEET_SELECTION_TYPES.extension, value, index + 1, 1630 + index));
  }

  if (cafe === "Bingo") {
    pushCustomerMenuEdit({ target: "Grill Location Spotlight edit area", itemName: rotation.grill?.regionalSpecial || rotation.grill?.locationSpotlight, slotNumber: 1, sortOrder: 1700 });
    pushCustomerMenuEdit({ target: "Grill Fresh Five edit area", itemName: rotation.ltos?.grillFreshFive?.[0], slotNumber: 2, sortOrder: 1710 });
  }

  const uploadRows = [];
  Object.entries(rotation.uploadedLtos || {}).forEach(([stationKey, items]) => {
    compactValues(items || []).forEach((itemName, index) => {
      uploadRows.push({
        ...baseDatabaseRecord({ parentId, recordId: makeDatabaseRecordId(parentId, "upload", stationKey, index + 1, itemName), recordType: SMARTSHEET_RECORD_TYPES.uploadedItem, status: rotation.status || "Draft", district, cafe, week, stationKey }),
        [SMARTSHEET_COLUMNS.uploadedItemName]: titleCase(itemName),
        [SMARTSHEET_COLUMNS.mappedStationKey]: stationKey,
        [SMARTSHEET_COLUMNS.uploadApplied]: true,
        [SMARTSHEET_COLUMNS.selectionType]: SMARTSHEET_SELECTION_TYPES.lto,
      });
    });
  });

  return [header, ...(globalBlock ? [globalBlock] : []), ...reInventBlockRows, ...extraGlobalBlockRows, ...selectionRows, ...uploadRows];
}

function upsertDatabaseRecords(existingRecords = [], nextRecords = []) {
  const parentIds = new Set(nextRecords.map((record) => record[SMARTSHEET_COLUMNS.recordId]).filter((id) => String(id || "").startsWith("rotation|")));
  nextRecords.forEach((record) => {
    if (record[SMARTSHEET_COLUMNS.parentRecordId]) parentIds.add(record[SMARTSHEET_COLUMNS.parentRecordId]);
  });
  const ids = new Set(nextRecords.map((record) => record[SMARTSHEET_COLUMNS.recordId]));
  return [
    ...existingRecords.filter((record) => {
      const recordId = record[SMARTSHEET_COLUMNS.recordId];
      const parentId = record[SMARTSHEET_COLUMNS.parentRecordId];
      return !ids.has(recordId) && !parentIds.has(recordId) && !parentIds.has(parentId);
    }),
    ...nextRecords
  ];
}

function normalizeLoadedRotationRecord(record = {}) {
  return {
    recordId: String(record[SMARTSHEET_COLUMNS.recordId] || ""),
    parentRecordId: String(record[SMARTSHEET_COLUMNS.parentRecordId] || ""),
    recordType: String(record[SMARTSHEET_COLUMNS.recordType] || ""),
    status: String(record[SMARTSHEET_COLUMNS.status] || ""),
    district: String(record[SMARTSHEET_COLUMNS.district] || ""),
    cafe: String(record[SMARTSHEET_COLUMNS.cafeUnit] || ""),
    week: String(record[SMARTSHEET_COLUMNS.dateRangeLabel] || ""),
    stationKey: String(record[SMARTSHEET_COLUMNS.stationKey] || ""),
    selectionType: String(record[SMARTSHEET_COLUMNS.selectionType] || ""),
    itemName: String(record[SMARTSHEET_COLUMNS.menuItemSelection] || record[SMARTSHEET_COLUMNS.uploadedItemName] || ""),
    slotNumber: Number(record[SMARTSHEET_COLUMNS.slotNumber] || 0),
    menuConcept: String(record[SMARTSHEET_COLUMNS.menuConcept] || ""),
    stationSubConcept: String(record[SMARTSHEET_COLUMNS.stationSubConcept] || ""),
    menuBlockLabel: String(record[SMARTSHEET_COLUMNS.menuBlockLabel] || ""),
    globalBlockId: String(record[SMARTSHEET_COLUMNS.globalBlockId] || ""),
    submittedBy: String(record[SMARTSHEET_COLUMNS.submittedBy] || ""),
    submittedAt: String(record[SMARTSHEET_COLUMNS.submittedAt] || ""),
    updatedAt: String(record[SMARTSHEET_COLUMNS.updatedAt] || ""),
    promotionOverrideEnabled: String(record[SMARTSHEET_COLUMNS.promotionOverrideEnabled] || "").toLowerCase() === "true" || record[SMARTSHEET_COLUMNS.promotionOverrideEnabled] === true,
    promotionName: String(record[SMARTSHEET_COLUMNS.promotionName] || ""),
    promotionDays: String(record[SMARTSHEET_COLUMNS.promotionDays] || "").split(",").map((value) => value.trim()).filter(Boolean),
    returnToCycleDays: String(record[SMARTSHEET_COLUMNS.returnToCycleDays] || "").split(",").map((value) => value.trim()).filter(Boolean),
    cycleRecoveryNotes: String(record[SMARTSHEET_COLUMNS.cycleRecoveryNotes] || ""),
    notes: String(record[SMARTSHEET_COLUMNS.notes] || ""),
  };
}

function recordsToRotations(records = []) {
  const grouped = {};

  const ensureRotation = (key) => {
    if (!grouped[key]) {
      grouped[key] = {
        ...EMPTY_ROTATION,
        entrees: [...EMPTY_ROTATION.entrees],
        sides: [...EMPTY_ROTATION.sides],
        subRecipes: [...EMPTY_ROTATION.subRecipes],
        extensions: [...EMPTY_ROTATION.extensions],
        grill: { ...EMPTY_ROTATION.grill },
        ltos: Object.fromEntries(Object.entries(EMPTY_ROTATION.ltos).map(([station, values]) => [station, [...values]])),
        carvery: { ...EMPTY_ROTATION.carvery },
        uploadedLtos: {},
        customStations: blankCustomStations(),
      };
    }
    return grouped[key];
  };
  const blockIdFromRecord = (record) => {
    const fromLabel = {
      "Monday + Tuesday": "monTue",
      "Wednesday + Thursday": "wedThu",
      Friday: "friCarry",
      Monday: "monCarry",
      "Tuesday + Wednesday": "tueWed",
      "Thursday + Friday": "thuFri",
      noodles: "noodles",
      "Noodle Station": "noodles",
      "Monday + Tuesday Proteins": "nitroMonTue",
      "Wednesday + Friday Proteins": "nitroWedFri"
    }[record.menuBlockLabel] || "";
    const fromGlobalId = String(record.globalBlockId || "").split("|").filter(Boolean).pop() || "";
    const fromRecordId = String(record.recordId || "").split("|").filter(Boolean).pop() || "";
    const candidate = fromGlobalId || fromRecordId || fromLabel;
    return ["monTue", "wedThu", "friCarry", "monCarry", "tueWed", "thuFri", "noodles", "nitroMonTue", "nitroWedFri"].includes(candidate) ? candidate : fromLabel;
  };
  const putSlot = (values, index, itemName) => {
    if (!Array.isArray(values) || index < 0 || index >= values.length) return;
    values[index] = itemName;
  };

  records.map(normalizeLoadedRotationRecord).forEach((record) => {
    if (!record.week || !record.district || !record.cafe) return;
    const key = rotationKey(record.week, record.district, record.cafe);
    const rotation = ensureRotation(key);

    if (record.recordType === SMARTSHEET_RECORD_TYPES.rotationHeader) {
      rotation.status = record.status || rotation.status || "Draft";
      rotation.submittedBy = record.submittedBy || rotation.submittedBy || "";
      rotation.submittedAt = record.submittedAt || rotation.submittedAt || "";
      rotation.updatedAt = record.updatedAt || rotation.updatedAt || "";
      return;
    }

    if (record.recordType === SMARTSHEET_RECORD_TYPES.globalBlock) {
      const blockId = blockIdFromRecord(record);
      if (blockId) {
        const currentBlock = rotation.globalBlocks[blockId] || blankGlobalBlock();
        rotation.globalBlocks[blockId] = {
          ...currentBlock,
          menu: record.menuConcept || currentBlock.menu || "",
          station: record.stationSubConcept || currentBlock.station || ""
        };
      } else {
      rotation.menu = record.menuConcept || rotation.menu || "";
      rotation.station = record.stationSubConcept || rotation.station || "";
      }
      rotation.status = record.status || rotation.status || "Draft";
      rotation.promotionOverride = {
        enabled: Boolean(record.promotionOverrideEnabled),
        name: record.promotionName || "",
        days: record.promotionDays || [],
        returnDays: record.returnToCycleDays || [],
        ...parsePromoRecoveryNotes(record.cycleRecoveryNotes),
      };
      return;
    }

    if (record.recordType === SMARTSHEET_RECORD_TYPES.uploadedItem) {
      const stationKey = record.stationKey || "unmatched";
      rotation.uploadedLtos[stationKey] = rotation.uploadedLtos[stationKey] || [];
      if (record.itemName && !rotation.uploadedLtos[stationKey].includes(record.itemName)) rotation.uploadedLtos[stationKey].push(record.itemName);
      return;
    }

    if (!record.itemName) return;
    const index = Math.max(0, (record.slotNumber || 1) - 1);

    if (record.stationKey === "global") {
      const blockId = blockIdFromRecord(record);
      if (blockId) {
        const block = rotation.globalBlocks[blockId] || blankGlobalBlock();
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) putSlot(block.entrees, index, record.itemName);
        else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) putSlot(block.sides, index, record.itemName);
        else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) putSlot(block.subRecipes, index, record.itemName);
        else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) putSlot(block.extensions, index, record.itemName);
        rotation.globalBlocks[blockId] = block;
        return;
      }
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) putSlot(rotation.entrees, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) putSlot(rotation.sides, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) putSlot(rotation.subRecipes, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) putSlot(rotation.extensions, index, record.itemName);
      return;
    }

    if (record.stationKey === "grill") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.regionalSpecial) rotation.grill.regionalSpecial = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.locationSpotlight) {
        if (index === 0 && !rotation.grill.regionalSpecial) rotation.grill.regionalSpecial = record.itemName;
        else rotation.grill.locationSpotlight = record.itemName;
      }
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.grillPromo) {
        rotation.grill.promoActive = true;
        rotation.grill.promoItem = record.itemName;
      }
      return;
    }

    if (record.stationKey === "wok") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokEntree) putSlot(rotation.ltos.wokEntrees, index, record.itemName);
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokSide) putSlot(rotation.ltos.wokSides, index, record.itemName);
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokBase) putSlot(rotation.ltos.wokBase, index, record.itemName);
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokSubRecipe) putSlot(rotation.ltos.wokSubRecipes, index, record.itemName);
      return;
    }

    if (record.stationKey === "carvery") {
      const carveryFieldByType = {
        [SMARTSHEET_SELECTION_TYPES.carveryProtein]: ["protein1", "protein2"],
        [SMARTSHEET_SELECTION_TYPES.carveryVegetable]: ["vegetable1", "vegetable2", "vegetable3"],
        [SMARTSHEET_SELECTION_TYPES.carveryStarch]: ["starch"],
        [SMARTSHEET_SELECTION_TYPES.carveryHotSide]: ["hotSide1"],
        [SMARTSHEET_SELECTION_TYPES.carveryColdSide]: ["coldSide1", "coldSide2"],
      };
      const fields = carveryFieldByType[record.selectionType] || [];
      const field = fields[Math.min(index, fields.length - 1)];
      if (field) rotation.carvery[field] = record.itemName;
      return;
    }

    if (record.stationKey === "streetBeets") {
      const station = rotation.customStations.streetBeets;
      const calories = parseCaloriesNote(record.notes);
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) {
        putSlot(station.entrees, index, record.itemName);
        putSlot(station.entreeCalories, index, calories);
      } else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) {
        putSlot(station.sides, index, record.itemName);
        putSlot(station.sideCalories, index, calories);
      } else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) {
        putSlot(station.subRecipes, index, record.itemName);
        putSlot(station.subRecipeCalories, index, calories);
      } else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) {
        putSlot(station.extensions, index, record.itemName);
        putSlot(station.extensionCalories, index, calories);
      }
      return;
    }

    if (record.stationKey === "commissaryEverest") {
      const station = rotation.customStations.commissaryEverest;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.menuName) station.menuName = record.itemName;
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) putSlot(station.entrees, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.hotSide) putSlot(station.hotSides, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.coldSide) putSlot(station.coldSides, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.riceDish) putSlot(station.rice, index, record.itemName);
      return;
    }

    if (record.stationKey === "stationTakeover") {
      const station = rotation.customStations.stationTakeover;
      station.enabled = true;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.menuName) station.menuName = record.itemName;
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) putSlot(station.entrees, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) putSlot(station.sides, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) putSlot(station.subRecipes, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) putSlot(station.extensions, index, record.itemName);
      return;
    }

    if (record.stationKey === "lotusWp") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) putSlot(rotation.ltos.lotusEntrees, index, record.itemName);
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) putSlot(rotation.ltos.lotusSides, index, record.itemName);
      return;
    }

    if (rotation.ltos[record.stationKey]) {
      putSlot(rotation.ltos[record.stationKey], index, record.itemName);
    }
  });

  return grouped;
}

const getItemIdentity = (row) =>
  row.item ||
  row.recipeName ||
  row.displayName ||
  row.shortName ||
  row["Recipe Name"] ||
  row["Short Name"] ||
  "";

const normalizeItemName = (value = "") => String(value || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
const getItemAliases = (row) => [
  row.item,
  row.recipeName,
  row.displayName,
  row.shortName,
  row["Recipe Name"],
  row["Short Name"]
].map(normalizeItemName).filter(Boolean);

const getDisplayName = (row) => titleCase(row.displayName || row.shortName || row.item || row.recipeName || row["Recipe Name"] || "");
const getMenuName = (row) => row.menu || row.menuName || row["Menu Name"] || "";
const getStationName = (row) => row.station || row.stationName || row["Station"] || "";
const getPrice = (row) => row.price ?? row.sellPrice ?? row["Sell Price"] ?? null;
const getTrueCost = (row) => row.trueCost ?? row.itemCostWithWaste ?? row["Item + Waste Cost"] ?? row["Recipe Cost"] ?? row.recipeCost ?? null;
const getNumericValue = (...values) => {
  for (const raw of values) {
    const value = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
};
const getCalories = (row) => {
  const value = getNumericValue(
    row.calories,
    row.calorie,
    row.kcal,
    row.kCal,
    row.energyCalories,
    row.caloriesPerServing,
    row.nutritionCalories,
    row.Calories,
    row["Calories"],
    row["Calories."],
    row["Calories Per Serving"],
    row["Calories per Serving"],
    row["kcal"],
    row["Kcal"],
    row["Energy (kcal)"],
    row["Energy Calories"]
  );
  if (value == null) return null;
  return Math.round(value / 5) * 5;
};
const getSuggestedRetailPrice = (row) => {
  const raw = row.suggestedRetailPrice ?? row.retailPrice ?? row.suggestedPrice ?? row.price ?? row.sellPrice ?? row["Suggested Retail Price"] ?? row["Retail Price"] ?? row["Sell Price"] ?? null;
  const value = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
};
const getCategory = (row) => String(row.category || row.itemType || row["Item Type"] || row.classification || "").toLowerCase();
const isGlobalMenuOption = (menu = "") =>
  /^AMZ\+RA:/i.test(menu) ||
  !/Cafe Express|Carvery|Fish Market|Fresh Five|Grill Core|Pizzas? & Flatbreads?|Soup/i.test(menu);
const allowsSubConcept = (menu = "") => /Street Eats/i.test(menu);
const NOODLE_MENU_PATTERN = /noodle|wok|ramen|pho|lo mein|yakisoba|udon|soba/i;
const GLOBAL_MENU_ROWS_CACHE = new Map();
const SUB_CONCEPT_OPTIONS_CACHE = new Map();
const STATION_POOL_CACHE = new Map();
const BEST_ROW_BY_NAME_CACHE = new Map();
let POTATO_SIDES_CACHE = null;
let CARVERY_HOT_SIDES_CACHE = null;
let CARVERY_COLD_SIDES_CACHE = null;
const globalMenuRows = (menu = "", station = "") => {
  const key = `${menu}|${station}`;
  if (!GLOBAL_MENU_ROWS_CACHE.has(key)) {
    GLOBAL_MENU_ROWS_CACHE.set(key, MENUWORKS_ITEMS.filter((row) => getMenuName(row) === menu && (!allowsSubConcept(menu) || !station || getStationName(row) === station)));
  }
  return GLOBAL_MENU_ROWS_CACHE.get(key);
};
const subConceptOptionsForMenu = (menu = "") => {
  if (!allowsSubConcept(menu)) return [];
  if (!SUB_CONCEPT_OPTIONS_CACHE.has(menu)) {
    SUB_CONCEPT_OPTIONS_CACHE.set(menu, Array.from(new Set(MENUWORKS_ITEMS.filter((row) => getMenuName(row) === menu).map((row) => getStationName(row)).filter(Boolean))).sort());
  }
  return SUB_CONCEPT_OPTIONS_CACHE.get(menu);
};
const noodleMenuOptions = () =>
  Array.from(new Set(MENUWORKS_ITEMS
    .filter((row) => NOODLE_MENU_PATTERN.test(`${getMenuName(row)} ${getStationName(row)} ${getItemIdentity(row)}`))
    .map((row) => getMenuName(row))
    .filter(Boolean)))
    .sort()
    .map((menu) => ({ item: menu, displayName: menu, menu: "Day 1 Noodle Station", station: "Noodles", category: "entree", dataSource: "planner-menu-option" }));
const getDescription = (row) =>
  row.enticingDescription ||
  row.description ||
  row["Enticing Description"] ||
  row.ingredientsCommonName ||
  row.ingredients ||
  row.menuItemNotes ||
  "";
const isEnhancedMenuWorksRow = (row) => /enhanced|menuworks-truth|menuworks-user-upload/i.test(String(row.dataSource || ""));
const getAllergens = (row) => {
  if (row.allergenDetails && typeof row.allergenDetails === "object") {
    return Object.entries(row.allergenDetails)
      .filter(([, value]) => /yes|contains|at risk/i.test(String(value || "").trim()))
      .map(([allergen, value]) => String(value).toLowerCase().includes("at risk") ? `${allergen} (At Risk)` : allergen)
      .join(", ");
  }
  if (Array.isArray(row.allergens) && row.allergens.length) return row.allergens.join(", ");
  if (typeof row.allergens === "string" && row.allergens.trim()) return row.allergens;
  if (typeof row.allergenSummary === "string" && row.allergenSummary.trim()) {
    return row.allergenSummary
      .split(",")
      .map((value) => value.replace(/^contains\s+/i, "").trim())
      .filter(Boolean)
      .join(", ");
  }
  if (typeof row["Allergens"] === "string" && row["Allergens"].trim()) return row["Allergens"];
  return "";
};
const isAllergenDataMissing = (row) => !getAllergens(row) && !isEnhancedMenuWorksRow(row);
const isSourceDetailMissing = (row) => !getDescription(row) || isAllergenDataMissing(row);
const stationAnchorId = (stationKey) => `station-section-${stationKey}`;
const stationLabel = (cafe, stationKey) => {
  if (cafe === "Doppler" && stationKey === "global") return "Wok Xahn";
  if (cafe === "Day 1" && stationKey === "grill") return "Adelaide's";
  return STATION_LABELS[stationKey] || stationKey;
};

function getDiet(row) {
  const normalize = (value) => {
    if (Array.isArray(value)) return value.join(" ");
    if (typeof value === "boolean") return value ? "true" : "";
    return String(value || "");
  };

  const combined = [
    row.veganTag,
    row.vegetarianTag,
    row.vegan,
    row.vegetarian,
    row.diet,
    row.dietTag,
    row.dietary,
    row.dietaryTags,
    row.smartTags,
    row.tags,
    row.attributes,
    row.dietaryPreference,
    row.dietaryPreferences,
    row.menuTags,
    row.itemTags,
    row.smartTagNames,
    row.itemAttributes
  ].map(normalize).filter(Boolean).join(" ").toLowerCase();

  const name = String(getItemIdentity(row)).toLowerCase();
  const description = String(getDescription(row)).toLowerCase();
  const text = `${name} ${description}`;

  if (row.vegan === true || combined.includes("vegan") || combined.includes("plant-based") || combined.includes("plant based")) return "Vegan";
  if (row.vegetarian === true || combined.includes("vegetarian")) return "Vegetarian";
  if (text.includes("vegan") || text.includes("plant-based") || text.includes("plant based")) return "Vegan";
  if (text.includes("vegetarian")) return "Vegetarian";
  return "";
}

function uniqueRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const identity = getItemIdentity(row);
    const key = `${identity}`.toLowerCase() + "|" + (row.mrn || row.MRN || "") + "|" + (row.portion || row.Portion || "");
    if (!identity || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueOptionRows(rows) {
  const byName = new Map();
  rows.filter(Boolean).forEach((row) => {
    const key = normalizeItemName(getDisplayName(row) || getItemIdentity(row));
    if (!key) return;
    const current = byName.get(key);
    if (!current || itemDetailScore(row) > itemDetailScore(current)) {
      byName.set(key, row);
    }
  });
  return Array.from(byName.values()).sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
}

function isPriced(row) {
  return getPrice(row) != null && !Number.isNaN(Number(getPrice(row)));
}

function isEntree(row) {
  const price = Number(getPrice(row));
  const category = getCategory(row);
  return category.includes("entree") || category.includes("entrée") || category.includes("plate") || category.includes("main") || price >= 9;
}

function isSide(row) {
  const price = Number(getPrice(row));
  const category = getCategory(row);
  return category.includes("side") || (!category.includes("extension") && isPriced(row) && price < 9);
}

function isSubRecipe(row) {
  const category = getCategory(row);
  return category.includes("sub") || getPrice(row) == null;
}

function isExtension(row) {
  const text = `${getItemIdentity(row)} ${getMenuName(row)} ${getStationName(row)}`.toLowerCase();
  const category = getCategory(row);
  return category.includes("extension") || /cookie|cake|dessert|lassi|beverage|drink|chips|salsa|guacamole|queso/.test(text);
}

function normalizeImportedStation(stationName = "") {
  const value = String(stationName).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (/wok|global|xhan|xahn/.test(value)) return "global";
  if (/zanes|zane|salad/.test(value)) return "salad";
  if (/pizza|flatbread/.test(value)) return "pizza";
  if (/sandwich|deli/.test(value)) return "deli";
  if (/adelaide|adelaides|grill/.test(value)) return "grill";
  if (/fish/.test(value)) return "fishMarket";
  if (/carvery|carve/.test(value)) return "carvery";
  if (/fresh|five|\$5/.test(value)) return "freshFive";
  if (/soup|chili|bisque|chowder/.test(value)) return "soup";
  return "unmatched";
}

function makeUploadedItem(name) {
  return {
    id: `uploaded-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    menu: "Uploaded Week at a Glance",
    station: "Week at a Glance",
    item: name,
    mrn: "—",
    portion: "—",
    price: null,
    trueCost: null,
    category: "uploaded",
    enticingDescription: "Imported from Week at a Glance report. Match to MenuWorks database for full cost, description, and allergen detail.",
    allergens: ""
  };
}

function makePlanningOption(name, { menu = "Planner Requested Item", station = "Manual Option", category = "entree" } = {}) {
  return {
    id: `planner-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    menu,
    station,
    item: name,
    displayName: name,
    mrn: "pending",
    portion: "pending",
    price: null,
    trueCost: null,
    category,
    enticingDescription: "Planner requested option. Add MenuWorks cost, description, and allergen detail when available.",
    allergens: "",
    dataSource: "planner-requested-option"
  };
}

function categorize(items) {
  const rows = uniqueRows(items);
  return {
    entrees: rows.filter((row) => isPriced(row) && isEntree(row)),
    sides: rows.filter((row) => isPriced(row) && isSide(row)),
    subRecipes: rows.filter((row) => isSubRecipe(row)),
    extensions: rows.filter((row) => isPriced(row) && isExtension(row))
  };
}

function textForRow(row) {
  return `${getMenuName(row)} ${getStationName(row)} ${getItemIdentity(row)} ${row.enticingDescription || ""} ${row.description || ""} ${row.menuItemNotes || ""} ${row.recipeCategory || ""} ${row.recipeProductionArea || ""}`.toLowerCase();
}

function notesForRow(row) {
  return `${row.menuItemNotes || ""} ${row.recipeCategory || ""} ${row.recipeProductionArea || ""}`.toLowerCase();
}

function isMenu(row, menuName) {
  return getMenuName(row).toLowerCase() === String(menuName).toLowerCase();
}

function stationIncludes(row, pattern) {
  return pattern.test(getStationName(row));
}

function carveryRows() {
  return MENUWORKS_ITEMS.filter((row) => isMenu(row, "AMZ: Carvery"));
}

function isCarveryProteinOption(row) {
  if (!isMenu(row, "AMZ: Carvery") || !isEntree(row)) return false;
  const station = getStationName(row).toLowerCase();
  const notes = notesForRow(row);
  if (/sandwich|wrap|panini|reuben|a la carte/.test(station) || /sandwich served a la carte/.test(notes)) return false;
  return station === "premium mains" || /carvery protein/.test(notes);
}

function isCarveryVegetableOption(row) {
  if (!isMenu(row, "AMZ: Carvery")) return false;
  const station = getStationName(row).toLowerCase();
  const notes = notesForRow(row);
  if (station !== "vegetarian mains") return false;
  return /charred vegetable option/.test(notes) || (/vegetable/.test(notes) && !/entree served with two sides|entree and two sides/.test(notes));
}

function isCarverySideOption(row) {
  if (!isMenu(row, "AMZ: Carvery")) return false;
  const station = getStationName(row).toLowerCase();
  const notes = notesForRow(row);
  if (station !== "sides") return false;
  return isSide(row) || /side choice|carvery cold side|carvery hot side|a la carte and side/.test(notes);
}

function carveryDetailRows() {
  return uniqueOptionRows([
    ...carveryRows().filter((row) => isCarveryProteinOption(row) || isCarveryVegetableOption(row) || isCarverySideOption(row)),
    ...stationPool("carveryProtein"),
    ...stationPool("carveryVegetable"),
    ...stationPool("carverySide")
  ]);
}

function stationPool(stationKey) {
  if (STATION_POOL_CACHE.has(stationKey)) return STATION_POOL_CACHE.get(stationKey);
  const carveryRequestedProteins = [
    "Lemon Brined Turkey",
    "Crispy Pork Belly",
    "Seared Steelhead Trout",
    "Char Siu Pork",
    "Grilled Flank Steak"
  ].map((name) => makePlanningOption(name, { menu: "AMZ: Carvery", station: "Premium Mains", category: "entree" }));
  const carveryRequestedVegetables = [
    "Grilled Vegetables",
    "Charred Broccoli",
    "Roasted Carrots",
    "Charred Green Beans",
    "Roasted Cauliflower",
    "Grilled Asparagus",
    "Roasted Brussels Sprouts"
  ].map((name) => makePlanningOption(name, { menu: "AMZ: Carvery", station: "Vegetable Carvery", category: "side" }));
  const all = MENUWORKS_ITEMS.filter(Boolean);
  const byMenu = (needle) => all.filter((row) => getMenuName(row).toLowerCase().includes(needle));
  const byStation = (needle) => all.filter((row) => getStationName(row).toLowerCase().includes(needle));
  const byMenuPattern = (regex) => all.filter((row) => regex.test(getMenuName(row)));
  const byStationPattern = (regex) => all.filter((row) => regex.test(getStationName(row)));
  const byText = (regex) => all.filter((row) => regex.test(textForRow(row)));
  const scoped = (strictRows, fallbackRows = []) => uniqueOptionRows(strictRows.length ? strictRows : fallbackRows);
  const exactMenuRows = (menuName) => all.filter((row) => isMenu(row, menuName));

  const pools = {
    salad: exactMenuRows("AMZ: Cafe Express Curated Salads").filter((row) => isEntree(row)),
    pizza: exactMenuRows("AMZ: Pizzas & Flatbreads").filter((row) => isEntree(row)),
    deli: exactMenuRows("AMZ: Cafe Express Curated Sandwiches").filter((row) => isEntree(row)),
    fishMarket: exactMenuRows("AMZ: Fish Market")
      .filter((row) => (getMenuName(row).toLowerCase().includes("fish market") || getStationName(row).toLowerCase().includes("fish market")) && isEntree(row)),
    freshFive: exactMenuRows("AMZ: Fresh Five"),
    grillFreshFive: exactMenuRows("AMZ: Fresh Five"),
    saladFreshFive: exactMenuRows("AMZ: Fresh Five"),
    soup: exactMenuRows("AMZ: Cafe Express Soup"),
    wokEntrees: exactMenuRows("AMZ: Wok").filter((row) => isEntree(row)),
    wokSides: exactMenuRows("AMZ: Wok").filter((row) => isSide(row)),
    wokBase: exactMenuRows("AMZ: Wok").filter((row) => isSide(row) && /rice|noodle|lo mein|base/i.test(getItemIdentity(row))),
    wokSubRecipes: uniqueOptionRows(all.filter((row) => isSubRecipe(row))),
    lotusAsianEntrees: uniqueOptionRows(all.filter((row) => /^(AMZ\+RA: Q Bowl|AMZ\+RA: Sushi|AMZ: Atlas Noodle|AMZ: Bibimbowl|AMZ: Bowl Inc|AMZ: Lotus|AMZ: Pho|AMZ: Wok|AMZ: House of Teriyaki|AMZ: La Chino|AMZ: Lemongrass \+ Lime|AMZ: Poke Counter|AMZ: Yakisoba)$/.test(getMenuName(row)) && isEntree(row))),
    lotusAsianSides: uniqueOptionRows(all.filter((row) => /^(AMZ\+RA: Q Bowl|AMZ\+RA: Sushi|AMZ: Atlas Noodle|AMZ: Bibimbowl|AMZ: Bowl Inc|AMZ: Lotus|AMZ: Pho|AMZ: Wok|AMZ: House of Teriyaki|AMZ: La Chino|AMZ: Lemongrass \+ Lime|AMZ: Poke Counter|AMZ: Yakisoba)$/.test(getMenuName(row)) && isSide(row))),
    carveryProtein: uniqueOptionRows([
      ...carveryRows().filter(isCarveryProteinOption),
      ...carveryRequestedProteins
    ]),
    carveryVegetable: uniqueOptionRows([
      ...carveryRows().filter(isCarveryVegetableOption),
      ...carveryRequestedVegetables
    ]),
    carverySide: uniqueOptionRows(carveryRows().filter(isCarverySideOption))
  };

  const pool = pools[stationKey] || [];
  if (pool.length) {
    STATION_POOL_CACHE.set(stationKey, pool);
    return pool;
  }

  if (["freshFive", "grillFreshFive", "saladFreshFive", "salad", "pizza", "deli", "fishMarket", "soup"].includes(stationKey)) {
    const fallback = uniqueOptionRows(all.filter((row) => isEntree(row) || isSide(row)));
    STATION_POOL_CACHE.set(stationKey, fallback);
    return fallback;
  }

  const fallback = uniqueOptionRows(all);
  STATION_POOL_CACHE.set(stationKey, fallback);
  return fallback;
}

function stationSlots(cafe, stationKey) {
  const override = {
    Dawson: { freshFive: 5 },
    Nessie: { freshFive: 5 },
    Cricket: { freshFive: 5 },
    Moby: { deli: 4, salad: 4, freshFive: 2 },
    Commissary: { deli: 4, salad: 3, freshFive: 2, soup: 2 },
    Atlas: { freshFive: 2 },
    Frontier: { freshFive: 2 },
    Nitro: { pizza: 3 },
    Astra: { freshFive: 2 },
    Grace: { freshFive: 2, salad: 2 },
    Sonic: { freshFive: 2, salad: 5, deli: 4 },
    Bingo: { fishMarket: 2, salad: 2, grillFreshFive: 1, saladFreshFive: 1 },
    Blueshift: { salad: 5, deli: 4, fishMarket: 2, freshFive: 2 },
    Eclipse: { freshFive: 2 }
  }[cafe]?.[stationKey];

  if (override) return override;
  if (stationKey === "fishMarket") return 1;
  if (["salad", "pizza", "deli", "soup"].includes(stationKey)) return 2;
  if (stationKey === "freshFive") return 5;
  return 1;
}

function stationRequiredCount(cafe, stationKey) {
  const required = {
    Astra: { grill: 0, freshFive: 2 },
    Grace: { grill: 1, freshFive: 2, salad: 2 },
    Sonic: { grill: 1, freshFive: 2, salad: 5, deli: 4 },
    Bingo: { fishMarket: 2, grill: 1, grillFreshFive: 1, salad: 2, saladFreshFive: 1, commissaryEverest: 1 },
    Blueshift: { lotusWp: 1, grill: 1, salad: 5, deli: 4, fishMarket: 2, freshFive: 2 },
    Eclipse: { stationTakeover: 0, freshFive: 2 }
  }[cafe]?.[stationKey];
  if (required != null) return required;
  return stationKey === "stationTakeover" ? 0 : 1;
}

function globalSlotConfig(cafe = "") {
  const base = { entreeSlots: 3, entreeRequired: 2, sideSlots: 4, sideRequired: 0, subRecipeSlots: 4, extensionSlots: 2 };
  const eastNormal = { entreeSlots: 3, entreeRequired: 2, sideSlots: 4, sideRequired: 2, subRecipeSlots: 3, extensionSlots: 2 };
  return {
    Astra: { entreeSlots: 2, entreeRequired: 2, sideSlots: 3, sideRequired: 2, subRecipeSlots: 2, extensionSlots: 1 },
    Grace: eastNormal,
    Sonic: eastNormal,
    Bingo: eastNormal,
    Blueshift: eastNormal,
    Eclipse: { entreeSlots: 2, entreeRequired: 2, sideSlots: 4, sideRequired: 2, subRecipeSlots: 3, extensionSlots: 2 }
  }[cafe] || base;
}

function sizedValues(values = [], length = 0) {
  return Array.from({ length }, (_, index) => values[index] || "");
}

const GLOBAL_CYCLE_DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Next Monday", "Next Tuesday"];

function globalCycleConfig(cafe, week = "") {
  if (cafe === "Doppler") {
    return {
      title: "Doppler Wednesday–Tuesday Global Cycle",
      summary: "Doppler changes Global every Wednesday. Monday and Tuesday are carryover from the prior Wednesday cycle; Wednesday starts the next cycle through the following Tuesday.",
      chips: [
        { label: "Mon + Tue", note: "carryover", tone: "indigo" },
        { label: "Wed–Tue", note: "new cycle", tone: "sky" },
      ],
      blockType: "Wednesday Cycle",
      days: "Wednesday, Thursday, Friday, Next Monday, Next Tuesday",
      startedPreviousWeek: true,
      continuesNextWeek: true,
      nextWeekCarryoverDays: "Next Monday, Next Tuesday",
    };
  }
  if (cafe === "Re:Invent") {
    const fridayConnectsToMonday = isReInventFridayMondayWeek(week);
    return fridayConnectsToMonday
      ? {
          title: "Re:Invent 2-Day Global Cycle",
          summary: "Re:Invent changes Global every two business days. This is the alternating week where Friday connects to the following Monday.",
          chips: [
            { label: "Mon + Tue", note: "block 1", tone: "sky" },
            { label: "Wed + Thu", note: "block 2", tone: "sky" },
            { label: "Fri + Mon", note: "carryover", tone: "indigo" },
          ],
          blockType: "Two-Day",
          days: "Monday, Tuesday | Wednesday, Thursday | Friday, Next Monday",
          startedPreviousWeek: false,
          continuesNextWeek: true,
          nextWeekCarryoverDays: "Next Monday",
        }
      : {
          title: "Re:Invent 2-Day Global Cycle",
          summary: "Re:Invent changes Global every two business days. This is the alternating recovery week: Monday carries from last Friday, then Tuesday–Wednesday and Thursday–Friday are the selectable blocks.",
          chips: [
            { label: "Mon", note: "carryover", tone: "indigo" },
            { label: "Tue + Wed", note: "block 1", tone: "sky" },
            { label: "Thu + Fri", note: "block 2", tone: "sky" },
          ],
          blockType: "Two-Day",
          days: "Monday carryover | Tuesday, Wednesday | Thursday, Friday",
          startedPreviousWeek: true,
          continuesNextWeek: false,
          nextWeekCarryoverDays: "",
        };
  }
  return {
    title: "Weekly Global Cycle",
    summary: "This café uses one Global menu for the selected week unless a promotion override is needed.",
    chips: [{ label: "Mon–Fri", note: "weekly", tone: "sky" }],
    blockType: "Weekly",
    days: "Monday, Tuesday, Wednesday, Thursday, Friday",
    startedPreviousWeek: false,
    continuesNextWeek: false,
    nextWeekCarryoverDays: "",
  };
}

function cycleChipClass(tone) {
  if (tone === "indigo") return "bg-indigo-50 border-indigo-200 text-indigo-800";
  if (tone === "purple") return "bg-purple-50 border-purple-200 text-purple-800";
  if (tone === "amber") return "bg-amber-50 border-amber-200 text-amber-800";
  return "bg-sky-50 border-sky-200 text-sky-800";
}

function updateArrayToggle(values = [], value) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function blankGlobalBlock(menu = "", station = "") {
  return { menu, station, entrees: ["", "", ""], sides: ["", "", "", ""], subRecipes: ["", "", "", ""], extensions: ["", ""] };
}

function reInventGlobalBlockLayout(week = "") {
  const fridayCarriesToNextMonday = isReInventFridayMondayWeek(week);
  return fridayCarriesToNextMonday
    ? [
        { id: "monTue", title: "Monday + Tuesday", days: ["Monday", "Tuesday"], readOnly: false, help: "Select the Global menu for Monday and Tuesday." },
        { id: "wedThu", title: "Wednesday + Thursday", days: ["Wednesday", "Thursday"], readOnly: false, help: "Select the Global menu for Wednesday and Thursday." },
        { id: "friCarry", title: "Friday", days: ["Friday", "Next Monday"], readOnly: false, continuesNextWeek: true, help: "Select Friday's Global. This carries into the following Monday." },
      ]
    : [
        { id: "monCarry", title: "Monday", days: ["Monday"], readOnly: true, startedPreviousWeek: true, help: "Information only. Monday continues from the prior Friday Global once Smartsheet data is loaded." },
        { id: "tueWed", title: "Tuesday + Wednesday", days: ["Tuesday", "Wednesday"], readOnly: false, help: "Select the Global menu for Tuesday and Wednesday." },
        { id: "thuFri", title: "Thursday + Friday", days: ["Thursday", "Friday"], readOnly: false, help: "Select the Global menu for Thursday and Friday." },
      ];
}

function nitroGlobalBlockLayout() {
  return [
    { id: "nitroMonTue", title: "Monday + Tuesday Proteins", days: ["Monday", "Tuesday"], help: "Select the Global item mix Nitro runs before the Wednesday protein change." },
    { id: "nitroWedFri", title: "Wednesday + Friday Proteins", days: ["Wednesday", "Thursday", "Friday"], help: "Select the Global item mix Nitro runs after the Wednesday protein change." }
  ];
}

function menuBlockMeta(blockId) {
  if (blockId === "noodles") return { label: "Noodle Station", type: "Secondary Global", days: "Monday, Tuesday, Wednesday, Thursday, Friday" };
  const nitroBlock = nitroGlobalBlockLayout().find((block) => block.id === blockId);
  if (nitroBlock) return { label: nitroBlock.title, type: "Nitro Same-Menu Split", days: nitroBlock.days.join(", ") };
  return { label: titleCase(blockId), type: "Additional Global", days: "" };
}

function blockComplete(block) {
  return Boolean(block?.menu && (block?.entrees || []).filter(Boolean).length >= 2);
}

function getRotationGlobalBlock(rotation, blockId) {
  return rotation.globalBlocks?.[blockId] || blankGlobalBlock();
}

function blockHasSelections(block = {}) {
  return ["entrees", "sides", "subRecipes", "extensions"].some((key) => (block?.[key] || []).some(Boolean));
}

function hasNitroSplitBlocks(rotation = {}) {
  return nitroGlobalBlockLayout().some((block) => {
    const value = getRotationGlobalBlock(rotation, block.id);
    return Boolean(value?.menu || blockHasSelections(value));
  });
}

function hydrateNitroBlock(rotation = {}, blockId = "") {
  const block = getRotationGlobalBlock(rotation, blockId);
  if (block.menu || blockHasSelections(block)) return block;
  if (!rotation.menu && !blockHasSelections(rotation)) return blankGlobalBlock();
  return {
    menu: rotation.menu || "",
    station: rotation.station || "",
    entrees: rotation.entrees || [...EMPTY_ROTATION.entrees],
    sides: rotation.sides || [...EMPTY_ROTATION.sides],
    subRecipes: rotation.subRecipes || [...EMPTY_ROTATION.subRecipes],
    extensions: rotation.extensions || [...EMPTY_ROTATION.extensions],
  };
}

function carryoverGlobalBlock(rotation = {}, preferredBlockId = "") {
  const blocks = rotation.globalBlocks || {};
  const candidates = [preferredBlockId, "friCarry", "thuFri", "monTue", "wedThu", "tueWed"].filter(Boolean);
  for (const blockId of candidates) {
    if (blocks[blockId]?.menu) return blocks[blockId];
  }
  if (rotation.menu) {
    return {
      menu: rotation.menu,
      station: rotation.station || "",
      entrees: rotation.entrees || [],
      sides: rotation.sides || [],
      subRecipes: rotation.subRecipes || [],
      extensions: rotation.extensions || [],
    };
  }
  return blankGlobalBlock();
}

function rotationMenuLabel(rotation = {}) {
  if (rotation.menu) return rotation.menu;
  const blockMenus = Object.values(rotation.globalBlocks || {}).map((block) => block?.menu).filter(Boolean);
  return blockMenus.length ? Array.from(new Set(blockMenus)).join(" / ") : "";
}

function hasRotationMenu(rotation = {}) {
  return Boolean(rotationMenuLabel(rotation));
}

function potatoSides() {
  if (POTATO_SIDES_CACHE) return POTATO_SIDES_CACHE;
  POTATO_SIDES_CACHE = uniqueRows(stationPool("carverySide").filter((row) => {
    const name = String(getItemIdentity(row)).toLowerCase();
    return isSide(row) && /potato|potatoes|fries|tots|hash brown|mashed|fingerling|yukon|russet|sweet potato/.test(name);
  }));
  return POTATO_SIDES_CACHE;
}

function carverySideTemperature(row) {
  const text = textForRow(row);
  if (/salad|slaw|coleslaw|cold|chilled|pickle|pickled|crudite|fruit|pasta salad|potato salad|cucumber|tomato salad/.test(text)) return "cold";
  if (/roasted|grilled|sauteed|sautéed|steamed|braised|mashed|fried|fries|tots|hash brown|rice|beans|mac|gratin|warm|hot|baked|vegetable|broccoli|carrot|green bean|cauliflower|brussels|squash|zucchini|asparagus|corn/.test(text)) return "hot";
  return "unknown";
}

function carveryHotSides() {
  if (CARVERY_HOT_SIDES_CACHE) return CARVERY_HOT_SIDES_CACHE;
  const sides = stationPool("carverySide").filter((row) => carverySideTemperature(row) !== "cold");
  CARVERY_HOT_SIDES_CACHE = sides.length ? uniqueRows(sides) : stationPool("carverySide");
  return CARVERY_HOT_SIDES_CACHE;
}

function carveryColdSides() {
  if (CARVERY_COLD_SIDES_CACHE) return CARVERY_COLD_SIDES_CACHE;
  const sides = stationPool("carverySide").filter((row) => carverySideTemperature(row) !== "hot");
  CARVERY_COLD_SIDES_CACHE = sides.length ? uniqueRows(sides) : stationPool("carverySide");
  return CARVERY_COLD_SIDES_CACHE;
}

function blankRotation(menu = "", station = "") {
  return {
    ...EMPTY_ROTATION,
    menu,
    station,
    entrees: [...EMPTY_ROTATION.entrees],
    sides: [...EMPTY_ROTATION.sides],
    subRecipes: [...EMPTY_ROTATION.subRecipes],
    extensions: [...EMPTY_ROTATION.extensions],
    grill: { regionalSpecial: "", locationSpotlight: "", promoActive: false, promoItem: "" },
    ltos: Object.fromEntries(Object.entries(EMPTY_ROTATION.ltos).map(([key, values]) => [key, [...values]])),
    carvery: { ...EMPTY_ROTATION.carvery },
    uploadedLtos: {},
    promotionOverride: { enabled: false, name: "", days: [], returnDays: [], returnMode: "same", returnMenu: "" },
    globalBlocks: {},
    customStations: blankCustomStations(),
    status: "Draft",
    submittedBy: "",
    updatedAt: "",
    submittedAt: ""
  };
}

function nowStamp() {
  return new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function filledCount(values = []) {
  return values.filter((value) => String(value || "").trim()).length;
}

function streetBeetsComplete(station = blankCustomStations().streetBeets) {
  const allNamedFields = [
    ["entrees", "entreeCalories"],
    ["sides", "sideCalories"],
    ["subRecipes", "subRecipeCalories"],
    ["extensions", "extensionCalories"]
  ];
  const everyFilledNameHasCalories = allNamedFields.every(([nameKey, calorieKey]) =>
    (station[nameKey] || []).every((value, index) => !String(value || "").trim() || String(station[calorieKey]?.[index] || "").trim())
  );
  return filledCount(station.entrees) >= 2 && filledCount(station.sides) >= 3 && everyFilledNameHasCalories;
}

function commissaryEverestComplete(station = blankCustomStations().commissaryEverest) {
  return Boolean(String(station.menuName || "").trim() && filledCount(station.entrees) >= 2 && filledCount(station.coldSides) >= 4 && filledCount(station.rice) >= 1);
}

function stationTakeoverComplete(station = blankCustomStations().stationTakeover) {
  if (!station.enabled) return true;
  return Boolean(String(station.menuName || "").trim() && (filledCount(station.entrees) || filledCount(station.sides)));
}

function stationComplete(rotation, stationKey, cafe = "", week = "") {
  if (stationKey === "global" && cafe === "Re:Invent") {
    return reInventGlobalBlockLayout(week).filter((block) => !block.readOnly).every((block) => blockComplete(getRotationGlobalBlock(rotation, block.id)));
  }
  if (stationKey === "global" && cafe === "Nitro") {
    if (!hasNitroSplitBlocks(rotation)) return Boolean(rotation.menu && (rotation.entrees || []).filter(Boolean).length >= 2);
    return Boolean(rotation.menu) && nitroGlobalBlockLayout().every((block) => blockComplete(hydrateNitroBlock(rotation, block.id)));
  }
  if (stationKey === "global") {
    const config = globalSlotConfig(cafe);
    return Boolean(
      rotation.menu &&
      (rotation.entrees || []).filter(Boolean).length >= config.entreeRequired &&
      (rotation.sides || []).filter(Boolean).length >= config.sideRequired
    );
  }
  if (stationKey === "noodles") return blockComplete(getRotationGlobalBlock(rotation, "noodles"));
  if (stationKey === "grill") return stationRequiredCount(cafe, stationKey) === 0 || Boolean(rotation.grill?.regionalSpecial || rotation.grill?.locationSpotlight || (rotation.grill?.promoActive && rotation.grill?.promoItem));
  if (["salad", "pizza", "deli", "fishMarket", "freshFive", "grillFreshFive", "saladFreshFive", "soup"].includes(stationKey)) {
    const required = stationRequiredCount(cafe, stationKey);
    if (required === 0) return true;
    return [...(rotation.ltos?.[stationKey] || []), ...(rotation.uploadedLtos?.[stationKey] || [])].filter(Boolean).length >= required;
  }
  if (stationKey === "wok") return Boolean((rotation.ltos?.wokEntrees || []).some(Boolean));
  if (stationKey === "lotusWp") return (rotation.ltos?.lotusEntrees || []).filter(Boolean).length >= 2 && (rotation.ltos?.lotusSides || []).filter(Boolean).length >= 4;
  if (stationKey === "streetBeets") return streetBeetsComplete(rotation.customStations?.streetBeets);
  if (stationKey === "commissaryEverest") return commissaryEverestComplete(rotation.customStations?.commissaryEverest);
  if (stationKey === "stationTakeover") return stationTakeoverComplete(rotation.customStations?.stationTakeover);
  if (stationKey === "carvery") return Boolean(Object.values(rotation.carvery || {}).some(Boolean));
  return false;
}

function rotationRequirements(rotation, cafe, week = "") {
  const stationKeys = CAFE_STATION_CONFIG[cafe] || ["global"];
  const globalReady = stationComplete(rotation, "global", cafe, week);
  const incompleteStations = stationKeys.filter((stationKey) => stationKey !== "global" && stationRequiredCount(cafe, stationKey) > 0 && !stationComplete(rotation, stationKey, cafe, week));
  return {
    globalReady,
    incompleteStations,
    canSubmit: globalReady && incompleteStations.length === 0
  };
}

function conflictControlledRows(district, rows) {
  const groups = MENU_CONFLICT_GROUPS[district];
  if (!groups?.length) return rows;
  const controlledCafes = new Set(groups.flatMap((group) => group.cafes));
  return rows.filter((row) => controlledCafes.has(row.cafe));
}

function menuConflictCounts(rows) {
  return rows.reduce((acc, row) => {
    if (row.menu) acc[row.menu] = (acc[row.menu] || 0) + 1;
    return acc;
  }, {});
}

function menuConflictNote(district, cafe) {
  const group = (MENU_CONFLICT_GROUPS[district] || []).find((entry) => entry.cafes.includes(cafe));
  return group?.note || "This Global Menu is already selected by another cafe in the same district/week.";
}

function cafeUsesMenuConflictRule(district, cafe, copiedFrom = "") {
  const groups = MENU_CONFLICT_GROUPS[district];
  if (!groups?.length) return true;
  return groups.some((group) => group.cafes.includes(cafe) || (copiedFrom && group.cafes.includes(copiedFrom)));
}

function rowHasMenuConflict(row, conflictMenus) {
  if (!row.menu || !cafeUsesMenuConflictRule(row.district, row.cafe, row.copiedFrom)) return false;
  const count = conflictMenus[`${row.district}|${row.menu}`] ?? conflictMenus[row.menu] ?? 0;
  return count > 1;
}

function rotationRequirementIssues(requirements, cafe, { menu = "", duplicateMenuCount = 0, conflictNote = "" } = {}) {
  const issues = [];
  if (!requirements.globalReady) {
    issues.push("Select a Global Menu and the required Global entrees/sides.");
  }
  if (requirements.incompleteStations.length > 0) {
    issues.push(`Complete these station selections: ${requirements.incompleteStations.map((stationKey) => stationLabel(cafe, stationKey)).join(", ")}.`);
  }
  if (menu && duplicateMenuCount > 1) {
    const otherCount = duplicateMenuCount - 1;
    issues.push(`${menu} is already selected by ${otherCount} other cafe${otherCount === 1 ? "" : "s"}. ${conflictNote} Choose a different Global Menu or clear the duplicate before submitting.`);
  }
  return issues;
}

function leadershipRead(rows, conflictMenus) {
  const declared = rows.filter(hasRotationMenu).length;
  const missing = rows.filter((row) => !hasRotationMenu(row)).map((row) => row.cafe);
  const conflicts = rows.filter((row) => rowHasMenuConflict(row, conflictMenus));
  const parts = [`${declared} of ${rows.length} cafés have a Global declaration.`];
  if (missing.length) parts.push(`${missing.join(", ")} still need to submit.`);
  if (conflicts.length) parts.push(`${conflicts.length} café${conflicts.length === 1 ? " has" : "s have"} duplicate menu flags.`);
  if (!missing.length && !conflicts.length) parts.push("No immediate leadership follow-up is showing for this week.");
  return parts.join(" ");
}

function itemDetailScore(row) {
  return [
    getDescription(row) ? 50 : 0,
    getAllergens(row) ? 40 : 0,
    String(row.dataSource || "").includes("enhanced") ? 25 : 0,
    getPrice(row) != null ? 10 : 0,
    getTrueCost(row) != null ? 10 : 0,
    getCalories(row) != null ? 8 : 0,
    row.mrn || row.MRN ? 5 : 0,
    row.portion || row.Portion ? 5 : 0
  ].reduce((sum, value) => sum + value, 0);
}

function findBestRowForName(name, candidateRows = MENUWORKS_ITEMS) {
  const normalizedName = normalizeItemName(name);
  if (!normalizedName) return null;
  if (candidateRows === MENUWORKS_ITEMS && BEST_ROW_BY_NAME_CACHE.has(normalizedName)) return BEST_ROW_BY_NAME_CACHE.get(normalizedName);
  const matches = candidateRows.filter((row) => getItemAliases(row).includes(normalizedName));
  if (!matches.length) {
    if (candidateRows === MENUWORKS_ITEMS) BEST_ROW_BY_NAME_CACHE.set(normalizedName, null);
    return null;
  }
  const best = [...matches].sort((a, b) => itemDetailScore(b) - itemDetailScore(a))[0];
  if (candidateRows === MENUWORKS_ITEMS) BEST_ROW_BY_NAME_CACHE.set(normalizedName, best);
  return best;
}

function rowsForSelectedNames(names = [], { unique = false, selectionGroup = "", candidateRows = MENUWORKS_ITEMS } = {}) {
  const selectedRows = [];
  const seen = new Set();
  names.filter(Boolean).forEach((name) => {
    const key = normalizeItemName(name);
    if (!key) return;
    if (unique && seen.has(key)) return;
    seen.add(key);
    selectedRows.push({
      ...(findBestRowForName(name, candidateRows) || findBestRowForName(name) || makeUploadedItem(name)),
      __selectionGroup: selectionGroup
    });
  });
  return selectedRows;
}

function uniqueSelectionRows(rows, options) {
  if (!options?.unique) return rows;
  const seen = new Set();
  return rows.filter((row) => {
    const key = normalizeItemName(getItemIdentity(row));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectedRowsFromGlobalBlock(block = {}, options) {
  const candidateRows = globalMenuRows(block.menu, block.station);
  const rows = [
    ...rowsForSelectedNames(block.entrees || [], { ...options, candidateRows, selectionGroup: "entrees" }),
    ...rowsForSelectedNames(block.sides || [], { ...options, candidateRows, selectionGroup: "sides" }),
    ...rowsForSelectedNames(block.subRecipes || [], { ...options, candidateRows, selectionGroup: "subRecipes" }),
    ...rowsForSelectedNames(block.extensions || [], { ...options, candidateRows, selectionGroup: "extensions" })
  ];
  return uniqueSelectionRows(rows, options);
}

function customStationRows(rotation, stationKey, options) {
  const custom = rotation.customStations || blankCustomStations();
  if (stationKey === "streetBeets") {
    const station = custom.streetBeets || blankCustomStations().streetBeets;
    return rowsForSelectedNames([...(station.entrees || []), ...(station.sides || []), ...(station.subRecipes || []), ...(station.extensions || [])], options);
  }
  if (stationKey === "commissaryEverest") {
    const station = custom.commissaryEverest || blankCustomStations().commissaryEverest;
    return rowsForSelectedNames([station.menuName, ...(station.entrees || []), ...(station.hotSides || []), ...(station.coldSides || []), ...(station.rice || [])], options);
  }
  if (stationKey === "stationTakeover") {
    const station = custom.stationTakeover || blankCustomStations().stationTakeover;
    if (!station.enabled) return [];
    return rowsForSelectedNames([station.menuName, ...(station.entrees || []), ...(station.sides || []), ...(station.subRecipes || []), ...(station.extensions || [])], options);
  }
  if (stationKey === "lotusWp") {
    return rowsForSelectedNames([...(rotation.ltos?.lotusEntrees || []), ...(rotation.ltos?.lotusSides || [])], { ...options, candidateRows: uniqueOptionRows([...stationPool("lotusAsianEntrees"), ...stationPool("lotusAsianSides")]) });
  }
  return [];
}

function globalSelectedRows(rotation, options) {
  const candidateRows = globalMenuRows(rotation.menu, rotation.station);
  const rows = [
    ...rowsForSelectedNames(rotation.entrees || [], { ...options, candidateRows, selectionGroup: "entrees" }),
    ...rowsForSelectedNames(rotation.sides || [], { ...options, candidateRows, selectionGroup: "sides" }),
    ...rowsForSelectedNames(rotation.subRecipes || [], { ...options, candidateRows, selectionGroup: "subRecipes" }),
    ...rowsForSelectedNames(rotation.extensions || [], { ...options, candidateRows, selectionGroup: "extensions" })
  ];
  return uniqueSelectionRows(rows, options);
}

function globalSelectedRowsForCafe(rotation, cafe = "", options) {
  if (cafe === "Nitro") {
    const blocks = hasNitroSplitBlocks(rotation)
      ? nitroGlobalBlockLayout().map((block) => getRotationGlobalBlock(rotation, block.id))
      : [hydrateNitroBlock(rotation, "nitroMonTue")];
    return uniqueSelectionRows(blocks.flatMap((block) => selectedRowsFromGlobalBlock(block, options)), options);
  }

  if (cafe === "Re:Invent") {
    const blockRows = Object.entries(rotation.globalBlocks || {})
      .filter(([blockId, block]) => blockId !== "noodles" && (block?.menu || blockHasSelections(block)))
      .flatMap(([, block]) => selectedRowsFromGlobalBlock(block, options));
    return uniqueSelectionRows(blockRows.length ? blockRows : globalSelectedRows(rotation, options), options);
  }

  return globalSelectedRows(rotation, options);
}

function getStationSelectionRows(rotation, cafe) {
  const uploaded = rotation.uploadedLtos || {};
  const stationRows = [];
  const cafeStations = CAFE_STATION_CONFIG[cafe] || ["global"];

  if (cafeStations.includes("global")) {
    if (cafe === "Nitro") {
      const hasSplit = hasNitroSplitBlocks(rotation);
      const blockLayout = hasSplit ? nitroGlobalBlockLayout() : [{ id: "nitroMonTue", title: "Weekly Global Selection" }];
      blockLayout.forEach((blockInfo) => {
        const block = hasSplit ? getRotationGlobalBlock(rotation, blockInfo.id) : hydrateNitroBlock(rotation, blockInfo.id);
        stationRows.push({ key: `global-${blockInfo.id}`, label: blockInfo.title, items: selectedRowsFromGlobalBlock(block, { unique: true }), note: block.menu ? block.menu : "not selected" });
      });
    } else if (cafe === "Re:Invent") {
      const blocks = Object.entries(rotation.globalBlocks || {}).filter(([blockId, block]) => blockId !== "noodles" && (block?.menu || blockHasSelections(block)));
      if (blocks.length) {
        blocks.forEach(([blockId, block]) => {
          const meta = menuBlockMeta(blockId);
          stationRows.push({ key: `global-${blockId}`, label: meta.label, items: selectedRowsFromGlobalBlock(block, { unique: true }), note: block.menu ? block.menu : "not selected" });
        });
      } else {
        const globalItems = globalSelectedRows(rotation, { unique: true });
        stationRows.push({ key: "global", label: stationLabel(cafe, "global"), items: globalItems, note: rotation.menu ? rotation.menu : "not selected" });
      }
    } else {
      const globalItems = globalSelectedRows(rotation, { unique: true });
      stationRows.push({ key: "global", label: stationLabel(cafe, "global"), items: globalItems, note: rotation.menu ? rotation.menu : "not selected" });
    }
  }

  if (cafeStations.includes("noodles")) {
    const noodleBlock = getRotationGlobalBlock(rotation, "noodles");
    stationRows.push({ key: "noodles", label: stationLabel(cafe, "noodles"), items: selectedRowsFromGlobalBlock(noodleBlock, { unique: true }), note: noodleBlock.menu ? noodleBlock.menu : "not selected" });
  }

  if (cafeStations.includes("grill")) {
    const grillItems = grillSelectedRows(rotation, { unique: true });
    stationRows.push({ key: "grill", label: stationLabel(cafe, "grill"), items: grillItems, note: "regional + location spotlight" });
  }

  ["salad", "pizza", "deli", "fishMarket", "freshFive", "grillFreshFive", "saladFreshFive", "soup"].forEach((key) => {
    if (cafeStations.includes(key)) {
      const selected = ltoSelectedRows(rotation, key, { unique: true });
      const uploadedItems = (uploaded[key] || []).filter(Boolean).map(makeUploadedItem);
      stationRows.push({ key, label: STATION_LABELS[key], items: selected.length ? selected : uploadedItems, note: selected.length ? "selected" : uploadedItems.length ? "from upload preview" : "not selected" });
    }
  });

  if (cafeStations.includes("wok")) stationRows.push({ key: "wok", label: "Wok Station", items: wokSelectedRows(rotation, { unique: true }), note: "wok selections" });
  if (cafeStations.includes("carvery")) stationRows.push({ key: "carvery", label: "Carvery Station", items: carverySelectedRows(rotation, { unique: true }), note: "carvery selections" });
  ["streetBeets", "commissaryEverest", "lotusWp", "stationTakeover"].forEach((key) => {
    if (cafeStations.includes(key)) {
      const rows = customStationRows(rotation, key, { unique: true });
      stationRows.push({ key, label: STATION_LABELS[key], items: rows, note: rows.length ? "selected" : key === "stationTakeover" ? "optional" : "not selected" });
    }
  });

  return stationRows;
}

function allLegacySelectedRows(rotation) {
  const blockRows = Object.values(rotation.globalBlocks || {}).flatMap((block) => selectedRowsFromGlobalBlock(block));
  return [
    ...globalSelectedRows(rotation),
    ...blockRows,
    ...grillSelectedRows(rotation),
    ...["salad", "pizza", "deli", "fishMarket", "freshFive", "grillFreshFive", "saladFreshFive", "soup"].flatMap((stationKey) => ltoSelectedRows(rotation, stationKey)),
    ...wokSelectedRows(rotation),
    ...carverySelectedRows(rotation),
    ...["streetBeets", "commissaryEverest", "lotusWp", "stationTakeover"].flatMap((stationKey) => customStationRows(rotation, stationKey))
  ];
}

function grillSelectedRows(rotation, options) {
  return rowsForSelectedNames([rotation.grill?.regionalSpecial, rotation.grill?.locationSpotlight, rotation.grill?.promoActive ? rotation.grill?.promoItem : ""], options);
}

function ltoSelectedRows(rotation, stationKey, options) {
  return rowsForSelectedNames(
    [...(rotation.ltos?.[stationKey] || []), ...(rotation.uploadedLtos?.[stationKey] || [])],
    { ...options, candidateRows: stationPool(stationKey) }
  );
}

function wokSelectedRows(rotation, options) {
  return rowsForSelectedNames([...(rotation.ltos?.wokEntrees || []), ...(rotation.ltos?.wokSides || []), ...(rotation.ltos?.wokBase || []), ...(rotation.ltos?.wokSubRecipes || [])], options);
}

function carverySelectedRows(rotation, options) {
  return rowsForSelectedNames(Object.values(rotation.carvery || {}), { ...options, candidateRows: carveryDetailRows() });
}

function selectedItems(rotation, cafe = rotation?.cafe || "") {
  if (cafe) return getStationSelectionRows(rotation, cafe).flatMap((row) => row.items);
  return allLegacySelectedRows(rotation);
}

function foodSummary(items) {
  const priced = items.filter((row) => getPrice(row) != null && getTrueCost(row) != null && Number(getPrice(row)) > 0);
  const sell = priced.reduce((sum, row) => sum + Number(getPrice(row) || 0), 0);
  const cost = priced.reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);
  return { priced: priced.length, sell, cost, fc: sell ? cost / sell : null };
}

function selectionRole(row) {
  if (row.__selectionGroup === "entrees") return "entree";
  if (row.__selectionGroup === "sides") return "side";
  if (row.__selectionGroup === "subRecipes") return "subRecipe";
  if (row.__selectionGroup === "extensions") return "extension";
  if (isEntree(row)) return "entree";
  if (isSide(row)) return "side";
  if (isSubRecipe(row)) return "subRecipe";
  return "extension";
}

function selectedPlateParts(items) {
  const costedItems = items.filter((row) => getTrueCost(row) != null);
  const toPart = (row) => ({
    row,
    cost: Number(getTrueCost(row) || 0),
    price: getPrice(row) == null ? null : Number(getPrice(row) || 0)
  });
  const entrees = costedItems.filter((row) => selectionRole(row) === "entree").map(toPart).sort((a, b) => a.cost - b.cost);
  const sides = costedItems.filter((row) => selectionRole(row) === "side").map(toPart).sort((a, b) => a.cost - b.cost);
  const subRecipeCost = costedItems.filter((row) => selectionRole(row) === "subRecipe").reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);
  const sideCount = Math.min(2, sides.length);

  return {
    entrees,
    sides,
    subRecipeCost,
    lowestEntree: entrees[0] || null,
    highestEntree: entrees[entrees.length - 1] || null,
    lowestSides: sides.slice(0, sideCount),
    highestSides: sideCount ? sides.slice(-sideCount) : [],
    partial: entrees.length > 0 && sides.length < 2
  };
}

function plateCost(entree, sides, subRecipeCost) {
  return (entree?.cost || 0) + sides.reduce((sum, row) => sum + row.cost, 0) + subRecipeCost;
}

function plateSell(entree, sides) {
  return (entree?.price || 0) + sides.reduce((sum, row) => sum + (row.price || 0), 0);
}

function selectedTrueCostRange(items) {
  const parts = selectedPlateParts(items);

  if (!parts.entrees.length) {
    return { low: parts.subRecipeCost > 0 ? parts.subRecipeCost : null, high: parts.subRecipeCost > 0 ? parts.subRecipeCost : null, subRecipeCost: parts.subRecipeCost, partial: parts.subRecipeCost > 0 };
  }

  return {
    low: plateCost(parts.lowestEntree, parts.lowestSides, parts.subRecipeCost),
    high: plateCost(parts.highestEntree, parts.highestSides, parts.subRecipeCost),
    subRecipeCost: parts.subRecipeCost,
    partial: parts.partial
  };
}

function moneyRange(range) {
  if (!range || range.low == null || range.high == null) return "—";
  if (Math.abs(range.low - range.high) < 0.005) return money(range.low);
  return `${money(range.low)} – ${money(range.high)}`;
}

function trueCostRangeNote(range) {
  if (!range || range.low == null) return "select items to calculate";
  if (range.partial) return "selected mix; add sides to complete plate";
  if (Math.abs(range.low - range.high) < 0.005) return "selected plate cost";
  return "1 entrée + 2 sides + sub recipes";
}

function selectedFoodCostRange(items) {
  const parts = selectedPlateParts(items);
  const lowestSell = plateSell(parts.lowestEntree, parts.lowestSides);
  const highestSell = plateSell(parts.highestEntree, parts.highestSides);
  const lowPct = parts.lowestEntree && lowestSell > 0 ? plateCost(parts.lowestEntree, parts.lowestSides, parts.subRecipeCost) / lowestSell : null;
  const highPct = parts.highestEntree && highestSell > 0 ? plateCost(parts.highestEntree, parts.highestSides, parts.subRecipeCost) / highestSell : null;
  const values = [lowPct, highPct].filter((value) => value != null).sort((a, b) => a - b);

  return {
    low: values[0] ?? null,
    high: values[values.length - 1] ?? null,
    partial: parts.partial || !parts.entrees.length,
    subRecipeCost: parts.subRecipeCost
  };
}

function pctRange(range) {
  if (!range || range.low == null || range.high == null) return "—";
  if (Math.abs(range.low - range.high) < 0.0005) return pct(range.low);
  return `${pct(range.low)} – ${pct(range.high)}`;
}

function foodCostRangeNote(range) {
  if (!range) return "select entrée to calculate";
  if (range.low == null && range.subRecipeCost > 0) return "sub recipe cost accepted; add priced entrée to calculate %";
  if (range.low == null) return "select entrée to calculate";
  if (range.partial) return "selected mix; add sides to complete plate";
  if (Math.abs(range.low - range.high) < 0.0005) return "selected mix food cost";
  return "plate range with sub recipes included";
}

function getStationCostOverview(rotation, cafe) {
  return getStationSelectionRows(rotation, cafe).map((row) => {
    const summary = foodSummary(row.items);
    return { ...row, summary, selectedCount: row.items.length };
  });
}

function weekAtGlancePreview(fileName) {
  const rawStations = {
    "Wok Xhan": ["Sweet and Sour Tofu", "Pulled Kahlua Pork", "orange peel chicken", "jasmine rice", "vegetable fried rice", "vegetable lo mein", "blistered green beans", "Vegetarian Egg Roll"],
    "Pizza LTO": ["caprese flatbread", "Garden Pesto Flatbread"],
    "Zanes LTO": ["maple tofu barley pecan salad"],
    "Sandwich LTO": ["turkey apple brie sandwich with apple"]
  };

  const stationMap = Object.entries(rawStations).reduce((acc, [station, items]) => {
    const key = normalizeImportedStation(station);
    acc[key] = [...(acc[key] || []), ...items];
    return acc;
  }, {});

  return {
    fileName,
    reportType: "MenuWorks Week at a Glance",
    detectedCafe: "Doppler",
    detectedStation: "Wok Xhan",
    detectedDateRange: "May 25, 2026 - May 29, 2026",
    global: {
      menu: "Uploaded Week at a Glance",
      station: "Wok Xhan",
      entrees: ["Sweet and Sour Tofu", "Pulled Kahlua Pork", "orange peel chicken"],
      sides: ["jasmine rice", "vegetable fried rice", "vegetable lo mein", "blistered green beans"],
      subRecipes: ["", "", "", ""],
      extensions: ["Vegetarian Egg Roll", ""]
    },
    uploadedLtos: {
      pizza: stationMap.pizza || [],
      salad: stationMap.salad || [],
      deli: stationMap.deli || [],
      fishMarket: stationMap.fishMarket || [],
      grill: stationMap.grill || [],
      unmatched: stationMap.unmatched || []
    },
    stationAliases: Object.keys(rawStations).map((station) => ({ source: station, mappedTo: normalizeImportedStation(station) }))
  };
}

export default function NeighborhoodRotations({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [district, setDistrict] = useState("");
  const [week, setWeek] = useState(DEFAULT_ROTATION_WEEK);
  const [selectedCafe, setSelectedCafe] = useState("");
  const [rotationView, setRotationView] = useState("planner");
  const [resultsDistrict, setResultsDistrict] = useState("All");
  const [resultsCafe, setResultsCafe] = useState("All");
  const [rotations, setRotations] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NEIGHBORHOOD_ROTATIONS_STORAGE_KEY) || "{}"); } catch { return {}; }
  });
  const [databaseRecords, setDatabaseRecords] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SMARTSHEET_DATABASE_STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [databaseLoadStatus, setDatabaseLoadStatus] = useState({ state: "idle", message: "Using local saved data until Smartsheet is loaded.", loadedAt: "" });
  const [databaseSyncStatus, setDatabaseSyncStatus] = useState({ state: "idle", message: "No Smartsheet sync attempted yet.", syncedAt: "" });
  const [smartsheetReadCooldown, setSmartsheetReadCooldown] = useState(false);

  useEffect(() => { localStorage.setItem(NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, JSON.stringify(rotations)); }, [rotations]);
  useEffect(() => { localStorage.setItem(SMARTSHEET_DATABASE_STORAGE_KEY, JSON.stringify(databaseRecords)); }, [databaseRecords]);

  const refreshFromSmartsheet = async () => {
    if (databaseLoadStatus.state === "loading" || smartsheetReadCooldown) {
      setDatabaseLoadStatus((prev) => ({
        ...prev,
        message: "Sync Latest is already running or cooling down. Try again in a few seconds.",
      }));
      return;
    }
    setSmartsheetReadCooldown(true);
    setDatabaseLoadStatus({ state: "loading", message: "Loading saved rotations from Smartsheet...", loadedAt: "" });
    try {
      const records = await loadRecordsFromSmartsheet();
      const loadedRotations = recordsToRotations(records);
      setDatabaseRecords(records);
      setRotations((prev) => ({ ...prev, ...loadedRotations }));
      setDatabaseLoadStatus({
        state: "synced",
        message: `Loaded ${records.length} Smartsheet row${records.length === 1 ? "" : "s"}. Executive View is using database-loaded rotations when available.`,
        loadedAt: nowStamp(),
      });
    } catch (error) {
      setDatabaseLoadStatus({
        state: "fallback",
        message: error.message || "Could not load Smartsheet records. Using local fallback records.",
        loadedAt: nowStamp(),
      });
    } finally {
      window.setTimeout(() => setSmartsheetReadCooldown(false), 10000);
    }
  };

  useEffect(() => { refreshFromSmartsheet(); }, []);

  const cafes = DISTRICTS[district] || [];
  useEffect(() => { if (district && selectedCafe && !cafes.includes(selectedCafe)) setSelectedCafe(""); }, [district, cafes, selectedCafe]);

  const currentRotation = selectedCafe ? (rotations[rotationKey(week, district, selectedCafe)] || EMPTY_ROTATION) : EMPTY_ROTATION;
  const carryoverWeek = previousRotationWeek(week);
  const previousRotation = selectedCafe && carryoverWeek ? (rotations[rotationKey(carryoverWeek, district, selectedCafe)] || EMPTY_ROTATION) : EMPTY_ROTATION;
  const menus = useMemo(() => Array.from(new Set(MENUWORKS_ITEMS.map((row) => getMenuName(row)).filter(Boolean).filter(isGlobalMenuOption))).sort(), []);
  const updateRotation = (patch) => setRotations((prev) => ({
    ...prev,
    [rotationKey(week, district, selectedCafe)]: { ...(prev[rotationKey(week, district, selectedCafe)] || EMPTY_ROTATION), ...patch }
  }));

  const districtWeekRows = cafes.map((cafe) => ({ district, cafe, ...(rotations[rotationKey(week, district, cafe)] || EMPTY_ROTATION) }));
  const leadershipRows = district === "South" ? districtWeekRows.flatMap((row) => row.cafe === "Nitro" ? [row, { ...row, cafe: "Frontier", copiedFrom: "Nitro" }] : [row]) : districtWeekRows;
  const conflictMenus = menuConflictCounts(conflictControlledRows(district, districtWeekRows));
  const allRows = Object.entries(DISTRICTS).flatMap(([dist, cafeList]) => cafeList.map((cafe) => ({ district: dist, cafe, ...(rotations[rotationKey(week, dist, cafe)] || EMPTY_ROTATION) })));
  const allConflictMenus = Object.entries(DISTRICTS).reduce((acc, [dist, cafeList]) => {
    const rows = cafeList.map((cafe) => ({ district: dist, cafe, ...(rotations[rotationKey(week, dist, cafe)] || EMPTY_ROTATION) }));
    Object.entries(menuConflictCounts(conflictControlledRows(dist, rows))).forEach(([menu, count]) => {
      acc[`${dist}|${menu}`] = count;
    });
    return acc;
  }, {});
  const resultRows = ROLLING_ROTATION_WEEKS.flatMap((wk) => Object.entries(DISTRICTS).flatMap(([dist, cafeList]) => cafeList.map((cafe) => ({ week: wk, district: dist, cafe, ...(rotations[rotationKey(wk, dist, cafe)] || EMPTY_ROTATION) })))).filter(hasRotationMenu);
  const filteredResults = resultRows.filter((row) => (resultsDistrict === "All" || row.district === resultsDistrict) && (resultsCafe === "All" || row.cafe === resultsCafe)).reverse();
  const persistRotationToDatabase = async (nextRotation) => {
    if (!week || !district || !selectedCafe) return;
    const nextRecords = buildDatabaseRecordsForRotation({ week, district, cafe: selectedCafe, rotation: nextRotation });
    setDatabaseRecords((prev) => upsertDatabaseRecords(prev, nextRecords));
    setDatabaseSyncStatus({ state: "syncing", message: `Syncing ${nextRecords.length} row${nextRecords.length === 1 ? "" : "s"} to Smartsheet...`, syncedAt: "" });
    try {
      const result = await syncRecordsToSmartsheet(nextRecords, { week, district, cafe: selectedCafe, status: nextRotation.status || "Draft", replaceParentRecordIds: [rotationRecordParentId(week, district, selectedCafe)] });
      setDatabaseSyncStatus({ state: "synced", message: result.message || `Synced ${nextRecords.length} row${nextRecords.length === 1 ? "" : "s"} to Smartsheet.`, syncedAt: nowStamp() });
    } catch (error) {
      const missingColumns = error?.payload?.missingColumns || [];
      const missingMessage = missingColumns.length
        ? `Smartsheet is missing ${missingColumns.length} required column${missingColumns.length === 1 ? "" : "s"}: ${missingColumns.join(", ")}`
        : error.message || "Smartsheet sync failed. Local fallback saved.";
      setDatabaseSyncStatus({
        state: "fallback",
        message: missingMessage,
        missingColumns,
        syncedAt: nowStamp(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7f9_0%,#eef7f2_100%)] text-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <NeighborhoodHeader onBackToPlatform={onBackToPlatform} onOpenSmartsheetHealth={onOpenSmartsheetHealth} district={district} />
        <section className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <RotationTab label="Chef Planner" value="planner" active={rotationView} setActive={setRotationView} />
          <RotationTab label="Executive View" value="executive" active={rotationView} setActive={setRotationView} />
          <RotationTab label="Results" value="results" active={rotationView} setActive={setRotationView} />
        </section>
        {rotationView === "planner" && (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <ChoiceCard label="District" value={district} setValue={setDistrict} options={Object.keys(DISTRICTS)} />
              <ChoiceCard label="Cafe" value={selectedCafe} setValue={setSelectedCafe} options={cafes} disabled={!district} />
              <ControlCard label="Week" value={week} setValue={setWeek} options={ROTATION_WEEKS} />
              <StatusCard ready={Boolean(district && selectedCafe)} conflicts={Object.values(conflictMenus).filter((count) => count > 1).length} completed={districtWeekRows.filter(hasRotationMenu).length} total={cafes.length} />
            </section>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {district && selectedCafe ? <RotationPlannerCard cafe={selectedCafe} district={district} menuOptions={menus} rotation={currentRotation} previousRotation={previousRotation} previousWeek={carryoverWeek} updateRotation={updateRotation} week={week} printRows={allRows} persistRotationToDatabase={persistRotationToDatabase} databaseLoadStatus={databaseLoadStatus} databaseSyncStatus={databaseSyncStatus} onRefreshDatabase={refreshFromSmartsheet} isRefreshCoolingDown={smartsheetReadCooldown} menuConflictCount={currentRotation.menu && cafeUsesMenuConflictRule(district, selectedCafe) ? (conflictMenus[currentRotation.menu] || 0) : 0} /> : <SelectPlannerPrompt />}
              </div>
              <LeadershipOverview district={district} week={week} rows={leadershipRows} conflictMenus={conflictMenus} />
            </section>
          </>
        )}
        {rotationView === "executive" && <ExecutiveView week={week} setWeek={setWeek} rows={allRows} conflictMenus={allConflictMenus} />}
        {rotationView === "results" && <ResultsView rows={filteredResults} resultsDistrict={resultsDistrict} setResultsDistrict={setResultsDistrict} resultsCafe={resultsCafe} setResultsCafe={setResultsCafe} />}
      </div>
    </div>
  );
}

function NeighborhoodHeader({ onBackToPlatform, onOpenSmartsheetHealth, district }) {
  return (
    <header className="rounded-lg bg-white border border-slate-200 border-t-4 border-t-[#b99b55] p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-950"><ArrowLeft size={16} /> Back to platform</button>
        <div className="flex flex-wrap items-center gap-2">
          <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
          <CompassOneLogo compact />
        </div>
      </div>
      <div className="mt-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 font-bold">Chef planning workspace</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">Neighborhood Rotations</h1>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-2">
          <VersionStamp compact />
          {district === "South" && <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">Frontier follows Nitro for tracking.</div>}
        </div>
      </div>
    </header>
  );
}

function RotationTab({ label, value, active, setActive }) {
  return <button onClick={() => setActive(value)} className={`rounded-md px-4 py-2.5 text-sm font-bold transition ${active === value ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>{label}</button>;
}

function ControlCard({ label, value, setValue, options, placeholder, disabled = false }) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 p-4 shadow-sm">
      <label className="block text-sm font-semibold text-slate-500 mb-2">{label}</label>
      <select disabled={disabled} value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function ChoiceCard({ label, value, setValue, options, disabled = false }) {
  const isDisabled = disabled || !options.length;
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${isDisabled ? "bg-slate-50 border-slate-200 opacity-70" : "bg-white border-slate-200"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        {value ? (
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
            active
          </span>
        ) : (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
            choose
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              disabled={isDisabled}
              onClick={() => setValue(option)}
              className={`min-h-[44px] rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                selected
                  ? "border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm ring-2 ring-emerald-200"
                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]" : "bg-slate-300"}`} />
                {option}
              </span>
            </button>
          );
        })}
      </div>
      {!options.length && <p className="mt-3 text-xs font-semibold text-slate-500">Select a district first.</p>}
    </div>
  );
}

function StatusCard({ ready, conflicts, completed, total }) {
  const readyTone = conflicts ? "border-amber-200 bg-amber-50" : "border-emerald-300 bg-emerald-50";
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${ready ? readyTone : "bg-white border-slate-200"}`}>
      <p className="text-sm font-semibold text-slate-500">Week Status</p>
      {!ready ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Select a district and cafe/unit to view status.</div>
      ) : (
        <>
          <div className="mt-3 flex items-end gap-3"><p className="text-3xl font-bold">{completed}/{total}</p><p className="text-sm text-slate-500 mb-1">cafes declared</p></div>
          <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${conflicts ? "border-amber-300 bg-white text-amber-800" : "border-emerald-300 bg-white text-emerald-800"}`}>{conflicts ? `${conflicts} conflict group` : "No conflicts"}</p>
        </>
      )}
    </div>
  );
}


function SelectPlannerPrompt() {
  return (
    <div className="rounded-[2rem] bg-white border border-slate-200 p-8 shadow-2xl">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Chef Planner</p>
      <h2 className="text-3xl font-bold mt-1">Select a district and café/unit</h2>
      <p className="text-slate-600 mt-3">The planner stays blank until a location is selected so the app does not imply a rotation has already been started.</p>
    </div>
  );
}

function DatabaseAlignmentNotice({ district, cafe, week, rotation }) {
  const records = buildDatabaseRecordsForRotation({ week, district, cafe, rotation });
  return (
    <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
      <p className="font-bold">Smartsheet database alignment</p>
      <p className="mt-1">Save Draft and Submit Rotation now generate database-ready records using the master column labels. Current record preview: <span className="font-bold">{records.length}</span> row{records.length === 1 ? "" : "s"} for this café/week.</p>
    </div>
  );
}


function CompactSystemStatusPanel({ district, cafe, week, rotation, loadStatus, syncStatus, onRefreshDatabase, isRefreshCoolingDown = false }) {
  const records = buildDatabaseRecordsForRotation({ week, district, cafe, rotation });
  const isReading = loadStatus?.state === "loading" || isRefreshCoolingDown;
  const readTone = loadStatus?.state === "loaded" ? "text-emerald-800 bg-emerald-50 border-emerald-200" : loadStatus?.state === "loading" ? "text-sky-800 bg-sky-50 border-sky-200" : "text-slate-600 bg-slate-50 border-slate-200";
  const writeTone = syncStatus?.state === "synced" ? "text-emerald-800 bg-emerald-50 border-emerald-200" : syncStatus?.state === "syncing" ? "text-sky-800 bg-sky-50 border-sky-200" : syncStatus?.state === "fallback" ? "text-amber-800 bg-amber-50 border-amber-200" : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm print:hidden">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">System Status</p>
          <p className="mt-1 text-slate-600"><span className="font-bold text-slate-900">{APP_VERSION_STAMP}</span> · {records.length} database row{records.length === 1 ? "" : "s"} prepared for this café/week.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${readTone}`}>Read: {loadStatus?.state === "loaded" ? "connected" : loadStatus?.state || "idle"}</span>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${writeTone}`}>Write: {syncStatus?.state === "synced" ? "synced" : syncStatus?.state || "idle"}</span>
          <button type="button" onClick={onRefreshDatabase} disabled={isReading} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Sync Latest</button>
        </div>
      </div>
      {syncStatus?.state === "fallback" && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <p className="font-bold">Smartsheet write needs attention</p>
          <p className="mt-1">{syncStatus.message}</p>
          {syncStatus?.missingColumns?.length > 0 && <p className="mt-1 text-xs">Missing: {syncStatus.missingColumns.join(", ")}</p>}
        </div>
      )}
    </div>
  );
}

function SmartsheetDatabaseStatusPanel({ loadStatus, syncStatus, onRefreshDatabase, isRefreshCoolingDown = false }) {
  const isReading = loadStatus?.state === "loading" || isRefreshCoolingDown;
  const toneForState = (state) => {
    if (state === "synced") return "border-emerald-200 bg-emerald-50 text-emerald-900";
    if (state === "syncing" || state === "loading") return "border-sky-200 bg-sky-50 text-sky-900";
    if (state === "fallback") return "border-amber-200 bg-amber-50 text-amber-900";
    return "border-slate-200 bg-slate-50 text-slate-700";
  };

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">Smartsheet live database</p>
          <p className="mt-1 text-slate-500">The planner writes to Smartsheet and reloads saved database rows for Executive View.</p>
        </div>
        <button type="button" onClick={onRefreshDatabase} disabled={isReading} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
          Sync Latest
        </button>
      </div>
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={`rounded-2xl border p-3 ${toneForState(loadStatus?.state)}`}>
          <p className="text-xs uppercase tracking-[0.16em] font-bold opacity-70">Read Status</p>
          <p className="mt-1 font-semibold">{loadStatus?.message || "Not loaded yet."}</p>
          {loadStatus?.loadedAt && <p className="mt-1 text-xs opacity-70">Last read: {loadStatus.loadedAt}</p>}
        </div>
        <div className={`rounded-2xl border p-3 ${toneForState(syncStatus?.state)}`}>
          <p className="text-xs uppercase tracking-[0.16em] font-bold opacity-70">Write Status</p>
          <p className="mt-1 font-semibold">{syncStatus?.message || "No write attempted yet."}</p>
          {syncStatus?.missingColumns?.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-white/60 p-3 text-xs">
              <p className="font-bold">Missing Smartsheet columns to add or rename exactly:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {syncStatus.missingColumns.map((column) => (
                  <li key={column} className="font-mono">{column}</li>
                ))}
              </ul>
            </div>
          )}
          {syncStatus?.syncedAt && <p className="mt-1 text-xs opacity-70">Last write: {syncStatus.syncedAt}</p>}
        </div>
      </div>
    </div>
  );
}

function RotationPlannerCard({ cafe, district, menuOptions, rotation, previousRotation, previousWeek, updateRotation, week, printRows, persistRotationToDatabase, databaseLoadStatus, databaseSyncStatus, onRefreshDatabase, isRefreshCoolingDown = false, menuConflictCount = 0 }) {
  const [preview, setPreview] = useState(null);
  const [copiedRotation, setCopiedRotation] = useState(null);
  const [submitWarningOpen, setSubmitWarningOpen] = useState(false);
  const [editSubmitted, setEditSubmitted] = useState(false);
  const [showCustomerMenuPanel, setShowCustomerMenuPanel] = useState(false);
  const lockedForEditing = rotation.status === "Submitted" && !editSubmitted;
  const guardedUpdateRotation = (patch) => {
    if (lockedForEditing) return;
    updateRotation(patch);
  };

  const stationOptions = subConceptOptionsForMenu(rotation.menu);
  const menuItems = globalMenuRows(rotation.menu, rotation.station);
  const categorized = categorize(menuItems);
  const items = selectedItems(rotation, cafe);
  const summary = foodSummary(items);
  const cafeStations = CAFE_STATION_CONFIG[cafe] || ["global"];
  const stationCostOverview = getStationCostOverview(rotation, cafe);
  const requirements = rotationRequirements(rotation, cafe, week);
  const submitIssues = rotationRequirementIssues(requirements, cafe, { menu: rotation.menu, duplicateMenuCount: menuConflictCount, conflictNote: menuConflictNote(district, cafe) });
  const canSubmitRotation = requirements.canSubmit && submitIssues.length === 0;

  const updateSlot = (group, index, value) => {
    if (lockedForEditing) return;
    const next = [...(rotation[group] || EMPTY_ROTATION[group])];
    next[index] = value;
    updateRotation({ [group]: next });
  };

  const updateGrill = (field, value) => {
    if (lockedForEditing) return;
    updateRotation({ grill: { ...(rotation.grill || EMPTY_ROTATION.grill), [field]: value } });
  };
  const updateLto = (stationKey, index, value) => {
    if (lockedForEditing) return;
    const current = rotation.ltos?.[stationKey] || EMPTY_ROTATION.ltos[stationKey] || [];
    const next = [...current];
    next[index] = value;
    updateRotation({ ltos: { ...(rotation.ltos || EMPTY_ROTATION.ltos), [stationKey]: next } });
  };
  const updateCarvery = (field, value) => {
    if (lockedForEditing) return;
    updateRotation({ carvery: { ...(rotation.carvery || EMPTY_ROTATION.carvery), [field]: value } });
  };
  const updateCustomStation = (stationKey, patch) => {
    if (lockedForEditing) return;
    const current = cloneCustomStations(rotation.customStations);
    updateRotation({ customStations: { ...current, [stationKey]: { ...current[stationKey], ...patch } } });
  };
  const updateCustomStationArray = (stationKey, field, index, value) => {
    if (lockedForEditing) return;
    const current = cloneCustomStations(rotation.customStations);
    const nextValues = [...(current[stationKey]?.[field] || [])];
    nextValues[index] = value;
    updateRotation({ customStations: { ...current, [stationKey]: { ...current[stationKey], [field]: nextValues } } });
  };
  const markDraft = () => {
    const nextRotation = { ...rotation, status: "Draft", updatedAt: nowStamp(), submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
  };
  const submitRotation = () => {
    if (!canSubmitRotation) {
      setSubmitWarningOpen(true);
      return;
    }
    const stamp = nowStamp();
    const nextRotation = { ...rotation, status: "Submitted", updatedAt: stamp, submittedAt: stamp, submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
    setSubmitWarningOpen(false);
  };
  const copyCurrentRotation = () => {
    const copy = { ...rotation, status: "Draft", updatedAt: "", submittedAt: "", submittedBy: "" };
    setCopiedRotation(copy);
  };
  const loadCopiedRotation = () => {
    if (!copiedRotation) return;
    const nextRotation = { ...copiedRotation, status: "Draft", updatedAt: nowStamp(), submittedAt: "", submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
  };
  const applyPreview = () => {
    if (!preview || lockedForEditing) return;
    const nextRotation = { ...rotation, ...preview.global, uploadedLtos: preview.uploadedLtos, updatedAt: nowStamp(), submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
    setPreview(null);
  };

  return (
    <div className="rounded-lg bg-white border border-slate-200 p-6 shadow-sm">
      <PlannerControlsPanel
        cafe={cafe}
        copiedRotation={copiedRotation}
        onCopy={copyCurrentRotation}
        onLoad={loadCopiedRotation}
        preview={preview}
        setPreview={setPreview}
        applyPreview={applyPreview}
        week={week}
        printRows={printRows}
        rotation={rotation}
        requirements={requirements}
        submitIssues={submitIssues}
        canSubmit={canSubmitRotation}
        onSaveDraft={markDraft}
        onSubmit={submitRotation}
        onGenerateMenu={cafe === "Bingo" ? () => setShowCustomerMenuPanel((value) => !value) : null}
      />
      {cafe === "Bingo" && showCustomerMenuPanel && <BingoCustomerMenuPanel week={week} rotation={rotation} />}
      {submitWarningOpen && (
        <SubmitBlockedModal
          cafe={cafe}
          menu={rotation.menu}
          issues={submitIssues}
          onClose={() => setSubmitWarningOpen(false)}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">Chef Planner</p>
          <h2 className="text-3xl font-bold mt-1">{cafe}</h2>
          {cafe === "Nitro" && <p className="text-sm text-slate-500 mt-1">Frontier follows Nitro for tracking.</p>}
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${rotation.status === "Submitted" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
          {rotation.status || "Draft"}
        </span>
      </div>
      {rotation.status === "Submitted" && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <div>
            <p className="font-black">Locked rotation selections are showing below.</p>
            <p className="mt-1 font-semibold text-emerald-800">Use Edit and resubmit in the recap only when you need to revise this cafe/week.</p>
          </div>
        </div>
      )}

      {lockedForEditing ? (
        <SubmittedRotationRecap cafe={cafe} week={week} rotation={rotation} rows={stationCostOverview} onEdit={() => setEditSubmitted(true)} />
      ) : (
        <>
          <StationPills cafe={cafe} stations={cafeStations} />
          <PlannerSnapshot rotation={rotation} items={items} />
          <StationCostOverview rows={stationCostOverview} />

          {cafeStations.map((stationKey) => (
            <CafeStationSection
              key={stationKey}
              stationKey={stationKey}
              cafe={cafe}
              week={week}
              rotation={rotation}
              previousRotation={previousRotation}
              previousWeek={previousWeek}
              menuOptions={menuOptions}
              stationOptions={stationOptions}
              categorized={categorized}
              updateRotation={guardedUpdateRotation}
              updateSlot={updateSlot}
              updateGrill={updateGrill}
              updateLto={updateLto}
              updateCarvery={updateCarvery}
              updateCustomStation={updateCustomStation}
              updateCustomStationArray={updateCustomStationArray}
              summary={summary}
              selectedItems={items}
            />
          ))}
        </>
      )}
      <CompactSystemStatusPanel district={district} cafe={cafe} week={week} rotation={rotation} loadStatus={databaseLoadStatus} syncStatus={databaseSyncStatus} onRefreshDatabase={onRefreshDatabase} isRefreshCoolingDown={isRefreshCoolingDown} />
    </div>
  );
}

function SubmittedRotationRecap({ cafe, week, rotation, rows, onEdit }) {
  const menuLabel = rotationMenuLabel(rotation);
  const totalSelections = rows.reduce((sum, row) => sum + row.selectedCount, 0);
  return (
    <section className="mt-5 rounded-[2rem] border-2 border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-black text-emerald-700">Submitted Menu Recap</p>
          <h3 className="mt-1 text-3xl font-black text-slate-950">{cafe}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">{week}</p>
          <p className="mt-2 text-lg font-black text-slate-950">{menuLabel || "No Global menu saved"}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{totalSelections} saved selection{totalSelections === 1 ? "" : "s"}{rotation.submittedAt ? ` - submitted ${rotation.submittedAt}` : ""}</p>
        </div>
        <label className="inline-flex items-center gap-3 self-start rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-black text-emerald-900 shadow-sm">
          <input type="checkbox" onChange={(event) => event.target.checked && onEdit()} />
          Edit and resubmit
        </label>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {rows.map((row) => (
          <div key={row.key} className="rounded-3xl border border-white bg-white/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] font-black text-slate-400">{row.label}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{row.note}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${row.selectedCount ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{row.selectedCount}</span>
            </div>
            {row.items.length ? (
              <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-800">
                {row.items.map((item, index) => {
                  const description = getDescription(item);
                  return (
                    <li key={`${row.key}-${getItemIdentity(item)}-${index}`} className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <span>{titleCase(getDisplayName(item) || getItemIdentity(item))}</span>
                        <ItemBuildMeta item={item} />
                      </div>
                      <p className={`text-xs leading-relaxed ${description ? "font-medium text-slate-600" : "font-bold text-amber-700"}`}>
                        {description || "Description missing in source data."}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm font-semibold text-slate-400">No selections saved.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ItemBuildMeta({ item }) {
  const calories = getCalories(item);
  const retail = getSuggestedRetailPrice(item);
  return (
    <span className="flex flex-wrap gap-2 text-xs font-black">
      <span className={`rounded-full border px-2.5 py-1 ${calories == null ? "border-amber-200 bg-amber-50 text-amber-800" : "border-sky-200 bg-sky-50 text-sky-800"}`}>
        {calories == null ? "Calories not listed" : `${calories} cal`}
      </span>
      <span className={`rounded-full border px-2.5 py-1 ${retail == null ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
        {retail == null ? "Retail not listed" : `Retail ${money(retail)}`}
      </span>
    </span>
  );
}

function PlannerSnapshot({ rotation, items }) {
  const trueCostRange = selectedTrueCostRange(items);
  const foodCostRange = selectedFoodCostRange(items);
  const foodCostMidpoint = foodCostRange.low != null && foodCostRange.high != null ? (foodCostRange.low + foodCostRange.high) / 2 : null;
  const foodCostTone = foodCostMidpoint == null ? "neutral" : foodCostMidpoint > 0.34 ? "amber" : "green";

  return (
    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <PlannerSnapshotCard label="Global Menu" value={rotation.menu || "Not selected"} note={rotation.station || "choose Global menu"} />
      <PlannerSnapshotCard label="Selected Items" value={items.length} note="current planner selections" />
      <PlannerSnapshotCard label="True Cost Range" value={moneyRange(trueCostRange)} note={trueCostRangeNote(trueCostRange)} />
      <PlannerSnapshotCard label="Mix Food Cost %" value={pctRange(foodCostRange)} note={foodCostRangeNote(foodCostRange)} tone={foodCostTone} />
    </div>
  );
}

function PlannerSnapshotCard({ label, value, note, tone = "neutral" }) {
  const toneClass = tone === "amber"
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold leading-tight">{value}</p>
      <p className="mt-2 text-xs opacity-70">{note}</p>
    </div>
  );
}

function StationCostOverview({ rows }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!rows.length) return null;

  const stationsWithSelections = rows.filter((row) => row.selectedCount > 0).length;

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <button type="button" onClick={() => setIsOpen((value) => !value)} className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-left">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Food Cost Overview</p>
          <h3 className="text-2xl font-bold mt-1">By Station</h3>
          <p className="text-sm text-slate-500 mt-1">Quick station read. Expand when you need the detail.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{stationsWithSelections}/{rows.length} active</span>
          <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold inline-flex items-center gap-1">
            {isOpen ? "Collapse" : "Expand"} {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((row) => {
            const tone = row.summary.fc == null
              ? "border-slate-200 bg-slate-50"
              : row.summary.fc > 0.34
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50";
            return (
              <div key={row.key} className={`rounded-2xl border p-4 ${tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{row.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{row.note}</p>
                  </div>
                  <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">{pct(row.summary.fc)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 font-semibold text-slate-600">{row.selectedCount} selected</span>
                  <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 font-semibold text-slate-600">{moneyRange(selectedTrueCostRange(row.items))} cost range</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function PlannerControlsPanel({ cafe, copiedRotation, onCopy, onLoad, preview, setPreview, applyPreview, week, printRows, rotation, requirements, submitIssues = [], canSubmit, onSaveDraft, onSubmit, onGenerateMenu }) {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const copiedSummary = copiedRotation?.menu
    ? `${copiedRotation.menu}${copiedRotation.station ? ` • ${copiedRotation.station}` : ""}`
    : "No copy loaded";

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(weekAtGlancePreview(file.name));
    event.target.value = "";
  };
  const submitHelp = submitIssues.length ? submitIssues.join(" ") : "Ready to submit.";

  return (
    <div className="mb-5 rounded-[1.75rem] border border-slate-300 bg-slate-950 p-3 shadow-lg print:hidden">
      <div className="rounded-[1.35rem] border border-slate-700 bg-slate-900 p-4">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300 font-bold">Planner Remote Control</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{rotation?.status || "Draft"}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 font-semibold text-slate-300">{copiedSummary}</span>
              <span title={submitHelp} className={`rounded-full border px-3 py-1 font-semibold ${canSubmit ? "border-emerald-400 bg-emerald-500/15 text-emerald-200" : "border-rose-400 bg-rose-500/15 text-rose-100"}`}>{canSubmit ? "Ready to submit" : "Submit blocked"}</span>
              {rotation?.updatedAt && <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 font-semibold text-slate-300">Updated {rotation.updatedAt}</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            <RemoteButton icon={Clipboard} label="Copy" onClick={onCopy} />
            <RemoteButton icon={ChevronDown} label="Load" onClick={onLoad} disabled={!copiedRotation} />
            <RemoteUploadButton onChange={handleUpload} />
            <RemoteButton icon={Printer} label={showPrintPreview ? "Hide View" : "View/Print"} onClick={() => setShowPrintPreview((value) => !value)} tone="light" />
            {onGenerateMenu && <RemoteButton icon={CalendarDays} label="Generate Menu" onClick={onGenerateMenu} tone="light" />}
            <RemoteButton icon={Save} label="Save Draft" onClick={onSaveDraft} tone="light" />
            <RemoteButton icon={Send} label="Submit" onClick={onSubmit} blocked={!canSubmit} title={submitHelp} tone="go" />
          </div>
        </div>
        {!canSubmit && (
          <div className="mt-3 rounded-2xl border border-rose-400/60 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-50 shadow-[0_0_0_1px_rgba(251,113,133,0.18)]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 shrink-0 text-rose-200" size={18} />
              <div>
                <p className="font-black">Submit is blocked until these are fixed:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {submitIssues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 rounded-[1.35rem] border border-slate-700 bg-slate-900 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Current Cafe</p>
        <p className="mt-1 text-sm font-semibold text-slate-200">{cafe} · {week}</p>
      </div>

      {showPrintPreview && <WeeklyPrintPreview week={week} cafe={cafe} rows={printRows || []} />}

      {preview && (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-bold">Review before applying</p>
              <h4 className="text-xl font-bold text-amber-950 mt-1">{preview.reportType}</h4>
              <p className="text-sm text-amber-900 mt-1">Detected: {preview.detectedCafe} • {preview.detectedStation} • {preview.detectedDateRange}</p>
              <p className="text-xs text-amber-800 mt-2">This applies only to the café and week currently open: <span className="font-semibold">{cafe}</span>.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="rounded-2xl bg-white border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">Cancel</button>
              <button onClick={applyPreview} className="rounded-2xl bg-amber-900 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-800">Apply to Open Café/Week</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <PreviewBox title="Global Entrees" items={preview.global.entrees} />
            <PreviewBox title="Global Sides" items={preview.global.sides} />
            <PreviewBox title="Station LTOs" items={[...preview.uploadedLtos.pizza, ...preview.uploadedLtos.salad, ...preview.uploadedLtos.deli, ...preview.uploadedLtos.fishMarket]} />
            <PreviewBox title="Station Mapping" items={preview.stationAliases.map((row) => `${row.source} → ${STATION_LABELS[row.mappedTo] || row.mappedTo}`)} />
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitBlockedModal({ cafe, menu, issues, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 print:hidden" role="dialog" aria-modal="true" aria-labelledby="submit-blocked-title">
      <div className="w-full max-w-xl rounded-[1.75rem] border border-rose-300 bg-white p-6 text-slate-950 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Submission blocked</p>
            <h3 id="submit-blocked-title" className="mt-1 text-2xl font-black">Fix this before submitting</h3>
            <p className="mt-2 text-sm font-semibold text-slate-600">{cafe}{menu ? ` - ${menu}` : ""}</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-950">
          <ul className="list-disc space-y-2 pl-5">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">OK</button>
        </div>
      </div>
    </div>
  );
}

function RemoteButton({ icon: Icon, label, onClick, disabled = false, blocked = false, title = "", tone = "default" }) {
  const toneClass = tone === "go"
    ? "border-emerald-400 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
    : tone === "light"
      ? "border-slate-500 bg-white text-slate-950 hover:bg-slate-100"
      : "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700";
  const blockedClass = "border-rose-400/70 bg-rose-500/15 text-rose-50 hover:bg-rose-500/25";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={blocked || disabled}
      title={title}
      className={`flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2.5 py-2.5 text-center text-[11px] font-bold leading-tight shadow-sm transition ${disabled ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500 opacity-60" : blocked ? blockedClass : toneClass}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function RemoteUploadButton({ onChange }) {
  return (
    <label className="flex min-h-[64px] min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-slate-600 bg-slate-800 px-2.5 py-2.5 text-center text-[11px] font-bold leading-tight text-slate-100 shadow-sm transition hover:bg-slate-700">
      <Upload size={18} />
      <span>Upload</span>
      <input type="file" accept="application/pdf,.pdf" onChange={onChange} className="hidden" />
    </label>
  );
}

function openPrintWindow() {
  const printContent = document.getElementById("weekly-cafe-print-packet")?.innerHTML;
  if (!printContent) return;
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <title>Weekly Rotation Packet</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
          h1, h2, h3, h4, p { margin-top: 0; }
          .rounded-2xl, .rounded-xl, .rounded-3xl { border-radius: 12px; }
          .border { border: 1px solid #e2e8f0; }
          .bg-white, .bg-slate-50 { background: #fff; }
          .p-3 { padding: 12px; }
          .p-4 { padding: 16px; }
          .p-5 { padding: 20px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-3 { margin-top: 12px; }
          .mt-4 { margin-top: 16px; }
          .mb-4 { margin-bottom: 16px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .text-sm { font-size: 13px; }
          .text-xs { font-size: 11px; }
          .font-bold, .font-semibold { font-weight: 700; }
          .text-slate-500, .text-slate-600 { color: #64748b; }
          ul { padding-left: 18px; }
          @media print { button { display: none; } body { margin: 16px; } }
        </style>
      </head>
      <body>${printContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

function WeeklyPrintPreview({ week, cafe, rows }) {
  const row = rows.find((entry) => entry.cafe === cafe) || { cafe, ...EMPTY_ROTATION };
  const districtName = row.district || Object.entries(DISTRICTS).find(([, cafes]) => cafes.includes(cafe))?.[0] || "—";
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Print Preview</p>
          <h3 className="text-3xl font-bold mt-1">Weekly Rotation Packet</h3>
          <p className="text-sm text-slate-500 mt-1">Week: <span className="font-semibold text-slate-900">{week}</span> • Café: <span className="font-semibold text-slate-900">{cafe}</span></p>
        </div>
        <button onClick={openPrintWindow} className="rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold hover:bg-slate-700">Open Print Window</button>
      </div>

      <div id="weekly-cafe-print-packet" className="mt-5">
        <div className="border border-slate-200 rounded-2xl p-5 mb-4 bg-white">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Neighborhood Rotations</p>
          <h1 className="text-3xl font-bold mt-1">Weekly Rotation Packet</h1>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Café</p><p className="font-bold text-slate-900 mt-1">{cafe}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">District</p><p className="font-bold text-slate-900 mt-1">{districtName}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Fiscal Week</p><p className="font-bold text-slate-900 mt-1">{week}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Status</p><p className="font-bold text-slate-900 mt-1">{row.status || "Draft"}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Updated</p><p className="font-bold text-slate-900 mt-1">{row.updatedAt || "—"}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Submitted</p><p className="font-bold text-slate-900 mt-1">{row.submittedAt || "—"}</p></div>
          </div>
        </div>
        <ExportCafeCard row={row} />
      </div>
    </div>
  );
}

function ExportCafeCard({ row }) {
  const items = selectedItems(row);
  const trueCostRange = selectedTrueCostRange(items);
  const foodCostRange = selectedFoodCostRange(items);
  const cafeStations = CAFE_STATION_CONFIG[row.cafe] || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 break-inside-avoid">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">{row.cafe}</h3>
          <p className="text-sm text-slate-500">{row.status || "Draft"}{row.submittedAt ? ` • Submitted ${row.submittedAt}` : ""}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-slate-900">{pctRange(foodCostRange)}</p>
          <p className="text-slate-500">{moneyRange(trueCostRange)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Global</p>
        <p className="font-semibold text-slate-900 mt-1">{row.menu || "No Global Menu selected"}</p>
        {row.station && <p className="text-sm text-slate-500">{row.station}</p>}
        <ExportLine label="Entrées" values={row.entrees} />
        <ExportLine label="Sides" values={row.sides} />
        <ExportLine label="Sub Recipes" values={row.subRecipes} />
        <ExportLine label="Extensions" values={row.extensions} />
      </div>

      <div className="mt-3 space-y-2">
        {cafeStations.filter((stationKey) => stationKey !== "global").map((stationKey) => (
          <ExportStationBlock key={stationKey} stationKey={stationKey} cafe={row.cafe} row={row} />
        ))}
      </div>
    </div>
  );
}

function ExportStationBlock({ stationKey, cafe, row }) {
  if (stationKey === "grill") return <ExportLineCard title={stationLabel(cafe, stationKey)} values={[row.grill?.regionalSpecial, row.grill?.locationSpotlight, row.grill?.promoActive ? row.grill?.promoItem : ""]} />;
  if (stationKey === "carvery") return <ExportLineCard title={stationLabel(cafe, stationKey)} values={Object.values(row.carvery || {})} />;
  if (stationKey === "wok") return <ExportLineCard title={stationLabel(cafe, stationKey)} values={[...(row.ltos?.wokEntrees || []), ...(row.ltos?.wokSides || []), ...(row.ltos?.wokBase || []), ...(row.ltos?.wokSubRecipes || [])]} />;
  if (stationKey === "lotusWp") return <ExportLineCard title={stationLabel(cafe, stationKey)} values={[...(row.ltos?.lotusEntrees || []), ...(row.ltos?.lotusSides || [])]} />;
  if (["streetBeets", "commissaryEverest", "stationTakeover"].includes(stationKey)) return <ExportLineCard title={stationLabel(cafe, stationKey)} values={customStationRows(row, stationKey).map((item) => getDisplayName(item))} />;
  return <ExportLineCard title={stationLabel(cafe, stationKey)} values={row.ltos?.[stationKey] || []} />;
}

function ExportLineCard({ title, values }) {
  const clean = (values || []).filter(Boolean);
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">{title}</p>
      {clean.length ? <ul className="mt-1 text-sm text-slate-700 space-y-1">{clean.map((value, index) => <li key={`${value}-${index}`}>• {titleCase(value)}</li>)}</ul> : <p className="mt-1 text-sm text-slate-400">No selection</p>}
    </div>
  );
}

function ExportLine({ label, values }) {
  const clean = (values || []).filter(Boolean);
  if (!clean.length) return null;
  return <p className="text-sm text-slate-600 mt-1"><span className="font-semibold text-slate-900">{label}:</span> {clean.map(titleCase).join(", ")}</p>;
}

function CopyWeekPanel({ copiedRotation, onCopy, onLoad }) {
  const copiedSummary = copiedRotation?.menu ? `${copiedRotation.menu}${copiedRotation.station ? ` • ${copiedRotation.station}` : ""}` : "No copied rotation saved";
  return (
    <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50/80 p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-700 font-bold">Copy Week</p>
          <h3 className="text-2xl font-bold mt-1">Reuse a Saved Rotation</h3>
          <p className="text-sm text-slate-600 mt-1">Copy this café’s current rotation, switch to another week, then load it into that open week.</p>
          <p className="text-xs text-slate-500 mt-2">Saved copy: {copiedSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onCopy} className="rounded-2xl bg-white border border-sky-200 px-5 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-100">Copy Current Rotation</button>
          <button onClick={onLoad} disabled={!copiedRotation} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${copiedRotation ? "bg-slate-900 text-white hover:bg-slate-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>Load Copied Rotation</button>
        </div>
      </div>
    </div>
  );
}

function WeekAtGlanceUpload({ cafe, preview, setPreview, applyPreview }) {
  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(weekAtGlancePreview(file.name));
    event.target.value = "";
  };

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">PDF Import</p>
          <h3 className="text-2xl font-bold mt-1">Upload Week at a Glance</h3>
          <p className="text-sm text-slate-500 mt-1">Upload the MenuWorks Week at a Glance report. It applies only to the café and week currently open: <span className="font-semibold text-slate-900">{cafe}</span>.</p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700 cursor-pointer text-sm">
          <Upload size={16} /> Upload PDF
          <input type="file" accept="application/pdf,.pdf" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      {preview && (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-bold">Review before applying</p>
              <h4 className="text-xl font-bold text-amber-950 mt-1">{preview.reportType}</h4>
              <p className="text-sm text-amber-900 mt-1">Detected: {preview.detectedCafe} • {preview.detectedStation} • {preview.detectedDateRange}</p>
              <p className="text-xs text-amber-800 mt-2">Preview only. Production should parse the PDF through a Vercel API route and match items to the database.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="rounded-2xl bg-white border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">Cancel</button>
              <button onClick={applyPreview} className="rounded-2xl bg-amber-900 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-800">Apply to Open Café/Week</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <PreviewBox title="Global Entrees" items={preview.global.entrees} />
            <PreviewBox title="Global Sides" items={preview.global.sides} />
            <PreviewBox title="Station LTOs" items={[...preview.uploadedLtos.pizza, ...preview.uploadedLtos.salad, ...preview.uploadedLtos.deli, ...preview.uploadedLtos.fishMarket]} />
            <PreviewBox title="Station Mapping" items={preview.stationAliases.map((row) => `${row.source} → ${STATION_LABELS[row.mappedTo] || row.mappedTo}`)} />
          </div>
        </div>
      )}
    </div>
  );
}

function BingoCustomerMenuPanel({ week, rotation }) {
  const grillItem = rotation.grill?.regionalSpecial || rotation.grill?.locationSpotlight || "";
  const grillFreshFive = rotation.ltos?.grillFreshFive?.[0] || "";
  const rows = [
    {
      target: "Grill Location Spotlight edit area",
      item: grillItem,
      slot: 1,
      notes: "PowerPoint page 3. Replace highlighted text only, keep text box, font, size, and formatting, then remove highlight."
    },
    {
      target: "Grill Fresh Five edit area",
      item: grillFreshFive,
      slot: 2,
      notes: "PowerPoint page 3. Replace highlighted text only, keep text box, font, size, and formatting, then remove highlight."
    }
  ].map((row) => {
    const itemRow = row.item ? selectedRowForName(row.item) : null;
    return {
      ...row,
      title: itemRow ? getDisplayName(itemRow) : row.item,
      calories: itemRow ? getCalories(itemRow) : "",
      description: itemRow ? getDescription(itemRow) : ""
    };
  });
  return (
    <div className="mb-5 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 font-black">Bingo Customer Menu Generator</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Grill PowerPoint Page 3</h3>
          <p className="mt-1 text-sm font-semibold text-emerald-900">Test scope: one Grill Location Spotlight and one Grill Fresh $5. Save Draft or Submit writes these as customer menu edit records.</p>
        </div>
        <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-black text-emerald-800">{week}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={row.target} className={`rounded-2xl border p-4 ${row.item ? "border-emerald-300 bg-white" : "border-amber-200 bg-amber-50"}`}>
            <p className="text-xs uppercase tracking-[0.16em] font-black text-slate-500">{row.target}</p>
            <p className="mt-2 text-lg font-black text-slate-950">{row.title || "Select item before generating"}</p>
            <div className="mt-3 space-y-1 text-xs font-semibold text-slate-600">
              <p>Title: {row.title || "missing"}</p>
              <p>Calories: {row.calories || "missing"}</p>
              <p>Description: {row.description || "missing"}</p>
              <p>Record Type: Customer Menu Edit</p>
              <p>Station Key: customerMenu</p>
              <p>Menu Block Type: PowerPoint Page 3</p>
              <p>Slot Number: {row.slot}</p>
              <p>Notes: {row.notes}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-black text-slate-950">Where this goes in Smartsheet</p>
        <p className="mt-1">Use the existing Menu Rotation Smartsheet. These rows land under the same Bingo/week parent with <span className="font-bold">Record Type = Customer Menu Edit</span>, <span className="font-bold">Station Display Name = Bingo Customer Menu</span>, and <span className="font-bold">Menu Block Label = Bingo Grill PowerPoint</span>. The customer title writes to <span className="font-bold">Menu Item / Selection</span>, calories write to <span className="font-bold">Calories</span>, the customer copy writes to <span className="font-bold">Enticing Description</span>, and the highlighted PowerPoint area writes to <span className="font-bold">Notes</span>.</p>
      </div>
    </div>
  );
}

function PreviewBox({ title, items }) {
  return <div className="rounded-2xl bg-white border border-amber-200 p-4"><p className="font-bold text-amber-950">{title}</p><ul className="mt-2 space-y-1 text-amber-900">{items.map((item) => <li key={item}>• {titleCase(item)}</li>)}</ul></div>;
}

function StationPills({ cafe, stations }) {
  const jumpToStation = (stationKey) => {
    document.getElementById(stationAnchorId(stationKey))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Jump to planner station">
      {stations.map((station) => (
        <button
          key={station}
          type="button"
          onClick={() => jumpToStation(station)}
          className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 active:scale-[0.98]"
          aria-label={`Jump to ${stationLabel(cafe, station)}`}
        >
          {stationLabel(cafe, station)}
        </button>
      ))}
    </div>
  );
}

function CafeStationSection(props) {
  const { stationKey, cafe, week, rotation, previousRotation, previousWeek, menuOptions, stationOptions, categorized, updateRotation, updateSlot, updateGrill, updateLto, updateCarvery, updateCustomStation, updateCustomStationArray, summary, selectedItems } = props;
  let content = null;
  if (stationKey === "global") content = <GlobalSection cafe={cafe} week={week} rotation={rotation} previousRotation={previousRotation} previousWeek={previousWeek} menuOptions={menuOptions} stationOptions={stationOptions} categorized={categorized} updateRotation={updateRotation} updateSlot={updateSlot} summary={summary} selectedItems={selectedItems} />;
  if (stationKey === "grill") content = <GrillSection cafe={cafe} rotation={rotation} updateGrill={updateGrill} />;
  if (stationKey === "salad") content = <SimpleLTOSection stationKey="salad" title="Salad LTOs" slots={Array.from({ length: stationSlots(cafe, "salad") }, (_, i) => `Salad LTO ${i + 1}`)} values={rotation.ltos?.salad || EMPTY_ROTATION.ltos.salad} uploaded={rotation.uploadedLtos?.salad || []} updateLto={updateLto} complete={stationComplete(rotation, "salad", cafe)} />;
  if (stationKey === "pizza") content = <SimpleLTOSection stationKey="pizza" title="Pizza / Flatbread LTOs" slots={Array.from({ length: stationSlots(cafe, "pizza") }, (_, i) => `Pizza/Flatbread LTO ${i + 1}`)} values={rotation.ltos?.pizza || EMPTY_ROTATION.ltos.pizza} uploaded={rotation.uploadedLtos?.pizza || []} updateLto={updateLto} complete={stationComplete(rotation, "pizza", cafe)} />;
  if (stationKey === "deli") content = <SimpleLTOSection stationKey="deli" title="Deli LTOs" slots={Array.from({ length: stationSlots(cafe, "deli") }, (_, i) => `Deli LTO ${i + 1}`)} values={rotation.ltos?.deli || EMPTY_ROTATION.ltos.deli} uploaded={rotation.uploadedLtos?.deli || []} updateLto={updateLto} complete={stationComplete(rotation, "deli", cafe)} />;
  if (stationKey === "fishMarket") content = <SimpleLTOSection stationKey="fishMarket" title="Fish Market LTO" slots={Array.from({ length: stationSlots(cafe, "fishMarket") }, (_, i) => `Fish Market LTO ${i + 1}`)} values={rotation.ltos?.fishMarket || EMPTY_ROTATION.ltos.fishMarket} uploaded={rotation.uploadedLtos?.fishMarket || []} updateLto={updateLto} complete={stationComplete(rotation, "fishMarket", cafe)} />;
  if (stationKey === "noodles") content = <SecondaryGlobalSection blockId="noodles" title="Noodle Station" eyebrow="Secondary Global" rotation={rotation} menuOptions={menuOptions} updateRotation={updateRotation} />;
  if (stationKey === "freshFive") content = <SimpleLTOSection stationKey="freshFive" title="Fresh $5" slots={Array.from({ length: stationSlots(cafe, "freshFive") }, (_, i) => `Fresh $5 Option ${i + 1}`)} values={rotation.ltos?.freshFive || EMPTY_ROTATION.ltos.freshFive} uploaded={rotation.uploadedLtos?.freshFive || []} updateLto={updateLto} complete={stationComplete(rotation, "freshFive", cafe)} />;
  if (stationKey === "grillFreshFive") content = <SimpleLTOSection stationKey="grillFreshFive" title="Grill Fresh $5" slots={["Grill Fresh $5"]} values={rotation.ltos?.grillFreshFive || EMPTY_ROTATION.ltos.grillFreshFive} uploaded={rotation.uploadedLtos?.grillFreshFive || []} updateLto={updateLto} complete={stationComplete(rotation, "grillFreshFive", cafe)} />;
  if (stationKey === "saladFreshFive") content = <SimpleLTOSection stationKey="saladFreshFive" title="Salad Fresh $5" slots={["Salad Fresh $5"]} values={rotation.ltos?.saladFreshFive || EMPTY_ROTATION.ltos.saladFreshFive} uploaded={rotation.uploadedLtos?.saladFreshFive || []} updateLto={updateLto} complete={stationComplete(rotation, "saladFreshFive", cafe)} />;
  if (stationKey === "soup") content = <SimpleLTOSection stationKey="soup" title="Soup LTOs" slots={Array.from({ length: stationSlots(cafe, "soup") }, (_, i) => `Soup ${i + 1}`)} values={rotation.ltos?.soup || EMPTY_ROTATION.ltos.soup} uploaded={rotation.uploadedLtos?.soup || []} updateLto={updateLto} complete={stationComplete(rotation, "soup", cafe)} />;
  if (stationKey === "wok") content = <WokSection rotation={rotation} updateLto={updateLto} />;
  if (stationKey === "carvery") content = <CarverySection rotation={rotation} updateCarvery={updateCarvery} />;
  if (stationKey === "streetBeets") content = <StreetBeetsSection rotation={rotation} updateCustomStationArray={updateCustomStationArray} />;
  if (stationKey === "commissaryEverest") content = <CommissaryEverestSection rotation={rotation} updateCustomStation={updateCustomStation} updateCustomStationArray={updateCustomStationArray} />;
  if (stationKey === "lotusWp") content = <LotusWpSection rotation={rotation} updateLto={updateLto} />;
  if (stationKey === "stationTakeover") content = <StationTakeoverSection rotation={rotation} updateCustomStation={updateCustomStation} updateCustomStationArray={updateCustomStationArray} />;
  if (!content) return null;
  return <div id={stationAnchorId(stationKey)} className="scroll-mt-28">{content}</div>;
}

function GlobalSection({ cafe, week, rotation, previousRotation, previousWeek, menuOptions, stationOptions, categorized, updateRotation, updateSlot, summary, selectedItems }) {
  const globalTitle = cafe === "Doppler" ? "Wok Xahn" : "Global Station";
  const cycle = globalCycleConfig(cafe, week);
  const promo = rotation.promotionOverride || EMPTY_ROTATION.promotionOverride;
  const updatePromo = (patch) => updateRotation({ promotionOverride: { ...promo, ...patch } });
  const menuStationOptions = subConceptOptionsForMenu(rotation.menu);
  const menuCategorized = categorize(globalMenuRows(rotation.menu, rotation.station));
  const carryover = carryoverGlobalBlock(previousRotation);
  const slotConfig = globalSlotConfig(cafe);

  const selectMenu = (menu) => {
    updateRotation({
      menu,
      station: "",
      entrees: [...EMPTY_ROTATION.entrees],
      sides: [...EMPTY_ROTATION.sides],
      subRecipes: [...EMPTY_ROTATION.subRecipes],
      extensions: [...EMPTY_ROTATION.extensions],
      globalBlocks: {},
      promotionOverride: promo,
      status: "Draft",
      submittedAt: "",
      submittedBy: "Chef",
      updatedAt: nowStamp()
    });
  };

  const selectStation = (station) => {
    updateRotation({
      station,
      entrees: [...EMPTY_ROTATION.entrees],
      sides: [...EMPTY_ROTATION.sides],
      subRecipes: [...EMPTY_ROTATION.subRecipes],
      extensions: [...EMPTY_ROTATION.extensions],
      promotionOverride: promo,
      globalBlocks: rotation.globalBlocks || {},
      status: "Draft",
      submittedAt: "",
      submittedBy: "Chef",
      updatedAt: nowStamp()
    });
  };

  if (cafe === "Re:Invent") {
    return <ReInventGlobalSection cafe={cafe} week={week} rotation={rotation} previousRotation={previousRotation} previousWeek={previousWeek} menuOptions={menuOptions} stationOptions={stationOptions} categorized={categorized} updateRotation={updateRotation} updateSlot={updateSlot} summary={summary} selectedItems={selectedItems} promo={promo} updatePromo={updatePromo} />;
  }

  if (cafe === "Nitro") {
    return <NitroGlobalSection rotation={rotation} menuOptions={menuOptions} updateRotation={updateRotation} promo={promo} updatePromo={updatePromo} summary={summary} />;
  }

  return (
    <CollapsibleStation title={globalTitle} eyebrow="Global Rotation" complete={stationComplete(rotation, "global")} defaultOpen={!stationComplete(rotation, "global")}>
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Cycle Pattern</p>
            <h4 className="text-xl font-bold mt-1">{cycle.title}</h4>
            <p className="mt-1 text-sm text-slate-500 max-w-3xl">{cycle.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cycle.chips.map((chip) => (
                <span key={`${chip.label}-${chip.note}`} className={`rounded-full border px-3 py-1 text-xs font-bold ${cycleChipClass(chip.tone)}`}>{chip.label} · {chip.note}</span>
              ))}
            </div>
          </div>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-900 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(promo.enabled)}
              onChange={(e) => updatePromo({ enabled: e.target.checked })}
            />
            Promotion Override
          </label>
        </div>
      </div>

      {cycle.startedPreviousWeek && (
        <CarryoverPanel
          title="Monday + Tuesday Carryover"
          previousWeek={previousWeek}
          block={carryover}
          empty="No saved prior-week Global found yet. Once last week's rotation is saved, Monday and Tuesday will show here."
        />
      )}

      {promo.enabled && (
        <div className="mt-4 rounded-3xl border border-purple-200 bg-purple-50/80 p-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-purple-700 font-bold">Promotion Override Active</p>
              <h4 className="text-xl font-bold text-purple-950 mt-1">Break the normal cycle for this café/week only</h4>
              <p className="text-sm text-purple-900 mt-1">Use this for Global takeovers, promos, or one-off concepts. Return-to-cycle days restore normalcy without changing future weeks.</p>
            </div>
            <button type="button" onClick={() => updatePromo({ enabled: false, name: "", days: [], returnDays: [] })} className="rounded-2xl bg-white border border-purple-200 px-4 py-2 text-sm font-bold text-purple-900 hover:bg-purple-100">Clear Override</button>
          </div>
          <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-purple-900 mb-2">Promotion / Takeover Name</label>
              <input value={promo.name || ""} onChange={(e) => updatePromo({ name: e.target.value })} placeholder="Example: Global Takeover / Promo" className="w-full rounded-2xl border border-purple-200 bg-white px-4 py-3 font-semibold outline-none focus:border-purple-500" />
            </div>
            <DayToggleGroup title="Promo Days" values={promo.days || []} onToggle={(day) => updatePromo({ days: updateArrayToggle(promo.days || [], day) })} tone="purple" />
            <DayToggleGroup title="Return-To-Cycle Days" values={promo.returnDays || []} onToggle={(day) => updatePromo({ returnDays: updateArrayToggle(promo.returnDays || [], day) })} tone="amber" />
          </div>
          <PromotionReturnControls promo={promo} updatePromo={updatePromo} menuOptions={menuOptions} currentMenu={rotation.menu} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-2">Global Menu</label>
          <select value={rotation.menu} onChange={(e) => selectMenu(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
            <option value="">Select Menu</option>
            {menuOptions.map((menu) => <option key={menu} value={menu}>{menu}</option>)}
          </select>
        </div>
        {rotation.menu && menuStationOptions.length > 1 && (
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2">Street Eats Option</label>
            <select value={rotation.station || ""} onChange={(e) => selectStation(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">Select Street Eats Option</option>
              {menuStationOptions.map((station) => <option key={station} value={station}>{station}</option>)}
            </select>
          </div>
        )}
      </div>
      {rotation.menu && <LiveAnalytics summary={summary} selectedItems={globalSelectedRows(rotation)} />}
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-4 gap-5">
        <PickerGroup title="Entrees" limit={`${slotConfig.entreeSlots} slots; ${slotConfig.entreeRequired} required`} items={menuCategorized.entrees} values={sizedValues(rotation.entrees, slotConfig.entreeSlots)} onChange={(index, value) => updateSlot("entrees", index, value)} />
        <PickerGroup title="Sides" limit={`${slotConfig.sideSlots} slots; ${slotConfig.sideRequired} required`} items={menuCategorized.sides} values={sizedValues(rotation.sides, slotConfig.sideSlots)} onChange={(index, value) => updateSlot("sides", index, value)} />
        <PickerGroup title="Sub Recipes" limit={`up to ${slotConfig.subRecipeSlots}`} items={menuCategorized.subRecipes} values={sizedValues(rotation.subRecipes, slotConfig.subRecipeSlots)} onChange={(index, value) => updateSlot("subRecipes", index, value)} />
        <PickerGroup title="Extensions" limit={`up to ${slotConfig.extensionSlots}`} items={menuCategorized.extensions} values={sizedValues(rotation.extensions, slotConfig.extensionSlots)} onChange={(index, value) => updateSlot("extensions", index, value)} />
      </div>
      <StationSelectedList title="Items Description" items={globalSelectedRows(rotation, { unique: true })} complete={stationComplete(rotation, "global")} />
    </CollapsibleStation>
  );
}

function NitroGlobalSection({ rotation, menuOptions, updateRotation, promo, updatePromo, summary }) {
  const layout = nitroGlobalBlockLayout();
  const menuStationOptions = subConceptOptionsForMenu(rotation.menu);
  const setMenu = (menu) => {
    const blocks = Object.fromEntries(layout.map((block) => [block.id, blankGlobalBlock(menu, "")]));
    updateRotation({
      menu,
      station: "",
      entrees: [...EMPTY_ROTATION.entrees],
      sides: [...EMPTY_ROTATION.sides],
      subRecipes: [...EMPTY_ROTATION.subRecipes],
      extensions: [...EMPTY_ROTATION.extensions],
      globalBlocks: { ...(rotation.globalBlocks || {}), ...blocks },
      promotionOverride: promo,
      status: "Draft",
      submittedAt: "",
      submittedBy: "Chef",
      updatedAt: nowStamp()
    });
  };
  const setStation = (station) => {
    const blocks = Object.fromEntries(layout.map((block) => [block.id, blankGlobalBlock(rotation.menu, station)]));
    updateRotation({
      station,
      globalBlocks: { ...(rotation.globalBlocks || {}), ...blocks },
      promotionOverride: promo,
      status: "Draft",
      submittedAt: "",
      submittedBy: "Chef",
      updatedAt: nowStamp()
    });
  };
  const updateBlockSlot = (blockId, key, index, value) => {
    const current = getRotationGlobalBlock(rotation, blockId);
    const base = current.menu || blockHasSelections(current) ? current : hydrateNitroBlock(rotation, blockId);
    const nextValues = [...(base[key] || blankGlobalBlock()[key])];
    nextValues[index] = value;
    updateRotation({ globalBlocks: { ...(rotation.globalBlocks || {}), [blockId]: { ...base, [key]: nextValues } } });
  };

  return (
    <CollapsibleStation title="Global Station" eyebrow="Nitro Same-Menu Split" complete={stationComplete(rotation, "global", "Nitro")} defaultOpen={!stationComplete(rotation, "global", "Nitro")}>
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Cycle Pattern</p>
            <h4 className="text-xl font-bold mt-1">Nitro Wednesday Protein Change</h4>
            <p className="mt-1 text-sm text-slate-500 max-w-3xl">Nitro keeps the same Global menu for the week, then changes the selected proteins/items starting Wednesday.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {layout.map((block) => (
                <span key={block.id} className={`rounded-full border px-3 py-1 text-xs font-bold ${cycleChipClass("sky")}`}>{block.title}</span>
              ))}
            </div>
          </div>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-900 cursor-pointer">
            <input type="checkbox" checked={Boolean(promo.enabled)} onChange={(e) => updatePromo({ enabled: e.target.checked })} />
            Promotion Override
          </label>
        </div>
      </div>

      {promo.enabled && (
        <div className="mt-4 rounded-3xl border border-purple-200 bg-purple-50/80 p-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-purple-700 font-bold">Promotion Override Active</p>
              <h4 className="text-xl font-bold text-purple-950 mt-1">Break Nitro's normal weekly pattern for this week only</h4>
            </div>
            <button type="button" onClick={() => updatePromo({ enabled: false, name: "", days: [], returnDays: [] })} className="rounded-2xl bg-white border border-purple-200 px-4 py-2 text-sm font-bold text-purple-900 hover:bg-purple-100">Clear Override</button>
          </div>
          <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-purple-900 mb-2">Promotion / Takeover Name</label>
              <input value={promo.name || ""} onChange={(e) => updatePromo({ name: e.target.value })} placeholder="Example: Global Takeover / Promo" className="w-full rounded-2xl border border-purple-200 bg-white px-4 py-3 font-semibold outline-none focus:border-purple-500" />
            </div>
            <DayToggleGroup title="Promo Days" values={promo.days || []} onToggle={(day) => updatePromo({ days: updateArrayToggle(promo.days || [], day) })} tone="purple" />
            <DayToggleGroup title="Return-To-Cycle Days" values={promo.returnDays || []} onToggle={(day) => updatePromo({ returnDays: updateArrayToggle(promo.returnDays || [], day) })} tone="amber" />
          </div>
          <PromotionReturnControls promo={promo} updatePromo={updatePromo} menuOptions={menuOptions} currentMenu={rotation.menu} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-2">Global Menu</label>
          <select value={rotation.menu} onChange={(e) => setMenu(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
            <option value="">Select Menu</option>
            {menuOptions.map((menu) => <option key={menu} value={menu}>{menu}</option>)}
          </select>
        </div>
        {rotation.menu && menuStationOptions.length > 1 && (
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2">Street Eats Option</label>
            <select value={rotation.station || ""} onChange={(e) => setStation(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">Select Street Eats Option</option>
              {menuStationOptions.map((station) => <option key={station} value={station}>{station}</option>)}
            </select>
          </div>
        )}
      </div>

      {rotation.menu && <LiveAnalytics summary={summary} selectedItems={globalSelectedRowsForCafe(rotation, "Nitro")} />}
      {rotation.menu && (
        <div className="mt-5 grid grid-cols-1 gap-5">
          {layout.map((blockInfo) => {
            const block = getRotationGlobalBlock(rotation, blockInfo.id);
            const hydratedBlock = block.menu || blockHasSelections(block) ? block : hydrateNitroBlock(rotation, blockInfo.id);
            const blockCategorized = categorize(globalMenuRows(rotation.menu, rotation.station));
            return (
              <div key={blockInfo.id} className="rounded-3xl border-2 border-sky-200 bg-sky-50/60 p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sky-700 font-bold">Nitro Global Split</p>
                    <h4 className="text-2xl font-bold mt-1">{blockInfo.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{blockInfo.help}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${blockComplete(hydratedBlock) ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-sky-200 text-sky-800"}`}>{blockComplete(hydratedBlock) ? "complete" : "needs items"}</span>
                </div>
                <div className="mt-5 grid grid-cols-1 xl:grid-cols-4 gap-5">
                  <PickerGroup title="Entrees" limit="up to 3" items={blockCategorized.entrees} values={hydratedBlock.entrees || ["", "", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "entrees", slot, value)} />
                  <PickerGroup title="Sides" limit="up to 4" items={blockCategorized.sides} values={hydratedBlock.sides || ["", "", "", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "sides", slot, value)} />
                  <PickerGroup title="Sub Recipes" limit="up to 4" items={blockCategorized.subRecipes} values={hydratedBlock.subRecipes || ["", "", "", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "subRecipes", slot, value)} />
                  <PickerGroup title="Extensions" limit="up to 2" items={blockCategorized.extensions} values={hydratedBlock.extensions || ["", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "extensions", slot, value)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <StationSelectedList title="Items Description" items={globalSelectedRowsForCafe(rotation, "Nitro", { unique: true })} complete={stationComplete(rotation, "global", "Nitro")} />
    </CollapsibleStation>
  );
}


function ReInventGlobalSection({ cafe, week, rotation, previousRotation, previousWeek, menuOptions, stationOptions, categorized, updateRotation, selectedItems, promo, updatePromo }) {
  const cycle = globalCycleConfig(cafe, week);
  const layout = reInventGlobalBlockLayout(week);
  const updateBlock = (blockId, patch) => {
    const current = getRotationGlobalBlock(rotation, blockId);
    updateRotation({ globalBlocks: { ...(rotation.globalBlocks || {}), [blockId]: { ...current, ...patch } } });
  };
  const updateBlockSlot = (blockId, key, index, value) => {
    const current = getRotationGlobalBlock(rotation, blockId);
    const nextValues = [...(current[key] || blankGlobalBlock()[key])];
    nextValues[index] = value;
    updateBlock(blockId, { [key]: nextValues });
  };

  return (
    <CollapsibleStation title="Global Station" eyebrow="Re:Invent Global Rotation" complete={stationComplete(rotation, "global", cafe, week)} defaultOpen={!stationComplete(rotation, "global", cafe, week)}>
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Cycle Pattern</p>
            <h4 className="text-xl font-bold mt-1">{cycle.title}</h4>
            <p className="mt-1 text-sm text-slate-500 max-w-3xl">ReInvent uses multiple Global selections in one week. Monday may be carryover information from last week, and selectable blocks change based on the alternating cycle.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {layout.map((block) => (
                <span key={block.id} className={`rounded-full border px-3 py-1 text-xs font-bold ${cycleChipClass(block.readOnly ? "indigo" : block.continuesNextWeek ? "amber" : "sky")}`}>{block.title}{block.readOnly ? " · carryover" : block.continuesNextWeek ? " · carries to next Monday" : " · select"}</span>
              ))}
            </div>
          </div>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-900 cursor-pointer">
            <input type="checkbox" checked={Boolean(promo.enabled)} onChange={(e) => updatePromo({ enabled: e.target.checked })} />
            Promotion Override
          </label>
        </div>
      </div>

      {promo.enabled && (
        <div className="mt-4 rounded-3xl border border-purple-200 bg-purple-50/80 p-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-purple-700 font-bold">Promotion Override Active</p>
              <h4 className="text-xl font-bold text-purple-950 mt-1">Break the normal ReInvent cycle for this week only</h4>
              <p className="text-sm text-purple-900 mt-1">Use this for Global takeovers, promos, or one-off concepts. Return-to-cycle days restore normalcy without changing future weeks.</p>
            </div>
            <button type="button" onClick={() => updatePromo({ enabled: false, name: "", days: [], returnDays: [] })} className="rounded-2xl bg-white border border-purple-200 px-4 py-2 text-sm font-bold text-purple-900 hover:bg-purple-100">Clear Override</button>
          </div>
          <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-purple-900 mb-2">Promotion / Takeover Name</label>
              <input value={promo.name || ""} onChange={(e) => updatePromo({ name: e.target.value })} placeholder="Example: Global Takeover / Promo" className="w-full rounded-2xl border border-purple-200 bg-white px-4 py-3 font-semibold outline-none focus:border-purple-500" />
            </div>
            <DayToggleGroup title="Promo Days" values={promo.days || []} onToggle={(day) => updatePromo({ days: updateArrayToggle(promo.days || [], day) })} tone="purple" />
            <DayToggleGroup title="Return-To-Cycle Days" values={promo.returnDays || []} onToggle={(day) => updatePromo({ returnDays: updateArrayToggle(promo.returnDays || [], day) })} tone="amber" />
          </div>
          <PromotionReturnControls promo={promo} updatePromo={updatePromo} menuOptions={menuOptions} currentMenu={rotation.menu} />
        </div>
      )}

      <div className="mt-5 space-y-5">
        {layout.map((blockInfo, index) => {
          const block = getRotationGlobalBlock(rotation, blockInfo.id);
          const blockStationOptions = subConceptOptionsForMenu(block.menu);
          const blockCategorized = categorize(globalMenuRows(block.menu, block.station));
          if (blockInfo.readOnly) {
            const carryover = carryoverGlobalBlock(previousRotation, "friCarry");
            return (
              <div key={blockInfo.id} className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-700 font-bold">Read Only Carryover</p>
                <h4 className="text-2xl font-bold text-indigo-950 mt-1">{blockInfo.title}</h4>
                <p className="text-sm text-indigo-900 mt-1">{blockInfo.help}</p>
                <CarryoverPanel
                  title="Prior Friday Global"
                  previousWeek={previousWeek}
                  block={carryover}
                  empty="No saved prior-Friday Global found yet. Once last week's Friday block is saved, Monday will show here."
                />
              </div>
            );
          }
          return (
            <div key={blockInfo.id} className="rounded-3xl border-2 border-sky-200 bg-sky-50/60 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-700 font-bold">Global Block {index + 1}</p>
                  <h4 className="text-2xl font-bold mt-1">{blockInfo.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{blockInfo.help}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${blockComplete(block) ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-sky-200 text-sky-800"}`}>{blockComplete(block) ? "complete" : "needs global"}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-2">Global Menu</label>
                  <select value={block.menu || ""} onChange={(e) => updateBlock(blockInfo.id, { ...blankGlobalBlock(e.target.value, "") })} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
                    <option value="">Select Menu</option>
                    {menuOptions.map((menu) => <option key={menu} value={menu}>{menu}</option>)}
                  </select>
                </div>
                {block.menu && blockStationOptions.length > 1 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-500 mb-2">Street Eats Option</label>
                    <select value={block.station || ""} onChange={(e) => updateBlock(blockInfo.id, { ...blankGlobalBlock(block.menu, e.target.value) })} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
                      <option value="">Select Street Eats Option</option>
                      {blockStationOptions.map((station) => <option key={station} value={station}>{station}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {block.menu && (
                <div className="mt-5 grid grid-cols-1 xl:grid-cols-4 gap-5">
                  <PickerGroup title="Entrees" limit="up to 3" items={blockCategorized.entrees} values={block.entrees || ["", "", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "entrees", slot, value)} />
                  <PickerGroup title="Sides" limit="up to 4" items={blockCategorized.sides} values={block.sides || ["", "", "", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "sides", slot, value)} />
                  <PickerGroup title="Sub Recipes" limit="up to 4" items={blockCategorized.subRecipes} values={block.subRecipes || ["", "", "", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "subRecipes", slot, value)} />
                  <PickerGroup title="Extensions" limit="up to 2" items={blockCategorized.extensions} values={block.extensions || ["", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "extensions", slot, value)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <StationSelectedList title="Items Description" items={globalSelectedRows(rotation, { unique: true })} complete={stationComplete(rotation, "global", cafe, week)} />
    </CollapsibleStation>
  );
}

function SecondaryGlobalSection({ blockId, title, eyebrow, rotation, menuOptions, updateRotation }) {
  const block = getRotationGlobalBlock(rotation, blockId);
  const blockStationOptions = subConceptOptionsForMenu(block.menu);
  const blockCategorized = categorize(globalMenuRows(block.menu, block.station));
  const updateBlock = (patch) => {
    const current = getRotationGlobalBlock(rotation, blockId);
    updateRotation({ globalBlocks: { ...(rotation.globalBlocks || {}), [blockId]: { ...current, ...patch } } });
  };
  const updateBlockSlot = (key, index, value) => {
    const current = getRotationGlobalBlock(rotation, blockId);
    const nextValues = [...(current[key] || blankGlobalBlock()[key])];
    nextValues[index] = value;
    updateBlock({ [key]: nextValues });
  };
  const blockItems = rowsForSelectedNames(
    [...(block.entrees || []), ...(block.sides || []), ...(block.subRecipes || []), ...(block.extensions || [])],
    { unique: true, candidateRows: globalMenuRows(block.menu, block.station) }
  );

  return (
    <CollapsibleStation title={title} eyebrow={eyebrow} complete={blockComplete(block)} defaultOpen={!blockComplete(block)}>
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2">Menu</label>
            <select value={block.menu || ""} onChange={(e) => updateBlock({ ...blankGlobalBlock(e.target.value, "") })} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">Select Menu</option>
              {menuOptions.map((menu) => <option key={menu} value={menu}>{menu}</option>)}
            </select>
          </div>
          {block.menu && blockStationOptions.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-2">Street Eats Option</label>
              <select value={block.station || ""} onChange={(e) => updateBlock({ ...blankGlobalBlock(block.menu, e.target.value) })} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
                <option value="">Select Street Eats Option</option>
                {blockStationOptions.map((station) => <option key={station} value={station}>{station}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
      {block.menu && (
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-4 gap-5">
          <PickerGroup title="Entrees" limit="up to 3" items={blockCategorized.entrees} values={block.entrees || ["", "", ""]} onChange={(slot, value) => updateBlockSlot("entrees", slot, value)} />
          <PickerGroup title="Sides" limit="up to 4" items={blockCategorized.sides} values={block.sides || ["", "", "", ""]} onChange={(slot, value) => updateBlockSlot("sides", slot, value)} />
          <PickerGroup title="Sub Recipes" limit="up to 4" items={blockCategorized.subRecipes} values={block.subRecipes || ["", "", "", ""]} onChange={(slot, value) => updateBlockSlot("subRecipes", slot, value)} />
          <PickerGroup title="Extensions" limit="up to 2" items={blockCategorized.extensions} values={block.extensions || ["", ""]} onChange={(slot, value) => updateBlockSlot("extensions", slot, value)} />
        </div>
      )}
      <StationSelectedList title="Items Description" items={blockItems} complete={blockComplete(block)} />
    </CollapsibleStation>
  );
}

function CarryoverPanel({ title, previousWeek, block, empty }) {
  const itemCount = compactValues([...(block.entrees || []), ...(block.sides || []), ...(block.subRecipes || []), ...(block.extensions || [])]).length;
  return (
    <div className="mt-3 rounded-2xl bg-white border border-indigo-200 p-4 text-sm text-indigo-900">
      <p className="text-xs uppercase tracking-[0.16em] font-bold text-indigo-700">{title}</p>
      {block?.menu ? (
        <div className="mt-2">
          <p className="text-lg font-bold text-indigo-950">{block.menu}</p>
          {allowsSubConcept(block.menu) && block.station && <p className="mt-1 font-semibold">{block.station}</p>}
          <p className="mt-1 text-xs font-semibold text-indigo-700">
            {previousWeek ? `From ${previousWeek}` : "From prior week"}{itemCount ? ` - ${itemCount} selected item${itemCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      ) : (
        <p className="mt-2 font-semibold">{empty}</p>
      )}
    </div>
  );
}

function DayToggleGroup({ title, values = [], onToggle, tone = "sky" }) {
  return (
    <div>
      <p className={`block text-sm font-semibold mb-2 ${tone === "amber" ? "text-amber-900" : tone === "purple" ? "text-purple-900" : "text-slate-600"}`}>{title}</p>
      <div className="flex flex-wrap gap-2">
        {GLOBAL_CYCLE_DAY_OPTIONS.map((day) => {
          const selected = values.includes(day);
          const selectedClass = tone === "amber" ? "bg-amber-500 border-amber-500 text-white" : tone === "purple" ? "bg-purple-600 border-purple-600 text-white" : "bg-sky-600 border-sky-600 text-white";
          return (
            <button key={day} type="button" onClick={() => onToggle(day)} className={`rounded-full border px-3 py-1 text-xs font-bold ${selected ? selectedClass : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {day.replace("Next ", "Next ")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PromotionReturnControls({ promo, updatePromo, menuOptions = [], currentMenu = "" }) {
  const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const short = { Monday: "M", Tuesday: "Tu", Wednesday: "W", Thursday: "Th", Friday: "F" };
  const promoDays = new Set(promo.days || []);
  const returnDays = new Set(promo.returnDays || []);
  const returnMenu = promo.returnMode === "new" ? (promo.returnMenu || "") : (currentMenu || "Monday's cycle");
  const chips = weekdayNames.map((day) => {
    if (promoDays.has(day)) return `${short[day]}: Promotion ${promo.name || ""}`.trim();
    if (returnDays.has(day)) return `${short[day]}: ${returnMenu || "Return menu needed"}`;
    return `${short[day]}: ${currentMenu || "Cycle menu"}`;
  });
  return (
    <div className="mt-4 rounded-2xl border border-purple-100 bg-white/80 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-purple-950">Return-to-cycle coverage</p>
          <p className="mt-1 text-xs font-semibold text-purple-800">Choose whether return days use Monday's same cycle or a new menu for the rest of the week.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => updatePromo({ returnMode: "same", returnMenu: "" })} className={`rounded-full border px-3 py-1 text-xs font-black ${promo.returnMode === "new" ? "border-slate-200 bg-white text-slate-600" : "border-purple-500 bg-purple-600 text-white"}`}>Same cycle</button>
          <button type="button" onClick={() => updatePromo({ returnMode: "new" })} className={`rounded-full border px-3 py-1 text-xs font-black ${promo.returnMode === "new" ? "border-purple-500 bg-purple-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>New menu</button>
        </div>
      </div>
      {promo.returnMode === "new" && (
        <select value={promo.returnMenu || ""} onChange={(event) => updatePromo({ returnMenu: event.target.value })} className="mt-3 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100">
          <option value="">Select return menu</option>
          {menuOptions.map((menu) => <option key={menu} value={menu}>{menu}</option>)}
        </select>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => <span key={chip} className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-900">{chip}</span>)}
      </div>
    </div>
  );
}

function CollapsibleStation({ title, eyebrow, complete, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`mt-5 rounded-lg border-2 p-5 shadow-md ${complete ? "border-emerald-300 bg-emerald-50/20" : "border-slate-300 bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
          <h3 className="text-2xl font-bold mt-1">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold border ${complete ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>{complete ? "complete" : "needs selection"}</span>
          <button type="button" onClick={() => setIsOpen((value) => !value)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50" aria-label={`${isOpen ? "Collapse" : "Expand"} ${title}`}>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}

function StationSelectedList({ title = "Items Description", items, complete = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const missingDetailCount = items.filter(isSourceDetailMissing).length;
  const descriptionMissingCount = items.filter((row) => !getDescription(row)).length;
  const reviewCount = Math.max(missingDetailCount, descriptionMissingCount);
  const attentionClass = complete && items.length ? "border-2 border-emerald-300 bg-emerald-50/80 shadow-sm" : "border border-slate-200 bg-white";
  const buttonClass = complete && items.length ? "bg-emerald-500 text-slate-950 ring-2 ring-emerald-200" : "bg-slate-900 text-white";
  return (
    <div className={`mt-4 rounded-lg p-4 ${attentionClass}`}>
      <button type="button" onClick={() => setIsOpen((value) => !value)} className="w-full flex items-center justify-between gap-3 text-left">
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-1">
            {items.length} selected - descriptions, diet tags, and allergens
            {reviewCount ? ` - ${reviewCount} need source detail` : ""}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold inline-flex items-center gap-1 ${buttonClass}`}>
          {isOpen ? "Hide" : "View"} {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-2">
          {!items.length && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No items selected yet.</div>}
          {Boolean(reviewCount) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <span className="font-bold">Source detail check:</span> {reviewCount} selected item{reviewCount === 1 ? "" : "s"} need MenuWorks detail review before using descriptions or allergen language externally.
            </div>
          )}
          {items.map((row, index) => {
            const diet = getDiet(row);
            const allergens = String(getAllergens(row) || "").split(",").map((value) => value.trim()).filter(Boolean);
            const allergenDataMissing = isAllergenDataMissing(row);
            const missingSourceDetail = isSourceDetailMissing(row);
            const description = getDescription(row) || "Description missing in source data.";
            return (
              <div key={`${getItemIdentity(row)}-${index}`} className={`rounded-lg border p-3 ${missingSourceDetail ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{getDisplayName(row)}</p>
                    <div className="mt-2"><ItemBuildMeta item={row} /></div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {missingSourceDetail && <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">Source Detail Missing</span>}
                    {diet && <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">{diet}</span>}
                    {allergens.length ? allergens.map((allergen) => (
                      <span key={allergen} className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-800">{titleCase(allergen)}</span>
                    )) : allergenDataMissing
                      ? <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">Allergen Data Missing</span>
                      : <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">No Allergens Listed</span>}
                  </div>
                </div>
                <p className={`text-sm mt-1 ${missingSourceDetail ? "text-amber-900" : "text-slate-600"}`}>{description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LiveAnalytics({ selectedItems }) {
  const trueCostRange = selectedTrueCostRange(selectedItems);
  const foodCostRange = selectedFoodCostRange(selectedItems);
  const immediateSelectedCost = selectedItems.filter((row) => getTrueCost(row) != null).reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);
  const foodCostDisplayValue = foodCostRange.low == null && immediateSelectedCost > 0 ? `Cost ${money(immediateSelectedCost)}` : pctRange(foodCostRange);
  const foodCostDisplayNote = foodCostRange.low == null && immediateSelectedCost > 0 ? "cost accepted; add priced entrée to calculate %" : foodCostRangeNote(foodCostRange);

  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Live Selection Analytics</p>
        <h3 className="text-2xl font-bold mt-1">Current Rotation Mix</h3>
        <p className="text-sm text-slate-500 mt-1">A quick planning read that updates as selections are made.</p>
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Mini title="Selected True Cost Range" value={moneyRange(trueCostRange)} sub={trueCostRangeNote(trueCostRange)} emphasize />
        <Mini title="Selected Mix Food Cost %" value={foodCostDisplayValue} sub={foodCostDisplayNote} emphasize />
      </div>
    </div>
  );
}

function Mini({ title, value, sub, tone = "neutral", emphasize = false }) {
  const cls = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : emphasize ? "border-sky-200 bg-sky-50 text-slate-900" : "border-slate-200 bg-white text-slate-900";
  return <div className={`rounded-2xl border p-4 ${cls}`}><p className="text-xs font-semibold opacity-75">{title}</p><p className={`${emphasize ? "text-4xl" : "text-2xl"} font-bold mt-1`}>{value}</p><p className="text-xs opacity-70 mt-1">{sub}</p></div>;
}

function PickerGroup({ title, limit, items, values, onChange }) {
  const itemNames = new Set(items.map((row) => normalizeItemName(getItemIdentity(row))));
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2"><p className="font-bold text-slate-900">{title}</p><span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">select</span></div>
      <p className="text-xs text-slate-500 mt-1 font-semibold">{limit}</p>
      <div className="mt-3 space-y-2">
        {values.map((value, index) => (
          <select key={index} value={value} onChange={(e) => onChange(index, e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
            <option value="">&lt;Select Item&gt;</option>
            {value && !itemNames.has(normalizeItemName(value)) && <option value={value}>{titleCase(value)}</option>}
            {items.map((row) => <option key={`${getItemIdentity(row)}-${index}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}
          </select>
        ))}
      </div>
    </div>
  );
}

function GrillSection({ cafe, rotation, updateGrill }) {
  const grillItems = categorize(MENUWORKS_ITEMS.filter((row) => getMenuName(row) === "AMZ: Grill Core" || getStationName(row).toLowerCase().includes("grill"))).entrees;
  const grillTitle = cafe === "Day 1" ? "Adelaide's" : "Core Grill Additions";
  const options = grillItems.length ? grillItems : stationPool("carveryProtein");
  const complete = stationComplete(rotation, "grill", cafe);
  const promoActive = Boolean(rotation.grill?.promoActive);
  const locationSpotlightSlots = cafe === "Bingo"
    ? [["Location Spotlight", "regionalSpecial"]]
    : [["Location Spotlight 1", "regionalSpecial"], ["Location Spotlight 2", "locationSpotlight"]];
  return (
    <div className={`mt-6 rounded-3xl border-2 p-5 shadow-md ${complete ? "border-emerald-300 bg-emerald-50/20" : "border-slate-300 bg-slate-50"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Grill Station</p>
          <h3 className="text-2xl font-bold mt-1">{grillTitle}</h3>
        </div>
        <label className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-black transition ${promoActive ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm" : "border-slate-300 bg-white text-slate-700"}`}>
          <input type="checkbox" checked={promoActive} onChange={(event) => updateGrill("promoActive", event.target.checked)} />
          Activate Grill Promo
        </label>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {locationSpotlightSlots.map(([label, field]) => (
          <GrillSelect key={field} label={label} value={rotation.grill?.[field] || ""} onChange={(value) => updateGrill(field, value)} items={options} />
        ))}
      </div>
      {promoActive && (
        <div className="mt-4 rounded-3xl border-2 border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="block text-sm font-bold text-slate-900">Promo LTO</label>
            <span className="rounded-full bg-white border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">type promo</span>
          </div>
          <input
            value={rotation.grill?.promoItem || ""}
            onChange={(event) => updateGrill("promoItem", event.target.value)}
            placeholder="Type promo item"
            className="w-full rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>
      )}
      <StationSelectedList title="Items Description" items={grillSelectedRows(rotation, { unique: true })} complete={complete} />
    </div>
  );
}

function GrillSelect({ label, value, onChange, items }) {
  return <div className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{label}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100"><option value="">&lt;Select Item&gt;</option>{items.map((row) => <option key={`${label}-${getItemIdentity(row)}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}</select></div>;
}

function SimpleLTOSection({ stationKey, title, slots, values = [], uploaded = [], updateLto, complete }) {
  const pool = stationPool(stationKey);
  const poolNames = new Set(pool.map((row) => normalizeItemName(getItemIdentity(row))));
  const effectiveValues = slots.map((_, index) => values[index] || uploaded[index] || "");
  return (
    <CollapsibleStation title={title} eyebrow="Station Special" complete={complete}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((slot, index) => (
          <div key={slot} className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{slot}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div>
            <select value={effectiveValues[index]} onChange={(e) => updateLto(stationKey, index, e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">&lt;Select Item&gt;</option>
              {effectiveValues[index] && !poolNames.has(normalizeItemName(effectiveValues[index])) && <option value={effectiveValues[index]}>{titleCase(effectiveValues[index])}</option>}
              {pool.map((row) => <option key={`${stationKey}-${slot}-${getItemIdentity(row)}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}
            </select>
          </div>
        ))}
      </div>
      <StationSelectedList title="Items Description" items={rowsForSelectedNames(effectiveValues, { unique: true, candidateRows: pool })} complete={complete} />
    </CollapsibleStation>
  );
}

function WokSection({ rotation, updateLto }) {
  return (
    <CollapsibleStation title="Wok Station" eyebrow="Station Rotation" complete={stationComplete(rotation, "wok")}>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <PickerGroup title="Wok Entrees" limit="up to 3" items={stationPool("wokEntrees")} values={rotation.ltos?.wokEntrees || EMPTY_ROTATION.ltos.wokEntrees} onChange={(index, value) => updateLto("wokEntrees", index, value)} />
        <PickerGroup title="Wok Sides" limit="up to 2" items={stationPool("wokSides")} values={rotation.ltos?.wokSides || EMPTY_ROTATION.ltos.wokSides} onChange={(index, value) => updateLto("wokSides", index, value)} />
        <PickerGroup title="Wok Base" limit="1 base" items={stationPool("wokBase")} values={rotation.ltos?.wokBase || EMPTY_ROTATION.ltos.wokBase} onChange={(index, value) => updateLto("wokBase", index, value)} />
        <PickerGroup title="Wok Sub Recipes" limit="up to 2" items={stationPool("wokSubRecipes")} values={rotation.ltos?.wokSubRecipes || EMPTY_ROTATION.ltos.wokSubRecipes} onChange={(index, value) => updateLto("wokSubRecipes", index, value)} />
      </div>
      <StationSelectedList title="Items Description" items={wokSelectedRows(rotation, { unique: true })} complete={stationComplete(rotation, "wok")} />
    </CollapsibleStation>
  );
}

function CarverySection({ rotation, updateCarvery }) {
  const fields = [
    ["protein1", "Rotating Protein 1", stationPool("carveryProtein")],
    ["protein2", "Rotating Protein 2", stationPool("carveryProtein")],
    ["vegetable1", "Rotating Vegetable 1", stationPool("carveryVegetable")],
    ["vegetable2", "Rotating Vegetable 2", stationPool("carveryVegetable")],
    ["vegetable3", "Rotating Vegetable 3", stationPool("carveryVegetable")],
    ["starch", "Starch", potatoSides().length ? potatoSides() : stationPool("carverySide")],
    ["hotSide1", "Hot Side 1", carveryHotSides()],
    ["coldSide1", "Cold Side 1", carveryColdSides()],
    ["coldSide2", "Cold Side 2", carveryColdSides()]
  ];
  return (
    <CollapsibleStation title="Carvery Rotations" eyebrow="Carvery Station" complete={stationComplete(rotation, "carvery")}>
      <p className="text-sm text-slate-500 mb-4">Dropdowns are filtered by the report station, production area, category, and menu item notes.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map(([field, label, options]) => (
          <div key={field} className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{label}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div>
            <select value={rotation.carvery?.[field] || ""} onChange={(e) => updateCarvery(field, e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">&lt;Select Item&gt;</option>
              {rotation.carvery?.[field] && !options.some((row) => normalizeItemName(getItemIdentity(row)) === normalizeItemName(rotation.carvery?.[field])) && <option value={rotation.carvery[field]}>{titleCase(rotation.carvery[field])}</option>}
              {options.map((row) => <option key={`${field}-${getItemIdentity(row)}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}
            </select>
            <input
              value={rotation.carvery?.[field] || ""}
              onChange={(e) => updateCarvery(field, e.target.value)}
              placeholder="Type if not listed"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        ))}
      </div>
      <StationSelectedList title="Items Description" items={carverySelectedRows(rotation, { unique: true })} complete={stationComplete(rotation, "carvery")} />
    </CollapsibleStation>
  );
}

function WriteInField({ label, value, onChange, calorieValue, onCaloriesChange, required = false }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-3">
      <label className="block text-sm font-bold text-slate-900">{label}{required ? " *" : ""}</label>
      <input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="Type item name" className="mt-2 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
      {onCaloriesChange && value && (
        <input value={calorieValue || ""} onChange={(event) => onCaloriesChange(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Calories required" className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100" />
      )}
    </div>
  );
}

function StreetBeetsSection({ rotation, updateCustomStationArray }) {
  const station = cloneCustomStations(rotation.customStations).streetBeets;
  const groups = [
    ["Entrées", "entrees", "entreeCalories", 2],
    ["Sides", "sides", "sideCalories", 3],
    ["Sub Recipes", "subRecipes", "subRecipeCalories", 0],
    ["Extensions", "extensions", "extensionCalories", 0]
  ];
  const complete = stationComplete(rotation, "streetBeets");
  return (
    <CollapsibleStation title="Street Beets" eyebrow="Write-In Station" complete={complete}>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {groups.map(([title, field, calorieField, requiredCount]) => (
          <div key={field} className="space-y-3">
            <div>
              <p className="font-black text-slate-900">{title}</p>
              <p className="text-xs font-semibold text-slate-500">{requiredCount ? `${requiredCount} required` : "optional"}; calories required when filled</p>
            </div>
            {(station[field] || []).map((value, index) => (
              <WriteInField
                key={`${field}-${index}`}
                label={`${title.slice(0, -1)} ${index + 1}`}
                value={value}
                required={index < requiredCount}
                onChange={(next) => updateCustomStationArray("streetBeets", field, index, next)}
                calorieValue={station[calorieField]?.[index] || ""}
                onCaloriesChange={(next) => updateCustomStationArray("streetBeets", calorieField, index, next)}
              />
            ))}
          </div>
        ))}
      </div>
      <StationSelectedList title="Items Description" items={customStationRows(rotation, "streetBeets", { unique: true })} complete={complete} />
    </CollapsibleStation>
  );
}

function CommissaryEverestSection({ rotation, updateCustomStation, updateCustomStationArray }) {
  const station = cloneCustomStations(rotation.customStations).commissaryEverest;
  const complete = stationComplete(rotation, "commissaryEverest");
  return (
    <CollapsibleStation title="Commissary to Everest" eyebrow="Write-In Production" complete={complete}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block text-sm font-bold text-slate-900">Menu Name *</label>
        <input value={station.menuName || ""} onChange={(event) => updateCustomStation("commissaryEverest", { menuName: event.target.value })} placeholder="Type commissary menu" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {(station.entrees || []).map((value, index) => <WriteInField key={`entree-${index}`} label={`Entrée ${index + 1}`} value={value} required onChange={(next) => updateCustomStationArray("commissaryEverest", "entrees", index, next)} />)}
        {(station.hotSides || []).map((value, index) => <WriteInField key={`hot-${index}`} label={`Hot Side ${index + 1}`} value={value} onChange={(next) => updateCustomStationArray("commissaryEverest", "hotSides", index, next)} />)}
        {(station.coldSides || []).map((value, index) => <WriteInField key={`cold-${index}`} label={`Cold Side ${index + 1}`} value={value} required onChange={(next) => updateCustomStationArray("commissaryEverest", "coldSides", index, next)} />)}
        {(station.rice || []).map((value, index) => <WriteInField key={`rice-${index}`} label={`Rice Dish ${index + 1}`} value={value} required onChange={(next) => updateCustomStationArray("commissaryEverest", "rice", index, next)} />)}
      </div>
      <StationSelectedList title="Items Description" items={customStationRows(rotation, "commissaryEverest", { unique: true })} complete={complete} />
    </CollapsibleStation>
  );
}

function LotusWpSection({ rotation, updateLto }) {
  const complete = stationComplete(rotation, "lotusWp");
  return (
    <CollapsibleStation title="Lotus W&P" eyebrow="Asian Global Pool" complete={complete}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <PickerGroup title="Lotus Entrées" limit="4 slots; 2 required" items={stationPool("lotusAsianEntrees")} values={rotation.ltos?.lotusEntrees || EMPTY_ROTATION.ltos.lotusEntrees} onChange={(index, value) => updateLto("lotusEntrees", index, value)} />
        <PickerGroup title="Lotus Sides" limit="6 slots; 4 required" items={stationPool("lotusAsianSides")} values={rotation.ltos?.lotusSides || EMPTY_ROTATION.ltos.lotusSides} onChange={(index, value) => updateLto("lotusSides", index, value)} />
      </div>
      <StationSelectedList title="Items Description" items={customStationRows(rotation, "lotusWp", { unique: true })} complete={complete} />
    </CollapsibleStation>
  );
}

function StationTakeoverSection({ rotation, updateCustomStation, updateCustomStationArray }) {
  const station = cloneCustomStations(rotation.customStations).stationTakeover;
  const complete = stationComplete(rotation, "stationTakeover");
  return (
    <CollapsibleStation title="Station Takeover" eyebrow="Optional Override" complete={complete}>
      <label className="inline-flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-900">
        <input type="checkbox" checked={Boolean(station.enabled)} onChange={(event) => updateCustomStation("stationTakeover", { enabled: event.target.checked })} />
        Activate station takeover
      </label>
      {station.enabled && (
        <>
          <div className="mt-4 rounded-2xl border border-purple-200 bg-white p-4">
            <label className="block text-sm font-bold text-slate-900">Takeover Menu Name *</label>
            <input value={station.menuName || ""} onChange={(event) => updateCustomStation("stationTakeover", { menuName: event.target.value })} placeholder="Type takeover menu" className="mt-2 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100" />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {["entrees", "sides", "subRecipes", "extensions"].map((field) => (station[field] || []).map((value, index) => (
              <WriteInField key={`${field}-${index}`} label={`${titleCase(field)} ${index + 1}`} value={value} onChange={(next) => updateCustomStationArray("stationTakeover", field, index, next)} />
            )))}
          </div>
        </>
      )}
      <StationSelectedList title="Items Description" items={customStationRows(rotation, "stationTakeover", { unique: true })} complete={complete} />
    </CollapsibleStation>
  );
}

function SubmitBar({ rotation, cafe, requirements, canSubmit, onSaveDraft, onSubmit }) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Submission</p>
        <h3 className="text-2xl font-bold mt-1">{rotation.status || "Draft"}</h3>
        <p className="text-sm text-slate-500 mt-1">{rotation.updatedAt ? `Updated ${rotation.updatedAt} by ${rotation.submittedBy || "Chef"}` : "Not saved yet"}</p>
        {rotation.submittedAt && <p className="text-sm text-slate-500 mt-1">Submitted {rotation.submittedAt}</p>}
        {!canSubmit && <p className="text-sm text-amber-700 mt-2">Submit requires a Global Menu, at least two Global entrées, and at least one selection for each assigned station.</p>}
        {!requirements.globalReady && <p className="text-xs text-amber-700 mt-1">Missing: Global Menu or two Global entrées.</p>}
        {requirements.incompleteStations.length > 0 && <p className="text-xs text-amber-700 mt-1">Missing station selection: {requirements.incompleteStations.map((stationKey) => stationLabel(cafe, stationKey)).join(", ")}.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onSaveDraft} className="rounded-2xl bg-white border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Save Draft</button>
        <button onClick={onSubmit} disabled={!canSubmit} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${canSubmit ? "bg-slate-900 text-white hover:bg-slate-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>Submit Rotation</button>
      </div>
    </div>
  );
}

function LeadershipOverview({ district, week, rows, conflictMenus }) {
  return (
    <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
      <div className="flex items-start gap-3"><CalendarDays className="text-slate-400" /><div><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Leadership Overview</p><h2 className="text-2xl font-bold mt-1">District At Large</h2><p className="mt-1 text-sm font-semibold text-slate-500">{district || "Select district"} • {week}</p></div></div>
      <div className="mt-5 space-y-3">{rows.map((row) => <SummaryCard key={row.cafe} row={row} conflict={rowHasMenuConflict(row, conflictMenus)} />)}</div>
    </div>
  );
}

function ExecutiveView({ week, setWeek, rows, conflictMenus }) {
  const locked = rows.filter((row) => row.status === "Submitted").length;
  const declared = rows.filter(hasRotationMenu).length;
  const conflicts = rows.filter((row) => rowHasMenuConflict(row, conflictMenus)).length;
  const globalRows = rows.filter(hasRotationMenu);
  const globalSummaries = globalRows.map((row) => ({ ...row, summary: foodSummary(selectedItems(row)) }));
  const pricedGlobalSummaries = globalSummaries.filter((row) => row.summary.fc != null);
  const averageGlobalFc = pricedGlobalSummaries.length
    ? pricedGlobalSummaries.reduce((sum, row) => {
      const range = selectedFoodCostRange(selectedItems(row));
      const midpoint = range.low != null && range.high != null ? (range.low + range.high) / 2 : row.summary.fc;
      return sum + midpoint;
    }, 0) / pricedGlobalSummaries.length
    : null;

  const districtNames = Object.keys(DISTRICTS);
  const selectedCount = rows.reduce((sum, row) => sum + selectedItems(row).length, 0);
  const districtSignals = districtNames.map((districtName) => {
    const districtRows = rows.filter((row) => row.district === districtName);
    const districtLocked = districtRows.filter((row) => row.status === "Submitted").length;
    const districtDeclared = districtRows.filter(hasRotationMenu).length;
    const districtConflicts = districtRows.filter((row) => rowHasMenuConflict(row, conflictMenus)).length;
    const pricedRows = districtRows
      .map((row) => {
        const range = selectedFoodCostRange(selectedItems(row));
        const midpoint = range.low != null && range.high != null ? (range.low + range.high) / 2 : null;
        return { row, midpoint };
      })
      .filter((entry) => entry.midpoint != null);
    const averageFc = pricedRows.length ? pricedRows.reduce((sum, entry) => sum + entry.midpoint, 0) / pricedRows.length : null;
    const lockPct = districtRows.length ? Math.round((districtLocked / districtRows.length) * 100) : 0;
    const declarationPct = districtRows.length ? Math.round((districtDeclared / districtRows.length) * 100) : 0;
    const score = Math.max(0, Math.min(100, Math.round((lockPct * 0.45) + (declarationPct * 0.35) + (districtConflicts ? 0 : 15) + (averageFc == null ? 5 : averageFc <= 0.34 ? 5 : -10))));
    return { district: districtName, total: districtRows.length, locked: districtLocked, declared: districtDeclared, conflicts: districtConflicts, averageFc, lockPct, declarationPct, score };
  });

  return (
    <div className="space-y-5">
      <LeadershipStatusBoard rows={rows} />
      <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <ControlCard label="Leadership Week View" value={week} setValue={setWeek} options={ROTATION_WEEKS} />
        <ExecutiveMetric title="Locked In" value={`${locked}/${rows.length}`} sub="submitted rotations" tone={locked === rows.length ? "green" : "amber"} />
        <ExecutiveMetric title="Menu Items" value={selectedCount} sub="selected this week" />
        <ExecutiveMetric title="Declared" value={`${declared}/${rows.length}`} sub="cafés submitted" />
        <ExecutiveMetric title="Duplicate Menus" value={conflicts} sub="within district" tone={conflicts ? "amber" : "green"} />
        <ExecutiveMetric title="Projected Global FC%" value={pct(averageGlobalFc)} sub="based on selected rotation mix" tone={averageGlobalFc != null && averageGlobalFc > 0.34 ? "amber" : "green"} />
      </section>
      <LeadershipPulsePanel signals={districtSignals} rows={rows} conflictMenus={conflictMenus} />

      <section className="rounded-[2rem] bg-white border-2 border-slate-200 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-emerald-500 font-bold">Executive Rotation View</p>
            <h2 className="text-3xl font-bold mt-1">Weekly Rotation Health</h2>
            <p className="text-sm text-slate-500 mt-1">One card per café showing rotation status, food cost signal, duplicate flags, and station completion gaps.</p>
          </div>
        </div>
        <div className="mt-5 space-y-6">
          {districtNames.map((districtName) => {
            const districtRows = rows.filter((row) => row.district === districtName);
            const districtLocked = districtRows.filter((row) => row.status === "Submitted").length;
            const districtSelected = districtRows.reduce((sum, row) => sum + selectedItems(row).length, 0);
            return (
              <div key={districtName} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{districtName}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{districtLocked}/{districtRows.length} locked - {districtSelected} selected items</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <p className="rounded-full bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">{districtRows.filter(hasRotationMenu).length}/{districtRows.length} declared</p>
                    <p className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">≤30% favorable</p>
                    <p className="rounded-full bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">30–34% monitor</p>
                    <p className="rounded-full bg-amber-100 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800">&gt;34% watch</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {districtRows.map((row) => (
                    <SummaryCard key={`${row.district}-${row.cafe}`} row={row} conflict={rowHasMenuConflict(row, conflictMenus)} showDistrict={false} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function LeadershipStatusBoard({ rows }) {
  const locked = rows.filter((row) => row.status === "Submitted").length;
  return (
    <section className="rounded-[2rem] bg-white border-2 border-emerald-200 p-6 shadow-2xl text-slate-950">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-600 font-bold">Leadership Read</p>
          <h2 className="text-3xl font-bold mt-1">Cafe Lock Board</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">{locked} locked</span>
          <span className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-800">{rows.length - locked} open</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {rows.map((row) => {
          const isLocked = row.status === "Submitted";
          return (
            <span key={`${row.district}-${row.cafe}`} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-sm ${isLocked ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-rose-300 bg-rose-100 text-rose-900"}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isLocked ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" : "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]"}`} />
              {row.cafe}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function LeadershipPulsePanel({ signals, rows, conflictMenus }) {
  const openRows = rows.filter((row) => row.status !== "Submitted");
  const missingMenuRows = rows.filter((row) => !hasRotationMenu(row));
  const duplicateRows = rows.filter((row) => rowHasMenuConflict(row, conflictMenus));
  const highCostRows = rows.filter((row) => {
    const range = selectedFoodCostRange(selectedItems(row));
    const midpoint = range.low != null && range.high != null ? (range.low + range.high) / 2 : null;
    return midpoint != null && midpoint > 0.34;
  });
  const actionRows = [
    { label: "Open submissions", value: openRows.length, detail: openRows.slice(0, 4).map((row) => row.cafe).join(", ") || "clear", tone: openRows.length ? "amber" : "green" },
    { label: "Missing menus", value: missingMenuRows.length, detail: missingMenuRows.slice(0, 4).map((row) => row.cafe).join(", ") || "clear", tone: missingMenuRows.length ? "amber" : "green" },
    { label: "Duplicate menus", value: duplicateRows.length, detail: duplicateRows.slice(0, 4).map((row) => `${row.district}: ${rotationMenuLabel(row)}`).join(", ") || "clear", tone: duplicateRows.length ? "amber" : "green" },
    { label: "Food cost watch", value: highCostRows.length, detail: highCostRows.slice(0, 4).map((row) => row.cafe).join(", ") || "clear", tone: highCostRows.length ? "amber" : "green" },
  ];

  return (
    <section className="rounded-[2rem] border-2 border-emerald-200 bg-white p-6 shadow-2xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-600 font-bold">Leadership Pulse</p>
          <h2 className="mt-1 text-3xl font-bold">District operating signal</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">submission, cost, and duplicate health</span>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {signals.map((signal) => {
            const tone = signal.score >= 85 ? "border-emerald-300 bg-emerald-50" : signal.score >= 65 ? "border-sky-200 bg-sky-50" : "border-amber-300 bg-amber-50";
            const bar = signal.score >= 85 ? "bg-emerald-500" : signal.score >= 65 ? "bg-sky-500" : "bg-amber-500";
            return (
              <div key={signal.district} className={`rounded-3xl border-2 p-4 ${tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-black text-slate-950">{signal.district}</p>
                    <p className="mt-1 text-xs font-bold text-slate-600">{signal.locked}/{signal.total} locked - {signal.declared}/{signal.total} declared</p>
                  </div>
                  <span className="rounded-full border border-white bg-white/80 px-3 py-1 text-xs font-black text-slate-700">{signal.score}</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${signal.score}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                  <span className="rounded-full border border-white bg-white/80 px-3 py-1">{signal.lockPct}% locked</span>
                  <span className="rounded-full border border-white bg-white/80 px-3 py-1">{signal.conflicts} duplicate flags</span>
                  <span className="rounded-full border border-white bg-white/80 px-3 py-1">FC {pct(signal.averageFc)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Action Queue</p>
          <div className="mt-3 space-y-3">
            {actionRows.map((row) => (
              <div key={row.label} className={`rounded-2xl border p-3 ${row.tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{row.label}</p>
                    <p className="mt-1 text-xs font-semibold opacity-75">{row.detail}</p>
                  </div>
                  <span className="rounded-full border border-white bg-white/80 px-3 py-1 text-xs font-black">{row.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExecutiveMetric({ title, value, sub, tone = "neutral" }) {
  const toneClass = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-900";
  return (
    <div className={`rounded-3xl border p-5 shadow-xl ${toneClass}`}>
      <p className="text-sm font-semibold opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-70 mt-2">{sub}</p>
    </div>
  );
}

function SummaryCard({ row, conflict, showDistrict = true }) {
  const rowItems = selectedItems(row);
  const summary = foodSummary(rowItems);
  const fcRange = selectedFoodCostRange(rowItems);
  const fcMidpoint = fcRange.low != null && fcRange.high != null ? (fcRange.low + fcRange.high) / 2 : summary.fc;
  const stationKeys = CAFE_STATION_CONFIG[row.cafe] || [];
  const completedStations = stationKeys.filter((stationKey) => stationComplete(row, stationKey, row.cafe, row.week)).length;
  const progressPct = stationKeys.length ? Math.round((completedStations / stationKeys.length) * 100) : 0;
  const locked = row.status === "Submitted";
  const menuLabel = rotationMenuLabel(row);
  const tone = !menuLabel ? "border-slate-200 bg-white" : fcMidpoint == null ? "border-slate-300 bg-slate-50" : fcMidpoint > 0.34 ? "border-amber-300 bg-amber-50" : fcMidpoint <= 0.30 ? "border-emerald-300 bg-emerald-50" : "border-sky-200 bg-sky-50";
  const statusTone = locked ? "bg-emerald-500 text-white border-emerald-500" : menuLabel ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-rose-100 text-rose-900 border-rose-200";

  return (
    <div className={`rounded-3xl border-2 p-4 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {showDistrict && row.district && <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{row.district}</p>}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${locked ? "bg-emerald-500" : menuLabel ? "bg-amber-500" : "bg-rose-500"}`} />
            <p className="font-bold text-slate-900">{row.cafe}</p>
          </div>
          {row.copiedFrom ? <p className="text-xs text-slate-500 mt-1">Copied from {row.copiedFrom}</p> : row.cafe === "Nitro" ? <p className="text-xs text-slate-500 mt-1">Frontier follows Nitro</p> : null}
          <p className="text-base font-black text-slate-950 mt-1 leading-snug">{menuLabel || "No menu declared"}</p>
          {row.updatedAt && <p className="text-xs text-slate-500 mt-1">Updated {row.updatedAt}</p>}
          {row.submittedBy && <p className="text-xs text-slate-500 mt-1">By {row.submittedBy}</p>}
          {row.station && <p className="text-xs text-slate-500 mt-1">{row.station}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone}`}>{locked ? "locked" : menuLabel ? "draft" : "open"}</span>
          <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">{pctRange(fcRange)}</span>
          {conflict ? <AlertTriangle className="text-amber-600" size={18} /> : menuLabel ? <CheckCircle2 className="text-emerald-600" size={18} /> : null}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Station Progress</span>
          <span>{completedStations}/{stationKeys.length || 0}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full border border-slate-200 bg-white">
          <div className={`h-full rounded-full ${progressPct === 100 ? "bg-emerald-500" : "bg-sky-500"}`} style={{ width: `${progressPct}%` }} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        {menuLabel && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{(row.entrees || []).filter(Boolean).length} entrees</span>}
        {menuLabel && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{(row.sides || []).filter(Boolean).length} sides</span>}
        {menuLabel && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{(row.subRecipes || []).filter(Boolean).length} sub recipes</span>}
        {stationKeys.length > 0 && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{completedStations}/{stationKeys.length} stations</span>}
        {conflict && <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-amber-800">duplicate</span>}
      </div>
    </div>
  );
}

function SummaryBucket({ title, value, details, empty, tone = "neutral" }) {
  const toneClass = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-900";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold">{title}</p><span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold">{value}</span></div>
      <div className="mt-3 flex flex-wrap gap-2">{details.length ? details.map((detail) => <span key={detail} className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-semibold">{detail}</span>) : <span className="text-xs opacity-70">{empty}</span>}</div>
    </div>
  );
}

function ResultsView({ rows, resultsDistrict, setResultsDistrict, resultsCafe, setResultsCafe }) {
  const allCafeOptions = Array.from(new Set(Object.values(DISTRICTS).flat())).sort();
  const submittedRows = rows.filter((row) => row.status === "Submitted");
  const historyRows = submittedRows;
  const pricedRows = historyRows.map((row) => ({ ...row, summary: foodSummary(selectedItems(row)) })).filter((row) => row.summary.fc != null);
  const averageFc = pricedRows.length ? pricedRows.reduce((sum, row) => sum + row.summary.fc, 0) / pricedRows.length : null;
  const costRangeRows = historyRows.map((row) => ({ ...row, trueCostRange: selectedTrueCostRange(selectedItems(row)) })).filter((row) => row.trueCostRange.low != null);
  const mostUsedMenus = Object.entries(historyRows.reduce((acc, row) => { const menu = rotationMenuLabel(row); if (menu) acc[menu] = (acc[menu] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const allSelections = historyRows.flatMap((row) => selectedItems(row));
  const uniqueItems = new Set(allSelections.map((row) => normalizeItemName(getItemIdentity(row))).filter(Boolean));
  const selectedItemCounts = Object.entries(allSelections.reduce((acc, row) => {
    const name = getDisplayName(row) || titleCase(getItemIdentity(row));
    if (name) acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const declaredRows = historyRows.filter(hasRotationMenu);
  const averageSelectedItems = historyRows.length ? allSelections.length / historyRows.length : 0;
  const highFoodCostRows = pricedRows.filter((row) => row.summary.fc > 0.34);
  const widestRange = costRangeRows
    .map((row) => ({ ...row, spread: row.trueCostRange.high - row.trueCostRange.low }))
    .sort((a, b) => b.spread - a.spread)[0];
  const tightRangeCount = costRangeRows.filter((row) => Math.abs(row.trueCostRange.high - row.trueCostRange.low) < 0.005).length;
  const topItems = selectedItemCounts.slice(0, 6).map(([item, count]) => `${item} (${count})`);
  const describedSelections = allSelections.filter((row) => getDescription(row) && !/no description/i.test(getDescription(row))).length;
  const allergenSelections = allSelections.filter((row) => getAllergens(row) && !/no allergens listed/i.test(getAllergens(row))).length;
  const costedSelections = allSelections.filter((row) => row.trueCost != null).length;
  const selectedDetailPct = allSelections.length ? Math.round((describedSelections / allSelections.length) * 100) : 0;
  const selectedAllergenPct = allSelections.length ? Math.round((allergenSelections / allSelections.length) * 100) : 0;
  const selectedCostPct = allSelections.length ? Math.round((costedSelections / allSelections.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <ControlCard label="District Filter" value={resultsDistrict} setValue={setResultsDistrict} options={["All", ...Object.keys(DISTRICTS)]} />
        <ControlCard label="Café Filter" value={resultsCafe} setValue={setResultsCafe} options={["All", ...allCafeOptions]} />
        <ExecutiveMetric title="History Entries" value={historyRows.length} sub="submitted rotations only" tone="green" />
        <ExecutiveMetric title="Excluded Drafts" value={rows.length - historyRows.length} sub="hidden from history" />
        <ExecutiveMetric title="Menu Variety" value={uniqueItems.size} sub={`${allSelections.length} selections`} tone="green" />
        <ExecutiveMetric title="Projected FC%" value={pct(averageFc)} sub="based on saved rotation mix" tone={averageFc != null && averageFc > 0.34 ? "amber" : "green"} />
      </section>
      <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Results Summary</p>
            <h2 className="text-3xl font-bold mt-1">Rotation History Health</h2>
            <p className="text-sm text-slate-500 mt-1">A quick read of saved declarations across the selected filter.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <SummaryBucket title="Rotation Coverage" value={`${declaredRows.length}/${historyRows.length || 0}`} details={[`${historyRows.length} submitted history entries`, "drafts excluded", `${historyRows.length - declaredRows.length} missing menu`]} empty="no submitted rotations yet" tone={historyRows.length && declaredRows.length === historyRows.length ? "green" : "amber"} />
          <SummaryBucket title="Item Variety" value={uniqueItems.size || "-"} details={[`${allSelections.length} total selected items`, `${averageSelectedItems.toFixed(1)} avg items per rotation`, `${costRangeRows.length} rotations with cost data`]} empty="no item selections yet" tone="green" />
          <SummaryBucket title="Food Cost Watch" value={pct(averageFc)} details={[`${highFoodCostRows.length} rotation${highFoodCostRows.length === 1 ? "" : "s"} above 34%`, `${pricedRows.length} priced rotation${pricedRows.length === 1 ? "" : "s"}`, averageFc == null ? "no food cost data yet" : averageFc > 0.34 ? "review mix" : "on track"]} empty="no priced rotations yet" tone={highFoodCostRows.length ? "amber" : "green"} />
          <SummaryBucket title="Most Used Menus" value={mostUsedMenus.length || "-"} details={mostUsedMenus.map(([menu, count]) => `${menu} (${count})`)} empty="no menu history yet" tone="green" />
          <SummaryBucket title="Most Picked Items" value={topItems.length || "-"} details={topItems} empty="no item selections yet" />
          <SummaryBucket title="Selection Range" value={widestRange ? moneyRange(widestRange.trueCostRange) : "-"} details={widestRange ? [`Widest: ${widestRange.cafe} - ${widestRange.week}`, `${tightRangeCount} single-cost rotation${tightRangeCount === 1 ? "" : "s"}`, `${averageSelectedItems.toFixed(1)} avg items per rotation`] : []} empty="no costed selections yet" tone={widestRange?.spread > 3 ? "amber" : "green"} />
          <SummaryBucket title="Data Confidence" value={`${selectedDetailPct}%`} details={[`${selectedDetailPct}% description coverage`, `${selectedAllergenPct}% allergen signal`, `${selectedCostPct}% cost coverage`]} empty="no selected item data yet" tone={selectedDetailPct >= 80 && selectedCostPct >= 80 ? "green" : "amber"} />
        </div>
      </section>
      <section className="overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-2xl">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Rolling 6 Month Results</p>
            <h2 className="text-3xl font-bold mt-1">Rotation History</h2>
            <p className="text-sm text-slate-500 mt-1">Shows submitted rotations only, with global declarations, food cost signal, and timestamps.</p>
          </div>
        </div>
        <div className="overflow-auto max-h-[680px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-500 border-b border-slate-200">
              <tr className="text-left">
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Café</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Global Menu</th>
                <th className="px-4 py-3">Food Cost %</th>
                <th className="px-4 py-3">Selected Cost Range</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {historyRows.length === 0 ? (
                <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">No submitted rotations match this filter yet.</td></tr>
              ) : historyRows.map((row, index) => {
                const rowItems = selectedItems(row);
                const summary = foodSummary(rowItems);
                const trueCostRange = selectedTrueCostRange(rowItems);
                const foodCostRange = selectedFoodCostRange(rowItems);
                const fcMidpoint = foodCostRange.low != null && foodCostRange.high != null ? (foodCostRange.low + foodCostRange.high) / 2 : summary.fc;
                const fcTone = fcMidpoint == null ? "bg-slate-100 text-slate-600 border-slate-200" : fcMidpoint > 0.34 ? "bg-amber-100 text-amber-800 border-amber-200" : fcMidpoint <= 0.30 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-white text-slate-700 border-slate-200";
                return (
                  <tr key={`${row.week}-${row.district}-${row.cafe}-${index}`} className="hover:bg-slate-50 align-top">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{row.week}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.district}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">{row.cafe}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`rounded-full px-3 py-1 text-xs font-bold border ${row.status === "Submitted" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-100 border-slate-200 text-slate-600"}`}>{row.status || "Draft"}</span></td>
                    <td className="px-4 py-3 min-w-[190px] font-semibold">{rotationMenuLabel(row)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${fcTone}`}>{pctRange(foodCostRange)}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">{moneyRange(trueCostRange)}</td>
                    <td className="px-4 py-3 min-w-[150px] text-slate-500">{row.updatedAt || "—"}{row.submittedBy ? <p className="text-xs">by {row.submittedBy}</p> : null}</td>
                    <td className="px-4 py-3 min-w-[150px] text-slate-500">{row.submittedAt || "—"}{row.submittedBy && row.submittedAt ? <p className="text-xs">by {row.submittedBy}</p> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
