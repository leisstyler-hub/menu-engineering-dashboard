// Approved W&P rules: PRODUCT_DECISIONS.md, 2026-10-13. Never writes source rows.
export const WP_PRICE_PER_LB = 11.20;
export const WP_ITEM_FC_GATE = .4;
export const WP_MENU_PASS_GATE = .6;
export const WP_RULE_VERSION = '2026.10.23';

function numeric(value) {
  if (value == null || typeof value === 'boolean' || String(value).trim() === '') return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

export function pricePerLb(value, unit = 'lb') {
  const amount = numeric(value);
  const rate = amount * (unit === 'oz' ? 16 : 1);
  return amount > 0 && Number.isFinite(rate) && ['lb', 'oz'].includes(unit) ? rate : null;
}

export function portionWeightOz(row) {
  const stored = numeric(row.portionOz ?? row.portion_oz);
  if (stored != null && stored > 0) return stored;
  // Only explicit mass units are convertible. Pieces/cups/fluid ounces are not mass.
  const text = String(row.portion || row.servingSize || '').trim().toLowerCase();
  const match = text.match(/^(\d+(?:\.\d+)?|\.\d+)\s*(oz|ounces?|lbs?|pounds?|g|grams?|kg|kilograms?)\s*$/);
  if (!match) return null;
  const amount = numeric(match[1]);
  if (!(amount > 0)) return null;
  const unit = match[2];
  if (/^(lb|pound)/.test(unit)) return amount * 16;
  if (/^(kg|kilogram)/.test(unit)) return amount * 1000 / 28.349523125;
  if (/^(g|gram)/.test(unit)) return amount / 28.349523125;
  return amount;
}

export function itemIdentity(row) {
  const mrn = row.mrn == null || String(row.mrn).trim() === '' ? null : String(row.mrn);
  const id = mrn ?? String(row.item_key ?? row.itemKey ?? row.id ?? row.item ?? '');
  return JSON.stringify([String(row.menu || 'Unassigned menu'), id, portionWeightOz(row) ?? String(row.portion || '')]);
}

export function itemRestrictions(row) {
  const name = String(row.item || row.displayName || '').toLowerCase();
  const category = String(row.category || row.recipeCategory || '').toLowerCase();
  const menu = String(row.menu || '').toLowerCase();
  const explicitPlant = /\b(plant[ -]based|vegan|vegetarian|seitan)\b/.test(name);
  const namedAnimal = /\b(beef|lamb|veal|pork|salmon|shrimp|fish|tuna|trout|seafood|crab|lobster)\b/.test(name);
  const plant = explicitPlant || (!namedAnimal && (/\b(lentil|cauliflower|mushroom|celeriac|tofu|tempeh|grain flank)\b/.test(name) || /vegan|vegetarian/i.test(String(row.veganTag || row.vegetarianTag || row.dietTags || ''))));
  const reasons = [];
  const reviews = [];
  if (!plant && /\b(lamb|veal)\b/.test(name)) reasons.push('Lamb / veal exclusion');
  if (!plant && /\bpork tenderloin\b/.test(name)) reasons.push('Pork tenderloin exclusion');
  if (/\b(burgers?|sandwich|sandwiches|naanwich|banh mi|handheld|burritos?|quesadillas?|tacos?|kathi roll|gyro|gyros|panini|wrap)\b/.test(name)) reasons.push('Handheld / constructed format stays fixed-price');
  if (/soup/.test(name + ' ' + menu) && /\b(fl\s*oz|floz|fluid|cups?|ml|millilit|liters?|litres?|qt|quarts?)\b/.test(String(row.portion || '').toLowerCase())) reasons.push('Soup by volume stays fixed-price');
  if (row.servingRole!=='pan-ready'&&/sub.?recipe|extension|sauce|topping|bread|beverage|retail|add.?on/.test(category)) reasons.push('Non-core add-on stays fixed-price');
  if (row.servingRole !== 'pan-ready' && /\b(balti|bibimbowl)\b/.test(menu)) reviews.push('Validate complete guest build / service format');
  return { reasons, reviews };
}

export function evaluateItem(row, override, options = {}) {
  const rate = pricePerLb(options.pricePerLb === undefined ? WP_PRICE_PER_LB : options.pricePerLb);
  const cost = numeric(row.trueCost ?? row.true_cost);
  const weightOz = portionWeightOz(row);
  const missingCost = cost == null || cost < 0;
  const missingWeight = weightOz == null;
  const revenue = missingWeight ? null : weightOz / 16 * rate;
  const foodCost = missingCost || missingWeight || !rate ? null : cost / revenue;
  const economicsPass = foodCost != null && foodCost <= WP_ITEM_FC_GATE + 1e-12;
  const { reasons, reviews } = itemRestrictions(row);
  if (rate && !missingCost && !missingWeight && !economicsPass) reasons.push('Above 40% True Food Cost');
  const calculatedStatus = !rate ? 'Needs price' : missingCost ? 'Needs cost' : missingWeight ? 'Needs weight' : reasons.length ? 'Blocked' : reviews.length ? 'Review' : 'Allowed';
  const validOverride = override && ['allow', 'block'].includes(override.decision) && String(override.reason || '').trim() ? { decision: override.decision, reason: String(override.reason).trim() } : null;
  const status = validOverride?.decision === 'block' ? 'Blocked by override' : validOverride?.decision === 'allow' && rate && !missingCost && !missingWeight ? 'Allowed by override' : calculatedStatus;
  return { pricePerLb: rate, key: itemIdentity(row), item: String(row.item || row.displayName || 'Unnamed item'), menu: String(row.menu || 'Unassigned menu'), mrn: String(row.mrn ?? ''), category: String(row.category || row.recipeCategory || 'Uncategorized'), cost: missingCost ? null : cost, portion: String(row.portion || ''), weightOz, revenue, foodCost, costPerLb: missingCost || missingWeight ? null : cost / (weightOz / 16), marginPerLb: missingCost || missingWeight ? null : rate == null ? null : rate - cost / (weightOz / 16), status, calculatedStatus, economicsPass, reasons, reviews, missingCost, missingWeight, override: validOverride };
}

export function evaluateMenus(rows = [], overrides = {}, { trusted = true, pricePerLb: rate = WP_PRICE_PER_LB } = {}) {
  const grouped = new Map();
  for (const row of rows) {
    const menu = String(row.menu || 'Unassigned menu');
    if (!grouped.has(menu)) grouped.set(menu, new Map());
    const key = itemIdentity(row);
    const item = evaluateItem(row, overrides[key], { pricePerLb: rate });
    const prior = grouped.get(menu).get(key);
    if (prior && (prior.cost !== item.cost || prior.calculatedStatus !== item.calculatedStatus)) {
      item.reviews.push('Conflicting duplicate source rows require review');
      item.calculatedStatus = 'Review';
      item.status = 'Review';
    }
    grouped.get(menu).set(key, item);
  }
  return [...grouped.entries()].map(([menu, itemMap]) => {
    const items = [...itemMap.values()].sort((a, b) => a.category.localeCompare(b.category) || a.item.localeCompare(b.item));
    const total = items.length;
    const allowed = items.filter(item => item.status.startsWith('Allowed')).length;
    const calculatedAllowed = items.filter(item => item.calculatedStatus === 'Allowed').length;
    const missing = items.filter(item => item.missingCost || item.missingWeight).length;
    const review = items.filter(item => item.status === 'Review').length;
    const exceptions = items.filter(item => item.status === 'Allowed by override' && item.calculatedStatus !== 'Allowed').length;
    const unresolved = items.filter(item => ['Needs cost', 'Needs weight', 'Review'].includes(item.status)).length;
    const passRate = total ? allowed / total : 0;
    const meetsGate = total > 0 && passRate >= WP_MENU_PASS_GATE;
    const status = !total ? 'Unassessed' : !pricePerLb(rate) || !trusted || exceptions || review ? 'Conditional' : meetsGate ? 'Pass' : (allowed + unresolved) / total >= WP_MENU_PASS_GATE ? 'Conditional' : 'Fail';
    return { menu, total, allowed, calculatedAllowed, missing, review, exceptions, passRate, calculatedPassRate: total ? calculatedAllowed / total : 0, meetsGate, status, items };
  }).sort((a, b) => a.menu.localeCompare(b.menu));
}
