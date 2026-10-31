import { enabled as ssmtAccountsEnabled, guardLegacySsmtWrite, identity as ssmtIdentity } from "../../lib/ssmtServer.js";
import {
  buildBackboneRows,
  getBackboneDatabaseToolFromContext,
  getBackboneToolFromContext,
  normalizeBackboneRows,
} from "../../src/integrations/storage/backboneRecords.js";
import { isApprovedCommissaryMetadataRecord } from "../../src/features/commissary-ordering/commissaryMetadata.js";
import { COMMISSARY_BREAKFAST_ORDER_VERSION, COMMISSARY_DELI_ORDER_VERSION, COMMISSARY_GLOBAL_ORDER_VERSION, COMMISSARY_GRILL_ORDER_VERSION, COMMISSARY_ORDER_UNIT_VERSION, COMMISSARY_PACKOUT_PACKET_VERSION, COMMISSARY_STATION_ORDER, DELIVERY_KEYS, deliCycleForWeek, deliveryDateForWeek, globalCycleForWeek, grillCycleForWeek, isBreakfastEligibleCafe, isDeliEligibleCafe, isGlobalEligibleCafe, isGrillEligibleCafe, isWeekLocked } from "../../src/features/commissary-ordering/commissaryModel.js";
import { GRILL_LTO_PREP_ITEM_IDS } from "../../src/features/commissary-ordering/grillLtoCatalog.js";
import { DELI_ORDERING_PREP_ITEM_IDS } from "../../src/features/commissary-ordering/deliCycleCatalog.js";
import { GLOBAL_ORDERING_PREP_ITEM_IDS } from "../../src/features/commissary-ordering/globalCycleCatalog.js";
import { BREAKFAST_ORDERING_ITEM_IDS, BREAKFAST_ORDERING_PREP_ITEM_IDS, BREAKFAST_ORDERING_PROGRAM } from "../../src/features/commissary-ordering/breakfastCatalog.js";
import { COMMISSARY_HUBS, COMMISSARY_STATIONS, isCafeStationEnabled } from "../../src/features/commissary-ordering/commissaryRouting.js";
import { DEFAULT_OPERATIONAL_METADATA, isApprovedOperationalMetadataRecord, OPERATIONAL_METADATA_RECORD_ID } from "../../src/shared/operationalMetadata.js";
import { gzipSync, gunzipSync } from "node:zlib";

const DEFAULT_SUPABASE_URL = "https://pzilyzqhatthctgsjwtt.supabase.co";
const DEFAULT_SUPABASE_TIMEOUT_MS = 8000;
const DEFAULT_SUPABASE_WRITE_TIMEOUT_MS = 25000;
// Canonical shared-workspace record id - the live row that holds the SSMT
// workspace. Reads and writes target this id. `current-v2` is a legacy/alternate
// id from an abandoned migration that never materialized a row; accepted on read
// only. See ARCHITECTURE_RULES.md (SSMT workspace record id).
const SSMT_WORKSPACE_RECORD_ID = "ssmt|workspace|current";
const SSMT_LEGACY_WORKSPACE_RECORD_ID = "ssmt|workspace|current-v2";
const SSMT_WORKSPACE_ENCODING = "gzip-base64-json-v1";

