import assert from "node:assert/strict";
import handler from "../api/smartsheet/records.js";
const originalFetch=globalThis.fetch;
const originalEnv={token:process.env.SMARTSHEET_ACCESS_TOKEN,routing:process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID};
function response(){return{statusCode:200,headers:{},setHeader(name,value){this.headers[name]=value;},status(value){this.statusCode=value;return this;},json(value){this.body=value;return this;}};}
try{
 process.env.SMARTSHEET_ACCESS_TOKEN="test-token";
 process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID="routing-sheet";
 const requests=[];
 globalThis.fetch=async(url,options={})=>{
  requests.push({url:String(url),options});
  if(options.method==="POST") return new Response(JSON.stringify({result:[{id:99}]}),{status:200});
  return new Response(JSON.stringify({name:"Routing Table",columns:[{id:1,title:"Cafe"},{id:2,title:"Chef Contact"},{id:3,title:"Director Contact"}],rows:[]}),{status:200});
 };
 const res=response();
 await handler({method:"POST",query:{dataset:"cafe-tasting-routing"},body:{action:"addRoutingRoute",cafe:"test cafe",chefContact:"tyler.leiss@compass-usa.com",directorContact:""}},res);
 assert.equal(res.statusCode,201);
 assert.equal(res.body.rowId,99);
 assert.equal(requests.length,2);
 assert.equal(requests[1].url,"https://api.smartsheet.com/2.0/sheets/routing-sheet/rows");
 const payload=JSON.parse(requests[1].options.body);
 assert.deepEqual(payload,[{toBottom:true,cells:[{columnId:1,value:"test cafe",strict:false},{columnId:2,value:"tyler.leiss@compass-usa.com",strict:false},{columnId:3,value:"",strict:false}]}]);
 console.log("Cafe Tasting routing-table write verification passed.");
}finally{
 globalThis.fetch=originalFetch;
 if(originalEnv.token===undefined)delete process.env.SMARTSHEET_ACCESS_TOKEN;else process.env.SMARTSHEET_ACCESS_TOKEN=originalEnv.token;
 if(originalEnv.routing===undefined)delete process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID;else process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID=originalEnv.routing;
}
