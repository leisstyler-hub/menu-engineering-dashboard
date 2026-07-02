# Changelog

## 2026-07-02

- [Jul 2, 11:06 AM] Connected Menu Projects to the Supabase-first storage backbone with Smartsheet fallback rows for project and attachment records.
- [Jul 2, 11:06 AM] Added downloadable, versioned Menu Project attachments so repeated uploads become v2/v3 instead of overwriting saved artifacts.
- [Jul 2, 11:06 AM] Added per-file delete controls that remove accidental attachments from the project and the next database sync.
- [Jul 2, 11:06 AM] Expanded the Menu Projects dashboard with upcoming due dates, upcoming tastings, and database sync status.
- [Jul 2, 11:06 AM] Added release guards for Menu Projects storage sync, attachment versioning, file download/delete controls, and dashboard action panels.
- [Jul 2, 11:06 AM] Set visible app version to `2026.07.02.007-menu-project-storage-dashboard`.
- [Jul 2, 10:43 AM] Added stale-bundle protection so missing dynamically imported tool files trigger a clean refresh instead of leaving users on a broken view.
- [Jul 2, 10:43 AM] Cleaned up the Menu Projects header so Settings and Compass One sit together while the version stamp moves below.
- [Jul 2, 10:43 AM] Strengthened Menu Projects inlay borders and nested card borders so project detail sections read more clearly.
- [Jul 2, 10:43 AM] Added Menu Projects notification recipients and email draft links, including Chandon for uploaded Microconcept concept briefs.
- [Jul 2, 10:43 AM] Added release guards for stale-bundle recovery and Menu Projects email cue behavior.
- [Jul 2, 10:43 AM] Set visible app version to `2026.07.02.006-stale-bundle-email-cues`.
- [Jul 2, 10:31 AM] Clarified Menu Projects date entry as `Menu Launch Date` so users know the date is the guest-facing launch.
- [Jul 2, 10:31 AM] Reworked Menu Projects stage scheduling so IT / Centric is targeted to complete 5 business days before the menu launch date.
- [Jul 2, 10:31 AM] Expanded Microconcept deliverables to Schedule Tasting, Manager's Guide, Photography Scheduled, and Webtrition Entry.
- [Jul 2, 10:31 AM] Added controlled work-ahead access to Microconcept deliverables after Director approval while keeping Experience review as the active gate.
- [Jul 2, 10:31 AM] Added a Delay Project action that recalculates open dates while preserving the 5-business-day Centric buffer.
- [Jul 2, 10:31 AM] Cleaned up the multi-owner assignment card so owner name and email fields no longer feel crowded.
- [Jul 2, 10:31 AM] Added release guards for the launch-date label, Centric completion buffer, work-ahead deliverables, and delay control.
- [Jul 2, 10:31 AM] Set visible app version to `2026.07.02.005-menu-project-timeline-workahead`.
- [Jul 2, 10:18 AM] Added multi-owner support for Menu Projects so project owner / chef assignments can include more than one person.
- [Jul 2, 10:18 AM] Added Andes Recipe Library photography with one optimized dish photo per item and the requested Andes group shot as the menu header.
- [Jul 2, 10:18 AM] Added dynamic Recipe Library photo display on item cards, opened library cards, and the item photo file slot.
- [Jul 2, 10:18 AM] Added release guards for Andes photo assets and Menu Projects multi-owner behavior.
- [Jul 2, 10:18 AM] Set visible app version to `2026.07.02.004-andes-photos-multi-owner`.
- [Jul 2, 9:42 AM] Reworked Menu Projects into a wider dashboard v2 with menu type mix, stage workload, action queue, and a clearer menus-in-the-works list.
- [Jul 2, 9:42 AM] Added a trash-project confirmation flow so test or accidental menu projects can be removed intentionally.
- [Jul 2, 9:42 AM] Removed auto-filled assignment people from Menu Projects defaults so owner and team fields stay blank until entered.
- [Jul 2, 9:42 AM] Rebalanced the landing page tool grid so the six tools display as an intentional shelf instead of leaving an awkward empty gap.
- [Jul 2, 9:42 AM] Set visible app version to `2026.07.02.003-menu-project-dashboard-v2`.
- [Jul 2, 8:52 AM] Added Menu Projects as a new launch pipeline tool for Promotional Menu, Microconcept, and New Unit Opening workflows.
- [Jul 2, 8:52 AM] Added real downloadable Excel templates for New Menu Concept Brief and New Menu Multi Station Concept Brief with menu-title download names.
- [Jul 2, 8:52 AM] Added project stages, business-day deadline logic, compressed timeline flags, assignments, file uploads, approvals, blockers, and notification logs.
- [Jul 2, 8:52 AM] Added a Menu Projects release guard and set visible app version to `2026.07.02.002-menu-project-pipeline`.
- [Jul 2, 7:22 AM] Fixed Re:Invent submitted recap rebuilds so newest saved split-global blocks stay authoritative and old child rows cannot revert menus.
- [Jul 2, 7:22 AM] Added saved-row timestamping across rotation child records so resubmitted cafe/week rotations have a cleaner newest-save signal.
- [Jul 2, 7:22 AM] Strengthened the rotation integrity guard to catch stale split-global overwrite behavior before release.
- [Jul 2, 7:22 AM] Set visible app version to `2026.07.02.001-reinvent-save-integrity`.

## 2026-07-01

