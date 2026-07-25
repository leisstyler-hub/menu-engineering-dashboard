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
MERGE AUTHORITY:             (granted or not — see GOVERNANCE.md; Builder never has this)
DEPLOYMENT AUTHORITY:        (granted or not — requires a Release-Authorized Admin)
REQUIRED FINAL REPORT:       (what the assignee must report back, and to whom)
```

## Notes

- **REQUEST CLASSIFICATION** — only one classification level has been used on record so far: `Level 1 — Investigation/Documentation` (no application code change, no visible behavior change). A fuller level taxonomy (e.g., for code changes, data migrations, or releases) has not yet been defined by a Registered Admin. Do not invent additional levels here; add them to this note once Chief/a Registered Admin actually defines and uses one.
- **MERGE AUTHORITY / DEPLOYMENT AUTHORITY** — default to none granted. A mission that needs either must say so explicitly, and deployment authority additionally requires a named Release-Authorized Admin per [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md).
- **STOP CONDITIONS** should always include: stop and ask Chief before inventing an approval, date, or decision not already established in-thread or in existing repo files.
