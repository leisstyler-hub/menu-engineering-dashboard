import { evaluateItem, itemRestrictions } from './weighPayModel.js';
import { analyzeAndes } from './andesAnalysisModel.js';

export const CATEGORIES = ['Proteins', 'Starches / grains', 'Vegetables', 'Sauces / dressings', 'Toppings / garnishes'];
export const TIERS = ['≤30%', '>30–40%', '>40–50%', '>50–60%', '>60%', 'Needs information'];
export function tierFor(fc) {
  if (!Number.isFinite(fc) || fc < 0) return 'Needs information';
  return TIERS[[.3,.4,.5,.6].findIndex(limit => fc <= limit + 1e-12)] || '>60%';
}
const handheld = /\b(pizzas?|flatbreads?|burgers?|sandwich(?:es)?|naanwich|banh mi|handheld|burritos?|quesadillas?|tacos?|kathi roll|gyros?|panini|wraps?|torta|cubano|reuben|grilled cheese|monte cristo|blta|grinder)\b/i;
const assembled = /\b(plates?|bowls?|bibimbap|bibimbowl)\b/i;
const prep = /\b(marinade|paste|stock|base|spice blend|masala spice|garam masala|seasoning|dough|batter|brine)\b/i;
const nonCore = /\b(cookies?|cake|baklava|shortbread|brownie|pudding|churros?|lassi|horchata|iced tea|black tea|chai tea|iced coffee|smoothie|lemonade|beverage|agua fresca|flan|sfoof|ladoo|doughnuts?)\b/i;
function categoryFor(name) {
  if (/\b(?:mashed|baked|roasted|loaded) potatoes\b/i.test(name)) return 'Starches / grains';
  const mainFood=name.split(/\b(?:in|with)\b/i);
  if (mainFood.length>1 && /\b(chicken|tofu|tempeh|seitan|turkey|pork|beef|lamb|fish|salmon|shrimp|paneer)\b/i.test(mainFood[0])) return 'Proteins';
  if (/\b(cauliflower|celeriac|mushroom|portobello)\b.*\b(steak|shawarma|flank)\b/i.test(name)) return 'Vegetables';
  if (/\b(sauce|gravy|dressing)\b\s*(?:\([^)]*\))?\s*$/i.test(name)) return 'Sauces / dressings';
  if (/\b(halloumi|falafel|bacon|sausage|ham|meatloaf|porchetta)\b/i.test(name)) return 'Proteins';
  if (/\b(hummus|mayo(?:nnaise)?|mustard|tzatziki|toum|muhammara|remoulade|crema|dip|guacamole|relish|tapenade|sriracha|vina?igrette|viniagrette)\b/i.test(name)) return 'Sauces / dressings';
  if (/\b(orzo|millet|amaranth|oatmeal|oats|mujadara|tater tots|mac & cheese)\b/i.test(name)) return 'Starches / grains';
  // Finished food with a sauce in its name is still a protein, not a sauce.
  if (/\b(chicken|tofu|tempeh|seitan|turkey|pork|beef|steak|lamb|veal|fish|salmon|shrimp|kebab|murga|paneer|meatballs?|eggs?)\b/i.test(name) && !/\b(sauce|gravy|dressing|chutney)\b[^]*\b(chicken|tofu|turkey|pork|beef)\b/i.test(name)) return 'Proteins';
  if (/\b(sauce|dressing|chutney|gravy|pesto|vinaigrette|aioli|raita|salsa)\b/i.test(name) && !/\bsalsa criolla\b/i.test(name)) return 'Sauces / dressings';
  if (/\b(rice|quinoa|noodles?|pasta|gnocchi|potato(?:es)?|fries|yucca|yuca|plantains?|naan|bread|couscous|bulgur|farro|barley|grits|polenta|macaroni)\b/i.test(name)) return 'Starches / grains';
  if (/\b(vegetables?|broccoli|cauliflower|carrots?|asparagus|beans?|lentils?|chickpeas?|peas|kale|poriyal|spinach|cabbage|corn|salad|solterito|salsa criolla|mushrooms?|matar|squash|zucchini|brussels|eggplant|greens|beets?)\b/i.test(name)) return 'Vegetables';
  if (/\b(dal|chana|chole|huli|gobhi|bok choy|radish|cucumbers?|broccolini|lettuce|tomato(?:es)?|onions?|peppers?|parsnips?|celeriac|portobello|maitake|edamame|esquites|kachumbar|tabbouleh|fattoush|sunchokes?|sun chokes)\b/i.test(name)) return 'Vegetables';
  if (/\b(topping|garnish|crispy onions|croutons?|pickles?|pickled|slaw)\b/i.test(name)) return 'Toppings / garnishes';
  return null;
}
export function panReadyMenu(source, rate, sharedRows = []) {
  const analyzed = analyzeAndes(source, rate, sharedRows), byId = new Map(analyzed.map(r => [r.id,r]));
  const items = new Map(), review = new Map(), excluded = new Map();
  function identity(r, seen = []) {
    if (!r || seen.includes(r.id)) return 'unresolved';
    return JSON.stringify([r.mrn,r.portion,r.cost,r.massOz,(r.components || []).map(e => [e.quantity,identity(e.analysis,[...seen,r.id])])]);
  }
  function visit(r, fromPlate = false, path = []) {
    if (!r || r.issue || path.includes(r.id)) return;
    if (handheld.test(r.name)) { excluded.set(r.id,{...r,classificationReason:'Handheld excluded'}); return; }
    if (nonCore.test(r.name)) { excluded.set(r.id,{...r,classificationReason:'Non-core dessert / beverage excluded'}); return; }
    const formatName=r.name.replace(/\([^)]*\)/g,'').replace(/\bBowl Inc\b/gi,'');
    if (assembled.test(formatName)) {
      if (!r.components.length) review.set(r.id,{...r,classificationReason:'Assembly has no linked service components'});
      for (const edge of r.components) {
        if (edge.analysis.issue) review.set(`${r.id}:${edge.mrn}`,{...r,name:edge.name,mrn:edge.mrn,portion:'',cost:null,massOz:null,classificationReason:'Component link needs review'});
        else visit(edge.analysis,true,[...path,r.id]);
      }
      return;
    }
    const category = categoryFor(r.name);
    if (prep.test(r.name)) { review.set(r.id,{...r,classificationReason:'Supporting prep only'}); return; }
    if (!category) { review.set(r.id,{...r,classificationReason:'Service category needs review'}); return; }
    const restriction=itemRestrictions({item:r.name,portion:r.portion,category});
    const serviceReasons=[...new Set([...r.serviceReasons,...restriction.reasons,...restriction.reviews])];
    const key = identity(r);
    const existing = items.get(key);
    items.set(key,{...r,key,menu:source.concept,category,serviceReasons,tier:tierFor(r.foodCost),
      classificationBasis:fromPlate?'Linked assembly component; name-based category':'Menu item; name-based category',
      parents:[...new Set([...(existing?.parents || []),...path.map(id=>byId.get(id)?.name).filter(Boolean)])]});
  }
  for (const r of analyzed.filter(r=>r.topLevel)) visit(r);
  const candidates = [...items.values()].sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
  // Equal MRN/portion with disagreeing economics must never rank as a resolved option.
  const identities = new Map();
  for (const r of candidates) {
    const id = JSON.stringify([r.mrn,r.portion]);
    if (!identities.has(id)) identities.set(id,[]);
    identities.get(id).push(r);
  }
  for (const variants of identities.values()) if (variants.length>1) for (const r of variants) {
    r.foodCost=null; r.tier='Needs information'; r.economics='Needs review';
    r.serviceReasons=[...r.serviceReasons,'Conflicting source variants require review'];
  }
  return {menu:source.concept,items:candidates,review:[...review.values()],excluded:[...excluded.values()]};
}

