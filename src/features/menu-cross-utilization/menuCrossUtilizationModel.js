// Pure data-shape helpers shared by the build-time generator, the verify script, and the UI.
// No PDF/XLSX parsing lives here — only the deterministic rules for turning parsed rows into
// match keys and turning match-key sets into presence-based overlap statistics.

export const SCOPE = {
  account: "Amazon Region (FBE000)",
  reportDate: "2026-08-03",
  mealPeriod: "Lunch",
  source: "MenuWorks Shopping List Reports",
};

// Static, document-defined pillar groupings from `01 Pillar Summary` in the Compass workbook.
// Pillar membership is a strategic/cuisine categorization decision, not something derivable
// from ingredient data, so it is carried as reference data rather than computed.
export const PILLARS = [
  { name: "Latin", color: "#D97706", menus: ["Andes", "Cevicheria", "Ciudad", "La Chino", "Porto", "SMACO", "Taco Total"] },
  { name: "Asian & Pacific", color: "#0F766E", menus: ["Atlas Noodle", "Bibimbowl", "Chiang Mai", "House of Teriyaki", "Lemongrass + Lime", "Lotus", "Masaya", "Ohana", "Pho", "Poke Counter", "Sushi", "Wok", "Yakisoba"] },
  { name: "Mediterranean & Middle Eastern", color: "#7C3AED", menus: ["Anisa", "Barbanzo", "Cypress", "Oregano"] },
  { name: "Italian", color: "#B91C1C", menus: ["Paninioteca", "Piccola Italia", "Pizzas & Flatbreads", "Tavola Nova"] },
  { name: "American Grill & Smokehouse", color: "#374151", menus: ["Carvery", "Cutlet", "Fish Market", "Roam BBQ", "Salt & Char", "Smokehouse BBQ"] },
  { name: "South Asian", color: "#C2410C", menus: ["Balti", "Chaatwalla", "Katora", "Saffron", "Street Eats"] },
  { name: "Cafe Express & Fresh", color: "#15803D", menus: ["Bowl INC", "Fresh Five", "Global Grains", "Harvest Co", "Q Bowl", "Simmers", "Smoothies"] },
  { name: "Base Station Infrastructure", color: "#1D4ED8", menus: ["Breakfast", "Curated Salads", "Curated Sandwiches", "Deli Core", "Grill Core", "MTO Deli", "Soup", "WP Salad Bar"] },
];

// The PDF's own "Menus Included" field prints "AMZ: <Name>" / "AMZ+RA: <Name>", but that field
// carries source-system typos/prefixes we don't want as the display name. The filename stem is
// cleaner; these are the only three cosmetic corrections needed to match the workbook's naming.
const FILENAME_ALIASES = {
  "Salt and Char": "Salt & Char",
  "Lemongrass Lime": "Lemongrass + Lime",
  "Pizza Flatbreads": "Pizzas & Flatbreads",
};

export function canonicalMenuNameFromFilename(fileName) {
  const stem = String(fileName).replace(/^Shopping List /, "").replace(/\.pdf$/i, "").trim();
  return FILENAME_ALIASES[stem] || stem;
}

export function pillarForMenu(menuName) {
  return PILLARS.find((pillar) => pillar.menus.includes(menuName)) || null;
}

// Low-signal pantry items excluded from the primary overlap score, per the workbook's
// "Excluded low-signal pantry items" methodology: water, salt, generic granulated sugar,
// generic black pepper, broad cooking oils, and cooking spray. Distinctive variants (sesame
// oil, brown sugar, specialty spices, cuisine-specific vinegars) intentionally stay eligible.
const PANTRY_EXCLUDE_PATTERNS = [
  /^water\b/i,
  /^salt,/i,
  /^sugar,\s*granulated\b/i,
  /^spice,\s*pepper,\s*black\b/i,
  /^pepper,\s*black,\s*ground\b/i,
  /^oil,\s*(canola|vegetable|corn|soybean|blend)\b/i,
  /\bcooking\s*spray\b/i,
  /\bpan\s*spray\b/i,
];

export function isPantryExcluded(description) {
  const text = String(description || "").trim();
  return PANTRY_EXCLUDE_PATTERNS.some((pattern) => pattern.test(text));
}

// Deterministic fallback key for rows with no MIT code: case/punctuation-insensitive so the
// same source-system description text (e.g. "Peppers, Bell, Red, Fresh") matches itself across
// menus without attempting to replicate the workbook's LLM-derived stemming.
export function normalizeDescription(description) {
  return String(description || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function matchKeyFor({ mit, description }) {
  const cleanMit = String(mit || "").trim();
  if (cleanMit) return `mit:${cleanMit}`;
  return `desc:${normalizeDescription(description)}`;
}

export function jaccardOverlap(setA, setB) {
  const a = setA instanceof Set ? setA : new Set(setA);
  const b = setB instanceof Set ? setB : new Set(setB);
  let sharedCount = 0;
  for (const key of a) {
    if (b.has(key)) sharedCount += 1;
  }
  const unionCount = a.size + b.size - sharedCount;
  const overlapPercent = unionCount ? sharedCount / unionCount : 0;
  return { sharedCount, unionCount, overlapPercent };
}

export function pairKey(menuA, menuB) {
  return [menuA, menuB].sort().join("␟");
}

// Given the full per-menu match-key list map, compute the 54x54 (excludes menus with
// hasIngredientData:false) pairwise overlap list. Only stores overlapPercent + sharedCount per
// pair; shared ingredient names are derived on demand client-side from each menu's match keys.
export function buildPairwiseMatrix(menus) {
  const eligible = menus.filter((menu) => menu.hasIngredientData);
  const pairs = [];
  for (let i = 0; i < eligible.length; i += 1) {
    for (let j = i + 1; j < eligible.length; j += 1) {
      const a = eligible[i];
      const b = eligible[j];
      const { sharedCount, overlapPercent } = jaccardOverlap(new Set(a.matchKeys), new Set(b.matchKeys));
      pairs.push({ a: a.name, b: b.name, overlapPercent, sharedCount });
    }
  }
  return pairs;
}

export function findPair(pairs, menuA, menuB) {
  if (menuA === menuB) return null;
  return pairs.find((pair) => (pair.a === menuA && pair.b === menuB) || (pair.a === menuB && pair.b === menuA)) || null;
}

export function sharedIngredients(menus, menuA, menuB) {
  const a = menus.find((menu) => menu.name === menuA);
  const b = menus.find((menu) => menu.name === menuB);
  if (!a || !b) return [];
  const bSet = new Set(b.matchKeys);
  return a.matchKeys.filter((key) => bSet.has(key));
}

export function portfolioCrossUseStats(menu, allMenus) {
  const others = allMenus.filter((other) => other.name !== menu.name && other.hasIngredientData);
  const otherKeySet = new Set(others.flatMap((other) => other.matchKeys));
  const sharedWithAny = menu.matchKeys.filter((key) => otherKeySet.has(key)).length;
  const eligibleCount = menu.matchKeys.length;
  return {
    eligibleCount,
    sharedWithAny,
    uniqueCount: eligibleCount - sharedWithAny,
    crossUsePercent: eligibleCount ? sharedWithAny / eligibleCount : 0,
  };
}
