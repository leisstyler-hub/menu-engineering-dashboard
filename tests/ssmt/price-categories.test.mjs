import test from 'node:test';
import assert from 'node:assert/strict';
import { isLegacyGrillPrice, categoryPriceOptions } from '../../src/features/ssmt/ssmtPriceCategories.js';
const legacy = {id:'price-guide-2026-row-46',category:'Brunch Burger',areas:{SEA:'9.20'}};
const category = {id:'price-1-base-burger-w-side',category:'Base Burger w/ side',areas:{SEA:'11.25'}};
test('category choices exclude known individual grill rows but retain the current selection without mutation', () => {
 const book = [legacy,category]; const before = structuredClone(book);
 assert.deepEqual(categoryPriceOptions(book), [category]);
 assert.deepEqual(categoryPriceOptions(book,legacy.id), [legacy,category]);
 assert.deepEqual(book,before);
});
test('unrelated custom prices, deli categories and changed identities are preserved', () => {
 for (const row of [category,{...legacy,id:'custom-burger'},{...legacy,category:'New approved category'},{id:'price-guide-2026-row-82',category:'Deli Sandwich - Meat  No Side'}]) {
  assert.equal(isLegacyGrillPrice(row),false);
  assert.deepEqual(categoryPriceOptions([row]),[row]);
 }
 assert.equal(isLegacyGrillPrice(legacy),true);
 assert.equal(isLegacyGrillPrice({id:'price-guide-2026-row-40',category:'Chicken Chesapeake Sandwich'}),true);
});
