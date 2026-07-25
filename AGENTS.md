# Agent Instructions

This is the entry point for any agent or Registered Admin working on the Culinary Tools Platform. Read in this order:

1. **AGENTS.md** (this file) — roster, teams, reading order.
2. [ADMIN_REGISTRY.md](ADMIN_REGISTRY.md) — who currently holds administrative authority.
3. [GOVERNANCE.md](GOVERNANCE.md) — admin roles, orchestrator, permanent worker roster, agent teams, permission boundaries.
4. [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md) — current system architecture and data-authority rules.
5. [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) — approved product decisions and rejected alternatives.
6. [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md) — how Chief assigns and scopes work.
7. [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md) — how a change goes from implemented to live.
8. `AI_HANDOFF.md` — tool-by-tool technical state, current version, and known risks. Read before touching code.
9. `CHANGELOG.md` — detailed change history.

`docs/ARCHITECTURE.md` and `docs/DEPLOYMENT.md` hold code-structure and deployment-command detail referenced from the governance docs above; they are not themselves governance-tier documents.

`OTHER_CODEX_MASTER_PROMPT.md` is historical/deprecated — do not use it for onboarding. See its header for why.

## Current Roster (as of 2026-07-25)

**Orchestrator:** Chief — not a member of any worker team.

**9 permanent workers:** Scout, Architect, Builder, Reviewer, Verifier, Steward, Operator, Scribe, Release.

**6 agent teams:** Council, Triage, Build, Data Guard, Product Change, Release Gate.

Full role descriptions, team membership, and permission boundaries (e.g., Builder cannot merge/deploy; Reviewer and Verifier are independent; Release requires a Release-Authorized Admin) are in [GOVERNANCE.md](GOVERNANCE.md) — this file only points there so the detail has one home.

**Legacy/inactive:** Fizz, Bumble, Honey remain channel members from the pre-reorg lineup but hold no permanent role prompt and show no recent activity. Do not assign them governance, data, review, or release work. See [GOVERNANCE.md](GOVERNANCE.md) § Legacy Agents for status and the open decision.

## Before Making Changes

Read `AI_HANDOFF.md`.

## After Meaningful Changes

Update:

- `AI_HANDOFF.md`
- `CHANGELOG.md`
- `src/shared/appConfig.js` when the live app behavior, UI, data flow, or user-facing version changes

If the change is a governance/process/documentation decision rather than an application change, update [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) and/or [GOVERNANCE.md](GOVERNANCE.md) instead — see [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md) for how that gets scoped.

Run the relevant verification before publishing. For Neighborhood Rotations, always include:

```bash
node scripts/run-playwright.mjs neighborhood-rotations
node scripts/run-playwright.mjs reinvent-submit-recall
```

Do not treat browser localStorage as source of truth. Supabase is primary shared storage; Smartsheet is fallback/mirror unless a deliberate migration removes it. Full data-authority rules: [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md).
