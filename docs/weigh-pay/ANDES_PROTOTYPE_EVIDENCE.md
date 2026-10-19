# Andes prototype development evidence

Request and authority: Tyler, registered and Release-Authorized in ADMIN_REGISTRY.md, requested the private Andes prototype Oct 13 and solo execution Oct 19. Execution is local development; no production migration, import, viewer enrollment, endpoint activation or deployment occurred. Main was freshly checked with `git ls-remote origin refs/heads/main`: `06172be0630a7613f16cb1274962614ea3273177`, matching the recovered worktree base.

## Implemented development scope

- W&P overview, menu qualification counts, private recipe counts when authorized, and category bars explicitly based on item counts. No organizational approval or pan footprint is inferred.
- One scenario selling rate with oz/lb conversion; invalid rates cannot qualify items or export. Reports, workbook summaries and snapshots use the evaluated price. Original 40%/60% gates remain unchanged.
- Separate confidential recipe endpoint, disabled unless explicitly enabled and a verified-user-ID allowlist is configured. Every read verifies the bearer token with Supabase Auth before the service-role RPC. Existing shared admin codes are not accepted. Private responses use no-store; tokens remain in memory, and displayed private data automatically locks within 15 minutes.
- Approved item links resolve recipe variant IDs. Nested component costs/weights are evaluated independently, with cycles/depth guarded and blank pan display. Complete source pages are available only within the private view. Components never increase a parent's menu score.
- Additive schema draft: isolated `culinary_private` tables with RLS, no anon/authenticated grants or policies, inactive import batches, service-only RPC restricted to the active Andes batch, and no Menu Library relation. SQL has not been executed or verified against a live database.
- Local source extraction preserves raw pages and candidate serving/component provenance. Candidates remain unreviewed outside Git. Import preparation rejects unreviewed variants/components, missing provenance and invalid mass, creates a new local file only, and never contacts Supabase. Synthetic preparation passed; the actual unreviewed candidate input was rejected as intended.

## Verification

- New model/security checks were observed failing before implementation because the new modules were absent.
- `node scripts/verify-wp-prototype.mjs`: passed price conversion/overflow/invalid-price checks, exact MRNs, component isolation, cycle/missing-link handling, denied access without storage calls, verified-ID access checks, forged/unapproved tokens, denied login, sanitized service failures and report/snapshot price consistency.
- `node scripts/verify-weigh-pay.mjs`: original qualification guards passed.
- `npm run verify`: complete package guard chain and Vite production build passed before final documentation/version updates. Final rerun recorded below.
- W&P browser suite: 10/10 passed with synthetic private fixtures and intercepted APIs, including two new tests for adjustable-price exports and private nested components/blank pan/lock behavior. Initial launch failed solely because the worktree's expected browser directory was absent; using the existing shared Chromium installation resolved it.
- Full browser suite: 106 passed / 41 failed (147 total, 9.7 minutes). It targets local preview, never production. Broader failures are not waived or called baseline-confirmed without fresh comparison.
- Self-review covered complete application diff, private endpoint identity/authorization boundaries, no private export path, SQL grants, importer path resolution and source reconciliation limits. This is not independent approval.

## Production decision and remaining work

Approve an application viewer policy before activation. Proposed policy is registered admins only, mapped to explicitly verified Supabase Auth user IDs; no users are enrolled or guessed. Review `supabase/private-andes-recipes.sql` before authorizing its additive production execution. Source candidate reconciliation and explicit item-link approval remain required before preparing the real import; raw PDF extraction is not validation. Production migration/import authorization is not inferred from the earlier shipped W&P deploy instruction.

No SQL execution proof or full private live workflow is claimed. Independent review/verification remain unavailable under the solo instruction; LIVE is not claimed. To roll back development, revert this candidate; to stop future private access, unset `PRIVATE_RECIPES_ENABLED`. Preserve import batches and source provenance; do not delete operational records.

## Activation prerequisites

Server-only configuration is `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`), `PRIVATE_RECIPE_VIEWER_IDS` (explicit verified Supabase Auth UUIDs), and `PRIVATE_RECIPES_ENABLED=true`. Do not put these credentials or viewer-management controls in VITE variables. Empty enrollment or absent enable flag denies access. Buzz admin identities must be explicitly mapped to verified application users; a shared admin code is insufficient. Disable the enable flag to close the endpoint immediately. Import batches default inactive and no item links are automatically approved.

Final source checks additionally cover import-source SHA binding, invalid MRN types and conflicting mass, no private browser storage, UTF-8 source integrity and absent service categories remaining Review. Synthetic screenshot `.scratch/wp-prototype-overview.png` was visually inspected; it contains fixture data only. Final package guards passed; the standalone guard runner required an explicit Node Vite path for its alternate output directory, whose build then passed. Current targeted browser run passed 10/10 against that separate local preview, preserving the broader run's original assets.

Full-suite failure names from this development run:

