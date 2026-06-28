import { readFileSync } from "node:fs";
import { itemTrustFlags, itemTrustStatus } from "../src/features/recipe-database/recipeLibraryModel.js";

const rows = JSON.parse(readFileSync("src/data/menuItems.json", "utf8"));
const name = (row) => row.item || row.displayName || row.shortName || row.recipeName || "";
const findRow = (menuPattern, itemPattern) => rows.find((row) => menuPattern.test(row.menu || "") && itemPattern.test(name(row)));
const flagsFor = (row) => itemTrustFlags(row).map((flag) => flag.label);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const eggplant = findRow(/Roam BBQ/i, /Kombu Miso Eggplant/i);
const sweetSourSauce = findRow(/Lotus/i, /Sweet and Sour Sauce/i);
const tacoProtein = findRow(/Taco Total/i, /Beef Barbacoa/i);
const freshVegetableLasagna = findRow(/Piccola Italia/i, /Fresh Vegetable Lasagna/i);

assert(eggplant, "Expected Kombu Miso Eggplant to exist for trust false-positive coverage.");
assert(sweetSourSauce, "Expected Sweet and Sour Sauce to exist for support-item trust coverage.");
assert(tacoProtein, "Expected Beef Barbacoa to exist for protein price-gap coverage.");
assert(freshVegetableLasagna, "Expected Fresh Vegetable Lasagna to exist for missing-cost coverage.");

assert(!flagsFor(eggplant).includes("Protein price gap"), "Eggplant must not be flagged as protein because of the word egg.");
assert(!flagsFor(sweetSourSauce).includes("Protein price gap"), "Support sauces must not become protein price gaps because ingredients mention steak sauce.");
assert(flagsFor(tacoProtein).includes("Protein price gap"), "Unpriced Taco Total protein choices should stay visible as protein price gaps.");
assert(flagsFor(freshVegetableLasagna).includes("Missing true cost"), "Rows missing true cost should stay visible for trust review.");

const statusCounts = rows.reduce((acc, row) => {
  const status = itemTrustStatus(row);
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});
const reviewCount = statusCounts["Needs Review"] || 0;
const watchCount = statusCounts.Watch || 0;

assert(reviewCount > 40 && reviewCount < 160, `Needs Review count should be useful but not noisy; found ${reviewCount}.`);
assert(watchCount <= 80, `Watch count should not overwhelm the library; found ${watchCount}.`);

console.log(`Recipe Library trust verification passed: ${reviewCount} needs review, ${watchCount} watch.`);
