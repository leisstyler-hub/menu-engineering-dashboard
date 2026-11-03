import {test} from 'node:test';
import assert from 'node:assert/strict';
import snapshot from '../../src/data/menuCrossUtilization.json' with {type:'json'};
import {selectorPillarMenus,SELECTOR_PILLARS} from '../../src/features/menu-engineering/wpSelectorPillars.js';
test('selector resolves exact catalog aliases and Core Stations without editing Pairwise',()=>{
 const names=['AMZ+RA: Barbanzo','AMZ+RA: Paninoteca','AMZ: Harvest Co.','AMZ: Cafe Express Curated Salads','AMZ: Cafe Express Curated Sandwiches','AMZ: Cafe Express Soup','AMZ: Cafe Express','AMZ+RA: Chickle','AMZ: Andes-ish'];
 assert.deepEqual(selectorPillarMenus('Mediterranean & Middle Eastern',names),['AMZ+RA: Barbanzo']);
 assert.deepEqual(selectorPillarMenus('Italian',names),['AMZ+RA: Paninoteca']);
 assert.deepEqual(selectorPillarMenus('Core Stations Pillar',names),names.slice(2,7));
 assert.deepEqual(selectorPillarMenus('Cafe Express & Fresh',names),[]);
 assert.deepEqual(selectorPillarMenus('Needs pillar assignment',names),names.slice(7));
 assert.ok(SELECTOR_PILLARS.includes('Core Stations Pillar'));
 assert.ok(snapshot.pillars.some(p=>p.name==='Base Station Infrastructure'));
 assert.ok(snapshot.pillars.find(p=>p.name==='Cafe Express & Fresh').menus.includes('Harvest Co'));
});
