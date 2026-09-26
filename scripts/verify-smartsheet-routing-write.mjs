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
 assert.deepEqual(payload,[{toBottom:true,cells:[{columnId:1,value:"test cafe",strict:false},{columnId:2,objectValue:{objectType:"CONTACT",email:"tyler.leiss@compass-usa.com"}},{columnId:3,value:"",strict:false}]}]);

 const res2=response();
 await handler({method:"POST",query:{dataset:"cafe-tasting-routing"},body:{action:"addRoutingRoute",cafe:"multi cafe",chefContact:["a@compass-usa.com","b@compass-usa.com"],directorContact:["c@compass-usa.com"]}},res2);
 assert.equal(res2.statusCode,201);
 const payload2=JSON.parse(requests[3].options.body);
 assert.deepEqual(payload2[0].cells[1].objectValue,{objectType:"MULTI_CONTACT_LIST",values:[{objectType:"CONTACT",email:"a@compass-usa.com"},{objectType:"CONTACT",email:"b@compass-usa.com"}]});
 assert.deepEqual(payload2[0].cells[2].objectValue,{objectType:"CONTACT",email:"c@compass-usa.com"});

 globalThis.fetch=async(url,options={})=>{
  requests.push({url:String(url),options});
  if(options.method==="PUT") return new Response(JSON.stringify({result:[{id:77}]}),{status:200});
  return new Response(JSON.stringify({name:"Routing Table",columns:[{id:1,title:"Cafe"},{id:2,title:"Chef Contact"},{id:3,title:"Director Contact"}],rows:[{id:77,cells:[{columnId:1,value:"existing cafe"}]}]}),{status:200});
 };
 const updateRes=response();
 await handler({method:"POST",query:{dataset:"cafe-tasting-routing"},body:{action:"updateRoutingRoute",rowId:77,cafe:"existing cafe",chefContact:["newchef@compass-usa.com"],directorContact:["director@compass-usa.com"]}},updateRes);
 assert.equal(updateRes.statusCode,200);
 const updateRequest=requests.at(-1);
 assert.equal(updateRequest.options.method,"PUT");
 assert.deepEqual(JSON.parse(updateRequest.options.body),[{id:77,cells:[{columnId:1,value:"existing cafe",strict:false},{columnId:2,objectValue:{objectType:"CONTACT",email:"newchef@compass-usa.com"}},{columnId:3,objectValue:{objectType:"CONTACT",email:"director@compass-usa.com"}}]}]);

 const res3=response();
 await handler({method:"POST",query:{dataset:"cafe-tasting-routing"},body:{action:"addRoutingRoute",cafe:"bad cafe",chefContact:["not-an-email"],directorContact:[]}},res3);
 assert.equal(res3.statusCode,400);
 assert.deepEqual(res3.body.invalidEmails,["not-an-email"]);

 console.log("Cafe Tasting routing-table write verification passed.");
}finally{
 globalThis.fetch=originalFetch;
 if(originalEnv.token===undefined)delete process.env.SMARTSHEET_ACCESS_TOKEN;else process.env.SMARTSHEET_ACCESS_TOKEN=originalEnv.token;
 if(originalEnv.routing===undefined)delete process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID;else process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID=originalEnv.routing;
}
