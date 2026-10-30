# Culinary moniker standard

Authority: Tyler, Buzz event e3be88ea82f08707037255b28858011fb27a04ba2887cfcee611379262f17461, October 30, 2026. Applies to Chief, Donnie and anyone adding or updating shared Supabase menu items.

## Required on every addition or update

Include the item's culinary profile in the change review and import dry run. Complete every field with supported values or an explicit Unknown / Needs review status. Do not invent classifications to pass a completeness check. Do not call an item import complete while its profile is silently absent. Existing reviewed values are preserved unless specific evidence supports a reviewed change.

| Field | Controlled values / rule |
|---|---|
| Profile version | `1`; version future vocabulary changes |
| Identity | Existing item key plus exact text MRN and compatible portion; preserve menu memberships |
| Service placement | Hot, Cold, Ambient; multiple allowed when reviewed; otherwise Unknown |
| Cuisine moniker | Approved cuisine/pillar vocabulary; specific cuisine only with evidence; Unknown if unresolved |
| Culinary role | Proteins, Starches / grains, Vegetables, Sauces / dressings, Toppings / garnishes; Unknown for unresolved classifications |
| Seasonality | Spring, Summer, Fall, Winter, Year-round; multiple allowed; Unknown is distinct from Year-round |
| Flavor | Bright, Savory, Spicy, Rich, Herbal; multiple allowed; Unknown if unsupported |
| Texture | Crunchy, Creamy, Fresh; multiple allowed; Unknown if unsupported; expand vocabulary through a recorded revision |
| Premium highlight | Yes, No, Unknown; a culinary merchandising designation, not proof of demand |
| Review status | Proposed, Reviewed, Needs review |
| Provenance | Source file/hash or source record/version; proposed derivation; reviewer and date for Reviewed values |

Preparation area alone never certifies service temperature or safe ambient display. Name-based inference remains Proposed. No dietary taxonomy expansion is required. Recipe documents and methods remain private. Pan fill weights require separate food-specific measurement and equipment fit; no generic volume-to-mass assumptions.

## Persistence and compatibility

Approved profiles belong in a versioned Supabase-backed domain linked to existing identities, with a defined import round-trip. Do not put business metadata into arbitrary source fields, rename item keys, regenerate MRNs or overwrite historical data. The current smart builder's bundled candidate evidence and session confirmations do not establish that profiles have been persisted or reviewed in Supabase.

Until the shared profile storage/API contract is approved and deployed, item updates must carry a companion profile manifest and explicit persistence status. Record unresolved profiles as a follow-up; never imply that the candidate layer is canonical shared metadata. Any shared-schema or production-data change needs the specific approval, independent review and recovery safeguards required by GOVERNANCE.md and ARCHITECTURE_RULES.md.

## Required checks

Before an item update is published, check profile field coverage, allowed vocabulary, exact identity/portion links, conflicts, preserved reviewed values and source provenance. Verify library cards, menu membership, W&P and relevant downstream selectors against isolated data. Diff operational and profile changes separately; report all unresolved fields. Never hide or remove existing records merely because they are absent from a file. Never verify by writing canonical SSMT.

After approved production application, read back the affected item/profile records and record counts, exceptions and relationship checks. A dry run or app deployment alone does not prove a successful Supabase import.
