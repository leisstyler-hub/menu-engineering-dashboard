# AI Handoff

Last updated: August 15, 2026

Current release version: `2026.08.15.001-food-cost-plate-reference` (LIVE)

Latest process update: August 15, 2026 published `docs/FOOD_COST_PLATE_COSTING_REFERENCE.md`, a durable Markdown conversion of Tyler's reviewed `WebT Price Average AI Reference (1).xlsx` workbook for future agent food-cost calculation work. The reference preserves all 1,566 source item rows across 53 concepts, treats MRNs as exact text, defines `Item + Waste Cost` as the plate-cost input, records confirmed non-RA plate formats (including Soup, Pizzas & Flatbreads, Taco Total, Tavola Nova, Yakisoba, and station-grouped Street Eats/Wok), and explicitly forbids inference for all `AMZ+RA:` concepts. Taco Total's canonical component spelling is `Protein`. Compatibility/grouping rules, special rules, and source-cost-gap remediation remain pending beyond the confirmed direction. This is a documentation-only release: application code, Supabase, Smartsheet, and menu source records are unchanged. Markdown validation confirmed 1,566 full-index rows, 53 concepts, and 14 intentionally unclassified RA concepts; the production build passed. GitHub `main` application/docs commit `5fce98490851338ea51b7152fff39f8dc47439db` is deployed by Vercel production deployment `dpl_6hgjXVt3tVX9Mp5ufXZPasQVvToY` (`READY`), and live asset `/assets/index-CMt200rJ.js` contains version `2026.08.15.001-food-cost-plate-reference`. Release state is `LIVE`.

Latest process update: August 14, 2026 published the North/Nessie Global Aug 17 plate-cost correction so `AMZ: Smokehouse BBQ` recognizes selected `Mac & Cheese` as its base. Root cause: `Mac & Cheese` carries authoritative MenuWorks category `Starch/Grain > Pasta`, but the first pilot recognized only rice/noodle words and therefore incorrectly showed the complete-plate warning. `isPlateBaseSide()` now accepts explicit `Starch/Grain` source categories while retaining the rice/noodle name fallback and salad-category veto. The visible pilot guidance now explains that starch/grain selections, including rice, noodles, and pasta, are bases. The direct browser regression selects both Smokehouse entrees, Mac & Cheese, three non-base sides, one sub recipe, and an extension; it proves both per-entree dollar/percentage ranges calculate, the sub recipe is included, and the extension remains excluded. Scope stays exact North/Nessie/Global/Aug 17; all other planner, recap, Results, summary, export, persistence, Supabase/Smartsheet, cafe, and week behavior remains unchanged. Application commit `5f22b9811b2b4fa13da44abcd58a2ad3c389ded3` reached Vercel production successfully, the live bundle contains version `2026.08.14.002-smokehouse-starch-base-fix`, and both required browser suites passed 39/39 against `https://project-d8v25.vercel.app`, including the exact Smokehouse regression. Release state is `LIVE`.

Previous process update: August 14, 2026 published a planner-only per-entree plate food-cost pilot for North/Nessie Global in the exact week `Aug 17, 2026 - Aug 21, 2026`. The pilot replaces only that station's `Selected Mix Food Cost %` card. Standard menu plates enumerate one selected rice/noodle base plus every two-distinct-non-base-side combination, add every selected sub recipe, exclude extensions, and divide each low/high plate cost by the selected entree's retail price only. The exact carb-heavy exception set (`AMZ: Piccola Italia`, `AMZ: Lemongrass + Lime`, `AMZ: Chiang Mai`) instead enumerates entree plus one selected side plus all sub recipes. Base inference uses selected rice/noodle names while excluding salad-category rows; the pilot explains this beside the results, and explicitly labels the plate true-cost dollars and entree-retail food-cost percentage. Incomplete composition or missing component cost, entree cost, or retail suppresses misleading percentages and shows an explicit issue. Submitted recaps, Results, summaries, exports, saved records, Supabase authority, Smartsheet fallback, other cafes, and other weeks are unchanged. Application commit `0fa3c374cdb5b0629f2ddde456222576ed4788cc` reached Vercel production successfully, the live bundle contains version `2026.08.14.001-nessie-global-plate-cost-pilot`, and both required browser suites passed 39/39 against `https://project-d8v25.vercel.app`, including standard and exception math, sub-recipe inclusion, extension exclusion, incomplete messaging, explicit result labels, and adjacent-week legacy behavior. Release state is `LIVE`.

Previous process update: August 13, 2026 corrected the remaining North `Commissary` café selector overflow at the screenshot's actual narrow width. The first containment pass tested only a 1024px viewport and missed that the inner flex label retained its intrinsic word width inside an approximately 240px viewport. The inner label is now explicitly `flex-1 min-w-0 whitespace-normal` with `overflow-wrap:anywhere`, allowing it to shrink and wrap inside its column while the status dot remains visible. Browser coverage runs at both 240px and 1024px and verifies all label edges remain inside the button, `scrollWidth <= clientWidth`, and computed `overflow-wrap` is `anywhere`. The integrity guard protects the full flex containment rule. This is presentation-only: café names, selection behavior, district assignments, rotation data, Supabase, and Smartsheet are unchanged. The earlier Moby open-draft projection fix shipped in the same release. Application commit `76fff0a88816dd091dbdfc25d3efdd727993278d` reached Vercel production with a successful deployment status, and both required browser suites passed 38/38 against `https://project-d8v25.vercel.app`, including the screenshot-matched narrow Commissary geometry regression. Release state is `LIVE`.

