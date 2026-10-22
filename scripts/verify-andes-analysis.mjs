import assert from 'node:assert/strict';
import { measure, componentContribution, analyzeAndes } from '../src/features/menu-engineering/andesAnalysisModel.js';
assert.deepEqual(measure('3 qt, 3 cup'), {dimension:'volume',amount:720});
assert.deepEqual(measure('2 tbsp, 2-1/2 tsp'), {dimension:'volume',amount:8.5});
assert.equal(measure('a pinch'), null);
const child={id:'child',mrn:'0002.00',name:'Rice',portion:'1/4 cup',cost:2.05,massOz:null,components:[]};
const parent={id:'parent',mrn:'0001.00',name:'Chicken Sandwich',portion:'8 ounce',massOz:8,cost:1.52,batchServings:30,components:[{childId:'child',name:'Rice',quantity:'3/4 cup'}]};
assert.ok(Math.abs(componentContribution(parent,parent.components[0],child)-.205)<1e-12);
assert.equal(componentContribution(parent,{quantity:'1 lb'},child),null);
const result=analyzeAndes({recipes:[parent,child]},11.99);
assert.equal(result[0].economics,'Within 40%');
assert.ok(result[0].serviceReasons.some(x=>x.includes('Handheld')));
assert.equal(result[0].components[0].analysis.economics,'Needs weight');
assert.ok(Math.abs(result[0].remainder-1.315)<1e-12);
assert.equal(result[1].minimumOz,2.05/(11.99*.4)*16);
assert.equal(analyzeAndes({recipes:[parent,child]},0)[0].economics,'Needs price');
const cycle={...child,components:[{childId:'parent',quantity:'1 cup'}]};
assert.ok(analyzeAndes({recipes:[parent,cycle]},11.99)[0].components[0].analysis.components[0].analysis.issue);
console.log('Andes analysis guards passed: exact IDs, unit-safe contributions, independent economics, missing mass, cycle protection.');

// The published projection must contain analysis fields only, never recipe documents.
const { readFileSync } = await import('node:fs');
const projection=JSON.parse(readFileSync(new URL('../src/data/andesWpAnalysis.json',import.meta.url),'utf8'));
assert.deepEqual(Object.keys(projection).sort(),['basis','concept','recipes','sourceSha256']);
const recipeKeys=['batchServings','components','cost','id','massOz','mrn','name','portion','topLevel'];
for(const recipe of projection.recipes){
 assert.deepEqual(Object.keys(recipe).sort(),recipeKeys);
 assert.equal(typeof recipe.mrn,'string');
 for(const edge of recipe.components)assert.deepEqual(Object.keys(edge).sort(),['childId','mrn','name','quantity']);
}
assert.equal(projection.recipes.length,27);
assert.equal(new Set(projection.recipes.map(r=>r.mrn)).size,21);
assert.equal(analyzeAndes(projection,11.99).flatMap(r=>r.components).filter(c=>c.contribution==null).length,0);
console.log('Published analysis projection excludes source pages, instructions, credentials and document links.');

// Shared mass fills missing snapshot mass only for exact MRN and equivalent portion.
const rice={...child,topLevel:true};
const shared={menu:'AMZ: Andes',mrn:'0002.00',portion:'0.25 cup',portionOz:2.2,trueCost:99};
const reconciled=analyzeAndes({recipes:[rice]},11.99,[shared])[0];
assert.equal(reconciled.massOz,2.2);
assert.equal(reconciled.cost,2.05);
assert.equal(reconciled.weightSource,'Shared item data');
assert.equal(analyzeAndes({recipes:[rice]},11.99,[{...shared,portion:'1 cup'}])[0].massOz,null);
assert.equal(analyzeAndes({recipes:[rice]},11.99,[{...shared,mrn:'2'}])[0].massOz,null);
assert.equal(analyzeAndes({recipes:[rice]},11.99,[shared,{...shared,portionOz:3}])[0].massOz,null);
assert.equal(analyzeAndes({recipes:[rice]},11.99,[{...shared,menu:'Other'}])[0].massOz,null);
assert.equal(analyzeAndes({recipes:[parent]},11.99,[{...shared,mrn:parent.mrn,portion:'8 oz'}])[0].massOz,8);
console.log('Shared weight reconciliation guards passed.');
