import { buildOperationalMetadataRecord } from "../src/shared/operationalMetadata.js";

const baseUrl = String(process.env.CULINARY_PLATFORM_URL || "").replace(/\/$/, "");
if (!baseUrl) throw new Error("Set CULINARY_PLATFORM_URL to the deployed Culinary Platform URL.");

const response = await fetch(`${baseUrl}/api/storage/records`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "upsertRecords", records: [buildOperationalMetadataRecord()], context: { tool: "operationalMetadata" } }),
});
const payload = await response.json().catch(() => ({}));
if (!response.ok || payload.ok === false) throw new Error(payload.message || "Operational metadata seed failed.");

const readback = await fetch(`${baseUrl}/api/storage/records?tool=operationalMetadata&includeHidden=1`).then((result) => result.json());
if (!readback.ok || readback.count !== 1) throw new Error("Operational metadata readback did not return exactly one approved record.");
console.log(JSON.stringify({ seeded: payload.synced, recordId: readback.records[0]["Record ID"], source: readback.source }, null, 2));
