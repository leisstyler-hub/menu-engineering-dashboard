# Changelog

## 2026-06-12

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