Previous process update: August 1, 2026 fixed the live Moby open-draft presentation gap reported against `Oct 5, 2026 - Oct 9, 2026`. Read-only production inspection confirmed Supabase already held the correct authoritative Dawson header (`Submitted`) and complete `mobyPopUp` record family for `AMZ: House of Teriyaki`; no write, schema, or migration repair was needed. The root cause was confined to `RotationPlannerCard`: Moby leadership/Results/export surfaces received `rowForDisplay()`, but the editable draft planner continued to render its raw native Global section. When `__dawsonMobyGlobalOverride` is active, the Moby draft now shows a read-only `DawsonMobyGlobalProjectionSection` with the projected menu, service days, selection slots, descriptions, calories, retail/cost analytics, and explicit Dawson ownership. Moby remains Draft/open, non-Global stations remain editable, the native Moby Global selection is retained as fallback, the projection is not copied to Moby storage, and duplicate reporting remains native-only. The browser regression uses the exact live `Oct 5, 2026 - Oct 9, 2026` empty-Moby record shape, displays the Dawson menu/items without editable Global selectors, and proves Save Draft does not copy projected rows into Moby. This fix shipped in application commit `76fff0a88816dd091dbdfc25d3efdd727993278d` and is production verified.

Previous process update: August 5, 2026 published an East District exception so `AMZ: Balti` is no longer treated as a cross-cafe duplicate within the East district, allowing more than one East cafe (including Bingo) to submit it in the same week without the Neighborhood Rotations duplicate-menu submit blocker or leadership duplicate badge/count. Root cause of the observed Bingo blocker: `MENU_CONFLICT_GROUPS` only ever defined a `South` group, and `cafeUsesMenuConflictRule()` defaults to `true` for any district with no group entry, so every East cafe was already subject to the generic cross-cafe duplicate rule on every Global Menu with no exception. The fix adds a district-scoped `DUPLICATE_MENU_EXCEPTIONS = { East: ["AMZ: Balti"] }` config and a single `isDuplicateMenuExempt(district, menu)` predicate, then gates the two functions that actually produce a duplicate count: `menuConflictCounts()` (source for every leadership/status/executive/pulse surface) skips accumulating a count for an exempt district+menu combo, and `menuConflictCountForCandidate()` (feeds the submit-blocker text in `rotationRequirementIssues()`) short-circuits to `0` for the exempt case. No other function (`cafeUsesMenuConflictRule`, `conflictControlledRows`, `rowHasMenuConflict`, `rotationRequirementIssues`, `menuConflictNote`) was touched, so every non-Balti duplicate rule in every district, including South's `Nitro`/`Day 1`/`Doppler` group and its `Re:Invent` exception, is unchanged. No schema, storage API, source-authority, or production-data change; this is pure client-side validation logic in `src/features/neighborhood-rotations/NeighborhoodRotations.jsx`. `tests/browser/neighborhood-rotations.spec.js` gained two direct browser cases: an East cafe (Astra) submitting `AMZ: Balti` alongside an already-submitted Bingo `AMZ: Balti` rotation succeeds with no blocker text and no duplicate badge, and a regression case proving a non-Balti East duplicate (`AMZ: Ohana`) still blocks submission with the unchanged blocker wording. Release pushed docs head `b30ba360569e0870ddf779e8bd0edf5c7bbd801b` to GitHub `main`, and independent Scribe checks confirmed `origin/main` and `FETCH_HEAD` at the same SHA plus live Vercel asset `/assets/index-CA3kPasv.js` containing version stamp `2026.08.05.001-east-balti-duplicate-exception`. Live production verification passed `neighborhood-rotations` 15/15, including the East Balti exemption and non-Balti regression cases, plus `reinvent-submit-recall` 22/22. No schema, production data, or source-authority change occurred. Release state is `LIVE`.

Previous process update: August 4, 2026 published East district `Grace`'s Global station on the same single Wednesday-Tuesday cadence as Doppler and Bingo: Monday+Tuesday carry over from the prior Wednesday cycle, and Wednesday starts the next cycle through the following Tuesday. `globalCycleConfig()` and `rotationSummaryBlockLabels()` now route `Doppler`, `Bingo`, and `Grace` through one generalized `isWedTuesGlobalCafe(cafe)` check backed by `WED_TUES_GLOBAL_CAFES = new Set(["Doppler", "Bingo", "Grace"])`; Doppler and Bingo's rendered text, save records, and recall behavior are unchanged, and Grace's station list, station slots, and non-Global stations (`streetBeets`, `grill`, `freshFive`, `salad`) remain untouched. `scripts/verify-rotation-integrity.mjs` now guards the shared set and routing, `tests/browser/neighborhood-rotations.spec.js` proves the Grace planner cadence/save-reload recall path, and `tests/browser/reinvent-submit-recall.spec.js` proves Grace's submitted/leadership card renders the same Monday+Tuesday carryover and Wednesday-Friday current-menu pattern as Doppler/Bingo. Release fast-forwarded GitHub `main` to `a1cbcf9f255ccb1fb1233f444b578baff6a3cb81`, Vercel production serves `https://project-d8v25.vercel.app` with live asset `/assets/index-B7fXUsih.js` containing version stamp `2026.08.04.001-grace-wed-tues-global`, and live production verification passed `neighborhood-rotations` 13/13 plus `reinvent-submit-recall` 22/22, including the Grace planner and Grace leadership-card cases. No schema, production data, source-authority, or Supabase/Smartsheet contract change occurred. Release state is `LIVE`.

