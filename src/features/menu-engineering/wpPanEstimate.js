import evidence from '../../data/wpPanEvidence.json' with {type:'json'};

// Reference four-inch pans; 80% usable fill is a planning assumption, not a measurement.
export const PAN_REFERENCE={full:{quarts:14.2,footprint:1,label:'Full'},half:{quarts:6.7,footprint:.5,label:'Half'},bullet:{quarts:1.8,footprint:1/6,label:'Bullet (sixth-size estimate)'}};
export const PAN_FILL=.8;
const normalized=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');
const menu=v=>normalized(v).replace(/^amz:\s*/,'');
const positive=v=>String(v??'').trim()!==''&&Number.isFinite(Number(v))&&Number(v)>0;
export function portionCups(value){
 const match=normalized(value).match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(cups?|tbsp|tablespoons?|tsp|teaspoons?|fl\.?\s*oz|fluid ounces?|ml|liters?|litres?)$/);
 if(!match)return null;
 const amount=match[1].split(/\s+/).reduce((sum,n)=>sum+(n.includes('/')?Number(n.split('/')[0])/Number(n.split('/')[1]):Number(n)),0);
 const unit=match[2];
 const factor=/^cup/.test(unit)?1:/^(tbsp|tablespoon)/.test(unit)?1/16:/^(tsp|teaspoon)/.test(unit)?1/48:/^(fl|fluid)/.test(unit)?1/8:unit==='ml'?1/236.5882365:1000/236.5882365;
 return Number.isFinite(amount)&&amount>0?amount*factor:null;
}
export function estimatePans(entry,food,records=evidence.records){
 const missing=reason=>({pounds:null,cost:null,servings:null,reason,approximate:true,sourceSha256:evidence.sourceSha256});
 const pan=PAN_REFERENCE[entry.panSize];
 if(!pan||!positive(entry.totalPans)||!Number.isInteger(Number(entry.totalPans)))return missing('Choose a pan size and positive whole total pan count.');
 if(food?.conflict)return missing('Conflicting catalog variants need review.');
 if(!food?.mrn)return missing('Exact MRN is required for the Menu Item Index estimate.');
 let candidates=records.filter(r=>r.mrn===String(food.mrn)&&(food.menus||[]).some(m=>menu(m)===menu(r.menu))&&normalized(r.portion)===normalized(food.portion));
 const catalogVolume=!candidates.length&&portionCups(food.portion);
 if(catalogVolume)candidates=[{mrn:String(food.mrn),portion:food.portion,massOz:food.massOz,cost:food.cost}];
 if(!candidates.length)return missing('No exact Menu Item Index MRN, menu and serving-size match.');
 const signatures=new Set(candidates.map(r=>JSON.stringify([normalized(r.portion),r.massOz===''?null:Number(r.massOz),r.cost===''?null:Number(r.cost)])));
 if(signatures.size!==1)return missing('Conflicting Menu Item Index portions, weights or costs need review.');
 const source=candidates[0],cups=portionCups(source.portion);
 if(!cups)return missing('Source portion has no explicit volume; food-specific pan yield is needed.');
 const servings=pan.quarts*4*PAN_FILL/cups*Number(entry.totalPans);
 const pounds=positive(source.massOz)?servings*Number(source.massOz)/16:null;
 const cost=String(source.cost??'').trim()!==''&&Number.isFinite(Number(source.cost))&&Number(source.cost)>=0?servings*Number(source.cost):null;
 if(!Number.isFinite(servings)||pounds!==null&&!Number.isFinite(pounds)||cost!==null&&!Number.isFinite(cost))return missing('Pan quantity exceeds the supported estimate range.');
 return {servings,pounds,cost,approximate:true,sourceSha256:catalogVolume?null:evidence.sourceSha256,reason:pounds===null?'Volume supports serving estimates; source portion weight needs review.':cost===null?'Source portion cost needs review.':'',basis:catalogVolume?'Current catalog explicit serving volume; reference pan at 80% fill. Missing mass remains unknown.':'Menu Item Index portion volume, weight and cost; reference pan at 80% fill. Source-file estimate, not live pricing.'};
}
