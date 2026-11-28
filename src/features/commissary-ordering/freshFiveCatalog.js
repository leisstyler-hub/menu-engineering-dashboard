export const FRESH_FIVE_ORDER_VERSION = 2;
export const FRESH_FIVE_EFFECTIVE_WEEK = "2026-11-30";

const rows = [
  ["9888.16", "Balsamic Tofu Quinoa Lentil Salad", "1 serving(s)", "salad", 2.6062],
  ["83821.10", "Chipotle Chicken Salad Sliders", "1 each", "sandwich", 2.6374],
  ["191329.1", "Cucumber Fennel Salad", "1 serving(s)", "salad", 2.3618],
  ["29091.10", "Falafel Kale Salad", "1 serving(s)", "salad", 2.652],
  ["132011.3", "Hominy Confetti Salad", "1 serving(s)", "salad", 1.7202],
  ["140744.1", "Summer Squash Salad", "1 serving(s)", "salad", 2.3046],
  ["10908.11", "Thai Chicken Rice Noodle Salad With Peanuts", "1 serving(s)", "salad", 2.7352],
  ["78426.3", "Yakisoba Crunch Salad", "1 serving(s)", "salad", 2.0228],
  ["64175.3", "Tuscan Tuna Sandwich", "1 sandwich", "sandwich", 2.5542],
  ["133954.1", "White Bean Hummus Veggie Wrap", "1 each", "sandwich", 2.6312],
  ["217792", "California Chicken Pasta Salad", "1 serving(s)", "salad", 2.7446],
  ["217792.1", "Chicken Quinoa Roasted Beet Salad", "1 serving(s)", "salad", 2.3899],
  ["79691.32", "Edamame Cucumber Sandwich", "1 each", "sandwich", 2.2506],
  ["198522", "Lemon Pepper Bean And Pea Salad", "1 serving(s)", "salad", 1.9646],
  ["1424.40", "Peanut Butter Jelly And Banana Sandwich", "1 each", "sandwich", 2.0238],
  ["122676.3", "Strawberry Farro Salad", "1 serving(s)", "salad", 2.8954],
  ["159013.1", "Black Bean Burger", "1 each", "sandwich", 2.6749],
  ["9268.7", "Blackened Chicken Caesar Wrap", "1 each", "sandwich", 2.3005],
  ["119416.1", "Chicken Banh Mi", "1 serving(s)", "sandwich", 2.417],
];

export const FRESH_FIVE_ITEMS = Object.freeze(rows.map(([mrn, name, portion, family, itemWasteCost]) => Object.freeze({
  id: `fresh-five|${mrn}`,
  menu: "AMZ: Fresh Five",
  mrn,
  name,
  portion,
  family,
  station: family === "sandwich" ? "Deli" : "Salad Bar",
  itemWasteCost,
})));

const itemByMrn = new Map(FRESH_FIVE_ITEMS.map((item) => [item.mrn, item]));
const cycleWeek = (week, mrns) => Object.freeze({ week, items: Object.freeze(mrns.map((mrn) => itemByMrn.get(mrn)).filter(Boolean)) });

export const EASTSIDE_FRESH_FIVE_PROGRAM = Object.freeze({
  key: "eastside",
  anchorWeekStart: "2026-12-07",
  effectiveWeek: "2026-12-07",
  cycleLengthWeeks: 4,
  eligibleCafes: Object.freeze(["Sonic", "Blueshift", "Bingo", "Grace", "Everest", "Gemini", "Astra", "Odyssey", "Eclipse"]),
  prepHub: "Sonic",
  cycleWeeks: Object.freeze([
    cycleWeek(1, ["83821.10", "133954.1"]),
    cycleWeek(2, ["217792.1", "79691.32", "133954.1"]),
    cycleWeek(3, ["198522", "64175.3", "133954.1"]),
    cycleWeek(4, ["119416.1", "191329.1", "133954.1"]),
  ]),
});

export const CRICKET_FRESH_FIVE_PROGRAM = Object.freeze({
  key: "cricket",
  anchorWeekStart: "2026-11-23",
  effectiveWeek: "2026-11-30",
  cycleLengthWeeks: 4,
  eligibleCafes: Object.freeze(["Brazil Coffee", "Roxanne Coffee", "Atlas"]),
  prepHub: "Cricket",
  cycleWeeks: Object.freeze([
    cycleWeek(1, ["159013.1", "1424.40", "119416.1", "132011.3", "198522"]),
    cycleWeek(2, ["9268.7", "1424.40", "119416.1", "132011.3", "198522"]),
    cycleWeek(3, ["159013.1", "79691.32", "83821.10", "217792.1", "78426.3"]),
    cycleWeek(4, ["9268.7", "133954.1", "64175.3", "217792", "198522"]),
  ]),
});

export const FRESH_FIVE_PROGRAMS = Object.freeze([EASTSIDE_FRESH_FIVE_PROGRAM, CRICKET_FRESH_FIVE_PROGRAM]);

function weekIndex(weekStart, anchorWeekStart, cycleLengthWeeks) {
  const diff = Math.round((Date.parse(`${weekStart}T12:00:00Z`) - Date.parse(`${anchorWeekStart}T12:00:00Z`)) / 604800000);
  return ((diff % cycleLengthWeeks) + cycleLengthWeeks) % cycleLengthWeeks;
}

export function freshFiveProgramForCafe(cafe = "", weekStart = "") {
  return FRESH_FIVE_PROGRAMS.find((program) => program.eligibleCafes.includes(cafe) && String(weekStart) >= program.effectiveWeek) || null;
}

export function freshFiveCycleForWeek(cafe = "", weekStart = "") {
  const program = freshFiveProgramForCafe(cafe, weekStart);
  return program?.cycleWeeks[weekIndex(weekStart, program.anchorWeekStart, program.cycleLengthWeeks)] || null;
}

export function isFreshFiveEligibleCafe(cafe = "", weekStart = "") {
  return Boolean(freshFiveProgramForCafe(cafe, weekStart));
}