Previous process update: August 1, 2026 moved the East district `Everest Commissary` custom station from Bingo to Blueshift, per Tyler's explicit deploy-speed-test authorization. `CAFE_STATION_CONFIG.Bingo` no longer includes `commissaryEverest` and `CAFE_STATION_CONFIG.Blueshift` now does, so Bingo no longer shows the Everest Commissary station tab/tile and Blueshift does. The station's internal key (`commissaryEverest`), its Smartsheet contract label (`Everest Commissary`), its saved-record shape, and its selection/recall logic are all unchanged — only cafe ownership moved. `CommissaryEverestSection`'s `eyebrow` label was updated from `Bingo Commissary Station` to `Blueshift Commissary Station` to match. `scripts/verify-rotation-integrity.mjs`'s `requiredEastMarkers` were updated to require the new Bingo/Blueshift station arrays instead of the old ones. The targeted browser regression `Everest Commissary belongs to Blueshift instead of Bingo` now exists in `tests/browser/neighborhood-rotations.spec.js`; it proved locally that Bingo hides the station while Blueshift renders, saves, and recalls it, and Release reported the same behavior live with `neighborhood-rotations` 12/12 passed and `reinvent-submit-recall` 21/21 passed. Release evidence for the published app state: GitHub `main` is `99e6cb230f34e4f150ef2e2c2f97b4946be88d7f`, Vercel production serves `https://project-d8v25.vercel.app` with live asset `/assets/index-Dlbv_OSe.js`, and that asset contains version stamp `2026.08.01.003-bingo-blueshift-everest-commissary`. No schema, production data, or source-authority change; Blueshift's existing split-global `2/2/2` Global station behavior is untouched since `commissaryEverest` is a separate, non-Global station. Remaining operational note: 12 existing Submitted Bingo `commissaryEverest` records for August 3-31, 2026 remain in storage but no longer surface in Bingo planner/export/completion UI after this authorized non-date-scoped move. Release state is `PRODUCTION VERIFIED`; final documentation publication and independent Scribe LIVE sign-off remain pending.

Previous process update: August 1, 2026 published the Moby cafe Global projection requested by Alex. For North/Moby presentation rows only, `projectDawsonMobyGlobal()` reads the same week's authoritative Dawson rotation and, when Dawson is `Submitted` with valid Moby Pop-Up data, attaches a transient `__dawsonMobyGlobalOverride`. Cards, Results analytics and selection detail, the locked submitted planner recap, cost calculations, and print exports use the projected Dawson Moby menu/items in place of Moby Global. Normal and promotion submissions are both supported; the projection is never persisted into Moby and never changes Moby's own planner-editable Global choice, Draft/Submitted status, station-completion progress, or non-Global station content. Draft Moby tiles show the Dawson projection immediately while retaining their open status and native progress. `rotationMenuLabelForDuplicateReporting()` deliberately strips the projection so duplicate-menu reporting continues to compare Moby's native Global menu. Supabase remains authoritative and the existing `app_records` rotation contract is unchanged; there is no migration, new table, or API exposure. Reviewer, Verifier, Scribe documentation, and Release gates passed. Application commit `16683504501f584d1a565c915b35cbcf904ccb46` reached Vercel production deployment `dpl_CE363147117z2vqmdNmYrRnKGtrR` with `READY` status. Public assets contain the exact version and projection/recap markers; both required suites passed 32/32 against `https://project-d8v25.vercel.app`, including the targeted normal/promo, Draft/open progress, submitted recap, Results, print, native Pizza, and duplicate-isolation coverage. Runtime scan found no application error cluster, only the pre-existing Node `url.parse()` deprecation warning. Independent Scribe LIVE sign-off passed against documentation commit `fa0989ec0e480ad41412fe393a8aba2125ca7ae4`; release state is `LIVE`.

Previous process update: August 1, 2026 published Dawson's new `Moby Pop-Up` Neighborhood Rotations station. `cafeStationsForWeek()` activates and requires the station only for Dawson weeks starting `2026-08-31`; the UI states that service runs Tuesday through Thursday. Normal `mobyPopUp` state uses a Global-or-`AMZ: Carvery` menu selector and menu-driven 2-entree / 3-side / 2-sub-recipe / 1-extension capacity. The isolated `mobyPopUpPromotionOverride` supports only Tuesday, Wednesday, and Thursday day choices, including one-day promos; when enabled it hides and replaces the entire normal Moby configuration for the saved week. Shared records use dedicated `mobyPopUp` and `mobyPopUpPromotion` station keys and retain the existing Supabase-primary / Smartsheet-mirror rotation contract, so no database schema migration is required. Recall, selected-item metadata, costs/calories/retail, completion, recap, export, and source guards are included. Local verification passed `pnpm run verify` and the two required rotation suites 31/31; independent Reviewer, Verifier, and Release gates passed. Application commit `0b4ac627eb51bb68f8e92dd0fc4edb5435efef74` reached Vercel production deployment `dpl_2CRuWUbLK7AKR9rVNQAhYg54Cwgi` with READY status. Public assets `assets/index-Cc3gauFV.js` and `assets/NeighborhoodRotations-kP7ud7xd.js` contain the exact version and Moby release markers, and both required suites passed 31/31 against `https://project-d8v25.vercel.app`, including clean Carvery normal-record recall, one-day promo replacement/recall, and the full Re:Invent regression set. Release state is `PRODUCTION VERIFIED`; final documentation publication and independent Scribe LIVE sign-off complete the release record.

