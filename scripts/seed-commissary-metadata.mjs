import assert from "node:assert/strict";

import {
  buildCommissaryMetadataRecord,
  COMMISSARY_METADATA_RECORD_ID,
  isApprovedCommissaryMetadataRecord,
} from "../src/features/commissary-ordering/commissaryMetadata.js";

const baseUrlIndex = process.argv.indexOf("--base-url");
const baseUrl = baseUrlIndex >= 0 ? String(process.argv[baseUrlIndex + 1] || "").replace(/\/$/, "") : "";
const checkOnly = process.argv.includes("--check");

if (!baseUrl) throw new Error("Pass the intended deployment with --base-url <https://...>.");

const endpoint = `${baseUrl}/api/storage/records?tool=commissaryOrders&includeHidden=1`;
const readRecords = async () => {
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) throw new Error(payload.message || `Unable to read Commissary metadata (${response.status}).`);
  return payload.records || [];
};

if (!checkOnly) {
  const record = buildCommissaryMetadataRecord();
  const response = await fetch(`${baseUrl}/api/storage/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action: "upsertRecords", records: [record], context: { tool: "commissaryOrders" } }),
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) throw new Error(payload.message || `Unable to save Commissary metadata (${response.status}).`);
}

const records = await readRecords();
const metadata = records.find((record) => record["Record ID"] === COMMISSARY_METADATA_RECORD_ID);
assert.ok(metadata, "The shared Commissary metadata record was not returned.");
assert.equal(isApprovedCommissaryMetadataRecord(metadata), true, "The shared Commissary metadata does not match the approved release configuration.");
console.log(JSON.stringify({
  ok: true,
  mode: checkOnly ? "check" : "upsert-and-check",
  recordId: COMMISSARY_METADATA_RECORD_ID,
  metadataVersion: metadata.metadataVersion,
  receivingCafes: metadata.receivingCafes.length,
  deliveries: metadata.deliveries.map(({ key }) => key),
}, null, 2));
