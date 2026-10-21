import test from "node:test";
import assert from "node:assert/strict";
import {
  importItems,
  loadGroups,
  generateFixy,
  approvedMatches,
  groupsForItem,
} from "../../src/features/ssmt/ssmtReuse.js";
import {
  auditChanges,
  validateExperienceChange,
} from "../../src/features/ssmt/ssmtAudit.js";
const item = {
  id: "i",
  rowType: "item",
  label: "Smash Burger",
  mrn: "00083821.10",
  fohColumn: "R FBB | GRILL | SMASH BURGER ENT BF",
  seaPrice: 0,
  areaPrices: { SEA: 0 },
  modifierGroups: ["g"],
};
const source = { id: "s", name: "Source", phase: "IT complete", items: [item] };
const group = {
  id: "g",
  name: "Bread",
  alias: "BREADS",
  type: "Force",
  minQty: "1",
  maxQty: "1",
  lockedForCentric: true,
  choices: [{ id: "c", name: "Bun", price: 0 }],
};
const target = {
  id: "t",
  name: "Target",
  fixyDesignation: "MFP DAY",
  items: [],
};
test("imports preserve exact values and independently clone all modifier data", () => {
  const result = importItems(source, target, ["i"], [group]);
  assert.equal(
    result.items[0].fohColumn,
    "R FBB | MFP DAY | SMASH BURGER ENT BF",
  );
  assert.equal(result.items[0].mrn, "00083821.10");
  assert.equal(result.items[0].seaPrice, 0);
  assert.notEqual(result.items[0].id, "i");
  assert.notEqual(result.groups[0].id, "g");
  assert.notEqual(result.groups[0].choices[0].id, "c");
  result.groups[0].choices[0].name = "Changed";
  assert.equal(group.choices[0].name, "Bun");
  assert.equal(result.groups[0].lockedForCentric, false);
  assert.equal(item.fohColumn, "R FBB | GRILL | SMASH BURGER ENT BF");
  assert.equal(
    importItems(source, { ...target, items: [item] }, ["i"], [group]).items
      .length,
    0,
  );
  assert.equal(
    importItems(source, { ...target, items: [item] }, ["i"], [group], true)
      .items.length,
    1,
  );
  assert.throws(
    () =>
      importItems(source, { ...target, fixyDesignation: "" }, ["i"], [group]),
    /designation/i,
  );
});

test("unfinished menus cannot supply imported items", () => {
  assert.throws(() => importItems({ ...source, phase: "Culinary draft" }, target, ["i"], [group]), /IT complete/);
});
test("modifier loading independent of item identity and preserves rules and zero prices", () => {
  const loaded = loadGroups([group], [], false);
  assert.equal(loaded[0].minQty, "1");
  assert.equal(loaded[0].choices[0].price, 0);
  assert.equal(loadGroups([group], [group], false).length, 0);
  assert.equal(loadGroups([group], [group], true).length, 1);
});
test("FIXY rules require designation, item presence and explicit unknown facts", () => {
  assert.throws(
    () =>
      generateFixy(
        item,
        { ...target, fixyDesignation: "" },
        { type: "FBB", service: "ENT", protein: "BF" },
      ),
    /designation/i,
  );
  assert.throws(() => generateFixy(item, target, {}), /empty|zero|items/i);
  const menu = { ...target, items: [item] };
  assert.throws(
    () => generateFixy(item, menu, { type: "FBB", service: "ENT" }),
    /protein/i,
  );
  assert.equal(
    generateFixy(item, menu, { type: "FBB", service: "ENT", protein: "BF" }),
    "R FBB | MFP DAY | SMASH BURGER ENT BF",
  );
  assert.equal(
    generateFixy({ ...item, label: "Roasted Vegetable Plate" }, menu, {
      type: "FSP",
      service: "ENT",
      protein: "",
    }),
    "R FSP | MFP DAY | ROASTED VEGETABLE PLATE ENT",
  );
  assert.equal(
    generateFixy(
      { ...item, label: "Thai Chicken Soup" },
      { ...menu, fixyDesignation: "CAFE EXPRESS" },
      { type: "FSL", service: "SNK", protein: "CHK", cafeSoup12Fo: true },
    ),
    "R FSL | CAFE EXPRESS | THAI CHICKEN SOUP 12 FO SNK",
  );
  assert.equal(
    approvedMatches(item, [
      source,
      { ...source, id: "draft", phase: "Culinary draft" },
    ]).length,
    1,
  );
});
test("history excludes ordering and captures precise edits/deleted snapshots", () => {
  const before = {
    menus: [{ ...source, items: [item, { ...item, id: "j" }] }],
    modifierGroups: [group],
  };
  const after = structuredClone(before);
  after.menus[0].items.reverse();
  assert.deepEqual(auditChanges(before, after), []);
  after.menus[0].items.find((i) => i.id === "i").description = "New";
  const edits = auditChanges(before, after);
  assert.equal(edits.length, 1);
  assert.equal(edits[0].changes.description.after, "New");
  after.menus[0].items = after.menus[0].items.filter((i) => i.id !== "i");
  const deletion = auditChanges(before, after).find(
    (e) => e.action === "deleted",
  );
  assert.equal(deletion.before.mrn, "00083821.10");
});
test("Experience can only change descriptions and move forward to IT programming", () => {
  const before = {
    menus: [{ ...source, phase: "Experience review" }],
    modifierGroups: [],
  };
  const after = structuredClone(before);
  after.menus[0].items[0].description = "New";
  after.menus[0].phase = "IT programming";
  after.menus[0].status = "IT programming";
  assert.equal(validateExperienceChange(before, after), "");
  after.menus[0].items[0].mrn = "bad";
  assert.match(validateExperienceChange(before, after), /Experience/);
  const deleted = structuredClone(before);
  deleted.menus[0].items = [];
  assert.match(validateExperienceChange(before, deleted), /Experience/);
  const complete = structuredClone(before);
  complete.menus[0].phase = "IT complete";
  assert.match(validateExperienceChange(before, complete), /Experience/);
});

