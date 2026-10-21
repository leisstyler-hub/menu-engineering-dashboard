import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/ssmt.js';
test('reset reports provider failure instead of promising email and normalizes the submitted address',async()=>{
 const keys=['SSMT_ACCOUNTS_ENABLED','SSMT_APP_ORIGIN','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
 const old=Object.fromEntries(keys.map(k=>[k,process.env[k]])),original=globalThis.fetch;
 Object.assign(process.env,{SSMT_ACCOUNTS_ENABLED:'true',SSMT_APP_ORIGIN:'https://app.test',SUPABASE_URL:'https://provider.test',SUPABASE_SERVICE_ROLE_KEY:'isolated-key'});
 let sent;
 try {
  globalThis.fetch=async(url,options)=>{
   if(url.includes('/rest/v1/ssmt_members'))return new Response(JSON.stringify([{user_id:'isolated'}]),{status:200});
   sent=JSON.parse(options.body).email;
   return new Response(JSON.stringify({msg:'Email rate limit exceeded'}),{status:429});
  };
  const res={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}};
  await handler({method:'POST',headers:{origin:'https://app.test'},body:{action:'reset',email:'  CHEF@example.test  '}},res);
  assert.equal(sent,'chef@example.test');
  assert.equal(res.code,429);
  assert.equal(res.body.ok,false);
  assert.match(res.body.message,/temporarily unavailable|rate.limit/i);
 }finally{globalThis.fetch=original;for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k]}}
});
test('reset keeps unknown addresses generic without sending, and distinguishes provider outage from acceptance',async()=>{
 const keys=['SSMT_ACCOUNTS_ENABLED','SSMT_APP_ORIGIN','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
 const old=Object.fromEntries(keys.map(k=>[k,process.env[k]])),original=globalThis.fetch;
 Object.assign(process.env,{SSMT_ACCOUNTS_ENABLED:'true',SSMT_APP_ORIGIN:'https://app.test',SUPABASE_URL:'https://provider.test',SUPABASE_SERVICE_ROLE_KEY:'isolated-key'});
 try {
  for(const [registered,providerStatus,expected] of [[false,200,200],[true,503,503],[true,200,200]]){
   let sends=0;
   globalThis.fetch=async(url)=>{
    if(url.includes('/rest/v1/ssmt_members'))return new Response(JSON.stringify(registered?[{user_id:'isolated'}]:[]),{status:200});
    sends++;return new Response('{}',{status:providerStatus});
   };
   const res={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}};
   await handler({method:'POST',headers:{origin:'https://app.test'},body:{action:'reset',email:'chef@example.test'}},res);
   assert.equal(res.code,expected);assert.equal(sends,registered?1:0);
   if(expected===200)assert.match(res.body.message,/If the address is registered/);
  }
 }finally{globalThis.fetch=original;for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k]}}
});
