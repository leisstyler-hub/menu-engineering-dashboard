# Neighborhood Rotations

Weekly cafe rotation planning, Smartsheet-aligned records, history, and executive review.

Current implementation: `NeighborhoodRotations.jsx`.

Next clean split: move Smartsheet record shaping, rotation calculations, planner sections, and executive results into local modules.

Planner Remote Control handoff: the shared control is intentionally collapsed by default into a full-width black icon bar. Keep all seven actions reachable without horizontal scrolling while collapsed, including at phone widths; preserve real keyboard-operable buttons, accessible names/tooltips, focus rings, and the colored status indicator. Put labels, cafe/week context, copied/update state, and submit guidance behind Expand. A live submission must force the details open so the storage warning stays visible. This component is shared across all districts, cafes, and selectable weeks; do not fork its presentation by district.

Dawson Carvery promotion handoff: use the isolated `carveryPromotionOverride` state and `carveryPromotion` saved-record family. The option is available in every selectable week, supports individual weekdays, and replaces the normal Carvery selections whenever enabled. Do not reuse the rotation-wide Global `promotionOverride` for this path or Dawson's Global station will be affected.
