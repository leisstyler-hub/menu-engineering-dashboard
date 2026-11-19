import test from "node:test";
import assert from "node:assert/strict";
import {ssmtRequest} from "../../src/features/ssmt/ssmtClient.js";
test("a late expired response cannot relock a newly authenticated session",async()=>{
 const oldFetch=globalThis.fetch,oldWindow=globalThis.window;const events=[];globalThis.window={dispatchEvent:event=>events.push(event.type)};let finish;
 globalThis.fetch=async url=>{if(String(url).includes("action=session"))return new Promise(resolve=>{finish=()=>resolve({ok:false,status:401,json:async()=>({ok:false,message:"expired"})});});return {ok:true,status:200,json:async()=>({ok:true,member:{id:"same"}})};};
 try{const pending=ssmtRequest("session");await ssmtRequest("login",{email:"fixture@example.test",password:"fixture"});finish();await assert.rejects(pending);assert.deepEqual(events,[]);}finally{globalThis.fetch=oldFetch;if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;}
});

test("malformed or unacknowledged HTTP200 is never a successful save",async()=>{
 const old=globalThis.fetch;try{for(const data of [null,{},"<html>login</html>"]){globalThis.fetch=async()=>({ok:true,status:200,json:async()=>data});await assert.rejects(ssmtRequest("save",{}));}globalThis.fetch=async()=>({ok:true,status:200,json:async()=>{throw Error("invalid JSON");}});await assert.rejects(ssmtRequest("save",{}));}finally{globalThis.fetch=old;}
});
test("account save requires a nonempty revision acknowledgment",async()=>{
 const {saveSsmtWorkspaceToSharedStorage}=await import("../../src/features/ssmt/ssmtWorkspaceStorage.js");const old=globalThis.fetch;try{for(const revision of [undefined,null,""]){globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({ok:true,revision})});await assert.rejects(saveSsmtWorkspaceToSharedStorage({},{accounts:true,revision:"original"}),/revision/);}}finally{globalThis.fetch=old;}
});
