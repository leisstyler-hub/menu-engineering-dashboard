# Experience flag access implementation plan

Goal: Give Experience the existing item flagging and report controls, as Tyler clarified in ee6b0eb3bd1e0186f8e160b913d0c24a407b59913eb179ee172f5a4581fcb892.
Architecture: Reuse SsmtTool flag callbacks/dialogs in SsmtExperienceReview. Narrowly extend validateExperienceChange for existing flags/editSignal and flag status. Preserve current phase behavior and all other permission restrictions.

- [x] Add failing permission tests and browser save/reload acceptance.
- [x] Reuse existing flag controls/dialogs/report link; permit validated flag operations only.
- [x] Run full package verification and account/Experience browser suite, independent permission review, update version/changelog/handoff.
- [x] Publish under Tyler routine release authority, verify production with intercepted data and report exact state/recovery.

Review focus: altered MRNs/prices/modifiers remain denied; malformed flags denied; save failure/revision guard unchanged; edit/clear uses existing behavior; builder visibility after reload. No production workspace test writes.

Verification: full pnpm verify/build passed after pinning the existing historical Commissary availability assertion to its fixture clock (node:test Date mock with finally reset). Local account/Experience browser suite passed 24/24. Independent permission review APPROVED; reviewer inspected diff without rerunning tests. Browser proof covers create/edit/clear/recreate/save and builder reload visibility. Prior failing runs are retained in workspace WORK_LOGS/SSMT_FLAGS_*.log.

LIVE app e4e95b59f35f8f0915396d8ade45fa393d2f13b1, READY dpl_F4yghsjctXGB8NCxoWRB6SfSLX24; canonical /assets/index-eAkL58Py.js has the exact version. Production account/Experience suite passed 24/24 with API/storage interception. No operational data changed. Rollback 5d06163744d897546022ebfe6c1cced88c1ab4af / dpl_A132RKwFqrVqQELW1d7Yi7Py1y7s.
