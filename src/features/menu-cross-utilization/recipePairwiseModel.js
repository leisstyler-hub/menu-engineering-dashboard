import { PILLARS, normalizeDescription, isPantryExcluded, buildPairwiseMatrix, portfolioCrossUseStats } from './menuCrossUtilizationModel.js';

const RECIPE_NAMESPACE = 'recipe-name:';
export const COVERAGE_REASONS = Object.freeze({
  'source-menu-conflict':'Packet cover and menu filename disagree; menu membership needs review.',
  'source-validation-pending':'Source extraction validation is incomplete.',
  'subrecipe-unresolved':'Subrecipe ingredients are missing, cyclic, or conflicting.',
  'packet-missing':'No recipe packet supplied for this menu.',
});
function pantryName(name) {
  const normalized=normalizeDescription(name);
  const sourceName=String(name||'').replace(/\s+/g,' ').trim();
  // Recipe reports reverse the shopping-list noun order. Apply the same approved
  // broad-oil and generic-black-pepper exclusions, including brand suffixes.
  if(/^(canola|vegetable|corn|soybean)( (cooking|frying))? oil(?:\s*,|$)/i.test(sourceName))return 'Oil, Canola';
  if(/^(?:(?:fine ground|ground|whole) )?black pepper(?:\s*,|$)/i.test(sourceName))return 'Spice, Pepper, Black';
  return {'tap water':'Water','salt':'Salt, Table','kosher salt':'Salt, Kosher','granulated sugar':'Sugar, Granulated'}[normalized]||name;
}

// Recipe names form their own exact-description cohort. Neither recipe codes nor names
// certify purchasing identity, SKU equivalence, cost savings, or compatible pack sizes.
export function buildRecipePairwiseData(books, {expectedMenus=[]}={}) {
  const groups = new Map();
  const ingredientLabels = {};
  for (const book of books) {
    if (!groups.has(book.menu)) groups.set(book.menu, { name:book.menu, keys:new Set(), issues:[], versions:[], reportDates:[], recipeCount:0, ingredientRows:0 });
    const menu=groups.get(book.menu);
    menu.versions.push(book.version);
    if(/^\d{2}\/\d{2}\/\d{4}$/.test(book.reportDateRaw||''))menu.reportDates.push(book.reportDateRaw);
    if (!book.validated) menu.issues.push(book.menuScopeConflict?'Source menu conflict':'Source validation pending');
    const variants=new Map(book.recipes.map(recipe=>[recipe.variantKey,recipe]));
    const memo=new Map();
    menu.ingredientRows += book.recipes.reduce((count,recipe)=>count+recipe.ingredients.length,0);
    function leaves(recipe, ancestors=new Set()) {
      if (!recipe || ancestors.has(recipe.variantKey)) return {keys:new Set(),issues:['Missing or cyclic subrecipe']};
      if (memo.has(recipe.variantKey)) return memo.get(recipe.variantKey);
      const next=new Set(ancestors).add(recipe.variantKey);
      const result={keys:new Set(),issues:recipe.ingredients.length?[]:['Recipe has no verified ingredient rows']};
      for (const ingredient of recipe.ingredients) {
        if (ingredient.kind==='subrecipe') {
          if (!ingredient.childVariantKeys?.length) {result.issues.push('Unresolved subrecipe');continue;}
          const alternatives=ingredient.childVariantKeys.map(key=>leaves(variants.get(key),next));
          const signature=value=>JSON.stringify([...value.keys].sort());
          if(alternatives.some(value=>value.issues.length)||new Set(alternatives.map(signature)).size!==1) {
            result.issues.push('Ambiguous or incomplete subrecipe presence');continue;
          }
          for(const key of alternatives[0].keys)result.keys.add(key);
        } else if (ingredient.kind==='ingredient') {
          const name=String(ingredient.name||'').trim();
          if (!name || !normalizeDescription(name)) {result.issues.push('Missing ingredient identity');continue;}
          if (isPantryExcluded(pantryName(name))) continue;
          const key=RECIPE_NAMESPACE+normalizeDescription(name);
          result.keys.add(key);ingredientLabels[key]??=name;
        } else result.issues.push('Unclassified ingredient reference');
      }
      if(!result.issues.length)memo.set(recipe.variantKey,result);
      return result;
    }
    for(const recipe of book.recipes.filter(recipe=>!recipe.isSubrecipe)){
      menu.recipeCount++;
      const result=leaves(recipe);
      menu.issues.push(...result.issues);
      for(const key of result.keys)menu.keys.add(key);
    }
  }
  for(const name of expectedMenus)if(!groups.has(name))groups.set(name,{name,keys:new Set(),issues:['No supplied packet'],versions:[],reportDates:[],recipeCount:0,ingredientRows:0});
  const menus=[...groups.values()].map(menu=>({
    name:menu.name,pillar:PILLARS.find(pillar=>pillar.menus.includes(menu.name))?.name||null,
    matchKeys:[...menu.keys].sort(),hasIngredientData:!menu.issues.length&&menu.keys.size>0,
    coverageStatus:menu.versions.length?(menu.issues.length?'Needs review':'Verified supplied packet'):'No supplied packet',
    issues:[...new Set(menu.issues)].sort(),versions:[...new Set(menu.versions)].sort(),
    reportDates:[...new Set(menu.reportDates)].sort(),
    reasonCodes:[...new Set(menu.issues.map(issue=>issue==='Source menu conflict'?'source-menu-conflict':issue==='Source validation pending'?'source-validation-pending':issue==='No supplied packet'?'packet-missing':'subrecipe-unresolved'))],
    recipeCount:menu.recipeCount,ingredientRows:menu.ingredientRows,
  })).sort((a,b)=>a.name.localeCompare(b.name));
  for(const menu of menus)menu.portfolio=portfolioCrossUseStats(menu,menus);
  return {schemaVersion:1,releaseVersion:'local-candidate',source:'recipe-ingredient-presence',scope:{account:'Amazon Region (FBE000)',reportDate:'Versioned packets',mealPeriod:'Packet scope',source:'Recipe ingredient names; exact normalized matches'},pillars:PILLARS,menus,ingredientLabels,pairs:buildPairwiseMatrix(menus)};
}

