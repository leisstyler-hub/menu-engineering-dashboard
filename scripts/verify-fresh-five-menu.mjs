import { readFileSync } from "node:fs";

const expectedMrns = [
  "83821.10", "191329.1", "29091.10", "132011.3", "140744.1", "10908.11",
  "64175.3", "9888.16", "133954.1", "78426.3", "217792", "217792.1",
  "79691.32", "198522", "1424.40", "122676.3", "159013.1", "9268.7", "119416.1",
].sort();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const rows = JSON.parse(readFileSync("src/data/menuItems.json", "utf8").replace(/^\uFEFF/, ""));
const freshFiveRows = rows.filter((row) => row.menu === "AMZ: Fresh Five");
const actualMrns = freshFiveRows.map((row) => String(row.mrn || "")).sort();

assert(freshFiveRows.length === 19, `Fresh Five active replacement must contain exactly 19 rows; found ${freshFiveRows.length}.`);
assert(JSON.stringify(actualMrns) === JSON.stringify(expectedMrns), "Fresh Five MRN scope does not match the approved 2026-11-27 replacement source.");
assert(new Set(freshFiveRows.map((row) => row.item_key)).size === freshFiveRows.length, "Fresh Five item keys must be unique.");
assert(new Set(actualMrns).size === freshFiveRows.length, "Fresh Five MRNs must be unique.");
assert(freshFiveRows.every((row) => row.sourceDataVersion === "menuworks-fresh-five-2026-11-27"), "Every Fresh Five row must use the approved source version.");
assert(freshFiveRows.every((row) => row.sourceSha256 === "61855481d6a2eac946facf245c267e652779f493ada616d425ca2b7cef96e858"), "Every Fresh Five row must retain the source hash.");
assert(freshFiveRows.every((row) => row.dataSource === "menuworks-authoritative-replacement"), "Every Fresh Five row must identify the authoritative replacement import.");
assert(freshFiveRows.every((row) => row.price === 5), "Every Fresh Five row must retain the supplied $5 sell price.");
assert(freshFiveRows.every((row) => Number.isFinite(row.itemCost) && Number.isFinite(row.trueCost)), "Every Fresh Five row needs complete cost metadata.");
assert(freshFiveRows.every((row) => Math.abs(row.trueCost - Number((row.itemCost * (1 + row.wastePct)).toFixed(4))) < 0.00001), "Fresh Five true cost must equal Item Cost plus Waste.");
assert(freshFiveRows.every((row) => row.enticingDescription && row.ingredients && row.ingredientsCommonName), "Every Fresh Five row needs descriptions and ingredient metadata.");
assert(freshFiveRows.every((row) => Number.isFinite(row.calories) && Number.isFinite(row.protein_g) && Number.isFinite(row.sodium_mg)), "Every Fresh Five row needs calories, protein, and sodium.");
assert(freshFiveRows.every((row) => row.culinaryProfile?.identity?.mrn === row.mrn && row.culinaryProfile?.reviewStatus === "Needs review" && row.culinaryProfile?.provenance?.sourceSha256 === row.sourceSha256), "Every Fresh Five row must carry the Culinary Tags profile and evidence.");

const stationCounts = Object.fromEntries([...new Set(freshFiveRows.map((row) => row.station))].sort().map((station) => [station, freshFiveRows.filter((row) => row.station === station).length]));
assert(JSON.stringify(stationCounts) === JSON.stringify({ Deli: 6, Grill: 2, Salad: 11 }), "Fresh Five station counts do not match the source.");

console.log("Fresh Five menu verification passed (19 active rows: Deli 6, Grill 2, Salad 11).");
