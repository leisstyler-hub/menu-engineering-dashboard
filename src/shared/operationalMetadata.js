import { CAFE_UNITS } from "./cafeUnits.js";
import { CAFE_PROFIT_CENTERS } from "../features/transfer-tool/cafeProfitCenters.js";
import { S4_GL_ACCOUNTS } from "../features/transfer-tool/s4GlAccounts.js";
import {
  COMMISSARY_DEPARTING_UNIT,
  COMMISSARY_LEGACY_ORDER_ITEMS,
  COMMISSARY_ORDER_ITEMS,
  COMMISSARY_PREVIOUS_ORDER_ITEMS,
  COMMISSARY_RETIRED_ORDER_ITEMS,
  SALAD_BAR_CATEGORY_ORDER,
  SALAD_BAR_CULINARY_PROFILE_MANIFEST,
  SALAD_BAR_COST_SOURCE,
  SALAD_BAR_PACKAGE_OVERRIDE_SOURCE,
} from "../features/commissary-ordering/commissaryCatalog.js";
import { DEFAULT_COMMISSARY_METADATA } from "../features/commissary-ordering/commissaryMetadata.js";
import { GRILL_LTO_PROGRAM } from "../features/commissary-ordering/grillLtoCatalog.js";
import { DELI_CORE_SELECTED_CATALOG } from "../features/commissary-ordering/deliCoreCatalog.js";
import { DELI_ORDERING_PROGRAM } from "../features/commissary-ordering/deliCycleCatalog.js";
import { GLOBAL_ORDERING_PROGRAM } from "../features/commissary-ordering/globalCycleCatalog.js";
import { GLOBAL_COMMISSARY_PRODUCTION } from "../features/commissary-ordering/globalProductionCatalog.js";
import { BREAKFAST_ORDERING_PROGRAM } from "../features/commissary-ordering/breakfastCatalog.js";
import { COMMISSARY_CAFE_STATION_ACCESS, COMMISSARY_HUB_ROUTING, COMMISSARY_HUBS, COMMISSARY_PACKOUT_HUB_ROUTING } from "../features/commissary-ordering/commissaryRouting.js";
import { GLOBAL_UNIT_PREPARATION_NOTES } from "../features/commissary-ordering/commissaryModel.js";

