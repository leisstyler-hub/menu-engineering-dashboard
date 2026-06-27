import { existsSync, readFileSync } from "node:fs";

const rows = JSON.parse(readFileSync("src/data/menuItems.json", "utf8"));
const rawArchivePath = "public/data/menuworks-raw-2026-06-26-7ff8ac47.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function byMrn(mrn) {
  return rows.find((row) => String(row.mrn) === String(mrn));
}

assert(rows.length >= 1500, `Expected at least 1500 menu item rows after MenuWorks import, found ${rows.length}.`);
assert(rows.every((row) => /^AMZ(\+RA)?:/.test(String(row.menu || ""))), "Menu item data includes non-menu legal/footer rows.");
assert(rows.every((row) => !String(row.mrn || "").includes("/")), "Recipe numbers were parsed as dates. CSV must be read in raw mode.");
assert(rows.some((row) => row.sourceDataVersion === "menuworks-2026-06-26-7ff8ac47"), "MenuWorks source version marker is missing.");

const aji = byMrn("122251");
assert(aji, "Expected Aji De Gallina MRN 122251 to be present.");
assert(
  String(aji.enticingDescription || "").includes("served over grains and your choice of two sides"),
  "Trusted source-of-truth description for Aji De Gallina was overwritten."
);
assert(
  String(aji.menuWorksDescription || "").includes("creamy aji pepper sauce"),
  "Secondary MenuWorks description for Aji De Gallina was not stored."
);
assert(aji.primaryDescriptionSource === "source-truth-preserved", "Description source should show that trusted copy was preserved.");

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
assert(hibernateSandwich.menuWorksRaw && typeof hibernateSandwich.menuWorksRaw === "object", "Useful raw MenuWorks row data was not retained.");
assert(hibernateSandwich.menuWorksRawArchivePath === "/data/menuworks-raw-2026-06-26-7ff8ac47.json", "Full raw MenuWorks archive path is missing.");
assert(existsSync(rawArchivePath), "Full raw MenuWorks archive file is missing.");

const rawArchive = JSON.parse(readFileSync(rawArchivePath, "utf8"));
assert(rawArchive.length === rows.length, "Full raw MenuWorks archive should retain one raw source row per imported item.");
assert(
  rawArchive.some((row) => row.mrn === "122251" && row.raw && row.raw["Enticing Description"]),
  "Full raw MenuWorks archive does not retain source description details."
);

console.log("MenuWorks import verification passed.");
