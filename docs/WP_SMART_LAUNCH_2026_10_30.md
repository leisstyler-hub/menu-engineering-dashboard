# W&P smart launch and moniker governance

Owner Chief; authorizing admin Tyler. Implementation authorization: Buzz event `094fd449e8ca61ca92ec4d479fd18faf0a63fcc4bce71771cd7c1f74eefb82f2`; governance authorization `e3be88ea82f08707037255b28858011fb27a04ba2887cfcee611379262f17461` in project thread `37b9830d69f9303f1ccd9fd69074b89e08e4053e3d164b8a161a73cb6eb22a4a`.

## Scope

Version `2026.10.30.005-wp-smart-launch`, branch `chief/wp-smart-launch`, baseline `29e73b7c8c195e96c9a7dc55dce14fc9a2284df8`. Existing menu tiles gain pillar selection. The smart builder proposes a spread within hot/cold full-pan spaces and ambient display positions, considers culinary role/contrast/season and premium appeal, and offers specific swaps, locks and undo. Capacity warnings account for opening pans and require a declared bullet-pan footprint. Opening and reserve bullet/half/full 4-inch pans use measured food-specific fill weight. Exports include quantities, placements and proposed monikers. Beef/seafood blanket exclusions are removed; other restrictions remain. A held-out-food list explains existing service-format exclusions without deleting data.

Suggested initial foods use full pans and leave quantities incomplete until the chef measures fill weights. Locked half pans can leave fractional unused capacity: the starter conservatively fills only remaining whole spaces. Individual-item food-cost bands and legacy menu pass criteria remain distinct from the 40% whole-spread target. Forecasts include cost of planned unsold food and are not actual savings or demand predictions.

## Source/data safeguards

The uploaded CSV was hash-verified against `e09dde72cee28943e1093f4b78beca6a8bde963073525d45adf332ccca4e57b6`; the compact candidate evidence index contains 1,662 memberships and no recipe methods/documents or costs. Proposed monikers are derived from names and exact mapped menu pillars; exact MRN/menu/portion links separately indicate source membership evidence. They are not reviewed or canonical shared profiles. Source costs/masses continue to come through the existing trusted projection; unknowns/conflicts remain incomplete.

Read-only current catalog API view contained 1,693 rows. Strict menu/MRN/portion dry run found 1,566 one-to-one matches, 27 candidate new identities, 32 ambiguous identity groups and 59 current identities absent from the file. Counts are identity groups where stated, not import write counts. No rows were inserted, updated, hidden or deleted. This assembled API view is not a verified physical-table backup. No schema, profile persistence, canonical SSMT or other operational writes occurred.

Future shared updates must follow [the culinary moniker standard](governance/WP_CULINARY_PROFILE_STANDARD.md), including companion profile manifests and honest persistence status until a shared schema/API contract is approved. A production Supabase import still requires exact change review, independent review, verified scoped recovery and Tyler's specific approval.

## Verification and review

TDD model checks cover exact pillar mapping, unknown profiles, invalid pan quantities, unsold/reserve food economics, category variety, premium retention, lock-aware swaps, fill reset, capacity validation and crunchy toppers. Independent read-only app/source-risk review identified stale-preview and multi-pan-lock capacity blockers, both resolved with regressions. Final review reported no remaining app-only blockers; shared data/schema/import is outside that clearance. Chief implemented and performed browser verification; no separate release identity was used.

Local W&P browser suite: 13/13 passed, including desktop/mobile, exact-MRN pan exports, stale lock preview protection, smart swaps/undo, source-conflict retention and actual shared-catalog station plus smart-spread flows, with operational writes intercepted. Whole-package verify passed during implementation; final frozen-candidate gate is recorded below when complete. Artifacts: workspace .scratch/WP_SMART_FINAL_BROWSER.log, .scratch/WP_SMART_FINAL_VERIFY.log; screenshots in test-results/wp-smart-actual-1440.png and wp-smart-actual-390.png.

## Release state and rollback

State: local candidate; no production claim yet. Baseline production READY `dpl_GnCWEfXFYEpUuotfn9fno4sreWFi`, source `29e73b7c8c195e96c9a7dc55dce14fc9a2284df8`. Rollback: scoped revert of this app/governance release through the ordinary release process, or promote the baseline deployment under approved rollback authority. No data rollback is needed because this release performs no production data mutation. Exact candidate SHA, deployment evidence and final checks will be recorded after publication.