- tests\browser\deli-core-menu.spec.js:29:1 › Deli Core is selectable in Transfer Tool with Item + Waste costs
- tests\browser\neighborhood-rotations.spec.js:268:1 › North Commissary cafe label stays inside its selector button
- tests\browser\neighborhood-rotations.spec.js:294:1 › Nessie Global reference picker preserves exact plate builds while rollout remains planner-only
- tests\browser\neighborhood-rotations.spec.js:475:1 › reference plate cost rolls out by menu across current and future planners only
- tests\browser\neighborhood-rotations.spec.js:559:1 › reference plate cost covers split, Nitro, Moby Pop-Up, and LAX planner paths
- tests\browser\neighborhood-rotations.spec.js:598:1 › Fish Market and Core Grill calculate automatic operator-ready plate options
- tests\browser\neighborhood-rotations.spec.js:656:1 › Teriyaki and Anisa Sub Recipe selections satisfy normalized plate builds
- tests\browser\neighborhood-rotations.spec.js:800:1 › Legacy non-Cafe-Express soup rows are neither displayed, costed, nor re-saved
- tests\browser\neighborhood-rotations.spec.js:905:1 › Split-global future week selectors remove menus already chosen in another block
- tests\browser\neighborhood-rotations.spec.js:1085:1 › Dawson Moby Pop-Up starts Aug 31, uses Global or Carvery menus, and recalls an isolated day promo
- tests\browser\neighborhood-rotations.spec.js:1190:1 › submitted Dawson Moby Pop-Up replaces only Moby Global presentation without persisting the projection
- tests\browser\recipe-library.spec.js:3:1 › Menu Library opens without app protection or scoped-state crashes and shows Webtrition weight
- tests\browser\reinvent-submit-recall.spec.js:747:1 › Re:Invent saved split global blocks recall as the submitted menus
- tests\browser\reinvent-submit-recall.spec.js:769:1 › Re:Invent split-block recall ignores a stale legacy one-week menu after resubmit
- tests\browser\reinvent-submit-recall.spec.js:792:1 › Re:Invent split-block recall keeps newest same-block resubmission over stale rows
- tests\browser\reinvent-submit-recall.spec.js:817:1 › Re:Invent edit and resubmit keeps changed Monday-Tuesday menu after leaving and returning
- tests\browser\reinvent-submit-recall.spec.js:858:1 › Re:Invent recall reads live Supabase café and entrée column shapes
- tests\browser\reinvent-submit-recall.spec.js:875:1 › Re:Invent split-block recall rejects raw-label stale rows after leaving and returning
- tests\browser\reinvent-submit-recall.spec.js:898:1 › Re:Invent recall ignores stale child rows that disagree with submitted Global Block menus
- tests\browser\reinvent-submit-recall.spec.js:917:1 › Re:Invent recall prefers a global-selection record's own submitted menu over stale weighted aggregate evidence when no global block row exists
- tests\browser\reinvent-submit-recall.spec.js:934:1 › Re:Invent submitted blocks recover saved item rows that were previously written as Draft
- tests\browser\reinvent-submit-recall.spec.js:954:1 › Re:Invent shared database recall replaces stale local browser cache
- tests\browser\reinvent-submit-recall.spec.js:991:1 › Re:Invent rebuilt records isolate global blocks from other saved weeks
- tests\browser\reinvent-submit-recall.spec.js:1024:1 › Re:Invent shared database recall maps week-start rows over stale display-week cache
- tests\browser\reinvent-submit-recall.spec.js:1073:1 › Re:Invent future week stays blank when shared database has no saved rotation
- tests\browser\reinvent-submit-recall.spec.js:1106:1 › Re:Invent leadership card shows the full recovery week in calendar order
- tests\browser\reinvent-submit-recall.spec.js:1122:1 › Re:Invent full-week promo recall ignores stale normal global rows
- tests\browser\reinvent-submit-recall.spec.js:1149:1 › edit and resubmit state clears when switching cafes
- tests\browser\reinvent-submit-recall.spec.js:1176:1 › Doppler recall keeps the submitted global block menu over mismatched child rows
- tests\browser\reinvent-submit-recall.spec.js:1193:1 › Doppler leadership card shows Monday-Tuesday carryover and Wednesday-Friday current menu
- tests\browser\reinvent-submit-recall.spec.js:1209:1 › Grace leadership card shows Monday-Tuesday carryover and Wednesday-Friday current menu
- tests\browser\transfer-tool.spec.js:38:1 › Transfer Tool expands a selected item into automatic ingredient G/L rows and exports them
- tests\browser\transfer-tool.spec.js:74:1 › Transfer Tool automatically balances positive residual cost and allows every mapped G/L to change
- tests\browser\transfer-tool.spec.js:102:1 › Transfer Tool assigns one unresolved recipe component the authoritative item-cost remainder
- tests\browser\transfer-tool.spec.js:122:1 › Transfer Tool proportionally caps every mapped G/L at Item + Waste Cost
- tests\browser\transfer-tool.spec.js:147:1 › Transfer Tool exports an unmapped item through the approved Prepared Foods fallback
- tests\browser\transfer-tool.spec.js:170:1 › Transfer Tool does not use the Prepared Foods fallback during a mapping-service failure
- tests\browser\transfer-tool.spec.js:182:1 › Transfer Tool maps every soup to Prepared Foods while allowing a chef override
- tests\browser\transfer-tool.spec.js:197:1 › Transfer Tool retains the current cafe profit-center mappings
- tests\browser\transfer-tool.spec.js:203:1 › Transfer Tool batch export uses stored automatic allocations without writes
- tests\browser\transfer-tool.spec.js:216:1 › Transfer Tool deletes one saved draft after one confirmation

Final `npm run verify` passed all package guards, including both new prototype/import guards, and the Vite build. All 41 full-browser failure names are also present in the previous release evidence after trimming reporter whitespace; an unchanged-baseline rerun was not performed this turn. The full-suite run used the development snapshot before final small category/encoding safeguards; the affected W&P suite was rechecked after those changes. No broader all-green or independent approval is claimed.
