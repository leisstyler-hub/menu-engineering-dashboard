# W&P pan-ready assortment

Requesting/Approving Admin and Admin of Record: Tyler, Buzz identity `12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d`. Build authorization: `cf4b77b9157a137bf38fca3e6a3c28c574b816bcc04c8c15bfecdea0cd444d1c`, 2026-10-23T14:44:00Z, Culinary Tools Project thread `6790bf6b1e8983699636c81e9f934b0f3186d2a9e7fc21a6be234883a326a2e6`.

## Design and boundaries

Menu → Category → Pan-ready food → Supporting components. Categories: proteins, starches/grains, vegetables, sauces/dressings, toppings/garnishes. Handhelds excluded, including their decomposition. Plates/bowls supply source-linked service components. Prep sauces/pastes remain underneath finished foods; directly offered sauces retain their category. Unknown roles remain reviewable. No source records, identifiers, recipe documents or operational data are changed.

Selling price defaults to $0.70/oz ($11.20/lb). Existing 40% item and 60% menu gates remain. Ranking bands are ≤30%, >30–40%, >40–50%, >50–60%, >60%, plus Needs information. Filters change the displayed category counts/ranking, not qualification denominators. Selected food remains visible beside ranked alternatives. Export includes an item worksheet with exact MRN, category, cost, documented mass, FC%, tier and provenance. Flash cards display FC% beside each item. Missing mass is never derived from volume, parent plate mass or usage quantity.

## Approach

Use a read-only projection of existing recipe edges, with conservative name-based classification and explicit review exclusions. This preserves source authority and avoids operational schema changes. Rewriting source categories was rejected; merely hiding plates without expanding their known service children fails the intended comparison. Source name signals are provisional classification, not Culinary approval.

## Mission / implementation plan

Classification: Level 3 product change with read-only data interpretation (Level 4 safeguards). Solo Chief execution continues the explicit solo mission; no independent clearance is claimed. Chief owns all changed files. Required reviewers/verifiers: self-review and local automated verification for this solo candidate; independent release clearance remains separate.

- [x] Add regression coverage for plate expansion, handheld exclusion, nested prep, exact variant deduplication, missing mass, tier boundaries, and export consistency.
- [x] Implement pure pan-ready projection and normalized menu assessment; preserve source inputs and source restrictions.
- [x] Implement category counts, filters, selected-item split ranking and supporting detail.
- [x] Export the same projected items to Excel and flash cards, including unresolved-data rows.
- [x] Run complete package verification and browser acceptance, inspect diff, and record exact state.

Stop conditions: contradictory source variants, unsupported role classification, changed operational data authority, failed verification, or widened scope. Preserve unresolved source exceptions rather than invent values. Protected areas: Platform Home, navigation, other tools, private recipes, persistence, schema. Rollback: revert candidate app commit; no data rollback needed. Merge/deploy: not authorized by this build-only instruction under Chief's explicit production-authority rule. Final report must identify changed files, verification, unresolved classifications and exact release state.

## Verification record

Candidate is based on HEAD `4af8e9fb6cbe26c163379665621c7883baccf58b` in worktree/branch `chief/menu-engineering-paths`. Visible candidate version: `2026.10.23.001-wp-servable-components`. No merge/push/deployment performed.

- `node scripts/verify-pan-ready.mjs`: passed projection, exact variant preservation, source immutability, tier boundaries, conflict quarantine, totals, actual workbook contents and flash-card assertions.
- `node scripts/verify-weigh-pay.mjs`: passed existing calculation, exclusions, missing data, trust and exception guards with updated default price.
- `node node_modules/@playwright/test/cli.js test tests/browser/menu-engineering.spec.js tests/browser/all-menu-wp.spec.js tests/browser/pan-ready-wp.spec.js --workers=1`: 17/17 passed with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4175`, `PLAYWRIGHT_BROWSERS_PATH=C:/Users/leiss/AppData/Local/ms-playwright`, and explicit `WP_CATALOG_SNAPSHOT`. The final test traversed all 53 menus from a fresh read-only Supabase API snapshot (1693 rows), proving exact UI/projection serving-count agreement with zero operational writes or page errors.
- Desktop and mobile split view, pinned selection after filtering, nested prep, source privacy, safe HTML escaping, exact text MRNs, Excel row parity and FC% flash cards exercised. Screenshots: workspace `WORK_LOGS/WP_PAN_READY_2026_10_23/`.
- All-menu traversal exposed duplicate React sibling keys that retained previous cards; keys are now distinct and the traversal passes. Mobile export placement/padding prevents bottom navigation interception.

Limits: name-based category/role rules are conservative guidance, not a claim of final Culinary validation. Source names not recognized as service-ready or assemblies with unresolved links are listed in Classification Review and keep menu qualification conditional. Cost/weight gaps remain Needs information. Source variants with conflicting economics remain separately traceable and unranked. No parent-plate mass or usage amount is borrowed as a child's documented portion mass.

Self-review covered source membership (including Andes/Balti), classification precedence, export/screen count parity, conflicting variants, missing-weight handling and navigation. Independent Reviewer/Verifier/Scribe clearance is not claimed under the continuing solo mission.

- Complete `npm run verify`: PASS, including all package guards, SSMT unit suite and Vite production build. Log retained in workspace `.scratch/WP_PAN_READY_VERIFY.log`; no app code changed after this passing run. Documentation-only finalization followed.
- `git diff --check`: PASS. Build emits the existing Vercel directive/chunk-size advisories; no new build failure.
