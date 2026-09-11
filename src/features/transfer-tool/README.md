# Transfer Tool handoff

## Scope

The Transfer Tool is explicitly labeled `DRAFT`. It builds shared reference transfers for later manual entry in S4; it does not submit, approve, post, delete, or reconcile S4 transactions.

## Data authority

- `src/data/menuItems.json` supplies menu/item identity and `trueCost`, displayed as Item + Waste Cost.
- `scripts/build-transfer-tool-catalog.mjs` emits the menu-scoped `src/data/transferToolCatalog.json` cost catalog. Run it with `--check` in release verification.
- Repeated item names stay isolated by menu, MRN, and portion.
- Missing costs display as unavailable and block saving that line.
- G/L classification and ingredient-level pricing are outside the tool until Alex supplies an ingredient price index.

## Persistence

Each transfer is one `Transfer` payload in the existing Supabase `app_records` backbone. The physical tool value remains `rotation` for compatibility with the deployed enum; the logical API scope is `transfers` and filters by `transfer|*` record ids. No schema migration is required.

New records use the `createTransfer` API action. Their record id is derived from a case-insensitive, whitespace-normalized title. The endpoint preflights and performs a create-only insert, so database uniqueness on `record_id` is the authoritative global title guard. Existing records use normal upsert. Saved titles are locked; Copy Transfer clears identity/title, retains units/items, sets today’s date, and refreshes catalog costs.

## Verification

- `node scripts/build-transfer-tool-catalog.mjs --check`
- `node scripts/verify-transfer-tool.mjs`
- `node scripts/run-playwright.mjs tests/browser/transfer-tool.spec.js tests/browser/landing-tool-sections.spec.js`
- `pnpm run verify`

The browser suite mocks storage even against production so verification never creates test transfers.
