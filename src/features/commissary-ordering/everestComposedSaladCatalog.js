export const EVEREST_COMPOSED_SALAD_ORDER_VERSION = 1;
export const EVEREST_COMPOSED_SALAD_EFFECTIVE_WEEK = "2026-12-07";

const rows = [
  ["31447.8", "G&G Caprese Salad", "1 each", 1.469551],
  ["13158.4", "Fresh Fruit Cup", "4 ounce", 0.999384],
  ["91296.2", "Tomato and Bulgur Pilaf", "4 ounce", 0.565238],
  ["22656.1", "Cucumber Tomato Parsley Salad", "4 ounce", 0.657137],
  ["32591.2", "Farro Tomato Cucumber Arugula Salad", "4 ounce", 0.769438],
];

const scaledRecipes = Object.freeze({
  "31447.8": Object.freeze({
    sourcePage: 5,
    batchServings: 153,
    standardPortion: "1 each",
    productionArea: "Cold Prep",
    components: Object.freeze([
      Object.freeze({ name: "Oil, Olive, Extra Virgin", batchQuantity: "1 qt, 3/4 cup, 1 tbsp" }),
      Object.freeze({ name: "Salt, Kosher", batchQuantity: "3 tbsp, 1/2 tsp" }),
      Object.freeze({ name: "Spice, Pepper, Black, Ground", batchQuantity: "3 tbsp, 1/2 tsp" }),
      Object.freeze({ name: "Tomatoes, Grape, Fresh", batchQuantity: "4 gal, 3 qt, 1/2 cup" }),
      Object.freeze({ name: "Cheese, Mozzarella, Balls, Ciliegine, 0.33oz, Fresh", batchQuantity: "1530 each" }),
      Object.freeze({ name: "Glaze, Balsamic Vinegar, American Roland", batchQuantity: "1 qt, 3/4 cup, 1 tbsp" }),
      Object.freeze({ name: "Basil, Fresh, Chiffonade Cut", batchQuantity: "2 qt, 1-1/2 cup, 1 tbsp" }),
    ]),
  }),
  "22656.1": Object.freeze({
    sourcePage: 97,
    batchServings: 250,
    standardPortion: "1/2 cup",
    productionArea: "Cold Prep",
    components: Object.freeze([
      Object.freeze({ name: "Tomatoes, Roma, Fresh", batchQuantity: "20 lb" }),
      Object.freeze({ name: "Cucumbers, Fresh", batchQuantity: "22 lb, 4 oz" }),
      Object.freeze({ name: "Onions, Red, Fresh, Diced", batchQuantity: "4 lb, 7 oz" }),
      Object.freeze({ name: "Parsley, Italian, Fresh, Chopped", batchQuantity: "2 cup, 3 tbsp, 2-1/4 tsp" }),
      Object.freeze({ name: "Juice, Lemon, Fresh Pressed", batchQuantity: "2 cup, 3 tbsp, 2-1/4 tsp" }),
      Object.freeze({ name: "Oil, Olive, Extra Virgin", batchQuantity: "1-3/4 cup, 1 tbsp, 2-1/4 tsp" }),
      Object.freeze({ name: "Salt, Kosher", batchQuantity: "3 tbsp" }),
      Object.freeze({ name: "Spice, Pepper, Black, Ground", batchQuantity: "1 tbsp, 1-1/2 tsp" }),
    ]),
  }),
  "32591.2": Object.freeze({
    sourcePage: 110,
    batchServings: 210,
    standardPortion: "1/2 cup",
    productionArea: "Cold Prep",
    components: Object.freeze([
      Object.freeze({ name: "Grain, Farro, Dry", batchQuantity: "1 gal, 1 qt, 3-1/4 cup" }),
      Object.freeze({ name: "Water", batchQuantity: "4 gal, 1 qt, 2 cup" }),
      Object.freeze({ name: "Oil, Olive, Extra Virgin", batchQuantity: "1-1/3 cup, 2 tbsp" }),
      Object.freeze({ name: "Vinegar, Balsamic White", batchQuantity: "1-1/3 cup, 2 tbsp" }),
      Object.freeze({ name: "Fennel, Fresh, Diced, Fine", batchQuantity: "2 qt, 3-2/3 cup" }),
      Object.freeze({ name: "Cucumbers, Fresh, Peeled, Small Diced, 1/4 inch", batchQuantity: "2 qt, 3-2/3 cup" }),
      Object.freeze({ name: "Tomatoes, Grape, Fresh, Halved", batchQuantity: "2 qt, 3-2/3 cup" }),
      Object.freeze({ name: "Lettuce, Arugula, Baby, Fresh", batchQuantity: "2 gal, 3 qt, 2-3/4 cup" }),
      Object.freeze({ name: "Garlic Cloves, Peeled, Fresh, Minced", batchQuantity: "3/4 cup, 3 tbsp, 1-3/4 tsp" }),
      Object.freeze({ name: "Mint, Fresh, Chopped", batchQuantity: "1 qt, 1-3/4 cup, 1 tbsp" }),
      Object.freeze({ name: "Parsley, Fresh, Chopped", batchQuantity: "1 qt, 1-3/4 cup, 1 tbsp" }),
      Object.freeze({ name: "Capers, Drained, American Roland", batchQuantity: "2-3/4 cup, 2 tbsp, 2 tsp" }),
    ]),
  }),
});

