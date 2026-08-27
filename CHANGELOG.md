# Changelog

## 2026-08-26

- [Aug 26, 8:51 AM] Prepared the new `SSMT` tool and Menu Audit source-model reset approved by Tyler. Platform Home now includes a passcode-gated `SSMT` tool (`0411`) that loads the current workbook-derived seed data as a static JSON payload, shows the required area order `AUS, BNA, BOS, BWI, DEN, IAD, JFK, LAX, SAN, SNA, SEA, SJC, WAS, YVR, YYZ, MCO`, lets users assign item prices through pricing-structure SEA price + category selectors, keeps unmatched workbook item prices as review context instead of assigned prices, keeps active start/end dates editable on the menu record for calendar/status tracking, normalizes item labels to ALL CAPS, normalizes descriptions to lower case, keeps calories promotional-only, opens modifier detail in a modal, records copied modifiers as independent-group behavior, and creates saved flag/report email drafts to `alexander.neuse@compass-usa.com` and `tyler.leiss@compass-usa.com`. Added `scripts/build-ssmt-seed-data.mjs` to parse `docs/ssmt/SEA Standard Menu Template (1).xlsx` into `public/data/ssmtSeedData.json` and guard freshness in `pnpm run verify`; the parser reads Navigation UI drawing hyperlink targets plus approved visible recent/promotion sheets, and the parsed seed currently contains 56 menu sheets, 592 modifier groups, 62 pricing rows, and 61 Navigation UI button targets. Menu Audit now presents the future operating source model as SSMT app records + Webtrition Report Menu Index + Shopping Lists, calls out recipes as the remaining missing data layer, and keeps SSMT workbook-only differences as review flags rather than deletion authority. Added browser coverage in `tests/browser/ssmt-tool.spec.js`; focused proof passed 2/2. Set visible version `2026.08.26.001-ssmt-tool-menu-audit-source`. This candidate is implemented locally; it is not yet reviewed, merged, deployed, production verified, or live.

## 2026-08-23

- [Aug 23, 12:37 PM] Published Cricket's expanded Deli station to GitHub `main` at application commit `745bd2e10ae28e5be570d35427b6a50688242e15`. Vercel deployment `CRoWGbCH3EsubSB6xE2Vkgpb4Hc8` completed successfully, and the public bundle at `https://project-d8v25.vercel.app` contains version `2026.08.23.008-cricket-deli-capacity`. `pnpm run verify` passed, and both mandatory browser suites passed 47/47 locally and 47/47 in production, proving six accessible Cricket Deli slots, exact `AMZ: Cafe Express Curated Sandwiches` isolation with no write-ins, three-distinct completion with repeats counted once, sparse slots 1/2/6 save/recall, and unchanged Moby four-slot/one-selection behavior. No schema, storage-authority, production-data, cost, Results, recap, or export change. Release state: LIVE.

- [Aug 23, 12:25 PM] Prepared Cricket's expanded Deli station. North/Cricket now shows six individually labeled Deli LTO sandwich slots in every selectable week and requires three distinct selections before the station is complete and the weekly rotation can submit; repeated sandwiches count once and slots 4-6 remain optional. Options come only from the exact existing `AMZ: Cafe Express Curated Sandwiches` MenuWorks pool; Cricket exposes neither fuzzy fallback rows nor write-ins, and no new menu import or source-authority change is required. Expanded the shared Deli recall capacity so sparse later positions, including slot 6, preserve their original slot numbers. Added Cricket-specific panel/submission guidance, an integrity guard, and direct browser coverage for six accessible selectors, the distinctness threshold, exact source-pool isolation, sparse slots 1/2/6, reload recall, and unchanged four-slot/one-selection Moby Deli behavior. Other cafés retain their existing Deli capacity, source behavior, and one-selection requirement. `pnpm run verify` passed and both mandatory local browser suites passed 47/47. Set visible version `2026.08.23.008-cricket-deli-capacity`. No schema, Supabase/Smartsheet contract, production-data, cost, Results, recap, or export change. Publication and production verification are pending.

- [Aug 23, 12:22 PM] Menu Cross Utilization: made the Pair Detail panel give long Shared Ingredients lists a taller scroll area and moved the blue Ordering / reuse opportunity note to the bottom of the detail panel. Set visible version `2026.08.23.007-menu-cross-pair-detail-scroll`.

- [Aug 23, 12:06 PM] Menu Cross Utilization: added pillar % to cards/table, grouped and color-coded the matrix by pillar, added non-clickable `100%` self-match cells, and widened the grid. Set visible version `2026.08.23.006-menu-cross-pillar-grouped-matrix`.

- [Aug 23, 12:09 PM] Published the North-only duplicate Global-menu policy to GitHub `main` at application commit `a5f9ce77135c4844d54da51446feca39424aa4d2`. Vercel deployment `3a4a9CYaT9JyHwMMKq5cuThvDHZL` completed successfully, and the public bundle at `https://project-d8v25.vercel.app` contains version `2026.08.23.005-north-duplicate-menu-policy`. `pnpm run verify` passed, and both mandatory browser suites passed 46/46 locally and 46/46 in production, proving North cafés may match Global menus without duplicate blockers while East non-Balti and same-café split-block protections remain active. No schema, storage, source-authority, production-data, Results, recap, cost, or export change. Release state: LIVE.

- [Aug 23, 12:00 PM] Prepared a North-only duplicate Global-menu policy. North café rows are now excluded from both cross-café duplicate counts and candidate submission blockers, allowing multiple North cafés to use the same Global Menu in the same week without warnings. South's controlled-café rule and Re:Invent exception, East's `AMZ: Balti` exception and non-Balti enforcement, and split-block uniqueness inside an individual café are unchanged. Added an integrity guard and direct browser regression proving Nessie can match a submitted Dawson menu without a duplicate blocker while unrelated required-station blockers remain active; the existing East non-Balti blocking regression remains. Updated the Neighborhood Rotations handoff and set visible version `2026.08.23.005-north-duplicate-menu-policy`. `pnpm run verify` passed, and both mandatory local browser suites passed 46/46. No schema, storage, source-authority, production-data, Results, recap, cost, or export change. Publication and production verification are pending.

- [Aug 23, 11:50 AM] Published the planner-wide optional soup schedule to GitHub `main` at application commit `adc1c3515db8e1c5e5b90fad4c9a59fbaddaf9f4`. Vercel deployment `EDMxq37AVGC3P4qmyDxEcKhPiRMX` completed successfully, and the public bundle at `https://project-d8v25.vercel.app` contains version `2026.08.23.004-weekly-soup-planner`. `pnpm run verify` passed, and both mandatory browser suites passed 45/45 locally and 45/45 in production, covering all-café and future-week availability, ten weekday slots, fixed 12 oz and 16 oz economics, exact `AMZ: Cafe Express Soup` isolation, missing-cost handling, sparse slot-10 save/recall, legacy-source cleanup, optional submission/progress, accessibility labels, and existing recall regressions. No Supabase or Smartsheet schema migration was required. Release state: LIVE.

- [Aug 23, 11:18 AM] Prepared a planner-wide optional soup schedule for every café and selectable week. Added ten deterministic slots grouped as two soups per weekday, isolated every option to exact `AMZ: Cafe Express Soup` source rows, disabled write-ins, and excluded Soup from submission requirements and required-station progress. Selected soups show source-derived 12 oz true cost against fixed $5.00 retail and proportionally scaled 16 oz true cost against fixed $6.10 retail, including food-cost percentages and existing MenuWorks descriptions/calories/diet/allergen information; missing source cost stays unavailable/blank. Soup rows save and recall through the existing flexible station-selection contract with exact source menu/station/MRN/portion and original weekday slot number, including sparse slot 10, so no Supabase or Smartsheet schema migration is needed. Legacy non-Cafe-Express soup rows are hidden, excluded from costing, and omitted on replacement save. Added weekday-specific accessible names, integrity guards, and direct browser coverage for all-café availability, five two-slot day groups, exact-menu isolation/legacy cleanup, both portion calculations, blank missing-cost persistence, sparse save/recall, and optional submission/progress. `pnpm run verify` and both mandatory local browser suites passed 45/45. Set visible version `2026.08.23.004-weekly-soup-planner`. Publication and production verification are pending.

- [Aug 23, 10:15 AM] Made the home Changelog card compact: short summaries, capped lines, and a bounded panel so entries stay inside the box. Set visible version `2026.08.23.003-landing-changelog-compact`.

- [Aug 23, 9:59 AM] Refined the `Menu Cross Utilization Tool` matrix display per Tyler's follow-up: added a matrix-view `Pillar cross-utilization %` summary, changed the pairwise matrix heatmap from teal/blue to red, enlarged matrix cells to 38px, and printed the overlap percent inside each square. The score formula, shopping-list source data, `Chickle` no-data behavior, no-prep/no-recipe/no-labor/no-cost/no-savings/no-waste guardrails, Supabase/schema/production-data state, home tile, and mobile bottom nav are unchanged. Added direct browser assertions for the pillar percentage summary, red cell coloring, larger cell dimensions, and visible cell percent labels. Set visible version `2026.08.23.002-menu-cross-utilization-matrix-display`.

- [Aug 23, 9:42 AM] Published the `Menu Cross Utilization Tool` to GitHub `main` at application commit `aa16347f74dbf3b898e24672f8fb7468b12d9f62` after Tyler explicitly authorized Chief emergency release execution because the normal Reviewer, Verifier, fallback reviewer, and Release agents did not respond in-thread. PR #5 is closed/merged, the public production bundle contains version `2026.08.23.001-menu-cross-utilization-tool`, and production Playwright coverage for `tests/browser/menu-cross-utilization.spec.js` passed 3/3 against `https://project-d8v25.vercel.app`, covering tool open, pillar view, full menu list including `Chickle` no-data handling, matrix rendering, `Chickle` exclusion, pair-detail field order, and tablet/mobile viewports. The known `corepack pnpm run verify` blocker remains the pre-existing stale `scripts/build-food-cost-plate-reference.mjs --check` gate reproduced on the PR base; all Menu Cross Utilization checks passed. Release state: LIVE.

