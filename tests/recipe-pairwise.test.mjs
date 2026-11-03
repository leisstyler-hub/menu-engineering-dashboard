import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecipePairwiseData, projectRecipePresence } from '../src/features/menu-cross-utilization/recipePairwiseModel.js';
const book=(menu,recipes)=>({menu,version:'fixture',validated:true,recipes});
const leaf=(name,sourceCode=null)=>({name,sourceCode,kind:'ingredient'});
const recipe=(mrn,ingredients)=>({mrn,variantKey:mrn,ingredients,isSubrecipe:false});
test('exact recipe names bridge coded and uncoded rows without MIT claims',()=>{
 const data=buildRecipePairwiseData([book('Andes',[recipe('1',[leaf('Carrots, Fresh','100'),leaf('Carrots, Fresh'),leaf('Celery, Fresh')])]),book('Balti',[recipe('2',[leaf('carrots fresh'),leaf('Tofu, Firm')])])]);
 assert.equal(data.pairs[0].sharedCount,1);assert.equal(data.pairs[0].overlapPercent,1/3);
 assert.ok(data.menus.every(m=>m.matchKeys.every(k=>k.startsWith('recipe-name:'))));
});
test('expands subrecipes; missing and cyclic dependencies stay unscored',()=>{
 const child=recipe('2',[leaf('Carrots, Fresh')]);child.isSubrecipe=true;
 const data=buildRecipePairwiseData([book('Andes',[recipe('1',[{kind:'subrecipe',childVariantKeys:['2']}]),child]),book('Balti',[recipe('3',[{kind:'subrecipe',childVariantKeys:['missing']}])])]);
 assert.equal(data.menus[0].hasIngredientData,true);assert.equal(data.menus[1].hasIngredientData,false);assert.equal(data.pairs.length,0);
 const cyclic=buildRecipePairwiseData([book('Andes',[recipe('1',[{kind:'subrecipe',childVariantKeys:['1']}])])]);assert.equal(cyclic.menus[0].hasIngredientData,false);
});
test('unvalidated source cannot score; pantry rules keep distinctive variants',()=>{
 const source=book('Andes',[recipe('1',[leaf('Salt, Kosher'),leaf('Water'),leaf('Canola Frying Oil, Frilite'),leaf('Whole Black Pepper'),leaf('Oil, Sesame'),leaf('Black Pepper Sauce')])]);
 assert.equal(buildRecipePairwiseData([source]).menus[0].matchKeys.length,2);
 source.validated=false;assert.equal(buildRecipePairwiseData([source]).menus[0].hasIngredientData,false);
});
test('public projection allowlists fields and rejects incompatible key namespaces',()=>{
 const data=buildRecipePairwiseData([book('Andes',[recipe('1',[leaf('Carrots')])])]);
 data.privateManifest={method:'secret',source_path:'private.pdf'};data.menus[0].quantityText='2 cups';
 const projected=projectRecipePresence(data);assert.ok(!JSON.stringify(projected).includes('secret'));assert.ok(!JSON.stringify(projected).includes('quantityText'));
 assert.throws(()=>projectRecipePresence({...data,menus:[{...data.menus[0],matchKeys:['mit:123']}]}));
});
test('repeated child variants may resolve for presence only when their leaf sets agree',()=>{
 const a=recipe('2a',[leaf('Carrots')]);a.isSubrecipe=true;
 const b=recipe('2b',[leaf('Carrots'),leaf('Carrots')]);b.isSubrecipe=true;
 const root=recipe('1',[{kind:'subrecipe',childVariantKeys:['2a','2b']}]);
 assert.equal(buildRecipePairwiseData([book('Andes',[root,a,b])]).menus[0].hasIngredientData,true);
 b.ingredients.push(leaf('Celery'));
 assert.equal(buildRecipePairwiseData([book('Andes',[root,a,b])]).menus[0].hasIngredientData,false);
});
test('missing packets stay visible and public provenance and bounded reasons survive projection',()=>{
 const source=book('Breakfast',[recipe('1',[leaf('Carrots')])]);source.validated=false;source.menuScopeConflict=true;source.reportDateRaw='11/03/2026';
 const data=projectRecipePresence(buildRecipePairwiseData([source],{expectedMenus:['Breakfast','Pho']}));
 assert.equal(data.menus.length,2);assert.equal(data.menus[0].reasonCodes[0],'source-menu-conflict');assert.equal(data.menus[1].coverageStatus,'No supplied packet');
 assert.deepEqual(data.menus[0].versions,['fixture']);assert.deepEqual(data.menus[0].reportDates,['11/03/2026']);assert.equal(data.releaseVersion,'local-candidate');
});
test('projection rejects duplicate menus, incompatible coverage, and arbitrary reason text',()=>{
 const data=buildRecipePairwiseData([book('Andes',[recipe('1',[leaf('Carrots')])])]);
 assert.throws(()=>projectRecipePresence({...data,menus:[data.menus[0],data.menus[0]]}));
 assert.throws(()=>projectRecipePresence({...data,menus:[{...data.menus[0],coverageStatus:'Not verified'}]}));
 assert.throws(()=>projectRecipePresence({...data,menus:[{...data.menus[0],reasonCodes:['private method text']}]}));
});
test('runtime reapplies pantry exclusions before recomputing stored release scores',()=>{
 const data=buildRecipePairwiseData([book('Andes',[recipe('1',[leaf('Carrots')])])]);
 data.menus[0].matchKeys.push('recipe-name:salt');data.ingredientLabels['recipe-name:salt']='Salt';
 const projected=projectRecipePresence(data);assert.deepEqual(projected.menus[0].matchKeys,['recipe-name:carrots']);
});
