import test from 'node:test';
import assert from 'node:assert/strict';
import * as workflow from '../../src/features/ssmt/ssmtWorkflow.js';
import {FOOD_TYPES, PROTEINS, noExperienceReviewNeeded} from '../../src/features/ssmt/ssmtReuse.js';
import {reviewState} from '../../src/features/ssmt/ssmtOpening.js';

test('Fish and baked goods retain approved FIXY codes',()=>{
  assert.equal(PROTEINS.FSH,'Fish');
  assert.equal(FOOD_TYPES.FSK,'Baked (Baked Goods)');
});
test('new blank MRNs require review',()=>assert.equal(reviewState({mrn:''}),'Needs review'));
test('renaming retains FIXY classification and exact MRN',()=>{
  const original={name:'OLD',label:'OLD',mrn:'0001.10',fohColumn:'R FBB | GRILL | OLD ENT BF'};
  assert.deepEqual(workflow.renameItem(original,'new name'),{...original,name:'NEW NAME',label:'NEW NAME',fohColumn:'R FBB | GRILL | NEW NAME ENT BF'});
  assert.equal(original.label,'OLD');
});
test('designation changes target one station and preserve malformed values',()=>{
  const menu={stations:[{id:'a',fixyDesignation:'OLD'},{id:'b',fixyDesignation:'OTHER'}],items:[{id:'1',stationId:'a',fohColumn:'R FBS | OLD | DISH ENT FSH'},{id:'2',stationId:'b',fohColumn:'legacy'}]};
  const changed=workflow.changeDesignation(menu,'new','a');
  assert.equal(changed.items[0].fohColumn,'R FBS | NEW | DISH ENT FSH');
  assert.equal(changed.items[1].fohColumn,'legacy');
  assert.equal(menu.stations[0].fixyDesignation,'OLD');
});
test('side choices copy exact MRNs and dietary suffixes at zero price',()=>{
  const rows=[{id:'1',label:'CHIPS',mrn:'0001.10',dietaryPreference:'Vegan',fohColumn:'R FSX | GRILL | CHIPS SNK'},{id:'2',label:'FRIES',mrn:'0002',dietaryPreference:'Vegetarian',fohColumn:'R FFF | GRILL | FRIES SNK'},{id:'3',label:'BURGER',mrn:'3',fohColumn:'R FBB | GRILL | BURGER ENT BF'},{id:'4',recordType:'divider',fohColumn:'R FFF | GRILL | SECTION SNK'}];
  const before=structuredClone(rows);
  const group=workflow.sidesModifierGroup(rows,['SEA','PDX']);
  assert.equal(group.modifierType,'Force'); assert.equal(group.name,'');
  assert.equal(group.minQty,''); assert.equal(group.maxQty,'');
  assert.deepEqual(group.choices.map(c=>[c.label,c.mrn,c.price,c.areaPrices]),[['chips (vn)','0001.10','0.00',{SEA:'0.00',PDX:'0.00'}],['fries (v)','0002','0.00',{SEA:'0.00',PDX:'0.00'}]]);
  assert.deepEqual(rows,before);
});
test('explicit Side category works before FIXY and explicit entree excludes snacks',()=>{
  assert.deepEqual(workflow.sideItems([{id:'side',secondaryCategory:'Side',fohColumn:''},{id:'entree',secondaryCategory:'Entrée',fohColumn:'R FSB | GRILL | BURRITO SNK'}]).map(i=>i.id),['side']);
});
test('cleared legacy imported MRN cannot show No Review Needed',()=>{
  assert.equal(noExperienceReviewNeeded({mrn:'',importSource:{menuId:'old',itemId:'old'}}),false);
});
test('Experience renaming preserves special Cafe Express 12 FO portion',()=>{
  assert.equal(workflow.renameItem({label:'SOUP',fohColumn:'R FSL | CAFE EXPRESS | SOUP 12 FO SNK'},'New soup').fohColumn,'R FSL | CAFE EXPRESS | NEW SOUP 12 FO SNK');
});
