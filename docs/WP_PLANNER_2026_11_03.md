# W&P planner - November 3, 2026

Owner Chief. Tyler request 206635fcaa07a294b17554b80cf9d49f1f0f851aec58279e62df5d2edc04b7ed and build authorization 666d1d9e93383309d0db4242b48e7738f1d14b84542bbaecfae6725df223a8a4. Reused chief/wp-pan-tags at baseline 94ebc8c. Version 2026.11.03.003-wp-planner. App publication follows ordinary deploy-intended scope; no shared-profile/schema/import write is part of this release.

## Changes

One compact persistent station strip shows Hot/Cold/Ambient footprints and separate individual-choice targets. Expand Edit capacity to change equipment. Food browsing is bounded; station selections retain their own desktop scrolling. Suggestions appear after selections. Suggest items preserves all choices/locks, fills remaining compatible capacity, favors culinary/protein diversity and one premium highlight, and leaves named shortages. Ingredient overlap uses hashed exact source-description keys, excluding broad pantry inputs; it does not prove SKU equivalence or savings. Season selection is removed.

Salads default to proposed Cold unless explicit recipe service evidence supports hot. Ambiguous warm-salad names and conflicting evidence stay unresolved. Cooking and texture keywords cannot establish ambient holding. Temperature flags and service placements remain distinct; conflicting Reviewed source values are preserved in storage and surfaced as Needs review in the planner. App-derived metadata is not shared-profile persistence or service approval.

Pan plans accept explicit compatible serving volume without mass for serving and cost estimates. Weight-dependent sales remain incomplete without mass. Portions and cups use exact compatible serving evidence. Salads default individual with Serve in pans; rice can use individual portions, cups or hotel pans. Handhelds are added only to planning, still outside W&P qualification; mixed fixed-price station sales stay incomplete. Optional comparable sauced-dish reference ranges use Tyler's reported full-pan Butter Chicken 21 lb 3 oz-24 lb 12 oz, adjustable by the chef and never relabeled measured for another food. Invalid ranges fail visibly without switching scenarios.

RA source membership is derived from packet menu headers. Include RA menus defaults off; active Pairwise matrices, portfolio/pillar percentages and counts recompute together, including historical views. Hidden pair selections reset. W&P menus follow the same default scope. Source records and retired concept history are retained.

The audit opens to a five-row priority summary, then groups compatible item/portion corrections across memberships; distinct economics and portions remain separate. Full source detail is optional. Temperature conflicts have explicit remediation; exports share current Tags and preserve text MRNs and percentage formats.

## Evidence and limitations

Private source audit covers 3812 recipe occurrences. 1580 linked source variants support 1494 of 1693 freshly read catalog rows. All catalog rows were evaluated: 836 have a single proposed placement, 857 remain unresolved, and 16 have source service conflicts. These include source/supporting foods outside active W&P selections. Zero evaluated salads or flagged temperature-controlled foods are Ambient. Remaining unknowns are intentionally visible, not guessed or called reviewed.

No recipe methods, PDFs or method text are shipped. Public evidence keys are hashed and limited to exact menu/MRN/portion links. Private audit/companion correction manifests and review evidence remain under workspace RESEARCH/WP_PLANNER_2026_11_03. Existing catalog, recipe storage and SSMT are unchanged.

Model regressions and browser acceptance exercise partial fills, locks, fractional footprints, count forecasts, rice cups, salad pan exception, source-volume-only quantities, reference scenarios, preserved unknowns, audit grouping, real XLSX downloads, RA toggles, historical/recipe comparisons and mobile layouts. Independent source/code review APPROVED after findings were fixed; Chief performs implementation and release verification. Full required npm run verify is the repository gate. The final candidate and exact deployment/rollback state are recorded in the workspace release result, not inferred from this document.

## Rebuild source evidence

Use scripts/build-wp-service-evidence.py with explicit --source (private packet directory), --catalog (read-only shared response), --pdf-runtime (existing local PyMuPDF dependency), --output src/data/wpServiceEvidence.json, --audit (private workspace report), and --ra-output src/data/raConcepts.json. It emits no methods. Run scripts/audit-wp-profiles.mjs with a shared-catalog JSON response and private output path. No credentials, uploads or source writes occur in either script.

Rollback app baseline: 94ebc8c / dpl_A5zcJq8ZWN9rFacRLBiMyHdbEqXZ. No shared-data rollback is required for this app-only candidate.
