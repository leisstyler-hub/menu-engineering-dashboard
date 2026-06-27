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
    source.includes('poolOverride={cafe === "Doppler" ? stationPool("saladFreshFive") : null}') &&
    source.includes('poolOverride={cafe === "Doppler" ? stationPool("deliFreshFive") : null}') &&
    source.includes('poolOverride={stationPool("grillFreshFive")}') &&
    source.includes('poolOverride={stationPool("saladFreshFive")}'),
  "Neighborhood Fresh Five UI selectors must use station-specific pools instead of the broad Fresh Five pool."
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
  !rows.some((row) => row.category === "side" && /main entree|sandwich\/wrap|pizza\/calzone\/flatbread/i.test(text(row.recipeCategory)) && !/side pairing|a la carte & side choice/i.test(text(row.menuItemNotes))),
  "Main entree recipe-category rows are leaking into side unless explicitly marked side pairing."
);

console.log("Menu classification verification passed.");
