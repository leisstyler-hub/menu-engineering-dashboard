import { DEFAULT_COMMISSARY_METADATA } from "./commissaryMetadata.js";

export const COMMISSARY_DEPARTING_UNIT = Object.freeze({
  name: "Commissary",
  siteLabel: "SEA20 Cricket",
  profitCenter: "22472",
});

export const COMMISSARY_RECEIVING_CAFES = DEFAULT_COMMISSARY_METADATA.receivingCafes;

export const SALAD_BAR_COST_SOURCE = Object.freeze({
  workbook: "MenuWorks SB Gallon Convert 3.0.xlsx",
  worksheet: "Report",
  sha256: "42E2DF61F1B97489ED2B9F27B81C86100B7D404E649099840829B23F76BB80F4",
  menuName: "Alex SupaBase Data Sheet",
  menuId: "596249",
  station: "Salad Bar",
  effectiveDate: "2026-11-16",
  costBasis: "Item + Waste Cost",
});

const CHEESE_MRNS = new Set(["1746.6", "47711.1", "62345", "62344"]);
const PROTEIN_MRNS = new Set(["62326", "14899", "167505", "63167.8"]);
const CRUNCHY_MRNS = new Set(["62347", "144578", "65280"]);
const DRESSING_MRNS = new Set(["111748.11", "16776", "47957.11", "62355", "5323", "47805.1", "62357", "62369"]);
const categoryFor = (mrn) => CHEESE_MRNS.has(mrn) ? "Cheese" : PROTEIN_MRNS.has(mrn) ? "Proteins" : CRUNCHY_MRNS.has(mrn) ? "Crunchy Toppers" : DRESSING_MRNS.has(mrn) ? "Dressings" : "Toppings";
const titleCase = (value) => String(value).replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase());
const culinaryProfileFor = ({ id, name, mrn, portion }) => Object.freeze({
  profileVersion: 1,
  identity: Object.freeze({ itemKey: id, name, mrn, portion, menuMemberships: Object.freeze(["Commissary Salad Bar", SALAD_BAR_COST_SOURCE.menuName]) }),
  servicePlacement: Object.freeze(["Unknown"]),
  cuisineMoniker: "Unknown",
  culinaryRole: Object.freeze(["Unknown"]),
  seasonality: Object.freeze(["Unknown"]),
  flavor: Object.freeze(["Unknown"]),
  texture: Object.freeze(["Unknown"]),
  premiumHighlight: "Unknown",
  reviewStatus: "Needs review",
  provenance: Object.freeze({
    sourceFile: SALAD_BAR_COST_SOURCE.workbook,
    sourceSha256: SALAD_BAR_COST_SOURCE.sha256,
    basis: "Exact MenuWorks Salad Bar identity and costing row; no culinary classification evidence supplied.",
    reviewer: null,
    reviewedAt: null,
  }),
});

const SOURCE_ROWS = [
  ["1000 Island Dressing", "111748.11", "128 floz", 24.605722, 0, 24.605722],
  ["4% Full Fat Cottage Cheese", "1746.6", "1 gallon", 21.80989, 0, 21.80989],
  ["Baby Arugula", "62323", "1 gallon", 6.193999, 0, 6.193999],
  ["Balsamic Vinaigrette Dressing", "16776", "128 floz", 21.665734, 0, 21.665734],
  ["Balsamic Vinegar", "47957.11", "128 floz", 14.81777, 0, 14.81777],
  ["Banana Pepper Rings", "46017.25", "1 gallon", 11.222972, 0, 11.222972],
  ["Black Beans", "64056.1", "1 gallon", 8.512126, 0, 8.512126],
  ["blanched broccoli", "16207.12", "1 gallon", 35.005641, 0.04, 36.405867],
  ["Blue Cheese Crumbles", "47711.1", "1 gallon", 18.768209, 0, 18.768209],
  ["broccoli kimchi", "85528.4", "1 gallon", 22.125872, 0.04, 23.010907],
  ["Chopped Hard Boiled Eggs", "62326", "1 gallon", 15.533639, 0, 15.533639],
  ["Chopped Kale", "63609", "1 gallon", 5.047344, 0, 5.047344],
  ["Crumbled Feta Cheese", "62345", "1 gallon", 17.983811, 0, 17.983811],
  ["Diced Ham", "14899", "1 gallon", 15.811334, 0.04, 16.443787],
  ["Dried Cranberries", "62347", "1 gallon", 16.745699, 0, 16.745699],
  ["Fat Free Italian Dressing", "62355", "128 floz", 10.603733, 0, 10.603733],
  ["fried corn tortilla strips", "144578", "1 gallon", 5.020747, 0, 5.020747],
  ["Garlic Herb Marinated Tofu", "167505", "3 pound", 11.752483, 0.04, 12.222582],
  ["Grape Tomatoes", "66240", "1 gallon", 32.163513, 0.04, 33.450054],
  ["Green Peas", "62341", "1 gallon", 9.091897, 0.04, 9.455573],
  ["Herb Marinated Chicken Breast", "63167.8", "3 pound", 19.315244, 0.04, 20.087854],
  ["Herbed Bulgur", "144954", "3 pound", 5.961494, 0.04, 6.199954],
  ["Honey Mustard Dressing", "5323", "128 floz", 25.069456, 0, 25.069456],
  ["marinated artichokes", "70850", "3 pound", 9.920151, 0.04, 10.316957],
  ["marinated chickpeas", "62871.2", "1 gallon", 13.758862, 0.04, 14.309217],
  ["Olive Oil", "47805.1", "128 floz", 43.288783, 0, 43.288783],
  ["Pickled Red Onions", "76321", "3 pound", 24.129395, 0.04, 25.094571],
  ["Ranch Dressing", "62357", "128 floz", 15.531875, 0, 15.531875],
  ["Red Wine Vinegar", "62369", "128 floz", 12.620921, 0, 12.620921],
  ["Seasoned Croutons", "65280", "1 gallon", 6.010681, 0, 6.010681],
  ["Shredded Carrots", "119962", "1 gallon", 8.47833, 0, 8.47833],
  ["Shredded Cheddar Cheese", "62344", "1 gallon", 11.555209, 0, 11.555209],
  ["Shredded Red Cabbage", "71070.2", "1 gallon", 2.384749, 0, 2.384749],
  ["Sliced Black Olives", "62339", "1 gallon", 10.847001, 0, 10.847001],
  ["Sliced Cucumber", "68562.2", "1 gallon", 7.91221, 0.04, 8.228698],
  ["Sliced Radishes", "71070.1", "1 gallon", 17.401422, 0.04, 18.097479],
  ["Sliced Red Bell Pepper", "64055", "1 gallon", 16.60615, 0.04, 17.270396],
  ["Sliced Red Onion", "46017.23", "1 gallon", 5.911296, 0.04, 6.147748],
  ["spiced edamame", "176736", "3 pound", 8.468468, 0.04, 8.807206],
  ["Spring Mix", "47795.1", "1 gallon", 9.498169, 0, 9.498169],
  ["tri-color quinoa", "55978.2", "1 gallon", 16.220102, 0.04, 16.868906],
];

