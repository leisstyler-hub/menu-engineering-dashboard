import test from "node:test";
import assert from "node:assert/strict";
import handler from "../../api/ssmt.js";
import {revision,unpack} from "../../lib/ssmtServer.js";
import {menuRevision} from "../../src/features/ssmt/ssmtOpening.js";
test("authenticated baseline and approvals preserve data and reject forged ordinary saves",async()=>{
 const keys=["SSMT_ACCOUNTS_ENABLED","SSMT_APP_ORIGIN","SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"];
 const old=keys.map(k=>process.env[k]);const originalFetch=globalThis.fetch;
 Object.assign(process.env,{SSMT_ACCOUNTS_ENABLED:"true",SSMT_APP_ORIGIN:"https://app.test",SUPABASE_URL:"https://example.test",SUPABASE_SERVICE_ROLE_KEY:"fixture"});
 const row={id:"i",mrn:"00042.10",description:"Keep exactly",calories:"540",fohColumn:"R FBB | GRILL | BURGER ENT BF",modifierGroups:[]};
 let payload={menus:[{id:"core",name:"Core",type:"Core",phase:"IT complete",items:[row]},{id:"winter",name:"Winter Promo",type:"Promotion",phase:"Culinary draft",items:[{...row,id:"winter-item"}]}],modifierGroups:[],priceBook:[{id:"p",areas:{SEA:"$5.00"}}],unknownHistory:{keep:["old"]}};
 const initial=structuredClone(payload);let admin=false,role="Chef",commits=[];
 globalThis.fetch=async(url,options={})=>{
 const path=String(url);let data;
 if(path.endsWith("/auth/v1/user"))data={id:"actor"};
 else if(path.includes("/ssmt_members?"))data=[{user_id:"actor",email:"actor@example.test",display_name:"Verified",active:true,is_admin:admin,work_role:role}];
 else if(path.includes("/app_records?"))data=[{record_payload:payload}];
 else if(path.includes("/rpc/ssmt_commit_workspace")){const args=JSON.parse(options.body);assert.deepEqual(args.p_expected,payload);commits.push(args);payload=args.p_next;data=null;}
 else throw new Error(`Unexpected fixture URL ${path}`);
 return {ok:true,status:200,json:async()=>data};
 };
 const act=async(body)=>{const res={setHeader(){},status(code){this.code=code;return this;},json(data){this.body=data;return this;}};await handler({method:"POST",headers:{origin:"https://app.test",cookie:"__Host-ssmt=fixture.token"},body},res);return res;};
 try {
  assert.equal((await act({action:"approve",menuId:"core",revision:revision(payload)})).code,403);
  admin=true;
  assert.equal((await act({action:"review-baseline",excludedMenuId:"bad",confirm:"INITIALIZE REVIEW BASELINE",revision:revision(payload)})).code,400);
  assert.equal(commits.length,0);
  let result=await act({action:"review-baseline",excludedMenuId:"winter",confirm:"INITIALIZE REVIEW BASELINE",revision:revision(payload)});
  assert.equal(result.code,200);const baseline=unpack(payload);
  assert.equal(baseline.menus[0].items[0].reviewBasis.source,"baseline");assert.equal(baseline.menus[1].items[0].reviewBasis.source,"new");
  for(let i=0;i<initial.menus.length;i++){const {reviewBasis,...unchanged}=baseline.menus[i].items[0];assert.deepEqual(unchanged,initial.menus[i].items[0]);}
  assert.deepEqual(baseline.unknownHistory,initial.unknownHistory);assert.deepEqual(baseline.priceBook,initial.priceBook);
  assert.equal((await act({action:"review-baseline",excludedMenuId:"winter",confirm:"INITIALIZE REVIEW BASELINE",revision:revision(payload)})).code,400);
  let forged=structuredClone(baseline);delete forged.reviewBaseline;
  assert.equal((await act({action:"save",workspace:forged,revision:revision(payload)})).code,403);
  forged=structuredClone(baseline);forged.menus[1].phase="Experience review";
  assert.equal((await act({action:"save",workspace:forged,revision:revision(payload)})).code,403);
  forged=structuredClone(baseline);forged.menus[1].stations=[{id:"s",globalMenus:[{menuId:"invented",revision:"invented",items:[{...row,mrn:"forged"}]}]}];
  assert.equal((await act({action:"save",workspace:forged,revision:revision(payload)})).code,403);
  assert.equal((await act({action:"approve",menuId:"core",revision:"stale"})).code,409);
  result=await act({action:"approve",menuId:"core",revision:revision(payload),actorId:"forged"});assert.equal(result.code,200);
  assert.equal(result.body.approvals[0].actorId,"actor");assert.equal(result.body.approvals[0].revision,menuRevision(baseline.menus[0],baseline.modifierGroups));
  assert.equal(commits.length,2);
 }finally{globalThis.fetch=originalFetch;keys.forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);}
});
