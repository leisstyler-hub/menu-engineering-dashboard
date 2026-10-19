import assert from 'node:assert/strict';
import { evaluateItem, evaluateMenus, pricePerLb } from '../src/features/menu-engineering/weighPayModel.js';
import { recipeTree, recipeGuidance } from '../src/features/menu-engineering/privateRecipeModel.js';
import handler from '../api/private-recipes.js';
const row = { menu: 'Prototype', mrn: '0001.1200', item: 'Rice', trueCost: 3, portionOz: 8 };
assert.equal(pricePerLb(.75, 'oz'), 12);
assert.equal(pricePerLb(12, 'lb'), 12);
assert.equal(pricePerLb(1e308, 'oz'), null);
for (const value of ['', 0, -1, 'bad', Infinity]) assert.equal(pricePerLb(value, 'lb'), null);
assert.equal(evaluateItem(row, null, { pricePerLb: 12 }).status, 'Blocked');
assert.equal(evaluateItem(row, null, { pricePerLb: 16 }).status, 'Allowed');
assert.equal(evaluateItem(row, null, { pricePerLb: 0 }).status, 'Needs price');
assert.equal(evaluateMenus([row], {}, { pricePerLb: 16 })[0].status, 'Pass');
const variants = [{ id:'parent', mrn:'0001.1200', recipe_name:'Chicken Sandwich', category:'Entree', serving_cost:3, serving_mass_oz:8, serving_size_text:'8 oz', reconciliation_status:'validated', serving_pan:null }, { id:'child', mrn:'0002.000', recipe_name:'Roast Chicken', category:'Entree', serving_cost:1, serving_mass_oz:4, reconciliation_status:'validated' }];
const edges = [{ parent_variant_id:'parent', child_variant_id:'child', component_name:'Chicken', source_quantity_text:'2 lb', position:1 }, { parent_variant_id:'child', child_variant_id:'parent', component_name:'Loop', position:1 }];
const tree = recipeTree('parent', variants, edges);
assert.equal(tree.components[0].recipe.components[0].recipe.issue, 'Cycle requires review');
assert.equal(tree.recipe.mrn, '0001.1200');
assert.equal(recipeGuidance(variants[0], 16).status, 'Blocked');
assert.equal(recipeGuidance(variants[1], 16).status, 'Allowed');
assert.equal(recipeGuidance({...variants[1],category:''},16).status,'Review');
assert.equal(recipeGuidance({...variants[1], reconciliation_status:'needs-review'}, 16).status, 'Review');
assert.equal(recipeTree('missing', variants, edges).issue, 'Recipe unavailable');
let requests = 0;
const originalFetch = global.fetch;
global.fetch = async () => { requests++; throw new Error('Unauthorized request touched storage'); };
const response = () => ({ headers:{}, setHeader(k,v){this.headers[k]=v;}, status(n){this.code=n;return this;}, json(v){this.body=v;return this;} });
try {
  delete process.env.PRIVATE_RECIPES_ENABLED;
  let res=response(); await handler({method:'GET',headers:{},query:{}},res);
  assert.equal(res.code,503); assert.equal(requests,0); assert.match(res.headers['Cache-Control'],/no-store/);
  process.env.PRIVATE_RECIPES_ENABLED='true';
  process.env.PRIVATE_RECIPE_VIEWER_IDS='test-user';
  res=response(); await handler({method:'GET',headers:{},query:{}},res);
  assert.equal(res.code,401); assert.equal(requests,0);
} finally { global.fetch=originalFetch; delete process.env.PRIVATE_RECIPES_ENABLED; delete process.env.PRIVATE_RECIPE_VIEWER_IDS; }
console.log('Prototype price, component isolation/cycles, exact MRN and denied-access checks passed.');

// The server verifies the token with Auth, then checks immutable user IDs.
const saved={...process.env};
process.env.PRIVATE_RECIPES_ENABLED='true';
process.env.PRIVATE_RECIPE_VIEWER_IDS='approved-id';
process.env.SUPABASE_URL='https://private-fixture.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service-key';
try {
 const calls=[];
 global.fetch=async(url,options)=>{calls.push(url);return {ok:true,json:async()=>({id:'other-id'})};};
 let res=response();await handler({method:'GET',headers:{authorization:'Bearer fixture.jwt'},query:{}},res);
 assert.equal(res.code,403);assert.equal(calls.length,1);assert.match(calls[0],/auth\/v1\/user$/);
 global.fetch=async()=>({ok:false});
 res=response();await handler({method:'GET',headers:{authorization:'Bearer forged.jwt'},query:{}},res);assert.equal(res.code,401);
 global.fetch=async(url)=>({ok:true,json:async()=>url.includes('/auth/')?{id:'approved-id'}:{variants:[],components:[],links:[]}});
 res=response();await handler({method:'GET',headers:{authorization:'Bearer valid.jwt'},query:{}},res);assert.equal(res.code,200);assert.deepEqual(res.body.variants,[]);
 global.fetch=async()=>({ok:true,json:async()=>({access_token:'not-for-this-user',user:{id:'other-id'}})});
 res=response();await handler({method:'POST',headers:{},body:{email:'fixture@example.test',password:'fixture'}},res);assert.equal(res.code,403);assert.equal(res.body.accessToken,undefined);
 global.fetch=async()=>{throw new Error('confidential upstream detail');};
 res=response();await handler({method:'GET',headers:{authorization:'Bearer valid.jwt'},query:{}},res);assert.equal(res.code,503);assert.ok(!JSON.stringify(res.body).includes('confidential upstream'));
 console.log('Verified identity, unapproved viewer, forged token, authorized read, login denial and error-redaction checks passed.');
} finally {
 global.fetch=originalFetch;
 for(const key of ['PRIVATE_RECIPES_ENABLED','PRIVATE_RECIPE_VIEWER_IDS','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']) {if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
}
const {buildWeighPayPackage}=await import('../src/features/menu-engineering/weighPayExport.js');
const JSZip=(await import('jszip')).default;
const packageMenus=evaluateMenus([row],{},{pricePerLb:16});
const blob=await buildWeighPayPackage(packageMenus,{pricePerLb:16,source:'synthetic',loadedAt:'fixture'});
const zip=await JSZip.loadAsync(await blob.arrayBuffer());
const snapshot=JSON.parse(await zip.file('calculation-snapshot.json').async('string'));
assert.equal(snapshot.pricePerLb,16);
assert.match(await zip.file('guidance-report.html').async('string'),/\$16\.000\/lb/);
await assert.rejects(()=>buildWeighPayPackage(packageMenus,{pricePerLb:12}),/does not match/);
console.log('Export rate and calculation consistency checks passed.');