- [Aug 23, 9:12 AM] Prepared the `Menu Cross Utilization Tool`, an 8th Platform Home tile, per Tyler's menu-planning request and the approved Architect design (thread rooted at event `40a0250551978a1a19ad9314b29a971fe7e0feabe3028225cf339cb399836577`). `scripts/build-menu-cross-utilization-data.mjs` parses the 55 checked-in `docs/menu-cross-utilization/shopping-lists/*.pdf` MenuWorks Shopping List Reports for `Amazon Region (FBE000)`, Aug 3, 2026, Lunch with `pdfjs-dist` positioned-text extraction (category headers and wrapped-description continuation lines reconstructed by font suffix and column x-position, not naive `pdftotext -layout`), and writes the committed, `--check`-verifiable `src/data/menuCrossUtilization.json`. Match key is the MIT code when present, else a documented normalized-description fallback. Low-signal pantry items (water, salt, generic granulated sugar, generic black pepper, broad cooking oils, cooking spray) are excluded from the primary score per the workbook's own methodology sheet; sesame oil, brown sugar, specialty spices, and cuisine vinegars remain eligible. The sole score is plain Jaccard overlap on match-key sets (shared/union) — no prepared-component weighting and no prep/recipe/labor/cost/savings/waste claims in the UI. `Chickle` (0 extracted rows, confirmed by both its own PDF and the workbook's Source Audit sheet) stays visible in the menu list with an explicit "no ingredient data" state and is excluded from the pairwise matrix grid. The tool has a Pillar Strategy + full menu list screen (pillars pulled as static reference data from the workbook, this tool's own computed avg intra-pillar overlap shown per pillar) and a 54x54 hover/click Pairwise Matrix whose pair-detail panel orders % overlap, both menus' eligible-SKU counts, shared ingredients, and a purchasing/ordering-reuse note. Added `node scripts/verify-menu-cross-utilization.mjs` (sample-checks generated eligible-SKU and shared-SKU counts for Andes/Anisa/Ciudad/Carvery against the workbook within a documented ±3 tolerance — the workbook is a validation reference, not primary truth) and `tests/browser/menu-cross-utilization.spec.js`, both wired into the `verify` chain/`run-playwright.mjs`. Added `pdfjs-dist` as a devDependency for this build-time parser only, with Tyler's explicit in-thread approval. Existing 7 tools, their layout, the 5-item mobile bottom nav, and Supabase-primary/localStorage-never-source-of-truth are unchanged. Set visible version `2026.08.23.001-menu-cross-utilization-tool`. This candidate is implemented but not yet reviewed, verified, published, or live.

## 2026-08-16

- [Aug 16, 9:55 AM] Published the reference plate-component corrections to GitHub `main` at application commit `65ea8568b9e67ebce73e10f2e717e2e6f1ee774c`. Vercel production deployment `5933244767` completed successfully at `https://project-d8v25-j129kyyzo-tylerl-s-projects.vercel.app`; the public bundle contains version `2026.08.16.002-reference-plate-component-corrections`. Both required production browser suites passed 43/43 against `https://project-d8v25.vercel.app`, proving Re:Invent Fish Market's automatic two-side+sauce endpoints and Core Grill's four deduped named side outcomes, Nitro Teriyaki and mixed-station Blueshift Anisa Sub Recipe completion, normalized Sub Recipe save/recall, inferred-component non-persistence, promotion/extension boundaries, and clean page/runtime collectors. Release state: LIVE.
- [Aug 16, 9:44 AM] Prepared the reference plate-component corrections reported by Alex. Normalized the Markdown authority and generated 1,566-row application reference from `Plate Add` to the planner's canonical `Sub Recipe` term, with a generator guard against the legacy label. House of Teriyaki and Anisa now satisfy composed-component requirements from visible Sub Recipe selections; Anisa accepts its combined Lebanese/Persian sides and Sub Recipes without crossing menu boundaries. Re:Invent Fish Market LTO automatically prices every two-distinct-side + sauce combination and shows named low/high endpoints without adding or persisting operator fields. Core Grill automatically shows four named plate outcomes per sandwich using the two cheapest and two most expensive unique Grill Core sides, deduping Garden Salad and persisting no inferred side rows. Added direct browser coverage for all four reported surfaces and set version `2026.08.16.002-reference-plate-component-corrections`. Promotions, extensions, completion, persistence, Results, recaps, summaries, exports, schemas, and Supabase/Smartsheet authority are unchanged. This release is implemented but not yet published or live.
- [Aug 16, 9:02 AM] Published the reference plate-cost rollout to GitHub `main` at application commit `2fa7c18804bf6347d32f3cf119ef63335a19cea9`. Vercel production deployment `5932762278` completed successfully and the live bundle contains version `2026.08.16.001-reference-plate-cost-rollout`. Both required production browser suites passed 41/41 against `https://project-d8v25.vercel.app`, covering exact reference math, separate extension economics, mixed and resolved-non-calculable unavailable-data suppression, current/future standard/split/Nitro/secondary Global, Wok, Carvery, Moby Pop-Up, LTO, Lotus, Commissary and LAX paths, promotion suppression, historical and non-reference legacy behavior, planner-only persistence/Results isolation, and clean page/runtime error collectors. Documentation closeout commit `d9c882a973b1d0fe53a6a7803d0a6f9a2269408e` was published successfully. Release state: LIVE.
- [Aug 16, 8:34 AM] Prepared a planner-only rollout of the Markdown-backed plate-cost interface across every current and future Neighborhood Rotations week when the selected or fixed station menu exists in the food-cost reference. Added menu/MRN/portion-safe resolution for regular, Nitro, split and secondary Global planners plus Wok, Carvery, Moby Pop-Up, menu-backed LTOs, Lotus W&P, and explicitly named reference Commissary menus. Incomplete reference identity, cost, primary sell price, or usable individual Plate Build now shows `Reference data unavailable` and suppresses all summary and per-primary ranges, including mixed complete/incomplete selections and resolved non-calculable primaries; non-reference menus keep legacy analytics; Global, Carvery, Moby, and Grill promotions suppress the interface; extensions remain separate individual economics. Results, recaps, summaries, exports, non-pilot persisted economics, schemas, and Supabase/Smartsheet authority are unchanged. Added direct browser coverage for exact plate math, separate extension economics, mixed-selection range suppression, resolved-but-non-calculable Breakfast handling, unavailable data, current/future and historical boundaries, standard/split/Nitro/Moby/LAX paths, station families, promotion suppression, and planner-only storage/Results isolation. `pnpm run verify` passed and both required local browser suites passed 41/41. Set visible version `2026.08.16.001-reference-plate-cost-rollout`. Alex has explicitly approved publication; the candidate is awaiting independent release clearance and is not yet committed or deployed.

## 2026-08-15

