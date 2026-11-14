import { COMMISSARY_ITEM_BY_ID, COMMISSARY_RETIRED_ORDER_ITEMS, SALAD_BAR_COST_SOURCE, commissaryItemMapForWeek, commissaryOrderItemsForWeek, isWholeUnitSaladItem } from "./commissaryCatalog.js";
import { DEFAULT_COMMISSARY_METADATA } from "./commissaryMetadata.js";
import { GRILL_LTO_PREP_ITEM_IDS, GRILL_LTO_PROGRAM } from "./grillLtoCatalog.js";
import { DELI_ORDERING_PREP_ITEM_IDS, DELI_ORDERING_PROGRAM } from "./deliCycleCatalog.js";
import { GLOBAL_ORDERING_PREP_ITEM_IDS, GLOBAL_ORDERING_PROGRAM } from "./globalCycleCatalog.js";
import { BREAKFAST_ORDERING_ITEM_IDS, BREAKFAST_ORDERING_PREP_ITEM_IDS, BREAKFAST_ORDERING_PROGRAM } from "./breakfastCatalog.js";
import { COMMISSARY_STATIONS, cafeRoutesToHub, isCafeStationEnabled } from "./commissaryRouting.js";
import { filterCommissaryComponents, filterGrillCommissaryComponents, isExcludedLoosePrepItem, prepareCommissaryComponents, prepareGlobalCommissaryComponents, prepareGlobalTransferComponents } from "./commissaryPrepPolicy.js";

export const PACIFIC_TIME_ZONE = "America/Los_Angeles";
export const DELIVERY_KEYS = Object.freeze(DEFAULT_COMMISSARY_METADATA.deliveries.map(({ key }) => key));
export const COMMISSARY_ORDER_UNIT_VERSION = 2;
export const COMMISSARY_GRILL_ORDER_VERSION = 2;
export const COMMISSARY_DELI_ORDER_VERSION = 2;
export const COMMISSARY_GLOBAL_ORDER_VERSION = 3;
export const COMMISSARY_BREAKFAST_ORDER_VERSION = 1;
export const COMMISSARY_PACKOUT_PACKET_VERSION = 2;
export const COMMISSARY_STATION_ORDER = Object.freeze(["Salad Bar", "Breakfast", "Deli", "Grill", "Global"]);

export const GLOBAL_UNIT_PREPARATION_NOTES = Object.freeze({
  "AMZ: Balti": "Rice and naan purchased and prepared in unit.",
  "AMZ: House of Teriyaki": "Rice purchased and prepared in unit.",
  "AMZ: Lemongrass + Lime": "Rice purchased and prepared in unit.",
  "AMZ: Lotus": "Rice purchased and prepared in unit.",
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (value) => String(value).padStart(2, "0");

export function isoDate(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

export function mondayForIsoDate(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  const day = date.getUTCDay();
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

export function pacificParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: Number(parts.minute) };
}

export function cutoffDateForWeek(weekStart) {
  // Tyler's one-week exception: Buzz c57d644dd0f1ced70681453e0570970f3b03692454a7ebe64eb1717ff4295ab2.
  if (weekStart === "2026-11-02") return "2026-10-29";
  return addDays(weekStart, -5);
}

export function cutoffLabelForWeek(weekStart) {
  const date = cutoffDateForWeek(weekStart);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  return `${weekday} ${formatShortDate(date)} at 5:00 PM Pacific`;
}

export function isWeekLocked(weekStart, now = new Date()) {
  if (!ISO_DATE.test(String(weekStart || ""))) return true;
  const current = pacificParts(now);
  const cutoff = cutoffDateForWeek(weekStart);
  return current.date > cutoff || (current.date === cutoff && (current.hour > 17 || (current.hour === 17 && current.minute >= 0)));
}

export function firstOpenWeek(now = new Date()) {
  const current = pacificParts(now).date;
  let monday = mondayForIsoDate(current);
  while (isWeekLocked(monday, now)) monday = addDays(monday, 7);
  return monday;
}

export function latestPrepWeek(now = new Date()) {
  return addDays(firstOpenWeek(now), -7);
}

export function selectableWeeks(now = new Date(), count = 12) {
  const first = firstOpenWeek(now);
  return Array.from({ length: count }, (_, index) => addDays(first, index * 7));
}

export function formatShortDate(iso) {
  return new Intl.DateTimeFormat("en-US", { month: "numeric", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export function weekLabel(weekStart) {
  return `${formatShortDate(weekStart)}–${formatShortDate(addDays(weekStart, 4))}`;
}

const DELIVERY_DAY_OFFSETS = Object.freeze({ friday: -3, monday: 0, wednesday: 2 });

export function deliveryDateForWeek(weekStart, deliveryKey) {
  return addDays(weekStart, DELIVERY_DAY_OFFSETS[deliveryKey] ?? 0);
}

export function deliveriesForWeek(deliveries, weekStart) {
  return deliveries.map((delivery) => {
    const date = formatShortDate(deliveryDateForWeek(weekStart, delivery.key));
    return { ...delivery, title: `${delivery.day} ${date}`, titleEs: `${delivery.day === "Friday" ? "Viernes" : delivery.day === "Monday" ? "Lunes" : "Miércoles"} ${date}` };
  });
}

export function transferPeriod(weekStart) {
  return { start: addDays(weekStart, -3), end: addDays(weekStart, 3) };
}

export function emptyQuantities(weekStart) {
  return Object.fromEntries(commissaryOrderItemsForWeek(weekStart).map(({ id }) => [id, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]))]));
}

const wholeQuantity = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
};

export function grillCycleForWeek(weekStart) {
  if (!ISO_DATE.test(String(weekStart || "")) || weekStart < GRILL_LTO_PROGRAM.anchorWeekStart) return null;
  const elapsedDays = Math.round((new Date(`${weekStart}T00:00:00Z`) - new Date(`${GRILL_LTO_PROGRAM.anchorWeekStart}T00:00:00Z`)) / 86400000);
  const cycleIndex = Math.floor(elapsedDays / 7) % GRILL_LTO_PROGRAM.cycleLengthWeeks;
  return GRILL_LTO_PROGRAM.cycleWeeks[cycleIndex] || null;
}

export function isGrillEligibleCafe(cafe) {
  return GRILL_LTO_PROGRAM.eligibleCafes.includes(cafe) && isCafeStationEnabled(cafe, COMMISSARY_STATIONS.GRILL);
}

export function isGrillCoreAvailable(cafe, weekStart) {
  if (!ISO_DATE.test(String(weekStart || "")) || !isGrillEligibleCafe(cafe)) return false;
  const start = GRILL_LTO_PROGRAM.coreStartWeekByCafe?.[cafe] || GRILL_LTO_PROGRAM.coreDefaultStartWeek || GRILL_LTO_PROGRAM.effectiveDate;
  return Boolean(start && weekStart >= start);
}

export function deliCycleForWeek(weekStart) {
  if (!ISO_DATE.test(String(weekStart || "")) || weekStart < DELI_ORDERING_PROGRAM.anchorWeekStart) return null;
  const elapsedDays = Math.round((new Date(`${weekStart}T00:00:00Z`) - new Date(`${DELI_ORDERING_PROGRAM.anchorWeekStart}T00:00:00Z`)) / 86400000);
  const cycleIndex = Math.floor(elapsedDays / 7) % DELI_ORDERING_PROGRAM.cycleLengthWeeks;
  return DELI_ORDERING_PROGRAM.cycleWeeks[cycleIndex] || null;
}

export function isDeliEligibleCafe(cafe) {
  return DELI_ORDERING_PROGRAM.eligibleCafes.includes(cafe) && isCafeStationEnabled(cafe, COMMISSARY_STATIONS.DELI);
}

export function globalCycleForWeek(weekStart) {
  if (!ISO_DATE.test(String(weekStart || "")) || weekStart < GLOBAL_ORDERING_PROGRAM.anchorWeekStart) return null;
  const elapsedDays = Math.round((new Date(`${weekStart}T00:00:00Z`) - new Date(`${GLOBAL_ORDERING_PROGRAM.anchorWeekStart}T00:00:00Z`)) / 86400000);
  const cycleIndex = Math.floor(elapsedDays / 7) % GLOBAL_ORDERING_PROGRAM.cycleLengthWeeks;
  return GLOBAL_ORDERING_PROGRAM.cycleWeeks[cycleIndex] || null;
}

export function isGlobalEligibleCafe(cafe) {
  return GLOBAL_ORDERING_PROGRAM.eligibleCafes.includes(cafe) && isCafeStationEnabled(cafe, COMMISSARY_STATIONS.GLOBAL);
}

export function isBreakfastEligibleCafe(cafe) {
  return BREAKFAST_ORDERING_PROGRAM.eligibleCafes.includes(cafe) && isCafeStationEnabled(cafe, COMMISSARY_STATIONS.BREAKFAST);
}

export function emptyBreakfastOrder() {
  return {
    version: COMMISSARY_BREAKFAST_ORDER_VERSION,
    selections: [],
    quantities: Object.fromEntries(BREAKFAST_ORDERING_ITEM_IDS.map((id) => [id, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]))])),
    items: {},
  };
}

