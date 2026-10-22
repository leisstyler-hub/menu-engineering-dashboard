import JSZip from 'jszip';

import * as XLSX from 'xlsx';

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

 const rate=pricePerLb(sourceInfo.pricePerLb??WP_PRICE_PER_LB);

 if(!rate||menus.some(menu=>menu.items.some(item=>item.pricePerLb!==rate)))throw new Error('Export price does not match the evaluated guidance.');

 const zip=new JSZip(),items=menus.flatMap(m=>m.items),counts=new Map();

 items.forEach(i=>counts.set(i.category,(counts.get(i.category)||0)+1));

 const categories=[...counts].sort((a,b)=>b[1]-a[1]),other=categories.slice(5).reduce((n,c)=>n+c[1],0);

 const charts=reportChart('Menu qualification',['Pass','Conditional','Fail'].map(label=>({label,value:menus.filter(m=>m.status===label).length})))+reportChart('Category composition',[...categories.slice(0,5).map(([label,value])=>({label,value})),...(other?[{label:'Other categories',value:other}]:[])])+reportChart('Input readiness',[{label:'Cost + weight available',value:items.filter(i=>!i.missingCost&&!i.missingWeight).length},{label:'Needs weight only',value:items.filter(i=>!i.missingCost&&i.missingWeight).length},{label:'Needs cost',value:items.filter(i=>i.missingCost).length}]);

 const provenance=sourceInfo.trusted===false?'Fallback data - reference only. ':'';
 const cover=`<section class="cover"><h1>Weigh &amp; Pay · Brand Guidance</h1><p>Scenario: $${rate.toFixed(2)}/lb</p><p class="meta">Source: ${escape(sourceInfo.source)} · Read: ${escape(sourceInfo.loadedAt)} · Export: ${escape(new Date().toISOString())}</p><p class="notice">${escape(provenance)}${escape(sourceInfo.sourceMessage||'')} Run lists identify candidates under the current economic and service-fit rules. Obtain Culinary approval before service. Unresolved inputs stay on the do-not-run list. Session exceptions do not change shared records. Charts count menu-item memberships.</p><div class="charts">${charts}</div></section>`;

 const list=rows=>rows.length?`<ul>${[...new Set(rows.map(i=>i.item))].sort().map(name=>`<li>${escape(name)}</li>`).join('')}</ul>`:'<p>None</p>';

 const cards=menus.map(menu=>{const snapshot=sourceInfo.conceptAnalyses?.[menu.menu]||(/(?:^|: )andes$/i.test(menu.menu)&&sourceInfo.andesAnalysis);const cardItems=snapshot?snapshot.map(r=>({item:r.name,status:r.economics==='Within 40%'&&!r.serviceReasons.length?'Allowed':'Unapproved'})):menu.items;const allowed=cardItems.filter(i=>i.status.startsWith('Allowed')),held=cardItems.filter(i=>!i.status.startsWith('Allowed'));return `<article class="card"><h2>${escape(menu.menu)}</h2>${snapshot?`<p class="meta">Supplied ${escape(menu.menu.replace(/^AMZ: /,''))} recipe analysis snapshot - economic/service-fit candidates; final Culinary approval required. Costs: supplied recipe snapshot. Documented supplied-index weights are retained. Missing snapshot weights use exact MRN and matching portion from trusted shared item data; unmatched weights remain unresolved. Separate from shared menu scoring.</p>`:''}${reportChart('Concept assortment',[{label:'Run candidates',value:allowed.length},{label:'Do not run / unresolved',value:held.length}])}<div class="lists"><section><h3 class="run">Good to run · candidates</h3>${list(allowed)}</section><section><h3 class="hold">Do not run · includes unresolved</h3>${list(held)}</section></div>${menu.items.some(i=>i.override)?`<p class="notice">Session exceptions: ${menu.items.filter(i=>i.override).map(i=>escape(i.item)+': '+escape(i.override.reason)).join('; ')}</p>`:''}</article>`;}).join('');

 zip.file('flash-cards.html',page('W&P Brand Flash Cards',cover+cards));

 const audit=`<h1>Data Audit</h1><p>${escape(provenance)}</p><p>Scenario: $${rate.toFixed(2)}/lb · Source: ${escape(sourceInfo.source)}</p><table><thead><tr><th>Brand</th><th>Guidance</th><th>Run candidates</th><th>Do not run / unresolved</th><th>Missing inputs</th></tr></thead><tbody>${menus.map(m=>`<tr><td>${escape(m.menu)}</td><td>${escape(m.status)}</td><td>${m.allowed}</td><td>${m.total-m.allowed}</td><td>${m.missing}</td></tr>`).join('')}</tbody></table>`;

 zip.file('data-audit.html',page('Data Audit',audit+cards));

 const workbook=XLSX.utils.book_new();

 XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(menus.map(m=>({Brand:m.menu,Guidance:m.status,'Run candidates':m.allowed,'Do not run / unresolved':m.total-m.allowed,'Missing inputs':m.missing,'Price per lb':rate,Source:sourceInfo.source}))), 'Data Audit');

 zip.file('data-audit.xlsx',XLSX.write(workbook,{type:'array',bookType:'xlsx'}));

 return zip.generateAsync({type:'blob'});

}

export async function downloadWeighPayPackage(menus,sourceInfo) {

 const blob=await buildWeighPayPackage(menus,sourceInfo),url=URL.createObjectURL(blob),link=document.createElement('a');

 link.href=url;link.download=`${menus.length===1?menus[0].menu.replace(/[<>:"/\|?*]/g,'-'):'All Menus'} W&P Package.zip`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);

}