function normalizeTransferTitle(value = "") {
  return String(value).normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function transferRecordId(title = "") {
  return `transfer|${encodeURIComponent(normalizeTransferTitle(title))}`;
}

const TRANSFER_UNITS = new Set(DEFAULT_OPERATIONAL_METADATA.transferTool.units.map(({ cafe }) => cafe));
const TRANSFER_GL_ACCOUNT_CODES = new Set(DEFAULT_OPERATIONAL_METADATA.transferTool.glAccounts.map(({ code }) => code));

function isTransferRecord(record = {}) {
  return String(record["Record Type"] || "") === "Transfer" || String(record["Record ID"] || "").startsWith("transfer|");
}

function validateTransferRecord(record = {}) {
  const title = String(record.title || "").trim();
  if (title.length < 3 || title.length > 100) return "Transfer title must be between 3 and 100 characters.";
  if (String(record["Record Type"] || "") !== "Transfer" || String(record["Record ID"] || "") !== transferRecordId(title)) {
    return "Transfer title and record identity do not match.";
  }
  if (!TRANSFER_UNITS.has(record.departingUnit) || !TRANSFER_UNITS.has(record.receivingUnit) || record.departingUnit === record.receivingUnit) {
    return "Transfer units are invalid or identical.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(record.transferDate || "")) || Number.isNaN(Date.parse(`${record.transferDate}T00:00:00Z`))) {
    return "Transfer date is invalid.";
  }
  if (!Array.isArray(record.items) || record.items.length === 0) return "A transfer requires at least one item.";
  if (record.items.some((item) => !item?.catalogId || !item?.menu || !item?.item || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || !Number.isFinite(Number(item.itemWasteCost)) || Number(item.itemWasteCost) < 0)) {
    return "Every transfer item requires catalog identity, a positive whole-number count, and a valid Item + Waste Cost.";
  }
  if (record.s4ExportVersion) {
    if (Number(record.s4ExportVersion) !== 1) return "Transfer S4 export version is unsupported.";
    if (!/^\d{5}$/.test(String(record.receivingProfitCenter || ""))) return "A 5-digit receiving profit center is required for S4 export.";
    if (record.departingProfitCenter && !/^\d{5}$/.test(String(record.departingProfitCenter))) return "Departing profit center snapshot is invalid.";
    if (String(record.eventId || "").length > 18) return "Event ID cannot exceed 18 characters.";
    const allocations = record.items.flatMap((item) => Array.isArray(item.ingredientAllocations) ? item.ingredientAllocations : []);
    if (allocations.length > DEFAULT_OPERATIONAL_METADATA.transferTool.maxIngredientLines) return `S4 transfers support no more than ${DEFAULT_OPERATIONAL_METADATA.transferTool.maxIngredientLines} ingredient lines.`;
    if (record.items.some((item) => !Array.isArray(item.ingredientAllocations) || !item.ingredientAllocations.length)) return "Every S4 transfer item requires a priced ingredient allocation.";
    if (allocations.some((allocation) => !TRANSFER_GL_ACCOUNT_CODES.has(String(allocation.glCode || "")) || !(Number(allocation.allocationPerPortion) > 0))) {
      return "Every ingredient allocation requires an approved G/L code and a positive amount.";
    }
    if (record.items.some((item) => {
      const allocated = item.ingredientAllocations.reduce((sum, allocation) => sum + Number(allocation.allocationPerPortion || 0), 0);
      return Math.abs(allocated - Number(item.itemWasteCost)) >= 0.0001;
    })) {
      return "Every ingredient allocation must equal its Item + Waste Cost; mapped G/L costs may never exceed the item cost.";
    }
  }
  const expectedTotal = record.items.reduce((sum, item) => sum + (Number(item.quantity) * (Array.isArray(item.ingredientAllocations) ? item.ingredientAllocations.reduce((allocationSum, allocation) => allocationSum + Number(allocation.allocationPerPortion || 0), 0) : 0)), 0);
  if (!Number.isFinite(Number(record.totalValue)) || Math.abs(Number(record.totalValue) - expectedTotal) > 0.000001) {
    return "Transfer total does not match its item counts and costs.";
  }
  return "";
}

function transferWriteValidation(records = [], context = {}) {
  const containsTransfer = records.some(isTransferRecord) || getBackboneToolFromContext(context) === "transfers";
  if (!containsTransfer) return "";
  if (records.length !== 1 || getBackboneToolFromContext(context) !== "transfers") return "A single transfer record with transfer context is required.";
  return validateTransferRecord(records[0]);
}

const COMMISSARY_CAFES = new Set(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.receivingCafes.map(({ name }) => name));
const COMMISSARY_ITEM_IDS = new Set(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.orderItems.map(({ id }) => id));
const COMMISSARY_PREP_IDS = new Set([...COMMISSARY_ITEM_IDS, ...GRILL_LTO_PREP_ITEM_IDS, ...DELI_ORDERING_PREP_ITEM_IDS, ...GLOBAL_ORDERING_PREP_ITEM_IDS, ...BREAKFAST_ORDERING_PREP_ITEM_IDS]);

export function commissaryWriteValidation(records = [], context = {}) {
  if (getBackboneToolFromContext(context) !== "commissaryOrders") return "";
  if (records.length !== 1) return "A single commissary record is required.";
  const record = records[0] || {};
  if (record["Record Type"] === "Commissary Metadata") {
    return isApprovedCommissaryMetadataRecord(record) ? "" : "The Commissary metadata does not match the approved release configuration.";
  }
  if (record["Record Type"] === "Commissary Prep Progress") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(record.weekStart || ""))) return "The commissary prep week is invalid.";
    if (!COMMISSARY_HUBS.some(({ key }) => key === record.hub)) return "The commissary prep hub is invalid.";
    if (record["Record ID"] !== `commissaryOrder|prepProgress|${record.hub.toLowerCase()}|${record.weekStart}`) return "The commissary prep progress identity is invalid.";
    if (!isWeekLocked(record.weekStart, new Date())) return "Prep progress is available after the commissary order cutoff.";
    if (!record.completed || typeof record.completed !== "object" || Array.isArray(record.completed)) return "Commissary prep completion data is required.";
    if (Object.keys(record.completed).some((delivery) => !DELIVERY_KEYS.includes(delivery))) return "The commissary prep delivery is invalid.";
    for (const delivery of DELIVERY_KEYS) {
      const itemIds = record.completed[delivery];
      if (!Array.isArray(itemIds) || new Set(itemIds).size !== itemIds.length || itemIds.some((itemId) => !COMMISSARY_PREP_IDS.has(itemId))) {
        return "Commissary prep completion contains an invalid or duplicate item.";
      }
    }
    return "";
  }
  if (record["Record Type"] === "Commissary Packout Packet") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(record.weekStart || ""))) return "The Packout Packet week is invalid.";
    if (record["Record ID"] !== `commissaryOrder|packoutPacket|${record.weekStart}`) return "The Packout Packet identity is invalid.";
    if (Number(record.version) !== COMMISSARY_PACKOUT_PACKET_VERSION) return "The Packout Packet version is unsupported.";
    if (Number.isNaN(Date.parse(record.generatedAt)) || !Number.isInteger(Number(record.cafeCount)) || Number(record.cafeCount) < 1 || Number(record.metadataVersion) !== DEFAULT_OPERATIONAL_METADATA.metadataVersion || record.Status !== "Generated" || record["Visible In Dashboard"] !== false) return "The Packout Packet generation metadata is invalid.";
    const orderReferencePattern = new RegExp(`^commissaryOrder\\|[^|]+\\|${record.weekStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
    if (!Array.isArray(record.orderRecordIds) || record.orderRecordIds.length < 1 || new Set(record.orderRecordIds).size !== record.orderRecordIds.length || record.orderRecordIds.some((id) => !orderReferencePattern.test(String(id)))) return "The Packout Packet order references are invalid.";
    if (!record.packet || Number(record.packet.version) !== COMMISSARY_PACKOUT_PACKET_VERSION || record.packet.weekStart !== record.weekStart || !Array.isArray(record.packet.pages) || !record.packet.pages.length || record.packet.pages.length > 100) return "The Packout Packet payload is invalid.";
    const pageKeys = record.packet.pages.map((page) => `${page.cafe}|${page.deliveryKey}`);
    const pageCafes = new Set(record.packet.pages.map(({ cafe }) => cafe));
    const expectedOrderIds = new Set([...pageCafes].map((cafe) => `commissaryOrder|${cafe.toLowerCase()}|${record.weekStart}`));
    if (new Set(pageKeys).size !== pageKeys.length || pageCafes.size !== Number(record.cafeCount) || expectedOrderIds.size !== record.orderRecordIds.length || record.orderRecordIds.some((id) => !expectedOrderIds.has(id))) return "The Packout Packet cafe and order-reference scope is inconsistent.";
    if (record.packet.pages.some((page) => {
      const delivery = DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliveries.find(({ key }) => key === page.deliveryKey);
      if (!COMMISSARY_CAFES.has(page.cafe) || !delivery || page.deliveryDate !== deliveryDateForWeek(record.weekStart, page.deliveryKey) || page.deliveryDay !== delivery.day || page.deliveryDetail !== delivery.detail || !Array.isArray(page.stations) || !page.stations.length) return true;
      if (new Set(page.stations.map(({ station }) => station)).size !== page.stations.length) return true;
      const stationIndexes = page.stations.map(({ station }) => COMMISSARY_STATION_ORDER.indexOf(station));
      if (stationIndexes.some((index, position) => index < 0 || (position > 0 && index <= stationIndexes[position - 1]))) return true;
      const lineKeys = page.stations.flatMap((group) => (group.lines || []).map((line) => `${group.station}|${line.id}|${line.orderUnit}`));
      if (new Set(lineKeys).size !== lineKeys.length) return true;
      return page.stations.some((group) => !Array.isArray(group.lines) || !group.lines.length || group.lines.length > 500 || group.lines.some((line) => {
        return line.station !== group.station
          || typeof line.id !== "string" || !line.id || line.id.length > 300
          || typeof line.name !== "string" || !line.name.trim() || line.name.length > 200
          || typeof line.orderUnit !== "string" || !line.orderUnit.trim() || line.orderUnit.length > 50
          || !Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0
          || String(line.mrn || "").length > 50 || String(line.finishedDish || "").length > 600;
      }));
    })) return "The Packout Packet contains an invalid cafe, delivery, station, or line.";
    return "";
  }
  if (record["Record Type"] !== "Commissary Order" || !COMMISSARY_CAFES.has(record.cafe)) return "The commissary cafe is invalid.";
  if (![1, COMMISSARY_ORDER_UNIT_VERSION].includes(Number(record.orderUnitVersion || 1))) return "The commissary order-unit version is invalid.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(record.weekStart || ""))) return "The commissary service week is invalid.";
  const expectedId = `commissaryOrder|${record.cafe.toLowerCase()}|${record.weekStart}`;
  if (record["Record ID"] !== expectedId) return "The commissary order identity is invalid.";
  const quantities = record.quantities;
  if (!quantities || typeof quantities !== "object" || Array.isArray(quantities)) return "Commissary delivery quantities are required.";
  for (const [itemId, delivery] of Object.entries(quantities)) {
    if (!COMMISSARY_ITEM_IDS.has(itemId)) return "The commissary order contains an unknown item.";
    if (!delivery || DELIVERY_KEYS.some((key) => !Number.isFinite(Number(delivery[key] ?? 0)) || Number(delivery[key] ?? 0) < 0)) {
      return "Commissary quantities must be zero or positive numbers.";
    }
  }
  if (!isCafeStationEnabled(record.cafe, COMMISSARY_STATIONS.SALAD_BAR) && Object.values(quantities).some((delivery) => DELIVERY_KEYS.some((key) => Number(delivery?.[key] || 0) > 0))) {
    return "Salad Bar ordering is not enabled for this cafe.";
  }
  const grillCycle = grillCycleForWeek(record.weekStart);
  if (grillCycle && isGrillEligibleCafe(record.cafe)) {
    if (Number(record.grill?.version) !== COMMISSARY_GRILL_ORDER_VERSION || Number(record.grill?.cycleWeek) !== grillCycle.week) return "The Grill LTO cycle is invalid.";
    for (const [setKey, options] of [["A", grillCycle.setA], ["B", grillCycle.setB]]) {
      const selected = String(record.grill?.selections?.[setKey] || "");
      if (!options.some(({ mrn }) => mrn === selected)) return `Choose one Grill LTO sandwich from Set ${setKey}.`;
      const item = record.grill?.items?.[setKey];
      if (!item || String(item.mrn) !== selected || !item.item || !(Number(item.itemWasteCost) > 0)) return `The Grill LTO Set ${setKey} cost snapshot is invalid.`;
      const delivery = record.grill?.quantities?.[setKey];
      if (!delivery || DELIVERY_KEYS.some((key) => !Number.isInteger(Number(delivery[key] ?? 0)) || Number(delivery[key] ?? 0) < 0)) return "Grill LTO quantities must be zero or positive whole sandwiches.";
    }
  } else if (Object.values(record.grill?.quantities || {}).some((delivery) => DELIVERY_KEYS.some((key) => Number(delivery?.[key] || 0) > 0))) {
    return "Grill ordering is not enabled for this cafe.";
  }
  const deliCycle = deliCycleForWeek(record.weekStart);
  if (deliCycle && isDeliEligibleCafe(record.cafe)) {
    if (Number(record.deli?.version) !== COMMISSARY_DELI_ORDER_VERSION || Number(record.deli?.cycleWeek) !== deliCycle.week) return "The Deli Core cycle is invalid.";
    const allowed = new Set(deliCycle.items.map(({ mrn }) => mrn));
    if (Object.keys(record.deli?.quantities || {}).some((mrn) => !allowed.has(mrn))) return "The Deli order contains an item outside the current cycle.";
    for (const { mrn } of deliCycle.items) {
      const delivery = record.deli?.quantities?.[mrn];
      if (!delivery || DELIVERY_KEYS.some((key) => !Number.isInteger(Number(delivery[key] ?? 0)) || Number(delivery[key] ?? 0) < 0)) return "Deli quantities must be zero or positive whole sandwiches.";
      const count = DELIVERY_KEYS.reduce((sum, key) => sum + Number(delivery[key] || 0), 0);
      const item = record.deli?.items?.[mrn];
      if (count > 0 && (!item || String(item.mrn) !== mrn || !item.item || !(Number(item.itemWasteCost) > 0))) return `The Deli cost snapshot for MRN ${mrn} is invalid.`;
    }
  } else if (Object.values(record.deli?.quantities || {}).some((delivery) => DELIVERY_KEYS.some((key) => Number(delivery?.[key] || 0) > 0))) {
    return "Deli ordering is not enabled for this cafe.";
  }
  const globalCycle = globalCycleForWeek(record.weekStart);
  if (globalCycle && isGlobalEligibleCafe(record.cafe)) {
    if (Number(record.global?.version) !== COMMISSARY_GLOBAL_ORDER_VERSION || Number(record.global?.cycleWeek) !== globalCycle.week) return "The Global cycle is invalid.";
    if (record.global?.legacyReviewRequired) return "Legacy Global quantities require explicit replacement with one menu before saving.";
    const options = globalCycle.menus.flatMap((menu) => menu.items);
    const allowed = new Map(options.map((item) => [item.id, item]));
    const menuNames = new Set(globalCycle.menus.map(({ menu }) => menu));
    const menu = String(record.global?.menu || "");
    if (menu && !menuNames.has(menu)) return "The selected Global menu is invalid.";
    const selections = record.global?.selections;
    if (!selections || !Array.isArray(selections.entrees) || selections.entrees.length !== 3 || !Array.isArray(selections.sides) || selections.sides.length !== 4) return "The Global entree and side slots are invalid.";
    const selectedIds = [...selections.entrees, ...selections.sides].filter(Boolean);
    if (new Set(selectedIds).size !== selectedIds.length) return "Global selections must be distinct.";
    if (selections.entrees.some((id) => id && (allowed.get(id)?.menu !== menu || allowed.get(id)?.category !== "entree"))) return "A Global entree is outside the selected menu.";
    if (selections.sides.some((id) => id && (allowed.get(id)?.menu !== menu || allowed.get(id)?.category !== "side"))) return "A Global side is outside the selected menu.";
    if (!menu && selectedIds.length) return "Choose a Global menu before selecting items.";
    const selected = new Set(selectedIds);
    if (Object.keys(record.global?.quantities || {}).some((id) => !allowed.has(id))) return "The Global order contains an item outside the current cycle.";
    for (const option of options) {
      const delivery = record.global?.quantities?.[option.id];
      if (!delivery || DELIVERY_KEYS.some((key) => !Number.isInteger(Number(delivery[key] ?? 0)) || Number(delivery[key] ?? 0) < 0)) return "Global quantities must be zero or positive whole portions.";
      const count = DELIVERY_KEYS.reduce((sum, key) => sum + Number(delivery[key] || 0), 0);
      if (count > 0 && !selected.has(option.id)) return "Global quantities require a selected entree or side slot.";
      const item = record.global?.items?.[option.id];
      if (count > 0 && (!item || item.id !== option.id || item.menu !== option.menu || String(item.mrn) !== option.mrn || item.portion !== option.portion || item.category !== option.category || !(Number(item.itemWasteCost) > 0))) {
        return `The Global cost snapshot for ${option.menu} MRN ${option.mrn} is invalid.`;
      }
    }
  } else if (Object.values(record.global?.quantities || {}).some((delivery) => DELIVERY_KEYS.some((key) => Number(delivery?.[key] || 0) > 0))) {
    return "Global ordering is not enabled for this cafe.";
  }
  const breakfastIds = new Set(BREAKFAST_ORDERING_ITEM_IDS);
  if (isBreakfastEligibleCafe(record.cafe)) {
    if (Number(record.breakfast?.version) !== COMMISSARY_BREAKFAST_ORDER_VERSION) return "The Breakfast order version is invalid.";
    const selections = record.breakfast?.selections;
    if (!Array.isArray(selections) || new Set(selections).size !== selections.length || selections.some((id) => !breakfastIds.has(id))) return "The Breakfast selections are invalid.";
    const selected = new Set(selections);
    if (Object.keys(record.breakfast?.quantities || {}).some((id) => !breakfastIds.has(id))) return "The Breakfast order contains an unknown item.";
    for (const option of BREAKFAST_ORDERING_PROGRAM.items) {
      const delivery = record.breakfast?.quantities?.[option.id];
      if (!delivery || DELIVERY_KEYS.some((key) => !Number.isInteger(Number(delivery[key] ?? 0)) || Number(delivery[key] ?? 0) < 0)) return "Breakfast quantities must be zero or positive whole items.";
      const count = DELIVERY_KEYS.reduce((sum, key) => sum + Number(delivery[key] || 0), 0);
      if (count > 0 && !selected.has(option.id)) return "Breakfast quantities require a selected item.";
      const item = record.breakfast?.items?.[option.id];
      if (count > 0 && (!item || item.id !== option.id || item.menu !== BREAKFAST_ORDERING_PROGRAM.menu || String(item.mrn) !== option.mrn || item.portion !== option.portion || !(Number(item.itemWasteCost) > 0))) {
        return `The Breakfast cost snapshot for MRN ${option.mrn} is invalid.`;
      }
    }
  } else if (Object.values(record.breakfast?.quantities || {}).some((delivery) => DELIVERY_KEYS.some((key) => Number(delivery?.[key] || 0) > 0))) {
    return "Breakfast ordering is not enabled for this cafe.";
  }
  if (isWeekLocked(record.weekStart, new Date())) return "This order is locked. Please contact commissary executive chef to adjust pars.";
  return "";
}

function cleanUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getSupabaseServerConfig() {
  const url = cleanUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
  const serviceKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();

  return {
    url,
    serviceKey,
    configured: Boolean(url && serviceKey),
  };
}

function supabaseTimeoutMs(fallback = DEFAULT_SUPABASE_TIMEOUT_MS) {
  const value = Number(process.env.SUPABASE_API_TIMEOUT_MS || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function supabaseFetch(path, options = {}, timeoutMs = DEFAULT_SUPABASE_TIMEOUT_MS) {
  const config = getSupabaseServerConfig();
  if (!config.configured) {
    const error = new Error("Supabase server key is not configured yet.");
    error.statusCode = 503;
    error.fallbackRecommended = true;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), supabaseTimeoutMs(timeoutMs));
  let response;
  try {
    response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Supabase storage request timed out.");
      timeoutError.statusCode = 504;
      timeoutError.fallbackRecommended = true;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `Supabase API error ${response.status}`);
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  return search.toString();
}

function ssmtWorkspaceRecordId(record = {}) {
  return String(record["Record ID"] || record.record_id || record.__supabaseRecordId || "").trim();
}

function compressSsmtWorkspaceRecord(record = {}) {
  if (![SSMT_WORKSPACE_RECORD_ID, SSMT_LEGACY_WORKSPACE_RECORD_ID].includes(ssmtWorkspaceRecordId(record))) return record;
  if (record.ssmtPayloadEncoding === SSMT_WORKSPACE_ENCODING && record.compressedWorkspace) return record;

  const json = JSON.stringify(record);
  const compressedWorkspace = gzipSync(Buffer.from(json, "utf8")).toString("base64");
  return {
    "Record ID": SSMT_WORKSPACE_RECORD_ID,
    "Record Type": record["Record Type"] || "SSMT Workspace",
    "Status": record.Status || record.status || "Draft",
    "Visible In Dashboard": record["Visible In Dashboard"] ?? true,
    ssmtPayloadEncoding: SSMT_WORKSPACE_ENCODING,
    compressedWorkspace,
    compressedWorkspaceBytes: Buffer.byteLength(compressedWorkspace, "utf8"),
    uncompressedWorkspaceBytes: Buffer.byteLength(json, "utf8"),
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
}

function expandSsmtWorkspaceRecord(record = {}) {
  if (record.ssmtPayloadEncoding !== SSMT_WORKSPACE_ENCODING || !record.compressedWorkspace) return record;
  try {
    const {
      ssmtPayloadEncoding,
      compressedWorkspace,
      compressedWorkspaceBytes,
      uncompressedWorkspaceBytes,
      ...metadata
    } = record;
    const inflated = JSON.parse(gunzipSync(Buffer.from(record.compressedWorkspace, "base64")).toString("utf8"));
    return {
      ...metadata,
      ...inflated,
      __supabaseRecordId: record.__supabaseRecordId,
      __supabaseUpdatedAt: record.__supabaseUpdatedAt,
      __supabaseRetainUntil: record.__supabaseRetainUntil,
    };
  } catch {
    return record;
  }
}

async function findStaleRowIds(parentRecordIds = [], nextRecordIds = []) {
  const nextIds = new Set(nextRecordIds.map(String));
  const staleIds = [];

  for (const parentId of parentRecordIds.map(String).filter(Boolean)) {
    const rows = await findRecordFamilyRows(parentId);
    for (const row of rows || []) {
      if (row.record_id && !nextIds.has(String(row.record_id))) staleIds.push(String(row.record_id));
    }
  }

  return Array.from(new Set(staleIds));
}

async function findRecordFamilyRows(recordId = "") {
  const trimmedRecordId = String(recordId || "").trim();
  if (!trimmedRecordId) return [];
  const directParams = queryString({
    select: "record_id",
    record_id: `eq.${trimmedRecordId}`,
  });
  const childParams = queryString({
    select: "record_id",
    parent_record_id: `eq.${trimmedRecordId}`,
  });
  const prefixParams = queryString({
    select: "record_id",
    record_id: `like.${trimmedRecordId}|*`,
  });
  const rows = [
    ...((await supabaseFetch(`app_records?${directParams}`)) || []),
    ...((await supabaseFetch(`app_records?${childParams}`)) || []),
    ...((await supabaseFetch(`app_records?${prefixParams}`)) || []),
  ];
  return dedupeRowsByRecordId(rows);
}

async function findRecordFamilyIds(recordIds = []) {
  const ids = [];
  for (const recordId of recordIds.map(String).filter(Boolean)) {
    const rows = await findRecordFamilyRows(recordId);
    rows.forEach((row) => {
      if (row.record_id) ids.push(String(row.record_id));
    });
  }
  return Array.from(new Set(ids));
}

async function deleteRecordIds(recordIds = []) {
  let deleted = 0;
  for (const recordId of recordIds.map(String).filter(Boolean)) {
    await supabaseFetch(`app_records?${queryString({ record_id: `eq.${recordId}` })}`, { method: "DELETE" });
    deleted += 1;
  }
  return deleted;
}

async function updateSingleExistingRecord(row) {
  const inserted = await supabaseFetch("app_records?on_conflict=record_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([row]),
  }, DEFAULT_SUPABASE_TIMEOUT_MS);
  return inserted;
}

function dedupeRowsByRecordId(rows = []) {
  const byRecordId = new Map();
  rows.forEach((row) => {
    const recordId = String(row?.record_id || "").trim();
    if (!recordId) return;
    byRecordId.set(recordId, row);
  });
  return Array.from(byRecordId.values());
}

async function loadAllSupabaseRows(basePath, params = {}, { pageSize = 1000, maxRows = 25000 } = {}) {
  const rows = [];
  let offset = 0;

  while (offset < maxRows) {
    const page = await supabaseFetch(`${basePath}?${queryString({
      ...params,
      limit: pageSize,
      offset,
    })}`);
    rows.push(...(page || []));
    if (!Array.isArray(page) || page.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function loadRecords(req, res) {
  const tool = getBackboneToolFromContext({ tool: req.query?.tool || "" });
  const databaseTool = getBackboneDatabaseToolFromContext({ tool });
  const healthOnly = String(req.query?.health || "") === "1";
  const includeHidden = String(req.query?.includeHidden || "") === "1";
  const params = {
    select: "record_id,updated_at,retain_until,record_payload",
    tool: `eq.${databaseTool}`,
    record_id: tool === "ssmt" ? `eq.${SSMT_WORKSPACE_RECORD_ID}` : tool === "transfers" ? "like.transfer|*" : tool === "commissaryOrders" ? "like.commissaryOrder|*" : tool === "operationalMetadata" ? `eq.${OPERATIONAL_METADATA_RECORD_ID}` : undefined,
    visible_in_dashboard: includeHidden ? undefined : "eq.true",
    order: "updated_at.desc",
  };
  const rows = healthOnly
    ? await supabaseFetch(`app_records?${queryString({ ...params, limit: "1" })}`)
    : await loadAllSupabaseRows("app_records", params);
  const records = normalizeBackboneRows(rows || []).map(expandSsmtWorkspaceRecord).filter((record) => {
    if (tool === "menuProjects") {
      return String(record["Record Type"] || "") === "Menu Project" || String(record["Record ID"] || "").startsWith("menuProject|");
    }
    if (tool === "ssmt") {
      return String(record["Record Type"] || "") === "SSMT Workspace" || String(record["Record ID"] || "").startsWith("ssmt|");
    }
    if (tool === "transfers") {
      return String(record["Record Type"] || "") === "Transfer" && String(record["Record ID"] || "").startsWith("transfer|");
    }
    if (tool === "commissaryOrders") {
      return ["Commissary Order", "Commissary Prep Progress", "Commissary Packout Packet", "Commissary Metadata"].includes(String(record["Record Type"] || ""))
        && String(record["Record ID"] || "").startsWith("commissaryOrder|");
    }
    if (tool === "operationalMetadata") return isApprovedOperationalMetadataRecord(record);
    if (ssmtAccountsEnabled() && String(record["Record ID"] || record.__supabaseRecordId || "").startsWith("ssmt|")) return false;
    return true;
  });
  const toolLabel = tool === "lean" ? "Lean" : tool === "menuProjects" ? "Menu Project" : tool === "ssmt" ? "SSMT" : tool === "commissaryOrders" ? "commissary order" : "rotation";

  return res.status(200).json({
    ok: true,
    source: "supabase",
    healthOnly,
    includeHidden,
    tool,
    databaseTool,
    records,
    count: records.length,
    message: healthOnly
      ? "Supabase secure storage endpoint is ready."
      : tool === "transfers"
        ? `Loaded ${records.length} transfer record${records.length === 1 ? "" : "s"} from Supabase.`
        : `Loaded ${records.length} ${toolLabel} record${records.length === 1 ? "" : "s"} from Supabase.`,
  });
}

async function upsertRecords(req, res) {
  const { records = [], context = {} } = req.body || {};
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ ok: false, message: "No records supplied." });
  }

  const transferValidationError = transferWriteValidation(records, context);
  if (transferValidationError) return res.status(400).json({ ok: false, message: transferValidationError });
  const commissaryValidationError = commissaryWriteValidation(records, context);
  if (commissaryValidationError) return res.status(400).json({ ok: false, message: commissaryValidationError });
  if (getBackboneToolFromContext(context) === "operationalMetadata"
    && (records.length !== 1 || !isApprovedOperationalMetadataRecord(records[0]))) {
    return res.status(400).json({ ok: false, message: "Operational metadata does not match the approved release configuration." });
  }
  if (getBackboneToolFromContext(context) === "transfers") {
    const record = records[0];
    const existing = await supabaseFetch(`app_records?${queryString({ select: "record_id,record_payload", record_id: `eq.${record["Record ID"]}`, limit: "1" })}`);
    if (!existing?.length) return res.status(409).json({ ok: false, message: "Transfer no longer exists. Copy it into a new globally unique title." });
    const existingTitle = String(existing[0]?.record_payload?.title || "");
    if (existingTitle !== String(record.title || "")) return res.status(409).json({ ok: false, message: "Saved transfer titles are immutable. Copy the transfer to use a new title." });
  }

  const packedRecords = getBackboneToolFromContext(context) === "ssmt"
    ? records.map(compressSsmtWorkspaceRecord)
    : records;
  const rawRows = buildBackboneRows(packedRecords, context);
  const rows = dedupeRowsByRecordId(rawRows);
  if (!rows.length) {
    return res.status(400).json({ ok: false, message: "No records had a Record ID." });
  }

  const replaceParentRecordIds = Array.isArray(context.replaceParentRecordIds) ? context.replaceParentRecordIds : [];
  const staleRowIds = replaceParentRecordIds.length
    ? await findStaleRowIds(replaceParentRecordIds, rows.map((row) => row.record_id))
    : [];

  if (rows.length === 1 && rows[0]?.record_id === SSMT_WORKSPACE_RECORD_ID) {
    await updateSingleExistingRecord(rows[0]);
  } else {
    await supabaseFetch("app_records?on_conflict=record_id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    }, DEFAULT_SUPABASE_WRITE_TIMEOUT_MS);
  }

  const deletedStale = await deleteRecordIds(staleRowIds);

  return res.status(200).json({
    ok: true,
    source: "supabase",
    tool: rows[0]?.tool || "records",
    synced: rows.length,
    duplicateRowsSkipped: rawRows.length - rows.length,
    deletedStale,
    message: `Saved ${rows.length} row${rows.length === 1 ? "" : "s"} to Supabase${rawRows.length - rows.length ? ` after skipping ${rawRows.length - rows.length} duplicate row instance${rawRows.length - rows.length === 1 ? "" : "s"}` : ""}${deletedStale ? ` and removed ${deletedStale} stale row${deletedStale === 1 ? "" : "s"}` : ""}.`,
  });
}

async function createTransfer(req, res) {
  const { records = [], context = {} } = req.body || {};
  if (!Array.isArray(records)) return res.status(400).json({ ok: false, message: "A single transfer record is required." });
  const validationError = transferWriteValidation(records, context);
  if (validationError) return res.status(400).json({ ok: false, message: validationError });
  const record = records[0];
  const expectedId = record["Record ID"];
  const existing = await supabaseFetch(`app_records?${queryString({ select: "record_id", record_id: `eq.${expectedId}`, limit: "1" })}`);
  if (existing?.length) {
    return res.status(409).json({ ok: false, message: "That transfer title already exists. Titles must be globally unique." });
  }
  const rows = buildBackboneRows(records, context);
  try {
    await supabaseFetch("app_records", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    }, DEFAULT_SUPABASE_WRITE_TIMEOUT_MS);
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ ok: false, message: "That transfer title already exists. Titles must be globally unique." });
    }
    throw error;
  }
  return res.status(201).json({ ok: true, source: "supabase", tool: "transfers", synced: 1, message: "Created shared transfer draft." });
}

async function deleteRecords(req, res) {
  const requestedIds = Array.isArray(req.body?.recordIds) ? req.body.recordIds.map(String).filter(Boolean) : [];
  if (!requestedIds.length) {
    return res.status(400).json({ ok: false, message: "No record IDs supplied for delete." });
  }

  const recordFamilyIds = await findRecordFamilyIds(requestedIds);
  const deleted = await deleteRecordIds(recordFamilyIds.length ? recordFamilyIds : requestedIds);

  return res.status(200).json({
    ok: true,
    source: "supabase",
    action: "deleteRecords",
    requested: requestedIds.length,
    deleted,
    recordIds: recordFamilyIds,
    message: `Deleted ${deleted} Supabase row${deleted === 1 ? "" : "s"} for ${requestedIds.length} requested record${requestedIds.length === 1 ? "" : "s"}.`,
  });
}

async function deleteTransfer(req, res) {
  const rawRecordId = req.body?.recordId;
  const recordId = typeof rawRecordId === "string" ? rawRecordId.trim() : "";
  if (getBackboneToolFromContext(req.body?.context) !== "transfers" || !/^transfer\|[^|]+$/.test(recordId)) {
    return res.status(400).json({ ok: false, message: "A valid transfer record and transfer context are required for delete." });
  }

  const recordFamilyIds = await findRecordFamilyIds([recordId]);
  const deletedIds = recordFamilyIds.length ? recordFamilyIds : [recordId];
  const deleted = await deleteRecordIds(deletedIds);
  return res.status(200).json({
    ok: true,
    source: "supabase",
    action: "deleteTransfer",
    deleted,
    recordId,
    message: "Deleted the saved transfer draft.",
  });
}

async function cleanupExpiredRecords(res) {
  const payload = await supabaseFetch("rpc/cleanup_expired_app_records", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return res.status(200).json({
    ok: true,
    source: "supabase",
    cleanup: payload,
    message: "Supabase retention cleanup completed.",
  });
}

export default async function handler(req, res) {
  try {
    if (ssmtAccountsEnabled()) {
      if (req.method === "POST" && (guardLegacySsmtWrite(req.body) || req.body?.action === "cleanupExpiredRecords")) return res.status(403).json({ ok: false, message: "SSMT changes require the authenticated SSMT endpoint. Bulk cleanup is disabled while SSMT protection is active." });
      if (req.method === "GET" && getBackboneToolFromContext({tool:req.query?.tool}) === "ssmt") await ssmtIdentity(req);
    }
    if (req.method === "GET") return await loadRecords(req, res);
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    if (req.body?.action === "cleanupExpiredRecords") return await cleanupExpiredRecords(res);
    if (req.body?.action === "deleteTransfer") return await deleteTransfer(req, res);
    if (req.body?.action === "deleteRecords") return await deleteRecords(req, res);
    if (req.body?.action === "createTransfer") return await createTransfer(req, res);
    if (req.body?.action !== "upsertRecords") {
      return res.status(400).json({ ok: false, message: "Unsupported action." });
    }
    return await upsertRecords(req, res);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      source: "supabase",
      fallbackRecommended: Boolean(error.fallbackRecommended || error.statusCode === 503),
      message: error.message || "Supabase storage failed.",
      details: error.payload || null,
    });
  }
}
