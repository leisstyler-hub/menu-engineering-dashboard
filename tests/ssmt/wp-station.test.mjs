import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectStation} from '../../src/features/menu-engineering/wpStationModel.js';
import {buildStationWorkbook} from '../../src/features/menu-engineering/wpStationExport.js';
const food={key:'mrn:0001.2',costPerLb:4,serviceReasons:[]};
test('prepared cost includes unsold food, revenue uses sell-through',()=>{
 const result=projectStation([{key:food.key,pounds:'10'}],[food],10,'80',true);
 assert.equal(result.cost,40);assert.equal(result.sales,80);assert.equal(result.foodCost,.5);assert.equal(result.contribution,40);
});
test('missing, conflicting, stale and untrusted inputs cannot produce complete economics',()=>{
 for(const [catalog,trusted] of [[[food],false],[[],true],[[{...food,costPerLb:null}],true],[[{...food,conflict:true}],true]]){
  const result=projectStation([{key:food.key,pounds:'10'}],catalog,10,'80',trusted);
  assert.equal(result.cost,null);assert.equal(result.foodCost,null);assert.equal(result.contribution,null);
 }
});
test('invalid quantities, zero sales and empty builds stay explicit',()=>{
 for(const pounds of ['','0','-1','Infinity','abc'])assert.equal(projectStation([{key:food.key,pounds}],[food],10,'80',true).cost,null);
 assert.equal(projectStation([],[food],10,'80',true).cost,null);
 const zero=projectStation([{key:food.key,pounds:'10'}],[food],10,'0',true);
 assert.equal(zero.sales,0);assert.equal(zero.foodCost,null);assert.equal(zero.contribution,-40);
 assert.equal(projectStation([{key:food.key,pounds:'10'}],[food],null,'80',true).sales,null);
 assert.equal(projectStation([{key:food.key,pounds:'10'}],[food],10,'101',true).sales,null);
});
test('service restrictions and approximate evidence survive aggregate economics',()=>{
 const result=projectStation([{key:food.key,pounds:'2'}],[{...food,weightApproximate:true,serviceReasons:['Culinary review']}],10,'100',true);
 assert.equal(result.cost,8);assert.equal(result.reviewCount,1);assert.equal(result.approximate,true);
});
test('workbook preserves exact MRNs as strings and unknown costs as incomplete',()=>{
 const row={...food,mrn:'0001.200',name:'Roasted carrots',menus:['A','B'],weightApproximate:true,serviceReasons:['Culinary review']};
 const result=projectStation([{key:food.key,pounds:'2'}],[row],10,'100',true);
 const workbook=buildStationWorkbook(result,{rate:10,sellThrough:'100',trusted:true});
 assert.equal(workbook.Sheets['Station selections'].B2.t,'s');assert.equal(workbook.Sheets['Station selections'].B2.v,'0001.200');
 assert.equal(workbook.Sheets['Station selections'].C2.v,'A; B');assert.equal(workbook.Sheets['Station selections'].H2.v,'Culinary review');
 const incomplete=buildStationWorkbook(projectStation([{key:food.key,pounds:'2'}],[{...row,costPerLb:null}],10,'100',true),{rate:10,sellThrough:'100',trusted:true});
 assert.equal(incomplete.Sheets['Station selections'].G2.v,'Incomplete');
});