- [Aug 15, 9:39 AM] Published the requested revert of the compact Nessie Global Aug 17 food-cost cards to GitHub `main` at application commit `04b6c1e085e11a9f000173d66f702363b453afb3`. Vercel production deployment `5922453651` completed successfully and the live bundle contains version `2026.08.15.004-nessie-plate-cost-card-revert`. Both required production browser suites passed 39/39 against `https://project-d8v25.vercel.app`, including the restored pre-compact panel/summary/plate/extension spacing and radius, horizontal containment, unchanged reference calculations, exact save/recall, extension separation, and adjacent-week isolation. Release state: LIVE.
- [Aug 15, 9:33 AM] Prepared a full presentation revert of the North/Nessie Global Aug 17 food-cost cards after Alex rejected the `.003` compact treatment. Restored the exact pre-compact `.002` panel/card spacing, header and badge scale, summary tiles, per-primary typography/radius, gaps, and extension rows; removed the temporary `Mini compact` branch. Added direct browser checks for the restored larger computed insets/radius and content containment, updated the integrity guard, and set visible version `2026.08.15.004-nessie-plate-cost-card-revert`. Plate calculations, reference data, selectors, item isolation, storage, source authority, other cafés, and other weeks are unchanged. This revert is prepared but not yet published.
- [Aug 15, 9:27 AM] Published the compact North/Nessie Global Aug 17 food-cost cards to GitHub `main` at application commit `abedf8d1d2150c5599685b458a410eda18e78cf2`. Vercel production deployment `5922359260` completed successfully and the live bundle contains version `2026.08.15.003-nessie-plate-cost-compact-cards`. Both required production browser suites passed 39/39 against `https://project-d8v25.vercel.app`, including computed compact panel/summary/plate spacing, plate radius, horizontal containment, unchanged reference calculations, exact save/recall, extension separation, and adjacent-week isolation. Release state: LIVE.
- [Aug 15, 9:19 AM] Prepared a cleaner, more compact presentation for the light-blue cards in the exact North/Nessie Global `Aug 17, 2026 - Aug 21, 2026` food-cost pilot. Reduced the panel inset, header/badge size, card padding/radius, typography scale, inter-card gaps, and extension-row height while preserving the current sky color scheme and every calculation label/value. The shared `Mini` tile uses an opt-in compact mode only for the pilot's two summary cards; other planner analytics remain unchanged. Added browser assertions for compact one-rem panel and three-quarter-rem summary/plate spacing, plate radius, and horizontal containment; extended the integrity guard and set visible version `2026.08.15.003-nessie-plate-cost-compact-cards`. No plate math, reference data, menu isolation, extension treatment, storage, Supabase/Smartsheet authority, other café, station, or week behavior changed. This release is prepared but not yet published.
- [Aug 15, 9:07 AM] Published the reference-driven North/Nessie Global `Aug 17, 2026 - Aug 21, 2026` pilot to GitHub `main` at application commit `d46fe818de042d68b74ea2b2e3f38816ea999e0b`. Vercel production deployment `5922190699` completed successfully at `https://project-d8v25-7okm441ky-tylerl-s-projects.vercel.app`; the public bundle contains version `2026.08.15.002-nessie-reference-plate-builds`, the generated-reference pilot, and menu-specific plate analytics markers. Both required production browser suites passed 39/39 against `https://project-d8v25.vercel.app`, including selected `Entree`/`Plate` build selectors, Item + Waste Cost combinations, primary Sell Price percentages, separate extensions, RA exclusion, exact menu/station/MRN/portion persistence, shuffled cross-station recall, complete/incomplete saved-header ranges, and adjacent-week legacy isolation. Release state: LIVE.
- [Aug 15, 8:28 AM] Prepared the North/Nessie Global `Aug 17, 2026 - Aug 21, 2026` food-cost pilot to calculate directly from `docs/FOOD_COST_PLATE_COSTING_REFERENCE.md`. The planner now generates menu/station-specific component selectors from each selected priced `Entree`/`Plate` primary's effective build, uses `Item + Waste Cost` instead of MenuWorks true cost, divides by that row's `Sell Price`, and enumerates every valid combination of the selected required components. Row-level `Plate Build` is authoritative; a blank row may use only a simple non-`Unknown`, non-`Varies` Concept Guide build. Multi-station menus expose a Reference Station selector, while missing required components may fall back only within the same menu. Extensions are excluded from every plate and instead show their own individual cost, sell price, and food-cost percentage. Reference choices and saved rows retain menu, station, MRN, and portion identity, including same-menu fallback components from another reference station, so identically named items never cross between concepts. Recall derives the selected primary station from the Global Block/primary rather than backend row order. All `AMZ+RA:` concepts and concepts without a priced primary build are unavailable rather than inferred. Saved header ranges use the same reference math and remain blank unless every selected primary is complete. Added a generated 1,566-row/53-concept application reference with a Markdown-freshness gate and an exact regression covering Smokehouse combinations, exact save/reload identity, shuffled component-first cross-station recall, complete and incomplete header math, separate extension economics, duplicate Jasmine Rice isolation, Wok station choices, Breakfast Plate fallback math, RA exclusion, and adjacent-week legacy behavior. Set visible version `2026.08.15.002-nessie-reference-plate-builds`. This release is prepared but not yet published.
- Published `docs/FOOD_COST_PLATE_COSTING_REFERENCE.md`, the durable agent reference converted from Tyler's reviewed WebT cost workbook. It preserves all 1,566 item-cost rows and 53 menu concepts, retains MRNs as exact text, makes `Item + Waste Cost` the plate-cost input, records the confirmed non-RA plate formats and station-level grouping direction, and keeps every `AMZ+RA:` concept explicitly unclassified. Markdown validation confirmed the 1,566-row / 53-concept source conversion and the production build passed. GitHub `main` commit `5fce98490851338ea51b7152fff39f8dc47439db` reached Vercel production deployment `dpl_6hgjXVt3tVX9Mp5ufXZPasQVvToY` (`READY`); the live bundle contains version `2026.08.15.001-food-cost-plate-reference`. This is documentation-only: no application logic, Supabase data, Smartsheet data, or menu source records changed.
- Set visible app version to `2026.08.15.001-food-cost-plate-reference`.

## 2026-08-14

- [Aug 14, 7:21 PM] Published the Smokehouse starch/grain base correction to GitHub `main` at application commit `5f22b9811b2b4fa13da44abcd58a2ad3c389ded3`. Vercel reported production deployment success, the live bundle contains version `2026.08.14.002-smokehouse-starch-base-fix`, and both required browser suites passed 39/39 against `https://project-d8v25.vercel.app`. The deployed regression proves `Mac & Cheese` completes Smokehouse plates for both Bbq Chicken Thighs and Braised Shredded Pork, all selected sub recipes remain included, and extensions remain excluded. Release state: LIVE.

- [Aug 14, 7:08 PM] Corrected the North/Nessie Global Aug 17 plate-cost pilot for `AMZ: Smokehouse BBQ`. The menu's `Mac & Cheese` base is categorized as `Starch/Grain > Pasta`, but the initial automatic base rule recognized only rice/noodle names and incorrectly left both Smokehouse entree cards incomplete. Explicit `Starch/Grain` source categories now qualify as bases while the rice/noodle name fallback and salad veto remain intact. Updated the visible guidance and added an exact browser regression proving Bbq Chicken Thighs and Braised Shredded Pork calculate their plate true-cost and entree-retail food-cost ranges with Mac & Cheese, multiple sides, all selected sub recipes, and extensions excluded. Set visible version `2026.08.14.002-smokehouse-starch-base-fix`. The correction remains confined to North/Nessie/Global/Aug 17 and is prepared for publication.

- [Aug 14, 6:57 PM] Published the North/Nessie Global per-plate food-cost pilot to GitHub `main` at application commit `0fa3c374cdb5b0629f2ddde456222576ed4788cc`. Vercel reported production deployment success, the live bundle contains version `2026.08.14.001-nessie-global-plate-cost-pilot`, and both required browser suites passed 39/39 against `https://project-d8v25.vercel.app`, including the exact Aug 17 pilot calculation and adjacent-week isolation. No schema, persistence, Supabase/Smartsheet authority, recap, Results, summary, export, other-cafe, or other-week behavior changed. Release state: LIVE.

- [Aug 14, 6:41 PM] Prepared a North/Nessie Global planner pilot for `Aug 17, 2026 - Aug 21, 2026` that replaces the station's `Selected Mix Food Cost %` with one live per-entree plate-cost card per selected entree. Standard menus calculate every valid entree + one selected rice/noodle base + two distinct non-base sides combination; `AMZ: Piccola Italia`, `AMZ: Lemongrass + Lime`, and `AMZ: Chiang Mai` calculate entree + one selected side. Every selected sub recipe is included, extensions are excluded, and percentages divide by entree retail only. The pilot explains that rice/noodle choices are automatically recognized as bases while salads remain sides, and labels each result as `Plate true cost` and `Food cost % (entrée retail)`. Missing composition, component cost, entree cost, or retail now produces an explicit issue instead of a misleading partial percentage. Added direct standard/exception/adjacent-week browser coverage and set visible version `2026.08.14.001-nessie-global-plate-cost-pilot`. Recaps, Results, summaries, exports, storage records, Supabase/Smartsheet authority, other cafes, and other weeks are unchanged.

## 2026-08-13

- [Aug 13, 6:04 AM] Published the corrected North `Commissary` containment and Moby open-draft projection fix to GitHub `main` at commit `76fff0a88816dd091dbdfc25d3efdd727993278d`; Vercel reported production deployment success, and both required browser suites passed 38/38 against `https://project-d8v25.vercel.app`. The live regression verifies the full `Commissary` label stays inside its button at both 240px and 1024px with no horizontal label overflow. Release state: LIVE.
- [Aug 13, 5:36 AM] Corrected the remaining North `Commissary` selector overflow shown at the actual narrow card width. The prior desktop-oriented test did not reproduce the roughly 240px viewport in the screenshot, and the inner flex label still retained its intrinsic word width. The label is now explicitly a shrinkable `flex-1 min-w-0` item with normal safe wrapping. The regression now runs at both 240px and 1024px and verifies button-edge geometry, zero horizontal label overflow, and computed `overflow-wrap: anywhere`. Set visible version `2026.08.13.002-commissary-narrow-selector-fix`.
- [Aug 13, 5:25 AM] Fixed the North `Commissary` café selector label so it remains inside the button at constrained desktop widths. The shared choice buttons now use responsive horizontal padding and type sizing, preserve the status dot without shrinking, hide external overflow, and safely wrap unusually long labels only when needed. Added a 1024px browser geometry regression that verifies all four `Commissary` label edges remain within its button, protected the containment classes with the rotation integrity guard, and set visible version `2026.08.13.001-commissary-selector-containment`. This is presentation-only; café identity, selection behavior, rotation data, Supabase authority, and Smartsheet fallback are unchanged.

## 2026-08-05

- [Aug 5, 5:23 PM] Added an East District exception so more than one East cafe can select the Global Menu `AMZ: Balti` in the same week without Neighborhood Rotations treating it as a duplicate: a new `DUPLICATE_MENU_EXCEPTIONS` config plus `isDuplicateMenuExempt()` helper exempt East `AMZ: Balti` from `menuConflictCounts()` (leadership duplicate badges/counts) and `menuConflictCountForCandidate()` (submit blocker), so Bingo and other East cafes can submit `AMZ: Balti` even when another East cafe already has it that week.
- [Aug 5, 5:23 PM] Every other duplicate-menu rule is unchanged: non-Balti East duplicates and all South `MENU_CONFLICT_GROUPS` behavior (Nitro/Day 1/Doppler, Re:Invent exception) still block/flag exactly as before.
- [Aug 5, 5:23 PM] Added direct browser coverage proving an East cafe (Astra) can submit `AMZ: Balti` alongside an already-submitted Bingo `AMZ: Balti` rotation with no blocker text and no duplicate badge, and a regression test proving a non-Balti East duplicate (`AMZ: Ohana`) still blocks submission with the unchanged blocker wording.
- [Aug 5, 5:23 PM] Set visible app version to `2026.08.05.001-east-balti-duplicate-exception`.

## 2026-08-04

