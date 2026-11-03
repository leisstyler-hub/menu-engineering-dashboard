import XLSX from 'xlsx-js-style';
import {estimatePans} from './wpPanEstimate.js';
import {profileFor} from './wpSmartModel.js';
import {SELECTOR_PILLARS,selectorPillarMenus} from './wpSelectorPillars.js';

const join=values=>[...new Set(values.filter(Boolean))].join('; ');
export function buildFlaggedAuditRows(projections,{trusted=true}={}) {
 const rows=[];
 for(const projection of projections) for(const [group,foods] of [['Servable component',projection.items||[]],['Classification review',projection.review||[]],['Excluded from W&P',projection.excluded||[]]]) for(const food of foods) {
  const item={...food,menus:[projection.menu]},profile=profileFor(item);
  const estimate=estimatePans({panSize:'half',totalPans:1},item);
  const flags=[...(food.informationReasons||[]),food.classificationReason,...(food.serviceReasons||[])];
  const actions=[];
  const pillars=SELECTOR_PILLARS.filter(p=>p!=='Needs pillar assignment'&&selectorPillarMenus(p,[projection.menu]).length);
  if(!pillars.length){flags.push('Menu needs pillar assignment');actions.push('Confirm the menu pillar in the selector mapping.');}
  if(!food.mrn){flags.push('Missing exact MRN');actions.push('Supply the exact source MRN.');}
  if(!food.portion){flags.push('Missing serving size');actions.push('Supply the source serving size and unit.');}
  if(!Number.isFinite(food.cost)||food.cost<0){flags.push('Missing valid serving cost');actions.push('Confirm compatible serving cost and its source/date.');}
  if(!(food.massOz>0)){flags.push('Missing validated serving weight');actions.push('Supply finished weight for the same MRN and serving variant.');}
  if(food.foodCost>.4+1e-12){flags.push('Above 40% item food cost');actions.push('Review cost and pricing or balance as a premium item under current rules.');}
  if(food.weightApproximate){flags.push('Approximate source weight');actions.push('Validate approximate finished serving weight.');}
  if(profile.reviewStatus!=='Reviewed'){flags.push('Tags need review');actions.push('Review proposed Tags against item evidence.');}
  const unknown=field=>!profile[field]||(Array.isArray(profile[field])?!profile[field].length:!String(profile[field]).trim())||/unknown|needs review/i.test(String(profile[field]));
  const gaps=['placements','role','cuisines','flavors','textures','seasons'].filter(unknown);
  if(gaps.length){flags.push(`Tags incomplete: ${gaps.join(', ')}`);actions.push('Complete unresolved Tags centrally with evidence or explicit Unknown / Needs review.');}
  if(estimate.reason){flags.push(estimate.reason);actions.push('Resolve the exact MRN/menu/serving evidence or provide a validated food-specific pan yield.');}
  if(food.informationReasons?.length)actions.push('Resolve each source information flag for this serving variant.');
  if(food.classificationReason||food.serviceReasons?.length)actions.push('Review classification/service eligibility; exclusions are not missing-data errors.');
  if(!trusted){flags.push('Reference-only source');actions.push('Reload shared Supabase data before confirming compliance.');}
  if(!flags.filter(Boolean).length)continue;
  rows.push({MRN:String(food.mrn??''),Item:food.name||'',Menu:projection.menu,'Serving size':food.portion||'',Category:food.category||'',Pillar:join(pillars)||'Needs pillar assignment',
   'Item disposition':group,'Cost per serving':food.cost??'','Weight oz':food.massOz??'','Food cost fraction':food.foodCost??'',
   'Flags / information needed':join(flags),'Recommended remedy':join(actions),
   'Service review':join(food.serviceReasons||[]),'Classification review':food.classificationReason||'',
   'Pan estimate gap':estimate.reason||'','Tags status':profile.reviewStatus,
   Tags:join([...(profile.placements||[]),profile.role,...(profile.cuisines||[]),...(profile.flavors||[]),...(profile.textures||[]),...(profile.seasons||[])]),
   'Cost source':food.costBasis||'','Weight source':food.weightSource||food.massBasis||'',
   'Approximate weight':food.weightApproximate?'Yes':'No','Source linkage status':food.linkStatus||'',
   'Pan evidence SHA256':estimate.sourceSha256||'','Correction owner':'','Correction notes':'','Remediation status':'Open'});
 }
 return rows;
}

export function buildFlaggedAuditWorkbook(projections,options={}) {
 const rows=buildFlaggedAuditRows(projections,options),book=XLSX.utils.book_new();
 const sheet=XLSX.utils.json_to_sheet(rows.length?rows:[{MRN:'',Item:'No flagged items in loaded scope'}]);
 const headers=Object.keys(rows[0]||{MRN:'',Item:''});
 sheet['!cols']=headers.map(key=>({wch:/Flags|remedy/.test(key)?65:/source|Tags|gap|notes/i.test(key)?40:key==='Item'?48:key==='MRN'?24:26}));
 for(const [address,cell] of Object.entries(sheet))if(!address.startsWith('!'))cell.s={alignment:{wrapText:true,vertical:'top'},...(XLSX.utils.decode_cell(address).r===0?{font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'234D3B'}}}:{})};
 sheet['!rows']=[{hpt:30},...rows.map(()=>({hpt:110}))];
 sheet['!autofilter']={ref:sheet['!ref']};
 XLSX.utils.book_append_sheet(book,sheet,'Flagged Item Audit');
 XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet([
  {Field:'Exported at',Value:new Date().toISOString()},
  {Field:'Scope',Value:`All ${projections.length} loaded menus, including classification review and excluded foods; browse filters and session overrides do not hide flags. One row per source menu/variant.`},
  {Field:'Flagged rows',Value:rows.length},
  {Field:'Source',Value:options.source||'Unspecified'},
  {Field:'Source read',Value:options.loadedAt||'Unspecified'},
  {Field:'Source status',Value:options.trusted?'Shared Supabase evidence':'Reference only; refresh shared data before confirming compliance'},
  {Field:'Source warning',Value:options.sourceMessage||''},
  {Field:'Selling price per lb',Value:options.pricePerLb??'Unavailable'},
  {Field:'Use',Value:'Correction worksheet only. Financial/service flags are distinct from missing information. Premium foods retain current consideration. Editing this workbook does not update shared records.'},
  {Field:'Pan check',Value:'Tests one half pan using existing exact MRN/menu/portion estimator. Pan gaps do not change item qualification. Source-file estimates are not live pricing.'},
  {Field:'Limits',Value:'Available derived item information only; no recipe documents, methods or source links. Proposed Tags require central review. Supporting prep and intentional exclusions remain identified.'}
 ]),'Audit context');
 book.Sheets['Audit context']['!cols']=[{wch:24},{wch:120}];
 return book;
}
export function downloadFlaggedAudit(projections,options) {
 XLSX.writeFile(buildFlaggedAuditWorkbook(projections,options),'wp-flagged-item-audit.xlsx');
}
