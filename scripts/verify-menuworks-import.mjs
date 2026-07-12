import { existsSync, readFileSync } from "node:fs";

const rows = JSON.parse(readFileSync("src/data/menuItems.json", "utf8"));
const rawArchivePath = "public/data/master-menus-raw-2026-07-12.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function byMrn(mrn) {
  return rows.find((row) => String(row.mrn) === String(mrn));
}

function byName(name) {
  const needle = String(name).toLowerCase();
  return rows.find((row) => String(row.recipeName || row.displayName || row.item || "").toLowerCase().includes(needle));
}

function assertNameMrn(name, expectedMrn) {
  const row = byName(name);
  assert(row, `Expected ${name} to be present.`);
  assert(String(row.mrn) === expectedMrn, `Expected ${name} MRN ${expectedMrn}, found ${row.mrn}.`);
}

assert(rows.length === 1550, `Expected 1550 Master Menus rows after the July 12 import, found ${rows.length}.`);
assert(rows.every((row) => /^AMZ(\+RA)?:/.test(String(row.menu || ""))), "Menu item data includes non-menu legal/footer rows.");
assert(rows.every((row) => !String(row.mrn || "").includes("/")), "Recipe numbers were parsed as dates. CSV must be read in raw mode.");
assert(rows.every((row) => !String(row.mrn || "").startsWith("'")), "Recipe numbers should not retain the MenuWorks leading apostrophe.");
assert(rows.every((row) => row.sourceDataVersion === "master-menus-2026-07-12"), "Master Menus source version marker is missing or mixed.");
assert(rows.every((row) => row.sourceFileName === "Master Menus 7-12-26.csv"), "Master Menus source file marker is missing.");

assertNameMrn("Kachumbar Salad", "165741.11");
assertNameMrn("Mango Sticky Rice", "182206.25");
assertNameMrn("Classic Smashburger", "147955.17");
assertNameMrn("Smashburger Patty", "147955.16");
assertNameMrn("Spicy Firebird Sandwich", "107374.37");
assertNameMrn("Portobello Tofu Teriyaki", "107142.156");
assertNameMrn("Green Curry Pork Bowl", "101666.11");
assertNameMrn("Green Curry Tofu Bowl", "182206.41");

const aji = byMrn("122251");
assert(aji, "Expected Aji De Gallina MRN 122251 to be present.");
assert(
  String(aji.enticingDescription || "").includes("creamy aji pepper sauce"),
  "Aji De Gallina description was not retained."
);
assert(
  String(aji.menuWorksDescription || "").includes("creamy aji pepper sauce"),
  "Secondary MenuWorks description for Aji De Gallina was not stored."
);
assert(["source-truth-preserved", "menuworks-import"].includes(aji.primaryDescriptionSource), "Description source should show how copy was chosen.");

const jasmine = byMrn("5354.11");
assert(jasmine, "Expected Jasmine Rice MRN 5354.11 to survive raw recipe-number import.");

const hibernateRows = rows.filter((row) => row.menu === "AMZ: Fresh Five" && row.station === "Hibernate");
assert(hibernateRows.length >= 40, `Expected at least 40 Fresh Five Hibernate rows, found ${hibernateRows.length}.`);
assert(
  hibernateRows.every((row) => row.effectiveDate === "2026-08-01"),
  "Fresh Five Hibernate rows must be tagged with effectiveDate 2026-08-01."
);

const hibernateSandwich = hibernateRows.find((row) => String(row.recipeName || "").includes("Honey Buffalo Chickpea Chicken Sandwich"));
assert(hibernateSandwich, "Expected Fresh Five Hibernate sandwich sample to be present.");
assert(typeof hibernateSandwich.proteinG === "number" && hibernateSandwich.proteinG > 0, "Protein grams were not stored.");
assert(typeof hibernateSandwich.sodiumMg === "number" && hibernateSandwich.sodiumMg > 0, "Sodium mg was not stored.");
assert(typeof hibernateSandwich.carbsG === "number" && hibernateSandwich.carbsG > 0, "Carb grams were not stored.");
assert(typeof hibernateSandwich.transFatG === "number", "Trans fat grams were not stored.");
assert(hibernateSandwich.nutrition && typeof hibernateSandwich.nutrition === "object", "Nested nutrition object is missing.");
assert(hibernateSandwich.nutritionDailyValues && typeof hibernateSandwich.nutritionDailyValues === "object", "Nutrition daily value details were not stored.");
assert(hibernateSandwich.mealPatternContributions && typeof hibernateSandwich.mealPatternContributions === "object", "Meal pattern contribution details were not stored.");
assert(hibernateSandwich.menuWorksRaw && typeof hibernateSandwich.menuWorksRaw === "object", "Useful raw MenuWorks row data was not retained.");
assert(typeof hibernateSandwich.menuWorksRawArchivePath === "string" && hibernateSandwich.menuWorksRawArchivePath, "Full raw MenuWorks archive path is missing.");
assert(hibernateSandwich.menuWorksRawArchivePath === "/data/master-menus-raw-2026-07-12.json", "Full raw Master Menus archive path is not current.");
assert(typeof hibernateSandwich.menuItemRole === "string" && hibernateSandwich.menuItemRole, "Menu item role from Menu Item Notes is missing.");
assert(existsSync(rawArchivePath), "Full raw MenuWorks archive file is missing.");

const rawArchive = JSON.parse(readFileSync(rawArchivePath, "utf8"));
assert(rawArchive.length > 0, "Full raw MenuWorks archive should retain source rows from the import file.");
assert(
  rawArchive.some((row) => row.mrn === "122251" && row.raw && row.raw["Enticing Description"]),
  "Full raw MenuWorks archive does not retain source description details."
);

console.log("MenuWorks import verification passed.");
