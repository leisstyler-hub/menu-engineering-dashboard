import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { ArrowLeft, AlertTriangle, Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Upload } from "lucide-react";

import MENUWORKS_ITEMS from "../../data/menuItems.json";
import { loadRecordsFromSmartsheet, syncRecordsToSmartsheet } from "../../integrations/smartsheet/client.js";
import { NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, SMARTSHEET_COLUMNS, SMARTSHEET_DATABASE_STORAGE_KEY, SMARTSHEET_RECORD_TYPES, SMARTSHEET_SELECTION_TYPES, STATION_SMARTSHEET_LABELS } from "../../integrations/smartsheet/contract.js";
import { APP_VERSION_STAMP } from "../../shared/appConfig.js";
import { money, pct, titleCase } from "../../shared/formatting.js";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";

const DISTRICTS = {
  South: ["Doppler", "Day 1", "Nitro", "Re:Invent"],
  North: ["Dawson", "Nessie", "Cricket", "Moby", "Commissary", "Atlas"],
  East: ["East Café 1", "East Café 2", "East Café 3"],
  LAX: ["LAX22", "LAX35", "LAX75", "LAX78", "SNA3"]
};

// CHECKPOINT: South District station configs intentionally include Fresh $5 as the final station for Doppler, Day 1, Nitro, and Re:Invent.
const CAFE_STATION_CONFIG = {
  Nitro: ["global", "carvery", "grill", "pizza", "salad"],
  Doppler: ["global", "salad", "grill", "pizza", "deli"],
  "Day 1": ["global", "grill", "salad", "fishMarket", "deli"],
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
  SNA3: ["global", "grill", "salad", "freshFive"]
};

const STATION_LABELS = {
  global: "Global Station",
  wok: "Wok Station",
  grill: "Grill Station",
  salad: "Salad LTOs",
  pizza: "Pizza / Flatbread LTOs",
  deli: "Deli LTOs",
  fishMarket: "Fish Market LTO",
  carvery: "Carvery Station",
  freshFive: "Fresh $5",
  soup: "Soup LTOs"
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
const isReInventFridayMondayWeek = (weekLabel = "") => weekIndexFromLabel(weekLabel) % 2 === 0;
const ROTATION_WEEKS = Array.from({ length: 160 }, (_, index) => makeWeekOption(addDays(ROTATION_CYCLE_START, index * 7)));
const DEFAULT_ROTATION_WEEK = makeWeekOption(getMonday(new Date()));

const ROLLING_HISTORY_WEEK_COUNT = 26;
const ROLLING_ROTATION_WEEKS = ROTATION_WEEKS.slice(0, ROLLING_HISTORY_WEEK_COUNT);

const EMPTY_ROTATION = {
  menu: "",
  station: "",
  entrees: ["", "", ""],
  sides: ["", "", "", ""],
  subRecipes: ["", "", "", ""],
  extensions: ["", ""],
  grill: { regionalSpecial: "", locationSpotlight: "" },
  ltos: {
    salad: ["", ""],
    pizza: ["", ""],
    deli: ["", ""],
    fishMarket: [""],
    freshFive: ["", "", "", "", ""],
    soup: ["", ""],
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
const selectedRowForName = (name) => findBestRowForName(name) || makeUploadedItem(name);

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

function selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey, selectionType, itemName, sortOrder, slotNumber }) {
  const row = selectedRowForName(itemName);
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
    [SMARTSHEET_COLUMNS.foodCostPct]: foodCost == null ? "" : Number((foodCost * 100).toFixed(1)),
    [SMARTSHEET_COLUMNS.enticingDescription]: getDescription(row),
    [SMARTSHEET_COLUMNS.dietTags]: getDiet(row),
    [SMARTSHEET_COLUMNS.allergens]: getAllergens(row),
  };
}

function buildDatabaseRecordsForRotation({ week, district, cafe, rotation }) {
  if (!week || !district || !cafe) return [];
  const parentId = rotationRecordParentId(week, district, cafe);
  const selected = selectedItems(rotation);
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
  const pushSelections = (stationKey, selectionType, values, offset = 0, sourceRotation = rotation, blockId = "") => {
    compactValues(values).forEach((itemName, index) => {
      const rec = selectionDatabaseRecord({ parentId, district, cafe, week, rotation: sourceRotation, stationKey, selectionType, itemName, sortOrder: offset + index + 1, slotNumber: index + 1 });
      if (blockId) {
        rec[SMARTSHEET_COLUMNS.globalBlockId] = makeDatabaseRecordId(parentId, "global", blockId);
        rec[SMARTSHEET_COLUMNS.menuBlockLabel] = blockId;
      }
      selectionRows.push(rec);
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

  if (cafe !== "Re:Invent") {
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.entree, rotation.entrees || [], 0);
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.side, rotation.sides || [], 100);
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.subRecipe, rotation.subRecipes || [], 200);
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.extension, rotation.extensions || [], 300);
  }
  pushSelections("grill", SMARTSHEET_SELECTION_TYPES.regionalSpecial, [rotation.grill?.regionalSpecial], 400);
  pushSelections("grill", SMARTSHEET_SELECTION_TYPES.locationSpotlight, [rotation.grill?.locationSpotlight], 410);
  ["salad", "pizza", "deli", "fishMarket", "freshFive", "soup"].forEach((stationKey, stationIndex) => {
    pushSelections(stationKey, SMARTSHEET_SELECTION_TYPES.lto, rotation.ltos?.[stationKey] || [], 500 + stationIndex * 100);
  });
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokEntree, rotation.ltos?.wokEntrees || [], 1000);
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokSide, rotation.ltos?.wokSides || [], 1100);
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokBase, rotation.ltos?.wokBase || [], 1200);
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokSubRecipe, rotation.ltos?.wokSubRecipes || [], 1300);
  Object.entries(rotation.carvery || {}).filter(([, value]) => value).forEach(([field, value], index) => {
    const type = field.includes("protein") ? SMARTSHEET_SELECTION_TYPES.carveryProtein : field.includes("vegetable") ? SMARTSHEET_SELECTION_TYPES.carveryVegetable : field.includes("starch") ? SMARTSHEET_SELECTION_TYPES.carveryStarch : field.includes("hot") ? SMARTSHEET_SELECTION_TYPES.carveryHotSide : SMARTSHEET_SELECTION_TYPES.carveryColdSide;
    selectionRows.push(selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey: "carvery", selectionType: type, itemName: value, sortOrder: 1400 + index, slotNumber: index + 1 }));
  });

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

  return [header, ...(globalBlock ? [globalBlock] : []), ...selectionRows, ...uploadRows];
}

