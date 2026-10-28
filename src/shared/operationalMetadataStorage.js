import { DEFAULT_OPERATIONAL_METADATA, resolveOperationalMetadata } from "./operationalMetadata.js";

const readJson = (response) => response.json().catch(() => ({}));

export async function loadOperationalMetadata() {
  const response = await fetch("/api/storage/records?tool=operationalMetadata&includeHidden=1");
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) return { ...DEFAULT_OPERATIONAL_METADATA, source: "fallback" };
  return resolveOperationalMetadata(Array.isArray(payload.records) ? payload.records : []);
}
