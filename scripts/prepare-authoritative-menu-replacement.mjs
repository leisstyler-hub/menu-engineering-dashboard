import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import * as XLSX from "xlsx";

import { parseImportedMenuWorksRow } from "../src/features/recipe-database/menuWorksImport.js";
import { buildAuthoritativeMenuReplacement, replacementProfileSummary } from "../src/features/recipe-database/menuWorksAuthoritativeReplacement.js";
import { DELI_CORE_SELECTED_CATALOG } from "../src/features/commissary-ordering/deliCoreCatalog.js";
import { DELI_ORDERING_PROGRAM } from "../src/features/commissary-ordering/deliCycleCatalog.js";

const root = resolve(import.meta.dirname, "..");
const write = process.argv.includes("--write");
const version = "menuworks-authoritative-2026-11-25";
const sourceDefinitions = [
  { menu: "AMZ: Deli Core", file: "docs/menu-data/MenuWorks_AMZ_Deli_Core_2026-11-25.csv", expected: 165 },
  { menu: "AMZ: Cafe Express Curated Sandwiches", file: "docs/menu-data/MenuWorks_AMZ_Cafe_Express_Curated_Sandwiches_2026-11-25.csv", expected: 57 },
  { menu: "AMZ: Cafe Express Soup", file: "docs/menu-data/MenuWorks_AMZ_Cafe_Express_Soup_2026-11-25.csv", expected: 70 },
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function parseSource(definition) {
  const path = resolve(root, definition.file);
  const buffer = readFileSync(path);
  const workbook = XLSX.read(buffer, { type: "buffer", codepage: 1252, raw: true });
  const sheet = workbook.Sheets.Report || workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
  const rows = raw.map((row, index) => parseImportedMenuWorksRow(row, index)).filter((row) => row?.menu === definition.menu);
  if (rows.length !== definition.expected) throw new Error(`${definition.menu}: expected ${definition.expected} rows, found ${rows.length}.`);
  const source = { version, fileName: basename(path), sha256: sha256(buffer) };
  return { ...definition, source, rows };
}

const catalogPath = resolve(root, "src/data/menuItems.json");
const currentCatalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const parsed = sourceDefinitions.map(parseSource);
const replacements = parsed.map(({ menu, rows, source }) => {
  const currentRows = currentCatalog.filter((row) => row.menu === menu);
  const replacement = buildAuthoritativeMenuReplacement(rows, currentRows, source);
  return { menu, source, previousCount: currentRows.length, ...replacement };
});
const scopedMenus = new Set(sourceDefinitions.map(({ menu }) => menu));
const nextCatalog = [
  ...currentCatalog.filter((row) => !scopedMenus.has(row.menu)),
  ...replacements.flatMap(({ rows }) => rows),
];
const manifest = {
  schemaVersion: 1,
  version,
  authority: "Alex: each supplied export is the complete authoritative menu set; missing rows are intentional deletions.",
  menus: replacements.map(({ menu, source, previousCount, rows, removed }) => ({
    menu,
    source,
    previousCount,
    replacementCount: rows.length,
    removedCount: removed.length,
    removed: removed.map(({ item_key, mrn, station, portion, item, displayName }) => ({ item_key, mrn, station, portion, item: item || displayName })),
    uncosted: rows.filter((row) => !(Number(row.trueCost) > 0)).map(({ item_key, mrn, item, displayName, portion }) => ({ item_key, mrn, item: item || displayName, portion })),
    profiles: replacementProfileSummary(rows),
  })),
  totalRows: replacements.reduce((sum, entry) => sum + entry.rows.length, 0),
  profilePersistence: "Every replacement row carries a culinaryProfile in its shared recipe-item source payload; existing reviewed profiles are preserved and all other fields are explicit Needs review/Unknown.",
};

const manifestPath = resolve(root, "docs/menu-data/MenuWorks_Authoritative_Replacement_2026-11-25.json");
const candidatePath = resolve(root, "docs/menu-data/MenuWorks_Authoritative_Replacement_Rows_2026-11-25.json");
const expectedCatalog = `${JSON.stringify(nextCatalog, null, 2)}\n`;
const expectedManifest = `${JSON.stringify(manifest, null, 2)}\n`;
const expectedCandidate = `${JSON.stringify({ version, rows: replacements.flatMap(({ rows }) => rows) }, null, 2)}\n`;
const deliSource = manifest.menus.find(({ menu }) => menu === "AMZ: Deli Core").source;
const deliRowsByMrn = new Map(replacements.find(({ menu }) => menu === "AMZ: Deli Core").rows.map((row) => [row.mrn, row]));
const tuna = deliRowsByMrn.get("141826.1");
if (!tuna || !(Number(tuna.trueCost) > 0)) throw new Error("The authoritative Deli source must contain a priced exact MRN 141826.1.");
const deliCatalog = {
  ...structuredClone(DELI_CORE_SELECTED_CATALOG),
  version: 2,
  source: { fileName: deliSource.fileName, sha256: deliSource.sha256, verifiedAt: "2026-11-25", authority: "complete-menu-replacement" },
  items: [
    ...DELI_CORE_SELECTED_CATALOG.items.filter(({ mrn }) => mrn !== "141826.1"),
    { mrn: "141826.1", name: tuna.item, station: tuna.station, recipePage: null, recipeEvidence: "MenuWorks item metadata only; recipe components remain unavailable." },
  ],
  unsupported: DELI_CORE_SELECTED_CATALOG.unsupported.filter(({ mrn }) => mrn !== "141826.1"),
};
const deliProgram = structuredClone(DELI_ORDERING_PROGRAM);
deliProgram.version = 2;
deliProgram.cycleWeeks = deliProgram.cycleWeeks.map((week) => ({
  ...week,
  items: [
    ...week.items.filter(({ mrn }) => mrn !== "141826.1"),
    ...(week.week === 2 ? [{ mrn: "141826.1", name: tuna.item }] : []),
  ],
}));
const deliCatalogOutput = `// Synchronized from Alex's authoritative complete Deli Core MenuWorks export.\n// Shared costs remain authoritative in Supabase recipe_items; recipe files remain private Supabase documents.\n\nexport const DELI_CORE_SELECTED_CATALOG = Object.freeze(${JSON.stringify(deliCatalog, null, 2)});\n\nexport const DELI_CORE_SELECTED_MRNS = Object.freeze(DELI_CORE_SELECTED_CATALOG.items.map(({ mrn }) => mrn));\n`;
const deliProgramOutput = `// Synchronized from the authoritative Deli Core replacement and retained reviewed recipe components.\n// Items without recipe evidence remain orderable/costed but do not invent component prep.\n\nexport const DELI_ORDERING_PROGRAM = Object.freeze(${JSON.stringify(deliProgram, null, 2)});\n\nexport const DELI_ORDERING_ITEM_MRNS = Object.freeze([...new Set(DELI_ORDERING_PROGRAM.cycleWeeks.flatMap(({ items }) => items.map(({ mrn }) => mrn)))]);\nexport const DELI_ORDERING_PREP_ITEM_IDS = Object.freeze([...new Set(Object.values(DELI_ORDERING_PROGRAM.itemPrepComponents).flat().map(({ id }) => id))]);\n`;
const deliCatalogPath = resolve(root, "src/features/commissary-ordering/deliCoreCatalog.js");
const deliProgramPath = resolve(root, "src/features/commissary-ordering/deliCycleCatalog.js");

if (write) {
  writeFileSync(catalogPath, expectedCatalog);
  writeFileSync(manifestPath, expectedManifest);
  writeFileSync(candidatePath, expectedCandidate);
  writeFileSync(deliCatalogPath, deliCatalogOutput);
  writeFileSync(deliProgramPath, deliProgramOutput);
} else {
  if (readFileSync(catalogPath, "utf8") !== expectedCatalog) throw new Error("src/data/menuItems.json is not synchronized with the authoritative MenuWorks exports. Run this script with --write.");
  if (readFileSync(manifestPath, "utf8") !== expectedManifest) throw new Error("The authoritative replacement manifest is stale. Run this script with --write.");
  if (readFileSync(candidatePath, "utf8") !== expectedCandidate) throw new Error("The authoritative replacement candidate rows are stale. Run this script with --write.");
  if (readFileSync(deliCatalogPath, "utf8").replace(/\r\n/g, "\n") !== deliCatalogOutput) throw new Error("The Deli Core shared catalog is stale. Run this script with --write.");
  if (readFileSync(deliProgramPath, "utf8").replace(/\r\n/g, "\n") !== deliProgramOutput) throw new Error("The Deli ordering cycle is stale. Run this script with --write.");
}

console.log(JSON.stringify({ mode: write ? "write" : "check", ...manifest }, null, 2));
