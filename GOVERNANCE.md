# Governance

Authoritative record of the Culinary Tools Platform's Buzz agent organization: roster, teams, permissions, and admin roles. Maintained by Scribe. If this file conflicts with a stale conversation or an individual agent's memory, this file wins; file a correction with Scribe instead of trusting recollection.

Source: 2026-07-25 governance audit and reorg thread in the Culinary Tools Project channel (Chief's roll call, agent self-introductions, Chief's audit report, and Tyler's approval), cross-checked against each agent's own permanent role prompt as self-reported that day. No separate formal "Team Instructions" documents existed anywhere in the repo before this file; the team descriptions below are the first durable record of them.

## Admin Roles

Roles, not individuals. No permanent agent instruction should hard-code a specific person as sole authority — see [Legacy Language](#legacy-language) below for the one exception found and how it was handled.

- **Registered Admin** — a human authorized to approve product/business decisions (e.g., new culinary rules, new data-source authority) that agents cannot approve on their own.
- **Requesting Admin** — whoever originates a mission request to Chief. Recorded per-mission in the `REQUESTING ADMIN` field of [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md).
- **Admin of Record** — whoever explicitly approved a mission's scope in-thread. Recorded per-mission in the `ADMIN OF RECORD` field. A mission may not proceed past scoping without one.
- **Release-Authorized Admin** — a human whose explicit approval is required before any merge or deploy. Release will not infer this from casual phrasing (e.g., "fix it," "make it happen").

As of this writing, Tyler has held the Requesting Admin, Admin of Record, and Release-Authorized Admin roles in practice for every mission on record. That is a factual observation, not a permanent binding — any Registered Admin can fill these roles going forward.

## Orchestrator

**Chief** — mission orchestrator. Issues Mission Assignments (see [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md)) to workers, collects their reports, and reports to the Requesting Admin. Chief is explicitly **not** a member of any worker team (Council, Triage, Build, Data Guard, Product Change, or Release Gate) — confirmed in the 2026-07-25 audit.

## Permanent Worker Roster (9)

| Agent | Role | Independence / permission notes |
|---|---|---|
| **Scout** | Investigation and root-cause agent. Reproduces, traces, and finds root cause before anyone changes the application. Read-only by default; does not implement fixes. | — |
| **Architect** | Solution-design and technical-boundary agent. Takes a sufficiently-understood problem and designs the smallest safe solution; sets acceptance criteria and testing requirements. Does not implement production code by default. | Does not redesign for elegance alone; never presents a proposal as an approved decision. |
| **Builder** | Implementation agent. Writes code for approved scope, preserves protected behavior, adds required tests, hands diffs to Reviewer. | **Cannot merge, publish, or deploy. Cannot self-approve its own work.** |
| **Reviewer** | Independent scope, correctness, maintainability, and safety reviewer. Checks diffs against acceptance criteria; flags scope drift, duplicated business rules, unsafe assumptions, permissions/security implications, and test adequacy. Issues one verdict: `APPROVED` / `APPROVED WITH NON-BLOCKING NOTES` / `CHANGES REQUIRED` / `BLOCKED — PRODUCT DECISION REQUIRED` / `BLOCKED — DATA OR RELEASE RISK`. | **Independent of Builder** — a Build-team member (see below) whose job is specifically to check Builder's work from inside that team, but has no merge/deploy authority and cannot be overruled by Builder's conclusions. |
| **Verifier** | Independent testing, regression, and operational-proof agent. Confirms whether evidence actually proves claimed behavior works; distinguishes compilation from correctness; verifies data behavior on safe samples; confirms tested code matches the claimed branch/commit. | **Independent of Builder/Reviewer** — also a Build-team member, providing a second independent check from inside the team; no merge/deploy authority. |
| **Steward** | Data-integrity and integration-governance agent. Protects operational truth across Supabase, Smartsheet, MenuWorks, imports, browser caching, APIs, identifiers, and reconstructed records (source authority, dedup/normalization, precedence, stale-data/fallback behavior, rollback/recovery). | — |
| **Operator** | Culinary-operations and product-workflow reviewer. Evaluates whether workflows make operational sense, preserves recognizable tool names/UX, flags missing operational safeguards, checks terminology against user expectations. | Does not write implementation code; does not approve redesigns for looks alone; does not create culinary rules without Registered Admin approval or an authoritative source. |
| **Scribe** | Durable-memory and documentation agent (this agent). Maintains this file, [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md), [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md), `AI_HANDOFF.md`, [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md), [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md), and `CHANGELOG.md` (per repository policy). Records decisions and rejected alternatives; distinguishes current state from proposals. | Does not change application code. |
| **Release** | Release-control, deployment-evidence, and rollback agent. Distinguishes implementation from release; verifies merge/version/changelog readiness before deploy; collects deployment identifiers; verifies production behavior; preserves rollback evidence. Reports exact release state: `ANALYZED → ... → LIVE` / `ROLLED BACK` / `RELEASE FAILED`. | **No merge/deploy without explicit Release-Authorized Admin approval.** Will not release while Reviewer or Verifier have unresolved blocking findings. Will not claim "live" without production verification. |

## Agent Teams (6)

Membership below is as audited and confirmed by Chief on 2026-07-25 against each agent's self-reported permanent-prompt team list; every self-report matched exactly.

| Team | Members | Purpose |
|---|---|---|
| **Council** | Scout, Architect, Reviewer, Steward, Operator, Scribe | Cross-functional advisory group: investigation, design, review, data-integrity, operations, and documentation perspectives feed into mission scoping and the governance audit process. Not a merge/deploy path. |
| **Triage** | Scout, Steward, Operator | First-look group for incoming issues: root-cause investigation, data/integration integrity, and operational-workflow sanity before a mission is scoped for Build. |
| **Build** | Architect, Builder, Reviewer, Verifier | The implementation path: design → build → independent review → independent verification. |
| **Data Guard** | Scout, Builder, Reviewer, Verifier, Steward | Missions touching shared data (Supabase/Smartsheet/MenuWorks/imports/caching) — Steward's domain, backed by the same build/review/verify path as Build. |
| **Product Change** | Architect, Builder, Reviewer, Verifier, Operator, Scribe | User-facing product changes: design, build, review, verify, operational-workflow check, and documentation update land together. |
| **Release Gate** | Reviewer, Verifier, Scribe, Release | The only path to merge/deploy. Requires Reviewer's verdict and Verifier's proof before Release will act, and Release still requires a Release-Authorized Admin regardless of gate status. |

## Legacy Agents — Fizz, Bumble, Honey

Fizz, Bumble, and Honey remain members of the Culinary Tools Project channel but are not among the 9 permanent workers above and hold no permanent role prompt on record. Per project history, they were the pre-reorg default coding/testing agents, phased out in favor of Builder/Verifier during the 2026-07-24 reorg. As of the 2026-07-25 audit, none of the three responded to a direct roll call and none show recent presence or activity; no evidence exists of them performing governance, data, review, or release work since the reorg.

**Status: inactive, undecided.** No Registered Admin decision has been made to formally decommission or re-activate them. Do not assign governance, data, review, or release work to Fizz, Bumble, or Honey unless and until a Registered Admin makes and records that decision here.

## Legacy Language

`OTHER_CODEX_MASTER_PROMPT.md` (pre-reorg onboarding script) contained "Final response format requested by Tyler" — an individual's name used as the basis for a formatting rule meant for any future session. This is the only person-hard-coded governance-adjacent language found during the 2026-07-25 audit; no current agent's self-reported permanent prompt names an individual as sole authority. The file has been marked historical/deprecated rather than edited in place — see its header note. See [Legacy Agents](#legacy-agents--fizz-bumble-honey) above for the unrelated Fizz/Bumble/Honey status.

## Reading Order

New agents and Registered Admins should read, in order: this file → [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md) → [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) → [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md) → [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md) → `AI_HANDOFF.md` → `CHANGELOG.md`. See `AGENTS.md` for the full entry point.