- [Jul 1, 9:04 AM] Fixed Re:Invent and Blueshift split-global selectors so a Global Menu selected in one block is removed from the other split-block dropdowns.
- [Jul 1, 9:04 AM] Added split-global duplicate submit blocking so old or imported bad data explains exactly which menu/block combination needs correction.
- [Jul 1, 9:04 AM] Added a submitted-recap warning when saved split-global data contains a duplicate, so invalid Ohana/Lotus/Ohana-style records no longer look approved.
- [Jul 1, 9:04 AM] Set visible app version to `2026.07.01.004-split-global-unique`.
- [Jul 1, 8:18 AM] Removed the duplicate top-level `Edit locked rotation` checkbox so submitted rotations are edited only from the recap card.
- [Jul 1, 8:18 AM] Relaxed Neighborhood Rotation submission rules: Global needs a menu plus one entree, and each required station needs one selected item.
- [Jul 1, 8:18 AM] Updated submit-blocked messaging so chefs see the exact missing Global or station requirement instead of a blank warning.
- [Jul 1, 8:18 AM] Separated saving state from blocked state so the Planner Remote Control no longer shows a false blocked warning while a submit is in progress.
- [Jul 1, 8:18 AM] Rechecked the saved-record overwrite path so resubmitted cafe/week rotations replace prior child rows instead of building useless history.
- [Jul 1, 8:18 AM] Set visible app version to `2026.07.01.003-submit-rules-resubmit`.
- [Jul 1, 7:38 AM] Added a submission-health release guard that checks confirmed-storage locking, stale row cleanup, Supabase primary, and Smartsheet fallback behavior.
- [Jul 1, 7:38 AM] Reworked Lean Results into a cleaner row-history table with compact summary cards and click-to-open saved observation details.
- [Jul 1, 7:38 AM] Added a row-level Delete Record action for Lean Results that uses the controlled void/audit flow instead of hard-erasing records.
- [Jul 1, 7:38 AM] Added a Lean Results release guard so the tab stays focused on history rows, detail view, and controlled deletion.
- [Jul 1, 7:38 AM] Set visible app version to `2026.07.01.002-submission-lean-results`.
- [Jul 1, 7:10 AM] Programmed Re:Invent's Jun 29 holiday week as Monday-Tuesday, Wednesday-Thursday, and Friday Closed with no Friday menu required.
- [Jul 1, 7:10 AM] Reset Re:Invent's normal 2/2/2 split-global cycle to restart Monday-Tuesday on Jul 6, 2026.
- [Jul 1, 7:10 AM] Limited Neighborhood Rotation week selectors to the current week, future weeks, and five prior weeks.
- [Jul 1, 7:10 AM] Added clickable Results history rows that open saved selection detail by cafe, station, item, description, allergens, calories, and retail.
- [Jul 1, 7:10 AM] Set visible app version to `2026.07.01.001-reinvent-results-detail`.

## 2026-06-30

- [Jun 30, 1:36 PM] Enabled rotation submit syncs to auto-repair missing Smartsheet mirror columns when a used submission field is absent.
- [Jun 30, 1:36 PM] Added a rotation integrity guard so future submit paths keep the Smartsheet column-repair option active.
- [Jun 30, 1:36 PM] Set visible app version to `2026.06.30.004-resubmit-storage-repair`.
- [Jun 30, 1:36 PM] Added the split/global block ID into saved selection row IDs so Nitro, Re:Invent, and Blueshift can resubmit repeated items without Supabase row conflicts.
- [Jun 30, 1:36 PM] Added a rotation integrity guard that blocks releases if split-block selections can collide during submit.
- [Jun 30, 1:36 PM] Set visible app version to `2026.06.30.003-resubmit-row-ids`.
- [Jun 30, 12:32 AM] Realigned Re:Invent so the week of Jun 29, 2026 starts with Monday-Tuesday, then Wednesday-Thursday, then Friday carrying into next Monday.
- [Jun 30, 12:32 AM] Split Re:Invent and Blueshift cycle anchors so Re:Invent can start Mon+Tue this week while Blueshift still starts Mon+Tue the week of Jul 6, 2026.
- [Jun 30, 12:32 AM] Added a rotation integrity guard that reads each split-global cafe anchor and verifies the expected Mon+Tue start weeks.
- [Jun 30, 12:32 AM] Set visible app version to `2026.06.30.002-reinvent-cycle-anchor`.
- [Jun 30, 12:08 AM] Hardened Neighborhood Rotation submit so a cafe does not show as locked until primary live storage confirms the submission.
- [Jun 30, 12:08 AM] Added a visible submit-save failure modal so chefs retry immediately instead of thinking a failed background save went live.
- [Jun 30, 12:08 AM] Moved Blueshift Global to the shared 2/2/2 split-cycle pattern with Monday-Tuesday, Wednesday-Thursday, and Friday carryover into Monday.
- [Jun 30, 12:08 AM] Expanded rotation integrity checks so split-global save rows, summary cards, submitted recaps, and submit confirmation cannot drift back to Re:Invent-only behavior.
- [Jun 30, 12:08 AM] Set visible app version to `2026.06.30.001-nitro-submit-blueshift-cycle`.

## 2026-06-29

- [Jun 29, 6:57 AM] Moved Neighborhood Rotation write-in entry into the dropdown as `Type if not listed` so selected items no longer appear as duplicate stacked fields.
- [Jun 29, 6:57 AM] Reused the clean write-in selector for Carvery fields and added a rotation integrity guard against always-visible duplicate write-in inputs.
- [Jun 29, 6:57 AM] Set visible app version to `2026.06.29.001-clean-write-in-selectors`.

## 2026-06-28

