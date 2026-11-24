import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/ssmt.js';
test('admin resend uses stored active recipient and never changes membership or workspace',async()=>{
 const env={...process.env},oldFetch=globalThis.fetch;
 Object.assign(process.env,{SSMT_ACCOUNTS_ENABLED:'true',SSMT_APP_ORIGIN:'https://app.test',SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'isolated'});
 const target='22222222-2222-4222-8222-222222222222';let admin=true,active=true,code='',status=200;const writes=[];
 globalThis.fetch=async(url,opts={})=>{
  if(opts.method==='POST') {writes.push({url,body:JSON.parse(opts.body)});return {ok:status===200,status,json:async()=>({code})};}
  if(url.endsWith('/user'))return {ok:true,json:async()=>({id:'actor'})};
  if(url.includes('user_id=eq.actor'))return {ok:true,json:async()=>[{user_id:'actor',active:true,is_admin:admin}]};
  if(url.includes('user_id=eq.'+target))return {ok:true,json:async()=>[{user_id:target,email:'stored@example.test',active}]};
  throw Error('Unexpected request '+url);
 };
 const run=async(body={},origin='https://app.test')=>{const r={setHeader(){},status(c){this.code=c;return this;},json(b){this.body=b;return this;}};await handler({method:'POST',headers:{origin,cookie:'__Host-ssmt=token'},body:{action:'resend',userId:target,email:'injected@example.test',...body}},r);return r;};
 try{
  assert.equal((await run()).code,200);assert.equal(writes.length,1);assert.match(writes[0].url,/recover\?redirect_to=/);assert.deepEqual(writes[0].body,{email:'stored@example.test'});
  writes.length=0;admin=false;assert.equal((await run()).code,403);assert.equal(writes.length,0);
  admin=true;active=false;assert.equal((await run()).code,409);assert.equal(writes.length,0);
  active=true;assert.equal((await run({userId:'bad'})).code,400);assert.equal(writes.length,0);
  assert.equal((await run({},'https://evil.test')).code,403);assert.equal(writes.length,0);
  status=429;code='over_email_send_rate_limit';let r=await run();assert.equal(r.code,429);assert.match(r.body.message,/email service.*limit/i);
  code='over_request_rate_limit';r=await run();assert.equal(r.code,429);assert.match(r.body.message,/wait/i);
  status=500;r=await run();assert.equal(r.code,503);assert.match(r.body.message,/unavailable/i);
 }finally{globalThis.fetch=oldFetch;for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);}
});
