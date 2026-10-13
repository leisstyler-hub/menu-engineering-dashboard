---
title: "Weigh & Pay Release Evidence - October 13 2026"
tags: [weigh-pay, menu-engineering, release-evidence]
status: active
created: 2026-10-13
---

# Weigh & Pay release evidence

State: **PRODUCTION VERIFIED**, pending independent sign-off. Solo Chief mission: no worker review, verification or Scribe clearance is represented as received.

Requesting/Approving/Release-Authorized Admin and Admin of Record: Tyler, authenticated Buzz identity `12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d`, verified against ADMIN_REGISTRY.md. Authorization event `204b1b85f1d99ec9016143b386ef0eb11a41b0262666280484e6963df5078fc4`, 2026-10-13T18:06:03Z. Originating solo request `64b6152b66a4c46bb27551f680e17447a8d748182fb237305bcc1b38b2effc4c`.

Rules: [approved product decision](../../PRODUCT_DECISIONS.md), WP-2026-10-13. Source authority: [ARCHITECTURE_RULES.md](../../ARCHITECTURE_RULES.md). No source records, schemas, migrations, MRNs or operational prices changed. The item-name/service rules remain guidance signals requiring operator validation rather than ingredient/recipe certification.

## Release identity

- Baseline: `e87b79b180c7cc20f5ee88d12904d51215692832`.
- Application commit: `8fe2cce4b62f6d3c6f42084df1f88f7429e793cd`; branch `chief/weigh-pay`.
- Configured author/committer: Chief (`71a2331dd5d247d15f9093339d37d8dea84729056025bb06b34c9d947d9c94cd@culinarytools.communities.buzz.xyz`); raw NIP signature uses that configured agent identity. No invented human co-author or DCO trailer.
- Project: `prj_RxAALht8hMh8pZkXlQI9sFN5WXyv` / `project-d8v25`.
- Production deployment: `dpl_GG31W4MukJ4PVtCsSRD51xa79sHg`, READY, target production, Git SHA matched, `project-d8v25.vercel.app` alias present.
- Preceding rollback deployment: `dpl_EngZLeeSYwcjTVn4pMXcyGLbqgqy` (READY at baseline).
- Live app: https://project-d8v25.vercel.app/
- Deployment: https://vercel.com/tylerl-s-projects/project-d8v25/GG31W4MukJ4PVtCsSRD51xa79sHg
- GitHub: https://github.com/leisstyler-hub/menu-engineering-dashboard/commit/8fe2cce4b62f6d3c6f42084df1f88f7429e793cd
- Supabase: https://supabase.com/dashboard/project/pzilyzqhatthctgsjwtt

## Verification

1. Direct browser acceptance failed first because W&P was absent; model check failed first because the qualification module was absent.
2. Model guard covers exact price, 40% boundary, 60% menu threshold, missing/invalid inputs, explicit mass conversion, fluid-volume rejection, protein/service exclusions, vegetable keyword false positives, MRN/portion deduplication and aliases, fallback trust and reasoned session overrides.
3. `npm run verify` passed at the application commit (all 31 guards and Vite build). `pnpm run verify` could not run because its new local dependency-status check attempted to purge the reused node_modules junction; npm executed the identical package verification command. Initial stale-resource checks were checkout CRLF differences, corrected locally without generated-data changes or staged resource files.
4. `node scripts/run-playwright.mjs --workers=8 --fully-parallel`: 104 passed, 41 failed at application commit. Baseline used the unchanged e87b79b worktree/dist and identical worker/parallel settings on a separate local port: 96 passed, 41 failed. Failure sets are identical. All 8 added W&P tests passed.
5. W&P plus brand-entrance suites: 23/23 local and 23/23 with `PLAYWRIGHT_BASE_URL=https://project-d8v25.vercel.app`. W&P fixtures intercept all API routes; no real save is exercised. Production actual-data check intercepted traffic logging and blocked every non-GET operational request.
6. Actual-data production check at 2026-10-13T18:48:03.085Z: current Supabase source, all 54 menu statuses matched independently evaluated rows, export downloaded and inspected, override/reason applied in session and cleared on refresh, Menu/Portfolio/back
 navigation exercised, no mobile page overflow, no page errors, no operational writes.
