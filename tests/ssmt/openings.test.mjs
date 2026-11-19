import test from "node:test";
import assert from "node:assert/strict";
import { stationRows, reviewState, patchOpeningItem, stationReadiness, menuRevision, transitionMenu, validateOpeningChange } from "../../src/features/ssmt/ssmtOpening.js";
import {validateExperienceChange} from "../../src/features/ssmt/ssmtAudit.js";
test("Experience can edit names and FIXY, cannot change MRNs or assignment",()=>{
 const before={menus:[{id:"m",phase:"Experience review",items:[{id:"i",mrn:"00042",name:"Soup",label:"Soup",fohColumn:"old"}]}],modifierGroups:[]};
 const after=structuredClone(before);after.menus[0].items[0].fohColumn="new";after.menus[0].items[0].name="New soup";
 assert.equal(validateExperienceChange(before,after),"");
 after.menus[0].items[0].mrn="42";assert.ok(validateExperienceChange(before,after));
});
const item = {id:"i", mrn:"00042.10", name:"Soup", label:"Soup", calories:0, fohColumn:"R FSL | SOUP | SOUP SNK", stationId:"a", weeks:[], description:"Hot soup", reviewBasis:{mrn:"00042.10",description:"Hot soup",source:"baseline"}};
test("week views include core and selected rotation, never lose unassigned legacy rows",()=>{
 const menu={stations:[{id:"a"},{id:"b"}],items:[item,{...item,id:"two",weeks:[2,4]},{...item,id:"other",stationId:"b"},{id:"legacy"}]};
 assert.deepEqual(stationRows(menu,"a",1).map(x=>x.id),["i"]);
 assert.deepEqual(stationRows(menu,"a",2).map(x=>x.id),["i","two"]);
 assert.equal(stationRows(menu,"",0).length,4);
 assert.deepEqual(stationRows(menu,"unassigned",0).map(x=>x.id),["legacy"]);
});
test("MRN and description invalidate review, modifiers do not; preserve exact source data",()=>{
 assert.equal(reviewState(item),"Reviewed");
 assert.equal(reviewState(patchOpeningItem(item,{mrn:"00042.11"})),"Needs review");
 assert.equal(reviewState(patchOpeningItem(patchOpeningItem(item,{mrn:"00042.11"}),{mrn:item.mrn})),"Needs review");
 assert.equal(reviewState(patchOpeningItem(item,{modifierGroups:["new"]})),"Reviewed");
 assert.equal(reviewState(patchOpeningItem(item,{description:"Changed"})),"Needs review");
 assert.equal(item.mrn,"00042.10");
 assert.equal(reviewState({...item,reviewBasis:undefined}),"Unknown");
});
test("zero calories valid; review and signage gaps stay separate",()=>{
 const result=stationReadiness({type:"New Unit Openings",items:[item,{...item,id:"new",calories:"",reviewBasis:{source:"new"}}]},"a",0);
 assert.equal(result.review.length,1); assert.equal(result.signage.length,1);
});
test("phase history appends, preserves owners, and no-op doesn't invent a transition",()=>{
 const menu={phase:"Experience review",owners:[{id:"one"}],phaseHistory:[{to:"Experience review"}]};
 const next=transitionMenu(menu,"Culinary draft","now","actor");
 assert.deepEqual(next.owners,menu.owners); assert.equal(next.phaseHistory.length,2);
 assert.equal(transitionMenu(next,"Culinary draft","later","actor"),next);
});
test("revision includes content and Global participation, ignores approval itself",()=>{
 const menu={items:[item],stations:[{id:"a",name:"Soup",globalMenus:[]}]};
 assert.equal(menuRevision(menu),menuRevision({...menu,reviewApprovals:[{at:"now"}]}));
 assert.notEqual(menuRevision(menu),menuRevision({...menu,items:[{...item,calories:1}]}));
});
test("only admins assign owners, approval identity cannot be forged",()=>{
 const before={menus:[{id:"m",items:[],owners:[]}]};
 const after=structuredClone(before); after.menus[0].owners=[{id:"stranger"}];
 assert.match(validateOpeningChange(before,after,{user_id:"chef",is_admin:false}),/admin/i);
 const forged=structuredClone(before); forged.menus[0].reviewApprovals=[{actorId:"other"}];
 assert.match(validateOpeningChange(before,forged,{user_id:"chef",is_admin:false}),/approval/i);
});
test("Global snapshot gaps count toward station readiness",()=>{
 const menu={items:[],stations:[{id:"a",globalMenus:[{menuId:"g",items:[{id:"g1",mrn:"",label:"Dish",calories:""}]}]}]};
 assert.equal(stationReadiness(menu,"a",1).signage.length,1);
 assert.equal(stationReadiness(menu,"a",1).mrns.length,1);
});
test("approval revision changes with attached modifier content",()=>{
 const menu={items:[{...item,modifierGroups:["g"]}]};
 assert.notEqual(menuRevision(menu,[{id:"g",choices:[{id:"c",mrn:"0001"}]}]),menuRevision(menu,[{id:"g",choices:[{id:"c",mrn:"0002"}]}]));
 const legacy={name:"Core",items:[{...item,modifierGroups:[" bread "]}]};
 assert.notEqual(menuRevision(legacy,[{id:"g",name:"BREAD",choices:[{id:"c",mrn:"0001"}]}]),menuRevision(legacy,[{id:"g",name:"BREAD",choices:[{id:"c",mrn:"0002"}]}]));
});
test("phase changes cannot omit history or erase baseline authority",()=>{
 const before={reviewBaseline:{at:"now"},menus:[{id:"m",phase:"Culinary draft",items:[]}]};
 const after=structuredClone(before);after.menus[0].phase="Experience review";
 assert.match(validateOpeningChange(before,after,{user_id:"chef"}),/history/i);
 after.menus[0].phase="Culinary draft";delete after.reviewBaseline;
 assert.match(validateOpeningChange(before,after,{user_id:"chef"}),/baseline/i);
});
test("server requires sticky invalidation on MRN edits, including reverting the old MRN",()=>{
 const before={menus:[{id:"m",items:[item]}]};const after=structuredClone(before);after.menus[0].items[0].mrn="different";
 assert.match(validateOpeningChange(before,after,{user_id:"chef"}),/MRN/i);
 after.menus[0].items[0].reviewInvalidated=true;
 assert.equal(validateOpeningChange(before,after,{user_id:"chef"}),"");
 const reverted=structuredClone(after);reverted.menus[0].items[0].mrn=item.mrn;reverted.menus[0].items[0].reviewInvalidated=false;
 assert.match(validateOpeningChange(after,reverted,{user_id:"chef"}),/MRN/i);
});