function upsertDatabaseRecords(existingRecords = [], nextRecords = []) {
  const ids = new Set(nextRecords.map((record) => record[SMARTSHEET_COLUMNS.recordId]));
  return [...existingRecords.filter((record) => !ids.has(record[SMARTSHEET_COLUMNS.recordId])), ...nextRecords];
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
    submittedBy: String(record[SMARTSHEET_COLUMNS.submittedBy] || ""),
    submittedAt: String(record[SMARTSHEET_COLUMNS.submittedAt] || ""),
    updatedAt: String(record[SMARTSHEET_COLUMNS.updatedAt] || ""),
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
        uploadedLtos: {},
      };
    }
    return grouped[key];
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
      rotation.menu = record.menuConcept || rotation.menu || "";
      rotation.station = record.stationSubConcept || rotation.station || "";
      rotation.status = record.status || rotation.status || "Draft";
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

    if (!record.itemName) return;
    const index = Math.max(0, (record.slotNumber || 1) - 1);

    if (record.stationKey === "global") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) rotation.entrees[index] = record.itemName;
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) rotation.sides[index] = record.itemName;
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) rotation.subRecipes[index] = record.itemName;
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) rotation.extensions[index] = record.itemName;
      return;
    }

    if (record.stationKey === "grill") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.regionalSpecial) rotation.grill.regionalSpecial = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.locationSpotlight) rotation.grill.locationSpotlight = record.itemName;
      return;
    }

    if (record.stationKey === "wok") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokEntree) rotation.ltos.wokEntrees[index] = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokSide) rotation.ltos.wokSides[index] = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokBase) rotation.ltos.wokBase[index] = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokSubRecipe) rotation.ltos.wokSubRecipes[index] = record.itemName;
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

    if (rotation.ltos[record.stationKey]) {
      rotation.ltos[record.stationKey][index] = record.itemName;
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
const getCategory = (row) => String(row.category || row.itemType || row["Item Type"] || row.classification || "").toLowerCase();
const getDescription = (row) =>
  row.enticingDescription ||
  row.description ||
  row["Enticing Description"] ||
  row.ingredientsCommonName ||
  row.ingredients ||
  row.menuItemNotes ||
  "";
const isEnhancedMenuWorksRow = (row) => String(row.dataSource || "").includes("enhanced");
const getAllergens = (row) => {
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
  if (row.allergenDetails && typeof row.allergenDetails === "object") {
    return Object.entries(row.allergenDetails)
      .filter(([, value]) => /^(yes|contains|at risk)$/i.test(String(value || "").trim()))
      .map(([allergen, value]) => String(value).toLowerCase() === "at risk" ? `${allergen} (At Risk)` : allergen)
      .join(", ");
  }
  return "";
};
const isAllergenDataMissing = (row) => !getAllergens(row) && !isEnhancedMenuWorksRow(row);
const isSourceDetailMissing = (row) => !getDescription(row) || isAllergenDataMissing(row);
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

function stationPool(stationKey) {
  const all = uniqueRows(MENUWORKS_ITEMS);
  const byMenu = (needle) => all.filter((row) => getMenuName(row).toLowerCase().includes(needle));
  const byStation = (needle) => all.filter((row) => getStationName(row).toLowerCase().includes(needle));
  const byText = (regex) => all.filter((row) => regex.test(textForRow(row)));

  const pools = {
    salad: uniqueRows([...byMenu("salad"), ...byStation("salad"), ...byText(/salad|greens|slaw/)]),
    pizza: uniqueRows([...byMenu("pizza"), ...byStation("pizza"), ...byText(/pizza|flatbread/)]),
    deli: uniqueRows([...byMenu("deli"), ...byStation("deli"), ...byStation("sandwich"), ...byText(/sandwich|deli|wrap|naanwich|banh mi/)]),
    fishMarket: uniqueRows([...byMenu("fish"), ...byStation("fish"), ...byText(/fish|salmon|tuna|cod|shrimp|crab|seafood/)]),
    freshFive: uniqueRows([...byMenu("fresh five"), ...byMenu("fresh $5"), ...byStation("fresh"), ...byText(/fresh five|fresh \$5|fresh 5/)]),
    soup: uniqueRows([...byMenu("soup"), ...byStation("soup"), ...byText(/soup|chili|bisque|chowder/)]),
    wokEntrees: uniqueRows([...byMenu("wok"), ...byStation("wok"), ...byText(/wok|stir fry|stir-fry|orange peel|sweet and sour|huli huli/)]).filter((row) => isEntree(row)),
    wokSides: uniqueRows([...byMenu("wok"), ...byStation("wok"), ...byText(/lo mein|fried rice|green beans|carrots|gai lan|slaw/)]).filter((row) => isSide(row)),
    wokBase: uniqueRows([...byMenu("wok"), ...byStation("wok"), ...byText(/rice|noodle|lo mein|base/)]).filter((row) => isSide(row) || /rice|noodle|base/i.test(getItemIdentity(row))),
    wokSubRecipes: all.filter((row) => isSubRecipe(row)),
    carveryProtein: uniqueRows([...byMenu("carvery"), ...byStation("carvery"), ...byText(/beef|chicken|pork|turkey|salmon|tofu|protein/)]).filter((row) => isEntree(row)),
    carveryVegetable: byText(/broccoli|carrot|green bean|beans|vegetable|veg|cauliflower|brussels|squash|zucchini|asparagus/),
    carverySide: all.filter((row) => isSide(row))
  };

  const pool = pools[stationKey] || [];
  if (pool.length) return pool;

  if (["freshFive", "salad", "pizza", "deli", "fishMarket", "soup"].includes(stationKey)) {
    return all.filter((row) => isEntree(row) || isSide(row));
  }

  return all;
}

function stationSlots(cafe, stationKey) {
  const override = {
    Dawson: { freshFive: 5 },
    Nessie: { freshFive: 5 },
    Cricket: { freshFive: 5 },
    Moby: { deli: 4, salad: 4, freshFive: 2 },
    Commissary: { deli: 4, salad: 3, freshFive: 2, soup: 2 },
    Atlas: { freshFive: 2 },
    Frontier: { freshFive: 2 }
  }[cafe]?.[stationKey];

  if (override) return override;
  if (stationKey === "fishMarket") return 1;
  if (["salad", "pizza", "deli", "soup"].includes(stationKey)) return 2;
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

function blockComplete(block) {
  return Boolean(block?.menu && (block?.entrees || []).filter(Boolean).length >= 2);
}

function getRotationGlobalBlock(rotation, blockId) {
  return rotation.globalBlocks?.[blockId] || blankGlobalBlock();
}

function potatoSides() {
  return uniqueRows(MENUWORKS_ITEMS.filter((row) => {
    const name = String(getItemIdentity(row)).toLowerCase();
    return isSide(row) && /potato|potatoes|fries|tots|hash brown|mashed|fingerling|yukon|russet|sweet potato/.test(name);
  }));
}

function carverySideTemperature(row) {
  const text = textForRow(row);
  if (/salad|slaw|coleslaw|cold|chilled|pickle|pickled|crudite|fruit|pasta salad|potato salad|cucumber|tomato salad/.test(text)) return "cold";
  if (/roasted|grilled|sauteed|sautéed|steamed|braised|mashed|fried|fries|tots|hash brown|rice|beans|mac|gratin|warm|hot|baked|vegetable|broccoli|carrot|green bean|cauliflower|brussels|squash|zucchini|asparagus|corn/.test(text)) return "hot";
  return "unknown";
}

function carveryHotSides() {
  const sides = stationPool("carverySide").filter((row) => carverySideTemperature(row) !== "cold");
  return sides.length ? uniqueRows(sides) : stationPool("carverySide");
}

function carveryColdSides() {
  const sides = stationPool("carverySide").filter((row) => carverySideTemperature(row) !== "hot");
  return sides.length ? uniqueRows(sides) : stationPool("carverySide");
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
    grill: { regionalSpecial: "", locationSpotlight: "" },
    ltos: Object.fromEntries(Object.entries(EMPTY_ROTATION.ltos).map(([key, values]) => [key, [...values]])),
    carvery: { ...EMPTY_ROTATION.carvery },
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
  if (stationKey === "global") return Boolean(rotation.menu && (rotation.entrees || []).filter(Boolean).length >= 2);
  if (stationKey === "grill") return Boolean(rotation.grill?.regionalSpecial || rotation.grill?.locationSpotlight);
  if (["salad", "pizza", "deli", "fishMarket", "freshFive", "soup"].includes(stationKey)) {
    return Boolean((rotation.ltos?.[stationKey] || []).some(Boolean) || (rotation.uploadedLtos?.[stationKey] || []).some(Boolean));
  }
  if (stationKey === "wok") return Boolean((rotation.ltos?.wokEntrees || []).some(Boolean));
  if (stationKey === "carvery") return Boolean(Object.values(rotation.carvery || {}).some(Boolean));
  return false;
}

function rotationRequirements(rotation, cafe, week = "") {
  const stationKeys = CAFE_STATION_CONFIG[cafe] || ["global"];
  const globalReady = stationComplete(rotation, "global", cafe, week);
  const incompleteStations = stationKeys.filter((stationKey) => stationKey !== "global" && !stationComplete(rotation, stationKey, cafe, week));
  return {
    globalReady,
    incompleteStations,
    canSubmit: globalReady && incompleteStations.length === 0
  };
}

function leadershipRead(rows, conflictMenus) {
  const declared = rows.filter((row) => row.menu).length;
  const missing = rows.filter((row) => !row.menu).map((row) => row.cafe);
  const conflicts = rows.filter((row) => row.menu && conflictMenus[`${row.district}|${row.menu}`] > 1);
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
    row.mrn || row.MRN ? 5 : 0,
    row.portion || row.Portion ? 5 : 0
  ].reduce((sum, value) => sum + value, 0);
}

function findBestRowForName(name) {
  const normalizedName = normalizeItemName(name);
  if (!normalizedName) return null;
  const matches = MENUWORKS_ITEMS.filter((row) => getItemAliases(row).includes(normalizedName));
  if (!matches.length) return null;
  return [...matches].sort((a, b) => itemDetailScore(b) - itemDetailScore(a))[0];
}

function rowsForSelectedNames(names = [], { unique = false } = {}) {
  const selectedRows = [];
  const seen = new Set();
  names.filter(Boolean).forEach((name) => {
    const key = normalizeItemName(name);
    if (!key) return;
    if (unique && seen.has(key)) return;
    seen.add(key);
    selectedRows.push(findBestRowForName(name) || makeUploadedItem(name));
  });
  return selectedRows;
}

function globalSelectedRows(rotation, options) {
  const baseNames = [...(rotation.entrees || []), ...(rotation.sides || []), ...(rotation.subRecipes || []), ...(rotation.extensions || [])];
  const blockNames = Object.values(rotation.globalBlocks || {}).flatMap((block) => [
    ...(block.entrees || []), ...(block.sides || []), ...(block.subRecipes || []), ...(block.extensions || [])
  ]);
  return rowsForSelectedNames([...baseNames, ...blockNames], options);
}

function grillSelectedRows(rotation, options) {
  return rowsForSelectedNames([rotation.grill?.regionalSpecial, rotation.grill?.locationSpotlight], options);
}

function ltoSelectedRows(rotation, stationKey, options) {
  return rowsForSelectedNames([...(rotation.ltos?.[stationKey] || []), ...(rotation.uploadedLtos?.[stationKey] || [])], options);
}

function wokSelectedRows(rotation, options) {
  return rowsForSelectedNames([...(rotation.ltos?.wokEntrees || []), ...(rotation.ltos?.wokSides || []), ...(rotation.ltos?.wokBase || []), ...(rotation.ltos?.wokSubRecipes || [])], options);
}

function carverySelectedRows(rotation, options) {
  return rowsForSelectedNames(Object.values(rotation.carvery || {}), options);
}

function selectedItems(rotation) {
  return [
    ...globalSelectedRows(rotation),
    ...grillSelectedRows(rotation),
    ...rowsForSelectedNames(Object.values(rotation.ltos || {}).flat()),
    ...carverySelectedRows(rotation)
  ];
}

function foodSummary(items) {
  const priced = items.filter((row) => getPrice(row) != null && getTrueCost(row) != null && Number(getPrice(row)) > 0);
  const sell = priced.reduce((sum, row) => sum + Number(getPrice(row) || 0), 0);
  const cost = priced.reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);
  return { priced: priced.length, sell, cost, fc: sell ? cost / sell : null };
}