- [Aug 4, 4:34 PM] Switched Grace Cafe's East District Neighborhood Rotations Global cadence to the same single Wednesday-Tuesday cycle used by Doppler and Bingo, including Monday-Tuesday carryover messaging and the same submitted-recap / leadership-card week structure, while keeping Grace out of split-global behavior.
- [Aug 4, 4:34 PM] Generalized the shared `globalCycleConfig()` and `rotationSummaryBlockLabels()` routing into one `isWedTuesGlobalCafe()` check covering Doppler, Bingo, and Grace instead of two separate cafe-literal checks; Doppler and Bingo's rendered text and save/recall behavior are unchanged.
- [Aug 4, 4:34 PM] Added direct browser coverage proving Grace shows the Wednesday cadence text and Monday + Tuesday carryover panel, and that a saved Grace Global menu/entree selection recalls correctly after reload.
- [Aug 4, 4:34 PM] Set visible app version to `2026.08.04.001-grace-wed-tues-global`.

## 2026-08-01

- [Aug 1, 7:55 AM] Fixed the live October 5 Dawson-to-Moby projection gap. Production Supabase inspection confirmed Dawson's `Oct 5, 2026 - Oct 9, 2026` submission was correctly stored as `Submitted` with `AMZ: House of Teriyaki` and all Moby Pop-Up selection rows; the defect was that Moby's open planner still rendered its native draft Global editor even though cards, Results, recaps, costs, and exports used the projection. An active submitted Dawson override now replaces the Moby draft's Global section with a read-only, automatically synced Dawson presentation containing the projected menu, schedule, selections, item metadata, calories, retail/cost analytics, and clear source labeling. Moby remains Draft/open, its non-Global stations remain editable, its original Global selection remains stored as fallback, no Dawson rows are copied into Moby, and duplicate-menu reporting remains isolated from the projection. Added a production-shaped October 5 browser regression and set visible version `2026.08.01.003-moby-draft-global-projection-fix`.
- [Aug 1, 7:37 PM] Tightened the release process so deploy-intended work ends with one Release final admin-facing result instead of duplicate closeout chatter, added a pre-release `AI_HANDOFF.md` reconciliation step so stale current-state docs cannot first surface after production verification, required direct automated acceptance tests in the first implementation commit for visible behavior changes, documented the prepared-worktree / warm-Playwright expectation for active release candidates, and required a timing/avoidable-delays block in every Release final report. This is a governance/process-only documentation update with no application code or visible app version change.
- [Aug 1, 6:35 PM] Moved the East district `Everest Commissary` station from Bingo to Blueshift per Tyler's deploy-speed-test authorization: `Bingo` no longer lists `commissaryEverest` in its station config and `Blueshift` now does, the station's `CommissaryEverestSection` eyebrow now reads `Blueshift Commissary Station`, and the matching `verify-rotation-integrity.mjs` East station markers were updated to match. Set visible app version to `2026.08.01.003-bingo-blueshift-everest-commissary`. No schema, production data, or source-authority change; other East cafes and stations are unaffected.
- [Aug 1, 7:38 AM] Updated governance docs so ordinary app changes requested by a Release-Authorized Admin are deploy-intended by default, added a streamlined micro-fix lane for tiny known presentation/test/docs fixes, and preserved hard stops for failed review/verification, widened scope, tooling blockers, data/schema/destructive production risk, source-authority changes, or explicit no-deploy/local/investigation-only scope. This is a governance/process-only change with no visible app version change.
- [Aug 1, 7:31 AM] Published the Dawson-to-Moby Global projection to GitHub `main` at commit `16683504501f584d1a565c915b35cbcf904ccb46` and Vercel production deployment `dpl_CE363147117z2vqmdNmYrRnKGtrR` (`READY`); confirmed the public assets contain version `2026.08.01.002-moby-dawson-global-projection`, the timestamped platform changelog entry, and projection/recap markers, then passed both required production browser suites 32/32. Targeted coverage proves normal and one-day promo projection across Moby's tile, locked recap, Results/details/costs, and print export while preserving Moby's native status/progress/Pizza data and excluding the projection from duplicate reporting. Runtime scan found no application error cluster, only the pre-existing Node `url.parse()` deprecation warning. Release state: LIVE; independent Scribe LIVE sign-off passed.
- [Aug 1, 7:17 AM] Prepared a same-week Dawson-to-Moby Global projection: when Dawson has submitted valid Moby Pop-Up data, Moby's cafe tile, Results analytics/details, summaries/recaps, and print exports now show the submitted Dawson Moby menu and selections in place of Moby's Global content.
- [Aug 1, 7:17 AM] Kept Moby's own Global selector available for planning and preserved Moby's native Draft/Submitted status, station progress, and every non-Global station; Dawson's Moby promotion override likewise replaces only Moby Global for its selected promo days.
- [Aug 1, 7:17 AM] Explicitly isolated duplicate-menu reporting from the projection so conflicts continue to compare Moby's native Global menu, added normal/promo browser coverage across Executive View, Results, other-station preservation, print export, and duplicate isolation, and set visible app version to `2026.08.01.002-moby-dawson-global-projection`.
- [Aug 1, 6:45 AM] Prepared Dawson's new required `Moby Pop-Up` Neighborhood Rotations station for every selectable week beginning Aug 31, 2026, with explicit Tuesday-through-Thursday service messaging, a Global-or-Carvery menu selector, and menu-driven capacity for 2 entrees, 3 sides, 2 sub recipes, and 1 extension.
- [Aug 1, 6:45 AM] Added an isolated Moby Pop-Up promotion override with Tuesday/Wednesday/Thursday day selection (including one-day promos); any enabled override hides and replaces all normal Moby selections for that saved week without affecting Dawson Global, Carvery, or other stations.
- [Aug 1, 6:45 AM] Added dedicated shared-storage save/recall records, required-station submission checks, selected-item cost/calorie/retail metadata, recap/export support, source-integrity guards, and browser coverage for activation gating, menu sources, slot counts, promo replacement, persistence, and clean recall.
- [Aug 1, 6:45 AM] Set visible app version to `2026.08.01.001-dawson-moby-pop-up`; Alex authorized deployment after the implementation, full verification, and independent review gates passed. Production verification is pending.
- [Aug 1, 6:58 AM] Published Dawson Moby Pop-Up to GitHub `main` at commit `0b4ac627eb51bb68f8e92dd0fc4edb5435efef74` and Vercel production deployment `dpl_2CRuWUbLK7AKR9rVNQAhYg54Cwgi`; confirmed the public bundle contains the exact version, Aug 31 activation, Global/Carvery selector, Tuesday-through-Thursday behavior, and platform changelog entry, then passed both required production browser suites 31/31. Release state: production verified.

## 2026-07-30

- [Jul 30, 10:48 PM] Switched Bingo Cafe's Neighborhood Rotations Global cadence to a single Wednesday-Tuesday cycle patterned after Doppler, including Monday-Tuesday carryover messaging and the same submitted-recap / leadership-card week structure, while keeping Bingo out of split-global behavior.
- [Jul 30, 10:48 PM] Added a second Bingo `Grill Fresh $5` slot, dynamic slot rendering, source guards, and browser save/reload coverage proving both Grill Fresh $5 selections persist and recall independently without changing other cafes.
- [Jul 30, 10:48 PM] Set visible app version to `2026.07.30.002-bingo-wed-tues-grill-fresh-five`.

- [Jul 30, 3:38 PM] Fixed the mobile and tablet Menu Library item detail drawer so the drawer shell scrolls through the photo/header, Overview/Nutrition/Files tabs, and active tab content instead of clipping the tabs below the phone viewport while only a collapsed inner body could scroll; desktop `lg+` keeps the prior internal-scroll drawer layout.
- [Jul 30, 3:38 PM] Added phone-width Menu Library browser coverage proving all three tabs and bottom content stay reachable, the persistent mobile close button stays hidden until the header close scrolls away, never overlaps the header close button or food photo, and no horizontal overflow is introduced.
- [Jul 30, 3:38 PM] Set visible app version to `2026.07.30.001-menu-library-mobile-drawer-scroll`.

## 2026-07-29

- [Jul 29, 7:00 AM] Removed the redundant word `protein` after gram values on Menu Library cards; `proteinLabel()` now renders grams-only (for example `36g`) everywhere it pairs with a `Protein` label, while the `Protein not loaded` fallback is unchanged.
- [Jul 29, 7:00 AM] Added browser coverage asserting the Menu Library card shows `36g` (not `36g protein`) for a stored `protein_g` value.
- [Jul 29, 7:00 AM] Set visible app version to `2026.07.29.001-menu-library-protein-label-cleanup`.

## 2026-07-27

- [Jul 27, 6:20 PM] Kept every expanded Planner Remote Control label inside its own action button across all districts, cafes, and selectable weeks by removing the fixed label width, allowing safe wrapping, tightening icon/padding spacing, and stacking the small icon above its label on phones without changing the shared black-bar layout or any action behavior.
- [Jul 27, 6:20 PM] Added desktop and phone browser coverage that measures Copy, Load, Upload, Generate Menu, View/Print, Save Draft, and Submit label bounds against their buttons, plus a source guard that prevents clipped expanded labels from returning.
- [Jul 27, 6:20 PM] Set visible app version to `2026.07.27.001-planner-remote-label-containment`.

## 2026-07-26

- [Jul 26, 10:39 AM] PC Buzz Donnie Test
- [Jul 26, 10:02 AM] Buzz mobile chief test 2
- [Jul 26, 10:02 AM] Set visible app version to `2026.07.26.002-buzz-mobile-chief-test-2`.
- [Jul 26, 9:45 AM] Buzz Mobile Chief test
- [Jul 26, 9:45 AM] Set visible app version to `2026.07.26.003-buzz-mobile-chief-test`.
- [Jul 26, 9:36 AM] Reworked the shared Neighborhood Rotations Planner Remote Control into a slim black bar that stays at the top of the rotation and keeps the current full-width footprint across every district, cafe, and selectable week.
- [Jul 26, 9:36 AM] Made the remote icon-only by default while keeping Copy, Load, Upload, Generate Menu, View/Print, Save Draft, and Submit immediately available—even at phone widths; added keyboard-operable buttons, compact tooltips, accessible labels, and a colored Draft/Ready/Blocked/Submitting indicator.
- [Jul 26, 9:36 AM] Added an Expand/Collapse control that reveals the labeled actions, cafe/week context, copy/update state, and full submit guidance; active submissions automatically expand so the live-storage warning remains visible.
- [Jul 26, 9:36 AM] Added browser coverage proving the collapsed default, immediate Save Draft/Submit access, phone-width visibility and keyboard operation for all seven actions, expanded details, and consistent availability across all configured cafes and future weeks.
- [Jul 26, 9:36 AM] Set visible app version to `2026.07.26.001-planner-remote-minimal-bar`.

