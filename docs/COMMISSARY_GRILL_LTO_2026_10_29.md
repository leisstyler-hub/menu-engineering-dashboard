# Commissary Grill LTO cycle

## Release scope

- Version: `2026.10.29.001-commissary-grill-lto`
- Cycle Week 1: Monday, November 16, 2026
- Eligible cafes: Cricket, Nessie, Dawson, Bingo, Grace, Blueshift, Sonic and Astra
- Delivery quantities: whole sandwiches for Friday, Monday and Wednesday delivery
- Shared storage: existing Supabase `app_records` records and operational metadata
- Schema migration: none

## Six-week cycle

| Week | Set A | Set B |
| --- | --- | --- |
| 1 | ATX Burger / Mushroom Swiss Burger | Diablo Burger / Southwest Burger |
| 2 | Diablo Burger / Southwest Burger | Brunch Burger / BBQ Brisket Smashburger |
| 3 | Brunch Burger / BBQ Brisket Smashburger | Teriyaki Bacon Burger / Carolina BBQ Burger |
| 4 | Teriyaki Bacon Burger / Carolina BBQ Burger | Blackened Steelhead Sandwich / Spicy Fried Cod Sandwich on Brioche |
| 5 | Blackened Steelhead Sandwich / Spicy Fried Cod Sandwich on Brioche | Chesapeake Chicken Sandwich / Haystack Burger |
| 6 | Chesapeake Chicken Sandwich / Haystack Burger | ATX Burger / Mushroom Swiss Burger |

The cycle repeats after Week 6. Weeks before November 16 do not expose Grill ordering.

## Data and calculations

The Menu Library remains the live authority for sandwich name, MRN, portion and Item + Waste Cost. Each saved order snapshots the current selected-item cost so the locked order and S4 export remain auditable. Ingredient prep quantities come from `Ingredient_Costing_9.19.26.xlsx`: direct level-1 ingredients plus unique immediate level-2 sub-recipes. This preserves components such as the smashburger patty and sandwich sauces without expanding and double-counting their nested ingredients.

The consolidated Prep List and Friday/Monday/Wednesday delivery maps multiply component quantity per sandwich by the saved sandwich count, then roll matching component MRN/unit pairs across sandwiches and cafes. Finished-dish provenance remains visible. S4 uses one finished sandwich line and maps the exact Item + Waste Cost to Prepared Foods, matching the existing automatic fallback rule.

Operational metadata version 3 carries the eligibility, anchor, cycle, MRNs and prep-component contract in Supabase for downstream reuse. Existing Commissary records and Salad Bar ordering remain compatible.

## Verification and release evidence

Pending final release evidence: full repository gate, local and production Commissary browser suite, exact Supabase operational-metadata readback, Git commit, GitHub publication, READY Vercel deployment, canonical asset/version check and production error scan.

Rollback application baseline: `33675b3be49a18e45d9f17956269fa98e7e76928`. Operational metadata rollback requires reseeding the prior approved version 2 payload.
