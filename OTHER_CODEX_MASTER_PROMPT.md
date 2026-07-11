# Other Codex Master Prompt

Use this prompt when starting a new Codex session or onboarding another teammate's Codex into this project.

```text
You are working on the Culinary Tools Platform repository:

GitHub: https://github.com/leisstyler-hub/menu-engineering-dashboard
Live app: https://project-d8v25.vercel.app
Vercel: https://vercel.com/tylerl-s-projects/project-d8v25
Supabase: https://supabase.com/dashboard/project/pzilyzqhatthctgsjwtt

Before you do anything else:

1. Read AI_HANDOFF.md in the repo root.
2. Read the latest section of CHANGELOG.md.
3. Read src/shared/appConfig.js for the current visible version.
4. Check git status and compare local state against GitHub/Vercel if possible.
5. Summarize your understanding of the current app state before editing.

This is a real culinary operations platform, not a demo. Data integrity matters more than quick visual changes.

Core operating rules:

- Do not make broad refactors unless they directly support the request.
- Do not overwrite user data.
- Do not remove Supabase, Smartsheet, or fallback paths casually.
- Treat Supabase as the primary shared database and Smartsheet as fallback/mirror during migration.
- Treat browser localStorage as optional cache only.
- Any large localStorage write must be guarded and must not crash the app.
- Bump src/shared/appConfig.js for live app behavior/UI/data-flow changes.
- Update CHANGELOG.md after meaningful changes.
- Update AI_HANDOFF.md after meaningful changes so the next Codex knows what changed.
- Run verification before publishing.
- Verify the live Vercel deployment after publishing.

Most critical tools:

- Neighborhood Rotations: saved/locked menu selections must recall exactly as submitted. Re:Invent and Blueshift split-global logic is fragile and must be protected by browser smoke tests.
- Menu Audit Tool: MRNs must be treated as text. Never round, truncate, or coerce MRNs into numbers.
- Recipe Library: menu/item data and photos need to remain aligned. Do not blindly overwrite curated descriptions with secondary import descriptions.
- Menu Projects: saved/deleted project records must persist across phone/desktop. Do not reintroduce local-only sample records as real data.
- Lean Tool: mobile usability matters. Observation flow should be fast and not require constant scrolling.

Before claiming anything is fixed:

- Run pnpm run verify.
- For rotation work, run:
  node scripts/run-playwright.mjs neighborhood-rotations
  node scripts/run-playwright.mjs reinvent-submit-recall
- For live rotation publish, run those same tests with PLAYWRIGHT_BASE_URL=https://project-d8v25.vercel.app.
- Confirm Vercel production is READY and the live bundle contains the new version stamp.

Final response format requested by Tyler:

- Live URL
- GitHub link
- Vercel dashboard link
- Supabase link
- Version stamp
- What changed
- Verification performed
- Published status
- 1-2 ideas for what should be next
- Issues still pending

If you are unsure whether a change could affect real saved rotations, Menu Audit MRNs, Supabase records, or Smartsheet mirror data, stop and inspect before editing.
```

## Short Start Prompt

```text
Read AI_HANDOFF.md first, then summarize the current project state, current version, known risks, and the exact files/tests you expect to touch before making changes.
```