7. HTML exports render imported names/reasons as escaped text. Workbook MRNs remain string cells. Printable flash cards inspected at desktop size and printed to a local PDF; output uses browser Print / Save as PDF without a new PDF dependency.

Production observation:

```json
{
  "version": "2026.10.13.001-weigh-pay-guidance",
  "entryAsset": "/assets/index-CClg1DKq.js",
  "source": "supabase-recipe-items",
  "sourceRows": 1531,
  "menus": 54,
  "statuses": {
    "Fail": 24,
    "Pass": 14,
    "Conditional": 16
  },
  "missingInputs": 56,
  "headerHeight": 172.25,
  "mobileOverflow": false,
  "operationalWrites": 0,
  "pageErrors": 0,
  "exportBytes": 66317,
  "checkedAt": "2026-10-13T18:48:03.085Z"
}
```

## Timing (UTC)

- Request/explicit build-deploy approval: 2026-10-13T18:06:03Z.
- First implementation commit authored: 2026-10-13T18:38:42Z; final application commit committer time 18:38:57Z.
- Final full browser comparison/attribution cleared before publish at 18:44 UTC.
- Publish started: 2026-10-13T18:44:17.830Z.
- Vercel created: 2026-10-13T18:44:22.118Z.
- Vercel READY: 2026-10-13T18:44:54.985Z.
- Actual-data production proof complete: 2026-10-13T18:48:03.085Z.
- Independent sign-off: unavailable under the requested solo mission.
- Avoidable delay: dependency-junction setup, checkout line endings, slow serial baseline test runs before parallel execution, and corrected verification-harness waits/selectors. One accessible Back-button name regression found by the full suite was fixed before release.

## Known baseline browser failures

These are explicitly disclosed, not represented as a green full browser suite:

