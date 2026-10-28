# W&P visible tiers and station wording

Request: Tyler Buzz `071f9131ee1f97f9136e576df70dafd3bb242428f34b457f2e29fb019bae7f3a`, 2026-10-28T14:19:20Z. Authenticated Release-Authorized Admin; ordinary app request is deploy-intended under current policy. Chief owns implementation, self-review, verification and release solo. Branch `chief/wp-guidance-tiers`; reconciled upstream baseline `fa90ec24fa2328b8e044c96a72e4c59ec2a4263c`.

## Behavior

- Replace Within 40% dropdown with vertically extended <=30%, >30-40%, >40-50%, >50-60%, >60%, Service review and Needs information lists. Boundaries reuse tierFor; missing/conflicting/untrusted information and service restrictions retain dedicated sections. Qualification counts still use the original 40% gate.
- Clicking the selected category again clears it to All; preserve search, menu and station selections.
- Rename Sales less food cost to Remaining for labor & other costs in station and workbook. Explain projected sales minus all planned food cost, before labor, overhead and tax. This is not net profit. No formula change.
- Browse export includes all shown tiers for current category/search. Preserve exact MRNs, privacy, historical/source records and familiar tiles. No storage/auth/schema/import changes or production operational writes.

## Evidence

Full npm run verify (complete unit suite, repository guards and build); browser suites wp-guidance-tiers, wp-portfolio, wp-station, all-menu-wp, wp-information-recovery and pan-ready-wp. Desktop/mobile tests cover tier placement, price changes, category clearing, calculations, conflicts, information needs, exact MRN exports and zero operational writes. Read-only actual shared catalog checks cover every menu and the station workflow. Logs/screenshots: Buzz WORK_LOGS/WP_GUIDANCE_TIERS_2026_10_28. Final release evidence appended below.

Fresh solo self-review: scope is UI grouping, controls and export terminology; calculations/authority unchanged. No independent clearance claimed. Initial price-regrouping test used too small an increase to move 70% below 30%; corrected the fixture after checking actual 35% output. PowerShell snapshot TLS download failed; Node read-only fetch succeeded.

## Rollback and pending issue

Baseline production READY `dpl_5N6PER5MrDZ4LVcYjdq3FSzGSjJU`, SHA `fa90ec24fa2328b8e044c96a72e4c59ec2a4263c`. Revert this scoped app change and redeploy while preserving unrelated work/source records. No data recovery required.

Earlier gold synopsis screenshot concerns SSMT and remains separate from this W&P release.
