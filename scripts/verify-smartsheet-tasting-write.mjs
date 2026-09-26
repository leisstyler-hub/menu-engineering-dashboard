import assert from "node:assert/strict";
import handler from "../api/smartsheet/records.js";
const originalFetch=globalThis.fetch; const originalEnv={token:process.env.SMARTSHEET_ACCESS_TOKEN,sheet:process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID};
function response(){return{statusCode:200,headers:{},setHeader(name,value){this.headers[name]=value;},status(value){this.statusCode=value;return this;},json(value){this.body=value;return this;}};}
try{
 process.env.SMARTSHEET_ACCESS_TOKEN="test-token";process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID="tasting-sheet";
 const titles=["Date","Cafe Name","Station Name","Dish Name","Taster","1. Plate Appeal","Chef Contact","Director Contact"];
 const requests=[];globalThis.fetch=async(url,options={})=>{requests.push({url:String(url),options});if(options.method==="POST")return new Response(JSON.stringify({result:[{id:123}]}),{status:200});return new Response(JSON.stringify({name:"Cafe Tasting Submission Worksheet",columns:titles.map((title,index)=>({id:index+1,title})),rows:[]}),{status:200});};
 const res=response();await handler({method:"POST",query:{dataset:"cafe-tasting"},body:{action:"addTastingSubmission",record:{Date:"2026-09-25","Cafe Name":"test cafe","Station Name":"Global","Dish Name":"AUTOMATION TEST - DO NOT USE",Taster:"tyler.leiss@compass-usa.com","1. Plate Appeal":"Met Standard","Chef Contact":"must-not-write@example.com","Director Contact":"must-not-write@example.com"}}},res);
 assert.equal(res.statusCode,201);assert.equal(res.body.rowId,123);const payload=JSON.parse(requests[1].options.body);const values=payload[0].cells.map(cell=>cell.value);assert(!values.includes("must-not-write@example.com"));assert(values.includes("AUTOMATION TEST - DO NOT USE"));assert.equal(payload[0].toBottom,true);console.log("Cafe Tasting submission write verification passed.");
}finally{globalThis.fetch=originalFetch;if(originalEnv.token===undefined)delete process.env.SMARTSHEET_ACCESS_TOKEN;else process.env.SMARTSHEET_ACCESS_TOKEN=originalEnv.token;if(originalEnv.sheet===undefined)delete process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID;else process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID=originalEnv.sheet;}
