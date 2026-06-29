import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "src", "features", "neighborhood-rotations", "NeighborhoodRotations.jsx");
const dataPath = path.join(root, "src", "data", "menuItems.json");

const source = fs.readFileSync(sourcePath, "utf8");
const rows = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const fail = (message) => {
  console.error(`Rotation integrity check failed: ${message}`);
  process.exitCode = 1;
};

const name = (row) => row.item || row.recipeName || row.displayName || row.shortName || row["Recipe Name"] || "";
const menu = (row) => row.menu || row.menuName || row["Menu Name"] || "";
const station = (row) => row.station || row.stationName || row.Station || "";
const category = (row) => String(row.category || row.itemType || row["Item Type"] || row.classification || "").toLowerCase();
const price = (row) => row.price ?? row.sellPrice ?? row["Sell Price"] ?? null;
const isEntree = (row) => category(row).includes("entree") || category(row).includes("entrée") || category(row).includes("plate") || category(row).includes("main") || Number(price(row)) >= 9;

const uniqueByName = (items) => {
  const seen = new Set();
  return items.filter((row) => {
    const key = name(row).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const carveryProteins = uniqueByName(rows.filter((row) =>
  menu(row) === "AMZ: Carvery" &&
  /premium mains|vegetarian mains/i.test(station(row)) &&
  isEntree(row) &&
  !/sandwich|reuben|panini|wrap/i.test(`${name(row)} ${station(row)}`)
));

const saladPool = uniqueByName(rows.filter((row) =>
  menu(row) === "AMZ: Cafe Express Curated Salads" &&
  /curated salads/i.test(station(row)) &&
  isEntree(row)
));

const deliPool = uniqueByName(rows.filter((row) =>
  menu(row) === "AMZ: Cafe Express Curated Sandwiches" &&
  /curated sandwiches/i.test(station(row)) &&
  isEntree(row)
));

const grillSpotlights = uniqueByName(rows.filter((row) =>
  menu(row) === "AMZ: Grill Core" &&
  /location spotlights|regional spotlights|^spotlights$/i.test(station(row)) &&
  isEntree(row)
));

if (!/block\.menu = record\.menuConcept \|\| block\.menu \|\| ""/.test(source)) {
  fail("Re:Invent/global block item reload no longer restores Menu / Concept onto the block.");
}

if (!/if \(index === 0\) rotation\.grill\.regionalSpecial = record\.itemName;/.test(source)) {
  fail("Two-slot grill Location Spotlight reload mapping is missing.");
}

if (!/pushSelections\("grill", SMARTSHEET_SELECTION_TYPES\.locationSpotlight, \[rotation\.grill\?\.regionalSpecial, rotation\.grill\?\.locationSpotlight\], 400\)/.test(source)) {
  fail("Two-slot grill saves must write regionalSpecial as slot 1 and locationSpotlight as slot 2.");
}

if (!/const submittedRotation = isSubmittedRotation\(rotation\);/.test(source) || !/const lockedForEditing = submittedRotation && !editSubmitted;/.test(source)) {
  fail("Submitted rotation locking must use the shared submitted-status helper.");
}

if (!/selection rows can restore submitted state when the header row is missing/i.test(source) || !/record\.recordType === SMARTSHEET_RECORD_TYPES\.globalSelection \|\| record\.recordType === SMARTSHEET_RECORD_TYPES\.stationSelection/.test(source)) {
  fail("Submitted selection rows must also restore Submitted state when a header/global block row is missing or delayed.");
}

if (!/function ItemPickerSlot/.test(source) || !source.includes("<option value={WRITE_IN_SENTINEL}>Type if not listed</option>")) {
  fail("Write-in picker mode is missing; dropdowns should open manual entry through the Type if not listed option.");
}

if (!/function reInventSummaryBlockLabels/.test(source) || !/carryoverGlobalBlock\(rotation\.previousRotation/.test(source)) {
  fail("Re:Invent summary cards must show all three schedule blocks, including prior-Friday Monday carryover.");
}

if (!/const isReInventFridayMondayWeek = \(weekLabel = ""\) => weekIndexFromLabel\(weekLabel\) % 2 === 0;/.test(source)) {
  fail("Re:Invent cycle parity must be shifted back one week so Jun 29, 2026 is Monday carryover / Tue-Wed / Thu-Fri and Jul 6, 2026 is Friday-to-Monday carryover.");
}

if (!/<SubmittedRotationRecap[^>]*previousRotation=\{previousRotation\}/.test(source) || !/cafe === "Re:Invent" \? reInventSummaryBlockLabels\(\{ \.\.\.rotation, previousRotation \}, week\)/.test(source)) {
  fail("Re:Invent submitted recap must show all three schedule blocks, including prior-Friday Monday carryover.");
}

if (!/handleOpenPlannerFromSummary = \(row\)/.test(source) || !/onOpenPlanner=\{handleOpenPlannerFromSummary\}/.test(source) || !/onOpenPlanner \? \(\) => onOpenPlanner\(row\)/.test(source)) {
  fail("Executive and leadership summary cards must jump directly into that cafe's planner.");
}

if (carveryProteins.some((row) => /reuben|sandwich|panini|wrap/i.test(`${name(row)} ${station(row)}`))) {
  fail("Carvery protein pool contains sandwich/Reuben items.");
}

if (!carveryProteins.length) {
  fail("Carvery protein pool is empty.");
}

if (!saladPool.length || saladPool.some((row) => menu(row) !== "AMZ: Cafe Express Curated Salads")) {
  fail("Salad LTO pool is not constrained to AMZ: Cafe Express Curated Salads.");
}

if (saladPool.some((row) => /burger|flatbread|sandwich|wrap/i.test(name(row)))) {
  fail("Salad LTO pool contains burger, flatbread, sandwich, or wrap items.");
}

if (!deliPool.length || deliPool.some((row) => menu(row) !== "AMZ: Cafe Express Curated Sandwiches")) {
  fail("Deli LTO pool is not constrained to AMZ: Cafe Express Curated Sandwiches.");
}

if (deliPool.some((row) => /AMZ: Carvery/i.test(menu(row)))) {
  fail("Deli LTO pool contains Carvery sandwich items.");
}

if (!grillSpotlights.length) {
  fail("Grill Location Spotlight pool is empty.");
}

if (grillSpotlights.some((row) => !/location spotlights|regional spotlights|^spotlights$/i.test(station(row)))) {
  fail("Grill Location Spotlight pool contains non-spotlight grill core rows.");
}

const requiredEastMarkers = [
  'Bingo: ["global", "fishMarket", "grill", "grillFreshFive", "salad", "saladFreshFive", "commissaryEverest"]',
  'Grace: ["streetBeets", "global", "grill", "freshFive", "salad"]',
  'Blueshift: ["global", "lotusWp", "grill", "salad", "deli", "fishMarket", "freshFive"]',
  'Eclipse: ["global", "stationTakeover", "freshFive"]',
  'customStations: cloneCustomStations()',
  'function StreetBeetsSection',
  'function CommissaryEverestSection',
  'function LotusWpSection',
  'function StationTakeoverSection'
];

for (const marker of requiredEastMarkers) {
  if (!source.includes(marker)) fail(`East custom station marker missing: ${marker}`);
}

if (!source.includes('const WRITE_IN_SENTINEL = "__write_in__";')) {
  fail("Item picker write-in behavior must use a dropdown sentinel instead of a second always-visible field.");
}

if (!source.includes('<option value={WRITE_IN_SENTINEL}>Type if not listed</option>')) {
  fail("Item picker dropdowns must include a Type if not listed option.");
}

if (/placeholder="Type if not listed"\s+className="mt-3 w-full rounded-2xl border border-slate-200/.test(source)) {
  fail("Carvery selectors must not render an always-visible duplicate write-in input below the dropdown.");
}

if (!process.exitCode) {
  console.log(`Rotation integrity checks passed: ${carveryProteins.length} carvery proteins, ${saladPool.length} salads, ${deliPool.length} deli items, ${grillSpotlights.length} grill spotlights.`);
}