- [Jun 28, 8:45 PM] Removed Cafe Rotation Readiness from Settings because cafe-specific readiness does not belong in the system settings view.
- [Jun 28, 8:45 PM] Reworked Recipe Mapping Trust into an all-menu selector alignment read with menu, category, station, and flagged-row coverage.
- [Jun 28, 8:45 PM] Added a guard so Settings stays clear of cafe readiness and set visible app version to `2026.06.28.007-settings-menu-scope`.
- [Jun 28, 8:00 PM] Added Cafe Rotation Readiness in Data Health for Doppler, Re:Invent, Nitro, and Day 1 lock/selectability checks.
- [Jun 28, 8:00 PM] Added Recipe Mapping Trust in Data Health for Grill Core, Carvery, Fresh Five, and Global Menu selector alignment.
- [Jun 28, 8:00 PM] Added operational readiness verification to the release checks and set visible app version to `2026.06.28.006-operational-readiness`.
- [Jun 28, 7:45 PM] Added a Data Health Rotation Trust Audit for duplicate IDs, submitted-week status drift, orphan child rows, week mismatches, and Re:Invent block drift.
- [Jun 28, 7:45 PM] Added a safe status-drift repair action that only updates child rows when the parent rotation header is already Submitted.
- [Jun 28, 7:45 PM] Added rotation audit verification to the release checks and set visible app version to `2026.06.28.005-rotation-record-audit`.
- [Jun 28, 7:22 PM] Aligned live Re:Invent Jun 29 data so Monday carries AMZ: Ohana from the prior Friday, Tuesday-Wednesday runs AMZ: Lemongrass + Lime, and Thursday-Friday runs AMZ: Cypress.
- [Jun 28, 7:22 PM] Removed stale Re:Invent Jun 29 Piccola Italia/Ciudad records from Supabase and the Smartsheet mirror.
- [Jun 28, 7:22 PM] Set visible app version to `2026.06.28.004-reinvent-jun29-alignment`.
- [Jun 28, 7:05 PM] Shifted the Re:Invent two-day Global cycle back one week so Jun 29, 2026 uses Monday carryover, Tuesday-Wednesday, and Thursday-Friday blocks.
- [Jun 28, 7:05 PM] Added a rotation integrity guard for the Jun 29 / Jul 6 Re:Invent parity so the 2-day pattern cannot drift back.
- [Jun 28, 7:05 PM] Set visible app version to `2026.06.28.003-reinvent-cycle-backshift`.
- [Jun 28, 3:43 PM] Added a Vegetable Carvery Recipe Library group for AMZ: Carvery charred vegetable options.
- [Jun 28, 3:43 PM] Made Leadership Overview and Executive Rotation Health cafe cards open directly into that cafe's Chef Planner.
- [Jun 28, 3:43 PM] Reworked Re:Invent submitted and executive cards to show the three schedule blocks, including prior-Friday Monday carryover.
- [Jun 28, 3:43 PM] Set visible app version to `2026.06.28.002-reinvent-carvery-jump`.
- [Jun 28, 9:36 AM] Hardened Neighborhood Rotation reloads so submitted selection rows can keep a cafe locked even if the header row is missing or delayed.
- [Jun 28, 9:36 AM] Added Recipe Library Data Confidence flags for price gaps, category review, missing true cost, and support-item checks.
- [Jun 28, 9:36 AM] Added visible Needs Review, Watch, and Trusted labels to Recipe Library item cards and detail drawers.
- [Jun 28, 9:36 AM] Added a Recipe Library trust verification guard to prevent eggplant/sauce false positives and preserve real protein price-gap alerts.
- [Jun 28, 9:36 AM] Set visible app version to `2026.06.28.001-rotation-trust-audit`.

## 2026-06-27

- [Jun 27, 7:53 PM] Moved MenuWorks truth uploads out of Menu Engineering and into Recipe Library so one shared library source drives item rows.
- [Jun 27, 7:53 PM] Replaced hard-coded Operational Read signals with live dataset coverage for cost, price-required rows, descriptions, and allergens.
- [Jun 27, 7:53 PM] Rebuilt Weekly Traffic as a React line chart from the secure endpoint and removed the old DOM enhancer layer.
- [Jun 27, 7:53 PM] Removed the redundant mobile Smart Read card and trimmed orphaned mobile dark-mode styles.
- [Jun 27, 7:53 PM] Split heavy tool pages so the home dashboard loads first and individual tools load only when opened.
- [Jun 27, 7:53 PM] Added a generated dashboard summary guard so home metrics stay refreshed without loading the full MenuWorks item file on first paint.
- [Jun 27, 7:53 PM] Set visible app version to `2026.06.27.008-cleanup-trust-refresh`.
- [Jun 27, 2:47 PM] Mapped Carvery rotating vegetable selectors directly to `Charred Vegetable Option` MenuWorks notes.
- [Jun 27, 2:47 PM] Split Carvery side selectors by exact notes: hot sides use `Hot A La Carte and Side Choice`, while cold sides use `A la carte and side choice` plus `Cold A La Carte and Side Choice`.
- [Jun 27, 2:47 PM] Scoped Carvery protein, vegetable, hot side, cold side, and starch lookups to Carvery rows so unrelated menu items cannot leak into those dropdowns or saved recaps.
- [Jun 27, 2:47 PM] Set visible app version to `2026.06.27.007-carvery-note-mapped-selectors`.
- [Jun 27, 2:28 PM] Tightened the MenuWorks classifier so unpriced non-entree support items become complimentary sub-recipes instead of side choices across all menus.
- [Jun 27, 2:28 PM] Moved Balti chutneys, Carvery sauces, dressings, aiolis, preserves, and other no-price sauce/support rows out of side groups.
- [Jun 27, 2:28 PM] Added a classification guard proving there are zero unpriced side rows before release.
- [Jun 27, 2:28 PM] Set visible app version to `2026.06.27.006-complimentary-support-classifier`.
- [Jun 27, 2:15 PM] Rebuilt menu item data from `Menus.csv` so current MenuWorks short names, stations, prices, notes, and nutrition drive Recipe Library and Neighborhood Rotation pickers.
- [Jun 27, 2:15 PM] Reworked menu classification to use Menu Item Notes, recipe category, and side-price signals so entree-priced Grill Core sandwiches no longer appear in side groups.
- [Jun 27, 2:15 PM] Scoped Fresh Five picker pools by exact station, including Grill, Salad, Deli, Soup, and Sides, so Salt + Char no longer shows soups, salads, or unrelated Fresh Five items.
- [Jun 27, 2:15 PM] Added menu classification verification to the release checks so stale category/name drift gets caught before publishing.
- [Jun 27, 2:15 PM] Set visible app version to `2026.06.27.005-menu-classification-truth`.
- [Jun 27, 10:03 AM] Updated release health to read GitHub source through the GitHub API so source-version checks do not get fooled by raw-file caching after a sync.
- [Jun 27, 10:03 AM] Set visible app version to `2026.06.27.004-smooth-release-health`.
- [Jun 27, 9:48 AM] Added a production release source guard so local changes must sync to GitHub before Vercel deploys them live.
- [Jun 27, 9:48 AM] Expanded release health checks to show dirty working files, branch drift, GitHub source version, and live app version before publishing.
- [Jun 27, 9:48 AM] Set visible app version to `2026.06.27.003-smooth-release-guard`.
- [Jun 27, 9:25 AM] Added a repeatable release workflow with `release:health`, `release:live`, GitHub source-sync fallback, live bundle verification, and no-secret auth diagnostics.
- [Jun 27, 9:25 AM] Added release workflow verification to the normal app verification chain so the publishing backbone cannot silently drift.
- [Jun 27, 9:25 AM] Set visible app version to `2026.06.27.002-release-workflow`.
- [Jun 27, 8:58 AM] Centered Recipe Library item detail cards so selected recipes open over the library instead of sliding to the far-right edge on wide screens.
- [Jun 27, 8:58 AM] Set visible app version to `2026.06.27.001-fix-recipe-card-modal`.

