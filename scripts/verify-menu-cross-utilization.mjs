import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx/xlsx.mjs";
import {
  matchKeyFor,
  normalizeDescription,
  isPantryExcluded,
  jaccardOverlap,
  findPair,
} from "../src/features/menu-cross-utilization/menuCrossUtilizationModel.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const data = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "menuCrossUtilization.json"), "utf8"));

// --- Structural checks -------------------------------------------------

assert(data.menus.length === 55, `Expected 55 menus, found ${data.menus.length}.`);
const sourceDir = path.join(root, "docs", "menu-cross-utilization", "shopping-lists");
const sourceFiles = fs.readdirSync(sourceDir).filter((name) => name.toLowerCase().endsWith(".pdf"));
assert(sourceFiles.length === 55, `Expected 55 source PDFs on disk, found ${sourceFiles.length}.`);
const generatedSourceFiles = new Set(data.menus.map((menu) => menu.sourceFile));
for (const fileName of sourceFiles) {
  assert(generatedSourceFiles.has(fileName), `Source file ${fileName} is not accounted for in the generated data (silent drop).`);
}

const chickle = data.menus.find((menu) => menu.name === "Chickle");
assert(chickle, "Chickle must remain visible in the menu list.");
assert(chickle.hasIngredientData === false, "Chickle must be flagged with no ingredient data, not silently dropped.");
assert(chickle.matchKeys.length === 0, "Chickle must have zero match keys.");
assert(!data.pairs.some((pair) => pair.a === "Chickle" || pair.b === "Chickle"), "Chickle must be excluded from the pairwise matrix grid.");

const menusWithData = data.menus.filter((menu) => menu.hasIngredientData);
assert(menusWithData.length === 54, `Expected 54 menus with ingredient data, found ${menusWithData.length}.`);
assert(data.pairs.length === (54 * 53) / 2, `Expected ${(54 * 53) / 2} unique pairs, found ${data.pairs.length}.`);

// --- Match-key rule: MIT when present, else documented normalized-description fallback -------

assert(matchKeyFor({ mit: "MIT-1410081", description: "Bread, White, Loaf, Bimbo" }) === "mit:MIT-1410081", "MIT rows must key on the MIT code.");
assert(matchKeyFor({ mit: "", description: "Water, Boiling" }) === "desc:water boiling", "MIT-less rows must fall back to the normalized description.");
assert(normalizeDescription("Peppers, Bell, Red, Fresh") === "peppers bell red fresh", "Normalized description must be case/punctuation-insensitive.");
assert(normalizeDescription("Peppers,  Bell,   Red, Fresh") === normalizeDescription("peppers bell red fresh"), "Normalization must collapse whitespace/punctuation differences so identical items match across menus.");

// --- Pantry exclusion guardrails (workbook's "Excluded low-signal pantry items") -------------

assert(isPantryExcluded("Water"), "Plain water must be pantry-excluded.");
assert(isPantryExcluded("Salt, Kosher"), "Generic salt must be pantry-excluded.");
assert(isPantryExcluded("Sugar, Granulated"), "Generic granulated sugar must be pantry-excluded.");
assert(isPantryExcluded("Oil, Canola, 100%, FB"), "Broad cooking oil must be pantry-excluded.");
assert(!isPantryExcluded("Oil, Sesame"), "Sesame oil is a distinctive item and must remain eligible.");
assert(!isPantryExcluded("Spice, Pepper, Cayenne"), "Cayenne is a specialty spice and must remain eligible.");

// --- Jaccard formula sanity ---------------------------------------------

const abc = new Set(["a", "b", "c"]);
const bcd = new Set(["b", "c", "d"]);
const overlap = jaccardOverlap(abc, bcd);
assert(overlap.sharedCount === 2, "Jaccard shared count must be the intersection size.");
assert(Math.abs(overlap.overlapPercent - 0.5) < 1e-9, "Jaccard overlap must be |intersection| / |union| (2/4 here).");

// --- Sample cross-check against the Compass workbook (validation reference, not source truth) -

const workbookPath = path.join(root, "docs", "menu-cross-utilization", "SEA_Cross_Utilization_Analysis.xlsx");
const workbook = XLSX.read(fs.readFileSync(workbookPath), { type: "buffer" });
const scorecardRows = XLSX.utils.sheet_to_json(workbook.Sheets["02 Menu Scorecard"], { header: 1, defval: "" }).slice(4);
const topMatchRows = XLSX.utils.sheet_to_json(workbook.Sheets["03 Top Matches"], { header: 1, defval: "" }).slice(4);

