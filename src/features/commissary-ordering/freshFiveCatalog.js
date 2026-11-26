export const FRESH_FIVE_ORDER_VERSION = 1;
export const FRESH_FIVE_EFFECTIVE_WEEK = "2026-12-07";

const rows = [
  ["83821.10", "Chipotle Chicken Salad Sliders", "1 each", "sandwich", 2.3608], ["191329.1", "Cucumber Fennel Salad", "1 each", "salad", 2.3421],
  ["29091.10", "Falafel Kale Salad", "3/4 cup", "salad", 0.7842], ["132011.3", "Hominy Confetti Salad", "1/2 cup", "salad", 1.4872],
  ["140744.1", "Summer Squash Salad", "8 ounce", "salad", 1.689], ["10908.11", "Thai Cucumber Salad with Peanuts", "1 serving(s)", "salad", 1.3478],
  ["135643.15", "Thai Fruit Salad", "1 bowl", "salad", 5.8406], ["64175.3", "Tuscan Tuna Sandwich", "1 sandwich", "sandwich", 1.585],
  ["9888.16", "Vegetable Quinoa Salad", "1/2 cup", "salad", 2.055], ["133954.1", "White Bean Hummus Veggie Wrap", "1 each", "sandwich", 2.4939],
  ["78426.3", "Yakisoba Crunch Salad", "1 cup", "salad", 1.3021], ["217792", "California Chicken Pasta Salad", "1 serving(s)", "salad", 2.7914],
  ["198596", "California Pasta Salad", "1/2 cup", "salad", 0.6739], ["217792.1", "Chicken Quinoa Roasted Beet Salad", "1 serving(s)", "salad", 2.4378],
  ["79691.32", "Edamame Cucumber Sandwich", "1 each", "sandwich", 2.5688], ["198522", "Lemon Pepper Bean and Pea Salad", "1/2 cup", "salad", 0.4857],
  ["1424.40", "Peanut Butter Jelly and Banana Sandwich", "1 each", "sandwich", 1.4726], ["122676.3", "Strawberry Farro Salad", "1 each", "salad", 2.4846],
  ["119416.1", "Chicken Banh Mi", "1 serving(s)", "sandwich", 2.444],
];

export const FRESH_FIVE_ITEMS = Object.freeze(rows.map(([mrn, name, portion, family, itemWasteCost]) => Object.freeze({ id: `fresh-five|${mrn}`, menu: "AMZ: Fresh Five", mrn, name, portion, family, itemWasteCost })));
