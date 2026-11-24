import test from "node:test";
import assert from "node:assert/strict";
import { exactMrnMatches, noExperienceReviewNeeded } from "../../src/features/ssmt/ssmtReuse.js";
test("MRN suggestions require exact identifiers and completed source menus", () => {
  const menus = [
    {id:"source",phase:"IT complete",items:[{id:"a",mrn:"00012.10"},{id:"b",mrn:"12.1"},{id:"divider",recordType:"divider",mrn:"00012.10"}]},
    {id:"draft",phase:"Culinary draft",items:[{id:"c",mrn:"00012.10"}]},
    {id:"target",phase:"IT complete",items:[{id:"d",mrn:"00012.10"}]},
  ];
  assert.deepEqual(exactMrnMatches("00012.10", menus, "target").map(m=>m.item.id), ["a"]);
  assert.deepEqual(exactMrnMatches("", menus, "target"), []);
  assert.deepEqual(exactMrnMatches("00012.1", menus, "target"), []);
});

test("unrelated edits preserve imported review while description changes require review", () => {
  const item = {mrn:"00012.10",description:"Original",importSource:{menuId:"source",itemId:"a",description:"Original"}};
  assert.equal(noExperienceReviewNeeded(item, []), true);
  assert.equal(noExperienceReviewNeeded({...item,seaPrice:7,calories:"12",dietaryPreference:"Vegan",modifierGroups:["new"]}, []), true);
  assert.equal(noExperienceReviewNeeded({...item,description:"Changed"}, []), false);
  assert.equal(noExperienceReviewNeeded({description:"Original"}, []), false);
  assert.equal(noExperienceReviewNeeded({...item,importSource:{menuId:"source",itemId:"a"}}, [{id:"source",items:[{id:"a",description:"Original"}]}]), true);
});

import { validateExperienceChange } from "../../src/features/ssmt/ssmtAudit.js";
test("Experience may capture only the exact previous description for a legacy import", () => {
  const before = {menus:[{id:"menu",phase:"Experience review",items:[{id:"item",description:"Old",importSource:{menuId:"source",itemId:"a"}}]}]};
  const after = structuredClone(before);
  after.menus[0].items[0].description = "New";
  after.menus[0].items[0].importSource.description = "Old";
  assert.equal(validateExperienceChange(before,after), "");
  after.menus[0].items[0].importSource.description = "Forged";
  assert.match(validateExperienceChange(before,after), /Experience/);
});

test("legacy Experience edits cannot bypass description capture", () => {
 const before={menus:[{id:"m",phase:"Experience review",items:[{id:"i",description:"Old",importSource:{menuId:"s",itemId:"a"}}]}]};
 const after=structuredClone(before); after.menus[0].items[0].description="Changed";
 assert.match(validateExperienceChange(before,after), /description/i);
});

test("any exact other item match clears review without fabricating evidence", () => {
 const draft={id:"new",mrn:"00012.10",description:"Different",reviewBasis:{source:"new"},reviewInvalidated:true};
 const menus=[{id:"target",phase:"Culinary draft",items:[draft,{id:"other",mrn:"00012.10"}]}];
 assert.equal(noExperienceReviewNeeded(draft, menus),true);
 assert.equal(noExperienceReviewNeeded({...draft,mrn:"12.1"},menus),false);
 assert.equal(noExperienceReviewNeeded({...draft,mrn:""},menus),false);
 assert.equal(noExperienceReviewNeeded({...draft,mrn:"N/A"},menus),false);
 assert.equal(noExperienceReviewNeeded(draft,[{...menus[0],items:[draft]}]),false);
});

import { importItems } from "../../src/features/ssmt/ssmtReuse.js";
test("unfinished source exception permits only one exact MRN replacement",()=>{
 const source={id:"s",phase:"Culinary draft",items:[{id:"a",mrn:"00012.10",label:"Dish",fohColumn:"R FSO | SOURCE | DISH ENT",description:"Original"},{id:"b",mrn:"00013.10",fohColumn:"R FSO | SOURCE | OTHER ENT"}]};
 const destination={id:"d",items:[],fixyDesignation:"TARGET"};
 const before=structuredClone(source);
 assert.throws(()=>importItems(source,destination,["a"],[]),/IT complete/);
 assert.throws(()=>importItems(source,destination,["a"],[],false,{matchMrn:"12.1"}),/IT complete/);
 assert.throws(()=>importItems(source,destination,["a","b"],[],false,{matchMrn:"00012.10"}),/IT complete/);
 const result=importItems(source,destination,["a"],[],false,{matchMrn:"00012.10"});
 assert.equal(result.items[0].mrn,"00012.10");assert.equal(result.items[0].reviewBasis,undefined);assert.deepEqual(source,before);
 assert.throws(()=>importItems({...source,items:[{...source.items[0],fohColumn:""}]},destination,["a"],[],false,{matchMrn:"00012.10"}),/FIXY/);
});
