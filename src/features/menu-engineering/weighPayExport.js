import JSZip from 'jszip';
import {buildPortfolio,includeWpMenu} from './wpPortfolioModel.js';

import * as XLSX from 'xlsx';

import { tierFor, CATEGORIES } from './panReadyModel.js';
import { WP_PRICE_PER_LB, pricePerLb } from './weighPayModel.js';



const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const style = `body{font:14px Arial,sans-serif;color:#182b35;max-width:1100px;margin:32px auto;padding:0 20px}h1,h2,h3{color:#193f3c}.cover,.card{padding:24px;border:1px solid #ccd7d4;margin-bottom:24px;break-after:page}.charts,.lists{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.chart svg{width:150px;height:150px}.chart li{margin:6px 0}.meta{color:#536763}.notice{background:#fff5d9;padding:12px}table{border-collapse:collapse;width:100%;margin:16px 0}td,th{border:1px solid #ccd7d4;padding:8px;text-align:left}.run{color:#0f766e}.hold{color:#9f1239}@media(max-width:600px){.charts,.lists{grid-template-columns:1fr}}@media print{body{margin:0;font-size:11px}button{display:none}.cover,.card{min-height:85vh;box-sizing:border-box}.charts,.lists{grid-template-columns:repeat(2,minmax(0,1fr))}li{break-inside:avoid}.card:last-child{break-after:auto}}`;

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>${style}</style></head><body><button onclick="window.print()">Print / Save as PDF</button>${body}</body></html>`;

const colors=['#0f766e','#d97706','#be123c','#64748b','#7c3aed','#0284c7'];

export function reportChart(title,segments) {

 const total=segments.reduce((sum,s)=>sum+s.value,0);let offset=0;

 const arcs=segments.map((s,i)=>{const length=total?s.value/total*100:0,start=offset;offset+=length;return `<circle cx="80" cy="80" r="60" fill="none" stroke="${colors[i%colors.length]}" stroke-width="19" pathLength="100" stroke-dasharray="${length} ${100-length}" stroke-dashoffset="${-start}" transform="rotate(-90 80 80)"/>`;}).join('');

 return `<div class="chart"><h3>${escape(title)}</h3><svg role="img" aria-label="${escape(title)}" viewBox="0 0 160 160"><title>${escape(segments.map(s=>`${s.label}: ${s.value}`).join(', '))}</title><circle cx="80" cy="80" r="60" fill="none" stroke="#e2e8f0" stroke-width="19"/>${arcs}<text x="80" y="87" text-anchor="middle" font-size="25">${total}</text></svg><ul>${segments.map((s,i)=>`<li style="color:${colors[i%colors.length]}">${escape(s.label)}: <strong>${s.value}</strong></li>`).join('')}</ul></div>`;

}

export async function buildWeighPayPackage(menus, sourceInfo) {

 menus=menus.filter(m=>includeWpMenu(m.menu));
 const rate=pricePerLb(sourceInfo.pricePerLb??WP_PRICE_PER_LB);

 if(!rate||menus.some(menu=>menu.items.some(item=>item.pricePerLb!==rate)))throw new Error('Export price does not match the evaluated guidance.');

 const zip=new JSZip();
 const fc = n => n == null ? 'Needs information' : `${(n*100).toFixed(1)}%`;
 const classificationList = menu => { const rows=(sourceInfo.classificationReviews?.[menu.menu]||[]).filter(r=>r.classificationReason!=='Supporting prep only'); return rows.length?`<h3>Classification review</h3><ul>${rows.map(r=>`<li>${escape(r.name)} - ${escape(r.classificationReason)} - FC Needs information</li>`).join('')}</ul>`:''; };
 const projected = menu => sourceInfo.conceptAnalyses?.[menu.menu] || sourceInfo.andesAnalysis || menu.items.map(i=>({...i,name:i.item,massOz:i.weightOz,tier:tierFor(i.foodCost),serviceReasons:i.reasons||[]}));
 const rows=sourceInfo.portfolioRows || buildPortfolio(menus.map(menu=>({menu:menu.menu,items:projected(menu)})));
 const exportMenus=menus.length===1&&!sourceInfo.portfolioRows?menus:[{menu:'W&P portfolio',items:[],portfolio:true}];
 const categories=CATEGORIES.map(label=>({label,value:rows.filter(r=>r.category===label).length}));
 const provenance=sourceInfo.trusted===false?'Fallback data - reference only. ':'';
 const cover=`<section class="cover"><h1>Weigh &amp; Pay - Pan-ready Assortment</h1><p>$${(rate/16).toFixed(2)}/oz - $${rate.toFixed(2)}/lb</p><p class="meta">Source: ${escape(sourceInfo.source)} - Read: ${escape(sourceInfo.loadedAt)}</p><p class="notice">${escape(provenance)}Source-linked serving choices; classification and service restrictions require review. Supporting prep is included in parent cost, not counted again. Each unique food is counted once; source menu memberships remain listed. Missing information is never ranked as a pass.</p>${reportChart('Servable components by category',categories)}</section>`;
 const list=items=>items.length?`<ul>${items.map(r=>`<li>${escape(r.name)}${r.menus?.length?` (${escape(r.menus.join('; '))})`:''} - <strong>FC ${escape(fc(r.foodCost))}</strong> - ${escape(r.category||'Unclassified')} - ${escape(r.tier||tierFor(r.foodCost))}${r.weightApproximate?' - Approximate source weight; FC is an estimate':''}${r.weightSource?` - Weight source: ${escape(r.weightSource)}`:''}${r.informationReasons?.length?` - Information needed: ${escape(r.informationReasons.join('; '))}`:''}${r.serviceReasons?.length?` - Service review: ${escape(r.serviceReasons.join('; '))}`:''}</li>`).join('')}</ul>`:'<p>None</p>';
 const cards=exportMenus.map(menu=>{
   const items=rows, allowed=items.filter(r=>r.foodCost!=null&&r.foodCost<=.4+1e-12&&!r.serviceReasons?.length);
   const held=items.filter(r=>!allowed.includes(r));
   return `<article class="card"><h2>${escape(menu.menu)}</h2>${reportChart('Servable components by category',CATEGORIES.map(label=>({label,value:items.filter(r=>r.category===label).length})))}<div class="lists"><section><h3 class="run">Within 40% - candidates</h3>${list(allowed)}</section><section><h3 class="hold">Above gate / review / needs information</h3>${list(held)}</section></div>${menu.portfolio?menus.map(classificationList).join(''):classificationList(menu)}${menu.items.some(i=>i.override)?`<p class="notice">Session exceptions: ${menu.items.filter(i=>i.override).map(i=>escape(i.item)+': '+escape(i.override.reason)).join('; ')}</p>`:''}</article>`;
 }).join('');
 zip.file('flash-cards.html',page('W&P Brand Flash Cards',cover+cards));
 zip.file('data-audit.html',page('Data Audit',cover+cards));
 const workbook=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(menus.map(m=>({Menu:m.menu,'Component guidance':m.status,'Servable components':projected(m).length,'Price per oz':rate/16,'Price per lb':rate,Source:sourceInfo.source}))), 'Data Audit');
 const itemSheet=XLSX.utils.json_to_sheet(rows.map(r=>({Menu:r.menus?.join('; ')||r.menu,Category:r.category,Item:r.name,MRN:String(r.mrn??''),Portion:r.portion,'Cost per portion':r.cost,'Weight oz':r.massOz,'Cost per lb':r.massOz&&r.cost!=null?r.cost/r.massOz*16:null,'FC%':r.foodCost,'FC tier':r.tier||tierFor(r.foodCost),'Service review':r.serviceReasons?.join('; '),'Cost source':r.costBasis||'Recipe snapshot','Weight source':r.weightSource,'Approximate weight':r.weightApproximate?'Yes':'No','Information needed':r.informationReasons?.join('; '),'Recipe link':r.linkStatus||'Source recipe','Classification basis':r.classificationBasis,'Price per oz':rate/16,'Source read':sourceInfo.loadedAt})));
 XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(rows.map(r=>({Category:r.category,Item:r.name,MRN:String(r.mrn??''),'FC%':r.foodCost,'Cost per lb':r.costPerLb??(r.massOz&&r.cost!=null?r.cost/r.massOz*16:null),Menus:r.menus?.join('; ')||r.menu,Result:r.portfolioStatus||'',Conflict:r.conflict?'Source economics require review':''}))), 'Portfolio');
 const portfolioSheet=workbook.Sheets['Portfolio'];
 portfolioSheet['!cols']=[{wch:24},{wch:55},{wch:24},{wch:13},{wch:16},{wch:60},{wch:22},{wch:40}];
 if(portfolioSheet['!ref'])for(let r=1;r<=XLSX.utils.decode_range(portfolioSheet['!ref']).e.r;r++){const c=portfolioSheet[XLSX.utils.encode_cell({r,c:3})];if(c?.t==='n')c.z='0.0%';}
 const range=itemSheet['!ref']&&XLSX.utils.decode_range(itemSheet['!ref']);
 if(range) for(let row=1;row<=range.e.r;row++){const cell=itemSheet[XLSX.utils.encode_cell({r:row,c:8})];if(cell?.t==='n')cell.z='0.0%';}
 itemSheet['!cols']=[{wch:25},{wch:23},{wch:55},{wch:24},{wch:18},{wch:18},{wch:15},{wch:16},{wch:13},{wch:22},{wch:50}];
 XLSX.utils.book_append_sheet(workbook,itemSheet,'Servable Items');
 const reviewRows=menus.flatMap(menu=>(sourceInfo.classificationReviews?.[menu.menu]||[]).map(r=>({Menu:menu.menu,Item:r.name,MRN:r.mrn,Reason:r.classificationReason})));
 XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(reviewRows.length?reviewRows:[{Reason:'No classification exceptions'}]),'Classification Review');
 zip.file('data-audit.xlsx',XLSX.write(workbook,{type:'array',bookType:'xlsx'}));

 return zip.generateAsync({type:'blob'});

}

export async function downloadWeighPayPackage(menus,sourceInfo) {

 const blob=await buildWeighPayPackage(menus,sourceInfo),url=URL.createObjectURL(blob),link=document.createElement('a');

 link.href=url;link.download=`${menus.length===1?menus[0].menu.replace(/[<>:"/\|?*]/g,'-'):'All Menus'} W&P Package.zip`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);

}
