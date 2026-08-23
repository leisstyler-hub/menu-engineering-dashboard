import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "src", "features", "neighborhood-rotations", "NeighborhoodRotations.jsx");
const dataPath = path.join(root, "src", "data", "menuItems.json");
const platePilotPath = path.join(root, "src", "features", "neighborhood-rotations", "foodCostPlatePilot.js");
const plateReferencePath = path.join(root, "docs", "FOOD_COST_PLATE_COSTING_REFERENCE.md");
const generatedPlateReferencePath = path.join(root, "src", "data", "foodCostPlateReference.json");

const source = fs.readFileSync(sourcePath, "utf8");
const platePilotSource = fs.readFileSync(platePilotPath, "utf8");
const plateReferenceSource = fs.readFileSync(plateReferencePath, "utf8");
const generatedPlateReferenceSource = fs.readFileSync(generatedPlateReferencePath, "utf8");
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

const splitCycleStart = (cafe) => {
  const escaped = cafe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const quoted = source.match(new RegExp(`"${escaped}"\\s*:\\s*"([^"]+)"`));
  if (quoted) return quoted[1];
  const unquoted = source.match(new RegExp(`${escaped}\\s*:\\s*"([^"]+)"`));
  return unquoted?.[1] || "";
};
const verifyWeekStart = (weekLabel) => {
  const parsed = new Date(String(weekLabel || "").split(" - ")[0]);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};
const firstSplitBlockId = (cafe, weekLabel) => {
  const weekStart = verifyWeekStart(weekLabel);
  const anchor = splitCycleStart(cafe);
  if (!weekStart || !anchor) return "";
  const diff = Math.max(0, Math.round((new Date(`${weekStart}T00:00:00`) - new Date(`${anchor}T00:00:00`)) / (7 * 24 * 60 * 60 * 1000)));
  return diff % 2 === 0 ? "monTue" : "monCarry";
};

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

if (!/const PILOT_WEEK_START = "2026-08-17";/.test(platePilotSource) || !/district === "North" && cafe === "Nessie"/.test(platePilotSource)) {
  fail("The per-plate food-cost pilot must stay scoped to North Nessie for the Aug 17, 2026 week.");
}

if (!/reference\.rows[\s\S]*filter\(\(row\) => !row\.menu\.startsWith\("AMZ\+RA:"\)\)/.test(platePilotSource) || !/itemWasteCost/.test(platePilotSource) || !/calculateReferencePlateRanges/.test(platePilotSource)) {
  fail("The Nessie pilot must use the menu-isolated Markdown reference, Item + Waste Cost, and plate-build calculator without inferring RA concepts.");
}

if (/\bPlate Adds?\b/.test(plateReferenceSource) || /\bPlate Adds?\b/.test(generatedPlateReferenceSource) || !/Legacy Plate Add terminology/.test(fs.readFileSync(path.join(root, "scripts", "build-food-cost-plate-reference.mjs"), "utf8"))) {
  fail("The food-cost authority and generated reference must use canonical Sub Recipe terminology and reject legacy Plate Add labels.");
}

if (
  !/fish-market-automatic/.test(platePilotSource)
  || !/grill-side-extremes/.test(platePilotSource)
  || !/FISH_MARKET_NON_SAUCE_MRNS = new Set\(\["1261"\]\)/.test(platePilotSource)
  || !/normalize\(menu\) === "amz: anisa"/.test(platePilotSource)
  || !/grillExtremeSideRows/.test(platePilotSource)
  || !/Automatic plate build: entrée \+ 2 unique Fish Market sides \+ 1 sauce/.test(source)
  || !/2 lowest-cost and 2 highest-cost unique Grill Core reference sides/.test(source)
) {
  fail("Fish Market, Core Grill, and Anisa must retain their approved automatic/reference component corrections.");
}

if (!/storageGroup: normalize\(label\)\.startsWith\("sub recipe"\) \? "subRecipes" : "sides"/.test(platePilotSource)
  || !/const targetGroup = group\.storageGroup \|\| "sides"/.test(source)
  || !/validSubRecipeIds/.test(source)) {
  fail("Reference-generated Sub Recipe choices must use the planner's Sub Recipe storage group and preserve recall compatibility.");
}

