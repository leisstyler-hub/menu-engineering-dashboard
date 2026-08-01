# Release Runbook

Governs how a change moves from "implemented" to "live" for the Culinary Tools Platform, and who is allowed to make that happen. Maintained by Scribe. For the mechanical publish commands (scripts, credentials, repair steps), see `docs/DEPLOYMENT.md` and `AI_HANDOFF.md` — this file does not repeat those, it governs the authority and sequencing around them.

## Who Is Involved

Per [GOVERNANCE.md](GOVERNANCE.md), the **Release Gate** team is the only path to merge/deploy: Reviewer, Verifier, Scribe, Release.

- **Builder** implements. Builder cannot merge, publish, or deploy, and cannot self-approve its own work.
- **Reviewer** issues an independent verdict on the diff: `APPROVED` / `APPROVED WITH NON-BLOCKING NOTES` / `CHANGES REQUIRED` / `BLOCKED — PRODUCT DECISION REQUIRED` / `BLOCKED — DATA OR RELEASE RISK`.
- **Verifier** independently confirms the evidence actually proves the claimed behavior (tests were run, not just written; the tested code matches the claimed branch/commit).
- **Release** will not merge or deploy while Reviewer or Verifier has an unresolved blocking finding, will not claim a change is `LIVE` without production verification, and will honor deploy-intended authority for ordinary app changes requested by a Release-Authorized Admin unless the request or a stop condition says otherwise.
- **Scribe** independently confirms every report that declares release state `LIVE`, posted in the same thread as that report — checked against `CHANGELOG.md`/`AI_HANDOFF.md` and the production evidence already gathered (or reproduced independently, e.g. live asset/version checks). This is separate from, and in addition to, Reviewer's pre-merge verdict and Verifier's pre-merge proof — it applies to the `LIVE` declaration itself, not the diff.
- **Release-Authorized Admin** - a human whose authority is required before Release merges or deploys. For ordinary app changes requested by a Release-Authorized Admin, that request is deploy-intended by default and does not require a second `deploy` message after review/verification. Explicit per-action approval is still required for high-risk production data/schema/destructive work or source-authority changes. See [GOVERNANCE.md](GOVERNANCE.md) Admin Roles and Default Deployment Intent.

This repository auto-deploys to Vercel on any push to `main` — a merge to `main` and a production deploy are effectively the same event here, which is why merge authority and deployment authority are both gated on a Release-Authorized Admin.

Default deployment intent is designed to prevent stalled completed work: when a Release-Authorized Admin asks for an ordinary app fix or feature, Release Gate should proceed through merge/deploy/live verification after the review and verification gates pass. Stop instead of deploying only for explicit no-deploy/local/investigate-only scope, failed gates, dirty or widened scope, credential/tooling failure, conflicting admin instruction, data/schema/destructive production risk, source-authority change, or production-data change.

## Release State Machine

Release reports the exact state of a change, in this progression:

```
ANALYZED → ... → LIVE
                → ROLLED BACK
                → RELEASE FAILED
```

`ANALYZED` means Release has reviewed the diff, version stamp, and changelog readiness but has not acted. Intermediate states (e.g., merged-but-not-yet-verified) are reported honestly rather than rounded up to `LIVE`. `LIVE` is only reported after production verification — not after a push, not after a green CI run.

A report declaring `LIVE` is incomplete until Scribe has posted its own independent sign-off in that same thread (see Scribe's row under Who Is Involved). Release treats a `LIVE` report without that sign-off as still `ANALYZED`/pending for reporting purposes, even if production has, in fact, been verified.

## Sequence

1. Builder completes implementation, hands the diff to Reviewer with exact verification commands and expected behavior.
2. Reviewer issues a verdict. Anything other than `APPROVED` or `APPROVED WITH NON-BLOCKING NOTES` stops the sequence here.
3. Verifier independently reproduces the verification and confirms it matches the claimed commit/branch.
4. Release checks merge/version/changelog readiness (see Version Stamp and Publish Protocol in `AI_HANDOFF.md`), collects deployment identifiers, and confirms Release-Authorized Admin authority: either explicit per-action approval or deploy-intended-by-default authority for an ordinary app change requested by a Release-Authorized Admin.
5. Release merges/deploys, verifies production behavior, and reports state per the state machine above.
6. Scribe independently confirms the `LIVE` declaration in the same thread before the report is considered complete (see Who Is Involved).
7. If production behavior doesn't match expectations, Release rolls back and reports `ROLLED BACK` with the evidence, rather than leaving the state ambiguous.

## Verification Requirements

Carried forward unchanged from `AI_HANDOFF.md` (do not restate the mechanics here, link instead):

- Minimum: `pnpm run verify`.
- Neighborhood Rotations changes additionally require the Playwright specs listed in `AI_HANDOFF.md` § Verification Protocol Before Publish, both locally and against the live Vercel URL after publish.
- Other tools (Menu Projects, Menu Library, Menu Audit, Lean) require their matching Playwright specs and release guards; if no matching test exists, one must be added before the change is claimed safe.

## Rollback

Default approach: revert the branch/commit. Release preserves rollback evidence (what was reverted, when, and the verification that triggered it) as part of its final report — this is not optional cleanup, it's part of the release record.

## Docs-Only Releases

A documentation-only change (like this file) still goes through Release Gate for the actual merge/deploy decision, even though `REQUIRED TESTS` may be `N/A` per [MISSION_TEMPLATE.md](MISSION_TEMPLATE.md). Docs-only publishing can skip the app verification suite (`-SkipVerify -SkipVercelWait` per `docs/DEPLOYMENT.md`) but still requires the same merge/deployment authority as any other change.
