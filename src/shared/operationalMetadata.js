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
import { DAILY_GLOBAL_PROGRAM, TWO_TWO_TWO_DAILY_GLOBAL_PROGRAM } from "../features/commissary-ordering/dailyGlobalCatalog.js";
import { GLOBAL_PREP_DISPLAY_POLICY } from "../features/commissary-ordering/globalPrepDisplayPolicy.js";
import { COMMISSARY_CAFE_STATION_ACCESS, COMMISSARY_HIDDEN_CAFE_STATION_ACCESS, COMMISSARY_HIDDEN_HUB_ROUTING, COMMISSARY_HUB_ROUTING, COMMISSARY_HUBS, COMMISSARY_PACKOUT_HUB_ROUTING } from "../features/commissary-ordering/commissaryRouting.js";
import { COMMISSARY_PREP_BOARD_START_WEEK, GLOBAL_UNIT_PREPARATION_NOTES, LEO_HAND_FRUIT, LEO_SITE_CAFES } from "../features/commissary-ordering/commissaryModel.js";
import { CRICKET_SOUP_ROUTING_EFFECTIVE_WEEK, ROXANNE_CRICKET_EFFECTIVE_WEEK, ROXANNE_CRICKET_ORDER_VERSION, ROXANNE_FLATBREAD_PROGRAM, SOUP_BAIN_FL_OZ } from "../features/commissary-ordering/roxanneCricketPrograms.js";
import { FRESH_FIVE_EFFECTIVE_WEEK, FRESH_FIVE_ITEMS, FRESH_FIVE_ORDER_VERSION } from "../features/commissary-ordering/freshFiveCatalog.js";