export function normalizeBreakfastOrder(breakfast = {}, cafe = "") {
  const empty = emptyBreakfastOrder();
  if (!isBreakfastEligibleCafe(cafe)) return empty;
  const allowed = new Set(BREAKFAST_ORDERING_ITEM_IDS);
  const selections = [...new Set(Array.isArray(breakfast?.selections) ? breakfast.selections : [])].filter((id) => allowed.has(id));
  const selected = new Set(selections);
  const quantities = Object.fromEntries(BREAKFAST_ORDERING_ITEM_IDS.map((id) => [id, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, selected.has(id) ? wholeQuantity(breakfast?.quantities?.[id]?.[delivery]) : 0]))]));
  const byId = new Map(BREAKFAST_ORDERING_PROGRAM.items.map((item) => [item.id, item]));
  const items = Object.fromEntries(selections.flatMap((id) => {
    const option = byId.get(id);
    const snapshot = breakfast?.items?.[id];
    return option && snapshot?.id === id && Number(snapshot.itemWasteCost) > 0 ? [[id, {
      id,
      menu: BREAKFAST_ORDERING_PROGRAM.menu,
      mrn: option.mrn,
      item: String(snapshot.item || option.name),
      portion: option.portion,
      itemWasteCost: Number(snapshot.itemWasteCost),
    }]] : [];
  }));
  return { version: COMMISSARY_BREAKFAST_ORDER_VERSION, selections, quantities, items };
}

export function emptyGlobalOrder(weekStart) {
  const cycle = globalCycleForWeek(weekStart);
  const items = cycle?.menus.flatMap((menu) => menu.items) || [];
  return {
    version: COMMISSARY_GLOBAL_ORDER_VERSION,
    cycleWeek: cycle?.week || null,
    menu: "",
    selections: { entrees: ["", "", ""], sides: ["", "", "", ""], sauces: ["", ""] },
    quantities: Object.fromEntries(items.map(({ id }) => [id, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]))])),
    items: {},
  };
}

export function normalizeGlobalOrder(global = {}, weekStart, cafe = "") {
  const empty = emptyGlobalOrder(weekStart);
  const cycle = globalCycleForWeek(weekStart);
  if (!cycle || !isGlobalEligibleCafe(cafe)) return empty;
  const options = cycle.menus.flatMap((menu) => menu.items);
  const menuNames = new Set(cycle.menus.map(({ menu }) => menu));
  let menu = menuNames.has(global?.menu) ? global.menu : "";
  const legacySelected = options.filter(({ id }) => DELIVERY_KEYS.some((delivery) => wholeQuantity(global?.quantities?.[id]?.[delivery]) > 0));
  const legacyMenus = new Set(legacySelected.map(({ menu: itemMenu }) => itemMenu));
  const legacyEntrees = legacySelected.filter(({ category }) => category === "entree");
  const legacySides = legacySelected.filter(({ category }) => category === "side");
  const legacyUnsupported = legacySelected.filter(({ category }) => !["entree", "side", "subRecipe"].includes(category));
  const legacyReviewRequired = !menu && legacySelected.length > 0 && (
    legacyMenus.size !== 1 || legacyEntrees.length > 3 || legacySides.length > 4 || legacyUnsupported.length > 0
  );
  if (!menu && legacySelected.length && !legacyReviewRequired) menu = legacySelected[0].menu;
  const menuOptions = options.filter((option) => option.menu === menu);
  const allowedByCategory = {
    entrees: new Set(menuOptions.filter(({ category }) => category === "entree").map(({ id }) => id)),
    sides: new Set(menuOptions.filter(({ category }) => category === "side").map(({ id }) => id)),
    sauces: new Set(menuOptions.filter(({ category }) => category === "subRecipe").map(({ id }) => id)),
  };
  const normalizeSelections = (key, size) => {
    const saved = Array.isArray(global?.selections?.[key]) ? global.selections[key] : [];
    const category = key === "entrees" ? "entree" : key === "sides" ? "side" : "subRecipe";
    const legacy = legacySelected.filter((option) => option.category === category).map(({ id }) => id);
    const unique = [...new Set([...saved, ...legacy].filter((id) => allowedByCategory[key].has(id)))].slice(0, size);
    return [...unique, ...Array.from({ length: size - unique.length }, () => "")];
  };
  const selections = { entrees: normalizeSelections("entrees", 3), sides: normalizeSelections("sides", 4), sauces: normalizeSelections("sauces", 2) };
  const selectedIds = new Set([...selections.entrees, ...selections.sides, ...selections.sauces].filter(Boolean));
  const quantities = Object.fromEntries(options.map(({ id }) => [id, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, selectedIds.has(id) || legacyReviewRequired ? wholeQuantity(global?.quantities?.[id]?.[delivery]) : 0]))]));
  const items = Object.fromEntries(options.flatMap((option) => {
    const snapshot = global?.items?.[option.id];
    return snapshot && snapshot.id === option.id && Number(snapshot.itemWasteCost) > 0 ? [[option.id, {
      id: option.id,
      menu: option.menu,
      mrn: option.mrn,
      item: String(snapshot.item || option.name),
      portion: option.portion,
      category: option.category,
      itemWasteCost: Number(snapshot.itemWasteCost),
    }]] : [];
  }));
  return { version: COMMISSARY_GLOBAL_ORDER_VERSION, cycleWeek: cycle.week, menu, selections, quantities, items, legacyReviewRequired };
}

