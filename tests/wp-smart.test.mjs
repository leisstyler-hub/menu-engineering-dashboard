import {test} from 'node:test';
import assert from 'node:assert/strict';
import {profileFor, pillarMenus, suggestSpread, suggestSwaps, applySwap, entryPounds, capacityIssues} from '../src/features/menu-engineering/wpSmartModel.js';
import {projectStation} from '../src/features/menu-engineering/wpStationModel.js';
import {itemRestrictions} from '../src/features/menu-engineering/weighPayModel.js';
import {panReadyMenu} from '../src/features/menu-engineering/panReadyModel.js';
const food=(key,category,costPerLb,name=key)=>({key,mrn:key,name,category,costPerLb,menus:['AMZ: Andes'],serviceReasons:[],conflict:false,foodCost:costPerLb/11.2});
test('pillar selection matches bounded menu names and never guesses unknowns',()=>{
 assert.deepEqual(pillarMenus('Latin',['AMZ: Andes','AMZ: Balti','Andes-ish']),['AMZ: Andes']);
});
test('unknown profiles remain explicit and placements are proposals',()=>{
 const p=profileFor(food('unknown','Vegetables',2,'Mystery dish'));
 assert.equal(p.reviewStatus,'Proposed'); assert.deepEqual(p.placements,[]);
 assert.ok(!p.seasons.includes('Summer'));
});
test('pan quantities need a measured fill and valid whole counts',()=>{
 assert.equal(entryPounds({quantityMode:'pan',panSize:'half',openingPans:'2',reservePans:'2',fillLb:'3'}),12);
 for(const fillLb of ['',0,-2,'Infinity']) assert.equal(entryPounds({quantityMode:'pan',panSize:'half',openingPans:2,reservePans:0,fillLb}),null);
 assert.equal(entryPounds({quantityMode:'pan',panSize:'half',openingPans:1.5,reservePans:0,fillLb:3}),null);
 assert.equal(entryPounds({quantityMode:'pan',panSize:'unknown',openingPans:1,reservePans:0,fillLb:3}),null);
});
test('pan projection includes reserve and unsold cost',()=>{
 const rows=[food('a','Proteins',4)];
 const p=projectStation([{key:'a',quantityMode:'pan',panSize:'full',openingPans:1,reservePans:1,fillLb:5}],rows,10,80,true);
 assert.equal(p.pounds,10);assert.equal(p.cost,40);assert.equal(p.sales,80);assert.equal(p.foodCost,.5);
});
test('spread retains locks and offers category variety instead of cheap-only sorting',()=>{
 const foods=[food('premium','Proteins',8,'Beef Bulgogi'),food('v','Vegetables',2,'Roasted carrots'),food('s','Starches / grains',1,'Steamed rice'),food('v2','Vegetables',.5,'Roasted squash')];
 const plan=suggestSpread(foods,[{key:'premium',locked:true,pounds:'1'}],{hot:3,cold:0,ambient:0,season:'Fall'});
 assert.equal(plan.entries[0].key,'premium');assert.equal(plan.entries.length,3);
 assert.equal(new Set(plan.entries.map(e=>foods.find(f=>f.key===e.key).category)).size,3);
 assert.ok(plan.entries.slice(1).every(e=>e.pounds===''));
});
test('unknown placement does not silently fill equipment slots',()=>{
 assert.equal(suggestSpread([food('m','Vegetables',1,'Mystery')],[],{hot:3,cold:0,ambient:0}).entries.length,0);
});
test('swaps respect locks, exclude selected foods and reset food-specific fill weights',()=>{
 const a=food('a','Vegetables',8,'Roasted carrots'), b=food('b','Vegetables',2,'Roasted squash');
 const entries=[{key:'a',name:a.name,pounds:'5'}];
 const suggestions=suggestSwaps(entries,[a,b],{season:'Fall',rate:10,sellThrough:100,trusted:true});
 assert.equal(suggestions[0].to.key,'b');assert.equal(suggestions[0].before.foodCost,.8);assert.equal(suggestions[0].after.foodCost,.2);
 assert.equal(suggestSwaps([{...entries[0],locked:true}],[a,b],{}).length,0);
 assert.equal(suggestSwaps([...entries,{key:'b',pounds:'1'}],[a,b],{}).length,0);
 const replaced=applySwap([{...entries[0],quantityMode:'pan',fillLb:5,panSize:'half',placement:'Hot',placementConfirmed:true}], 'a',b);
 assert.equal(replaced[0].fillLb,'');assert.equal(replaced[0].placementConfirmed,false);
});
test('beef and seafood do not carry blanket exclusions',()=>{
 for(const name of ['Roasted Salmon','Beef Bulgogi','Ground Beef']) assert.deepEqual(itemRestrictions({item:name,servingRole:'pan-ready'}).reasons,[]);
 assert.ok(itemRestrictions({item:'Chicken Sandwich'}).reasons.length);
});
test('capacity counts opening pans, not reserves, and flags unknown bullet footprint',()=>{
 const e={placement:'Hot',quantityMode:'pan',panSize:'half',openingPans:4,reservePans:8};
 assert.equal(capacityIssues([e],{hot:2,cold:0,ambient:0}).length,0);
 assert.match(capacityIssues([e],{hot:1,cold:0,ambient:0})[0],/exceeds/);
 assert.match(capacityIssues([{...e,panSize:'bullet'}],{hot:10})[0],/footprint/);
});
test('invalid planning capacities do not build a misleading lineup',()=>{
 assert.equal(suggestSpread([food('a','Vegetables',1,'Roasted carrots')],[],{hot:1.5,cold:0,ambient:0}).entries.length,0);
});
test('locked multi-pan displays consume their full capacity before suggestions',()=>{
 const a=food('a','Proteins',4,'Grilled chicken'),b=food('b','Vegetables',1,'Roasted carrots');
 const p=suggestSpread([a,b],[{key:'a',name:a.name,locked:true,placement:'Hot',quantityMode:'pan',panSize:'full',openingPans:4,reservePans:0}],{hot:1,cold:0,ambient:0});
 assert.equal(p.entries.length,1);assert.ok(p.messages.some(m=>m.includes('exceeds')));
});
test('crunchy toppings can participate in proposed ambient spreads',()=>{
 const p=panReadyMenu({concept:'Kitchen',recipes:[{id:'crunch',mrn:'001.02',name:'Chili Herb Crunch',portion:'1 oz',cost:.1,massOz:1,components:[],topLevel:true}]},11.2);
 assert.equal(p.items.length,1);assert.equal(p.items[0].category,'Toppings / garnishes');assert.deepEqual(p.items[0].serviceReasons,[]);
});
