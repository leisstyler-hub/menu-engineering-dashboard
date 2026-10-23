# W&P qualifying portfolio

Requesting/Approving Admin: Tyler, authenticated Buzz identity `12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d`. Scope approved in thread `6790bf6b1e8983699636c81e9f934b0f3186d2a9e7fc21a6be234883a326a2e6`; exclusions confirmed by event `f7f8a37d1c9e9d3a65ccc6f4f29b782c627304cd848d9e2ca10b29dbbaf2ac3b`.

Level 3 display change with read-only data safeguards. Solo Chief continues the active solo mission. Objective: show the spread of unique servable components meeting <=40% FC at $0.70/oz. Deli Core, Grill Core and Salt & Char are excluded from all W&P projections/exports; shared source records remain intact. Existing handheld exclusion continues.

Design: portfolio first, horizontal category bars opening qualifying component lists; show food, FC%, cost/lb and source menu memberships. Default to qualifying foods. Above-metric, service-review and unknown economics stay inspectable. Menu qualification remains a secondary existing workflow. Follow-up approval event `9ef2a1dc48bbcab9a66be7466ef135b0eeb3591e881f94eea265c11646cc350e` replaces the large menu table with a compact menu dropdown containing qualifying percentages and opening the selected data. Exact MRNs identify shared foods; names alone cannot establish identity. Conflicting economics remain unranked, never resolved by selecting a cheaper variant. Missing mass is never inferred.

Approaches: adding another menu chart retains the membership-count problem; replacing menu workflows would widen scope. Add a shared pure portfolio projection and use it for category bars, lists and Excel instead.

Implementation plan (writing-plans skill):

- [ ] Add regression guards for menu exclusions, exact-MRN deduplication, membership preservation, conflicts and 40% boundaries.

- [ ] Implement `wpPortfolioModel.js`; add `WpPortfolio.jsx` before existing menu assessment.

- [ ] Use the same portfolio in exports; preserve individual menu provenance.

- [ ] Run complete package verification/build, browser checks, desktop/mobile screenshots and export assertions; self-review diff and record exact commit/state.

Ownership: Chief, all files. No dependencies, schema, operational data, other tools or protected navigation changes. Stop on source contradiction or failed verification. Rollback: revert this candidate. Development authorized; no independent clearance claimed. Production release requires applicable release authority and exact evidence; no automatic LIVE claim.


Snapshot audit after assembled-flatbread exclusion: 1693 shared rows, 50 eligible menus, 883 unique source components. At the default price: 390 within 40% with no recorded service restrictions (115 Proteins, 79 Starches/grains, 196 Vegetables), 117 above 40%, 217 requiring service review and 159 needing information. 41 component identities have conflicting economics. Counts describe the saved catalog snapshot and conservative classification, not final Culinary approval. Flatbreads/pizzas are excluded as assembled handheld builds; explicitly loaded/mashed/baked/roasted potatoes are categorized as starches rather than by a bacon garnish. No source records were altered.
