import assert from 'node:assert/strict';import fs from 'node:fs';import {analyzeAndes,measure} from '../src/features/menu-engineering/andesAnalysisModel.js';
const d=JSON.parse(fs.readFileSync(new URL('../src/data/baltiWpAnalysis.json',import.meta.url)));
assert.equal(d.concept,'AMZ: Balti');assert.equal(d.recipes.filter(r=>r.topLevel).length,45);assert.equal(d.recipes.length,251);
assert.deepEqual(measure('1 serving(s)'),{dimension:'serving',amount:1});
assert.notDeepEqual(measure('1 each'),measure('1 serving(s)'));
const a=analyzeAndes(d,11.99);assert.equal(a.filter(r=>r.topLevel&&!r.massOz).length,0);
for(const r of a){assert.equal(typeof r.mrn,'string');assert.ok(Number.isFinite(r.cost));assert.ok(!('text' in r));for(const e of r.components)assert.ok(d.recipes.some(c=>c.id===e.childId));}
assert.equal(a.find(r=>r.mrn==='212486.1').weightSource,'Supplied item index');
console.log('Balti projection guards passed: 45 complete dishes, exact MRNs, 251 source variants, independent component economics, private source excluded.');

const allowed=new Set(['id','mrn','name','portion','massOz','cost','batchServings','topLevel','components','massBasis']);
for(const r of d.recipes){for(const k of Object.keys(r))assert.ok(allowed.has(k),'Unexpected published field '+k);for(const e of r.components)assert.deepEqual(Object.keys(e).sort(),['childId','mrn','name','quantity']);}
