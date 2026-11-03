import {test} from 'node:test';
import assert from 'node:assert/strict';
import snapshot from '../../src/data/menuCrossUtilization.json' with {type:'json'};
import {isRetiredConcept} from '../../src/shared/conceptPillars.js';
import {pillarForMenu} from '../../src/features/menu-cross-utilization/menuCrossUtilizationModel.js';
import {selectorPillarMenus} from '../../src/features/menu-engineering/wpSelectorPillars.js';
import {pillarMenus,profileFor} from '../../src/features/menu-engineering/wpSmartModel.js';
import {buildRecipePairwiseData} from '../../src/features/menu-cross-utilization/recipePairwiseModel.js';
test('all known concepts have the same single pillar across Pairwise, W&P and proposed profiles',()=>{
 const names=[...snapshot.menus.filter(m=>!isRetiredConcept(m.name)).map(m=>m.name),'Balti Pilot','Cafe Express'];
 for(const name of names){
  const pillar=pillarForMenu(name);assert.ok(pillar,`unassigned ${name}`);
  const source=`AMZ+RA: ${name}`;
  assert.deepEqual(selectorPillarMenus(pillar.name,[source]),[source],name);
  assert.deepEqual(pillarMenus(pillar.name,[source]),[source],name);
  assert.deepEqual(profileFor({menus:[source]}).cuisines,[pillar.name],name);
  assert.equal(buildRecipePairwiseData([{menu:name,version:'test',validated:true,recipes:[]}]).menus[0].pillar,pillar.name);
 }
 assert.equal(pillarForMenu('Balti Pilot').name,pillarForMenu('Balti').name);
 assert.equal(pillarForMenu('Chickle').name,'American Grill & Smokehouse');
 assert.equal(pillarForMenu('Harvest Co.').name,'Core Stations Pillar');
 assert.equal(pillarForMenu('Cafe Express Soup').name,'Core Stations Pillar');
 for(const name of ['Bowl INC','Fresh Five','Global Grains','Q Bowl','Simmers','Smoothies'])assert.equal(pillarForMenu(name).name,'Core Stations Pillar');
 assert.equal(pillarForMenu('Andes-ish'),null);
});

test('retired concepts are excluded from active recipe projection and W&P selectors',()=>{
 const data=buildRecipePairwiseData([],{expectedMenus:['MTO Deli','WP Salad Bar','Pho']});
 assert.deepEqual(data.menus.map(m=>m.name),['Pho']);
 assert.deepEqual(selectorPillarMenus('Needs pillar assignment',['MTO Deli','WP Salad Bar']),[]);
});
