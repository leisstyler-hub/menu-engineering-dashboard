# Transfer Tool handoff

## Scope

The Transfer Tool is explicitly labeled `DRAFT`. It builds shared reference transfers for later manual entry in S4; it does not submit, approve, post, or reconcile S4 transactions. A saved Culinary Platform transfer draft can be deleted through a transfer-scoped API action after one browser confirmation.

## Data authority

- `src/data/menuItems.json` supplies menu/item identity and `trueCost` for Menu Library reconciliation.
- `public/resources/Ingredient_Costing_9.19.26.xlsx` is the downloadable pricing resource. `scripts/build-ingredient-costing-lookup.mjs` derives the compact server-side lookup at `api/data/ingredientCosting91926.json`; it is deliberately not bundled into the client.
- The lookup reads direct AP/EP ingredient rows, excludes water and ice, and accepts a price from a canonical `Ingredient:` reference before trying a high-confidence normalized ingredient-and-form match (retaining forms such as chopped, shredded, and sliced). It converts compatible kitchen/metric units and form-limited density measures before calculating ingredient quantity ÷ recipe yield × unit price. A conservative last tier can derive one price from repeated, stable residuals of flat ingredient-only source recipes where every other component is canonically priced; ordinary menu-row portion costs are never treated as an ingredient price directly.
- Repeated item names stay isolated by menu, MRN, and portion.
- Selecting a menu item loads its priced ingredient allocation through `/api/transfer-breakdown`. The operator no longer chooses From/To G/L values. Every exported ingredient uses its mapped S4 category code as both G/L values. A selection without a priced allocation cannot save or export; older saved records remain visible but need to be copied and reselected before export.
- Café profit-center snapshots come from `cafeProfitCenters.js`. All current Platform cafés have a five-digit mapping; a future unmapped receiving café still requires manual entry. The departing profit center remains internal because S4 derives departure from the signed-in unit.

## Persistence

Each transfer is one `Transfer` payload in the existing Supabase `app_records` backbone. The physical tool value remains `rotation` for compatibility with the deployed enum; the logical API scope is `transfers` and filters by `transfer|*` record ids. No schema migration is required.

New records use the `createTransfer` API action. Their record id is derived from a case-insensitive, whitespace-normalized title. The endpoint preflights and performs a create-only insert, so database uniqueness on `record_id` is the authoritative global title guard. Existing records use normal upsert. Saved titles are locked. Copy Transfer clears identity, title, and Event ID, resets the date to today, retains stored ingredient allocations, and requires reselecting a legacy line that predates the automatic allocation flow.

Saved-history cards use an explicit `Include in batch export` checkbox. Selected records can be staged and downloaded as one ZIP. Delete requires one `window.confirm` prompt and calls the transfer-only `deleteTransfer` API action; success removes the saved record from history and any batch selection, and resets the editor if that transfer was open.

## S4 export

- `public/templates/ExpenseTransfer_Between_PC_Template.xlsx` is the exact S4 source template. `scripts/verify-transfer-tool.mjs` guards its SHA-256 hash.
- The export code patches only `xl/worksheets/sheet1.xml` with JSZip. It retains the Template and Guidelines tabs and all other workbook package parts.
- One selected item expands into one S4 row per ingredient: its mapped G/L code in both S4 G/L columns, receiving profit center, an automatic item-and-ingredient description capped at 50 characters, item count × ingredient allocation per portion rounded to two decimals, and the transfer Event ID (18 characters).
- One transfer may contain at most 450 exported ingredient lines. Text cells are emitted as inline strings, preventing user-entered text from becoming formulas.
- Saved transfers can be selected and downloaded as a ZIP containing one exact-template workbook per transfer. Staging does not save records or refresh stored allocations.

## Verification

- `node scripts/build-transfer-tool-catalog.mjs --check`
- `node scripts/build-ingredient-costing-lookup.mjs --check`
- `node scripts/verify-transfer-tool.mjs`
- `node scripts/run-playwright.mjs tests/browser/transfer-tool.spec.js tests/browser/landing-tool-sections.spec.js`
- `pnpm run verify`

The browser suite mocks storage and pricing requests even against production so verification never creates test transfers.