const activeItem = ([sourceName, mrn, sourcePortion, itemCost, wastePercent, itemWasteCost]) => {
  const isGallon = sourcePortion === "1 gallon" || sourcePortion === "128 floz";
  const transferGlCode = mrn === "62341" ? "4111009" : "4111011";
  const item = {
    id: `commissary-${mrn.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
    category: categoryFor(mrn),
    name: titleCase(sourceName),
    sourceName,
    mrn,
    portion: sourcePortion,
    itemCost,
    wastePercent,
    itemWasteCost,
    orderUnit: isGallon ? "gallon" : "3-pound container",
    orderUnitCost: itemWasteCost,
    quantityIncrement: isGallon ? 0.25 : 1,
    notes: "",
    transferGlCode,
    transferGlCategory: transferGlCode === "4111009" ? "Frozen" : "Prepared Foods",
    source: SALAD_BAR_COST_SOURCE,
  };
  return Object.freeze({ ...item, culinaryProfile: culinaryProfileFor(item) });
};

export const COMMISSARY_ORDER_ITEMS = Object.freeze(SOURCE_ROWS.map(activeItem).sort((left, right) => left.name === "Sliced Cucumber" ? -1 : right.name === "Sliced Cucumber" ? 1 : 0));
export const SALAD_BAR_CULINARY_PROFILE_MANIFEST = Object.freeze(COMMISSARY_ORDER_ITEMS.map(({ culinaryProfile }) => culinaryProfile));

// Retired rows remain readable for previously saved orders and exports, but are not selectable in new orders.
const retiredItem = (name, mrn, orderUnitCost, transferGlCode = "4111011", legacyIds = []) => Object.freeze({
  id: `commissary-${String(mrn).replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
  category: "Toppings",
  name,
  mrn: String(mrn),
  portion: "1 gallon",
  itemWasteCost: orderUnitCost,
  orderUnit: "gallon",
  orderUnitCost,
  quantityIncrement: 0.25,
  transferGlCode,
  transferGlCategory: transferGlCode === "4111009" ? "Frozen" : "Prepared Foods",
  legacyIds,
  retired: true,
});

export const COMMISSARY_RETIRED_ORDER_ITEMS = Object.freeze([
  retiredItem("Sliced Green Bell Pepper", "62342", 3.958912),
  retiredItem("Frozen Peas", "4877", 2.27, "4111009", ["commissary-9002-2"]),
  retiredItem("Broccoli Stem Slaw", "110975", 4.8),
  retiredItem("Kidney Beans", "67067.12", 1.152128),
  retiredItem("Flatbread Crisps", "62303.4", 5.76),
  retiredItem("Caesar Dressing", "62370", 1.67),
]);

export const COMMISSARY_ITEM_BY_ID = new Map([...COMMISSARY_ORDER_ITEMS, ...COMMISSARY_RETIRED_ORDER_ITEMS].map((row) => [row.id, row]));

export function saladBarTransferCatalogItems(metadataItems = COMMISSARY_ORDER_ITEMS) {
  return metadataItems.map((row) => ({
    id: ["commissary salad bar", row.name, row.mrn, row.orderUnit].map((value) => String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()).join("|"),
    menu: "Commissary Salad Bar",
    item: row.name,
    mrn: row.mrn,
    portion: row.orderUnit,
    itemWasteCost: Number(row.orderUnitCost),
    defaultGlCode: row.transferGlCode || "4111011",
    defaultGlCategory: row.transferGlCategory || "Prepared Foods",
    sharedCostSource: "operational-metadata",
  }));
}
