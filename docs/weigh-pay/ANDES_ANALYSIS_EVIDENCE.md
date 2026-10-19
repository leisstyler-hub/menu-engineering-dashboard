# Andes recipe-derived W&P analysis

Requesting/Approving/Release-Authorized Admin and Admin of Record: Tyler, authenticated Buzz identity `12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d`. Clarification event `d0b62eb2f9596672a6df7aab11eedacb490e2adcb0b563107683bc7fa6803c86`, 2026-10-19T15:57:34Z, authorizes recipe-derived component cost analysis without a recipe document viewer/hyperlinks. Prior solo instruction continues. Level 3 presentation with Level 4 source-analysis controls; no production database action. Chief owns the bounded implementation, checks and records directly; independent approval is unavailable.

## Scope and source boundary

- Publish an explicit, limited analysis projection: recipe/component names and exact MRNs, serving costs/portions, stated mass, batch-serving count and linked component use quantities. No source PDF, source page text, preparation method, instructions, credentials or document links. The disabled private endpoint remains disabled and is no longer used by W&P.
- The projection is a supplied recipe cost snapshot, separate from current operational menu records. It does not join to or modify Menu Library, Supabase rows, pricing authority or source precedence. No schema execution, recipe import, viewer enrollment or production data change.
- `src/data/andesWpAnalysis.json` contains 21 distinct MRNs across 27 source variants: 19 dishes/standalone variants and 8 nested subrecipe variants. All projection values were checked against the private source-checked extraction; the original hash binds the source. Each parent/child link preserves its exact source variant rather than merging by name or MRN.
- Component cost contribution per parent serving is parent usage quantity / child serving quantity * child serving cost / parent batch servings. Mixed measures convert within mass, volume or count only. The eight linked contributions are computable. Remaining cost is explicitly unallocated; no ingredient prices or mass are invented. Source costs are rounded, so the contribution is an estimate from that snapshot rather than new authoritative costing.
- Component economic fit uses its own serving basis. Parent economics and service restrictions remain separate, and no component changes a parent's menu score. Unset category/service approval stays pending. Volume/count portions expose the minimum measured weight needed for the 40% gate, not an inferred weight or recommended serving.
- At $11.99/lb, the 19 top-level variants have 7 within the 40% economic gate, 3 above and 9 needing weight. Across all 27 variants, 17 need mass. These are economic counts, not approved service counts.

## Presentation

Three portfolio donut charts show menu qualification, category item counts and cost/weight readiness; category counts retain menu-item memberships rather than claiming unique recipes. Andes adds its own economic chart, distinct recipe/variant counts, dish/subrecipe filters, exact-name/MRN search and expandable cost contributions with independent child economics. Pan fields remain blank. Price changes recalculate both analysis and existing reports. The rule explanation now references the selected scenario price.

## Verification

- Test-first model checks failed with missing analysis module; browser acceptance failed with absent charts before implementation.
- Pure guards exercise compatible/incompatible quantities, mixed fractions, independent parent/child economics, missing mass, invalid price and cycle protection. Published-data shape guards permit only the analysis fields and verify all eight source-linked contributions resolve.
- Local W&P browser suite passed 10/10, covering direct no-sign-in Andes analysis, actual source-projection costs, charts, contribution/remainder, absent document links/method text, blank pan, price response and mobile containment; existing exports/session behavior remain covered.
- Full package verification and Vite build passed. Final committed-state rerun and production results are recorded in the release follow-up.
- Desktop screenshot `.scratch/ANDES_ANALYSIS_DESKTOP.png` visually inspected; mobile screenshot `.scratch/ANDES_ANALYSIS_MOBILE.png` retained. Fixtures replace operational APIs during browser regressions; no test writes to shared storage.
- Broader browser limitations from the prior prototype remain documented in `ANDES_PROTOTYPE_EVIDENCE.md`. No fresh all-green full-browser result or independent clearance is claimed.

Rollback: revert this application change to `93c62e0`, or restore the preceding READY production deployment `dpl_9H5pVeUooxZT3tUiix6jkuN6wDYo`. No database rollback needed. Stop on any source text/method leak, unexpected field in the projection, incorrect source arithmetic, changed operational data or failed acceptance gate.


## Committed candidate and deployment blocker

Application commit `b1d6ba047500f771bb8fd3dfceeb17c3b24a917b`. Full `npm run verify` and production build passed at this exact HEAD, followed by 10/10 W&P browser checks. Source-projection values were separately compared against every source-checked recipe/edge. Local proof: workspace `.scratch/ANDES_ANALYSIS_COMMITTED_VERIFY.log`, `.scratch/ANDES_ANALYSIS_COMMITTED_BROWSER.log`.

Automatic approval review rejected the attempted production push, stating that available authorization covers implementation of this revised scope rather than explicit deployment. No retry, alternate deployment, schema action or import was attempted. Production remains at prior main `93c62e0`; this candidate is COMMITTED, not deployed, and requires explicit deployment approval. No independent Reviewer/Verifier/Scribe clearance is claimed under the solo instruction.
