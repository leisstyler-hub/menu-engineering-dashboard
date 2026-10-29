import { COMMISSARY_ITEM_BY_ID, COMMISSARY_ORDER_ITEMS } from "./commissaryCatalog.js";
import { DEFAULT_COMMISSARY_METADATA } from "./commissaryMetadata.js";
import { GRILL_LTO_PREP_ITEM_IDS, GRILL_LTO_PROGRAM } from "./grillLtoCatalog.js";

export const PACIFIC_TIME_ZONE = "America/Los_Angeles";
export const DELIVERY_KEYS = Object.freeze(DEFAULT_COMMISSARY_METADATA.deliveries.map(({ key }) => key));
export const COMMISSARY_ORDER_UNIT_VERSION = 2;
export const COMMISSARY_GRILL_ORDER_VERSION = 1;

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
  return addDays(weekStart, -5);
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
  return GRILL_LTO_PROGRAM.eligibleCafes.includes(cafe);
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

export function buildOrderRecord({ cafe, weekStart, quantities, grill, now = new Date() }) {
  const normalized = normalizeQuantities(quantities);
  const normalizedGrill = normalizeGrillOrder(grill, weekStart, cafe);
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
    updatedAt: now.toISOString(),
  };
}

export function normalizePrepCompleted(completed = {}) {
  const allowedPrepIds = new Set([...COMMISSARY_ITEM_BY_ID.keys(), ...GRILL_LTO_PREP_ITEM_IDS]);
  return Object.fromEntries(DELIVERY_KEYS.map((delivery) => [
    delivery,
    [...new Set(Array.isArray(completed?.[delivery]) ? completed[delivery] : [])]
      .filter((itemId) => allowedPrepIds.has(itemId)),
  ]));
}

export function buildPrepProgressRecord({ weekStart, completed, now = new Date() }) {
  return {
    "Record ID": `commissaryOrder|prepProgress|${weekStart}`,
    "Record Type": "Commissary Prep Progress",
    Status: "In Progress",
    "Date Range Label": weekLabel(weekStart),
    "Visible In Dashboard": false,
    weekStart,
    completed: normalizePrepCompleted(completed),
    updatedAt: now.toISOString(),
  };
}

export function togglePrepCompleted(completed, delivery, itemId) {
  const normalized = normalizePrepCompleted(completed);
  if (!DELIVERY_KEYS.includes(delivery) || (!COMMISSARY_ITEM_BY_ID.has(itemId) && !GRILL_LTO_PREP_ITEM_IDS.includes(itemId))) return normalized;
  const current = new Set(normalized[delivery]);
  if (current.has(itemId)) current.delete(itemId);
  else current.add(itemId);
  return { ...normalized, [delivery]: [...current] };
}

export function orderValue(quantities = {}, grill = {}) {
  const normalized = normalizeQuantities(quantities);
  const saladValue = COMMISSARY_ORDER_ITEMS.reduce((sum, row) => {
    const delivery = normalized[row.id];
    return sum + DELIVERY_KEYS.reduce((deliverySum, key) => deliverySum + sanitizeQuantity(delivery[key]), 0) * row.orderUnitCost;
  }, 0);
  const grillValue = ["A", "B"].reduce((sum, setKey) => {
    const item = grill?.items?.[setKey];
    const count = DELIVERY_KEYS.reduce((total, delivery) => total + wholeQuantity(grill?.quantities?.[setKey]?.[delivery]), 0);
    return sum + (Number.isFinite(Number(item?.itemWasteCost)) ? Number(item.itemWasteCost) * count : 0);
  }, 0);
  return saladValue + grillValue;
}

export function rolledUpItems(records = []) {
  return COMMISSARY_ORDER_ITEMS.map((row) => {
    const cafes = Object.fromEntries(records.map((record) => {
      const values = normalizeQuantities(record.quantities, { orderUnitVersion: record.orderUnitVersion ?? 1 })[row.id];
      return [record.cafe, values];
    }));
    const deliveryTotals = Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, Object.values(cafes).reduce((sum, value) => sum + value[delivery], 0)]));
    return { ...row, cafes, ...deliveryTotals, total: DELIVERY_KEYS.reduce((sum, delivery) => sum + deliveryTotals[delivery], 0) };
  }).filter((row) => row.total > 0);
}

export function orderLinesForCafe(record = {}) {
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
    orderUnit: component.unit,
    cafe: record.cafe,
    finishedDish: line.name,
    delivery,
    quantity: Number((component.quantity * line[delivery]).toFixed(4)),
  })).filter(({ quantity }) => quantity > 0)));
}

export function rolledUpPrepItems(records = []) {
  const salad = rolledUpItems(records);
  const grillMap = new Map();
  records.flatMap(grillPrepLinesForCafe).forEach((line) => {
    const key = line.id;
    const current = grillMap.get(key) || {
      id: key,
      name: line.name,
      mrn: line.mrn,
      category: line.category,
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
