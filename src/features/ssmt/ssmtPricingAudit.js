import XLSX from 'xlsx-js-style';
import { groupsForItem, isMenuItem } from './ssmtReuse.js';
import { FREE_MODIFIER_PRICE_ID } from './ssmtModifierDefaults.js';

const label = value => String(value ?? '');
const itemName = item => item.label || item.name || '';
// Only clean currency values become numbers. Blanks and unusual source values remain literal.
function money(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : label(value);
  const text = label(value).trim();
  return /^\$?-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(text)
    ? Number(text.replace(/[$,]/g, '')) : label(value);
}

export function buildPricingAuditWorkbook(workspace = {}, metadata = {}) {
  const prices = workspace.priceBook || [], groups = workspace.modifierGroups || [];
  const areas = [...new Set([...(workspace.areaOrder || []), ...prices.flatMap(p => Object.keys(p.areas || {}))])].sort((a,b) => a === 'SEA' ? -1 : b === 'SEA' ? 1 : 0);
  const marketHeaders = areas.map(area => `Price ${area}`);
  const index = new Map();
  prices.forEach(price => index.set(price.id, [...(index.get(price.id) || []), price]));
  const items = [], modifiers = [], exceptions = [], usedGroups = new Set();
  const count = (rows, id) => rows.filter(row => row['Price row ID'] === id).length;
  function linked(record, context, modifier = false) {
    const id = record.priceSelectorId, matches = id ? index.get(id) || [] : [];
    const free = modifier && id === FREE_MODIFIER_PRICE_ID;
    const issue = free ? '' : !id ? 'Unlinked price' : matches.length === 0 ? 'Missing price row' : matches.length > 1 ? 'Ambiguous price row' : '';
    const price = matches.length === 1 ? matches[0] : null;
    if (issue) exceptions.push({Issue:issue, ...context, 'Price row ID':label(id), Details:'Saved prices retained below; no pricing relationship inferred.'});
    return {
      'Price row ID':label(id), 'Price category':free ? 'Built-in free modifier' : price?.category || '', 'Price label':price?.selectorLabel || '', 'Link status':free ? 'Built-in free modifier' : issue || 'Exact link',
      ...Object.fromEntries(areas.map(area => [`Price ${area}`, free ? 0 : price ? money(price.areas?.[area]) : ''])),
      'Saved SEA price':money(record.seaPrice ?? record.price),
      ...Object.fromEntries(areas.map(area => [`Saved ${area}`, money(record.areaPrices?.[area])])),
    };
  }
  function addGroup(group, context) {
    for (const choice of group.choices || []) {
      const identity = {...context, Modifier:itemName(choice), 'Modifier MRN':label(choice.mrn), 'Modifier ID':label(choice.id), 'Modifier group':group.name || '', 'Group ID':label(group.id)};
      modifiers.push({...identity, ...linked(choice, identity, true)});
    }
  }
  for (const menu of workspace.menus || []) {
    const menuContext = {'Parent menu':menu.name || '', 'Menu ID':label(menu.id), 'Menu type':menu.type || '', 'Menu status':menu.status || '', 'Menu phase':menu.phase || '', 'Hidden menu':menu.hidden ? 'Yes' : 'No', 'Active start':menu.activeStart || '', 'Active end':menu.activeEnd || '', 'Completed at':menu.completedAt || ''};
    for (const item of (menu.items || []).filter(isMenuItem)) {
      const context = {...menuContext, 'Parent item':itemName(item), 'Parent item ID':label(item.id), 'Parent MRN':label(item.mrn)};
      items.push({Item:itemName(item), MRN:label(item.mrn), 'Item ID':label(item.id), ...menuContext, 'Item category':item.category || '', ...linked(item, context)});
      for (const ref of item.modifierGroups || []) {
        if (!ref || (typeof ref === 'string' && (!ref.trim() || ref.trim().toLowerCase() === 'n/a'))) continue;
        const exact = typeof ref === 'string' ? groups.filter(group => group.id === ref) : [];
        const found = exact.length > 1 ? [] : groupsForItem({modifierGroups:[ref]}, groups, menu);
        if (found.length !== 1) {
          exceptions.push({Issue:'Unresolved modifier group', ...context, 'Modifier group':label(ref), Details:'Missing or ambiguous group reference; no parent relationship inferred.'});
          continue;
        }
        usedGroups.add(found[0]);
        addGroup(found[0], {Scope:'Menu attachment', ...context});
      }
    }
  }
  for (const group of groups) if (!usedGroups.has(group)) addGroup(group, {Scope:'Unattached group', 'Parent menu':'', 'Parent item':''});
  for (const [slotIndex, slot] of (workspace.modifierClipboardSlots || []).entries()) if (slot.group) addGroup(slot.group, {Scope:'Clipboard', 'Parent menu':'', 'Parent item':'', 'Clipboard slot':label(slot.id || slotIndex + 1)});
  for (const price of prices) if (!price.id || index.get(price.id).length > 1) exceptions.push({Issue:price.id ? 'Duplicate pricing ID' : 'Missing pricing ID', 'Price row ID':label(price.id), 'Price category':price.category || '', Details:'Pricing row retained in summary; links cannot be uniquely resolved.'});
  const sorted = [...prices].sort((a,b) => {
    const av=money(a.areas?.SEA), bv=money(b.areas?.SEA);
    return (typeof bv === 'number' ? bv : -Infinity) - (typeof av === 'number' ? av : -Infinity) || label(a.category).localeCompare(label(b.category));
  });
  const summary = sorted.map(price => ({'Price row ID':label(price.id), 'Price category':price.category || '', 'Price label':price.selectorLabel || '', 'Pricing mode':price.tierPricing ? 'Tier' : 'Market', 'Modifier only':price.modifierOnly ? 'Yes' : 'No',
    'Attached menu items':price.id ? count(items, price.id) : 0,
    'Modifier attachments':price.id ? count(modifiers.filter(row => row.Scope === 'Menu attachment'), price.id) : 0,
    'Unattached choices':price.id ? count(modifiers.filter(row => row.Scope === 'Unattached group'), price.id) : 0,
    'Clipboard choices':price.id ? count(modifiers.filter(row => row.Scope === 'Clipboard'), price.id) : 0,
    'Tier 1 price':money(price.tier1Price), 'Tier 2 price':money(price.tier2Price),
    ...Object.fromEntries(areas.map(area => [`Price ${area}`,money(price.areas?.[area])])),
  }));
  const priceRanks = new Map(sorted.map((price, rank) => [label(price.id), rank]));
  const compareLinks = (a,b) => (priceRanks.get(a['Price row ID']) ?? prices.length) - (priceRanks.get(b['Price row ID']) ?? prices.length)
    || label(a['Price row ID']).localeCompare(label(b['Price row ID']))
    || label(a['Parent menu']).localeCompare(label(b['Parent menu']))
    || label(a['Menu ID']).localeCompare(label(b['Menu ID']))
    || label(a['Parent item'] ?? a.Item).localeCompare(label(b['Parent item'] ?? b.Item))
    || label(a['Parent item ID'] ?? a['Item ID']).localeCompare(label(b['Parent item ID'] ?? b['Item ID']))
    || label(a['Modifier group']).localeCompare(label(b['Modifier group']))
    || label(a.Modifier).localeCompare(label(b.Modifier));
  items.sort(compareLinks);
  modifiers.sort(compareLinks);
  const book = XLSX.utils.book_new();
  const exportedAt=metadata.exportedAt || new Date().toISOString();
  const notes = [
    `Exported ${exportedAt} | Effective from: ${workspace.priceBookEffectiveFrom || 'Not recorded'}`,
    `Scope: current loaded workspace; all menus including hidden/history. Save state: ${metadata.saveState || 'Not supplied'}; source: ${metadata.source || 'Not supplied'}.`,
    'Attached menu items counts direct saved selector links. Modifier attachments count each choice per parent item/menu; unattached groups and clipboard are separate.',
    'Current prices only; plans/archives excluded. Blank current prices remain blank. Saved snapshot prices are separate; no missing/ambiguous link is inferred.',
  ];
  const baseItemHeaders=['Item','MRN','Item ID','Parent menu','Menu ID','Menu type','Menu status','Menu phase','Hidden menu','Active start','Active end','Completed at','Item category'];
  const linkHeaders=['Price row ID','Price category','Price label','Link status',...marketHeaders,'Saved SEA price',...areas.map(area=>`Saved ${area}`)];
  const modifierHeaders=['Price category','Price label','Parent menu','Parent item','Modifier group','Modifier','Scope','Modifier MRN','Parent MRN',...marketHeaders,'Menu status','Menu phase','Hidden menu','Active start','Active end','Completed at','Menu type','Price row ID','Link status','Menu ID','Parent item ID','Modifier ID','Group ID','Clipboard slot','Saved SEA price',...areas.map(area=>`Saved ${area}`)];
  const summaryHeaders=['Price category','Price label','Attached menu items','Modifier attachments',...marketHeaders,'Unattached choices','Clipboard choices','Pricing mode','Modifier only','Tier 1 price','Tier 2 price','Price row ID'];
  function addSheet(name, rows, headers) {
    const sheet = XLSX.utils.aoa_to_sheet([[`SSMT Finance Pricing Audit | ${name}`], ...notes.map(note=>[note]), headers, ...rows.map(row=>headers.map(header=>row[header] ?? ''))]);
    sheet['!merges']=[0,1,2,3,4].map(r=>({s:{r,c:0},e:{r,c:headers.length-1}}));
    sheet['!autofilter']={ref:XLSX.utils.encode_range({r:5,c:0},{r:5+rows.length,c:headers.length-1})};
    sheet['!cols']=headers.map(header=>({wch: /ID|MRN/.test(header)?24:/Item|item|menu|Modifier|category|label|Issue/i.test(header)?32:header==='Details'?78:20}));
    sheet['!rows']=[{hpt:32},{hpt:24},{hpt:32},{hpt:32},{hpt:32},{hpt:42},...rows.map(()=>({hpt:38}))];
    for(const [address,cell] of Object.entries(sheet)) {
      if(address.startsWith('!'))continue;
      const {r,c}=XLSX.utils.decode_cell(address);
      cell.s={font:{name:'Calibri',sz:r===0?18:11,color:{rgb:r===0||r===5?'FFFFFF':'203B35'},bold:r===0||r===5},fill:{fgColor:{rgb:r===0||r===5?'234D3B':r<5?'E8F1ED':r%2?'F0F5F2':'FFFFFF'}},alignment:{vertical:'center',wrapText:true}};
      if(r>5 && typeof cell.v==='number' && (/^Price |^Saved |^Tier /.test(headers[c]))) cell.z='"$"#,##0.00;[Red]("$"#,##0.00);"$"0.00';
    }
    XLSX.utils.book_append_sheet(book,sheet,name);
  }
  addSheet('Pricing Summary',summary,summaryHeaders);
  addSheet('Items by Price',items,['Price category','Price label',...marketHeaders,...baseItemHeaders,...linkHeaders.filter(header=>!['Price category','Price label',...marketHeaders].includes(header))]);
  addSheet('Modifiers',modifiers,modifierHeaders);
  addSheet('Exceptions',exceptions,['Issue','Parent menu','Menu ID','Parent item','Parent item ID','Parent MRN','Modifier','Modifier group','Price row ID','Price category','Details']);
  book.Props={Title:'SSMT Finance Pricing Audit',Subject:'Current pricing and exact item/modifier relationships',Author:'Culinary Tools'};
  return book;
}

export function downloadPricingAudit(workspace, metadata = {}) {
  const exportedAt=new Date().toISOString();
  XLSX.writeFile(buildPricingAuditWorkbook(workspace,{...metadata,exportedAt}),`SSMT_Pricing_Audit_${exportedAt.slice(0,10)}.xlsx`);
}