Previous process update: July 31, 2026 shipped the Bingo-only Neighborhood Rotations release that adds a Doppler-style single Wednesday-Tuesday Global cadence and a second `grillFreshFive` slot under `Grill Fresh $5`, while keeping Bingo out of `SPLIT_GLOBAL_CAFES` and leaving the separate generic Grill `Location Spotlight` behavior unchanged. The same release routes Bingo's submitted recap / locked leadership card through the shared Wednesday-Tuesday summary path so Bingo cards show the same carryover/new-cycle structure as Doppler instead of a generic Monday-Friday block. Release fast-forwarded `builder/bingo-wed-tues-grill-fresh-five` to GitHub `main` at commit `37204062ba2c22ec172e5166ef8cd692a81e73e2`, and Vercel production serves `https://project-d8v25.vercel.app` with live asset `/assets/index-DG0otXKS.js` containing version stamp `2026.07.30.002-bingo-wed-tues-grill-fresh-five`. Independent production verification confirmed `origin/main` at the same SHA, live `neighborhood-rotations` passed 9/9 including Bingo's Wednesday-Tuesday cycle and both Grill Fresh $5 slots, and live `reinvent-submit-recall` passed 21/21, so the evidence-backed release state is `PRODUCTION VERIFIED`. Remaining non-blocking notes: the shared summary helper still uses internal ids `dopplerMonTue` / `dopplerWedFri`, but those ids are neither persisted nor user-visible; there is still no dedicated regression test that loads a legacy one-slot Bingo `grillFreshFive` record, though the unchanged shared recall fallback leaves slot 2 blank. Production browser verification exercised the real deployed bundle against the live URL but used the existing mocked/intercepted test harness rather than live Supabase/Smartsheet writes; no schema or data-path change shipped in this release.

Previous process update: July 30, 2026 fixed the mobile/tablet Menu Library item detail drawer cutoff and the follow-up mobile close-control overlap. On stacked drawer layouts below `lg`, `LibraryCardDrawer` now uses the drawer shell itself as the scroll region so the photo/header, Overview/Nutrition/Files tabs, and active tab content stay reachable on phone widths instead of clipping the tab row below the viewport while only a collapsed inner body could scroll. The existing desktop `lg+` internal-scroll drawer pattern is preserved. The mobile-only persistent close button now stays absent while the original in-header close button is still visible, then appears only after that header close has scrolled out of view, so close remains reachable without overlapping the header close button or a photo-present item. This is presentation-only: no Menu Library data, Supabase, Smartsheet, MenuWorks, MRN, Webtrition, navigation, tab naming, or card-field behavior changed. Browser coverage in `tests/browser/recipe-library.spec.js` now covers the 390x844 phone-width scroll path, confirms the drawer shell is the mobile scroll region with no horizontal overflow, reaches Overview/Nutrition/Files content and bottom tab content, and proves the persistent close control stays hidden until the header scrolls away and never overlaps the header close button or the food photo. Accepted verification for the implementation commit `dabb95f` recorded targeted drawer Playwright passes plus `npm run verify` clean; the broader `npm run verify:browser -- tests/browser/recipe-library.spec.js` run still has only the known pre-existing out-of-scope `data-library-property-label` count mismatch that reproduces on `origin/main@fa5af1c3`.

Previous process update: July 29, 2026 removed the redundant word `protein` after gram values on Menu Library cards. `proteinLabel()` in `src/features/recipe-database/recipeLibraryModel.js` now returns grams-only strings like `36g` instead of `36g protein`, so the top info pill and the `Property label="Protein"` tile no longer repeat the word already shown by the surrounding label. This is a single shared-function change, so it also removes the same redundancy in the Menu Library detail drawer's nutrition row and info pill, which use the same `proteinLabel()` function. The `Protein not loaded` fallback is unchanged. This is presentation-only: no calculation, data, Supabase, or Smartsheet behavior changed. Browser coverage in `tests/browser/recipe-library.spec.js` asserts the rendered Menu Library card shows `36g` (count 2, for the top pill and the property tile) and does not render `36g protein`. `pnpm run verify:browser -- tests/browser/recipe-library.spec.js` passed this new assertion; the suite's pre-existing `data-library-property-label` count expectation (`toHaveCount(5)`) still fails against the actual 6 property tiles the card renders (True cost, Food cost, Protein, Portion, MRN, WebT OZ) — this failure reproduces identically on `origin/main@21441f4` before this change and is unrelated to the protein label fix; it was reported to Chief rather than fixed, since widening scope to it was not authorized. The full `pnpm run verify` release gate (all release-guard scripts plus the production Vite build) passed.

Previous process update: July 27, 2026 fixed expanded Planner Remote Control labels that could slide beyond their button edges at narrower desktop widths. The shared action buttons now hide external overflow, use slightly tighter icon/padding spacing, and allow labels such as `Generate Menu`, `View/Print`, and `Save Draft` to wrap within the available button width instead of relying on a fixed 44px label box. Expanded phone buttons stack the small icon above the label so longer text keeps enough horizontal room, while desktop keeps the inline layout. The fix applies through the one shared control to every district, cafe, and selectable week. Browser coverage measures all seven expanded label rectangles against their button rectangles at 930px desktop and 360px phone widths, and the rotation integrity guard protects the containment classes. This is presentation-only: action behavior, submission state, rotation data, Supabase authority, and Smartsheet fallback are unchanged.

Previous process update: July 26, 2026 added a requested `Buzz Mobile Chief test` entry to the dashboard changelog (testing that Alex Neuse, a Release-Authorized Admin per `ADMIN_REGISTRY.md`, can direct real work through the agent workforce from Buzz Mobile) and advanced the visible app version to `2026.07.26.003-buzz-mobile-chief-test`. This is a changelog-only visible-content release with no application logic, data flow, or storage changes, matching the `test`/`test2-changelog-entry` precedent from 2026-07-25.

