export const ROXANNE_CRICKET_EFFECTIVE_WEEK = "2026-11-30";
export const ROXANNE_CRICKET_ORDER_VERSION = 1;
export const ROXANNE_FLATBREAD_CYCLE_ANCHOR = "2026-11-30";

const DELIVERY_KEYS = Object.freeze(["friday", "monday", "wednesday"]);
const SERVICE_DAYS = Object.freeze([
  Object.freeze({ key: "monday", label: "Monday", delivery: "friday" }),
  Object.freeze({ key: "tuesday", label: "Tuesday", delivery: "monday" }),
  Object.freeze({ key: "wednesday", label: "Wednesday", delivery: "monday" }),
  Object.freeze({ key: "thursday", label: "Thursday", delivery: "wednesday" }),
  Object.freeze({ key: "friday", label: "Friday", delivery: "wednesday" }),
]);

const FLATBREADS = Object.freeze({
  "153945.26": Object.freeze({ mrn: "153945.26", name: "Chicken Pesto Flatbread", portion: "1 each", itemWasteCost: 4.2401 }),
  "118557.16": Object.freeze({ mrn: "118557.16", name: "Quattro Formaggi Flatbread", portion: "1 each", itemWasteCost: 2.401 }),
  "118557.18": Object.freeze({ mrn: "118557.18", name: "Sausage & Sage Flatbread", portion: "1 each", itemWasteCost: 2.626 }),
  "153945.31": Object.freeze({ mrn: "153945.31", name: "Catalina Flatbread", portion: "1 each", itemWasteCost: 3.9759 }),
  "153945.27": Object.freeze({ mrn: "153945.27", name: "BBQ Chicken Flatbread", portion: "1 each", itemWasteCost: 3.042 }),
  "153945.25": Object.freeze({ mrn: "153945.25", name: "Margherita Pesto Flatbread", portion: "1 each", itemWasteCost: 2.7331 }),
  "118557.19": Object.freeze({ mrn: "118557.19", name: "Pepperoni, Salami & Capicola Flatbread", portion: "1 each", itemWasteCost: 2.444 }),
  "118557.20": Object.freeze({ mrn: "118557.20", name: "Forager's Flatbread", portion: "1 each", itemWasteCost: 3.73 }),
  "153945.30": Object.freeze({ mrn: "153945.30", name: "Sicillian Flatbread", portion: "1 each", itemWasteCost: 2.8558 }),
  "153945.24": Object.freeze({ mrn: "153945.24", name: "Greek Flatbread", portion: "1 each", itemWasteCost: 3.068 }),
  "153945.23": Object.freeze({ mrn: "153945.23", name: "Pepperoni Flatbread", portion: "1 each", itemWasteCost: 2.6083 }),
  "130513.101": Object.freeze({ mrn: "130513.101", name: "Gourmet Veggie Flatbread", portion: "1 each", itemWasteCost: 2.705 }),
});

const FLATBREAD_WEEKS = Object.freeze([
  Object.freeze(["153945.26", "118557.16"]),
  Object.freeze(["118557.18", "153945.31"]),
  Object.freeze(["153945.27", "153945.25"]),
  Object.freeze(["118557.19", "118557.20"]),
  Object.freeze(["153945.30", "153945.24"]),
  Object.freeze(["153945.23", "130513.101"]),
]);

const value = (record, keys) => keys.map((key) => record?.[key]).find((entry) => entry !== undefined && entry !== null && entry !== "") ?? "";
const text = (record, keys) => String(value(record, keys) || "").trim();
const number = (record, keys) => Number(value(record, keys) || 0);
const recordId = (record) => text(record, ["Record ID", "recordId", "__supabaseRecordId"]);
const parentRecordId = (record) => text(record, ["Parent Record ID", "parentRecordId"]);
const freshness = (record) => Date.parse(text(record, ["Updated At", "Submitted At", "updatedAt", "submittedAt", "__supabaseUpdatedAt"])) || 0;
const emptyDelivery = () => Object.fromEntries(DELIVERY_KEYS.map((key) => [key, 0]));
const whole = (value) => Math.max(0, Math.floor(Number(value || 0)));

function latestRecords(records = []) {
  const latest = new Map();
  records.forEach((record, index) => {
    const id = recordId(record) || `missing-${index}`;
    if (!latest.has(id) || freshness(record) >= freshness(latest.get(id))) latest.set(id, record);
  });
  return [...latest.values()];
}

function weekIndex(weekStart) {
  const start = Date.parse(`${ROXANNE_FLATBREAD_CYCLE_ANCHOR}T00:00:00Z`);
  const current = Date.parse(`${weekStart}T00:00:00Z`);
  if (!Number.isFinite(current) || current < start) return -1;
  return Math.floor((current - start) / 604800000) % FLATBREAD_WEEKS.length;
}

export function roxanneFlatbreadCycleForWeek(weekStart = "") {
  const index = weekIndex(weekStart);
  if (index < 0) return null;
  return { week: index + 1, items: FLATBREAD_WEEKS[index].map((mrn) => ({ ...FLATBREADS[mrn], id: `roxanne-flatbread|${mrn}` })) };
}

