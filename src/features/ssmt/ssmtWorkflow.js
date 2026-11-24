import {isMenuItem} from './ssmtReuse.js';
import {FREE_MODIFIER_PRICE_ID} from './ssmtModifierDefaults.js';

// Preserve classifications; never invent facts for a blank or legacy FIXY.
const parts = value => /^([RCMV] [A-Z]{3})\s*\|\s*([^|]+)\s*\|\s*(.+?)\s+(ENT|SNK)(?:\s+([A-Z]{2,3}))?\s*$/.exec(String(value || ''));
export function renameItem(item, value) {
  const name=String(value).toUpperCase();
  if (/[|\r\n]/.test(name)) return item;
  const match=parts(item.fohColumn);
  const portion=match && match[1]==='R FSL' && match[2].trim()==='CAFE EXPRESS' && / 12 FO$/.test(match[3]) && !/ 12 FO$/.test(name.trim()) ? ' 12 FO' : '';
  return {...item,name,label:name,...(match ? {fohColumn:`${match[1]} | ${match[2].trim()} | ${name.trim()}${portion} ${match[4]}${match[5] ? ` ${match[5]}` : ''}`} : {})};
}
export function changeDesignation(menu, value, stationId='') {
  const designation=String(value).toUpperCase();
  if (/[|\r\n]/.test(designation)) return menu;
  return {...menu,...(stationId ? {stations:menu.stations.map(s=>s.id===stationId?{...s,fixyDesignation:designation}:s)} : {fixyDesignation:designation}),items:menu.items.map(item=>{
    if (!isMenuItem(item) || (stationId && item.stationId!==stationId)) return item;
    const match=parts(item.fohColumn);
    return match && designation.trim() ? {...item,fohColumn:`${match[1]} | ${designation.trim()} | ${match[3]} ${match[4]}${match[5] ? ` ${match[5]}` : ''}`} : item;
  })};
}
export function sideItems(rows) {
  return rows.filter(item=>{
    const match=parts(item.fohColumn);
    const category=String(item.secondaryCategory || item.reportingCategorySecondary || '').trim().toLowerCase();
    return isMenuItem(item) && (category ? category==='side' : match && (match[4]==='SNK' || match[1].endsWith(' FKS')));
  });
}
export function sidesModifierGroup(rows, areas) {
  const id=`modifier-sides-${globalThis.crypto.randomUUID()}`;
  return {id,name:'',modifierType:'Force',minQty:'',maxQty:'',lockedForCentric:false,independentCopy:true,sourceSheet:'Copied menu sides',choices:sideItems(rows).map(item=>({
    id:`${id}-${globalThis.crypto.randomUUID()}`,label:`${String(item.label || item.name || '').toLowerCase()}${item.dietaryPreference==='Vegan'?' (vn)':item.dietaryPreference==='Vegetarian'?' (v)':''}`,
    mrn:item.mrn ?? '',description:'',calories:item.calories ?? '',priceSelectorId:FREE_MODIFIER_PRICE_ID,price:'0.00',areaPrices:Object.fromEntries(areas.map(area=>[area,'0.00'])),
  }))};
}
