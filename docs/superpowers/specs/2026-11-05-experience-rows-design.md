# Experience review rows

Approved by Tyler: 530e5603df71a0ae68abfec746f355487a1004bc1b53c00f7a63235575060106, with copy refinement e0f6e6cd56f0f2cb4966bbe91342ac4288e1fd62eb0d4b8223aa5cbda637fe4c.

Intent: a tighter screen with information always in the same columns for fast menu reference.
Chosen approach: vertical table/list, Item/MRN | Description | Dietary/Calories | Modifiers | Flag. Descriptions receive most width. Named submenu outlines contain divider headings and saved items. Empty sections and leading items remain. Expanded modifiers stay with their item. Toolbar and Save/Send controls use existing handlers. Titles/descriptions only in selected-menu Copy All, including fallback.

Alternatives: compact cards rejected by Tyler because they scatter information; dense aligned list selected. Existing React/Tailwind stack retained. Chief chooses internal scrolling on narrow screens to retain column alignment and keep page width contained. No changes to roles, source authority, shared values or workflow semantics. Isolated browser saves only.