## 2026-07-25

- [Jul 25, 6:52 PM] Formalized in `RELEASE_RUNBOOK.md` that any report declaring release state `LIVE` requires Scribe's own independent sign-off in the same thread (checked against `CHANGELOG.md`/`AI_HANDOFF.md` and production evidence), separate from Reviewer/Verifier's pre-merge sign-off; this is a governance/process update with no application code or visible app version change.
- [Jul 25, 11:15 AM] Added the browser/OS application icon (favicon, PWA manifest, apple-touch-icon) as the official Culinary Tools Platform icon for browser tabs, pinned tabs, installed PWA, and iOS/Android home-screen shortcuts; this is OS/browser chrome branding only, with zero change to in-app UI, layout, or colors.
- [Jul 25, 11:15 AM] Generated `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180x180, flattened onto the artwork's own opaque black background since iOS renders alpha as black), `android-chrome-192x192.png`, `android-chrome-512x512.png`, and `site.webmanifest` from the supplied master artwork; `theme_color`/`background_color` (`#000000`) were sampled directly from the artwork's dominant background pixel rather than invented, and no maskable icon variant is shipped because the design bleeds past the safe center-crop margin.
- [Jul 25, 11:15 AM] Set visible app version to `2026.07.25.004-app-icon-favicon-manifest`.
- [Jul 25, 7:53 AM] Added a Dawson-only Promotion Override inside Carvery Station for every available week, with individual weekday selection and isolated state that does not affect Dawson's Global or other stations.
- [Jul 25, 7:53 AM] Reused the established promotion persistence pattern with Carvery-specific protein, vegetable, starch, hot-side, and cold-side fields; any enabled Carvery promo hides and replaces the normal Carvery selections for that saved week.
- [Jul 25, 7:53 AM] Added database-record, recap/export, submission-completion, and browser save/reload coverage proving Carvery promo rows recall from shared storage without leaking ordinary Carvery rows.
- [Jul 25, 7:53 AM] Set visible app version to `2026.07.25.003-dawson-carvery-promo-override`.
- [Jul 25, 6:52 AM] test2
- [Jul 25, 6:52 AM] Set visible app version to `2026.07.25.002-test2-changelog-entry`.
- [Jul 25, 6:01 AM] test
- [Jul 25, 6:01 AM] Set visible app version to `2026.07.25.001-test-changelog-entry`.

## 2026-07-24

- [Jul 24, 1:34 PM] Fixed the second Re:Invent global-block merge site (`recordsToRotations`, global-selection-only records with no existing Global Block row) where menu precedence resolved as `authoritativeMenu || preferredMenuFor(...) || block.menu || record.menuConcept`, letting the `preferredMenuFor` weighted-aggregate fallback pick a stale menu (e.g. `AMZ: Roam BBQ`) over the record's own submitted `menuConcept` (e.g. `AMZ: Cypress`) when older duplicate rows outweighed the correct one -- the same stale-precedence bug already fixed at the sibling merge site on line 988.
- [Jul 24, 1:34 PM] Reordered precedence at line 1046 so block menu now resolves as `authoritativeMenu || record.menuConcept || preferredMenuFor(...) || block.menu`.
- [Jul 24, 1:34 PM] Added browser coverage for a global-selection-only record disagreeing with stale weighted-aggregate evidence and reran the full Re:Invent/Doppler/Nitro recall suite with 21/21 passing.
- [Jul 24, 1:34 PM] Set visible app version to `2026.07.24.001-reinvent-selection-menu-precedence`.

## 2026-07-22

- [Jul 22, 10:54 AM] Fixed the root Re:Invent recall bleed where `recordsToRotations` reused `EMPTY_ROTATION.globalBlocks` across rebuilt saved rotations, allowing other Re:Invent weeks to mutate the selected week after a clean Supabase load; each rebuilt rotation now gets isolated Global Block state, added browser coverage that loads a stale Roam BBQ week beside the clean Cypress week, and set visible app version to `2026.07.22.005-reinvent-globalblocks-isolation`.
- [Jul 22, 10:03 AM] Fixed the live Re:Invent recall path where Supabase rows with live column labels like `Menu Item Selection` could leave submitted block evidence incomplete, allowing older Roam BBQ/Lotus/Ohana split blocks to survive after edit-and-resubmit; the loader now accepts the live field aliases, submitted split-global block rows are keyed by exact week/cafe/block evidence, mismatched stale child selections are cleared, and the Re:Invent/Doppler/Nitro recall suite passed locally with 19/19 browser tests; set visible app version to `2026.07.22.004-reinvent-live-column-lock`.
- [Jul 22, 9:09 AM] Rebuilt the Re:Invent split-global recall path around shared database authority so live Supabase rows replace stale browser rotations before the planner renders, Re:Invent always uses stable Monday+Tuesday / Wednesday+Thursday / Friday block IDs, inactive split blocks are removed for the selected week, and future weeks no longer preload old concepts; reran the full Re:Invent/Doppler/Nitro recall suite with 19 passing tests; set visible app version to `2026.07.22.003-reinvent-authoritative-recall`.
- [Jul 22, 8:30 AM] Fixed the Re:Invent recall path where live Supabase rows identified the week by `Week Start Date` / `rotation|2026-07-20|...` while stale browser cache used the visible `Jul 20, 2026 - Jul 24, 2026` week label, allowing Monday+Tuesday Roam BBQ to reappear over submitted Cypress after leaving and reopening the app; rotation records now canonicalize loaded week identity before grouping/cache lookup; added browser coverage for week-start-only Supabase rows over stale display-week cache; reran the full Re:Invent/Doppler/Nitro recall suite with 19 passing tests; set visible app version to `2026.07.22.002-reinvent-week-key-recall`.
- [Jul 22, 7:45 AM] Fixed the Re:Invent stale recall path where synced shared database reads could still leave old browser-cache rotations in place for weeks with no saved rows, causing future weeks to preload old concepts and submitted recaps to appear when they should be blank; Supabase/Smartsheet save cleanup now replaces the full rotation record family by parent ID prefix so stale Roam BBQ children are removed on resubmit; added browser coverage proving blank future weeks stay blank and reran the full Re:Invent/Nitro/Doppler recall suite; set visible app version to `2026.07.22.001-reinvent-shared-cache-fix`.

## 2026-07-21

- [Jul 21, 10:56 PM] Fixed the live Re:Invent recall failure where Supabase rows saved as `Café / Unit` / `Entrée` could be ignored by the app reader, causing submitted Cypress selections to reopen as stale/default Roam BBQ; the rotation reader now accepts live Unicode column labels and falls back to the canonical `rotation|week|district|cafe` record ID when cafe fields are unreadable; added browser coverage for the live Supabase payload shape and set visible app version to `2026.07.21.009-live-column-recall-fix`.
- [Jul 21, 10:16 PM] Fixed the exact Re:Invent edit-and-resubmit recall failure by making canonical submitted Global Block rows outrank stale duplicate rows even when the stale row has a newer sync timestamp; added browser coverage for the full user path: set Monday/Tuesday to Cypress, submit, leave Neighborhood Rotations, return, and verify Cypress remains instead of Roam BBQ; set visible app version to `2026.07.21.008-reinvent-submit-recall-verified`.
- [Jul 21, 9:04 PM] Hardened Re:Invent/Blueshift split-global recall for raw saved block IDs like `monTue`, `wedThu`, and `friCarry`, and matched child rows back to the submitted canonical Global Block before rebuilding recaps/cards; this prevents stale Roam BBQ/Ciudad/Cypress rows from returning after leaving and reopening Neighborhood Rotations; set visible app version to `2026.07.21.007-reinvent-raw-block-recall`.
- [Jul 21, 8:41 PM] Locked Re:Invent/Blueshift split-global resubmits to stable block-slot record IDs and filtered stale child rows that disagree with the submitted Global Block menu, so an older Roam/Ciudad/Cypress child row cannot reappear after leaving and reopening the tool; set visible app version to `2026.07.21.006-reinvent-slot-stale-row-lock`.
- [Jul 21, 7:36 PM] Fixed Re:Invent shared recall after edit-and-resubmit by replacing stale browser rotation cache with shared database records on load and ranking saved Global Block rows by freshness plus canonical block identity; added browser coverage proving stale local Roam BBQ cache is replaced by current Cypress shared storage; set visible app version to `2026.07.21.005-reinvent-shared-recall-authority`.
- [Jul 21, 7:03 PM] Fixed the deeper Re:Invent edit-and-resubmit recall failure where older same-block rows with different IDs could overwrite the fresh Monday/Tuesday menu and item slots after leaving and reopening the tool; split Global block menu labels and selected item slots now use newest submitted row freshness, and browser coverage now reproduces the Cypress-over-stale-Roam-BBQ case; set visible app version to `2026.07.21.004-reinvent-same-block-stale-row-guard`.
- [Jul 21, 6:38 PM] Made split Global blocks authoritative for Re:Invent/Blueshift so stale one-week Global rows can no longer override Monday/Tuesday, Wednesday/Thursday, or Friday selections after edit-and-resubmit; also ignored blank legacy Global blocks that were forcing Doppler back to Cypress over submitted item evidence; set visible app version to `2026.07.21.003-reinvent-doppler-stale-menu-guard`.
- [Jul 21, 6:04 PM] Fixed Re:Invent split-global submit/recall integrity so Global Block item rows inherit Submitted status during save, and existing submitted blocks can recover matching saved item rows that were previously written as Draft; set visible app version to `2026.07.21.002-reinvent-submit-recall-integrity`.
- [Jul 21, 7:18 AM] Fixed Re:Invent split-global recall/display so saved Global Block menu names are authoritative over child selection-row menu evidence, preventing submitted Cypress/chef-selected menus from being relabeled as stale AMZ menus in recaps and leadership cards; set visible app version to `2026.07.21.001-reinvent-block-menu-authority`.

