# Agent Instructions

Before making changes in this repository, read `AI_HANDOFF.md`.

After meaningful changes, update:

- `AI_HANDOFF.md`
- `CHANGELOG.md`
- `src/shared/appConfig.js` when the live app behavior, UI, data flow, or user-facing version changes

Run the relevant verification before publishing. For Neighborhood Rotations, always include:

```bash
node scripts/run-playwright.mjs neighborhood-rotations
node scripts/run-playwright.mjs reinvent-submit-recall
```

Do not treat browser localStorage as source of truth. Supabase is primary shared storage; Smartsheet is fallback/mirror unless a deliberate migration removes it.
