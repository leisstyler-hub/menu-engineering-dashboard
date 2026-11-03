import {test} from 'node:test';
import assert from 'node:assert/strict';
import {estimatePans,portionCups} from '../src/features/menu-engineering/wpPanEstimate.js';
const source=[{mrn:'001.20',menu:'AMZ: Test',portion:'1/2 cup',massOz:'4.273',cost:'0.616'}];
const food={mrn:'001.20',menus:['AMZ: Test'],portion:'1/2 cup'};
test('food-specific source volume and weight estimate pan costs with unsold production retained',()=>{
 const r=estimatePans({panSize:'half',totalPans:'2'},food,source);
 assert.ok(Math.abs(r.servings-85.76)<1e-8);
 assert.ok(Math.abs(r.pounds-85.76*4.273/16)<1e-8);
 assert.ok(Math.abs(r.cost-85.76*.616)<1e-8);
});
test('MRNs preserve zeros and decimals; portion/membership/conflicts never guess',()=>{
 for(const changed of [{mrn:'1.2'},{menus:['Different']},{portion:'1 each'}])assert.equal(estimatePans({panSize:'half',totalPans:1},{...food,...changed},source).pounds,null);
 assert.equal(estimatePans({panSize:'half',totalPans:1},food,[...source,{...source[0],cost:'2'}]).cost,null);
 for(const totalPans of ['',0,-1,1.5,'Infinity'])assert.equal(estimatePans({panSize:'full',totalPans},food,source).pounds,null);
});
test('parse explicit volume only, mixed fractions and fluid units without mass guessing',()=>{
 assert.equal(portionCups('1/2 cup'),.5);assert.equal(portionCups('1 1/2 cups'),1.5);
 assert.equal(portionCups('2 tbsp'),.125);assert.equal(portionCups('4 fl oz'),.5);
 for(const p of ['4 oz','1 each','1 serving(s)','2 cups rice or 1 cup pasta'])assert.equal(portionCups(p),null);
});
