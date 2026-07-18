# AI Handoff

Last updated: July 18, 2026

Current release version: `2026.07.18.005-webtrition-search-only`

Latest process update: July 16, 2026 added `scripts/publish-live.ps1`, `pnpm run publish:live`, and `docs/DEPLOYMENT.md` to standardize the proven GitHub CLI token + portable Git/OpenSSL publish path. This is a docs/process change and does not bump the visible app version.

## First Rule

Read this file before changing code. After every meaningful change, update this file, `CHANGELOG.md`, and the visible version stamp when the live app changes.

Handoff protocol:

1. Start every code pass by reading this file, `CHANGELOG.md`, `src/shared/appConfig.js`, and the working tree/source sync status.
2. Treat GitHub/Vercel/Supabase/live app as the shared truth, not just the local checkout.
3. When a change is meaningful, update this handoff with the new version, current state, verification, and any risks that the next Codex/co-worker must know.
4. Never leave a release with the handoff pointing to an older version than the visible app.

This project is actively developed by more than one person and may be touched from phone, PC, GitHub, Vercel, and multiple Codex sessions. Do not trust local state alone.

## Project Links

- Live app: https://project-d8v25.vercel.app
- GitHub repo: https://github.com/leisstyler-hub/menu-engineering-dashboard
- Vercel dashboard: https://vercel.com/tylerl-s-projects/project-d8v25
- Supabase project: https://supabase.com/dashboard/project/pzilyzqhatthctgsjwtt

Vercel project:

- Project name: `project-d8v25`
- Project ID: `prj_RxAALht8hMh8pZkXlQI9sFN5WXyv`
- Team/org ID: `team_LaYFddEwEQOma3gSdhOPYWC1`

Supabase project:

- URL: `https://pzilyzqhatthctgsjwtt.supabase.co`
- Project ref: `pzilyzqhatthctgsjwtt`

## What This App Is

Culinary Tools Platform is a React/Vite app for Compass One culinary operations. It is not a generic demo app. The user is using it as a real operating platform and promotion-worthy project, so data integrity and visible polish matter.

Main goals:

- Plan and price menus.
- Declare weekly neighborhood menu rotations.
- Track Lean/DOWNTIME observations.
- Browse recipe/menu item information.
- Track menu project workflows.
- Audit Culinary App, SSMT, and Centric brand report alignment.
- Keep enough trust, history, and dashboard signals for leadership review.

## Architecture Snapshot

- Frontend: React 18, Vite, plain CSS, lucide-react icons.
- Hosting: Vercel production at `project-d8v25.vercel.app`.
- Server/API: Vercel functions under `api/`.
- Primary shared storage: Supabase.
- Fallback/mirror storage: Smartsheet through server endpoints.
- Local browser storage: allowed only as convenience cache, never a source of truth for critical shared data.
- Menu item source: MenuWorks-derived data, increasingly served through API/Supabase instead of direct heavy client imports.
- Smoke tests: Playwright under `tests/browser`.
- Release guards: scripts under `scripts/verify-*.mjs`.

## Tool Map

### Landing Page

File area: `src/app/`

Purpose: App hub, dashboard stats, traffic, changelog, and tool cards.

Watch-outs:

- Mobile layout should feel like a real mobile app, not a squeezed desktop page.
- Weekly Traffic must exclude browser smoke/automation traffic.
- Weekly Traffic must not depend on Smartsheet writes/reads; Smartsheet hit the 500,000-cell limit on July 14, 2026. The traffic endpoint is now Supabase-first through `app_records` and should return a safe fallback instead of exposing raw storage errors.
- Weekly Traffic is not a historical archive. It should keep only the current Monday-Sunday visitor week and prune older `Traffic Daily Visitor` rows from Supabase on traffic reads/writes.
- Tool cards should be visually balanced and not leave awkward empty space.
- Webtrition is an external tool card on the platform home. It opens `https://www.webtrition.com/ui/#/` in a new tab and uses `public/webtrition-logo.png`; do not route it as an internal React tool.
- Webtrition recipe URLs can collapse back to the base Webtrition app after Webtrition auth/session routing, and forced side-panel recipe links can show `You do not have access to this Recipe!` for the user's current region/role. Treat this as external Webtrition behavior. Menu Library should open plain MRN search links in a new tab and provide a Copy MRN fallback instead of relying on embedded or guaranteed side-panel deep links.

