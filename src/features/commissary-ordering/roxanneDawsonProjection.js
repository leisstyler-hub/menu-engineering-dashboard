export const ROXANNE_DAWSON_EFFECTIVE_WEEK = "2026-11-30";
export const ROXANNE_DAWSON_ORDER_VERSION = 1;

const DELIVERY_KEYS = Object.freeze(["friday", "monday", "wednesday"]);
const ROXANNE_CAFE = "Roxanne Coffee";
const DAWSON_PARENT_PREFIX = "rotation|";

const value = (record, keys) => keys.map((key) => record?.[key]).find((entry) => entry !== undefined && entry !== null && entry !== "") ?? "";
const text = (record, keys) => String(value(record, keys) || "").trim();
const number = (record, keys) => Number(value(record, keys) || 0);
const truthy = (record, keys) => {
  const raw = value(record, keys);
  return raw === true || String(raw || "").toLowerCase() === "true";
};
const slug = (input) => String(input || "").trim().toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
const emptyDeliveryQuantities = () => Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, 0]));

const recordId = (record) => text(record, ["Record ID", "recordId", "__supabaseRecordId"]);
const parentRecordId = (record) => text(record, ["Parent Record ID", "parentRecordId"]);
const freshness = (record) => Date.parse(text(record, ["Updated At", "Submitted At", "updatedAt", "submittedAt", "__supabaseUpdatedAt"])) || 0;

function newestByRecordId(records = []) {
  const latest = new Map();
  records.forEach((record, index) => {
    const id = recordId(record) || `missing-${index}`;
    const current = latest.get(id);
    if (!current || freshness(record) >= freshness(current)) latest.set(id, record);
  });
  return [...latest.values()];
}

function projectionItem(record, source) {
  const name = text(record, ["Menu Item / Selection", "Menu Item Selection", "itemName", "menuItemSelection"]);
  const selectionType = text(record, ["Selection Type", "selectionType"]);
  if (!name || /menu name/i.test(selectionType)) return null;
  const mrn = text(record, ["MRN", "mrn"]);
  const portion = text(record, ["Portion", "portion"]);
  const menu = text(record, ["Menu / Concept", "Menu Concept", "menuConcept", "menu"]);
  const itemWasteCost = number(record, ["True Cost", "trueCost", "Item + Waste Cost", "itemWasteCost"]);
  const identity = mrn || `${slug(name)}|${slug(portion)}`;
  return {
    id: `roxanne-dawson|${source}|${identity}`,
    source,
    station: source === "composedSalad" ? "Composed Salad" : "Pop-Up",
    menu,
    name,
    mrn,
    portion,
    selectionType,
    itemWasteCost,
  };
}

export function buildRoxanneDawsonProjection(rotationRecords = [], weekStart = "") {
  if (weekStart < ROXANNE_DAWSON_EFFECTIVE_WEEK) return null;
  const parentId = `${DAWSON_PARENT_PREFIX}${weekStart}|North|Dawson`;
  const records = newestByRecordId(rotationRecords);
  const header = records.find((record) => recordId(record) === parentId && text(record, ["Record Type", "recordType"]) === "Rotation Header");
  if (!header || text(header, ["Status", "status"]).toLowerCase() !== "submitted") return null;

  const includeGlobal = truthy(header, ["Roxanne Pop-Up Global", "roxannePopUpGlobal"]);
  const includeCarvery = truthy(header, ["Roxanne Pop-Up Carvery", "roxannePopUpCarvery"]);
  const childRecords = records.filter((record) => parentRecordId(record) === parentId && text(record, ["Status", "status"]).toLowerCase() === "submitted");
  const selected = childRecords.flatMap((record) => {
    const stationKey = text(record, ["Station Key", "stationKey"]);
    if (stationKey === "salad") return [projectionItem(record, "composedSalad")].filter(Boolean);
    if (includeGlobal && ["global", "promotion"].includes(stationKey)) return [projectionItem(record, "global")].filter(Boolean);
    if (includeCarvery && ["carvery", "carveryPromotion"].includes(stationKey)) return [projectionItem(record, "carvery")].filter(Boolean);
    return [];
  });
  const items = [...new Map(selected.map((item) => [item.id, item])).values()];
  return {
    version: ROXANNE_DAWSON_ORDER_VERSION,
    sourceCafe: "Dawson",
    receivingCafe: ROXANNE_CAFE,
    weekStart,
    submittedAt: text(header, ["Submitted At", "submittedAt"]),
    includeGlobal,
    includeCarvery,
    items,
  };
}

export function emptyRoxanneDawsonOrder() {
  return { version: ROXANNE_DAWSON_ORDER_VERSION, sourceSubmittedAt: "", items: {}, quantities: {} };
}

export function normalizeRoxanneDawsonOrder(source = {}, projection = null) {
  const existing = source && typeof source === "object" ? source : {};
  const projectedItems = projection?.items || Object.values(existing.items || {});
  const items = Object.fromEntries(projectedItems.map((item) => [item.id, { ...item, itemWasteCost: Number(item.itemWasteCost || 0) }]));
  const quantities = Object.fromEntries(projectedItems.map((item) => [item.id, {
    ...emptyDeliveryQuantities(),
    ...Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, Math.max(0, Math.floor(Number(existing.quantities?.[item.id]?.[delivery] || 0))) ])),
  }]));
  return {
    version: ROXANNE_DAWSON_ORDER_VERSION,
    sourceSubmittedAt: projection?.submittedAt || existing.sourceSubmittedAt || "",
    includeGlobal: projection?.includeGlobal ?? Boolean(existing.includeGlobal),
    includeCarvery: projection?.includeCarvery ?? Boolean(existing.includeCarvery),
    items,
    quantities,
  };
}

export function roxanneDawsonOrderLines(record = {}) {
  if (record.cafe !== ROXANNE_CAFE || String(record.weekStart || "") < ROXANNE_DAWSON_EFFECTIVE_WEEK) return [];
  const order = normalizeRoxanneDawsonOrder(record.roxanneDawson);
  return Object.values(order.items).map((item) => {
    const quantities = order.quantities[item.id] || emptyDeliveryQuantities();
    const total = DELIVERY_KEYS.reduce((sum, delivery) => sum + Number(quantities[delivery] || 0), 0);
    return { ...item, ...quantities, total, orderUnit: "item", orderUnitCost: Number(item.itemWasteCost || 0) };
  }).filter((line) => line.total > 0);
}

export function hasRoxanneDawsonProjection(cafe, weekStart) {
  return cafe === ROXANNE_CAFE && String(weekStart || "") >= ROXANNE_DAWSON_EFFECTIVE_WEEK;
}