- `tests\browser\deli-core-menu.spec.js:29:1 › Deli Core is selectable in Transfer Tool with Item + Waste costs`
- `tests\browser\neighborhood-rotations.spec.js:1085:1 › Dawson Moby Pop-Up starts Aug 31, uses Global or Carvery menus, and recalls an isolated day promo`
- `tests\browser\neighborhood-rotations.spec.js:1190:1 › submitted Dawson Moby Pop-Up replaces only Moby Global presentation without persisting the projection`
- `tests\browser\neighborhood-rotations.spec.js:268:1 › North Commissary cafe label stays inside its selector button`
- `tests\browser\neighborhood-rotations.spec.js:294:1 › Nessie Global reference picker preserves exact plate builds while rollout remains planner-only`
- `tests\browser\neighborhood-rotations.spec.js:475:1 › reference plate cost rolls out by menu across current and future planners only`
- `tests\browser\neighborhood-rotations.spec.js:559:1 › reference plate cost covers split, Nitro, Moby Pop-Up, and LAX planner paths`
- `tests\browser\neighborhood-rotations.spec.js:598:1 › Fish Market and Core Grill calculate automatic operator-ready plate options`
- `tests\browser\neighborhood-rotations.spec.js:656:1 › Teriyaki and Anisa Sub Recipe selections satisfy normalized plate builds`
- `tests\browser\neighborhood-rotations.spec.js:800:1 › Legacy non-Cafe-Express soup rows are neither displayed, costed, nor re-saved`
- `tests\browser\neighborhood-rotations.spec.js:905:1 › Split-global future week selectors remove menus already chosen in another block`
- `tests\browser\recipe-library.spec.js:3:1 › Menu Library opens without app protection or scoped-state crashes and shows Webtrition weight`
- `tests\browser\reinvent-submit-recall.spec.js:1024:1 › Re:Invent shared database recall maps week-start rows over stale display-week cache`
- `tests\browser\reinvent-submit-recall.spec.js:1073:1 › Re:Invent future week stays blank when shared database has no saved rotation`
- `tests\browser\reinvent-submit-recall.spec.js:1106:1 › Re:Invent leadership card shows the full recovery week in calendar order`
- `tests\browser\reinvent-submit-recall.spec.js:1122:1 › Re:Invent full-week promo recall ignores stale normal global rows`
- `tests\browser\reinvent-submit-recall.spec.js:1149:1 › edit and resubmit state clears when switching cafes`
- `tests\browser\reinvent-submit-recall.spec.js:1176:1 › Doppler recall keeps the submitted global block menu over mismatched child rows`
- `tests\browser\reinvent-submit-recall.spec.js:1193:1 › Doppler leadership card shows Monday-Tuesday carryover and Wednesday-Friday current menu`
- `tests\browser\reinvent-submit-recall.spec.js:1209:1 › Grace leadership card shows Monday-Tuesday carryover and Wednesday-Friday current menu`
- `tests\browser\reinvent-submit-recall.spec.js:747:1 › Re:Invent saved split global blocks recall as the submitted menus`
- `tests\browser\reinvent-submit-recall.spec.js:769:1 › Re:Invent split-block recall ignores a stale legacy one-week menu after resubmit`
- `tests\browser\reinvent-submit-recall.spec.js:792:1 › Re:Invent split-block recall keeps newest same-block resubmission over stale rows`
- `tests\browser\reinvent-submit-recall.spec.js:817:1 › Re:Invent edit and resubmit keeps changed Monday-Tuesday menu after leaving and returning`
- `tests\browser\reinvent-submit-recall.spec.js:858:1 › Re:Invent recall reads live Supabase café and entrée column shapes`
- `tests\browser\reinvent-submit-recall.spec.js:875:1 › Re:Invent split-block recall rejects raw-label stale rows after leaving and returning`
- `tests\browser\reinvent-submit-recall.spec.js:898:1 › Re:Invent recall ignores stale child rows that disagree with submitted Global Block menus`
- `tests\browser\reinvent-submit-recall.spec.js:917:1 › Re:Invent recall prefers a global-selection record's own submitted menu over stale weighted aggregate evidence when no global block row exists`
- `tests\browser\reinvent-submit-recall.spec.js:934:1 › Re:Invent submitted blocks recover saved item rows that were previously written as Draft`
- `tests\browser\reinvent-submit-recall.spec.js:954:1 › Re:Invent shared database recall replaces stale local browser cache`
- `tests\browser\reinvent-submit-recall.spec.js:991:1 › Re:Invent rebuilt records isolate global blocks from other saved weeks`
- `tests\browser\transfer-tool.spec.js:102:1 › Transfer Tool assigns one unresolved recipe component the authoritative item-cost remainder`
- `tests\browser\transfer-tool.spec.js:122:1 › Transfer Tool proportionally caps every mapped G/L at Item + Waste Cost`
- `tests\browser\transfer-tool.spec.js:147:1 › Transfer Tool exports an unmapped item through the approved Prepared Foods fallback`
- `tests\browser\transfer-tool.spec.js:170:1 › Transfer Tool does not use the Prepared Foods fallback during a mapping-service failure`
- `tests\browser\transfer-tool.spec.js:182:1 › Transfer Tool maps every soup to Prepared Foods while allowing a chef override`
- `tests\browser\transfer-tool.spec.js:197:1 › Transfer Tool retains the current cafe profit-center mappings`
- `tests\browser\transfer-tool.spec.js:203:1 › Transfer Tool batch export uses stored automatic allocations without writes`
- `tests\browser\transfer-tool.spec.js:216:1 › Transfer Tool deletes one saved draft after one confirmation`
- `tests\browser\transfer-tool.spec.js:38:1 › Transfer Tool expands a selected item into automatic ingredient G/L rows and exports them`
- `tests\browser\transfer-tool.spec.js:74:1 › Transfer Tool automatically balances positive residual cost and allows every mapped G/L to change`