### Menu Engineering

File area: `src/features/menu-engineering/`

Purpose: Price, cost, category, trust, and portfolio analysis.

Watch-outs:

- MenuWorks upload should not live here long term; recipe/menu truth uploads belong in Menu Library.
- Trust layer must separate complimentary rows from true pricing gaps.

### Neighborhood Rotations

File area: `src/features/neighborhood-rotations/`

Purpose: Weekly cafe menu selections, station selections, executive read, saved/locked rotations, and results.

Critical integrity rules:

- A submitted/locked rotation must recall exactly as submitted.
- Re:Invent and Blueshift use split-global `2/2/2` logic.
- Re:Invent current pattern starts Monday/Tuesday, Wednesday/Thursday, Friday wrapping into next Monday unless holiday logic says closed.
- Submit/resubmit should overwrite the saved rotation for that cafe/week, not create useless duplicate history.
- South district conflict logic: Nitro/Frontier, Day 1, and Doppler cannot match Global menus; Re:Invent is an exception.
- Browser localStorage cannot be trusted for large record sets.

Recent critical fix:

- `2026.07.17.002-promo-resubmit-state-integrity` makes promo override recalls authoritative for display and selected-food-cost math. Full-week promo takeovers now render a `Promotion Override` row with saved promo entree/side/extension items and suppress stale normal Global rows from prior submissions, so old menu choices and old food-cost percentages do not bleed into the locked card or submitted recap. `Edit and resubmit` state now resets when district/cafe/week changes and after a confirmed resubmit, preventing one cafe's edit mode from carrying into another cafe.
- `2026.07.17.001-promo-override-global-card-integrity` removes fake Global/AMZ labels from no-Global cafe recaps/cards/exports, currently Atlas and Commissary, while still showing locked state, updated time, and station progress. Promotion override is now treated as a week-only takeover with Monday-Friday coverage, optional promo entree/side/extension memory slots, and submission logic that does not require normal Global rows when a promo covers the full week.
- `2026.07.15.005-nitro-canonical-menu-integrity` enforces Nitro's weekly Global Menu as the canonical menu for both protein blocks. If persisted child blocks disagree with the weekly menu, recall relabels the blocks to the weekly menu and retains only selected items that actually belong to that menu. Canonical blocks are also written on resubmit. The exact live failure shape, Anisa weekly parent with Ciudad child blocks, has regression coverage.
- `2026.07.15.004-rotation-submitted-family-integrity` protects submitted recalls from mixed-status Supabase families. When a Submitted parent has confirmed Submitted child rows, older Draft children in that family are excluded from reconstruction. If a legacy Submitted family has no Submitted children, its Draft children remain readable as a compatibility fallback. This specifically covers the live Nitro October pattern where Anisa header/current rows coexisted with stale Ciudad child selections.
- `2026.07.15.003-rotation-source-integrity` stopped Neighborhood Rotations from merging stale Smartsheet child rows into current Supabase submissions. Supabase records are authoritative whenever available and Smartsheet is used only as fallback. Submission readiness now derives from `CAFE_STATION_CONFIG`, so cafes without Global stations, currently Atlas and Commissary, are not blocked by impossible Global Menu requirements. Browser regressions cover Nitro Anisa recall against stale Ciudad mirror rows and both no-Global cafes.
- `2026.07.14.004-rotation-full-week-cards` fixed locked leadership cards so Re:Invent uses the computed calendar block layout for the selected week, including Monday carryover/recovery blocks, and renders saved block data in calendar order instead of insertion order. Doppler cards now show Monday + Tuesday carryover plus Wednesday-Friday current menu so the leadership view reads as a full week.
- `2026.07.14.003-rotation-recall-integrity` fixed Re:Invent/Doppler recall corruption where stale/default Global Block rows could display Cypress or the wrong menu even though submitted selection rows carried the chef's actual choices. `recordsToRotations` now scores saved menu evidence so `Global Selection` rows with selected items outrank stale `Global Block` rows. Split-global recap/station rows now prefer persisted submitted blocks when saved block IDs do not match the recomputed week layout.
- `2026.07.12.002-selector-library-scope` restored Doppler/Zane's Salad selectors to the full Menu Library salad pool (37 scoped Cafe Express Curated Salad rows) instead of the tiny `saladFreshFive` override. Release guards now fail if that stale override returns.
- `2026.07.12.001-desktop-density` reduced the desktop-only density of the page and widened the rotations workspace so large monitors feel closer to the user's preferred 75% browser zoom without forcing actual browser zoom. Mobile/tablet sizing is intentionally preserved.
- `2026.07.11.001-rotation-storage-quota-guard` added `src/shared/safeStorage.js` and changed Neighborhood Rotations to treat `culinaryToolsSmartsheetReadyRecords_v1` as optional browser cache. Oversized localStorage writes must not crash the tool.

