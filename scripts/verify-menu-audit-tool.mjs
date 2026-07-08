import { readFileSync } from "node:fs";
import { buildAuditComparison, filterRecordsForBrandAudit, menuScopeMatches, parseCentricBrandWorkbook, parseMenuWorksCsvText, parseSsmtWorkbook, preserveSpreadsheetText } from "../src/features/menu-audit/menuAuditModel.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(file, expected) {
  const text = readFileSync(file, "utf8");
  assert(text.includes(expected), `${file} is missing expected marker: ${expected}`);
}

assert(preserveSpreadsheetText("'165741.11") === "165741.11", "MenuWorks text MRN apostrophe was not handled safely.");
assert(preserveSpreadsheetText(165741.11) === "165741.11", "Numeric-looking MRN was not returned as text.");
assert(preserveSpreadsheetText("0012345.10") === "0012345.10", "MRN text must preserve leading/trailing digits.");

const csv = [
  "Menu Name,Recipe Number,Recipe Name,Short Name,Recipe Category.,Enticing Description,Menu Item Notes,Sell Price",
  "AMZ: Chaatwalla,'165741.11,EUR: Kachumbar Salad,Kachumbar,Side Salad > Side Salad,crisp salad,A La Carte and Side Choice,$2.55",
].join("\n");
const menuWorksRows = parseMenuWorksCsvText(csv);
assert(menuWorksRows[0]?.mrn === "165741.11", "Master App Data parser must preserve exact MRN text.");

const brandWorkbook = {
  SheetNames: ["Brand", "Items", "Modifiers"],
  Sheets: {
    Brand: {
      "!ref": "A1:F2",
      A1: { v: "id", w: "id" },
      B1: { v: "name", w: "name" },
      B2: { v: "Amazon Balti (V4)", w: "Amazon Balti (V4)" },
    },
    Items: {
      "!ref": "A1:Z2",
      D1: { v: "name", w: "name" },
      E1: { v: "label", w: "label" },
      I1: { v: "description", w: "description" },
      Q1: { v: "reporting_category_primary", w: "reporting_category_primary" },
      R1: { v: "reporting_category_secondary", w: "reporting_category_secondary" },
      U1: { v: "price", w: "price" },
      W1: { v: "calories", w: "calories" },
      Z1: { v: "mrn", w: "mrn" },
      D2: { v: "EUR: Vegetable Palao Rice", w: "EUR: Vegetable Palao Rice" },
      E2: { v: "VEGETABLE PALAO RICE (V)", w: "VEGETABLE PALAO RICE (V)" },
      I2: { v: "basmati rice", w: "basmati rice" },
      Q2: { v: "Food", w: "Food" },
      R2: { v: "R FSV | DHABA | Vegetable Palao Side", w: "R FSV | DHABA | Vegetable Palao Side" },
      U2: { v: 2.5, w: "2.50" },
      W2: { v: 270, w: "270" },
      Z2: { v: 165741.22, w: "165741.22" },
    },
    Modifiers: {
      "!ref": "A1:AH2",
      D1: { v: "name", w: "name" },
      E1: { v: "label", w: "label" },
      I1: { v: "description", w: "description" },
      Q1: { v: "reporting_category_primary", w: "reporting_category_primary" },
      R1: { v: "reporting_category_secondary", w: "reporting_category_secondary" },
      U1: { v: "price", w: "price" },
      W1: { v: "calories", w: "calories" },
      AB1: { v: "mrn", w: "mrn" },
      D2: { v: "EUR: Chana Masala", w: "EUR: Chana Masala" },
      E2: { v: "chana masala (vn)", w: "chana masala (vn)" },
      I2: { v: "garbanzo beans", w: "garbanzo beans" },
      Q2: { v: "Food", w: "Food" },
      R2: { v: "Modifier", w: "Modifier" },
      U2: { v: 0, w: "0.00" },
      W2: { v: 110, w: "110" },
      AB2: { v: 165741.24, w: "165741.24" },
    },
  },
};
const brand = parseCentricBrandWorkbook(brandWorkbook, { originalFileName: "messy.xlsx", uploadedAt: "2026-07-07T12:00:00.000Z" });
const brandItem = brand.records.find((row) => row.recordType === "item");
const modifier = brand.records.find((row) => row.recordType === "modifier");
assert(brand.brandName === "Amazon Balti (V4)", "Brand name must come from the Brand tab.");
assert(brandItem?.category === "Food", "Brand item category must use reporting_category_primary first.");
assert(brandItem?.reportingCategorySecondary === "R FSV | DHABA | Vegetable Palao Side", "Brand item secondary category should still be retained.");
assert(brandItem?.price === "2.50", "Brand item price must be retained as text.");
assert(brandItem?.calories === "270", "Brand item calories must be retained as text.");
assert(modifier?.name === "EUR: Chana Masala", "Modifier audit row must use the modifier item name, not group name.");
assert(modifier?.category === "Modifier", "Brand modifier rows must read as modifiers for SSMT-to-Centric comparison.");
assert(modifier?.reportingCategoryPrimary === "Food", "Brand modifier primary reporting category should still be retained.");
assert(modifier?.mrn === "165741.24", "Modifier MRN must preserve exact text from the detected MRN column.");
assert(menuScopeMatches("Balti (Dhaba)", "Amazon Balti (V4)"), "Brand upload scope should match the matching SSMT/app menu label.");

