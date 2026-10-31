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
assert.equal(DEFAULT_OPERATIONAL_METADATA.metadataVersion, 9);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillProgram.anchorWeekStart, "2026-11-16");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillProgram.cycleLengthWeeks, 6);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillProgram.eligibleCafes, ["Cricket", "Nessie", "Dawson", "Bingo", "Grace", "Blueshift", "Sonic", "Astra"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.grillInterface, {
  density: "compact",
  contentPolicy: "complete",
  setLayout: "two-column-desktop",
  deliveryControls: "always-visible",
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
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliProgram.cycleWeeks.map(({ items }) => items.length), [5, 5, 6, 6]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.deliProgram.eligibleCafes, ["Cricket", "Nessie", "Dawson", "Blueshift", "Sonic", "Dynamo", "Gemini", "Eclipse", "Odyssey"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepHubs.map(({ key }) => key), ["Cricket", "Sonic", "Blueshift"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.stationAccess.Grace, ["global", "grill"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.stationAccess.Dynamo, ["deli"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Cricket.saladBar, ["Cricket", "Nessie", "Dawson"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Sonic.deli, ["Sonic", "Blueshift", "105", "Dynamo", "Gemini", "Eclipse", "Odyssey"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Blueshift.deli, []);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProgram.anchorWeekStart, "2026-11-16");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProgram.cycleLengthWeeks, 6);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProgram.cycleWeeks.flatMap(({ menus }) => menus.flatMap(({ items }) => items)).length, 258);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalProgram.extensionsIncluded, false);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.globalInterface, {
  menuSelection: "one-per-week",
  entreeSlots: 3,
  sideSlots: 4,
  subrecipes: "automatic-from-recipe",
  deliveryQuantities: "whole-portions",
});
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.packoutPacket.format, "pdf");
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.packoutPacket.emailDelivery, false);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.prepInterface.stationOrder, ["Salad Bar", "Deli", "Grill", "Global"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Cricket.global, ["Cricket", "Nessie", "Dawson"]);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Sonic.global, []);
assert.deepEqual(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.hubRouting.Blueshift.global, ["Bingo", "Grace", "Sonic", "Blueshift", "105", "Everest", "Gemini", "Astra"]);
assert.equal(DEFAULT_OPERATIONAL_METADATA.transferTool.units.length, 25);
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.receivingCafes.length, 13);
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
