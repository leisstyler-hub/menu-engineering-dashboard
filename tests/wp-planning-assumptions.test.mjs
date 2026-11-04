import {test} from 'node:test';
import assert from 'node:assert/strict';
import {estimatePans} from '../src/features/menu-engineering/wpPanEstimate.js';
test('explicit chef volume assumption estimates servings while leaving mass and economics unknown',()=>{
 const f={mrn:'a',menus:['Test'],portion:'4 oz',massOz:4,cost:.5};
 const r=estimatePans({panSize:'half',totalPans:1,assumedPortionCups:.5},f,[]);
 assert.equal(r.servings,42.88);assert.equal(r.pounds,null);assert.equal(r.cost,null);assert.match(r.basis,/assumption/i);
 assert.equal(estimatePans({panSize:'half',totalPans:1,assumedPortionCups:-1},f,[]).servings,null);
 assert.equal(estimatePans({panSize:'half',totalPans:1,assumedPortionCups:.5},{...f,conflict:true},[]).servings,null);
});
