# Commissary cutoff exception - October 29, 2026

Owner: Chief. Branch: `chief/commissary-cutoff-exception`.
Requesting / Release-Authorized Admin: Tyler, authenticated identity verified against ADMIN_REGISTRY.md.
Authority: Buzz event `c57d644dd0f1ced70681453e0570970f3b03692454a7ebe64eb1717ff4295ab2` in Culinary Tools Project.
Baseline / rollback: `40079c3a54b0de40253e3b7b12afdf2e40e3c526`.
Version: `2026.10.29.003-commissary-cutoff-exception`.

## Scope and behavior

Only service week 2026-11-02 (November 2-6) uses Thursday October 29, 2026 at 17:00 America/Los_Angeles, or 2026-10-30T00:00:00Z. All other weeks keep prior Wednesday at 17:00 Pacific. November 9-13 therefore closes November 4 at 17:00 PST, or 2026-11-05T01:00:00Z. The shared model drives browser availability, API order-write validation, first open week, order cutoff snapshots and prep eligibility. The actual weekday appears in the cutoff banner. A one-second timer refreshes an already-open tab; server time remains authoritative on every write. No background agent or later cleanup deployment is required to close the exception.

No operational records are rewritten. No schema, source authority, order quantities, cost, item, MRN, cafe, delivery, export or metadata contract changes. Verification never writes production orders, prep progress or canonical SSMT.

## Verification and review

Boundary tests failed before implementation for the missing exception, then passed 3/3. They cover the exact exception instant, next-week DST boundary and direct API validator calls with an isolated mocked clock. Browser acceptance adds already-open-tab cutoff and subsequent-week label checks with all storage intercepted. Full package verification and complete Commissary browser suite are required before release.

Independent risk review: review_cutoff agent, APPROVED WITH NON-BLOCKING NOTES over baseline plus working diff; independently ran 3/3 cutoff tests and diff whitespace check. Minor document punctuation corrected. Chief owns release verification.

## Rollback

Revert this scoped commit to restore baseline Wednesday-only behavior; this would immediately close November 2 orders after the original Wednesday deadline. No production data restoration is necessary because release performs no data migration or writes. Preserve any legitimate orders saved during the authorized window.

## Release evidence

Full `npm run verify` passed (including production build); isolated model/server tests passed 3/3. Initial browser run passed 6/7: new test used a shortened delivery label, while its screenshot showed the intended control already disabled. Corrected selector to the actual existing accessible label and reran the complete Commissary suite. Complete Commissary browser acceptance passed 7/7 after correction. Production acceptance pending.