export function assessPanReadyMenu(p, rate, trusted, overrides = {}) {
    const items=p.items.map(r=>{
      const row={menu:p.menu,item:r.name,mrn:r.mrn,portion:r.portion,portionOz:r.massOz,trueCost:r.cost,category:r.category,servingRole:'pan-ready'};
      const evaluated=evaluateItem(row,overrides[r.key],{pricePerLb:rate});
      if(r.economics==='Needs review'){evaluated.foodCost=null;evaluated.status='Review';evaluated.calculatedStatus='Review';}
      return {...evaluated,key:r.key};
    });
    const total=items.length,allowed=items.filter(i=>i.status.startsWith('Allowed')).length;
    const calculatedAllowed=items.filter(i=>i.calculatedStatus==='Allowed').length;
    const missing=items.filter(i=>i.missingCost||i.missingWeight).length;
    const exceptions=items.filter(i=>i.override).length;
    const unresolved=items.filter(i=>['Needs cost','Needs weight','Needs price','Review'].includes(i.status)).length;
    const classificationReview=p.review.some(r=>r.classificationReason!=='Supporting prep only');
    const passRate=total?allowed/total:0;
    const status=!total?(classificationReview?'Conditional':'Unassessed'):!trusted||!rate||exceptions||classificationReview||items.some(i=>i.status==='Review')?'Conditional':passRate>=.6?'Pass':(allowed+unresolved)/total>=.6?'Conditional':'Fail';
    const assessed={menu:p.menu,items,total,allowed,calculatedAllowed,missing,exceptions,passRate,calculatedPassRate:total?calculatedAllowed/total:0,status};
  return assessed;
}