function effectiveGlobalIds(global = {}) {
  if (global.legacyReviewRequired) {
    return new Set(Object.entries(global.quantities || {}).filter(([, values]) => DELIVERY_KEYS.some((delivery) => wholeQuantity(values?.[delivery]) > 0)).map(([id]) => id));
  }
  return new Set([...(global.selections?.entrees || []), ...(global.selections?.sides || []), ...(global.selections?.sauces || [])].filter(Boolean));
}

export function emptyDeliOrder(weekStart) {
  const cycle = deliCycleForWeek(weekStart);
  return {
    version: COMMISSARY_DELI_ORDER_VERSION,
    cycleWeek: cycle?.week || null,
    quantities: Object.fromEntries((cycle?.items || []).map(({ mrn }) => [mrn, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]))])),
    items: {},
  };
}

export function normalizeDeliOrder(deli = {}, weekStart, cafe = "") {
  const empty = emptyDeliOrder(weekStart);
  const cycle = deliCycleForWeek(weekStart);
  if (!cycle || !isDeliEligibleCafe(cafe)) return empty;
  const currentMrns = cycle.items.map(({ mrn }) => mrn);
  const standingMrns = (DELI_ORDERING_PROGRAM.standingOrderItemMrns || []).filter((mrn) => DELIVERY_KEYS.some((delivery) => wholeQuantity(deli?.quantities?.[mrn]?.[delivery]) > 0));
  const retainedMrns = [...new Set([...currentMrns, ...standingMrns])];
  const quantities = Object.fromEntries(retainedMrns.map((mrn) => [mrn, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, wholeQuantity(deli?.quantities?.[mrn]?.[delivery])]))]));
  const items = Object.fromEntries(retainedMrns.flatMap((mrn) => {
    const snapshot = deli?.items?.[mrn];
    return snapshot && String(snapshot.mrn) === mrn && Number(snapshot.itemWasteCost) > 0 ? [[mrn, {
      mrn,
      item: String(snapshot.item || ""),
      portion: String(snapshot.portion || ""),
      itemWasteCost: Number(snapshot.itemWasteCost),
    }]] : [];
  }));
  return { version: COMMISSARY_DELI_ORDER_VERSION, cycleWeek: cycle.week, quantities, items, standingOrderMrns: standingMrns };
}

export function emptyGrillOrder(weekStart) {
  const cycle = grillCycleForWeek(weekStart);
  return {
    version: COMMISSARY_GRILL_ORDER_VERSION,
    cycleWeek: cycle?.week || null,
    selections: { A: "", B: "" },
    quantities: {
      A: Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0])),
      B: Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0])),
    },
    items: { A: null, B: null },
    core: {
      quantities: Object.fromEntries(GRILL_LTO_PROGRAM.coreItems.map(({ mrn }) => [mrn, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]))])),
      items: {},
    },
  };
}

export function normalizeGrillOrder(grill = {}, weekStart, cafe = "") {
  const empty = emptyGrillOrder(weekStart);
  const cycle = grillCycleForWeek(weekStart);
  if (!isGrillEligibleCafe(cafe)) return empty;
  const allowed = {
    A: new Set((cycle?.setA || []).map(({ mrn }) => mrn)),
    B: new Set((cycle?.setB || []).map(({ mrn }) => mrn)),
  };
  const selections = Object.fromEntries(["A", "B"].map((setKey) => {
    const selected = String(grill?.selections?.[setKey] || grill?.items?.[setKey]?.mrn || "");
    return [setKey, allowed[setKey].has(selected) ? selected : ""];
  }));
  const quantities = Object.fromEntries(["A", "B"].map((setKey) => [setKey, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [
    delivery,
    wholeQuantity(grill?.quantities?.[setKey]?.[delivery]),
  ]))]));
  const items = Object.fromEntries(["A", "B"].map((setKey) => {
    const snapshot = grill?.items?.[setKey];
    const selected = selections[setKey];
    return [setKey, snapshot && String(snapshot.mrn) === selected && Number.isFinite(Number(snapshot.itemWasteCost)) ? {
      mrn: selected,
      item: String(snapshot.item || ""),
      portion: String(snapshot.portion || ""),
      itemWasteCost: Number(snapshot.itemWasteCost),
    } : null];
  }));
  const coreAvailable = isGrillCoreAvailable(cafe, weekStart);
  const coreQuantities = Object.fromEntries(GRILL_LTO_PROGRAM.coreItems.map(({ mrn }) => [mrn, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, coreAvailable ? wholeQuantity(grill?.core?.quantities?.[mrn]?.[delivery]) : 0]))]));
  const coreItems = Object.fromEntries(GRILL_LTO_PROGRAM.coreItems.flatMap(({ mrn }) => {
    const snapshot = grill?.core?.items?.[mrn];
    return snapshot && String(snapshot.mrn) === mrn && Number(snapshot.itemWasteCost) > 0 ? [[mrn, { mrn, item: String(snapshot.item || ""), portion: String(snapshot.portion || ""), itemWasteCost: Number(snapshot.itemWasteCost) }]] : [];
  }));
  return { version: COMMISSARY_GRILL_ORDER_VERSION, cycleWeek: cycle?.week || null, selections, quantities, items, core: { quantities: coreQuantities, items: coreItems } };
}

export function sanitizeQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 100) / 100;
}

