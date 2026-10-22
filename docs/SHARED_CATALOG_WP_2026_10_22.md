# Shared catalog and all-menu W&P candidate

Requesting/Approving Admin and Admin of Record: Tyler, authenticated Buzz identity in ADMIN_REGISTRY.md. Source request 44827346f4b20cedc71cd06c9ca588416d52fe38098dc5e90edc6474044e6592 (2026-10-22T21:03:07Z); all-menu view confirmation 37b9cc8413e61268ccfa36ad60c24f9088c90cc6570dd7d1cb0d206bf6e93415 (21:08:21Z). Solo Chief per the thread; no independent review/verification/Scribe clearance claimed.

## Scope and design

Level 4 catalog integration plus approved Level 3 extension of the existing Andes/Balti view. All W&P menu selections open dish/component cards, economics charts, filters and matching brand exports. Existing Andes/Balti analysis snapshots are preserved; additional menus derive membership from the current shared catalog and attach bounded recipe economics from the new books. Existing shared-guidance/session controls remain in an expandable section for additional menus. No recipe viewer, document links, PDF deployment, source instructions, recipe-storage activation, operational import, schema change, account change, submitted-history rewrite or SSMT mutation.

Transfer selector membership now comes from the shared Supabase-backed Recipe Library API instead of the historical bundled catalog. Item names/MRNs/portions remain exact source values; the existing stable normalized composite selector ID is retained for saved-record compatibility. Current live Item + Waste Cost and approved ingredient/G/L allocation rules remain separate. Missing/negative/conflicting costs remain unavailable; source failure blocks stale selectable catalog use. Historical saved transfers are not rewritten. The old bundled transfer catalog is retained as historical reference/fixture data.

The common MenuWorks API loader no longer returns browser overrides before querying shared data. Menu Matrix and Rotations initialize without that override; Rotations fetches current selector rows on each mount. Eligibility, source precedence and SSMT-derived menu rules remain governed by ARCHITECTURE_RULES.md. Other catalog consumers already use the Recipe Library API; this is not proof that every unrelated reference dataset or ingredient costing lookup refreshes from an item row.

## Sources and extraction

Retained privately under workspace WORK_LOGS/WP_ALL_MENUS_2026_10_22:
- BOOK_1.pdf: SHA256 2b2ec20e7c9e2ac788c6fd29e0ee8a9790edf6b493b469da11501bb5896cc7b6, 1451 pages.
- BOOK_2.pdf: SHA256 ab4d3ba154683656d19c4bec9c9aae105cfda05b4e3798f660c2e8ae970704f6, 2638 pages.
- EXTRACT.mjs, BUILD_ANALYSIS.py, page text JSON, extraction exceptions and rendered source samples. These private work files are outside Git/deploy.

Published projection: src/data/allMenusWpAnalysis.json; 3838 source variants, 2244 exact MRNs, 2388 component-use edges. It contains only bounded names/IDs/portions/costs/documented masses/batch yields/component uses. Continuation pages are retained through each cost section during extraction. Source-page visual inspection confirmed representative cost/batch/component quantities and an explicitly withheld cost. Parent-specific child header context and concrete source blocks constrain linking; unresolved edges are not guessed.

Exact MRN and compatible portion select recipe variants. Differing cost/batch/component graphs remain ambiguous. Current shared mass is labeled as such; recipe snapshot costs and shared menu economics remain separate. No count/volume-to-mass inference. When no validated recipe link exists, the current item remains visible with trusted shared economics and an explicit link status. Unknown component costs remain unavailable.

Read-only comparison against the saved actual 1693-row/53-menu catalog: 1509 compatible memberships, 60 ambiguous memberships, 124 without a recipe header match. This count describes the new-books matcher, not historical Andes/Balti view sizes. Some unlinked rows are purchased ingredients, not missing recipe documents. All 98 null source cost variants correspond to explicit source statements that cost cannot be determined because a component is not visible to the report user's team. These source limitations must not be relabeled complete component economics.

## Verification and current state

Candidate version 2026.10.22.004-shared-catalog-wp-menus. IMPLEMENTED; no merge, deployment or production verification in this mission. The last production release remains the preceding .003 release.

New guards first failed before the missing module existed, then passed. Coverage includes exact MRNs, preserved input rows, ambiguous variants, unresolved source costs, new Transfer membership, shared-source failure, projection allowlists and every resolved edge's child MRN. Affected W&P/Transfer browser suite passed 28/28 during development; final verification is recorded in the workspace logs. Actual saved-catalog local browser traversal checked all 53 menus with zero page errors or operational writes and mobile containment. This uses intercepted saved actual data and is not production verification.

Full package checks/build passed during development. Broader rotation suites exposed existing fixed-week and selector failures. The sampled Re:Invent saved split-block recall and North Commissary selector failures reproduce on unchanged baseline b36d3b8 in an isolated worktree. No full-browser-green or independent clearance claim. Logs: VERIFY_RELEASE.log, BROWSER_GREEN.log, ACTUAL_BROWSER_PROOF.json, BASELINE_ROTATIONS.log; subsequent final/committed logs supersede development runs.

## Release and recovery

No production menu data changed. No migration or data restore required. Application rollback is a revert of this candidate; prior deployed application 1060d53 / records b36d3b8 and deployment dpl_Dr4rVrLEEUvvnqeRVjFZVDTc9JF4 are the preceding recorded state. Production action still needs explicit authority under Chief's current mission instructions and release safety gates. The broader rotation failures are release limitations, not evidence of production correctness. Full recipe storage remains deferred.
