# Recipe-derived Pairwise - November 3, 2026

Owner Chief. Tyler requested the full uploaded archive intake and Pairwise rebuild at Buzz event `fd360e879332fa0c6cedbb573b64ffb83c49ac9aa3aa4de16bcd879cc5081a80`, thread `37b9830d69f9303f1ccd9fd69074b89e08e4053e3d164b8a161a73cb6eb22a4a`. This extends the earlier Andes private staging approach to all supplied packets. It does not enable recipe viewing or authorize catalog/SSMT replacement.

## Source and behavior

Archive SHA256 `90ac0229a27c93c4988a560e2eed1e999b7a83820a4d9b7496963724b1b6cc18` contains 57 PDFs and 4,095 pages. Extraction retains 3,812 recipe occurrences (2,103 distinct text MRNs), 24,729 ingredient rows, exact portions, parent context, report dates, revision dates and source versions. These are source occurrences, not 3,812 distinct recipes. Multiple Street Eats books share one source-menu membership. The newly supplied October Andes book remains separate from the earlier November Andes batch.

Recipe mode reads the current reviewed presence release from Supabase through a fixed service-only RPC. The API recomputes Jaccard/portfolio statistics from allowlisted ingredient-presence fields. A refreshed release changes comparisons without rebuilding the frontend. Historical August shopping-list comparisons remain separately selectable and retain their original source and scores. Recipe data failures display an error rather than silently showing old scores as current.

The recipe cohort uses exact normalized ingredient descriptions, with a distinct `recipe-name:` namespace for coded and uncoded rows. Codes remain exact private source evidence; none is converted to a purchasing MIT. This is ingredient-description overlap, not certified SKU equivalence or realized savings. Plain Jaccard and existing pantry exclusion intent remain. Exact pantry-name equivalents cover Tap Water, Kosher Salt, Canola Oil, Ground/Fine Ground Black Pepper and Granulated Sugar in the recipe report naming order.

Subrecipes expand transitively. Repeated contextual variants are retained; several alternatives can support presence only if their complete transitive leaf sets agree. Missing, conflicting or cyclic dependencies block that menu's score. Quantities are retained exactly, including source blanks; presence scoring does not invent quantities or infer mass.

The reviewed projection has 56 visible menus and 52 scored menus, producing 1,326 pairs. Breakfast remains unscored because its PDF cover says YVR Menu. MTO Deli, Pho and WP Salad Bar have no supplied packets. Chickle and Balti Pilot remain visible under Needs pillar assignment; approved pillar definitions are unchanged. Packet dates, versions, release identity and bounded gap explanations are public comparison metadata.

## Private storage and recovery

`supabase/recipe-pairwise-intake.sql` adds five tables in the existing private intake schema. Every table has forced RLS and no anon/authenticated grants. The fixed RPC is executable only by service_role. Original PDFs use the existing private `culinary-recipe-packets` bucket with no-overwrite, content-addressed objects and download hash verification. Books and ingredients are additive, immutable import records; the original Andes tables, public catalog, document attachments and canonical SSMT are outside this import.

1,425 exact MRN/compatible portion links are proposed in the private intake. Unmatched/conflicting records remain retained, and the wrong-menu Breakfast packet has no proposed catalog links. The existing catalog is not rewritten to fit a packet. All culinary profiles carry evidence or explicit Unknown / Needs review values in the private companion manifest; no canonical shared Tags update is claimed.

Production script and confidential manifests remain outside the source repository at `RESEARCH/AMAZON_RECIPE_BOOKS_2026_11_03/` in the Buzz workspace. Per-book SQL hashes, source hashes, upload receipts and readback results form the import record. Activation requires the exact 57 source hashes, 3,812 variants and 24,729 ingredients, then asserts one active release inside one transaction.

Recovery: revert the application to baseline `d53cccb3a47a21b5c19e5ef900995e1ee268e6e2` and retain the historical snapshot. For source rollback, transactionally set the new presence release inactive and restore the previous reviewed active release if one existed; this is the first v2 presence release, so zero active releases intentionally means unavailable recipe mode. Keep every new private book, ingredient row and object quarantined/unpublished for audit; do not drop tables or delete packets. Original Andes and operational records require no restoration because they are untouched. Never run destructive cleanup automatically.

## Validation and state

Independent source checks enumerate all 3,812 ingredient tables and account exactly once for 25,104 ingredient-name text cells across all pages. All 24,729 extracted ingredient names, codes and quantities agree with PDFjs after 244 documented clipped-column resolutions against PyMuPDF. The independent reviewer accepted the source, privacy and guarded activation design with nonblocking hardening notes addressed. This review is distinct from runtime verification.

Implementation and production evidence are recorded separately in the workspace execution record. No LIVE claim is established by this design document alone.

### Private production import verified

All 57 original PDFs passed no-overwrite upload and authenticated download SHA256 verification. Readback matched every relational recipe/ingredient field against immutable manifests: 3,812 variants and 24,729 ingredients, zero mismatches; 1,425 private proposed links. The active safe presence release is `de48debc5bb19641a5e0e80296b461d1f1c997f0a395e5b68db897d495368eca`. All 57 public object probes were denied, new tables force RLS without browser grants, and the fixed reader denies anon/authenticated execution. Catalog/document/canonical SSMT/original Andes fingerprints match the saved preflight. This establishes the private data state; app deployment and canonical production browser proof are recorded separately after publication.