const noBrandScope = filterRecordsForBrandAudit({
  baseRecords: [{ source: "ssmt", recordType: "item", menuName: "Balti (Dhaba)", displayName: "SSMT Item", name: "SSMT Item", mrn: "111.11" }],
  brandReports: [],
  selectedMenu: "Balti (Dhaba)",
});
assert(noBrandScope.records.length === 0 && !noBrandScope.hasUploadedBrandForScope, "Brand audit should stay empty and flagged until a brand report is uploaded.");

const brandScope = filterRecordsForBrandAudit({
  baseRecords: [
    { source: "ssmt", recordType: "item", menuName: "Balti (Dhaba)", displayName: "SSMT Item", name: "SSMT Item", mrn: "111.11" },
    { source: "ssmt", recordType: "item", menuName: "AMZ: House of Teriyaki", displayName: "Wrong Menu", name: "Wrong Menu", mrn: "222.22" },
  ],
  brandReports: [brand],
  selectedMenu: "Balti (Dhaba)",
});
assert(brandScope.hasUploadedBrandForScope, "Matching brand upload should activate Brand vs App + SSMT mode.");
assert(brandScope.records.some((row) => row.menuName === "Balti (Dhaba)"), "Brand audit should include matching SSMT rows so missing Centric programming is visible.");
assert(!brandScope.records.some((row) => row.menuName === "AMZ: House of Teriyaki"), "Brand audit should not pull unrelated menus into the selected brand comparison.");

const ssmtWorkbook = {
  SheetNames: ["Indian Micro Modifiers"],
  Sheets: {
    "Indian Micro Modifiers": {
      "!ref": "A1:I15",
      A1: { v: "Modifier Group Name", w: "Modifier Group Name" },
      B1: { v: "Modifier Group Name", w: "Modifier Group Name" },
      F1: { v: "Choices", w: "Choices" },
      G1: { v: "MRN", w: "MRN" },
      H1: { v: "Description", w: "Description" },
      I1: { v: "Price Selector", w: "Price Selector" },
      B13: { v: "Raita/Chutney Modifier", w: "Raita/Chutney Modifier" },
      F14: { v: "remove spicy cilantro chutney (vn)", w: "remove spicy cilantro chutney (vn)" },
      G14: { v: 81768, w: "81768" },
      F15: { v: "chana masala (vn)", w: "chana masala (vn)" },
      G15: { v: 165741.24, w: "165741.24" },
      H15: { v: "garbanzo beans", w: "garbanzo beans" },
    },
  },
};
const ssmt = parseSsmtWorkbook(ssmtWorkbook, { originalFileName: "SEA Standard Menu Template.xlsx", uploadedAt: "2026-07-07T12:00:00.000Z" });
assert(!ssmt.records.some((row) => row.name.includes("spicy cilantro")), "SSMT remove modifier rows should be ignored.");
assert(ssmt.records.some((row) => row.name === "chana masala (vn)" && row.mrn === "165741.24"), "SSMT modifier item name and MRN were not parsed.");

