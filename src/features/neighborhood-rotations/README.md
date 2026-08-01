# Neighborhood Rotations

Weekly cafe rotation planning, Smartsheet-aligned records, history, and executive review.

Current implementation: `NeighborhoodRotations.jsx`.

Next clean split: move Smartsheet record shaping, rotation calculations, planner sections, and executive results into local modules.

Planner Remote Control handoff: the shared control is intentionally collapsed by default into a full-width black icon bar. Keep all seven actions reachable without horizontal scrolling while collapsed, including at phone widths; preserve real keyboard-operable buttons, accessible names/tooltips, focus rings, and the colored status indicator. Put labels, cafe/week context, copied/update state, and submit guidance behind Expand. Expanded labels must shrink and wrap inside their own button boundaries at desktop and phone widths; phone buttons stack the small icon above the label while desktop buttons keep the inline layout. Do not restore a fixed label width that clips `Generate Menu`, `View/Print`, or `Save Draft`. A live submission must force the details open so the storage warning stays visible. This component is shared across all districts, cafes, and selectable weeks; do not fork its presentation by district.

Dawson Carvery promotion handoff: use the isolated `carveryPromotionOverride` state and `carveryPromotion` saved-record family. The option is available in every selectable week, supports individual weekdays, and replaces the normal Carvery selections whenever enabled. Do not reuse the rotation-wide Global `promotionOverride` for this path or Dawson's Global station will be affected.

Dawson Moby Pop-Up handoff: `cafeStationsForWeek()` adds the required `mobyPopUp` station only for Dawson weeks starting `2026-08-31` or later. Service is Tuesday through Thursday. Normal state lives in `mobyPopUp`, offers all Global menus plus `AMZ: Carvery`, and exposes fixed capacities of 2 entrees, 3 sides, 2 sub recipes, and 1 extension populated from the selected menu's MenuWorks rows. Promotion state lives separately in `mobyPopUpPromotionOverride`, saves under `mobyPopUpPromotion`, permits only Tuesday/Wednesday/Thursday day toggles (including one day), and replaces/hides the whole normal Moby configuration while enabled. Keep both saved-record families isolated from Dawson Global, Carvery, and the rotation-wide promotion override; Supabase remains authoritative through the existing flexible rotation-record contract, so this feature requires no schema migration.