## 2026-06-26

- [Jun 26, 9:57 PM] Imported the new MenuWorks item export into the Recipe Library data set with 1,507 current rows across 53 menus.
- [Jun 26, 9:57 PM] Preserved trusted chef-facing descriptions as primary copy while storing incoming MenuWorks descriptions as secondary reference copy.
- [Jun 26, 9:57 PM] Expanded item storage for protein, sodium, carbs, fats, sugars, potassium, calcium, iron, source metadata, raw MenuWorks details, and Aug 1 Fresh Five Hibernate effective-date notes.
- [Jun 26, 9:57 PM] Reset the Recipe Library local override cache key so old browser edits cannot hide the newly imported MenuWorks library.
- [Jun 26, 9:57 PM] Set visible app version to `2026.06.26.004-menuworks-nutrition-import`.
- [Jun 26, 8:06 PM] Corrected the current changelog timestamp periods so evening release work shows PM instead of AM.
- [Jun 26, 8:06 PM] Added a changelog timestamp verification check for the current release block.
- [Jun 26, 8:06 PM] Set visible app version to `2026.06.26.003-changelog-timestamps`.
- [Jun 26, 7:44 PM] Renamed Recipe Database to Recipe Library across the platform and mobile navigation.
- [Jun 26, 7:44 PM] Added Recipe Library item cards with calories, protein, editable chef-facing details, and future file slots for photos, plating guides, recipes, and source documents.
- [Jun 26, 7:44 PM] Added a Supabase Recipe Library schema for structured item nutrition fields, item document metadata, and private storage buckets.
- [Jun 26, 7:44 PM] Set visible app version to `2026.06.26.002-recipe-library-backbone`.
- [Jun 26, 7:10 PM] Hardened Neighborhood Rotation locking so submitted cafe/week records stay locked even when older draft child rows are still present during database reload.
- [Jun 26, 7:10 PM] Fixed two-slot grill saves so the first and second grill selections persist as separate slots instead of both saving as slot one.
- [Jun 26, 7:10 PM] Reworked item write-ins so each picker switches between list mode and write-in mode instead of stacking a dropdown and text field together.
- [Jun 26, 7:10 PM] Set visible app version to `2026.06.26.001-rotation-lock-sweep`.

## 2026-06-23

- [Jun 23, 7:35 AM] Backfilled Smartsheet Rotation and Lean history into Supabase, deduping repeated Record IDs so Supabase can act as the current structured source.
- [Jun 23, 7:35 AM] Added a hidden-row audit option to the secure Supabase records endpoint so voided/test history can be verified without showing as active app results.
- [Jun 23, 7:35 AM] Set visible app version to `2026.06.23.002-supabase-backfill-audit`.
- [Jun 23, 7:18 AM] Updated Data Health so the Supabase headline follows the secure server write endpoint instead of the secondary public read probe.
- [Jun 23, 7:18 AM] Added a note when the public Supabase probe returns a warning while secure writes are still ready.
- [Jun 23, 7:18 AM] Set visible app version to `2026.06.23.001-storage-health-ready`.

## 2026-06-22

- [Jun 22, 8:18 AM] Routed Neighborhood Rotation and Lean Tool saves through a secure Supabase-first storage backbone while keeping Smartsheet as the mirror/fallback.
- [Jun 22, 8:18 AM] Added a shared app-record Supabase schema with indexed tool/district/cafe/week fields, full record snapshots, and a two-year cleanup function.
- [Jun 22, 8:18 AM] Set visible app version to `2026.06.22.003-storage-backbone-live`.
- [Jun 22, 7:42 AM] Added a Supabase backbone connection layer and Data Health card so the app can verify the primary database bridge while Smartsheet remains the mirror/fallback.
- [Jun 22, 7:42 AM] Added the Lean Results Supabase schema for future observation sessions, timestamp marks, sync events, void controls, and two-year retention planning.
- [Jun 22, 7:42 AM] Set visible app version to `2026.06.22.002-supabase-backbone`.
- [Jun 22, 7:09 AM] Added Recipe Database as the fifth platform tool, organized by menu with item properties, costs, calories, allergens, descriptions, portions, and CSV export.
- [Jun 22, 7:09 AM] Added Sentry client monitoring with app-level error protection, release/version tags, active-tool context, navigation breadcrumbs, tracing, and replay-on-error support when a Sentry DSN is configured.
- [Jun 22, 7:09 AM] Set visible app version to `2026.06.22.001-recipe-database-sentry`.

## 2026-06-21

- [Jun 21, 9:32 AM] Fixed Neighborhood Rotations Executive View so draft rows no longer count as declared menus, duplicate flags, selected items, or food-cost signals.
- [Jun 21, 9:32 AM] Increased Neighborhood Rotations readability with a wider canvas and larger control/card text.
- [Jun 21, 9:32 AM] Set visible app version to `2026.06.21.003-rotation-exec-trust`.
- [Jun 21, 9:19 AM] Safely republished dashboard-only polish after the rollback: wider desktop canvas, cleaner Weekly Traffic line chart, dark-mode chart styling, and no redundant desktop Smart Read block.
- [Jun 21, 9:19 AM] Refreshed the Operational Read card wording without changing Neighborhood Rotations logic.
- [Jun 21, 9:19 AM] Set visible app version to `2026.06.21.002-dashboard-traffic-safe`.

## 2026-06-20

- [Jun 20, 8:24 PM] Added visible value labels to each Weekly Traffic line-graph point so traffic spikes show their visitor count directly on the graph.
- [Jun 20, 8:24 PM] Set visible app version to `2026.06.20.004-traffic-line-labels`.
- [Jun 20, 8:05 PM] Installed a secure weekly traffic endpoint that records anonymous daily visitors server-side and feeds the dashboard traffic trend from Smartsheet.
- [Jun 20, 8:05 PM] Redesigned Weekly Traffic as a cleaner line graph instead of the prior placeholder bar visual.
- [Jun 20, 8:05 PM] Set visible app version to `2026.06.20.003-secure-traffic-endpoint`.
- [Jun 20, 7:35 PM] Added a Weekly Traffic dashboard card with a seven-day visitor bar chart and honest analytics-pending state until a secure Vercel Analytics read endpoint is connected.
- [Jun 20, 7:35 PM] Set visible app version to `2026.06.20.002-publish-weekly-traffic`.

