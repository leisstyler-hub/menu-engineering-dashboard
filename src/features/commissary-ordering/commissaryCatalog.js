export const COMMISSARY_DEPARTING_UNIT = Object.freeze({
  name: "Commissary",
  siteLabel: "SEA20 Cricket",
  profitCenter: "22472",
});

export const COMMISSARY_RECEIVING_CAFES = Object.freeze([
  { name: "Nessie", profitCenter: "30159" },
  { name: "Cricket", profitCenter: "22472" },
]);

const item = (category, name, mrn, itemWasteCost, orderUnit, orderUnitCost, notes = "") => ({
  id: `commissary-${String(mrn).replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
  category,
  name,
  mrn: String(mrn),
  portion: "1 ounce",
  itemWasteCost,
  orderUnit,
  orderUnitCost,
  notes,
});

export const COMMISSARY_ORDER_ITEMS = Object.freeze([
  item("Toppings", "Sliced Cucumber", "68562.2", 0.15839, "quart", 0.15839 * 32, "Requires mixing"),
  item("Toppings", "Sliced Green Bell Pepper", "62342", 0.123716, "quart", 0.123716 * 32),
  item("Toppings", "Sliced Red Onion", "46017.23", 0.093527, "quart", 0.093527 * 32),
  item("Toppings", "Shredded Red Cabbage", "71070.2", 0.068369, "quart", 0.068369 * 32),
  item("Toppings", "Sliced Radishes", "71070.1", 0.276611, "quart", 0.276611 * 32),
  item("Toppings", "Tri-Color Quinoa", "55978.2", 0.146697, "quart", 0.146697 * 32),
  item("Toppings", "Herbed Bulgur", "144954", 0.09, "quart", 0.09 * 32),
  item("Toppings", "Blanched Broccoli", "16207.12", 0.26341, "quart", 0.26341 * 32, "Requires batch cooking"),
  item("Toppings", "Blanched Green Beans", "9002.2", 0.400567, "quart", 0.400567 * 32, "Requires batch cooking"),
  item("Toppings", "Marinated Artichokes", "70850", 0.2, "quart", 0.2 * 32),
  item("Toppings", "Marinated Chickpeas", "62871.2", 0.134019, "quart", 0.134019 * 32),
  item("Toppings", "Aleppo-Edamame", "176736", 0.22, "quart", 0.22 * 32, "New recipe"),
  item("Toppings", "Pickled Red Onions", "76321", 0.25, "quart", 0.25 * 32),
  item("Toppings", "Broccoli Kimchi", "85528.4", 0.13, "quart", 0.13 * 32),
  item("Toppings", "Broccoli Stem Slaw", "110975", 0.15, "quart", 0.15 * 32),
  item("Toppings", "Grape Tomatoes", "66240", 0.235316, "quart", 0.235316 * 32),
  item("Toppings", "Kidney Beans", "67067.12", 0.036004, "quart", 0.036004 * 32),
  item("Toppings", "Shredded Carrots", "119962", 0.14154, "quart", 0.14154 * 32),
  item("Toppings", "Banana Pepper Rings", "46017.25", 0.191859, "quart", 0.191859 * 32),
  item("Toppings", "Sliced Black Olives", "62339", 0.130953, "quart", 0.130953 * 32),
  item("Proteins", "Chopped Hard Boiled Eggs", "62326", 0.214008, "quart", 0.214008 * 32),
  item("Proteins", "Diced Ham", "14899", 0.210286, "quart", 0.210286 * 32),
  item("Proteins", "Roasted Herb Chicken", "63167.8", 0.36, "quart", 0.36 * 32, "No grill"),
  item("Proteins", "Garlic Herb Marinated Tofu", "167505", 0.249142, "quart", 0.249142 * 32),
  item("Crunchy Toppers", "Flatbread Crisps", "62303.4", 0.046691, "quart", 1.44),
  item("Crunchy Toppers", "Dried Cranberries", "62347", 0.21282, "quart", 6.56),
  item("Crunchy Toppers", "Seasoned Croutons", "65280", 0.198638, "quart", 6.4),
  item("Crunchy Toppers", "Fried Corn Tortilla Strips", "144578", 0.045906, "quart", 1.6),
  item("Cheese", "Blue Cheese Crumbles", "47711.1", 0.252602, "quart", 8),
  item("Cheese", "Crumbled Feta Cheese", "62345", 0.223263, "quart", 0.223263 * 32),
  item("Cheese", "Shredded Cheddar Cheese", "62344", 0.191072, "quart", 0.191072 * 32),
  item("Cheese", "4% Full Fat Cottage Cheese", "1746.6", 0.169409, "quart", 0.169409 * 32),
  item("Dressings", "1000 Island Dressing", "111748.11", 0.19989, "gallon", 16.46),
  item("Dressings", "Balsamic Vinaigrette Dressing", "16776", 0.176034, "gallon", 15.33),
  item("Dressings", "Balsamic Vinegar", "47957.11", 0.102421, "5-liter container", 21.26),
  item("Dressings", "Fat Free Italian Dressing", "62355", 0.082842, "32-ounce bottle", 5.64),
  item("Dressings", "Honey Mustard Dressing", "5323", 0.20369, "gallon", 17.65),
  item("Dressings", "Olive Oil", "47805.1", 0.367476, "gallon", 43.015),
  item("Dressings", "Ranch Dressing", "62357", 0.126196, "gallon", 14.8),
  item("Dressings", "Red Wine Vinegar", "62369", 0.094547, "gallon", 12.29),
  item("Dressings", "Caesar Dressing", "62370", 0.094547, "gallon", 1.67),
]);

export const COMMISSARY_ITEM_BY_ID = new Map(COMMISSARY_ORDER_ITEMS.map((row) => [row.id, row]));
