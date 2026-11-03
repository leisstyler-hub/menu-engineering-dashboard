import {test} from 'node:test';
import assert from 'node:assert/strict';
import {profileFor,suggestSpread} from '../src/features/menu-engineering/wpSmartModel.js';
import {estimatePans} from '../src/features/menu-engineering/wpPanEstimate.js';
import {projectStation} from '../src/features/menu-engineering/wpStationModel.js';
const food=(key,name,category='Vegetables')=>({key,mrn:key,name,category,portion:'1/2 cup',menus:['AMZ: Andes'],serviceReasons:[],cost:.5,massOz:4,costPerLb:2,foodCost:.2});
test('salad keywords beat ingredient cooking words and crunch never proves ambient',()=>{
 assert.deepEqual(profileFor(food('a','Roasted chicken crunch salad')).placements,['Cold']);
 assert.ok(!profileFor(food('b','Chili Herb Crunch')).placements.includes('Ambient'));
});
test('partial suggestions preserve unlocked selections and fractional display footprints',()=>{
 const a=food('a','Roasted carrots'),b=food('b','Steamed rice','Starches / grains');
 const entry={key:'a',name:a.name,placement:'Hot',quantityMode:'pan',panSize:'half',totalPans:'4'};
 const plan=suggestSpread([a,b],[entry],{hot:1,cold:0,ambient:0});
 assert.deepEqual(plan.entries[0],entry);assert.equal(plan.entries.length,2);assert.equal(plan.entries[1].panSize,'half');
});
test('source volume estimates servings without manufacturing weight',()=>{
 const f=food('a','Carrot salad');
 const r=estimatePans({panSize:'half',totalPans:1},f,[{mrn:'a',menu:'AMZ: Andes',portion:'1/2 cup',massOz:'',cost:.5}]);
 assert.equal(r.servings,42.88);assert.equal(r.pounds,null);assert.equal(r.cost,21.44);
});
test('count-based forecast uses compatible portion mass and cost',()=>{
 const f=food('a','Chicken salad');
 const p=projectStation([{key:'a',quantityMode:'portions',expectedPortions:'10'}],[f],10,100,true);
 assert.equal(p.rows[0].servings,10);assert.equal(p.pounds,2.5);assert.equal(p.cost,5);
});
import {scopePairwise} from '../src/features/menu-cross-utilization/pairwiseScope.js';
import {buildFlaggedAuditWorkbook} from '../src/features/menu-engineering/wpFlaggedAudit.js';
import XLSX from 'xlsx-js-style';
test('RA scope recomputes portfolio overlap and excludes hidden pairs without source mutation',()=>{
 const data={menus:[{name:'Andes',hasIngredientData:true,matchKeys:['a']},{name:'Oregano',hasIngredientData:true,matchKeys:['a']}],pairs:[{a:'Andes',b:'Oregano',overlapPercent:1}],pillars:[]};
 const scoped=scopePairwise(data,false);
 assert.equal(scoped.menus.length,1);assert.equal(scoped.pairs.length,0);assert.equal(scoped.menus[0].portfolio.sharedWithAny,0);
 assert.equal(scopePairwise(data,true).menus.length,2);assert.equal(data.menus.length,2);
});
test('audit default deduplicates compatible variants and retains source memberships',()=>{
 const f={...food('a','Carrot salad'),informationReasons:[]};
 const book=buildFlaggedAuditWorkbook([{menu:'AMZ: Andes',items:[f]},{menu:'AMZ: Balti',items:[f]}],{trusted:true});
 const rows=XLSX.utils.sheet_to_json(book.Sheets['Flagged Item Audit']);
 assert.equal(rows.length,1);assert.match(rows[0].Menu,/Andes/);assert.match(rows[0].Menu,/Balti/);assert.ok(book.Sheets['Audit summary']);
});
import {serviceProfile} from '../src/features/menu-engineering/wpServiceProfile.js';
test('reference range stays a range and never becomes a measured single weight',()=>{
 const f=food('a','Butter Chicken','Proteins');
 const p=projectStation([{key:'a',quantityMode:'pan',panSize:'full',totalPans:'2',useReference:true,referenceLow:'21.1875',referenceHigh:'24.75'}],[f],10,100,true);
 assert.deepEqual(p.rows[0].referenceRange,{low:42.375,high:49.5,basis:'Estimated using Butter Chicken reference'});assert.equal(p.pounds,null);assert.equal(p.rows[0].estimate?.servings,null);
});
test('reviewed ambient temperature conflict is surfaced rather than used in suggestions',()=>{
 const p=profileFor({...food('a','Chicken salad'),culinaryProfile:{reviewStatus:'Reviewed',placements:['Ambient']}});
 assert.equal(p.reviewStatus,'Needs review');assert.deepEqual(p.placements,[]);assert.ok(p.conflicts.length);
});
import {spreadProgress} from '../src/features/menu-engineering/wpSmartModel.js';
test('unknown individual service placement cannot mark spread complete or be suggested',()=>{
 const f=food('a','Mystery sandwich');
 const capacity={hot:0,cold:0,ambient:0,individual:1};
 assert.equal(spreadProgress([{key:'a',quantityMode:'portions'}],[f],capacity).complete,false);
 assert.equal(suggestSpread([f],[],capacity).entries.length,0);
});
test('warm salad needs explicit recipe service evidence',()=>{
 assert.deepEqual(serviceProfile(food('a','Warm roasted vegetable salad')).placements,[]);
});
import {buildPlanningPortfolio} from '../src/features/menu-engineering/wpPortfolioModel.js';
test('handheld planning keeps fixed-price food separate from W&P qualification',()=>{
 const f=food('s','Grilled chicken sandwich','Proteins');
 const rows=buildPlanningPortfolio([{menu:'AMZ: Andes',items:[],excluded:[f]}]);
 assert.equal(rows.length,1);assert.equal(rows[0].planningOnly,true);assert.equal(rows[0].portfolioStatus,'Service review');
 const p=projectStation([{key:rows[0].key,quantityMode:'portions',expectedPortions:'20'}],rows,10,100,true);
 assert.equal(p.cost,10);assert.equal(p.sales,null);
});
test('completion needs quantities and cannot hide unknown source records',()=>{
 const f=food('a','Chicken salad');const c={hot:0,cold:0,ambient:0,individual:1};
 assert.equal(spreadProgress([{key:'a',quantityMode:'portions',expectedPortions:''}],[f],c).complete,false);
 assert.equal(spreadProgress([{key:'a',quantityMode:'portions',expectedPortions:'20'}],[f],c).complete,true);
});
test('swap clears dish-specific reference assumptions',async()=>{
 const {applySwap}=await import('../src/features/menu-engineering/wpSmartModel.js');
 const e=applySwap([{key:'a',useReference:true,referenceLow:21,referenceHigh:25}], 'a',food('b','Chicken curry'))[0];
 assert.equal(e.useReference,false);
});
test('current catalog volume can estimate servings when no bundled index match exists',()=>{
 const f={...food('new','Carrot salad'),massOz:null};
 const r=estimatePans({panSize:'half',totalPans:1},f,[]);
 assert.equal(r.servings,42.88);assert.equal(r.pounds,null);assert.equal(r.cost,21.44);
});
test('invalid selected reference range does not silently revert to a source estimate',()=>{
 const f=food('a','Chicken curry','Proteins');
 const r=projectStation([{key:'a',quantityMode:'pan',panSize:'full',totalPans:'1',useReference:true,referenceLow:'30',referenceHigh:'20'}],[f],10,100,true);
 assert.equal(r.pounds,null);assert.equal(r.cost,null);assert.match(r.rows[0].estimate.reason,/reference range/i);
});
test('reviewed Hot conflicting with exact Cold recipe evidence needs review',()=>{
 const p=profileFor({mrn:'122252',name:'Aji Amarillo Dipping Sauce',menus:['AMZ: Andes'],portion:'1 floz',culinaryProfile:{reviewStatus:'Reviewed',placements:['Hot']}});
 assert.equal(p.reviewStatus,'Needs review');assert.deepEqual(p.placements,[]);assert.match(p.conflicts.join(' '),/recipe service evidence/);
});
import {buildWeighPayPackage} from '../src/features/menu-engineering/weighPayExport.js';
import JSZip from 'jszip';
test('export Tags preserve FC percentage formatting by column header',async()=>{
 const blob=await buildWeighPayPackage([],{pricePerLb:10,portfolioRows:[food('a','Roasted carrots')],trusted:true});
 const zip=await JSZip.loadAsync(await blob.arrayBuffer());const book=XLSX.read(await zip.file('data-audit.xlsx').async('uint8array'),{cellNF:true});
 for(const name of ['Servable Items','Portfolio']){const sheet=book.Sheets[name],headers=XLSX.utils.sheet_to_json(sheet,{header:1})[0];const c=headers.indexOf('FC%');assert.equal(sheet[XLSX.utils.encode_cell({r:1,c})].z,'0.0%');}
});
test('cooked vegetables and tofu cannot retain reviewed Ambient placement',()=>{
 for(const name of ['Roasted carrots','Steamed lentils','Grilled tofu']){
  const p=profileFor({...food('unknown',name),culinaryProfile:{reviewStatus:'Reviewed',placements:['Ambient']}});
  assert.equal(p.reviewStatus,'Needs review');assert.ok(!p.placements.includes('Ambient'));
 }
});
test('starting mix prioritizes two proteins, one premium, noodle and vegetable over sauces',()=>{
 const rows=[food('beef','Beef Bulgogi','Proteins'),food('chicken','Grilled chicken','Proteins'),food('noodle','Steamed noodles','Starches / grains'),food('rice','Steamed rice','Starches / grains'),food('veg','Roasted carrots'),food('sauce','Hot tomato sauce','Sauces / dressings')];
 const p=suggestSpread(rows,[],{hot:4,cold:0,ambient:0,individual:0});
 assert.deepEqual(new Set(p.entries.map(e=>e.key)),new Set(['beef','chicken','noodle','veg']));
});
test('named filled croissants use individual service and dessert is not a starting spread choice',()=>{
 assert.equal(serviceProfile(food('a','Turkey Bacon And Brie Croissant')).serviceFormat,'Individual');
 const p=suggestSpread([food('b','Mango Sticky Rice','Starches / grains')],[],{hot:1,cold:0,ambient:0});assert.equal(p.entries.length,0);
});
test('cold accompaniment cannot make a seared fish cold and filled clubs are individual',()=>{
 const f=food('f','Seared Herb Rockfish With Tomato Basil Vinaigrette','Sauces / dressings');
 const p=profileFor(f);assert.deepEqual(p.placements,['Hot']);assert.equal(p.role,'Proteins');assert.equal(p.premium,true);
 assert.equal(serviceProfile(food('c','Turkey Avocado Club')).serviceFormat,'Individual');
 assert.equal(profileFor(food('v','Roasted Cauliflower Steak')).premium,false);
});
test('recognized seafood without recipe evidence never retains Ambient',()=>{
 for(const name of ['Halibut','Tuna','Cod']){
  const f={...food('unknown',name,'Proteins'),culinaryProfile:{reviewStatus:'Reviewed',placements:['Ambient'],premium:true}};
  assert.deepEqual(profileFor(f).placements,[]);assert.equal(suggestSpread([f],[],{hot:0,cold:0,ambient:1}).entries.length,0);
 }
});
