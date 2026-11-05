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

test("only description changes remove an imported item's No Review Needed label", () => {
  const item = {description:"Original",importSource:{menuId:"source",itemId:"a",description:"Original"}};
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