## 2026-06-19

- [Jun 19, 2:45 PM] Restored East custom station workflows for Street Beets, Everest Commissary, Lotus W&P, Eclipse station takeover, and Bingo split Grill/Salad Fresh $5 selections.
- [Jun 19, 2:45 PM] Added save/reload/review support for East custom station selections, including Street Beets calorie-required write-ins and Bingo's one-spotlight grill structure.
- [Jun 19, 2:45 PM] Set visible app version to `2026.06.19.007-east-custom-stations`.
- [Jun 19, 2:12 PM] Added rotation integrity verification for Re:Invent saved-menu reloads and station option-pool drift.
- [Jun 19, 2:12 PM] Tightened station pools: Carvery proteins exclude sandwich/Reuben rows, Salad LTO uses Cafe Express Curated Salads, Deli LTO uses Cafe Express Curated Sandwiches, and Grill now presents two Location Spotlight slots from Grill Core spotlight rows.
- [Jun 19, 2:12 PM] Set visible app version to `2026.06.19.006-rotation-integrity-pools`.
- [Jun 19, 1:51 PM] Fixed Re:Invent saved-menu reload so Global selection rows restore their `Menu / Concept` back onto the Re:Invent blocks instead of showing a false `No menu declared`.
- [Jun 19, 1:51 PM] Set visible app version to `2026.06.19.005-fix-reinvent-saved-menu-reload`.
- [Jun 19, 1:38 PM] Fixed Re:Invent summary/menu labels so saved Re:Invent Global block menus still count when the active week cycle changes or legacy block keys are present.
- [Jun 19, 1:38 PM] Set visible app version to `2026.06.19.004-fix-reinvent-menu-label`.
- [Jun 19, 1:10 AM] Restored the East District cafe list on top of the latest Doppler PowerPoint work: Astra, Bingo, Sonic, Blueshift, Eclipse, and Grace.
- [Jun 19, 1:10 AM] Restored East slot counts compatible with the current branch while preserving the PC-pushed Doppler template generator commits.
- [Jun 19, 1:10 AM] Set visible app version to `2026.06.19.003-restore-east-cafes`.
- [Jun 19, 12:18 AM] Tightened Doppler PowerPoint template output so generated menu text avoids ellipses, inherited highlight colors, stale table prices, and cramped Global item spacing.
- [Jun 19, 12:18 AM] Added one blank line between Global entrees and `Sides | 2.55` in generated Doppler menus.
- [Jun 19, 12:18 AM] Set visible app version to `2026.06.19.002-fix-doppler-pptx-template-layout`.
- [Jun 19, 12:00 AM] Changed Doppler Generate Menu from a temporary HTML packet to a PowerPoint download based on the Doppler Cafe template.
- [Jun 19, 12:00 AM] Added the Doppler template file to the app and wired a browser-side template fill so selected planner items are inserted into that deck.
- [Jun 19, 12:00 AM] Set visible app version to `2026.06.19.001-feature-doppler-pptx-download`.

## 2026-06-18

- [Jun 18, 9:19 PM] Updated the landing Operational Read to reflect current platform progress and removed the redundant Smart Read card.
- [Jun 18, 9:19 PM] Fixed Re:Invent Global recap/status logic so only the active three two-day cycle blocks count for the selected week.
- [Jun 18, 9:19 PM] Made Doppler Pizza LTOs optional for submission and changed Doppler station controls to Salt + Char Fresh Five, two Pizza LTOs, Zane's Salad, and Paninoteca Deli.
- [Jun 18, 9:19 PM] Added a guarded Doppler Generate Menu remote button that primes a downloadable print-ready HTML packet and opens an in-app preview without navigating away.
- [Jun 18, 9:19 PM] Set visible app version to `2026.06.18.005-feature-doppler-menu-generator`.
- [Jun 18, 12:55 AM] Added a `calories` field to all 1,325 bundled menu items so item calories have a consistent update location.
- [Jun 18, 12:55 AM] Fixed submitted recap counting across all cafes so totals come from visible station selections instead of broad Global block rollups.
- [Jun 18, 12:55 AM] Added item descriptions directly into submitted recap item rows.
- [Jun 18, 12:55 AM] Set visible app version to `2026.06.18.004-fix-recap-count-calorie-field`.
- [Jun 18, 12:31 AM] Fixed Nitro submitted recaps so saved selection counts use the split-week Global blocks instead of over-counting stale Global rows.
- [Jun 18, 12:31 AM] Made Nitro edit/resubmit preload prior selections into the Monday + Tuesday and Wednesday + Friday selectors.
- [Jun 18, 12:31 AM] Added stale Smartsheet child-row cleanup on save/resubmit for the selected cafe/week and clamped old bad slot rows so they cannot inflate counts.
- [Jun 18, 12:31 AM] Set visible app version to `2026.06.18.003-fix-nitro-stale-selection-load`.
- [Jun 18, 12:11 AM] Added calories rounded to the nearest 5 and suggested retail price chips to Items Description cards and submitted selection recap cards.
- [Jun 18, 12:11 AM] Set visible app version to `2026.06.18.002-feature-selection-build-meta`.
- [Jun 18, 12:02 AM] Changed submitted Neighborhood Rotation weeks into a recap-card view with an `Edit and resubmit` checkbox that reopens the selectors.
- [Jun 18, 12:02 AM] Reworked Nitro Global planning into one weekly menu with two item blocks: Monday + Tuesday and Wednesday + Friday.
- [Jun 18, 12:02 AM] Added Baja Crunch Salad to Salad LTO options and widened Salad LTOs to include Fresh Five-style salad options.
- [Jun 18, 12:02 AM] Added typed Carvery overrides so Nitro proteins, vegetables, sides, and sauces can be entered when the dropdown list is missing the real item.
- [Jun 18, 12:02 AM] Reduced Neighborhood Rotation lag by caching Global menu rows, Street Eats options, station pools, Carvery side pools, and selected-item detail lookups.
- [Jun 18, 12:02 AM] Set visible app version to `2026.06.18.001-fix-nitro-recap-performance`.

