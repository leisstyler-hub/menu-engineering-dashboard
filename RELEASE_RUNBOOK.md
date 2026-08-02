# Release Runbook

Governs how a change moves from "implemented" to "live" for the Culinary Tools Platform, and who is allowed to make that happen. Maintained by Scribe. For the mechanical publish commands (scripts, credentials, repair steps), see `docs/DEPLOYMENT.md` and `AI_HANDOFF.md` — this file does not repeat those, it governs the authority and sequencing around them.

## Who Is Involved

Per [GOVERNANCE.md](GOVERNANCE.md), the **Release Gate** team is the only path to merge/deploy: Reviewer, Verifier, Scribe, Release.

- **Builder** implements. Builder cannot merge, publish, or deploy, and cannot self-approve its own work.
- **Reviewer** issues an independent verdict on the diff: `APPROVED` / `APPROVED WITH NON-BLOCKING NOTES` / `CHANGES REQUIRED` / `BLOCKED — PRODUCT DECISION REQUIRED` / `BLOCKED — DATA OR RELEASE RISK`.
- **Verifier** independently confirms the evidence actually proves the claimed behavior (tests were run, not just written; the tested code matches the claimed branch/commit).
- **Release** will not merge or deploy while Reviewer or Verifier has an unresolved blocking finding, will not claim a change is `LIVE` without production verification, and will honor deploy-intended authority for ordinary app changes requested by a Release-Authorized Admin unless the request or a stop condition says otherwise.
- **Scribe** independently confirms that durable records and deployed evidence reconcile before Release posts a final admin-facing `LIVE` result. Scribe's detailed record-checking may stay in a working thread, but silence is never sign-off: before Release closes an admin-facing result as `LIVE`, Scribe must provide one short affirmative confirmation that is either surfaced directly in the admin-facing thread or quoted/linked by Release in the final admin-facing result. If Scribe finds a blocker, that blocker must surface before Release closes the admin-facing thread as `LIVE`.
- **Release-Authorized Admin** - a human whose authority is required before Release merges or deploys. For ordinary app changes requested by a Release-Authorized Admin, that request is deploy-intended by default and does not require a second `deploy` message after review/verification. Explicit per-action approval is still required for high-risk production data/schema/destructive work or source-authority changes. See [GOVERNANCE.md](GOVERNANCE.md) Admin Roles and Default Deployment Intent.

This repository auto-deploys to Vercel on any push to `main` — a merge to `main` and a production deploy are effectively the same event here, which is why merge authority and deployment authority are both gated on a Release-Authorized Admin.

Default deployment intent is designed to prevent stalled completed work: when a Release-Authorized Admin asks for an ordinary app fix or feature, Release Gate should proceed through merge/deploy/live verification after the review and verification gates pass. Stop instead of deploying only for explicit no-deploy/local/investigate-only scope, failed gates, dirty or widened scope, credential/tooling failure, conflicting admin instruction, data/schema/destructive production risk, source-authority change, or production-data change.

## Admin-Facing Thread Discipline

For deploy-intended releases, Release owns the admin-facing thread once publish work begins.

- Release posts exactly one final result message to the admin-facing thread: exact release state (`LIVE`, or the current blocking state), links (live app, Vercel project, GitHub repo, and Supabase dashboard when relevant), commit/version, production checks, rollback path, and any real remaining operational risk.
- Release may post interim checkpoints only when a Release-Authorized Admin or Chief explicitly asks for status mid-flight.
- Chief does not post a second final deploy summary after Release's final report.
- Reviewer, Verifier, and Scribe keep per-commit verdict detail, sign-off detail, and docs-only cleanup chatter in the working thread unless a blocker requires action from Chief or a Release-Authorized Admin. The one exception is Scribe's short affirmative `LIVE` confirmation, which must still be surfaced in or quoted by Release from the admin-facing thread before `LIVE` is closed out.

## Release State Machine

Release reports the exact state of a change, in this progression:

```
ANALYZED → ... → LIVE
                → ROLLED BACK
                → RELEASE FAILED
```

`ANALYZED` means Release has reviewed the diff, version stamp, and changelog readiness but has not acted. Intermediate states (e.g., merged-but-not-yet-verified) are reported honestly rather than rounded up to `LIVE`. `LIVE` is only reported after production verification — not after a push, not after a green CI run.

