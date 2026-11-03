# W&P pan planning and Tags implementation plan

Owner Chief; branch chief/wp-pan-tags. Approved design/release: Tyler event d903401c3db3d1a9f54b3b4b045351aa0f86c8d8275f0cd921c47ecdfe09ebe4. Baseline fee402c.

- [x] Add tests for source portion volume/weight/cost estimates, exact text MRNs, membership/portion conflicts, invalid quantities, missing evidence, swaps and unsold production cost.
- [x] Add a minimal public portion-economics evidence projection from the provided CSV, with hash; no ingredients/methods. Implement shared deterministic pan estimates. Source volume paired with source weight establishes food-specific density, never a generic water conversion.
- [x] Replace planner entry with pan size/count, read-only Tags and uppercase lock label. Remove placement confirmation; retain proposal/review distinction. Use one display vessel per selected food for equipment guidance, independently of production pan count. Workbook shares model outputs.
- [x] Update acceptance browser tests, run full repository gate and local desktop/mobile workflow including actual catalog under intercepted writes. Obtain independent source/estimation review under current governance; fix findings.
- [x] Update version, changelog, handoff, product decisions and release evidence; inspect attribution, commit and post Changelog; recheck upstream, publish through governed script, prove READY source SHA and canonical browser workflow, post final evidence.

## Next deployment

Finish all-menu pillar assignments and Core Stations Pillar membership; verify exact Cafe Express identity and Harvest Co assignment. Connect Pairwise to shared definitions. Add after-service leftover tracking to the deployment plan: service date/site, exact MRN and serving variant, selected pan size, prepared quantity, leftover quantity (allow partial pans), estimated sold quantity and review of waste/unsold reasons. Preserve historical plans and distinguish actual measured outcomes from estimates. Shared persistence requires scoped contract, identity review and specific production-write approval; no canonical SSMT tests.

## Estimation assumptions

Four-inch reference pans use nominal 14.2 qt full, 6.7 qt half, 1.8 qt sixth-size bullet approximation, with 80% usable fill. Bullet is explicitly labeled as a sixth-size planning assumption; equipment varies. Manufacturer catalog: https://www.vollrathfoodservice.com/downloads/101375/CAT2024SmallwaresCountertopEquipmentCatalogen-pdf. These are scenarios, not measured capacities. No piece/weight-only serving is assigned a volume without food-specific evidence. Source and current economics must remain separately attributed. No shared recipe or profile writes in this patch.
