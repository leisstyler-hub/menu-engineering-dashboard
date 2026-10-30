import pillars from '../../data/menuCrossUtilization.json' with {type:'json'};
import evidence from '../../data/wpProfileEvidence.json' with {type:'json'};
import {projectStation} from './wpStationModel.js';
export {entryPounds} from './wpPanModel.js';
export const PILLARS=pillars.pillars.map(p=>p.name);
const menuName = value=>String(value||'').replace(/^AMZ:\s*/i,'').trim().toLowerCase();
export function pillarMenus(pillar,names) {
 const allowed=new Set((pillars.pillars.find(p=>p.name===pillar)?.menus||[]).map(menuName));
 return names.filter(name=>allowed.has(menuName(name)));
}
const byMrn=new Map();
for(const row of evidence.records){if(!byMrn.has(row.mrn))byMrn.set(row.mrn,[]);byMrn.get(row.mrn).push(row);}
export function profileFor(food) {
 const candidates=(byMrn.get(String(food.mrn||''))||[]).filter(r=>(food.menus||[]).some(m=>menuName(m)===menuName(r.menu))&&String(r.portion).trim().toLowerCase()===String(food.portion||'').trim().toLowerCase());
 const name=String(food.name||'').toLowerCase();
 const placements=[];
 if(/\b(roasted|steamed|braised|grilled|bulgogi|sauteed|sautéed|poriyal|mashed|baked|curry|rice)\b/.test(name))placements.push('Hot');
 if(/\b(salad|slaw|cucumbers?|tabbouleh|hummus|vinaigrette)\b/.test(name))placements.push('Cold');
 if(/\b(crunch|crispy chickpeas|croutons?|toasted seeds|granola)\b/.test(name))placements.push('Ambient');
 const flavors=[];const textures=[];
 for(const [label,re] of [['Bright',/lemon|lime|citrus|pickle|vinegar/],['Savory',/miso|mushroom|beef|chicken|soy|bulgogi/],['Spicy',/chili|chile|spicy|harissa|sriracha/],['Rich',/cream|cheese|butter|coconut/],['Herbal',/herb|parsley|cilantro|basil/]])if(re.test(name))flavors.push(label);
 for(const [label,re] of [['Crunchy',/crunch|crispy|crouton|toasted|slaw/],['Creamy',/cream|hummus|mashed|puree/],['Fresh',/cucumber|salad|slaw/]])if(re.test(name))textures.push(label);
 const seasons=[];
 if(/squash|pumpkin|apple|brussels|root vegetable/.test(name))seasons.push('Fall','Winter');
 if(/asparagus|peas|spring/.test(name))seasons.push('Spring');
 if(/tomato|corn|watermelon|summer/.test(name))seasons.push('Summer');
 const cuisines=[...new Set((food.menus||[]).flatMap(m=>pillars.pillars.filter(p=>p.menus.some(n=>menuName(n)===menuName(m))).map(p=>p.name)))];
 return {reviewStatus:'Proposed',placements:[...new Set(placements)],flavors,textures,seasons,cuisines,role:food.category,
 premium:/\b(beef|steak|salmon|seafood|shrimp|tuna|fish)\b/.test(name)&&!/plant.based|vegan/.test(name),
 evidenceCount:candidates.length,sourceSha256:candidates.length?evidence.sourceSha256:null,
 basis:'Name-based culinary proposal; cuisine uses mapped menu pillar. Chef confirmation required.'};
}
const eligible=f=>!f.conflict&&!(f.serviceReasons||[]).length;
export function capacityIssues(entries,capacity) {
 const counts={Hot:0,Cold:0,Ambient:0},issues=[];
 for(const e of entries){
  if(!Object.hasOwn(counts,e.placement)){issues.push('Choose service placement for every food to check equipment fit.');continue;}
  let footprint=1,count=1;
  if(e.quantityMode==='pan'){
   count=Number(e.openingPans);
   if(!Number.isInteger(count)||count<0){issues.push('Enter whole opening pan counts to check equipment fit.');continue;}
   if(e.placement!=='Ambient'){
    footprint=e.panSize==='half'?.5:e.panSize==='full'?1:Number(e.footprint);
    if(!Number.isFinite(footprint)||footprint<=0){issues.push('Confirm the bullet pan footprint in full-pan spaces.');continue;}
   }
  }
  counts[e.placement]+=count*footprint;
 }
 for(const [placement,count] of Object.entries(counts))if(count>Number(capacity[placement.toLowerCase()]))issues.push(`${placement} opening display exceeds available capacity (${count} / ${capacity[placement.toLowerCase()]}).`);
 return [...new Set(issues)];
}
export function suggestSpread(foods,entries,capacity) {
 if(!['hot','cold','ambient'].every(k=>String(capacity[k]??'').trim()!==''&&Number.isInteger(Number(capacity[k]))&&Number(capacity[k])>=0&&Number(capacity[k])<=40))return {entries:[],messages:['Enter whole capacities from 0 to 40.']};
 const remaining=Object.fromEntries(['Hot','Cold','Ambient'].map(p=>[p,Number(capacity[p.toLowerCase()])]));
 const chosen=entries.filter(e=>e.locked).map(e=>({...e})), messages=[];
 const available=foods.filter(eligible), counts=new Map();
 for(const e of chosen){const f=foods.find(f=>f.key===e.key);if(f)counts.set(f.category,(counts.get(f.category)||0)+1);}
 const locatedLocks=chosen.map(e=>({...e,placement:e.placement||profileFor(foods.find(f=>f.key===e.key)||{}).placements[0]}));
 const lockIssues=capacityIssues(locatedLocks,capacity);
 if(lockIssues.length)return {entries:chosen,messages:lockIssues};
 for(const e of locatedLocks){const count=e.quantityMode==='pan'?Number(e.openingPans):1;const footprint=e.placement==='Ambient'||e.quantityMode!=='pan'?1:e.panSize==='half'?.5:e.panSize==='full'?1:Number(e.footprint);remaining[e.placement]-=count*footprint;}
 const slots=Object.entries(remaining).flatMap(([p,n])=>Array.from({length:Math.max(0,Math.floor(n))},()=>p));
 const totalSlots=slots.length+chosen.length;
 for(const placement of slots){
  const candidates=available.filter(f=>!chosen.some(e=>e.key===f.key)&&profileFor(f).placements.includes(placement));
  const chosenProfiles=chosen.map(e=>profileFor(foods.find(f=>f.key===e.key)||{}));
  const score=f=>{const p=profileFor(f);return (counts.has(f.category)?-5*(counts.get(f.category)||0):40)+(p.premium&&!chosenProfiles.some(p=>p.premium)?12:0)+(p.seasons.includes(capacity.season)?6:0)+p.flavors.filter(t=>!chosenProfiles.some(p=>p.flavors.includes(t))).length*3+p.textures.filter(t=>!chosenProfiles.some(p=>p.textures.includes(t))).length*4-(p.flavors.includes('Rich')&&chosenProfiles.some(p=>p.flavors.includes('Rich'))?5:0)-(Number.isFinite(f.foodCost)?Math.min(20,f.foodCost*10):22);};
  candidates.sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name));const f=candidates[0];
  if(!f)continue;
  const p=profileFor(f),guidance=[!counts.has(f.category)?`Adds ${f.category.toLowerCase()}`:'Extends this culinary role',p.premium?'Premium highlight':null,p.seasons.includes(capacity.season)?'Seasonal fit':null,...p.textures.filter(t=>!chosenProfiles.some(p=>p.textures.includes(t))).map(t=>`Adds ${t.toLowerCase()} texture`)].filter(Boolean).join(' · ');
  chosen.push({key:f.key,name:f.name,mrn:f.mrn,menus:f.menus,pounds:'',quantityMode:'pan',panSize:'full',openingPans:'1',reservePans:'0',fillLb:'',placement,placementConfirmed:false,guidance});counts.set(f.category,(counts.get(f.category)||0)+1);
 }
 if(chosen.length<totalSlots)messages.push('The selected food pool cannot fill all requested spaces with known placement proposals.');
 if(entries.filter(e=>e.locked).length>totalSlots)messages.push('Locked foods exceed available space.');
 messages.push('Culinary proposals require chef confirmation. Enter quantities to evaluate the 40% overall target; demand is not predicted.');
 return {entries:chosen,messages};
}
export function applySwap(entries,fromKey,to) {
 return entries.map(e=>e.key===fromKey&&!e.locked?{...e,key:to.key,name:to.name,mrn:to.mrn,menus:to.menus,fillLb:'',placementConfirmed:false}:e);
}
export function suggestSwaps(entries,foods,options) {
 const catalog=options.catalog||foods;
 const selected=new Set(entries.map(e=>e.key)),results=[];
 for(const entry of entries.filter(e=>!e.locked)){
  const from=catalog.find(f=>f.key===entry.key);if(!from)continue;
  const fp=profileFor(from),placement=entry.placement||fp.placements[0];
  const candidates=foods.filter(f=>!selected.has(f.key)&&eligible(f)&&f.category===from.category&&placement&&profileFor(f).placements.includes(placement));
  for(const to of candidates){
   const tp=profileFor(to),reasons=[];
   const other=entries.filter(e=>e.key!==entry.key).map(e=>profileFor(catalog.find(f=>f.key===e.key)||{}));
   if(tp.textures.some(t=>!other.some(p=>p.textures.includes(t))&&!fp.textures.includes(t)))reasons.push('Adds a contrasting texture');
   if(tp.flavors.some(t=>!other.some(p=>p.flavors.includes(t))&&!fp.flavors.includes(t)))reasons.push('Adds a different flavor');
   if(tp.seasons.includes(options.season)&&!fp.seasons.includes(options.season))reasons.push('Fits the selected season');
   if(options.trusted&&Number.isFinite(to.costPerLb)&&Number.isFinite(from.costPerLb)&&to.costPerLb<from.costPerLb)reasons.push('Lower source cost per pound');
   if(fp.premium&&!tp.premium&&entries.filter(e=>profileFor(catalog.find(f=>f.key===e.key)||{}).premium).length===1)continue;
   if(!reasons.length)continue;
   const before=projectStation(entries,catalog,options.rate,options.sellThrough,options.trusted);
   const after=projectStation(applySwap(entries,entry.key,to),catalog,options.rate,options.sellThrough,options.trusted);
   results.push({from,to,reasons,placement,before,after,score:reasons.length});
  }
 }
 return results.sort((a,b)=>b.score-a.score||a.to.name.localeCompare(b.to.name)).slice(0,5);
}
