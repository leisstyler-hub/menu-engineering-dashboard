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
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.departingUnit.profitCenter, "22472");
assert.equal(DEFAULT_OPERATIONAL_METADATA.transferTool.units.find(({ cafe }) => cafe === "Dawson").profitCenter, "28675");
assert.equal(DEFAULT_OPERATIONAL_METADATA.transferTool.units.find(({ cafe }) => cafe === "Commissary").profitCenter, "22472");
assert.ok(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.orderItems.every((item) => item.transferGlCode));
assert.equal(DEFAULT_OPERATIONAL_METADATA.commissaryOrdering.transferToolContract.glAccountSource, "transferTool.glAccounts");
const changed = structuredClone(record);
changed.transferTool.maxIngredientLines = 451;
assert.equal(isApprovedOperationalMetadataRecord(changed), false);
console.log("Operational metadata verification passed.");
