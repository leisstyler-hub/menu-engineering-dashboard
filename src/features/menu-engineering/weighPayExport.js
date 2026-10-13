import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { WP_PRICE_PER_LB, WP_ITEM_FC_GATE, WP_MENU_PASS_GATE, WP_RULE_VERSION } from './weighPayModel.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = value => value == null ? 'Not available' : `$${value.toFixed(3)}`;
const percent = value => value == null ? 'Not available' : `${(value * 100).toFixed(1)}%`;
const notes = item => [...item.reasons, ...item.reviews, item.missingCost ? 'Needs cost' : '', item.missingWeight ? 'Needs weight' : '', item.override ? `Session override: ${item.override.decision} — ${item.override.reason}` : ''].filter(Boolean).join('; ');
const style = 'body{font:14px Arial,sans-serif;color:#182b35;max-width:1100px;margin:32px auto;padding:0 20px}h1,h2,h3{color:#193f3c}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #ccd7d4;padding:8px;text-align:left;vertical-align:top}th{background:#edf4f1}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{border:1px solid #ccd7d4;border-top:5px solid #193f3c;padding:18px;break-inside:avoid}.meta{color:#536763}.notice{background:#fff5d9;padding:12px}section{break-inside:avoid-page}@media print{body{margin:0;font-size:11px}button{display:none}.cards{gap:12px}.card{min-height:160px}h2{break-after:avoid}thead{display:table-header-group}}';
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>${style}</style></head><body><button onclick="window.print()">Print / Save as PDF</button>${body}</body></html>`;

export async function buildWeighPayPackage(menus, sourceInfo) {
  const zip = new JSZip();
  const exportedAt = new Date().toISOString();
  const metadata = { pricePerLb: WP_PRICE_PER_LB, itemFoodCostGate: WP_ITEM_FC_GATE, menuPassGate: WP_MENU_PASS_GATE, ruleVersion: WP_RULE_VERSION, ...sourceInfo, exportedAt };
  const heading = `<h1>Weigh &amp; Pay Guidance</h1><p>$11.99/lb · Item food-cost gate 40% · Menu pass gate 60%</p><p class="meta">Source: ${escape(sourceInfo.source)} · Read: ${escape(sourceInfo.loadedAt)} · Export: ${escape(exportedAt)}</p><p class="notice">Economic and service-fit guidance only. Use the listed allowed assortment, validate actual guest builds and obtain Culinary approval before service. Exceptions are session guidance, not source-record changes. A menu pass is not a forecast of aggregate café food cost.</p>`;
  const matrix = `<table><thead><tr><th>Menu</th><th>Guidance</th><th>Allowed / Total</th><th>Pass rate</th><th>Calculated rate</th><th>Missing inputs</th></tr></thead><tbody>${menus.map(menu => `<tr><td>${escape(menu.menu)}</td><td>${menu.status}</td><td>${menu.allowed} / ${menu.total}</td><td>${percent(menu.passRate)}</td><td>${percent(menu.calculatedPassRate)}</td><td>${menu.missing}</td></tr>`).join('')}</tbody></table>`;
  const sections = menus.map(menu => `<section><h2>${escape(menu.menu)} — ${menu.status}</h2>${[...new Set(menu.items.map(item => item.category))].map(category => `<h3>${escape(category)}</h3><table><thead><tr><th>Item / MRN</th><th>Guidance</th><th>W&amp;P FC</th><th>Cost/lb</th><th>Margin/lb</th><th>Reason</th></tr></thead><tbody>${menu.items.filter(item => item.category === category).map(item => `<tr><td>${escape(item.item)}<br>${escape(item.mrn)}</td><td>${item.status}<br><small>Calculated: ${item.calculatedStatus}</small></td><td>${percent(item.foodCost)}</td><td>${money(item.costPerLb)}</td><td>${money(item.marginPerLb)}</td><td>${escape(notes(item))}</td></tr>`).join('')}</tbody></table>`).join('')}</section>`).join('');
  zip.file('guidance-report.html', page('Weigh & Pay Guidance', heading + matrix + sections));
  const cards = menus.flatMap(menu => menu.items.map(item => `<article class="card"><p class="meta">${escape(menu.menu)} · ${escape(item.category)}</p><h2>${escape(item.item)}</h2><h3>${item.status}</h3><p>Calculated: ${item.calculatedStatus} · FC ${percent(item.foodCost)}</p><p>Cost ${money(item.costPerLb)}/lb · Margin ${money(item.marginPerLb)}/lb</p><p>MRN: ${escape(item.mrn)} · Weight: ${item.weightOz ?? 'Needs weight'} oz</p><p>${escape(notes(item))}</p></article>`)).join('');
  zip.file('flash-cards.html', page('W&P Flash Cards', heading + `<div class="cards">${cards}</div>`));
  zip.file('calculation-snapshot.json', JSON.stringify({ ...metadata, menus }, null, 2));
  zip.file('README.txt', 'Open guidance-report.html or flash-cards.html in a browser and choose Print / Save as PDF. The workbook contains menu summaries and exact item identifiers. Session overrides are explicitly labeled and do not update shared source records. Missing inputs remain in the denominator. Fallback data is reference only.\n');
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(menus.map(menu => ({ Menu: menu.menu, Status: menu.status, Allowed: menu.allowed, Total: menu.total, 'Pass %': menu.passRate * 100, 'Calculated pass %': menu.calculatedPassRate * 100, 'Missing inputs': menu.missing, Source: sourceInfo.source, 'Read at': sourceInfo.loadedAt }))), 'Menus');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(menus.flatMap(menu => menu.items.map(item => ({ Menu: menu.menu, Category: item.category, Item: item.item, MRN: item.mrn, Status: item.status, 'Calculated status': item.calculatedStatus, 'True cost': item.cost, 'Weight oz': item.weightOz, 'W&P FC %': item.foodCost == null ? null : item.foodCost * 100, 'Cost per lb': item.costPerLb, 'Margin per lb': item.marginPerLb, Reason: notes(item) })))), 'Items');
  zip.file('menu-summary.xlsx', XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));
  return zip.generateAsync({ type: 'blob' });
}

export async function downloadWeighPayPackage(menus, sourceInfo) {
  const blob = await buildWeighPayPackage(menus, sourceInfo);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${menus.length === 1 ? menus[0].menu.replace(/[<>:"/\\|?*]/g, '-') : 'All Menus'} W&P Package.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
