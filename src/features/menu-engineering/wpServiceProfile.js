export function serviceProfile(food, evidence=[]) {
 const name=String(food.name||'').toLowerCase();
 const main=name.split(/\s+(?:with|w\/)\s+/)[0];
 const plant=/plant.based|vegan|tofu|tempeh|(?:cauliflower|celeriac|mushroom|portobello).*steak/.test(main);
 const protein=plant?'Plant':/chicken|turkey/.test(main)?'Poultry':/beef|steak/.test(main)?'Beef':/salmon|shrimp|fish|seafood|tuna|halibut|\bcod\b|trout|tilapia|pollock|haddock|mahi/.test(main)?'Seafood':/pork|\bham\b|bacon/.test(main)?'Pork':'Unknown';
 const primaryProtein=['Poultry','Beef','Seafood','Pork'].includes(protein)&&!/sauce|dressing|broth|stock|soup/.test(main);
 const role=primaryProtein&&!/rice|noodle|pasta|salad|slaw|sandwich|wrap|club|croissant/.test(main)?'Proteins':food.category||'Unknown';
 const type=/mango sticky rice|pudding|custard|\b(cake|cookies?|brownie|dessert)\b/.test(main)?'Dessert':/\bsalad\b|\bslaw\b|tabbouleh/.test(main)?'Salad':/sandwich|\bwrap\b|burrito|panini|croissant|bagel sandwich|\bclub\b|\breuben\b|\bcubano\b|\btorta\b|\bblt\b/.test(main)?'Sandwich / wrap':/\brice\b/.test(main)?'Rice':/broth|\bsoup\b/.test(main)?'Broth / soup':/noodle|pasta|yakisoba/.test(main)?'Noodle':role;
 const temperatureControlled=['Poultry','Beef','Seafood','Pork'].includes(protein)||evidence.some(r=>r.temperatureControlled)||/roasted|steamed|braised|grilled|seared|sauteed|saut\u00e9ed|cooked|tofu|lentils?|beans?|chicken|turkey|beef|pork|fish|salmon|shrimp|cream|cheese|yogurt|egg|\brice\b|noodle|pasta|salad|slaw|hummus|broth|soup/.test(name);
 const explicit=[...new Set(evidence.flatMap(r=>r.placements||[]))];
 let placements=[];
 if(explicit.length===1)placements=explicit;
 else if(!explicit.length){
  if(type==='Salad')placements=/\b(warm|hot)\b.*\bsalad\b/.test(main)?[]:['Cold'];
  else if(/\b(cold|chilled|cucumbers?|hummus|vinaigrette|yogurt|raita|tzatziki)\b/.test(main))placements=['Cold'];
  else if(/butter chicken|\b(roasted|steamed|braised|grilled|seared|bulgogi|sauteed|saut\u00e9ed|poriyal|mashed|baked|curry|rice|broth|soup|noodles|pasta)\b/.test(main))placements=['Hot'];
  else if(/^(?:plain )?dinner rolls?$|^croutons?$|^toasted seeds$|^granola$/.test(main)&&!temperatureControlled)placements=['Ambient'];
 }
 const conflicts=[];
 if(temperatureControlled&&placements.includes('Ambient')){placements=placements.filter(p=>p!=='Ambient');conflicts.push('Temperature-controlled food cannot use Ambient planning placement.');}
 if(explicit.length>1)conflicts.push('Recipe service-temperature evidence conflicts; review required.');
 return {placements,role,premium:['Beef','Seafood'].includes(protein),temperatureControl:temperatureControlled?'Required':'Needs review',foodType:type,proteinFamily:protein,
  serviceFormat:['Salad','Sandwich / wrap','Broth / soup'].includes(type)?'Individual':'Pan',
  comparableSaucedDish:/butter chicken|\bcurry\b|\btikka masala\b/.test(main),conflicts,
  ingredientKeys:[...new Set(evidence.flatMap(r=>r.ingredientKeys||[]))],sourceHashes:[...new Set(evidence.map(r=>r.sourceSha256).filter(Boolean))]};
}
