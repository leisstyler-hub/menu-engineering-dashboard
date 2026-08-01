# Mission Template

The standard structure Chief uses to assign work to permanent workers (see [GOVERNANCE.md](GOVERNANCE.md) for roster/teams). Reproduced here from Chief's own mission-assignment format so the structure survives outside conversation history. Maintained by Scribe; if Chief's actual practice changes, update this file to match — don't let this file drift into an aspirational template nobody follows.

Every mission assignment should fill in the fields below. Omit a field only if it genuinely does not apply (e.g., `DATA RISKS: None`), not by leaving it blank.

```
MISSION TITLE:
REQUESTING ADMIN:            (who originated the request — see GOVERNANCE.md § Admin Roles)
ADMIN OF RECORD:             (who explicitly approved this scope, and when)
OBJECTIVE:                   (what this mission closes or delivers)
BUSINESS REASON:             (why it matters, in plain terms)
CURRENT OBSERVED BEHAVIOR:   (what's true today — cite sources, don't assume)
DESIRED BEHAVIOR:            (what should be true after the mission)
REQUEST CLASSIFICATION:      (see note below — level taxonomy is not yet fully defined)
SELECTED AGENT TEAM:         (one of: Council, Triage, Build, Data Guard, Product Change, Release Gate — or a named subset)
INDIVIDUAL AGENT ASSIGNMENTS:
APPROVED SCOPE:
LIKELY FILES:
EXPLICITLY OUT OF SCOPE:
PROTECTED PRODUCT AREAS:
SOURCE-OF-TRUTH RULES:       (link ARCHITECTURE_RULES.md rather than restating)
DATA RISKS:
FILE/DOMAIN OWNERSHIP:
WORK SEQUENCE:
STOP CONDITIONS:             (when the assigned agent must pause and ask Chief rather than infer)
ACCEPTANCE CRITERIA:
REQUIRED TESTS:
REQUIRED REVIEWERS:
DOCUMENTATION REQUIREMENTS:
ROLLBACK APPROACH:
MERGE AUTHORITY:             (granted, not granted, or deploy-intended by default under GOVERNANCE.md; Builder never has this)
DEPLOYMENT AUTHORITY:        (granted, not granted, or deploy-intended by default; requires Release-Authorized Admin authority)
REQUIRED FINAL REPORT:       (what the assignee must report back, and to whom)
```

## Notes

- **REQUEST CLASSIFICATION** - one level has been used standalone on record: `Level 1 - Investigation/Documentation` (no application code change, no visible behavior change). On 2026-07-26 a Registered Admin (Tyler) approved a coarse two-band split for routing purposes. On 2026-08-01 Tyler approved a streamlined [Micro-Fix Lane](GOVERNANCE.md#micro-fix-lane) for tiny, well-understood presentation, formatter, test-only, and documentation/process changes. Do not invent finer distinctions here; add them once Chief/a Registered Admin actually defines and uses them.
- **MERGE AUTHORITY / DEPLOYMENT AUTHORITY** - for ordinary app changes requested by a Release-Authorized Admin, default to `deploy-intended by default` unless the request says `do not deploy`, `local only`, or `investigate only`. For non-Release-Authorized requesters, high-risk production data/schema/destructive actions, conflicting admin instructions, failed review/verification, dirty/widened scope, or tooling/credential blockers, default to `not granted` and stop for Chief/admin resolution. Deployment authority requires Release-Authorized Admin authority per [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md).
- **STOP CONDITIONS** should always include: stop and ask Chief before inventing an approval, date, or decision not already established in-thread or in existing repo files.
