import test from 'node:test';
import assert from 'node:assert/strict';
import * as pricing from '../../src/features/ssmt/ssmtPricing.js';

test('reassign and delete moves exact links in all menus, shared/inline modifiers and clipboard while preserving identity and history',()=>{
 const linked={id:'i',mrn:'000123',description:'keep',priceSelectorId:'old',seaPrice:'$9.00',areaPrices:{SEA:'$9.00'},lockedForCentric:true};
 const group={id:'g',choices:[{...linked,price:'$9.00'}, {...linked,id:'other',priceSelectorId:'unrelated'}]};
 const w={menus:[{id:'hidden',hidden:true,phase:'IT complete',items:[{...linked,modifierGroups:[group,'shared']}]}],modifierGroups:[group],modifierClipboardSlots:[{id:'slot',group}],priceBook:[{id:'old',areas:{SEA:'$9.00'}},{id:'new',areas:{SEA:'$0.00',AUS:''}}],plannedPriceBook:{priceBook:[{id:'old'}]},priceBookArchives:[{priceBook:[{id:'old'}]}]};
 const original=structuredClone(w);const result=pricing.reassignAndDeleteCurrentPriceRow(w,'old','new');
 assert.equal(result.priceBook.length,1);assert.equal(pricing.priceRowUsage(result,'old').total,0);
 const item=result.menus[0].items[0];assert.equal(item.priceSelectorId,'new');assert.equal(item.seaPrice,'$0.00');assert.equal(item.areaPrices.AUS,'');assert.equal(item.mrn,'000123');assert.equal(item.description,'keep');assert.equal(item.lockedForCentric,true);
 for(const g of [item.modifierGroups[0],result.modifierGroups[0],result.modifierClipboardSlots[0].group]){assert.equal(g.choices[0].priceSelectorId,'new');assert.equal(g.choices[0].price,'$0.00');assert.deepEqual(g.choices[1],group.choices[1]);}
 assert.deepEqual(result.plannedPriceBook,w.plannedPriceBook);assert.deepEqual(result.priceBookArchives,w.priceBookArchives);assert.deepEqual(w,original);
});
test('invalid, same, missing and ambiguous row IDs cannot reassign or delete',()=>{
 const w={priceBook:[{id:'a'},{id:'b'}]};
 for(const [a,b] of [['a','a'],['a','missing'],['missing','b'],['a','']])assert.equal(pricing.reassignAndDeleteCurrentPriceRow(w,a,b),w);
 assert.equal(pricing.reassignAndDeleteCurrentPriceRow({...w,priceBook:[...w.priceBook,{id:'b'}]},'a','b').priceBook.length,3);
});

test('menu-item usage counts exact price links across active and hidden menus without counting modifier or clipboard copies',()=>{
 const w={menus:[{items:[{priceSelectorId:'a'},{priceSelectorId:'b'},{seaPrice:'$5.00'}]},{hidden:true,phase:'IT complete',items:[{priceSelectorId:'a'}]}],modifierGroups:[{choices:[{priceSelectorId:'a'}]}],modifierClipboardSlots:[{group:{choices:[{priceSelectorId:'a'}]}}]};
 assert.equal(pricing.priceRowUsage(w,'a').menuItems,2);
 assert.equal(pricing.priceRowUsage(w,'b').menuItems,1);
 assert.equal(pricing.priceRowUsage(w,'unused').menuItems,0);
});