Important tests:

- `tests/browser/neighborhood-rotations.spec.js`
- `tests/browser/reinvent-submit-recall.spec.js`
- `scripts/verify-submission-health.mjs`
- `scripts/verify-rotation-record-audit.mjs`

Do not remove the Re:Invent/Doppler stale-block or Nitro canonical-menu regression cases in `tests/browser/reinvent-submit-recall.spec.js`. They protect the rules that actual submitted selection rows are stronger recall evidence than stale/default Global Block rows and that Nitro child blocks cannot contradict the saved weekly menu.

### Lean Tool

File area: `src/features/lean-tool/`

Purpose: Mobile/tablet DOWNTIME observation tracker with timer, marks, report, email report concept, and results.

Watch-outs:

- Mobile interaction must avoid constant up/down scrolling during active observation.
- Results should be clean, filterable, and support delete/void controls.
- Smartsheet/Supabase records should be auditable by leadership roles.
- Lean Tool email report recipients intentionally exclude Bil Smith as of `2026.07.18.002-lean-report-recipient-cleanup`; `scripts/verify-lean-results-view.mjs` guards this.

### Ladle Compliance

File area: `src/features/ladle-compliance/`

Current status:

- Hidden from the platform home screen and mobile tool navigation as of `2026.07.11.003-hide-ladle-compliance`.
- The underlying code remains in the repo for a future rebuild, but users should not be routed into it from normal navigation while it is unfinished/non-working.

### Menu Library

File area: `src/features/recipe-database/`

Purpose: Menu and item library organized by menus, with cards, detail drawer, nutrition, allergens, photos, plating guides, and recipe file concepts.

Watch-outs:

