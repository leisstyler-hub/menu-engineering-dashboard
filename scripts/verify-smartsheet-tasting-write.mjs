import assert from "node:assert/strict";
import handler from "../api/smartsheet/records.js";
const originalFetch=globalThis.fetch; const originalEnv={token:process.env.SMARTSHEET_ACCESS_TOKEN,sheet:process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID,routing:process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID};
function response(){return{statusCode:200,headers:{},setHeader(name,value){this.headers[name]=value;},status(value){this.statusCode=value;return this;},json(value){this.body=value;return this;}};}
try{
 process.env.SMARTSHEET_ACCESS_TOKEN="test-token";process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID="tasting-sheet";delete process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID;
 const titles=["Date","Cafe Name","Station Name","Dish Name","Taster","1. Plate Appeal","Chef Contact","Director Contact"];
 const requests=[];globalThis.fetch=async(url,options={})=>{requests.push({url:String(url),options});if(options.method==="POST")return new Response(JSON.stringify({result:[{id:123}]}),{status:200});return new Response(JSON.stringify({name:"Cafe Tasting Submission Worksheet",columns:titles.map((title,index)=>{if(title==="Taster")return{id:index+1,title,type:"TEXT_NUMBER",version:1,contactOptions:[{email:"tyler.leiss@compass-usa.com"}]};if(title==="Chef Contact"||title==="Director Contact")return{id:index+1,title,type:"CONTACT_LIST",version:0,contactOptions:[{email:"chef@compass-usa.com"}]};return{id:index+1,title,type:title==="1. Plate Appeal"?"PICKLIST":"TEXT_NUMBER",version:title==="1. Plate Appeal"?2:0};}),rows:[]}),{status:200});};
 const res=response();await handler({method:"POST",query:{dataset:"cafe-tasting"},body:{action:"addTastingSubmission",record:{Date:"2026-09-25","Cafe Name":"test cafe","Station Name":"Global","Dish Name":"AUTOMATION TEST - DO NOT USE",Taster:"tyler.leiss@compass-usa.com","1. Plate Appeal":"Met Standard","Chef Contact":"must-not-write@example.com","Director Contact":"must-not-write@example.com"}}},res);
 assert.equal(res.statusCode,201);assert.equal(res.body.rowId,123);const payload=JSON.parse(requests[1].options.body);const values=payload[0].cells.map(cell=>cell.value);assert(!values.includes("must-not-write@example.com"));assert(values.includes("AUTOMATION TEST - DO NOT USE"));const plateAppeal=payload[0].cells.find(cell=>cell.columnId===6);assert.deepEqual(plateAppeal.objectValue,{objectType:"MULTI_PICKLIST",values:["Met Standard"]});const taster=payload[0].cells.find(cell=>cell.columnId===5);assert.deepEqual(taster.objectValue,{objectType:"CONTACT",email:"tyler.leiss@compass-usa.com"});assert.equal(payload[0].toBottom,true);
 assert.equal(requests.length,2,"no routing lookup should happen when SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID is unset");
 console.log("Cafe Tasting submission write verification passed.");

 process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID="routing-sheet";
 const requests2=[];
 globalThis.fetch=async(url,options={})=>{
  requests2.push({url:String(url),options});
  const u=String(url);
  if(options.method==="POST")return new Response(JSON.stringify({result:[{id:456}]}),{status:200});
  if(u.includes("routing-sheet")) return new Response(JSON.stringify({name:"Routing Table",columns:[{id:101,title:"Cafe"},{id:102,title:"Chef Contact"},{id:103,title:"Director Contact"}],rows:[{id:1,cells:[{columnId:101,value:"test cafe"},{columnId:102,value:"chef@compass-usa.com",objectValue:{objectType:"CONTACT",email:"chef@compass-usa.com",name:"Chef Person"}}]}]}),{status:200});
  return new Response(JSON.stringify({name:"Cafe Tasting Submission Worksheet",columns:titles.map((title,index)=>{if(title==="Taster")return{id:index+1,title,type:"TEXT_NUMBER",version:1,contactOptions:[{email:"tyler.leiss@compass-usa.com"}]};if(title==="Chef Contact"||title==="Director Contact")return{id:index+1,title,type:"CONTACT_LIST",version:0,contactOptions:[{email:"chef@compass-usa.com"}]};return{id:index+1,title,type:title==="1. Plate Appeal"?"PICKLIST":"TEXT_NUMBER",version:title==="1. Plate Appeal"?2:0};}),rows:[]}),{status:200});
 };
 const res2=response();await handler({method:"POST",query:{dataset:"cafe-tasting"},body:{action:"addTastingSubmission",record:{Date:"2026-09-25","Cafe Name":"test cafe","Station Name":"Global","Dish Name":"AUTOMATION TEST 2",Taster:"tyler.leiss@compass-usa.com","1. Plate Appeal":"Met Standard"}}},res2);
 assert.equal(res2.statusCode,201);
 const postRequest=requests2.find((r)=>r.options.method==="POST");
 const payload2=JSON.parse(postRequest.options.body);
 const chefCell=payload2[0].cells.find((cell)=>cell.columnId===7);
 assert.deepEqual(chefCell.objectValue,{objectType:"CONTACT",email:"chef@compass-usa.com",name:"Chef Person"},"resolved routing contact should be written directly onto the row instead of left to the sheet's own formula");
 console.log("Cafe Tasting routing-contact resolution verification passed.");

 // Regression guard: Smartsheet rejects any direct cell write to a column that has a
 // column-level formula ("You cannot edit cells with Column Formula"), which is how the
 // real Cafe Tasting sheet's Chef Contact/Director Contact columns are configured. Confirm
 // we never attempt that write when the column carries a formula.
 const requests3=[];
 globalThis.fetch=async(url,options={})=>{
  requests3.push({url:String(url),options});
  const u=String(url);
  if(options.method==="POST")return new Response(JSON.stringify({result:[{id:789}]}),{status:200});
  if(u.includes("routing-sheet")) return new Response(JSON.stringify({name:"Routing Table",columns:[{id:101,title:"Cafe"},{id:102,title:"Chef Contact"},{id:103,title:"Director Contact"}],rows:[{id:1,cells:[{columnId:101,value:"test cafe"},{columnId:102,value:"chef@compass-usa.com",objectValue:{objectType:"CONTACT",email:"chef@compass-usa.com",name:"Chef Person"}}]}]}),{status:200});
  return new Response(JSON.stringify({name:"Cafe Tasting Submission Worksheet",columns:titles.map((title,index)=>{if(title==="Taster")return{id:index+1,title,type:"TEXT_NUMBER",version:1,contactOptions:[{email:"tyler.leiss@compass-usa.com"}]};if(title==="Chef Contact"||title==="Director Contact")return{id:index+1,title,type:"CONTACT_LIST",version:0,formula:"=IFERROR(INDEX(COLLECT({RT_Chef}, {RT_Cafe}, [Cafe Name]@row), 1), \"\")",contactOptions:[{email:"chef@compass-usa.com"}]};return{id:index+1,title,type:title==="1. Plate Appeal"?"PICKLIST":"TEXT_NUMBER",version:title==="1. Plate Appeal"?2:0};}),rows:[]}),{status:200});
 };
 const res3=response();await handler({method:"POST",query:{dataset:"cafe-tasting"},body:{action:"addTastingSubmission",record:{Date:"2026-09-25","Cafe Name":"test cafe","Station Name":"Global","Dish Name":"AUTOMATION TEST 3",Taster:"tyler.leiss@compass-usa.com","1. Plate Appeal":"Met Standard"}}},res3);
 assert.equal(res3.statusCode,201,"submission must still succeed when Chef/Director Contact are formula columns");
 const postRequest3=requests3.find((r)=>r.options.method==="POST");
 const payload3=JSON.parse(postRequest3.options.body);
 assert(!payload3[0].cells.some((cell)=>cell.columnId===7||cell.columnId===8),"must never attempt to write a formula-locked Chef/Director Contact cell");
 console.log("Cafe Tasting formula-column skip verification passed.");
}finally{globalThis.fetch=originalFetch;if(originalEnv.token===undefined)delete process.env.SMARTSHEET_ACCESS_TOKEN;else process.env.SMARTSHEET_ACCESS_TOKEN=originalEnv.token;if(originalEnv.sheet===undefined)delete process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID;else process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID=originalEnv.sheet;if(originalEnv.routing===undefined)delete process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID;else process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID=originalEnv.routing;}
