import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectModifierType, resizeModifierGroup } from '../../src/features/ssmt/ssmtModifierDefaults.js';

const group = { name: 'Old', minQty: '1', maxQty: '1', choices: [
 { id: 'a', label:'sauce', description:'retain', price: '2.50', mrn: '0001.00', priceSelectorId:'linked', areaPrices:{SEA:'2.50',AUS:'',BOS:0}},
 { id: 'b', price: '', mrn:'', priceSelectorId:'', areaPrices:{SEA:'',AUS:'0.00'} },
 { id: 'c', price: 0, mrn:'0000', priceSelectorId:'', areaPrices:{SEA:0} },
] };
for (const type of ['Remove','Custom','Addition','Force']) test(`${type} selection preserves every existing choice value`,()=>{
 const original=structuredClone(group);
 const result=selectModifierType(group,type,'Burger',['SEA','AUS','BOS']);
 assert.deepEqual(result.choices,original.choices);
 assert.deepEqual(group,original);
 assert.equal(result.modifierType,type);
 assert.deepEqual(result,{...original,modifierType:type});
});
test('switching through every type and resizing cannot erase saved entries',()=>{
 let result=structuredClone(group);
 for(const type of ['Remove','Custom','Addition','Force','Remove']){
  result=resizeModifierGroup(selectModifierType(result,type,'Burger',['SEA','AUS']),['SEA','AUS']);
  assert.deepEqual(result.choices,group.choices);
 }
});
test('Remove resizing preserves unlinked prices and identifiers',()=>{
 const result=resizeModifierGroup({...group,modifierType:'Remove'},['SEA']);
 assert.deepEqual(result.choices,group.choices);
 assert.equal(result.maxQty,'3');
});

test('N/A is not a recipe identity for reuse lookup', async()=>{
 const {exactMrnMatches}=await import('../../src/features/ssmt/ssmtReuse.js');
 assert.deepEqual(exactMrnMatches(' N/A ',[{id:'source',phase:'IT complete',items:[{id:'i',mrn:'N/A'}]}],'target'),[]);
});
