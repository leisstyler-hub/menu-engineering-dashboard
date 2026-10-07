import { readFileSync } from "node:fs";

const expectedMrns = [
  "83821.10", "191329.1", "29091.10", "132011.3", "140744.1", "10908.11", "135643.15",
  "64175.3", "9888.16", "133954.1", "78426.3", "217792", "198596", "217792.1",
  "79691.32", "198522", "1424.40", "122676.3", "159013.1", "9268.7", "119416.1",
].sort();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const rows = JSON.parse(readFileSync("src/data/menuItems.json", "utf8").replace(/^\uFEFF/, ""));
const freshFiveRows = rows.filter((row) => row.menu === "AMZ: Fresh Five");
const actualMrns = freshFiveRows.map((row) => String(row.mrn || "")).sort();

assert(freshFiveRows.length === 21, `Fresh Five must contain exactly 21 rows; found ${freshFiveRows.length}.`);
assert(JSON.stringify(actualMrns) === JSON.stringify(expectedMrns), "Fresh Five MRN scope does not match the approved 2026-10-06 source.");
assert(new Set(freshFiveRows.map((row) => row.item_key)).size === freshFiveRows.length, "Fresh Five item keys must be unique.");
assert(new Set(actualMrns).size === freshFiveRows.length, "Fresh Five MRNs must be unique.");
assert(freshFiveRows.every((row) => row.sourceDataVersion === "fresh-five-2026-10-06"), "Every Fresh Five row must use the approved source version.");
assert(freshFiveRows.every((row) => row.dataSource === "menuworks-fresh-five-import"), "Every Fresh Five row must identify the MenuWorks Fresh Five import.");
assert(freshFiveRows.every((row) => row.price === 5), "Every Fresh Five row must retain the supplied $5 sell price.");
assert(freshFiveRows.every((row) => Number.isFinite(row.itemCost) && Number.isFinite(row.trueCost)), "Every Fresh Five row needs complete cost metadata.");
assert(freshFiveRows.every((row) => Math.abs(row.trueCost - Number((row.itemCost * (1 + row.wastePct)).toFixed(4))) < 0.00001), "Fresh Five true cost must equal Item Cost plus Waste.");
assert(freshFiveRows.every((row) => row.enticingDescription && row.ingredients && row.ingredientsCommonName), "Every Fresh Five row needs descriptions and ingredient metadata.");
assert(freshFiveRows.every((row) => Number.isFinite(row.calories) && Number.isFinite(row.proteinG) && Number.isFinite(row.sodiumMg)), "Every Fresh Five row needs calories, protein, and sodium.");
assert(freshFiveRows.every((row) => row.allergenSummary && Object.keys(row.allergenDetails || {}).length === 27), "Every Fresh Five row needs an allergen summary and complete allergen flags.");
assert(freshFiveRows.every((row) => row.menuWorksRawArchivePath === "/data/fresh-five-raw-2026-10-06.json"), "Every Fresh Five row must link to the archived raw source.");

const rawArchive = JSON.parse(readFileSync("public/data/fresh-five-raw-2026-10-06.json", "utf8"));
assert(rawArchive.length === 21, `Fresh Five raw archive must contain 21 rows; found ${rawArchive.length}.`);
assert(rawArchive.every((row) => row.menu === "AMZ: Fresh Five" && row.sourceDataVersion === "fresh-five-2026-10-06"), "Fresh Five raw archive scope/version is invalid.");

const stationCounts = Object.fromEntries([...new Set(freshFiveRows.map((row) => row.station))].sort().map((station) => [station, freshFiveRows.filter((row) => row.station === station).length]));
assert(JSON.stringify(stationCounts) === JSON.stringify({ Deli: 6, Grill: 2, Salad: 13 }), "Fresh Five station counts do not match the source.");

console.log("Fresh Five menu verification passed (21 rows: Deli 6, Grill 2, Salad 13).");