function selectedTrueCostRange(items) {
  const costedItems = items.filter((row) => getTrueCost(row) != null);
  const entrees = costedItems.filter((row) => isEntree(row)).map((row) => Number(getTrueCost(row) || 0)).sort((a, b) => a - b);
  const sides = costedItems.filter((row) => isSide(row)).map((row) => Number(getTrueCost(row) || 0)).sort((a, b) => a - b);
  const subRecipeCost = costedItems.filter((row) => isSubRecipe(row)).reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);

  if (!entrees.length) {
    return { low: subRecipeCost > 0 ? subRecipeCost : null, high: subRecipeCost > 0 ? subRecipeCost : null, subRecipeCost, partial: subRecipeCost > 0 };
  }

  const lowestEntree = entrees[0];
  const highestEntree = entrees[entrees.length - 1];
  const lowestTwoSides = sides.slice(0, 2).reduce((sum, value) => sum + value, 0);
  const highestTwoSides = sides.slice(-2).reduce((sum, value) => sum + value, 0);

  return {
    low: lowestEntree + lowestTwoSides + subRecipeCost,
    high: highestEntree + highestTwoSides + subRecipeCost,
    subRecipeCost,
    partial: sides.length < 2
  };
}

function moneyRange(range) {
  if (!range || range.low == null || range.high == null) return "—";
  if (Math.abs(range.low - range.high) < 0.005) return money(range.low);
  return `${money(range.low)} – ${money(range.high)}`;
}

function trueCostRangeNote(range) {
  if (!range || range.low == null) return "select items to calculate";
  if (range.partial) return "partial range; add entrée/sides to complete";
  return "1 entrée + 2 sides + sub recipes";
}