export const OPERATIONAL_METADATA_RECORD_ID = "platformMetadata|operations|current";
export const OPERATIONAL_METADATA_VERSION = 37;

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
  sharedMenuSource: Object.freeze({
    version: "menuworks-authoritative-2026-11-25",
    authority: "complete-menu-replacement",
    primaryStore: "supabase.recipe_items",
    crossUtility: Object.freeze(["Neighborhood Rotations", "Commissary Ordering", "Transfer Tool", "Recipe Library", "Menu Engineering"]),
    menus: Object.freeze([
      Object.freeze({ menu: "AMZ: Deli Core", rows: 165, sha256: "47a313bbc0e914cabdd13ce9530ece29dc9d6d5f11a3748ad0662d90323b2d33" }),
      Object.freeze({ menu: "AMZ: Cafe Express Curated Sandwiches", rows: 57, sha256: "1847e2122693aae0ee78dab26164bf37a08ac93e3b9b3c678d7f5480c41873ed" }),
      Object.freeze({ menu: "AMZ: Cafe Express Soup", rows: 70, sha256: "c75efbe48387ebb00fd12b5637beaa9f8002d2fa13a20a3e29dd3834c2465c43" }),
    ]),
    missingItemPolicy: "delete-from-shared-menu-scope",
    uncostedItemPolicy: "visible-as-cost-unavailable; never invent transfer value",
    culinaryProfilePersistence: "recipe-item-source-payload; reviewed profiles preserved; unresolved fields Needs review/Unknown",
  }),
  neighborhoodRotations: Object.freeze({
    dawsonMobyPopUp: Object.freeze({
      status: "retired",
      retiredVersion: "2026.11.20.001-dawson-moby-popup-retired",
      plannerVisibility: "removed-all-weeks",
      submissionRequirement: false,
      mobyCafeProjection: false,
      historicalRecords: "preserved-read-only",
      roxannePopUpIntegration: "preserved",
    }),
    roxannePopUp: Object.freeze({
      effectiveWeek: "2026-11-30",
      serviceDays: Object.freeze(["Tuesday", "Wednesday", "Thursday"]),
      deliveryMapping: Object.freeze({ monday: Object.freeze(["Tuesday", "Wednesday"]), wednesday: Object.freeze(["Thursday"]) }),
      stationOrder: "before-composed-salad",
      standingFridayPolicy: "preserve-until-operator-selects-move-or-clear",
    }),
  }),
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
    dailyGlobalProgram: DAILY_GLOBAL_PROGRAM,
    twoTwoTwoGlobalProgram: TWO_TWO_TWO_DAILY_GLOBAL_PROGRAM,
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
    dailyGlobalInterface: Object.freeze({
      eligibleCafes: Object.freeze(["Eclipse", "Gemini", "Odyssey", "Sonic", "Bingo", "Grace", "Blueshift", "Astra"]),
      cycleAnchor: "2026-12-07",
      cycleLengthWeeks: 12,
      selectionMode: "selectable-proteins-sides-and-extensions-for-sonic-blueshift-grace-bingo-astra; prescribed-plates-for-gemini-eclipse-odyssey",
      rotationModel: "continuous-two-service-day-blocks",
      rotationSequence: Object.freeze(["Taco Total Burrito Bowl", "Balti", "Teriyaki", "Porto", "Cypress", "Bibimbap"]),
      plateContentsVisibility: "shown-beneath-each-protein-option",
      weeklyOrderPlacement: "before-all-stations",
      productionScope: "complete-commissary-hot-and-cold-plate-including-garnish-except-unit-prepared-jasmine-rice",
      prepHub: "Blueshift",
      deliHub: "Sonic",
      transferValuation: "finished-plate-item-plus-waste",
      serviceDays: Object.freeze(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
      mealHandling: Object.freeze({ prepAndTransfer: "consolidated", packout: "separate-lunch-dinner-pastel-coded", weekendDelivery: "friday-for-saturday-and-sunday" }),
    }),
    leoSites: Object.freeze({
      cafes: LEO_SITE_CAFES,
      sandwichHub: "Sonic",
      includedHandFruit: LEO_HAND_FRUIT,
      hiddenSaladBar: Object.freeze({ stationAccess: COMMISSARY_HIDDEN_CAFE_STATION_ACCESS, hubRouting: COMMISSARY_HIDDEN_HUB_ROUTING, active: false }),
    }),
    roxanneDawsonIntegration: Object.freeze({
      version: 1,
      effectiveWeek: "2026-11-30",
      source: "submitted North/Dawson Neighborhood Rotation",
      popUpSources: Object.freeze(["Global", "Carvery"]),
      composedSaladSource: "Salad LTO automatic",
      quantityOwner: "Roxanne Coffee",
      quantityUnit: "whole items",
      prepProjection: "excluded; Dawson is not a commissary prep hub",
      transferWorkbook: Object.freeze({ cricketSheet: "SEA20 Cricket", dawsonSheet: "SEA27 Dawson" }),
    }),
    roxanneCricketPrograms: Object.freeze({
      version: ROXANNE_CRICKET_ORDER_VERSION,
      effectiveWeek: ROXANNE_CRICKET_EFFECTIVE_WEEK,
      receivingCafes: Object.freeze(["Roxanne Coffee", "Brazil Coffee"]),
      destinationRoutingEffectiveWeek: CRICKET_SOUP_ROUTING_EFFECTIVE_WEEK,
      prepHub: "Cricket",
      soup: Object.freeze({
        source: "submitted North/Cricket Neighborhood Rotation Soup station",
        menu: "AMZ: Cafe Express Soup",
        selectionRule: "two-authoritative-source-soups-per-service-day-with-independent-roxanne-and-brazil-routing",
        costUnavailableMrns: Object.freeze(["62071.1", "62082.2"]),
        costUnavailableBehavior: "visible-but-order-disabled; no invented transfer value",
        orderingUnit: "whole-6-quart-bains",
        bainFluidOunces: SOUP_BAIN_FL_OZ,
        costRule: "recipe-native-item-plus-waste-scaled-to-190-fl-oz",
        deliveryMapping: Object.freeze({ monday: "friday", tuesday: "monday", wednesday: "monday", thursday: "wednesday", friday: "wednesday" }),
      }),
      flatbread: ROXANNE_FLATBREAD_PROGRAM,
      prepProjection: "finished-item-counts-routed-to-cricket",
      transferValuation: "authoritative-item-plus-waste",
    }),
    freshFiveProgram: Object.freeze({ version: FRESH_FIVE_ORDER_VERSION, effectiveWeek: FRESH_FIVE_EFFECTIVE_WEEK, receivingCafe: "Roxanne Coffee", prepHub: "Cricket", sandwichesRouteTo: "Deli", saladsRouteTo: "Salad Bar", items: FRESH_FIVE_ITEMS }),
    prepBoard: Object.freeze({ version: 2, activeFromServiceWeek: COMMISSARY_PREP_BOARD_START_WEEK, hubs: Object.freeze(["Cricket", "Sonic", "Blueshift"]), completionPersistence: "supabase-shared" }),
    stationAccess: COMMISSARY_CAFE_STATION_ACCESS,
    hiddenStationAccess: COMMISSARY_HIDDEN_CAFE_STATION_ACCESS,
    prepHubs: COMMISSARY_HUBS,
    prepAccess: Object.freeze({ hubSitesOnly: true, selectedCafeBindsHub: true, allowedSites: Object.freeze(COMMISSARY_HUBS.map(({ key }) => key)) }),
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
      version: 4,
      effectiveDate: "2026-11-16",
      stations: Object.freeze(["Grill", "Global"]),
      rawAnimalProteins: "unit-supplied-excluded-from-prep-and-transfer",
      explicitlyPrecookedProteins: "commissary-generated-included",
      grillUnitSuppliedComponents: Object.freeze(["170538", "144591.1", "7411"]),
      transferValuation: "recipe-native-priced-retained-components; prep-display-volume-and-rounding-never-change-accounting",
      unresolvedComponentCost: "excluded-no-invented-allocation",
      globalRecipeResolution: "reviewed-nested-recipe-output-plus-required-direct-components",
      globalInUnitRice: "all-jasmine-rice-excluded-from-prep-and-transfer",
      globalInUnitExceptions: Object.freeze(["5365.6"]),
      globalExcludedSubrecipes: Object.freeze(["60487"]),
    }),
    prepInterface: Object.freeze({
      stationOrder: Object.freeze(["Salad Bar", "Fresh Five", "Soups", "Flatbreads", "Breakfast", "Deli", "Grill", "Daily Global", "Global"]),
      stationTabletFilter: Object.freeze({ enabled: true, includesAllStationsView: true }),
      productionGrouping: Object.freeze(["Vegetable Production", "Sauces", "Meat Production", "Stocking"]),
      familyAdjacency: true,
      sauceVolumeDisplay: "all-sauces-in-gallons; weight-derived-at-8-ounces-per-cup-except-pico-de-gallo-at-7",
      productionVolumeRounding: Object.freeze({
        incrementGallons: 0.5,
        direction: "up",
        scope: "each-cafe-each-delivery",
        appliesTo: "explicit-volume-units; approved-count-conversions; sauce-weight-conversions; approved-global-prep-display-conversions",
        transferCosting: "prep-display-only; Grill and Global transfer quantities remain recipe-native",
        unpricedRecipeComponents: "display-rounded-without-invented-component-cost",
      }),
      grillVolumeDisplay: Object.freeze({
        standardVolumeUnits: "cups-quarts-gallons",
        slicedTomatoesPerQuart: 26,
        slicedRedOnionsPerQuart: 32,
        icebergLeavesPerQuart: 10,
        pickleSlicesPerQuart: 75,
        handScoopedAvocado: "4-number-16-scoops-per-cup",
        preparedVegetableOuncesPerCup: 4,
        preparedVegetableMrns: Object.freeze(["78123.7", "62183.1", "77960.2", "81315", "19294.11", "76326", "1247", "53124", "4123", "4253", "8065", "77960.1", "55272", "7462"]),
        displayScope: "prep-list-only",
        transferAndGlQuantities: "recipe-native-unchanged",
      }),
      massDisplay: "kilograms-converted-to-pounds; deli-protein-ounces-converted-to-pounds",
      avocadoMashDisplay: "number-16-scoops-converted-to-gallons",
      grillHandScoopedAvocadoDisplay: "number-16-scoops-converted-to-gallons-for-prep-only",
      globalPrepDisplayPolicy: GLOBAL_PREP_DISPLAY_POLICY,
      autoReload: Object.freeze({ intervalSeconds: 15, onWindowFocus: true, onVisibilityRestore: true, pendingWriteProtection: "newer-local-progress-until-supabase-readback" }),
      generatedCompletionIds: "validated dynamic prep identifiers persisted for all hubs",
      looseStaples: "canola-kosher-salt-black-pepper-dried-spices-excluded-or-bundled-as-recipes",
      deliDeliveryMap: "finished-sandwich-counts",
      globalUnitPreparationNotes: GLOBAL_UNIT_PREPARATION_NOTES,
      globalMarinadePolicy: "six-week-reviewed-recipe-tree-minus-unit-protein",
      workbookVersion: 5,
      dailyPrepLists: Object.freeze({ friday: "Monday service", monday: "Tuesday-Wednesday service", wednesday: "Thursday-Friday service" }),
      exactMrnRollup: true,
      deliveryMapExactMrnRollup: "cafe-station-compatible-unit",
      packoutExactMrnRollup: "cafe-station-compatible-unit",
      grillGardenSalad: "whole-composed-salad-count",
      vegetableProductionNames: "singular-and-plural-produce-names",
      costsVisible: false,
      deliveryMapGrouping: "cafe-station-item",
      grillUnitSuppliedItems: Object.freeze(["brioche buns", "black bean burgers", "grilled chicken breast", "salt kosher"]),
      finishedItemTabletCounts: Object.freeze({ stations: Object.freeze(["Deli", "Breakfast"]), placement: "before-component-prep", completion: "shared-touch-check" }),
      visibleWorkbookColumns: Object.freeze(["Ingredient / item", "Total quantity", "Order unit", "Production section", "Finished dish"]),
      tabbedBoard: Object.freeze({
        activeFromServiceWeek: COMMISSARY_PREP_BOARD_START_WEEK,
        status: "live",
        phases: Object.freeze(["Production", "Assembly", "Pack Out"]),
        completionStorage: "commissary-prep-progress",
        currentAndFutureWeeks: true,
        productionDisplay: "prep-list-rounded-volume-and-weight-conversions",
        nativeQuantitiesPreserved: true,
        roundedCostingPreserved: true,
        productionExactMatchRollup: "mrn-and-display-unit-with-dish-breakdown",
        assemblyRule: "two-or-more-distinct-production-inputs",
        singleComponentFlow: "production-direct-to-packout",
        hiddenMinorIngredients: Object.freeze(["pan grilling spray", "kosher salt", "lemon juice", "lime juice"]),
        hiddenIngredientScope: "prep-board-only; transfer recipe quantities unchanged",
      }),
    }),
    packoutPacket: Object.freeze({
      version: 4,
      format: "pdf",
      source: "saved-supabase-commissary-orders",
      grouping: "cafe-delivery-station",
      selectionScope: "selected-unit-exact-or-selected-hub-station-routing",
      storageRecordType: "Commissary Packout Packet",
      emailDelivery: false,
    }),
    cutoff: Object.freeze({ dayOffsetFromMonday: -5, hour: 17, timeZone: "America/Los_Angeles" }),
    orderPersistence: Object.freeze({
      mode: "autosave",
      debounceMs: 500,
      trigger: "every-selection-and-quantity-edit",
      partialDrafts: true,
      standingOrderReductionConfirmation: true,
      manualSaveRequired: false,
    }),
    transferToolContract: Object.freeze({
      glAccountSource: "transferTool.glAccounts",
      profitCenterSource: "transferTool.units",
      exportVersionSource: "transferTool.s4ExportVersion",
      s4Description: "item for finished dish MRN, concise to 50 characters",
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
  sharedMenuSource: record.sharedMenuSource,
  neighborhoodRotations: record.neighborhoodRotations,
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
