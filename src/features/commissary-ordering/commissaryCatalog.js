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

export const SALAD_BAR_CATEGORY_ORDER = Object.freeze(["Leafy Greens", "Vegetables", "Proteins", "Cheeses", "Crunchy Toppers", "Dressings"]);
const LEAFY_GREEN_MRNS = new Set(["47795.1", "62323", "63609"]);
const CHEESE_MRNS = new Set(["1746.6", "47711.1", "62345", "62344"]);
const PROTEIN_MRNS = new Set(["62326", "14899", "167505", "63167.8"]);
const CRUNCHY_MRNS = new Set(["62347", "144578", "65280"]);
const DRESSING_MRNS = new Set(["111748.11", "16776", "47957.11", "62355", "5323", "47805.1", "62357", "62369"]);
const categoryFor = (mrn) => LEAFY_GREEN_MRNS.has(mrn) ? "Leafy Greens" : CHEESE_MRNS.has(mrn) ? "Cheeses" : PROTEIN_MRNS.has(mrn) ? "Proteins" : CRUNCHY_MRNS.has(mrn) ? "Crunchy Toppers" : DRESSING_MRNS.has(mrn) ? "Dressings" : "Vegetables";
const titleCase = (value) => String(value).replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase());
export const isWholeUnitSaladItem = (item = {}) => {
  const name = String(item.name || item.sourceName || "").toLowerCase();
  const category = String(item.category || "");
  return category === "Leafy Greens"
    || category === "Cheeses"
    || (category === "Dressings" && /(dressing|vinaigrette)/.test(name))
    || /(spring mix|spinach|arugula)/.test(name);
};
const culinaryProfileFor = ({ id, name, mrn, portion, source = SALAD_BAR_COST_SOURCE }) => Object.freeze({
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
    ...(source.approvedOverrideId
      ? { sourceRecord: source.approvedOverrideId, sourceVersion: source.approvedAt }
      : { sourceFile: SALAD_BAR_COST_SOURCE.workbook, sourceSha256: SALAD_BAR_COST_SOURCE.sha256 }),
    basis: source.basis || "Exact MenuWorks Salad Bar identity and costing row; no culinary classification evidence supplied.",
    reviewer: null,
    reviewedAt: null,
  }),
});

export const SALAD_BAR_PACKAGE_OVERRIDE_SOURCE = Object.freeze({
  approvedOverrideId: "alex-salad-bar-package-units-2026-11-04",
  approvedAt: "2026-11-04",
  approvedBy: "Alex",
  basis: "Alex-approved whole-package order unit and Item + Waste Cost override; culinary classifications remain Unknown / Needs review.",
  effectiveForNewSelections: "2026-11-04",
});