export function normalizeQuantities(quantities = {}, options = {}) {
  const orderUnitVersion = Number(options.orderUnitVersion ?? COMMISSARY_ORDER_UNIT_VERSION);
  const weekItems = commissaryOrderItemsForWeek(options.weekStart);
  const retainedRetiredItems = options.weekStart && options.weekStart < SALAD_BAR_COST_SOURCE.effectiveDate ? [] : COMMISSARY_RETIRED_ORDER_ITEMS.filter(({ id, legacyIds = [] }) => quantities?.[id] || legacyIds.some((legacyId) => quantities?.[legacyId]));
  const catalogById = commissaryItemMapForWeek(options.weekStart, quantities);
  return Object.fromEntries([...weekItems, ...retainedRetiredItems].map(({ id, legacyIds = [] }) => {
    const source = quantities?.[id] || legacyIds.map((legacyId) => quantities?.[legacyId]).find(Boolean) || {};
    const catalog = catalogById.get(id);
    const scale = orderUnitVersion < COMMISSARY_ORDER_UNIT_VERSION && catalog?.legacyOrderUnit === "quart" ? 0.25 : 1;
    return [id, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, sanitizeQuantity(sanitizeQuantity(source[delivery]) * scale)]))];
  }));
}

function quantityLeaves(record = {}) {
  const leaves = new Map();
  const collect = (prefix, groups = {}) => Object.entries(groups || {}).forEach(([item, values]) => DELIVERY_KEYS.forEach((delivery) => {
    const value = Number(values?.[delivery] || 0);
    if (value > 0) leaves.set(`${prefix}|${item}|${delivery}`, value);
  }));
  collect("salad", record.quantities);
  collect("grill-a", record.grill?.quantities?.A ? { [record.grill?.items?.A?.mrn || "unselected"]: record.grill.quantities.A } : {});
  collect("grill-b", record.grill?.quantities?.B ? { [record.grill?.items?.B?.mrn || "unselected"]: record.grill.quantities.B } : {});
  collect("grill-core", record.grill?.core?.quantities);
  collect("deli", record.deli?.quantities);
  collect("global", record.global?.quantities);
  collect("breakfast", record.breakfast?.quantities);
  return leaves;
}

export function standingOrderReductions(existing = {}, next = {}) {
  const before = quantityLeaves(existing);
  const after = quantityLeaves(next);
  return [...before.entries()].flatMap(([key, value]) => Number(after.get(key) || 0) < value ? [{ key, before: value, after: Number(after.get(key) || 0) }] : []);
}

export function invalidWholeUnitSaladQuantities(quantities = {}, weekStart) {
  const byId = commissaryItemMapForWeek(weekStart, quantities);
  return Object.entries(quantities || {}).flatMap(([id, values]) => {
    const item = byId.get(id);
    if (!item || !isWholeUnitSaladItem(item)) return [];
    return DELIVERY_KEYS.flatMap((delivery) => Number.isInteger(Number(values?.[delivery] || 0)) ? [] : [`${id}|${delivery}`]);
  });
}

export function buildOrderRecord({ cafe, weekStart, quantities, grill, deli, global, breakfast, standingOrderChangeApproval = null, now = new Date() }) {
  const normalized = isCafeStationEnabled(cafe, COMMISSARY_STATIONS.SALAD_BAR) ? normalizeQuantities(quantities, { weekStart }) : emptyQuantities(weekStart);
  const normalizedGrill = normalizeGrillOrder(grill, weekStart, cafe);
  const normalizedDeli = normalizeDeliOrder(deli, weekStart, cafe);
  const normalizedGlobal = normalizeGlobalOrder(global, weekStart, cafe);
  const normalizedBreakfast = normalizeBreakfastOrder(breakfast, cafe);
  return {
    "Record ID": `commissaryOrder|${cafe.toLowerCase()}|${weekStart}`,
    "Record Type": "Commissary Order",
    Status: isWeekLocked(weekStart, now) ? "Locked" : "Draft",
    "Café / Unit": cafe,
    "Date Range Label": weekLabel(weekStart),
    "Visible In Dashboard": false,
    cafe,
    weekStart,
    cutoffDate: cutoffDateForWeek(weekStart),
    commissaryMetadataVersion: DEFAULT_COMMISSARY_METADATA.metadataVersion,
    orderUnitVersion: COMMISSARY_ORDER_UNIT_VERSION,
    quantities: normalized,
    grill: normalizedGrill,
    deli: normalizedDeli,
    global: normalizedGlobal,
    breakfast: normalizedBreakfast,
    ...(standingOrderChangeApproval ? { standingOrderChangeApproval } : {}),
    updatedAt: now.toISOString(),
  };
}

export function normalizePrepCompleted(completed = {}) {
  const allowedPrepIds = new Set([...COMMISSARY_ITEM_BY_ID.keys(), ...GRILL_LTO_PREP_ITEM_IDS, ...DELI_ORDERING_PREP_ITEM_IDS, ...GLOBAL_ORDERING_PREP_ITEM_IDS, ...BREAKFAST_ORDERING_PREP_ITEM_IDS]);
  return Object.fromEntries(DELIVERY_KEYS.map((delivery) => [
    delivery,
    [...new Set(Array.isArray(completed?.[delivery]) ? completed[delivery] : [])]
      .filter((itemId) => allowedPrepIds.has(itemId)),
  ]));
}

export function buildPrepProgressRecord({ weekStart, hub = "Cricket", completed, now = new Date() }) {
  return {
    "Record ID": `commissaryOrder|prepProgress|${hub.toLowerCase()}|${weekStart}`,
    "Record Type": "Commissary Prep Progress",
    Status: "In Progress",
    "Date Range Label": weekLabel(weekStart),
    "Visible In Dashboard": false,
    weekStart,
    hub,
    completed: normalizePrepCompleted(completed),
    updatedAt: now.toISOString(),
  };
}

export function togglePrepCompleted(completed, delivery, itemId) {
  const normalized = normalizePrepCompleted(completed);
  if (!DELIVERY_KEYS.includes(delivery) || (!COMMISSARY_ITEM_BY_ID.has(itemId) && !GRILL_LTO_PREP_ITEM_IDS.includes(itemId) && !DELI_ORDERING_PREP_ITEM_IDS.includes(itemId) && !GLOBAL_ORDERING_PREP_ITEM_IDS.includes(itemId) && !BREAKFAST_ORDERING_PREP_ITEM_IDS.includes(itemId))) return normalized;
  const current = new Set(normalized[delivery]);
  if (current.has(itemId)) current.delete(itemId);
  else current.add(itemId);
  return { ...normalized, [delivery]: [...current] };
}

