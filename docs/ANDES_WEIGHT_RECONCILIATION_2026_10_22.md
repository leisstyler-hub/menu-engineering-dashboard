# Andes documented weight reconciliation - October 22

Requesting Admin / Admin of Record: Tyler, authenticated Buzz 12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d, active Registered / Release-Authorized in ADMIN_REGISTRY.md. Request event 60d30b74abf58c1acf910f75de0e7047a8690ceaebd8ca26d038f370864e02e5. Solo instruction continues. Bounded Level 4 read-only analysis correction approved following the exact-MRN/portion design in preceding thread messages. No shared data writes, schemas, imports, recipe documents or source-authority changes.

Objective: resolve misleading missing weights in Andes recipe-derived analysis with already documented shared weights. Model accepts shared rows only from trusted Supabase callers; exact concept, exact text MRN and equivalent portion dimension/quantity required. Conflicting or missing matching weights are rejected. Explicit recipe mass takes precedence; cost snapshot and component contribution calculations remain intact. Screen and export share the same calculation. UI shows cost and weight provenance; export describes the combined basis.

Verification: regression guard first failed null versus 2.2 before implementation; final guards pass. Browser acceptance checks a 1-cup Arroz Chaufa resolves 6.6 oz with snapshot cost 0.74, nested missing weights persist, and export provenance agrees. Initial assertion accidentally included collapsed child text; scoped to parent status after inspecting failure. Final entire Menu Engineering suite 14/14 passed, including mobile/desktop navigation and zero operational writes. Build passed. Full npm verify stops at stale Transfer Tool catalog; executing every package command separately finds exactly two failures: stale Transfer Tool catalog and stale Ingredient Costing lookup. These scripts/generated data match starting HEAD 853d85c; no unrelated regeneration performed. Logs: workspace .scratch/ANDES_WEIGHT_VERIFY.log, ANDES_WEIGHT_ALL_CHECKS.log, ANDES_WEIGHT_BROWSER_FINAL.log, ANDES_WEIGHT_BUILD.log.

Read-only actual production input check HTTP 200 supabase-recipe-items: all nine top-level missing weights filled, zero top-level unresolved, eight nested variants unresolved. This is local model evaluation with production inputs, not production behavior verification. Recipe snapshot remains 21 MRNs/27 variants. No source data was edited.

Self-review: exact IDs, variant isolation, duplicate conflicts, trusted-source boundary, matching export, preserved snapshot costs, missing subrecipe uncertainty and no operational writes checked. No independent Reviewer/Verifier/Scribe clearance under solo instruction.

State: COMMITTED, not deployed. Deployment blocked by package gates per RELEASE_RUNBOOK.md. Rollback: revert this candidate; no data rollback needed. Production remains previous 2026.10.22.001 release. Do not claim LIVE or production fixed.


## Release continuation

Tyler requested completion in event c382e4c04e4ed8382cd12448a976a5a5fe377657b18d096b8fea851923746004. Both stale-file errors were solely CRLF/LF differences: regeneration of both outputs produced zero Git content diff. The two generator check comparisons now normalize CRLF to LF, still detecting content drift. No catalog, ingredient prices or operational source content changed. Earlier blocking assessment is superseded after the full package rerun passes. Release target remains the existing project-d8v25 production app; rollback deployment dpl_DsdP2wkKAokc15BQZPmRSpXenDdS at 853d85c.


## Production verification

Released application/check commits 8ced06b + 93229dc (production SHA 93229dc7f35528541264d530238e6efc66b06a4b), version 2026.10.22.002-andes-weight-reconciliation. Full publisher package verification/build passed at this exact head, local Menu Engineering suite 14/14. Vercel dpl_9ETW4wHNZiP3exG8hgncXoP9AAQs READY for production; canonical asset /assets/index-DYOdWJg8.js has exact version. Settled production suite 14/14; initial run had one mobile path-navigation timeout (13/14), stable rerun passed without code changes.

Real production browser at 2026-10-22T19:17:05.184Z verified Arroz Chaufa 6.6 oz and Fried Plantains 4.186 oz with Shared item data labels and parent status no longer Needs weight; all 19 dishes rendered. Desktop/mobile containment checked, zero page errors/operational writes. Evidence docs/ANDES_WEIGHT_PRODUCTION.json; screenshots/logs workspace .scratch/ANDES_WEIGHT_PRODUCTION_DESKTOP.png, ANDES_WEIGHT_PRODUCTION_MOBILE.png, ANDES_WEIGHT_LIVE_ACTUAL.log, ANDES_WEIGHT_LIVE_BROWSER_FINAL.log, ANDES_WEIGHT_PUBLISH.log. PowerShell legacy live-version polling has TLS receive failures; direct Node version check and real browser verification succeeded independently.

State: PRODUCTION VERIFIED. Solo execution, no independent Reviewer/Verifier/Scribe LIVE sign-off. Eight unmatched nested subrecipe variants still need documented mass. Rollback restore dpl_DsdP2wkKAokc15BQZPmRSpXenDdS or revert app 8ced06b. No data migration or rollback.

Timing: original fix request 18:56:40Z, initial app commit 19:01:21Z; completion request 19:13:09Z, production deployment created 19:16:14Z, real production proof 19:17:05Z, stable browser suite completed around 19:17:40Z. Earlier delay: line-ending failures were misclassified as stale data; regenerated output showed no Git content changes. No additional admin files were needed.
