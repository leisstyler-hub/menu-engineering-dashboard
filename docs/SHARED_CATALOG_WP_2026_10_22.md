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

## Final local verification - 2026-10-22T21:32Z

COMMITTED application a1a675b220590f5e359e3f3392d1ae0408461d84; no push, merge, deployment or production verification. Full package verification/build ran at that exact HEAD with VERIFY_EXIT=0 (COMMITTED_VERIFY.log). Final affected W&P/Transfer suites passed 28/28 (BROWSER_FINAL.log). The rotation/recall suites passed 50/50 after test-only fixture corrections (ROTATIONS_GREEN.log): fixed clock 2026-08-10 keeps July/August fixtures inside the existing five-week selector window, Commissary lookup selects the cafe button rather than the same-named navigation button, and the Nitro reference case targets its existing Thursday/Friday block. All assertions and operational logic remain active; no production date logic or rotation data changed. The earlier development-suite release limitations above are resolved by these test corrections. No full unrelated browser-suite or independent clearance claim.

Final local saved-actual-data browser traversal: all 53 menus have component views, desktop/mobile containment checked, zero page errors and operational writes (ACTUAL_BROWSER_PROOF.json, ACTUAL_BROWSER_FINAL.log). Source privacy/edge-MRN/source-value guards passed. Source exceptions remain as documented above; uniform views do not mean every recipe component has complete economics. Recipe storage remains deferred. Current state COMMITTED; review/release authorization and production verification are separate.

## Production continuation - 2026-10-23

Tyler's authenticated continuation events 1a5581ae48880aadc6e5bfb0c37b4bfc4a803b7f22fcd1e17dff6d18327e181b and e7a5cde33a6d7075e6a5bde929fcef5c9007b2e07a7e97d2110eac24d32b85b6 resume the existing solo mission and deploy-intended thread. Registry authority rechecked. No workers delegated and no independent clearance claimed.

Exact released candidate e1ef00a9b24ba2844ce3d3941f5ae35f5dce3229 contains application a1a675b plus test/record follow-up. Fresh `npm run verify` passed at this HEAD. Local direct browser command reported all 78 tests individually passed but its local server teardown did not finish; do not claim a completed local runner exit for this continuation. The initial wrapper invocation failed before browser launch due to a missing browser installation. Direct CLI with the existing architect worktree browser path corrected setup. The publish helper's bundled pnpm attempted an unsafe reinstall of linked dependencies; setting its package-runner path to installed npm ran the same complete verify script successfully, then pushed without skipping verification. Publish exit 0 recorded in .scratch/WP_RESUME_PUBLISH_NPM.log.

Vercel production deployment dpl_4yXs83K5Af9oXyCqRJPWrCAHMe4m is READY, Git SHA matches e1ef00a, and canonical alias project-d8v25.vercel.app is assigned. Deployment created 2026-10-23T14:10:24Z and READY at 14:10:47Z. Canonical entry /assets/index-B9z7RO0x.js contains exact version 2026.10.22.004-shared-catalog-wp-menus.

Production direct Playwright command: `node node_modules/@playwright/test/cli.js test all-menu-wp.spec.js menu-engineering.spec.js transfer-tool.spec.js neighborhood-rotations.spec.js reinvent-submit-recall.spec.js --workers=2`, with PLAYWRIGHT_BASE_URL=https://project-d8v25.vercel.app and existing browser path. Result 78 passed, exit 0. Storage/operational actions intercepted. Log .scratch/WP_RESUME_PRODUCTION_BROWSER.log.

Production-asset traversal using a fresh live Supabase catalog read opened all 53 W&P menus, confirmed component cards and mobile containment, with zero page errors/operational writes. Direct Transfer browser check allowed the real Recipe Library GET, matched all 53 menu choices to fresh API membership, and checked exact item/MRN labels for AMZ+RA: Barbanzo. No historical transfer was saved or changed. Evidence retained in workspace WORK_LOGS/WP_ALL_MENUS_2026_10_22/RESUME_PRODUCTION_PROOF.json, RESUME_PRODUCTION_TRANSFER.json, RESUME_PRODUCTION_DESKTOP.png and RESUME_PRODUCTION_MOBILE.png; mobile screenshot visually inspected.

State: PRODUCTION VERIFIED; no independent Reviewer/Verifier/Scribe LIVE clearance. Source exceptions (60 ambiguous memberships, 124 without separate recipe headers, 98 source variants with withheld costs) remain visible rather than invented or removed. No operational data/schema mutation, recipe document exposure or recipe-storage activation. Rollback: preceding main b36d3b88c9bd1183b82ee3d611da3c28ba3dab68 / READY production deployment dpl_4N34mVoSAwvQi5R9iZqCofQH8hkk, verified before publishing.

Continuation request 14:03:52Z; recovery/checks started approximately 14:04Z; first application commit remains 2026-10-22T21:26:03Z. Production acceptance complete approximately 14:13Z. About 10 minutes for this continuation; local runner/browser and bundled package-manager setup caused avoidable delay. Independent sign-off timing: not applicable under solo execution.
