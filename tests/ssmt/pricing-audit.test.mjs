import test from 'node:test';
import assert from 'node:assert/strict';
import XLSX from 'xlsx-js-style';
import { buildPricingAuditWorkbook } from '../../src/features/ssmt/ssmtPricingAudit.js';
const rows = (book, sheet) => XLSX.utils.sheet_to_json(book.Sheets[sheet], {range:5, defval:''});
const workspace = {
 areaOrder:['SEA','AUS'], priceBookEffectiveFrom:'2026-11-01',
 priceBook:[{id:'p',category:'Lunch',selectorLabel:'$10 Lunch',areas:{SEA:'10.00',AUS:0}},{id:'free',category:'Free',areas:{SEA:'',AUS:'0.00'}},{id:'unused',category:'Unused',areas:{SEA:'12.00'}}],
 modifierGroups:[{id:'g',name:'Extras',choices:[{id:'c',name:'Avocado',mrn:'000007',priceSelectorId:'p'}]},{id:'orphan',name:'Unused group',choices:[{id:'o',name:'Sauce',priceSelectorId:'free'}]}],
 menus:[{id:'m',name:'Main',status:'Draft',items:[{id:'i',name:'Burger',mrn:'000123',priceSelectorId:'p',modifierGroups:['g']},{id:'j',name:'Other',priceSelectorId:'p',modifierGroups:['g']},{id:'div',recordType:'divider',name:'Heading'}]},
 {id:'h',name:'History',hidden:true,phase:'IT complete',items:[{id:'k',name:'Old item',priceSelectorId:'free'},{id:'bad',name:'Missing price',priceSelectorId:'gone',modifierGroups:['missing']},{id:'custom',name:'Custom',seaPrice:'$5.00',areaPrices:{AUS:'4.00'}}]}],
 modifierClipboardSlots:[{id:'slot',group:{id:'clip',name:'Clipboard',choices:[{id:'cc',name:'Extra',priceSelectorId:'p'}]}}],
 plannedPriceBook:{priceBook:[{id:'future',areas:{SEA:99}}]},
};
test('pricing audit expands modifier parents and reconciles direct item counts without changing input',()=>{
 const before=structuredClone(workspace), book=buildPricingAuditWorkbook(workspace,{exportedAt:'2026-11-06T03:10:00Z',saveState:'synced'});
 assert.deepEqual(book.SheetNames,['Pricing Summary','Items by Price','Modifiers','Exceptions']);
 const summary=rows(book,'Pricing Summary'), items=rows(book,'Items by Price'), modifiers=rows(book,'Modifiers');
 assert.equal(summary.length,3);
 const p=summary.find(r=>r['Price row ID']==='p');
 assert.equal(p['Attached menu items'],2);assert.equal(p['Modifier attachments'],2);assert.equal(p['Clipboard choices'],1);
 assert.equal(p["Price AUS"],0);assert.equal(summary.find(r=>r['Price row ID']==='unused')['Attached menu items'],0);
 assert.equal(items.length,5);assert.equal(items.find(r=>r.Item==='Burger').MRN,'000123');
 assert.equal(items.find(r=>r.Item==='Old item')['Hidden menu'],'Yes');
 const avocado=modifiers.filter(r=>r.Modifier==='Avocado');
 assert.equal(avocado.length,2);assert.deepEqual(avocado.map(r=>r['Parent item']),['Burger','Other']);
 assert.ok(avocado.every(r=>r['Parent menu']==='Main'));
 assert.equal(modifiers.find(r=>r.Modifier==='Sauce').Scope,'Unattached group');
 assert.ok(rows(book,'Exceptions').some(r=>r.Issue==='Missing price row'));
 assert.ok(rows(book,'Exceptions').some(r=>r.Issue==='Unresolved modifier group'));
 assert.deepEqual(workspace,before);
});
test('serialized XLSX preserves identifiers, literal text, blank/zero prices, formatting and filters',()=>{
 const input=structuredClone(workspace);input.menus[0].items[0].name='=SUM(A1:A2)';
 const built=buildPricingAuditWorkbook(input), book=XLSX.read(XLSX.write(built,{type:'buffer',bookType:'xlsx'}),{type:'buffer',cellStyles:true});
 const item=rows(book,'Items by Price').find(r=>r.MRN==='000123');
 assert.equal(item.Item,'=SUM(A1:A2)');assert.equal(item["Price AUS"],0);
 assert.equal(rows(book,'Pricing Summary').find(r=>r['Price row ID']==='free')["Price SEA"],'');
 assert.ok(book.Sheets['Pricing Summary']['!autofilter']);
 const sheet=built.Sheets['Items by Price']; assert.ok(sheet.A6.s.font.bold);
 assert.ok(Object.values(book.Sheets['Items by Price']).filter(c=>c?.v==='=SUM(A1:A2)').every(c=>!c.f));
});
test('ambiguous pricing and modifier names are exceptions rather than invented parent links',()=>{
 const input=structuredClone(workspace);input.priceBook.push({...input.priceBook[0]});
 input.modifierGroups.push({id:'g2',name:'Extras',choices:[]});input.menus[0].items[0].modifierGroups=['Extras'];
 const book=buildPricingAuditWorkbook(input), issues=rows(book,'Exceptions');
 assert.ok(issues.some(r=>r.Issue==='Ambiguous price row'));
 assert.ok(issues.some(r=>r.Issue==='Unresolved modifier group'));
 assert.equal(rows(book,'Items by Price').find(r=>r.Item==='Burger')["Price SEA"],'');
});


test('modifier audit groups by price, then menu, then parent item',()=>{
 const input=structuredClone(workspace);
 input.menus[0].items.unshift({id:'z',name:'Zebra',priceSelectorId:'free',modifierGroups:['g']});
 input.menus.unshift({id:'a',name:'Alpha',items:[{id:'a2',name:'Second',modifierGroups:['g']},{id:'a1',name:'First',modifierGroups:['g']}]});
 const mods=rows(buildPricingAuditWorkbook(input),'Modifiers').filter(row=>row.Scope==='Menu attachment');
 assert.deepEqual(mods.map(row=>[row['Parent menu'],row['Parent item']]),[['Alpha','First'],['Alpha','Second'],['Main','Burger'],['Main','Other'],['Main','Zebra']]);
});

test('built-in free modifier pricing remains a valid zero-price choice',()=>{
 const input=structuredClone(workspace);
 input.modifierGroups[0].choices.push({id:'no-salt',label:'No salt',priceSelectorId:'ssmt-modifier-zero'});
 const book=buildPricingAuditWorkbook(input), row=rows(book,'Modifiers').find(r=>r.Modifier==='No salt');
 assert.equal(row['Link status'],'Built-in free modifier');assert.equal(row['Price SEA'],0);assert.equal(row['Price AUS'],0);
 assert.ok(!rows(book,'Exceptions').some(r=>r.Modifier==='No salt'));
});
