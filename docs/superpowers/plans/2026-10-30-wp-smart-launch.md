# W&P smart launch implementation plan

**Goal:** Build the agreed menu/pillar-led culinary advisor, explicit swaps and pan planning for a 40% blended food-cost target.
**Owner / execution:** Chief, native solo implementation on chief/wp-smart-launch. Independent review before publication for source/import risks. Tyler authorized implementation in Buzz event 094fd449e8ca61ca92ec4d479fd18faf0a63fcc4bce71771cd7c1f74eefb82f2.
**Spec:** Workspace PLANS/WP_SMART_LAUNCH_DESIGN_2026_10_30.md and subsequent source-file intake discussion.
**Architecture:** Add a provenance-preserving candidate profile index, join it conservatively to current foods, and keep all build actions session-only. Do not alter API payloads or Supabase data/schema. New profile classifications are proposals requiring chef confirmation, not service approval.
**Stack:** Existing React/Vite, pure JS models, Node tests and Playwright.

## Constraints and rulings

- Exact MRNs and compatible portions; never replace operational source values with snapshot costs.
- Preserve familiar menu tiles; verified pillar membership is reconciled by bounded exact name normalization.
- No schema/import writes without the separately scoped dry-run and recovery approval.
- Preserve existing manual pound scenarios; pan mode requires user-entered measured food-specific fill weight and explicitly distinguishes opening and reserve pans.
- No fabricated demand, pan weights, savings, cuisine certainty or ambient safety. Use proposed classifications visibly; unknowns remain unknown.
- Overall 40% target is distinct from legacy individual-item/menu qualification.

## Review focus

Unknown memberships must stay unassigned; conflicting profile variants must not merge; zero/blank pan inputs must not produce a passing projection; lock/undo and out-of-pool changes must be safe; missing source economics must suppress financial claims.

## Tasks

1. [x] Add failing model tests for pillar selection, culinary diversity, premium retention, lock-aware swaps, invalid quantities and pan economics. Run red.
2. [x] Implement wpSmartModel.js and deterministic compact candidate profile extraction from the hashed CSV. Export a separate dry-run profile/intake report; preserve raw strings and document provenance. No source cost import.
3. [x] Add pillar controls to WpMenuPicker; add WpSmartBuild controls and integrate with WpPortfolio entries. Suggest within selected pool, show reasons and before/after whole-station economics, keep/lock/undo.
4. [x] Extend wpStationModel, WpStationBuild and station export with optional pan mode, opening/reserve counts, measured fill weight and food profiles. Keep manual pound mode compatible.
5. [x] Remove only requested beef/seafood blanket exclusions; update direct regressions and communicate remaining service restrictions.
6. [x] Add isolated desktop/mobile browser acceptance tests and export checks. Run full npm verify and all W&P browser specs. Review scope and source/privacy constraints.
7. [x] Update version, product decision, handoff and changelog; get risk-focused independent review, resolve findings and recheck upstream before authorized release. Publish every commit receipt and report exact production state. Production Supabase writes are separately pending, not implicitly authorized by app release.