test("independent copied groups never hijack legacy name references", () => {
  const copied = loadGroups([group], [], true)[0];
  assert.equal(copied.independentCopy, true);
  assert.equal(
    groupsForItem({ modifierGroups: ["Bread"] }, [group, copied])[0].id,
    "g",
  );
  assert.equal(
    groupsForItem({ modifierGroups: [copied.id] }, [group, copied])[0].id,
    copied.id,
  );
});

test("setup redirects remove credentials before monitoring and retain them only in memory", async () => {
  const {
    captureSsmtAuthRedirect,
    getSsmtRedirectToken,
    clearSsmtRedirectToken,
  } = await import("../../src/features/ssmt/ssmtAuthRedirect.js");
  let clean = "";
  captureSsmtAuthRedirect(
    {
      search: "?ssmt=setup",
      pathname: "/",
      hash: "#access_token=test-token&refresh_token=test-refresh&type=invite",
    },
    {
      replaceState(_a, _b, url) {
        clean = url;
      },
    },
  );
  assert.equal(clean, "/?ssmt=setup");
  assert.equal(getSsmtRedirectToken(), "test-token");
  clearSsmtRedirectToken();
  assert.equal(getSsmtRedirectToken(), "");
});

test("modifier-option deletions retain a readable snapshot and menu context", () => {
  const before = { menus: [source], modifierGroups: [group] };
  const after = structuredClone(before);
  after.modifierGroups[0].choices = [];
  const deletion = auditChanges(before, after).find(
    (event) => event.kind === "modifier option" && event.action === "deleted",
  );
  assert.equal(deletion.before.price, 0);
  assert.equal(deletion.label, "Bun");
  assert.equal(deletion.menuNames[0], "Source");
});


test("Chiang Mai desserts with N/A modifier markers import without invented groups", () => {
  const dessert = { ...item, id: "dessert", label: "THAI BANANA PANCAKE", fohColumn: "R FSO | CHIANG MAI | Thai Banana Pancake SNK ", modifierGroups: ["N/A", "", " n/a "] };
  const result = importItems({ ...source, items: [dessert] }, { ...target, fixyDesignation: "CHAING MAI" }, ["dessert"], []);
  assert.equal(result.items[0].fohColumn, "R FSO | CHAING MAI | Thai Banana Pancake SNK");
  assert.deepEqual(result.items[0].modifierGroups, []);
  assert.deepEqual(dessert.modifierGroups, ["N/A", "", " n/a "]);
});

test("SSMT recordType section rows are excluded from import and approved matches", () => {
  const divider = { ...item, id: "section", recordType: "divider", rowType: undefined, label: "Desserts" };
  const result = importItems({ ...source, items: [divider] }, target, ["section"], [group]);
  assert.equal(result.items.length, 0);
  assert.equal(approvedMatches(divider, [{ ...source, items: [divider] }]).length, 0);
});

test("real missing modifier references still block atomically and identify the reference", () => {
  assert.throws(() => importItems({ ...source, items: [{ ...item, modifierGroups: ["Missing sauce"] }] }, target, ["i"], []), /Missing sauce/);
});
