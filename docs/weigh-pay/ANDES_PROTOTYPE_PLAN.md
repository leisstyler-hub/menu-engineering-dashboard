# Andes private recipe prototype

Requesting Admin and Admin of Record: Tyler, authenticated Buzz identity `12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d`. Scope: Oct 13 recipe/dashboard request, resumed Oct 19; solo execution explicitly directed by event `8dc7683343389efc072a9b9065a0193565013ada3962cc83b5e2f899232d5789`.

Level 4 data/security and Level 3 visible product work. Chief owns all local files, implementation, tests and documentation; independent review is unavailable under the solo instruction. Existing branch `chief/weigh-pay`, base `06172be`, equals remote main on recovery. Preserve the two unrelated generated JSON changes.

## Design and scope

Extend existing W&P with overview counts, count-based category composition, canonical price/lb editable as dollars/lb or dollars/oz, and consistent exports. Label qualification as W&P qualification, never organizational approval. Recipe totals require an authorized private source; unavailable is not zero.

Separate private recipe variants and component edges from operational recipe_items. Preserve exact text MRNs, source hash/pages, serving cost/size, batch yield, parent usage quantities, raw methods, and null serving_pan. Variants match only after validation and explicit W&P link approval; do not join by name. Nested displays stop on cycles and depth limits. Evaluate each component using its own cost and mass; do not add passing components to parent menu qualification. Never infer mass from volume/count.

Endpoint access is disabled unless explicitly enabled and a server-side allowlist of verified Supabase user IDs exists. Verify bearer identity against Supabase Auth on every request before service-role reads. Never use existing shared admin codes for recipe access. No private response may be cached. Browser tokens remain in memory only; no recipe exports, public assets, public API changes, or Menu Library linkage.

## Execution

- [x] Add failing price/export, recipe nesting/identity and unauthorized API tests.
- [x] Implement pure price/model functions and update exports.
- [x] Add dashboard and expandable private recipe presentation with blank pan field.
- [x] Prepare additive, deny-by-default schema and validated JSON import preparation; no production execution.
- [x] Run full package verification/build and browser coverage with private fixtures and isolated storage; self-review complete diff.
- [x] Record exact results, remaining security/access/migration decision and rollback.

## Acceptance and stop conditions

40% item and 60% menu gates unchanged. Filters do not change totals. Invalid prices cannot qualify items. Exports use the current canonical price. Unauthorized requests do not reach private storage. No real private content enters Git, built assets or channel messages. Missing/ambiguous child links show review status. Public operational costs remain unchanged.

Production migration/import, viewer enrollment and recipe activation require concrete authorization; no such action is performed by this plan. Application merge/deploy also remains gated by repository review and security checks. Stop on any private-content leak or source conflict. Rollback disables private endpoint, reverts app changes and retains import batches; no operational delete or historical rewrite. Final report: exact branch/commit, tests and failures, migration/access status, release state and next required decision.
