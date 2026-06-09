# Architecture

## App Shell

`src/App.jsx` should stay small and stable. It imports the real app coordinator from `src/app/CulinaryToolsPlatformApp.jsx`.

This protects the Vite entry point from accidental rename/delete mistakes and makes Vercel deployments less fragile.

`src/app/CulinaryToolsPlatformApp.jsx` owns only top-level tool selection. It should not absorb feature-specific calculations, spreadsheet parsing, or Smartsheet mapping.

## Feature Areas

The app has three major feature areas:

- `src/features/menu-engineering`
- `src/features/neighborhood-rotations`
- `src/features/ladle-compliance`

Each feature now owns its current screen implementation:

- `src/features/menu-engineering/MenuEngineeringDashboard.jsx`
- `src/features/neighborhood-rotations/NeighborhoodRotations.jsx`
- `src/features/ladle-compliance/LadleComplianceDashboard.jsx`

Future behavior-preserving passes can split each feature internally into `components`, `calculations`, `constants`, and `data` modules.

## Shared Modules

- `src/shared/appConfig.js`: app-wide version/config constants.
- `src/shared/formatting.js`: currency, percent, price, title-case, and menu sort helpers.
- `src/shared/ui`: reusable visual primitives.

`src/app/LandingPage.jsx` owns the platform landing screen because it coordinates entry into the three tools without belonging to any one feature.

## Integrations

`src/integrations/smartsheet` owns the Smartsheet boundary:

- `contract.js`: column labels, record types, selection types, and station labels.
- `client.js`: browser-facing load/sync helpers for `/api/smartsheet/records`.

Serverless code remains in `api/smartsheet/records.js`.

## Data

`src/data/menuItems.json` is currently bundled into the client app. It is large, so the production bundle is also large. A future performance pass should consider splitting or loading menu data on demand.

## Deployment Guardrails

- Keep `src/main.jsx` and `src/App.jsx` stable.
- Run `pnpm verify` before deployment.
- Update `CHANGELOG.md` when a chat-driven iteration changes structure or behavior.
- Do not commit generated folders such as `node_modules`, `dist`, or local `work` snapshots.
