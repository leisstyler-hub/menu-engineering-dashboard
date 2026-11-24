export const DAILY_GLOBAL_ORDER_VERSION = 1;

const plate = (menu, animal, vegetarian, components, garnish) => Object.freeze({
  menu,
  animal: Object.freeze(animal),
  vegetarian: Object.freeze(vegetarian),
  components: Object.freeze(components.map(Object.freeze)),
  garnish: Object.freeze(garnish),
});

const tacoTotal = plate("AMZ: Taco Total",
  { name: "Chicken Tinga Burrito Bowl", mrn: "41742.6", portion: "1/2 cup" },
  { name: "Al Pastor Cauliflower Burrito Bowl", mrn: "175362.2", portion: "1/2 cup" },
  [
    { id: "daily-taco-rice", name: "Cilantro Lime Rice", mrn: "41689.9", quantity: 1, unit: "plate portion", type: "subrecipe" },
    { id: "daily-taco-beans", name: "Seasoned Black Beans", mrn: "76908.2", quantity: 1, unit: "plate portion", type: "subrecipe" },
    { id: "daily-taco-romaine", name: "Shredded Romaine", mrn: "81493", quantity: 1, unit: "plate portion", type: "subrecipe" },
    { id: "daily-taco-pico", name: "Pico de Gallo", mrn: "11315", quantity: 1, unit: "plate portion", type: "subrecipe" },
    { id: "daily-taco-cotija", name: "Cotija Cheese", mrn: "226776", quantity: 1, unit: "plate portion", type: "ingredient" },
  ],
  { id: "daily-taco-garnish", name: "Cilantro garnish", quantity: 1, unit: "plate garnish", type: "ingredient" });

const porto = plate("AMZ: Porto",
  { name: "Piri Piri Chicken (bone-in)", mrn: "121026", portion: "1 plate" },
  { name: "Piri Piri Tofu", mrn: "121022.2", portion: "1 plate" },
  [
    { id: "daily-porto-wedges", name: "Piri Piri Potato Wedges", mrn: "121015", quantity: 1, unit: "plate portion", type: "ingredient" },
    { id: "daily-porto-couscous", name: "Pistachio Herb Couscous Salad", mrn: "120641", quantity: 1, unit: "plate portion", type: "ingredient" },
    { id: "daily-porto-pirinaise", name: "Piri-naise Dipping Sauce", mrn: "121071", quantity: 1, unit: "plate portion", type: "subrecipe" },
  ],
  { id: "daily-porto-garnish", name: "Parsley garnish", quantity: 1, unit: "plate garnish", type: "ingredient" });

const teriyaki = plate("AMZ: House of Teriyaki",
  { name: "Chicken Teriyaki", mrn: "83244.7", portion: "1 plate" },
  { name: "Portobello Tofu Teriyaki", mrn: "107142.156", portion: "1 plate" },
  [
    { id: "daily-teriyaki-rice", name: "Jasmine Rice", mrn: "5354.11", quantity: 1, unit: "plate portion", type: "ingredient" },
    { id: "daily-teriyaki-salad", name: "Teriyaki Salad with Ginger Dressing", mrn: "83251.2", quantity: 1, unit: "plate portion", type: "subrecipe" },
    { id: "daily-teriyaki-sauce", name: "Teriyaki Sauce", mrn: "83233", quantity: 1, unit: "plate portion", type: "subrecipe" },
  ],
  { id: "daily-teriyaki-garnish", name: "Scallion garnish", quantity: 1, unit: "plate garnish", type: "ingredient" });

const balti = plate("AMZ: Balti",
  { name: "Butter Chicken Plate", mrn: "212486.1", portion: "1 plate" },
  { name: "Palak Paneer Plate", mrn: "212486.13", portion: "1 plate" },
  [
    { id: "daily-balti-rice", name: "Lemon Basmati Rice", quantity: 1, unit: "plate portion", type: "subrecipe" },
    { id: "daily-balti-daal", name: "Spinach Daal", mrn: "165741.9", quantity: 1, unit: "plate portion", type: "subrecipe" },
    { id: "daily-balti-naan", name: "Naan", quantity: 1, unit: "each", type: "ingredient" },
    { id: "daily-balti-chutney", name: "Mango Chutney", mrn: "89516", quantity: 1, unit: "plate portion", type: "subrecipe" },
  ],
  { id: "daily-balti-garnish", name: "Cilantro garnish", quantity: 1, unit: "plate garnish", type: "ingredient" });

