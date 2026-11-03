import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/recipe-pairwise.js';
import {buildRecipePairwiseData} from '../src/features/menu-cross-utilization/recipePairwiseModel.js';
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.value=value;return this;}});
test('API refuses writes and missing configuration',async()=>{
 const old=process.env.SUPABASE_SERVICE_ROLE_KEY;delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 try {let res=response();await handler({method:'POST'},res);assert.equal(res.code,405);res=response();await handler({method:'GET'},res);assert.equal(res.code,503);}
 finally {if(old!==undefined)process.env.SUPABASE_SERVICE_ROLE_KEY=old;}
});
test('API projects only ingredient presence and fails closed on malformed upstream',async()=>{
 const old=global.fetch,key=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
 const data=buildRecipePairwiseData([{menu:'Andes',version:'fixture',validated:true,recipes:[{variantKey:'1',mrn:'1',ingredients:[{kind:'ingredient',name:'Carrots'}]}]}]);
 data.methods='secret';
 try {global.fetch=async()=>({ok:true,json:async()=>data});let res=response();await handler({method:'GET'},res);assert.equal(res.code,200);assert.ok(!JSON.stringify(res.value).includes('secret'));assert.match(res.headers['Cache-Control'],/no-store/);
 global.fetch=async()=>({ok:true,json:async()=>({manifest:'secret'})});res=response();await handler({method:'GET'},res);assert.equal(res.code,503);assert.ok(!JSON.stringify(res.value).includes('secret'));}
 finally{global.fetch=old;if(key===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=key;}
});
