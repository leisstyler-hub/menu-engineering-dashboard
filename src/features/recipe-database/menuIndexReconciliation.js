import { parseImportedMenuWorksRow } from './menuWorksImport.js';
const clean=v=>String(v??'').replace(/^'/,'').trim();
const norm=v=>clean(v).toLowerCase().replace(/\s+/g,' ');
const identity=r=>JSON.stringify([r.menu,r.mrn,r.portion,r.station,r.menuItemNotes,r.price]);
export function reconcileMenuIndex(rawRows,currentRows) {
 const rows=[],unplaced=[],mrnChanges=[],weightChanges=[],seen=new Map(),matched=new Set();
 const canonicalMenus=new Map(currentRows.map(r=>[norm(r.menu),r.menu]));
 const explicit=new Set(rawRows.filter(r=>r['Menu Name']!=='Combined').map(r=>JSON.stringify([norm(r['Menu Name']),clean(r['Recipe Number']),norm(r['Menu Portion Size'])])));
 const valid=rawRows.filter(r=>clean(r['Recipe Number'])&&clean(r['Recipe Name']));
 for(const raw of valid){
  const mrn=clean(raw['Recipe Number']),name=norm(raw['Recipe Name']),combined=raw['Menu Name']==='Combined';
  const matches=combined?currentRows.filter(r=>r.mrn===mrn):[];
  if(combined&&!matches.length){unplaced.push({mrn,name:raw['Recipe Name'],portion:raw['Menu Portion Size']});continue;}
  const placements=combined?[...new Map(matches.map(r=>[r.menu,r])).values()]:[null];
  for(const placement of placements){
   const menu=placement?.menu||canonicalMenus.get(norm(raw['Menu Name']))||raw['Menu Name'];
   if(combined&&explicit.has(JSON.stringify([norm(menu),mrn,norm(raw['Menu Portion Size'])])))continue;
   const exact=currentRows.filter(r=>r.menu===menu&&r.mrn===mrn&&!matched.has(r));
   const named=currentRows.filter(r=>r.menu===menu&&!matched.has(r)&&[r.recipeName,r.item,r.displayName].some(n=>norm(n)===name||norm(n)===norm(raw['Short Name'])));
   const station=combined?placement.station:raw.Station;
   const prior=exact.find(r=>norm(r.portion)===norm(raw['Menu Portion Size'])&&norm(r.station)===norm(station)&&norm(r.menuItemNotes)===norm(raw['Menu Item Notes'])&&r.price===Number(String(raw['Sell Price']||'').replace('$','')))||(exact.length===1?exact[0]:null)||(named.length===1?named[0]:null);
   const expanded={...raw,'Menu Name':menu};
   if(combined){expanded.Station=prior?.station||placement.station||'';for(const [column,field] of [['Menu Item Cost','itemCost'],['Waste %','wastePct'],['Sell Price','price']])if(clean(raw[column])==='Combined')expanded[column]=prior&&norm(prior.portion)===norm(raw['Menu Portion Size'])?(column==='Waste %'?Number(prior[field]||0)*100:prior[field]??''):'';}
   const parsed=parseImportedMenuWorksRow(expanded,rows.length);if(!parsed)throw Error('Unsupported menu '+menu);
   const row={...prior,...parsed,id:prior?.id??`menuworks-2026-10-22-${rows.length}`,sourceFileName:'MenuWorks_Menu_Item_4e579e3a-31ab-4dfc-974c-88a8cbf77181.csv',dataSource:'menuworks-index-2026-10-22'};
   if(combined&&prior&&norm(prior.portion)===norm(row.portion)&&clean(raw['Menu Item Cost'])==='Combined')row.trueCost=prior.trueCost;
   if(prior?.enticingDescription){row.enticingDescription=prior.enticingDescription;row.primaryDescriptionSource='source-truth-preserved';}
   if(prior?.item_key&&prior.mrn===mrn)row.item_key=prior.item_key;
   if(prior&&prior.mrn!==mrn){row.id=`menuworks-2026-10-22-${rows.length}`;delete row.item_key;row.recipeDocuments=[];}
   row.portionGrams=Number(raw['Menu Portion Weight(g)'])||null;
   row.sourceDataVersion='menuworks-menu-index-2026-10-22';
   const key=identity(row),other=seen.get(key);
   if(other){if(other.portionOz!==row.portionOz||other.trueCost!==row.trueCost)throw Error('Conflicting source variants '+key);continue;}
   seen.set(key,row);rows.push(row);
   if(prior){matched.add(prior);if(prior.mrn!==mrn)mrnChanges.push({menu,item:row.item,before:prior.mrn,after:mrn});if(prior.portionOz!==row.portionOz)weightChanges.push({menu,item:row.item,mrn,before:prior.portionOz,after:row.portionOz});}
  }
 }
 return {rows,unplaced,mrnChanges,weightChanges,removed:currentRows.filter(r=>!matched.has(r)),menus:[...new Set([...currentRows.map(r=>r.menu),...rows.map(r=>r.menu)])]};
}
