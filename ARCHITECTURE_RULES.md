# Architecture Rules

Authoritative current-state architecture and data-authority rules for the Culinary Tools Platform. This consolidates rules already established in `AGENTS.md` and `AI_HANDOFF.md` into one governance-tier location; it does not reinterpret or change them. For code-structure detail (file layout, module boundaries) see `docs/ARCHITECTURE.md`. For deployment mechanics see `docs/DEPLOYMENT.md` and [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md).

Maintained by Scribe. Do not duplicate these rules into new documents — link here instead.

## Data Source Authority (carried forward unchanged from `AGENTS.md` / `AI_HANDOFF.md`)

- **Supabase is the primary shared data backbone.** Known areas: `app_records`-style storage for rotations, lean, menu projects, analytics; `recipe_items` and recipe document/file structures for Menu Library; storage buckets prepared conceptually for recipe files, plating guides, and item photos.
- **Smartsheet is fallback/mirror**, especially during migration. Do not remove Smartsheet paths without a deliberate migration plan. Env vars: `SMARTSHEET_ACCESS_TOKEN`, `SMARTSHEET_SHEET_ID`. Smartsheet hit a 500,000-cell limit on 2026-07-14; new work should not add load-bearing dependence on Smartsheet capacity.
- **Browser localStorage is never a source of truth for critical shared data.** Use only for UI preferences, last-used local cache, or temporary convenience. Any large localStorage write must be guarded (`src/shared/safeStorage.js` or equivalent) and must not crash the app.
- **SSMT workbook imports are not item-removal authority.** `docs/ssmt/SEA Standard Menu Template (1).xlsx` and generated `public/data/ssmtSeedData.json` may seed SSMT tool structure, pricing, modifiers, workflow records, and candidate alignment flags. Operational record deletion/removal remains governed by the Webtrition Report Menu Index until a Registered Admin explicitly approves a different removal authority.
- **Menu Audit source model:** SSMT app records are the Culinary-entered programming source; Webtrition Report Menu Index is the menu/item metadata and removal-authority source; Webtrition Shopping Lists support cross-utilization; recipes are the remaining missing data layer. SSMT-only and Webtrition-only differences are review flags unless removal authority is confirmed.
- **SSMT downstream source bridge:** completed SSMT programming may feed downstream selectors only through explicit read-time rules. The Recipe Library API may derive item rows from the shared `ssmt|workspace|current` record for non-hidden `Core`, `Global`, and `Menu Library` menus in phase `IT complete`; `dividerKind: "submenu"` rows create downstream submenu names for following items. SSMT-derived rows may replace matching MenuWorks menu rows at read time for the same menu name, but this is not a production data delete, schema migration, Webtrition Report Menu Index removal-authority change, pricing authority change, or MRN rewrite.
- **SSMT shared workspace record id (canonical):** the one live shared SSMT workspace row is `ssmt|workspace|current` (stored in `app_records`, physical `tool='rotation'`). The app editor, shared-storage save/load, and the Recipe Library derived-row read all target this id as the single source of truth. `ssmt|workspace|current-v2` was an abandoned "compact successor" id introduced by the `2026.09.03.002-ssmt-load-resilience` work that never materialized a row in production; because reads/writes pointed at it, a fresh browser loaded an empty shared workspace and a first save would have shadowed the real `current` data. `2026.09.03.003` reconciled all code back to `current`; `current-v2` is now accepted on read only (defensive) and must never be written. Payload compaction is achieved by gzip-compressing the workspace into `record_payload` on write and expanding it on read (`ssmtPayloadEncoding: "gzip-base64-json-v1"`), not by forking to a second record id. Do not reintroduce a second live workspace id without a real Data Guard migration that copies the data and deletes the superseded row.

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
- **Menu Audit Tool:** MRNs (Menu Record Numbers) must be treated as text. Never round, truncate, or coerce MRNs into numbers. SSMT/Webtrition mismatches must not become destructive deletes without the Webtrition Report Menu Index removal-authority check.
- **Recipe Library / Menu Library:** menu/item data and photos must remain aligned. Do not blindly overwrite curated descriptions with secondary import descriptions.
- **Menu Projects:** saved/deleted project records must persist across phone/desktop. Do not reintroduce local-only sample records as real data.
- **Lean Tool:** mobile usability matters; the observation flow should be fast and avoid constant scrolling.

## Change Control

Changes to the rules in this file are architecture decisions and should go through Architect (design) and Reviewer (independent check) per [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md), the same as any other product/architecture change. Scribe updates this file only after such a decision is recorded — see [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) for the decision log.
