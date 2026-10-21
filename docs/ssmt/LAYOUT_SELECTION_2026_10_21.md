# SSMT layout and item selection - development candidate

Date: 2026-10-21. State: **IMPLEMENTED - VERIFIED DEVELOPMENT CANDIDATE**. Candidate version: `2026.10.21.001-ssmt-layout-selection` (application stamp owned by Chief). Baseline: `2d49f62f58cc99f190a31c60204da5a945e1929c`. No candidate commit or production release is recorded here.

## Approval and scope

Requesting/Approving Admin and Admin of Record: Tyler, authenticated Buzz identity `12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d`, Registered Admin recorded in [ADMIN_REGISTRY.md](../../ADMIN_REGISTRY.md). Layout approval: event `cc26573520d6a268d0c482fca79bb1ab5bdb171a85be2ab8b1773137f71f0b01`, 2026-10-21T14:01:04Z. Checkbox defect report: `22eb5f6fd9ee76557e315b7c0efe4ede989d998e3b79162bff11e7c5a3b01e2b`, 2026-10-21T14:01:25Z. Mission: workspace `PLANS/SSMT_LAYOUT_AND_IMPORT_2026_10_21.md`.

Approved presentation groups the menu header/actions, workflow/readiness, labeled menu details, applicable promotion schedule and visible FIXY designation/generator strip above the compact item table. Optional skipped dates remain accessible. Applicable Thompson Hospitality dates remain available. Landing uses prominent colored Pricing Structure and Menu Selector / New Menu choices, removing redundant small landing navigation and the SSMT start self-link. Existing Add from Menu, divider and submenu actions remain available.

Selection correction permits checkbox selection while reporting selected-item issues and counts. Preview/apply retain source FIXY/modifier safeguards; duplicate copying remains opt-in. Selecting an item does not certify that its source relationships are complete or authorize silently omitting unresolved modifiers. Source records, exact identifiers and copied values must be preserved.

## Data boundary and release authority

[ARCHITECTURE_RULES.md](../../ARCHITECTURE_RULES.md) remains authoritative. No schema, source-authority, storage-contract, operational record, account or production-data change is authorized. Browser acceptance must intercept operational endpoints and use isolated fixtures, including autosave. This request authorizes development; under the active mission and Chief instructions it does not authorize merge or deployment. Repository default deployment intent is not used to widen that boundary.

Rollback: revert candidate application changes to baseline `2d49f62`; no migration or data restoration should be needed. Previous deployed-release evidence remains historical and does not prove this candidate is deployed.

## Evidence and remaining gates

Final local verification: `npm run verify` passed the complete package script including 20 server/domain checks, all guards and production build. `node scripts/.scratch-solo-run.mjs ssmt-tool ssmt-accounts-reuse ssmt-recovery ssmt-layout` passed 50/50 browser checks. The disposable runner is the existing runner with local port 4187 instead of 4174 to avoid an earlier process; no product change. Logs: workspace `.scratch/SSMT_FINAL_SOLO_VERIFY.log` and `.scratch/SSMT_FINAL_SOLO_BROWSER.log`. Corepack pnpm initially attempted dependency installation and failed before verification; npm executes the same package verify script against installed dependencies.

The first combined browser run had two stale expectations: removed Pricing table button and an encoded separator in shared-submenu text. Expectations now exercise the retained primary navigation and actual shared membership counts. Final full rerun passed. Pointer/keyboard selection, search persistence, named source errors with no apply/save, duplicate skip disclosure, independent cloned modifiers, accounts/recovery, desktop and phone containment passed using isolated data.

At 2800x1000 the Core item table starts at y=764 with three visible rows; weekly Promotion starts at y=937.5625 with one visible row. The table remains horizontally bounded and can scroll without document overflow. At 1440px setup takes more vertical space; users scroll down to items. Phone document width remains within 390px. Large-menu density behavior remains covered by the existing density suite.

Final inspected screenshots: [promotion](https://culinarytools.communities.buzz.xyz/media/afc666936ff9bd230e49954ddab4f3d27172f9a02844afe126d17bf4a562a584.png), [landing](https://culinarytools.communities.buzz.xyz/media/43b1c0bb61a5d4fb5348cc4bde470cf67ee33ff25f0505c78dd702ec57225498.png). All displayed records are isolated fixtures.

Tyler instructed solo execution at event `fcb7ee389049461b119cc2410149cff5db2140d654d17e7199c2027a302e9491`, 2026-10-21T14:10:24Z. Other agents stopped; Chief finished final fixes, complete checks and visual inspection directly. Preliminary independent layout/picker source checks passed before that instruction; no final independent Release Gate or LIVE clearance is claimed.

Final verified application SHA256: SsmtTool.jsx `1DBEB3E9CFB00937EDF0A3E4021BC3AE33EE792B36AEC1E1634FE1429A62717C`; SsmtReusePanel.jsx `0E762F0E2E4FCADCB0A39FCC57FC781782F4FABED2FC2AEC60ADDA1A331F545C`; appConfig.js `8AE5D7EA798F6EDFE819249773E02EF856AFEC4215573E493C265CD83839851F`. These checks ran at baseline HEAD with the candidate working diff; commit follows without application edits.

Unresolved source modifier relationships require separate source review. This candidate is not evidence that those relationships are repaired in production. Scribe has documented the development candidate only; no Release Gate or LIVE signoff.
