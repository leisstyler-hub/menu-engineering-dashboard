# Menu analysis labels and readable tool cards

Authority: Tyler event c5341b77ee4c2b6cb39b5c8c523e53b43028e90cd261c599bc5e999162e2ce76, approving proposed labels and requesting all landing tool descriptions be readable. Owner Chief, solo; branch chief/menu-analysis-labels; base/rollback 666776375f2edb7c0b0e6e66dcbced7d90d85be8.

Plan: rename main action Open Menu Analysis and inner Menu Matrix choice/navigation to Menu Performance. Retain W&P Guidance and behavior. Shorten all 12 tool descriptions, remove desktop/mobile description clamps and mobile title clamp, wrap action text while preserving its arrow. Update accessible-name test selectors, verify all cards at 320/390/1440/1920px and exercise both analysis paths. Run full package gate, fresh self-review and production checks before LIVE. No data/source changes or operational writes.

Alternatives: shorter descriptions alone could still clip with future text or narrow widths; chosen solution combines concise copy with wrapping and naturally growing cards. No tooltip or hidden description is required to read the card. Product tool names remain recognizable; source recipes are not exposed.

Acceptance test failed against prior markup before implementation. Four-width checks verify all 12 full descriptions, unclamped titles, button width and page containment. A wide-screen title measurement differed by one pixel due to fractional typography; permit that rounding while still rejecting clamps or actual overflow. Source file line endings preserved when changing the Menu Performance labels.