Previous process update: July 26, 2026 added the requested `Buzz mobile chief test 2` entry to the dashboard changelog and advanced the visible app version to `2026.07.26.002-buzz-mobile-chief-test-2`. This is a changelog-only visible-content release with no application logic, data flow, or storage changes.

Previous process update: July 26, 2026 redesigned the shared Neighborhood Rotations Planner Remote Control as a slim, full-width black bar at its existing position above the rotation and advanced the visible app version to `2026.07.26.001-planner-remote-minimal-bar`. It defaults to icon-only in every district, cafe, and selectable week while keeping all seven actions—including Save Draft and Submit—immediately available through accessible icon buttons and tooltips. At phone widths, the seven icons use a fixed grid rather than horizontal scrolling; Upload is a real keyboard-operable button that triggers the visually hidden file input. A compact colored indicator communicates Draft/Ready/Blocked/Submitting state. Expand reveals smaller action labels, copied/update state, cafe/week context, and full submit guidance; submissions automatically expand so the keep-tab-open storage warning cannot be hidden. Browser coverage verifies the collapsed default and expanded state, audits the compact remote across every configured cafe and future week, and checks that all seven actions remain inside the phone-width remote and activate in keyboard tab order. Verification passed the full `pnpm run verify` gate (including 460 timestamped changelog entries and the production build) and both required Neighborhood Rotations browser suites at 28/28 against the exact built artifact. This is a presentation-only change: rotation data, save/submit mechanics, Supabase authority, and Smartsheet fallback are unchanged.

Previous process update: July 25, 2026 added the browser/OS application icon (favicon, PWA manifest, apple-touch-icon) as the official Culinary Tools Platform icon and advanced the visible app version to `2026.07.25.004-app-icon-favicon-manifest`. This is OS/browser chrome branding only: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180x180, flattened onto the artwork's own opaque black background), `android-chrome-192x192.png`, `android-chrome-512x512.png`, and `site.webmanifest` were generated from the supplied master artwork, with six additive `<link>`/`<meta>` tags in `index.html`. `theme_color`/`background_color` (`#000000`) were sampled directly from the artwork's dominant background pixel rather than invented; no maskable icon variant is shipped because the design bleeds past the safe center-crop margin (independently corroborated by both Chief and Reviewer via separate pixel-sampling methods). Nothing under `src/` was touched — `grep -rli "favicon|apple-touch-icon|android-chrome|site.webmanifest" src/` returns zero matches, confirming no leakage into Platform Home, navigation, or any in-app screen. `npm run build` (`vite build`) succeeded with all 7 icon/manifest assets emitted into `dist/` and correctly referenced from `dist/index.html`.

Previous process update: July 25, 2026 added a Dawson-only Promotion Override to Carvery Station for every selectable week and advanced the visible app version to `2026.07.25.003-dawson-carvery-promo-override`. The override has its own `carveryPromotionOverride` state and `carveryPromotion` database-record family, so it cannot change Dawson's separate Global promotion or any other station. Chefs can select individual weekdays, name the promotion, and use the same nine Carvery-specific protein/vegetable/starch/hot-side/cold-side fields. Enabling the override hides and replaces the normal Carvery selectors for the saved week; submission completion, selected-item cost signals, recaps, details, and exports all use only the promo selections. Browser coverage clears localStorage after saving, reloads the shared rows, and confirms the promo name/item return while ordinary Carvery rows remain absent. Verification passed the full `pnpm run verify` suite, including all 455 timestamped changelog entries and the production build, plus both required browser suites at 27/27 against the exact built artifact.

Previous process update: July 25, 2026 added the requested timestamped `test2` entry to the dashboard changelog and advanced the visible app version to `2026.07.25.002-test2-changelog-entry`. This is a changelog-only visible-content release with no application logic, data flow, or storage changes. The full `pnpm run verify` release gate passed, including 451 timestamped changelog entries and the production Vite build.

Previous process update: July 25, 2026 added the requested `test` entry to the dashboard changelog and advanced the visible app version to `2026.07.25.001-test-changelog-entry`. This is a changelog-only visible-content release with no application logic, data flow, or storage changes. The full `pnpm run verify` release gate passed, including 449 timestamped changelog entries and the production Vite build.

Previous process update: July 24, 2026 fixed a second, structurally identical Re:Invent recall bleed site. The `2026.07.22.005-reinvent-globalblocks-isolation` release isolated each rebuilt rotation's `globalBlocks` object, but the merge logic inside `recordsToRotations` still had two separate places that resolve a Global Block's displayed menu, and only the first (line 988, for rows that already have a Global Block row) put the record's own submitted `menuConcept` ahead of the `preferredMenuFor` weighted-aggregate fallback. The second site (line 1046, for global-selection-only records where no Global Block row exists yet) still resolved as `authoritativeMenu || preferredMenuFor(...) || block.menu || record.menuConcept`, so a stale week with more duplicate `AMZ: Roam BBQ` selection rows could outweigh a correctly submitted `AMZ: Cypress` record and win the weighted aggregate. Line 1046 now matches the line 988 precedence order: `authoritativeMenu || record.menuConcept || preferredMenuFor(...) || block.menu`. Verification gate: load Re:Invent for `Jul 20, 2026 - Jul 24, 2026` with a stale Roam BBQ week present and confirm Monday+Tuesday still shows `AMZ: Cypress` with no Global Block row pre-seeded for that block. Browser coverage now includes `reinvent-submit-recall.spec.js`'s new "prefers a global-selection record's own submitted menu over stale weighted aggregate evidence when no global block row exists" case; the full suite passed locally with 21/21 tests.

