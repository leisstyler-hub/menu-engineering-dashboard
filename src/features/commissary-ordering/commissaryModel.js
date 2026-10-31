import { COMMISSARY_ITEM_BY_ID, COMMISSARY_ORDER_ITEMS } from "./commissaryCatalog.js";
import { DEFAULT_COMMISSARY_METADATA } from "./commissaryMetadata.js";
import { GRILL_LTO_PREP_ITEM_IDS, GRILL_LTO_PROGRAM } from "./grillLtoCatalog.js";
import { DELI_ORDERING_PREP_ITEM_IDS, DELI_ORDERING_PROGRAM } from "./deliCycleCatalog.js";
import { GLOBAL_ORDERING_PREP_ITEM_IDS, GLOBAL_ORDERING_PROGRAM } from "./globalCycleCatalog.js";
import { COMMISSARY_STATIONS, cafeRoutesToHub, isCafeStationEnabled } from "./commissaryRouting.js";

export const PACIFIC_TIME_ZONE = "America/Los_Angeles";
export const DELIVERY_KEYS = Object.freeze(DEFAULT_COMMISSARY_METADATA.deliveries.map(({ key }) => key));
export const COMMISSARY_ORDER_UNIT_VERSION = 2;
export const COMMISSARY_GRILL_ORDER_VERSION = 1;
export const COMMISSARY_DELI_ORDER_VERSION = 1;
export const COMMISSARY_GLOBAL_ORDER_VERSION = 2;
export const COMMISSARY_PACKOUT_PACKET_VERSION = 1;
export const COMMISSARY_STATION_ORDER = Object.freeze(["Salad Bar", "Deli", "Grill", "Global"]);

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

export function emptyQuantities() {
  return Object.fromEntries(COMMISSARY_ORDER_ITEMS.map(({ id }) => [id, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]))]));
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

export function emptyGlobalOrder(weekStart) {
  const cycle = globalCycleForWeek(weekStart);
  const items = cycle?.menus.flatMap((menu) => menu.items) || [];
  return {
    version: COMMISSARY_GLOBAL_ORDER_VERSION,
    cycleWeek: cycle?.week || null,
    menu: "",
    selections: { entrees: ["", "", ""], sides: ["", "", "", ""] },
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
  const legacyUnsupported = legacySelected.filter(({ category }) => !["entree", "side"].includes(category));
  const legacyReviewRequired = !menu && legacySelected.length > 0 && (
    legacyMenus.size !== 1 || legacyEntrees.length > 3 || legacySides.length > 4 || legacyUnsupported.length > 0
  );
  if (!menu && legacySelected.length && !legacyReviewRequired) menu = legacySelected[0].menu;
  const menuOptions = options.filter((option) => option.menu === menu);
  const allowedByCategory = {
    entrees: new Set(menuOptions.filter(({ category }) => category === "entree").map(({ id }) => id)),
    sides: new Set(menuOptions.filter(({ category }) => category === "side").map(({ id }) => id)),
  };
  const normalizeSelections = (key, size) => {
    const saved = Array.isArray(global?.selections?.[key]) ? global.selections[key] : [];
    const legacy = legacySelected.filter(({ category }) => category === (key === "entrees" ? "entree" : "side")).map(({ id }) => id);
    const unique = [...new Set([...saved, ...legacy].filter((id) => allowedByCategory[key].has(id)))].slice(0, size);
    return [...unique, ...Array.from({ length: size - unique.length }, () => "")];
  };
  const selections = { entrees: normalizeSelections("entrees", 3), sides: normalizeSelections("sides", 4) };
  const selectedIds = new Set([...selections.entrees, ...selections.sides].filter(Boolean));
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
  return new Set([...(global.selections?.entrees || []), ...(global.selections?.sides || [])].filter(Boolean));
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
  const quantities = Object.fromEntries(cycle.items.map(({ mrn }) => [mrn, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, wholeQuantity(deli?.quantities?.[mrn]?.[delivery])]))]));
  const items = Object.fromEntries(cycle.items.flatMap(({ mrn }) => {
    const snapshot = deli?.items?.[mrn];
    return snapshot && String(snapshot.mrn) === mrn && Number(snapshot.itemWasteCost) > 0 ? [[mrn, {
      mrn,
      item: String(snapshot.item || ""),
      portion: String(snapshot.portion || ""),
      itemWasteCost: Number(snapshot.itemWasteCost),
    }]] : [];
  }));
  return { version: COMMISSARY_DELI_ORDER_VERSION, cycleWeek: cycle.week, quantities, items };
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
  };
}

export function normalizeGrillOrder(grill = {}, weekStart, cafe = "") {
  const empty = emptyGrillOrder(weekStart);
  const cycle = grillCycleForWeek(weekStart);
  if (!cycle || !isGrillEligibleCafe(cafe)) return empty;
  const allowed = {
    A: new Set(cycle.setA.map(({ mrn }) => mrn)),
    B: new Set(cycle.setB.map(({ mrn }) => mrn)),
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
  return { version: COMMISSARY_GRILL_ORDER_VERSION, cycleWeek: cycle.week, selections, quantities, items };
}

export function sanitizeQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 100) / 100;
}