export function buildRoxanneCricketSoupProjection(rotationRecords = [], weekStart = "") {
  if (String(weekStart) < ROXANNE_CRICKET_EFFECTIVE_WEEK) return null;
  const parentId = `rotation|${weekStart}|North|Cricket`;
  const records = latestRecords(rotationRecords);
  const header = records.find((record) => recordId(record) === parentId && text(record, ["Record Type", "recordType"]) === "Rotation Header");
  if (!header || text(header, ["Status", "status"]).toLowerCase() !== "submitted") return null;
  const items = records
    .filter((record) => parentRecordId(record) === parentId
      && text(record, ["Status", "status"]).toLowerCase() === "submitted"
      && text(record, ["Station Key", "stationKey", "station_key"]) === "soup")
    .map((record) => {
      const slot = Math.max(1, Number(text(record, ["Slot Number", "slotNumber"])) || 1);
      const day = SERVICE_DAYS[Math.min(SERVICE_DAYS.length - 1, Math.floor((slot - 1) / 2))];
      const mrn = text(record, ["MRN", "mrn"]);
      const name = text(record, ["Menu Item / Selection", "Menu Item Selection", "itemName", "menuItemSelection"]);
      const itemWasteCost = number(record, ["True Cost", "trueCost", "Item + Waste Cost", "itemWasteCost"]);
      if (!name || !mrn) return null;
      return {
        id: `roxanne-soup|${day.key}|${((slot - 1) % 2) + 1}|${mrn}`,
        station: "Soups",
        menu: "AMZ: Cafe Express Soup",
        name,
        mrn,
        portion: text(record, ["Portion", "portion"]) || "12 floz",
        itemWasteCost,
        serviceDay: day.key,
        serviceDayLabel: day.label,
        delivery: day.delivery,
        slot: ((slot - 1) % 2) + 1,
      };
    })
    .filter(Boolean)
    .sort((left, right) => SERVICE_DAYS.findIndex(({ key }) => key === left.serviceDay) - SERVICE_DAYS.findIndex(({ key }) => key === right.serviceDay) || left.slot - right.slot);
  return { version: ROXANNE_CRICKET_ORDER_VERSION, sourceCafe: "Cricket", receivingCafe: "Roxanne Coffee", weekStart, submittedAt: text(header, ["Submitted At", "submittedAt"]), items };
}

export function emptyRoxanneSoupOrder() {
  return { version: ROXANNE_CRICKET_ORDER_VERSION, sourceSubmittedAt: "", items: {}, quantities: {} };
}

export function normalizeRoxanneSoupOrder(source = {}, projection = null) {
  const existing = source && typeof source === "object" ? source : {};
  const projected = projection?.items || Object.values(existing.items || {});
  const items = Object.fromEntries(projected.map((item) => [item.id, { ...item, itemWasteCost: Number(item.itemWasteCost || 0) }]));
  const quantities = Object.fromEntries(projected.map((item) => [item.id, { ...emptyDelivery(), [item.delivery]: whole(existing.quantities?.[item.id]?.[item.delivery]) }]));
  return { version: ROXANNE_CRICKET_ORDER_VERSION, sourceSubmittedAt: projection?.submittedAt || existing.sourceSubmittedAt || "", items, quantities };
}

export function emptyRoxanneFlatbreadOrder(weekStart = "") {
  const cycle = roxanneFlatbreadCycleForWeek(weekStart);
  return { version: ROXANNE_CRICKET_ORDER_VERSION, cycleWeek: cycle?.week || 0, items: {}, quantities: {} };
}

export function normalizeRoxanneFlatbreadOrder(source = {}, weekStart = "") {
  const cycle = roxanneFlatbreadCycleForWeek(weekStart);
  if (!cycle) return emptyRoxanneFlatbreadOrder(weekStart);
  const existing = source && typeof source === "object" ? source : {};
  const items = Object.fromEntries(cycle.items.map((item) => [item.id, { ...item, ...(existing.items?.[item.id] || {}), itemWasteCost: item.itemWasteCost }]));
  const quantities = Object.fromEntries(cycle.items.map((item) => [item.id, Object.fromEntries(DELIVERY_KEYS.map((delivery) => [delivery, whole(existing.quantities?.[item.id]?.[delivery])]))]));
  return { version: ROXANNE_CRICKET_ORDER_VERSION, cycleWeek: cycle.week, items, quantities };
}

export function roxanneSoupOrderLines(record = {}) {
  if (record.cafe !== "Roxanne Coffee" || String(record.weekStart || "") < ROXANNE_CRICKET_EFFECTIVE_WEEK) return [];
  const order = normalizeRoxanneSoupOrder(record.roxanneSoup);
  return Object.values(order.items).map((item) => {
    const quantities = order.quantities[item.id] || emptyDelivery();
    const total = DELIVERY_KEYS.reduce((sum, delivery) => sum + whole(quantities[delivery]), 0);
    return { ...item, ...quantities, total, orderUnit: "12 oz portion", orderUnitCost: Number(item.itemWasteCost || 0) };
  }).filter(({ total }) => total > 0);
}

export function roxanneFlatbreadOrderLines(record = {}) {
  if (record.cafe !== "Roxanne Coffee" || String(record.weekStart || "") < ROXANNE_CRICKET_EFFECTIVE_WEEK) return [];
  const order = normalizeRoxanneFlatbreadOrder(record.roxanneFlatbreads, record.weekStart);
  return Object.values(order.items).map((item) => {
    const quantities = order.quantities[item.id] || emptyDelivery();
    const total = DELIVERY_KEYS.reduce((sum, delivery) => sum + whole(quantities[delivery]), 0);
    return { ...item, ...quantities, total, menu: "AMZ: Pizzas & Flatbreads", orderUnit: "flatbread", orderUnitCost: Number(item.itemWasteCost || 0) };
  }).filter(({ total }) => total > 0);
}

export const ROXANNE_FLATBREAD_PROGRAM = Object.freeze({
  menu: "AMZ: Pizzas & Flatbreads",
  effectiveWeek: ROXANNE_CRICKET_EFFECTIVE_WEEK,
  cycleAnchor: ROXANNE_FLATBREAD_CYCLE_ANCHOR,
  cycleLengthWeeks: 6,
  weeks: FLATBREAD_WEEKS,
  items: FLATBREADS,
});