Previous process update: July 22, 2026 found and fixed the actual Re:Invent recall root cause. The live database/API already returned the correct submitted rows for `Jul 20, 2026 - Jul 24, 2026` (`AMZ: Cypress`, `AMZ: Balti`, `AMZ: Harvest Co.`), but `recordsToRotations` shallow-copied `EMPTY_ROTATION` without replacing its nested `globalBlocks` object. That meant every rebuilt rotation shared one mutable Global Block object; when another saved Re:Invent week with Roam BBQ/Lotus/Ohana loaded later, it mutated the current week's rebuilt state and made the UI reopen Monday+Tuesday as `AMZ: Roam BBQ`. `ensureRotation` now creates an isolated `globalBlocks: {}` for each rebuilt rotation. Verification gate: load Re:Invent for `Jul 20, 2026 - Jul 24, 2026` and confirm Monday+Tuesday shows `AMZ: Cypress`, Wednesday+Thursday shows `AMZ: Balti`, Friday shows `AMZ: Harvest Co.`, and `AMZ: Roam BBQ` is absent after a fresh browser load. Browser coverage now includes a stale Roam BBQ Re:Invent week beside the clean Cypress week to prevent this shared-state bleed from returning.

Previous process update: July 22, 2026 fixed the live Re:Invent recall path where the database/API already returned the correct submitted rows for `Jul 20, 2026 - Jul 24, 2026` (`AMZ: Cypress`, `AMZ: Balti`, `AMZ: Harvest Co.`), but the UI rebuilt the submitted recap from stale split-block evidence and could still show `AMZ: Roam BBQ` on Monday+Tuesday after leaving and reopening. The loader now accepts live Supabase/Smartsheet aliases such as `Menu Item Selection`, submitted split-global block menus are keyed by exact week/cafe/block evidence, mismatched stale child selections are cleared, and the final split-block normalization enforces the authoritative submitted block menu. Verification gate: load Re:Invent for `Jul 20, 2026 - Jul 24, 2026` and confirm Monday+Tuesday shows `AMZ: Cypress`, Wednesday+Thursday shows `AMZ: Balti`, Friday shows `AMZ: Harvest Co.`, and `AMZ: Roam BBQ` is absent. The full `reinvent-submit-recall.spec.js` browser suite passed locally with 19/19 tests.

Previous process update: July 22, 2026 rebuilt the Re:Invent split-global recall path around shared database authority. Shared Supabase/Smartsheet records now replace stale browser rotations before the planner renders, Re:Invent always uses stable Monday+Tuesday / Wednesday+Thursday / Friday block IDs, inactive split blocks are removed for the selected week, and future weeks no longer preload old Re:Invent concepts. Verification gate: load Re:Invent for `Jul 20, 2026 - Jul 24, 2026` and confirm Monday+Tuesday shows `AMZ: Cypress` and `AMZ: Roam BBQ` is absent. The full `reinvent-submit-recall.spec.js` browser suite passed locally with 19/19 tests, including stale local Roam BBQ cache, week-start-only Supabase rows, and blank future-week regressions.

Earlier process update: July 22, 2026 fixed the live Re:Invent week-key recall failure where Supabase rows were correctly saved under `rotation|2026-07-20|South|Re:Invent` / `Week Start Date`, but stale browser cache was keyed by the visible `Jul 20, 2026 - Jul 24, 2026` week label. That mismatch allowed Monday+Tuesday `AMZ: Roam BBQ` to reappear after leaving and reopening even though Supabase returned `AMZ: Cypress`. Loaded rotation records now canonicalize week identity before grouping/cache lookup, so week-start-only shared rows override stale display-week cache. Verification gate: load Re:Invent for `Jul 20, 2026 - Jul 24, 2026` and confirm Monday+Tuesday shows `AMZ: Cypress` and `AMZ: Roam BBQ` is absent. The full `reinvent-submit-recall.spec.js` browser suite passed locally with 19/19 tests including the new week-start-only Supabase regression.

Earlier process update: July 22, 2026 fixed the second Re:Invent recall failure where shared Supabase data could be correct but stale local/fallback rotations still survived in the browser after returning from the platform home or opening an unsaved future week. Shared database reads now replace the local rotation map whenever the server responds, even with zero rows, so unsaved weeks stay blank. Re:Invent split-block rendering no longer falls back to inactive saved blocks for weeks with active block IDs. Supabase/Smartsheet save cleanup now deletes the full rotation record family by parent record ID prefix, preventing stale Roam BBQ child rows from surviving a Cypress resubmit. Verification gate: edit Re:Invent for `Jul 20, 2026 - Jul 24, 2026`, set Monday+Tuesday to `AMZ: Cypress`, submit, leave Neighborhood Rotations, return to the same cafe/week, and confirm Cypress still displays and Roam BBQ is absent. The full `reinvent-submit-recall.spec.js` browser suite passed locally before publish, including the new blank-future-week stale-cache regression.

## First Rule

Read this file before changing code. After every meaningful change, update this file, `CHANGELOG.md`, and the visible version stamp when the live app changes.

Handoff protocol:

