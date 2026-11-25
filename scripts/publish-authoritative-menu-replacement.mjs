import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildAuthoritativeMenuReplacement, replacementProfileSummary } from "../src/features/recipe-database/menuWorksAuthoritativeReplacement.js";

const root = resolve(import.meta.dirname, "..");
const baseUrl = String(process.env.CULINARY_PLATFORM_URL || "https://project-d8v25.vercel.app").replace(/\/$/, "");
const adminCode = String(process.env.RECIPE_LIBRARY_ADMIN_CODE || "").trim();
const evidenceDir = resolve(process.env.MENU_REPLACEMENT_EVIDENCE_DIR || resolve(root, "tmp/menuworks-authoritative-2026-11-25"));
const candidate = JSON.parse(readFileSync(resolve(root, "docs/menu-data/MenuWorks_Authoritative_Replacement_Rows_2026-11-25.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(root, "docs/menu-data/MenuWorks_Authoritative_Replacement_2026-11-25.json"), "utf8"));
const menus = manifest.menus.map(({ menu }) => menu);
if (!adminCode) throw new Error("Set RECIPE_LIBRARY_ADMIN_CODE for the protected authoritative replacement.");
mkdirSync(evidenceDir, { recursive: true });

async function jsonFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.message || `${path} failed with HTTP ${response.status}.`);
  return payload;
}

const post = (body) => jsonFetch("/api/recipe-library", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
  body: JSON.stringify(body),
});
const save = (name, value) => writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`);
const cleanDocuments = (row) => ({ ...row, recipeDocuments: (row.recipeDocuments || []).map(({ signed_url, ...document }) => document) });

const before = await jsonFetch(`/api/recipe-library?scope=all&releaseAudit=${Date.now()}`);
const beforeRows = before.rows.filter((row) => menus.includes(row.menu));
const audits = await Promise.all(menus.map((menu) => post({ action: "auditRecipeMenuScope", menu })));
const expectedCurrentKeys = audits.flatMap(({ rows }) => rows.map(({ item_key }) => item_key));
if (new Set(expectedCurrentKeys).size !== expectedCurrentKeys.length) throw new Error("The exact replacement menu scope contains duplicate item keys.");
save("before-visible-rows.json", { source: before.source, rows: beforeRows.map(cleanDocuments) });
save("before-exact-audits.json", audits);

const incomingByMenu = new Map(menus.map((menu) => [menu, candidate.rows.filter((row) => row.menu === menu)]));
const replacementRows = [];
const replacementSummary = [];
for (const menu of menus) {
  const source = manifest.menus.find((entry) => entry.menu === menu).source;
  const current = beforeRows.filter((row) => row.menu === menu);
  const replacement = buildAuthoritativeMenuReplacement(incomingByMenu.get(menu), current, source);
  replacementRows.push(...replacement.rows);
  replacementSummary.push({ menu, beforeVisible: current.length, afterExpected: replacement.rows.length, removedVisible: replacement.removed.map(({ item_key, mrn, item }) => ({ item_key, mrn, item })), profiles: replacementProfileSummary(replacement.rows) });
}
save("prepared-replacement-summary.json", replacementSummary);

const results = [];
for (const menu of menus) {
  const rows = replacementRows.filter((row) => row.menu === menu);
  const audit = audits.find((entry) => entry.menu === menu);
  const source = manifest.menus.find((entry) => entry.menu === menu).source;
  const result = await post({
    action: "acceptMenuWorksImport",
    rows,
    importedMenuNames: [menu],
    replaceMissing: true,
    replacementAuthority: "authoritative-complete-menu-set",
    expectedCurrentKeys: audit.rows.map(({ item_key }) => item_key),
    importBatch: { id: `${candidate.version}:${menu}`, source: `${source.fileName} sha256:${source.sha256}`, approvedBy: "Alex" },
  });
  if (result.rowsWritten !== rows.length || result.rowsHidden !== 0) throw new Error(`${menu}: authoritative replacement returned unexpected write/hide counts.`);
  results.push(result);
}
save("replacement-response.json", results);

const after = await jsonFetch(`/api/recipe-library?scope=all&releaseAudit=${Date.now()}`);
const afterRows = after.rows.filter((row) => menus.includes(row.menu));
const expectedCounts = new Map(manifest.menus.map(({ menu, replacementCount }) => [menu, replacementCount]));
for (const menu of menus) {
  const rows = afterRows.filter((row) => row.menu === menu);
  if (rows.length !== expectedCounts.get(menu)) throw new Error(`${menu}: expected ${expectedCounts.get(menu)} visible rows after replacement, found ${rows.length}.`);
  if (rows.some((row) => row.sourceDataVersion !== candidate.version || !row.culinaryProfile)) throw new Error(`${menu}: replacement provenance or Culinary Tags profile did not read back on every row.`);
}
const afterAudits = await Promise.all(menus.map((menu) => post({ action: "auditRecipeMenuScope", menu })));
for (const audit of afterAudits) {
  if (audit.count !== expectedCounts.get(audit.menu) || audit.visibleCount !== audit.count || audit.hiddenCount !== 0) throw new Error(`${audit.menu}: exact post-write audit contains stale or hidden rows.`);
}
save("after-visible-rows.json", { source: after.source, rows: afterRows.map(cleanDocuments) });
save("after-exact-audits.json", afterAudits);

console.log(JSON.stringify({ baseUrl, version: candidate.version, rowsWritten: results.reduce((sum, result) => sum + result.rowsWritten, 0), rowsDeleted: results.reduce((sum, result) => sum + result.rowsDeleted, 0), menus: afterAudits.map(({ menu, count }) => ({ menu, count })), evidenceDir }, null, 2));