const PACKAGE_OVERRIDES = Object.freeze({
  "47795.1": Object.freeze({ portion: "3 pound bag", orderUnit: "3-pound bag", orderUnitCost: 7.75 }),
  "62323": Object.freeze({ portion: "4 pound bag", orderUnit: "4-pound bag", orderUnitCost: 17.8 }),
  "63609": Object.freeze({ portion: "2.5 pound bag", orderUnit: "2.5-pound bag", orderUnitCost: 8.81 }),
  "1746.6": Object.freeze({ portion: "5 pound container", orderUnit: "5-pound container", orderUnitCost: 14.15 }),
  "47711.1": Object.freeze({ portion: "5 pound bag", orderUnit: "5-pound bag", orderUnitCost: 16.79 }),
  "62345": Object.freeze({ portion: "5 pound bag", orderUnit: "5-pound bag", orderUnitCost: 15.89 }),
  "62344": Object.freeze({ portion: "5 pound bag", orderUnit: "5-pound bag", orderUnitCost: 13.6 }),
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

const activeItem = ([sourceName, mrn, sourcePortion, itemCost, wastePercent, itemWasteCost], override = null) => {
  const isGallon = sourcePortion === "1 gallon" || sourcePortion === "128 floz";
  const transferGlCode = mrn === "62341" ? "4111009" : "4111011";
  const source = override ? SALAD_BAR_PACKAGE_OVERRIDE_SOURCE : SALAD_BAR_COST_SOURCE;
  const item = {
    id: `commissary-${mrn.replace(/[^a-z0-9]/gi, "-").toLowerCase()}${override ? "-package-v3" : ""}`,
    category: categoryFor(mrn),
    name: titleCase(sourceName),
    sourceName,
    mrn,
    portion: override?.portion || sourcePortion,
    itemCost: override?.orderUnitCost ?? itemCost,
    wastePercent: override ? 0 : wastePercent,
    itemWasteCost: override?.orderUnitCost ?? itemWasteCost,
    orderUnit: override?.orderUnit || (isGallon ? "gallon" : "3-pound container"),
    orderUnitCost: override?.orderUnitCost ?? itemWasteCost,
    quantityIncrement: 1,
    notes: "",
    transferGlCode,
    transferGlCategory: transferGlCode === "4111009" ? "Frozen" : "Prepared Foods",
    source,
  };
  item.quantityIncrement = isWholeUnitSaladItem(item) ? 1 : (isGallon ? 0.25 : 1);
  return Object.freeze({ ...item, culinaryProfile: culinaryProfileFor(item) });
};

export const COMMISSARY_PREVIOUS_ORDER_ITEMS = Object.freeze(SOURCE_ROWS.map((row) => activeItem(row)));
export const COMMISSARY_ORDER_ITEMS = Object.freeze(SOURCE_ROWS
  .map((row) => activeItem(row, PACKAGE_OVERRIDES[row[1]] || null))
  .sort((left, right) => SALAD_BAR_CATEGORY_ORDER.indexOf(left.category) - SALAD_BAR_CATEGORY_ORDER.indexOf(right.category) || left.name.localeCompare(right.name)));
export const SALAD_BAR_CULINARY_PROFILE_MANIFEST = Object.freeze(COMMISSARY_ORDER_ITEMS.map(({ culinaryProfile }) => culinaryProfile));

const legacyItem = (category, name, mrn, itemWasteCost, orderUnit, orderUnitCost, notes = "", options = {}) => {
  const convertsFromQuart = orderUnit === "quart";
  return Object.freeze({
    id: `commissary-${String(mrn).replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
    category,
    name,
    mrn: String(mrn),
    portion: "1 ounce",
    itemWasteCost,
    orderUnit: convertsFromQuart ? "gallon" : orderUnit,
    orderUnitCost: convertsFromQuart ? orderUnitCost * 4 : orderUnitCost,
    legacyOrderUnit: convertsFromQuart ? "quart" : "",
    quantityIncrement: isWholeUnitSaladItem({ category, name }) ? 1 : (convertsFromQuart ? 0.25 : 1),
    notes,
    transferGlCode: options.transferGlCode || "4111011",
    transferGlCategory: options.transferGlCategory || "Prepared Foods",
    legacyIds: options.legacyIds || [],
    catalogVersion: "legacy-before-2026-11-16",
  });
};

// Exact ordering roster and costs that were in production before the 2026-11-16 workbook refresh.
// Saved weeks before the effective date must continue to render, total and export against this catalog.
export const COMMISSARY_LEGACY_ORDER_ITEMS = Object.freeze([
  legacyItem("Toppings", "Sliced Cucumber", "68562.2", 0.15839, "quart", 0.15839 * 32, "Requires mixing"),
  legacyItem("Toppings", "Sliced Green Bell Pepper", "62342", 0.123716, "quart", 0.123716 * 32),
  legacyItem("Toppings", "Sliced Red Onion", "46017.23", 0.093527, "quart", 0.093527 * 32),
  legacyItem("Toppings", "Shredded Red Cabbage", "71070.2", 0.068369, "quart", 0.068369 * 32),
  legacyItem("Toppings", "Sliced Radishes", "71070.1", 0.276611, "quart", 0.276611 * 32),
  legacyItem("Toppings", "Tri-Color Quinoa", "55978.2", 0.146697, "quart", 0.146697 * 32),
  legacyItem("Toppings", "Herbed Bulgur", "144954", 0.09, "quart", 0.09 * 32),
  legacyItem("Toppings", "Blanched Broccoli", "16207.12", 0.26341, "quart", 0.26341 * 32, "Requires batch cooking"),
  legacyItem("Toppings", "Frozen Peas", "4877", 2.27 / 32, "quart", 2.27, "", { transferGlCode: "4111009", transferGlCategory: "Frozen", legacyIds: ["commissary-9002-2"] }),
  legacyItem("Toppings", "Marinated Artichokes", "70850", 0.2, "quart", 0.2 * 32),
  legacyItem("Toppings", "Marinated Chickpeas", "62871.2", 0.134019, "quart", 0.134019 * 32),
  legacyItem("Toppings", "Aleppo-Edamame", "176736", 0.22, "quart", 0.22 * 32),
  legacyItem("Toppings", "Pickled Red Onions", "76321", 0.25, "quart", 0.25 * 32),
  legacyItem("Toppings", "Broccoli Kimchi", "85528.4", 0.13, "quart", 0.13 * 32),
  legacyItem("Toppings", "Broccoli Stem Slaw", "110975", 0.15, "quart", 0.15 * 32),
  legacyItem("Toppings", "Grape Tomatoes", "66240", 0.235316, "quart", 0.235316 * 32),
  legacyItem("Toppings", "Kidney Beans", "67067.12", 0.036004, "quart", 0.036004 * 32),
  legacyItem("Toppings", "Shredded Carrots", "119962", 0.14154, "quart", 0.14154 * 32),
  legacyItem("Toppings", "Banana Pepper Rings", "46017.25", 0.191859, "quart", 0.191859 * 32),
  legacyItem("Toppings", "Sliced Black Olives", "62339", 0.130953, "quart", 0.130953 * 32),
  legacyItem("Proteins", "Chopped Hard Boiled Eggs", "62326", 0.214008, "quart", 0.214008 * 32),
  legacyItem("Proteins", "Diced Ham", "14899", 0.210286, "quart", 0.210286 * 32),
  legacyItem("Proteins", "Roasted Herb Chicken", "63167.8", 0.36, "quart", 0.36 * 32, "No grill"),
  legacyItem("Proteins", "Garlic Herb Marinated Tofu", "167505", 0.249142, "quart", 0.249142 * 32),
  legacyItem("Crunchy Toppers", "Flatbread Crisps", "62303.4", 0.046691, "quart", 1.44),
  legacyItem("Crunchy Toppers", "Dried Cranberries", "62347", 0.21282, "quart", 6.56),
  legacyItem("Crunchy Toppers", "Seasoned Croutons", "65280", 0.198638, "quart", 6.4),
  legacyItem("Crunchy Toppers", "Fried Corn Tortilla Strips", "144578", 0.045906, "quart", 1.6),
  legacyItem("Cheese", "Blue Cheese Crumbles", "47711.1", 0.252602, "quart", 8),
  legacyItem("Cheese", "Crumbled Feta Cheese", "62345", 0.223263, "quart", 0.223263 * 32),
  legacyItem("Cheese", "Shredded Cheddar Cheese", "62344", 0.191072, "quart", 0.191072 * 32),
  legacyItem("Cheese", "4% Full Fat Cottage Cheese", "1746.6", 0.169409, "quart", 0.169409 * 32),
  legacyItem("Dressings", "1000 Island Dressing", "111748.11", 0.19989, "gallon", 16.46),
  legacyItem("Dressings", "Balsamic Vinaigrette Dressing", "16776", 0.176034, "gallon", 15.33),
  legacyItem("Dressings", "Balsamic Vinegar", "47957.11", 0.102421, "5-liter container", 21.26),
  legacyItem("Dressings", "Fat Free Italian Dressing", "62355", 0.082842, "32-ounce bottle", 5.64),
  legacyItem("Dressings", "Honey Mustard Dressing", "5323", 0.20369, "gallon", 17.65),
  legacyItem("Dressings", "Olive Oil", "47805.1", 0.367476, "gallon", 43.015),
  legacyItem("Dressings", "Ranch Dressing", "62357", 0.126196, "gallon", 14.8),
  legacyItem("Dressings", "Red Wine Vinegar", "62369", 0.094547, "gallon", 12.29),
  legacyItem("Dressings", "Caesar Dressing", "62370", 0.094547, "gallon", 1.67),
]);

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
  ...COMMISSARY_PREVIOUS_ORDER_ITEMS
    .filter(({ mrn }) => PACKAGE_OVERRIDES[mrn])
    .map((item) => Object.freeze({ ...item, retired: true, notes: "Saved standing-order unit retained; new selections use the updated whole-package item." })),
]);

export function commissaryOrderItemsForWeek(weekStart) {
  return weekStart && weekStart < SALAD_BAR_COST_SOURCE.effectiveDate ? COMMISSARY_LEGACY_ORDER_ITEMS : COMMISSARY_ORDER_ITEMS;
}

export function commissaryItemMapForWeek(weekStart, quantities = {}) {
  const rows = commissaryOrderItemsForWeek(weekStart);
  const retainedRetired = weekStart && weekStart < SALAD_BAR_COST_SOURCE.effectiveDate ? [] : COMMISSARY_RETIRED_ORDER_ITEMS.filter(({ id, legacyIds = [] }) => quantities?.[id] || legacyIds.some((legacyId) => quantities?.[legacyId]));
  return new Map([...rows, ...retainedRetired].map((row) => [row.id, row]));
}

export const COMMISSARY_ITEM_BY_ID = new Map([...COMMISSARY_LEGACY_ORDER_ITEMS, ...COMMISSARY_PREVIOUS_ORDER_ITEMS, ...COMMISSARY_RETIRED_ORDER_ITEMS, ...COMMISSARY_ORDER_ITEMS].map((row) => [row.id, row]));

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