export function orderValue(quantities = {}, grill = {}, deli = {}, global = {}, cafe = "", breakfast = {}, weekStart) {
  const saladValue = cafe && !isCafeStationEnabled(cafe, COMMISSARY_STATIONS.SALAD_BAR) ? 0 : orderLinesForCafe({ cafe, weekStart, quantities })
    .reduce((sum, line) => sum + roundedProductionEquivalentQuantity(line) * line.orderUnitCost, 0);
  const grillRecord = { cafe, weekStart, grill };
  const grillValue = cafe && !isCafeStationEnabled(cafe, COMMISSARY_STATIONS.GRILL) ? 0 : grillTransferLinesForCafe(grillRecord).reduce((sum, line) => sum + line.itemWasteCost * line.quantity, 0);
  const deliValue = cafe && !isCafeStationEnabled(cafe, COMMISSARY_STATIONS.DELI) ? 0 : Object.entries(deli?.quantities || {}).reduce((sum, [mrn, values]) => {
    const item = deli?.items?.[mrn];
    const count = DELIVERY_KEYS.reduce((total, delivery) => total + wholeQuantity(values?.[delivery]), 0);
    return sum + (Number(item?.itemWasteCost) > 0 ? Number(item.itemWasteCost) * count : 0);
  }, 0);
  const globalValue = cafe && !isCafeStationEnabled(cafe, COMMISSARY_STATIONS.GLOBAL) ? 0 : globalTransferLinesForCafe({ cafe, weekStart, global }).reduce((sum, line) => sum + line.itemWasteCost * line.quantity, 0);
  const normalizedBreakfast = normalizeBreakfastOrder(breakfast, cafe);
  const breakfastValue = Object.entries(normalizedBreakfast.quantities).reduce((sum, [id, values]) => {
    const item = normalizedBreakfast.items[id];
    const count = DELIVERY_KEYS.reduce((total, delivery) => total + wholeQuantity(values?.[delivery]), 0);
    return sum + (Number(item?.itemWasteCost) > 0 ? Number(item.itemWasteCost) * count : 0);
  }, 0);
  return saladValue + grillValue + deliValue + globalValue + breakfastValue;
}

export function rolledUpItems(records = [], options = {}) {
  const scopedRecords = records.filter((record) => isCafeStationEnabled(record.cafe, COMMISSARY_STATIONS.SALAD_BAR) && (!options.hub || cafeRoutesToHub(record.cafe, COMMISSARY_STATIONS.SALAD_BAR, options.hub)));
  const rowsById = new Map(scopedRecords.flatMap((record) => [...commissaryItemMapForWeek(record.weekStart, record.quantities).values()]).map((row) => [row.id, row]));
  return [...rowsById.values()].map((row) => {
    const cafes = Object.fromEntries(scopedRecords.map((record) => {
      const values = normalizeQuantities(record.quantities, { orderUnitVersion: record.orderUnitVersion ?? 1, weekStart: record.weekStart })[row.id];
      return [record.cafe, values || Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]))];
    }));
    const deliveryTotals = Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, Object.values(cafes).reduce((sum, value) => sum + value[delivery], 0)]));
    return { ...row, station: "Salad Bar", cafes, ...deliveryTotals, total: DELIVERY_KEYS.reduce((sum, delivery) => sum + deliveryTotals[delivery], 0) };
  }).filter((row) => row.total > 0);
}

export function orderLinesForCafe(record = {}) {
  if (!isCafeStationEnabled(record.cafe, COMMISSARY_STATIONS.SALAD_BAR)) return [];
  const quantities = normalizeQuantities(record.quantities, { orderUnitVersion: record.orderUnitVersion ?? 1, weekStart: record.weekStart });
  const catalogById = commissaryItemMapForWeek(record.weekStart, record.quantities);
  return Object.entries(quantities).map(([id, values]) => {
    const catalog = catalogById.get(id);
    return catalog ? { ...catalog, ...values, total: DELIVERY_KEYS.reduce((sum, delivery) => sum + values[delivery], 0) } : null;
  }).filter((line) => line && line.total > 0);
}

export function grillOrderLinesForCafe(record = {}) {
  const grill = normalizeGrillOrder(record.grill, record.weekStart, record.cafe);
  const rotating = ["A", "B"].map((setKey) => {
    const item = grill.items[setKey];
    if (!item || !grill.selections[setKey]) return null;
    const values = grill.quantities[setKey];
    return {
      id: `grill-lto|${item.mrn}`,
      setKey,
      menu: GRILL_LTO_PROGRAM.menu,
      name: item.item,
      mrn: item.mrn,
      portion: item.portion,
      orderUnit: GRILL_LTO_PROGRAM.orderUnit,
      orderUnitCost: item.itemWasteCost,
      ...values,
      total: DELIVERY_KEYS.reduce((sum, delivery) => sum + values[delivery], 0),
    };
  }).filter((line) => line && line.total > 0);
  const core = GRILL_LTO_PROGRAM.coreItems.map((option) => {
    const item = grill.core.items[option.mrn];
    const values = grill.core.quantities[option.mrn];
    if (!item) return null;
    return { id: `grill-core|${option.mrn}`, core: true, menu: GRILL_LTO_PROGRAM.menu, name: item.item, mrn: option.mrn, portion: item.portion, orderUnit: option.category === "side" ? "portion" : "sandwich", orderUnitCost: item.itemWasteCost, ...values, total: DELIVERY_KEYS.reduce((sum, delivery) => sum + values[delivery], 0) };
  }).filter((line) => line && line.total > 0);
  return [...rotating, ...core];
}

export function grillPrepLinesForCafe(record = {}) {
  return grillOrderLinesForCafe(record).flatMap((line) => {
    if (String(line.mrn) === "16811") {
      return DELIVERY_KEYS.map((delivery) => ({
        id: "grill-finished|16811",
        type: "finished",
        mrn: "16811",
        name: "Garden Salad",
        category: "Grill composed item",
        station: "Grill",
        orderUnit: "salad",
        cafe: record.cafe,
        finishedDish: line.name,
        delivery,
        quantity: Number(line[delivery] || 0),
      })).filter(({ quantity }) => quantity > 0);
    }
    return filterGrillCommissaryComponents(GRILL_LTO_PROGRAM.itemPrepComponents[line.mrn] || [], record.weekStart).filter(({ name }) => !isExcludedLoosePrepItem(name) && !/\bbun\b/i.test(name)).flatMap((component) => DELIVERY_KEYS.map((delivery) => ({
    ...component,
    category: component.type === "subrecipe" ? "Grill sub-recipe" : "Grill ingredient",
    station: "Grill",
    orderUnit: component.unit,
    cafe: record.cafe,
    finishedDish: line.name,
    delivery,
    quantity: Number((component.quantity * line[delivery]).toFixed(4)),
    })).filter(({ quantity }) => quantity > 0));
  });
}

