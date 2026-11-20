import assert from "node:assert/strict";
import {
  buildOperationalMetadataRecord,
  DEFAULT_OPERATIONAL_METADATA,
  isApprovedOperationalMetadataRecord,
  resolveOperationalMetadata,
} from "../src/shared/operationalMetadata.js";

const record = buildOperationalMetadataRecord(new Date("2026-10-28T12:00:00Z"));
assert.equal(isApprovedOperationalMetadataRecord(record), true);
assert.equal(resolveOperationalMetadata([record]).source, "supabase");
assert.equal(resolveOperationalMetadata([]).source, "fallback");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.orderItems.length, 41);
assert.equal(DEFAULT_OPERATIONAL_METADATA.metadataVersion, 31);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.items.length, 41);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.legacyItems.length, 41);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.source.effectiveDate, "2026-11-16");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.catalogSelection, "service-week-effective-date");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.culinaryProfiles.length, 41);
assert.ok(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.culinaryProfiles.every((profile) => profile.profileVersion === 1 && profile.identity?.mrn && profile.identity?.portion && profile.reviewStatus === "Needs review" && profile.cuisineMoniker === "Unknown" && (profile.provenance?.sourceSha256 || profile.provenance?.sourceRecord)));
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.source.sha256, "42E2DF61F1B97489ED2B9F27B81C86100B7D404E649099840829B23F76BB80F4");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.transferCatalogEnabled, true);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.retiredOrderItems.length, 13);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.previousItems.length, 41);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarCosting.categoryOrder, ["Leafy Greens", "Vegetables", "Proteins", "Cheeses", "Crunchy Toppers", "Dressings"]);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillProgram.anchorWeekStart, "2026-11-16");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillProgram.cycleLengthWeeks, 6);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillProgram.coreStartWeekByCafe.Atlas, "2026-11-09");
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillProgram.eligibleCafes, ["Cricket", "Nessie", "Dawson", "Atlas", "Bingo", "Grace", "Blueshift", "Sonic", "Astra", "Day 1", "Nitro", "Re:Invent"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillInterface, {
  density: "compact",
  contentPolicy: "complete",
  setLayout: "two-column-desktop",
  deliveryControls: "always-visible",
  coreItems: "permanent-optional-whole-item-quantities",
  sectionLayout: "single-section-lto-before-core",
});
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliCatalog.menu, "AMZ: Deli Core");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliCatalog.items.length, 20);
assert.equal(new Set(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliCatalog.items.map(({ mrn }) => mrn)).size, 20);
assert.deepEqual(
  DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliCatalog.unsupported.map(({ mrn }) => mrn),
  ["234913", "141826.1"],
);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliCatalog.itemSource, "supabase.recipe_items");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliCatalog.recipeDocumentSource, "supabase.recipe_item_documents");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliProgram.anchorWeekStart, "2026-11-16");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliProgram.cycleLengthWeeks, 4);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliProgram.cycleWeeks.map(({ items }) => items.length), [5, 5, 5, 6]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliProgram.standingOrderItemMrns, ["37394.7"]);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.standingOrderPolicy.catalogUpdatesNeverRewriteSavedOrders, true);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.saladBarWholeUnitPolicy.grandfatherExistingSplitQuantities, true);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliProgram.eligibleCafes, ["Cricket", "Nessie", "Dawson", "Blueshift", "Sonic", "Dynamo", "Gemini", "Eclipse", "Odyssey", "Doppler", "Day 1", "Re:Invent", "Brazil Coffee", "Roxanne Coffee", "Arizona Coffee", "Zoka Coffee"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepHubs.map(({ key }) => key), ["Cricket", "Sonic", "Blueshift"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepAccess, { hubSitesOnly: true, selectedCafeBindsHub: true, allowedSites: ["Cricket", "Sonic", "Blueshift"] });
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.stationAccess.Grace, ["global", "grill"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.stationAccess.Dynamo, ["deli"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Cricket.saladBar, ["Cricket", "Nessie", "Dawson", "Frontier"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Cricket.deli, ["Cricket", "Nessie", "Dawson", "Brazil Coffee", "Roxanne Coffee", "Zoka Coffee"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Cricket.breakfast, ["Brazil Coffee", "Roxanne Coffee", "Zoka Coffee"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Sonic.deli, ["Sonic", "Blueshift", "105", "Dynamo", "Gemini", "Eclipse", "Odyssey"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Blueshift.deli, ["Doppler", "Day 1", "Re:Invent", "Arizona Coffee"]);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProgram.anchorWeekStart, "2026-11-16");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProgram.cycleLengthWeeks, 6);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProgram.cycleWeeks.flatMap(({ menus }) => menus.flatMap(({ items }) => items)).length, 258);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProgram.extensionsIncluded, false);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalInterface, {
  menuSelection: "one-per-week",
  entreeSlots: 3,
  sideSlots: 4,
  sauceSlots: 2,
  subrecipes: "automatic-from-recipe",
  deliveryQuantities: "whole-portions",
});
assert.equal(DEFAULT_OPERATIONAL_METADATA.metadataVersion, 31);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProductionPolicy.version, 1);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProductionPolicy.rules["global|amz-porto|121026|1-piece"].outputs[0].mrn, "120715");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProductionPolicy.rules["global|amz-smokehouse-bbq|5365.6|5-ounce"].mode, "in-unit");
assert.ok(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProductionPolicy.excludedRecipeMrns.includes("60487"));
assert.equal(Object.values(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProductionPolicy.rules).flatMap(({ outputs }) => outputs).some(({ mrn }) => mrn === "60487"), false);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.packoutPacket.format, "pdf");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.packoutPacket.emailDelivery, false);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.stationOrder, ["Salad Bar", "Breakfast", "Deli", "Grill", "Daily Global", "Global"]);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.workbookVersion, 5);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.productionGrouping, ["Vegetable Production", "Sauces", "Meat Production", "Stocking"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.visibleWorkbookColumns, ["Ingredient / item", "Total quantity", "Order unit", "Production section", "Finished dish"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.finishedItemTabletCounts, { stations: ["Deli", "Breakfast"], placement: "before-component-prep", completion: "shared-touch-check" });
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.tabbedBoardPilot, { weekStart: "2027-01-04", status: "draft", phases: ["Production", "Assembly", "Pack Out"], completionStorage: "commissary-prep-progress", currentWeekIsolation: true, productionDisplay: "prep-list-rounded-volume-and-weight-conversions", nativeQuantitiesPreserved: true, roundedCostingPreserved: true });
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.orderPersistence, { mode: "autosave", debounceMs: 500, trigger: "every-selection-and-quantity-edit", partialDrafts: true, standingOrderReductionConfirmation: true, manualSaveRequired: false });
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.productionVolumeRounding, {
  incrementGallons: 0.5,
  direction: "up",
  scope: "each-cafe-each-delivery",
  appliesTo: "explicit-volume-units; approved-count-conversions; sauce-weight-conversions; approved-global-prep-display-conversions",
  transferCosting: "salad-native-unit-and-existing-priced-volume-components-scale; reviewed-global-display-policy-remains-recipe-native",
  unpricedRecipeComponents: "display-rounded-without-invented-component-cost",
});
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.grillVolumeDisplay.handScoopedAvocado, "4-number-16-scoops-per-cup");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.grillVolumeDisplay.preparedVegetableOuncesPerCup, 4);
assert.ok(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.grillVolumeDisplay.preparedVegetableMrns.includes("77960.2"));
assert.ok(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.grillVolumeDisplay.preparedVegetableMrns.includes("81315"));
assert.ok(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.grillVolumeDisplay.preparedVegetableMrns.includes("19294.11"));
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.grillVolumeDisplay.displayScope, "prep-list-only");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.grillVolumeDisplay.transferAndGlQuantities, "recipe-native-unchanged");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.globalPrepDisplayPolicy.version, 1);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.globalPrepDisplayPolicy.scope, "prep-list-only");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.globalPrepDisplayPolicy.transferAndGlQuantities, "recipe-native-unchanged");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.globalPrepDisplayPolicy.packageRules.find(({ mrn }) => mrn === "8061").trueCostEach, 6);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.globalPrepDisplayPolicy.packageRules.find(({ mrn }) => mrn === "8061").poundsPerPackage, 2.5);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.globalPrepDisplayPolicy.cutProduceCupsPerEach["96597"], 2);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.globalPrepDisplayPolicy.cutProduceCupsPerEach["50595"], 4);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.autoReload.intervalSeconds, 15);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.generatedCompletionIds, "validated dynamic prep identifiers persisted for all hubs");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.roxanneDawsonIntegration.effectiveWeek, "2026-11-30");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.roxanneDawsonIntegration.prepProjection, "excluded; Dawson is not a commissary prep hub");
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.roxanneDawsonIntegration.transferWorkbook, { cricketSheet: "SEA20 Cricket", dawsonSheet: "SEA27 Dawson" });
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.globalPrepDisplayPolicy.conditionalNativeWeightMrns, ["84052", "49473", "76662"]);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.packoutPacket.version, 4);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.dailyPrepLists, { friday: "Monday service", monday: "Tuesday-Wednesday service", wednesday: "Thursday-Friday service" });
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.exactMrnRollup, true);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.deliveryMapExactMrnRollup, "cafe-station-compatible-unit");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.vegetableProductionNames, "singular-and-plural-produce-names");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.costsVisible, false);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.deliveryMapGrouping, "cafe-station-item");
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.grillUnitSuppliedItems, ["brioche buns", "black bean burgers", "grilled chicken breast", "salt kosher"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.componentProductionPolicy.grillUnitSuppliedComponents, ["170538", "144591.1", "7411"]);
assert.match(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.massDisplay, /deli-protein-ounces-converted-to-pounds/);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Cricket.global, ["Cricket", "Nessie", "Dawson", "Frontier"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Sonic.global, []);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Blueshift.global, ["Bingo", "Grace", "Sonic", "Blueshift", "105", "Everest", "Astra", "Doppler", "Day 1", "Nitro", "Re:Invent"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Blueshift.dailyGlobal, ["Gemini", "Eclipse"]);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.dailyGlobalProgram.anchorWeekStart, "2026-11-23");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.dailyGlobalProgram.cycleLengthWeeks, 2);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.dailyGlobalInterface.productionScope, "complete-commissary-hot-and-cold-plate-including-garnish");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.dailyGlobalInterface.plateContentsVisibility, "shown-beneath-each-protein-option");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.dailyGlobalInterface.weeklyOrderPlacement, "before-all-stations");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.breakfastProgram.items.length, 28);
assert.ok(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.breakfastProgram.items.some(({ mrn }) => mrn === "17350.24"));
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.breakfastProgram.eligibleCafes, ["Brazil Coffee", "Roxanne Coffee", "Arizona Coffee", "Zoka Coffee"]);
assert.equal(DEFAULT_OPERATIONAL_METADATA.transferTool.units.length, 29);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.receivingCafes.length, 23);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.componentProductionPolicy.effectiveDate, "2026-11-16");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillInterface.coreItems, "permanent-optional-whole-item-quantities");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.departingUnit.profitCenter, "22472");
assert.equal(DEFAULT_OPERATIONAL_METADATA.transferTool.units.find(({ cafe }) => cafe === "Dawson").profitCenter, "28675");
assert.equal(DEFAULT_OPERATIONAL_METADATA.transferTool.units.find(({ cafe }) => cafe === "Commissary").profitCenter, "22472");
const expectedCommissaryProfitCenters = {
  Nessie: "30159",
  Cricket: "22472",
  Dawson: "28675",
  Sonic: "62102",
  Blueshift: "56746",
  Bingo: "53170",
  Grace: "53172",
  Everest: "30911",
  Dynamo: "61755",
  Gemini: "53169",
  Astra: "62844",
  Eclipse: "62100",
  Odyssey: "54245",
  Doppler: "30786",
  "Day 1": "30871",
  Nitro: "51641",
  "Re:Invent": "47622",
  "Brazil Coffee": "30783",
  "Roxanne Coffee": "28671",
  "Arizona Coffee": "28672",
  "Zoka Coffee": "28676",
  Atlas: "35983",
  Frontier: "53166",
};
for (const receiver of DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.receivingCafes) {
  assert.equal(receiver.profitCenter, expectedCommissaryProfitCenters[receiver.name]);
  assert.equal(
    receiver.profitCenter,
    DEFAULT_OPERATIONAL_METADATA.transferTool.units.find(({ cafe }) => cafe === receiver.name)?.profitCenter,
    `${receiver.name} must resolve its Commissary receiving profit center from the shared transfer-unit metadata.`,
  );
}
assert.ok(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.orderItems.every((item) => item.transferGlCode));
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.transferToolContract.glAccountSource, "transferTool.glAccounts");
const changed = structuredClone(record);
changed.transferTool.maxIngredientLines = 451;
assert.equal(isApprovedOperationalMetadataRecord(changed), false);
console.log("Operational metadata verification passed.");