- It is called Menu Library in user-facing UI. Internal file paths still use `recipe-database`.
- `2026.07.18.001-menu-library-all-menus-export` added a `Download All Menus CSV` button beside the selected-menu CSV export. It calls `ensureFullRecipeRows()` on demand and exports menu, recipe name, MRN, category, description, calories, sell price, and true cost across the full library.
- `2026.07.12.003-master-menus-sync` rebuilt `src/data/menuItems.json` from `Master Menus 7-12-26.csv`: 1,550 Master rows, 53 menus, 100 new/rekeyed rows, and 57 stale generated rows removed compared with the previous app dataset.
- The current raw source archive is `public/data/master-menus-raw-2026-07-12.json`. Older raw MenuWorks archives were removed from the deployable app.
- Recipe Library Supabase backfill now upserts the current Master rows and marks visible Supabase recipe rows absent from the Master as `visible_in_library: false`; do not reintroduce append-only backfill behavior.
- Item cards show Webtrition weight in oz when available from MenuWorks/Supabase for audit visibility.
- `2026.07.18.004-menu-library-mrn-webtrition-link` shows exact MRNs on Menu Library front cards and adds drawer actions to open Webtrition by MRN search or copy the MRN for manual Webtrition search.
- `2026.07.18.005-webtrition-search-only` removes forced Webtrition `preview=sidePanel`, `productType`, and recipe-view parameters. The drawer action is now `Search Webtrition` and should keep users in the accessible search/result flow.
- Keep compact card labels short; `WebT OZ` is intentional so the Webtrition weight label does not overflow narrow property cards.
- Curated app assets now provide one exact, normalized-name photo for 110 matched dishes across Atlas Noodle, Anisa, Bibimbowl, Balti, Breakfast, and Carvery. Do not replace this with fuzzy runtime matching.
- Atlas Noodle, Anisa, Breakfast, and Carvery have verified group-photo banners. Bibimbowl and Balti intentionally remain banner-free because their supplied folders did not contain a true group shot.
- Unmatched dishes intentionally remain blank; never force a photo onto an item without a confident source match.
- Item photos may exist in app assets/local mappings while file upload/storage wiring continues to mature.
- Detail drawer should be roomy, professional, and show food photos clearly.
- Edit/save should write to Supabase when possible.
- MenuWorks descriptions are not always primary truth; do not blindly overwrite curated/source-of-truth descriptions.

### Menu Projects

File area: `src/features/menu-projects/`

Purpose: Menu project workflow/pipeline for Promotional Menu, Microconcept, and New Unit Opening.

Watch-outs:

- Data should persist through Supabase first, Smartsheet fallback/mirror.
- Deleted projects must not reappear after leaving and returning.
- Project Owner/Chef should not auto-fill unless the user explicitly wants that.
- District Chef / SSMT Owner should be hard-wired to Tyler Leiss and Alex Neuse.
- Uploaded files should be downloadable, versioned, and deletable.
- Workflow must allow reset/return to Concept Brief when required files are deleted.
- Email/notification prompts are currently mostly app-side workflow guidance unless a real email service is wired.

### Menu Audit Tool

File area: `src/features/menu-audit/`

Purpose: Compare Culinary App data, SSMT data, and uploaded Centric Brand Reports.

Critical integrity rules:

- MRNs are text. Never round or shorten MRNs.
- SSMT data should include modifier item names and mark modifiers as modifiers.
- Centric brand comparison should run only when a brand report is uploaded.
- SSMT vs Culinary App reconciliation should always be available.
- If item exists in Centric but not Culinary App or SSMT, mark as needing deletion/removal from Centric.
- If item exists in SSMT but not Culinary App, flag as issue.
- If item exists in Culinary App but not SSMT, flag as issue.
- Reporting category primary matters and should compare against SSMT category.

Recent critical fixes:

- `2026.07.07.001-menu-audit-mrn-text` preserved MRNs like `165741.11`, `182206.25`, and `107142.156` as text.
- `2026.07.07.004-menu-audit-brand-scope` scoped Centric comparisons to uploaded Brand Reports and improved modifier handling.

## Data Sources And Storage Rules

### Supabase

Supabase is the intended primary shared data backbone.

Known areas:

- `app_records` style storage for rotations, lean, menu projects, analytics, etc.
- `recipe_items` and recipe document/file structures for Menu Library.
- Storage buckets have been prepared conceptually for recipe files, plating guides, and item photos.

### Smartsheet

Smartsheet remains fallback/mirror, especially during migration. Do not remove Smartsheet paths without a deliberate migration plan.

Important env vars:

- `SMARTSHEET_ACCESS_TOKEN`
- `SMARTSHEET_SHEET_ID`

### Browser Local Storage

Use only for:

- UI preferences.
- Last-used local cache.
- Temporary local convenience.

