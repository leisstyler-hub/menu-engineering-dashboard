# Menu Engineering path choices

Requesting/Approving Admin and Admin of Record: Tyler (identity in ADMIN_REGISTRY.md). Approval/deploy event: 2a298d610cbb5e5f87e842810f54c5f84b260790066bb2f2d0068d7fe4ee05c4 at 2026-10-22T17:43:21Z. Level 3 product change and authorized production action. Solo Chief owns all edits/checks; no independent or Scribe clearance claimed.

Objective: expose W&P guidance through prominent entry choices. Before: operations opens with W&P hidden as third tab. After: green W&P Guidance and blue Menu Matrix cards, stacked mobile/side-by-side desktop, return from each, retained matrix tabs. Scope: dashboard presentation, acceptance tests, version/docs. Excludes API/storage/data/calculations/exports/recipe privacy or other navigation changes. Source authority: ARCHITECTURE_RULES.md. No operational writes.

Sequence: red acceptance, implement, complete package and feature checks, clean-frame self-review, publish and production proof. Stop for relevant failures or expanded scope. Acceptance tests cover keyboard entry, both paths/returns, responsive geometry, matrix modes, W&P calculation/export regressions with API intercepted. Rollback: revert release to baseline 87383d3 (prior app a6a5888 / dpl_4T9yrphafrtdKDFSh8JmU33epbdR). Final state must distinguish production verification from independent LIVE clearance.

Local verification: new 390px/1440px acceptance tests failed on baseline for absent W&P Guidance, then complete Menu Engineering suite passed 13/13 (`node node_modules/@playwright/test/cli.js test tests/browser/menu-engineering.spec.js --workers=1`, external local preview 4188). Desktop/mobile screenshots visually inspected, API intercepted, no operational writes. Production Vite build passed. Full `npm run verify` stopped at existing stale Transfer Tool catalog; continuing found existing stale Ingredient Costing lookup. Scripts and generated data match baseline (git diff --quiet HEAD -- scripts public/data). Remaining package commands were executed separately; final output recorded below. Corepack pnpm wrapper crashed while attempting dependency installation; npm/direct Node used instead. An early runner invocation lost arguments via its Windows shell and selected unrelated tests; direct Playwright CLI resolved this. An early browser attempt began before preview was ready; rerun used stable server. No broader-suite pass is claimed.

Clean-frame self-review: diff changes only initial view state, choice cards, view guards and return navigation; matrix and W&P implementations unmodified. Button semantics, keyboard focus, geometry and both returns checked. No independent review/sign-off under solo instruction.

## Release evidence

App commit: 112b8c93980d1dc4a22db50db021f12eae8da57c. Full feature suite at committed HEAD passed 13/13 (8.9s). Remaining package commands after stale lookup all passed including build (FAILED_CHECKS []). Full package gate is not green due to two unchanged stale generated references.

Published main with GitHub CLI token auth in memory, OpenSSL and secret redaction after normal push stalled. Attribution inspected: Chief runtime identity, no invented human/coauthor trailers. Production dpl_4G5MPZ3QNSAaUyP3exqJoBAWDSCF is READY at exact SHA and canonical alias. Asset /assets/index-K9Gmxypj.js has exact version. Actual-data browser: 54 W&P menus, both matrix modes/returns, mobile/desktop screenshots, zero page errors/overflow; non-GET API blocked (only traffic analytics attempted). See MENU_ENGINEERING_PATHS_PRODUCTION.json and production screenshots.

Initial production suite started during alias transition: first case saw preceding screen (12 passed/1 failed). Stable production rerun passed 13/13 (10.7s), no app changes required.

State: PRODUCTION VERIFIED. Solo Chief per Tyler; no independent reviewer/verifier or Scribe LIVE sign-off claimed. Rollback: revert 112b8c9 to baseline 87383d3 / prior READY dpl_8aqFAt3nd2UdFqUhELKa3D1YExN1, then check prior version.

Timing UTC: request 17:43:21; pickup immediately; first app commit 17:50:13; publish about 17:51; Vercel created 17:51:16.808, READY 17:51:41.913; actual production proof 17:52:02.738; fixture proof completed about 17:53. No independent clearance under solo instruction. Delays: Windows argument forwarding, early server readiness, stale generated references and credential stall. Final records reconciled afterward.