export function normalizeQuantities(quantities = {}, options = {}) {
  const orderUnitVersion = Number(options.orderUnitVersion ?? COMMISSARY_ORDER_UNIT_VERSION);
  return Object.fromEntries(COMMISSARY_ORDER_ITEMS.map(({ id, legacyIds = [] }) => {
    const source = quantities?.[id] || legacyIds.map((legacyId) => quantities?.[legacyId]).find(Boolean) || {};
    const catalog = COMMISSARY_ITEM_BY_ID.get(id);
    const scale = orderUnitVersion < COMMISSARY_ORDER_UNIT_VERSION && catalog?.legacyOrderUnit === "quart" ? 0.25 : 1;
    return [id, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, sanitizeQuantity(sanitizeQuantity(source[delivery]) * scale)]))];
  }));
}

export function buildOrderRecord({ cafe, weekStart, quantities, grill, deli, global, now = new Date() }) {
  const normalized = isCafeStationEnabled(cafe, COMMISSARY_STATIONS.SALAD_BAR) ? normalizeQuantities(quantities) : emptyQuantities();
  const normalizedGrill = normalizeGrillOrder(grill, weekStart, cafe);
  const normalizedDeli = normalizeDeliOrder(deli, weekStart, cafe);
  const normalizedGlobal = normalizeGlobalOrder(global, weekStart, cafe);
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
    updatedAt: now.toISOString(),
  };
}

export function normalizePrepCompleted(completed = {}) {
  const allowedPrepIds = new Set([...COMMISSARY_ITEM_BY_ID.keys(), ...GRILL_LTO_PREP_ITEM_IDS, ...DELI_ORDERING_PREP_ITEM_IDS, ...GLOBAL_ORDERING_PREP_ITEM_IDS]);
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
  if (!DELIVERY_KEYS.includes(delivery) || (!COMMISSARY_ITEM_BY_ID.has(itemId) && !GRILL_LTO_PREP_ITEM_IDS.includes(itemId) && !DELI_ORDERING_PREP_ITEM_IDS.includes(itemId) && !GLOBAL_ORDERING_PREP_ITEM_IDS.includes(itemId))) return normalized;
  const current = new Set(normalized[delivery]);
  if (current.has(itemId)) current.delete(itemId);
  else current.add(itemId);
  return { ...normalized, [delivery]: [...current] };
}

export function orderValue(quantities = {}, grill = {}, deli = {}, global = {}, cafe = "") {
  const normalized = normalizeQuantities(quantities);
  const saladValue = cafe && !isCafeStationEnabled(cafe, COMMISSARY_STATIONS.SALAD_BAR) ? 0 : COMMISSARY_ORDER_ITEMS.reduce((sum, row) => {
    const delivery = normalized[row.id];
    return sum + DELIVERY_KEYS.reduce((deliverySum, key) => deliverySum + sanitizeQuantity(delivery[key]), 0) * row.orderUnitCost;
  }, 0);
  const grillValue = cafe && !isCafeStationEnabled(cafe, COMMISSARY_STATIONS.GRILL) ? 0 : ["A", "B"].reduce((sum, setKey) => {
    const item = grill?.items?.[setKey];
    const count = DELIVERY_KEYS.reduce((total, delivery) => total + wholeQuantity(grill?.quantities?.[setKey]?.[delivery]), 0);
    return sum + (Number.isFinite(Number(item?.itemWasteCost)) ? Number(item.itemWasteCost) * count : 0);
  }, 0);
  const deliValue = cafe && !isCafeStationEnabled(cafe, COMMISSARY_STATIONS.DELI) ? 0 : Object.entries(deli?.quantities || {}).reduce((sum, [mrn, values]) => {
    const item = deli?.items?.[mrn];
    const count = DELIVERY_KEYS.reduce((total, delivery) => total + wholeQuantity(values?.[delivery]), 0);
    return sum + (Number(item?.itemWasteCost) > 0 ? Number(item.itemWasteCost) * count : 0);
  }, 0);
  const selectedGlobalIds = effectiveGlobalIds(global);
  const globalValue = cafe && !isCafeStationEnabled(cafe, COMMISSARY_STATIONS.GLOBAL) ? 0 : Object.entries(global?.quantities || {}).reduce((sum, [id, values]) => {
    if (!selectedGlobalIds.has(id)) return sum;
    const item = global?.items?.[id];
    const count = DELIVERY_KEYS.reduce((total, delivery) => total + wholeQuantity(values?.[delivery]), 0);
    return sum + (Number(item?.itemWasteCost) > 0 ? Number(item.itemWasteCost) * count : 0);
  }, 0);
  return saladValue + grillValue + deliValue + globalValue;
}