## 2026-06-17

- [Jun 17, 11:34 PM] Added an optional Grill Promo LTO checkbox with a free-text promo item field so chefs can activate one-off Grill specials without needing the item preloaded.
- [Jun 17, 11:34 PM] Saved, restored, counted, and included active Grill Promo LTOs in Items Description and View/Print output.
- [Jun 17, 11:34 PM] Set visible app version to `2026.06.17.002-feature-grill-promo-lto`.
- [Jun 17, 11:06 PM] Changed Neighborhood Rotations landing status to `Pilot in Place` and fixed the mobile Settings button so only one centered gear displays.
- [Jun 17, 11:06 PM] Advanced the Re:Invent two-day rotation cycle alignment by one week and fixed Re:Invent global block save/load so submitted selections reload visibly.
- [Jun 17, 11:06 PM] Added a submitted-rotation lock banner with an edit checkbox so locked choices can be viewed without accidental changes.
- [Jun 17, 11:06 PM] Added Day 1 Noodle Station as a second Global-style selector and made block-based menus count in leadership, status, recap, and results views.
- [Jun 17, 11:06 PM] Updated Nitro station structure by removing Salad LTOs, making Pizza / Flatbread three slots, and adding requested carvery protein options as pending-detail planner choices.
- [Jun 17, 11:06 PM] Preserved station-specific rows before dedupe so Fish Market items like Steelhead Croquettes can appear, and made recap card global choices bolder.
- [Jun 17, 11:06 PM] Changed the remote control print action to `View/Print`.
- [Jun 17, 11:06 PM] Set visible app version to `2026.06.17.001-feature-rotation-stability-pass`.

## 2026-06-15

- [Jun 15, 7:27 AM] Made Chef Planner station pills clickable so they jump directly to the matching station section.
- [Jun 15, 7:27 AM] Set visible app version to `2026.06.15.003-fix-station-pill-jump`.
- [Jun 15, 7:21 AM] Kept LTO item details, costs, allergens, and Smartsheet records scoped to the selected station pool after an item is chosen.
- [Jun 15, 7:21 AM] Prevented uploaded LTO values from appearing twice when the same item already exists in the station dropdown.
- [Jun 15, 7:21 AM] Set visible app version to `2026.06.15.002-fix-lto-detail-scope`.
- [Jun 15, 9:00 AM] Tightened Neighborhood Rotations station option logic so station dropdowns show single, scoped menu items instead of broad text-match duplicates.
- [Jun 15, 9:00 AM] Limited Fish Market LTO choices to unique Fish Market entree options.
- [Jun 15, 9:00 AM] Set visible app version to `2026.06.15.001-fix-station-option-scope`.

## 2026-06-14

- [Jun 14, 3:46 PM] Hid the Lean Tool mobile Home bubble while the sticky Quick note and Mark controls are visible so the controls no longer overlap.
- [Jun 14, 3:46 PM] Set visible app version to `2026.06.14.018-fix-lean-home-overlap`.
- [Jun 14, 3:33 PM] Reset the page to the top whenever a tool opens so Lean Tool no longer inherits the mobile landing-page scroll depth.
- [Jun 14, 3:33 PM] Set visible app version to `2026.06.14.017-fix-tool-scroll-reset`.
- [Jun 14, 3:18 PM] Reordered Lean Tool mobile flow to read Observation Setup, What are they doing, then Email Report Out.
- [Jun 14, 3:18 PM] Set visible app version to `2026.06.14.016-fix-lean-mobile-flow`.
- [Jun 14, 3:04 PM] Moved the Lean Tool mobile Home bubble to hug the lower-left edge of the screen.
- [Jun 14, 3:04 PM] Set visible app version to `2026.06.14.015-fix-lean-home-bubble`.
- [Jun 14, 3:00 PM] Removed the full mobile tool switcher from Lean Tool, added a small floating Home bubble, tightened the Tracker/Results selector, and fixed clipped timer stats.
- [Jun 14, 3:00 PM] Set visible app version to `2026.06.14.014-fix-lean-mobile-operability`.
- [Jun 14, 2:51 PM] Compressed the Lean Tool phone cockpit so Start, activity, DOWNTIME waste, and Mark are usable with far less vertical swiping.
- [Jun 14, 2:51 PM] Added compact mobile dashboard data cards for trust layer, diet mix, recently added items, and changelog while keeping the floating selector.
- [Jun 14, 2:51 PM] Set visible app version to `2026.06.14.013-fix-lean-mobile-cockpit`.
- [Jun 14, 2:41 PM] Redesigned the phone home screen with app-style header, compact KPI tiles, tappable tool cards, and mobile bottom navigation.
- [Jun 14, 2:41 PM] Extended the mobile app treatment across tool screens and tightened the Lean Tool phone layout for field use.
- [Jun 14, 2:41 PM] Set visible app version to `2026.06.14.012-feature-mobile-app-design`.
- [Jun 14, 2:27 PM] Removed product-builder wording from the changelog display, upgraded the trust action CSV with fill-in guidance, and softened phone/tablet card styling.
- [Jun 14, 2:27 PM] Set visible app version to `2026.06.14.011-fix-mobile-trust-changelog`.
- [Jun 14, 2:19 PM] Removed draft records from Rotation History, added changelog velocity counters, tightened trust-layer pricing logic, added a downloadable trust gap list, and redesigned Lean Tool phone readability.
- [Jun 14, 2:19 PM] Set visible app version to `2026.06.14.010-feature-trust-history-mobile`.
- Added a hard-stop Neighborhood Rotations submit guard with clear blocked-state messaging and a persistent warning popup.
- Applied the South no-match rule to Nitro/Frontier, Day 1, and Doppler while keeping Re:Invent as an exception.
- Preserved non-Global station selections when changing a Global Menu or Street Eats option.
- Improved dark-mode contrast for previous-week carryover information.
- Set visible app version to `2026.06.14.009-fix-rotation-submit-guard`.
- Improved Lean Tool mobile mode with larger primary controls and compact mobile selectors for district, cafe, area, and observer.
- Added visible Lean Results voided record and voided row counts.
- Removed forced truncation from Lean and Smartsheet Health metric cards so labels and values wrap instead of being cut off.
- Set visible app version to `2026.06.14.008-fix-lean-mobile-wrap-voids`.
- Improved landing-page dark mode contrast for the Diet Mix regular segment, Lean result signal card, percent pill, and Compass One wordmark.
- Set visible app version to `2026.06.14.007-fix-dark-landing-contrast`.
- Added a guarded Smartsheet cleanup action that can delete named columns only when every row is blank.
- Set visible app version to `2026.06.14.006-fix-smartsheet-column-cleanup`.
- Changed Smartsheet column repair to add columns one at a time so Smartsheet accepts end-of-sheet inserts.
- Set visible app version to `2026.06.14.005-fix-smartsheet-column-repair`.
- Added a Smartsheet Health repair action that can create missing expected columns without creating placeholder rows.
- Added repair buttons on Health cards so missing-column warnings can be satisfied from the app.
- Set visible app version to `2026.06.14.004-feature-smartsheet-column-repair`.
- Renamed the main Smartsheet Health card to `Menu Rotation Smartsheet`.
- Added Settings to every tool header so dark mode, refresh, print/save PDF, and Smartsheet Health are always reachable.
- Reworked dark mode contrast for colored panels, status cards, inputs, and section borders so tool pages stay readable.
- Set visible app version to `2026.06.14.003-fix-dark-settings-health-label`.
- Scoped Smartsheet Health cards by record type so menu selection portion rows and Lean result rows no longer show the same counts when they share a sheet.
- Added card-level search fields for filtering menu selection and Lean records separately.
- Set visible app version to `2026.06.14.002-fix-smartsheet-health-scopes`.
- Added a premium Settings dropdown with dark mode, refresh current view, and print/save PDF actions.
- Added Smartsheet Health as a Settings-accessed system view instead of mixing it into the main tool cards.
- Added Smartsheet Health checks for main records and Lean records, including sheet name, masked sheet ID, row counts, column counts, missing expected columns, record types, statuses, and district signals.
- Set visible app version to `2026.06.14.001-feature-settings-smartsheet-health`.

