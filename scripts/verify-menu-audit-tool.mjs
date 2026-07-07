import { readFileSync } from "node:fs";
import { buildAuditComparison, parseCentricBrandWorkbook, parseMenuWorksCsvText, parseSsmtWorkbook, preserveSpreadsheetText } from "../src/features/menu-audit/menuAuditModel.js";

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
      Z1: { v: "mrn", w: "mrn" },
      D2: { v: "EUR: Vegetable Palao Rice", w: "EUR: Vegetable Palao Rice" },
      E2: { v: "VEGETABLE PALAO RICE (V)", w: "VEGETABLE PALAO RICE (V)" },
      I2: { v: "basmati rice", w: "basmati rice" },
      Q2: { v: "Food", w: "Food" },
      Z2: { v: 165741.22, w: "165741.22" },
    },
    Modifiers: {
      "!ref": "A1:AH2",
      D1: { v: "name", w: "name" },
      E1: { v: "label", w: "label" },
      I1: { v: "description", w: "description" },
      R1: { v: "reporting_category_secondary", w: "reporting_category_secondary" },
      AB1: { v: "mrn", w: "mrn" },
      D2: { v: "EUR: Chana Masala", w: "EUR: Chana Masala" },
      E2: { v: "chana masala (vn)", w: "chana masala (vn)" },
      I2: { v: "garbanzo beans", w: "garbanzo beans" },
      R2: { v: "Modifier", w: "Modifier" },
      AB2: { v: 165741.24, w: "165741.24" },
    },
  },
};
const brand = parseCentricBrandWorkbook(brandWorkbook, { originalFileName: "messy.xlsx", uploadedAt: "2026-07-07T12:00:00.000Z" });
const modifier = brand.records.find((row) => row.recordType === "modifier");
assert(brand.brandName === "Amazon Balti (V4)", "Brand name must come from the Brand tab.");
assert(modifier?.name === "EUR: Chana Masala", "Modifier audit row must use the modifier item name, not group name.");
assert(modifier?.mrn === "165741.24", "Modifier MRN must preserve exact text from the detected MRN column.");

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

const menuAuditSource = readFileSync("src/features/menu-audit/MenuAuditTool.jsx", "utf8");
assert(!menuAuditSource.includes("brandReports.forEach((report) => values.add(report.brandName))"), "Brand uploads must not be added to the menu scope dropdown.");
assert(!menuAuditSource.includes("setSelectedMenu(parsed.brandName)"), "Brand uploads must not hijack the selected menu dropdown.");

console.log("Menu Audit Tool verification passed.");
