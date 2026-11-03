import serviceEvidence from '../../data/wpServiceEvidence.json' with {type:'json'};
import {serviceProfile} from './wpServiceProfile.js';
import {PILLARS as SHARED_PILLARS,conceptMenusForPillar,pillarForConcept,canonicalConceptName} from '../../shared/conceptPillars.js';
import evidence from '../../data/wpProfileEvidence.json' with {type:'json'};
import {projectStation} from './wpStationModel.js';
export {entryPounds} from './wpPanModel.js';
export const PILLARS=SHARED_PILLARS.map(p=>p.name);
export const pillarMenus=conceptMenusForPillar;
const menuName=canonicalConceptName;
const byMrn=new Map();
for(const row of evidence.records){if(!byMrn.has(row.mrn))byMrn.set(row.mrn,[]);byMrn.get(row.mrn).push(row);}
const serviceByMrn=new Map();
for(const row of serviceEvidence.records){if(!serviceByMrn.has(row.mrn))serviceByMrn.set(row.mrn,[]);serviceByMrn.get(row.mrn).push(row);}
export function profileFor(food) {
 const linked=(serviceByMrn.get(String(food.mrn||''))||[]).filter(r=>(food.menus||[]).some(m=>menuName(m)===menuName(r.menu))&&String(r.portion).trim().toLowerCase()===String(food.portion||'').trim().toLowerCase());
 const service=serviceProfile(food,linked);
 if(food.culinaryProfile?.reviewStatus==='Reviewed'){const reviewed={...service,flavors:[],textures:[],seasons:[],cuisines:[],role:food.category,premium:false,...food.culinaryProfile,evidenceCount:linked.length};if(service.temperatureControl==='Required'&&reviewed.placements?.includes('Ambient'))return {...reviewed,placements:reviewed.placements.filter(p=>p!=='Ambient'),reviewStatus:'Needs review',conflicts:[...service.conflicts,'Reviewed Ambient conflicts with temperature-control evidence.']};if(linked.some(r=>r.placements?.length)&&service.placements.length===1&&(!reviewed.placements?.includes(service.placements[0])||reviewed.placements.length!==1))return {...reviewed,placements:[],reviewStatus:'Needs review',conflicts:[...service.conflicts,'Reviewed placement conflicts with recipe service evidence.']};return reviewed;}
 const candidates=(byMrn.get(String(food.mrn||''))||[]).filter(r=>(food.menus||[]).some(m=>menuName(m)===menuName(r.menu))&&String(r.portion).trim().toLowerCase()===String(food.portion||'').trim().toLowerCase());
 const name=String(food.name||'').toLowerCase();
 const placements=service.placements;
 const flavors=[];const textures=[];
 for(const [label,re] of [['Bright',/lemon|lime|citrus|pickle|vinegar/],['Savory',/miso|mushroom|beef|chicken|soy|bulgogi/],['Spicy',/chili|chile|spicy|harissa|sriracha/],['Rich',/cream|cheese|butter|coconut/],['Herbal',/herb|parsley|cilantro|basil/]])if(re.test(name))flavors.push(label);
 for(const [label,re] of [['Crunchy',/crunch|crispy|crouton|toasted|slaw/],['Creamy',/cream|hummus|mashed|puree/],['Fresh',/cucumber|salad|slaw/]])if(re.test(name))textures.push(label);
 const seasons=[];
 if(/squash|pumpkin|apple|brussels|root vegetable/.test(name))seasons.push('Fall','Winter');
 if(/asparagus|peas|spring/.test(name))seasons.push('Spring');
 if(/tomato|corn|watermelon|summer/.test(name))seasons.push('Summer');
 const cuisines=[...new Set((food.menus||[]).flatMap(m=>(pillarForConcept(m)?[pillarForConcept(m).name]:[])))];
 return {...service,reviewStatus:service.conflicts.length?'Needs review':'Proposed',placements:[...new Set(placements)],flavors,textures,seasons,cuisines,role:service.role,
 premium:service.premium,
 evidenceCount:candidates.length,sourceSha256:candidates.length?evidence.sourceSha256:null,
 basis:'Recipe-linked service phrases and ingredient flags where matched; remaining Tags are name-based proposals. Review required; not service approval.'};
}
const eligible=f=>!f.conflict&&(!(f.serviceReasons||[]).length||(f.planningOnly&&(f.serviceReasons||[]).every(r=>r==='Individual service; outside W&P price qualification')));
export function capacityIssues(entries,capacity) {
 const counts={Hot:0,Cold:0,Ambient:0},issues=[];
 for(const e of entries){
  if(!Object.hasOwn(counts,e.placement)){issues.push('Service Tag needs review to check equipment fit.');continue;}
  let footprint=1,count=1;
  if(e.totalPans!==undefined){
   count=1;footprint=e.placement==='Ambient'?1:e.panSize==='half'?.5:e.panSize==='bullet'?1/6:1;
  }else if(e.quantityMode==='pan'){
   count=Number(e.openingPans);
   if(!Number.isInteger(count)||count<0){issues.push('Enter whole opening pan counts to check equipment fit.');continue;}
   if(e.placement!=='Ambient'){
    footprint=e.panSize==='half'?.5:e.panSize==='full'?1:e.totalPans!==undefined&&e.panSize==='bullet'?1/6:Number(e.footprint);
    if(!Number.isFinite(footprint)||footprint<=0){issues.push('Confirm the bullet pan footprint in full-pan spaces.');continue;}
   }
  }
  counts[e.placement]+=count*footprint;
 }
 for(const [placement,count] of Object.entries(counts))if(count>Number(capacity[placement.toLowerCase()]))issues.push(`${placement} display selection exceeds available capacity (${count} / ${capacity[placement.toLowerCase()]}).`);
 return [...new Set(issues)];
}
export function displayFootprint(entry) {
 if(entry.quantityMode==='portions'||entry.quantityMode==='cups')return 0;
 if(entry.totalPans!==undefined)return entry.placement==='Ambient'?1:entry.panSize==='half'?.5:entry.panSize==='bullet'?1/6:1;
 return entry.quantityMode==='pan'?Number(entry.openingPans)*(entry.panSize==='half'?.5:entry.panSize==='full'?1:Number(entry.footprint)):1;
}
export function spreadProgress(entries,foods,capacity) {
 const used={Hot:0,Cold:0,Ambient:0,individual:0},issues=[],quantityIssues=[];
 for(const e of entries){
  const f=foods.find(f=>f.key===e.key),p=profileFor(f||{});
  if(!f)issues.push(`${e.name||e.key}: source record is unavailable.`);
  if(p.conflicts?.length)issues.push(...p.conflicts);
  if(['portions','cups'].includes(e.quantityMode)){const q=Number(e.quantityMode==='cups'?e.expectedCups:e.expectedPortions);if(!Number.isFinite(q)||q<=0||(e.quantityMode==='portions'&&!Number.isInteger(q)))quantityIssues.push(`${e.name||e.key}: enter the expected quantity.`);}
  else if(e.totalPans!==undefined&&(!Number.isInteger(Number(e.totalPans))||Number(e.totalPans)<=0))quantityIssues.push(`${e.name||e.key}: enter positive whole total pans.`);
  if(e.quantityMode==='portions'||e.quantityMode==='cups'){used.individual++;if(p.placements.length!==1||p.conflicts?.length)issues.push(`${e.name||e.key}: individual service placement needs review.`);continue;}
  const placement=p.placements.length===1?p.placements[0]:'';
  if(!placement){issues.push(`${e.name||e.key}: service placement needs review.`);continue;}
  const footprint=displayFootprint({...e,placement});
  if(!Number.isFinite(footprint)||footprint<=0){issues.push(`${e.name||e.key}: display footprint needs review.`);continue;}
  used[placement]+=footprint;
 }
 const targets={Hot:Number(capacity.hot),Cold:Number(capacity.cold),Ambient:Number(capacity.ambient),individual:Number(capacity.individual||0)};
 for(const k of Object.keys(used))if(used[k]>targets[k]+1e-8)issues.push(`${k} display selection exceeds available capacity (${used[k]} / ${targets[k]}).`);
 const complete=entries.length>0&&!issues.length&&!quantityIssues.length&&Object.keys(used).every(k=>Math.abs(used[k]-targets[k])<1e-8);
 return {used,targets,issues,quantityIssues,complete};
}
export function suggestSpread(foods,entries,capacity) {
 if(!['hot','cold','ambient'].every(k=>String(capacity[k]??'').trim()!==''&&Number.isInteger(Number(capacity[k]))&&Number(capacity[k])>=0&&Number(capacity[k])<=40)||!Number.isInteger(Number(capacity.individual||0))||Number(capacity.individual||0)<0||Number(capacity.individual||0)>40)return {entries:entries.map(e=>({...e})),messages:['Enter whole capacities from 0 to 40.']};
 const chosen=entries.map(e=>({...e})),messages=[],progress=spreadProgress(chosen,capacity.catalog||foods,capacity);
 if(progress.issues.length)return {entries:chosen,messages:progress.issues};
 const remaining=Object.fromEntries(Object.keys(progress.used).map(k=>[k,progress.targets[k]-progress.used[k]]));
 for(const placement of ['Hot','Cold','Ambient','individual']){
  while(remaining[placement]>1e-8){
   const candidates=foods.filter(eligible).filter(f=>{
    const p=profileFor(f);
    return p.foodType!=='Dessert'&&!(p.role==='Sauces / dressings'&&chosen.some(e=>profileFor((capacity.catalog||foods).find(c=>c.key===e.key)||{}).role==='Sauces / dressings'))&&!(p.premium&&chosen.some(e=>profileFor((capacity.catalog||foods).find(c=>c.key===e.key)||{}).premium))&&!chosen.some(e=>e.key===f.key)&&!p.conflicts?.length&&(placement==='individual'?p.serviceFormat==='Individual'&&p.placements.length===1:p.placements.length===1&&p.placements[0]===placement&&p.serviceFormat!=='Individual');
   });
   const profiles=chosen.map(e=>profileFor((capacity.catalog||foods).find(f=>f.key===e.key)||{}));
   const premiumCount=profiles.filter(p=>p.premium).length;
   const score=f=>{
    const p=profileFor(f),roleCount=profiles.filter(c=>c.role===p.role).length;
    let goal=p.role==='Proteins'?(roleCount===0?90:roleCount===1?80:0):p.role==='Vegetables'&&!roleCount?75:p.role==='Starches / grains'&&!roleCount?65:p.role==='Sauces / dressings'&&!roleCount?10:0;
    if(p.foodType==='Noodle'&&!profiles.some(c=>c.foodType==='Noodle'))goal+=85;
    if(p.foodType==='Salad'&&!profiles.some(c=>c.foodType==='Salad'))goal+=90;
    return goal+(!profiles.some(c=>c.foodType===p.foodType)?10:0)+(!roleCount?10:0)+(p.proteinFamily!=='Unknown'&&!profiles.some(c=>c.proteinFamily===p.proteinFamily)?10:0)+(p.premium&&!premiumCount?100:0)+Math.min(9,p.textures.filter(t=>!profiles.some(c=>c.textures.includes(t))).length*3)+Math.min(5,p.ingredientKeys.filter(k=>profiles.some(c=>c.ingredientKeys?.includes(k))).length)-(Number.isFinite(f.foodCost)?Math.min(10,f.foodCost*10):12);
   };
   candidates.sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name));
   const f=candidates[0];if(!f)break;
   const p=profileFor(f),size=remaining[placement]>=1?'full':remaining[placement]>=.5?'half':remaining[placement]>=1/6-1e-8?'bullet':null;
   if(placement!=='individual'&&!size)break;
   chosen.push({key:f.key,name:f.name,mrn:f.mrn,menus:f.menus,pounds:'',quantityMode:placement==='individual'?'portions':'pan',panSize:size||'half',...(placement==='individual'?{expectedPortions:''}:{totalPans:'1'}),placement:placement==='individual'?p.placements[0]:placement,guidance:`Adds ${p.foodType.toLowerCase()}${p.premium?' / Premium highlight':''}${p.ingredientKeys.some(k=>profiles.some(c=>c.ingredientKeys?.includes(k)))?' / Shares source ingredients':''}`});
   remaining[placement]-=placement==='individual'||placement==='Ambient'?1:size==='half'?.5:size==='bullet'?1/6:1;
  }
  if(remaining[placement]>1e-8)messages.push(`${placement}: ${Number(remaining[placement].toFixed(2))} spaces remain; selected menus have no compatible additional items.`);
 }
 messages.push('Existing selections are preserved. Tags remain proposals unless reviewed; shortages are left open.');
 return {entries:chosen,messages};
}
export function applySwap(entries,fromKey,to) {
 return entries.map(e=>e.key===fromKey&&!e.locked?{...e,key:to.key,name:to.name,mrn:to.mrn,menus:to.menus,fillLb:'',useReference:false,placement:profileFor(to).placements.length===1?profileFor(to).placements[0]:'',placementConfirmed:false}:e);
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
