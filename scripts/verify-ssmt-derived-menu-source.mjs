import assert from "node:assert/strict";

import {
  deriveSsmtOperatingRows,
  mergeSsmtRowsWithMenuWorksRows,
  ssmtDerivedMenuEntries,
} from "../src/features/ssmt/ssmtDerivedMenuSource.js";
import recipeLibraryHandler from "../api/recipe-library.js";

const today = new Date("2026-09-01T12:00:00.000Z");

const workspace = {
  menus: [
    {
      id: "cafe-express",
      name: "Cafe Express",
      type: "Core",
      phase: "IT complete",
      hidden: false,
      items: [
        { id: "submenu-soups", recordType: "divider", dividerKind: "submenu", title: "Soups" },
        {
          id: "tomato-soup",
          label: "TOMATO SOUP",
          description: "fire roasted tomato soup",
          mrn: "111222.33",
          category: "Soup",
          secondaryCategory: "Soup",
          seaPrice: "$5.00",
        },
        { id: "submenu-sandwiches", recordType: "divider", dividerKind: "submenu", title: "Curated Sandwiches" },
        {
          id: "turkey-club",
          label: "TURKEY CLUB",
          description: "turkey club sandwich",
          mrn: "222333.44",
          category: "Entree",
          secondaryCategory: "Sandwich",
          seaPrice: "$9.50",
        },
      ],
    },
    {
      id: "draft-menu",
      name: "Draft Menu",
      type: "Global",
      phase: "Culinary draft",
      items: [{ id: "draft-item", label: "DRAFT ITEM", category: "Entree" }],
    },
    {
      id: "expired-promo",
      name: "Holiday Promo",
      type: "Promotion",
      phase: "IT complete",
      activeEnd: "2026-01-01",
      items: [{ id: "holiday-item", label: "HOLIDAY ITEM", category: "Entree" }],
    },
  ],
};

const derivedRows = deriveSsmtOperatingRows(workspace, { today });
assert.equal(derivedRows.length, 2, "Only IT-complete non-hidden downstream SSMT rows should be derived.");
assert.deepEqual(
  derivedRows.map((row) => row.menu),
  ["AMZ: Cafe Express Soups", "AMZ: Cafe Express Curated Sandwiches"],
  "SSMT submenu dividers should become downstream menu names."
);
assert.deepEqual(
  ssmtDerivedMenuEntries(derivedRows),
  [
    { menu: "AMZ: Cafe Express Curated Sandwiches", count: 1, source: "ssmt-derived" },
    { menu: "AMZ: Cafe Express Soups", count: 1, source: "ssmt-derived" },
  ],
  "Menu summaries should expose SSMT-derived submenus as Menu Library menu entries."
);

const menuWorksRows = [
  { id: "old-sandwich", menu: "AMZ: Cafe Express Curated Sandwiches", station: "Deli", item: "OLD SANDWICH", mrn: "999" },
  { id: "old-soup", menu: "AMZ: Cafe Express Soups", station: "Soup", item: "OLD SOUP", mrn: "888" },
  { id: "unowned", menu: "AMZ: Ohana", station: "Entree", item: "KALUA PORK", mrn: "777" },
];
const merged = mergeSsmtRowsWithMenuWorksRows(menuWorksRows, derivedRows);
assert.equal(
  merged.some((row) => row.id === "old-sandwich" || row.id === "old-soup"),
  false,
  "Menus owned by IT-complete SSMT rows should use the SSMT row set at read time instead of stale MenuWorks rows."
);
assert.equal(
  merged.some((row) => row.id === "unowned"),
  true,
  "Unrelated MenuWorks menus must remain available."
);
assert.deepEqual(
  merged.filter((row) => row.__ssmtOperatingMenu).map((row) => row.item).sort(),
  ["TOMATO SOUP", "TURKEY CLUB"],
  "SSMT-derived rows should remain in the merged source."
);

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const href = String(url);
  let payload = [];
  if (href.includes("/rest/v1/recipe_items?")) {
    payload = [
      {
        item_key: "old-sandwich",
        menu: "AMZ: Cafe Express Curated Sandwiches",
        station: "Deli",
        display_name: "OLD SANDWICH",
        mrn: "999",
        visible_in_library: true,
      },
      {
        item_key: "ohana-pork",
        menu: "AMZ: Ohana",
        station: "Entree",
        display_name: "KALUA PORK",
        mrn: "777",
        visible_in_library: true,
      },
    ];
  }
  if (href.includes("/rest/v1/recipe_item_documents?")) {
    payload = [];
  }
  if (href.includes("/rest/v1/app_records?")) {
    payload = [{
      record_id: "ssmt|workspace|current",
      updated_at: "2026-09-01T12:00:00.000Z",
      retain_until: "2028-09-01T12:00:00.000Z",
      record_payload: {
        "Record ID": "ssmt|workspace|current",
        "Record Type": "SSMT Workspace",
        ...workspace,
      },
    }];
  }
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(payload),
  };
};

async function invokeRecipeLibrary(query) {
  let statusCode = 0;
  let body = null;
  await recipeLibraryHandler(
    { method: "GET", query, headers: {} },
    {
      setHeader() {},
      status(code) {
        statusCode = code;
        return {
          json(payload) {
            body = payload;
          },
        };
      },
    }
  );
  return { statusCode, body };
}

try {
  const summary = await invokeRecipeLibrary({ scope: "summary" });
  assert.equal(summary.statusCode, 200);
  assert.equal(summary.body.source, "supabase-recipe-items+ssmt-derived");
  assert.equal(summary.body.ssmtDerivedRows, 2);
  assert(summary.body.menus.some((entry) => entry.menu === "AMZ: Cafe Express Curated Sandwiches" && entry.count === 1));

  const selected = await invokeRecipeLibrary({ scope: "menu", menu: "AMZ: Cafe Express Curated Sandwiches" });
  assert.equal(selected.statusCode, 200);
  assert.deepEqual(
    selected.body.rows.map((row) => row.item || row.displayName),
    ["TURKEY CLUB"],
    "Recipe Library menu scope should return SSMT rows for an SSMT-owned submenu."
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log("SSMT derived menu source verification passed.");
