export const COMMISSARY_METADATA_RECORD_ID = "commissaryOrder|metadata|current";
export const COMMISSARY_METADATA_VERSION = 3;

const RECEIVING_CAFES = Object.freeze([
  Object.freeze({ name: "Nessie", displayName: "Nessie", profitCenter: "30159" }),
  Object.freeze({ name: "Cricket", displayName: "Cricket", profitCenter: "22472" }),
  Object.freeze({ name: "Dawson", displayName: "Dawson", profitCenter: "28675" }),
  Object.freeze({ name: "Sonic", displayName: "Sonic", profitCenter: "62102" }),
  Object.freeze({ name: "Blueshift", displayName: "Blueshift", profitCenter: "56746" }),
  Object.freeze({ name: "Bingo", displayName: "Bingo", profitCenter: "53170" }),
  Object.freeze({ name: "Grace", displayName: "Grace", profitCenter: "53172" }),
  Object.freeze({ name: "Everest", displayName: "Everest", profitCenter: "30911" }),
  Object.freeze({ name: "Dynamo", displayName: "Dynamo", profitCenter: "61755" }),
  Object.freeze({ name: "Gemini", displayName: "Gemini", profitCenter: "53169" }),
  Object.freeze({ name: "Astra", displayName: "Astra", profitCenter: "62844" }),
  Object.freeze({ name: "Eclipse", displayName: "Eclipse", profitCenter: "62100" }),
  Object.freeze({ name: "Odyssey", displayName: "Odyssey", profitCenter: "54245" }),
  Object.freeze({ name: "Doppler", displayName: "Doppler", profitCenter: "30786" }),
  Object.freeze({ name: "Day 1", displayName: "Day 1", profitCenter: "30871" }),
  Object.freeze({ name: "Nitro", displayName: "Nitro", profitCenter: "51641" }),
  Object.freeze({ name: "Re:Invent", displayName: "Re:Invent", profitCenter: "47622" }),
  Object.freeze({ name: "Brazil Coffee", displayName: "Brazil Coffee", profitCenter: "30783" }),
  Object.freeze({ name: "Roxanne Coffee", displayName: "Roxanne Coffee", profitCenter: "28671" }),
  Object.freeze({ name: "Arizona Coffee", displayName: "Arizona Coffee", profitCenter: "28672" }),
]);

const DELIVERIES = Object.freeze([
  Object.freeze({ key: "friday", day: "Friday", title: "Friday delivery", detail: "Monday service", titleEs: "Entrega del viernes", detailEs: "Servicio del lunes" }),
  Object.freeze({ key: "monday", day: "Monday", title: "Monday delivery", detail: "Tuesday–Wednesday service", titleEs: "Entrega del lunes", detailEs: "Servicio de martes a miércoles" }),
  Object.freeze({ key: "wednesday", day: "Wednesday", title: "Wednesday delivery", detail: "Thursday–Friday service", titleEs: "Entrega del miércoles", detailEs: "Servicio de jueves a viernes" }),
]);

export const DEFAULT_COMMISSARY_METADATA = Object.freeze({
  metadataVersion: COMMISSARY_METADATA_VERSION,
  receivingCafes: RECEIVING_CAFES,
  deliveries: DELIVERIES,
});

const comparableMetadata = (record = {}) => ({
  metadataVersion: Number(record.metadataVersion),
  receivingCafes: record.receivingCafes,
  deliveries: record.deliveries,
});

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
};

export function isApprovedCommissaryMetadataRecord(record = {}) {
  return record["Record ID"] === COMMISSARY_METADATA_RECORD_ID
    && record["Record Type"] === "Commissary Metadata"
    && JSON.stringify(canonicalize(comparableMetadata(record))) === JSON.stringify(canonicalize(DEFAULT_COMMISSARY_METADATA));
}

export function buildCommissaryMetadataRecord(now = new Date()) {
  return {
    "Record ID": COMMISSARY_METADATA_RECORD_ID,
    "Record Type": "Commissary Metadata",
    Status: "Active",
    "Visible In Dashboard": false,
    ...DEFAULT_COMMISSARY_METADATA,
    updatedAt: now.toISOString(),
  };
}

export function resolveCommissaryMetadata(records = []) {
  const record = records.find((candidate) => candidate?.["Record ID"] === COMMISSARY_METADATA_RECORD_ID);
  return isApprovedCommissaryMetadataRecord(record)
    ? { ...comparableMetadata(record), source: "supabase" }
    : { ...DEFAULT_COMMISSARY_METADATA, source: "fallback" };
}
