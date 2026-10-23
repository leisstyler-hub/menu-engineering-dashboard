# W&P qualifying portfolio

Requesting/Approving Admin: Tyler, authenticated Buzz identity `12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d`. Scope approved in thread `6790bf6b1e8983699636c81e9f934b0f3186d2a9e7fc21a6be234883a326a2e6`; exclusions confirmed by event `f7f8a37d1c9e9d3a65ccc6f4f29b782c627304cd848d9e2ca10b29dbbaf2ac3b`.

Level 3 display change with read-only data safeguards. Solo Chief continues the active solo mission. Objective: show the spread of unique servable components meeting <=40% FC at $0.70/oz. Deli Core, Grill Core, Salt & Char and sandwich menus are excluded from all W&P projections/exports; shared source records remain intact. Existing handheld exclusion continues.

Design: portfolio first, horizontal category bars opening qualifying component lists; show food, FC%, cost/lb and source menu memberships. Default to qualifying foods. Above-metric, service-review and unknown economics stay inspectable. Menu qualification remains a secondary existing workflow. Follow-up approval event `9ef2a1dc48bbcab9a66be7466ef135b0eeb3591e881f94eea265c11646cc350e` replaces the large menu table with a compact menu dropdown containing qualifying percentages and opening the selected data. Exact MRNs identify shared foods; names alone cannot establish identity. Conflicting economics remain unranked, never resolved by selecting a cheaper variant. Missing mass is never inferred.

Approaches: adding another menu chart retains the membership-count problem; replacing menu workflows would widen scope. Add a shared pure portfolio projection and use it for category bars, lists and Excel instead.

Implementation plan (writing-plans skill):

- [x] Add regression guards for menu exclusions, exact-MRN deduplication, membership preservation, conflicts and 40% boundaries.

- [x] Implement `wpPortfolioModel.js`; add `WpPortfolio.jsx` before existing menu assessment.

- [x] Use the same portfolio in exports; preserve individual menu provenance.

- [x] Run complete package verification/build, browser checks, desktop/mobile screenshots and export assertions; self-review diff and record exact commit/state.

Ownership: Chief, all files. No dependencies, schema, operational data, other tools or protected navigation changes. Stop on source contradiction or failed verification. Rollback: revert this candidate. Development authorized; no independent clearance claimed. Production release requires applicable release authority and exact evidence; no automatic LIVE claim.


Snapshot audit after assembled-flatbread exclusion: 1693 shared rows, 49 eligible menus, 867 unique source components. At the default price: 382 within 40% with no recorded service restrictions (112 Proteins, 76 Starches/grains, 194 Vegetables), 113 above 40%, 213 requiring service review and 159 needing information. 41 component identities have conflicting economics. Counts describe the saved catalog snapshot and conservative classification, not final Culinary approval. Flatbreads/pizzas are excluded as assembled handheld builds; explicitly loaded/mashed/baked/roasted potatoes are categorized as starches rather than by a bacon garnish. No source records were altered.

## Verification and release state

PRODUCTION VERIFIED on 2026-10-23 under Tyler's explicit deploy authorization event `e9844ff150f1047cea3ac50551a9d2ca0c1d058b5d375a5e72b252e40e5b162b` at 18:14:58Z. Registered/release authority verified in ADMIN_REGISTRY.md. Released `7ae3800aeb90d359ba75da736f6f034c48a325b7` (app `c7f54ac`), READY production deployment `dpl_27gfFRHvEEaNLD9pV5qDCcDtKtnL`, canonical https://project-d8v25.vercel.app/ asset `/assets/index-tCcbkndP.js` contains the approved version. Fresh full package verification/build passed at release HEAD; publish source guard confirmed ancestry before pushing main. Initial pnpm launcher attempted an unsafe cross-worktree install and stopped before push; rerun used npm as the package-script runner without changing dependencies or skipping verification.

Production Playwright report: 19/19 passed in 19.2s, including 49-menu saved-catalog traversal and portfolio/Excel assertions. PowerShell returned a wrapper error on the NO_COLOR/FORCE_COLOR warning despite the passing report; actual API-backed workflow independently exited 0 at 1440px and 390px. Fresh real catalog: 1693 rows, 49 eligible menus, 382 qualifying components and 382 Excel rows with unique exact text MRNs and full matching menu memberships. Exclusions, menu selection, viewport containment and zero page errors verified. Mutating requests were blocked during real-data verification (only traffic telemetry attempted); no operational writes occurred. Evidence: workspace `WORK_LOGS/WP_PORTFOLIO_2026_10_23/RELEASE_VERIFY.log`, `PUBLISH_NPM.log`, `DEPLOYMENT.json`, `PRODUCTION_BROWSER.log`, `PRODUCTION_CHECK.json`, `PRODUCTION_1440.png`, `PRODUCTION_390.png`, `ASSET_CHECK.json`.

Rollback: preceding main `a203a61760dbd79eabe8e5614b731ab4289327af` / READY deployment `dpl_631eTiQrkbVsnkSDXi7DMfkAXwRw`; revert candidate or restore that deployment. Source classifications remain provisional; conflicts and missing information stay outside the passing count. Solo Chief; no independent Reviewer/Verifier/Scribe LIVE clearance. Documentation-only release record follows the tested application candidate. Historical local verification below remains evidence of pre-release state.

COMMITTED application: `c7f54ac08b11c7a37754905219862b70a038e2fe` (main feature commit `265ade36e00eb0ed5b9f0aa00c004c0b1ed9cab3`), branch `chief/menu-engineering-paths`, version `2026.10.23.002-wp-qualifying-portfolio`. Full `npm run verify` passed at the application commit, including all package guards and production build. Affected browser checks passed 19/19 at that commit, including all 49 eligible menus, actual saved-catalog portfolio count parity, desktop/mobile chart/list geometry and containment, compact picker, keyboard-accessible list, Excel deduplication/exact MRNs/membership and FC flash cards. The browser server rebuilt the candidate before testing.

Evidence: workspace `WORK_LOGS/WP_PORTFOLIO_2026_10_23/FULL_VERIFY.log`, `BROWSER.log`, `AUDIT.mjs`, `COVERAGE.json`, `DESKTOP.png`, `MOBILE.png`. Tests intercept APIs; read-only snapshot is the prior captured 1693-row Supabase response. No operational data writes, push, merge or deployment performed. Self-review checked source exclusions, cross-menu identity, conflicting/missing economics, source immutability, export parity, selected-menu navigation and removed-control callbacks. Classification remains conservative guidance, not final Culinary approval. Solo Chief: independent Reviewer/Verifier/Scribe clearance is not claimed. Rollback: revert these application commits. Documentation-only evidence commit follows.
