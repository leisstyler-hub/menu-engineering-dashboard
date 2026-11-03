# Culinary Tags standard

Authority: Tyler, Buzz event e3be88ea82f08707037255b28858011fb27a04ba2887cfcee611379262f17461, October 30, 2026. Applies to Chief, Donnie and anyone adding or updating shared Supabase menu items.

## Required on every addition or update

Include the item's culinary profile in the change review and import dry run. Complete every field with supported values or an explicit Unknown / Needs review status. Do not invent classifications to pass a completeness check. Do not call an item import complete while its profile is silently absent. Existing reviewed values are preserved unless specific evidence supports a reviewed change.

| Field | Controlled values / rule |
|---|---|
| Profile version | `1`; version future vocabulary changes |
| Identity | Existing item key plus exact text MRN and compatible portion; preserve menu memberships |
| Service placement | Hot, Cold, Ambient; multiple allowed when reviewed; otherwise Unknown |
| Cuisine Tag | Approved cuisine/pillar vocabulary; specific cuisine only with evidence; Unknown if unresolved |
| Culinary role | Proteins, Starches / grains, Vegetables, Sauces / dressings, Toppings / garnishes; Unknown for unresolved classifications |
| Seasonality | Spring, Summer, Fall, Winter, Year-round; multiple allowed; Unknown is distinct from Year-round |
| Flavor | Bright, Savory, Spicy, Rich, Herbal; multiple allowed; Unknown if unsupported |
| Texture | Crunchy, Creamy, Fresh; multiple allowed; Unknown if unsupported; expand vocabulary through a recorded revision |
| Premium highlight | Yes, No, Unknown; a culinary merchandising designation, not proof of demand |
| Review status | Proposed, Reviewed, Needs review |
| Provenance | Source file/hash or source record/version; proposed derivation; reviewer and date for Reviewed values |

Preparation area alone never certifies service temperature or safe ambient display. Name-based inference remains Proposed. No dietary taxonomy expansion is required. Recipe documents and methods remain private. Pan estimates may use food-specific source portion volume paired with source weight/cost and documented pan capacity/fill assumptions, per Tyler November 2 approval. Label these estimates; measured pan yields remain separate. No generic volume-to-mass assumptions.

## Persistence and compatibility

Approved profiles belong in a versioned Supabase-backed domain linked to existing identities, with a defined import round-trip. Do not put business metadata into arbitrary source fields, rename item keys, regenerate MRNs or overwrite historical data. The current smart builder's bundled candidate evidence and session proposals do not establish that profiles have been persisted or reviewed in Supabase.

Until the shared profile storage/API contract is approved and deployed, item updates must carry a companion profile manifest and explicit persistence status. Record unresolved profiles as a follow-up; never imply that the candidate layer is canonical shared metadata. Any shared-schema or production-data change needs the specific approval, independent review and recovery safeguards required by GOVERNANCE.md and ARCHITECTURE_RULES.md.

## Required checks

Before an item update is published, check profile field coverage, allowed vocabulary, exact identity/portion links, conflicts, preserved reviewed values and source provenance. Verify library cards, menu membership, W&P and relevant downstream selectors against isolated data. Diff operational and profile changes separately; report all unresolved fields. Never hide or remove existing records merely because they are absent from a file. Never verify by writing canonical SSMT.

After approved production application, read back the affected item/profile records and record counts, exceptions and relationship checks. A dry run or app deployment alone does not prove a successful Supabase import.


## W&P planning extension - Tyler November 3, 2026

Authority: original request `206635fcaa07a294b17554b80cf9d49f1f0f851aec58279e62df5d2edc04b7ed`, support `54ac413a0eb4a2199cdfef762016c916f5344f012093a5d9101784f8312a8b52`, reference-range extension `4f0cb50c24b0cd0d439799cb221db9ce13bd533fefb5752b157db3c79785b4db`, and build authorization `666d1d9e93383309d0db4242b48e7738f1d14b84542bbaecfae6725df223a8a4`.

Track temperature-control requirements separately from service placement. Ingredient/cooking/texture keywords do not certify ambient holding; salads default to Proposed Cold unless exact recipe service evidence supports Hot. Ambiguous warm-salad names remain unresolved. Surface conflicts with Reviewed classifications without rewriting stored source values. Add proposed food type, protein family and service format to planner-derived metadata. These fields do not change the existing shared profile schema or establish shared persistence.

Explicit source volume can support labeled pan-serving estimates without mass. Compatible serving cost can support cost totals; missing mass leaves weight-dependent sales/food-cost fractions incomplete. Chef quantity forecasts support portions and source-compatible cups. Individual fixed-price foods retain their original qualification boundary.

Tyler's chef-reported Butter Chicken full 4-inch pan range is 21 lb 3 oz to 24 lb 12 oz. It may serve as an optional, adjustable planning reference for comparable sauced dishes. Label Estimated using Butter Chicken reference, retain a range, and never relabel it measured for another food or extrapolate it to dry foods, rice, salads, noodles or different pans automatically. Exact food-specific measurements take priority. This is a scenario override, not a source mass conversion or shared source correction.
