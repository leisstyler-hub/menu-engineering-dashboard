import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { ArrowLeft, AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clipboard, FileText, Printer, Save, Send, Upload, X } from "lucide-react";

import MENUWORKS_ITEMS from "../../data/menuItems.json";
import { NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, SMARTSHEET_COLUMNS, SMARTSHEET_DATABASE_STORAGE_KEY, SMARTSHEET_RECORD_TYPES, SMARTSHEET_SELECTION_TYPES, STATION_SMARTSHEET_LABELS } from "../../integrations/smartsheet/contract.js";
import { loadRecordsFromBackbone, syncRecordsToBackbone } from "../../integrations/storage/backboneClient.js";
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
  commissaryEverest: "Everest Commissary",
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
  const calories4 = ["", "", "", ""];
  return {
    streetBeets: {
      entrees: ["", ""],
      sides: ["", "", ""],
      subRecipes: ["", ""],
      extensions: [""],
      calories: { entrees: ["", ""], sides: ["", "", ""], subRecipes: ["", ""], extensions: [""] }
    },
    commissaryEverest: {
      menu: "",
      entrees: ["", ""],
      hotSides: [""],
      coldSides: ["", "", "", ""],
      riceDishes: [""]
    },
    lotusWp: {
      entrees: ["", "", "", ""],
      sides: ["", "", "", "", "", ""]
    },
    stationTakeover: {
      active: false,
      menu: "",
      entrees: ["", ""],
      sides: [...calories4],
      subRecipes: ["", "", ""],
      extensions: ["", ""]
    }
  };
}

function cloneCustomStations(source = {}) {
  const blank = blankCustomStations();
  return {
    streetBeets: {
      ...blank.streetBeets,
      ...(source.streetBeets || {}),
      entrees: [...(source.streetBeets?.entrees || blank.streetBeets.entrees)],
      sides: [...(source.streetBeets?.sides || blank.streetBeets.sides)],
      subRecipes: [...(source.streetBeets?.subRecipes || blank.streetBeets.subRecipes)],
      extensions: [...(source.streetBeets?.extensions || blank.streetBeets.extensions)],
      calories: {
        ...blank.streetBeets.calories,
        ...(source.streetBeets?.calories || {}),
        entrees: [...(source.streetBeets?.calories?.entrees || blank.streetBeets.calories.entrees)],
        sides: [...(source.streetBeets?.calories?.sides || blank.streetBeets.calories.sides)],
        subRecipes: [...(source.streetBeets?.calories?.subRecipes || blank.streetBeets.calories.subRecipes)],
        extensions: [...(source.streetBeets?.calories?.extensions || blank.streetBeets.calories.extensions)]
      }
    },
    commissaryEverest: {
      ...blank.commissaryEverest,
      ...(source.commissaryEverest || {}),
      entrees: [...(source.commissaryEverest?.entrees || blank.commissaryEverest.entrees)],
      hotSides: [...(source.commissaryEverest?.hotSides || blank.commissaryEverest.hotSides)],
      coldSides: [...(source.commissaryEverest?.coldSides || blank.commissaryEverest.coldSides)],
      riceDishes: [...(source.commissaryEverest?.riceDishes || blank.commissaryEverest.riceDishes)]
    },
    lotusWp: {
      ...blank.lotusWp,
      ...(source.lotusWp || {}),
      entrees: [...(source.lotusWp?.entrees || blank.lotusWp.entrees)],
      sides: [...(source.lotusWp?.sides || blank.lotusWp.sides)]
    },
    stationTakeover: {
      ...blank.stationTakeover,
      ...(source.stationTakeover || {}),
      entrees: [...(source.stationTakeover?.entrees || blank.stationTakeover.entrees)],
      sides: [...(source.stationTakeover?.sides || blank.stationTakeover.sides)],
      subRecipes: [...(source.stationTakeover?.subRecipes || blank.stationTakeover.subRecipes)],
      extensions: [...(source.stationTakeover?.extensions || blank.stationTakeover.extensions)]
    }
  };
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
  customStations: blankCustomStations(),
  uploadedLtos: {},
  promotionOverride: { enabled: false, name: "", days: [], returnDays: [] },
  globalBlocks: {},
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

function selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey, selectionType, itemName, sortOrder, slotNumber, candidateRows, calories }) {
  const row = selectedRowForName(itemName, candidateRows);
  const price = getPrice(row);
  const trueCost = getTrueCost(row);
  const foodCost = price ? Number(trueCost || 0) / Number(price) : null;
  const calorieValue = calories || getCalories(row) || "";
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
    [SMARTSHEET_COLUMNS.calories]: calorieValue,
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
    [SMARTSHEET_COLUMNS.cycleRecoveryNotes]: promo.enabled ? "Promotion override is isolated to this café/week. Return-to-cycle days restore the normal pattern without changing future weeks." : "",
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
  const pushCustomSelections = (stationKey, selectionType, values, offset = 0, calories = []) => {
    compactValues(values).forEach((itemName, index) => {
      selectionRows.push(selectionDatabaseRecord({
        parentId,
        district,
        cafe,
        week,
        rotation,
        stationKey,
        selectionType,
        itemName,
        sortOrder: offset + index + 1,
        slotNumber: index + 1,
        candidateRows: MENUWORKS_ITEMS,
        calories: calories[index] || ""
      }));
    });
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
  Object.entries(rotation.carvery || {}).filter(([, value]) => value).forEach(([field, value], index) => {
    const type = field.includes("protein") ? SMARTSHEET_SELECTION_TYPES.carveryProtein : field.includes("vegetable") ? SMARTSHEET_SELECTION_TYPES.carveryVegetable : field.includes("starch") ? SMARTSHEET_SELECTION_TYPES.carveryStarch : field.includes("hot") ? SMARTSHEET_SELECTION_TYPES.carveryHotSide : SMARTSHEET_SELECTION_TYPES.carveryColdSide;
    selectionRows.push(selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey: "carvery", selectionType: type, itemName: value, sortOrder: 1400 + index, slotNumber: index + 1, candidateRows: carveryCandidateRowsForField(field) }));
  });

  const custom = cloneCustomStations(rotation.customStations);
  pushCustomSelections("streetBeets", SMARTSHEET_SELECTION_TYPES.entree, custom.streetBeets.entrees, 1500, custom.streetBeets.calories.entrees);
  pushCustomSelections("streetBeets", SMARTSHEET_SELECTION_TYPES.side, custom.streetBeets.sides, 1530, custom.streetBeets.calories.sides);
  pushCustomSelections("streetBeets", SMARTSHEET_SELECTION_TYPES.subRecipe, custom.streetBeets.subRecipes, 1560, custom.streetBeets.calories.subRecipes);
  pushCustomSelections("streetBeets", SMARTSHEET_SELECTION_TYPES.extension, custom.streetBeets.extensions, 1590, custom.streetBeets.calories.extensions);
  pushCustomSelections("commissaryEverest", SMARTSHEET_SELECTION_TYPES.menuName, [custom.commissaryEverest.menu], 1620);
  pushCustomSelections("commissaryEverest", SMARTSHEET_SELECTION_TYPES.entree, custom.commissaryEverest.entrees, 1630);
  pushCustomSelections("commissaryEverest", SMARTSHEET_SELECTION_TYPES.hotSide, custom.commissaryEverest.hotSides, 1660);
  pushCustomSelections("commissaryEverest", SMARTSHEET_SELECTION_TYPES.coldSide, custom.commissaryEverest.coldSides, 1670);
  pushCustomSelections("commissaryEverest", SMARTSHEET_SELECTION_TYPES.riceDish, custom.commissaryEverest.riceDishes, 1710);
  pushCustomSelections("lotusWp", SMARTSHEET_SELECTION_TYPES.entree, custom.lotusWp.entrees, 1740);
  pushCustomSelections("lotusWp", SMARTSHEET_SELECTION_TYPES.side, custom.lotusWp.sides, 1780);
  if (custom.stationTakeover.active || custom.stationTakeover.menu || compactValues([...custom.stationTakeover.entrees, ...custom.stationTakeover.sides, ...custom.stationTakeover.subRecipes, ...custom.stationTakeover.extensions]).length) {
    pushCustomSelections("stationTakeover", SMARTSHEET_SELECTION_TYPES.menuName, [custom.stationTakeover.menu || "Station Takeover"], 1850);
    pushCustomSelections("stationTakeover", SMARTSHEET_SELECTION_TYPES.entree, custom.stationTakeover.entrees, 1860);
    pushCustomSelections("stationTakeover", SMARTSHEET_SELECTION_TYPES.side, custom.stationTakeover.sides, 1880);
    pushCustomSelections("stationTakeover", SMARTSHEET_SELECTION_TYPES.subRecipe, custom.stationTakeover.subRecipes, 1920);
    pushCustomSelections("stationTakeover", SMARTSHEET_SELECTION_TYPES.extension, custom.stationTakeover.extensions, 1950);
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
    calories: String(record[SMARTSHEET_COLUMNS.calories] || ""),
    promotionOverrideEnabled: String(record[SMARTSHEET_COLUMNS.promotionOverrideEnabled] || "").toLowerCase() === "true" || record[SMARTSHEET_COLUMNS.promotionOverrideEnabled] === true,
    promotionName: String(record[SMARTSHEET_COLUMNS.promotionName] || ""),
    promotionDays: String(record[SMARTSHEET_COLUMNS.promotionDays] || "").split(",").map((value) => value.trim()).filter(Boolean),
    returnToCycleDays: String(record[SMARTSHEET_COLUMNS.returnToCycleDays] || "").split(",").map((value) => value.trim()).filter(Boolean),
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
        customStations: cloneCustomStations(),
        uploadedLtos: {},
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
  const mergeStatus = (current = "Draft", incoming = "") => {
    const currentText = String(current || "").trim();
    const incomingText = String(incoming || "").trim();
    if (currentText.toLowerCase() === "submitted" || incomingText.toLowerCase() === "submitted") return "Submitted";
    return incomingText || currentText || "Draft";
  };

  records.map(normalizeLoadedRotationRecord).forEach((record) => {
    if (!record.week || !record.district || !record.cafe) return;
    const key = rotationKey(record.week, record.district, record.cafe);
    const rotation = ensureRotation(key);

    if (record.recordType === SMARTSHEET_RECORD_TYPES.rotationHeader) {
      rotation.status = mergeStatus(rotation.status, record.status);
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
      rotation.status = mergeStatus(rotation.status, record.status);
      rotation.promotionOverride = {
        enabled: Boolean(record.promotionOverrideEnabled),
        name: record.promotionName || "",
        days: record.promotionDays || [],
        returnDays: record.returnToCycleDays || [],
      };
      return;
    }

    if (record.recordType === SMARTSHEET_RECORD_TYPES.uploadedItem) {
      const stationKey = record.stationKey || "unmatched";
      rotation.uploadedLtos[stationKey] = rotation.uploadedLtos[stationKey] || [];
      if (record.itemName && !rotation.uploadedLtos[stationKey].includes(record.itemName)) rotation.uploadedLtos[stationKey].push(record.itemName);
      return;
    }

    if (record.recordType === SMARTSHEET_RECORD_TYPES.globalSelection || record.recordType === SMARTSHEET_RECORD_TYPES.stationSelection) {
      // Selection rows can restore submitted state when the header row is missing or delayed.
      rotation.status = mergeStatus(rotation.status, record.status);
      rotation.submittedBy = record.submittedBy || rotation.submittedBy || "";
      rotation.submittedAt = record.submittedAt || rotation.submittedAt || "";
      rotation.updatedAt = record.updatedAt || rotation.updatedAt || "";
    }

    if (!record.itemName) return;
    const index = Math.max(0, (record.slotNumber || 1) - 1);

    if (record.stationKey === "global") {
      const blockId = blockIdFromRecord(record);
      if (blockId) {
        const block = rotation.globalBlocks[blockId] || blankGlobalBlock();
        block.menu = record.menuConcept || block.menu || "";
        block.station = record.stationSubConcept || block.station || "";
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) putSlot(block.entrees, index, record.itemName);
        else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) putSlot(block.sides, index, record.itemName);
        else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) putSlot(block.subRecipes, index, record.itemName);
        else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) putSlot(block.extensions, index, record.itemName);
        rotation.globalBlocks[blockId] = block;
        return;
      }
      rotation.menu = record.menuConcept || rotation.menu || "";
      rotation.station = record.stationSubConcept || rotation.station || "";
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) putSlot(rotation.entrees, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) putSlot(rotation.sides, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) putSlot(rotation.subRecipes, index, record.itemName);
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) putSlot(rotation.extensions, index, record.itemName);
      return;
    }

    if (record.stationKey === "grill") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.regionalSpecial) rotation.grill.regionalSpecial = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.locationSpotlight) {
        if (index === 0) rotation.grill.regionalSpecial = record.itemName;
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

    if (["streetBeets", "commissaryEverest", "lotusWp", "stationTakeover"].includes(record.stationKey)) {
      const custom = cloneCustomStations(rotation.customStations);
      const setCustomSlot = (stationKey, field, targetIndex = index) => {
        const values = [...(custom[stationKey]?.[field] || [])];
        if (targetIndex >= 0 && targetIndex < values.length) values[targetIndex] = record.itemName;
        custom[stationKey] = { ...custom[stationKey], [field]: values };
      };
      const setStreetBeetsSlot = (field) => {
        const values = [...(custom.streetBeets[field] || [])];
        if (index >= 0 && index < values.length) values[index] = record.itemName;
        const calorieValues = [...(custom.streetBeets.calories?.[field] || [])];
        if (record.calories && index >= 0 && index < calorieValues.length) calorieValues[index] = record.calories;
        custom.streetBeets = { ...custom.streetBeets, [field]: values, calories: { ...custom.streetBeets.calories, [field]: calorieValues } };
      };
      if (record.stationKey === "streetBeets") {
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) setStreetBeetsSlot("entrees");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) setStreetBeetsSlot("sides");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) setStreetBeetsSlot("subRecipes");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) setStreetBeetsSlot("extensions");
      }
      if (record.stationKey === "commissaryEverest") {
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.menuName) custom.commissaryEverest.menu = record.itemName;
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) setCustomSlot("commissaryEverest", "entrees");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.hotSide) setCustomSlot("commissaryEverest", "hotSides");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.coldSide) setCustomSlot("commissaryEverest", "coldSides");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.riceDish) setCustomSlot("commissaryEverest", "riceDishes");
      }
      if (record.stationKey === "lotusWp") {
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) setCustomSlot("lotusWp", "entrees");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) setCustomSlot("lotusWp", "sides");
      }
      if (record.stationKey === "stationTakeover") {
        custom.stationTakeover.active = true;
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.menuName) custom.stationTakeover.menu = record.itemName;
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) setCustomSlot("stationTakeover", "entrees");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) setCustomSlot("stationTakeover", "sides");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) setCustomSlot("stationTakeover", "subRecipes");
        if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) setCustomSlot("stationTakeover", "extensions");
      }
      rotation.customStations = custom;
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
const getPlannerSelectorGroup = (row) => String(row.plannerSelectorGroup || row.selectorGroup || "").toLowerCase();
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
  return category.includes("entree") || category.includes("entrée") || category.includes("plate") || category.includes("main") || row?.requiresSides === true || price >= 8.75;
}

