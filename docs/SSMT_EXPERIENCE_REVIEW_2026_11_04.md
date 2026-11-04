# SSMT Experience Review

Tyler requests 75be8884da3eeab22eb7d13301bd188a4daa5fe402a9851517bd37f5b5d8ebee, 49619e55b912baada8f73eb85f5d86cc16184dbe453e88d81a39f3b4a3bc5702 and 7f1f35c18d950cb5d51564a2c8f3f5224e102703a6073f78b00829c0976b0e59 define the scope. Chief owns the existing chief/ssmt-aus-bna worktree; baseline b49ba2de7cf7b3b9aef33ab5b4634de73569c635. Current production baseline is READY dpl_4N2ooGVfCt57AipWBeATSNFDhuvs; the previous pricing release and its data audit remain intact.

## Behavior

Experience edits the same menu item description saved through the existing authenticated shared-workspace path. Dietary preference, calories and linked modifier choices are read-only. Missing values remain explicitly unavailable; no dietary or calorie inference is added. Copy All copies the selected menu and its current descriptions, exact MRNs, recorded diet/calories and linked modifier choices, with a selectable manual fallback when clipboard permission fails. No text is sent automatically to an AI or spelling service.

Native English browser spellcheck is enabled by default and can be toggled. The screen explains how to obtain corrections and enable spelling in the browser/keyboard. Native dictionary correctness and suggestion UI are platform behavior, not asserted by headless tests.

Existing Culinary locks and one-step phase transitions are preserved. The stage button explicitly names its destination. Saved records, exact MRNs, modifiers, pricing, histories and permission validation use unchanged code paths. No production operational data mutation or migration is part of this release.

## Evidence

The direct acceptance test first failed on missing spellcheck configuration. A later test exposed the mobile navigation covering the stage button; additional bottom clearance corrected it. Final isolated account/Experience suite passes 22/22, including save/reload into Chef view, IT-stage save, recorded diet/calories, modifier details, clipboard content/exclusion, fallback and phone width. Desktop/phone screenshots were reviewed. Full repository gate and deployed evidence are recorded in workspace WORK_LOGS/SSMT_EXPERIENCE_2026_11_04, with exact exit codes and subsequent release result. All account/storage requests in this suite are intercepted; no canonical production test writes are permitted.

Fresh solo review: verified restricted component callbacks, unchanged server allowlist and revision-guarded save path, zero/blank calorie handling, exact MRNs, divider exclusion, stage readiness, disabled complete-stage handoff and clipboard fallback. No independent review claimed; routine UI scope introduces no permission/schema/source change. Production state is reported only after deployment and acceptance proof.

## Recovery

Revert the application commit through the governed publication path, or restore baseline deployment dpl_4N2ooGVfCt57AipWBeATSNFDhuvs. No data rollback is needed because this release changes no operational records. Do not restore the whole workspace over subsequent user edits.