export const OPERATIONAL_METADATA_RECORD_ID = "platformMetadata|operations|current";
export const OPERATIONAL_METADATA_VERSION = 18;

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
    retiredOrderItems: COMMISSARY_RETIRED_ORDER_ITEMS,
    saladBarCosting: Object.freeze({
      version: 3,
      source: SALAD_BAR_COST_SOURCE,
      packageUnitOverride: SALAD_BAR_PACKAGE_OVERRIDE_SOURCE,
      menu: "Commissary Salad Bar",
      items: COMMISSARY_ORDER_ITEMS,
      previousItems: COMMISSARY_PREVIOUS_ORDER_ITEMS,
      legacyItems: COMMISSARY_LEGACY_ORDER_ITEMS,
      categoryOrder: SALAD_BAR_CATEGORY_ORDER,
      catalogSelection: "service-week-effective-date",
      culinaryProfiles: SALAD_BAR_CULINARY_PROFILE_MANIFEST,
      culinaryProfilePersistence: "operational-metadata-companion; canonical shared profile domain not yet approved",
      transferCatalogEnabled: true,
      historicalRowsPreserved: true,
    }),
    orderUnitVersion: 2,
    quantityIncrement: 0.25,
    standingOrderPolicy: Object.freeze({
      version: 1,
      catalogUpdatesNeverRewriteSavedOrders: true,
      retiredSelectionsRemainVisible: true,
      quantityReductionRequiresExplicitOperatorConfirmation: true,
      serverBaselineCheck: "saved-record-updatedAt",
    }),
    saladBarWholeUnitPolicy: Object.freeze({
      categories: Object.freeze(["dressings", "vinaigrettes", "leafy greens", "cheeses"]),
      products: Object.freeze(["spring mix", "arugula", "chopped kale", "cottage cheese", "blue cheese", "feta", "cheddar"]),
      increment: 1,
      grandfatherExistingSplitQuantities: true,
    }),
    grillProgram: GRILL_LTO_PROGRAM,
    deliCatalog: DELI_CORE_SELECTED_CATALOG,
    deliProgram: DELI_ORDERING_PROGRAM,
    globalProgram: GLOBAL_ORDERING_PROGRAM,
    globalProductionPolicy: GLOBAL_COMMISSARY_PRODUCTION,
    breakfastProgram: BREAKFAST_ORDERING_PROGRAM,
    breakfastInterface: Object.freeze({
      menu: "AMZ: Breakfast",
      includedTypes: Object.freeze(["sandwich", "croissant", "bagel", "burrito"]),
      excludedTypes: Object.freeze(["plate", "side", "cereal", "taco", "toast", "wrap", "chia", "extension"]),
      itemSelection: "compact-add-item",
      deliveryQuantities: "whole-portions",
      prepProjection: "exact-recipe-components",
    }),
    globalInterface: Object.freeze({
      menuSelection: "one-per-week",
      entreeSlots: 3,
      sideSlots: 4,
      sauceSlots: 2,
      subrecipes: "automatic-from-recipe",
      deliveryQuantities: "whole-portions",
    }),
    stationAccess: COMMISSARY_CAFE_STATION_ACCESS,
    prepHubs: COMMISSARY_HUBS,
    hubRouting: COMMISSARY_HUB_ROUTING,
    packoutHubRouting: COMMISSARY_PACKOUT_HUB_ROUTING,
    grillInterface: Object.freeze({
      density: "compact",
      contentPolicy: "complete",
      setLayout: "two-column-desktop",
      deliveryControls: "always-visible",
      coreItems: "permanent-optional-whole-item-quantities",
      sectionLayout: "single-section-lto-before-core",
    }),
    componentProductionPolicy: Object.freeze({
      version: 2,
      effectiveDate: "2026-11-16",
      stations: Object.freeze(["Grill", "Global"]),
      rawAnimalProteins: "unit-supplied-excluded-from-prep-and-transfer",
      explicitlyPrecookedProteins: "commissary-generated-included",
      transferValuation: "priced-retained-recipe-components-only",
      unresolvedComponentCost: "excluded-no-invented-allocation",
      globalRecipeResolution: "reviewed-nested-recipe-output-with-direct-component-fallback",
      globalInUnitExceptions: Object.freeze(["5365.6"]),
      globalExcludedSubrecipes: Object.freeze(["60487"]),
    }),
    prepInterface: Object.freeze({
      stationOrder: Object.freeze(["Salad Bar", "Breakfast", "Deli", "Grill", "Global"]),
      stationJumpNavigation: true,
      productionGrouping: Object.freeze(["Vegetable Production", "Cold Sauce Production", "Hot Sauce Production", "Other Production"]),
      familyAdjacency: true,
      sauceVolumeDisplay: "cups-quarts-gallons-explicit-volume-units-only",
      grillVolumeDisplay: "cups-quarts-gallons",
      massDisplay: "kilograms-converted-to-pounds",
      avocadoMashDisplay: "number-16-scoops-converted-to-gallons",
      looseStaples: "canola-kosher-salt-black-pepper-dried-spices-excluded-or-bundled-as-recipes",
      deliDeliveryMap: "finished-sandwich-counts",
      globalUnitPreparationNotes: GLOBAL_UNIT_PREPARATION_NOTES,
      globalMarinadePolicy: "six-week-reviewed-recipe-tree-minus-unit-protein",
      workbookVersion: 2,
      dailyPrepLists: Object.freeze({ friday: "Monday service", monday: "Tuesday-Wednesday service", wednesday: "Thursday-Friday service" }),
      exactMrnRollup: true,
      costsVisible: false,
      deliveryMapGrouping: "cafe-station-item",
      grillUnitSuppliedItems: Object.freeze(["brioche buns"]),
    }),
    packoutPacket: Object.freeze({
      version: 1,
      format: "pdf",
      source: "saved-supabase-commissary-orders",
      grouping: "cafe-delivery-station",
      selectionScope: "selected-unit-exact-or-selected-hub-station-routing",
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
