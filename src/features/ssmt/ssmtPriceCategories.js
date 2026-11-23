// Exact legacy guide identities from the read-only 2026-11-23 mapping.
// Presentation only: no saved row, price, reference or plan is rewritten.
const LEGACY_GRILL_ROWS = {
  "price-guide-2026-row-12": "Cheese Smashburger",
  "price-guide-2026-row-13": "Southwest Burger",
  "price-guide-2026-row-14": "Haystack Burger",
  "price-guide-2026-row-15": "Mushroom Swiss Burger",
  "price-guide-2026-row-16": "Smashburger",
  "price-guide-2026-row-17": "Santa Fe Black Bean Burger (V)",
  "price-guide-2026-row-18": "Grilled Chicken Sandwich",
  "price-guide-2026-row-19": "Diablo Burger",
  "price-guide-2026-row-20": "Teriyaki Bacon Burger",
  "price-guide-2026-row-21": "Spicy Nashville Fried Chicken Sandwich",
  "price-guide-2026-row-22": "Chicken Tenders",
  "price-guide-2026-row-23": "Blackened Steelhead Sandwich",
  "price-guide-2026-row-24": "Cali Salmon Burger",
  "price-guide-2026-row-25": "BBQ Brisket Burger",
  "price-guide-2026-row-27": "Plant Based Platinum (VN)",
  "price-guide-2026-row-28": "Grammy Inferno",
  "price-guide-2026-row-29": "Baja Fish Sandwich",
  "price-guide-2026-row-30": "Nor Cal Crab Melt",
  "price-guide-2026-row-31": "Pork Tonkatsu Sandwich",
  "price-guide-2026-row-32": "Vegan Malibu Melt",
  "price-guide-2026-row-33": "Carne Asada Torta",
  "price-guide-2026-row-34": "Crispy Chicken Bacon Avocado Sandwich",
  "price-guide-2026-row-35": "A.M. Burger",
  "price-guide-2026-row-36": "Spicy Firebird Sandwich",
  "price-guide-2026-row-37": "Original Half Smoke",
  "price-guide-2026-row-38": "Spicy Fried Cod Sandwich",
  "price-guide-2026-row-39": "Crispy Buffalo Chicken Wrap",
  "price-guide-2026-row-40": "Chicken Chesapeake Sandwich",
  "price-guide-2026-row-41": "Philly Cheesesteak",
  "price-guide-2026-row-42": "BBQ Blended Burger",
  "price-guide-2026-row-43": "BBQ Blended Burger (Mfp Sun26; Pos 312689901)",
  "price-guide-2026-row-44": "Carolina BBQ Burger",
  "price-guide-2026-row-45": "Korean Fried Chicken Sandwich",
  "price-guide-2026-row-46": "Brunch Burger",
  "price-guide-2026-row-47": "Chicken Bacon Ranch Sandwich",
  "price-guide-2026-row-48": "Baja Fish Sandwich (SJC Core Grill)",
  "price-guide-2026-row-49": "Carne Asada Torta (SJC Core Grill)",
  "price-guide-2026-row-50": "Lamb And Beef Gyro Pita With Tzatziki",
  "price-guide-2026-row-51": "Bacon Lettuce Fried Green Tomatoes Sandwich",
  "price-guide-2026-row-52": "Pork Cubano Sandwich",
  "price-guide-2026-row-53": "Beer Battered Fish And Chips",
  "price-guide-2026-row-54": "Beef Philly Cheesesteak",
  "price-guide-2026-row-55": "French Onion Grilled Cheese With Gruyere"
};

export function isLegacyGrillPrice(row = {}) {
  return Object.hasOwn(LEGACY_GRILL_ROWS, row.id) &&
    LEGACY_GRILL_ROWS[row.id] === String(row.category || "").trim();
}

export function categoryPriceOptions(rows = [], selectedId = "") {
  return rows.filter(row => !isLegacyGrillPrice(row) || row.id === selectedId);
}

export function categoryPriceLabel(row) {
  const label = row.selectorLabel || row.category;
  return isLegacyGrillPrice(row) ? `${label} (legacy dish price - review category)` : label;
}