function isSide(row) {
  const price = Number(getPrice(row));
  const category = getCategory(row);
  return category.includes("side") || (row?.canBeSideChoice === true && !isEntree(row)) || (!category.includes("extension") && !isEntree(row) && isPriced(row) && price <= 3.75);
}

function isSubRecipe(row) {
  const category = getCategory(row);
  const text = `${getItemIdentity(row)} ${getStationName(row)} ${row?.recipeCategory || ""}`.toLowerCase();
  return category.includes("sub") || (getPrice(row) == null && /sauce|dressing|aioli|salsa|spread|dip|broth|condiment/.test(text));
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

function makeCustomStationItem(name, { station = "Custom Station", category = "custom", calories = "", selectionGroup = "" } = {}) {
  return {
    ...makeUploadedItem(name),
    station,
    category,
    calories,
    __selectionGroup: selectionGroup,
    enticingDescription: "Chef-entered rotation item. Use the typed name and calories for operational coverage, then match to source detail when available."
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
  return `${getMenuName(row)} ${getStationName(row)} ${getItemIdentity(row)} ${row.enticingDescription || ""} ${row.description || ""}`.toLowerCase();
}

function isCarveryMainRow(row) {
  const menu = getMenuName(row).toLowerCase();
  const station = getStationName(row).toLowerCase();
  if (!menu.includes("carvery")) return false;
  if (/sandwich|panini|wrap|deli/.test(station)) return false;
  return /premium mains|vegetarian mains/.test(station);
}

function isGrillSpotlightRow(row) {
  const menu = getMenuName(row).toLowerCase();
  const station = getStationName(row).toLowerCase();
  return menu === "amz: grill core" && /location spotlights|regional spotlights|^spotlights$/.test(station);
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
  const saladRequestedOptions = [
    "Baja Crunch Salad"
  ].map((name) => makePlanningOption(name, { menu: "AMZ: Fresh Five", station: "Salad LTOs", category: "entree" }));
  const all = MENUWORKS_ITEMS.filter(Boolean);
  const carveryRows = all.filter((row) => getMenuName(row) === "AMZ: Carvery");
  const carverySelectorRows = (group) => carveryRows.filter((row) => getPlannerSelectorGroup(row) === group);
  const byMenu = (needle) => all.filter((row) => getMenuName(row).toLowerCase().includes(needle));
  const byStation = (needle) => all.filter((row) => getStationName(row).toLowerCase().includes(needle));
  const byMenuPattern = (regex) => all.filter((row) => regex.test(getMenuName(row)));
  const byStationPattern = (regex) => all.filter((row) => regex.test(getStationName(row)));
  const byText = (regex) => all.filter((row) => regex.test(textForRow(row)));
  const scoped = (strictRows, fallbackRows = []) => uniqueOptionRows(strictRows.length ? strictRows : fallbackRows);
  const cafeExpressSalads = all.filter((row) => getMenuName(row) === "AMZ: Cafe Express Curated Salads" && /curated salads/i.test(getStationName(row)));
  const cafeExpressSandwiches = all.filter((row) => getMenuName(row) === "AMZ: Cafe Express Curated Sandwiches" && /curated sandwiches/i.test(getStationName(row)));
  const grillSpotlights = all.filter((row) => isGrillSpotlightRow(row) && isEntree(row));
  const freshFiveRows = all.filter((row) => getMenuName(row) === "AMZ: Fresh Five");
  const freshFiveStationRows = (stationName) => freshFiveRows.filter((row) => getStationName(row).toLowerCase() === stationName.toLowerCase());
  const freshFiveEntrees = uniqueOptionRows([
    ...freshFiveStationRows("Deli").filter((row) => isEntree(row)),
    ...freshFiveStationRows("Grill").filter((row) => isEntree(row)),
    ...freshFiveStationRows("Salad").filter((row) => isEntree(row)),
    ...freshFiveStationRows("Hibernate").filter((row) => isEntree(row))
  ]);
  const freshFiveSides = uniqueOptionRows(freshFiveStationRows("Sides").filter((row) => isSide(row)));
  const freshFiveSoups = uniqueOptionRows(freshFiveStationRows("Soup"));
  const asianGlobalRows = scoped(
    [
      ...byMenuPattern(/asia|asian|bibimb|korean|japanese|thai|wok|lotus|pho|ramen|teriyaki|curry|indian|tikka|gochujang|xahn/i),
      ...byStationPattern(/asia|asian|bibimb|korean|japanese|thai|wok|lotus|pho|ramen|teriyaki|curry|indian|tikka|gochujang|xahn/i)
    ],
    byText(/bibimb|gochujang|korean|japanese|thai|wok|lotus|pho|ramen|teriyaki|curry|tikka|noodle|rice/)
  );

  const pools = {
    salad: uniqueOptionRows([
      ...cafeExpressSalads.filter((row) => isEntree(row)),
      ...saladRequestedOptions
    ]),
    pizza: scoped([...byMenuPattern(/pizza|flatbread/i), ...byStationPattern(/pizza|flatbread/i)], byText(/pizza|flatbread/)).filter((row) => isEntree(row)),
    deli: scoped(cafeExpressSandwiches, byText(/sandwich|deli|wrap|naanwich|banh mi/)).filter((row) => isEntree(row)),
    fishMarket: scoped([...byMenuPattern(/fish market/i), ...byStationPattern(/fish market/i)])
      .filter((row) => (getMenuName(row).toLowerCase().includes("fish market") || getStationName(row).toLowerCase().includes("fish market")) && isEntree(row)),
    grillSpotlight: scoped(grillSpotlights, byText(/burger|sandwich|wrap|hot dog|cod|salmon|steelhead/)).filter((row) => isEntree(row)),
    freshFive: freshFiveEntrees,
    freshFiveSides,
    deliFreshFive: uniqueOptionRows(freshFiveStationRows("Deli").filter((row) => isEntree(row))),
    grillFreshFive: uniqueOptionRows(freshFiveStationRows("Grill").filter((row) => isEntree(row))),
    saladFreshFive: uniqueOptionRows([
      ...freshFiveStationRows("Salad").filter((row) => isEntree(row)),
      ...saladRequestedOptions
    ]),
    soup: freshFiveSoups.length ? freshFiveSoups : scoped([...byMenuPattern(/\bsoup\b/i), ...byStationPattern(/\bsoup\b/i)], byText(/soup|chili|bisque|chowder/)),
    wokEntrees: scoped([...byMenu("wok"), ...byStation("wok")], byText(/wok|stir fry|stir-fry|orange peel|sweet and sour|huli huli/)).filter((row) => isEntree(row)),
    wokSides: scoped([...byMenu("wok"), ...byStation("wok")], byText(/lo mein|fried rice|green beans|carrots|gai lan|slaw/)).filter((row) => isSide(row)),
    wokBase: scoped([...byMenu("wok"), ...byStation("wok")], byText(/rice|noodle|lo mein|base/)).filter((row) => isSide(row) || /rice|noodle|base/i.test(getItemIdentity(row))),
    wokSubRecipes: uniqueOptionRows(all.filter((row) => isSubRecipe(row))),
    lotusEntrees: uniqueOptionRows(asianGlobalRows.filter((row) => isEntree(row))),
    lotusSides: uniqueOptionRows(asianGlobalRows.filter((row) => isSide(row))),
    carveryProtein: uniqueOptionRows([
      ...scoped(carveryRows.filter(isCarveryMainRow), byText(/beef|chicken|pork|turkey|salmon|steelhead|trout|tofu|protein|pork belly|flank steak|char siu|char sui/)).filter((row) => isEntree(row) && !/sandwich|reuben|panini|wrap/i.test(`${getItemIdentity(row)} ${getStationName(row)}`)),
      ...carveryRequestedProteins
    ]),
    carveryVegetable: uniqueOptionRows(carverySelectorRows("carvery-rotating-vegetable").length ? carverySelectorRows("carvery-rotating-vegetable") : carveryRequestedVegetables),
    carveryHotSide: uniqueOptionRows(carverySelectorRows("carvery-hot-side")),
    carveryColdSide: uniqueOptionRows(carverySelectorRows("carvery-cold-side")),
    carverySide: uniqueOptionRows(carveryRows.filter((row) => isSide(row)))
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
    Doppler: { pizza: 2, deli: 1 },
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
  if (["grillFreshFive", "saladFreshFive"].includes(stationKey)) return 1;
  if (stationKey === "freshFive") return 5;
  return 1;
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

function activeReInventBlockIds(week = "") {
  return new Set(reInventGlobalBlockLayout(week).map((block) => block.id));
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

const REINVENT_GLOBAL_BLOCK_IDS = new Set(["monTue", "wedThu", "friCarry", "monCarry", "tueWed", "thuFri"]);

function reInventMenuLabel(rotation = {}, week = "") {
  const entries = Object.entries(rotation.globalBlocks || {}).filter(([blockId, block]) => REINVENT_GLOBAL_BLOCK_IDS.has(blockId) && block?.menu);
  const activeBlockIds = activeReInventBlockIds(week);
  const activeMenus = entries.filter(([blockId]) => activeBlockIds.has(blockId)).map(([, block]) => block.menu).filter(Boolean);
  if (activeMenus.length) return Array.from(new Set(activeMenus)).join(" / ");
  const savedMenus = entries.map(([, block]) => block.menu).filter(Boolean);
  return savedMenus.length ? Array.from(new Set(savedMenus)).join(" / ") : "";
}

function reInventSummaryBlockLabels(rotation = {}, week = rotation?.week || "") {
  return reInventGlobalBlockLayout(week).map((blockInfo) => {
    const block = blockInfo.readOnly
      ? carryoverGlobalBlock(rotation.previousRotation || {}, "friCarry")
      : getRotationGlobalBlock(rotation, blockInfo.id);
    const menu = block?.menu || (blockInfo.readOnly ? "Carryover pending" : "Not selected");
    return {
      id: blockInfo.id,
      title: blockInfo.title,
      menu,
      isPending: !block?.menu,
      isCarryover: Boolean(blockInfo.readOnly || blockInfo.continuesNextWeek),
    };
  });
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

function rotationMenuLabel(rotation = {}, cafe = rotation?.cafe || "", week = rotation?.week || "") {
  if (rotation.menu) return rotation.menu;
  if (cafe === "Re:Invent") return reInventMenuLabel(rotation, week);
  const entries = Object.entries(rotation.globalBlocks || {});
  const blockMenus = entries.map(([, block]) => block?.menu).filter(Boolean);
  return blockMenus.length ? Array.from(new Set(blockMenus)).join(" / ") : "";
}

function isSubmittedRotation(rotation = {}) {
  return String(rotation.status || "").toLowerCase() === "submitted";
}

function hasRotationMenu(rotation = {}) {
  return Boolean(rotationMenuLabel(rotation, rotation.cafe, rotation.week));
}

function hasSubmittedRotationMenu(rotation = {}) {
  return isSubmittedRotation(rotation) && hasRotationMenu(rotation);
}

function submittedSelectedItems(rotation = {}) {
  return isSubmittedRotation(rotation) ? selectedItems(rotation) : [];
}

function potatoSides() {
  if (POTATO_SIDES_CACHE) return POTATO_SIDES_CACHE;
  POTATO_SIDES_CACHE = uniqueRows(MENUWORKS_ITEMS.filter((row) => {
    const name = String(getItemIdentity(row)).toLowerCase();
    return getMenuName(row) === "AMZ: Carvery" && isSide(row) && /potato|potatoes|fries|tots|hash brown|mashed|fingerling|yukon|russet|sweet potato/.test(name);
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
  CARVERY_HOT_SIDES_CACHE = stationPool("carveryHotSide");
  return CARVERY_HOT_SIDES_CACHE;
}

function carveryColdSides() {
  if (CARVERY_COLD_SIDES_CACHE) return CARVERY_COLD_SIDES_CACHE;
  CARVERY_COLD_SIDES_CACHE = stationPool("carveryColdSide");
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
    customStations: cloneCustomStations(),
    uploadedLtos: {},
    promotionOverride: { enabled: false, name: "", days: [], returnDays: [] },
    globalBlocks: {},
    status: "Draft",
    submittedBy: "",
    updatedAt: "",
    submittedAt: ""
  };
}

function nowStamp() {
  return new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
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
    const eastRequiresSides = ["Astra", "Bingo", "Sonic", "Blueshift", "Eclipse", "Grace"].includes(cafe);
    return Boolean(rotation.menu && (rotation.entrees || []).filter(Boolean).length >= 2 && (!eastRequiresSides || (rotation.sides || []).filter(Boolean).length >= 2));
  }
  if (stationKey === "noodles") return blockComplete(getRotationGlobalBlock(rotation, "noodles"));
  if (stationKey === "grill") return Boolean(rotation.grill?.regionalSpecial || rotation.grill?.locationSpotlight || (rotation.grill?.promoActive && rotation.grill?.promoItem));
  if (["salad", "pizza", "deli", "fishMarket", "freshFive", "grillFreshFive", "saladFreshFive", "soup"].includes(stationKey)) {
    return Boolean((rotation.ltos?.[stationKey] || []).some(Boolean) || (rotation.uploadedLtos?.[stationKey] || []).some(Boolean));
  }
  const custom = cloneCustomStations(rotation.customStations);
  if (stationKey === "streetBeets") {
    const filledCaloriesValid = ["entrees", "sides", "subRecipes", "extensions"].every((group) => (custom.streetBeets[group] || []).every((name, index) => !name || Boolean(custom.streetBeets.calories?.[group]?.[index])));
    return custom.streetBeets.entrees.filter(Boolean).length >= 2 && custom.streetBeets.sides.filter(Boolean).length >= 3 && filledCaloriesValid;
  }
  if (stationKey === "commissaryEverest") {
    return Boolean(custom.commissaryEverest.menu && custom.commissaryEverest.entrees.filter(Boolean).length >= 2 && custom.commissaryEverest.coldSides.filter(Boolean).length >= 4 && custom.commissaryEverest.riceDishes.filter(Boolean).length >= 1);
  }
  if (stationKey === "lotusWp") return custom.lotusWp.entrees.filter(Boolean).length >= 2 && custom.lotusWp.sides.filter(Boolean).length >= 4;
  if (stationKey === "stationTakeover") {
    if (!custom.stationTakeover.active && !custom.stationTakeover.menu && !compactValues([...custom.stationTakeover.entrees, ...custom.stationTakeover.sides, ...custom.stationTakeover.subRecipes, ...custom.stationTakeover.extensions]).length) return true;
    return Boolean(custom.stationTakeover.menu && custom.stationTakeover.entrees.filter(Boolean).length >= 2 && custom.stationTakeover.sides.filter(Boolean).length >= 2);
  }
  if (stationKey === "wok") return Boolean((rotation.ltos?.wokEntrees || []).some(Boolean));
  if (stationKey === "carvery") return Boolean(Object.values(rotation.carvery || {}).some(Boolean));
  return false;
}

function rotationRequirements(rotation, cafe, week = "") {
  const stationKeys = CAFE_STATION_CONFIG[cafe] || ["global"];
  const globalReady = stationComplete(rotation, "global", cafe, week);
  const optionalStations = cafe === "Doppler" ? new Set(["pizza"]) : cafe === "Astra" ? new Set(["grill"]) : new Set();
  const incompleteStations = stationKeys.filter((stationKey) => stationKey !== "global" && !optionalStations.has(stationKey) && !stationComplete(rotation, stationKey, cafe, week));
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
    if (!isSubmittedRotation(row)) return acc;
    const menu = rotationMenuLabel(row, row.cafe, row.week) || row.menu;
    if (menu) acc[menu] = (acc[menu] || 0) + 1;
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
  if (!isSubmittedRotation(row)) return false;
  const menu = rotationMenuLabel(row, row.cafe, row.week) || row.menu;
  if (!menu || !cafeUsesMenuConflictRule(row.district, row.cafe, row.copiedFrom)) return false;
  const count = conflictMenus[`${row.district}|${menu}`] ?? conflictMenus[menu] ?? 0;
  return count > 1;
}

function menuConflictCountForCandidate(district, rows, candidateCafe, candidateMenu) {
  if (!candidateMenu || !cafeUsesMenuConflictRule(district, candidateCafe)) return 0;
  const submittedMatches = conflictControlledRows(district, rows).filter((row) => {
    if (!isSubmittedRotation(row) || row.cafe === candidateCafe) return false;
    return (rotationMenuLabel(row, row.cafe, row.week) || row.menu) === candidateMenu;
  }).length;
  return submittedMatches + 1;
}

function rotationRequirementIssues(requirements, cafe, { menu = "", duplicateMenuCount = 0, conflictNote = "" } = {}) {
  const issues = [];
  if (!requirements.globalReady) {
    const needsSides = ["Astra", "Bingo", "Sonic", "Blueshift", "Eclipse", "Grace"].includes(cafe);
    issues.push(needsSides ? "Select a Global Menu, at least two Global entrees, and at least two Global sides." : "Select a Global Menu and at least two Global entrees.");
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
  const declared = rows.filter(hasSubmittedRotationMenu).length;
  const missing = rows.filter((row) => !hasSubmittedRotationMenu(row)).map((row) => row.cafe);
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

function globalSelectedRowsForCafe(rotation, cafe = "", options = {}, week = rotation?.week || "") {
  if (cafe === "Nitro") {
    const blocks = hasNitroSplitBlocks(rotation)
      ? nitroGlobalBlockLayout().map((block) => getRotationGlobalBlock(rotation, block.id))
      : [hydrateNitroBlock(rotation, "nitroMonTue")];
    return uniqueSelectionRows(blocks.flatMap((block) => selectedRowsFromGlobalBlock(block, options)), options);
  }

  if (cafe === "Re:Invent") {
    const activeBlockIds = activeReInventBlockIds(week || options.week || rotation.week || "");
    const blockRows = Object.entries(rotation.globalBlocks || {})
      .filter(([blockId, block]) => activeBlockIds.has(blockId) && blockId !== "noodles" && (block?.menu || blockHasSelections(block)))
      .flatMap(([, block]) => selectedRowsFromGlobalBlock(block, options));
    return uniqueSelectionRows(blockRows.length ? blockRows : globalSelectedRows(rotation, options), options);
  }

  return globalSelectedRows(rotation, options);
}

function getStationSelectionRows(rotation, cafe, week = rotation?.week || "") {
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
      const activeBlockIds = activeReInventBlockIds(week || rotation.week || "");
      const blocks = Object.entries(rotation.globalBlocks || {}).filter(([blockId, block]) => activeBlockIds.has(blockId) && blockId !== "noodles" && (block?.menu || blockHasSelections(block)));
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
    stationRows.push({ key: "grill", label: stationLabel(cafe, "grill"), items: grillItems, note: cafe === "Doppler" ? "grill fresh five" : "location spotlights" });
  }

  ["salad", "pizza", "deli", "fishMarket", "freshFive", "grillFreshFive", "saladFreshFive", "soup"].forEach((key) => {
    if (cafeStations.includes(key)) {
      const selected = ltoSelectedRows(rotation, key, { unique: true });
      const uploadedItems = (uploaded[key] || []).filter(Boolean).map(makeUploadedItem);
      stationRows.push({ key, label: STATION_LABELS[key], items: selected.length ? selected : uploadedItems, note: selected.length ? "selected" : uploadedItems.length ? "from upload preview" : "not selected" });
    }
  });

  ["streetBeets", "commissaryEverest", "lotusWp", "stationTakeover"].forEach((key) => {
    if (cafeStations.includes(key)) {
      const selected = customStationSelectedRows(rotation, key, { unique: true });
      stationRows.push({ key, label: STATION_LABELS[key], items: selected, note: selected.length ? "selected" : "not selected" });
    }
  });

  if (cafeStations.includes("wok")) stationRows.push({ key: "wok", label: "Wok Station", items: wokSelectedRows(rotation, { unique: true }), note: "wok selections" });
  if (cafeStations.includes("carvery")) stationRows.push({ key: "carvery", label: "Carvery Station", items: carverySelectedRows(rotation, { unique: true }), note: "carvery selections" });

  return stationRows;
}

function allLegacySelectedRows(rotation) {
  const blockRows = Object.values(rotation.globalBlocks || {}).flatMap((block) => selectedRowsFromGlobalBlock(block));
  return [
    ...globalSelectedRows(rotation),
    ...blockRows,
    ...grillSelectedRows(rotation),
    ...["salad", "pizza", "deli", "fishMarket", "freshFive", "grillFreshFive", "saladFreshFive", "soup"].flatMap((stationKey) => ltoSelectedRows(rotation, stationKey)),
    ...["streetBeets", "commissaryEverest", "lotusWp", "stationTakeover"].flatMap((stationKey) => customStationSelectedRows(rotation, stationKey)),
    ...wokSelectedRows(rotation),
    ...carverySelectedRows(rotation)
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

function carveryCandidateRowsForField(field = "") {
  if (field.includes("protein")) return stationPool("carveryProtein");
  if (field.includes("vegetable")) return stationPool("carveryVegetable");
  if (field.includes("starch")) return potatoSides().length ? potatoSides() : stationPool("carverySide");
  if (field.includes("hot")) return carveryHotSides();
  if (field.includes("cold")) return carveryColdSides();
  return stationPool("carverySide");
}

function carverySelectionGroupForField(field = "") {
  return field.includes("protein") ? "entrees" : "sides";
}

function carverySelectedRows(rotation, options) {
  const rows = Object.entries(rotation.carvery || {}).flatMap(([field, value]) =>
    rowsForSelectedNames([value], {
      ...options,
      candidateRows: carveryCandidateRowsForField(field),
      selectionGroup: carverySelectionGroupForField(field)
    })
  );
  return uniqueSelectionRows(rows, options);
}

function customStationSelectedRows(rotation, stationKey, options = {}) {
  const custom = cloneCustomStations(rotation.customStations);
  const rowsFromNames = (names = [], group = "", station = STATION_LABELS[stationKey], calories = [], candidateRows = MENUWORKS_ITEMS) => uniqueSelectionRows(names.filter(Boolean).map((name, index) => {
    const matched = findBestRowForName(name, candidateRows) || findBestRowForName(name);
    return matched ? { ...matched, __selectionGroup: group } : makeCustomStationItem(name, { station, category: group || "custom", calories: calories[index] || "", selectionGroup: group });
  }), options);
  if (stationKey === "streetBeets") {
    return uniqueSelectionRows([
      ...rowsFromNames(custom.streetBeets.entrees, "entrees", "Street Beets", custom.streetBeets.calories.entrees),
      ...rowsFromNames(custom.streetBeets.sides, "sides", "Street Beets", custom.streetBeets.calories.sides),
      ...rowsFromNames(custom.streetBeets.subRecipes, "subRecipes", "Street Beets", custom.streetBeets.calories.subRecipes),
      ...rowsFromNames(custom.streetBeets.extensions, "extensions", "Street Beets", custom.streetBeets.calories.extensions)
    ], options);
  }
  if (stationKey === "commissaryEverest") {
    return uniqueSelectionRows([
      ...rowsFromNames(custom.commissaryEverest.entrees, "entrees", "Everest Commissary"),
      ...rowsFromNames(custom.commissaryEverest.hotSides, "sides", "Everest Commissary"),
      ...rowsFromNames(custom.commissaryEverest.coldSides, "sides", "Everest Commissary"),
      ...rowsFromNames(custom.commissaryEverest.riceDishes, "sides", "Everest Commissary")
    ], options);
  }
  if (stationKey === "lotusWp") {
    return uniqueSelectionRows([
      ...rowsFromNames(custom.lotusWp.entrees, "entrees", "Lotus W&P", [], stationPool("lotusEntrees")),
      ...rowsFromNames(custom.lotusWp.sides, "sides", "Lotus W&P", [], stationPool("lotusSides"))
    ], options);
  }
  if (stationKey === "stationTakeover") {
    return uniqueSelectionRows([
      ...rowsFromNames(custom.stationTakeover.entrees, "entrees", "Station Takeover"),
      ...rowsFromNames(custom.stationTakeover.sides, "sides", "Station Takeover"),
      ...rowsFromNames(custom.stationTakeover.subRecipes, "subRecipes", "Station Takeover"),
      ...rowsFromNames(custom.stationTakeover.extensions, "extensions", "Station Takeover")
    ], options);
  }
  return [];
}

function selectedItems(rotation, cafe = rotation?.cafe || "", week = rotation?.week || "") {
  if (cafe) return getStationSelectionRows(rotation, cafe, week).flatMap((row) => row.items);
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

function getStationCostOverview(rotation, cafe, week = rotation?.week || "") {
  return getStationSelectionRows(rotation, cafe, week).map((row) => {
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
  const [databaseLoadStatus, setDatabaseLoadStatus] = useState({ state: "idle", message: "Using local saved data until the shared database is loaded.", loadedAt: "" });
  const [databaseSyncStatus, setDatabaseSyncStatus] = useState({ state: "idle", message: "No database sync attempted yet.", syncedAt: "" });
  const [smartsheetReadCooldown, setSmartsheetReadCooldown] = useState(false);

  useEffect(() => { localStorage.setItem(NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, JSON.stringify(rotations)); }, [rotations]);
  useEffect(() => { localStorage.setItem(SMARTSHEET_DATABASE_STORAGE_KEY, JSON.stringify(databaseRecords)); }, [databaseRecords]);

  const refreshFromDatabase = async () => {
    if (databaseLoadStatus.state === "loading" || smartsheetReadCooldown) {
      setDatabaseLoadStatus((prev) => ({
        ...prev,
        message: "Sync Latest is already running or cooling down. Try again in a few seconds.",
      }));
      return;
    }
    setSmartsheetReadCooldown(true);
    setDatabaseLoadStatus({ state: "loading", message: "Loading saved rotations from database...", loadedAt: "" });
    try {
      const payload = await loadRecordsFromBackbone({ tool: "rotation" });
      const records = payload.records || [];
      const loadedRotations = recordsToRotations(records);
      setDatabaseRecords(records);
      setRotations((prev) => ({ ...prev, ...loadedRotations }));
      setDatabaseLoadStatus({
        state: payload.state === "fallback" ? "fallback" : "synced",
        message: payload.message || `Loaded ${records.length} database row${records.length === 1 ? "" : "s"}. Executive View is using shared rotations when available.`,
        loadedAt: nowStamp(),
      });
    } catch (error) {
      setDatabaseLoadStatus({
        state: "fallback",
        message: error.message || "Could not load shared database records. Using local fallback records.",
        loadedAt: nowStamp(),
      });
    } finally {
      window.setTimeout(() => setSmartsheetReadCooldown(false), 10000);
    }
  };

  useEffect(() => { refreshFromDatabase(); }, []);

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

  const rowForCafe = (wk, dist, cafe) => {
    const priorWeek = previousRotationWeek(wk);
    return {
      week: wk,
      district: dist,
      cafe,
      previousRotation: priorWeek ? (rotations[rotationKey(priorWeek, dist, cafe)] || EMPTY_ROTATION) : EMPTY_ROTATION,
      ...(rotations[rotationKey(wk, dist, cafe)] || EMPTY_ROTATION)
    };
  };
  const handleOpenPlannerFromSummary = (row) => {
    const targetCafe = row?.copiedFrom || row?.cafe || "";
    if (!row?.district || !targetCafe) return;
    setWeek(row.week || week);
    setDistrict(row.district);
    setSelectedCafe(targetCafe);
    setRotationView("planner");
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  };

  const districtWeekRows = cafes.map((cafe) => rowForCafe(week, district, cafe));
  const leadershipRows = district === "South" ? districtWeekRows.flatMap((row) => row.cafe === "Nitro" ? [row, { ...row, cafe: "Frontier", copiedFrom: "Nitro" }] : [row]) : districtWeekRows;
  const conflictMenus = menuConflictCounts(conflictControlledRows(district, districtWeekRows));
  const allRows = Object.entries(DISTRICTS).flatMap(([dist, cafeList]) => cafeList.map((cafe) => rowForCafe(week, dist, cafe)));
  const allConflictMenus = Object.entries(DISTRICTS).reduce((acc, [dist, cafeList]) => {
    const rows = cafeList.map((cafe) => rowForCafe(week, dist, cafe));
    Object.entries(menuConflictCounts(conflictControlledRows(dist, rows))).forEach(([menu, count]) => {
      acc[`${dist}|${menu}`] = count;
    });
    return acc;
  }, {});
  const resultRows = ROLLING_ROTATION_WEEKS.flatMap((wk) => Object.entries(DISTRICTS).flatMap(([dist, cafeList]) => cafeList.map((cafe) => rowForCafe(wk, dist, cafe)))).filter(hasSubmittedRotationMenu);
  const filteredResults = resultRows.filter((row) => (resultsDistrict === "All" || row.district === resultsDistrict) && (resultsCafe === "All" || row.cafe === resultsCafe)).reverse();
  const persistRotationToDatabase = async (nextRotation) => {
    if (!week || !district || !selectedCafe) return;
    const nextRecords = buildDatabaseRecordsForRotation({ week, district, cafe: selectedCafe, rotation: nextRotation });
    setDatabaseRecords((prev) => upsertDatabaseRecords(prev, nextRecords));
    setDatabaseSyncStatus({ state: "syncing", message: `Saving ${nextRecords.length} row${nextRecords.length === 1 ? "" : "s"} to database...`, syncedAt: "" });
    try {
      const result = await syncRecordsToBackbone(nextRecords, { tool: "Neighborhood Rotations", week, district, cafe: selectedCafe, status: nextRotation.status || "Draft", replaceParentRecordIds: [rotationRecordParentId(week, district, selectedCafe)] });
      setDatabaseSyncStatus({ state: result.state === "fallback" ? "fallback" : "synced", message: result.message || `Saved ${nextRecords.length} row${nextRecords.length === 1 ? "" : "s"} to database.`, syncedAt: nowStamp() });
    } catch (error) {
      const missingColumns = error?.payload?.missingColumns || [];
      const missingMessage = missingColumns.length
        ? `Fallback sheet is missing ${missingColumns.length} required column${missingColumns.length === 1 ? "" : "s"}: ${missingColumns.join(", ")}`
        : error.message || "Database sync failed. Local fallback saved.";
      setDatabaseSyncStatus({
        state: "fallback",
        message: missingMessage,
        missingColumns,
        syncedAt: nowStamp(),
      });
    }
  };

  return (
    <div className="neighborhood-rotations-shell min-h-screen bg-[linear-gradient(180deg,#f6f7f9_0%,#eef7f2_100%)] text-slate-950 p-4 md:p-8">
      <div className="max-w-[90rem] mx-auto space-y-5">
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
              <StatusCard ready={Boolean(district && selectedCafe)} conflicts={Object.values(conflictMenus).filter((count) => count > 1).length} completed={districtWeekRows.filter(hasSubmittedRotationMenu).length} total={cafes.length} />
            </section>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {district && selectedCafe ? <RotationPlannerCard cafe={selectedCafe} district={district} menuOptions={menus} rotation={currentRotation} previousRotation={previousRotation} previousWeek={carryoverWeek} updateRotation={updateRotation} week={week} printRows={allRows} persistRotationToDatabase={persistRotationToDatabase} databaseLoadStatus={databaseLoadStatus} databaseSyncStatus={databaseSyncStatus} onRefreshDatabase={refreshFromDatabase} isRefreshCoolingDown={smartsheetReadCooldown} menuConflictCount={menuConflictCountForCandidate(district, districtWeekRows, selectedCafe, rotationMenuLabel(currentRotation, selectedCafe, week) || currentRotation.menu)} /> : <SelectPlannerPrompt />}
              </div>
              <LeadershipOverview district={district} week={week} rows={leadershipRows} conflictMenus={conflictMenus} onOpenPlanner={handleOpenPlannerFromSummary} />
            </section>
          </>
        )}
        {rotationView === "executive" && <ExecutiveView week={week} setWeek={setWeek} rows={allRows} conflictMenus={allConflictMenus} onOpenPlanner={handleOpenPlannerFromSummary} />}
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
      <p className="font-bold">Database alignment</p>
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
          <p className="font-bold">Fallback write needs attention</p>
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
          <p className="font-bold text-slate-900">Shared live database</p>
          <p className="mt-1 text-slate-500">The planner writes through Supabase first, with Smartsheet kept as the fallback and mirror.</p>
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
  const submittedRotation = isSubmittedRotation(rotation);
  const lockedForEditing = submittedRotation && !editSubmitted;
  const guardedUpdateRotation = (patch) => {
    if (lockedForEditing) return;
    updateRotation(patch);
  };

  const stationOptions = subConceptOptionsForMenu(rotation.menu);
  const menuItems = globalMenuRows(rotation.menu, rotation.station);
  const categorized = categorize(menuItems);
  const items = selectedItems(rotation, cafe, week);
  const summary = foodSummary(items);
  const cafeStations = CAFE_STATION_CONFIG[cafe] || ["global"];
  const stationCostOverview = getStationCostOverview(rotation, cafe, week);
  const requirements = rotationRequirements(rotation, cafe, week);
  const submitIssues = rotationRequirementIssues(requirements, cafe, { menu: rotationMenuLabel(rotation, cafe, week) || rotation.menu, duplicateMenuCount: menuConflictCount, conflictNote: menuConflictNote(district, cafe) });
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
        previousWeek={previousWeek}
        previousRotation={previousRotation}
        printRows={printRows}
        rotation={rotation}
        requirements={requirements}
        submitIssues={submitIssues}
        canSubmit={canSubmitRotation}
        onSaveDraft={markDraft}
        onSubmit={submitRotation}
      />
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
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${submittedRotation ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
          {rotation.status || "Draft"}
        </span>
      </div>
      {submittedRotation && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black">Locked rotation selections are showing below.</p>
              <p className="mt-1 font-semibold text-emerald-800">Check edit mode only when you need to revise and resubmit this cafe/week.</p>
            </div>
            <label className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-black text-emerald-900">
              <input type="checkbox" checked={editSubmitted} onChange={(event) => setEditSubmitted(event.target.checked)} />
              Edit locked rotation
            </label>
          </div>
        </div>
      )}

      {lockedForEditing ? (
        <SubmittedRotationRecap cafe={cafe} week={week} rotation={rotation} previousRotation={previousRotation} rows={stationCostOverview} onEdit={() => setEditSubmitted(true)} />
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

function selectedCalorieRange(items) {
  const entreeCalories = items.filter((row) => selectionRole(row) === "entree").map(getCalories).filter((value) => value != null).sort((a, b) => a - b);
  const sideCalories = items.filter((row) => selectionRole(row) === "side").map(getCalories).filter((value) => value != null).sort((a, b) => a - b);
  const subRecipeCalories = items.filter((row) => selectionRole(row) === "subRecipe").map(getCalories).filter((value) => value != null).reduce((sum, value) => sum + value, 0);
  if (!entreeCalories.length) return { low: null, high: null };
  const sideCount = Math.min(2, sideCalories.length);
  const low = entreeCalories[0] + sideCalories.slice(0, sideCount).reduce((sum, value) => sum + value, 0) + subRecipeCalories;
  const high = entreeCalories[entreeCalories.length - 1] + (sideCount ? sideCalories.slice(-sideCount) : []).reduce((sum, value) => sum + value, 0) + subRecipeCalories;
  return { low, high };
}

function calorieRangeLabel(items) {
  const range = selectedCalorieRange(items);
  if (range.low == null || range.high == null) return "Calories pending";
  if (range.low === range.high) return `${range.low} cal`;
  return `${range.low}-${range.high} cal`;
}

function cleanMenuTitle(menu = "") {
  return String(menu || "").replace(/^AMZ\+RA:\s*/i, "").replace(/^AMZ:\s*/i, "").trim() || "Menu pending";
}

function dietSuffix(row) {
  const diet = getDiet(row);
  if (diet === "Vegan") return " VN";
  if (diet === "Vegetarian") return " V";
  return "";
}

function customerMenuSummary(block = {}) {
  const rows = selectedRowsFromGlobalBlock(block, { unique: true });
  const entreeCount = rows.filter((row) => selectionRole(row) === "entree").length;
  const sideCount = rows.filter((row) => selectionRole(row) === "side").length;
  const subRecipeCount = rows.filter((row) => selectionRole(row) === "subRecipe").length;
  if (!rows.length) return "Selections pending.";
  const parts = [];
  if (entreeCount) parts.push(`choice of ${entreeCount} protein${entreeCount === 1 ? "" : "s"}`);
  if (sideCount) parts.push(`${sideCount} side${sideCount === 1 ? "" : "s"}`);
  if (subRecipeCount) parts.push(`${subRecipeCount} sauce or composed component${subRecipeCount === 1 ? "" : "s"}`);
  return parts.length ? `Featuring ${parts.join(", ")}.` : "Composed menu selections ready for service.";
}

function dopplerCurrentGlobalBlock(rotation = {}) {
  return {
    menu: rotation.menu || "",
    station: rotation.station || "",
    entrees: rotation.entrees || [],
    sides: rotation.sides || [],
    subRecipes: rotation.subRecipes || [],
    extensions: rotation.extensions || [],
  };
}

function buildDopplerMenuPacket({ rotation, previousRotation, week, previousWeek }) {
  const carryoverBlock = carryoverGlobalBlock(previousRotation);
  const currentBlock = dopplerCurrentGlobalBlock(rotation);
  const promo = rotation.promotionOverride || EMPTY_ROTATION.promotionOverride;
  const stationRows = (stationKey) => ltoSelectedRows(rotation, stationKey, { unique: true });
  const sections = [
    {
      page: 2,
      title: "Salt + Char",
      subtitle: "Grill Fresh Five",
      items: grillSelectedRows(rotation, { unique: true }).slice(0, 1),
      note: "Rewrites the highlighted Fresh Five grill item."
    },
    {
      page: 4,
      title: cleanMenuTitle(carryoverBlock.menu),
      subtitle: `Monday + Tuesday carryover${previousWeek ? ` from ${previousWeek}` : ""}`,
      block: carryoverBlock,
      items: selectedRowsFromGlobalBlock(carryoverBlock, { unique: true }),
      summary: customerMenuSummary(carryoverBlock),
      calories: calorieRangeLabel(selectedRowsFromGlobalBlock(carryoverBlock, { unique: true }))
    },
    ...(promo.enabled ? [{
      page: "Marketing Insert",
      title: "<Use 8.5x11 from Marketing>",
      subtitle: promo.name || "Promotion override",
      items: [],
      note: "Insert the provided promotion menu page here."
    }] : []),
    {
      page: 5,
      title: cleanMenuTitle(currentBlock.menu),
      subtitle: "Wednesday through Friday",
      block: currentBlock,
      items: selectedRowsFromGlobalBlock(currentBlock, { unique: true }),
      summary: customerMenuSummary(currentBlock),
      calories: calorieRangeLabel(selectedRowsFromGlobalBlock(currentBlock, { unique: true }))
    },
    {
      page: 6,
      title: "Pizza LTOs",
      subtitle: "Pizza menu selections",
      items: stationRows("pizza").slice(0, 2),
      note: "Maps to the two changing pizza selections."
    },
    {
      page: stationRows("salad").length > 1 ? "8 + 9" : 8,
      title: "Zane's Salad",
      subtitle: stationRows("salad").length > 1 ? "Two Fresh Five salads" : "Fresh Five salad",
      items: stationRows("salad"),
      note: "If only one salad is selected, generate one page."
    },
    {
      page: 10,
      title: "Paninoteca Deli",
      subtitle: "Fresh Five deli selection",
      items: stationRows("deli").slice(0, 1),
      note: "Maps to the deli menu page."
    }
  ];
  return { week, sections };
}

function packetSafeFileName(packet) {
  return `Doppler-menu-packet-${String(packet.week || "week").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.html`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generatedMenuPageHtml(section) {
  const items = section.items || [];
  const entrees = items.filter((row) => selectionRole(row) === "entree");
  const sides = items.filter((row) => selectionRole(row) === "side");
  const otherItems = items.filter((row) => !["entree", "side"].includes(selectionRole(row)));
  const entreeHtml = entrees.map((item) => `
    <div class="entree">
      <h3>${escapeHtml(titleCase(getDisplayName(item) || getItemIdentity(item)))}${escapeHtml(dietSuffix(item))}</h3>
      ${getDescription(item) ? `<p>${escapeHtml(getDescription(item))}</p>` : ""}
    </div>
  `).join("");
  const sideHtml = sides.length ? `
    <div class="sideBox">
      <p class="sectionLabel">Sides 2.55</p>
      <div class="chips">
        ${sides.map((item) => `<span>${escapeHtml(titleCase(getDisplayName(item) || getItemIdentity(item)))}${escapeHtml(dietSuffix(item))}${getCalories(item) == null ? "" : ` - ${getCalories(item)} cal`}</span>`).join("")}
      </div>
    </div>
  ` : "";
  const otherHtml = otherItems.map((item) => `
    <div class="other">
      <h3>${escapeHtml(titleCase(getDisplayName(item) || getItemIdentity(item)))}${escapeHtml(dietSuffix(item))}</h3>
      ${getDescription(item) ? `<p>${escapeHtml(getDescription(item))}</p>` : ""}
    </div>
  `).join("");
  return `
    <section class="menuPage">
      <div class="pageTop">
        <div>
          <p class="eyebrow">Page ${escapeHtml(section.page)}</p>
          <h2>${escapeHtml(section.title)}</h2>
          <p class="subtitle">${escapeHtml(section.subtitle || "")}</p>
        </div>
        ${section.calories ? `<span class="caloriePill">${escapeHtml(section.calories)}</span>` : ""}
      </div>
      ${section.summary ? `<div class="summary">${escapeHtml(section.summary)}</div>` : ""}
      ${section.note ? `<p class="note">${escapeHtml(section.note)}</p>` : ""}
      ${items.length ? `<div class="items">${entreeHtml}${sideHtml}${otherHtml}</div>` : `<p class="pending">Selection pending.</p>`}
    </section>
  `;
}

function dopplerMenuPacketHtml(packet) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Doppler Generated Menu Packet</title>
    <style>
      body { margin: 0; background: #f6f7f9; color: #0f172a; font-family: Arial, sans-serif; }
      main { max-width: 960px; margin: 0 auto; padding: 28px; }
      .cover { background: #061020; color: white; border-radius: 28px; padding: 28px; margin-bottom: 18px; }
      .cover p { color: #9fb2c7; font-weight: 700; margin: 8px 0 0; }
      .menuPage { page-break-inside: avoid; background: #fff; border: 1px solid #dbe3ea; border-radius: 24px; padding: 28px; margin-bottom: 18px; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); }
      .pageTop { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .eyebrow, .sectionLabel { margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; }
      h1 { margin: 0; font-size: 34px; }
      h2 { margin: 8px 0 0; font-size: 30px; line-height: 1.08; }
      h3 { margin: 0; font-size: 20px; }
      .subtitle { margin: 8px 0 0; color: #64748b; font-weight: 800; }
      .caloriePill { border-radius: 999px; border: 1px solid #cbd5e1; background: #fff; color: #334155; padding: 8px 12px; font-weight: 900; white-space: nowrap; }
      .summary { margin-top: 18px; background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid #b99b55; border-radius: 16px; padding: 14px; color: #334155; font-weight: 800; }
      .note, .pending { margin-top: 18px; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; color: #475569; font-weight: 800; background: #fff; }
      .pending { border-color: #cbd5e1; background: #f8fafc; color: #475569; }
      .items { margin-top: 18px; display: grid; gap: 12px; }
      .entree { background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid #0f172a; border-radius: 16px; padding: 14px; }
      .entree p, .other p { margin: 6px 0 0; line-height: 1.45; font-weight: 700; color: #475569; }
      .sideBox, .other { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      .chips span { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; padding: 7px 11px; font-weight: 900; }
      @media print {
        body { background: #fff; }
        main { max-width: none; padding: 10mm; }
        .cover, .menuPage { box-shadow: none; }
        .menuPage { break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="cover">
        <p class="eyebrow">Generated Menu Packet</p>
        <h1>Doppler Cafe</h1>
        <p>${escapeHtml(packet.week || "")}</p>
      </section>
      ${packet.sections.map(generatedMenuPageHtml).join("")}
    </main>
  </body>
</html>`;
}

function downloadDopplerMenuPacket(packet) {
  const blob = new Blob([dopplerMenuPacketHtml(packet)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = packetSafeFileName(packet);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function pptText(value, maxLength = 160) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength).trim();
  return cut.includes(" ") ? cut.slice(0, cut.lastIndexOf(" ")).trim() : cut;
}

function emu(value) {
  return Math.round(value * 914400);
}

function pptColor(value = "#0f172a") {
  return String(value).replace("#", "").toUpperCase();
}

function pptShapeText({ id, x, y, w, h, text, fontSize = 18, bold = false, italic = false, color = "#0f172a", align = "l", fill = null, line = null }) {
  const paragraphs = String(text || " ")
    .split("\n")
    .map((line) => `
      <a:p>
        <a:pPr algn="${align}"/>
        <a:r>
          <a:rPr lang="en-US" sz="${Math.round(fontSize * 100)}"${bold ? ' b="1"' : ""}${italic ? ' i="1"' : ""}>
            <a:solidFill><a:srgbClr val="${pptColor(color)}"/></a:solidFill>
            <a:latin typeface="Aptos"/>
          </a:rPr>
          <a:t>${xmlEscape(line || " ")}</a:t>
        </a:r>
      </a:p>
    `)
    .join("");
  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
        <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
        ${fill ? `<a:solidFill><a:srgbClr val="${pptColor(fill)}"/></a:solidFill>` : "<a:noFill/>"}
        ${line ? `<a:ln w="9525"><a:solidFill><a:srgbClr val="${pptColor(line)}"/></a:solidFill></a:ln>` : "<a:ln><a:noFill/></a:ln>"}
      </p:spPr>
      <p:txBody><a:bodyPr wrap="square" anchor="mid" lIns="91440" rIns="91440" tIns="45720" bIns="45720"/><a:lstStyle/>${paragraphs}</p:txBody>
    </p:sp>
  `;
}

function pptRect({ id, x, y, w, h, fill = "#ffffff", line = "#dbeafe" }) {
  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="Card ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
        <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="${pptColor(fill)}"/></a:solidFill>
        <a:ln w="12700"><a:solidFill><a:srgbClr val="${pptColor(line)}"/></a:solidFill></a:ln>
      </p:spPr>
    </p:sp>
  `;
}

function pptSlideXml(shapes) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
    <p:cSld>
      <p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
      <p:spTree>
        <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
        <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu(8.5)}" cy="${emu(11)}"/><a:chOff x="0" y="0"/><a:chExt cx="${emu(8.5)}" cy="${emu(11)}"/></a:xfrm></p:grpSpPr>
        ${shapes.join("")}
      </p:spTree>
    </p:cSld>
    <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
  </p:sld>`;
}

function pptItemText(item) {
  const name = titleCase(getDisplayName(item) || getItemIdentity(item));
  const calories = getCalories(item);
  const retail = getSuggestedRetailPrice(item);
  const meta = [
    calories == null ? null : `${calories} cal`,
    retail == null ? null : money(retail),
  ].filter(Boolean).join(" / ");
  const description = getDescription(item);
  return `${name}${dietSuffix(item)}${meta ? ` - ${meta}` : ""}${description ? `\n${pptText(description, 132)}` : ""}`;
}

function pptSectionSlide(section, index) {
  let shapeId = 2;
  const shapes = [
    pptShapeText({ id: shapeId++, x: 0.45, y: 0.35, w: 7.6, h: 0.28, text: "DOPPLER MENU GENERATOR", fontSize: 10, bold: true, color: "#64748b", align: "c" }),
    pptShapeText({ id: shapeId++, x: 0.45, y: 0.65, w: 7.6, h: 0.55, text: section.title || "Menu", fontSize: 26, bold: true, color: "#071225", align: "c" }),
    pptShapeText({ id: shapeId++, x: 0.65, y: 1.25, w: 7.2, h: 0.34, text: section.subtitle || "", fontSize: 12, bold: true, color: "#7c5f21", align: "c" }),
    pptRect({ id: shapeId++, x: 0.55, y: 1.78, w: 7.4, h: 8.55, fill: "#f8fafc", line: "#d9c28b" }),
  ];
  if (section.calories) {
    shapes.push(pptShapeText({ id: shapeId++, x: 5.95, y: 1.92, w: 1.65, h: 0.38, text: section.calories, fontSize: 11, bold: true, color: "#0f172a", align: "c", fill: "#ffffff", line: "#d9c28b" }));
  }
  if (section.summary) {
    shapes.push(pptShapeText({ id: shapeId++, x: 0.9, y: 2.0, w: 6.7, h: 0.58, text: pptText(section.summary, 150), fontSize: 13, bold: true, italic: true, color: "#334155", align: "c" }));
  }
  const items = (section.items || []).slice(0, 8);
  const startY = section.summary ? 2.75 : 2.25;
  if (!items.length) {
    shapes.push(pptShapeText({ id: shapeId++, x: 1.05, y: 3.0, w: 6.4, h: 0.7, text: section.note || "Selection pending.", fontSize: 18, bold: true, color: "#64748b", align: "c" }));
  } else {
    items.forEach((item, itemIndex) => {
      const y = startY + itemIndex * 0.86;
      shapes.push(pptRect({ id: shapeId++, x: 0.9, y, w: 6.7, h: 0.72, fill: "#ffffff", line: "#e2e8f0" }));
      shapes.push(pptShapeText({ id: shapeId++, x: 1.05, y: y + 0.08, w: 6.4, h: 0.56, text: pptItemText(item), fontSize: 11, bold: itemIndex === 0, color: "#0f172a", align: "l" }));
    });
    if ((section.items || []).length > items.length) {
      shapes.push(pptShapeText({ id: shapeId++, x: 1.05, y: startY + items.length * 0.86, w: 6.4, h: 0.4, text: `+ ${(section.items || []).length - items.length} more selected item(s)`, fontSize: 12, bold: true, color: "#64748b", align: "c" }));
    }
  }
  shapes.push(pptShapeText({ id: shapeId++, x: 0.65, y: 10.35, w: 7.2, h: 0.22, text: `Page ${index + 1} - generated from Neighborhood Rotations`, fontSize: 8, color: "#64748b", align: "c" }));
  return pptSlideXml(shapes);
}

function pptCoverSlide(packet) {
  const shapes = [
    pptRect({ id: 2, x: 0.5, y: 0.5, w: 7.5, h: 10, fill: "#071225", line: "#d9c28b" }),
    pptShapeText({ id: 3, x: 0.85, y: 2.45, w: 6.8, h: 0.35, text: "DOPPLER CAFE", fontSize: 14, bold: true, color: "#d9c28b", align: "c" }),
    pptShapeText({ id: 4, x: 0.85, y: 3.0, w: 6.8, h: 1.2, text: "Generated Menu Packet", fontSize: 34, bold: true, color: "#ffffff", align: "c" }),
    pptShapeText({ id: 5, x: 1.1, y: 4.35, w: 6.3, h: 0.5, text: packet.week || "", fontSize: 18, bold: true, color: "#e2e8f0", align: "c" }),
    pptShapeText({ id: 6, x: 1.25, y: 6.0, w: 6.0, h: 0.9, text: "Menus generated from the current Doppler selections.", fontSize: 18, color: "#cbd5e1", align: "c" }),
  ];
  return pptSlideXml(shapes);
}

function pptContentTypes(slideCount) {
  const slideOverrides = Array.from({ length: slideCount }, (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
    <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
    <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
    ${slideOverrides}
  </Types>`;
}

function pptPresentationXml(slideCount) {
  const slides = Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 1}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
    <p:sldIdLst>${slides}</p:sldIdLst>
    <p:sldSz cx="${emu(8.5)}" cy="${emu(11)}" type="custom"/>
    <p:notesSz cx="${emu(8.5)}" cy="${emu(11)}"/>
  </p:presentation>`;
}

function pptPresentationRels(slideCount) {
  const slideRels = Array.from({ length: slideCount }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${slideRels}</Relationships>`;
}

function pptRootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  </Relationships>`;
}

function pptCoreXml() {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dc:title>Doppler Generated Menu Packet</dc:title>
    <dc:creator>Culinary Tools Platform</dc:creator>
    <cp:lastModifiedBy>Culinary Tools Platform</cp:lastModifiedBy>
    <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
    <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
  </cp:coreProperties>`;
}

function pptAppXml(slideCount) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
    <Application>Culinary Tools Platform</Application>
    <PresentationFormat>Custom</PresentationFormat>
    <Slides>${slideCount}</Slides>
  </Properties>`;
}

const zipCrcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = zipCrcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function littleEndian(value, bytes) {
  const out = new Uint8Array(bytes);
  for (let index = 0; index < bytes; index += 1) out[index] = (value >>> (index * 8)) & 0xff;
  return out;
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function zipDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = Math.max(date.getFullYear(), 1980) - 1980;
  return { time, date: (year << 9) | (month << 5) | day };
}

function createZipBlob(files) {
  const encoder = new TextEncoder();
  const { time, date } = zipDateTime();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  files.forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const dataBytes = typeof content === "string" ? encoder.encode(content) : content;
    const crc = crc32(dataBytes);
    const localHeader = concatBytes([
      littleEndian(0x04034b50, 4), littleEndian(20, 2), littleEndian(0x0800, 2), littleEndian(0, 2),
      littleEndian(time, 2), littleEndian(date, 2), littleEndian(crc, 4), littleEndian(dataBytes.length, 4),
      littleEndian(dataBytes.length, 4), littleEndian(nameBytes.length, 2), littleEndian(0, 2), nameBytes,
    ]);
    localParts.push(localHeader, dataBytes);
    const centralHeader = concatBytes([
      littleEndian(0x02014b50, 4), littleEndian(20, 2), littleEndian(20, 2), littleEndian(0x0800, 2),
      littleEndian(0, 2), littleEndian(time, 2), littleEndian(date, 2), littleEndian(crc, 4),
      littleEndian(dataBytes.length, 4), littleEndian(dataBytes.length, 4), littleEndian(nameBytes.length, 2),
      littleEndian(0, 2), littleEndian(0, 2), littleEndian(0, 2), littleEndian(0, 2), littleEndian(0, 4),
      littleEndian(offset, 4), nameBytes,
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });
  const centralDirectory = concatBytes(centralParts);
  const localFileData = concatBytes(localParts);
  const end = concatBytes([
    littleEndian(0x06054b50, 4), littleEndian(0, 2), littleEndian(0, 2), littleEndian(files.length, 2),
    littleEndian(files.length, 2), littleEndian(centralDirectory.length, 4), littleEndian(localFileData.length, 4),
    littleEndian(0, 2),
  ]);
  return new Blob([localFileData, centralDirectory, end], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
}

function readUint16(view, offset) {
  return view.getUint16(offset, true);
}

function readUint32(view, offset) {
  return view.getUint32(offset, true);
}

async function inflateZipEntry(bytes) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("PowerPoint template generation needs browser decompression support.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzipPptxTemplate(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  let eocdOffset = -1;
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (readUint32(view, index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Could not read PowerPoint template.");
  const fileCount = readUint16(view, eocdOffset + 10);
  let centralOffset = readUint32(view, eocdOffset + 16);
  const decoder = new TextDecoder();
  const entries = new Map();
  for (let fileIndex = 0; fileIndex < fileCount; fileIndex += 1) {
    if (readUint32(view, centralOffset) !== 0x02014b50) break;
    const method = readUint16(view, centralOffset + 10);
    const compressedSize = readUint32(view, centralOffset + 20);
    const nameLength = readUint16(view, centralOffset + 28);
    const extraLength = readUint16(view, centralOffset + 30);
    const commentLength = readUint16(view, centralOffset + 32);
    const localOffset = readUint32(view, centralOffset + 42);
    const name = decoder.decode(bytes.slice(centralOffset + 46, centralOffset + 46 + nameLength));
    const localNameLength = readUint16(view, localOffset + 26);
    const localExtraLength = readUint16(view, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : await inflateZipEntry(compressed);
    entries.set(name, data);
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function bytesToText(bytes) {
  return new TextDecoder().decode(bytes);
}

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function removeXmlHighlights(doc) {
  const highlights = Array.from(doc.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "highlight"));
  highlights.forEach((node) => node.parentNode?.removeChild(node));
}

function cleanRunStyleFromTextNode(textNode, { color = "000000", fontSize = null, bold = null } = {}) {
  const aNs = "http://schemas.openxmlformats.org/drawingml/2006/main";
  const run = textNode?.parentNode;
  if (!run) return;
  let rPr = Array.from(run.childNodes).find((node) => node.localName === "rPr");
  if (!rPr) {
    rPr = textNode.ownerDocument.createElementNS(aNs, "a:rPr");
    run.insertBefore(rPr, run.firstChild);
  }
  Array.from(rPr.getElementsByTagNameNS(aNs, "highlight")).forEach((node) => node.parentNode?.removeChild(node));
  Array.from(rPr.childNodes).filter((node) => node.localName === "solidFill").forEach((node) => node.parentNode?.removeChild(node));
  const solidFill = textNode.ownerDocument.createElementNS(aNs, "a:solidFill");
  const srgb = textNode.ownerDocument.createElementNS(aNs, "a:srgbClr");
  srgb.setAttribute("val", color);
  solidFill.appendChild(srgb);
  rPr.appendChild(solidFill);
  if (fontSize != null) rPr.setAttribute("sz", String(Math.round(fontSize * 100)));
  if (bold != null) rPr.setAttribute("b", bold ? "1" : "0");
}

function shapeByPowerPointName(doc, shapeName) {
  const props = Array.from(doc.getElementsByTagNameNS("http://schemas.openxmlformats.org/presentationml/2006/main", "cNvPr"));
  const prop = props.find((node) => node.getAttribute("name") === shapeName);
  return prop?.parentNode?.parentNode || null;
}

function setShapeLines(doc, shapeName, lines, options = {}) {
  const aNs = "http://schemas.openxmlformats.org/drawingml/2006/main";
  const shape = shapeByPowerPointName(doc, shapeName);
  const txBody = shape?.getElementsByTagNameNS("http://schemas.openxmlformats.org/presentationml/2006/main", "txBody")[0]
    || shape?.getElementsByTagNameNS(aNs, "txBody")[0];
  if (!shape || !txBody) return;
  removeXmlHighlights(shape.ownerDocument);
  const firstRunProperties = txBody.getElementsByTagNameNS(aNs, "rPr")[0]?.cloneNode(true);
  Array.from(txBody.getElementsByTagNameNS(aNs, "p")).forEach((paragraph) => paragraph.parentNode?.removeChild(paragraph));
  const cleanLines = (lines.length ? lines : [" "]).map((line) => String(line || " "));
  cleanLines.forEach((line) => {
    const paragraph = doc.createElementNS(aNs, "a:p");
    const paragraphProperties = doc.createElementNS(aNs, "a:pPr");
    paragraphProperties.setAttribute("algn", options.align || "ctr");
    paragraph.appendChild(paragraphProperties);
    const run = doc.createElementNS(aNs, "a:r");
    if (firstRunProperties) run.appendChild(firstRunProperties.cloneNode(true));
    const text = doc.createElementNS(aNs, "a:t");
    text.textContent = line;
    run.appendChild(text);
    paragraph.appendChild(run);
    txBody.appendChild(paragraph);
    cleanRunStyleFromTextNode(text, {
      color: options.color || "000000",
      fontSize: options.fontSize,
      bold: options.bold,
    });
  });
}

function replaceTemplateTextSequence(doc, needle, replacementLines, options = {}) {
  const aNs = "http://schemas.openxmlformats.org/drawingml/2006/main";
  const nodes = Array.from(doc.getElementsByTagNameNS(aNs, "t"));
  const index = nodes.findIndex((node) => String(node.textContent || "").includes(needle));
  if (index < 0) return;
  const clearCount = Math.max(options.clearCount || replacementLines.length, replacementLines.length);
  for (let lineIndex = 0; lineIndex < clearCount; lineIndex += 1) {
    const node = nodes[index + lineIndex];
    if (!node) continue;
    node.textContent = String(replacementLines[lineIndex] || " ");
    cleanRunStyleFromTextNode(node, {
      color: options.color || "000000",
      fontSize: options.fontSize,
      bold: options.bold,
    });
  }
}

function templateMenuName(item) {
  return `${titleCase(getDisplayName(item) || getItemIdentity(item))}${dietSuffix(item)}`;
}

function templateItemMeta(item) {
  if (!item) return "";
  const calories = getCalories(item);
  const retail = getSuggestedRetailPrice(item);
  return [
    calories == null ? null : `${calories} cal`,
    retail == null ? null : money(retail),
  ].filter(Boolean).join(" / ");
}

function templateItemLines(item, { includeDescription = false } = {}) {
  if (!item) return [" ", " ", " "];
  const name = templateMenuName(item);
  const meta = templateItemMeta(item);
  if (!includeDescription) return [name, meta, " "];
  const description = pptText(getDescription(item), 80);
  return [name, description, meta];
}

function templateOneLineItem(item) {
  if (!item) return " ";
  const meta = templateItemMeta(item);
  return `${templateMenuName(item)}${meta ? ` - ${meta}` : ""}`;
}

function templateFreshFiveLines(item) {
  if (!item) return [" ", " ", " "];
  const name = `${titleCase(getDisplayName(item) || getItemIdentity(item))}${dietSuffix(item)}`;
  return [name, templateItemMeta(item), " "];
}

function templateTableRowCells(item) {
  if (!item) return [" ", " ", " ", " "];
  const retail = getSuggestedRetailPrice(item);
  const calories = getCalories(item);
  return [
    templateMenuName(item),
    " ",
    calories == null ? " " : `${calories} cal`,
    retail == null ? " " : money(retail),
  ];
}

function templateGlobalLines(block) {
  const rows = selectedRowsFromGlobalBlock(block, { unique: true });
  const entrees = rows.filter((row) => selectionRole(row) === "entree");
  const sides = rows.filter((row) => selectionRole(row) === "side");
  const lines = [];
  entrees.slice(0, 5).forEach((item) => lines.push(templateOneLineItem(item)));
  if (sides.length) {
    if (lines.length) lines.push(" ");
    lines.push("Sides | 2.55");
    sides.slice(0, 6).forEach((item) => lines.push(`${titleCase(getDisplayName(item) || getItemIdentity(item))}${getCalories(item) == null ? "" : ` ${getCalories(item)} cal`}`));
  }
  return lines.length ? lines : ["Selections pending"];
}

function serializeXml(doc) {
  return new XMLSerializer().serializeToString(doc);
}

function patchDopplerTemplateSlide(xml, patcher) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  removeXmlHighlights(doc);
  patcher(doc);
  return serializeXml(doc);
}

function patchDopplerTemplateEntries(entries, packet) {
  const carryover = packet.sections.find((section) => String(section.subtitle || "").includes("carryover"));
  const current = packet.sections.find((section) => String(section.subtitle || "").includes("Wednesday"));
  const grill = packet.sections.find((section) => section.subtitle === "Grill Fresh Five");
  const pizza = packet.sections.find((section) => section.title === "Pizza LTOs");
  const salad = packet.sections.find((section) => section.title === "Zane's Salad");
  const deli = packet.sections.find((section) => section.title === "Paninoteca Deli");
  const patch = (path, patcher) => {
    const xml = entries.get(path);
    if (!xml) return;
    entries.set(path, textToBytes(patchDopplerTemplateSlide(bytesToText(xml), patcher)));
  };
  patch("ppt/slides/slide2.xml", (doc) => {
    replaceTemplateTextSequence(doc, "FRESH 5: BLACKENED", templateFreshFiveLines(grill?.items?.[0]), { clearCount: 6, fontSize: 13, color: "000000" });
  });
  patch("ppt/slides/slide4.xml", (doc) => {
    setShapeLines(doc, "TextBox 16", [carryover?.title || "Menu pending", carryover?.calories || "calories pending"], { fontSize: 30, bold: true, align: "ctr" });
    setShapeLines(doc, "TextBox 26", [carryover?.summary || "Selections pending."], { fontSize: 17, italic: true, align: "ctr" });
    setShapeLines(doc, "TextBox 7", templateGlobalLines(carryover?.block || {}), { fontSize: 17, bold: false, align: "ctr" });
  });
  patch("ppt/slides/slide5.xml", (doc) => {
    setShapeLines(doc, "TextBox 16", [current?.title || "Menu pending", current?.calories || "calories pending"], { fontSize: 30, bold: true, align: "ctr" });
    setShapeLines(doc, "TextBox 26", [current?.summary || "Selections pending."], { fontSize: 17, italic: true, align: "ctr" });
    setShapeLines(doc, "TextBox 7", templateGlobalLines(current?.block || {}), { fontSize: 17, bold: false, align: "ctr" });
  });
  patch("ppt/slides/slide6.xml", (doc) => {
    const pizzaItems = pizza?.items || [];
    replaceTemplateTextSequence(doc, "GARDEN PESTO", templateTableRowCells(pizzaItems[0]), { clearCount: 4, fontSize: 12, color: "000000", bold: false });
    replaceTemplateTextSequence(doc, "CAPRESE FLATBREAD", templateTableRowCells(pizzaItems[1]), { clearCount: 4, fontSize: 12, color: "000000", bold: false });
  });
  patch("ppt/slides/slide8.xml", (doc) => {
    replaceTemplateTextSequence(doc, "FRESH 5: MAPLE", templateFreshFiveLines(salad?.items?.[0]), { clearCount: 5, fontSize: 12, color: "000000" });
  });
  patch("ppt/slides/slide9.xml", (doc) => {
    replaceTemplateTextSequence(doc, "FRESH 5 : CHICKEN", templateFreshFiveLines(salad?.items?.[0]), { clearCount: 4, fontSize: 11, color: "000000" });
    replaceTemplateTextSequence(doc, "FRESH 5: GRILLED", templateFreshFiveLines(salad?.items?.[1]), { clearCount: 4, fontSize: 11, color: "000000" });
  });
  patch("ppt/slides/slide10.xml", (doc) => {
    setShapeLines(doc, "TextBox 9", templateFreshFiveLines(deli?.items?.[0]), { fontSize: 12, bold: true, align: "ctr" });
  });
  return entries;
}

async function downloadDopplerTemplatePowerPoint(packet) {
  const response = await fetch("/templates/Doppler%20Cafe%20All%20Menus.pptx");
  if (!response.ok) throw new Error("Could not load Doppler PowerPoint template.");
  const entries = await unzipPptxTemplate(await response.arrayBuffer());
  patchDopplerTemplateEntries(entries, packet);
  const files = Array.from(entries.entries()).map(([name, bytes]) => [name, bytes]);
  const blob = createZipBlob(files);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Doppler-template-menu-${String(packet.week || "week").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.pptx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dopplerPptxBlob(packet) {
  const contentSlides = (packet.sections || []).filter((section) => section.title !== "<Use 8.5x11 from Marketing>");
  const slides = [pptCoverSlide(packet), ...contentSlides.map(pptSectionSlide)];
  const files = [
    ["[Content_Types].xml", pptContentTypes(slides.length)],
    ["_rels/.rels", pptRootRels()],
    ["docProps/core.xml", pptCoreXml()],
    ["docProps/app.xml", pptAppXml(slides.length)],
    ["ppt/presentation.xml", pptPresentationXml(slides.length)],
    ["ppt/_rels/presentation.xml.rels", pptPresentationRels(slides.length)],
    ...slides.map((slide, index) => [`ppt/slides/slide${index + 1}.xml`, slide]),
  ];
  return createZipBlob(files);
}

function downloadDopplerMenuPowerPoint(packet) {
  const blob = dopplerPptxBlob(packet);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Doppler-menu-packet-${String(packet.week || "week").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.pptx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SubmittedRotationRecap({ cafe, week, rotation, previousRotation = EMPTY_ROTATION, rows, onEdit }) {
  const menuLabel = rotationMenuLabel(rotation, cafe, week);
  const reInventBlocks = cafe === "Re:Invent" ? reInventSummaryBlockLabels({ ...rotation, previousRotation }, week) : [];
  const totalSelections = rows.reduce((sum, row) => sum + row.selectedCount, 0);
  return (
    <section className="mt-5 rounded-[2rem] border-2 border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-black text-emerald-700">Submitted Menu Recap</p>
          <h3 className="mt-1 text-3xl font-black text-slate-950">{cafe}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">{week}</p>
          {reInventBlocks.length ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {reInventBlocks.map((block) => (
                <div key={block.id} className={`rounded-2xl border px-3 py-2 ${block.isPending ? "border-amber-200 bg-amber-50 text-amber-900" : "border-white bg-white text-slate-950"}`}>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">{block.title}</p>
                  <p className="mt-1 text-sm font-black leading-snug">{block.menu}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-lg font-black text-slate-950">{menuLabel || "No Global menu saved"}</p>
          )}
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


function PlannerControlsPanel({ cafe, copiedRotation, onCopy, onLoad, preview, setPreview, applyPreview, week, previousWeek, previousRotation, printRows, rotation, requirements, submitIssues = [], canSubmit, onSaveDraft, onSubmit }) {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showMenuPacket, setShowMenuPacket] = useState(false);
  const menuPacket = cafe === "Doppler" ? buildDopplerMenuPacket({ rotation, previousRotation, week, previousWeek }) : null;
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
  const generateMenu = async () => {
    if (!menuPacket) return;
    try {
      await downloadDopplerTemplatePowerPoint(menuPacket);
      setShowMenuPacket(true);
    } catch (error) {
      window.alert(error?.message || "Doppler PowerPoint generation failed.");
    }
  };

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
            <RemoteButton icon={FileText} label="Generate Menu" onClick={generateMenu} blocked={cafe !== "Doppler"} title={cafe === "Doppler" ? "Download a Doppler PowerPoint from the live template." : "Menu generation is being built first for Doppler."} tone="light" />
            <RemoteButton icon={Printer} label={showPrintPreview ? "Hide View" : "View/Print"} onClick={() => setShowPrintPreview((value) => !value)} tone="light" />
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
      {showMenuPacket && menuPacket && <DopplerMenuPacketModal packet={menuPacket} onClose={() => setShowMenuPacket(false)} />}

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

function openMenuPacketPrintWindow() {
  const printContent = document.getElementById("doppler-generated-menu-packet")?.innerHTML;
  if (!printContent) return;
  const printWindow = window.open("", "_blank", "width=980,height=760");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <title>Doppler Generated Menu Packet</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; background: #f8fafc; }
          .menu-page { page-break-inside: avoid; background: #fff; border: 1px solid #dbe3ea; border-radius: 18px; padding: 24px; margin-bottom: 18px; }
          .eyebrow { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; }
          .menu-title { font-size: 28px; font-weight: 900; margin: 8px 0; }
          .calories { display: inline-block; background: #fff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 6px 12px; font-weight: 800; color: #334155; }
          .summary { background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid #b99b55; border-radius: 14px; padding: 12px; color: #334155; font-weight: 700; }
          .entree { background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid #0f172a; border-radius: 14px; padding: 12px; margin-top: 8px; }
          .side { display: inline-block; border: 1px solid #e2e8f0; border-radius: 999px; padding: 6px 10px; margin: 4px; font-weight: 700; }
          @media print { body { background: #fff; margin: 12px; } button { display: none; } }
        </style>
      </head>
      <body>${printContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

function DopplerMenuPacketModal({ packet, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-4 print:hidden" role="dialog" aria-modal="true" aria-labelledby="doppler-menu-title">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Generated Menu Preview</p>
            <h3 id="doppler-menu-title" className="mt-1 text-3xl font-black text-slate-950">Doppler Menu Packet</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{packet.week}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => downloadDopplerTemplatePowerPoint(packet).catch((error) => window.alert(error?.message || "Doppler PowerPoint generation failed."))} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 hover:bg-emerald-100">Download PowerPoint</button>
            <button type="button" onClick={openMenuPacketPrintWindow} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Print Preview</button>
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"><X size={18} /> Close</button>
          </div>
        </div>
        <div id="doppler-generated-menu-packet" className="mt-5 space-y-4">
          {packet.sections.map((section, index) => <DopplerGeneratedMenuPage key={`${section.page}-${section.title}-${index}`} section={section} />)}
        </div>
      </div>
    </div>
  );
}

function DopplerGeneratedMenuPage({ section }) {
  const entrees = (section.items || []).filter((row) => selectionRole(row) === "entree");
  const sides = (section.items || []).filter((row) => selectionRole(row) === "side");
  const otherItems = (section.items || []).filter((row) => !["entree", "side"].includes(selectionRole(row)));
  const hasGlobalBlock = Boolean(section.block);
  return (
    <section className="menu-page rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="eyebrow text-xs font-black uppercase tracking-[0.18em] text-slate-500">Page {section.page}</p>
          <h4 className="menu-title mt-2 text-2xl font-black text-slate-950">{section.title}</h4>
          <p className="mt-2 text-sm font-bold text-slate-500">{section.subtitle}</p>
        </div>
        {section.calories && <span className="calories self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">{section.calories}</span>}
      </div>
      {section.summary && <div className="summary mt-4 rounded-2xl border border-slate-200 border-l-[5px] border-l-[#b99b55] bg-white p-4 text-sm font-bold text-slate-700">{section.summary}</div>}
      {section.note && <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-500">{section.note}</p>}
      {section.items?.length ? (
        <div className="mt-4 space-y-3">
          {entrees.map((item) => (
            <div key={`entree-${getItemIdentity(item)}`} className="entree rounded-2xl border border-slate-200 border-l-[5px] border-l-slate-950 bg-white p-4">
              <p className="text-lg font-black text-slate-950">{titleCase(getDisplayName(item) || getItemIdentity(item))}{dietSuffix(item)}</p>
              {getDescription(item) && <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{getDescription(item)}</p>}
            </div>
          ))}
          {sides.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Sides 2.55</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sides.map((item) => (
                  <span key={`side-${getItemIdentity(item)}`} className="side rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-black text-slate-800">
                    {titleCase(getDisplayName(item) || getItemIdentity(item))}{dietSuffix(item)}{getCalories(item) == null ? "" : ` - ${getCalories(item)} cal`}
                  </span>
                ))}
              </div>
            </div>
          )}
          {otherItems.map((item) => (
            <div key={`other-${getItemIdentity(item)}`} className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="font-black text-slate-900">{titleCase(getDisplayName(item) || getItemIdentity(item))}{dietSuffix(item)}</p>
              {getDescription(item) && <p className="mt-1 text-sm font-semibold text-slate-500">{getDescription(item)}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-900">Selection pending.</p>
      )}
    </section>
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
  const { stationKey, cafe, week, rotation, previousRotation, previousWeek, menuOptions, stationOptions, categorized, updateRotation, updateSlot, updateGrill, updateLto, updateCarvery, updateCustomStation, summary, selectedItems } = props;
  let content = null;
  if (stationKey === "global") content = <GlobalSection cafe={cafe} week={week} rotation={rotation} previousRotation={previousRotation} previousWeek={previousWeek} menuOptions={menuOptions} stationOptions={stationOptions} categorized={categorized} updateRotation={updateRotation} updateSlot={updateSlot} summary={summary} selectedItems={selectedItems} />;
  if (stationKey === "grill") content = <GrillSection cafe={cafe} rotation={rotation} updateGrill={updateGrill} />;
  if (stationKey === "salad") content = <SimpleLTOSection stationKey="salad" title={cafe === "Doppler" ? "Zane's Salad" : "Salad LTOs"} slots={Array.from({ length: stationSlots(cafe, "salad") }, (_, i) => cafe === "Doppler" ? `Fresh Five Salad ${i + 1}` : `Salad LTO ${i + 1}`)} values={rotation.ltos?.salad || EMPTY_ROTATION.ltos.salad} uploaded={rotation.uploadedLtos?.salad || []} updateLto={updateLto} complete={stationComplete(rotation, "salad")} poolOverride={cafe === "Doppler" ? stationPool("saladFreshFive") : null} />;
  if (stationKey === "pizza") content = <SimpleLTOSection stationKey="pizza" title={cafe === "Doppler" ? "Pizza LTOs" : "Pizza / Flatbread LTOs"} slots={cafe === "Doppler" ? ["Pizza LTO 1", "Pizza LTO 2"] : Array.from({ length: stationSlots(cafe, "pizza") }, (_, i) => `Pizza/Flatbread LTO ${i + 1}`)} values={rotation.ltos?.pizza || EMPTY_ROTATION.ltos.pizza} uploaded={rotation.uploadedLtos?.pizza || []} updateLto={updateLto} complete={stationComplete(rotation, "pizza")} slotPoolOverrides={cafe === "Doppler" ? [stationPool("pizza"), stationPool("pizza")] : null} optional={cafe === "Doppler"} />;
  if (stationKey === "deli") content = <SimpleLTOSection stationKey="deli" title={cafe === "Doppler" ? "Paninoteca Deli" : "Deli LTOs"} slots={Array.from({ length: stationSlots(cafe, "deli") }, (_, i) => cafe === "Doppler" ? "Fresh Five Deli Selection" : `Deli LTO ${i + 1}`)} values={rotation.ltos?.deli || EMPTY_ROTATION.ltos.deli} uploaded={rotation.uploadedLtos?.deli || []} updateLto={updateLto} complete={stationComplete(rotation, "deli")} poolOverride={cafe === "Doppler" ? stationPool("deliFreshFive") : null} />;
  if (stationKey === "fishMarket") content = <SimpleLTOSection stationKey="fishMarket" title="Fish Market LTO" slots={Array.from({ length: stationSlots(cafe, "fishMarket") }, (_, i) => `Fish Market LTO ${i + 1}`)} values={rotation.ltos?.fishMarket || EMPTY_ROTATION.ltos.fishMarket} uploaded={rotation.uploadedLtos?.fishMarket || []} updateLto={updateLto} complete={stationComplete(rotation, "fishMarket")} />;
  if (stationKey === "noodles") content = <SecondaryGlobalSection blockId="noodles" title="Noodle Station" eyebrow="Secondary Global" rotation={rotation} menuOptions={menuOptions} updateRotation={updateRotation} />;
  if (stationKey === "freshFive") content = <SimpleLTOSection stationKey="freshFive" title="Fresh $5" slots={Array.from({ length: stationSlots(cafe, "freshFive") }, (_, i) => `Fresh $5 Option ${i + 1}`)} values={rotation.ltos?.freshFive || EMPTY_ROTATION.ltos.freshFive} uploaded={rotation.uploadedLtos?.freshFive || []} updateLto={updateLto} complete={stationComplete(rotation, "freshFive")} />;
  if (stationKey === "grillFreshFive") content = <SimpleLTOSection stationKey="grillFreshFive" title="Grill Fresh $5" slots={["Grill Fresh $5"]} values={rotation.ltos?.grillFreshFive || EMPTY_ROTATION.ltos.grillFreshFive} uploaded={rotation.uploadedLtos?.grillFreshFive || []} updateLto={updateLto} complete={stationComplete(rotation, "grillFreshFive")} poolOverride={stationPool("grillFreshFive")} />;
  if (stationKey === "saladFreshFive") content = <SimpleLTOSection stationKey="saladFreshFive" title="Salad Fresh $5" slots={["Salad Fresh $5"]} values={rotation.ltos?.saladFreshFive || EMPTY_ROTATION.ltos.saladFreshFive} uploaded={rotation.uploadedLtos?.saladFreshFive || []} updateLto={updateLto} complete={stationComplete(rotation, "saladFreshFive")} poolOverride={stationPool("saladFreshFive")} />;
  if (stationKey === "soup") content = <SimpleLTOSection stationKey="soup" title="Soup LTOs" slots={Array.from({ length: stationSlots(cafe, "soup") }, (_, i) => `Soup ${i + 1}`)} values={rotation.ltos?.soup || EMPTY_ROTATION.ltos.soup} uploaded={rotation.uploadedLtos?.soup || []} updateLto={updateLto} complete={stationComplete(rotation, "soup")} />;
  if (stationKey === "wok") content = <WokSection rotation={rotation} updateLto={updateLto} />;
  if (stationKey === "carvery") content = <CarverySection rotation={rotation} updateCarvery={updateCarvery} />;
  if (stationKey === "streetBeets") content = <StreetBeetsSection rotation={rotation} updateCustomStation={updateCustomStation} />;
  if (stationKey === "commissaryEverest") content = <CommissaryEverestSection rotation={rotation} updateCustomStation={updateCustomStation} />;
  if (stationKey === "lotusWp") content = <LotusWpSection rotation={rotation} updateCustomStation={updateCustomStation} />;
  if (stationKey === "stationTakeover") content = <StationTakeoverSection rotation={rotation} updateCustomStation={updateCustomStation} />;
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
    <CollapsibleStation title={globalTitle} eyebrow="Global Rotation" complete={stationComplete(rotation, "global", cafe, week)} defaultOpen={!stationComplete(rotation, "global", cafe, week)}>
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
        <PickerGroup title="Entrees" limit="up to 3" items={menuCategorized.entrees} values={rotation.entrees || ["", "", ""]} onChange={(index, value) => updateSlot("entrees", index, value)} />
        <PickerGroup title="Sides" limit="up to 4" items={menuCategorized.sides} values={rotation.sides || ["", "", "", ""]} onChange={(index, value) => updateSlot("sides", index, value)} />
        <PickerGroup title="Sub Recipes" limit="up to 4" items={menuCategorized.subRecipes} values={rotation.subRecipes || ["", "", "", ""]} onChange={(index, value) => updateSlot("subRecipes", index, value)} />
        <PickerGroup title="Extensions" limit="up to 2" items={menuCategorized.extensions} values={rotation.extensions || ["", ""]} onChange={(index, value) => updateSlot("extensions", index, value)} />
      </div>
      <StationSelectedList title="Items Description" items={globalSelectedRows(rotation, { unique: true })} complete={stationComplete(rotation, "global", cafe, week)} />
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
      <StationSelectedList title="Items Description" items={globalSelectedRowsForCafe(rotation, cafe, { unique: true, week }, week)} complete={stationComplete(rotation, "global", cafe, week)} />
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

function CollapsibleStation({ title, eyebrow, complete, children }) {
  return (
    <div className={`mt-5 rounded-lg border-2 p-5 shadow-md ${complete ? "border-emerald-300 bg-emerald-50/20" : "border-slate-300 bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
          <h3 className="text-2xl font-bold mt-1">{title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold border ${complete ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>{complete ? "complete" : "needs selection"}</span>
      </div>
      <div className="mt-4">{children}</div>
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

function isValueFromItems(value = "", items = []) {
  const normalized = normalizeItemName(value);
  if (!normalized) return false;
  return items.some((row) => normalizeItemName(getItemIdentity(row)) === normalized);
}

function ItemPickerSlot({ value = "", items = [], onChange, selectClassName, inputClassName, placeholder = "Type item name" }) {
  const [writeInOpen, setWriteInOpen] = useState(false);
  const isKnownValue = isValueFromItems(value, items);
  const isWriteIn = writeInOpen || Boolean(value && !isKnownValue);

  if (isWriteIn) {
    return (
      <div className="space-y-2">
        <input
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={inputClassName}
          autoFocus={!value}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800">Write-in item</span>
          <button
            type="button"
            onClick={() => {
              setWriteInOpen(false);
              if (!isKnownValue) onChange("");
            }}
            className="text-xs font-black text-sky-700 hover:text-sky-950"
          >
            Use list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select value={value || ""} onChange={(event) => onChange(event.target.value)} className={selectClassName}>
        <option value="">&lt;Select Item&gt;</option>
        {items.map((row) => <option key={getItemIdentity(row)} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}
      </select>
      <button
        type="button"
        onClick={() => setWriteInOpen(true)}
        className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
      >
        Item not listed?
      </button>
    </div>
  );
}

function PickerGroup({ title, limit, items, values, onChange }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2"><p className="font-bold text-slate-900">{title}</p><span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">select</span></div>
      <p className="text-xs text-slate-500 mt-1 font-semibold">{limit}</p>
      <div className="mt-3 space-y-2">
        {values.map((value, index) => (
          <ItemPickerSlot
            key={index}
            value={value}
            items={items}
            onChange={(nextValue) => onChange(index, nextValue)}
            selectClassName="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            inputClassName="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        ))}
      </div>
    </div>
  );
}

function GrillSection({ cafe, rotation, updateGrill }) {
  const grillItems = stationPool("grillSpotlight");
  const grillTitle = cafe === "Doppler" ? "Salt + Char" : cafe === "Day 1" ? "Adelaide's" : "Core Grill Additions";
  const options = cafe === "Doppler" ? stationPool("grillFreshFive") : grillItems.length ? grillItems : stationPool("carveryProtein");
  const complete = stationComplete(rotation, "grill");
  const promoActive = Boolean(rotation.grill?.promoActive);
  return (
    <div className={`mt-6 rounded-3xl border-2 p-5 shadow-md ${complete ? "border-emerald-300 bg-emerald-50/20" : "border-slate-300 bg-slate-50"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Grill Station</p>
          <h3 className="text-2xl font-bold mt-1">{grillTitle}</h3>
        </div>
        {cafe !== "Doppler" && (
          <label className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-black transition ${promoActive ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm" : "border-slate-300 bg-white text-slate-700"}`}>
            <input type="checkbox" checked={promoActive} onChange={(event) => updateGrill("promoActive", event.target.checked)} />
            Activate Grill Promo
          </label>
        )}
      </div>
      {cafe === "Doppler" || cafe === "Bingo" ? (
        <div className="mt-4 grid grid-cols-1 gap-4">
          <GrillSelect label={cafe === "Doppler" ? "Grill Fresh Five" : "Location Spotlight"} value={rotation.grill?.regionalSpecial || ""} onChange={(value) => updateGrill("regionalSpecial", value)} items={options} />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <GrillSelect label="Location Spotlight 1" value={rotation.grill?.regionalSpecial || ""} onChange={(value) => updateGrill("regionalSpecial", value)} items={options} />
          <GrillSelect label="Location Spotlight 2" value={rotation.grill?.locationSpotlight || ""} onChange={(value) => updateGrill("locationSpotlight", value)} items={options} />
        </div>
      )}
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
  return (
    <div className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{label}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">select</span></div>
      <ItemPickerSlot
        value={value}
        items={items}
        onChange={onChange}
        selectClassName="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
        inputClassName="w-full rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

function SimpleLTOSection({ stationKey, title, slots, values = [], uploaded = [], updateLto, complete, poolOverride = null, slotPoolOverrides = null, optional = false }) {
  const pool = poolOverride || stationPool(stationKey);
  return (
    <CollapsibleStation title={title} eyebrow="Station Special" complete={complete}>
      {optional && <p className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-500">Optional for submission, included in generated menus when selected.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((slot, index) => {
          const slotPool = slotPoolOverrides?.[index] || pool;
          return (
            <div key={slot} className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{slot}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div>
              <ItemPickerSlot
                value={values[index] || uploaded[index] || ""}
                items={slotPool}
                onChange={(nextValue) => updateLto(stationKey, index, nextValue)}
                selectClassName="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                inputClassName="w-full rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          );
        })}
      </div>
      <StationSelectedList title="Items Description" items={ltoSelectedRows({ ltos: { [stationKey]: values }, uploadedLtos: { [stationKey]: uploaded } }, stationKey, { unique: true })} complete={complete} />
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
      <p className="text-sm text-slate-500 mb-4">Carvery dropdowns follow MenuWorks notes: charred vegetable options, hot side choices, and cold side choices.</p>
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

function TextSlotGrid({ title, slots, values = [], onChange, calories = [], onCalorieChange = null, placeholder = "Type item name" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="font-bold text-slate-900">{title}</p>
      <div className="mt-3 space-y-2">
        {slots.map((slot, index) => (
          <div key={`${title}-${slot}`} className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-2">
            <input
              value={values[index] || ""}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder={`${slot} - ${placeholder}`}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
            {onCalorieChange && (
              <input
                value={calories[index] || ""}
                onChange={(event) => onCalorieChange(index, event.target.value)}
                placeholder="cal"
                inputMode="numeric"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectSlotGrid({ title, slots, values = [], items, onChange, writeInPlaceholder = "Type if not listed" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="font-bold text-slate-900">{title}</p>
      <div className="mt-3 space-y-3">
        {slots.map((slot, index) => (
          <div key={`${title}-${slot}`} className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
            <label className="block text-xs font-bold text-slate-600 mb-2">{slot}</label>
            <ItemPickerSlot
              value={values[index] || ""}
              items={items}
              onChange={(nextValue) => onChange(index, nextValue)}
              placeholder={writeInPlaceholder}
              selectClassName="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              inputClassName="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StreetBeetsSection({ rotation, updateCustomStation }) {
  const custom = cloneCustomStations(rotation.customStations);
  const station = custom.streetBeets;
  const updateValues = (field, index, value) => {
    const next = [...station[field]];
    next[index] = value;
    updateCustomStation("streetBeets", { [field]: next });
  };
  const updateCalories = (field, index, value) => {
    const next = [...station.calories[field]];
    next[index] = value;
    updateCustomStation("streetBeets", { calories: { ...station.calories, [field]: next } });
  };
  const complete = stationComplete(rotation, "streetBeets");
  return (
    <CollapsibleStation title="Street Beets" eyebrow="Grace Write-In Station" complete={complete}>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <TextSlotGrid title="Entrees" slots={["Entree 1", "Entree 2"]} values={station.entrees} calories={station.calories.entrees} onChange={(index, value) => updateValues("entrees", index, value)} onCalorieChange={(index, value) => updateCalories("entrees", index, value)} />
        <TextSlotGrid title="Sides" slots={["Side 1", "Side 2", "Side 3"]} values={station.sides} calories={station.calories.sides} onChange={(index, value) => updateValues("sides", index, value)} onCalorieChange={(index, value) => updateCalories("sides", index, value)} />
        <TextSlotGrid title="Sub Recipes" slots={["Sub Recipe 1", "Sub Recipe 2"]} values={station.subRecipes} calories={station.calories.subRecipes} onChange={(index, value) => updateValues("subRecipes", index, value)} onCalorieChange={(index, value) => updateCalories("subRecipes", index, value)} />
        <TextSlotGrid title="Extensions" slots={["Extension 1"]} values={station.extensions} calories={station.calories.extensions} onChange={(index, value) => updateValues("extensions", index, value)} onCalorieChange={(index, value) => updateCalories("extensions", index, value)} />
      </div>
      <StationSelectedList title="Items Description" items={customStationSelectedRows(rotation, "streetBeets", { unique: true })} complete={complete} />
    </CollapsibleStation>
  );
}

function CommissaryEverestSection({ rotation, updateCustomStation }) {
  const custom = cloneCustomStations(rotation.customStations);
  const station = custom.commissaryEverest;
  const updateValues = (field, index, value) => {
    const next = [...station[field]];
    next[index] = value;
    updateCustomStation("commissaryEverest", { [field]: next });
  };
  const complete = stationComplete(rotation, "commissaryEverest");
  return (
    <CollapsibleStation title="Everest Commissary" eyebrow="Bingo Commissary Station" complete={complete}>
      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-sm font-bold text-slate-900 mb-2">Commissary Menu Name</label>
        <input value={station.menu || ""} onChange={(event) => updateCustomStation("commissaryEverest", { menu: event.target.value })} placeholder="Type menu name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <TextSlotGrid title="Entrees" slots={["Entree 1", "Entree 2"]} values={station.entrees} onChange={(index, value) => updateValues("entrees", index, value)} />
        <TextSlotGrid title="Hot Side" slots={["Optional Hot Side"]} values={station.hotSides} onChange={(index, value) => updateValues("hotSides", index, value)} />
        <TextSlotGrid title="Cold Sides" slots={["Cold Side 1", "Cold Side 2", "Cold Side 3", "Cold Side 4"]} values={station.coldSides} onChange={(index, value) => updateValues("coldSides", index, value)} />
        <TextSlotGrid title="Rice Dish" slots={["Rice Dish"]} values={station.riceDishes} onChange={(index, value) => updateValues("riceDishes", index, value)} />
      </div>
      <StationSelectedList title="Items Description" items={customStationSelectedRows(rotation, "commissaryEverest", { unique: true })} complete={complete} />
    </CollapsibleStation>
  );
}

function LotusWpSection({ rotation, updateCustomStation }) {
  const custom = cloneCustomStations(rotation.customStations);
  const station = custom.lotusWp;
  const updateValues = (field, index, value) => {
    const next = [...station[field]];
    next[index] = value;
    updateCustomStation("lotusWp", { [field]: next });
  };
  const complete = stationComplete(rotation, "lotusWp");
  return (
    <CollapsibleStation title="Lotus W&P" eyebrow="Blueshift Asian Global Rotation" complete={complete}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SelectSlotGrid title="Entrees" slots={["Entree 1", "Entree 2", "Entree 3", "Entree 4"]} values={station.entrees} items={stationPool("lotusEntrees")} onChange={(index, value) => updateValues("entrees", index, value)} />
        <SelectSlotGrid title="Sides" slots={["Side 1", "Side 2", "Side 3", "Side 4", "Side 5", "Side 6"]} values={station.sides} items={stationPool("lotusSides")} onChange={(index, value) => updateValues("sides", index, value)} />
      </div>
      <StationSelectedList title="Items Description" items={customStationSelectedRows(rotation, "lotusWp", { unique: true })} complete={complete} />
    </CollapsibleStation>
  );
}

function StationTakeoverSection({ rotation, updateCustomStation }) {
  const custom = cloneCustomStations(rotation.customStations);
  const station = custom.stationTakeover;
  const updateValues = (field, index, value) => {
    const next = [...station[field]];
    next[index] = value;
    updateCustomStation("stationTakeover", { [field]: next, active: station.active || Boolean(value) });
  };
  const complete = stationComplete(rotation, "stationTakeover");
  return (
    <CollapsibleStation title="Station Takeover" eyebrow="Eclipse Optional Override" complete={complete}>
      <div className="mb-5 rounded-lg border border-purple-200 bg-purple-50/80 p-4 shadow-sm">
        <label className="inline-flex items-center gap-3 text-sm font-bold text-purple-950">
          <input type="checkbox" checked={Boolean(station.active)} onChange={(event) => updateCustomStation("stationTakeover", { active: event.target.checked })} />
          Activate station takeover
        </label>
        {(station.active || station.menu) && (
          <input value={station.menu || ""} onChange={(event) => updateCustomStation("stationTakeover", { menu: event.target.value, active: true })} placeholder="Takeover menu name" className="mt-3 w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold outline-none shadow-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-100" />
        )}
      </div>
      {(station.active || station.menu || compactValues([...station.entrees, ...station.sides, ...station.subRecipes, ...station.extensions]).length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          <TextSlotGrid title="Entrees" slots={["Entree 1", "Entree 2"]} values={station.entrees} onChange={(index, value) => updateValues("entrees", index, value)} />
          <TextSlotGrid title="Sides" slots={["Side 1", "Side 2", "Side 3", "Side 4"]} values={station.sides} onChange={(index, value) => updateValues("sides", index, value)} />
          <TextSlotGrid title="Sub Recipes" slots={["Sub Recipe 1", "Sub Recipe 2", "Sub Recipe 3"]} values={station.subRecipes} onChange={(index, value) => updateValues("subRecipes", index, value)} />
          <TextSlotGrid title="Extensions" slots={["Extension 1", "Extension 2"]} values={station.extensions} onChange={(index, value) => updateValues("extensions", index, value)} />
        </div>
      )}
      <StationSelectedList title="Items Description" items={customStationSelectedRows(rotation, "stationTakeover", { unique: true })} complete={complete} />
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

function LeadershipOverview({ district, week, rows, conflictMenus, onOpenPlanner }) {
  return (
    <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
      <div className="flex items-start gap-3"><CalendarDays className="text-slate-400" /><div><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Leadership Overview</p><h2 className="text-2xl font-bold mt-1">District At Large</h2><p className="mt-1 text-sm font-semibold text-slate-500">{district || "Select district"} • {week}</p></div></div>
      <div className="mt-5 space-y-3">{rows.map((row) => <SummaryCard key={row.cafe} row={row} conflict={rowHasMenuConflict(row, conflictMenus)} onOpenPlanner={onOpenPlanner} />)}</div>
    </div>
  );
}

function ExecutiveView({ week, setWeek, rows, conflictMenus, onOpenPlanner }) {
  const locked = rows.filter(isSubmittedRotation).length;
  const declared = rows.filter(hasSubmittedRotationMenu).length;
  const conflicts = rows.filter((row) => rowHasMenuConflict(row, conflictMenus)).length;
  const globalRows = rows.filter(hasSubmittedRotationMenu);
  const globalSummaries = globalRows.map((row) => ({ ...row, summary: foodSummary(submittedSelectedItems(row)) }));
  const pricedGlobalSummaries = globalSummaries.filter((row) => row.summary.fc != null);
  const averageGlobalFc = pricedGlobalSummaries.length
    ? pricedGlobalSummaries.reduce((sum, row) => {
      const range = selectedFoodCostRange(submittedSelectedItems(row));
      const midpoint = range.low != null && range.high != null ? (range.low + range.high) / 2 : row.summary.fc;
      return sum + midpoint;
    }, 0) / pricedGlobalSummaries.length
    : null;

  const districtNames = Object.keys(DISTRICTS);
  const selectedCount = rows.reduce((sum, row) => sum + submittedSelectedItems(row).length, 0);
  const districtSignals = districtNames.map((districtName) => {
    const districtRows = rows.filter((row) => row.district === districtName);
    const districtLocked = districtRows.filter(isSubmittedRotation).length;
    const districtDeclared = districtRows.filter(hasSubmittedRotationMenu).length;
    const districtConflicts = districtRows.filter((row) => rowHasMenuConflict(row, conflictMenus)).length;
    const pricedRows = districtRows
      .map((row) => {
        const range = selectedFoodCostRange(submittedSelectedItems(row));
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
            const districtLocked = districtRows.filter(isSubmittedRotation).length;
            const districtSelected = districtRows.reduce((sum, row) => sum + submittedSelectedItems(row).length, 0);
            return (
              <div key={districtName} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{districtName}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{districtLocked}/{districtRows.length} locked - {districtSelected} selected items</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <p className="rounded-full bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">{districtRows.filter(hasSubmittedRotationMenu).length}/{districtRows.length} declared</p>
                    <p className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">≤30% favorable</p>
                    <p className="rounded-full bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">30–34% monitor</p>
                    <p className="rounded-full bg-amber-100 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800">&gt;34% watch</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {districtRows.map((row) => (
                    <SummaryCard key={`${row.district}-${row.cafe}`} row={row} conflict={rowHasMenuConflict(row, conflictMenus)} showDistrict={false} onOpenPlanner={onOpenPlanner} />
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
  const locked = rows.filter(isSubmittedRotation).length;
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
          const isLocked = isSubmittedRotation(row);
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
  const openRows = rows.filter((row) => !isSubmittedRotation(row));
  const missingMenuRows = rows.filter((row) => !hasSubmittedRotationMenu(row));
  const duplicateRows = rows.filter((row) => rowHasMenuConflict(row, conflictMenus));
  const highCostRows = rows.filter((row) => {
    const range = selectedFoodCostRange(submittedSelectedItems(row));
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

function SummaryCard({ row, conflict, showDistrict = true, onOpenPlanner = null }) {
  const locked = isSubmittedRotation(row);
  const rowItems = submittedSelectedItems(row);
  const summary = foodSummary(rowItems);
  const fcRange = selectedFoodCostRange(rowItems);
  const fcMidpoint = fcRange.low != null && fcRange.high != null ? (fcRange.low + fcRange.high) / 2 : summary.fc;
  const stationKeys = CAFE_STATION_CONFIG[row.cafe] || [];
  const completedStations = locked ? stationKeys.filter((stationKey) => stationComplete(row, stationKey, row.cafe, row.week)).length : 0;
  const progressPct = stationKeys.length ? Math.round((completedStations / stationKeys.length) * 100) : 0;
  const menuLabel = locked ? rotationMenuLabel(row) : "";
  const reInventBlocks = locked && row.cafe === "Re:Invent" ? reInventSummaryBlockLabels(row, row.week) : [];
  const tone = !menuLabel ? "border-slate-200 bg-white" : fcMidpoint == null ? "border-slate-300 bg-slate-50" : fcMidpoint > 0.34 ? "border-amber-300 bg-amber-50" : fcMidpoint <= 0.30 ? "border-emerald-300 bg-emerald-50" : "border-sky-200 bg-sky-50";
  const statusTone = locked ? "bg-emerald-500 text-white border-emerald-500" : "bg-rose-100 text-rose-900 border-rose-200";
  const CardShell = onOpenPlanner ? "button" : "div";

  return (
    <CardShell
      type={onOpenPlanner ? "button" : undefined}
      onClick={onOpenPlanner ? () => onOpenPlanner(row) : undefined}
      aria-label={onOpenPlanner ? `Open ${row.cafe} planner` : undefined}
      className={`w-full rounded-3xl border-2 p-4 text-left shadow-sm ${tone} ${onOpenPlanner ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-100" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {showDistrict && row.district && <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{row.district}</p>}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${locked ? "bg-emerald-500" : menuLabel ? "bg-amber-500" : "bg-rose-500"}`} />
            <p className="font-bold text-slate-900">{row.cafe}</p>
          </div>
          {row.copiedFrom ? <p className="text-xs text-slate-500 mt-1">Copied from {row.copiedFrom}</p> : row.cafe === "Nitro" ? <p className="text-xs text-slate-500 mt-1">Frontier follows Nitro</p> : null}
          {reInventBlocks.length ? (
            <div className="mt-2 space-y-1">
              {reInventBlocks.map((block) => (
                <p key={block.id} className={`rounded-2xl border px-3 py-2 text-sm font-black leading-snug ${block.isPending ? "border-amber-200 bg-amber-50 text-amber-900" : "border-white bg-white/80 text-slate-950"}`}>
                  <span className="text-xs uppercase tracking-[0.12em] text-slate-500">{block.title}</span>
                  <span className="block">{block.menu}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-base font-black text-slate-950 mt-1 leading-snug">{menuLabel || "No locked menu"}</p>
          )}
          {locked && row.updatedAt && <p className="text-xs text-slate-500 mt-1">Updated {row.updatedAt}</p>}
          {locked && row.submittedBy && <p className="text-xs text-slate-500 mt-1">By {row.submittedBy}</p>}
          {locked && row.station && <p className="text-xs text-slate-500 mt-1">{row.station}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone}`}>{locked ? "locked" : "open"}</span>
          {locked && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">{pctRange(fcRange)}</span>}
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
    </CardShell>
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
  const submittedRows = rows.filter(isSubmittedRotation);
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
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`rounded-full px-3 py-1 text-xs font-bold border ${isSubmittedRotation(row) ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-100 border-slate-200 text-slate-600"}`}>{row.status || "Draft"}</span></td>
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
