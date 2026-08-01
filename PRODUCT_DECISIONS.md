# Product Decisions

Decision log for the Culinary Tools Platform. Records approved product/business decisions and rejected alternatives so they don't have to be re-litigated or re-discovered from conversation memory. Maintained by Scribe.

This is a log of **approved** decisions only. Proposals, brainstorming, and Architect design options that were not approved by a Registered Admin do not belong here — see [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md) for how a proposal becomes a decision. Standing system-architecture rules (data authority, storage rules, protected tool integrity rules) live in [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md), not here, to avoid duplicating the same rule in two places.

## How to log a new decision

When a mission produces an approved product decision, Scribe adds an entry below with: date, decision, source/approval, and rejected alternatives (if any were explicitly considered and turned down). Do not record a decision that isn't already established in-thread or in existing repo files — if in doubt, ask Chief rather than infer.

## Decisions

### 2026-08-01 — Dawson Moby Pop-Up projects into Moby Global
Alex approved a same-week presentation override for the North District's Moby cafe: once Dawson submits valid Moby Pop-Up data, that submitted Dawson menu and its entree/side/sub-recipe/extension selections replace Moby's Global content across cafe tiles, Results, exports, and summaries. Moby retains its own Global selector for weeks without a qualifying Dawson submission and for future editing. Moby's own Draft/Submitted state and completion progress remain independent, and its Pizza, Salad, Deli, and Fresh Five stations remain native. A Dawson Moby promotion follows the same projection rule and affects only Moby Global. Duplicate-menu reporting is explicitly excluded and continues to evaluate Moby's native Global menu.
Source: direct request and clarifications from Alex in the current Codex task on 2026-08-01. Admin of Record: Alex Neuse.
Rejected alternatives: changing Moby's status/progress when Dawson submits; replacing Moby's non-Global stations; persisting a copy of Dawson data into Moby's saved rotation; counting Dawson's projected Moby menu in duplicate-menu reporting.
Implementation status note: published to GitHub `main` at application commit `16683504501f584d1a565c915b35cbcf904ccb46` and verified on Vercel production deployment `dpl_CE363147117z2vqmdNmYrRnKGtrR`; both required production browser suites passed 32/32 and independent Scribe LIVE sign-off passed. Release state: LIVE.

### 2026-08-01 — Dawson Moby Pop-Up station
Alex approved a Dawson-only Neighborhood Rotations station named `Moby Pop-Up`, required for submission beginning with the week of Aug 31, 2026 and explicitly operating Tuesday through Thursday. The station mirrors Dawson Global's menu-first planning format while allowing both Global menus and `AMZ: Carvery`, with capacity for 2 entrees, 3 sides, 2 sub recipes, and 1 extension. Alex also approved an isolated Moby promotion override with individually selectable Tuesday/Wednesday/Thursday service days, including one-day promos; enabling it hides and replaces the full normal Moby selection set for that saved week.
Source: direct request and clarifications from Alex in the current Codex task on 2026-08-01. Admin of Record: Alex Neuse.
Rejected alternatives: making Moby optional; showing it before the Aug 31 week; allowing Monday or Friday promo days; preserving normal Moby fields alongside an enabled promo; sharing Moby's override state or saved records with Dawson Global or Carvery.
Implementation status note: version `2026.08.01.001-dawson-moby-pop-up` was published to GitHub `main` at application commit `0b4ac627eb51bb68f8e92dd0fc4edb5435efef74` and verified on Vercel production deployment `dpl_2CRuWUbLK7AKR9rVNQAhYg54Cwgi`; both required production browser suites passed 31/31.

### 2026-07-31 — Bingo Cafe Wed-Tues Global cadence and second Grill Fresh $5 slot
Tyler approved a Bingo-only Neighborhood Rotations change: Bingo's Global Rotation should follow the same single Wednesday-Tuesday cadence pattern used by Doppler, and Bingo's Grill Fresh $5 station should expose two independently selectable `grillFreshFive` slots instead of one. This is explicitly not a split-global conversion: Bingo remains a one-menu Global cycle with Wednesday start / Monday-Tuesday carryover behavior, and the second option is a second `Grill Fresh $5` slot, not a second generic Grill `Location Spotlight`.
Source: Culinary Tools Project channel, thread rooted at event `9dc3ad58cd58ae10ddbf4bc027f78b5d7c3e9e732ddc20c995582d4f8b8d6aed`, request from Tyler on 2026-07-31, with Chief assigning scoped implementation and then directing Scribe to record the accepted behavior after Builder/Steward/Reviewer/Verifier clearance. Admin of Record: Tyler.
Rejected alternatives: converting Bingo to the Re:Invent/Blueshift split-global model; interpreting the request as a second generic Grill `Location Spotlight` instead of a second `grillFreshFive` slot.
Implementation status note: implemented and independently verified locally at commit `ef2aa015338ad4eef716aa80e79afe98323aaf82`; not merged, not deployed, not live as of this entry.

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