function selectedFoodCostRange(items) {
  const costedItems = items.filter((row) => getTrueCost(row) != null);
  const pricedItems = items.filter((row) => getPrice(row) != null && getTrueCost(row) != null && Number(getPrice(row)) > 0);

  const entreeRows = pricedItems.filter((row) => isEntree(row)).map((row) => ({ cost: Number(getTrueCost(row) || 0), price: Number(getPrice(row) || 0) })).sort((a, b) => a.cost - b.cost);
  const sideRows = pricedItems.filter((row) => isSide(row)).map((row) => ({ cost: Number(getTrueCost(row) || 0), price: Number(getPrice(row) || 0) })).sort((a, b) => a.cost - b.cost);
  const subRecipeCost = costedItems.filter((row) => isSubRecipe(row)).reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);

  if (!entreeRows.length) return { low: null, high: null, partial: true, subRecipeCost };

  const lowestEntree = entreeRows[0];
  const highestEntree = entreeRows[entreeRows.length - 1];
  const lowestTwoSides = sideRows.slice(0, 2);
  const highestTwoSides = sideRows.slice(-2);

  const lowCost = lowestEntree.cost + lowestTwoSides.reduce((sum, row) => sum + row.cost, 0) + subRecipeCost;
  const highCost = highestEntree.cost + highestTwoSides.reduce((sum, row) => sum + row.cost, 0) + subRecipeCost;
  const lowSell = lowestEntree.price + lowestTwoSides.reduce((sum, row) => sum + row.price, 0);
  const highSell = highestEntree.price + highestTwoSides.reduce((sum, row) => sum + row.price, 0);

  return {
    low: lowSell > 0 ? lowCost / lowSell : null,
    high: highSell > 0 ? highCost / highSell : null,
    partial: sideRows.length < 2,
    subRecipeCost
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
  if (range.partial) return "partial range; add sides to complete";
  return "plate range with sub recipes included";
}