1. Start every code pass by reading this file, `CHANGELOG.md`, `src/shared/appConfig.js`, and the working tree/source sync status.
2. For quick source/auth checks, run `pnpm run release:preflight`; for app behavior/data/UI changes, still run the relevant verification or full `pnpm run verify`.
3. Before writing a new changelog entry, run `pnpm run changelog:stamp` and paste that exact timestamp into `CHANGELOG.md`.
4. Treat GitHub/Vercel/Supabase/live app as the shared truth, not just the local checkout.
5. When a change is meaningful, update this handoff with the new version, current state, verification, and any risks that the next Codex/co-worker must know.
6. Never leave a release with the handoff pointing to an older version than the visible app.

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
- Single-menu Global weeks should display in the same bordered card-block style as split-week and promo summaries, labeled `Monday - Friday`; do not revert them to loose plain text.
- No-Global locked cafes should display `Stations` / `Selections locked` in the same bordered card-block style; do not add fake AMZ/global labels.
- Re:Invent and Blueshift use split-global `2/2/2` logic.
- Re:Invent current pattern starts Monday/Tuesday, Wednesday/Thursday, Friday wrapping into next Monday unless holiday logic says closed.
- Submit/resubmit should overwrite the saved rotation for that cafe/week, not create useless duplicate history.
- South district conflict logic: Nitro/Frontier, Day 1, and Doppler cannot match Global menus; Re:Invent is an exception.
- Browser localStorage cannot be trusted for large record sets.

Recent critical fix:

- `2026.07.21.006-reinvent-slot-stale-row-lock` addresses the fourth Re:Invent edit-and-resubmit report. Root cause: changing a split-global slot wrote a new child record ID that still included the old item/menu name, so older submitted child rows could remain in storage and win after reload if their timestamp was newer or if local/shared rows merged. Split-global selections now use stable block/selection-type/slot IDs, and recall filters any child row whose menu disagrees with the submitted Global Block menu for that block. If a block says Monday/Tuesday is Cypress, Roam/Ciudad child rows for that same block are discarded instead of displayed. Verification passed for source-level rotation integrity and submission health; the Playwright browser runner was unstable in the local shell during this pass, so keep the stale-row tests in `tests/browser/reinvent-submit-recall.spec.js` and re-run them when the runner is healthy.
- `2026.07.21.005-reinvent-shared-recall-authority` makes Supabase/shared rotation rows authoritative over local browser rotation cache when Neighborhood Rotations loads. This protects the user path: edit Re:Invent, submit Cypress for Monday/Tuesday, go back to Platform Home, reopen Neighborhood Rotations, and still see Cypress instead of an older local Roam BBQ cache. Global Block evidence now also breaks freshness ties using canonical block identity so stale odd-ID block rows cannot outrank the proper saved block row. Browser coverage: full `tests/browser/reinvent-submit-recall.spec.js` passes against the built production bundle, including stale local cache replacement, same-block stale rows, draft child compatibility, promo recall, Doppler, and Nitro.
- `2026.07.21.004-reinvent-same-block-stale-row-guard` fixes Re:Invent edit-and-resubmit recall when fresh Cypress rows and older Roam BBQ rows remain for the same Monday/Tuesday block under different record IDs. Split Global block menu labels and selected item slots are now newest-submitted-row-wins, so leaving the tool and reopening it cannot let stale same-block rows overwrite fresh submitted selections.
- `2026.07.21.003-reinvent-doppler-stale-menu-guard` prevents stale one-week legacy Global rows from overriding split Global block display for Re:Invent/Blueshift. Split cafes should recall Monday/Tuesday, Wednesday/Thursday, and Friday from `globalBlocks`, not from `rotation.menu`. This release also ignores blank legacy Global blocks as authoritative evidence so Doppler submitted selections cannot be relabeled back to a stale Cypress block.
- `2026.07.21.001-reinvent-block-menu-authority` makes saved split-global `Global Block` rows the authority for the displayed menu name during recall. Child `Global Selection` rows still restore the selected items, but they cannot relabel a block to an inherited/stale `menuConcept`. This protects Re:Invent cases where a chef selected Cypress but the display showed a different AMZ menu.
- `2026.07.18.010-menu-item-dedupe` dedupes chef-facing Neighborhood Rotation item pickers before rendering options. Webtrition may still contain repeated raw rows for the same item/MRN with different portion or pricing contexts; selectors should show one polished option, not every raw context row.
- `2026.07.18.009-station-locked-card-border` puts no-Global locked cafes into the same bordered summary tile style by showing `Stations` / `Selections locked` instead of loose text, while still avoiding fake AMZ labels.
- `2026.07.18.008-rotation-card-summary-border` makes single-menu Global leadership cards and submitted recaps use the same bordered concept tile treatment as Re:Invent/Doppler split-week and promo cards. One-menu weeks should display `Monday - Friday` above the menu name in both light and dark mode.
- `2026.07.17.002-promo-resubmit-state-integrity` makes promo override recalls authoritative for display and selected-food-cost math. Full-week promo takeovers now render a `Promotion Override` row with saved promo entree/side/extension items and suppress stale normal Global rows from prior submissions, so old menu choices and old food-cost percentages do not bleed into the locked card or submitted recap. `Edit and resubmit` state now resets when district/cafe/week changes and after a confirmed resubmit, preventing one cafe's edit mode from carrying into another cafe.
- `2026.07.17.001-promo-override-global-card-integrity` removes fake Global/AMZ labels from no-Global cafe recaps/cards/exports, currently Atlas and Commissary, while still showing locked state, updated time, and station progress. Promotion override is now treated as a week-only takeover with Monday-Friday coverage, optional promo entree/side/extension memory slots, and submission logic that does not require normal Global rows when a promo covers the full week.
- `2026.07.15.005-nitro-canonical-menu-integrity` enforces Nitro's weekly Global Menu as the canonical menu for both protein blocks. If persisted child blocks disagree with the weekly menu, recall relabels the blocks to the weekly menu and retains only selected items that actually belong to that menu. Canonical blocks are also written on resubmit. The exact live failure shape, Anisa weekly parent with Ciudad child blocks, has regression coverage.
- `2026.07.15.004-rotation-submitted-family-integrity` protects submitted recalls from mixed-status Supabase families. When a Submitted parent has confirmed Submitted child rows, older Draft children in that family are excluded from reconstruction. If a legacy Submitted family has no Submitted children, its Draft children remain readable as a compatibility fallback. This specifically covers the live Nitro October pattern where Anisa header/current rows coexisted with stale Ciudad child selections.
- `2026.07.15.003-rotation-source-integrity` stopped Neighborhood Rotations from merging stale Smartsheet child rows into current Supabase submissions. Supabase records are authoritative whenever available and Smartsheet is used only as fallback. Submission readiness now derives from `CAFE_STATION_CONFIG`, so cafes without Global stations, currently Atlas and Commissary, are not blocked by impossible Global Menu requirements. Browser regressions cover Nitro Anisa recall against stale Ciudad mirror rows and both no-Global cafes.
- `2026.07.14.004-rotation-full-week-cards` fixed locked leadership cards so Re:Invent uses the computed calendar block layout for the selected week, including Monday carryover/recovery blocks, and renders saved block data in calendar order instead of insertion order. Doppler cards now show Monday + Tuesday carryover plus Wednesday-Friday current menu so the leadership view reads as a full week.
- `2026.07.14.003-rotation-recall-integrity` fixed Re:Invent/Doppler recall corruption where stale/default Global Block rows could display Cypress or the wrong menu even though submitted selection rows carried the chef's actual choices. This was superseded by `2026.07.21.001-reinvent-block-menu-authority`: saved `Global Block` menu names are now the authority for split-global display, while child rows restore selected items only.
- `2026.07.12.002-selector-library-scope` restored Doppler/Zane's Salad selectors to the full Menu Library salad pool (37 scoped Cafe Express Curated Salad rows) instead of the tiny `saladFreshFive` override. Release guards now fail if that stale override returns.
- `2026.07.12.001-desktop-density` reduced the desktop-only density of the page and widened the rotations workspace so large monitors feel closer to the user's preferred 75% browser zoom without forcing actual browser zoom. Mobile/tablet sizing is intentionally preserved.
- `2026.07.11.001-rotation-storage-quota-guard` added `src/shared/safeStorage.js` and changed Neighborhood Rotations to treat `culinaryToolsSmartsheetReadyRecords_v1` as optional browser cache. Oversized localStorage writes must not crash the tool.

