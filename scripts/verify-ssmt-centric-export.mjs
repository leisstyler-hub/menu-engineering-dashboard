import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import XLSX from "xlsx";
import {
  buildCentricExportWorkbook,
  centricExportFileName,
  CENTRIC_EXPORT_SHEET_NAMES,
} from "../src/features/ssmt/ssmtCentricExport.js";

const seedData = JSON.parse(readFileSync("public/data/ssmtSeedData.json", "utf8"));

const expectedGlobalMenus = [
  "Andes",
  "Anisa",
  "Atlas Noodle",
  "Balti",
  "Bibimbowl",
  "Bowld",
  "Cevicheria",
  "Chatwalla",
  "Chiang Mai",
  "Ciudad",
  "Cypress",
  "Global Grains",
  "Harvest & Co",
  "House of Teriyaki",
  "Lemongrass Lime",
  "Lotus",
  "Masaya",
  "Ohana",
  "Pho",
  "Piccola Italia",
  "Poke",
  "Porto",
  "Q Bowl",
  "Retail Extensions",
  "Roam BBQ",
  "Saffron",
  "SE: Birria",
  "SE: Fried Rice",
  "SE: Naanwich",
  "SE: Pho Dip",
  "SE: Quesadilla",
  "Smokehouse BBQ",
  "Smoothies",
  "Sushi",
  "Tavola Nova",
  "Yakisoba",
];

for (const menuName of expectedGlobalMenus) {
  const menu = seedData.menus.find((candidate) => candidate.name === menuName);
  assert(menu, `${menuName} should be included in SSMT seed menus.`);
  assert.equal(menu.type, "Global", `${menuName} should be grouped as Global.`);
}

const coreMenu = seedData.menus.find((candidate) => candidate.name === "Breakfast");
assert.equal(coreMenu?.type, "Core", "Breakfast should remain grouped as Core.");

assert.equal(centricExportFileName("Amazon Carvery (V4)"), "Amazon Carvery (V4) SSMT Export.xlsx");
assert.equal(centricExportFileName(""), "SSMT Export.xlsx");

const selectedMenu = {
  id: "menu-export-test",
  name: "Amazon Carvery (V4)",
  type: "Core",
  items: [
    {
      id: "divider-1",
      recordType: "divider",
      title: "SANDWICHES",
    },
    {
      id: "item-1",
      name: "EUR: Test Sandwich",
      label: "TEST SANDWICH",
      description: "test sandwich description",
      mrn: "123456.78",
      category: "Food",
      secondaryCategory: "Entree",
      reportingCategorySecondary: "Entree",
      calories: "540",
      seaPrice: "$8.45",
      areaPrices: {
        AUS: "$9.40",
        SEA: "$8.45",
        MCO: "",
      },
      modifierGroups: ["Choice of Sauce"],
    },
  ],
};

const modifierGroups = [
  {
    id: "group-1",
    name: "Choice of Sauce",
    modifierType: "Addition",
    minQty: "0",
    maxQty: "4",
    choices: [
      {
        id: "choice-1",
        label: "Garlic Aioli",
        description: "garlic sauce",
        mrn: "987654.32",
        calories: "80",
        price: "$0.75",
        areaPrices: {
          AUS: "$0.85",
          SEA: "$0.75",
        },
      },
    ],
  },
];

const workbook = buildCentricExportWorkbook({
  selectedMenu,
  areaOrder: seedData.areaOrder,
  modifierGroups,
});

assert.deepEqual(workbook.SheetNames, CENTRIC_EXPORT_SHEET_NAMES);

const sheetRows = (sheetName) => XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
  header: 1,
  raw: false,
  defval: "",
});

const brandRows = sheetRows("Brand");
assert.equal(brandRows[1][0], "", "Brand Centric id should be blank for import-by-name workflows.");
assert.equal(brandRows[1][1], "Amazon Carvery (V4)", "Brand tab should use the selected menu as the export brand name.");

const menuRows = sheetRows("Menus");
assert.equal(menuRows[1][1], "AMAZON CARVERY (V4)", "Menus tab should include a Centric menu record name.");

const categoryRows = sheetRows("Categories");
assert(categoryRows.some((row) => row[1] === "SANDWICHES"), "Divider title should create a category row.");

const itemRows = sheetRows("Items");
assert.equal(itemRows[0][0], "id");
assert.equal(itemRows[0][25], "mrn");
assert.equal(itemRows[1][0], "", "Item Centric id should be blank for import-by-name workflows.");
assert.equal(itemRows[1][1], "", "Item unique_id should be blank when SSMT has no Centric-owned value.");
assert.equal(itemRows[1][3], "EUR: Test Sandwich");
assert.equal(itemRows[1][4], "TEST SANDWICH");
assert.equal(itemRows[1][9], "8.45");
assert.equal(itemRows[1][10], "540");
assert.equal(itemRows[1][25], "123456.78", "Item MRN must stay exact text.");
assert.equal(itemRows[1][32], "9.40");
assert.equal(itemRows[1][42], "8.45");
assert.equal(itemRows[1][47], "", "Optional missing area prices should stay blank for IT/Centric cleanup.");

const modifierGroupRows = sheetRows("Modifier Groups");
assert.equal(modifierGroupRows[1][1], "Choice of Sauce");
assert.equal(modifierGroupRows[1][5], "0");
assert.equal(modifierGroupRows[1][6], "4");
assert.equal(modifierGroupRows[1][7], "selection");

const modifierRows = sheetRows("Modifiers");
assert.equal(modifierRows[1][3], "Garlic Aioli");
assert.equal(modifierRows[1][9], "0.75");
assert.equal(modifierRows[1][11], "", "Optional modifier cost should stay blank.");
assert.equal(modifierRows[1][27], "987654.32", "Modifier MRN must stay exact text.");

const relationshipRows = sheetRows("Relationships").map((row) => row.slice(0, 3).join("|"));
assert(relationshipRows.includes("Menu|AMAZON CARVERY (V4)|Amazon Carvery (V4)"));
assert(relationshipRows.includes("Category|SANDWICHES|AMAZON CARVERY (V4)"));
assert(relationshipRows.includes("Item|EUR: Test Sandwich|SANDWICHES"));
assert(relationshipRows.includes("Modifier Group|Choice of Sauce|EUR: Test Sandwich"));
assert(relationshipRows.includes("Modifier|Garlic Aioli|Choice of Sauce"));

console.log("SSMT Centric export model verified.");
