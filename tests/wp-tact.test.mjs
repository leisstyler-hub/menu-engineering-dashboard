import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tactProfile,TACT_VOCABULARY} from '../src/features/menu-engineering/wpTactProfile.js';
import {profileFor} from '../src/features/menu-engineering/wpSmartModel.js';
import {buildProfileManifest} from '../src/features/menu-engineering/wpProfileManifest.js';
import {buildMenuAnalysisSource} from '../src/features/menu-engineering/menuAnalysisSource.js';

test('unseen incoming foods get the same evidence-labeled TACT dimensions',()=>{
 const food={mrn:'0001.20',name:'Crispy smoky lemon chicken with red peppers'};
 const before=JSON.stringify(food),t=tactProfile(food);
 assert.deepEqual(t.taste.values,['Sour/Acidic','Umami']);
 assert.deepEqual(t.aroma.values,['Citrus','Smoky']);
 assert.deepEqual(t.color.values,['Red']);
 assert.deepEqual(t.texture.values,['Crisp/Crunchy']);
 for(const d of ['taste','aroma','color','texture']){assert.equal(t[d].status,'Proposed');assert.ok(t[d].evidence.length);}
 assert.equal(JSON.stringify(food),before);
 assert.deepEqual(profileFor(food).tact,t);
});
test('unknown and substring names do not invent sensory coverage',()=>{
 for(const name of ['Mystery dish','Cornbread with butterfly garnish']){
  const t=tactProfile({name});
  for(const d of ['taste','aroma','color','texture']){assert.deepEqual(t[d].values,[]);assert.equal(t[d].status,'Needs review');}
 }
});
test('legacy Reviewed does not certify new sensory fields',()=>{
 const t=tactProfile({name:'Creamy lemon rice',culinaryProfile:{reviewStatus:'Reviewed',flavors:['Bright'],textures:['Fresh']}});
 assert.equal(t.taste.status,'Proposed');assert.equal(t.texture.status,'Proposed');
});
test('reviewed sensory values including empty lists are preserved with provenance',()=>{
 const tact={version:1,taste:{values:[],status:'Reviewed',reviewer:'Chef',reviewedAt:'2026-11-06'},color:{values:['Purple'],status:'Reviewed',reviewer:'Chef',reviewedAt:'2026-11-06'}};
 const food={name:'Red lemon salad',culinaryProfile:{tact}},before=JSON.stringify(food),t=tactProfile(food);
 assert.deepEqual(t.taste.values,[]);assert.equal(t.taste.status,'Reviewed');assert.deepEqual(t.color.values,['Purple']);
 assert.equal(t.color.reviewer,'Chef');assert.equal(JSON.stringify(food),before);
});
test('reviewed unsupported tags remain visible with review required',()=>{
 const t=tactProfile({name:'Rice',culinaryProfile:{tact:{version:1,texture:{values:['Velvety'],status:'Reviewed'}}}});
 assert.deepEqual(t.texture.values,['Velvety']);assert.equal(t.texture.status,'Needs review');assert.ok(t.texture.issues.length);
 assert.ok(TACT_VOCABULARY.texture.includes('Creamy'));
});
test('intake accounts for every row, preserves exact MRNs and flags ambiguous identities',()=>{
 const rows=[{menu:'New menu',mrn:'001.20',portion:'1 cup',item:'Crispy lemon chicken'},
 {menu:'New menu',mrn:'001.20',portion:'1 cup',item:'Crispy lemon chicken'},
 {menu:'New menu',mrn:'001.2',portion:'2 cups',item:'Mystery dish'}];
 const before=JSON.stringify(rows),m=buildProfileManifest(rows,{source:'incoming menu',sourceSha256:'abc'});
 assert.equal(m.profiles.length,3);assert.equal(m.profiles[0].identity.mrn,'001.20');
 assert.match(m.profiles[0].identityStatus,/Ambiguous/);
 assert.equal(m.profiles[2].identity.mrn,'001.2');assert.equal(m.profiles[2].tact.taste.status,'Needs review');
 assert.equal(m.profiles[0].tact.taste.status,'Proposed');assert.equal(m.profiles[0].profileVersion,2);
 assert.equal(m.summary.rows,3);assert.equal(m.summary.tact.taste.proposed,2);
 assert.match(m.profiles[0].persistenceStatus,/Not written/);assert.equal(JSON.stringify(rows),before);
});
test('incoming exact identity carries reviewed profile from current catalog',()=>{
 const row={menu:'New menu',mrn:'001.20',portion:'1 cup',item:'Lemon rice'};
 const culinaryProfile={reviewStatus:'Reviewed',flavors:['Savory'],tact:{version:1,taste:{values:['Umami'],status:'Reviewed',reviewer:'Chef',reviewedAt:'2026-11-06'}}};
 const m=buildProfileManifest([row],{currentRows:[{...row,item_key:'exact',culinaryProfile}]});
 assert.deepEqual(m.profiles[0].flavor,['Savory']);assert.deepEqual(m.profiles[0].tact.taste.values,['Umami']);
 assert.equal(m.profiles[0].tact.taste.status,'Reviewed');assert.deepEqual(m.profiles[0].existingProfile,culinaryProfile);
 const conflict=buildProfileManifest([{...row,culinaryProfile:{reviewStatus:'Proposed'}}],{currentRows:[{...row,culinaryProfile}]});
 assert.equal(conflict.profiles[0].conflicts.length,1);assert.deepEqual(conflict.profiles[0].tact.taste.values,['Umami']);
});
test('menu source carries catalog sensory evidence and reviewed profile through analysis',()=>{
 const culinaryProfile={reviewStatus:'Reviewed',flavors:['Savory']};
 const rows=[{menu:'New menu',mrn:'001.20',portion:'1 cup',item:'Mystery dish',description:'Crispy and smoky',ingredients:['lemon'],culinaryProfile}];
 const source=buildMenuAnalysisSource('New menu',rows,{recipes:[]},true),dish=source.recipes[0];
 assert.equal(dish.description,'Crispy and smoky');assert.deepEqual(dish.culinaryProfile,culinaryProfile);
 assert.equal(profileFor(dish).tact.texture.values[0],'Crisp/Crunchy');
});