Important tests:

- `tests/browser/neighborhood-rotations.spec.js`
- `tests/browser/reinvent-submit-recall.spec.js`
- `scripts/verify-submission-health.mjs`
- `scripts/verify-rotation-record-audit.mjs`

Do not remove the Re:Invent/Doppler stale-block or Nitro canonical-menu regression cases in `tests/browser/reinvent-submit-recall.spec.js`. They protect the rules that saved split-global block headers control displayed menu names, stale same-block rows cannot overwrite newer submitted item slots, child rows restore selected items, and Nitro child blocks cannot contradict the saved weekly menu.

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
- `2026.07.18.010-menu-item-dedupe` dedupes visible Menu Library rows with `dedupeRecipeLibraryRows()`. Do not remove raw Webtrition duplicates from the source dataset simply to fix card polish; collapse them at display/export/selector boundaries unless an explicit source-of-truth cleanup is intended.
- `2026.07.18.001-menu-library-all-menus-export` added a `Download All Menus CSV` button beside the selected-menu CSV export. It calls `ensureFullRecipeRows()` on demand and exports menu, recipe name, MRN, category, description, calories, sell price, and true cost across the full library.
- `2026.07.12.003-master-menus-sync` rebuilt `src/data/menuItems.json` from `Master Menus 7-12-26.csv`: 1,550 Master rows, 53 menus, 100 new/rekeyed rows, and 57 stale generated rows removed compared with the previous app dataset.
- The current raw source archive is `public/data/master-menus-raw-2026-07-12.json`. Older raw MenuWorks archives were removed from the deployable app.
- Recipe Library Supabase backfill now upserts the current Master rows and marks visible Supabase recipe rows absent from the Master as `visible_in_library: false`; do not reintroduce append-only backfill behavior.
- Item cards show Webtrition weight in oz when available from MenuWorks/Supabase for audit visibility.
- `2026.07.18.004-menu-library-mrn-webtrition-link` shows exact MRNs on Menu Library front cards and adds drawer actions to open Webtrition by MRN search or copy the MRN for manual Webtrition search.
- `2026.07.18.005-webtrition-search-only` removes forced Webtrition `preview=sidePanel`, `productType`, and recipe-view parameters. The drawer action is now `Search Webtrition` and should keep users in the accessible search/result flow.
- `2026.07.18.006-menuworks-import-pipeline` turns MenuWorks Truth Upload into a reviewed weekly import pipeline: schema preflight, exact MRN precision signals, protected curated descriptions, hidden-after-accept counts, and import batch tracking. Accept writes through the Recipe Library Supabase API first, hides stale rows only inside uploaded menus, then keeps a local fallback if the server write fails.
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
- The bundled Codex runtime Git may be missing `git-remote-https.exe`, and Windows Schannel can raise `SEC_E_NO_CREDENTIALS`. Use `pnpm run repair:git` or `scripts\repair-git-https.ps1` before trusting GitHub sync status; it uses the portable Git/OpenSSL path and refreshes `origin/main`.
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

GitHub HTTPS repair path:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/repair-git-https.ps1
```

Or:

```powershell
pnpm run repair:git
```

Run this if local `origin/main` looks stale, normal Git reports `SEC_E_NO_CREDENTIALS`, or the shell says `git: 'remote-https' is not a git command`.

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
