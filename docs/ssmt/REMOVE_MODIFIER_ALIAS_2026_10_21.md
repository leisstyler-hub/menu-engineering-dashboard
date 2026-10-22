# Modifier search alias removal - 2026-10-21

Requesting / Approving / Release-Authorized Admin: Tyler, authenticated Buzz identity 12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d. Authority: event 1f92341e601165ba0bad13852d4c84eb6637c5f508f58ed8fc0fdab1c48fcff2, 2026-10-22T04:34:07Z: solo removal and deploy, preserve other data.

Bounded user-visible removal: remove Shared search alias editor and alias display/search from modifier loader. Search uses modifier group names. Existing alias properties are retained as inert legacy data; no data migration or production records are deleted or rewritten. Menus, items, modifier choices, names, MRNs, prices, relationships, permissions, storage and schema code remain unchanged.

Chief executes implementation, self-review, verification, documentation and release solo per explicit instruction. No independent Reviewer/Verifier/Scribe clearance is claimed. State: IMPLEMENTED, verification in progress. Version: 2026.10.21.004-ssmt-remove-alias. Baseline/rollback: faf9070, prior production dpl_H9fhy2AotthBEPiBqktNN6BSmQAv. Roll back by reverting the application change and publishing under the deployment runbook; no data restore is needed because no production data mutation is performed.

Acceptance: no alias input or alias display/search; name-based loading and selection still work; save retains source modifier group and source menu exactly and retains prices. Browser tests intercept all SSMT/storage requests, never mutate production records. Full npm run verify plus affected browser suites required before publish. Production checks must exercise deployed assets and isolated SSMT workflow; real authenticated-user acceptance is not claimed.

## Local verification

Full npm run verify passed (20 server/domain tests, all package guards, production build). All affected Chromium suites passed: accounts/reuse 14/14, layout/recovery/tool 36/36. Direct acceptance test also failed against preceding production bundle and passed locally, demonstrating regression sensitivity. One initial test assertion counted the unrelated allow-duplicates checkbox; corrected to assert absence of source candidate. Code diff contains only alias control removal and loader search/display removal; no persistence, normalization, API or schema edits. git diff --check passed.
