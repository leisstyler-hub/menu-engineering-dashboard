import { COMMISSARY_ITEM_BY_ID, COMMISSARY_ORDER_ITEMS } from "./commissaryCatalog.js";

export const PACIFIC_TIME_ZONE = "America/Los_Angeles";
export const DELIVERY_KEYS = Object.freeze(["monday", "wednesday"]);

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
  return Object.fromEntries(COMMISSARY_ORDER_ITEMS.map(({ id }) => [id, { monday: 0, wednesday: 0 }]));
}

export function sanitizeQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 100) / 100;
}

export function normalizeQuantities(quantities = {}) {
  return Object.fromEntries(COMMISSARY_ORDER_ITEMS.map(({ id }) => [id, {
    monday: sanitizeQuantity(quantities?.[id]?.monday),
    wednesday: sanitizeQuantity(quantities?.[id]?.wednesday),
  }]));
}

export function buildOrderRecord({ cafe, weekStart, quantities, now = new Date() }) {
  const normalized = normalizeQuantities(quantities);
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
    quantities: normalized,
    updatedAt: now.toISOString(),
  };
}

export function orderValue(quantities = {}) {
  return COMMISSARY_ORDER_ITEMS.reduce((sum, row) => {
    const delivery = quantities[row.id] || {};
    return sum + (sanitizeQuantity(delivery.monday) + sanitizeQuantity(delivery.wednesday)) * row.orderUnitCost;
  }, 0);
}

export function rolledUpItems(records = []) {
  return COMMISSARY_ORDER_ITEMS.map((row) => {
    const cafes = Object.fromEntries(records.map((record) => {
      const values = normalizeQuantities(record.quantities)[row.id];
      return [record.cafe, values];
    }));
    const monday = Object.values(cafes).reduce((sum, value) => sum + value.monday, 0);
    const wednesday = Object.values(cafes).reduce((sum, value) => sum + value.wednesday, 0);
    return { ...row, cafes, monday, wednesday, total: monday + wednesday };
  }).filter((row) => row.total > 0);
}

export function orderLinesForCafe(record = {}) {
  const quantities = normalizeQuantities(record.quantities);
  return Object.entries(quantities).map(([id, values]) => {
    const catalog = COMMISSARY_ITEM_BY_ID.get(id);
    return catalog ? { ...catalog, monday: values.monday, wednesday: values.wednesday, total: values.monday + values.wednesday } : null;
  }).filter((line) => line && line.total > 0);
}
