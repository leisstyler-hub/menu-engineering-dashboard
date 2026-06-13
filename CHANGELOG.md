# Changelog

## 2026-06-13

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
- Linked the local Codex workspace to the existing Vercel project.
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