export function deliOrderLinesForCafe(record = {}) {
  const deli = normalizeDeliOrder(record.deli, record.weekStart, record.cafe);
  return Object.entries(deli.quantities).map(([mrn, values]) => {
    const item = deli.items[mrn];
    if (!item) return null;
    return {
      id: `deli-core|${mrn}`,
      menu: DELI_ORDERING_PROGRAM.menu,
      name: item.item,
      mrn,
      portion: item.portion,
      orderUnit: DELI_ORDERING_PROGRAM.orderUnit,
      orderUnitCost: item.itemWasteCost,
      ...values,
      total: DELIVERY_KEYS.reduce((sum, delivery) => sum + values[delivery], 0),
    };
  }).filter((line) => line && line.total > 0);
}

export function deliPrepLinesForCafe(record = {}) {
  return deliOrderLinesForCafe(record).flatMap((line) => (DELI_ORDERING_PROGRAM.itemPrepComponents[line.mrn] || []).filter(({ name }) => !isExcludedLoosePrepItem(name)).flatMap((component) => DELIVERY_KEYS.map((delivery) => ({
    ...component,
    category: component.type === "subrecipe" ? "Deli sub-recipe" : "Deli ingredient",
    station: "Deli",
    orderUnit: component.unit,
    cafe: record.cafe,
    finishedDish: line.name,
    delivery,
    quantity: Number((component.quantity * line[delivery]).toFixed(4)),
  })).filter(({ quantity }) => quantity > 0)));
}

export function globalOrderLinesForCafe(record = {}) {
  const global = normalizeGlobalOrder(record.global, record.weekStart, record.cafe);
  const selectedIds = effectiveGlobalIds(global);
  return Object.entries(global.quantities).map(([id, values]) => {
    if (!selectedIds.has(id)) return null;
    const item = global.items[id];
    if (!item) return null;
    return {
      id,
      menu: item.menu,
      name: item.item,
      mrn: item.mrn,
      portion: item.portion,
      category: item.category,
      orderUnit: GLOBAL_ORDERING_PROGRAM.orderUnit,
      orderUnitCost: item.itemWasteCost,
      ...values,
      total: DELIVERY_KEYS.reduce((sum, delivery) => sum + values[delivery], 0),
    };
  }).filter((line) => line && line.total > 0);
}

export function globalPrepLinesForCafe(record = {}) {
  return globalOrderLinesForCafe(record).flatMap((line) => prepareGlobalCommissaryComponents(GLOBAL_ORDERING_PROGRAM.itemPrepComponents[line.id] || [], record.weekStart, line.id).flatMap((component) => DELIVERY_KEYS.map((delivery) => ({
    ...component,
    category: component.type === "subrecipe" ? "Global sub-recipe" : "Global ingredient",
    station: "Global",
    orderUnit: component.unit,
    cafe: record.cafe,
    finishedDish: line.name,
    delivery,
    quantity: Number((component.quantity * line[delivery]).toFixed(4)),
  })).filter(({ quantity }) => quantity > 0)));
}

function componentTransferLines(orderLines, componentMap, weekStart, station) {
  const componentFilter = station === "Grill" ? filterGrillCommissaryComponents : filterCommissaryComponents;
  return orderLines.flatMap((line) => componentFilter(componentMap[line.id] || componentMap[line.mrn] || [], weekStart)
    .filter(({ costPerPortion }) => Number(costPerPortion) > 0)
    .map((component) => ({
      id: `${line.id}|${component.id}`,
      menu: line.menu,
      name: component.name,
      finishedDish: line.name,
      mrn: component.mrn,
      quantity: roundedProductionEquivalentQuantity(line, component, station),
      itemWasteCost: Number(component.costPerPortion),
      glCode: component.glCode || "4111011",
      station,
    })));
}

export function grillTransferLinesForCafe(record = {}) {
  return componentTransferLines(grillOrderLinesForCafe(record), GRILL_LTO_PROGRAM.itemTransferComponents || {}, record.weekStart, "Grill").filter(({ name }) => !/\bbun\b/i.test(name));
}

export function globalTransferLinesForCafe(record = {}) {
  return globalOrderLinesForCafe(record).flatMap((line) => prepareGlobalTransferComponents(GLOBAL_ORDERING_PROGRAM.itemTransferComponents?.[line.id] || [], record.weekStart, line.id)
    .filter(({ costPerPortion }) => Number(costPerPortion) > 0)
    .map((component) => ({
      id: `${line.id}|${component.id}`,
      menu: line.menu,
      name: component.name,
      finishedDish: line.name,
      mrn: component.mrn,
      quantity: roundedProductionEquivalentQuantity(line, component, "Global"),
      itemWasteCost: Number(component.costPerPortion),
      glCode: component.glCode || "4111011",
      station: "Global",
    })));
}

export function breakfastOrderLinesForCafe(record = {}) {
  const breakfast = normalizeBreakfastOrder(record.breakfast, record.cafe);
  return breakfast.selections.map((id) => {
    const item = breakfast.items[id];
    const values = breakfast.quantities[id];
    if (!item) return null;
    return {
      id,
      menu: BREAKFAST_ORDERING_PROGRAM.menu,
      name: item.item,
      mrn: item.mrn,
      portion: item.portion,
      orderUnit: BREAKFAST_ORDERING_PROGRAM.orderUnit,
      orderUnitCost: item.itemWasteCost,
      ...values,
      total: DELIVERY_KEYS.reduce((sum, delivery) => sum + values[delivery], 0),
    };
  }).filter((line) => line && line.total > 0);
}

export function breakfastPrepLinesForCafe(record = {}) {
  return breakfastOrderLinesForCafe(record).flatMap((line) => (BREAKFAST_ORDERING_PROGRAM.itemPrepComponents[line.id] || []).filter(({ name }) => !isExcludedLoosePrepItem(name)).flatMap((component) => DELIVERY_KEYS.map((delivery) => ({
    ...component,
    category: component.type === "subrecipe" ? "Breakfast sub-recipe" : "Breakfast ingredient",
    station: "Breakfast",
    orderUnit: component.unit,
    cafe: record.cafe,
    finishedDish: line.name,
    delivery,
    quantity: Number((component.quantity * line[delivery]).toFixed(4)),
  })).filter(({ quantity }) => quantity > 0)));
}

export function hasCommissaryOrder(record = {}) {
  return orderLinesForCafe(record).length > 0
    || grillOrderLinesForCafe(record).length > 0
    || deliOrderLinesForCafe(record).length > 0
    || globalOrderLinesForCafe(record).length > 0
    || breakfastOrderLinesForCafe(record).length > 0;
}

