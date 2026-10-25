import test from 'node:test';
import assert from 'node:assert/strict';
import { publicCalendarMenus } from '../../lib/ssmtCalendarPreview.js';
import handler from '../../api/ssmt.js';
import {pack} from '../../lib/ssmtServer.js';

test('calendar projection returns only approved display fields and excludes hidden/divider records',()=>{
  const secret={password:'secret',recipeUrl:'private',photoLink:'private',price:9,modifierGroups:['private']};
  const menu={id:'promo',name:'BYPTWD',type:'Promotion',phase:'IT complete',activeStart:'2026-10-09',activeEnd:'2026-10-09',fixyDesignation:' B Y P ',...secret,promotionSchedule:{mode:'weekly',weekdays:[4,0,'5'],skippedDates:['2026-10-08'],secret},items:[
    {label:'Trout',description:'Grilled trout',calories:0,category:'Entree',...secret},
    {recordType:'divider',label:'Divider'}, {rowType:'divider',name:'Divider 2'}, {hidden:true,label:'Hidden'}, {hiddenFromDownstream:true,label:'Hidden 2'}
  ]};
  const before=JSON.stringify(menu);
  const result=publicCalendarMenus([menu,{...menu,id:'hidden',hidden:true},{...menu,id:'hidden2',hiddenFromDownstream:true}]);
  assert.equal(result.length,1);
  assert.deepEqual(result[0].items,[{label:'Trout',description:'Grilled trout',calories:0,category:'Entree'}]);
  assert.equal(result[0].fixyDesignation,' B Y P ');
  assert.deepEqual(result[0].promotionSchedule,{mode:'weekly',weekdays:[4],skippedDates:['2026-10-08']});
  assert.equal(JSON.stringify(result).includes('private'),false);
  assert.equal(JSON.stringify(result).includes('secret'),false);
  assert.equal(JSON.stringify(menu),before);
});

test('calendar projection does not serialize object fields or add item details to non-promotion menus',()=>{
  const object={private:'must not escape'};
  const [promo,core]=publicCalendarMenus([{id:'one',name:'One',type:'Promotion',fixyDesignation:object,items:[{label:object,name:'Safe fallback',description:object,calories:object,category:object},{label:object,name:object}]},{id:'core',name:'Core',type:'Core',items:[{label:'Private core item'}],fixyDesignation:'CORE'}]);
  assert.equal(promo.fixyDesignation,'');assert.deepEqual(promo.items,[{label:'Safe fallback',description:'',category:''}]);
  assert.equal('items' in core,false);assert.equal('fixyDesignation' in core,false);
  assert.equal(JSON.stringify([promo,core]).includes('must not escape'),false);
});

test('public calendar uses a GET-only projection while full workspace still requires identity',async()=>{
  const keys=['SSMT_ACCOUNTS_ENABLED','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'],old=keys.map(key=>process.env[key]),original=globalThis.fetch,requests=[];
  Object.assign(process.env,{SSMT_ACCOUNTS_ENABLED:'true',SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'isolated-test-only'});
  globalThis.fetch=async(url,options)=>{requests.push({url:String(url),method:options.method||'GET'});assert.match(String(url),/app_records\?/);return {ok:true,json:async()=>[{record_payload:pack({menus:[{id:'one',name:'Promo',type:'Promotion',items:[{label:'Trout',photoLink:'private-url'}]}],modifierGroups:[],secret:'private-workspace'})}]};};
  const response=()=>({setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
  try{
    const calendar=response();await handler({method:'GET',query:{action:'calendar'},headers:{}},calendar);
    assert.equal(calendar.code,200);assert.equal(calendar.body.menus[0].items[0].label,'Trout');assert.equal(JSON.stringify(calendar.body).includes('private-'),false);
    const workspace=response();await handler({method:'GET',query:{action:'workspace'},headers:{}},workspace);assert.equal(workspace.code,401);
    const post=response();await handler({method:'POST',body:{action:'calendar'},headers:{}},post);assert.equal(post.code,405);
    assert.equal(requests.length,1);assert.equal(requests[0].method,'GET');
  }finally{globalThis.fetch=original;keys.forEach((key,index)=>old[index]===undefined?delete process.env[key]:process.env[key]=old[index]);}
});