## 2026-07-18

- [Jul 18, 9:10 PM] Organized AMZ: Carvery in Menu Library into Carved Proteins, Sandwiches, and Vegetable Carvery sections, and added persistent Search Items, Item Section, and Diet Type labels above the Menu Library controls; set visible app version to `2026.07.18.011-carvery-library-sections`.
- [Jul 18, 7:25 PM] Collapsed duplicate chef-facing Menu Library cards and Neighborhood Rotation selector options by visible menu, station, category, item name, and MRN while keeping raw Webtrition rows available for audits; set visible app version to `2026.07.18.010-menu-item-dedupe`.
- [Jul 18, 5:43 PM] Put no-Global locked cafe cards into the same bordered summary tile style by showing `Stations` / `Selections locked` instead of loose text, while still avoiding fake AMZ labels; set visible app version to `2026.07.18.009-station-locked-card-border`.
- [Jul 18, 4:08 PM] Normalized Neighborhood Rotation leadership and submitted recap cards so one-menu Global weeks render as bordered `Monday - Friday` concept tiles, matching split-week and promo cards in light and dark mode; set visible app version to `2026.07.18.008-rotation-card-summary-border`.
- [Jul 18, 3:28 PM] Added a Los Angeles changelog timestamp helper and stricter timestamp validation so dashboard changelog entries keep the intended hour and minute; set visible app version to `2026.07.18.007-changelog-time-guard`.
- [Jul 18, 1:25 PM] Added a fast `pnpm run release:preflight` command for source/auth/handoff checks before small publishes without running the full app verification suite.
- [Jul 18, 1:25 PM] Updated `publish-live.ps1` so successful pushes immediately update local `origin/main` to the pushed commit, avoiding stale Git status without an extra network fetch; this is a tooling/process update and does not change the visible app version.
- [Jul 18, 12:45 PM] Added a repo-local GitHub HTTPS repair command that uses portable Git/OpenSSL plus the GitHub CLI token to avoid Windows `SEC_E_NO_CREDENTIALS`, missing `git-remote-https`, and stale `origin/main` states.
- [Jul 18, 12:45 PM] Added `pnpm run repair:git` and documented when to use it before publish work; this is a tooling/process update and does not change the visible app version.
- [Jul 18, 12:00 PM] Upgraded Menu Library MenuWorks uploads into a reviewed weekly import pipeline with schema preflight, exact MRN precision signals, protected curated descriptions, hidden-after-accept counts, and import batch language.
- [Jul 18, 12:00 PM] Wired accepted MenuWorks imports through the Recipe Library Supabase API first, with local browser fallback if the server write fails, and scoped stale-row hiding to only the menus included in the upload; set visible app version to `2026.07.18.006-menuworks-import-pipeline`.
- [Jul 18, 11:16 AM] Changed Menu Library Webtrition actions from forced recipe side-panel links to plain MRN search links so Webtrition does not reject recipes with an access error; set visible app version to `2026.07.18.005-webtrition-search-only`.
- [Jul 18, 10:45 AM] Added exact MRN display to Menu Library item cards so Webtrition IDs are visible before opening the detail drawer.
- [Jul 18, 10:45 AM] Added Menu Library detail actions to open a Webtrition MRN search in a new tab and copy the MRN when Webtrition collapses the recipe route after auth; set visible app version to `2026.07.18.004-menu-library-mrn-webtrition-link`.
- [Jul 18, 10:05 AM] Added Webtrition as an external platform tool card using the Webtrition logo and opening `https://www.webtrition.com/ui/#/` in a new browser tab.
- [Jul 18, 10:05 AM] Added a platform tool verification guard for the Webtrition external link/logo and set visible app version to `2026.07.18.003-webtrition-tool-link`.
- [Jul 18, 12:42 AM] Removed Bil Smith from the Lean Tool email report-out recipient list while leaving unrelated Menu Projects contact data untouched.
- [Jul 18, 12:42 AM] Added a Lean Tool verification guard so Bil Smith cannot be reintroduced to Lean report recipients accidentally; set visible app version to `2026.07.18.002-lean-report-recipient-cleanup`.
- [Jul 18, 12:16 AM] Added a Menu Library `Download All Menus CSV` export beside the selected-menu export so leaders can pull menu, recipe name, MRN, category, description, calories, sell price, and true cost across the full library in one file.
- [Jul 18, 12:16 AM] Kept the existing selected-menu CSV export intact and added release verification markers for the all-menu export path; set visible app version to `2026.07.18.001-menu-library-all-menus-export`.

## 2026-07-17

- [Jul 17, 10:35 PM] Fixed promo override submitted recaps and leadership cards so full-week takeovers show the promo name and saved promo items while suppressing stale normal Global rows from prior submissions.
- [Jul 17, 10:35 PM] Cleared stale selected-food-cost signals from promo override recalls by routing cards, recaps, and station rows through the same promo-aware selection builder.
- [Jul 17, 10:35 PM] Reset `Edit and resubmit` mode whenever the selected district, cafe, or week changes, and after a confirmed resubmit, so edit state cannot carry into another cafe.
- [Jul 17, 10:35 PM] Added browser regression coverage for full-week Re:Invent promo recall and cross-cafe edit-state reset; set visible app version to `2026.07.17.002-promo-resubmit-state-integrity`.
- [Jul 17, 12:00 PM] Removed fake Global/AMZ labels from submitted recaps, leadership cards, and export cards for cafes that do not run a Global station; locked cards keep update time and station progress without the unhelpful `By Chef` line.
- [Jul 17, 12:00 PM] Reworked promotion override data so it is week-only, uses Monday-Friday promo days, stores optional promo entree/side/extension notes, and no longer requires normal Global selection rows when the promo covers the full week.
- [Jul 17, 12:00 PM] Set visible app version to `2026.07.17.001-promo-override-global-card-integrity`.

## 2026-07-16

- [Jul 16, 12:00 PM] Added a repo-local `scripts/publish-live.ps1` fast publish path that uses the GitHub CLI token with portable Git/OpenSSL so releases do not depend on flaky Windows credential prompts.
- [Jul 16, 12:00 PM] Added `pnpm run publish:live` and deployment notes documenting the safe verified path, docs-only fast path, and failure recovery steps.

## 2026-07-15

- [Jul 15, 11:38 PM] Made Nitro's saved weekly Global Menu canonical across both protein blocks, removing mismatched child-menu labels and selections instead of recalling false menu details.
- [Jul 15, 11:38 PM] Added exact parent/child mismatch regression coverage and canonicalized Nitro block writes so resubmission cannot preserve a different menu under the weekly selection; set visible app version to `2026.07.15.005-nitro-canonical-menu-integrity`.
- [Jul 15, 11:08 PM] Added submitted-family recall protection so confirmed submitted child rows outrank stale Draft children stored under the same submitted rotation header, while legacy families with no submitted children remain readable.
- [Jul 15, 11:08 PM] Reproduced the live Nitro October data shape in browser coverage and verified Anisa selections no longer revert to stale Ciudad details; set visible app version to `2026.07.15.004-rotation-submitted-family-integrity`.
- [Jul 15, 10:43 PM] Made Supabase the authoritative Neighborhood Rotations read whenever live rows are available; Smartsheet now participates only as the fallback instead of merging stale child selections into current submitted rotations.
- [Jul 15, 10:43 PM] Changed submission requirements to follow each cafe's assigned station configuration, removing the impossible Global Menu requirement from Atlas and Commissary while preserving Global requirements for cafes that operate that station.
- [Jul 15, 10:43 PM] Added regression coverage for Nitro Anisa recall against stale Ciudad mirror rows and audited all currently configured cafes without Global stations; set visible app version to `2026.07.15.003-rotation-source-integrity`.
- [Jul 15, 9:01 PM] Added curated Menu Library photography for Atlas Noodle, Anisa, Bibimbowl, Balti, Breakfast, and Carvery with one explicit photo per matched dish and no fuzzy runtime guessing.
- [Jul 15, 9:01 PM] Added group-photo banners for Atlas Noodle, Anisa, Breakfast, and Carvery; Bibimbowl and Balti remain intentionally banner-free because their source folders do not contain a true group shot.
- [Jul 15, 9:01 PM] Added release integrity checks for 110 matched dishes, all mapped photo files, all menu banners, and card-to-detail photo consistency; set visible app version to `2026.07.15.002-menu-library-photo-expansion`.
- [Jul 15, 7:23 AM] Reflowed Menu Library item metrics into width-aware tiles so labels remain whole and readable instead of splitting words inside narrow cards.
- [Jul 15, 7:23 AM] Removed the redundant `Recipe instructions not attached yet` item-card badge and shortened the empty Recipe file state to `No recipe uploaded`.
- [Jul 15, 7:23 AM] Added Menu Library browser and release regression coverage and set visible app version to `2026.07.15.001-menu-library-card-cleanup`.

## 2026-07-14

