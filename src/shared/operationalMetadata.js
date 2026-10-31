import { CAFE_UNITS } from "./cafeUnits.js";
import { CAFE_PROFIT_CENTERS } from "../features/transfer-tool/cafeProfitCenters.js";
import { S4_GL_ACCOUNTS } from "../features/transfer-tool/s4GlAccounts.js";
import {
  COMMISSARY_DEPARTING_UNIT,
  COMMISSARY_ORDER_ITEMS,
} from "../features/commissary-ordering/commissaryCatalog.js";
import { DEFAULT_COMMISSARY_METADATA } from "../features/commissary-ordering/commissaryMetadata.js";
import { GRILL_LTO_PROGRAM } from "../features/commissary-ordering/grillLtoCatalog.js";
import { DELI_CORE_SELECTED_CATALOG } from "../features/commissary-ordering/deliCoreCatalog.js";
import { DELI_ORDERING_PROGRAM } from "../features/commissary-ordering/deliCycleCatalog.js";
import { GLOBAL_ORDERING_PROGRAM } from "../features/commissary-ordering/globalCycleCatalog.js";
import { COMMISSARY_CAFE_STATION_ACCESS, COMMISSARY_HUB_ROUTING, COMMISSARY_HUBS } from "../features/commissary-ordering/commissaryRouting.js";

export const OPERATIONAL_METADATA_RECORD_ID = "platformMetadata|operations|current";
export const OPERATIONAL_METADATA_VERSION = 9;

const transferUnits = CAFE_UNITS.map(({ district, cafe }) => ({
  district,
  cafe,
  profitCenter: CAFE_PROFIT_CENTERS[cafe] || "",
}));

const transferProfitCenters = new Map(transferUnits.map(({ cafe, profitCenter }) => [cafe, profitCenter]));
const commissaryReceivingCafes = DEFAULT_COMMISSARY_METADATA.receivingCafes.map(({ name, displayName }) => ({
  name,
  displayName,
  profitCenter: transferProfitCenters.get(name) || "",
}));

export const DEFAULT_OPERATIONAL_METADATA = Object.freeze({
  metadataVersion: OPERATIONAL_METADATA_VERSION,
  transferTool: Object.freeze({
    units: Object.freeze(transferUnits),
    glAccounts: S4_GL_ACCOUNTS,
    preparedFoodsGlCode: "4111011",
    s4ExportVersion: 1,
    maxIngredientLines: 450,
    menuItemSource: "supabase.recipe_items",
    ingredientAllocationSource: "supabase recipe components + Ingredient Costing snapshots",
  }),
  commissaryOrdering: Object.freeze({
    departingUnit: COMMISSARY_DEPARTING_UNIT,
    receivingCafes: Object.freeze(commissaryReceivingCafes),
    deliveries: DEFAULT_COMMISSARY_METADATA.deliveries,
    orderItems: COMMISSARY_ORDER_ITEMS,
    orderUnitVersion: 2,
    quantityIncrement: 0.25,
    grillProgram: GRILL_LTO_PROGRAM,
    deliCatalog: DELI_CORE_SELECTED_CATALOG,
    deliProgram: DELI_ORDERING_PROGRAM,
    globalProgram: GLOBAL_ORDERING_PROGRAM,
    globalInterface: Object.freeze({
      menuSelection: "one-per-week",
      entreeSlots: 3,
      sideSlots: 4,
      subrecipes: "automatic-from-recipe",
      deliveryQuantities: "whole-portions",
    }),
    stationAccess: COMMISSARY_CAFE_STATION_ACCESS,
    prepHubs: COMMISSARY_HUBS,
    hubRouting: COMMISSARY_HUB_ROUTING,
    grillInterface: Object.freeze({
      density: "compact",
      contentPolicy: "complete",
      setLayout: "two-column-desktop",
      deliveryControls: "always-visible",
    }),
    prepInterface: Object.freeze({
      stationOrder: Object.freeze(["Salad Bar", "Deli", "Grill", "Global"]),
      stationJumpNavigation: true,
      sauceVolumeDisplay: "cups-quarts-gallons-explicit-volume-units-only",
    }),
    packoutPacket: Object.freeze({
      version: 1,
      format: "pdf",
      source: "saved-supabase-commissary-orders",
      grouping: "cafe-delivery-station",
      storageRecordType: "Commissary Packout Packet",
      emailDelivery: false,
    }),
    cutoff: Object.freeze({ dayOffsetFromMonday: -5, hour: 17, timeZone: "America/Los_Angeles" }),
    transferToolContract: Object.freeze({
      glAccountSource: "transferTool.glAccounts",
      profitCenterSource: "transferTool.units",
      exportVersionSource: "transferTool.s4ExportVersion",
    }),
  }),
});

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
};

const comparable = (record = {}) => ({
  metadataVersion: Number(record.metadataVersion),
  transferTool: record.transferTool,
  commissaryOrdering: record.commissaryOrdering,
});

export function isApprovedOperationalMetadataRecord(record = {}) {
  return record["Record ID"] === OPERATIONAL_METADATA_RECORD_ID
    && record["Record Type"] === "Culinary Platform Operational Metadata"
    && JSON.stringify(canonicalize(comparable(record))) === JSON.stringify(canonicalize(DEFAULT_OPERATIONAL_METADATA));
}

export function buildOperationalMetadataRecord(now = new Date()) {
  return {
    "Record ID": OPERATIONAL_METADATA_RECORD_ID,
    "Record Type": "Culinary Platform Operational Metadata",
    Status: "Active",
    "Visible In Dashboard": false,
    ...DEFAULT_OPERATIONAL_METADATA,
    updatedAt: now.toISOString(),
  };
}

export function resolveOperationalMetadata(records = []) {
  const record = records.find((candidate) => candidate?.["Record ID"] === OPERATIONAL_METADATA_RECORD_ID);
  return isApprovedOperationalMetadataRecord(record)
    ? { ...comparable(record), source: "supabase" }
    : { ...DEFAULT_OPERATIONAL_METADATA, source: "fallback" };
}