Do not use it as the only source of shared truth. Any large cache write must be guarded with `src/shared/safeStorage.js` or equivalent.

## Current Known Issues / Open Risks

- Normal local `git push` has been unreliable in this Windows workspace. GitHub API publishing has been used successfully.
- The repo may show local commits ahead of `origin/main` because publishing has happened file-by-file through GitHub API.
- Historical rotation status drift exists and should be cleaned carefully, not destructively.
- Menu Audit Tool still needs deeper SSMT parsing literacy and durable uploaded file/source handling.
- Menu Library photo/recipe/plating-guide uploads are not fully complete across Supabase Storage for all future file types.
- Large menu item data has been improved but still deserves a client-side selector/data-loading speed pass.
- Multiple Codex sessions may diverge if they do not check GitHub/Vercel/live state first.

## Verification Protocol Before Publish

At minimum, run:

```bash
pnpm run verify
```

For rotation changes, also run:

```bash
node scripts/run-playwright.mjs neighborhood-rotations
node scripts/run-playwright.mjs reinvent-submit-recall
```

For live verification after publish, run the same browser smoke tests with:

```bash
PLAYWRIGHT_BASE_URL=https://project-d8v25.vercel.app node scripts/run-playwright.mjs neighborhood-rotations
PLAYWRIGHT_BASE_URL=https://project-d8v25.vercel.app node scripts/run-playwright.mjs reinvent-submit-recall
```

For Menu Projects, Menu Library, Menu Audit, or Lean changes, run their matching Playwright specs and release guards. If no matching test exists, add one before claiming the change is safe.

## Publish Protocol

Preferred:

1. Confirm current GitHub/Vercel/live state.
2. Make scoped changes.
3. Update `CHANGELOG.md`.
4. Update `src/shared/appConfig.js` when the app changes.
5. Update this `AI_HANDOFF.md`.
6. Run verification.
7. Commit.
8. Push/publish.
9. Confirm Vercel production deployment is READY.
10. Confirm live bundle contains the new version stamp.
11. Run live smoke tests for the affected tool.

Fast repo publish path:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish-live.ps1 -CommitMessage "Describe the change"
```

For docs/handoff-only changes:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish-live.ps1 -CommitMessage "Update docs" -SkipVerify -SkipVercelWait
```

The script uses the known-working GitHub CLI token plus portable Git/OpenSSL path and redacts the token from output. Prefer this over ad hoc `git push` when the Windows shell reports `SEC_E_NO_CREDENTIALS`, `git-remote-https` issues, or credential-helper hangs.

If normal `git push` fails, use GitHub Contents API or the GitHub connector, but make sure all intended files are published. New files require create-file handling, not update-only handling.

## Version Stamp Rule

For live app behavior/UI/data-flow changes, update:

- `src/shared/appConfig.js`
- `CHANGELOG.md`
- `AI_HANDOFF.md`

Version format:

```text
YYYY.MM.DD.NNN-short-description
```

Example:

```text
2026.07.11.001-rotation-storage-quota-guard
```

Docs-only changes may avoid the visible app version bump unless the user specifically wants the version to reflect documentation updates.

## Final Response Protocol

When a change is complete, report in this structure:

- Live URL
- GitHub link
- Vercel dashboard link
- Supabase link
- Version stamp
- What changed
- Verification performed
- Published status
- 1-2 good next ideas
- Issues still pending

Do not claim a change is live until Vercel production is verified.

## Master Instruction For Future Codex Sessions

Before editing:

1. Read `AI_HANDOFF.md`.
2. Read the latest relevant `CHANGELOG.md` entries.
3. Check `src/shared/appConfig.js`.
4. Check git status.
5. Check whether the requested area has smoke tests or release guards.
6. Only then make a plan or edit.

After editing:

1. Add or update tests.
2. Run verification.
3. Update `AI_HANDOFF.md`.
4. Update final status using the user's requested report format.