if (!/const selectedPlateIds = items[\s\S]*rotation\?\.extensions/.test(source) || !/filter\(\(row\) => normalizeItemName\(row\.componentType\) === "extension"\)/.test(source) || !/Extensions are excluded from every plate combination/.test(source)) {
  fail("Reference plate calculations must exclude extensions from combinations and show them as separate economics.");
}

if (
  !/isReferencePlateCostRolloutWeek[\s\S]*weekStart >= formatDateKey\(CURRENT_ROTATION_WEEK_START\)/.test(source)
  || !/usesReferenceGlobalPlanner[\s\S]*isFoodCostReferenceMenu\(menu\)/.test(source)
  || !/function PlannerReferencePlateCost[\s\S]*promotionActive[\s\S]*return null/.test(source)
) {
  fail("Reference plate analytics must be menu-gated, current/future-only, planner-only, and suppressed by promotion overrides.");
}

if (
  !/const overall = referenceUnavailable \? null : calculatedOverall/.test(source)
  || !/const hasNonCalculablePrimary = selectedReferenceRows\.some/.test(source)
  || !/const summaryValue = referenceUnavailable[\s\S]*"Reference data unavailable"/.test(source)
  || !/\{referenceUnavailable \? \([\s\S]*No calculated range is shown/.test(source)
) {
  fail("Incomplete or unresolved reference selections must suppress summary and per-primary calculated ranges.");
}

if (
  !/scopeLabel=\{`\$\{cafe\} · \$\{blockInfo\.title\}`\}/.test(source)
  || !/menu="AMZ: Wok"/.test(source)
  || !/menu="AMZ: Carvery"/.test(source)
  || !/scopeLabel="Dawson · Moby Pop-Up"/.test(source)
  || !/scopeLabel=\{`\$\{cafe\} · \$\{title\}`\}/.test(source)
  || !/menu="AMZ: Lotus"/.test(source)
) {
  fail("Reference plate analytics must cover eligible Global blocks and menu-backed Wok, Carvery, Moby Pop-Up, LTO, and Lotus station planners.");
}

if (
  !/return activeStations\.includes\("soup"\) \? activeStations : \[\.\.\.activeStations, "soup"\]/.test(source)
  || !/soup: Array\(10\)\.fill\(""\)/.test(source)
  || !/function optionalStationKeys[\s\S]*const optionalStations = new Set\(\["soup"\]\)/.test(source)
  || !/getMenuName\(row\) === "AMZ: Cafe Express Soup"/.test(source)
  || !/const SOUP_DAYS = \["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"\]/.test(source)
  || !/\{ ounces: 12, retail: 5 \}/.test(source)
  || !/\{ ounces: 16, retail: 6\.10 \}/.test(source)
  || !/data-testid="soup-portion-costing"/.test(source)
  || !/\(values \|\| \[\]\)\.forEach\(\(itemName, index\) => \{[\s\S]*slotNumber: index \+ 1/.test(source)
  || !/return sourceCost \* \(ounces \/ 12\)/.test(source)
  || !/const progressStationKeys = stationKeys\.filter\(\(stationKey\) => !optionalStationKeys\(row\.cafe\)\.has\(stationKey\)\)/.test(source)
  || !/allowWriteIn=\{false\}/.test(source)
  || !/ariaLabel=\{`\$\{day\} Soup \$\{dailyIndex \+ 1\}`\}/.test(source)
  || !/const pilotReferenceRow = stationKey === "soup" \? null : foodCostReferenceRow/.test(source)
  || !/const foodCost = price && hasTrueCost \? Number\(trueCost\) \/ Number\(price\) : null/.test(source)
) {
  fail("Every cafe must retain ten optional weekday soup slots sourced only from Cafe Express Soup with fixed 12 oz and 16 oz economics.");
}

if (
  !/data-testid="nessie-global-reference-plate-cost" data-reference-plate-cost="true" className="mt-5 rounded-lg border border-sky-200 bg-white p-5/.test(source)
  || !/className="rounded-2xl border border-sky-200 bg-sky-50 p-4" data-testid=\{`reference-plate-/.test(source)
  || /emphasize compact/.test(source)
) {
  fail("The Nessie reference analytics must retain the restored spacious pre-compact card presentation.");
}

if (
  !/const row = pilotReferenceRow \|\| selectedRowForName/.test(source)
  || !/referenceIdForLoadedSelection[\s\S]*mrn: record\.mrn[\s\S]*portion: record\.portion/.test(source)
  || !/pilotRows = usesNessieReferencePicker/.test(source)
  || !/const pilotReferenceStations = new Map\(\)/.test(source)
) {
  fail("The Nessie reference selections must save and recall with menu, station, MRN, and portion isolation.");
}

if (!/isFoodCostReferenceMenu/.test(source) || !/foodCostReferenceStations/.test(source) || !/const pilotMenuOptions = referencePilotScope \? foodCostReferenceMenus\(\) : menuOptions/.test(source)) {
  fail("All menu options must remain available while reference stations and analytics activate only for classified reference menus.");
}

if (
  !/const referenceResults = referencePilot[\s\S]*calculateReferencePlateRanges/.test(source)
  || !/const referenceRanges = referenceResults\.length && referenceResults\.every\(\(range\) => range\.low != null\) \? referenceResults : \[\]/.test(source)
  || !/const costRange = referencePilot/.test(source)
  || !/const fcRange = referencePilot/.test(source)
) {
  fail("Saved Nessie pilot header analytics must use the same reference plate ranges instead of legacy mix math.");
}

if (!/const normalizedRecordCandidates = newestRecordsById\(records\)\.map\(normalizeLoadedRotationRecord\);/.test(source) || !/const normalizedRecords = normalizedRecordCandidates\.filter/.test(source)) {
  fail("Rotation reload must dedupe newest saved rows before rebuilding cafe selections.");
}

if (!/const menuEvidence = new Map\(\);/.test(source) || !/const authoritativeBlockMenus = new Map\(\);/.test(source) || !/preferredMenuFor\(record, blockId\)/.test(source)) {
  fail("Rotation reload must track authoritative Global Block menu names separately from child selection rows.");
}

if (!/record\.recordType === SMARTSHEET_RECORD_TYPES\.globalSelection && record\.itemName[\s\S]*\? 1[\s\S]*SMARTSHEET_RECORD_TYPES\.globalBlock[\s\S]*\? 10/.test(source)) {
  fail("Global Block rows must outweigh child selection rows when saved Menu / Concept values disagree.");
}

if (!/const shouldReplaceBlockEvidence = \(next, current\) => \{[\s\S]*next\.rank > current\.rank[\s\S]*next\.freshness > current\.freshness[\s\S]*next\.index < current\.index/.test(source) || !/authoritativeBlockMenus\.set\(key, next\)/.test(source) || !/const authoritativeBlockMenuFor = \(record, blockId = ""\) => authoritativeBlockMenus\.get\(evidenceKey\(record, blockId\)\)\?\.menu \|\| "";/.test(source) || !/const authoritative = authoritativeBlockMenuFor\(record, blockId\);[\s\S]*if \(authoritative\) return authoritative;/.test(source)) {
  fail("Split-global recall must prefer canonical saved Global Block identity before freshness and child-row menu evidence.");
}

if (!/const putFreshSlot = \(record, values, index, itemName, scopeParts = \[\]\) => \{[\s\S]*freshness <= currentFreshness[\s\S]*return;[\s\S]*values\[index\] = itemName;/.test(source) || !/putFreshSlot\(record, block\.entrees, index, record\.itemName, \["global", blockId, "entree"\]\)/.test(source)) {
  fail("Split-global recall must keep newer submitted item slots when stale same-block rows remain.");
}

if (!/menu: authoritativeMenu \|\| (record\.menuConcept \|\| )?preferredMenu \|\| currentBlock\.menu \|\| ""/.test(source)) {
  fail("Global Block restore must overwrite stale child-row menus with the saved block Menu / Concept.");
}

if (!/const withRotationRecordTimestamps = \(record\) => \(\{[\s\S]*SMARTSHEET_COLUMNS\.updatedAt\]: record\[SMARTSHEET_COLUMNS\.updatedAt\] \|\| rotation\.updatedAt \|\| rotation\.submittedAt \|\| ""/.test(source)) {
  fail("Saved rotation child rows must carry submitted/updated timestamps so reloads can choose the newest save.");
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

if (!/function reInventSummaryBlockLabels/.test(source) || !/persistedSplitGlobalBlocks\(rotation, cafe, week\)/.test(source)) {
  fail("Re:Invent summary cards must prefer persisted submitted split blocks before falling back to computed week layout.");
}

if (!/const SPLIT_GLOBAL_CAFES = new Set\(\["Re:Invent", "Blueshift"\]\);/.test(source)) {
  fail("Split global cafes must explicitly include Re:Invent and Blueshift.");
}

if (!/function splitGlobalBlockLayout\(cafe, week = ""\)/.test(source) || !/function splitGlobalSummaryBlockLabels/.test(source)) {
  fail("Split global 2/2/2 behavior must be shared through splitGlobalBlockLayout and splitGlobalSummaryBlockLabels.");
}

if (!/if \(isSplitGlobalCafe\(cafe\)\) \{/.test(source) || !/<SplitGlobalSection/.test(source)) {
  fail("The planner must route both Re:Invent and Blueshift to the shared split-global UI.");
}

if (!/if \(isSplitGlobalCafe\(cafe\)\) \{[\s\S]*splitGlobalBlockLayout\(cafe, week\)/.test(source)) {
  fail("Database records must save all active split-global blocks, not only Re:Invent blocks.");
}

if (!/function cardSummaryBlockLabels/.test(source) || !/title: "Monday - Friday"/.test(source) || !/const summaryBlocks = locked \|\| dawsonOverride \? cardSummaryBlockLabels\(row, row\.cafe, row\.week, row\.previousRotation \|\| EMPTY_ROTATION\) : \[\];/.test(source) || !/function wedTuesGlobalSummaryBlockLabels/.test(source)) {
  fail("Executive summary cards must show full-week labels for split-global cafes and Doppler.");
}

if (!/id: "stationLocked", title: "Stations", menu: "Selections locked"/.test(source)) {
  fail("No-Global locked cafes must show Selections locked in the same bordered summary block style without fake AMZ labels.");
}

if (!/const SPLIT_GLOBAL_CAFE_CYCLE_STARTS = \{\s*"Re:Invent": "2026-07-06",\s*Blueshift: "2026-07-06"\s*\};/.test(source)) {
  fail("Split-global cafes need separate cycle anchors: Re:Invent and Blueshift both restart Mon+Tue on Jul 6, 2026.");
}

if (!/const REINVENT_CLOSED_WEEK_STARTS = new Set\(\["2026-06-29"\]\);/.test(source) || !/function isReInventHolidayClosedWeek\(cafe, week = ""\)/.test(source)) {
  fail("Re:Invent Jun 29, 2026 holiday week must be explicitly modeled as a Friday-closed week.");
}

if (!/const WED_TUES_GLOBAL_CAFES = new Set\(\["Doppler", "Bingo", "Grace"\]\);/.test(source) || !/const isWedTuesGlobalCafe = \(cafe = ""\) => WED_TUES_GLOBAL_CAFES\.has\(cafe\);/.test(source)) {
  fail("Doppler, Bingo, and Grace must share one Wednesday-Tuesday Global cafe set.");
}

if (!/if \(isWedTuesGlobalCafe\(cafe\)\) \{\s*const cafeName = cafe \|\| "This cafe";[\s\S]{0,80}Wednesday\u2013Tuesday Global Cycle/.test(source)) {
  fail("Doppler, Bingo, and Grace must use the shared single Wednesday-Tuesday Global cycle, not the default Monday-Friday weekly cycle.");
}

if (!/if \(isWedTuesGlobalCafe\(cafe\)\) return wedTuesGlobalSummaryBlockLabels\(rotation, previousRotation\);/.test(source)) {
  fail("Doppler, Bingo, and Grace submitted/leadership summaries must share the Wednesday-Tuesday block labels.");
}

if (!/Bingo: \{ fishMarket: 2, salad: 2, grillFreshFive: 2, saladFreshFive: 1 \}/.test(source)) {
  fail("Bingo must have a two-slot grillFreshFive station override.");
}

if (!/stationKey === "grillFreshFive"\) content = <SimpleLTOSection[^>]*stationKey="grillFreshFive" title="Grill Fresh \$5" slots=\{Array\.from\(\{ length: stationSlots\(cafe, "grillFreshFive"\) \}/.test(source)) {
  fail("Grill Fresh $5 slots must render dynamically from stationSlots instead of a hardcoded single slot.");
}

if (!/id: "friClosed"[\s\S]*title: "Friday Closed"[\s\S]*closed: true/.test(source)) {
  fail("Re:Invent holiday week must show Friday Closed instead of requiring a Friday menu block.");
}

if (!/const splitGlobalFridayCarriesToNextMonday = \(cafe, weekLabel = ""\) =>/.test(source) || !/splitGlobalFridayCarriesToNextMonday\("Re:Invent", weekLabel\)/.test(source)) {
  fail("Re:Invent and Blueshift split-global parity must be calculated per cafe, not from one shared week index.");
}

if (firstSplitBlockId("Re:Invent", "Jul 6, 2026 - Jul 10, 2026") !== "monTue") {
  fail("Re:Invent Jul 6, 2026 must restart with the Monday + Tuesday block.");
}

if (firstSplitBlockId("Blueshift", "Jul 6, 2026 - Jul 10, 2026") !== "monTue") {
  fail("Blueshift Jul 6, 2026 must start with the Monday + Tuesday block.");
}

if (!/<SubmittedRotationRecap[^>]*previousRotation=\{previousRotation\}/.test(source) || !/const summaryBlocks = cardSummaryBlockLabels\(rotation, cafe, week, previousRotation\);/.test(source) || !/function persistedSplitGlobalBlocks/.test(source)) {
  fail("Submitted recap must show full-week split-global and Doppler blocks while still supporting prior-Friday Monday carryover.");
}

if (!/const submitRotation = async \(\)/.test(source) || !/await persistRotationToDatabase\?\.\(nextRotation, \{ optimistic: false, requirePrimary: true \}\)/.test(source)) {
  fail("Submit must wait for the database write before showing a locked submitted state.");
}

if (!/replaceParentRecordIds: \[rotationRecordParentId\(week, district, selectedCafe\)\], autoCreateMissingColumns: true/.test(source)) {
  fail("Rotation submit sync must ask the Smartsheet mirror to auto-repair missing used columns.");
}

if (!/const recordId = blockId[\s\S]*makeDatabaseRecordId\(parentId, stationKey, blockId, selectionType, slotNumber\)[\s\S]*makeDatabaseRecordId\(parentId, stationKey, "base", selectionType, slotNumber, itemName\)/.test(source)) {
  fail("Split-global selection record IDs must include the global block ID and use stable slot identity so resubmits replace stale rows.");
}

if (!/const knownBlockIds = new Set\(\["monTue", "wedThu", "friCarry", "monCarry", "tueWed", "thuFri", "friClosed", "noodles", "nitroMonTue", "nitroWedFri"\]\);/.test(source) || !/monTue: "monTue"[\s\S]*wedThu: "wedThu"[\s\S]*friCarry: "friCarry"/.test(source) || !/const fromRecordId = recordParts\.slice\(\)\.reverse\(\)\.find\(\(part\) => knownBlockIds\.has\(part\)\) \|\| "";/.test(source)) {
  fail("Split-global recall must recognize raw saved block labels like monTue/wedThu/friCarry and old record IDs with item-name suffixes.");
}

if (!/const submittedBlockMenuForRecord = \(record\) => \{[\s\S]*makeDatabaseRecordId\(parentId, "global", blockId\)[\s\S]*submittedGlobalBlockMenus\.get\(record\.globalBlockId\)[\s\S]*submittedGlobalBlockMenus\.get\(canonicalBlockId\)/.test(source)) {
  fail("Split-global child rows must be checked against the submitted canonical Global Block menu before recall.");
}

if (!/selectionDatabaseRecord\(\{ parentId, district, cafe, week, rotation: sourceRotation, stationKey, selectionType, itemName, sortOrder: offset \+ index \+ 1, slotNumber: index \+ 1, blockId, candidateRows \}\)/.test(source)) {
  fail("Split/global block saves must pass blockId into selection row identity.");
}

if (/const submitRotation = \(\) => \{[\s\S]*updateRotation\(nextRotation\);\s*persistRotationToDatabase\?\.\(nextRotation\);/.test(source)) {
  fail("Submit still marks the UI submitted before the backend save completes.");
}

if (!/setSubmitPersistError/.test(source) || !/SubmitSaveFailedModal/.test(source)) {
  fail("Submit failures need a visible blocking modal instead of a silent background fallback.");
}

if (!/function blockComplete\(block\) \{\s*return Boolean\(block\?\.menu && \(block\?\.entrees \|\| \[\]\)\.filter\(Boolean\)\.length >= 1\);\s*\}/.test(source)) {
  fail("Global and split-global blocks should require a menu and at least one entree, not sides or multiple entrees.");
}

if (!/function stationHasAnySelection/.test(source) || !/return stationHasAnySelection\(rotation, stationKey\);/.test(source)) {
  fail("Required non-global stations should submit with one selected item instead of strict station-specific counts.");
}

if (
  !/carveryPromotionOverride: \{[\s\S]*enabled: false,[\s\S]*selections: blankCarverySelections\(\)/.test(source)
  || !/cafe === "Dawson" && Boolean\(carveryPromo\.enabled\)/.test(source)
  || !/record\.stationKey === "carveryPromotion"/.test(source)
  || !/Carvery Promotion Override Active/.test(source)
  || !/!\(cafe === "Dawson" && promo\.enabled\)/.test(source)
) {
  fail("Dawson Carvery must keep an isolated promotion override that replaces normal Carvery fields and persists through dedicated records.");
}

if (
  !/stationKey === "carvery" && cafe === "Dawson" && rotation\.carveryPromotionOverride\?\.enabled/.test(source)
  || !/carveryPromotionIsActive\(rotation\.carveryPromotionOverride\)/.test(source)
  || !/label: "Carvery Promotion Override"/.test(source)
) {
  fail("Dawson Carvery promotion completion and recap rows must use the isolated promo selections.");
}

if (!/Select a Global Menu and at least one Global entree/.test(source) || !/Complete each required station/.test(source)) {
  fail("Submit blocked messaging must explain the relaxed one-selection requirements clearly.");
}

if (
  !/const CRICKET_DELI_MIN_SELECTIONS = 3;/.test(source)
  || !/Cricket: \{ deli: 6, freshFive: 5 \}/.test(source)
  || !/stationKey === "deli" && cafe === "Cricket"/.test(source)
  || !/ltoSelectedRows\(rotation, "deli", \{ unique: true \}\)\.length >= CRICKET_DELI_MIN_SELECTIONS/.test(source)
  || !/poolOverride=\{cafe === "Cricket" \? stationPool\("deli"\)\.filter/.test(source)
  || !/allowWriteIn=\{cafe !== "Cricket"\}/.test(source)
  || !/ariaLabel=\{`\$\{cafe\} \$\{slot\}`\}/.test(source)
  || !/Select at least 3 distinct sandwiches to submit\. Up to 6 selections are available\./.test(source)
) {
  fail("Cricket Deli must expose six accessible exact-menu slots, disable write-ins, and require three distinct sandwich selections for submission.");
}

if (!/function splitGlobalMenuOptionsForBlock/.test(source) || !/function duplicateSplitGlobalMenuIssues/.test(source) || !/splitGlobalMenuOptionsForBlock\(menuOptions, rotation, layout, blockInfo\.id\)/.test(source)) {
  fail("Split-global menu blocks must remove menus already selected in other blocks and report duplicate menus before submit.");
}

if (
  !/const DUPLICATE_MENU_ALLOWED_DISTRICTS = new Set\(\["North"\]\);/.test(source)
  || !/DUPLICATE_MENU_ALLOWED_DISTRICTS\.has\(district\)/.test(source)
  || !/function isDuplicateMenuAllowed\(district, menu\)/.test(source)
) {
  fail("North must allow duplicate Global menus across cafes while preserving the duplicate policy for other districts.");
}

if (/canSubmit=\{canSubmitRotation && !isSubmitting\}/.test(source)) {
  fail("The remote must not treat the temporary saving state as submit-blocked; saving should only disable the button.");
}

if (
  !/const \[isExpanded, setIsExpanded\] = useState\(false\);/.test(source)
  || !/aria-label="Planner Remote Control"/.test(source)
  || !/aria-expanded=\{isExpanded\}/.test(source)
  || !/showLabel=\{isExpanded\}/.test(source)
  || !/if \(isSubmitting\) setIsExpanded\(true\);/.test(source)
) {
  fail("The Planner Remote Control must default to a compact accessible icon bar, expand on request, and reveal submission details while saving.");
}

if (
  !/<RemoteButton icon=\{Save\} label="Save Draft"[\s\S]{0,200}showLabel=\{isExpanded\}/.test(source)
  || !/<RemoteButton icon=\{Send\} label=\{isSubmitting \? "Submitting\.\.\." : "Submit"\}[\s\S]{0,350}showLabel=\{isExpanded\}/.test(source)
) {
  fail("Save Draft and Submit must remain immediately available in the collapsed Planner Remote Control.");
}

if (
  !/grid-cols-7/.test(source)
  || !/grid-cols-4 sm:grid-cols-7/.test(source)
  || !/function RemoteUploadButton\(\{ onChange, showLabel = false \}\) \{\s*const inputRef = useRef\(null\);/.test(source)
  || !/onClick=\{\(\) => inputRef\.current\?\.click\(\)\}/.test(source)
) {
  fail("The compact remote must keep all seven actions visible on phones and expose Upload through a keyboard-operable button.");
}

if (
  !/items-center justify-center overflow-hidden rounded-xl border text-center/.test(source)
  || !/!text-\[8px\][\s\S]{0,120}sm:!text-\[9px\]/.test(source)
  || !/min-w-0 max-w-full whitespace-normal \[overflow-wrap:anywhere\] leading-\[1\.05\]/.test(source)
) {
  fail("Expanded Planner Remote Control labels must wrap within their own button boundaries.");
}

if (/Edit locked rotation/.test(source)) {
  fail("The duplicate top Edit locked rotation checkbox must be removed; edit should live on the submitted recap card.");
}

if (!/handleOpenPlannerFromSummary = \(row\)/.test(source) || !/onOpenPlanner=\{handleOpenPlannerFromSummary\}/.test(source) || !/onOpenPlanner \? \(\) => onOpenPlanner\(row\)/.test(source)) {
  fail("Executive and leadership summary cards must jump directly into that cafe's planner.");
}

if (!/const VISIBLE_ROTATION_WEEKS = ROTATION_WEEKS\.filter/.test(source) || !/const WEEK_SELECTOR_LOOKBACK_COUNT = 5/.test(source)) {
  fail("Neighborhood week selectors must only offer the current week, future weeks, and five prior weeks.");
}

if (!/ControlCard label="Week" value=\{week\} setValue=\{setWeek\} options=\{VISIBLE_ROTATION_WEEKS\}/.test(source) || !/ControlCard label="Leadership Week View" value=\{week\} setValue=\{setWeek\} options=\{VISIBLE_ROTATION_WEEKS\}/.test(source)) {
  fail("Planner and Executive week dropdowns must use the five-week selector window.");
}

if (!/const \[selectedResultRow, setSelectedResultRow\] = useState\(null\);/.test(source) || !/function ResultsSelectionDetail/.test(source) || !/onClick=\{\(\) => setSelectedResultRow\(row\)\}/.test(source)) {
  fail("Results history rows must open a saved-selection detail panel when clicked.");
}

if (/stationKey="salad"[\s\S]{0,700}poolOverride=\{cafe === "Doppler" \? stationPool\("saladFreshFive"\) : null\}/.test(source)) {
  fail("Doppler/Zane's Salad must use the full Menu Library salad pool, not the tiny Fresh Five salad override.");
}

if (carveryProteins.some((row) => /reuben|sandwich|panini|wrap/i.test(`${name(row)} ${station(row)}`))) {
  fail("Carvery protein pool contains sandwich/Reuben items.");
}

if (!carveryProteins.length) {
  fail("Carvery protein pool is empty.");
}

if (saladPool.length < 30 || saladPool.some((row) => menu(row) !== "AMZ: Cafe Express Curated Salads")) {
  fail("Salad LTO pool must expose the full Menu Library salad set from AMZ: Cafe Express Curated Salads.");
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
  'Bingo: ["global", "fishMarket", "grill", "grillFreshFive", "salad", "saladFreshFive"]',
  'Grace: ["streetBeets", "global", "grill", "freshFive", "salad"]',
  'Blueshift: ["global", "lotusWp", "grill", "salad", "deli", "fishMarket", "freshFive", "commissaryEverest"]',
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

if (!/const MOBY_POP_UP_START_WEEK = "2026-08-31";/.test(source) || !/const MOBY_POP_UP_DAYS = \["Tuesday", "Wednesday", "Thursday"\];/.test(source)) {
  fail("Dawson Moby Pop-Up must start with the Aug 31 week and only expose Tuesday through Thursday promo days.");
}

if (!/const cafeStationsForWeek = \(cafe = "", week = ""\) =>/.test(source) || !/isMobyPopUpActive\(cafe, week\)/.test(source) || !/const stationKeys = cafeStationsForWeek\(cafe, week\);/.test(source)) {
  fail("Dawson Moby Pop-Up must be week-gated and included in weekly submission requirements.");
}

if (!/mobyPopUp: normalizeMobyPopUp\(\)/.test(source) || !/mobyPopUpPromotionOverride: normalizeMobyPopUpPromotionOverride\(\)/.test(source)) {
  fail("Moby Pop-Up normal and promotion state must have isolated normalized defaults.");
}

if (!/mobyStationKey = useMobyPromo \? "mobyPopUpPromotion" : "mobyPopUp"/.test(source) || !/record\.stationKey === "mobyPopUp" \|\| record\.stationKey === "mobyPopUpPromotion"/.test(source)) {
  fail("Moby Pop-Up normal and promotion records must save and recall through isolated station keys.");
}

if (!/<CollapsibleStation title="Moby Pop-Up" eyebrow="Dawson · Tuesday–Thursday"/.test(source) || !/mobyPopUpMenuOptions\(menuOptions\)/.test(source) || !/Replace all normal Moby selections for this saved week/.test(source)) {
  fail("Moby Pop-Up must expose the Dawson UI, Global/Carvery menu choices, and whole-week promotion replacement behavior.");
}

if (!/function projectDawsonMobyGlobal\(/.test(source) || !/__dawsonMobyGlobalOverride/.test(source) || !/Global Station - Dawson Moby Pop-Up/.test(source)) {
  fail("Submitted Dawson Moby Pop-Up data must project into Moby's visible Global station.");
}

if (!/function DawsonMobyGlobalProjectionSection\(/.test(source) || !/Automatically supplied by Dawson/.test(source) || !/Dawson override active/.test(source)) {
  fail("An open Moby draft must render the submitted Dawson Global projection as read-only visible content.");
}

if (!/min-w-0 overflow-hidden rounded-lg border px-2/.test(source) || !/min-w-0 flex-1 whitespace-normal leading-tight \[overflow-wrap:anywhere\]/.test(source)) {
  fail("Cafe selector buttons must contain long labels such as Commissary without clipping their borders.");
}

if (!/function rotationMenuLabelForDuplicateReporting\(/.test(source) || !/const menu = rotationMenuLabelForDuplicateReporting\(row\);/.test(source)) {
  fail("Moby's Dawson projection must remain isolated from duplicate-menu reporting.");
}

if (!process.exitCode) {
  console.log(`Rotation integrity checks passed: ${carveryProteins.length} carvery proteins, ${saladPool.length} salads, ${deliPool.length} deli items, ${grillSpotlights.length} grill spotlights.`);
}
