# Architecture Rules

Authoritative current-state architecture and data-authority rules for the Culinary Tools Platform. This consolidates rules already established in `AGENTS.md` and `AI_HANDOFF.md` into one governance-tier location; it does not reinterpret or change them. For code-structure detail (file layout, module boundaries) see `docs/ARCHITECTURE.md`. For deployment mechanics see `docs/DEPLOYMENT.md` and [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md).

Maintained by Scribe. Do not duplicate these rules into new documents — link here instead.

## Data Source Authority (carried forward unchanged from `AGENTS.md` / `AI_HANDOFF.md`)

- **Supabase is the primary shared data backbone.** Known areas: `app_records`-style storage for rotations, lean, menu projects, analytics; `recipe_items` and recipe document/file structures for Menu Library; storage buckets prepared conceptually for recipe files, plating guides, and item photos.
- **Smartsheet is fallback/mirror**, especially during migration. Do not remove Smartsheet paths without a deliberate migration plan. Env vars: `SMARTSHEET_ACCESS_TOKEN`, `SMARTSHEET_SHEET_ID`. Smartsheet hit a 500,000-cell limit on 2026-07-14; new work should not add load-bearing dependence on Smartsheet capacity.
- **Browser localStorage is never a source of truth for critical shared data.** Use only for UI preferences, last-used local cache, or temporary convenience. Any large localStorage write must be guarded (`src/shared/safeStorage.js` or equivalent) and must not crash the app.

## System Snapshot (carried forward unchanged from `AI_HANDOFF.md`)

- Frontend: React 18, Vite, plain CSS, lucide-react icons.
- Hosting: Vercel production at `project-d8v25.vercel.app`.
- Server/API: Vercel functions under `api/`.
- Menu item source: MenuWorks-derived data, increasingly served through API/Supabase instead of direct heavy client imports.
- Smoke tests: Playwright under `tests/browser`.
- Release guards: scripts under `scripts/verify-*.mjs`.

Module-level structure (app shell, feature areas, shared modules, Smartsheet integration boundary) is documented in `docs/ARCHITECTURE.md` and is not repeated here to avoid duplication.

## Protected Integrity Rules (carried forward unchanged from `AI_HANDOFF.md`)

These rules protect specific tools from regressions that have recurred historically. Full incident history lives in `AI_HANDOFF.md` and `CHANGELOG.md`; this section states the standing rule only.

- **Neighborhood Rotations:** a submitted/locked rotation must recall exactly as submitted. Re:Invent and Blueshift use split-global `2/2/2` block logic (Monday/Tuesday, Wednesday/Thursday, Friday). Submit/resubmit overwrites the saved rotation for that cafe/week rather than creating duplicate history.
- **Menu Audit Tool:** MRNs (Menu Record Numbers) must be treated as text. Never round, truncate, or coerce MRNs into numbers.
- **Recipe Library / Menu Library:** menu/item data and photos must remain aligned. Do not blindly overwrite curated descriptions with secondary import descriptions.
- **Menu Projects:** saved/deleted project records must persist across phone/desktop. Do not reintroduce local-only sample records as real data.
- **Lean Tool:** mobile usability matters; the observation flow should be fast and avoid constant scrolling.

## Change Control

Changes to the rules in this file are architecture decisions and should go through Architect (design) and Reviewer (independent check) per [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md), the same as any other product/architecture change. Scribe updates this file only after such a decision is recorded — see [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) for the decision log.