- [Jul 14, 11:37 PM] Fixed locked leadership cards so Re:Invent split-global weeks render the full calendar sequence instead of saved-record insertion order.
- [Jul 14, 11:37 PM] Added Doppler full-week leadership card labels for Monday + Tuesday carryover and Wednesday-Friday current menu, including regression coverage for stale Cypress recall.
- [Jul 14, 11:37 PM] Set visible app version to `2026.07.14.004-rotation-full-week-cards`.
- [Jul 14, 6:25 PM] Fixed Neighborhood Rotations recall so submitted global selection rows outrank stale/default Global Block rows when saved menus disagree.
- [Jul 14, 6:25 PM] Fixed split-global submitted recap and station rows to show persisted submitted blocks when Re:Invent saved block IDs differ from the currently computed week layout.
- [Jul 14, 6:25 PM] Added browser regression coverage for Re:Invent AMZ+RA split-menu recall and Doppler stale-Cypress recall, and set visible app version to `2026.07.14.003-rotation-recall-integrity`.
- [Jul 14, 3:42 PM] Tightened Weekly Traffic retention so Supabase keeps only the current Monday-Sunday visitor week and prunes older traffic rows on every traffic read/write.
- [Jul 14, 3:42 PM] Clarified that Weekly Traffic is not a historical archive and set visible app version to `2026.07.14.002-weekly-traffic-prune`.
- [Jul 14, 3:16 PM] Moved the Weekly Traffic endpoint off Smartsheet writes and reads so Smartsheet cell-limit errors no longer break the landing dashboard.
- [Jul 14, 3:16 PM] Weekly Traffic now records anonymous daily visitor rows in Supabase `app_records`, keeps smoke-test traffic excluded, and returns a safe zero baseline if storage is temporarily unavailable.
- [Jul 14, 3:16 PM] Updated the Weekly Traffic UI so backend storage errors are not shown raw to users and set visible app version to `2026.07.14.001-traffic-supabase-safe`.

## 2026-07-12

- [Jul 12, 1:12 PM] Rebuilt the Culinary App menu item dataset from `Master Menus 7-12-26.csv` as the Webtrition Master source of truth.
- [Jul 12, 1:12 PM] Updated Menu Library data to 1,550 Master rows across 53 menus, added 100 new/rekeyed rows, and removed 57 stale app rows from the generated dataset.
- [Jul 12, 1:12 PM] Expanded stored item detail with nutrition daily value fields and meal-pattern contribution fields from Webtrition, while preserving curated/source-truth descriptions.
- [Jul 12, 1:12 PM] Changed Recipe Library Supabase backfill to hide stale Supabase recipe rows that are no longer present in the Master dataset.
- [Jul 12, 1:12 PM] Removed obsolete raw MenuWorks archive files and replaced them with the current July 12 Master Menus raw archive.
- [Jul 12, 1:12 PM] Refreshed landing dashboard summary counts from the Master dataset and set visible app version to `2026.07.12.003-master-menus-sync`.
- [Jul 12, 8:43 AM] Repointed Doppler/Zane's Salad selectors to the full Menu Library salad pool instead of the tiny Fresh Five salad override.
- [Jul 12, 8:43 AM] Updated station selector release guards so Fresh Five controls stay station-specific while Zane's Salad pulls the full salad library set.
- [Jul 12, 8:43 AM] Shortened Menu Library Webtrition weight labels to `WebT OZ` and tightened wrapping so the label stays inside its property card.
- [Jul 12, 8:43 AM] Set visible app version to `2026.07.12.002-selector-library-scope`.
- [Jul 12, 10:05 AM] Added a desktop-only density pass so the app loads with a calmer, more zoomed-out feel on large screens without forcing browser zoom or shrinking mobile tap targets.
- [Jul 12, 10:05 AM] Widened the Neighborhood Rotations desktop workspace and reduced its oversized desktop shell text overrides while preserving the larger mobile/tablet controls.
- [Jul 12, 10:05 AM] Set visible app version to `2026.07.12.001-desktop-density`.

## 2026-07-11

- [Jul 11, 10:05 AM] Hid the unfinished Ladle Compliance tool from the platform home tool cards and mobile tool navigation while leaving the underlying code dormant for future rebuild.
- [Jul 11, 10:05 AM] Updated the visible platform tool count to 6 and set visible app version to `2026.07.11.003-hide-ladle-compliance`.
- [Jul 11, 9:21 AM] Formalized the AI handoff protocol so every future code pass starts by reading `AI_HANDOFF.md` and ends by updating handoff, changelog, and version state.
- [Jul 11, 9:21 AM] Added a visible Neighborhood Rotations `Submitting...` state with a live status banner telling chefs to keep the tab open while Supabase and Smartsheet confirm the save.
- [Jul 11, 9:21 AM] Renamed user-facing Recipe Library labels to `Menu Library`.
- [Jul 11, 9:21 AM] Added Webtrition oz weight display to Menu Library item cards, item drawer overview, and nutrition detail for audit visibility.
- [Jul 11, 9:21 AM] Set visible app version to `2026.07.11.002-handoff-submit-menu-library`.
- [Jul 11, 8:46 AM] Added a guarded browser-storage path for Neighborhood Rotations so oversized Smartsheet-ready record caches no longer crash the tool when opening South/Re:Invent.
- [Jul 11, 8:46 AM] Added a browser smoke test that simulates a localStorage quota failure on `culinaryToolsSmartsheetReadyRecords_v1` and verifies Re:Invent still opens.
- [Jul 11, 8:46 AM] Set visible app version to `2026.07.11.001-rotation-storage-quota-guard`.

## 2026-07-07

- [Jul 7, 7:34 PM] Reworked Menu Audit Brand vs App + SSMT mode so Centric comparisons only run against uploaded brand reports instead of creating false missing-brand rows for every menu.
- [Jul 7, 7:34 PM] Added clear Menu Audit guidance when the selected menu does not have a Centric Brand Report uploaded yet, while keeping SSMT vs Culinary App reconciliation always available.
- [Jul 7, 7:34 PM] Preserved Brand Report price, calories, primary reporting category, and secondary reporting category fields in audit records.
- [Jul 7, 7:34 PM] Marked Centric-only rows as `Remove from Centric Brand`, SSMT/app rows missing from Centric as `Needs Centric Programming`, and SSMT-vs-app gaps as `Missing from Culinary App` or `Missing from SSMT`.
- [Jul 7, 7:34 PM] Treated SSMT and Centric modifier rows as modifier reconciliation records so missing Culinary App modifier MRNs do not create false failures.
- [Jul 7, 7:34 PM] Set visible app version to `2026.07.07.004-menu-audit-brand-scope`.
- [Jul 7, 6:07 PM] Paged the Neighborhood Rotations Supabase read path so future saved rotations do not disappear after the first 1,000 database rows.
- [Jul 7, 6:07 PM] Added a browser audit that opens every district/cafe planner for future weeks and verifies Re:Invent/Blueshift split-global selectors remove already-used menus.
- [Jul 7, 6:07 PM] Added a live rotation audit script for future records, split block issues, duplicate record IDs, and South next-week submission visibility.
- [Jul 7, 6:07 PM] Set visible app version to `2026.07.07.003-rotation-audit-pagination`.
- [Jul 7, 9:42 AM] Added the Menu Audit Tool as the seventh platform tool with source upload cards, freshness tracking, menu/brand filters, summary cards, exact MRN columns, and CSV export.
- [Jul 7, 9:42 AM] Built text-safe audit parsers for Master App Data, active SSMT workbooks, and Centric Brand Reports so MRNs like `165741.11`, `182206.25`, and `107142.156` are preserved as text instead of rounded.
- [Jul 7, 9:42 AM] Corrected Brand Report modifier parsing to use modifier item names and detected MRN columns from the workbook header instead of assuming group names or unsafe column positions.
- [Jul 7, 9:42 AM] Ignored SSMT modifier rows marked `remove` so removed modifiers do not inflate audit mismatch counts.
- [Jul 7, 9:42 AM] Kept Recipe Library Files focused on Plating Guide and Recipe by removing duplicate Photo and obsolete Source Document file tiles.
- [Jul 7, 9:42 AM] Added Menu Audit release verification for exact MRN preservation, modifier item-name parsing, and SSMT remove-row filtering.
- [Jul 7, 9:42 AM] Set visible app version to `2026.07.07.001-menu-audit-mrn-text`.

## 2026-07-05

- [Jul 5, 10:09 PM] Added a Weekly Traffic read filter so old automation rows from HeadlessChrome/browser smoke checks no longer count in dashboard visitor totals.
- [Jul 5, 10:09 PM] Set visible app version to `2026.07.05.006-traffic-smoke-clean`.
- [Jul 5, 10:02 PM] Excluded browser smoke-test visits from the Weekly Traffic write path so production verification no longer inflates visitor counts.
- [Jul 5, 10:02 PM] Added a browser smoke guard that verifies analytics requests carry the smoke-test marker before release.
- [Jul 5, 10:02 PM] Added a release guard so the traffic endpoint must keep ignoring marked smoke-test traffic.
- [Jul 5, 10:02 PM] Set visible app version to `2026.07.05.005-smoke-traffic-safe`.
- [Jul 5, 9:35 PM] Added Re:Invent split-global smoke coverage so saved Monday/Tuesday, Wednesday/Thursday, and Friday menus must recall as submitted instead of reverting to duplicate fallback menus.
- [Jul 5, 9:35 PM] Added Recipe Library smoke coverage for editing a recipe card and saving through the Supabase API path.
- [Jul 5, 9:35 PM] Changed the Recipe Library API to lazy-load the heavy MenuWorks JSON only when Supabase is unavailable or a protected backfill needs fallback data.
- [Jul 5, 9:35 PM] Expanded release guards so the heavy MenuWorks fallback cannot be reintroduced as a top-level Recipe Library API import.
- [Jul 5, 9:35 PM] Set visible app version to `2026.07.05.004-reinvent-recipe-smoke-speed`.
- [Jul 5, 12:38 PM] Added browser smoke tests for Lean Tool mobile, Neighborhood Rotations submit guarding, and Menu Projects create/trash flow.
- [Jul 5, 12:38 PM] Fixed the Menu Projects create-project modal so its action button stays reachable inside a scrollable app-style dialog.
- [Jul 5, 12:38 PM] Expanded release guards so the workflow smoke tests cannot be removed silently.
- [Jul 5, 12:38 PM] Set visible app version to `2026.07.05.003-workflow-smoke-tests`.
- [Jul 5, 12:04 PM] Installed a Playwright browser verification layer for project click-through checks.
- [Jul 5, 12:04 PM] Added a Recipe Library browser smoke test that catches app-protection crashes and the `databaseSource is not defined` regression before publish.
- [Jul 5, 12:04 PM] Added project-local browser install/run commands and release guards for the browser smoke-test files.
- [Jul 5, 12:04 PM] Set visible app version to `2026.07.05.002-browser-smoke-check`.
- [Jul 5, 11:33 AM] Fixed Recipe Library loading/error view so it no longer references the main RecipeDatabase database source state before that state exists.
- [Jul 5, 11:33 AM] Added a Recipe Library release guard that blocks scoped-state references inside the status shell.
- [Jul 5, 11:33 AM] Set visible app version to `2026.07.05.001-recipe-library-status-hotfix`.

