# Menu readiness

Approved replacement: Tyler event 50443fe96dc8657e807356a01da1e82a9794dfd6e70b7c11ea421be517119652 in Culinary Tools Project. Owner Chief, solo; branch chief/menu-readiness, base d959853. Scope: replace desktop/mobile Operations Console with category breakdown, actionable gap lists and honest source/freshness status. Consolidate the previous category card. No operational writes or recipe documents.

Implementation plan (writing-plans, executed solo):
- Add a browser acceptance test for category/source labels, current read, gap list matching, empty and error states, and mobile containment; run against the old page to establish failure.
- Add a shared MenuReadiness panel for both responsive shells. Initial categories are labeled bundled snapshot; an explicit load reads existing recipe-library scope=all. Use existing landing trust-gap rules, and show filtered item/menu/exact MRN/category information within the panel. No editable fields or recipe documents.
- Remove the duplicate desktop category card and both Operations Console bodies; update version, changelog and handoff.
- Run new and existing landing browser tests, full package verification, self-review, commit and publish under the approved replacement scope. Post commit and final state to Buzz Changelog. Verify canonical deployment commit and production flow before LIVE.

Alternative considered: removal, offered to Tyler and declined. Adding static categories alone would repeat the existing intelligence card; chosen replacement consolidates it and adds actionable current-data review. Historical source records and pricing rules remain unchanged. Source labels must distinguish shared catalog from server fallback/reference and receipt time from source update time.

Review focus: no rounded-percent-derived gap counts; zero costs are valid under existing rules; source errors cannot become zero gaps; exact MRNs retained; unsupported category values are shown rather than guessed; small screens contain the review table. Full-catalog reads require explicit user action. Missing allergen detail never establishes allergen-free status.

## Implementation verification

Local browser acceptance: 7/7 passed after integration, including exact MRN preservation, category/gap filtering, search/empty results, reference/error reads, mobile horizontal containment and reachable final review row. Existing promotion fixture now uses a fixed weekday because promotions intentionally exclude weekends; runtime calendar unchanged. Build passes. Preliminary full npm run verify passed; governed publication reruns the full suite on final committed code. Visual self-review completed at 390px and 1440px. Bottom clearance added to mobile landing main for the existing two-row fixed navigation. No operational writes or source edits. Solo review, no independent clearance claimed.
