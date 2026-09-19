# Transfer Tool handoff

## Scope

The Transfer Tool is explicitly labeled `DRAFT`. It builds shared reference transfers for later manual entry in S4; it does not submit, approve, post, or reconcile S4 transactions. A saved Culinary Platform transfer draft can be deleted through a transfer-scoped API action after one browser confirmation.

## Data authority

- `src/data/menuItems.json` supplies menu/item identity and `trueCost`, displayed as Item + Waste Cost.
- `scripts/build-transfer-tool-catalog.mjs` emits the menu-scoped `src/data/transferToolCatalog.json` cost catalog. Run it with `--check` in release verification.
- Repeated item names stay isolated by menu, MRN, and portion.
- Missing costs display as unavailable and block saving that line.
- The chef selects a seven-digit From G/L and To G/L on each selected item from the approved S4 catalog in `s4GlAccounts.js`. Dropdown labels show both code and category. A saved legacy value outside the current catalog remains visible on its original record so opening or exporting an older transfer does not discard data. Legacy values cannot be copied down, and Copy Transfer clears them so new assignments come only from the approved catalog.
- Café profit-center snapshots come from `cafeProfitCenters.js`. All current Platform cafés have a five-digit mapping; a future unmapped receiving café still requires manual entry. The departing profit center remains internal because S4 derives departure from the signed-in unit.

## Persistence

Each transfer is one `Transfer` payload in the existing Supabase `app_records` backbone. The physical tool value remains `rotation` for compatibility with the deployed enum; the logical API scope is `transfers` and filters by `transfer|*` record ids. No schema migration is required.

New records use the `createTransfer` API action. Their record id is derived from a case-insensitive, whitespace-normalized title. The endpoint preflights and performs a create-only insert, so database uniqueness on `record_id` is the authoritative global title guard. Existing records use normal upsert. Saved titles are locked. Copy Transfer clears identity, title, and Event ID, resets the date to today, retains line G/L choices and manually edited descriptions, regenerates automatic descriptions, and refreshes catalog costs.

Saved-history cards use an explicit `Include in batch export` checkbox. Selected records can be staged and downloaded as one ZIP. Delete requires one `window.confirm` prompt and calls the transfer-only `deleteTransfer` API action; success removes the record from history and any batch selection, and resets the editor if that record was open.

## S4 export

- `public/templates/ExpenseTransfer_Between_PC_Template.xlsx` is the exact S4 source template. `scripts/verify-transfer-tool.mjs` guards its SHA-256 hash.
- The export code patches only `xl/worksheets/sheet1.xml` with JSZip. It retains the Template and Guidelines tabs and all other workbook package parts.
- One selected item becomes one S4 row: From G/L, receiving profit center, To G/L, editable description (50 characters), quantity × Item + Waste Cost rounded to two decimal places, and the transfer Event ID (18 characters).
- One transfer may contain at most 450 exported item lines. Text cells are emitted as inline strings, preventing user-entered text from becoming formulas.
- Saved transfers can be selected and completed in a batch staging area, then downloaded as a ZIP containing one exact-template workbook per transfer. Staging does not save records or refresh stored costs.
- Legacy transfer records remain readable and writable. The server enforces the added S4 fields only when `s4ExportVersion` is present.

## Verification

- `node scripts/build-transfer-tool-catalog.mjs --check`
- `node scripts/verify-transfer-tool.mjs`
- `node scripts/run-playwright.mjs tests/browser/transfer-tool.spec.js tests/browser/landing-tool-sections.spec.js`
- `pnpm run verify`

The browser suite mocks storage even against production so verification never creates test transfers.
