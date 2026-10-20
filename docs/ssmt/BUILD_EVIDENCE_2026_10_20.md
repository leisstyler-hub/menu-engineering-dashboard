# SSMT build evidence — committed local candidate

State: **COMMITTED**, not merged, deployed, production verified or LIVE. Application commit: `1b6f4303d2e3ec5bf08ccd36ee2c5270f3a95863`, branch `chief/ssmt-accounts-imports`, base `cc463db36d9eb1d45c0afc9d32df2dea6b9b1fe1`. Candidate version: `2026.10.20.001-ssmt-accounts-reuse`. Commit author/committer: runtime Chief identity; no human co-author or sign-off was invented. The first implementation commit includes direct browser acceptance tests.

Requesting / Approving / Release-Authorized Admin and Admin of Record: Tyler, authenticated Buzz identity recorded in ADMIN_REGISTRY.md. Start authorization: event `efa9b429e4cd520447f8c2a40557e9916bec16985057798fce8708f14dddd68c`, 2026-10-20T20:41:47Z. Application commit recorded at 2026-10-20T21:25:22Z. Solo execution was explicitly requested: implementation and self-review/testing are Chief's work; no independent Reviewer/Verifier/Scribe approval exists or is implied.

## Committed-state checks

Each committed-state command was run after `git rev-parse HEAD` returned the application SHA above in the same shell:

- `node --test tests/ssmt/*.test.mjs`: **12/12 passed**. Covers exact MRNs/zero prices, independent modifier copies and legacy references, duplicate defaults, FIXY validation, completed-menu matching, deleted item/option snapshots with readable menu context, audit ordering exclusions, Experience restrictions, disabled-service denial, origin and role checks, revocation, forged actor denial, stale saves, PostgreSQL JSONB key-order-stable revisions, and credential stripping before monitoring.
- `node tests/ssmt/database.integration.mjs`: **passed** in isolated PGlite PostgreSQL. Covers additive setup, original payload preservation, atomic backup/audit/save, stale conflict rejection, a deliberately failed audit rolling the full save back, the last-admin guard, anonymous/service direct-write denial, guarded canonical legacy updates/deletion, audited RPC updates, initial enrollment, and refusal to repeat initial enrollment.
- `node tests/ssmt/restore-backup.mjs <private raw preflight path>`: **passed**. Restored all 18 raw production-row columns into an isolated PostgreSQL table and compared exact JSON under UTC. Production writes: **0**. Raw backup file SHA-256: `1486d6f1fd9a05b0ed39baa9ed199c854ba5b50199d7ee3da1f5c3f4ba60e63d`.
- `npm run verify`: **passed**, including all repository guards and the production build. Four pre-existing generated JSON files needed local LF normalization to match their committed bytes; each filtered Git blob hash was checked against HEAD before refreshing index metadata. They have no release diff. The timeout error emitted inside the load-resilience negative test is expected and that guard passed.
- `node scripts/run-playwright.mjs tests/browser/ssmt-accounts-reuse.spec.js tests/browser/ssmt-tool.spec.js tests/browser/landing-tool-sections.spec.js --reporter=line`: **40/40 passed** on the committed application. Browser path used the existing installed Chromium. All new account/storage actions were intercepted; tests did not save to production. Includes sign-in gating, failed shared-load protection, Experience description saves, independent imports/prices/modifiers, FIXY preview/application, alias search with multi-selection retained across search changes, conflict preservation, public read-only calendar, phone containment/Escape, and all existing SSMT density/lock/export/workflow checks.
- `git diff --cached --check`: passed before application commit. No generated data, raw backups, credentials, local link metadata, scratch helpers or test-tool dependencies were included in that commit.

A phone screenshot was inspected from `.scratch/SSMT_IMPORT_PREVIEW_PHONE.png`: contained 390px preview, readable source/value/MRN/zero-price content and explicit Apply. Scratch screenshots are disposable and contain safe test fixtures only.

## Full browser baseline

The full candidate browser run initially reported **112 passed / 42 failed** (154 tests). A fresh run of unchanged base `cc463db` reported **107 passed / 41 failed** (148 tests). Every base failure name appears in the candidate failure set; the sole added failure was the Home promotion-calendar fixture, which needed to mock the new account-status boundary. That fixture was corrected and passes in the final 40/40 affected suite, alongside the later additional acceptance cases. The full browser suite is **not claimed green**. The exact reproduced base failures are listed below; no unrelated rotation, Transfer, or Menu Library behavior was rewritten to hide them.

## Data and activation evidence

Production project `pzilyzqhatthctgsjwtt` was confirmed ACTIVE_HEALTHY through authenticated CLI metadata. Only read-only SQL was executed: `BEGIN READ ONLY`, a bounded canonical-row/schema/exact-email SELECT, `COMMIT`. At 2026-10-20T21:14:39Z the canonical row still contained **88 menus / 2,361 stored rows / 872 modifier groups**, last database update 2026-10-09T20:28:31.784909Z. The new account/audit/backup tables and the requested Auth user were absent. Raw and expanded backups are retained privately in `C:/Users/leiss/.buzz/WORK_LOGS/SSMT_BACKUP_2026_10_20_205602/`, outside Git. No production schema, record, invitation, enrollment, activation flag, merge or deployment was changed.