## 2026-06-13

- Changed the embedded browser/bookmark title to `Culinary Tools Platform`.
- Set visible app version to `2026.06.13.021-fix-browser-title`.
- Added stronger operational dashboard signals across the platform landing page, including data-confidence coverage and executive readiness panels.
- Added Neighborhood Rotations leadership pulse cards with district health scoring and an action queue for open submissions, missing menus, duplicate menus, and food-cost watch items.
- Added selected-item data confidence to Neighborhood Rotation Results for description, allergen, and cost coverage.
- Improved Menu Engineering upload review with incoming file data-confidence checks for price, cost, descriptions, and allergens.
- Added Lean Results trend panels for waste, activity, repeat station opportunities, and latest-result follow-up.
- Set visible app version to `2026.06.13.020-feature-operational-dashboards`.
- Added controlled Lean result voiding so test, accident, duplicate, and wrong-location records are hidden from dashboards without being erased.
- Added Lean result audit fields for void reason, voided by, voided at, notes, test-record flag, and dashboard visibility in the Smartsheet contract.
- Changed Lean Results role language to `Shared audience` so access roles are not presented like user-selectable authority.
- Set visible app version to `2026.06.13.019-feature-lean-void-controls`.
- Reworked the Culinary Tools landing page into a smart dashboard with diet mix donut chart, category bars, newest item signal, latest changelog feed, top menu libraries, and live MenuWorks coverage stats.
- Set visible app version to `2026.06.13.018-ui-landing-smart-dashboard`.
- Added Smartsheet sync for Lean Tool completed results, including summary rows, timestamped mark rows, shared role visibility, and Results refresh from Smartsheet.
- Added support for a dedicated `SMARTSHEET_LEAN_SHEET_ID` so Lean results can live in their own shared Smartsheet while falling back to the current sheet when needed.
- Set visible app version to `2026.06.13.017-feature-lean-smartsheet-results`.
- Added a Lean Tool Results tab that stores completed observations in the app, filters by district, cafe, and station, and opens detailed result reports from a cafe/station list.
- Set visible app version to `2026.06.13.016-feature-lean-results-history`.
- Centered the Compass One logo text so `one` reads clearly inside the gold circle.
- Set visible app version to `2026.06.13.015-fix-compass-one-logo-readability`.
- Masked the Menu Engineering upload initiation code in the visible UI and status messages with `<Six Digits>`, and changed the entry field to hide typed digits.
- Set visible app version to `2026.06.13.014-fix-menu-upload-code-mask`.
- Strengthened app-wide section framing so major panels across all tools use the same clearer light-blue border rhythm as the cafe station cards.
- Restored true `border-2` weight so highlighted station and completed-section borders read more clearly.
- Set visible app version to `2026.06.13.013-ui-section-border-rhythm`.
- Added a Lean Tool completion pop-up with the completed observation summary, top waste/activity, DOWNTIME breakdown, timestamped marks, and OK action.
- Highlighted the Lean Tool Email Report Out section after a completed observation is acknowledged.
- Set visible app version to `2026.06.13.012-feature-lean-complete-modal`.
- Added a large red Ladle Compliance notice stating the dashboard data is placeholder concept data and not factual.
- Set visible app version to `2026.06.13.011-fix-ladle-data-notice`.
- Changed Lean Tool observer buttons to `DC`, `DM`, `RDO`, `VPO`, `EC`, `DR`, and `GM`.
- Set visible app version to `2026.06.13.010-fix-lean-observer-roles`.
- Reworked Lean Tool observations around a running session stopwatch with timestamped marks and duration since prior mark.
- Added a large modern digital timer display with running/complete status, last-mark timestamp, and timed-session readout.
- Added Complete-session behavior that captures the final active segment and generates a smarter time-weighted DOWNTIME report.
- Set visible app version to `2026.06.13.009-fix-lean-session-timer`.
- Added `Lean Tool` as the fourth platform module with phone/tablet-friendly DOWNTIME observation marking.
- Added Lean Tool report-out email flow with recipient buttons labeled by leader name instead of email address.
- Simplified Neighborhood Rotations Results cards by replacing unclear `Global Items`, `Station Completion`, and `Top Item Signal` cards with clearer coverage, variety, and food-cost watch cards.
- Set visible app version to `2026.06.13.008-feature-lean-tool-email`.
- Updated `AMZ: Harvest Co.` and `AMZ: Breakfast` from the MenuWorks truth exports, including item details, descriptions, ingredients, categories, and allergen flags.
- Added a 410410 initiated MenuWorks upload flow with richer import review for menu, item, cost, description, ingredient, and allergen changes.
- Removed confusing station-theme language from Global Menu planning and renamed sub-concept selection to `Street Eats Option`.
- Renamed Smartsheet refresh actions to `Sync Latest` and disabled the control while a read is already running.
- Aligned the Smartsheet storage contract to the provided Culinary Tools Database workbook headers.
- Softened the Executive View Cafe Lock Board and restyled Weekly Rotation Health cards with clearer lock/open signals, progress bars, and stronger borders.
- Set visible app version to `2026.06.13.007-data-menuworks-upload-refresh`.
- Replaced the Executive View leadership paragraph with a green/red Cafe Lock Board for submitted versus open cafes.
- Added stronger district-board styling and weekly rotation health context for leadership review.
- Reworked Results Summary around selection analytics: menu variety, most picked items, global items, station completion, range spread, and top item signal.
- Renamed the Results table cost column to `Selected Cost Range`.
- Set visible app version to `2026.06.13.006-ui-executive-results-analytics`.
- Added prior-week Global carryover visibility for Monday/Tuesday cycle patterns so saved carryover menus can be seen in the planner.
- Filtered Global Menu choices to Global concepts, including AMZ+RA menus, and limited sub-concept selection to Street Eats.
- Strengthened station and completed Items Description borders so finished stations draw attention to the View action.
- Simplified item picker placeholder text to `<Select Item>` to avoid clipped labels.
- Set visible app version to `2026.06.13.005-fix-carryover-global-controls`.
- Renamed the planner-side leadership card headline to `District At Large` and moved district/week context into supporting text.
- Set visible app version to `2026.06.13.004-ui-district-at-large-title`.
- Relaxed the Planner Remote Control layout so status chips and action buttons no longer crowd each other when every state is active.
- Set visible app version to `2026.06.13.003-ui-remote-spacing`.
- Fixed Neighborhood Rotations food-cost range logic so a single selected mix does not display an artificial range.
- Scoped Live Selection Analytics to Global Rotation picker selections instead of unrelated station selections.
- Added the Planner Remote Control above Chef Planner with save, submit, copy, load, upload, and print actions grouped together.
- Moved System Status to the bottom of the planner card and reduced header copy.
- Set visible app version to `2026.06.13.002-fix-cost-remote-control`.
- Replaced the Neighborhood Rotations planner district and cafe dropdowns with button-style toggle controls for limited option sets.
- Added bright green active outlines and indicator dots to selected planning controls.
- Added a more colorful but professional Neighborhood Rotations page treatment with a subtle green canvas, gold header accent, and stronger status-card states.
- Set visible app version to `2026.06.13.001-ui-toggle-color-controls`.

