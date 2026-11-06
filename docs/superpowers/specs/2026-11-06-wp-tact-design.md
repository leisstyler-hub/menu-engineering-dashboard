# W&P TACT foundation

Authority: Tyler, event d2907b86740abccbc8f6b6060d4c8cd94258dd03acc9221c52ea2465d54fe24d, approving section 1 and requiring equal tagging richness on future menus. Owner Chief; existing isolated branch chief/wp-pan-tags, baseline 4eaae5c.

Use one versioned, deterministic sensory profile for every food, including previously unseen incoming rows. Taste, aroma, color and texture each carry values, review state and evidence. Missing evidence stays Needs review. Name/description/ingredient inference is Proposed, never reviewed sensory truth. Preserve existing reviewed classifications and exact identifiers; retain legacy flavor/texture fields for current suggestions. No mandatory balance score or changed service/cost logic.

Extend existing profileFor, item Tags and workbook exports. Intake manifests must use this same function, retain every incoming row (including unknowns/duplicates), expose identity ambiguity and explicitly report no shared persistence. Audit all current read-only catalog rows with dimension coverage counts. Shared schema, catalog writes and recipe publication are outside this application build.

Approach: reuse the shared profile function rather than a fixed backfill or a second import classifier. This ensures new menus receive the same vocabulary automatically. The final visual bar guide remains a later section; this foundation makes its dimensions consistent. Preserve reviewed values even if unsupported vocabulary needs review; do not silently translate legacy Flavor into reviewed taste/aroma.

Acceptance: unseen dish displays evidence-labeled TACT at desktop/mobile; unknown dish has four explicit gaps; reviewed empty dimensions are not repopulated; exact MRNs survive intake and exports; old service/suggestion behavior passes; no operational writes.