Release may not post a final admin-facing `LIVE` result until Scribe has independently cleared the durable records against the deployed evidence and that clearance has been surfaced explicitly for the admin-facing thread. The detailed Scribe check may stay in the working thread, but Release's final admin-facing `LIVE` result must include or directly reference Scribe's short affirmative confirmation. If Scribe finds a blocker, the exact blocker must surface before Release closes the admin-facing thread as `LIVE`.

## Sequence

1. Builder completes implementation and hands the diff to Reviewer with exact verification commands and expected behavior. For any change that alters visible or user-facing behavior, including a small config-only move, the first implementation commit must already include a direct automated test that exercises the actual acceptance criterion.
2. Reviewer issues a verdict. Anything other than `APPROVED` or `APPROVED WITH NON-BLOCKING NOTES` stops the sequence here. For visible or user-facing changes, Reviewer explicitly confirms that the direct automated acceptance test exists and proves the requested behavior before approving.
3. Verifier independently reproduces the verification and confirms it matches the claimed commit/branch.
4. In parallel with Reviewer/Verifier gate work, Scribe reconciles `AI_HANDOFF.md`'s current release version line and current process-update paragraph against the release candidate's actual state. A stale handoff record must never be discovered for the first time only at final `LIVE` sign-off.
5. Release checks merge/version/changelog readiness (see Version Stamp and Publish Protocol in `AI_HANDOFF.md`), confirms the acceptance proof was cleared for visible changes, collects deployment identifiers, and confirms Release-Authorized Admin authority: either explicit per-action approval or deploy-intended-by-default authority for an ordinary app change requested by a Release-Authorized Admin.
6. Release merges/deploys, verifies production behavior, and prepares the single final admin-facing result required above.
7. If Scribe has independently cleared durable-record reconciliation, surfaced the short affirmative confirmation for the admin-facing closeout, and production behavior matches expectations, Release closes the admin-facing thread with the final result. If production behavior or record reconciliation fails, Release reports the current blocking state or rolls back with evidence rather than leaving the state ambiguous.

## Verification Requirements

Carried forward unchanged from `AI_HANDOFF.md` (do not restate the mechanics here, link instead):

- For any change that alters visible or user-facing behavior, the first implementation commit must include one direct automated acceptance test for the actual requested behavior. A config/text-match integrity check by itself is insufficient, and adjacent suites that never exercise the changed behavior do not satisfy this requirement.
- Minimum: `pnpm run verify`.
- Neighborhood Rotations changes additionally require the Playwright specs listed in `AI_HANDOFF.md` § Verification Protocol Before Publish, both locally and against the live Vercel URL after publish.
- Other tools (Menu Projects, Menu Library, Menu Audit, Lean) require their matching Playwright specs and release guards; if no matching test exists, one must be added before the change is claimed safe.

## Prepared Candidate Workspace

Builder, Reviewer, and Verifier should reuse one worktree per active release candidate, owned by the current session identity, with dependencies and Playwright browsers already installed before the lane is treated as ready. Do not create replacement worktrees mid-mission unless the candidate is unrecoverable or Chief explicitly reroutes the work. Ownership mismatches, missing dependencies, or missing browsers are setup defects to resolve before claiming the release candidate is ready; they are not acceptable recurring release friction.

## Rollback

Default approach: revert the branch/commit. Release preserves rollback evidence (what was reverted, when, and the verification that triggered it) as part of its final report — this is not optional cleanup, it's part of the release record.

## Release Final Report Requirements

Release's single final admin-facing result includes:

- exact release state
- links to the live app, Vercel project, GitHub repo, and Supabase dashboard when relevant
- app commit, any docs-only follow-up commit if separate, visible version, and live asset path when relevant
- production checks run and their results
- rollback path
- any real remaining operational risk

Every final result also includes a timing block with:

- request received
- Chief pickup or mission assignment
- first implementation commit
- Reviewer and Verifier clear
- publish start
- push/live-visible
- production verification complete
- docs reconciliation / `LIVE` sign-off complete, if applicable
- total elapsed
- avoidable or redundant delays

## Docs-Only Releases

A documentation-only change (like this file) still goes through Release Gate for the actual merge/deploy decision, even though `REQUIRED TESTS` may be `N/A` per [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md). Docs-only publishing can skip the app verification suite (`-SkipVerify -SkipVercelWait` per `docs/DEPLOYMENT.md`) but still requires the same merge/deployment authority as any other change.
