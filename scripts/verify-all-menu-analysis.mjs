import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildMenuAnalysisSource} from '../src/features/menu-engineering/menuAnalysisSource.js';
import {refreshTransferCatalogCosts} from '../src/features/transfer-tool/transferStorage.js';
const rows=[{menu:'New Menu',mrn:'001.20',item:'New dish',portion:'1 cup',portionOz:6,trueCost:2},{menu:'New Menu',mrn:'12',item:'Purchased topping',portion:'1 oz',portionOz:1,trueCost:0.2}];
const library={recipes:[{id:'r',mrn:'001.20',name:'New dish',portion:'1 cup',cost:1.8,batchServings:4,components:[{childId:'c',mrn:'22',name:'Rice',quantity:'2 cup'}]},{id:'c',mrn:'22',name:'Rice',portion:'1 cup',cost:0.4,batchServings:10,components:[]}]};
const source=buildMenuAnalysisSource('New Menu',rows,library,true);
assert.equal(source.recipes.filter(r=>r.topLevel).length,2);
assert.equal(source.recipes.find(r=>r.topLevel&&r.mrn==='001.20').cost,1.8);
assert.equal(source.recipes.find(r=>r.topLevel&&r.mrn==='001.20').massOz,6);
assert.ok(source.recipes.some(r=>r.id==='c'&&!r.topLevel));
assert.match(source.recipes.find(r=>r.mrn==='12').linkStatus,/not linked/i);
const conflict=buildMenuAnalysisSource('New Menu',rows,{recipes:[...library.recipes,{...library.recipes[0],id:'different',cost:3}]},true);
assert.match(conflict.recipes.find(r=>r.topLevel&&r.mrn==='001.20').linkStatus,/ambiguous/i);
const before=JSON.stringify(rows);
globalThis.fetch=async()=>({ok:true,json:async()=>({ok:true,source:'supabase-recipe-items',rows})});
const catalog=await refreshTransferCatalogCosts([{id:'old',menu:'Old Menu'}]);
assert.equal(catalog.items.length,2);assert.equal(catalog.items[0].mrn,'001.20');assert.ok(!catalog.items.some(r=>r.id==='old'));assert.equal(JSON.stringify(rows),before);
globalThis.fetch=async()=>({ok:true,json:async()=>({ok:true,source:'supabase-recipe-items',rows:[rows[0],{...rows[0],trueCost:3},rows[0]]})});
assert.equal((await refreshTransferCatalogCosts()).items[0].itemWasteCost,null,'Repeated conflicts must stay unresolved');
globalThis.fetch=async()=>({ok:true,json:async()=>({ok:true,source:'server-menuworks-json',rows})});
await assert.rejects(()=>refreshTransferCatalogCosts(),/shared|Supabase/i);
const projection=JSON.parse(fs.readFileSync(new URL('../src/data/allMenusWpAnalysis.json',import.meta.url)));
assert.equal(projection.recipes.length,3838);
const fields=new Set(['id','mrn','name','portion','cost','massOz','batchServings','components']);
const projectedById=new Map(projection.recipes.map(r=>[r.id,r]));
for(const recipe of projection.recipes){
  assert.equal(typeof recipe.mrn,'string');
  for(const field of Object.keys(recipe))assert.ok(fields.has(field),'Unexpected published field '+field);
  for(const edge of recipe.components){
    assert.deepEqual(Object.keys(edge).sort(),['childId','mrn','name','quantity']);
    if(edge.childId)assert.equal(projectedById.get(edge.childId)?.mrn,edge.mrn);
  }
}
const gnocchi=projectedById.get('BOOK_1-page-2');
assert.equal(gnocchi.cost,1.36);assert.equal(gnocchi.batchServings,16);
assert.equal(gnocchi.components.find(e=>e.mrn==='192759').quantity,'1-1/2 cup');
assert.equal(projectedById.get('BOOK_1-page-855').cost,null,'Source explicitly withholds this cost');
console.log('Shared catalog and all-menu component guards passed');
