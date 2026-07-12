import { readFileSync } from "node:fs";

const rows = JSON.parse(readFileSync("src/data/menuItems.json", "utf8"));
const source = readFileSync("src/features/neighborhood-rotations/NeighborhoodRotations.jsx", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const text = (value) => String(value || "").toLowerCase();
const name = (row) => row.displayName || row.item || row.shortName || row.recipeName || "";
const menuRows = (menu) => rows.filter((row) => row.menu === menu);
const priced = (row) => Number(row.price);

const grillRows = menuRows("AMZ: Grill Core");
const grillEntreeWithSideRows = grillRows.filter((row) => /entree served with one side|grill duo|choice of side/i.test(row.menuItemNotes || ""));
const grillSideRows = grillRows.filter((row) => row.category === "side");

assert(grillRows.length >= 35, `Expected Grill Core rows to be loaded from Menus.csv, found ${grillRows.length}.`);
assert(
  grillEntreeWithSideRows.every((row) => row.category === "entree"),
  `Grill Core entree rows are being classified outside entree: ${grillEntreeWithSideRows.filter((row) => row.category !== "entree").map(name).join(", ")}`
);
assert(
  !grillSideRows.some((row) => /burger|sandwich|wrap|torta|dog/i.test(name(row)) || priced(row) >= 9),
  `Grill Core side group contains entree-priced sandwich/burger rows: ${grillSideRows.filter((row) => /burger|sandwich|wrap|torta|dog/i.test(name(row)) || priced(row) >= 9).map(name).join(", ")}`
);
assert(
  grillSideRows.some((row) => /french fries/i.test(name(row))),
  "Grill Core side group is missing French Fries from Menus.csv."
);

const freshFiveRows = menuRows("AMZ: Fresh Five");
const freshFiveStations = new Set(freshFiveRows.map((row) => row.station));
assert(freshFiveStations.has("Grill"), "Fresh Five Grill station rows are missing.");
assert(freshFiveStations.has("Salad"), "Fresh Five Salad station rows are missing.");
assert(freshFiveStations.has("Soup"), "Fresh Five Soup station rows are missing.");
assert(
  freshFiveRows.filter((row) => row.station === "Grill").every((row) => row.category === "entree" && !/soup|salad|flatbread/i.test(name(row))),
  "Fresh Five Grill station must only contain Grill Fresh Five entree options."
);
assert(
  source.includes('freshFiveStationRows("Grill")') &&
    source.includes('freshFiveStationRows("Salad")') &&
    source.includes('freshFiveStationRows("Soup")') &&
    source.includes('freshFiveStationRows("Sides")') &&
    source.includes('freshFiveStationRows("Deli")'),
  "Neighborhood Fresh Five picker pools must be scoped by exact Fresh Five station."
);
assert(
  source.includes('const options = cafe === "Doppler" ? stationPool("grillFreshFive")') &&
    source.includes('poolOverride={cafe === "Doppler" ? stationPool("deliFreshFive") : null}') &&
    source.includes('poolOverride={stationPool("grillFreshFive")}') &&
    source.includes('poolOverride={stationPool("saladFreshFive")}') &&
    !/stationKey="salad"[\s\S]{0,700}poolOverride=\{cafe === "Doppler" \? stationPool\("saladFreshFive"\) : null\}/.test(source),
  "Neighborhood selectors must keep Fresh Five pools station-specific while Zane's Salad uses the full salad library pool."
);

const sauceSignal = /sauce choice|sauce option for protein|sauce|dressing|condiment|spread|dip|salsa|chutney|preserve|preserves|vinaigrette|aioli|mustard|mayonnaise|mayo|hummus|gravy|jus/i;
const carveryRows = menuRows("AMZ: Carvery");
const carveryNote = (row) => text(row.menuItemNotes).replace(/\s+/g, " ").trim();
const charredVegetableRows = carveryRows.filter((row) => /^charred vegetable option/.test(carveryNote(row)));
const hotSideChoiceRows = carveryRows.filter((row) => carveryNote(row) === "hot a la carte and side choice");
const coldSideChoiceRows = carveryRows.filter((row) => ["a la carte and side choice", "cold a la carte and side choice"].includes(carveryNote(row)));
const carverySauceRows = carveryRows.filter((row) => row.price == null && sauceSignal.test(`${name(row)} ${row.recipeName || ""} ${row.recipeCategory || ""} ${row.menuItemNotes || ""}`));
const carverySideRows = carveryRows.filter((row) => row.category === "side");
assert(carveryRows.length >= 100, `Expected AMZ: Carvery rows to be loaded, found ${carveryRows.length}.`);
assert(charredVegetableRows.length >= 9, `Expected Carvery charred vegetable options from Menu Item Notes, found ${charredVegetableRows.length}.`);
assert(hotSideChoiceRows.length >= 10, `Expected Carvery hot side choices from Menu Item Notes, found ${hotSideChoiceRows.length}.`);
assert(coldSideChoiceRows.length >= 20, `Expected Carvery cold/generic side choices from Menu Item Notes, found ${coldSideChoiceRows.length}.`);
assert(
  charredVegetableRows.every((row) => row.plannerSelectorGroup === "carvery-rotating-vegetable" && row.canBeSideChoice !== true),
  `Carvery rotating vegetables must map from Charred Vegetable Option notes only: ${charredVegetableRows.filter((row) => row.plannerSelectorGroup !== "carvery-rotating-vegetable" || row.canBeSideChoice === true).map(name).join(", ")}`
);
assert(
  hotSideChoiceRows.every((row) => row.plannerSelectorGroup === "carvery-hot-side" && row.canBeSideChoice === true),
  `Carvery hot sides must map from Hot A La Carte and Side Choice notes only: ${hotSideChoiceRows.filter((row) => row.plannerSelectorGroup !== "carvery-hot-side" || row.canBeSideChoice !== true).map(name).join(", ")}`
);
assert(
  coldSideChoiceRows.every((row) => row.plannerSelectorGroup === "carvery-cold-side" && row.canBeSideChoice === true),
  `Carvery cold sides must map from A la carte/Cold A La Carte side choice notes only: ${coldSideChoiceRows.filter((row) => row.plannerSelectorGroup !== "carvery-cold-side" || row.canBeSideChoice !== true).map(name).join(", ")}`
);
assert(
  !source.includes("Hot and cold side dropdowns are filtered by item naming cues"),
  "Carvery UI must not describe note-driven selectors as naming-cue filters."
);
assert(carverySauceRows.length >= 15, `Expected to detect Carvery sauce/condiment rows, found ${carverySauceRows.length}.`);
assert(
  carverySauceRows.every((row) => row.category === "subRecipe" && row.canBeSideChoice !== true),
  `Carvery complimentary sauces/chutneys/dressings are leaking into sides: ${carverySauceRows.filter((row) => row.category !== "subRecipe" || row.canBeSideChoice === true).map(name).join(", ")}`
);
assert(
  !carverySideRows.some((row) => row.price == null && sauceSignal.test(`${name(row)} ${row.recipeName || ""} ${row.recipeCategory || ""} ${row.menuItemNotes || ""}`)),
  `Carvery side group contains sauce/condiment rows: ${carverySideRows.filter((row) => row.price == null && sauceSignal.test(`${name(row)} ${row.recipeName || ""} ${row.recipeCategory || ""} ${row.menuItemNotes || ""}`)).map(name).join(", ")}`
);
const unpricedSides = rows.filter((row) => row.category === "side" && row.price == null);
assert(
  unpricedSides.length === 0,
  `Unpriced complimentary/support rows are leaking into side groups: ${unpricedSides.slice(0, 25).map((row) => `${row.menu} / ${name(row)}`).join(", ")}`
);

const staleLoadedFries = grillRows.filter((row) => /regular cut fries|waffle fries/i.test(row.recipeName || "") && /loaded fries/i.test(`${row.item} ${row.displayName}`));
assert(!staleLoadedFries.length, "Importer is preserving stale Loaded Fries names over current Menus.csv short names.");

const regularCutFries = grillRows.find((row) => /regular cut fries/i.test(row.recipeName || ""));
assert(regularCutFries, "Expected Regular Cut Fries/French Fries to be present in Grill Core.");
assert(
  !/loaded fries|melted cheese|jalape/i.test(`${regularCutFries.enticingDescription || ""} ${regularCutFries.menuWorksDescription || ""}`),
  "Importer is preserving stale Loaded Fries descriptions over current French Fries details."
);

assert(
  !rows.some((row) => row.category === "side" && /main entree|sandwich\/wrap|pizza\/calzone\/flatbread/i.test(text(row.recipeCategory)) && !/side pairing|a la carte\s*(?:&|and)\s*side choice/i.test(text(row.menuItemNotes))),
  "Main entree recipe-category rows are leaking into side unless explicitly marked side pairing."
);

console.log("Menu classification verification passed.");
