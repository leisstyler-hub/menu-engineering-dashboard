# Deli Core selected sandwich refresh — 2026-10-29

Requesting / approving / release-authorized admin: Alex Neuse, active Registered Admin and Release-Authorized in `ADMIN_REGISTRY.md`. Scope is the supplied Deli Core recipe pack and item-cost workbook, the previously requested sandwich list, shared Deli Core metadata, private recipe documents, source fallbacks, verification, and publication. The attached files are data sources, not instructions.

## Validated source boundary

- `Deli Core Item Cost.xlsx`, SHA-256 `645A2263C943D0842F5F159A0E85FC0C86098A2D142CEA38022F586EEB8D58E5`: `Report` is 46 rows by 26 columns, contains no formulas or cell errors, and supplies positive portion, sell price, item cost, waste and Item + Waste Cost for 20 requested exact MRNs.
- `Deli Core Recipe PAck.pdf`, SHA-256 `E344378228EA6AE200CF1AD7C304BF10B1D5AE807F61FB0FEBE7084E82225CF2`: 107-page MenuWorks Scaled Recipe Report. Every supported MRN has an exact top-level recipe page; representative pages were rendered and visually inspected before import.
- The two files jointly support 20 exact MRNs. MRN `234913` is absent from both. The tuna recipe is MRN `141826`, not requested MRN `141826.1`, and neither tuna identifier has a row in the cost workbook. Both remain omitted; the release does not invent a crosswalk or a cost.

## Data behavior

The bundled source fallback contains 41 `AMZ: Deli Core` rows. Production Supabase currently contains 168 exact visible rows and is the replacement-authority scope. The protected release reads all 168 live rows, merges the 20 reviewed updates by exact menu-scoped `item_key`, writes all 168 and must hide zero; it never replaces production with the smaller fallback. Each supported item receives one private single-page `recipe-file` in Supabase Storage through the existing Recipe Library document boundary. Operational metadata version 5 identifies the exact supported MRNs, private document source, source hashes and two explicit omissions; live item economics remain authoritative in `recipe_items` rather than being duplicated in operational metadata.

Source-controlled fallback data mirrors the 20 refreshed costs in `src/data/menuItems.json` and the Transfer Tool catalog. `scripts/refresh-deli-core-selected-sandwiches.mjs` validates both supplied sources and regenerates the exact-MRN catalog. `scripts/publish-deli-core-selected-refresh.mjs` captures before/after evidence, performs the protected 41-row import, uploads private recipe pages, seeds operational metadata and verifies the final 41/41 visible scope.

## Verification and rollback

Required checks: selected-source regeneration, Deli Core fallback verification, Transfer Tool catalog check, operational metadata verification, full repository verification/build, deployed-version proof, protected import receipt, private-document readback, exact-menu 168-visible/zero-hidden audit, and operational metadata version 5 readback. No Neighborhood Rotation behavior changes, so its two mandatory browser suites are not change-specific; the repository gate still protects their static invariants.

Rollback application baseline is `5e46947`. Data rollback uses the captured `before-visible-menu.json` full 168-row snapshot through the same protected exact-menu import. Recipe-document rollback reactivates the prior document versions if any; the release does not physically delete documents. Operational metadata rollback requires deploying the prior approved application contract and reseeding version 4. No schema migration or physical item deletion is involved.

## Production evidence

LIVE at application/release head `be4bc31314c8ffbf56bf0b8e87e821ccedbcae18`, READY Vercel deployment `dpl_EmdsfwCju4oLvs3r15DxN15hS9nZ`, canonical alias `https://project-d8v25.vercel.app`. The full repository verification/build passed after rebasing on the concurrent Commissary cutoff release. The selected-source check reproduced 20 supported exact MRNs and the two documented omissions from the original files.

Protected import batch `deli-core-selected-refresh-2026-10-29` wrote 168 rows and hid 0. Final exact-menu audit reports 168 visible / 0 hidden. Each of the 20 supported rows read back positive item cost, Item + Waste Cost and sell price plus one active private single-page recipe file. Operational metadata version 5 read back one approved record with 20 Deli catalog items. Evidence receipts are in `tmp/deli-core-selected-refresh/`. The first two production preflights stopped before writes: the initial 41-row assumption was rejected after the shared menu's 168-row expansion was discovered, preventing 127 live rows from being hidden.