const cypress = plate("AMZ: Cypress",
  { name: "Chicken Souvlaki Gyro", mrn: "132544.6", portion: "1 plate" },
  { name: "Green Garbanzo Falafel Gyro", mrn: "132544.1", portion: "1 plate" },
  ["Pita", "Tomato", "Cucumber", "Lettuce", "Red onion", "Feta", "Hummus"].map((name) => ({ id: `daily-cypress-${name.toLowerCase().replace(/\s+/g, "-")}`, name, quantity: 1, unit: "plate portion", type: name === "Hummus" ? "subrecipe" : "ingredient" })),
  { id: "daily-cypress-garnish", name: "Extra virgin olive oil and parsley garnish", quantity: 1, unit: "plate garnish", type: "ingredient" });

const bibimbap = plate("AMZ: Bibimbowl",
  { name: "Gochujang Chicken Bibimbap Bowl", mrn: "145714.1", portion: "1 plate" },
  { name: "Gochujang Tofu Bibimbap Bowl", mrn: "145714.2", portion: "1 plate" },
  ["Jasmine rice", "Mixed greens", "Kimchi", "Peppered edamame", "Sesame spinach", "Shredded egg", "Bibimbap sauce"].map((name) => ({ id: `daily-bibimbap-${name.toLowerCase().replace(/\s+/g, "-")}`, name, quantity: 1, unit: "plate portion", type: /kimchi|spinach|sauce/i.test(name) ? "subrecipe" : "ingredient" })),
  { id: "daily-bibimbap-garnish", name: "Sesame seed, scallion and sesame oil garnish", quantity: 1, unit: "plate garnish", type: "ingredient" });

const day = (key, label, plateDefinition) => Object.freeze({ key, label, ...plateDefinition });

export const GEMINI_DAILY_GLOBAL_PROGRAM = Object.freeze({
  anchorWeekStart: "2026-11-23",
  cycleLengthWeeks: 2,
  eligibleCafes: Object.freeze(["Gemini"]),
  orderUnit: "plate",
  cycleWeeks: Object.freeze([
    Object.freeze({ week: 1, days: Object.freeze([
      day("monday", "Monday", teriyaki), day("tuesday", "Tuesday", teriyaki),
      day("wednesday", "Wednesday", balti), day("thursday", "Thursday", balti), day("friday", "Friday", porto),
    ]) }),
    Object.freeze({ week: 2, days: Object.freeze([
      day("monday", "Monday", porto), day("tuesday", "Tuesday", cypress),
      day("wednesday", "Wednesday", cypress), day("thursday", "Thursday", bibimbap), day("friday", "Friday", bibimbap),
    ]) }),
  ]),
});

const continuousBlocks = Object.freeze([tacoTotal, balti, teriyaki, porto, cypress, bibimbap]);
const weekdayLabels = Object.freeze(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
const continuousCycleWeeks = Object.freeze(Array.from({ length: 12 }, (_, weekIndex) => Object.freeze({
  week: weekIndex + 1,
  days: Object.freeze(weekdayLabels.map((label, dayIndex) => day(label.toLowerCase(), label, continuousBlocks[Math.floor((weekIndex * 5 + dayIndex) / 2) % continuousBlocks.length]))),
})));

export const TWO_TWO_TWO_DAILY_GLOBAL_PROGRAM = Object.freeze({
  anchorWeekStart: "2026-11-30",
  cycleLengthWeeks: 12,
  eligibleCafes: Object.freeze(["Eclipse", "Sonic", "Bingo", "Grace", "Blueshift"]),
  orderUnit: "plate",
  rotationModel: "continuous-two-service-day-blocks",
  menuSequence: Object.freeze(["AMZ: Taco Total", "AMZ: Balti", "AMZ: House of Teriyaki", "AMZ: Porto", "AMZ: Cypress", "AMZ: Bibimbowl"]),
  cycleWeeks: continuousCycleWeeks,
});

// Kept as the compatibility/default program for existing Gemini orders.
export const DAILY_GLOBAL_PROGRAM = GEMINI_DAILY_GLOBAL_PROGRAM;
export const DAILY_GLOBAL_PROGRAMS = Object.freeze({ gemini: GEMINI_DAILY_GLOBAL_PROGRAM, twoTwoTwo: TWO_TWO_TWO_DAILY_GLOBAL_PROGRAM });
export function dailyGlobalProgramForCafe(cafe = "") {
  return TWO_TWO_TWO_DAILY_GLOBAL_PROGRAM.eligibleCafes.includes(cafe) ? TWO_TWO_TWO_DAILY_GLOBAL_PROGRAM : GEMINI_DAILY_GLOBAL_PROGRAM;
}

export const DAILY_GLOBAL_PREP_ITEM_IDS = Object.freeze([...new Set(Object.values(DAILY_GLOBAL_PROGRAMS).flatMap((program) => program.cycleWeeks.flatMap(({ days }) => days.flatMap(({ components, garnish }) => [...components.map(({ id }) => id), garnish.id]))))]);