## 2026-07-04

- [Jul 4, 2:21 PM] Added shared Recipe Library card saves so item edits write back to Supabase instead of only the current browser.
- [Jul 4, 2:21 PM] Wired Recipe Library photo, plating guide, and recipe file uploads through Supabase Storage with versioned document records and download links.
- [Jul 4, 2:21 PM] Added Supabase/fallback source chips to Recipe Library and Data Health so the active database source is visible.
- [Jul 4, 2:21 PM] Set visible app version to `2026.07.04.009-recipe-library-shared-writes`.
- [Jul 4, 2:15 PM] Added paged Supabase Recipe Library reads so the app pulls all `recipe_items` rows instead of stopping at Supabase's first 1,000-row response.
- [Jul 4, 2:15 PM] Set visible app version to `2026.07.04.008-recipe-library-supabase-pages`.
- [Jul 4, 2:08 PM] Hardened Recipe Library Supabase backfill so decimal calorie values are rounded before writing to the integer `recipe_items.calories` column.
- [Jul 4, 2:08 PM] Set visible app version to `2026.07.04.007-recipe-library-backfill-cast`.
- [Jul 4, 1:52 PM] Added Supabase-first Recipe Library reads with a protected Recipe Library backfill action for the `recipe_items` table.
- [Jul 4, 1:52 PM] Moved Menu Engineering, Neighborhood Rotations, Data Health, Recipe Library, and dashboard trust CSV reads onto the shared MenuWorks API loader.
- [Jul 4, 1:52 PM] Kept the local MenuWorks override path intact so accepted upload reviews and edited recipe cards still work while live reads come from Supabase/server fallback.
- [Jul 4, 1:52 PM] Added release guards to prevent user-facing tools from reintroducing direct browser imports of the heavy `menuItems.json` asset.
- [Jul 4, 1:52 PM] Set visible app version to `2026.07.04.006-menuworks-supabase-loader`.
- [Jul 4, 1:27 PM] Added a secure Recipe Library API read endpoint with summary, selected-menu, and deliberate full-library scopes.
- [Jul 4, 1:27 PM] Moved Recipe Library browsing and the dashboard trust action CSV off direct browser imports of the MenuWorks item file.
- [Jul 4, 1:27 PM] Preserved MenuWorks upload and recipe-card edit integrity by fetching full rows only for those write/review actions.
- [Jul 4, 1:27 PM] Added release guards so Recipe Library and the trust CSV cannot accidentally reintroduce direct client imports of `menuItems.json`.
- [Jul 4, 1:27 PM] Set visible app version to `2026.07.04.005-recipe-library-api-read`.
- [Jul 4, 1:07 PM] Added Recipe Library photo coverage signals for total attached photos and missing photo gaps by selected menu.
- [Jul 4, 1:07 PM] Expanded Recipe Library photo lookup to support future uploaded photo fields and file attachment records beyond the current Andes assets.
- [Jul 4, 1:07 PM] Changed Recipe Library to load the heavy MenuWorks item bundle on demand instead of importing it directly into the tool shell.
- [Jul 4, 1:07 PM] Cleaned the item Files tab down to only Plating Guide and Recipe so duplicate Photo and obsolete Source Document tiles no longer render.
- [Jul 4, 1:07 PM] Set visible app version to `2026.07.04.004-recipe-library-photo-signal`.
- [Jul 4, 12:52 PM] Fixed Recipe Library card opening so shared MRNs no longer open the wrong menu row and lose the attached item photo.
- [Jul 4, 12:52 PM] Added a Recipe Library photo integrity audit so every catalog card with a photo must open a drawer with the same photo.
- [Jul 4, 12:52 PM] Set visible app version to `2026.07.04.003-recipe-library-photo-integrity`.
- [Jul 4, 12:36 PM] Reworked the Recipe Library item detail card into a wider, more readable drawer with larger title, tabs, metrics, descriptions, and allergen text.
- [Jul 4, 12:36 PM] Made Recipe Library food photos and menu banner photos more viewable by giving them more room and reducing tight crop behavior.
- [Jul 4, 12:36 PM] Moved item Data Confidence into a bottom review panel after the chef-facing details so the primary item information reads first.
- [Jul 4, 12:36 PM] Added release guards for the wider Recipe Library card layout, larger type scale, and expanded photo display.
- [Jul 4, 12:36 PM] Set visible app version to `2026.07.04.002-recipe-library-card-layout`.
- [Jul 4, 12:27 PM] Fixed Menu Projects empty state so deleting every project stays empty instead of repopulating the three original sample projects.
- [Jul 4, 12:27 PM] Removed automatic sample-project loading from the live Menu Projects screen while keeping the real database load and create-project flow intact.
- [Jul 4, 12:27 PM] Added a release guard so Menu Projects cannot treat an empty saved list as a reason to reload examples.
- [Jul 4, 12:27 PM] Set visible app version to `2026.07.04.001-menu-project-empty-state`.

## 2026-07-02

- [Jul 2, 8:38 PM] Fixed Menu Projects trash behavior so deleted projects create a local tombstone, delete from Supabase, and delete from the Smartsheet mirror instead of reappearing after leaving the tool.
- [Jul 2, 8:38 PM] Added Menu Projects reload filtering for recently deleted project IDs so stale saved records cannot repopulate the dashboard on the same device.
- [Jul 2, 8:38 PM] Hard-wired District Chef / SSMT Owners to Tyler Leiss and Alex Neuse while keeping Project Owner / Chef blank until entered.
- [Jul 2, 8:38 PM] Added release guards for Menu Projects delete persistence, Supabase/Smartsheet project-family deletes, and Tyler/Alex SSMT ownership.
- [Jul 2, 8:38 PM] Set visible app version to `2026.07.02.012-menu-project-delete-sync`.
- [Jul 2, 9:07 PM] Changed Menu Projects creation so Project Owner / Chef no longer auto-fills Tyler and Alex.
- [Jul 2, 9:07 PM] Defaulted District Chef / SSMT Owner to Tyler Leiss on new and normalized Menu Projects.
- [Jul 2, 9:07 PM] Added a concept-brief upload email handoff prompt for Chandon with an attachment reminder and attachment download button.
- [Jul 2, 9:07 PM] Made required file deletion return projects to Concept Brief when the missing file invalidates a later stage.
- [Jul 2, 9:07 PM] Added a manual Return to Concept Brief control for unusual workflow resets.
- [Jul 2, 9:07 PM] Set visible app version to `2026.07.02.011-menu-project-handoff-reset`.
- [Jul 2, 8:34 PM] Fixed Data Health status drift repair so duplicate saved row IDs are skipped instead of breaking Supabase and Smartsheet saves.
- [Jul 2, 8:34 PM] Added duplicate-write defenses to both Supabase and Smartsheet storage endpoints so one bad batch cannot fail with duplicate row update errors.
- [Jul 2, 8:34 PM] Updated Neighborhood Rotations recall to merge Supabase and Smartsheet mirror rows so partially backfilled primary storage cannot hide locked rotations.
- [Jul 2, 8:34 PM] Added release guards for unique repair payloads, backend duplicate defenses, and merged rotation reads.
- [Jul 2, 8:34 PM] Set visible app version to `2026.07.02.010-rotation-storage-recall`.
- [Jul 2, 7:54 PM] Made Supabase the authoritative Menu Projects source on load so phone and desktop stop merging different browser-local project lists.
- [Jul 2, 7:54 PM] Kept sample Menu Projects local-only so demo records do not get written into the shared Supabase/Smartsheet project data.
- [Jul 2, 7:54 PM] Added a Supabase compatibility route for Menu Projects records so the current `app_records` tool constraint no longer forces Smartsheet fallback.
- [Jul 2, 7:54 PM] Moved Menus in the Works above the Project Record and gave the selected project detail full width for clearer stage and next-step work.
- [Jul 2, 7:54 PM] Added release guards for Menu Projects cross-device source behavior, sample-record blocking, Supabase tool compatibility, and the wider project layout.
- [Jul 2, 7:54 PM] Set visible app version to `2026.07.02.009-menu-project-supabase-source`.
- [Jul 2, 3:21 PM] Reworked Menu Projects creation so project owners are entered as full name/email records instead of a comma-separated name-only field.
- [Jul 2, 3:21 PM] Defaulted new Menu Projects to Tyler Leiss and Alex Neuse as project owners while keeping District Chef / SSMT Owner separate for assignment.
- [Jul 2, 3:21 PM] Added release guards so the old owner field cannot return and the Tyler/Alex owner defaults stay intact.
- [Jul 2, 3:21 PM] Set visible app version to `2026.07.02.008-menu-project-owner-defaults`.
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
