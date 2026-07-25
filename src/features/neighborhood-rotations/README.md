# Neighborhood Rotations

Weekly cafe rotation planning, Smartsheet-aligned records, history, and executive review.

Current implementation: `NeighborhoodRotations.jsx`.

Next clean split: move Smartsheet record shaping, rotation calculations, planner sections, and executive results into local modules.

Dawson Carvery promotion handoff: use the isolated `carveryPromotionOverride` state and `carveryPromotion` saved-record family. The option is available in every selectable week, supports individual weekdays, and replaces the normal Carvery selections whenever enabled. Do not reuse the rotation-wide Global `promotionOverride` for this path or Dawson's Global station will be affected.