const brandOnlyRows = buildAuditComparison([
  { source: "centric_brand", recordType: "item", menuName: "Amazon Balti (V4)", displayName: "Old Centric Item", name: "Old Centric Item", mrn: "999.11", category: "Food" },
], { expectedSources: ["master_app", "ssmt", "centric_brand"] });
assert(brandOnlyRows[0]?.status === "Remove from Centric Brand", "Brand-only rows should clearly tell the user to remove stale Centric items.");

const ssmtOnlyRows = buildAuditComparison([
  { source: "ssmt", recordType: "item", menuName: "Balti", displayName: "Ready for Programming", name: "Ready for Programming", mrn: "888.11", category: "Food" },
], { expectedSources: ["master_app", "ssmt", "centric_brand"] });
assert(ssmtOnlyRows[0]?.status === "Needs Centric Programming", "SSMT-only rows should read as needed Centric programming, not a generic missing brand error.");

const ssmtVsAppGapRows = buildAuditComparison([
  { source: "ssmt", recordType: "item", menuName: "Balti", displayName: "SSMT Only Item", name: "SSMT Only Item", mrn: "777.11", category: "Food" },
], { expectedSources: ["master_app", "ssmt"] });
assert(ssmtVsAppGapRows[0]?.status === "Missing from Culinary App", "SSMT vs App gaps should flag missing Culinary App records.");

const modifierRows = buildAuditComparison([
  { source: "ssmt", recordType: "modifier", menuName: "Balti", displayName: "Chana Masala", name: "Chana Masala", mrn: "165741.24", category: "Modifier" },
  { source: "centric_brand", recordType: "modifier", menuName: "Amazon Balti (V4)", displayName: "Chana Masala", name: "EUR: Chana Masala", mrn: "165741.24", category: "Modifier", reportingCategoryPrimary: "Food", reportingCategorySecondary: "Modifier" },
], { expectedSources: ["master_app", "ssmt", "centric_brand"] });
assert(modifierRows[0]?.status === "Match", "Modifier rows should compare SSMT to Centric without requiring Master App Data.");

const ssmtVsAppRows = buildAuditComparison([
  { source: "master_app", recordType: "item", menuName: "AMZ: Andes", displayName: "Aji De Gallina", name: "Aji De Gallina", mrn: "122251" },
  { source: "ssmt", recordType: "item", menuName: "AMZ: Andes", displayName: "Aji De Gallina", name: "Aji De Gallina", mrn: "122251" },
], { expectedSources: ["master_app", "ssmt"] });
assert(ssmtVsAppRows[0]?.status === "Match", "SSMT vs App comparison must not require a Brand Report upload.");

assertIncludes("src/app/LandingPage.jsx", "Menu Audit Tool");
assertIncludes("src/app/CulinaryToolsPlatformApp.jsx", "menuAuditTool");
assertIncludes("src/features/menu-audit/MenuAuditTool.jsx", "Master App Data");
assertIncludes("src/features/menu-audit/MenuAuditTool.jsx", "SSMT vs App Data");
assertIncludes("src/features/menu-audit/MenuAuditTool.jsx", "setComparisonMode");
assertIncludes("src/features/menu-audit/MenuAuditTool.jsx", "Remove from Centric Brand");
assertIncludes("src/features/menu-audit/MenuAuditTool.jsx", "Needs Centric Programming");
assertIncludes("src/features/menu-audit/MenuAuditTool.jsx", "Missing from Culinary App");
assertIncludes("src/features/menu-audit/MenuAuditTool.jsx", "does not have a Centric Brand Report uploaded yet");
assertIncludes("src/features/menu-audit/MenuAuditTool.jsx", "priceCalLabel");

const menuAuditSource = readFileSync("src/features/menu-audit/MenuAuditTool.jsx", "utf8");
assert(!menuAuditSource.includes("brandReports.forEach((report) => values.add(report.brandName))"), "Brand uploads must not be added to the menu scope dropdown.");
assert(!menuAuditSource.includes("setSelectedMenu(parsed.brandName)"), "Brand uploads must not hijack the selected menu dropdown.");

console.log("Menu Audit Tool verification passed.");