## 2026-06-12

- Added a reusable Compass One logo mark and placed it in the platform and tool headers.
- Set visible app version to `2026.06.12.007-brand-compass-one-logo`.
- Added the Figma-inspired Neighborhood Rotations planner polish: tighter planner card, status pill, operating snapshot metrics, and submit-after-planning flow.
- Set visible app version to `2026.06.12.006-ui-figma-rotations-planner`.
- Replaced generic home overview panels with culinary program metrics: tools, menu items, menus, and costed items.
- Set visible app version to `2026.06.12.005-ui-program-overview-metrics`.
- Redesigned the platform home screen into a tighter operations console with clearer tool cards, status cues, and product-style navigation.
- Refined the Neighborhood Rotations planner shell, tabs, selector cards, station panels, and picker groups for a cleaner product UI.
- Set visible app version to `2026.06.12.004-ui-console-design-pass`.
- Reordered Chef Planner selector cards to `District`, `Cafe`, then `Week`.
- Set visible app version to `2026.06.12.003-ui-planner-selector-order`.
- Added source-detail warnings in Neighborhood Rotations item description panels so incomplete legacy/uploaded rows no longer look like confirmed no-allergen results.
- Renamed remaining station item rollup panels to `Items Description`.
- Flagged the MenuWorks source-data completeness issue found in the local dataset: 113 unique item names are missing both description and allergen detail.
- Set visible app version to `2026.06.12.002-fix-source-detail-warnings`.
- Renamed the Neighborhood Rotations selected-items panel to `Items Description`.
- Fixed selected item detail lookup so one selected item no longer expands into every matching MenuWorks row.
- Improved allergen and description handling for MenuWorks rows that store allergens as summaries or detail flags.
- Set visible app version to `2026.06.12.001-fix-items-description-rollup`.

## 2026-06-11

- Fixed the Neighborhood Rotations cafe-selection screen by importing `APP_VERSION_STAMP` for the system status panel.
- Set visible app version to `2026.06.11.001-fix-rotations-cafe-view`.

## 2026-06-08

- Fixed the Neighborhood Rotations screen after the feature split by importing the shared `VersionStamp` component.
- Set visible app version to `v2026-06-08-rotations-version-import-fix`.
- Set visible app version to `v2026-06-08-backbone-feature-split`.
- Linked the local workspace to the existing Vercel project.
- Moved the app entry into a stable shell at `src/App.jsx`.
- Created a small app coordinator at `src/app/CulinaryToolsPlatformApp.jsx`.
- Moved the platform landing screen to `src/app/LandingPage.jsx`.
- Moved Menu Engineering to `src/features/menu-engineering/MenuEngineeringDashboard.jsx`.
- Moved Neighborhood Rotations to `src/features/neighborhood-rotations/NeighborhoodRotations.jsx`.
- Moved Ladle Compliance to `src/features/ladle-compliance/LadleComplianceDashboard.jsx`.
- Extracted shared formatting helpers into `src/shared/formatting.js`.
- Extracted the app version into `src/shared/appConfig.js`.
- Extracted `VersionStamp` into `src/shared/ui/VersionStamp.jsx`.
- Extracted Smartsheet column/type constants into `src/integrations/smartsheet/contract.js`.
- Extracted Smartsheet load/sync helpers into `src/integrations/smartsheet/client.js`.
- Added feature folders for menu engineering, neighborhood rotations, and Ladle compliance.
- Added build verification guidance and ignore rules for generated files.