function getStationCostOverview(rotation, cafe) {
  const uploaded = rotation.uploadedLtos || {};
  const stationRows = [];
  const cafeStations = CAFE_STATION_CONFIG[cafe] || ["global"];

  if (cafeStations.includes("global")) {
    const globalItems = globalSelectedRows(rotation);
    stationRows.push({ key: "global", label: stationLabel(cafe, "global"), items: globalItems, note: rotation.menu ? rotation.menu : "not selected" });
  }

  if (cafeStations.includes("grill")) {
    const grillItems = grillSelectedRows(rotation);
    stationRows.push({ key: "grill", label: stationLabel(cafe, "grill"), items: grillItems, note: "regional + location spotlight" });
  }

  ["salad", "pizza", "deli", "fishMarket", "freshFive", "soup"].forEach((key) => {
    if (cafeStations.includes(key)) {
      const selected = ltoSelectedRows(rotation, key);
      const uploadedItems = (uploaded[key] || []).filter(Boolean).map(makeUploadedItem);
      stationRows.push({ key, label: STATION_LABELS[key], items: selected.length ? selected : uploadedItems, note: selected.length ? "selected" : uploadedItems.length ? "from upload preview" : "not selected" });
    }
  });

  if (cafeStations.includes("wok")) stationRows.push({ key: "wok", label: "Wok Station", items: wokSelectedRows(rotation), note: "wok selections" });
  if (cafeStations.includes("carvery")) stationRows.push({ key: "carvery", label: "Carvery Station", items: carverySelectedRows(rotation), note: "carvery selections" });

  return stationRows.map((row) => {
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

export default function NeighborhoodRotations({ onBackToPlatform }) {
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

  useEffect(() => { localStorage.setItem(NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, JSON.stringify(rotations)); }, [rotations]);
  useEffect(() => { localStorage.setItem(SMARTSHEET_DATABASE_STORAGE_KEY, JSON.stringify(databaseRecords)); }, [databaseRecords]);

  const refreshFromSmartsheet = async () => {
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
    }
  };

  useEffect(() => { refreshFromSmartsheet(); }, []);

  const cafes = DISTRICTS[district] || [];
  useEffect(() => { if (district && selectedCafe && !cafes.includes(selectedCafe)) setSelectedCafe(""); }, [district, cafes, selectedCafe]);

  const currentRotation = selectedCafe ? (rotations[rotationKey(week, district, selectedCafe)] || EMPTY_ROTATION) : EMPTY_ROTATION;
  const menus = useMemo(() => Array.from(new Set(MENUWORKS_ITEMS.map((row) => getMenuName(row)).filter(Boolean))).sort(), []);
  const updateRotation = (patch) => setRotations((prev) => ({
    ...prev,
    [rotationKey(week, district, selectedCafe)]: { ...(prev[rotationKey(week, district, selectedCafe)] || EMPTY_ROTATION), ...patch }
  }));

  const districtWeekRows = cafes.map((cafe) => ({ district, cafe, ...(rotations[rotationKey(week, district, cafe)] || EMPTY_ROTATION) }));
  const leadershipRows = district === "South" ? districtWeekRows.flatMap((row) => row.cafe === "Nitro" ? [row, { ...row, cafe: "Frontier", copiedFrom: "Nitro" }] : [row]) : districtWeekRows;
  const conflictMenus = districtWeekRows.reduce((acc, row) => { if (row.menu) acc[row.menu] = (acc[row.menu] || 0) + 1; return acc; }, {});
  const allRows = Object.entries(DISTRICTS).flatMap(([dist, cafeList]) => cafeList.map((cafe) => ({ district: dist, cafe, ...(rotations[rotationKey(week, dist, cafe)] || EMPTY_ROTATION) })));
  const allConflictMenus = allRows.reduce((acc, row) => { if (row.menu) acc[`${row.district}|${row.menu}`] = (acc[`${row.district}|${row.menu}`] || 0) + 1; return acc; }, {});
  const resultRows = ROLLING_ROTATION_WEEKS.flatMap((wk) => Object.entries(DISTRICTS).flatMap(([dist, cafeList]) => cafeList.map((cafe) => ({ week: wk, district: dist, cafe, ...(rotations[rotationKey(wk, dist, cafe)] || EMPTY_ROTATION) })))).filter((row) => row.menu);
  const filteredResults = resultRows.filter((row) => (resultsDistrict === "All" || row.district === resultsDistrict) && (resultsCafe === "All" || row.cafe === resultsCafe)).reverse();
  const persistRotationToDatabase = async (nextRotation) => {
    if (!week || !district || !selectedCafe) return;
    const nextRecords = buildDatabaseRecordsForRotation({ week, district, cafe: selectedCafe, rotation: nextRotation });
    setDatabaseRecords((prev) => upsertDatabaseRecords(prev, nextRecords));
    setDatabaseSyncStatus({ state: "syncing", message: `Syncing ${nextRecords.length} row${nextRecords.length === 1 ? "" : "s"} to Smartsheet...`, syncedAt: "" });
    try {
      const result = await syncRecordsToSmartsheet(nextRecords, { week, district, cafe: selectedCafe, status: nextRotation.status || "Draft" });
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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <NeighborhoodHeader onBackToPlatform={onBackToPlatform} district={district} />
        <section className="flex flex-wrap gap-3">
          <RotationTab label="Chef Planner" value="planner" active={rotationView} setActive={setRotationView} />
          <RotationTab label="Executive View" value="executive" active={rotationView} setActive={setRotationView} />
          <RotationTab label="Results" value="results" active={rotationView} setActive={setRotationView} />
        </section>
        {rotationView === "planner" && (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <ControlCard label="District" value={district} setValue={setDistrict} options={Object.keys(DISTRICTS)} placeholder="Select district..." />
              <ControlCard label="Week" value={week} setValue={setWeek} options={ROTATION_WEEKS} />
              <ControlCard label="Café" value={selectedCafe} setValue={setSelectedCafe} options={cafes} placeholder="Select café/unit..." disabled={!district} />
              <StatusCard ready={Boolean(district && selectedCafe)} conflicts={Object.values(conflictMenus).filter((count) => count > 1).length} completed={districtWeekRows.filter((row) => row.menu).length} total={cafes.length} />
            </section>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {district && selectedCafe ? <RotationPlannerCard cafe={selectedCafe} district={district} menuOptions={menus} rotation={currentRotation} updateRotation={updateRotation} week={week} printRows={allRows} persistRotationToDatabase={persistRotationToDatabase} databaseLoadStatus={databaseLoadStatus} databaseSyncStatus={databaseSyncStatus} onRefreshDatabase={refreshFromSmartsheet} /> : <SelectPlannerPrompt />}
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

function NeighborhoodHeader({ onBackToPlatform, district }) {
  return (
    <header className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
      <button onClick={onBackToPlatform} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Back to platform</button>
      <div className="mt-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Still in Development</p>
          <h1 className="text-4xl font-bold mt-2">Neighborhood Rotations</h1>
          <p className="text-slate-600 mt-3 max-w-3xl">Chefs declare weekly Global Menu rotations and station LTOs by café.</p>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-2">
          <VersionStamp compact />
          {district === "South" && <div className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-slate-600">Frontier follows Nitro for tracking.</div>}
        </div>
      </div>
    </header>
  );
}

function RotationTab({ label, value, active, setActive }) {
  return <button onClick={() => setActive(value)} className={`rounded-2xl px-5 py-3 font-semibold border ${active === value ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-700"}`}>{label}</button>;
}

function ControlCard({ label, value, setValue, options, placeholder, disabled = false }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
      <label className="block text-sm font-semibold text-slate-500 mb-2">{label}</label>
      <select disabled={disabled} value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function StatusCard({ ready, conflicts, completed, total }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
      <p className="text-sm font-semibold text-slate-500">Week Status</p>
      {!ready ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Select a district and café/unit to view status.</div>
      ) : (
        <>
          <div className="mt-3 flex items-end gap-3"><p className="text-3xl font-bold">{completed}/{total}</p><p className="text-sm text-slate-500 mb-1">cafés declared</p></div>
          <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${conflicts ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{conflicts ? `${conflicts} conflict group` : "No conflicts"}</p>
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


function CompactSystemStatusPanel({ district, cafe, week, rotation, loadStatus, syncStatus, onRefreshDatabase }) {
  const records = buildDatabaseRecordsForRotation({ week, district, cafe, rotation });
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
          <button type="button" onClick={onRefreshDatabase} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100">Refresh from Smartsheet</button>
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

function SmartsheetDatabaseStatusPanel({ loadStatus, syncStatus, onRefreshDatabase }) {
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
        <button type="button" onClick={onRefreshDatabase} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Refresh from Smartsheet
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

function RotationPlannerCard({ cafe, district, menuOptions, rotation, updateRotation, week, printRows, persistRotationToDatabase, databaseLoadStatus, databaseSyncStatus, onRefreshDatabase }) {
  const [preview, setPreview] = useState(null);
  const [copiedRotation, setCopiedRotation] = useState(null);

  const stationOptions = Array.from(new Set(MENUWORKS_ITEMS.filter((row) => getMenuName(row) === rotation.menu).map((row) => getStationName(row) || "—"))).sort();
  const menuItems = MENUWORKS_ITEMS.filter((row) => getMenuName(row) === rotation.menu && (!rotation.station || getStationName(row) === rotation.station));
  const categorized = categorize(menuItems);
  const items = selectedItems(rotation);
  const summary = foodSummary(items);
  const cafeStations = CAFE_STATION_CONFIG[cafe] || ["global"];
  const stationCostOverview = getStationCostOverview(rotation, cafe);
  const requirements = rotationRequirements(rotation, cafe, week);
  const canSubmitRotation = requirements.canSubmit;

  const updateSlot = (group, index, value) => {
    const next = [...(rotation[group] || EMPTY_ROTATION[group])];
    next[index] = value;
    updateRotation({ [group]: next });
  };

  const updateGrill = (field, value) => updateRotation({ grill: { ...(rotation.grill || EMPTY_ROTATION.grill), [field]: value } });
  const updateLto = (stationKey, index, value) => {
    const current = rotation.ltos?.[stationKey] || EMPTY_ROTATION.ltos[stationKey] || [];
    const next = [...current];
    next[index] = value;
    updateRotation({ ltos: { ...(rotation.ltos || EMPTY_ROTATION.ltos), [stationKey]: next } });
  };
  const updateCarvery = (field, value) => updateRotation({ carvery: { ...(rotation.carvery || EMPTY_ROTATION.carvery), [field]: value } });
  const markDraft = () => {
    const nextRotation = { ...rotation, status: "Draft", updatedAt: nowStamp(), submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
  };
  const submitRotation = () => {
    if (!canSubmitRotation) return;
    const stamp = nowStamp();
    const nextRotation = { ...rotation, status: "Submitted", updatedAt: stamp, submittedAt: stamp, submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
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
    if (!preview) return;
    const nextRotation = { ...rotation, ...preview.global, uploadedLtos: preview.uploadedLtos, updatedAt: nowStamp(), submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
    setPreview(null);
  };

  return (
    <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Chef Planner</p>
          <h2 className="text-3xl font-bold mt-1">{cafe}</h2>
          {cafe === "Nitro" && <p className="text-sm text-slate-500 mt-1">Frontier follows Nitro for tracking.</p>}
        </div>
        <Building2 className="text-slate-300" size={32} />
      </div>

      <StationPills cafe={cafe} stations={cafeStations} />
      <SubmitBar rotation={rotation} cafe={cafe} requirements={requirements} canSubmit={canSubmitRotation} onSaveDraft={markDraft} onSubmit={submitRotation} />
      <PlannerControlsPanel cafe={cafe} copiedRotation={copiedRotation} onCopy={copyCurrentRotation} onLoad={loadCopiedRotation} preview={preview} setPreview={setPreview} applyPreview={applyPreview} week={week} printRows={printRows} />
      <CompactSystemStatusPanel district={district} cafe={cafe} week={week} rotation={rotation} loadStatus={databaseLoadStatus} syncStatus={databaseSyncStatus} onRefreshDatabase={onRefreshDatabase} />
      <StationCostOverview rows={stationCostOverview} />

      {cafeStations.map((stationKey) => (
        <CafeStationSection
          key={stationKey}
          stationKey={stationKey}
          cafe={cafe}
          week={week}
          rotation={rotation}
          menuOptions={menuOptions}
          stationOptions={stationOptions}
          categorized={categorized}
          updateRotation={updateRotation}
          updateSlot={updateSlot}
          updateGrill={updateGrill}
          updateLto={updateLto}
          updateCarvery={updateCarvery}
          summary={summary}
          selectedItems={items}
        />
      ))}
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


function PlannerControlsPanel({ cafe, copiedRotation, onCopy, onLoad, preview, setPreview, applyPreview, week, printRows }) {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const copiedSummary = copiedRotation?.menu
    ? `${copiedRotation.menu}${copiedRotation.station ? ` • ${copiedRotation.station}` : ""}`
    : "No copied rotation saved";

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(weekAtGlancePreview(file.name));
    event.target.value = "";
  };

  return (
    <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50/80 p-5 shadow-sm print:hidden">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-700 font-bold">Planner Controls</p>
          <h3 className="text-2xl font-bold mt-1">Copy, Upload, and Print</h3>
          <p className="text-sm text-slate-600 mt-1">Use these controls to reuse rotations, import Week at a Glance, or print a clean weekly packet.</p>
          <p className="text-xs text-slate-500 mt-2">Saved copy: {copiedSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onCopy} className="rounded-2xl bg-white border border-sky-200 px-5 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-100">Copy Current Rotation</button>
          <button onClick={onLoad} disabled={!copiedRotation} className={`rounded-2xl border px-5 py-3 text-sm font-semibold ${copiedRotation ? "bg-white border-sky-200 text-sky-800 hover:bg-sky-100" : "bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed"}`}>Load Copied Rotation</button>
          <label className="inline-flex items-center gap-2 rounded-2xl bg-white border border-sky-200 px-5 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-100 cursor-pointer">
            <Upload size={16} /> Upload Week at a Glance
            <input type="file" accept="application/pdf,.pdf" onChange={handleUpload} className="hidden" />
          </label>
          <button onClick={() => setShowPrintPreview((value) => !value)} className="rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold hover:bg-slate-700">{showPrintPreview ? "Hide Print Preview" : "Print Weekly Packet"}</button>
        </div>
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
  if (stationKey === "grill") return <ExportLineCard title={stationLabel(cafe, stationKey)} values={[row.grill?.regionalSpecial, row.grill?.locationSpotlight]} />;
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
  return <div className="mt-5 flex flex-wrap gap-2">{stations.map((station) => <span key={station} className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">{stationLabel(cafe, station)}</span>)}</div>;
}

function CafeStationSection(props) {
  const { stationKey, cafe, week, rotation, menuOptions, stationOptions, categorized, updateRotation, updateSlot, updateGrill, updateLto, updateCarvery, summary, selectedItems } = props;
  if (stationKey === "global") return <GlobalSection cafe={cafe} week={week} rotation={rotation} menuOptions={menuOptions} stationOptions={stationOptions} categorized={categorized} updateRotation={updateRotation} updateSlot={updateSlot} summary={summary} selectedItems={selectedItems} />;
  if (stationKey === "grill") return <GrillSection cafe={cafe} rotation={rotation} updateGrill={updateGrill} />;
  if (stationKey === "salad") return <SimpleLTOSection stationKey="salad" title="Salad LTOs" slots={Array.from({ length: stationSlots(cafe, "salad") }, (_, i) => `Salad LTO ${i + 1}`)} values={rotation.ltos?.salad || EMPTY_ROTATION.ltos.salad} uploaded={rotation.uploadedLtos?.salad || []} updateLto={updateLto} complete={stationComplete(rotation, "salad")} />;
  if (stationKey === "pizza") return <SimpleLTOSection stationKey="pizza" title="Pizza / Flatbread LTOs" slots={Array.from({ length: stationSlots(cafe, "pizza") }, (_, i) => `Pizza/Flatbread LTO ${i + 1}`)} values={rotation.ltos?.pizza || EMPTY_ROTATION.ltos.pizza} uploaded={rotation.uploadedLtos?.pizza || []} updateLto={updateLto} complete={stationComplete(rotation, "pizza")} />;
  if (stationKey === "deli") return <SimpleLTOSection stationKey="deli" title="Deli LTOs" slots={Array.from({ length: stationSlots(cafe, "deli") }, (_, i) => `Deli LTO ${i + 1}`)} values={rotation.ltos?.deli || EMPTY_ROTATION.ltos.deli} uploaded={rotation.uploadedLtos?.deli || []} updateLto={updateLto} complete={stationComplete(rotation, "deli")} />;
  if (stationKey === "fishMarket") return <SimpleLTOSection stationKey="fishMarket" title="Fish Market LTO" slots={Array.from({ length: stationSlots(cafe, "fishMarket") }, (_, i) => `Fish Market LTO ${i + 1}`)} values={rotation.ltos?.fishMarket || EMPTY_ROTATION.ltos.fishMarket} uploaded={rotation.uploadedLtos?.fishMarket || []} updateLto={updateLto} complete={stationComplete(rotation, "fishMarket")} />;
  if (stationKey === "freshFive") return <SimpleLTOSection stationKey="freshFive" title="Fresh $5" slots={Array.from({ length: stationSlots(cafe, "freshFive") }, (_, i) => `Fresh $5 Option ${i + 1}`)} values={rotation.ltos?.freshFive || EMPTY_ROTATION.ltos.freshFive} uploaded={rotation.uploadedLtos?.freshFive || []} updateLto={updateLto} complete={stationComplete(rotation, "freshFive")} />;
  if (stationKey === "soup") return <SimpleLTOSection stationKey="soup" title="Soup LTOs" slots={Array.from({ length: stationSlots(cafe, "soup") }, (_, i) => `Soup ${i + 1}`)} values={rotation.ltos?.soup || EMPTY_ROTATION.ltos.soup} uploaded={rotation.uploadedLtos?.soup || []} updateLto={updateLto} complete={stationComplete(rotation, "soup")} />;
  if (stationKey === "wok") return <WokSection rotation={rotation} updateLto={updateLto} />;
  if (stationKey === "carvery") return <CarverySection rotation={rotation} updateCarvery={updateCarvery} />;
  return null;
}

function GlobalSection({ cafe, week, rotation, menuOptions, stationOptions, categorized, updateRotation, updateSlot, summary, selectedItems }) {
  const globalTitle = cafe === "Doppler" ? "Wok Xahn" : "Global Station";
  const cycle = globalCycleConfig(cafe, week);
  const promo = rotation.promotionOverride || EMPTY_ROTATION.promotionOverride;
  const updatePromo = (patch) => updateRotation({ promotionOverride: { ...promo, ...patch } });

  const selectMenu = (menu) => {
    const next = menu ? blankRotation(menu) : blankRotation();
    next.promotionOverride = promo;
    updateRotation(next);
  };

  const selectStation = (station) => {
    const next = blankRotation(rotation.menu, station);
    next.promotionOverride = promo;
    next.globalBlocks = rotation.globalBlocks || {};
    updateRotation(next);
  };

  if (cafe === "Re:Invent") {
    return <ReInventGlobalSection cafe={cafe} week={week} rotation={rotation} menuOptions={menuOptions} stationOptions={stationOptions} categorized={categorized} updateRotation={updateRotation} updateSlot={updateSlot} summary={summary} selectedItems={selectedItems} promo={promo} updatePromo={updatePromo} />;
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
            <option value="">Select menu...</option>
            {menuOptions.map((menu) => <option key={menu} value={menu}>{menu}</option>)}
          </select>
        </div>
        {rotation.menu && stationOptions.length > 1 && (
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2">Station / Sub-Concept</label>
            <select value={rotation.station || ""} onChange={(e) => selectStation(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">All stations</option>
              {stationOptions.map((station) => <option key={station} value={station}>{station}</option>)}
            </select>
          </div>
        )}
      </div>
      {rotation.menu && <LiveAnalytics summary={summary} selectedItems={selectedItems} />}
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-4 gap-5">
        <PickerGroup title="Entrees" limit="up to 3" items={categorized.entrees} values={rotation.entrees || ["", "", ""]} onChange={(index, value) => updateSlot("entrees", index, value)} />
        <PickerGroup title="Sides" limit="up to 4" items={categorized.sides} values={rotation.sides || ["", "", "", ""]} onChange={(index, value) => updateSlot("sides", index, value)} />
        <PickerGroup title="Sub Recipes" limit="up to 4" items={categorized.subRecipes} values={rotation.subRecipes || ["", "", "", ""]} onChange={(index, value) => updateSlot("subRecipes", index, value)} />
        <PickerGroup title="Extensions" limit="up to 2" items={categorized.extensions} values={rotation.extensions || ["", ""]} onChange={(index, value) => updateSlot("extensions", index, value)} />
      </div>
      <StationSelectedList title="Items Description" items={globalSelectedRows(rotation, { unique: true })} />
    </CollapsibleStation>
  );
}


function ReInventGlobalSection({ cafe, week, rotation, menuOptions, stationOptions, categorized, updateRotation, selectedItems, promo, updatePromo }) {
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
          if (blockInfo.readOnly) {
            return (
              <div key={blockInfo.id} className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-700 font-bold">Read Only Carryover</p>
                <h4 className="text-2xl font-bold text-indigo-950 mt-1">{blockInfo.title}</h4>
                <p className="text-sm text-indigo-900 mt-1">{blockInfo.help}</p>
                <div className="mt-3 rounded-2xl bg-white border border-indigo-200 p-4 text-sm text-indigo-900">
                  Prior Friday Global will display here when the previous week has been saved to Smartsheet.
                </div>
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
                    <option value="">Select menu...</option>
                    {menuOptions.map((menu) => <option key={menu} value={menu}>{menu}</option>)}
                  </select>
                </div>
                {block.menu && stationOptions.length > 1 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-500 mb-2">Station / Sub-Concept</label>
                    <select value={block.station || ""} onChange={(e) => updateBlock(blockInfo.id, { ...blankGlobalBlock(block.menu, e.target.value) })} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
                      <option value="">All stations</option>
                      {stationOptions.map((station) => <option key={station} value={station}>{station}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {block.menu && (
                <div className="mt-5 grid grid-cols-1 xl:grid-cols-4 gap-5">
                  <PickerGroup title="Entrees" limit="up to 3" items={categorized.entrees} values={block.entrees || ["", "", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "entrees", slot, value)} />
                  <PickerGroup title="Sides" limit="up to 4" items={categorized.sides} values={block.sides || ["", "", "", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "sides", slot, value)} />
                  <PickerGroup title="Sub Recipes" limit="up to 4" items={categorized.subRecipes} values={block.subRecipes || ["", "", "", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "subRecipes", slot, value)} />
                  <PickerGroup title="Extensions" limit="up to 2" items={categorized.extensions} values={block.extensions || ["", ""]} onChange={(slot, value) => updateBlockSlot(blockInfo.id, "extensions", slot, value)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <StationSelectedList title="Items Description" items={globalSelectedRows(rotation, { unique: true })} />
    </CollapsibleStation>
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
    <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
          <h3 className="text-2xl font-bold mt-1">{title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold border ${complete ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-sky-50 border-sky-200 text-sky-700"}`}>{complete ? "complete" : "needs selection"}</span>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StationSelectedList({ title = "Items Description", items }) {
  const [isOpen, setIsOpen] = useState(false);
  const missingDetailCount = items.filter(isSourceDetailMissing).length;
  const descriptionMissingCount = items.filter((row) => !getDescription(row)).length;
  const reviewCount = Math.max(missingDetailCount, descriptionMissingCount);
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <button type="button" onClick={() => setIsOpen((value) => !value)} className="w-full flex items-center justify-between gap-3 text-left">
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-1">
            {items.length} selected - descriptions, diet tags, and allergens
            {reviewCount ? ` - ${reviewCount} need source detail` : ""}
          </p>
        </div>
        <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold inline-flex items-center gap-1">
          {isOpen ? "Hide" : "View"} {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-2">
          {!items.length && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No items selected yet.</div>}
          {Boolean(reviewCount) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
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
              <div key={`${getItemIdentity(row)}-${index}`} className={`rounded-2xl border p-3 ${missingSourceDetail ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-bold text-slate-900">{getDisplayName(row)}</p>
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
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
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
  return (
    <div className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm ring-1 ring-sky-100">
      <div className="flex items-center justify-between gap-2"><p className="font-bold text-slate-900">{title}</p><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div>
      <p className="text-xs text-sky-700 mt-1 font-semibold">{limit}</p>
      <div className="mt-3 space-y-2">
        {values.map((value, index) => (
          <select key={index} value={value} onChange={(e) => onChange(index, e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-3 py-2 text-sm font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
            <option value="">Select {title.toLowerCase()}...</option>
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
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Grill Station</p>
      <h3 className="text-2xl font-bold mt-1">{grillTitle}</h3>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <GrillSelect label="Regional Special" value={rotation.grill?.regionalSpecial || ""} onChange={(value) => updateGrill("regionalSpecial", value)} items={options} />
        <GrillSelect label="Location Spotlight" value={rotation.grill?.locationSpotlight || ""} onChange={(value) => updateGrill("locationSpotlight", value)} items={options} />
      </div>
      <StationSelectedList title="Items Description" items={grillSelectedRows(rotation, { unique: true })} />
    </div>
  );
}

function GrillSelect({ label, value, onChange, items }) {
  return <div className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{label}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100"><option value="">Select {label.toLowerCase()}...</option>{items.map((row) => <option key={`${label}-${getItemIdentity(row)}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}</select></div>;
}

function SimpleLTOSection({ stationKey, title, slots, values = [], uploaded = [], updateLto, complete }) {
  const pool = stationPool(stationKey);
  return (
    <CollapsibleStation title={title} eyebrow="Station Special" complete={complete}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((slot, index) => (
          <div key={slot} className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{slot}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div>
            <select value={values[index] || uploaded[index] || ""} onChange={(e) => updateLto(stationKey, index, e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">Select {slot.toLowerCase()}...</option>
              {uploaded[index] && <option value={uploaded[index]}>{titleCase(uploaded[index])}</option>}
              {pool.map((row) => <option key={`${stationKey}-${slot}-${getItemIdentity(row)}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}
            </select>
          </div>
        ))}
      </div>
      <StationSelectedList title="Items Description" items={ltoSelectedRows({ ltos: { [stationKey]: values }, uploadedLtos: { [stationKey]: uploaded } }, stationKey, { unique: true })} />
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
      <StationSelectedList title="Items Description" items={wokSelectedRows(rotation, { unique: true })} />
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
      <p className="text-sm text-slate-500 mb-4">Hot and cold side dropdowns are filtered by item naming cues from the database. Ambiguous sides remain available where review may be needed.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map(([field, label, options]) => (
          <div key={field} className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{label}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div>
            <select value={rotation.carvery?.[field] || ""} onChange={(e) => updateCarvery(field, e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">Select {label.toLowerCase()}...</option>
              {options.map((row) => <option key={`${field}-${getItemIdentity(row)}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}
            </select>
          </div>
        ))}
      </div>
      <StationSelectedList title="Items Description" items={carverySelectedRows(rotation, { unique: true })} />
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
      <div className="flex items-start gap-3"><CalendarDays className="text-slate-400" /><div><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Leadership Overview</p><h2 className="text-2xl font-bold mt-1">{district} • {week}</h2></div></div>
      <div className="mt-5 space-y-3">{rows.map((row) => <SummaryCard key={row.cafe} row={row} conflict={row.menu && conflictMenus[row.menu] > 1} />)}</div>
    </div>
  );
}

function ExecutiveView({ week, setWeek, rows, conflictMenus }) {
  const declared = rows.filter((row) => row.menu).length;
  const conflicts = rows.filter((row) => row.menu && conflictMenus[`${row.district}|${row.menu}`] > 1).length;
  const globalRows = rows.filter((row) => row.menu);
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
  const read = leadershipRead(rows, conflictMenus);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Leadership Read</p>
        <h2 className="text-3xl font-bold mt-1">This Week at a Glance</h2>
        <p className="text-slate-600 mt-3 text-lg leading-relaxed">{read}</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ControlCard label="Leadership Week View" value={week} setValue={setWeek} options={ROTATION_WEEKS} />
        <ExecutiveMetric title="Declared" value={`${declared}/${rows.length}`} sub="cafés submitted" />
        <ExecutiveMetric title="Duplicate Menus" value={conflicts} sub="within district" tone={conflicts ? "amber" : "green"} />
        <ExecutiveMetric title="Projected Global FC%" value={pct(averageGlobalFc)} sub="based on selected rotation mix" tone={averageGlobalFc != null && averageGlobalFc > 0.34 ? "amber" : "green"} />
      </section>

      <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Executive Rotation View</p>
            <h2 className="text-3xl font-bold mt-1">Weekly Rotation Health</h2>
            <p className="text-sm text-slate-500 mt-1">One card per café showing rotation status, food cost signal, duplicate flags, and station completion gaps.</p>
          </div>
        </div>
        <div className="mt-5 space-y-6">
          {districtNames.map((districtName) => {
            const districtRows = rows.filter((row) => row.district === districtName);
            return (
              <div key={districtName}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">{districtName}</h3>
                  <div className="flex flex-wrap gap-2">
                    <p className="rounded-full bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">{districtRows.filter((row) => row.menu).length}/{districtRows.length} declared</p>
                    <p className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">≤30% favorable</p>
                    <p className="rounded-full bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">30–34% monitor</p>
                    <p className="rounded-full bg-amber-100 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800">&gt;34% watch</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {districtRows.map((row) => (
                    <SummaryCard key={`${row.district}-${row.cafe}`} row={row} conflict={row.menu && conflictMenus[`${row.district}|${row.menu}`] > 1} showDistrict={false} />
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
  const completedStations = stationKeys.filter((stationKey) => stationComplete(row, stationKey)).length;
  const tone = !row.menu ? "border-slate-200 bg-slate-50" : fcMidpoint == null ? "border-slate-300 bg-slate-100" : fcMidpoint > 0.34 ? "border-amber-200 bg-amber-50" : fcMidpoint <= 0.30 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {showDistrict && row.district && <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{row.district}</p>}
          <p className="font-bold text-slate-900">{row.cafe}</p>
          {row.copiedFrom ? <p className="text-xs text-slate-500 mt-1">Copied from {row.copiedFrom}</p> : row.cafe === "Nitro" ? <p className="text-xs text-slate-500 mt-1">Frontier follows Nitro</p> : null}
          <p className="text-sm text-slate-600 mt-1">{row.menu || "No menu declared"}</p>
          {row.status && <p className="text-xs text-slate-500 mt-1">{row.status}{row.updatedAt ? ` • Updated ${row.updatedAt}` : ""}</p>}
          {row.submittedBy && <p className="text-xs text-slate-500 mt-1">By {row.submittedBy}</p>}
          {row.station && <p className="text-xs text-slate-500 mt-1">{row.station}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">{pctRange(fcRange)}</span>
          {conflict ? <AlertTriangle className="text-amber-600" size={18} /> : row.menu ? <CheckCircle2 className="text-emerald-600" size={18} /> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        {row.menu && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{(row.entrees || []).filter(Boolean).length} entrees</span>}
        {row.menu && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{(row.sides || []).filter(Boolean).length} sides</span>}
        {row.menu && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{(row.subRecipes || []).filter(Boolean).length} sub recipes</span>}
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
  const draftRows = rows.filter((row) => row.status !== "Submitted");
  const pricedRows = rows.map((row) => ({ ...row, summary: foodSummary(selectedItems(row)) })).filter((row) => row.summary.fc != null);
  const averageFc = pricedRows.length ? pricedRows.reduce((sum, row) => sum + row.summary.fc, 0) / pricedRows.length : null;
  const trueCostRows = rows.map((row) => ({ ...row, trueCostRange: selectedTrueCostRange(selectedItems(row)) })).filter((row) => row.trueCostRange.low != null);
  const mostUsedMenus = Object.entries(rows.reduce((acc, row) => { if (row.menu) acc[row.menu] = (acc[row.menu] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <ControlCard label="District Filter" value={resultsDistrict} setValue={setResultsDistrict} options={["All", ...Object.keys(DISTRICTS)]} />
        <ControlCard label="Café Filter" value={resultsCafe} setValue={setResultsCafe} options={["All", ...allCafeOptions]} />
        <ExecutiveMetric title="Saved Entries" value={rows.length} sub="declared rotations" />
        <ExecutiveMetric title="Submitted" value={submittedRows.length} sub={`${draftRows.length} drafts`} tone={draftRows.length ? "amber" : "green"} />
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
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <SummaryBucket title="True Cost Range Records" value={trueCostRows.length || "—"} details={trueCostRows.map((row) => `${row.cafe} • ${row.week}: ${moneyRange(row.trueCostRange)}`).slice(0, 5)} empty="no true cost history yet" />
          <SummaryBucket title="Most Used Menus" value={mostUsedMenus.length || "—"} details={mostUsedMenus.map(([menu, count]) => `${menu} (${count})`)} empty="no menu history yet" />
        </div>
      </section>
      <section className="overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-2xl">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Rolling 6 Month Results</p>
            <h2 className="text-3xl font-bold mt-1">Rotation History</h2>
            <p className="text-sm text-slate-500 mt-1">Shows the most recent 26 rotation weeks with global declarations, submission status, food cost signal, and timestamps.</p>
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
                <th className="px-4 py-3">True Cost Range</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">No saved declarations match this filter yet.</td></tr>
              ) : rows.map((row, index) => {
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
                    <td className="px-4 py-3 min-w-[190px] font-semibold">{row.menu}</td>
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
