import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildAuthoritativeMenuReplacement, replacementProfileSummary } from "../src/features/recipe-database/menuWorksAuthoritativeReplacement.js";

const root = resolve(import.meta.dirname, "..");
const baseUrl = String(process.env.CULINARY_PLATFORM_URL || "https://project-d8v25.vercel.app").replace(/\/$/, "");
const adminCode = String(process.env.RECIPE_LIBRARY_ADMIN_CODE || "").trim();
const evidenceDir = resolve(process.env.FRESH_FIVE_EVIDENCE_DIR || resolve(root, "tmp/menuworks-fresh-five-2026-11-27"));
const candidate = JSON.parse(readFileSync(resolve(root, "docs/menu-data/MenuWorks_Fresh_Five_Replacement_Rows_2026-11-27.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(root, "docs/menu-data/MenuWorks_Fresh_Five_Replacement_2026-11-27.json"), "utf8"));
if (!adminCode) throw new Error("Set RECIPE_LIBRARY_ADMIN_CODE for the protected Fresh Five replacement.");
mkdirSync(evidenceDir, { recursive: true });

async function jsonFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.message || `${path} failed with HTTP ${response.status}.`);
  return payload;
}
const post = (body) => jsonFetch("/api/recipe-library", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-code": adminCode }, body: JSON.stringify(body) });
const save = (name, value) => writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`);
const cleanDocuments = (row) => ({ ...row, recipeDocuments: (row.recipeDocuments || []).map(({ signed_url, ...document }) => document) });

const before = await jsonFetch(`/api/recipe-library?scope=all&releaseAudit=${Date.now()}`);
const beforeRows = before.rows.filter((row) => row.menu === manifest.menu);
const audit = await post({ action: "auditRecipeMenuScope", menu: manifest.menu });
save("before-visible-rows.json", { source: before.source, rows: beforeRows.map(cleanDocuments) });
save("before-exact-audit.json", audit);

const replacement = buildAuthoritativeMenuReplacement(candidate.rows, beforeRows, manifest.source);
save("prepared-replacement-summary.json", { menu: manifest.menu, beforeVisible: beforeRows.length, afterExpected: replacement.rows.length, removedVisible: replacement.removed.map(({ item_key, mrn, item }) => ({ item_key, mrn, item })), profiles: replacementProfileSummary(replacement.rows) });
const result = await post({
  action: "acceptMenuWorksImport",
  rows: replacement.rows,
  importedMenuNames: [manifest.menu],
  replaceMissing: true,
  replacementAuthority: "authoritative-complete-menu-set",
  expectedCurrentKeys: audit.rows.map(({ item_key }) => item_key),
  importBatch: { id: `${candidate.version}:${manifest.menu}`, source: `${manifest.source.fileName} sha256:${manifest.source.sha256}`, approvedBy: "Alex" },
});
if (result.rowsWritten !== replacement.rows.length || result.rowsHidden !== 0) throw new Error("Fresh Five replacement returned unexpected write/hide counts.");
save("replacement-response.json", result);

const after = await jsonFetch(`/api/recipe-library?scope=all&releaseAudit=${Date.now()}`);
const afterRows = after.rows.filter((row) => row.menu === manifest.menu);
if (afterRows.length !== manifest.replacementCount) throw new Error(`Expected ${manifest.replacementCount} visible Fresh Five rows, found ${afterRows.length}.`);
if (afterRows.some((row) => row.sourceDataVersion !== candidate.version || !row.culinaryProfile || String(row.mrn) === "198596")) throw new Error("Fresh Five provenance/profile readback failed or Hibernate MRN 198596 remained visible.");
const afterAudit = await post({ action: "auditRecipeMenuScope", menu: manifest.menu });
if (afterAudit.visibleCount !== manifest.replacementCount || afterAudit.hiddenCount !== afterAudit.count - manifest.replacementCount) throw new Error("Fresh Five exact post-write audit does not match the active/hidden replacement contract.");
save("after-visible-rows.json", { source: after.source, rows: afterRows.map(cleanDocuments) });
save("after-exact-audit.json", afterAudit);
console.log(JSON.stringify({ baseUrl, version: candidate.version, rowsWritten: result.rowsWritten, rowsDeleted: result.rowsDeleted, activeRows: afterRows.length, hiddenReferenceRows: afterAudit.hiddenCount, evidenceDir }, null, 2));