export function rolledUpItems(records = [], options = {}) {
  const scopedRecords = records.filter((record) => isCafeStationEnabled(record.cafe, COMMISSARY_STATIONS.SALAD_BAR) && (!options.hub || cafeRoutesToHub(record.cafe, COMMISSARY_STATIONS.SALAD_BAR, options.hub)));
  return COMMISSARY_ORDER_ITEMS.map((row) => {
    const cafes = Object.fromEntries(scopedRecords.map((record) => {
      const values = normalizeQuantities(record.quantities, { orderUnitVersion: record.orderUnitVersion ?? 1 })[row.id];
      return [record.cafe, values];
    }));
    const deliveryTotals = Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, Object.values(cafes).reduce((sum, value) => sum + value[delivery], 0)]));
    return { ...row, station: "Salad Bar", cafes, ...deliveryTotals, total: DELIVERY_KEYS.reduce((sum, delivery) => sum + deliveryTotals[delivery], 0) };
  }).filter((row) => row.total > 0);
}

export function orderLinesForCafe(record = {}) {
  if (!isCafeStationEnabled(record.cafe, COMMISSARY_STATIONS.SALAD_BAR)) return [];
  const quantities = normalizeQuantities(record.quantities, { orderUnitVersion: record.orderUnitVersion ?? 1 });
  return Object.entries(quantities).map(([id, values]) => {
    const catalog = COMMISSARY_ITEM_BY_ID.get(id);
    return catalog ? { ...catalog, ...values, total: DELIVERY_KEYS.reduce((sum, delivery) => sum + values[delivery], 0) } : null;
  }).filter((line) => line && line.total > 0);
}

export function grillOrderLinesForCafe(record = {}) {
  const grill = normalizeGrillOrder(record.grill, record.weekStart, record.cafe);
  return ["A", "B"].map((setKey) => {
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
}

export function grillPrepLinesForCafe(record = {}) {
  return grillOrderLinesForCafe(record).flatMap((line) => (GRILL_LTO_PROGRAM.itemPrepComponents[line.mrn] || []).flatMap((component) => DELIVERY_KEYS.map((delivery) => ({
    ...component,
    category: component.type === "subrecipe" ? "Grill sub-recipe" : "Grill ingredient",
    station: "Grill",
    orderUnit: component.unit,
    cafe: record.cafe,
    finishedDish: line.name,
    delivery,
    quantity: Number((component.quantity * line[delivery]).toFixed(4)),
  })).filter(({ quantity }) => quantity > 0)));
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
  return deliOrderLinesForCafe(record).flatMap((line) => (DELI_ORDERING_PROGRAM.itemPrepComponents[line.mrn] || []).flatMap((component) => DELIVERY_KEYS.map((delivery) => ({
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
  return globalOrderLinesForCafe(record).flatMap((line) => (GLOBAL_ORDERING_PROGRAM.itemPrepComponents[line.id] || []).flatMap((component) => DELIVERY_KEYS.map((delivery) => ({
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

export function rolledUpPrepItems(records = [], options = {}) {
  const salad = rolledUpItems(records, options);
  const grillMap = new Map();
  records.flatMap((record) => [
    ...(options.hub && !cafeRoutesToHub(record.cafe, COMMISSARY_STATIONS.GRILL, options.hub) ? [] : grillPrepLinesForCafe(record)),
    ...(options.hub && !cafeRoutesToHub(record.cafe, COMMISSARY_STATIONS.DELI, options.hub) ? [] : deliPrepLinesForCafe(record)),
    ...(options.hub && !cafeRoutesToHub(record.cafe, COMMISSARY_STATIONS.GLOBAL, options.hub) ? [] : globalPrepLinesForCafe(record)),
  ]).forEach((line) => {
    const key = `${line.station}|${line.id}`;
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
  return [...salad, ...grill].filter((row) => row.total > 0);
}

const SAUCE_NAME = /(?:sauce|aioli|dressing|relish|chutney|salsa|mayo|mayonnaise|vinaigrette|pesto|dip|glaze)/i;
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
});

export function prepDisplayQuantity(row = {}) {
  const unit = String(row.orderUnit || "").trim().toLowerCase();
  const cupsPerUnit = VOLUME_TO_CUPS[unit];
  if (!cupsPerUnit || !SAUCE_NAME.test(`${row.name || ""} ${row.finishedDish || ""}`)) return row;
  const convert = (value) => Number((Number(value || 0) * cupsPerUnit).toFixed(4));
  const converted = {
    ...row,
    cafes: Object.fromEntries(Object.entries(row.cafes || {}).map(([cafe, values]) => [cafe, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, convert(values?.[delivery])]))])),
    ...Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, convert(row[delivery])])),
    total: convert(row.total),
    orderUnit: "cup",
  };
  const totalCups = converted.total;
  const target = totalCups >= 16 ? { unit: "gallon", divisor: 16 } : totalCups >= 4 ? { unit: "quart", divisor: 4 } : { unit: "cup", divisor: 1 };
  if (target.divisor === 1) return converted;
  const divide = (value) => Number((Number(value || 0) / target.divisor).toFixed(4));
  return {
    ...converted,
    cafes: Object.fromEntries(Object.entries(converted.cafes).map(([cafe, values]) => [cafe, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, divide(values?.[delivery])]))])),
    ...Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, divide(converted[delivery])])),
    total: divide(converted.total),
    orderUnit: target.unit,
  };
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
