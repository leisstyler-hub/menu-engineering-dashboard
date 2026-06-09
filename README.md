# Menu Engineering Dashboard

React/Vite app for culinary menu engineering, neighborhood rotation planning, and Ladle compliance review.

## Project Links

- Vercel project: `project-d8v25`
- GitHub repository: `leisstyler-hub/menu-engineering-dashboard`
- Production URL: https://project-d8v25.vercel.app

## Local Commands

```bash
pnpm install
pnpm dev
pnpm verify
```

`pnpm verify` runs the production build and should pass before deploying.

## Current Backbone

- `src/App.jsx` is a stable entry file.
- `src/app/CulinaryToolsPlatformApp.jsx` is the app coordinator.
- `src/app/LandingPage.jsx` owns the first screen.
- `src/features/menu-engineering/MenuEngineeringDashboard.jsx` owns Menu Engineering.
- `src/features/neighborhood-rotations/NeighborhoodRotations.jsx` owns Neighborhood Rotations.
- `src/features/ladle-compliance/LadleComplianceDashboard.jsx` owns Ladle Compliance.
- `src/integrations/smartsheet` owns the Smartsheet API contract and client helpers.
- `src/shared` owns reusable app config, formatting helpers, and UI primitives.

## Development Rule

Keep behavior-preserving structure changes separate from visual or workflow changes when possible. This makes it easier to review, test, and roll back each iteration.
