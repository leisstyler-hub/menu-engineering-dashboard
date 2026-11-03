# W&P Flagged Item Audit and selector pillars

Owner Chief, solo implementation and verification. Branch `chief/wp-pan-tags`; baseline and rollback `07e8d700cfa7b5eec7e3f1ad9b730614a86cf71e`, deployment `dpl_9aShMNwvaxJux8JJdt55PCQXfAVs`. Tyler requests `75fcb81d029a1794aee7e368dd02d28e214dbfbc8fbeaa78885103f9f02ba065` (audit) and `385875c50f192dffbfde52a02ef7ff24ca98baa72d2890b24597b3c7d6d73f0a` (selector pillars) authorize this ordinary app patch under default deployment intent. Version `2026.11.02.002-wp-flagged-audit`.

## Scope and design

The top-of-page Flagged Item Audit button downloads an XLSX correction list for all loaded menus. Browse filters and session exceptions do not suppress findings. Each projected source menu/serving variant retains its exact text MRN, available economics, information reasons, service and classification review, approximate-weight status, pan-estimate gap, proposed Tags, source labels and pillar. Recommended remedies accompany blank owner/notes and an Open status. Wrapped cells, readable column widths, header styling and an autofilter support correction work. The context tab records source, read time, fallback warning, selling-price scenario and limits. Workbook editing does not write shared records.

Flags include missing identity/serving/cost/weight, existing conflicts, above-40% economics, approximate evidence, unresolved Tags, service/classification decisions and incompatible pan evidence. These are distinct issues; expensive premium items are not removed, deliberate exclusions are not represented as missing-data errors, and supporting prep remains identified. Recipe documents, methods and source links are absent. Existing models perform the calculations and exact source matching; no new density or qualification rule is introduced.

The selector overlay retains current Pairwise data and adds bounded name matching for AMZ+RA prefixes, Harvest Co. punctuation, Paninoteca spelling and the three full Cafe Express names. Core Stations Pillar replaces Base Station Infrastructure in this selector, preserves the base memberships, includes Cafe Express, and moves Harvest Co from Cafe Express & Fresh. Other memberships remain from the current snapshot. Menus without a confirmed mapping have a selectable Needs pillar assignment group. The read-only catalog check returned 53 menus: 52 mapped and Chickle explicitly unassigned. The request to Tyler for Chickle's pillar is event `6e98948ed7c24c57d9921068715b09ab6f47d35835e9e0578c0dfb0abf87ea69`.

Pairwise integration and shared Tags persistence remain future work. After-service leftover tracking remains in the next-patch plan at `WP_PAN_TAGS_2026_11_02.md`. No Supabase schema, profile, recipe item or operational-record write is included.

## Verification

Both new model tests initially failed on the absent modules, then passed. They cover exact text MRNs, conflicting variants, missing weights/costs, service/financial distinctions, fallback labeling, selector aliases, Core Stations membership and preservation of the Pairwise snapshot. Browser acceptance covers responsive top-button downloads, correction fields, all-menu scope despite filters, classification-review rows and tile selection. Read-only actual shared-catalog checks cover the real audit download and Core Stations selections as well as existing station/pan/smart workflows.

Full `npm run verify` passed with 15 smart/pan tests, 36 package model tests, all repository guards and a production build. Initial browser attempts used a stale preview and one build was started during a browser run, causing an asset disruption. The stable-build rerun passed all 14 checks in 47.7 seconds, including four actual shared-catalog workflows, and supersedes those setup failures. Fresh self-review confirmed a bounded presentation/export change, exact MRNs, no data writes, unaltered Pairwise/profile sources and no change to premium rules. Solo delivery; no independent clearance claimed.

## Release state

Candidate verification and production evidence are reconciled here after publication. The current candidate is not called LIVE until exact deployment and canonical acceptance are confirmed. Request received November 2 at 16:18:54 PT; pillar addition received 16:20:49 PT. Rollback requires restoring the baseline app; no data rollback is needed.
