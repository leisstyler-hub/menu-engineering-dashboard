# Pairwise expansion release

Candidate 4911b8a independently approved by Reviewer and cleared by Verifier with full npm run verify and 17/17 Chromium browser checks. Both selection orders, 1366x768, 1440x900, 390x844, 1920x1080, 2560x1440, resize across 1536px, visible data cells, matrix/detail scrolling, Restore/Escape, inert containment and body cleanup passed. Prior focus leak and matrix-collapse defects corrected before release.

Deploy authorization: Tyler event bb3fe9ef00c100bf4a5b141c04c2a6e87c0385f75d15f3901044c344b9014c8f; solo takeover 8b8e9e22b40bf1251c32934d7655cb082b7780f42cf725630e686c8ce40245e9. Existing independent gates retained; final release/docs handled by Chief alone. No independent Scribe final sign-off claimed. Firefox/WebKit and physical mobile devices not tested.

Rollback: restore production f47bdf6 / deployment dpl_yzx362zYvnxwPJMc52XFfeSUbH8H. No operational data/schema/source changes. Prior detailed evidence: Buzz WORK_LOGS/pairwise-matrix-squeeze-fix_2026_10_22/EVIDENCE.md.