// The workbook is an independent, one-time LLM-derived extraction (Architect's design explicitly
// treats it as a validation reference, not primary truth — see PRODUCT_DECISIONS.md). This
// generator's coordinate-aware parser is expected to land within a couple of rows/SKUs of the
// workbook's counts, not byte-identical to them.
const ELIGIBLE_SKU_TOLERANCE = 3;
const SHARED_SKU_TOLERANCE = 3;

for (const menuName of ["Andes", "Anisa", "Ciudad", "Carvery"]) {
  const scorecardRow = scorecardRows.find((row) => row[0] === menuName);
  assert(scorecardRow, `Workbook scorecard is missing sample menu ${menuName}.`);
  const workbookEligible = Number(scorecardRow[3]);
  const generatedMenu = data.menus.find((menu) => menu.name === menuName);
  assert(generatedMenu, `Generated data is missing sample menu ${menuName}.`);
  const diff = Math.abs(generatedMenu.eligibleRowCount - workbookEligible);
  assert(diff <= ELIGIBLE_SKU_TOLERANCE, `${menuName}: generated eligible-SKU count ${generatedMenu.eligibleRowCount} diverges from workbook's ${workbookEligible} by more than ${ELIGIBLE_SKU_TOLERANCE}.`);

  const topMatchRow = topMatchRows.find((row) => row[0] === menuName && row[1] === 1);
  if (topMatchRow) {
    const matchMenuName = topMatchRow[3];
    const workbookSharedSkus = Number(topMatchRow[8]);
    const pair = findPair(data.pairs, menuName, matchMenuName);
    assert(pair, `Generated pairs are missing ${menuName} vs ${matchMenuName} (workbook's #1 match).`);
    const sharedDiff = Math.abs(pair.sharedCount - workbookSharedSkus);
    assert(sharedDiff <= SHARED_SKU_TOLERANCE, `${menuName} vs ${matchMenuName}: generated shared-SKU count ${pair.sharedCount} diverges from workbook's ${workbookSharedSkus} by more than ${SHARED_SKU_TOLERANCE}.`);
  }
}

// --- App wiring / copy guardrails ---------------------------------------

function assertIncludes(file, expected) {
  const text = fs.readFileSync(file, "utf8");
  assert(text.includes(expected), `${file} is missing expected marker: ${expected}`);
}

assertIncludes("src/app/LandingPage.jsx", "Menu Cross Utilization Tool");
assertIncludes("src/app/CulinaryToolsPlatformApp.jsx", "menuCrossUtilization");
assertIncludes("src/features/menu-cross-utilization/MenuCrossUtilizationTool.jsx", "Pillar Strategy");
assertIncludes("src/features/menu-cross-utilization/MenuCrossUtilizationTool.jsx", "Pairwise Matrix");
assertIncludes("src/features/menu-cross-utilization/MenuCrossUtilizationTool.jsx", "no ingredient data");
assertIncludes("src/features/menu-cross-utilization/MenuCrossUtilizationTool.jsx", "DATA.scope.account");
assert(data.scope.account === "Amazon Region (FBE000)", "Generated data scope stamp must read Amazon Region (FBE000).");

// The approved copy must explicitly disclaim prep/recipe/labor/cost/savings/waste proof (the
// build brief requires the words to appear as a negation), so this cannot be a bare
// word-presence ban — that would fail the required disclaimer itself. Instead it catches
// affirmative claim phrasing that the mission's guardrails explicitly forbid.
const toolSource = fs.readFileSync("src/features/menu-cross-utilization/MenuCrossUtilizationTool.jsx", "utf8");
const bannedClaimPatterns = [
  /\bproves? (shared|a shared)\b/i,
  /\blabor savings\b/i,
  /\bcost savings\b/i,
  /\breduces? waste\b/i,
  /\bguaranteed\b/i,
];
for (const pattern of bannedClaimPatterns) {
  assert(!pattern.test(toolSource), `Menu Cross Utilization Tool copy must not use affirmative claim language matching ${pattern}.`);
}
assert(/not.*(prep|recipe|labor|cost|savings|waste)/i.test(toolSource), "Menu Cross Utilization Tool must carry the required guidance-only disclaimer.");

console.log("Menu Cross Utilization Tool verification passed.");
