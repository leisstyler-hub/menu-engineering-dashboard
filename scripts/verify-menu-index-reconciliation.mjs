import assert from 'node:assert/strict';
import { reconcileMenuIndex } from '../src/features/recipe-database/menuIndexReconciliation.js';
const raw=(menu,mrn,name,extra={})=>({'Menu Name':menu,'Recipe Number':mrn,'Recipe Name':name,'Short Name':name,'Menu Portion Size':'1 cup','Menu Portion Weight(oz)':'6','Sell Price':'$3','Menu Item Cost':'$1',...extra});
const before=[{menu:'AMZ: Test',mrn:'001.11',item:'Salad',recipeName:'Salad',portion:'1 cup',portionOz:5,trueCost:1,enticingDescription:'Curated'},{menu:'AMZ: Test',mrn:'2',item:'Rice',recipeName:'Rice',portion:'1 cup',portionOz:5,trueCost:1},{menu:'AMZ: Test',mrn:'3',item:'Gone'}];
const r=reconcileMenuIndex([raw('AMZ: Test',"'001.111",'Salad'),raw('Combined',"'2",'Rice',{'Menu Item Cost':'Combined','Sell Price':'Combined'}),raw('Combined',"'4",'New')],before);
assert.equal(r.rows.length,2);assert.equal(r.rows[0].mrn,'001.111');assert.equal(r.rows[0].enticingDescription,'Curated');assert.equal(r.rows[1].trueCost,1);assert.equal(r.rows[1].portionOz,6);assert.equal(r.unplaced.length,1);assert.equal(r.removed.length,1);assert.equal(r.mrnChanges.length,1);
assert.throws(()=>reconcileMenuIndex([raw('AMZ: Test',"'2",'Rice'),raw('AMZ: Test',"'2",'Rice',{'Menu Portion Weight(oz)':'7'})],before),/conflict/i);
console.log('Menu index reconciliation guards passed.');

const variants=reconcileMenuIndex([raw('AMZ: Test',"'2",'Rice',{'Menu Item Notes':'A La Carte','Sell Price':'$3'}),raw('AMZ: Test',"'2",'Rice',{'Menu Item Notes':'Entree with side','Sell Price':'$8'})],before);assert.equal(variants.rows.length,2);assert.deepEqual(variants.rows.map(r=>r.price),[3,8]);
