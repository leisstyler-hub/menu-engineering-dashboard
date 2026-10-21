import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/ssmt.js';

test('recovery verifies the email token and active membership before changing password', async()=>{
 const oldEnv={...process.env}, oldFetch=globalThis.fetch;
 Object.assign(process.env,{SSMT_ACCOUNTS_ENABLED:'true',SSMT_APP_ORIGIN:'https://app.test',SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'isolated'});
 let revoked=false, expired=false;
 const calls=[];
 globalThis.fetch=async(url,options={})=>{
  calls.push({url,options});
  if(url.endsWith('/verify'))return {ok:!expired,status:expired?403:200,json:async()=>({access_token:'verified-token',expires_in:900})};
  if(url.endsWith('/user')&&options.method==='PUT')return {ok:true,json:async()=>({})};
  if(url.endsWith('/user'))return {ok:true,json:async()=>({id:'invited'})};
  if(url.includes('/ssmt_members?'))return {ok:true,json:async()=>[{user_id:'invited',active:!revoked,work_role:'Chef'}]};
  throw Error('Unexpected request');
 };
 const run=async(body)=>{
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};
  await handler({method:'POST',headers:{origin:'https://app.test'},body:{action:'exchange',tokenHash:'a'.repeat(64),type:'recovery',...body}},res);
  return res;
 };
 try{
  assert.equal((await run({tokenHash:'bad'})).code,400);assert.equal(calls.length,0);
  assert.equal((await run({type:'magiclink'})).code,400);assert.equal(calls.length,0);
  const res=await run({});assert.equal(res.code,200);assert.match(res.headers['Set-Cookie'],/HttpOnly; Secure/);
  assert.deepEqual(JSON.parse(calls[0].options.body),{token_hash:'a'.repeat(64),type:'recovery'});
  assert.equal(calls.some(c=>c.options.method==='PUT'),false);
  calls.length=0;revoked=true;assert.equal((await run({})).code,403);assert.equal(calls.some(c=>c.options.method==='PUT'),false);
  calls.length=0;revoked=false;expired=true;assert.equal((await run({})).code,401);assert.equal(calls.length,1);
 }finally{globalThis.fetch=oldFetch;for(const k of Object.keys(process.env))if(!(k in oldEnv))delete process.env[k];Object.assign(process.env,oldEnv);}
});
