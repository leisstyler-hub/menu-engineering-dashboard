import test from "node:test";
import assert from "node:assert/strict";
import {identity,sessionExpiresAt} from "../../lib/ssmtServer.js";
test("verified expiry scheduling respects JWT and cookie caps without exposing tokens",()=>{
 const now=1000000;const token=`x.${Buffer.from(JSON.stringify({exp:(now+7200000)/1000})).toString("base64url")}.x`;
 assert.equal(Date.parse(sessionExpiresAt(token,3600,now)),now+3600000);assert.equal(Date.parse(sessionExpiresAt(token,900,now)),now+900000);
 const short=`x.${Buffer.from(JSON.stringify({exp:(now+300000)/1000})).toString("base64url")}.x`;assert.equal(Date.parse(sessionExpiresAt(short,3600,now)),now+300000);
});
test("authentication outage is not misreported as expired credentials",async()=>{
 const old=globalThis.fetch;const oldUrl=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SUPABASE_URL="https://isolated.test";process.env.SUPABASE_SERVICE_ROLE_KEY="fixture";
 try{globalThis.fetch=async()=>({ok:false,status:503,json:async()=>({})});await assert.rejects(identity({},"valid-token"),e=>e.statusCode===503);globalThis.fetch=async()=>({ok:false,status:401,json:async()=>({})});await assert.rejects(identity({},"valid-token"),e=>e.statusCode===401);}finally{globalThis.fetch=old;if(oldUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;}
});

test("save identity mismatch is rejected before workspace access or commit",async()=>{
 const {default:handler}=await import("../../api/ssmt.js");const old=globalThis.fetch;const saved={...process.env};Object.assign(process.env,{SSMT_ACCOUNTS_ENABLED:"true",SSMT_APP_ORIGIN:"https://app.test",SUPABASE_URL:"https://isolated.test",SUPABASE_SERVICE_ROLE_KEY:"fixture"});let workspaceCalls=0;
 globalThis.fetch=async url=>{if(String(url).endsWith("/auth/v1/user"))return {ok:true,json:async()=>({id:"other-user"})};if(String(url).includes("ssmt_members?"))return {ok:true,json:async()=>[{user_id:"other-user",active:true,work_role:"Chef",is_admin:false}]};workspaceCalls++;throw Error("Workspace must not be accessed");};
 try{for(const expectedIdentity of [{id:"original-user",role:"Chef",isAdmin:false},{id:"other-user",role:"IT",isAdmin:false},{id:"other-user",role:"Chef",isAdmin:true}]){const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};await handler({method:"POST",headers:{origin:"https://app.test",cookie:"__Host-ssmt=valid-token"},body:{action:"save",expectedIdentity,revision:"retained"}},res);assert.equal(res.code,403);assert.match(res.body.message,/original account/);}assert.equal(workspaceCalls,0);}finally{globalThis.fetch=old;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);}
});