export function rolledUpPrepItems(records = [], options = {}) {
  const salad = rolledUpItems(records, options);
  const grillMap = new Map();
  records.flatMap((record) => [
    ...(options.hub && !cafeRoutesToHub(record.cafe, COMMISSARY_STATIONS.GRILL, options.hub) ? [] : grillPrepLinesForCafe(record)),
    ...(options.hub && !cafeRoutesToHub(record.cafe, COMMISSARY_STATIONS.DELI, options.hub) ? [] : deliPrepLinesForCafe(record)),
    ...(options.hub && !cafeRoutesToHub(record.cafe, COMMISSARY_STATIONS.GLOBAL, options.hub) ? [] : globalPrepLinesForCafe(record)),
    ...(options.hub && !cafeRoutesToHub(record.cafe, COMMISSARY_STATIONS.BREAKFAST, options.hub) ? [] : breakfastPrepLinesForCafe(record)),
  ]).forEach((line) => {
    const mrn = String(line.mrn || "").trim();
    const identity = mrn ? `mrn:${mrn}` : `name:${String(line.name || "").trim().toLowerCase()}`;
    const key = `${line.station}|${identity}|${String(line.orderUnit || "").trim().toLowerCase()}`;
    const current = grillMap.get(key) || {
      id: line.id,
      name: line.name,
      mrn: line.mrn,
      category: line.category,
      station: line.station,
      orderUnit: line.orderUnit,
      finishedDishes: new Set(),
      cafes: {},
      ...Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0])),
    };
    current.finishedDishes.add(line.finishedDish);
    current[line.delivery] = Number((current[line.delivery] + line.quantity).toFixed(4));
    current.cafes[line.cafe] ||= Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]));
    current.cafes[line.cafe][line.delivery] = Number((current.cafes[line.cafe][line.delivery] + line.quantity).toFixed(4));
    grillMap.set(key, current);
  });
  const grill = [...grillMap.values()].map((row) => ({
    ...row,
    finishedDish: [...row.finishedDishes].sort().join("; "),
    finishedDishes: undefined,
    total: DELIVERY_KEYS.reduce((sum, delivery) => sum + row[delivery], 0),
  }));
  const prepRows = [...salad, ...grill].filter((row) => row.total > 0);
  if (!options.consolidateAcrossStations) return prepRows.map(prepDisplayQuantity);
  const consolidated = new Map();
  prepRows.forEach((row) => {
    const mrn = String(row.mrn || "").trim();
    const identity = mrn ? `mrn:${mrn}` : `name:${String(row.name || "").trim().toLowerCase()}`;
    const key = `${identity}|${String(row.orderUnit || "").trim().toLowerCase()}`;
    const current = consolidated.get(key) || { ...row, finishedDishes: new Set(), stations: new Set(), cafes: {}, ...Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0])), total: 0 };
    current.finishedDishes.add(row.finishedDish || row.name);
    current.stations.add(row.station);
    DELIVERY_KEYS.forEach((delivery) => { current[delivery] = Number((current[delivery] + Number(row[delivery] || 0)).toFixed(4)); });
    Object.entries(row.cafes || {}).forEach(([cafe, values]) => {
      current.cafes[cafe] ||= Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]));
      DELIVERY_KEYS.forEach((delivery) => { current.cafes[cafe][delivery] = Number((current.cafes[cafe][delivery] + Number(values?.[delivery] || 0)).toFixed(4)); });
    });
    current.total = Number((current.total + Number(row.total || 0)).toFixed(4));
    consolidated.set(key, current);
  });
  return [...consolidated.values()]
    .map((row) => ({ ...row, station: [...row.stations].sort().join("; "), stations: undefined, finishedDish: [...row.finishedDishes].sort().join("; "), finishedDishes: undefined }))
    .map(prepDisplayQuantity)
    .map((row) => ({ ...row, productionType: prepProductionType(row), productionFamily: prepProductionFamily(row) }))
    .sort((a, b) => prepProductionTypeOrder(a.productionType) - prepProductionTypeOrder(b.productionType)
      || a.productionFamily.localeCompare(b.productionFamily)
      || a.name.localeCompare(b.name)
      || a.orderUnit.localeCompare(b.orderUnit));
}

const SAUCE_NAME = /(?:sauce|aioli|dressing|relish|chutney|salsa|pico de gallo|mayo|mayonnaise|vinaigrette|pesto|dip|glaze|marinade)/i;
const HOT_SAUCE_NAME = /(?:hot sauce|curry|masala|teriyaki|brais|queso|gravy|demi|piri piri|peri peri)/i;
const VEGETABLE_NAME = /\b(tomato(?:es)?|cucumbers?|onions?|peppers?|carrots?|celery|broccoli|cauliflower|cabbage|lettuce|kale|spinach|arugula|spring mix|potato(?:es)?|squash|zucchini|mushrooms?|corn|beans?|peas?|avocado|scallions?|cilantro|parsley|vegetables?)\b/i;
const PRODUCTION_TYPE_ORDER = Object.freeze(["Vegetable Production", "Cold Sauce Production", "Hot Sauce Production", "Other Production"]);
const VOLUME_TO_CUPS = Object.freeze({
  "fluid ounce": 1 / 8,
  "fluid ounces": 1 / 8,
  "fl oz": 1 / 8,
  floz: 1 / 8,
  cup: 1,
  cups: 1,
  pint: 2,
  pints: 2,
  quart: 4,
  quarts: 4,
  gallon: 16,
  gallons: 16,
  milliliter: 0.00422675,
  milliliters: 0.00422675,
  ml: 0.00422675,
  liter: 4.22675,
  liters: 4.22675,
  l: 4.22675,
  tbsp: 1 / 16,
  tablespoon: 1 / 16,
  tablespoons: 1 / 16,
  tsp: 1 / 48,
  teaspoon: 1 / 48,
  teaspoons: 1 / 48,
});

const HALF_GALLON_CUPS = 8;
const DELI_PROTEIN_NAME = /\b(?:beef|brisket|chicken|turkey|ham|bacon|pork|salami|pepperoni|mortadella|prosciutto|tuna|shrimp|prawn|crab|lobster|salmon|cod|steelhead|fish|seafood)\b/i;

const roundUpHalfGallonCups = (cups) => Number(cups) > 0
  ? Math.ceil((Number(cups) / HALF_GALLON_CUPS) - 1e-9) * HALF_GALLON_CUPS
  : 0;

