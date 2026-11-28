import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import * as XLSX from "xlsx";

import { parseImportedMenuWorksRow } from "../src/features/recipe-database/menuWorksImport.js";
import { buildAuthoritativeMenuReplacement, replacementProfileSummary } from "../src/features/recipe-database/menuWorksAuthoritativeReplacement.js";

const root = resolve(import.meta.dirname, "..");
const write = process.argv.includes("--write");
const version = "menuworks-fresh-five-2026-11-27";
const menu = "AMZ: Fresh Five";
const sourcePath = resolve(root, "docs/menu-data/MenuWorks_AMZ_Fresh_Five_2026-11-27.csv");
const catalogPath = resolve(root, "src/data/menuItems.json");
const manifestPath = resolve(root, "docs/menu-data/MenuWorks_Fresh_Five_Replacement_2026-11-27.json");
const candidatePath = resolve(root, "docs/menu-data/MenuWorks_Fresh_Five_Replacement_Rows_2026-11-27.json");

const sourceBuffer = readFileSync(sourcePath);
const workbook = XLSX.read(sourceBuffer, { type: "buffer", codepage: 1252, raw: true });
const sheet = workbook.Sheets.Report || workbook.Sheets[workbook.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
const incoming = raw.map((row, index) => parseImportedMenuWorksRow(row, index)).filter((row) => row?.menu === menu);
if (incoming.length !== 19) throw new Error(`Expected 19 authoritative Fresh Five rows, found ${incoming.length}.`);
if (incoming.some((row) => !(Number(row.trueCost) > 0) || !row.mrn || !row.enticingDescription)) throw new Error("Every Fresh Five row must include exact MRN, description, and definitive Item + Waste cost.");
if (incoming.some((row) => String(row.mrn) === "198596")) throw new Error("Hibernate / Do Not Use MRN 198596 must remain outside the active Fresh Five replacement.");

const source = {
  version,
  fileName: basename(sourcePath),
  sha256: createHash("sha256").update(sourceBuffer).digest("hex"),
};
const currentCatalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const current = currentCatalog.filter((row) => row.menu === menu);
const replacement = buildAuthoritativeMenuReplacement(incoming, current, source);
const nextCatalog = [...currentCatalog.filter((row) => row.menu !== menu), ...replacement.rows];
const manifest = {
  schemaVersion: 1,
  version,
  authority: "Alex: supplied Fresh Five export is the complete authoritative active menu set; missing items are intentional removals from user-facing tools.",
  menu,
  source,
  previousCount: current.length,
  replacementCount: replacement.rows.length,
  removedCount: replacement.removed.length,
  removed: replacement.removed.map(({ item_key, mrn, station, portion, item, displayName }) => ({ item_key, mrn, station, portion, item: item || displayName })),
  profiles: replacementProfileSummary(replacement.rows),
  hiddenReferencePolicy: "Rows absent from the authoritative active export remain available only through protected audit history; they are excluded from user-facing catalog reads and ordering programs.",
  profilePersistence: "Every active replacement row carries a Culinary Tags profile in its shared Supabase recipe-item payload.",
};

const expectedCatalog = `${JSON.stringify(nextCatalog, null, 2)}\n`;
const expectedManifest = `${JSON.stringify(manifest, null, 2)}\n`;
const expectedCandidate = `${JSON.stringify({ version, rows: replacement.rows }, null, 2)}\n`;

if (write) {
  writeFileSync(catalogPath, expectedCatalog);
  writeFileSync(manifestPath, expectedManifest);
  writeFileSync(candidatePath, expectedCandidate);
} else {
  if (readFileSync(catalogPath, "utf8") !== expectedCatalog) throw new Error("src/data/menuItems.json is not synchronized with the authoritative Fresh Five export. Run this script with --write.");
  if (readFileSync(manifestPath, "utf8") !== expectedManifest) throw new Error("The Fresh Five replacement manifest is stale. Run this script with --write.");
  if (readFileSync(candidatePath, "utf8") !== expectedCandidate) throw new Error("The Fresh Five replacement rows are stale. Run this script with --write.");
}

console.log(JSON.stringify({ mode: write ? "write" : "check", ...manifest }, null, 2));