// Apply this at the server boundary even when storage already contains a safe projection.
// Recompute every statistic from allowlisted presence fields, never spread a database object.
export function projectRecipePresence(payload) {
  if(payload?.schemaVersion!==1||payload.source!=='recipe-ingredient-presence'||!Array.isArray(payload.menus)||payload.menus.length>200)throw Error('Invalid recipe presence release');
  if(typeof payload.releaseVersion!=='string'||!/^[A-Za-z0-9.-]{1,80}$/.test(payload.releaseVersion))throw Error('Invalid release version');
  const names=new Set();const labels={};
  const menus=payload.menus.map(menu=>{
    if(typeof menu.name!=='string'||!menu.name.trim()||menu.name.length>150||names.has(menu.name)||!Array.isArray(menu.matchKeys)||menu.matchKeys.length>10000)throw Error('Invalid menu presence');
    names.add(menu.name);
    const sourceKeys=[...new Set(menu.matchKeys)];
    for(const key of sourceKeys){
      const label=payload.ingredientLabels?.[key];
      if(typeof key!=='string'||!key.startsWith(RECIPE_NAMESPACE)||key.length>500||typeof label!=='string'||label.length>500)throw Error('Invalid ingredient presence');
      labels[key]=label;
    }
    const keys=sourceKeys.filter(key=>!isPantryExcluded(pantryName(labels[key])));
    if(typeof menu.hasIngredientData!=='boolean'||!['Needs review','Verified supplied packet','No supplied packet'].includes(menu.coverageStatus))throw Error('Invalid coverage');
    if(menu.hasIngredientData&&(menu.coverageStatus!=='Verified supplied packet'||!keys.length))throw Error('Invalid complete coverage');
    const reasonCodes=Array.isArray(menu.reasonCodes)?[...new Set(menu.reasonCodes)]:[];
    if(reasonCodes.some(code=>!Object.hasOwn(COVERAGE_REASONS,code))||(menu.hasIngredientData&&reasonCodes.length))throw Error('Invalid coverage reasons');
    const versions=Array.isArray(menu.versions)?[...new Set(menu.versions)]:[];
    if(versions.some(version=>typeof version!=='string'||!/^[A-Za-z0-9.-]{1,80}$/.test(version)))throw Error('Invalid source version');
    const reportDates=Array.isArray(menu.reportDates)?[...new Set(menu.reportDates)]:[];
    if(reportDates.some(date=>!/^\d{2}\/\d{2}\/\d{4}$/.test(date)))throw Error('Invalid report date');
    return {name:menu.name,pillar:PILLARS.find(p=>p.menus.includes(menu.name))?.name||null,matchKeys:keys.sort(),hasIngredientData:menu.hasIngredientData,coverageStatus:menu.coverageStatus,
      reasonCodes,coverageReasons:reasonCodes.map(code=>COVERAGE_REASONS[code]),versions,reportDates,
      recipeCount:Number.isSafeInteger(menu.recipeCount)&&menu.recipeCount>=0?menu.recipeCount:0,
      ingredientRows:Number.isSafeInteger(menu.ingredientRows)&&menu.ingredientRows>=0?menu.ingredientRows:0};
  });
  for(const menu of menus)menu.portfolio=portfolioCrossUseStats(menu,menus);
  return {schemaVersion:1,releaseVersion:payload.releaseVersion,source:'recipe-ingredient-presence',scope:{account:'Amazon Region (FBE000)',reportDate:'Versioned packets',mealPeriod:'Packet scope',source:'Recipe ingredient names; exact normalized matches'},pillars:PILLARS,menus,ingredientLabels:labels,pairs:buildPairwiseMatrix(menus)};
}
