import test from 'node:test';
import assert from 'node:assert/strict';
import * as pricing from '../../src/features/ssmt/ssmtPricing.js';

const workspace = () => ({
 priceBook:[{id:'used',areas:{SEA:'12.00'}},{id:'unused',areas:{SEA:'0.00'}}],
 menus:[{id:'history',hidden:true,phase:'IT complete',items:[{id:'a',mrn:'000123.10',priceSelectorId:'used',areaPrices:{SEA:'99.00'},modifierGroups:[{id:'inline',choices:[{id:'inline-choice',priceSelectorId:'used'}]}]},{id:'b',priceSelectorId:'used-extra'}]}],
 modifierGroups:[{id:'extras',choices:[{id:'choice',priceSelectorId:'used'},{id:'custom',price:'12.00'}]}],
 modifierClipboardSlots:[{group:{choices:[{id:'saved-choice',priceSelectorId:'used'}]}}],
 plannedPriceBook:{effectiveDate:'2026-12-01',priceBook:[{id:'unused',areas:{SEA:'4.00'}}]},
 priceBookArchives:[{id:'history',priceBook:[{id:'unused',areas:{SEA:'3.00'}}]}],
});

test('pricing usage counts exact links across historical menus, global and inline modifiers and clipboard',()=>{
 assert.equal(typeof pricing.priceRowUsage,'function');
 const data=workspace(),before=structuredClone(data);
 assert.deepEqual(pricing.priceRowUsage(data,'used'),{menuItems:1,modifierChoices:2,clipboardChoices:1,total:4,inPlannedBook:false});
 assert.deepEqual(pricing.priceRowUsage(data,'unused'),{menuItems:0,modifierChoices:0,clipboardChoices:0,total:0,inPlannedBook:true});
 assert.deepEqual(data,before);
});

test('unused row deletion preserves every menu, snapshot, planned table and archive, and never deletes used or ambiguous IDs',()=>{
 assert.equal(typeof pricing.deleteUnusedCurrentPriceRow,'function');
 const data=workspace(),before=structuredClone(data);
 assert.equal(pricing.deleteUnusedCurrentPriceRow(data,'used'),data);
 const next=pricing.deleteUnusedCurrentPriceRow(data,'unused');
 assert.deepEqual(next,{...data,priceBook:[data.priceBook[0]]});
 assert.equal(next.menus,data.menus);
 assert.equal(next.modifierGroups,data.modifierGroups);
 assert.equal(next.plannedPriceBook,data.plannedPriceBook);
 assert.equal(next.priceBookArchives,data.priceBookArchives);
 assert.equal(pricing.deleteUnusedCurrentPriceRow(data,'missing'),data);
 const duplicate={...data,priceBook:[...data.priceBook,data.priceBook[1]]};
 assert.equal(pricing.deleteUnusedCurrentPriceRow(duplicate,'unused'),duplicate);
 data.menus[0].items.push({id:'new-link',priceSelectorId:'unused'});
 assert.equal(pricing.deleteUnusedCurrentPriceRow(data,'unused'),data);
 assert.deepEqual(next.menus[0].items[0],before.menus[0].items[0]);
});
