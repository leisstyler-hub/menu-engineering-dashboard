import test from 'node:test';
import assert from 'node:assert/strict';
import XLSX from 'xlsx';
import {buildCentricExportWorkbook} from '../../src/features/ssmt/ssmtCentricExport.js';
import {activateDuePricing,resolveSsmtMenuPrices,resolveSsmtModifierPrices} from '../../src/features/ssmt/ssmtPricing.js';

const book=[{id:'burger',areas:{SEA:'$12.00',AUS:'$10.40',BNA:'$11.00'}}];
const menu={id:'complete',name:'Completed menu',phase:'IT complete',completedAt:'2026-10-01',items:[{id:'linked',label:'Burger',mrn:'000123',priceSelectorId:'burger',seaPrice:'$99.00',areaPrices:{SEA:'$99.00',AUS:'$99.00',BNA:'$99.00'},modifierGroups:['extras'],lockedForCentric:true},{id:'custom',label:'Custom',mrn:'000124',areaPrices:{SEA:'$8.00',AUS:'$7.00',BNA:'$6.00'}}]};
const groups=[{id:'extras',name:'Extras',choices:[{id:'cheese',label:'Cheese',priceSelectorId:'burger',price:'$99.00',areaPrices:{SEA:'$99.00',AUS:'$99.00',BNA:'$99.00'}}]}];
const rows=(wb,name)=>XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:''});
test('completed menu export resolves active linked item and modifier prices without changing saved information',()=>{
 const original=structuredClone({menu,groups,book});
 const wb=buildCentricExportWorkbook({selectedMenu:menu,modifierGroups:groups,priceBook:book,areaOrder:['SEA','AUS','BNA']});
 const items=rows(wb,'Items'),mods=rows(wb,'Modifiers');
 assert.equal(items[0].price,'12.00');
 assert.ok(Object.values(items[0]).includes('10.40'));
 assert.ok(Object.values(items[0]).includes('11.00'));
 assert.ok(Object.values(items[1]).includes('7.00'));
 assert.ok(Object.values(mods[0]).includes('10.40'));
 assert.deepEqual({menu,groups,book},original);
});

test('current edits resolve by exact ID across completed menus and modifiers, preserving custom prices and all source records',()=>{
 const source=structuredClone({menu,groups,book});
 const updated=structuredClone(book);updated[0].areas.AUS='$9.99';
 const result=resolveSsmtMenuPrices(menu,updated);
 assert.equal(result.items[0].areaPrices.AUS,'$9.99');
 assert.equal(result.items[0].areaPrices.BNA,'$11.00');
 assert.equal(result.items[0].mrn,'000123');
 assert.equal(result.items[0].lockedForCentric,true);
 assert.equal(result.phase,'IT complete');
 assert.equal(result.completedAt,'2026-10-01');
 assert.deepEqual(result.items[1],menu.items[1]);
 assert.equal(resolveSsmtModifierPrices(groups,updated)[0].choices[0].areaPrices.AUS,'$9.99');
 assert.deepEqual({menu,groups,book},source);
});

test('missing or ambiguous IDs and unlinked prices stay saved; explicit blank/zero areas stay authoritative',()=>{
 const unresolved={...menu,items:[{id:'unknown',priceSelectorId:'missing',areaPrices:{AUS:'$4.00'}},menu.items[0]]};
 assert.deepEqual(resolveSsmtMenuPrices(unresolved,[]),unresolved);
 assert.deepEqual(resolveSsmtMenuPrices(unresolved,[book[0],book[0]]),unresolved);
 const explicit=[{id:'burger',areas:{SEA:'',AUS:0,BNA:''}}];
 const item=resolveSsmtMenuPrices(menu,explicit).items[0];
 assert.equal(item.areaPrices.AUS,0);assert.equal(item.areaPrices.BNA,'');assert.equal(item.seaPrice,'');
 const wb=buildCentricExportWorkbook({selectedMenu:{...menu,items:[{...menu.items[0],price:'$99.00'}]},modifierGroups:groups,priceBook:explicit,areaOrder:['SEA','AUS','BNA']});
 const exported=rows(wb,'Items')[0];assert.equal(exported['$$AUS'],'0');assert.equal(exported['$$SEA'],'');assert.equal(exported.price,'');
});

test('planned prices remain inactive before their date and activate once, preserving old tables and menu snapshots',()=>{
 const future=structuredClone(book);future[0].areas.AUS='$15.00';
 const workspace={menus:[menu],modifierGroups:groups,priceBook:book,plannedPriceBook:{effectiveDate:'2026-12-01',priceBook:future},priceBookArchives:[{id:'older',priceBook:[]}]};
 const original=structuredClone(workspace);
 assert.equal(activateDuePricing(workspace,'2026-11-30'),workspace);
 assert.equal(resolveSsmtMenuPrices(menu,workspace.priceBook).items[0].areaPrices.AUS,'$10.40');
 const activated=activateDuePricing(workspace,'2026-12-01');
 assert.equal(resolveSsmtMenuPrices(activated.menus[0],activated.priceBook).items[0].areaPrices.AUS,'$15.00');
 assert.equal(resolveSsmtModifierPrices(activated.modifierGroups,activated.priceBook)[0].choices[0].areaPrices.AUS,'$15.00');
 assert.deepEqual(activated.priceBookArchives[1].priceBook,book);
 assert.deepEqual(activated.menus,workspace.menus);
 assert.deepEqual(activated.modifierGroups,workspace.modifierGroups);
 assert.equal(activateDuePricing(activated,'2026-12-02'),activated);
 assert.deepEqual(workspace,original);
});