export function prepVolumeCupsPerUnit(row = {}) {
  const unit = String(row.orderUnit || row.unit || "").trim().toLowerCase();
  const name = String(row.name || "");
  const grillCountPerQuart = row.station !== "Grill" ? 0
    : /tomato/i.test(String(row.name || "")) && /slic/i.test(String(row.name || "")) && ["slice", "slices"].includes(unit) ? 26
      : (String(row.mrn || "") === "166043" || /red onion/i.test(String(row.name || ""))) && ["slice", "slices"].includes(unit) ? 32
        : /iceberg/i.test(String(row.name || "")) && ["each", "leaf", "leaves"].includes(unit) ? 10
          : /pickle/i.test(String(row.name || "")) && ["each", "slice", "slices"].includes(unit) ? 75
            : 0;
  if (grillCountPerQuart) return 4 / grillCountPerQuart;
  if (/avocado.*mash|mash.*avocado/i.test(`${name} ${row.finishedDish || ""}`) && /(?:#\s*16|no\.?\s*16).*scoop|scoop.*(?:#\s*16|no\.?\s*16)/i.test(unit)) return 1 / 4;
  if (VOLUME_TO_CUPS[unit]) return VOLUME_TO_CUPS[unit];
  if (!SAUCE_NAME.test(name)) return 0;
  const ouncesPerCup = /pico de gallo/i.test(name) ? 7 : 8;
  if (["ounce", "ounces", "oz"].includes(unit)) return 1 / ouncesPerCup;
  if (["pound", "pounds", "lb", "lbs"].includes(unit)) return 16 / ouncesPerCup;
  if (["gram", "grams", "g"].includes(unit)) return 1 / (28.349523125 * ouncesPerCup);
  if (["kilogram", "kilograms", "kg"].includes(unit)) return 1000 / (28.349523125 * ouncesPerCup);
  return 0;
}

export function roundedProductionEquivalentQuantity(line = {}, component = null, station = "") {
  const quantityPerPortion = Number(component?.quantity ?? 1);
  const cupsPerUnit = prepVolumeCupsPerUnit({
    station,
    name: component?.name || line.name,
    finishedDish: line.name,
    mrn: component?.mrn || line.mrn,
    orderUnit: component?.unit || line.orderUnit,
  });
  if (!cupsPerUnit || quantityPerPortion <= 0) return Number(line.total || 0);
  return Number(DELIVERY_KEYS.reduce((sum, delivery) => {
    const portions = Number(line[delivery] || 0);
    if (portions <= 0) return sum;
    const rawCups = portions * quantityPerPortion * cupsPerUnit;
    return sum + (portions * (roundUpHalfGallonCups(rawCups) / rawCups));
  }, 0).toFixed(4));
}

export function prepProductionType(row = {}) {
  const value = `${row.name || ""} ${row.finishedDish || ""}`;
  if (VEGETABLE_NAME.test(String(row.name || ""))) return "Vegetable Production";
  if (SAUCE_NAME.test(value)) return HOT_SAUCE_NAME.test(value) ? "Hot Sauce Production" : "Cold Sauce Production";
  return "Other Production";
}

export function prepProductionFamily(row = {}) {
  const name = String(row.name || "").toLowerCase();
  const families = ["tomato", "cucumber", "onion", "pepper", "carrot", "celery", "broccoli", "cauliflower", "cabbage", "lettuce", "kale", "spinach", "arugula", "potato", "squash", "zucchini", "mushroom", "corn", "bean", "pea", "avocado"];
  return families.find((family) => new RegExp(`\\b${family}`).test(name)) || name.replace(/[^a-z0-9]+/g, " ").trim();
}

function prepProductionTypeOrder(type) {
  const index = PRODUCTION_TYPE_ORDER.indexOf(type);
  return index < 0 ? PRODUCTION_TYPE_ORDER.length : index;
}

export function prepDisplayQuantity(row = {}) {
  if (row.productionVolumeRounded) return row;
  const unit = String(row.orderUnit || "").trim().toLowerCase();
  const cupsPerUnit = prepVolumeCupsPerUnit(row);
  if (cupsPerUnit) {
    const cafeEntries = Object.entries(row.cafes || {});
    const roundedCafes = Object.fromEntries(cafeEntries.map(([cafe, values]) => [cafe, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [
      delivery,
      Number((roundUpHalfGallonCups(Number(values?.[delivery] || 0) * cupsPerUnit) / 16).toFixed(4)),
    ]))]));
    const deliveryGallons = Object.fromEntries(DELIVERY_KEYS.map((delivery) => {
      const cafeTotal = Object.values(roundedCafes).reduce((sum, values) => sum + Number(values?.[delivery] || 0), 0);
      const gallons = cafeEntries.length
        ? cafeTotal
        : roundUpHalfGallonCups(Number(row[delivery] || 0) * cupsPerUnit) / 16;
      return [delivery, Number(gallons.toFixed(4))];
    }));
    return {
      ...row,
      cafes: roundedCafes,
      ...deliveryGallons,
      total: Number(DELIVERY_KEYS.reduce((sum, delivery) => sum + deliveryGallons[delivery], 0).toFixed(4)),
      orderUnit: "gallon",
      nativeOrderUnit: row.orderUnit,
      productionVolumeRounded: true,
    };
  }
  if (["kilogram", "kilograms", "kg"].includes(unit)) {
    const convert = (value) => Number((Number(value || 0) * 2.2046226218).toFixed(4));
    return {
      ...row,
      cafes: Object.fromEntries(Object.entries(row.cafes || {}).map(([cafe, values]) => [cafe, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, convert(values?.[delivery])]))])),
      ...Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, convert(row[delivery])])),
      total: convert(row.total),
      orderUnit: "pound",
    };
  }
  if (row.station === "Deli" && ["ounce", "ounces", "oz"].includes(unit) && DELI_PROTEIN_NAME.test(String(row.name || ""))) {
    const convert = (value) => Number((Number(value || 0) / 16).toFixed(4));
    return {
      ...row,
      cafes: Object.fromEntries(Object.entries(row.cafes || {}).map(([cafe, values]) => [cafe, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, convert(values?.[delivery])]))])),
      ...Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, convert(row[delivery])])),
      total: convert(row.total),
      orderUnit: "pound",
      nativeOrderUnit: row.orderUnit,
    };
  }
  return row;
}

export function buildPackoutPacketRecord({ weekStart, records = [], packet = null, metadataVersion = 0, now = new Date() }) {
  const createdAt = now.toISOString();
  const representedCafes = new Set((packet?.pages || []).map(({ cafe }) => cafe).filter(Boolean));
  const scopedRecords = representedCafes.size ? records.filter(({ cafe }) => representedCafes.has(cafe)) : records;
  const orderRecordIds = scopedRecords.map((record) => record["Record ID"]).filter(Boolean).sort();
  return {
    "Record ID": `commissaryOrder|packoutPacket|${weekStart}`,
    "Record Type": "Commissary Packout Packet",
    Status: "Generated",
    "Visible In Dashboard": false,
    version: COMMISSARY_PACKOUT_PACKET_VERSION,
    weekStart,
    metadataVersion: Number(metadataVersion || 0),
    orderRecordIds,
    cafeCount: representedCafes.size || new Set(scopedRecords.map(({ cafe }) => cafe)).size,
    generatedAt: createdAt,
  };
}
