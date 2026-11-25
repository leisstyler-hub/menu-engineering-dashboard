const normalize = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const slug = (value) => normalize(value).replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";

export function menuWorksReplacementIdentity(row = {}) {
  return JSON.stringify([
    normalize(row.menu),
    normalize(row.station),
    String(row.mrn ?? "").trim(),
    normalize(row.portion),
  ]);
}

function rowsByIdentity(rows = []) {
  const result = new Map();
  for (const row of rows) {
    const key = menuWorksReplacementIdentity(row);
    const entries = result.get(key) || [];
    entries.push(row);
    result.set(key, entries);
  }
  return result;
}

function existingDescription(row = {}) {
  if (!row) return "";
  const value = String(row.enticingDescription || "").trim();
  return value && value !== "No description loaded yet." ? value : "";
}

function needsReviewProfile(row, itemKey, source) {
  const mrn = String(row.mrn || "").trim();
  return {
    profileVersion: 2,
    identity: { itemKey, mrn, rawMrn: mrn, portion: row.portion || "", menu: row.menu || "" },
    identityStatus: "Exact authoritative MenuWorks identity",
    reviewStatus: "Needs review",
    servicePlacement: ["Unknown"],
    cuisineMoniker: ["Unknown"],
    culinaryRole: "Unknown",
    seasonality: ["Unknown"],
    flavor: ["Unknown"],
    texture: ["Unknown"],
    premiumHighlight: "Unknown",
    tact: {
      version: 1,
      taste: { values: [], status: "Needs review", evidence: [], issues: ["No reviewed TACT evidence in the source export."] },
      aroma: { values: [], status: "Needs review", evidence: [], issues: ["No reviewed TACT evidence in the source export."] },
      color: { values: [], status: "Needs review", evidence: [], issues: ["No reviewed TACT evidence in the source export."] },
      texture: { values: [], status: "Needs review", evidence: [], issues: ["No reviewed TACT evidence in the source export."] },
    },
    provenance: {
      sourceFile: source.fileName,
      sourceSha256: source.sha256,
      sourceVersion: source.version,
      basis: "Authoritative MenuWorks menu-item export; classifications remain unreviewed.",
    },
    persistenceStatus: "Stored with the shared Supabase recipe-item payload",
  };
}

function newItemKey(row, occurrence) {
  return `menuworks:${slug(row.menu)}:${slug(row.station)}:${slug(row.mrn)}:${slug(row.portion)}:${occurrence + 1}`;
}

export function buildAuthoritativeMenuReplacement(incomingRows = [], currentRows = [], source = {}) {
  const currentByIdentity = rowsByIdentity(currentRows);
  const seen = new Map();
  const rows = incomingRows.map((incoming) => {
    const identity = menuWorksReplacementIdentity(incoming);
    const occurrence = seen.get(identity) || 0;
    seen.set(identity, occurrence + 1);
    const current = (currentByIdentity.get(identity) || [])[occurrence] || null;
    const itemKey = current?.item_key || newItemKey(incoming, occurrence);
    const currentProfile = current?.culinaryProfile || null;
    const importedDescription = String(incoming.enticingDescription || "").trim();
    const preservedDescription = !importedDescription ? existingDescription(current) : "";
    return {
      ...(current || {}),
      ...incoming,
      item_key: itemKey,
      id: current?.id ?? current?.sourceRowId ?? itemKey,
      enticingDescription: importedDescription || preservedDescription,
      menuWorksDescription: importedDescription,
      primaryDescriptionSource: importedDescription ? "menuworks-authoritative-replacement" : preservedDescription ? "source-truth-preserved" : "menuworks-authoritative-replacement",
      dataSource: "menuworks-authoritative-replacement",
      sourceDataVersion: source.version,
      sourceFileName: source.fileName,
      sourceTruthName: "Authoritative MenuWorks complete menu replacement",
      sourceSha256: source.sha256,
      culinaryProfile: currentProfile || needsReviewProfile(incoming, itemKey, source),
    };
  });
  const activeKeys = new Set(rows.map((row) => row.item_key));
  const removed = currentRows.filter((row) => row.item_key && !activeKeys.has(row.item_key));
  return { rows, removed };
}

export function replacementProfileSummary(rows = []) {
  return {
    rows: rows.length,
    storedProfiles: rows.filter((row) => row.culinaryProfile).length,
    reviewedProfilesPreserved: rows.filter((row) => row.culinaryProfile?.reviewStatus === "Reviewed").length,
    needsReviewProfiles: rows.filter((row) => row.culinaryProfile?.reviewStatus === "Needs review").length,
    missingProfiles: rows.filter((row) => !row.culinaryProfile).length,
  };
}
