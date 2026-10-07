import { existsSync, readFileSync } from "node:fs";

const rows = JSON.parse(readFileSync("src/data/menuItems.json", "utf8"));
const masterRows = rows.filter((row) => row.sourceDataVersion === "master-menus-2026-07-12");
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

assert(masterRows.length === 1469, `Expected 1469 retained Master Menus rows after the Fresh Five replacement, found ${masterRows.length}.`);
assert(rows.every((row) => /^AMZ(\+RA)?:/.test(String(row.menu || ""))), "Menu item data includes non-menu legal/footer rows.");
assert(rows.every((row) => !String(row.mrn || "").includes("/")), "Recipe numbers were parsed as dates. CSV must be read in raw mode.");
assert(rows.every((row) => !String(row.mrn || "").startsWith("'")), "Recipe numbers should not retain the MenuWorks leading apostrophe.");
assert(masterRows.every((row) => row.sourceFileName === "Master Menus 7-12-26.csv"), "Master Menus source file marker is missing.");

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
assert(hibernateRows.length === 0, "Fresh Five rows omitted from the approved replacement must not survive as Hibernate records.");
assert(existsSync(rawArchivePath), "Full raw MenuWorks archive file is missing.");

const rawArchive = JSON.parse(readFileSync(rawArchivePath, "utf8"));
assert(rawArchive.length > 0, "Full raw MenuWorks archive should retain source rows from the import file.");
assert(
  rawArchive.some((row) => row.mrn === "122251" && row.raw && row.raw["Enticing Description"]),
  "Full raw MenuWorks archive does not retain source description details."
);

console.log("MenuWorks import verification passed.");