The prepared protected step is `supabase/ssmt-accounts.sql` plus `supabase/ssmt-protect-workspace.sql`; initial account provisioning uses the separately prepared `supabase/ssmt-bootstrap-admin.sql`. The canonical write guard is deliberately a brief write cutover: old unaudited clients stop saving, while the new audited RPC remains available. Existing menus/items/FIXYs/MRNs/prices are not rewritten during installation. Exact sequence, rollback and unresolved real-email/session/historical-deployment protection checks: [activation package](ACTIVATION_AND_RECOVERY_2026_10_20.md). Production schema approval remains pending under GOVERNANCE.md; the application deploy and requested initial account setup were already authorized.

## Reproduced base failures

- `deli-core-menu.spec.js` — Deli Core is selectable in Transfer Tool with Item + Waste costs
- `neighborhood-rotations.spec.js` — North Commissary cafe label stays inside its selector button
- `neighborhood-rotations.spec.js` — Nessie Global reference picker preserves exact plate builds while rollout remains planner-only
- `neighborhood-rotations.spec.js` — reference plate cost rolls out by menu across current and future planners only
- `neighborhood-rotations.spec.js` — reference plate cost covers split, Nitro, Moby Pop-Up, and LAX planner paths
- `neighborhood-rotations.spec.js` — Fish Market and Core Grill calculate automatic operator-ready plate options
- `neighborhood-rotations.spec.js` — Teriyaki and Anisa Sub Recipe selections satisfy normalized plate builds
- `neighborhood-rotations.spec.js` — Legacy non-Cafe-Express soup rows are neither displayed, costed, nor re-saved
- `neighborhood-rotations.spec.js` — Split-global future week selectors remove menus already chosen in another block
- `neighborhood-rotations.spec.js` — Dawson Moby Pop-Up starts Aug 31, uses Global or Carvery menus, and recalls an isolated day promo
- `neighborhood-rotations.spec.js` — submitted Dawson Moby Pop-Up replaces only Moby Global presentation without persisting the projection
- `recipe-library.spec.js` — Menu Library opens without app protection or scoped-state crashes and shows Webtrition weight
- `reinvent-submit-recall.spec.js` — Re:Invent saved split global blocks recall as the submitted menus
- `reinvent-submit-recall.spec.js` — Re:Invent split-block recall ignores a stale legacy one-week menu after resubmit
- `reinvent-submit-recall.spec.js` — Re:Invent split-block recall keeps newest same-block resubmission over stale rows
- `reinvent-submit-recall.spec.js` — Re:Invent edit and resubmit keeps changed Monday-Tuesday menu after leaving and returning
- `reinvent-submit-recall.spec.js` — Re:Invent recall reads live Supabase café and entrée column shapes
- `reinvent-submit-recall.spec.js` — Re:Invent split-block recall rejects raw-label stale rows after leaving and returning
- `reinvent-submit-recall.spec.js` — Re:Invent recall ignores stale child rows that disagree with submitted Global Block menus
- `reinvent-submit-recall.spec.js` — Re:Invent recall prefers a global-selection record's own submitted menu over stale weighted aggregate evidence when no global block row exists
- `reinvent-submit-recall.spec.js` — Re:Invent submitted blocks recover saved item rows that were previously written as Draft
- `reinvent-submit-recall.spec.js` — Re:Invent shared database recall replaces stale local browser cache
- `reinvent-submit-recall.spec.js` — Re:Invent rebuilt records isolate global blocks from other saved weeks
- `reinvent-submit-recall.spec.js` — Re:Invent shared database recall maps week-start rows over stale display-week cache
- `reinvent-submit-recall.spec.js` — Re:Invent future week stays blank when shared database has no saved rotation
- `reinvent-submit-recall.spec.js` — Re:Invent leadership card shows the full recovery week in calendar order
- `reinvent-submit-recall.spec.js` — Re:Invent full-week promo recall ignores stale normal global rows
- `reinvent-submit-recall.spec.js` — edit and resubmit state clears when switching cafes
- `reinvent-submit-recall.spec.js` — Doppler recall keeps the submitted global block menu over mismatched child rows
- `reinvent-submit-recall.spec.js` — Doppler leadership card shows Monday-Tuesday carryover and Wednesday-Friday current menu
- `reinvent-submit-recall.spec.js` — Grace leadership card shows Monday-Tuesday carryover and Wednesday-Friday current menu
- `transfer-tool.spec.js` — Transfer Tool expands a selected item into automatic ingredient G/L rows and exports them
- `transfer-tool.spec.js` — Transfer Tool automatically balances positive residual cost and allows every mapped G/L to change
- `transfer-tool.spec.js` — Transfer Tool assigns one unresolved recipe component the authoritative item-cost remainder
- `transfer-tool.spec.js` — Transfer Tool proportionally caps every mapped G/L at Item + Waste Cost
- `transfer-tool.spec.js` — Transfer Tool exports an unmapped item through the approved Prepared Foods fallback
- `transfer-tool.spec.js` — Transfer Tool does not use the Prepared Foods fallback during a mapping-service failure
- `transfer-tool.spec.js` — Transfer Tool maps every soup to Prepared Foods while allowing a chef override
- `transfer-tool.spec.js` — Transfer Tool retains the current cafe profit-center mappings
- `transfer-tool.spec.js` — Transfer Tool batch export uses stored automatic allocations without writes
- `transfer-tool.spec.js` — Transfer Tool deletes one saved draft after one confirmation
