# Experience Rows Implementation Plan

Goal: Implement Tyler-approved vertical review rows with stable information columns, outlined submenus and divider headings.
Architecture: Presentation only in SsmtExperienceReview.jsx; retain callbacks, exact values, role validation and shared save behavior. Reuse the existing worktree chief/ssmt-aus-bna, base 4cfb35b. Owner Chief, solo execution authorized by event 530e5603df71a0ae68abfec746f355487a1004bc1b53c00f7a63235575060106.
Tech Stack: React, Tailwind, Playwright.
Spec: Approved thread e67f63fee3e9f793303b58bc638bd6eefa94b1bca5221a0d63dfe27b14846289.

## Constraints and review focus
Preserve menu order, exact MRNs, descriptions, flags, modifier references, workflow locks, and role protections. No production data writes. Cover pre-divider items, consecutive/empty groups, missing metadata, mobile overflow and selected-menu copy.

## Task 1: Review rows
- [x] Add browser fixture with leading items, submenu and divider rows, empty sections; assert headings, membership, aligned desktop columns, phone containment, description save and divider preservation.
- [x] Run test and confirm missing layout fails.
- [x] Implement named submenu sections containing a semantic table with common colgroup; divider rows span columns. Keep modifier expansion within its column. Provide horizontally scrollable table on phones without page overflow.
- [x] Run complete account browser suite and full pnpm verify; inspect screenshots, self-review, update version/changelog/handoff.
- [x] Commit, post Changelog, publish through governed script, confirm exact production SHA/READY, run isolated live browser suite; report rollback and evidence.

Completed: application 26ab9be, production dpl_CHWcDjwn1NzCTwEWn8ddFStYAda4 READY, production Experience 10/10. Local 70/71 with pre-existing public-calendar preview failure also reproduced before release on production. Full committed verify/build passed. Solo self-review, no production operational writes.
