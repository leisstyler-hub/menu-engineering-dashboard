# W&P concept workflow revision

MISSION TITLE: Concept deep dive and brand reports.
REQUESTING / APPROVING ADMIN / ADMIN OF RECORD: Tyler, authenticated Buzz identity 12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d, event f0e8fb10eee505cb35ff95efdf160b24af7da8d67bbde94bd61f02c2de951638, 2026-10-19T20:52:48Z. Identity matches ADMIN_REGISTRY.md.
OBJECTIVE / BUSINESS REASON: Open Andes analysis through menu selection and support brand-level W&P decisions in printable exports.
CLASSIFICATION / TEAM: Level 3 presentation/export with Level 4 unit and source controls. Prior solo direction continues; Chief implements and self-verifies. No independent clearance is claimed.
CURRENT: Andes analysis above menu list, repeated child variants, per-item cards and JSON/README exports.
DESIRED / APPROVED SCOPE: Andes menu selection opens only deep dive; deduplicate nested display; approved/unapproved filters with clear; True Food Cost labels; chart cover, brand cards and Data Audit; no JSON/README.
OWNERSHIP / LIKELY FILES: Chief owns menu-engineering WeighPayView, AndesAnalysis, weighPayExport, model display labels, associated guards/browser regressions and records.
SOURCE AUTHORITY / PROTECTED AREAS: ARCHITECTURE_RULES.md; supplied analysis remains separate from operational costs. No raw recipes, methods, viewer links, Menu Library changes, production writes, schema changes or new dependencies.
DATA RISKS / STOP CONDITIONS: Do not infer volume-to-mass density or cooked yield. Preserve source MRNs, variants and every parent link internally. Stop unsupported approval, source exposure, operational writes or failed acceptance checks.
SEQUENCE: Inspect current source and docs, implement bounded changes, self-review diff, full package guards/build, browser acceptance, export content/print checks, document limitations.
ACCEPTANCE / REQUIRED TESTS: Andes selection replaces generic view; three unique child cards retain eight links; filters clear; labels consistent; one brand per card; dashboard charts on cover; Data Audit filenames; ZIP has no JSON/README; escaped export content; scenario price stays synchronized; responsive containment and zero operational writes.
REQUIRED REVIEWERS: Independent Reviewer/Verifier unavailable under continuing solo direction. Self-review does not substitute for independent clearance.
DOCUMENTATION: This evidence record, AI_HANDOFF.md and CHANGELOG.md.
ROLLBACK: Revert revision files to preceding b2be6da. No data migration.
MERGE / DEPLOY AUTHORITY: Not granted for this revised scope. Earlier deployment approval applied to b1d6ba0 only; prior automatic-review rejection required explicit approval for a revised scope.
FINAL REPORT: Exact state, checks, unresolved source weights and release boundary to Tyler in originating thread.

## Source reconciliation

Checked local source-validated extraction and original source text, kept private in workspace .scratch/wp-recipes. Published projection source hash remains b47bbce45b97311b1183bb3033a11d3f6aa351a721e232b6c7a3104525117842.
Aji Amarillo puree is $2.05 per 1/4 cup, equivalent to $8.20 per cup. A volume portion alone cannot establish pounds. Source serving_mass_oz remains null for this variant. No water-density substitution or sum of raw ingredient weights is presented as cooked serving mass. Unresolved mass must remain visible and cannot become economic or service approval.

## Implementation and verification

Full package `npm run verify` including production build passed before the last export integration; final rerun follows. W&P/Menu Engineering browser suite passed 11/11, covering menu-triggered analysis, replacement of generic Andes detail, three deduplicated child cards, filters/clear, source costs, True Food Cost label, price synchronization, ZIP contents and safe escaping, session overrides, private-content boundary and mobile containment. Initial browser launch failed because the worktree browser cache was absent; using the already installed Chromium cache resolved it.

A captured operational snapshot exported 54 brand cards with three cover charts; Andes has one card with the 19 source dish variants rather than the operational generic rows. Cover and Andes card screenshots were visually inspected; printable HTML and a local PDF were generated. Screenshots: workspace `.scratch/wp/workflow-cover.png`, `.scratch/wp/workflow-andes-card.png`. Browser log `.scratch/WP_WORKFLOW_BROWSER.log`; full guards/build `.scratch/WP_WORKFLOW_VERIFY.log`.

Remaining requirement: eliminate all missing-weight flags. Seventeen source variants (nine top-level) lack verified mass in the source projection. Added supported cost-per-cup calculation; no missing mass was fabricated. Asked Tyler whether to retain verified-only values or permit explicitly labeled density/yield estimates. This choice remains pending; silence is not approval. No production action or independent sign-off.


## Committed-state proof

Application commit `3d8384ca5936fd81fbe0df7edde313de9512a4fd`. The same shell confirmed HEAD before and after full `npm run verify` (exit 0, includes production build) and `PLAYWRIGHT_BROWSERS_PATH=C:/Users/leiss/AppData/Local/ms-playwright node scripts/run-playwright.mjs menu-engineering` (exit 0, 11/11). Working tree was clean. Logs: workspace `.scratch/WP_WORKFLOW_COMMITTED_VERIFY.log` and `.scratch/WP_WORKFLOW_COMMITTED_BROWSER.log`. Revision is COMMITTED locally; no push, merge, deployment or operational write. Weight-resolution requirement remains open. No independent sign-off.
