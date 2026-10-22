import assert from 'node:assert/strict';
import handler from '../api/recipe-library.js';
const oldFetch=globalThis.fetch;
const saved={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY};
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
async function read(){const headers={};let body;await handler({method:'GET',query:{scope:'all'}},{setHeader:(k,v)=>headers[k]=v,status:()=>({json:v=>body=v})});return {headers,body};}
try {
 globalThis.fetch=async()=>{throw Error('Simulated unavailable shared source')};
 const fallback=await read();assert.equal(fallback.body.source,'server-menuworks-json');assert.match(fallback.headers['Cache-Control'],/no-store/);
 for(const legacy of [false,true]){
  const calls=[];globalThis.fetch=async url=>{
   const u=new URL(url);calls.push(u);let rows=[];
   if(u.pathname.endsWith('/recipe_items'))rows=legacy?[{item_key:'test-key',menu:'AMZ: Test',mrn:'0001.10',display_name:'Rice',portion_oz:6.6}]:[{item_key:'test-key',source_system:'menuworks',source_payload:{menu:'AMZ: Test',mrn:'0001.10',item:'Rice',portionOz:6.6}}];
   return {ok:true,status:200,text:async()=>JSON.stringify(rows)};
  };
  const result=await read();assert.equal(result.body.source,'supabase-recipe-items');assert.equal(result.body.rows[0].mrn,'0001.10');assert.equal(result.body.rows[0].portionOz,6.6);
  const itemCalls=calls.filter(u=>u.pathname.endsWith('/recipe_items'));assert.equal(itemCalls.length,legacy?2:1);assert.equal(itemCalls[0].searchParams.get('select'),'item_key,source_row_id,source_system,source_payload');if(legacy)assert.equal(itemCalls[1].searchParams.get('select'),'*');
 }
 console.log('Recipe reads preserve exact fields, avoid duplicated payload columns, support legacy rows, and never cache fallbacks.');
}finally{globalThis.fetch=oldFetch;for(const [k,v]of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
