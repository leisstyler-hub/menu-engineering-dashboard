# Product Decisions

Decision log for the Culinary Tools Platform. Records approved product/business decisions and rejected alternatives so they don't have to be re-litigated or re-discovered from conversation memory. Maintained by Scribe.

This is a log of **approved** decisions only. Proposals, brainstorming, and Architect design options that were not approved by a Registered Admin do not belong here — see [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md) for how a proposal becomes a decision. Standing system-architecture rules (data authority, storage rules, protected tool integrity rules) live in [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md), not here, to avoid duplicating the same rule in two places.

## How to log a new decision

When a mission produces an approved product decision, Scribe adds an entry below with: date, decision, source/approval, and rejected alternatives (if any were explicitly considered and turned down). Do not record a decision that isn't already established in-thread or in existing repo files — if in doubt, ask Chief rather than infer.

## Decisions

### 2026-07-11 — Hide Ladle Compliance from navigation
Hidden from the platform home screen and mobile tool navigation as of version `2026.07.11.003-hide-ladle-compliance`. The underlying code remains in the repo for a future rebuild; users should not be routed into it from normal navigation while it is unfinished/non-working.
Source: `AI_HANDOFF.md`, Ladle Compliance section.

### 2026-07-18 — Lean Tool email report recipients exclude Bil Smith
As of version `2026.07.18.002-lean-report-recipient-cleanup`, Lean Tool email report recipients intentionally exclude Bil Smith. Guarded by `scripts/verify-lean-results-view.mjs`.
Source: `AI_HANDOFF.md`, Lean Tool section.

### Webtrition is an external tool, not an internal React tool
Webtrition's platform-home card opens `https://www.webtrition.com/ui/#/` in a new tab using `public/webtrition-logo.png`, rather than being routed as an internal tool. Recipe deep-links may collapse to the base Webtrition app or show access errors depending on the user's Webtrition session/region/role — this is treated as expected external-tool behavior, not a bug to fix inside this repo. Menu Library instead opens plain MRN search links in a new tab with a Copy MRN fallback.
Source: `AI_HANDOFF.md`, Landing Page section. No version stamp recorded in source; not fabricated here.

### District Chef / SSMT Owner default assignment
The Menu Projects District Chef / SSMT Owner fields are hard-wired to Tyler Leiss and Alex Neuse.
Source: `AI_HANDOFF.md`, Menu Projects section. No version stamp recorded in source; not fabricated here.
Note: this is a product-data default, distinct from agent-governance authority — see [GOVERNANCE.md](GOVERNANCE.md) for the rule that no *agent* permanent instruction may hard-code an individual as sole authority. This existing product-data decision is carried forward unchanged and was not in scope for the 2026-07-25 governance reorg.

### Rejected alternative — append-only Recipe Library Supabase backfill
The Recipe Library Supabase backfill upserts current Master rows and marks visible Supabase rows absent from the Master as `visible_in_library: false`. An append-only backfill approach was tried previously and explicitly rejected: "do not reintroduce append-only backfill behavior."
Source: `AI_HANDOFF.md`, Menu Library section.

### 2026-07-25 — Agent organization reorg and governance documentation
Tyler reorganized the Buzz agent roster into 9 permanent workers + Chief (orchestrator) across 6 teams (Council, Triage, Build, Data Guard, Product Change, Release Gate), replacing the earlier ad hoc Fizz/Bumble/Honey lineup for governance/data/review/release work. Chief ran a governance audit confirming roster, teams, and permission boundaries; Tyler then approved building out this documentation hierarchy (this file and its siblings) to make that structure durable.
Source: Culinary Tools Project channel, thread rooted at event `31323e77e671b14520221fa55ff7a2a781b2f05b962b1f81adcf2039bbaf86de`, 2026-07-25. Admin of Record: Tyler.
Open item: no decision yet on formally decommissioning Fizz, Bumble, and Honey — see [GOVERNANCE.md](GOVERNANCE.md#legacy-agents--fizz-bumble-honey).

### 2026-07-26 — Fast Lane process for Level 1-2 missions
Tyler flagged that every request, regardless of size, was getting the full mission-brief-plus-full-team treatment, slowing down simple changes. Chief proposed two options: (A) permanently cut the permanent roster down to Chief/Scribe/Reviewer/Release/Builder, or (B) keep the full roster and add a reduced-team "fast lane" for Level 1-2 work only, escalating back to full process if scope drifts. Tyler approved Option B. Full rule text lives in [GOVERNANCE.md](GOVERNANCE.md#fast-lane-level-1-2-missions) (not duplicated here); the Level 1-2 / Level 3-5 band split is also reflected in [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md) § Notes.
Source: Culinary Tools Project channel, thread rooted at event `5b63927a6e855fa8f2b7021e33eb021a6ce1f50fd4794436a8e481f4a6b893b5`, 2026-07-26. Requesting Admin / Admin of Record: Tyler (approval event `7edea9a1...`, 2026-07-26T23:28:52Z).
Rejected alternative: permanently cutting the roster to Chief/Scribe/Reviewer/Release/Builder (Option A). Rejected because it would permanently remove independent verification (no Verifier) and data/product oversight (no Steward/Operator) for all future work, not just simple cases, rather than only for the class of request that's actually well-understood and low-risk.