export const EVEREST_COMPOSED_SALAD_ITEMS = Object.freeze(rows.map(([mrn, name, portion, itemWasteCost]) => Object.freeze({
  id: `everest-composed-salad|${mrn}`,
  menu: "Everest MKT Composed Salads",
  mrn,
  name,
  portion,
  itemWasteCost,
  station: "Salad Bar",
  orderUnit: "finished salad",
  scaledRecipe: scaledRecipes[mrn] || null,
})));

const byMrn = new Map(EVEREST_COMPOSED_SALAD_ITEMS.map((item) => [item.mrn, item]));
const day = (key, label, mrns) => Object.freeze({ key, label, items: Object.freeze(mrns.map((mrn) => byMrn.get(mrn))) });
const week = (number, days) => Object.freeze({ week: number, days: Object.freeze(days) });

export const EVEREST_COMPOSED_SALAD_PROGRAM = Object.freeze({
  anchorWeekStart: "2026-12-07",
  effectiveWeek: EVEREST_COMPOSED_SALAD_EFFECTIVE_WEEK,
  cafe: "Everest",
  prepHub: "Blueshift",
  cycleLengthWeeks: 4,
  cycleWeeks: Object.freeze([
    week(1, [
      day("monday", "Monday", ["31447.8", "13158.4", "91296.2"]),
      day("tuesday", "Tuesday", ["31447.8", "13158.4", "91296.2"]),
      day("wednesday", "Wednesday", ["31447.8", "13158.4", "91296.2"]),
      day("thursday", "Thursday", ["31447.8", "13158.4", "91296.2"]),
      day("friday", "Friday", ["31447.8", "13158.4", "91296.2"]),
    ]),
    week(2, [
      day("monday", "Monday", ["31447.8", "22656.1", "13158.4"]),
      day("tuesday", "Tuesday", ["31447.8", "32591.2", "13158.4"]),
      day("wednesday", "Wednesday", ["31447.8", "32591.2", "13158.4"]),
      day("thursday", "Thursday", ["31447.8", "32591.2", "13158.4"]),
      day("friday", "Friday", ["31447.8", "32591.2", "13158.4"]),
    ]),
    week(3, [
      day("monday", "Monday", ["22656.1", "32591.2", "13158.4"]),
      day("tuesday", "Tuesday", ["22656.1", "32591.2", "13158.4"]),
      day("wednesday", "Wednesday", ["22656.1", "32591.2", "13158.4"]),
      day("thursday", "Thursday", ["22656.1", "32591.2", "13158.4"]),
      day("friday", "Friday", ["22656.1", "32591.2", "13158.4"]),
    ]),
    week(4, [
      day("monday", "Monday", ["22656.1", "13158.4", "91296.2"]),
      day("tuesday", "Tuesday", ["22656.1", "13158.4", "91296.2"]),
      day("wednesday", "Wednesday", ["22656.1", "13158.4", "91296.2"]),
      day("thursday", "Thursday", ["22656.1", "13158.4", "91296.2"]),
      day("friday", "Friday", ["22656.1", "13158.4", "91296.2"]),
    ]),
  ]),
});

export function everestComposedSaladCycleForWeek(weekStart = "") {
  if (String(weekStart) < EVEREST_COMPOSED_SALAD_EFFECTIVE_WEEK) return null;
  const elapsed = Math.round((Date.parse(`${weekStart}T12:00:00Z`) - Date.parse(`${EVEREST_COMPOSED_SALAD_PROGRAM.anchorWeekStart}T12:00:00Z`)) / 604800000);
  return EVEREST_COMPOSED_SALAD_PROGRAM.cycleWeeks[((elapsed % 4) + 4) % 4] || null;
}
