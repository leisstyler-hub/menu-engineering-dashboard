# SSMT openings, assignments and rotation

Authority: Tyler, Culinary Tools Project SSMT thread `5979fb8fd92f99351ed087c5ffecbbd603062ce90439aa8c46386ee303e29564`. Scope/clarifications: `589e7d93081f86a170c6af80b70f5894601a65971784c15d05cc47af2993a13b`, `f36dcafef276d2d15d3f5e838d77455e202faca03489725f9159e287b7e27123`, `8914543d622ac2148622140d2f511e5a77d60ddd5e9908ad9880845c2a3bf807`. Begin editing: `58a58921190af7de332d60f96096076ae773f43fc8b5c21c6e61fc750ad20e2b`. Preserve data: `2df6ca46d44e2f44300725a9136dfed16bbe70efe939727cd4177aa02cca5656`.

## Workflow

- New Unit Openings is a menu type/bucket. Each opening has named stations with its own FIXY designation. Select one station to add items or import from another menu; the existing import preview checks duplicates and modifier links. The station FIXY checkbox starts checked. Unchecking preserves incoming FIXY. Source menus remain unchanged.
- Rows remain in their existing `menu.items` array. `stationId` adds membership; orphan/unassigned rows remain accessible. Station setup does not move, rewrite or discard existing rows. Menu Library integration is deferred.
- Weeks 1-6 are optional item memberships. No weeks means core/all weeks. A week view shows core plus that week's items. The builder does not truncate after 80 rows.
- Global participation stores menu references with exact item/revision snapshots, not copied builder rows. Readiness and clean review include those snapshots. Later source changes are flagged; reselecting refreshes the snapshot. Server validation rejects fabricated snapshot contents.
- Admin Menu Assignments creates menus with active registered co-owners, lead owner and due date. Assignment groups are Promotion, New Unit Openings, Thompson Hospitality, Global, Core. Personal assignment buckets persist across phases. Flag email drafts include every owner; the user still sends the email.
- Phase history appends transitions with actor and timestamp; existing phase timestamps are retained. Assignment history and first-assigned time remain available in assignment details.
- Experience can edit descriptions, item names, labels, FIXY names and menu/station FIXY designation. It can return an Experience menu to Draft without removing ownership. MRNs, pricing, station structure and assignments remain outside Experience's edit permission.
- Clean Review Menu has station/week selection, print and authenticated full-menu revision approval for admins/Experience. Reading is available to existing SSMT members; this adds no anonymous access. Approvals retain actor/time/content evidence. Changes to attached modifiers invalidate the menu approval without resetting the item's culinary review status.
- Hibernated menus open in a popup. Restore preserves historical dates.

## Review evidence and preservation

Review status and signage completeness are separate. Calories of zero are valid; missing calories, label, FIXY or MRN remain visible. New items need review. Exact MRN edits set a sticky re-review marker, including changing back to the old MRN. Modifiers do not reset item review. Existing description-based re-review rules remain.

The existing-item baseline does **not** run on load or deployment. An admin must explicitly choose the exact Winter Promo exclusion and confirm the reviewed baseline. The dedicated endpoint uses the current revision and existing atomic backup/audit RPC, adds review metadata, and preserves all existing item values. It records when the baseline was attested; it does not manufacture historical reviewer identities or review dates. Ordinary saves cannot inject or remove baseline authority or approvals.

Read-only production snapshot at workspace revision `30dcbda542b90a29a84975079421c9c2c8cd166130edb52c8384feb8716d6541`: 92 menus and 2,423 total rows. The only winter-named candidate is `Winter Menu Collection`, id `menu-winter-menu-collection-b1c4d8ae-87e5-4f1d-a191-a29400d9d954`, 25 rows. Initialization has not been performed. The private snapshot is in workspace `WORK_LOGS/SSMT_OPENING_LIVE_BEFORE_2026_11_19.json`, outside git.

No schema migration, production test writes, operational resets/reseeds/deletions or shared culinary-profile updates are part of implementation. The canonical workspace id, gzip encoding, conflict guard, atomic backups and append-only audit mechanism remain intact.

## Export limits

Centric export requires selecting one station and, where rotation exists, one week. Global-reference station export is visibly blocked pending its Centric mapping validation; Clean Review can still print the complete station including Global participation. Workbook generation does not prove Centric import acceptance. The separately prepared Centric compatibility candidate is not silently merged into this change.

## Checks and release

Chief implemented and tested; independent risk review cleared the recorded source/provenance, baseline, approval, phase-history and MRN-invalidation findings. Model/API tests use isolated fixtures and fake network responses. Browser workflows intercept storage and SSMT endpoints. No live saves are used for acceptance.

Initial acceptance: 42/42 account/opening browser workflows passed. Broader browser failures for the legacy Promotion layout, ambiguous flag-email text locator and hibernated Menu Audit navigation reproduced on unchanged `f2d1743`. Current release checks and exact commit/deployment evidence are tracked in workspace `WORK_LOGS/SSMT_UNIT_OPENINGS_2026_11_19.md`.

Application rollback baseline: `f2d1743b74c5d0c794d099605e6a124368907b01`, production `dpl_BrxrLbxiQufCZVVbMR4cYkwNwc6U`. This is an application rollback, not data restoration. Added metadata remains in saved records; a data change requires its own fresh revision guard and verified recovery evidence.
