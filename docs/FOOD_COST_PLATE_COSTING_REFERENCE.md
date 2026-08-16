# Food Cost Plate-Build Reference

> Agent reference for plate-level food-cost calculations. Source: `WebT Price Average AI Reference (1).xlsx`, reviewed August 15, 2026.

## Authority and handling rules

- This is the working plate-build and component-cost reference for Culinary Tools Platform food-cost work.
- Treat MRNs as exact text identifiers. Never coerce, round, or numerically reformat them.
- `Item + Waste Cost` is the item-level cost to use when calculating a plate. `Item Cost` and `Waste %` are retained for auditability.
- Sides and extensions remain individually costed and priced even when they are also selectable components of an entrée plate.
- `Sub Recipe` is the canonical planner-facing name for every composed plate component; generated application data must reject the retired label.
- A blank row-level `Plate Build` generally means the item is an individually sold component or a component whose grouping rule is pending; it does not mean that its cost is zero.
- All `AMZ+RA:` concepts are intentionally unclassified. Do not infer their component types, plate builds, grouping rules, special rules, or source-cost assumptions until directed.
- Compatibility/grouping rules, special rules, and source-cost-gap remediation remain pending except for the explicit confirmed treatments below. Do not infer additional exceptions.

## Confirmed plate-format decisions

| Concept | Confirmed treatment |
| --- | --- |
| Anisa | The combined planner may satisfy the entrée's two Side and two Sub Recipe requirements from either Lebanese or Persian reference stations, while all identities remain isolated to `AMZ: Anisa`. |
| Cafe Express Soup | `1 Entree` |
| Fish Market | Dedicated Fish Market LTO pricing automatically enumerates `1 Entree + 2 distinct Sides + 1 Sub Recipe sauce` from the same menu. MRN `1261` Lemon Wedge is not a sauce and is excluded from that automatic sauce pool. |
| Grill Core | Each selected Spotlights sandwich is shown with four automatic individual plate outcomes: the two lowest-cost and two highest-cost unique Grill Core Sides, deduplicated by item/MRN/portion/cost. |
| Pizzas & Flatbreads | `1 Entree` |
| Street Eats | Group and calculate by station/concept (for example, Naan Nomad separately from Pho Dip). |
| Taco Total | `1 Entree + 1 Bean Choice + 1 Protein Choice`. The listed bean and protein MRNs are the current reference set. |
| Tavola Nova | Combo is `1 Antipasti + 1 Primi + 1 Secondi`; Antipasti are also offered a la carte. |
| Wok | Group and calculate by station/concept (for example, Vietnamese separately from Japanese). |
| Yakisoba | `1 Entree` |

## Concept guide

| Menu Concept | Stations | Plate Build / Treatment | Component Types | Item Rows | Review Status |
| --- | --- | --- | --- | ---: | --- |
| AMZ: Andes | Andes | Entree + Base + 2 Sides + Sub Recipe; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side + Base; Side; Sub Recipe; Extension | 19 | Reviewed |
| AMZ: Anisa | Lebanese Menu; Persian Menu | 1 Entree + 2 Sides + 2 Sub Recipes; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Sub Recipe; Extension | 30 | Reviewed |
| AMZ: Atlas Noodle | Atlas Noodle | 1 Entree | Entree; Extension | 9 | Reviewed |
| AMZ: Balti | Balti | 1 Entree + 2 Sides; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Naan; Sub Recipe; Extension | 44 | Reviewed |
| AMZ: Bibimbowl | Bibimbap | 1 Entree; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Sub Recipe; Extension | 10 | Reviewed |
| AMZ: Breakfast | Handhelds; Hot Cereal / Yogurt Bar; Sides & More; Plates | Plate + 1 Side; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Plate; Side; Topping; Extension | 94 | Reviewed |
| AMZ: Cafe Express Curated Salads | Curated Salads | 1 Entree | Entree | 38 | Reviewed |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | 1 Entree | Entree; Side; Extension | 62 | Reviewed |
| AMZ: Cafe Express Soup | Soup | 1 Entree | Entree | 70 | Reviewed |
| AMZ: Carvery | Carvery Sandwiches; Premium Mains; Vegetarian Mains; Extensions; Sauces; Sides | 1 Entree + 2 Sides + 1 Sub Recipe; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Sub Recipe; Extension | 122 | Reviewed |
| AMZ: Cevicheria | Cevicheria | 1 Entree + 1 Chips + 1 Sub Recipe; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Chips; Sub Recipe; Extension | 15 | Reviewed |
| AMZ: Chaatwalla | Chaatwalla | 1 Entree + 1 Side; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY; Complimentary with each order of other station items | Entree; Side; Sub Recipe; Extension | 28 | Reviewed |
| AMZ: Chiang Mai | Chiang Mai | 1 Entree + Rice + Papaya Salad | Entree; Side; Extension | 11 | Reviewed |
| AMZ: Ciudad | Ciudad | 1 Entree + 2 Sides | Entree; Side; Extension | 23 | Reviewed |
| AMZ: Cypress | Cypress | 1 Entree + 2 Sides | Entree; Side; Extension | 23 | Reviewed |
| AMZ: Fish Market | Fish Market; LTO | 1 Entree + 2 Sides + 1 Sub Recipe; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Sub Recipe | 51 | Reviewed |
| AMZ: Fresh Five | Deli; Grill; Hibernate; Salad; Soup; Sides | 1 Entree | Entree; Side | 98 | Reviewed |
| AMZ: Greens & Grains | Greens & Grains | Entree + Base; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Base | 39 | Reviewed |
| AMZ: Grill Core | Grill Core; Spotlights | 1 Entree + 1 Side; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Extension | 41 | Reviewed |
| AMZ: Harvest Co. | Harvest Co. | 1 Entree + 2 Sides; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Sub Recipe | 17 | Reviewed |
| AMZ: House of Teriyaki | Teriyaki | Entree + Side + Sub Recipe; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Sub Recipe | 13 | Reviewed |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | 1 Entree + 1 Rice + 1 Side | Entree; Rice; Side; Extension | 23 | Reviewed |
| AMZ: Lotus | Lotus | 1 Entree + 1 Base + 2 Sides; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Base; Sub Recipe; Extension | 26 | Reviewed |
| AMZ: Masaya | Masaya | 1 Entree + 1 Base + 2 Sides | Entree; Base; Side; Extension | 19 | Reviewed |
| AMZ: Ohana | Hawaiian | Entree + Rice + 2 Sides | Entree; Side; Rice; Extension | 23 | Reviewed |
| AMZ: Pho | Pho | 1 Entree; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Sub Recipe | 7 | Reviewed |
| AMZ: Piccola Italia | Piccola Italia | 1 Entree + 2 Sides + Garlic Bread | Entree; Side; Garlic Bread; Extension | 29 | Reviewed |
| AMZ: Pizzas & Flatbreads | Flatbreads; Pizzas | 1 Entree | Entree; Side; Extension | 30 | Reviewed |
| AMZ: Poke Counter | Poke | 1 Entree + 1 Base + 5 Toppings + 1 Sub Recipe; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Base; Sub Recipe; Topping | 26 | Reviewed |
| AMZ: Porto | Piri Piri | 1 Entree + 2 Sides + 1 Sub Recipe; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Sub Recipe; Extension | 12 | Reviewed |
| AMZ: Roam BBQ | Roam BBQ | 1 Entree + 2 Sides + 4 Sub Recipes; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Sub Recipe; Extension | 24 | Reviewed |
| AMZ: Saffron | Saffron | 1 Entree + 2 Sides | Entree; Side | 7 | Reviewed |
| AMZ: Salt & Char | Salt & Char | 1 Entree + 1 Side; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Extension | 17 | Reviewed |
| AMZ: Smokehouse BBQ | Big City BBQ | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe; NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY | Entree; Side; Cornbread; Sub Recipe; Extension | 30 | Reviewed |
| AMZ: Street Eats | El Queso Birria; Fried Rice; Naan Nomad; Pho Dip; Quesadillas | Varies by station: group Naan Nomad, Pho Dip, and each other Street Eats station independently. | Entree; Side; Sub Recipe; Extension | 40 | Reviewed |
| AMZ: Taco Total | Taco Total | 1 Entree + 1 Bean Choice + 1 Protein Choice | Entree; Side; Base; Topping; Protein; Extension | 36 | Reviewed |
| AMZ: Tavola Nova | Antipasti; Dolce; Primi; Secondi | Combo: 1 Antipasti + 1 Primi + 1 Secondi; Antipasti are also available a la carte. | Antipasti; Extension; Primi; Secondi | 18 | Reviewed |
| AMZ: Wok | Bibimbap - Wok; Japanese - Wok; Lotus - Wok; Teriyaki - Wok; Thai - Wok; Vietnamese - Wok | Varies by station: group Vietnamese, Japanese, and each other Wok station independently. | Entree; Extension; Side; Rice; Sub Recipe | 95 | Reviewed |
| AMZ: Yakisoba | Yakisoba | 1 Entree | Entree | 5 | Reviewed |
| AMZ+RA: Barbanzo | RA BARBANZO | Unknown — intentionally blank / not yet classified. | Pita; Base | 38 | RA unknown — do not infer |
| AMZ+RA: Bowl Inc | BOWL INC | Unknown — intentionally blank / not yet classified. |  | 8 | RA unknown — do not infer |
| AMZ+RA: Chickle | RA CHICKLE | Unknown — intentionally blank / not yet classified. |  | 20 | RA unknown — do not infer |
| AMZ+RA: Cutlet | CUTLET | Unknown — intentionally blank / not yet classified. |  | 10 | RA unknown — do not infer |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Unknown — intentionally blank / not yet classified. |  | 11 | RA unknown — do not infer |
| AMZ+RA: Katora | RA KATORA | Unknown — intentionally blank / not yet classified. |  | 9 | RA unknown — do not infer |
| AMZ+RA: La Chino | La Chino | Unknown — intentionally blank / not yet classified. |  | 20 | RA unknown — do not infer |
| AMZ+RA: Oregano | Oregano | Unknown — intentionally blank / not yet classified. |  | 13 | RA unknown — do not infer |
| AMZ+RA: Paninoteca | RA PANINTOECA | Unknown — intentionally blank / not yet classified. |  | 33 | RA unknown — do not infer |
| AMZ+RA: Q Bowl | Q Bowl | Unknown — intentionally blank / not yet classified. |  | 10 | RA unknown — do not infer |
| AMZ+RA: Simmers | RA SIMMERS | Unknown — intentionally blank / not yet classified. |  | 23 | RA unknown — do not infer |
| AMZ+RA: Smaco | RA SMACO | Unknown — intentionally blank / not yet classified. |  | 10 | RA unknown — do not infer |
| AMZ+RA: Smoothies | Smoothies | Unknown — intentionally blank / not yet classified. |  | 10 | RA unknown — do not infer |
| AMZ+RA: Sushi | Sushi | Unknown — intentionally blank / not yet classified. |  | 27 | RA unknown — do not infer |

## Full item cost index

The tables below preserve the workbook's item records. `Protein` is the canonical spelling for Taco Total’s component type (the source workbook used `Protien`).

### AMZ: Andes

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Andes | Andes | aji de gallina | 122251 | 8 ounce | Entree | 11.75 | 2.4732 | 0.04 | 2.5722 | 0.2189 | 2.2979 | 0.1863 | Entree + Base + 2 Sides + Sub Recipe |
| AMZ: Andes | Andes | chicharron de langostino | 122254 | 5 ounce | Entree | 13 | 1.675 | 0.04 | 1.742 | 0.134 |  |  | Entree + Base + 2 Sides + Sub Recipe |
| AMZ: Andes | Andes | lomo saltado | 122258 | 8 ounce | Entree | 13 | 3.7513 | 0.04 | 3.9013 | 0.3001 |  |  | Entree + Base + 2 Sides + Sub Recipe |
| AMZ: Andes | Andes | peruvian stewed tofu | 122251.4 | 8 ounce | Entree | 11.75 | 1.4115 | 0.04 | 1.468 | 0.1249 |  |  | Entree + Base + 2 Sides + Sub Recipe |
| AMZ: Andes | Andes | pollo a la brasa | 122260 | 1 piece | Entree | 11.75 | 1.7366 | 0.04 | 1.8061 | 0.1537 |  |  | Entree + Base + 2 Sides + Sub Recipe |
| AMZ: Andes | Andes | arroz chaufa | 122256 | 1 cup | Side + Base | 2.55 | 0.7236 | 0.04 | 0.7525 | 0.2951 | 0.6633 | 0.2601 |  |
| AMZ: Andes | Andes | Cooked Quinoa | 73825.2 | 1 cup | Side + Base | 2.55 | 0.8754 | 0.04 | 0.9104 | 0.357 |  |  |  |
| AMZ: Andes | Andes | jasmine rice | 5354.11 | 1 cup | Side + Base | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  |  |
| AMZ: Andes | Andes | French Fries | 8414 | 4 ounce | Side | 2.55 | 0.4375 | 0.04 | 0.455 | 0.1784 | 0.6784 | 0.266 |  |
| AMZ: Andes | Andes | fried plantains | 103294 | 1/2 cup | Side | 2.55 | 0.5146 | 0.04 | 0.5352 | 0.2099 |  |  |  |
| AMZ: Andes | Andes | peruvian grilled asparagus | 122257 | 4 ounce | Side | 2.55 | 1.4616 | 0.04 | 1.52 | 0.5961 |  |  |  |
| AMZ: Andes | Andes | peruvian roasted potatoes | 122259 | 4 ounce | Side | 2.55 | 0.2934 | 0.04 | 0.3052 | 0.1197 |  |  |  |
| AMZ: Andes | Andes | salsa criolla | 122262 | 4 ounce | Side | 2.55 | 0.7192 | 0.04 | 0.7479 | 0.2933 |  |  |  |
| AMZ: Andes | Andes | solterito | 122263 | 4 ounce | Side | 2.55 | 0.5979 | 0.04 | 0.6218 | 0.2438 |  |  |  |
| AMZ: Andes | Andes | yucca fries | 51228.1 | 4 ounce | Side | 2.55 | 0.5421 | 0.04 | 0.5638 | 0.2211 |  |  |  |
| AMZ: Andes | Andes | aji amarillo dipping sauce | 122252 | 1 floz | Sub Recipe |  | 0.3682 | 0.04 | 0.3829 |  | 0.3509 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Andes | Andes | huacatay dipping sauce | 122255 | 1 floz | Sub Recipe |  | 0.4241 | 0.04 | 0.4411 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Andes | Andes | spicy rocoto dipping sauce | 122261 | 1 floz | Sub Recipe |  | 0.2198 | 0.04 | 0.2286 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Andes | Andes | horchata almond pudding | 122265 | 1 each | Extension | 3.85 | 0.6619 | 0.04 | 0.6884 | 0.1788 | 0.6884 | 0.1788 |  |

### AMZ: Anisa

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Anisa | Lebanese Menu | chicken souvlaki kebab plate | 216051 | 1 each | Entree | 11.75 | 1.8355 | 0.04 | 1.9089 | 0.1625 | 2.6261 | 0.2133 | 1 Entree + 2 Sides + 2 Sub Recipes |
| AMZ: Anisa | Lebanese Menu | lamb kofta kebab plate | 216051.1 | 1 each | Entree | 13 | 5.5671 | 0.04 | 5.7898 | 0.4454 |  |  | 1 Entree + 2 Sides + 2 Sub Recipes |
| AMZ: Anisa | Lebanese Menu | lemon herb halloumi kebab plate | 216051.2 | 1 serving(s) | Entree | 11.75 | 1.8491 | 0.04 | 1.923 | 0.1637 |  |  | 1 Entree + 2 Sides + 2 Sub Recipes |
| AMZ: Anisa | Persian Menu | sumac pistachio halloumi kebab plate | 216051.5 | 1 serving(s) | Entree | 11.75 | 1.8841 | 0.04 | 1.9595 | 0.1668 |  |  | 1 Entree + 2 Sides + 2 Sub Recipes |
| AMZ: Anisa | Persian Menu | sumac tomato eggplant plate | 216051.6 | 1 serving(s) | Entree | 11.75 | 1.0011 | 0.04 | 1.0412 | 0.0886 |  |  | 1 Entree + 2 Sides + 2 Sub Recipes |
| AMZ: Anisa | Persian Menu | za'atar lamb kofta kebab plate | 216051.3 | 1 serving(s) | Entree | 13 | 2.8518 | 0.04 | 2.9658 | 0.2281 |  |  | 1 Entree + 2 Sides + 2 Sub Recipes |
| AMZ: Anisa | Persian Menu | zaffron ember chicken plate | 216051.4 | 1 serving(s) | Entree | 11.75 | 2.687 | 0.04 | 2.7945 | 0.2378 |  |  | 1 Entree + 2 Sides + 2 Sub Recipes |
| AMZ: Anisa | Lebanese Menu | Grilled Vegetables | 172546 | 4 ounce | Side | 2.55 | 0.6589 | 0.04 | 0.6853 | 0.2687 | 0.6882 | 0.2699 |  |
| AMZ: Anisa | Lebanese Menu | harissa cauliflower and hummus | 181410.1 | 4 ounce | Side | 2.55 | 0.7118 | 0.04 | 0.7402 | 0.2903 |  |  |  |
| AMZ: Anisa | Lebanese Menu | lemon basmati rice | 165425 | 1 cup | Side | 2.55 | 0.3961 | 0.04 | 0.412 | 0.1616 |  |  |  |
| AMZ: Anisa | Lebanese Menu | Tabbouleh | 78664 | 1/2 cup | Side | 2.55 | 0.5646 | 0.04 | 0.5872 | 0.2303 |  |  |  |
| AMZ: Anisa | Persian Menu | crisp cucumber salad | 81258.2 | 1/2 cup | Side | 2.55 | 0.5558 | 0.04 | 0.578 | 0.2267 |  |  |  |
| AMZ: Anisa | Persian Menu | crispy saffron rice with yogurt and eggs | 191654 | 1 cup | Side | 2.55 | 1.0615 | 0.04 | 1.104 | 0.4329 |  |  |  |
| AMZ: Anisa | Persian Menu | Grilled Vegetables | 172546 | 4 ounce | Side | 2.55 | 0.6589 | 0.04 | 0.6853 | 0.2687 |  |  |  |
| AMZ: Anisa | Persian Menu | harissa cauliflower and hummus | 181410.1 | 4 ounce | Side | 2.55 | 0.7118 | 0.04 | 0.7402 | 0.2903 |  |  |  |
| AMZ: Anisa | Persian Menu | jewelled rice | 191690 | 1 cup | Side | 2.55 | 0.6364 | 0.04 | 0.6619 | 0.2596 |  |  |  |
| AMZ: Anisa | Lebanese Menu | baba ghanoush | 24347.7 | 2 floz | Sub Recipe |  | 0.4169 | 0.04 | 0.4336 |  | 0.4606 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Anisa | Lebanese Menu | harissa relish | 191490 | 2 floz | Sub Recipe |  | 0.4712 | 0.04 | 0.49 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Anisa | Lebanese Menu | tahini sauce | 61291.6 | 2 floz | Sub Recipe |  | 0.5982 | 0.04 | 0.6221 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Anisa | Lebanese Menu | whipped garlic toum | 144613 | 2 ounce | Sub Recipe |  | 0.279 | 0.04 | 0.2901 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Anisa | Persian Menu | cucumber yogurt dip | 78682.1 | 2 ounce | Sub Recipe |  | 0.5364 | 0.04 | 0.5578 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Anisa | Persian Menu | mezze butter | 191736 | 2 oz portion | Sub Recipe |  | 0.4069 | 0.04 | 0.4232 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Anisa | Persian Menu | red pepper pepita muhammara | 191730 | 1/4 cup | Sub Recipe |  | 0.4717 | 0.04 | 0.4906 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Anisa | Persian Menu | sumac onion relish | 191726 | 1/4 cup | Sub Recipe |  | 0.363 | 0.04 | 0.3775 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Anisa | Lebanese Menu | black tea | 191503 | 1 cup | Extension | 3.85 | 0.0695 | 0.04 | 0.0723 | 0.0188 | 1.448 | 0.253 |  |
| AMZ: Anisa | Lebanese Menu | fresh olive feta mezze platter | 143944.1 | 1 plate | Extension | 6.5 | 3.3535 | 0.04 | 3.4876 | 0.5366 |  |  |  |
| AMZ: Anisa | Lebanese Menu | sfoof cake | 216162 | 1 piece | Extension | 3.85 | 0.7351 | 0.04 | 0.7645 | 0.1986 |  |  |  |
| AMZ: Anisa | Persian Menu | black tea | 191503 | 1 cup | Extension | 3.85 | 0.0695 | 0.04 | 0.0723 | 0.0188 |  |  |  |
| AMZ: Anisa | Persian Menu | fresh olive feta mezze platter | 143944.1 | 1 plate | Extension | 6.5 | 3.3535 | 0.04 | 3.4876 | 0.5366 |  |  |  |
| AMZ: Anisa | Persian Menu | persian pistachio cake | 191741 | 1 slice | Extension | 3.85 | 0.7726 | 0.04 | 0.8035 | 0.2087 |  |  |  |

### AMZ: Atlas Noodle

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Atlas Noodle | Atlas Noodle | chashu tofu sesame ramen | 201539.1 | 1 bowl | Entree | 11.75 | 5.124 | 0.04 | 5.3289 | 0.4535 | 5.7951 | 0.4794 | 1 Entree |
| AMZ: Atlas Noodle | Atlas Noodle | chicken chashu sesame ramen | 201539 | 1 bowl | Entree | 11.75 | 5.2011 | 0.04 | 5.4091 | 0.4604 |  |  | 1 Entree |
| AMZ: Atlas Noodle | Atlas Noodle | chicken jajangmyeon | 201546.1 | 1 bowl | Entree | 11.75 | 4.6819 | 0.04 | 4.8692 | 0.4144 |  |  | 1 Entree |
| AMZ: Atlas Noodle | Atlas Noodle | pork belly black tonkotsu ramen bowl | 213619 | 1 each | Entree | 13 | 6.7632 | 0.04 | 7.0337 | 0.5411 |  |  | 1 Entree |
| AMZ: Atlas Noodle | Atlas Noodle | pork belly jajangmyeon | 201546 | 1 bowl | Entree | 13 | 4.6232 | 0.04 | 4.8081 | 0.3699 |  |  | 1 Entree |
| AMZ: Atlas Noodle | Atlas Noodle | steak jajangmyeon | 201546.2 | 1 bowl | Entree | 11.75 | 8.059 | 0.04 | 8.3814 | 0.7133 |  |  | 1 Entree |
| AMZ: Atlas Noodle | Atlas Noodle | tofu jajangmyeon | 201546.3 | 1 each | Entree | 11.75 | 4.5533 | 0.04 | 4.7355 | 0.403 |  |  | 1 Entree |
| AMZ: Atlas Noodle | Atlas Noodle | black sesame miso cookies | 176618 | 3 each | Extension | 3.85 | 0.8524 | 0.04 | 0.8865 | 0.2303 | 0.6294 | 0.1635 |  |
| AMZ: Atlas Noodle | Atlas Noodle | sesame peanut hotteok pancake | 210236 | 1 serving(s) | Extension | 3.85 | 0.3579 | 0.04 | 0.3723 | 0.0967 |  |  |  |

### AMZ: Balti

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Balti | Balti | butter chicken plate | 212486.1 | 1 serving(s) | Entree | 11.75 | 3.0868 | 0.04 | 3.2103 | 0.2732 | 3.0808 | 0.2547 | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | chicken bhuna masala plate | 212486.4 | 1 serving(s) | Entree | 11.75 | 2.4988 | 0.04 | 2.5987 | 0.2212 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | chicken chettinad plate | 212486.7 | 1 serving(s) | Entree | 11.75 | 3.0167 | 0.04 | 3.1374 | 0.267 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | chicken coconut curry plate | 212486.6 | 1 serving(s) | Entree | 11.75 | 2.9347 | 0.04 | 3.0521 | 0.2597 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | chicken jalfrezi plate | 212486.1 | 1 serving(s) | Entree | 11.75 | 2.8973 | 0.04 | 3.0132 | 0.2564 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | chicken korma plate | 212486.2 | 1 serving(s) | Entree | 11.75 | 2.837 | 0.04 | 2.9505 | 0.2511 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | chicken moilee plate | 212486.8 | 1 serving(s) | Entree | 11.75 | 2.3328 | 0.04 | 2.4261 | 0.2065 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | chicken palak plate | 212486.3 | 1 serving(s) | Entree | 11.75 | 2.6918 | 0.04 | 2.7995 | 0.2383 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | chicken tikka masala plate | 212486.9 | 1 serving(s) | Entree | 11.75 | 2.4642 | 0.04 | 2.5628 | 0.2181 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | coconut mushroom matar plate | 212486.19 | 1 serving(s) | Entree | 11.75 | 2.0743 | 0.04 | 2.1573 | 0.1836 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | lamb rogan josh plate | 212486.21 | 1 serving(s) | Entree | 13 | 3.7484 | 0.04 | 3.8983 | 0.2999 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | lamb vindaloo plate | 212486.2 | 1 serving(s) | Entree | 13 | 3.7681 | 0.04 | 3.9188 | 0.3014 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | matar paneer plate | 212486.12 | 1 serving(s) | Entree | 11.75 | 2.827 | 0.04 | 2.9401 | 0.2502 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | palak paneer plate | 212486.13 | 1 serving(s) | Entree | 11.75 | 2.9166 | 0.04 | 3.0333 | 0.2582 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | paneer makhni plate | 212486 | 1 serving(s) | Entree | 11.75 | 3.2857 | 0.04 | 3.4171 | 0.2908 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | roasted tandoori salmon plate | 212486.22 | 1 serving(s) | Entree | 13 | 6.5224 | 0.04 | 6.7833 | 0.5218 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | shrimp coconut curry plate | 212486.15 | 1 serving(s) | Entree | 13 | 3.3938 | 0.04 | 3.5295 | 0.2715 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | shrimp moilee plate | 212486.17 | 1 serving(s) | Entree | 13 | 2.7883 | 0.04 | 2.8998 | 0.2231 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | spicy andhra chicken curry plate | 212486.5 | 1 serving(s) | Entree | 11.75 | 2.5287 | 0.04 | 2.6299 | 0.2238 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | spicy andhra vegetable curry plate | 212486.14 | 1 serving(s) | Entree | 11.75 | 2.355 | 0.04 | 2.4492 | 0.2084 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | vegetable cashew kurma plate | 212486.18 | 1 serving(s) | Entree | 11.75 | 2.2733 | 0.04 | 2.3642 | 0.2012 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | vegetable chettinad plate | 212486.16 | 1 serving(s) | Entree | 11.75 | 2.6175 | 0.04 | 2.7222 | 0.2317 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | vegetable shahi korma plate | 212486.11 | 1 serving(s) | Entree | 11.75 | 2.2734 | 0.04 | 2.3643 | 0.2012 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | Aloo Gobhi | 118677 | 1/2 cup | Side | 2.55 | 0.6459 | 0.04 | 0.6717 | 0.2634 | 1.0101 | 0.3961 |  |
| AMZ: Balti | Balti | basmati rice | 165741.34 | 1 cup | Side | 2.55 | 0.4425 | 0.04 | 0.4602 | 0.1805 |  |  |  |
| AMZ: Balti | Balti | bhuna dal | 164850 | 1/2 cup | Side | 2.55 | 1.2121 | 0.04 | 1.2606 | 0.4943 |  |  |  |
| AMZ: Balti | Balti | cashew dakshin kurma | 165741.13 | 1/2 cup | Side | 2.55 | 0.9175 | 0.04 | 0.9542 | 0.3742 |  |  |  |
| AMZ: Balti | Balti | chana masala | 165741.24 | 1/2 cup | Side | 2.55 | 1.1214 | 0.04 | 1.1662 | 0.4573 |  |  |  |
| AMZ: Balti | Balti | jeera rice | 165741.21 | 1 cup | Side | 2.55 | 0.46 | 0.04 | 0.4784 | 0.1876 |  |  |  |
| AMZ: Balti | Balti | kale poriyal | 193119 | 1/2 cup | Side | 2.55 | 1.3848 | 0.04 | 1.4402 | 0.5648 |  |  |  |
| AMZ: Balti | Balti | lemon cashew rice | 165741.19 | 1 cup | Side | 2.55 | 0.9664 | 0.04 | 1.0051 | 0.3942 |  |  |  |
| AMZ: Balti | Balti | oggrene huli | 165741 | 1/2 cup | Side | 2.55 | 1.4695 | 0.04 | 1.5283 | 0.5993 |  |  |  |
| AMZ: Balti | Balti | punjabi rajma | 165741.12 | 1/2 cup | Side | 2.55 | 0.8031 | 0.04 | 0.8352 | 0.3275 |  |  |  |
| AMZ: Balti | Balti | spinach dal | 165741.9 | 1/2 cup | Side | 2.55 | 1.2685 | 0.04 | 1.3193 | 0.5174 |  |  |  |
| AMZ: Balti | Balti | taarka dal | 165741.3 | 1/2 cup | Side | 2.55 | 1.3149 | 0.04 | 1.3675 | 0.5363 |  |  |  |
| AMZ: Balti | Balti | vegetable palao rice | 165741.22 | 1 cup | Side | 2.55 | 0.6192 | 0.04 | 0.6439 | 0.2525 |  |  |  |
| AMZ: Balti | Balti | Garlic Butter Naan | 97343.4 | 1 each | Naan | 2.55 | 0.9887 | 0.04 | 1.0283 | 0.4032 | 1.0428 | 0.4089 | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | grilled naan | 155592 | 1 each | Naan | 2.55 | 1.0166 | 0.04 | 1.0573 | 0.4146 |  |  | 1 Entree + 2 Sides |
| AMZ: Balti | Balti | Mango Chutney | 89516 | 2 ounce | Sub Recipe |  | 0.2693 | 0.04 | 0.2801 |  | 0.7523 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Balti | Balti | Raita Sauce | 81281 | 2 ounce | Sub Recipe |  | 0.3208 | 0.04 | 0.3336 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Balti | Balti | Spicy Cilantro Chutney | 81768 | 2 ounce | Sub Recipe |  | 0.1336 | 0.04 | 0.139 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Balti | Balti | tamarind-date chutney | 87890 | 2 ounce | Sub Recipe |  | 2.1697 | 0.04 | 2.2565 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Balti | Balti | Mango Lassi | 105093 | 12 ounce | Extension | 3.85 | 1.4033 | 0.04 | 1.4594 | 0.3791 | 1.8467 | 0.4797 |  |
| AMZ: Balti | Balti | Vegetable Samosa | 127582.1 | 1 each | Extension | 3.85 | 2.1481 | 0.04 | 2.2341 | 0.5803 |  |  |  |

### AMZ: Bibimbowl

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Bibimbowl | Bibimbap | beef bulgogi bibimbap bowl | 145714.3 | 1 bowl | Entree | 13 | 6.0963 | 0.04 | 6.3401 | 0.4877 | 4.9075 | 0.3976 | 1 Entree |
| AMZ: Bibimbowl | Bibimbap | gochujang chicken bibimbap bowl | 145714.1 | 1 bowl | Entree | 11.75 | 3.8932 | 0.04 | 4.0489 | 0.3446 |  |  | 1 Entree |
| AMZ: Bibimbowl | Bibimbap | gochujang pork bibimbap bowl | 145714.4 | 1 bowl | Entree | 11.75 | 4.25 | 0.04 | 4.42 | 0.3762 |  |  | 1 Entree |
| AMZ: Bibimbowl | Bibimbap | gochujang tofu bibimbap bowl | 145714.2 | 1 bowl | Entree | 11.75 | 3.6858 | 0.04 | 3.8332 | 0.3262 |  |  | 1 Entree |
| AMZ: Bibimbowl | Bibimbap | shrimp bibimbap bowl | 145714.5 | 1 bowl | Entree | 13 | 5.6685 | 0.04 | 5.8952 | 0.4535 |  |  | 1 Entree |
| AMZ: Bibimbowl | Bibimbap | Ssamjang Sauce | 142259 | 1 floz | Sub Recipe |  | 0.2763 | 0.04 | 0.2873 |  | 0.3696 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Bibimbowl | Bibimbap | unagi sauce | 86977 | 1 floz | Sub Recipe |  | 0.1468 | 0.04 | 0.1527 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Bibimbowl | Bibimbap | yuzu mayo | 147394 | 2 tbsp | Sub Recipe |  | 0.6431 | 0.04 | 0.6689 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Bibimbowl | Bibimbap | Fried Egg | 48575.1 | 1 each | Extension | 2.25 | 0.4938 | 0.04 | 0.5135 | 0.2282 | 0.4429 | 0.1625 |  |
| AMZ: Bibimbowl | Bibimbap | sesame peanut hotteok pancake | 210236 | 1 serving(s) | Extension | 3.85 | 0.3579 | 0.04 | 0.3723 | 0.0967 |  |  |  |

### AMZ: Breakfast

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Breakfast | Handhelds | Asiago Bagel | 63651.22 | 1 each | Entree | 5.15 | 0.7544 | 0.04 | 0.7846 | 0.1524 | 1.6563 | 0.2601 | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | avocado toast | 140220.1 | 1 each | Entree | 5.15 | 1.3746 | 0.04 | 1.4296 | 0.2776 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | bacon and egg burrito | 44576.2 | 1 each | Entree | 6.5 | 2.3175 | 0.04 | 2.4102 | 0.3708 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | bacon and egg burrito | 44576.1 | 1 sandwich | Entree | 6.5 | 2.5871 | 0.04 | 2.6906 | 0.4139 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | bacon egg and cheese taco | 118242 | 1 each | Entree | 4.15 | 1.1749 | 0.04 | 1.2219 | 0.2944 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | bacon egg cheddar croissant | 17350.24 | 1 each | Entree | 6.5 | 2.7465 | 0.04 | 2.8563 | 0.4394 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Bacon, Egg and Cheese Bagel Breakfast Sandwich | 39909.35 | 1 sandwich | Entree | 6.5 | 1.9261 | 0.04 | 2.0032 | 0.3082 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Bacon, Egg and Cheese Breakfast Sandwich | 39909.29 | 1 sandwich | Entree | 6.5 | 1.8046 | 0.04 | 1.8768 | 0.2887 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | BLTA | 9182.8 | 1 sandwich | Entree | 10.25 | 4.4504 | 0.04 | 4.6284 | 0.4516 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Blueberry Bagel | 63651 | 1 each | Entree | 5.15 | 0.5401 | 0.04 | 0.5617 | 0.1091 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | breakfast burrito supreme | 44575.1 | 1 each | Entree | 6.5 | 1.7003 | 0.04 | 1.7683 | 0.272 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | carrot cake almond chia pudding | 202086 | 1 each | Entree | 6.5 | 1.6563 | 0.04 | 1.7226 | 0.265 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | chocolate strawberry chia pudding | 201999 | 1 each | Entree | 6.5 | 2.0314 | 0.04 | 2.1127 | 0.325 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | chorizo potato and egg burrito | 9308.16 | 1 each | Entree | 6.5 | 1.9628 | 0.04 | 2.0413 | 0.3141 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Chorizo Tofu and Black Bean Burrito | 25250.3 | 1 sandwich | Entree | 6.5 | 1.659 | 0.04 | 1.7254 | 0.2654 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Cinnamon Raisin Bagel | 63651.1 | 1 each | Entree | 5.15 | 0.5353 | 0.04 | 0.5567 | 0.1081 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Deluxe Breakfast Sandwich | 134514.2 | 1 sandwich | Entree | 6.5 | 3.7565 | 0.04 | 3.9068 | 0.601 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Egg and Cheese Bagel Breakfast Sandwich | 39909.38 | 1 sandwich | Entree | 6.5 | 1.1166 | 0.04 | 1.1612 | 0.1787 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Egg and Cheese Breakfast Sandwich | 39909.3 | 1 sandwich | Entree | 6.5 | 0.995 | 0.04 | 1.0348 | 0.1592 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Ham and Egg Breakfast Sandwich | 39909.21 | 1 sandwich | Entree | 6.5 | 1.5314 | 0.04 | 1.5927 | 0.245 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | ham egg & cheese wheat muffin | 8595.2 | 1 sandwich | Entree | 6.5 | 1.3559 | 0.04 | 1.4102 | 0.2169 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Jalapeno Cheddar Bagel | 143008.6 | 1 serving(s) | Entree | 5.15 | 0.325 | 0.04 | 0.338 | 0.0656 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | lox bagel | 78466 | 1 sandwich | Entree | 9.9 | 3.7901 | 0.04 | 3.9417 | 0.3982 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | meatlovers breakfast wrap | 44549 | 1 sandwich | Entree | 6.5 | 2.0823 | 0.04 | 2.1656 | 0.3332 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | mediterranean egg white wrap | 66313.12 | 1 sandwich | Entree | 6.5 | 2.2588 | 0.04 | 2.3492 | 0.3614 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Onion Bagel | 63651.5 | 1 each | Entree | 5.15 | 0.3472 | 0.04 | 0.3611 | 0.0701 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | pistachio pomegranate overnight oats | 124386.12 | 1 each | Entree | 6.5 | 2.6206 | 0.04 | 2.7254 | 0.4193 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Plain Bagel | 63651.6 | 1 each | Entree | 5.15 | 0.3267 | 0.04 | 0.3397 | 0.066 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | potato egg and cheese burrito | 156368 | 1 each | Entree | 6.5 | 1.2968 | 0.04 | 1.3487 | 0.2075 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | potato egg and cheese taco | 118242.1 | 1 each | Entree | 4.15 | 0.7676 | 0.04 | 0.7983 | 0.1924 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Sausage and Egg Breakfast Sandwich | 39909.8 | 1 sandwich | Entree | 6.5 | 1.4081 | 0.04 | 1.4644 | 0.2253 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | sausage egg and cheese biscuit | 17350.27 | 1 sandwich | Entree | 6.5 | 1.1625 | 0.04 | 1.209 | 0.186 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Sausage, Egg and Cheese Bagel Breakfast Sandwich | 39909.39 | 1 sandwich | Entree | 6.5 | 1.5086 | 0.04 | 1.569 | 0.2414 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Sausage, Egg, and Cheese Breakfast Sandwich | 39909.26 | 1 sandwich | Entree | 6.5 | 1.8138 | 0.04 | 1.8863 | 0.2902 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Sesame Seed Bagel | 63651.8 | 1 each | Entree | 5.15 | 0.4583 | 0.04 | 0.4767 | 0.0926 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | soyrizo breakfast burrito | 9308.17 | 1 each | Entree | 6.5 | 1.8212 | 0.04 | 1.8941 | 0.2914 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | Vegetarian Breakfast Burrito | 159932 | 1 each | Entree | 6.5 | 1.1499 | 0.04 | 1.1959 | 0.184 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | whole wheat bagel | 224106 | 1 each | Entree | 5.15 | 0.5591 | 0.04 | 0.5815 | 0.1129 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | old fashioned oatmeal | 3428.18 | 10 ounce | Entree | 5.15 | 0.1523 | 0.04 | 0.1584 | 0.0308 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Sides & More | 3 eggs (cooked to order) | 5306.42 | 3 each | Entree | 5.6 | 1.4846 | 0.04 | 1.5439 | 0.2757 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Sides & More | cheesy smoked bacon strata | 137820.2 | 2 each | Entree | 4.95 | 1.8968 | 0.04 | 1.9727 | 0.3985 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Sides & More | grilled pineapple coconut chia pudding | 203093 | 1 each | Entree | 5 | 1.9195 | 0.04 | 1.9962 | 0.3992 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Sides & More | spinach and parmesan strata | 23378.25 | 2 each | Entree | 4.95 | 1.3545 | 0.04 | 1.4087 | 0.2846 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Plates | Biscuits and Gravy | 129795 | 1 plate | Plate |  | 0.9823 | 0.04 | 1.0215 |  | 2.2739 | 0.3768 | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Plates | breakfast plate | 210366 | 1 serving(s) | Plate | 10.85 | 1.8152 | 0.04 | 1.8878 | 0.174 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Plates | brioche french toast | 124956.1 | 1 serving(s) | Plate |  | 2.2909 | 0.04 | 2.3826 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Plates | buttermilk pancakes plate | 616.113 | 1 serving(s) | Plate |  | 1.5191 | 0.04 | 1.5799 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Plates | Mediterranean Quiche | 216146 | 1 slice | Plate | 6.5 | 2.9001 | 0.04 | 3.0161 | 0.464 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Plates | rainbow chia bowl | 187361 | 1 serving(s) | Plate | 7.1 | 4.3128 | 0.04 | 4.4853 | 0.6317 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Plates | three egg omelet | 31516 | 1 each | Plate | 6.5 | 1.4846 | 0.04 | 1.5439 | 0.2375 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Sides & More | Bacon | 147718 | 5 slice | Side | 4.6 | 1.3016 | 0.04 | 1.3536 | 0.2943 | 0.9906 | 0.2279 |  |
| AMZ: Breakfast | Sides & More | Chicken Apple Sausage Link | 178365 | 2 each | Side | 4.6 | 1.5106 | 0.04 | 1.571 | 0.3415 |  |  |  |
| AMZ: Breakfast | Sides & More | Fresh Fruit Cup | 13158.4 | 4 oz parfait | Side | 2.55 | 0.4118 | 0.04 | 0.4283 | 0.1679 |  |  |  |
| AMZ: Breakfast | Sides & More | Meatless Sausage Link | 66612 | 3 each | Side | 4.6 | 1.1943 | 0.04 | 1.2421 | 0.27 |  |  |  |
| AMZ: Breakfast | Sides & More | Meatless Vegetarian Sausage Patty | 69553 | 2 each | Side | 4.6 | 1.1545 | 0.04 | 1.2006 | 0.261 |  |  |  |
| AMZ: Breakfast | Sides & More | Pork Sausage Link | 1125.1 | 2 each | Side | 4.6 | 1.058 | 0.04 | 1.1003 | 0.2392 |  |  |  |
| AMZ: Breakfast | Sides & More | Pork Sausage Patty | 2060.1 | 2 each | Side | 4.6 | 0.9079 | 0.04 | 0.9442 | 0.2053 |  |  |  |
| AMZ: Breakfast | Sides & More | potatoes o'brien | 8018.34 | 1/2 cup | Side | 2.55 | 0.4503 | 0.04 | 0.4683 | 0.1836 |  |  |  |
| AMZ: Breakfast | Sides & More | Scrambled Eggs | 29653.4 | 4 ounce | Side | 5.6 | 0.7796 | 0.04 | 0.8108 | 0.1448 |  |  |  |
| AMZ: Breakfast | Sides & More | Turkey Sausage Link | 57570 | 3 each | Side | 4.6 | 0.757 | 0.04 | 0.7872 | 0.1711 |  |  |  |
| AMZ: Breakfast | Handhelds | blueberry cream cheese | 88645.1 | 2 ounce | Topping |  | 0.4966 | 0.04 | 0.5165 |  | 0.3006 | 0.0959 | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Handhelds | chive cream cheese | 64335 | 2 ounce | Topping |  | 0.5418 | 0.04 | 0.5635 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Handhelds | Cream Cheese | 63391 | 2 ounce | Topping |  | 0.5367 | 0.04 | 0.5582 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Handhelds | Everything Bagel | 63651.2 | 1 each | Topping | 5.15 | 0.4151 | 0.04 | 0.4317 | 0.0838 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Handhelds | herbed cream cheese | 66475 | 2 ounce | Topping |  | 0.5551 | 0.04 | 0.5773 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Handhelds | lemon dill cream cheese | 66197.1 | 2 ounce | Topping |  | 0.535 | 0.04 | 0.5564 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Handhelds | scallion cream cheese | 66197.2 | 2 ounce | Topping |  | 0.5427 | 0.04 | 0.5644 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Handhelds | strawberry cream cheese | 66197 | 2 ounce | Topping |  | 0.515 | 0.04 | 0.5356 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Agave Nectar | 63610.3 | 1 tbsp | Topping |  | 0.1572 | 0.04 | 0.1635 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Blueberries | 13170 | 2 tbsp | Topping |  | 0.3 | 0.04 | 0.312 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | candied pecans | 11157.5 | 1 tbsp | Topping |  | 0.1278 | 0.04 | 0.1329 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Chia Seeds | 63113.1 | 1 tsp | Topping |  | 0.0937 | 0.04 | 0.0974 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Creamy Peanut Butter | 63396 | 1 tbsp | Topping |  | 0.0629 | 0.04 | 0.0655 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Dried Cherries | 63484 | 1 tbsp | Topping |  | 0.3801 | 0.04 | 0.3953 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Dried Cranberries | 62347 | 1 tbsp | Topping |  | 0.0593 | 0.04 | 0.0617 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Golden Raisins | 64579 | 1 tbsp | Topping |  | 0.0364 | 0.04 | 0.0379 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Honey | 63610 | 1 tbsp | Topping |  | 0.1993 | 0.04 | 0.2073 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Light Brown Sugar | 15576 | 1 tbsp | Topping |  | 0.0457 | 0.04 | 0.0475 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Low Fat Vanilla Yogurt | 4592 | 8 ounce | Topping | 6.5 | 0.7987 | 0.04 | 0.8307 | 0.1278 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Nutella | 63112 | 1 tbsp | Topping |  | 0.2085 | 0.04 | 0.2169 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Oats 'N Honey Granola | 136095 | 1/2 ounce | Topping |  | 0.1712 | 0.04 | 0.178 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Pancake Syrup | 228627 | 1 tbsp | Topping |  | 0.0447 | 0.04 | 0.0465 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Pumpkin Seeds | 71070.3 | 1 tbsp | Topping |  | 0.3733 | 0.04 | 0.3883 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Raspberries | 29187.6 | 2 tbsp | Topping |  | 0.2941 | 0.04 | 0.3058 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Roasted Sunflower Seeds | 62349 | 1 tbsp | Topping |  | 0.1825 | 0.04 | 0.1898 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Semi Sweet Chocolate Chips | 63498 | 1 tbsp | Topping |  | 0.1473 | 0.04 | 0.1532 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Sliced Banana | 18480 | 2 tbsp | Topping |  | 0.0547 | 0.04 | 0.0569 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | steel cut oats | 3428.27 | 10 ounce | Topping | 5.15 | 0.2359 | 0.04 | 0.2453 | 0.0476 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Strawberries | 66194 | 2 tbsp | Topping |  | 0.1746 | 0.04 | 0.1816 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | toasted almonds | 101464.1 | 1 tbsp | Topping |  | 0.1322 | 0.04 | 0.1375 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Toasted Shredded Coconut | 61182 | 1 tbsp | Topping |  | 0.1634 | 0.04 | 0.17 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Toasted Walnuts | 33991.1 | 1 tbsp | Topping |  | 0.1788 | 0.04 | 0.1859 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Breakfast | Hot Cereal / Yogurt Bar | Whole Milk Plain Greek Yogurt | 63629.1 | 8 ounce | Topping | 6.5 | 0.7772 | 0.04 | 0.8083 | 0.1244 |  |  | Plate + 1 Side |
| AMZ: Breakfast | Sides & More | cinnamon roll with cream cheese frosting | 213693 | 1 each | Extension | 3.85 | 0.8219 | 0.04 | 0.8548 | 0.222 | 0.8548 | 0.222 |  |

### AMZ: Cafe Express Curated Salads

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Cafe Express Curated Salads | Curated Salads | apple farro arugula salad | 200784 | 1 serving(s) | Entree | 9.2 | 2.6329 | 0.04 | 2.7382 | 0.2976 | 3.02 | 0.3 | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | Arugula and Beet Salad | 76761.14 | 1 serving(s) | Entree | 9.2 |  | 0.04 |  |  |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | Asian Cashew Salad | 87152 | 1 serving(s) | Entree | 9.2 | 3.6384 | 0.04 | 3.784 | 0.4113 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | Asian Chicken Almond Salad | 78060 | 1 serving(s) | Entree | 14.95 | 4.8733 | 0.04 | 5.0683 | 0.339 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | baja crunch salad | 114287.3 | 1 serving(s) | Entree | 9.2 | 3.5692 | 0.04 | 3.712 | 0.4035 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | Barley, Quinoa and Lentil Salad | 74723.4 | 1 serving(s) | Entree | 9.2 | 2.3069 | 0.04 | 2.3992 | 0.2608 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | BBQ chop salad | 191052 | 1 serving(s) | Entree | 9.2 | 2.3524 | 0.04 | 2.4465 | 0.2659 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | caesar salad | 16373.2 | 1 serving(s) | Entree | 9.2 | 0.866 | 0.04 | 0.9006 | 0.0979 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | chef salad | 16526.14 | 1 serving(s) | Entree | 9.2 | 2.2024 | 0.04 | 2.2905 | 0.249 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | chef salad | 46859.21 | 1 serving(s) | Entree | 14.95 | 3.5315 | 0.04 | 3.6728 | 0.2457 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | chicken caesar salad | 24060.44 | 1 serving(s) | Entree | 14.95 | 3.3255 | 0.04 | 3.4585 | 0.2313 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | chopped salad | 147426.2 | 1 serving(s) | Entree | 9.2 | 3.6894 | 0.04 | 3.8369 | 0.4171 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | Classic Caesar Salad | 76761.4 | 11-1/2 ounce | Entree | 9.2 | 4.3732 | 0.04 | 4.5481 | 0.4944 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | classic cobb salad | 8374.6 | 1 serving(s) | Entree | 9.2 | 4.5516 | 0.04 | 4.7337 | 0.5145 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | cucumber and kale quinoa salad | 141067.5 | 1 serving(s) | Entree | 9.2 | 0.8326 | 0.04 | 0.8659 | 0.0941 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | garden salad | 191050 | 1 serving(s) | Entree | 9.2 | 3.4491 | 0.04 | 3.5871 | 0.3899 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | greek grains salad | 11242.7 | 1 serving(s) | Entree | 9.2 | 3.5267 | 0.04 | 3.6678 | 0.3987 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | greek salad | 11242.6 | 1 serving(s) | Entree | 9.2 | 2.7476 | 0.04 | 2.8575 | 0.3106 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | green goddess chopped salad | 102917.4 | 1 serving(s) | Entree | 9.2 | 5.2648 | 0.04 | 5.4754 | 0.5952 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | green goddess pistachio salad | 199128 | 1 serving(s) | Entree | 9.2 | 4.5225 | 0.04 | 4.7035 | 0.5112 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | harvest kale almond salad with ranch | 145521.2 | 1 serving(s) | Entree | 9.2 | 2.1995 | 0.04 | 2.2875 | 0.2486 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | italian antipasti salad | 46859.23 | 1 serving(s) | Entree | 9.2 | 3.6526 | 0.04 | 3.7987 | 0.4129 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | Korean Green Leaf Salad | 88312 | 1 serving(s) | Entree | 9.2 | 0.6143 | 0.04 | 0.6389 | 0.0694 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | latin quinoa salad | 9888.14 | 1 serving(s) | Entree | 8.95 | 2.331 | 0.04 | 2.4242 | 0.2709 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | mezze quinoa bowl | 139434 | 1 serving(s) | Entree | 9.2 | 2.6443 | 0.04 | 2.75 | 0.2989 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | napa peanut sesame soy cabbage salad | 200826 | 1 serving(s) | Entree | 9.2 | 2.9757 | 0.04 | 3.0947 | 0.3364 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | NW Garden Salad | 134121.1 | 1 serving(s) | Entree | 9.2 | 3.1957 | 0.04 | 3.3235 | 0.3612 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | sesame cashew miso crunch salad | 191153 | 1 serving(s) | Entree | 9.2 | 2.9888 | 0.04 | 3.1083 | 0.3379 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | smoked almond cobb salad | 191038 | 1 serving(s) | Entree | 9.2 | 2.5366 | 0.04 | 2.6381 | 0.2867 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | southwest cobb salad | 135542.4 | 1 serving(s) | Entree | 9.2 | 3.8117 | 0.04 | 3.9642 | 0.4309 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | southwest salad | 135542.3 | 1 serving(s) | Entree | 9.2 | 3.5879 | 0.04 | 3.7314 | 0.4056 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | spinach strawberry pistachio salad | 67971.8 | 1 serving(s) | Entree | 9.2 | 1.6771 | 0.04 | 1.7442 | 0.1896 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | strawberry farro chicken salad | 84322.1 | 1 serving(s) | Entree | 14.95 | 3.1244 | 0.04 | 3.2494 | 0.2174 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | thai peanut salad | 135643.12 | 1 serving(s) | Entree | 9.2 | 1.8367 | 0.04 | 1.9101 | 0.2076 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | Thai Salad | 150860 | 1 serving(s) | Entree | 9.2 | 1.3201 | 0.04 | 1.3729 | 0.1492 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | turkey cobb salad | 8374 | 1 serving(s) | Entree | 14.95 | 3.4711 | 0.04 | 3.61 | 0.2415 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | Tuscan Salad | 34135.1 | 1 serving(s) | Entree | 9.2 | 1.1922 | 0.04 | 1.2399 | 0.1348 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Salads | Curated Salads | Vegan Protein Blast Salad | 83064 | 1 serving(s) | Entree | 9.2 | 2.1998 | 0.04 | 2.2878 | 0.2487 |  |  | 1 Entree |

### AMZ: Cafe Express Curated Sandwiches

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | artichoke chicken sandwich | 191178 | 1 sandwich | Entree | 11.25 | 2.999 | 0.04 | 3.119 | 0.2772 | 3.19 | 0.2891 | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Balsamic Mushroom Caprese | 174949 | 1 sandwich | Entree | 10.2 | 3.9526 | 0.04 | 4.1107 | 0.403 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | bbq pulled pork sandwich | 44956.1 | 1 sandwich | Entree | 11.25 | 2.0999 | 0.04 | 2.1839 | 0.1941 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | beef brisket sandwich | 10379.3 | 1 sandwich | Entree | 11.25 | 5.2252 | 0.04 | 5.4342 | 0.483 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | black forest ham and brie panini | 33674.5 | 1 sandwich | Entree | 11.25 | 2.3287 | 0.04 | 2.4218 | 0.2153 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | BLTA | 9182.8 | 1 sandwich | Entree | 11.25 | 4.4504 | 0.04 | 4.6284 | 0.4114 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | buffalo chicken wrap | 9282.1 | 1 each | Entree | 11.25 | 2.9798 | 0.04 | 3.099 | 0.2755 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | caprese chicken on telera | 104208.27 | 1 sandwich | Entree | 11.25 | 2.9031 | 0.04 | 3.0192 | 0.2684 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | caprese sandwich | 34303.45 | 1 sandwich | Entree | 10.2 | 2.8909 | 0.04 | 3.0065 | 0.2948 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | carne asada torta | 157816 | 1 each | Entree | 11.25 | 5.3356 | 0.04 | 5.5491 | 0.4932 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | chicken caesar wrap | 37311.43 | 1 wrap | Entree | 11.25 | 4.3231 | 0.04 | 4.496 | 0.3996 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | chimichurri steak sandwich | 105146.3 | 1 sandwich | Entree | 11.25 | 3.9324 | 0.04 | 4.0897 | 0.3635 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | crispy chicken ranch wrap | 68606 | 1 sandwich | Entree | 11.25 | 2.8173 | 0.04 | 2.9299 | 0.2604 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Crispy Chicken Sandwich | 77139.22 | 1 sandwich | Entree | 11.25 | 2.579 | 0.04 | 2.6822 | 0.2384 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Cubano | 161990 | 1 serving(s) | Entree | 11.25 | 2.1223 | 0.04 | 2.2072 | 0.1962 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | egg salad with bacon sandwich | 9134.2 | 1 sandwich | Entree | 11.25 | 2.2938 | 0.04 | 2.3856 | 0.2121 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Fried Fish Sandwich | 84329 | 1 sandwich | Entree | 11.25 | 5.1424 | 0.04 | 5.3481 | 0.4754 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | gourmet pomodoro grilled cheese | 15832.4 | 1 sandwich | Entree | 10.2 | 1.7176 | 0.04 | 1.7863 | 0.1751 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Grilled Chicken Chimichurri Sandwich | 76319 | 1 sandwich | Entree | 11.25 | 3.9278 | 0.04 | 4.0849 | 0.3631 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | ham and brie sandwich | 142454 | 1 sandwich | Entree | 11.25 | 2.5078 | 0.04 | 2.6081 | 0.2318 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | ham and swiss sandwich on telera | 131168.13 | 1 sandwich | Entree | 11.25 | 2.4386 | 0.04 | 2.5361 | 0.2254 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | italian grinder | 76623.4 | 1 sandwich | Entree | 11.25 | 4.1253 | 0.04 | 4.2903 | 0.3814 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Jackfruit Barbecue Sandwich | 135703 | 1 sandwich | Entree | 10.2 | 1.5618 | 0.04 | 1.6243 | 0.1592 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Mediterranean Falafel Wrap | 102969 | 1 serving(s) | Entree | 10.2 | 3.5006 | 0.04 | 3.6406 | 0.3569 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | mediterranean turkey wrap | 190990 | 1 wrap | Entree | 11.25 | 2.8253 | 0.04 | 2.9383 | 0.2612 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | monte cristo | 2394.1 | 1 sandwich | Entree | 11.25 | 1.2931 | 0.04 | 1.3448 | 0.1195 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | peppy panini | 9171 | 1 sandwich | Entree | 11.25 | 2.5438 | 0.04 | 2.6456 | 0.2352 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | pistachio mortadella burrata sandwich | 191049 | 1 sandwich | Entree | 11.25 | 4.7727 | 0.04 | 4.9636 | 0.4412 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Porchetta Sandwich | 78027.1 | 1 sandwich | Entree | 11.25 | 2.5432 | 0.04 | 2.6449 | 0.2351 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Pork Bahn Mi with Spicy Mayo | 70355.1 | 1 sandwich | Entree | 11.25 | 0.4033 | 0.04 | 0.4194 | 0.0373 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Portobello Philly Sandwich | 84264.2 | 1 sandwich | Entree | 10.2 | 2.3753 | 0.04 | 2.4703 | 0.2422 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Quinoa and Roasted Vegetable Wrap | 83064.3 | 1 sandwich | Entree | 10.2 | 2.3783 | 0.04 | 2.4735 | 0.2425 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | roast beef and cheddar sandwich | 34303.46 | 1 sandwich | Entree | 11.25 | 3.4482 | 0.04 | 3.5861 | 0.3188 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Shrimp Po' Boy | 81246 | 1 sandwich | Entree | 11.25 | 4.142 | 0.04 | 4.3077 | 0.3829 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | shrimp scampi panini | 119106 | 1 sandwich | Entree | 11.25 | 3.2068 | 0.04 | 3.3351 | 0.2965 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | thai peanut tofu wrap | 190996 | 1 wrap | Entree | 10.2 | 4.3244 | 0.04 | 4.4974 | 0.4409 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | The Rachel | 84262 | 1 sandwich | Entree | 11.25 | 2.2891 | 0.04 | 2.3807 | 0.2116 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | tuna melt on sourdough | 106974.2 | 1 sandwich | Entree | 11.25 | 3.0765 | 0.04 | 3.1996 | 0.2844 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | turkey avocado club | 148838.3 | 1 sandwich | Entree | 11.25 | 5.3499 | 0.04 | 5.5639 | 0.4946 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | turkey bacon chipotle panini | 64199 | 1 sandwich | Entree | 11.25 | 3.0788 | 0.04 | 3.2019 | 0.2846 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | turkey swiss wrap | 8324.13 | 1 sandwich | Entree | 11.25 | 2.7563 | 0.04 | 2.8665 | 0.2548 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | tuscan vegetable sandwich | 108987 | 1 sandwich | Entree | 10.2 | 1.9784 | 0.04 | 2.0576 | 0.2017 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | vegetable samosa wrap | 212749 | 1 each | Entree | 10.2 | 0.8798 | 0.04 | 0.915 | 0.0897 |  |  | 1 Entree |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Broccoli and Cheddar Salad | 81534 | 4 ounce | Side | 2.55 | 0.6226 | 0.04 | 0.6475 | 0.2539 | 0.8786 | 0.3445 |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Chips, Multigrain, Garden Salsa, SunChips, 1.5 oz | 85357 | 1 each | Side | 2.55 | 0.7195 | 0.04 | 0.7483 | 0.2935 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Chips, Multigrain, Harvest Cheddar, SunChips, 1.5 oz | 85349 | 1 each | Side | 2.55 | 0.7196 | 0.04 | 0.7483 | 0.2935 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Chips, Potato, Kettle, Barbeque, Miss Vickies, 1.38 oz | 174424 | 1 each | Side | 2.55 | 0.6484 | 0.04 | 0.6743 | 0.2644 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Chips, Potato, Kettle, Jalapeno, Miss Vickies, 1.375 oz | 85838 | 1 each | Side | 2.55 | 0.72 | 0.04 | 0.7488 | 0.2936 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Chips, Potato, Kettle, Salt & Vinegar, Miss Vickies, 1.375 oz | 85360 | 1 each | Side | 2.55 | 0.7196 | 0.04 | 0.7484 | 0.2935 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Chips, Potato, Kettle, Sea Salt, Miss Vickies, 1.375 oz | 85362 | 1 each | Side | 2.55 | 0.7197 | 0.04 | 0.7485 | 0.2935 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Classic Coleslaw | 83591 | 4 ounce | Side | 2.55 | 0.3783 | 0.04 | 0.3934 | 0.1543 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | classic macaroni salad | 18177 | 1/2 cup | Side | 2.55 | 0.2086 | 0.04 | 0.217 | 0.0851 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | fingerling potato salad | 44855 | 4 ounce | Side | 2.55 | 0.6585 | 0.04 | 0.6848 | 0.2685 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | garden salad | 16811.6 | 1 each | Side | 2.55 | 1.6781 | 0.04 | 1.7452 | 0.6844 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | garden salad with balsamic dressing | 16811.5 | 1 each | Side | 2.55 | 1.8119 | 0.04 | 1.8844 | 0.739 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | garden salad with italian dressing | 16811.7 | 1 each | Side | 2.55 | 1.5857 | 0.04 | 1.6492 | 0.6467 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | greek pasta salad | 35069.5 | 1/2 cup | Side | 2.55 | 0.3261 | 0.04 | 0.3392 | 0.133 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | pistachio herb couscous salad | 120641 | 1/2 cup | Side | 2.55 | 1.1553 | 0.04 | 1.2015 | 0.4712 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Asian Pear | 20015.2 | 1 each | Extension | 1.55 | 0.667 | 0 | 0.667 | 0.4303 | 0.5683 | 0.3667 |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Honey Crisp Apple | 1638.1 | 1 each | Extension | 1.55 | 0.6877 | 0.04 | 0.7152 | 0.4614 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Orange | 20257 | 1 each | Extension | 1.55 | 0.4503 | 0 | 0.4503 | 0.2905 |  |  |  |
| AMZ: Cafe Express Curated Sandwiches | Curated Sandwiches | Peach | 44748 | 1 each | Extension | 1.55 | 0.4407 | 0 | 0.4407 | 0.2844 |  |  |  |

### AMZ: Cafe Express Soup

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Cafe Express Soup | Soup | Baked Stuffed Potato Soup | 3505 | 12 floz | Entree | 5.15 | 2.009 | 0.04 | 2.0894 | 0.4057 | 1.83 | 0.3372 |  |
| AMZ: Cafe Express Soup | Soup | Beef Barley Soup | 57584.2 | 12 floz | Entree | 5.15 | 1.178 | 0.04 | 1.2251 | 0.2379 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Beef Chili | 163498 | 12 ounce | Entree | 5.15 | 2.0482 | 0.04 | 2.1301 | 0.4136 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Black Bean Cuban-Style Soup | 177600 | 12 floz | Entree | 5.15 | 2.2619 | 0.04 | 2.3523 | 0.4568 |  |  |  |
| AMZ: Cafe Express Soup | Soup | black bean soup with cilantro cream | 11376.2 | 12 floz | Entree | 5.15 | 1.0517 | 0.04 | 1.0938 | 0.2124 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Broccoli and Cheddar Cheese Soup | 57668.3 | 12 floz | Entree | 5.15 | 1.4894 | 0.04 | 1.549 | 0.3008 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Broccoli Cheddar Soup | 4456 | 12 floz | Entree | 5.15 | 1.9626 | 0.04 | 2.0411 | 0.3963 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Butternut Ginger | 207678 | 12 floz | Entree | 5.15 | 3.0994 | 0.04 | 3.2234 | 0.6259 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Chana Masala Cauliflower Soup | 149692.3 | 12 floz | Entree | 5.15 | 2.0761 | 0.04 | 2.1591 | 0.4192 |  |  |  |
| AMZ: Cafe Express Soup | Soup | cheeseburger soup | 193152 | 12 floz | Entree | 5.15 | 1.2366 | 0.04 | 1.286 | 0.2497 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Chicken & Dumpling Soup | 19167 | 12 floz | Entree | 5.15 | 2.0336 | 0.04 | 2.115 | 0.4107 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Chicken and Orzo Soup | 77046.6 | 12 floz | Entree | 5.15 | 0.7404 | 0.04 | 0.77 | 0.1495 |  |  |  |
| AMZ: Cafe Express Soup | Soup | chicken baja enchilada soup | 213075 | 12 floz | Entree | 5.15 | 2.3537 | 0.04 | 2.4478 | 0.4753 |  |  |  |
| AMZ: Cafe Express Soup | Soup | chicken lentil mulligatawny | 131877 | 12 floz | Entree | 5.15 | 1.8972 | 0.04 | 1.9731 | 0.3831 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Chicken Noodle Soup | 57600.4 | 12 floz | Entree | 5.15 | 0.722 | 0.04 | 0.7509 | 0.1458 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Chicken Noodle Soup | 3501 | 12 floz | Entree | 5.15 | 1.4625 | 0.04 | 1.521 | 0.2953 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Chicken Tortilla Soup | 77046.4 | 12 floz | Entree | 5.15 | 0.9677 | 0.04 | 1.0065 | 0.1954 |  |  |  |
| AMZ: Cafe Express Soup | Soup | clam andouille gumbo | 131398 | 12 floz | Entree | 5.15 | 2.3758 | 0.04 | 2.4708 | 0.4798 |  |  |  |
| AMZ: Cafe Express Soup | Soup | clam chowder | 57709 | 12 floz | Entree | 5.15 | 1.8404 | 0.04 | 1.9141 | 0.3717 |  |  |  |
| AMZ: Cafe Express Soup | Soup | clam chowder | 57709.5 | 12 floz | Entree | 5.15 | 2.9259 | 0.04 | 3.0429 | 0.5909 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Clam Chowder | 4462 | 12 floz | Entree | 5.15 | 2.3328 | 0.04 | 2.4261 | 0.4711 |  |  |  |
| AMZ: Cafe Express Soup | Soup | corn and green chili bisque | 57614 | 12 floz | Entree | 5.15 | 0.7836 | 0.04 | 0.815 | 0.1582 |  |  |  |
| AMZ: Cafe Express Soup | Soup | corn chowder | 57623 | 12 floz | Entree | 5.15 | 0.7943 | 0.04 | 0.826 | 0.1604 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Corn Chowder | 3502 | 12 floz | Entree | 5.15 | 2.094 | 0.04 | 2.1777 | 0.4229 |  |  |  |
| AMZ: Cafe Express Soup | Soup | crab and sweet corn chowder | 4469.6 | 12 floz | Entree | 5.15 | 3.427 | 0.04 | 3.5641 | 0.6921 |  |  |  |
| AMZ: Cafe Express Soup | Soup | cream of asparagus soup | 193539 | 12 floz | Entree | 5.15 | 0.9842 | 0.04 | 1.0235 | 0.1987 |  |  |  |
| AMZ: Cafe Express Soup | Soup | cream of cauliflower soup | 57668.8 | 12 floz | Entree | 5.15 | 1.1999 | 0.04 | 1.2479 | 0.2423 |  |  |  |
| AMZ: Cafe Express Soup | Soup | creamed corn soup | 70145 | 12 floz | Entree | 5.15 | 1.162 | 0.04 | 1.2085 | 0.2347 |  |  |  |
| AMZ: Cafe Express Soup | Soup | creamy mushroom soup | 131388 | 12 floz | Entree | 5.15 | 1.4074 | 0.04 | 1.4637 | 0.2842 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Curried Rice & Lentil Soup | 13840 | 12 floz | Entree | 5.15 | 1.5346 | 0.04 | 1.596 | 0.3099 |  |  |  |
| AMZ: Cafe Express Soup | Soup | fagioli napoli with pasta soup | 192864 | 12 ounce | Entree | 5.15 | 0.6081 | 0.04 | 0.6324 | 0.1228 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Fiery Veggie Chili | 149692 | 12 floz | Entree | 5.15 | 2.1648 | 0.04 | 2.2513 | 0.4372 |  |  |  |
| AMZ: Cafe Express Soup | Soup | firefly chili | 4843.45 | 12 floz | Entree | 5.15 | 1.613 | 0.04 | 1.6775 | 0.3257 |  |  |  |
| AMZ: Cafe Express Soup | Soup | French Onion | 77088 | 12 floz | Entree | 5.15 | 0.8998 | 0.04 | 0.9357 | 0.1817 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Garden Vegetable Soup | 4467 | 12 floz | Entree | 5.15 | 1.4864 | 0.04 | 1.5459 | 0.3002 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Green Chile Posole | 207682 | 12 floz | Entree | 5.15 | 3.2063 | 0.04 | 3.3345 | 0.6475 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Italian Wedding Soup | 4465 | 12 floz | Entree | 5.15 | 1.5434 | 0.04 | 1.6052 | 0.3117 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Lemon Orzo Chicken Soup | 75665 | 12 floz | Entree | 5.15 | 1.8186 | 0.04 | 1.8914 | 0.3673 |  |  |  |
| AMZ: Cafe Express Soup | Soup | manhattan clam chowder | 57684 | 12 floz | Entree | 5.15 | 2.0711 | 0.04 | 2.1539 | 0.4182 |  |  |  |
| AMZ: Cafe Express Soup | Soup | mexican street corn soup | 180689 | 12 floz | Entree | 5.15 | 2.3733 | 0.04 | 2.4683 | 0.4793 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Miso Soup | 74499.2 | 12 floz | Entree | 5.15 | 0.7816 | 0.04 | 0.8129 | 0.1578 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Moroccan Tomato Soup with Lentils, Farro and Kale | 108481.1 | 12 floz | Entree | 5.15 | 1.0921 | 0.04 | 1.1358 | 0.2205 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Native Three Sisters Soup | 149692.4 | 12 floz | Entree | 5.15 | 2.0831 | 0.04 | 2.1664 | 0.4207 |  |  |  |
| AMZ: Cafe Express Soup | Soup | poblano quinoa corn soup | 38660.4 | 12 floz | Entree | 5.15 | 1.1356 | 0.04 | 1.181 | 0.2293 |  |  |  |
| AMZ: Cafe Express Soup | Soup | pomodoro soup | 74774.4 | 12 floz | Entree | 5.15 | 0.9044 | 0.04 | 0.9406 | 0.1826 |  |  |  |
| AMZ: Cafe Express Soup | Soup | pork caldo verde | 213068 | 12 floz | Entree | 5.15 | 2.2364 | 0.04 | 2.3259 | 0.4516 |  |  |  |
| AMZ: Cafe Express Soup | Soup | pork pozole verde | 61369.7 | 12 floz | Entree | 5.15 | 1.9125 | 0.04 | 1.989 | 0.3862 |  |  |  |
| AMZ: Cafe Express Soup | Soup | ribollita soup | 193239 | 12 floz | Entree | 5.15 | 0.8433 | 0.04 | 0.877 | 0.1703 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Roasted Poblano and Cheddar Soup | 4469.2 | 12 floz | Entree | 5.15 | 2.8583 | 0.04 | 2.9726 | 0.5772 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Santa Fe Tortilla Soup | 149692.5 | 12 floz | Entree | 5.15 | 2.0644 | 0.04 | 2.1469 | 0.4169 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Southwest Tortilla Soup | 4469 | 12 floz | Entree | 5.15 | 1.5676 | 0.04 | 1.6303 | 0.3166 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Spiced Carrot Soup | 182450 | 12 ounce | Entree | 5.15 | 3.09 | 0.04 | 3.2136 | 0.624 |  |  |  |
| AMZ: Cafe Express Soup | Soup | spicy harissa white bean soup | 4469.7 | 12 floz | Entree | 5.15 | 2.4042 | 0.04 | 2.5004 | 0.4855 |  |  |  |
| AMZ: Cafe Express Soup | Soup | spicy italian kale & chorizo soup | 84847 | 12 floz | Entree | 5.15 | 0.8117 | 0.04 | 0.8442 | 0.1639 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Spicy Lentil Vegetable Soup | 182460 | 12 ounce | Entree | 5.15 | 2.8281 | 0.04 | 2.9412 | 0.5711 |  |  |  |
| AMZ: Cafe Express Soup | Soup | spicy thai lentil soup | 131393 | 12 floz | Entree | 5.15 | 2.2059 | 0.04 | 2.2941 | 0.4455 |  |  |  |
| AMZ: Cafe Express Soup | Soup | split pea soup with ham | 62013 | 12 floz | Entree | 5.15 | 2.1751 | 0.04 | 2.2621 | 0.4392 |  |  |  |
| AMZ: Cafe Express Soup | Soup | steelhead trout chowder | 131437.1 | 12 floz | Entree | 5.15 | 2.1881 | 0.04 | 2.2757 | 0.4419 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Thai Coconut Curry Soup | 62032.2 | 12 floz | Entree | 5.15 | 1.6063 | 0.04 | 1.6705 | 0.3244 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Thai Red Curry Soup with Lentils | 190407 | 12 floz | Entree | 5.15 | 2.394 | 0.04 | 2.4898 | 0.4834 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Tomato Basil Bisque | 3506 | 12 floz | Entree | 5.15 | 1.4655 | 0.04 | 1.5242 | 0.296 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Tomato Lentil | 62071.1 | 12 floz | Entree | 5.15 |  | 0.04 |  |  |  |  |  |
| AMZ: Cafe Express Soup | Soup | turkey barley soup | 62074 | 12 floz | Entree | 5.15 | 1.2324 | 0.04 | 1.2817 | 0.2489 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Turkey Chili | 149692.1 | 12 floz | Entree | 5.15 | 2.1244 | 0.04 | 2.2094 | 0.429 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Vegetable Beef Barley Soup | 4461 | 12 floz | Entree | 5.15 | 1.9056 | 0.04 | 1.9818 | 0.3848 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Vegetable Minestrone Soup | 62082.2 | 12 floz | Entree | 5.15 |  | 0.04 |  |  |  |  |  |
| AMZ: Cafe Express Soup | Soup | Vegetarian Minestrone | 3504 | 12 floz | Entree | 5.15 | 1.6736 | 0.04 | 1.7406 | 0.338 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Vegetarian Pozole | 175213 | 12 floz | Entree | 5.15 | 2.1164 | 0.04 | 2.2011 | 0.4274 |  |  |  |
| AMZ: Cafe Express Soup | Soup | Wild Mushroom Bisque | 4464 | 12 floz | Entree | 5.15 | 1.8302 | 0.04 | 1.9034 | 0.3696 |  |  |  |
| AMZ: Cafe Express Soup | Soup | wild rice & mushroom soup | 11076.6 | 12 floz | Entree | 5.15 | 1.0797 | 0.04 | 1.1229 | 0.218 |  |  |  |

### AMZ: Carvery

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Carvery | Carvery Sandwiches | beef brisket sandwich | 10379.3 | 1 sandwich | Entree | 10.25 | 5.2252 | 0.04 | 5.4342 | 0.5302 | 2.23 | 0.3076 | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Carvery Sandwiches | black forest ham and brie panini | 33674.5 | 1 sandwich | Entree | 10.25 | 2.3287 | 0.04 | 2.4218 | 0.2363 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Carvery Sandwiches | Cajun Turkey | 76682.6 | 1 sandwich | Entree | 10.25 | 3.6619 | 0.04 | 3.8084 | 0.3716 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Carvery Sandwiches | classic beef french dip | 63618 | 1 each | Entree | 10.25 | 2.8265 | 0.04 | 2.9395 | 0.2868 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Carvery Sandwiches | cuban | 32415 | 1 sandwich | Entree | 10.25 | 2.0918 | 0.04 | 2.1755 | 0.2122 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Carvery Sandwiches | Porchetta Sandwich | 78027.1 | 1 sandwich | Entree | 10.25 | 2.5432 | 0.04 | 2.6449 | 0.258 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Carvery Sandwiches | portobello reuben | 38489.4 | 1 each | Entree | 9.2 | 3.0974 | 0.04 | 3.2213 | 0.3501 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Carvery Sandwiches | The Reuben | 84262.1 | 1 sandwich | Entree | 10.25 | 4.3262 | 0.04 | 4.4992 | 0.439 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Carvery Sandwiches | tuscan turkey sandwich | 20776.46 | 1 each | Entree | 10.25 | 2.7845 | 0.04 | 2.8959 | 0.2825 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | ancho honey glazed salmon | 131984 | 1 each | Entree | 13 | 3.4104 | 0.04 | 3.5468 | 0.2728 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Beef Brisket | 9631 | 5 oz portion | Entree | 13 | 3.0127 | 0.04 | 3.1332 | 0.241 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | blackened steelhead trout | 191368 | 1 each | Entree | 13 | 2.594 | 0.04 | 2.6978 | 0.2075 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | brown sugar mustard ham | 44863 | 5 ounce | Entree | 11.75 | 1.4231 | 0.04 | 1.48 | 0.126 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | carved cajun turkey breast | 44763.7 | 5 ounce | Entree | 0.67 | 2.3454 | 0.04 | 2.4392 | 3.6407 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Carved Pork Loin | 9010 | 5 oz portion | Entree | 11.75 | 1.1548 | 0.04 | 1.201 | 0.1022 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | cider braised pork shoulder | 88181.1 | 5 ounce | Entree | 13 | 2.1011 | 0.04 | 2.1852 | 0.1681 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Corned Beef Brisket | 93475.1 | 5 ounce | Entree | 13 | 3.4376 | 0.04 | 3.5751 | 0.275 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | creamy eggplant and impossible bake | 44891.2 | 1 serving(s) | Entree | 11.75 | 2.5171 | 0.04 | 2.6178 | 0.2228 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Flank Steak | 94006.1 | 5 ounce | Entree | 13 | 4.6395 | 0.04 | 4.8251 | 0.3712 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Garlic Herb Roasted Leg of Lamb | 143753 | 5 ounce | Entree | 13 | 1.4553 | 0.04 | 1.5135 | 0.1164 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | garlic sage pork chop | 70829 | 5 ounce | Entree | 13 | 1.9673 | 0.04 | 2.046 | 0.1574 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | grilled steak | 3972.12 | 5 ounce | Entree | 13 | 6.7697 | 0.04 | 7.0405 | 0.5416 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Herb Roasted Turkey Breast | 13573.4 | 5 ounce | Entree | 11.75 | 2.5656 | 0.04 | 2.6682 | 0.2271 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | herbed roast beef | 45120 | 5 ounce | Entree | 13 | 1.9667 | 0.04 | 2.0454 | 0.1573 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Hny Caj Salmon | 166683 | 5 oz portion | Entree | 13 | 2.8413 | 0.04 | 2.955 | 0.2273 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | lemongrass pork | 118124.1 | 5 ounce | Entree | 13 | 1.9751 | 0.04 | 2.0542 | 0.158 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Monster Meatloaf | 76432 | 5 ounce | Entree | 13 | 1.683 | 0.04 | 1.7503 | 0.1346 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | plant based meatloaf | 99064.2 | 1 piece | Entree | 11.75 | 3.0853 | 0.04 | 3.2087 | 0.2731 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | porchetta | 162512 | 5 ounce | Entree | 11.75 | 1.4719 | 0.04 | 1.5308 | 0.1303 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Rosemary Crusted Pork Loin | 144240 | 5 ounce | Entree | 13 | 1.6596 | 0.03 | 1.7094 | 0.1315 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | rotisserie chicken | 4651.19 | 1 each | Entree | 13 | 2.8337 | 0.04 | 2.9471 | 0.2267 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | shrimp mozambique | 142016.4 | 5 ounce | Entree | 13 | 2.2682 | 0.04 | 2.3589 | 0.1815 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Spiced Leg of Lamb | 143413 | 5 oz meat | Entree | 13 | 4.3187 | 0.04 | 4.4915 | 0.3455 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | spiced maple soy glazed steelhead | 194262 | 1 each | Entree | 13 | 3.137 | 0.04 | 3.2625 | 0.251 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | steelhead croquettes | 194276 | 2 each | Entree | 13 | 1.22 | 0.04 | 1.2688 | 0.0976 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Premium Mains | Traditional Meatloaf | 144069 | 5 ounce | Entree | 11.75 | 2.7827 | 0.04 | 2.894 | 0.2463 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Vegetarian Mains | butternut squash with toasted pecans | 134368.2 | 5 ounce | Entree | 11.75 | 0.5473 | 0.04 | 0.5692 | 0.0484 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Vegetarian Mains | ember roasted cabbage | 157988 | 2 ounce | Entree |  | 0.1732 | 0.04 | 0.1801 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Vegetarian Mains | espresso roasted carrots | 33992.194 | 1/4 cup | Entree |  | 0.118 | 0.04 | 0.1228 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Vegetarian Mains | Harissa Carrot | 142000 | 1/4 cup | Entree |  | 0.3604 | 0.04 | 0.3748 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Vegetarian Mains | herb smoked delicata squash | 158042 | 2 ounce | Entree |  | 0.6255 | 0.04 | 0.6505 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Vegetarian Mains | lemon pepper roasted cauliflower | 73729.66 | 1/4 cup | Entree |  | 0.2948 | 0.04 | 0.3066 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Vegetarian Mains | makhani roasted cauliflower | 73729.65 | 1/4 cup | Entree |  | 0.2595 | 0.04 | 0.2699 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Vegetarian Mains | miso soy stuffed kabocha squash | 31917.5 | 1 each | Entree | 11.75 | 0.4628 | 0.04 | 0.4813 | 0.041 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Vegetarian Mains | miso tofu roulade with pecans | 194280 | 1 slice | Entree | 11.75 | 1.0506 | 0.04 | 1.0926 | 0.093 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Vegetarian Mains | Mushroom Shawarma | 147085 | 2 oz portion | Entree |  | 0.9933 | 0.04 | 1.033 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Vegetarian Mains | pecan and lentil stuffed pumpkins | 78151.1 | 1 each | Entree | 11.75 | 2.6152 | 0.04 | 2.7198 | 0.2315 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Vegetarian Mains | plant based meatloaf | 99064.2 | 5 ounce | Entree | 11.75 | 2.0508 | 0.04 | 2.1328 | 0.1815 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Vegetarian Mains | plant-based cottage pie | 31680.13 | 1 serving(s) | Entree | 11.75 | 2.5528 | 0.04 | 2.6549 | 0.226 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Vegetarian Mains | Roasted Sun Chokes | 139607 | 2 ounce | Entree |  | 0.9806 | 0.04 | 1.0199 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Vegetarian Mains | seared maitake | 187004.1 | 1/4 cup | Entree |  | 0.3431 | 0.04 | 0.3568 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Vegetarian Mains | spiced roasted kabocha squash | 121459.3 | 4 ounce | Entree | 2.55 | 0.5105 | 0.04 | 0.5309 | 0.2082 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Carvery | Vegetarian Mains | Turmeric Roasted Cauliflower | 165393 | 1/4 cup | Entree |  | 0.0855 | 0.04 | 0.0889 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Extensions | caramelized onion braids | 65369.2 | 1 each | Side | 2.55 | 0.5163 | 0.04 | 0.537 | 0.2106 | 0.7438 | 0.2741 |  |
| AMZ: Carvery | Extensions | irish soda bread | 134228.1 | 1 serving(s) | Side | 2.55 | 0.1783 | 0.04 | 0.1855 | 0.0727 |  |  |  |
| AMZ: Carvery | Extensions | lemon garlic cloverleaf roll | 118109.2 | 1 each | Side | 2.55 | 0.3779 | 0.04 | 0.393 | 0.1541 |  |  |  |
| AMZ: Carvery | Extensions | pao de queijo | 147424.2 | 1 each | Side | 2.55 | 0.786 | 0.04 | 0.8174 | 0.3206 |  |  |  |
| AMZ: Carvery | Extensions | tomato pinwheels | 173732.1 | 1 each | Side | 2.55 | 0.4978 | 0.04 | 0.5177 | 0.203 |  |  |  |
| AMZ: Carvery | Sauces | Housemade Cornbread | 76856.3 | 4 ounce | Side | 2.55 | 0.5891 | 0.04 | 0.6126 | 0.2403 |  |  |  |
| AMZ: Carvery | Sides | braised cabbage, apples and bacon | 152159 | 1/2 cup | Side | 2.55 | 0.963 | 0.04 | 1.0015 | 0.3927 |  |  |  |
| AMZ: Carvery | Sides | Broccoli and Cheddar Salad | 81534 | 4 ounce | Side | 2.55 | 0.6226 | 0.04 | 0.6475 | 0.2539 |  |  |  |
| AMZ: Carvery | Sides | coleslaw | 156388.1 | 4 oz portion | Side | 2.55 | 0.4706 | 0.04 | 0.4894 | 0.1919 |  |  |  |
| AMZ: Carvery | Sides | Corn Succotash with Lima Beans | 27385.2 | 4 ounce | Side | 2.55 | 0.5385 | 0.04 | 0.5601 | 0.2196 |  |  |  |
| AMZ: Carvery | Sides | Couscous, Sun-Dried Tomato & Spinach | 42459.3 | 1/2 cup | Side | 2.55 | 0.7 | 0.04 | 0.728 | 0.2855 |  |  |  |
| AMZ: Carvery | Sides | Creamy Potato Salad | 104106 | 1/2 cup | Side | 2.55 | 0.4629 | 0.04 | 0.4815 | 0.1888 |  |  |  |
| AMZ: Carvery | Sides | cucumber tomato salad | 22656.5 | 1/2 cup | Side | 2.55 | 0.4895 | 0.04 | 0.5091 | 0.1996 |  |  |  |
| AMZ: Carvery | Sides | farmstand quinoa salad | 9888.3 | 4 ounce | Side | 2.55 | 0.5629 | 0.04 | 0.5854 | 0.2296 |  |  |  |
| AMZ: Carvery | Sides | Garlic Green Beans | 143768 | 1 serving(s) | Side | 2.55 | 1.6245 | 0.04 | 1.6894 | 0.6625 |  |  |  |
| AMZ: Carvery | Sides | garlic lemon broccolini | 4911.5 | 1/2 cup | Side | 2.55 | 1.7524 | 0.04 | 1.8225 | 0.7147 |  |  |  |
| AMZ: Carvery | Sides | Greek Pasta Salad | 35069.3 | 1/2 cup | Side | 2.55 | 0.3806 | 0.04 | 0.3959 | 0.1552 |  |  |  |
| AMZ: Carvery | Sides | harvest brussels salad with walnuts | 23959.4 | 1 serving(s) | Side | 2.55 | 0.9542 | 0.04 | 0.9924 | 0.3892 |  |  |  |
| AMZ: Carvery | Sides | Herb Roasted Potatoes | 91597.1 | 4 ounce | Side | 2.55 | 0.4058 | 0.04 | 0.422 | 0.1655 |  |  |  |
| AMZ: Carvery | Sides | Lemon Green Beans with Capers | 51529.3 | 1/2 cup | Side | 2.55 | 0.2335 | 0.04 | 0.2428 | 0.0952 |  |  |  |
| AMZ: Carvery | Sides | lemon thyme carrots | 7742.1 | 1/2 cup | Side | 2.55 | 0.1227 | 0.04 | 0.1276 | 0.05 |  |  |  |
| AMZ: Carvery | Sides | loaded potato | 172569.6 | 1 each | Side | 2.55 | 1.2952 | 0.04 | 1.347 | 0.5282 |  |  |  |
| AMZ: Carvery | Sides | Mac & Cheese | 135194.3 | 4 ounce | Side | 2.55 | 0.4861 | 0.04 | 0.5056 | 0.1983 |  |  |  |
| AMZ: Carvery | Sides | Maple roasted carrots | 175538 | 1/2 cup | Side | 2.55 | 0.4981 | 0.04 | 0.518 | 0.2031 |  |  |  |
| AMZ: Carvery | Sides | Mashed Potatoes | 162436 | 1/2 cup | Side | 2.55 | 0.4835 | 0.04 | 0.5029 | 0.1972 |  |  |  |
| AMZ: Carvery | Sides | mashed potatoes | 45118.8 | 1/2 cup | Side | 2.55 | 0.2627 | 0.04 | 0.2732 | 0.1071 |  |  |  |
| AMZ: Carvery | Sides | Molasses Baked Beans | 104107 | 1/2 cup | Side | 2.55 |  | 0.04 |  |  |  |  |  |
| AMZ: Carvery | Sides | mushroom and pecan rice pilaf | 24686 | 1/2 cup | Side | 2.55 | 0.6493 | 0.04 | 0.6753 | 0.2648 |  |  |  |
| AMZ: Carvery | Sides | piri piri potato wedges | 121015 | 4 oz portion | Side | 2.55 | 0.2222 | 0.04 | 0.231 | 0.0906 |  |  |  |
| AMZ: Carvery | Sides | roasted brussels sprouts | 75314.6 | 1/2 cup | Side | 2.55 | 0.4172 | 0.04 | 0.4339 | 0.1701 |  |  |  |
| AMZ: Carvery | Sides | Roasted Fingerling Potatoes | 166384 | 4 oz portion | Side | 2.55 | 3.6947 | 0.04 | 3.8425 | 1.5069 |  |  |  |
| AMZ: Carvery | Sides | Roasted Sweet Potato | 5633.14 | 1/2 cup | Side | 2.55 | 0.2321 | 0.04 | 0.2413 | 0.0946 |  |  |  |
| AMZ: Carvery | Sides | Roasted Vegetable Mix | 74515.1 | 4 ounce | Side | 2.55 | 0.5885 | 0.04 | 0.612 | 0.24 |  |  |  |
| AMZ: Carvery | Sides | Scalloped Potatoes | 40929.5 | 1/2 cup | Side | 2.55 | 0.4857 | 0.04 | 0.5052 | 0.1981 |  |  |  |
| AMZ: Carvery | Sides | Scalloped Potatoes | 40929.5 | 4 ounce | Side | 2.55 | 0.4076 | 0.04 | 0.424 | 0.1663 |  |  |  |
| AMZ: Carvery | Sides | spicy broccoli rabe | 14393.9 | 4 ounce | Side | 2.55 | 1.3124 | 0.04 | 1.3649 | 0.5353 |  |  |  |
| AMZ: Carvery | Sides | Sweet Potato Wild Rice | 179003.2 | 1/2 cup | Side | 2.55 | 0.4613 | 0.04 | 0.4797 | 0.1881 |  |  |  |
| AMZ: Carvery | Sides | Thai Rice Noodle Salad with Peanuts | 88266.1 | 1/2 cup | Side | 2.55 | 0.3367 | 0.04 | 0.3501 | 0.1373 |  |  |  |
| AMZ: Carvery | Sides | Tomato & Mozzarella Caprese Salad | 31447.1 | 4 oz portion | Side | 2.55 | 1.2568 | 0.04 | 1.307 | 0.5126 |  |  |  |
| AMZ: Carvery | Sides | tricolor cauliflower salad | 78655.6 | 1/2 cup | Side | 2.55 | 2.4793 | 0.04 | 2.5785 |  |  |  |  |
| AMZ: Carvery | Sides | Vegetarian Collard Greens | 103139.2 | 1/2 cup | Side | 2.55 | 0.1472 | 0.04 | 0.1531 | 0.06 |  |  |  |
| AMZ: Carvery | Sides | white bean kale salad | 35089.6 | 1/2 cup | Side | 2.55 | 0.9002 | 0.04 | 0.9362 | 0.3671 |  |  |  |
| AMZ: Carvery | Sides | wild rice medley | 32748 | 1/2 cup | Side | 2.55 | 0.1919 | 0.04 | 0.1995 | 0.0783 |  |  |  |
| AMZ: Carvery | Sauces | 1000 Island Dressing | 62351 | 2 ounce | Sub Recipe |  | 0.3437 | 0.04 | 0.3574 |  | 0.4307 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Apple juice, vinegar and Dijon mustard make a tangy vinaigrette | 14243.1 | 3 ounce | Sub Recipe |  | 0.7632 | 0.04 | 0.7938 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Apricot Preserves | 74413.1 | 2 ounce | Sub Recipe |  | 0.2826 | 0.04 | 0.2939 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Barbecue Sauce | 184229 | 2 floz | Sub Recipe |  | 0.206 | 0.04 | 0.2142 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Chimmichuri Sauce | 144721 | 2 floz | Sub Recipe |  | 0.6719 | 0.04 | 0.6988 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | chipotle mayonnaise | 66851 | 2 ounce | Sub Recipe |  | 0.3486 | 0.04 | 0.3625 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Classic Hummus | 187183 | 2 ounce | Sub Recipe |  | 0.4841 | 0.04 | 0.5034 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Country Gravy | 81538 | 3-1/2 ounce | Sub Recipe |  | 0.5061 | 0.04 | 0.5264 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | cranberry mayonnaise | 18485.8 | 2 ounce | Sub Recipe |  | 0.2272 | 0.04 | 0.2363 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Creamy Horseradish Sauce | 138929 | 2 ounce | Sub Recipe |  | 0.2565 | 0.04 | 0.2667 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Creole Sauce | 12036 | 4 tbsp | Sub Recipe |  | 0.2702 | 0.04 | 0.281 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | honey mint yogurt sauce | 8264.1 | 2 floz | Sub Recipe |  | 0.4778 | 0.04 | 0.4969 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Honey Mustard Dressing | 27070.1 | 2 floz | Sub Recipe |  | 0.6588 | 0.04 | 0.6852 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Lemon Dill Aioli | 19400.8 | 2 ounce | Sub Recipe |  | 0.4232 | 0.04 | 0.4402 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | muhammara with walnuts | 22652.5 | 2 tbsp | Sub Recipe |  | 0.3162 | 0.04 | 0.3289 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | peanut satay sauce | 143103 | 2 ounce | Sub Recipe |  | 0.4305 | 0.04 | 0.4477 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | pesto aioli | 140911 | 2 ounce | Sub Recipe |  | 0.6772 | 0.04 | 0.7043 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | roasted garlic aioli | 14681.3 | 2 ounce | Sub Recipe |  | 0.4096 | 0.04 | 0.4259 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Sweet and Smoky Sauce | 77537.1 | 3 ounce | Sub Recipe |  | 0.5485 | 0.04 | 0.5704 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | sweet and spicy honey mustard dressing | 10812.1 | 2 ounce | Sub Recipe |  | 0.3233 | 0.04 | 0.3362 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Vegan Brown Gravy | 133961 | 1 serving(s) | Sub Recipe |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Vegan Mayo | 108718 | 2 ounce | Sub Recipe |  | 0.3972 | 0.04 | 0.4131 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Sauces | Yellow Mustard | 47957.1 | 2 ounce | Sub Recipe |  | 0.0879 | 0.04 | 0.0914 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Carvery | Extensions | Doughnuts | 83674 | 1 serving(s) | Extension | 2.3 | 0.3627 | 0.04 | 0.3772 | 0.164 | 0.7716 | 0.2224 |  |
| AMZ: Carvery | Extensions | garlic knots with marinara | 16121.9 | 3 serving(s) | Extension | 3.85 | 1.1491 | 0.04 | 1.1951 | 0.3104 |  |  |  |
| AMZ: Carvery | Extensions | Polenta Frita | 135046 | 5 serving(s) | Extension | 3.85 | 0.7138 | 0.04 | 0.7424 | 0.1928 |  |  |  |

### AMZ: Cevicheria

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Cevicheria | Cevicheria | baja shrimp ceviche | 206968 | 6 ounce | Entree | 13 | 2.3765 | 0.04 | 2.4715 | 0.1901 | 2.091 | 0.1638 | 1 Entree + 1 Chips + 1 Sub Recipe |
| AMZ: Cevicheria | Cevicheria | coconut jackfruit ceviche | 132054.2 | 6 ounce | Entree | 11.75 | 1.3664 | 0.04 | 1.421 | 0.1209 |  |  | 1 Entree + 1 Chips + 1 Sub Recipe |
| AMZ: Cevicheria | Cevicheria | scallop peruvian ceviche | 145020.1 | 6 ounce | Entree | 13 | 1.8564 | 0.04 | 1.9306 | 0.1485 |  |  | 1 Entree + 1 Chips + 1 Sub Recipe |
| AMZ: Cevicheria | Cevicheria | whitefish peruvian ceviche | 145020.2 | 6 ounce | Entree | 13 | 2.443 | 0.04 | 2.5407 | 0.1954 |  |  | 1 Entree + 1 Chips + 1 Sub Recipe |
| AMZ: Cevicheria | Cevicheria | cilantro lime rice | 41689.9 | 1/2 cup | Side | 2.55 | 0.3514 | 0.04 | 0.3655 | 0.1433 | 0.4106 | 0.161 |  |
| AMZ: Cevicheria | Cevicheria | Shaved Radish Salad | 93033.1 | 110 g | Side | 2.55 | 0.4382 | 0.04 | 0.4558 | 0.1787 |  |  |  |
| AMZ: Cevicheria | Cevicheria | bakers chips | 18733.1 | 1 cup | Chips |  | 0.1434 | 0.04 | 0.1491 |  | 0.3422 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Cevicheria | Cevicheria | Crispy Taro Chips | 134745 | 1-1/4 oz portion | Chips |  | 0.2169 | 0.04 | 0.2255 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Cevicheria | Cevicheria | fried plantains | 103294 | 1 cup | Chips |  | 1.0291 | 0.04 | 1.0703 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Cevicheria | Cevicheria | Habanero Salsa | 41707.8 | 1 floz | Chips |  | 0.164 | 0.04 | 0.1705 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Cevicheria | Cevicheria | House Fried Tortilla Chips | 41281.9 | 1-1/2 ounce | Chips |  | 0.0623 | 0.04 | 0.0648 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Cevicheria | Cevicheria | purple potato chips | 145710.1 | 1 cup | Chips |  | 0.3587 | 0.04 | 0.3731 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Cevicheria | Cevicheria | Avocado Ranch Dressing | 24747.3 | 1 ounce | Sub Recipe |  | 0.238 | 0.04 | 0.2475 |  | 0.3508 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Cevicheria | Cevicheria | Molcajete Salsa | 87748 | 1 ounce | Sub Recipe |  | 0.4365 | 0.04 | 0.454 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Cevicheria | Cevicheria | cinnamon churro | 28961.2 | 2 each | Extension | 3.85 | 0.652 | 0.04 | 0.6781 | 0.1761 | 0.6781 | 0.1761 |  |

### AMZ: Chaatwalla

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Chaatwalla | Chaatwalla | aloo tikki chaat | 179209 | 1 serving(s) | Entree | 11.25 | 3.034 | 0.04 | 3.1554 | 0.2805 | 3.0372 | 0.2877 | 1 Entree + 1 Side |
| AMZ: Chaatwalla | Chaatwalla | aloo tikki chaat | 179209 | 1 serving(s) | Entree | 7.25 | 3.034 | 0.04 | 3.1554 | 0.4352 |  |  | 1 Entree + 1 Side |
| AMZ: Chaatwalla | Chaatwalla | chicken tikka kathi | 179454.2 | 1 each | Entree | 11.25 | 2.2409 | 0.04 | 2.3306 | 0.2072 |  |  | 1 Entree + 1 Side |
| AMZ: Chaatwalla | Chaatwalla | lamb mushroom kofta kathi | 179454 | 1 each | Entree | 11.75 | 3.2867 | 0.04 | 3.4181 | 0.2909 |  |  | 1 Entree + 1 Side |
| AMZ: Chaatwalla | Chaatwalla | mixed vegetable pakora | 179321 | 1 serving(s) | Entree | 11.25 | 2.7405 | 0.04 | 2.8501 | 0.2533 |  |  | 1 Entree + 1 Side |
| AMZ: Chaatwalla | Chaatwalla | mumbai vada pav chaat | 179451 | 2 each | Entree | 11.25 | 4.0096 | 0.04 | 4.17 | 0.3707 |  |  | 1 Entree + 1 Side |
| AMZ: Chaatwalla | Chaatwalla | paneer masala kathi roll | 179454.3 | 1 each | Entree | 11.25 | 2.2965 | 0.04 | 2.3883 | 0.2123 |  |  | 1 Entree + 1 Side |
| AMZ: Chaatwalla | Chaatwalla | tandoori chicken kathi roll | 179454.1 | 1 each | Entree | 11.25 | 2.7211 | 0.04 | 2.83 | 0.2516 |  |  | 1 Entree + 1 Side |
| AMZ: Chaatwalla | Chaatwalla | coconut rice | 149824.1 | 1 Scoop #6 | Side | 2.55 | 0.5115 | 0.04 | 0.532 | 0.2086 | 0.7723 | 0.3029 |  |
| AMZ: Chaatwalla | Chaatwalla | hakka noodle chaat | 179403 | 1/2 cup | Side | 2.55 | 0.4842 | 0.04 | 0.5035 | 0.1975 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | kachumbar | 165741.11 | 1/2 cup | Side | 2.55 | 0.6984 | 0.04 | 0.7263 | 0.2848 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | kale poriyal | 193119 | 1/2 cup | Side | 2.55 | 1.3848 | 0.04 | 1.4402 | 0.5648 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | lemon basmati rice | 165425 | 1 cup | Side | 2.55 | 0.3961 | 0.04 | 0.412 | 0.1616 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | Vegetable Biryani | 84099.2 | 8 ounce | Side | 2.55 | 0.9804 | 0.04 | 1.0196 | 0.3999 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | Raita Sauce | 81281 | 2 ounce | Sub Recipe |  | 0.3208 | 0.04 | 0.3336 |  | 1.6619 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Chaatwalla | Chaatwalla | Spicy Cilantro Chutney | 81768 | 2 ounce | Sub Recipe |  | 0.1336 | 0.04 | 0.139 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Chaatwalla | Chaatwalla | tamarind-date chutney | 87890 | 4 ounce | Sub Recipe |  | 4.3394 | 0.04 | 4.513 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Chaatwalla | Chaatwalla | besan ladoo | 179496 | 3 each | Extension | 3.85 | 0.636 | 0.04 | 0.6614 | 0.1718 | 2.5041 | 0.4114 |  |
| AMZ: Chaatwalla | Chaatwalla | chai tea | 131668 | 4 floz | Extension |  | 0.2097 | 0.04 | 0.218 |  |  |  | Complimentary with each order of other station items |
| AMZ: Chaatwalla | Chaatwalla | chicken tikka kathi | 179454.2 | 1 each | Extension | 7.25 | 2.2409 | 0.04 | 2.3306 | 0.3215 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | lamb mushroom kofta kathi | 179454 | 1 each | Extension | 8.65 | 3.2867 | 0.04 | 3.4181 | 0.3952 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | Mango Lassi | 105093 | 12 ounce | Extension | 3.85 | 1.4033 | 0.04 | 1.4594 | 0.3791 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | masala fries | 179266 | 1 serving(s) | Extension | 3.85 | 1.2805 | 0.04 | 1.3317 | 0.3459 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | mixed vegetable pakora | 179321 | 1 serving(s) | Extension | 7.25 | 2.7405 | 0.04 | 2.8501 | 0.3931 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | mumbai vada pav chaat | 179451 | 2 each | Extension | 7.25 | 4.0096 | 0.04 | 4.17 | 0.5752 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | paneer masala kathi roll | 179454.3 | 1 each | Extension | 7.25 | 2.2965 | 0.04 | 2.3883 | 0.3294 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | samosa chaat | 179325 | 1 serving(s) | Extension | 7.25 | 5.6613 | 0.04 | 5.8878 | 0.8121 |  |  |  |
| AMZ: Chaatwalla | Chaatwalla | tandoori chicken kathi roll | 179454.1 | 1 each | Extension | 7.25 | 2.7211 | 0.04 | 2.83 | 0.3903 |  |  |  |

### AMZ: Chiang Mai

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Chiang Mai | Chiang Mai | Chicken Khao Soi | 176857.1 | 1 serving(s) | Entree | 11.75 | 3.6791 | 0.04 | 3.8263 | 0.3256 | 3.2873 | 0.2759 | 1 Entree + Rice + Papaya Salad |
| AMZ: Chiang Mai | Chiang Mai | Chicken Laarb | 176858.3 | 1 serving(s) | Entree | 11.75 | 3.9813 | 0.04 | 4.1406 | 0.3524 |  |  | 1 Entree + Rice + Papaya Salad |
| AMZ: Chiang Mai | Chiang Mai | Impossible Laarb | 176858 | 1 serving(s) | Entree | 11.75 | 4.2407 | 0.04 | 4.4103 | 0.3753 |  |  | 1 Entree + Rice + Papaya Salad |
| AMZ: Chiang Mai | Chiang Mai | Jackfruit Hung Lay | 176847 | 8 ounce | Entree | 11.75 | 1.4044 | 0.04 | 1.4606 | 0.1243 |  |  | 1 Entree + Rice + Papaya Salad |
| AMZ: Chiang Mai | Chiang Mai | Pork Hung Lay | 175500 | 8 ounce | Entree | 13 | 2.7444 | 0.04 | 2.8542 | 0.2196 |  |  | 1 Entree + Rice + Papaya Salad |
| AMZ: Chiang Mai | Chiang Mai | Vegetable Khao Soi | 176857 | 1 serving(s) | Entree | 11.75 | 2.9154 | 0.04 | 3.032 | 0.258 |  |  | 1 Entree + Rice + Papaya Salad |
| AMZ: Chiang Mai | Chiang Mai | jasmine rice | 5354.11 | 1 cup | Side | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 | 0.4672 | 0.1832 |  |
| AMZ: Chiang Mai | Chiang Mai | Papaya Salad | 107128.2 | 1/2 cup | Side | 2.55 | 0.584 | 0.04 | 0.6074 | 0.2382 |  |  |  |
| AMZ: Chiang Mai | Chiang Mai | banana pancake | 176860 | 1 each | Extension | 3.85 | 0.691 | 0.04 | 0.7186 | 0.1867 | 0.9854 | 0.2559 |  |
| AMZ: Chiang Mai | Chiang Mai | mango sticky rice | 182206.25 | 1 each | Extension | 3.85 | 1.8403 | 0.04 | 1.9139 | 0.4971 |  |  |  |
| AMZ: Chiang Mai | Chiang Mai | Thai Iced Tea | 176858.1 | 12 floz | Extension | 3.85 | 0.3112 | 0.04 | 0.3236 | 0.0841 |  |  |  |

### AMZ: Ciudad

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Ciudad | Ciudad | beef picadillo tacos | 81582.1 | 2 each | Entree | 13 | 2.1384 | 0.04 | 2.2239 | 0.1711 | 3.5876 | 0.2896 | 1 Entree + 2 Sides |
| AMZ: Ciudad | Ciudad | carne asada tacos | 81582.3 | 2 each | Entree | 13 | 6.903 | 0.04 | 7.1791 | 0.5522 |  |  | 1 Entree + 2 Sides |
| AMZ: Ciudad | Ciudad | carne asada tacos | 81582.9 | 2 each | Entree | 13 | 3.9072 | 0.04 | 4.0635 | 0.3126 |  |  | 1 Entree + 2 Sides |
| AMZ: Ciudad | Ciudad | cauliflower quinoa al pastor tacos | 143810.2 | 2 each | Entree | 11.75 | 2.3243 | 0.04 | 2.4172 | 0.2057 |  |  | 1 Entree + 2 Sides |
| AMZ: Ciudad | Ciudad | chicken al pastor tacos | 143810.3 | 2 each | Entree | 11.75 | 3.0201 | 0.04 | 3.1409 | 0.2673 |  |  | 1 Entree + 2 Sides |
| AMZ: Ciudad | Ciudad | grain flank tacos (lentil and seitan tacos) | 81582.4 | 2 each | Entree | 11.75 | 2.6217 | 0.04 | 2.7265 | 0.232 |  |  | 1 Entree + 2 Sides |
| AMZ: Ciudad | Ciudad | pork al pastor tacos | 143810.1 | 2 each | Entree | 11.75 | 3.233 | 0.04 | 3.3623 | 0.2862 |  |  | 1 Entree + 2 Sides |
| AMZ: Ciudad | Ciudad | charro beans | 77114.4 | 4 ounce | Side | 2.55 | 0.7624 | 0.04 | 0.7929 | 0.3109 | 0.4931 | 0.1934 |  |
| AMZ: Ciudad | Ciudad | cilantro lime rice | 41689.9 | 1/2 cup | Side | 2.55 | 0.3514 | 0.04 | 0.3655 | 0.1433 |  |  |  |
| AMZ: Ciudad | Ciudad | esquites | 42004.11 | 1/2 cup | Side | 2.55 | 0.5755 | 0.04 | 0.5985 | 0.2347 |  |  |  |
| AMZ: Ciudad | Ciudad | red rice | 41728.4 | 1/2 cup | Side | 2.55 | 0.3184 | 0.04 | 0.3311 | 0.1299 |  |  |  |
| AMZ: Ciudad | Ciudad | roasted chayote squash | 193421 | 1/2 cup | Side | 2.55 | 0.3075 | 0.04 | 0.3198 | 0.1254 |  |  |  |
| AMZ: Ciudad | Ciudad | spicy black beans | 41579 | 1/2 cup | Side | 2.55 | 0.5294 | 0.04 | 0.5506 | 0.2159 |  |  |  |
| AMZ: Ciudad | Ciudad | Almond Horchata | 175488 | 10 ounce | Extension | 3.85 | 1.059 | 0.04 | 1.1014 | 0.2861 | 1.6034 | 0.3974 |  |
| AMZ: Ciudad | Ciudad | beef barbacoa taco | 81582.7 | 1 each | Extension | 4.25 | 1.8642 | 0.04 | 1.9388 | 0.4562 |  |  |  |
| AMZ: Ciudad | Ciudad | beef picadillo taco | 81582.8 | 1 each | Extension | 4.25 | 1.0692 | 0.04 | 1.112 | 0.2616 |  |  |  |
| AMZ: Ciudad | Ciudad | carne asada taco | 81582.6 | 1 each | Extension | 4.25 | 3.4515 | 0.04 | 3.5895 | 0.8446 |  |  |  |
| AMZ: Ciudad | Ciudad | cauliflower quinoa al pastor taco | 143810.6 | 1 each | Extension | 3.75 | 1.1621 | 0.04 | 1.2086 | 0.3223 |  |  |  |
| AMZ: Ciudad | Ciudad | chicken al pastor taco | 143810.5 | 1 each | Extension | 3.75 | 1.3597 | 0.04 | 1.4141 | 0.3771 |  |  |  |
| AMZ: Ciudad | Ciudad | Chips and Guacamole | 142649 | 1 plate | Extension | 3.85 | 1.5895 | 0.04 | 1.653 | 0.4294 |  |  |  |
| AMZ: Ciudad | Ciudad | cinnamon churro | 28961.2 | 2 each | Extension | 3.85 | 0.652 | 0.04 | 0.6781 | 0.1761 |  |  |  |
| AMZ: Ciudad | Ciudad | grain flank taco (lentil and seitan taco) | 81582.5 | 1 each | Extension | 4.45 | 1.5933 | 0.04 | 1.6571 | 0.3724 |  |  |  |
| AMZ: Ciudad | Ciudad | pork al pastor taco | 143810.7 | 1 each | Extension | 3.75 | 1.6165 | 0.04 | 1.6812 | 0.4483 |  |  |  |

### AMZ: Cypress

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Cypress | Cypress | beef mushroom kofta gyro | 132544.4 | 1 each | Entree | 13 | 3.973 | 0.04 | 4.1319 | 0.3178 | 5.7637 | 0.4728 | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | beef mushroom kofta plate | 213388.4 | 1 each | Entree | 13 | 6.2431 | 0.04 | 6.4929 | 0.4995 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | chicken souvlaki gyro | 132544.6 | 1 each | Entree | 11.75 | 3.5551 | 0.04 | 3.6973 | 0.3147 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | chicken souvlaki plate | 213388.3 | 1 each | Entree | 11.75 | 5.7208 | 0.04 | 5.9497 | 0.5064 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | date roasted pork plate | 213388 | 1 each | Entree | 11.75 | 7.5227 | 0.04 | 7.8236 | 0.6658 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | green garbanzo falafel gyro | 132544.1 | 1 each | Entree | 11.75 | 3.5077 | 0.04 | 3.648 | 0.3105 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | green garbanzo falafel plate | 213388.1 | 1 each | Entree | 11.75 | 5.9153 | 0.04 | 6.1519 | 0.5236 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | lamb mushroom kofta gyro | 132544.3 | 1 each | Entree | 13 | 5.0553 | 0.04 | 5.2575 | 0.4044 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | lamb mushroom kofta plate | 213388.2 | 1 each | Entree | 13 | 7.596 | 0.04 | 7.8999 | 0.6077 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | plant-based beef kofta gyro | 132544.5 | 1 each | Entree | 11.75 | 4.6455 | 0.04 | 4.8313 | 0.4112 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | plant-based beef kofta plate | 213388.5 | 1 each | Entree | 11.75 | 7.2278 | 0.04 | 7.5169 | 0.6397 |  |  | 1 Entree + 2 Sides |
| AMZ: Cypress | Cypress | chickpea cucumber sumac salad | 74147.1 | 1/2 cup | Side | 2.55 | 0.7221 | 0.04 | 0.751 | 0.2945 | 0.6603 | 0.259 |  |
| AMZ: Cypress | Cypress | Cucumber, Tomato, Parsley Salad | 22656.2 | 1/2 cup | Side | 2.55 | 0.392 | 0.04 | 0.4077 | 0.1599 |  |  |  |
| AMZ: Cypress | Cypress | fennel and orange salad | 60810.2 | 1/2 cup | Side | 2.55 | 0.6262 | 0.04 | 0.6512 | 0.2554 |  |  |  |
| AMZ: Cypress | Cypress | harissa carrot salad | 164784 | 1/2 cup | Side | 2.55 | 0.5239 | 0.04 | 0.5449 | 0.2137 |  |  |  |
| AMZ: Cypress | Cypress | minted lentil salad | 123443 | 1/2 cup | Side | 2.55 | 0.3611 | 0.04 | 0.3755 | 0.1473 |  |  |  |
| AMZ: Cypress | Cypress | minted lentil salad | 35992.17 | 1/2 cup | Side | 2.55 | 0.9183 | 0.04 | 0.9551 | 0.3745 |  |  |  |
| AMZ: Cypress | Cypress | spiced jasmine rice | 5354.14 | 1 cup | Side | 2.55 | 0.3435 | 0.04 | 0.3572 | 0.1401 |  |  |  |
| AMZ: Cypress | Cypress | Tabbouleh | 78664 | 4 ounce | Side | 2.55 | 0.9271 | 0.04 | 0.9642 | 0.3781 |  |  |  |
| AMZ: Cypress | Cypress | white bean kale salad | 35089.6 | 1/2 cup | Side | 2.55 | 0.9002 | 0.04 | 0.9362 | 0.3671 |  |  |  |
| AMZ: Cypress | Cypress | Baklava with Nuts | 84508 | 2 each | Extension | 3.85 | 1.5246 | 0.04 | 1.5856 | 0.4118 | 1.4822 | 0.385 |  |
| AMZ: Cypress | Cypress | Spinach and Feta Spanakopita | 105044.5 | 1 each | Extension | 3.85 | 1.5896 | 0.04 | 1.6532 | 0.4294 |  |  |  |
| AMZ: Cypress | Cypress | Stuffed Grape Leaves | 182714 | 2 each | Extension | 3.85 | 1.1615 | 0.04 | 1.208 | 0.3138 |  |  |  |

### AMZ: Fish Market

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Fish Market | Fish Market | Cajun Blackened Shrimp | 95621.3 | 5 ounce | Entree | 15.5 | 2.0367 | 0.04 | 2.1182 | 0.1367 | 4.0465 | 0.2847 | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Cajun Blackened Shrimp | 95621.3 | 4 ounce | Entree | 10.95 | 1.6294 | 0.04 | 1.6946 | 0.1548 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Classic Caesar Salad | 76761.4 | 11-1/2 ounce | Entree | 14.95 | 4.3732 | 0.04 | 4.5481 | 0.3042 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | grilled cod | 16299.5 | 5 oz portion | Entree | 15.5 | 18.1308 | 0.04 | 18.856 | 1.2165 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | grilled cod | 16299.5 | 1 serving(s) | Entree | 10.95 | 3.6262 | 0.04 | 3.7712 | 0.3444 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | grilled herb barramundi | 194781 | 5 ounce | Entree | 15.5 | 4.6746 | 0.04 | 4.8616 | 0.3136 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | grilled herb barramundi | 194781 | 1 each | Entree | 10.95 | 2.9814 | 0.04 | 3.1006 | 0.2832 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Grilled Steelhead Trout | 98380 | 5 ounce | Entree | 15.5 | 3.7373 | 0.04 | 3.8868 | 0.2508 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Grilled Steelhead Trout | 98380 | 1 each | Entree | 10.95 | 3.6292 | 0.04 | 3.7743 | 0.3447 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | grilled tuna | 12989.14 | 1 serving(s) | Entree | 15.5 | 1.5389 | 0.04 | 1.6005 | 0.1033 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | grilled tuna | 12989.14 | 1 serving(s) | Entree | 10.95 | 1.5389 | 0.04 | 1.6005 | 0.1462 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Herb Grilled Salmon | 135663.1 | 5 ounce | Entree | 15.5 | 3.1703 | 0.04 | 3.2972 | 0.2127 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Herb Grilled Salmon | 135663.1 | 4 ounce | Entree | 10.95 | 2.5363 | 0.04 | 2.6377 | 0.2409 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Lemon Herb Mahi Mahi | 57059.16 | 5 ounce | Entree | 15.5 | 5.9848 | 0.04 | 6.2242 | 0.4016 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Lemon Herb Mahi Mahi | 57059.16 | 1 each | Entree | 10.95 | 4.2546 | 0.04 | 4.4248 | 0.4041 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Louie Salad base | 78200.3 | 1 each | Entree | 14.95 | 2.1444 | 0.04 | 2.2301 | 0.1492 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | Tuna Nicoise Salad, Lemon Vinaigrette | 32980.8 | 1 serving(s) | Entree | 15.5 | 3.4949 | 0.04 | 3.6347 | 0.2345 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | baja grilled fish taco | 84484.1 | 2 each | Entree | 15.5 | 4.4702 | 0.04 | 4.649 | 0.2999 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | BBQ Shrimp & Grits | 42120.8 | 1 plate | Entree | 15.5 | 2.8631 | 0.04 | 2.9776 | 0.1921 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | crab cakes | 194073 | 2 each | Entree | 15.5 | 4.3174 | 0.04 | 4.4901 | 0.2897 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | Fish and Chips | 134605 | 1 plate | Entree | 13 | 3.434 | 0.04 | 3.5713 | 0.2747 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | grilled steelhead caesar sandwich | 194090 | 1 sandwich | Entree | 15.5 | 3.8326 | 0.04 | 3.9859 | 0.2572 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | miso soy black cod | 189227.2 | 1 each | Entree | 15.5 | 7.6554 | 0.04 | 7.9616 | 0.5137 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | Salmon Nicoise Salad | 4640.4 | 1 plate | Entree | 14.95 |  | 0.04 |  |  |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | seafood cioppino | 44897.4 | 1 serving(s) | Entree | 15.5 |  | 0.04 |  |  |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | shrimp and sausage gumbo | 147575 | 8 oz portion | Entree | 15.5 | 2.1516 | 0.04 | 2.2376 | 0.1444 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | shrimp po boy | 77597.14 | 1 each | Entree | 13 | 2.9099 | 0.04 | 3.0263 | 0.2328 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | shrimp, sausage, & clam jambalaya | 45108 | 2 cup | Entree | 15.5 | 3.5308 | 0.04 | 3.672 | 0.2369 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | steelhead croquettes | 194276 | 2 each | Entree | 15.5 | 1.22 | 0.04 | 1.2688 | 0.0819 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | LTO | tuna melt on sourdough | 106974.2 | 1 sandwich | Entree | 15.5 | 3.0765 | 0.04 | 3.1996 | 0.2064 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Fish Market | Fish Market | brown rice | 16882.7 | 1 cup | Side | 2.55 | 0.153 | 0.04 | 0.1592 | 0.0624 | 0.6868 | 0.2693 |  |
| AMZ: Fish Market | Fish Market | French Fries | 8414 | 5 ounce | Side | 2.55 | 0.5468 | 0.04 | 0.5687 | 0.223 |  |  |  |
| AMZ: Fish Market | Fish Market | garden salad | 16811 | 1 serving(s) | Side | 2.55 | 1.3639 | 0.04 | 1.4185 | 0.5563 |  |  |  |
| AMZ: Fish Market | Fish Market | garlic lemon broccolini | 4911.5 | 1/2 cup | Side | 2.55 | 1.7524 | 0.04 | 1.8225 | 0.7147 |  |  |  |
| AMZ: Fish Market | Fish Market | garlic mashed potatoes | 45118 | 1/2 cup | Side | 2.55 | 0.561 | 0.04 | 0.5834 | 0.2288 |  |  |  |
| AMZ: Fish Market | Fish Market | jasmine rice | 5354.11 | 1 cup | Side | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  |  |
| AMZ: Fish Market | Fish Market | peruvian roasted potatoes | 122259 | 1/2 cup | Side | 2.55 | 0.2841 | 0 | 0.2841 | 0.1114 |  |  |  |
| AMZ: Fish Market | Fish Market | Roasted Potatoes | 33992.32 | 1/2 cup | Side | 2.55 | 0.2336 | 0.04 | 0.243 | 0.0953 |  |  |  |
| AMZ: Fish Market | Fish Market | Roasted Root Vegetables | 17425.2 | 1/2 cup | Side | 2.55 | 0.6526 | 0.04 | 0.6787 | 0.2662 |  |  |  |
| AMZ: Fish Market | Fish Market | Sauteed Shishito Peppers | 124403 | 1/2 cup | Side | 2.55 | 0.8507 | 0.04 | 0.8847 | 0.347 |  |  |  |
| AMZ: Fish Market | Fish Market | shishito mashed potato | 134911.2 | 1/2 cup | Side | 2.55 | 0.6836 | 0.04 | 0.711 | 0.2788 |  |  |  |
| AMZ: Fish Market | Fish Market | spicy collard greens | 18326.5 | 1/2 cup | Side | 2.55 | 0.5394 | 0.04 | 0.561 | 0.22 |  |  |  |
| AMZ: Fish Market | Fish Market | Beurre Blanc | 162137.1 | 2 floz | Sub Recipe |  | 0.5416 | 0.04 | 0.5633 |  | 0.5627 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Fish Market | Fish Market | Chermoula | 138944 | 2 floz | Sub Recipe |  | 0.9545 | 0.04 | 0.9927 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Fish Market | Fish Market | chimichurri sauce | 61283.7 | 2 floz | Sub Recipe |  | 0.9849 | 0.04 | 1.0243 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Fish Market | Fish Market | lemon dill compound butter | 46265 | 2 tbsp | Sub Recipe |  | 0.3725 | 0.04 | 0.3874 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Fish Market | Fish Market | Lemon Wedge | 1261 | 1 wedge | Sub Recipe |  | 0.0219 | 0.04 | 0.0228 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Fish Market | Fish Market | pineapple mango salsa | 41724 | 2 floz | Sub Recipe |  | 0.3414 | 0.04 | 0.3551 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Fish Market | Fish Market | remoulade sauce | 129694.1 | 2 floz | Sub Recipe |  | 0.4226 | 0.04 | 0.4395 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Fish Market | Fish Market | Romesco Sauce | 197452 | 2 floz | Sub Recipe |  | 0.9519 | 0.04 | 0.99 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Fish Market | Fish Market | tartar sauce | 61541.4 | 2 floz | Sub Recipe |  | 0.2778 | 0.04 | 0.289 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ: Fresh Five

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Fresh Five | Deli | Chicken Banh Mi | 119416.1 | 1 serving(s) | Entree | 5 | 2.251 | 0.04 | 2.341 | 0.4682 | 2.0448 | 0.409 | 1 Entree |
| AMZ: Fresh Five | Deli | chili lime grilled chicken wrap | 165741.102 | 1 each | Entree | 5 | 4.0343 | 0.04 | 4.1957 | 0.8391 |  |  | 1 Entree |
| AMZ: Fresh Five | Deli | half caprese with chop veggie salad | 219371.1 | 1 serving(s) | Entree | 5 |  | 0.04 |  |  |  |  | 1 Entree |
| AMZ: Fresh Five | Deli | lentil chickpea salad | 219371.2 | 1 serving(s) | Entree | 5 | 0.9558 | 0.04 | 0.994 | 0.1988 |  |  | 1 Entree |
| AMZ: Fresh Five | Deli | mini tuna sandwich with quinoa salad | 219371.5 | 1 serving(s) | Entree | 5 | 1.3548 | 0.04 | 1.409 | 0.2818 |  |  | 1 Entree |
| AMZ: Fresh Five | Deli | pork pozole wrap | 68606.3 | 1 each | Entree | 5 | 1.9807 | 0.04 | 2.0599 | 0.412 |  |  | 1 Entree |
| AMZ: Fresh Five | Deli | Tofu Banh Mi | 119416.2 | 1 sandwich | Entree | 5 | 2.113 | 0.04 | 2.1976 | 0.4395 |  |  | 1 Entree |
| AMZ: Fresh Five | Deli | turkey burger on lettuce wrap with orzo salad | 219371.15 | 1 serving(s) | Entree | 5 | 1.883 | 0.04 | 1.9583 | 0.3917 |  |  | 1 Entree |
| AMZ: Fresh Five | Grill | black bean burger | 159013.1 | 1 each | Entree | 5 | 2.4668 | 0.04 | 2.5655 | 0.5131 |  |  | 1 Entree |
| AMZ: Fresh Five | Grill | blackened chicken caesar wrap | 9268.7 | 1 each | Entree | 5 | 2.3048 | 0.04 | 2.397 | 0.4794 |  |  | 1 Entree |
| AMZ: Fresh Five | Grill | portobello burger with yogurt sauce | 21736.3 | 1 serving(s) | Entree | 5 | 2.2027 | 0.04 | 2.2908 | 0.4582 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | artichoke and goat cheese flatbread | 153945.2 | 1 each | Entree | 5 | 2.1396 | 0.04 | 2.2252 | 0.445 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | bruschetta flatbread | 153945.5 | 1 each | Entree | 5 | 2.1107 | 0.04 | 2.1951 | 0.439 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | caprese flatbread | 153945.4 | 1 each | Entree | 5 | 1.9958 | 0.04 | 2.0756 | 0.4151 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | caprese on whole grain half sandwich | 219371.7 | 1 piece | Entree | 5 | 1.0588 | 0.04 | 1.1011 | 0.2202 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | caprese sandwich | 34303.36 | 1 box | Entree | 5 | 2.1175 | 0.04 | 2.2022 | 0.4404 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | cashew ricotta and grape flatbread | 199214 | 1 each | Entree | 5 | 1.6406 | 0.04 | 1.7062 | 0.3412 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | cauliflower kale salad | 221997.9 | 1 serving(s) | Entree | 5 | 3.4174 | 0.04 | 3.5541 | 0.7108 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | chicken and squash salad | 221997.11 | 1 serving(s) | Entree | 5 | 3.5825 | 0.04 | 3.7258 | 0.7452 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | chicken caesar salad | 24060.7 | 1 each | Entree | 5 | 3.1195 | 0.04 | 3.2443 | 0.6489 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | fattoush kale salad with tofu | 221997.12 | 1 serving(s) | Entree | 5 | 5.9966 | 0.04 | 6.2365 | 1.2473 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | Garden Pesto Flatbread | 83124.6 | 1 each | Entree | 5 | 2.3536 | 0.04 | 2.4477 | 0.4895 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | gazpacho feta salad | 221997.7 | 1 serving(s) | Entree | 5 | 4.2922 | 0.04 | 4.4639 | 0.8928 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | greek salad flatbread sandwich | 37229.3 | 1 sandwich | Entree | 5 | 1.5454 | 0.04 | 1.6072 | 0.3214 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | grilled chicken lentil salad | 221997 | 1 serving(s) | Entree | 5 | 4.6845 | 0.04 | 4.8718 | 0.9744 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | half caprese sandwich with pasta salad | 219371 | 1 serving(s) | Entree | 5 | 1.588 | 0.04 | 1.6515 | 0.3303 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | half turkey on wheat with lentil salad | 219371.6 | 1 serving(s) | Entree | 5 | 1.9518 | 0.04 | 2.0299 | 0.406 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | half turkey sandwich with mac salad | 219371.1 | 1 serving(s) | Entree | 5 | 1.4207 | 0.04 | 1.4776 | 0.2955 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | harissa carrot kale salad | 221997.14 | 1 serving(s) | Entree | 5 | 3.8234 | 0.04 | 3.9764 | 0.7953 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | honey buffalo chickpea chicken sandwich (half) | 219371.8 | 1 piece | Entree | 5 | 0.7763 | 0.04 | 0.8073 | 0.1615 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | hummus and roasted carrot flatbread | 199214.2 | 1 each | Entree | 5 | 1.2676 | 0.04 | 1.3183 | 0.2637 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | Lentil Chickpea Salad Sandwich | 160182.2 | 1 sandwich | Entree | 5 | 0.8531 | 0.04 | 0.8872 | 0.1774 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | lentil chickpea sandwich with bean salad | 219371.3 | 1 serving(s) | Entree | 5 | 0.9304 | 0.04 | 0.9676 | 0.1935 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | lentil elote salad | 221997.3 | 1 serving(s) | Entree | 5 | 3.2771 | 0.04 | 3.4081 | 0.6816 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | maple tofu barley pecan salad | 217781 | 1 each | Entree | 5 | 2.3009 | 0.04 | 2.3929 | 0.4786 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | maple tofu barley pecan salad | 217781 | 1 serving(s) | Entree | 5 | 2.3009 | 0.04 | 2.3929 | 0.4786 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | mini tuna sandwich with potato apple salad | 219371.4 | 1 serving(s) | Entree | 5 | 0.8406 | 0.04 | 0.8742 | 0.1748 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | mushroom avocado flatbread | 199214.3 | 1 each | Entree | 5 | 2.1217 | 0.04 | 2.2066 | 0.4413 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | mushroom bacon bean and pea salad | 217770 | 1 each | Entree | 5 | 2.7759 | 0.04 | 2.8869 | 0.5774 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | mushroom bacon bean and pea salad | 217770 | 1 serving(s) | Entree | 5 | 2.7759 | 0.04 | 2.8869 | 0.5774 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | New Mexican Chipotle Flatbread | 83124.9 | 1 each | Entree | 5 | 1.852 | 0.04 | 1.9261 | 0.3852 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | portobello burger with yogurt sauce (half) | 21736.6 | 1 each | Entree | 5 | 1.7233 | 0.04 | 1.7923 | 0.3585 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | quinoa and roasted beet salad | 198559 | 1 serving(s) | Entree | 5 | 1.2027 | 0.04 | 1.2508 | 0.2502 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | sesame cucumber kale salad | 221997.15 | 1 serving(s) | Entree | 5 | 4.9788 | 0.04 | 5.1779 | 1.0356 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | southwest black bean flatbread | 199214.1 | 1 each | Entree | 5 | 1.1726 | 0.04 | 1.2195 | 0.2439 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | tomato avocado kale salad | 221997.1 | 1 serving(s) | Entree | 5 | 5.0401 | 0.04 | 5.2417 | 1.0483 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | turkey apple brie sandwich with apple | 219371.13 | 1 serving(s) | Entree | 5 | 2.3227 | 0.04 | 2.4156 | 0.4831 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | turkey burger lettuce wrap with quinoa salad | 219371.14 | 1 serving(s) | Entree | 5 | 2.0699 | 0.04 | 2.1527 | 0.4305 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | turkey swiss flatbread sandwich with apple | 219371.11 | 1 serving(s) | Entree | 5 | 2.8782 | 0.04 | 2.9934 | 0.5987 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | turkey swiss flatbread sandwich with tabouli salad | 219371.12 | 1 serving(s) | Entree | 5 | 2.7456 | 0.04 | 2.8554 | 0.5711 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | tuscan vegetable sandwich (half) | 219371.9 | 1 piece | Entree | 5 | 0.9892 | 0.04 | 1.0288 | 0.2058 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | Veggie Roast Flatbread | 83124.1 | 1 each | Entree | 5 | 0.9961 | 0.04 | 1.0359 | 0.2072 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | white bean kale salad | 221997.13 | 1 serving(s) | Entree | 5 | 2.7455 | 0.04 | 2.8553 | 0.5711 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | wild rice kale salad | 221997.4 | 1 serving(s) | Entree | 5 | 3.67 | 0.04 | 3.8168 | 0.7634 |  |  | 1 Entree |
| AMZ: Fresh Five | Hibernate | yam barley pecan salad | 41761.4 | 1/2 serving(s) | Entree | 5 | 0.2468 | 0.04 | 0.2567 | 0.0513 |  |  | 1 Entree |
| AMZ: Fresh Five | Salad | california chicken pasta salad | 217792 | 1 serving(s) | Entree | 5 | 3.5353 | 0.04 | 3.6767 | 0.7353 |  |  | 1 Entree |
| AMZ: Fresh Five | Salad | california pasta salad | 198596 | 2 cup | Entree | 5 | 2.7046 | 0.04 | 2.8127 | 0.5625 |  |  | 1 Entree |
| AMZ: Fresh Five | Salad | Chicken Quinoa Roasted Beet Salad | 217792.1 | 1 serving(s) | Entree | 5 | 2.7978 | 0.04 | 2.9098 | 0.582 |  |  | 1 Entree |
| AMZ: Fresh Five | Salad | lemon pepper bean and pea salad | 198522 | 1 serving(s) | Entree | 5 | 0.4754 | 0.04 | 0.4944 | 0.0989 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | Beef Barley Soup | 57584.2 | 8 ounce | Entree | 5 | 0.9358 | 0.04 | 0.9732 | 0.1946 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | black bean soup with cilantro cream | 11376.2 | 8 ounce | Entree | 5 | 0.6671 | 0.04 | 0.6938 | 0.1388 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | cauliflower soup | 54303.2 | 8 ounce | Entree | 5 | 0.7381 | 0.04 | 0.7677 | 0.1535 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | Chicken and Orzo Soup | 77046.6 | 8 ounce | Entree | 5 | 0.3851 | 0.04 | 0.4006 | 0.0801 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | Chicken Noodle Soup | 57600.4 | 8 ounce | Entree | 5 | 0.4813 | 0.04 | 0.5006 | 0.1001 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | Chicken Tortilla Soup | 77046.4 | 8 ounce | Entree | 5 | 0.6135 | 0.04 | 0.6381 | 0.1276 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | cream of asparagus soup | 193539 | 8 ounce | Entree | 5 | 0.6458 | 0.04 | 0.6717 | 0.1343 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | fagioli napoli with pasta soup | 192864 | 8 ounce | Entree | 5 | 0.4054 | 0.04 | 0.4216 | 0.0843 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | FIT: Homemade Chicken Stock | 35309.1 | 8 ounce | Entree | 5 | 0.5962 | 0.04 | 0.62 | 0.124 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | French Onion | 77088 | 8 ounce | Entree | 5 | 0.5846 | 0.04 | 0.6079 | 0.1216 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | Moroccan Tomato Soup with Lentils, Farro and Kale | 108481.1 | 8 ounce | Entree | 5 | 0.7163 | 0.04 | 0.7449 | 0.149 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | poblano quinoa corn soup | 38660.4 | 8 ounce | Entree | 5 | 0.6911 | 0.04 | 0.7187 | 0.1437 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | pumpkin sage broth | 192920 | 8 ounce | Entree | 5 | 0.2773 | 0.04 | 0.2884 | 0.0577 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | spicy italian kale & chorizo soup | 84847 | 8 ounce | Entree | 5 | 0.5689 | 0.04 | 0.5916 | 0.1183 |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | Tomato Lentil | 62071.1 | 8 ounce | Entree | 5 |  | 0.04 |  |  |  |  | 1 Entree |
| AMZ: Fresh Five | Soup | wild rice & mushroom soup | 11076.6 | 8 ounce | Entree | 5 | 0.4703 | 0.04 | 0.4891 | 0.0978 |  |  | 1 Entree |
| AMZ: Fresh Five | Sides | Asian Vegetable Salad | 10782.3 | 4 ounce | Side | 2.55 | 0.9839 | 0.04 | 1.0233 | 0.4013 | 0.8933 | 0.3503 |  |
| AMZ: Fresh Five | Sides | black bean salad | 35067.9 | 1/2 cup | Side | 2.55 | 0.5038 | 0.04 | 0.524 | 0.2055 |  |  |  |
| AMZ: Fresh Five | Sides | california pasta salad | 198596 | 1/2 cup | Side | 2.55 | 0.6761 | 0.04 | 0.7032 | 0.2758 |  |  |  |
| AMZ: Fresh Five | Sides | carrot ribbon salad | 162642 | 1 serving(s) | Side | 2.55 | 4.2513 | 0.04 | 4.4213 | 1.7339 |  |  |  |
| AMZ: Fresh Five | Sides | Cauliflower Salad | 78655.1 | 4 ounce | Side | 2.55 | 0.8448 | 0.04 | 0.8786 | 0.3446 |  |  |  |
| AMZ: Fresh Five | Sides | Curried Carrot Salad | 35064.2 | 1/2 cup | Side | 2.55 | 0.5446 | 0.04 | 0.5664 | 0.2221 |  |  |  |
| AMZ: Fresh Five | Sides | Curried Yogurt Potato Salad | 135328 | 1/2 cup | Side | 2.55 | 0.3405 | 0.04 | 0.3541 | 0.1389 |  |  |  |
| AMZ: Fresh Five | Sides | farmstand quinoa salad | 9888.3 | 1/2 cup | Side | 2.55 | 0.5847 | 0.04 | 0.6081 | 0.2385 |  |  |  |
| AMZ: Fresh Five | Sides | garden salad with balsamic dressing | 16811.5 | 1 each | Side | 2.55 | 1.8119 | 0.04 | 1.8844 | 0.739 |  |  |  |
| AMZ: Fresh Five | Sides | Latin Chipotle Salad | 56158.1 | 1/2 cup | Side | 2.55 | 0.5104 | 0.04 | 0.5308 | 0.2082 |  |  |  |
| AMZ: Fresh Five | Sides | lemon pepper bean and pea salad | 198522 | 1/2 cup | Side | 2.55 | 0.4754 | 0.04 | 0.4944 | 0.1939 |  |  |  |
| AMZ: Fresh Five | Sides | Lentil & Corn Elote Salad | 151707 | 1 ladle-8oz | Side | 2.55 | 1.0329 | 0.04 | 1.0742 | 0.4213 |  |  |  |
| AMZ: Fresh Five | Sides | Mediterranean Vegetable Pasta Salad | 29209 | 4 ounce | Side | 2.55 | 0.5292 | 0.04 | 0.5504 | 0.2158 |  |  |  |
| AMZ: Fresh Five | Sides | minted lentil salad | 35992.17 | 3/4 cup | Side | 2.55 | 1.3775 | 0.04 | 1.4326 | 0.5618 |  |  |  |
| AMZ: Fresh Five | Sides | Potato, Apple Salad | 21776.4 | 1/2 cup | Side | 2.55 | 0.326 | 0.04 | 0.339 | 0.1329 |  |  |  |
| AMZ: Fresh Five | Sides | quinoa and roasted beet salad | 198559 | 1/2 cup | Side | 2.55 | 0.6013 | 0.04 | 0.6254 | 0.2453 |  |  |  |
| AMZ: Fresh Five | Sides | Red Quinoa, Corn, Tomato | 26951 | 4 ounce | Side | 2.55 | 0.8402 | 0.04 | 0.8738 | 0.3427 |  |  |  |
| AMZ: Fresh Five | Sides | Roasted Vegetable Chopped Salad | 68511.1 | 15 ounce | Side | 2.55 |  | 0.04 |  |  |  |  |  |
| AMZ: Fresh Five | Sides | southwest orzo salad | 35073.2 | 1/2 cup | Side | 2.55 | 0.3978 | 0.04 | 0.4137 | 0.1622 |  |  |  |
| AMZ: Fresh Five | Sides | Tabouli Salad | 122285 | 4 ounce | Side | 2.55 | 0.5348 | 0.04 | 0.5562 | 0.2181 |  |  |  |
| AMZ: Fresh Five | Sides | Tomato Cucumber Salad | 14564.6 | 1/2 cup | Side | 2.55 |  | 0.04 |  |  |  |  |  |
| AMZ: Fresh Five | Sides | Wild Rice Salad with Cranberries | 23471.4 | 1/2 cup | Side | 2.55 | 0.3776 | 0.04 | 0.3927 | 0.154 |  |  |  |
| AMZ: Fresh Five | Sides | yam barley pecan salad | 41761.4 | 1/2 cup | Side | 2.55 | 0.4936 | 0.04 | 0.5133 | 0.2013 |  |  |  |

### AMZ: Greens & Grains

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Greens & Grains | Greens & Grains | apple farro arugula salad | 200784 | 1 serving(s) | Entree | 9.2 | 2.6329 | 0.04 | 2.7382 | 0.2976 | 3.0272 | 0.3071 | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | Arugula and Beet Salad | 76761.14 | 1 serving(s) | Entree | 9.2 |  | 0.04 |  |  |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | Asian Cashew Salad | 87152 | 1 serving(s) | Entree | 9.2 | 3.6384 | 0.04 | 3.784 | 0.4113 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | Asian Chicken Almond Salad | 78060 | 1 serving(s) | Entree | 14.95 | 4.8733 | 0.04 | 5.0683 | 0.339 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | baja crunch salad | 114287.3 | 1 serving(s) | Entree | 9.2 | 3.5692 | 0.04 | 3.712 | 0.4035 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | BBQ chop salad | 191052 | 1 serving(s) | Entree | 9.2 | 2.3524 | 0.04 | 2.4465 | 0.2659 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | caesar salad | 16373.2 | 1 serving(s) | Entree | 9.2 | 0.866 | 0.04 | 0.9006 | 0.0979 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | chef salad | 16526.14 | 1 serving(s) | Entree | 9.2 | 2.2024 | 0.04 | 2.2905 | 0.249 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | chef salad | 46859.21 | 1 serving(s) | Entree | 14.95 | 3.5315 | 0.04 | 3.6728 | 0.2457 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | chicken caesar salad | 24060.44 | 1 serving(s) | Entree | 14.95 | 3.3255 | 0.04 | 3.4585 | 0.2313 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | chopped salad | 147426.2 | 1 serving(s) | Entree | 9.2 | 3.6894 | 0.04 | 3.8369 | 0.4171 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | classic cobb salad | 8374.6 | 1 serving(s) | Entree | 9.2 | 4.5516 | 0.04 | 4.7337 | 0.5145 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | cucumber and kale quinoa salad | 141067.5 | 1 serving(s) | Entree | 9.2 | 0.8326 | 0.04 | 0.8659 | 0.0941 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | garden salad | 191050 | 1 serving(s) | Entree | 9.2 | 3.4491 | 0.04 | 3.5871 | 0.3899 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | greek grains salad | 11242.7 | 1 serving(s) | Entree | 9.2 | 3.5267 | 0.04 | 3.6678 | 0.3987 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | greek salad | 11242.6 | 1 serving(s) | Entree | 9.2 | 2.7476 | 0.04 | 2.8575 | 0.3106 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | green goddess chopped salad | 102917.4 | 1 serving(s) | Entree | 9.2 | 5.2648 | 0.04 | 5.4754 | 0.5952 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | green goddess pistachio salad | 199128 | 1 serving(s) | Entree | 9.2 | 4.5225 | 0.04 | 4.7035 | 0.5112 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | harvest kale almond salad with ranch | 145521.2 | 1 serving(s) | Entree | 9.2 | 2.1995 | 0.04 | 2.2875 | 0.2486 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | italian antipasti salad | 46859.23 | 1 serving(s) | Entree | 9.2 | 3.6526 | 0.04 | 3.7987 | 0.4129 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | Korean Green Leaf Salad | 88312 | 1 serving(s) | Entree | 9.2 | 0.6143 | 0.04 | 0.6389 | 0.0694 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | latin quinoa salad | 9888.14 | 1 serving(s) | Entree | 8.95 | 2.331 | 0.04 | 2.4242 | 0.2709 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | napa peanut sesame soy cabbage salad | 200826 | 1 serving(s) | Entree | 9.2 | 2.9757 | 0.04 | 3.0947 | 0.3364 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | nicoise bowl | 34133.9 | 1 bowl | Entree | 9.2 | 2.9653 | 0 | 2.9653 | 0.3223 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | NW Garden Salad | 134121.1 | 1 serving(s) | Entree | 9.2 | 3.1957 | 0.04 | 3.3235 | 0.3612 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | sesame cashew miso crunch salad | 191153 | 1 serving(s) | Entree | 9.2 | 2.9888 | 0.04 | 3.1083 | 0.3379 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | smoked almond cobb salad | 191038 | 1 serving(s) | Entree | 9.2 | 2.5366 | 0.04 | 2.6381 | 0.2867 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | southwest cobb salad | 135542.4 | 1 serving(s) | Entree | 9.2 | 3.8117 | 0.04 | 3.9642 | 0.4309 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | southwest grain bowl | 214662 | 1 bowl | Entree | 9.2 | 3.6452 | 0.04 | 3.791 | 0.4121 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | southwest salad | 135542.3 | 1 serving(s) | Entree | 9.2 | 3.5879 | 0.04 | 3.7314 | 0.4056 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | spinach strawberry pistachio salad | 67971.8 | 1 serving(s) | Entree | 9.2 | 1.6771 | 0.04 | 1.7442 | 0.1896 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | strawberry farro chicken salad | 84322.1 | 1 serving(s) | Entree | 14.95 | 3.1244 | 0.04 | 3.2494 | 0.2174 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | thai peanut salad | 135643.12 | 1 serving(s) | Entree | 9.2 | 1.8367 | 0.04 | 1.9101 | 0.2076 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | Thai Salad | 150860 | 1 serving(s) | Entree | 9.2 | 1.3201 | 0.04 | 1.3729 | 0.1492 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | turkey cobb salad | 8374 | 1 serving(s) | Entree | 14.95 | 3.4711 | 0.04 | 3.61 | 0.2415 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | Tuscan Salad | 34135.1 | 1 serving(s) | Entree | 9.2 | 1.1922 | 0.04 | 1.2399 | 0.1348 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | Vegan Protein Blast Salad | 83064 | 1 serving(s) | Entree | 9.2 | 2.1998 | 0.04 | 2.2878 | 0.2487 |  |  | Entree + Base |
| AMZ: Greens & Grains | Greens & Grains | grain medley | 211780 | 1 cup | Base |  | 0.5109 | 0.04 | 0.5313 |  | 0.8502 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Greens & Grains | Greens & Grains | half greens, half grains | 210490 | 1 serving(s) | Base |  | 1.1241 | 0.04 | 1.169 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ: Grill Core

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Grill Core | Grill Core | chicken tenders | 173932.2 | 3 each | Entree | 9.25 | 1.8044 | 0.04 | 1.8765 | 0.2029 | 3.6147 | 0.3155 | 1 Entree + 1 Side |
| AMZ: Grill Core | Grill Core | grilled chicken sandwich | 77139.67 | 1 sandwich | Entree | 10.95 | 2.8073 | 0.04 | 2.9196 | 0.2666 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Grill Core | Meatless Black Bean Burger | 82258.1 | 1 each | Entree | 5 | 1.4841 | 0.04 | 1.5435 | 0.3087 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Grill Core | nashville hot chicken sandwich | 107374.35 | 1 sandwich | Entree | 11.45 | 2.9804 | 0.04 | 3.0996 | 0.2707 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Grill Core | santa fe black bean burger | 83088.1 | 1 sandwich | Entree | 11.45 | 4.5126 | 0.04 | 4.6931 | 0.4099 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Grill Core | smashburger | 147955.17 | 1 sandwich | Entree | 10.95 | 2.8084 | 0.04 | 2.9207 | 0.2667 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Grill Core | smashburger with cheese | 77139.66 | 1 sandwich | Entree | 11.45 | 2.9035 | 0.04 | 3.0196 | 0.2637 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | atx burger | 77139.72 | 1 each | Entree | 11.45 | 3.2003 | 0.04 | 3.3283 | 0.2907 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | baja fish sandwich | 84329.3 | 1 each | Entree | 11.45 | 3.9454 | 0.04 | 4.1032 | 0.3584 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | bbq brisket mushroom smashburger | 91861.2 | 1 sandwich | Entree | 13.3 | 5.1004 | 0.04 | 5.3045 | 0.3988 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | blackened steelhead sandwich | 78211.2 | 1 sandwich | Entree | 13.3 | 3.7254 | 0.04 | 3.8744 | 0.2913 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | brunch burger | 107045.1 | 1 each | Entree | 11.45 | 3.7926 | 0.04 | 3.9443 | 0.3445 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | cali salmon burger | 75850.8 | 1 each | Entree | 13.3 | 5.2661 | 0.04 | 5.4767 | 0.4118 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | carne asada torta | 157816.1 | 1 each | Entree | 11.45 | 6.1177 | 0.04 | 6.3624 | 0.5557 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | carolina bbq burger | 63329.3 | 1 each | Entree | 11.45 | 2.8103 | 0.04 | 2.9227 | 0.2553 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | chesapeake chicken sandwich | 77139.7 | 1 each | Entree | 11.45 | 3.1071 | 0.04 | 3.2314 | 0.2822 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | chicken bacon ranch sandwich | 180112.1 | 1 each | Entree | 11.45 | 4.1396 | 0.04 | 4.3052 | 0.376 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | Chili Cheese Dog | 163511.1 | 1 serving(s) | Entree | 11.45 | 2.1675 | 0.04 | 2.2542 | 0.1969 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | crispy buffalo chicken wrap | 132547.5 | 1 sandwich | Entree | 11.45 | 2.9704 | 0.04 | 3.0893 | 0.2698 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | diablo burger | 77139.68 | 1 sandwich | Entree | 11.45 | 2.981 | 0.04 | 3.1002 | 0.2708 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | haystack burger | 77139.69 | 1 sandwich | Entree | 11.45 | 3.8316 | 0.04 | 3.9849 | 0.348 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | korean fried chicken sandwich | 143160.1 | 1 each | Entree | 11.45 | 3.2626 | 0.04 | 3.3931 | 0.2963 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | mushroom swiss burger | 13773.6 | 1 sandwich | Entree | 11.45 | 3.544 | 0.04 | 3.6857 | 0.3219 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | southwest burger | 64908.6 | 1 sandwich | Entree | 11.45 | 3.0222 | 0.04 | 3.1431 | 0.2745 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | spicy firebird sandwich | 107374.37 | 1 sandwich | Entree | 11.45 | 2.5929 | 0.04 | 2.6966 | 0.2355 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | spicy fried cod sandwich | 165740.2 | 1 serving(s) | Entree | 13.3 | 5.0859 | 0.04 | 5.2894 | 0.3977 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Spotlights | teriyaki bacon burger | 63517.3 | 1 sandwich | Entree | 11.45 | 3.8786 | 0.04 | 4.0337 | 0.3523 |  |  | 1 Entree + 1 Side |
| AMZ: Grill Core | Grill Core | French Fries | 39862.1 | 5 ounce | Side | 2.55 | 0.6973 | 0.04 | 0.7252 | 0.2844 | 0.9203 | 0.2788 |  |
| AMZ: Grill Core | Grill Core | fried tater tots | 181001 | 5 ounce | Side | 2.55 | 0.5336 | 0.04 | 0.555 | 0.2176 |  |  |  |
| AMZ: Grill Core | Grill Core | garden salad | 16811 | 1 serving(s) | Side | 8 | 1.3639 | 0.04 | 1.4185 | 0.1773 |  |  |  |
| AMZ: Grill Core | Grill Core | garden salad | 16811 | 1 serving(s) | Side | 5 | 1.3639 | 0.04 | 1.4185 | 0.2837 |  |  |  |
| AMZ: Grill Core | Grill Core | garlic parmesan tots | 181001.1 | 5 ounce | Side | 2.55 | 0.7588 | 0.04 | 0.7891 | 0.3095 |  |  |  |
| AMZ: Grill Core | Grill Core | grilled vegetables | 5294.29 | 1/2 cup | Side | 2 | 0.7431 | 0.04 | 0.7729 | 0.3864 |  |  |  |
| AMZ: Grill Core | Grill Core | loaded fries | 93309.42 | 1 plate | Side | 3.25 | 1.1425 | 0.04 | 1.1882 | 0.3656 |  |  |  |
| AMZ: Grill Core | Grill Core | Onion Rings | 539.8 | 5 ounce | Side | 3.25 | 1.3576 | 0.04 | 1.4119 | 0.4344 |  |  |  |
| AMZ: Grill Core | Grill Core | Sweet Potato Fries | 81296 | 5 ounce | Side | 3.25 | 0.3733 | 0.04 | 0.3882 | 0.1194 |  |  |  |
| AMZ: Grill Core | Grill Core | Waffle Fries | 134755 | 5 ounce | Side | 2.55 | 0.5145 | 0.04 | 0.5351 | 0.2098 |  |  |  |
| AMZ: Grill Core | Grill Core | blackened tofu | 191368.1 | 1 each | Extension | 5 | 0.8426 | 0.04 | 0.8763 | 0.1753 | 1.8495 | 0.2677 |  |
| AMZ: Grill Core | Grill Core | grilled chicken breast | 144591.1 | 1 each | Extension | 5 | 1.5087 | 0.04 | 1.5691 | 0.3138 |  |  |  |
| AMZ: Grill Core | Grill Core | grilled salmon | 221371 | 1 each | Extension |  | 3.2522 | 0.04 | 3.3822 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Grill Core | Grill Core | smashburger patty | 147955.16 | 1 each | Extension | 5 | 1.5098 | 0.04 | 1.5702 | 0.314 |  |  |  |

### AMZ: Harvest Co.

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Harvest Co. | Harvest Co. | green garbanzo tahini kofta | 35992.48 | 2 each | Entree | 11.75 | 1.1353 | 0.04 | 1.1808 | 0.1005 | 3.17 | 0.2458 | 1 Entree + 2 Sides |
| AMZ: Harvest Co. | Harvest Co. | lemon za'atar chicken | 45361.2 | 1 each | Entree | 13 | 6.6399 | 0.04 | 6.9055 | 0.5312 |  |  | 1 Entree + 2 Sides |
| AMZ: Harvest Co. | Harvest Co. | red curry seared ahi tuna | 112222.17 | 1 each | Entree | 13 | 2.4202 | 0.04 | 2.517 | 0.1936 |  |  | 1 Entree + 2 Sides |
| AMZ: Harvest Co. | Harvest Co. | seared herb rockfish with tomato basil vinaigrette | 12989.91 | 1 each | Entree | 13 | 2.4672 | 0.04 | 2.5659 | 0.1974 |  |  | 1 Entree + 2 Sides |
| AMZ: Harvest Co. | Harvest Co. | spice crusted pork tenderloin | 144159.1 | 5 oz portion | Entree | 13 | 2.5778 | 0.04 | 2.6809 | 0.2062 |  |  | 1 Entree + 2 Sides |
| AMZ: Harvest Co. | Harvest Co. | 3 grain garden pilaf | 134243.1 | 1 cup | Side | 2.55 | 1.4704 | 0.04 | 1.5292 | 0.5997 | 1.2764 | 0.5005 |  |
| AMZ: Harvest Co. | Harvest Co. | charred broccolini and cauliflower | 4911.78 | 1/2 cup | Side | 2.55 | 1.957 | 0.04 | 2.0352 | 0.7981 |  |  |  |
| AMZ: Harvest Co. | Harvest Co. | fennel orange asparagus | 122257.2 | 3-1/2 oz portion | Side | 2.55 | 1.5204 | 0.04 | 1.5812 | 0.6201 |  |  |  |
| AMZ: Harvest Co. | Harvest Co. | golden spiced cauliflower steak | 81118.1 | 1 serving(s) | Side | 2.55 | 1.01 | 0.04 | 1.0504 | 0.4119 |  |  |  |
| AMZ: Harvest Co. | Harvest Co. | grilled artichoke | 183273.1 | 1 each | Side | 2.55 | 1.1286 | 0.04 | 1.1737 | 0.4603 |  |  |  |
| AMZ: Harvest Co. | Harvest Co. | ratatouille | 144598.1 | 5 oz portion | Side | 2.55 | 1.8042 | 0.04 | 1.8764 | 0.7358 |  |  |  |
| AMZ: Harvest Co. | Harvest Co. | roasted yucca | 51228.7 | 1/2 cup | Side | 2.55 | 0.3929 | 0.04 | 0.4086 | 0.1603 |  |  |  |
| AMZ: Harvest Co. | Harvest Co. | tomato and bulgur pilaf | 91296.2 | 4 ounce | Side | 2.55 | 0.5347 | 0.04 | 0.556 | 0.2181 |  |  |  |
| AMZ: Harvest Co. | Harvest Co. | baby arugula salad garnish | 88033.1 | 1 ounce | Sub Recipe |  | 0.3984 | 0.04 | 0.4144 |  | 0.3866 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Harvest Co. | Harvest Co. | dill orange fennel | 60810.6 | 1 ounce | Sub Recipe |  | 0.1668 | 0.04 | 0.1735 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Harvest Co. | Harvest Co. | lemon herb cucumbers | 81258.3 | 1 ounce | Sub Recipe |  | 0.2058 | 0.04 | 0.214 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Harvest Co. | Harvest Co. | spicy pickled carrots | 81315.3 | 1 ounce | Sub Recipe |  | 0.7158 | 0.04 | 0.7444 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ: House of Teriyaki

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: House of Teriyaki | Teriyaki | Beef Teriyaki | 83244.2 | 6 ounce | Entree | 13 | 6.3055 | 0.04 | 6.5577 | 0.5044 | 3.2409 | 0.2579 | Entree + Side + Sub Recipe |
| AMZ: House of Teriyaki | Teriyaki | Chicken Teriyaki | 83244.7 | 6 oz portion | Entree | 11.75 | 1.9969 | 0.04 | 2.0768 | 0.1767 |  |  | Entree + Side + Sub Recipe |
| AMZ: House of Teriyaki | Teriyaki | portobello tofu teriyaki | 107142.156 | 6 ounce | Entree | 11.75 | 1.0463 | 0.04 | 1.0881 | 0.0926 |  |  | Entree + Side + Sub Recipe |
| AMZ: House of Teriyaki | Teriyaki | brown rice | 16882.7 | 1 cup | Side | 2.55 | 0.153 | 0.04 | 0.1592 | 0.0624 | 0.5775 | 0.2265 |  |
| AMZ: House of Teriyaki | Teriyaki | Cucumber Salad | 76874 | 4 ounce | Side | 2.55 | 0.9035 | 0.04 | 0.9397 | 0.3685 |  |  |  |
| AMZ: House of Teriyaki | Teriyaki | jasmine rice | 5354.11 | 1 cup | Side | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  |  |
| AMZ: House of Teriyaki | Teriyaki | steamed broccoli | 4911.4 | 1/2 cup | Side | 2.55 | 1.0243 | 0.04 | 1.0653 | 0.4178 |  |  |  |
| AMZ: House of Teriyaki | Teriyaki | sunomono sesame cucumber salad | 200583 | 1/2 cup | Side | 2.55 | 0.3861 | 0.04 | 0.4015 | 0.1575 |  |  |  |
| AMZ: House of Teriyaki | Teriyaki | Teriyaki Salad | 83251 | 3 ounce | Side | 2.55 | 0.5591 | 0.04 | 0.5814 | 0.228 |  |  |  |
| AMZ: House of Teriyaki | Teriyaki | Yakisoba Noodle Stir Fry | 112463 | 4 ounce | Side | 2.55 | 0.5468 | 0.04 | 0.5686 | 0.223 |  |  |  |
| AMZ: House of Teriyaki | Teriyaki | Organic Soy Ginger Dressing | 81555.7 | 1 ounce | Sub Recipe |  | 0.2831 | 0.04 | 0.2944 |  | 0.3094 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: House of Teriyaki | Teriyaki | Spicy Teriyaki Sauce | 83240 | 2 floz | Sub Recipe |  | 0.4183 | 0.04 | 0.435 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: House of Teriyaki | Teriyaki | Teriyaki Sauce | 83233 | 2 ounce | Sub Recipe |  | 0.1913 | 0.04 | 0.1989 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ: Lemongrass + Lime

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | green curry chicken bowl | 101666.8 | 1 bowl | Entree | 11.75 | 3.5606 | 0.04 | 3.703 | 0.3151 | 3.8164 | 0.3161 | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | green curry fish bowl | 193556 | 1 bowl | Entree | 13 | 3.7865 | 0.04 | 3.938 | 0.3029 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | green curry pork bowl | 101666.11 | 1 bowl | Entree | 11.75 | 3.6866 | 0.04 | 3.834 | 0.3263 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | green curry shrimp bowl | 193550 | 1 bowl | Entree | 13 | 3.8223 | 0.04 | 3.9752 | 0.3058 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | green curry tofu bowl | 182206.41 | 1 bowl | Entree | 11.75 | 3.1047 | 0.04 | 3.2288 | 0.2748 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | red curry beef bowl | 193357 | 1 bowl | Entree | 13 | 5.6352 | 0.04 | 5.8606 | 0.4508 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | red curry chicken bowl | 193354 | 1 bowl | Entree | 11.75 | 3.0998 | 0.04 | 3.2237 | 0.2744 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | red curry pork bowl | 193354.1 | 1 bowl | Entree | 11.75 | 3.4232 | 0.04 | 3.5601 | 0.303 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | red curry tofu bowl | 193356 | 1 bowl | Entree | 11.75 | 2.7992 | 0.04 | 2.9112 | 0.2478 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | yellow curry chicken bowl | 193359 | 1 bowl | Entree | 11.75 | 4.1839 | 0.04 | 4.3513 | 0.3703 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | yellow curry pork bowl | 193359.1 | 1 bowl | Entree | 11.75 | 4.5073 | 0.04 | 4.6876 | 0.3989 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | yellow curry tofu bowl | 193495 | 1 bowl | Entree | 11.75 | 2.7473 | 0.04 | 2.8572 | 0.2432 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | yellow vegetable curry bowl | 101666.9 | 1 bowl | Entree | 11.75 | 3.3491 | 0.04 | 3.483 | 0.2964 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | Brown Jasmine Rice | 38424.4 | 1 cup | Rice | 2.55 | 0.2644 | 0.04 | 0.275 | 0.1078 | 0.465 | 0.1824 | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | jasmine rice | 5354.11 | 1 cup | Rice | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  | 1 Entree + 1 Rice + 1 Side |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | Papaya Salad | 107128.2 | 1/2 cup | Side | 2.55 | 0.584 | 0.04 | 0.6074 | 0.2382 | 0.5471 | 0.2145 |  |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | thai cucumber salad with peanuts | 10908.2 | 4 ounce | Side | 2.55 | 0.9094 | 0.04 | 0.9457 | 0.3709 |  |  |  |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | Thai Rice Noodle Salad with Peanuts | 88266.1 | 1/2 cup | Side | 2.55 | 0.3367 | 0.04 | 0.3501 | 0.1373 |  |  |  |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | Thai Sweet & Sour Slaw | 35351.4 | 1/2 cup | Side | 2.55 | 0.2741 | 0.04 | 0.2851 | 0.1118 |  |  |  |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | banana pancake | 176860 | 1 each | Extension | 3.85 | 0.691 | 0.04 | 0.7186 | 0.1867 | 0.9512 | 0.2471 |  |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | Mango Coconut Rice Pudding | 26634.1 | 1 serving(s) | Extension | 3.85 | 0.8161 | 0.04 | 0.8488 | 0.2205 |  |  |  |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | mango sticky rice | 182206.25 | 1 serving(s) | Extension | 3.85 | 1.8403 | 0.04 | 1.9139 | 0.4971 |  |  |  |
| AMZ: Lemongrass + Lime | Lemongrass + Lime | Thai Iced Tea | 176858.1 | 12 floz | Extension | 3.85 | 0.3112 | 0.04 | 0.3236 | 0.0841 |  |  |  |

### AMZ: Lotus

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Lotus | Lotus | beef and broccoli | 165520.3 | 1 cup | Entree | 13 | 1.8413 | 0.04 | 1.915 | 0.1473 | 1.2008 | 0.0986 | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | black pepper chicken | 165520.12 | 1 cup | Entree | 11.75 | 1.4139 | 0.04 | 1.4704 | 0.1251 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | general tsos chicken | 165520.11 | 1 cup | Entree | 11.75 | 1.1208 | 0.04 | 1.1656 | 0.0992 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | orange peel chicken | 165520.2 | 1 cup | Entree | 11.75 | 0.6296 | 0.04 | 0.6548 | 0.0557 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | orange peel tofu | 165520.4 | 1 cup | Entree | 11.75 | 0.6283 | 0.04 | 0.6534 | 0.0556 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | peking beef | 165520 | 1 cup | Entree | 13 | 1.9735 | 0.04 | 2.0524 | 0.1579 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | peking tofu | 165520.2 | 1 cup | Entree | 11.75 | 0.5443 | 0.04 | 0.5661 | 0.0482 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | sesame tofu | 165520.8 | 1 cup | Entree | 11.75 | 0.5933 | 0.04 | 0.617 | 0.0525 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | spicy cashew pork | 165520.6 | 1 cup | Entree | 11.75 | 1.6419 | 0.04 | 1.7075 | 0.1453 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | sweet and sour chicken | 165520.5 | 1 cup | Entree | 11.75 | 0.9744 | 0.04 | 1.0134 | 0.0862 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | Sweet and Sour Tofu | 104819.1 | 8 ounce | Entree | 11.75 | 1.2264 | 0.04 | 1.2755 | 0.1086 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | szechuan shrimp with peanuts | 165520.1 | 1 cup | Entree | 13 | 1.2682 | 0.04 | 1.319 | 0.1015 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | blistered green beans | 176734 | 4 ounce | Side | 2.55 | 1.4926 | 0.04 | 1.5523 | 0.6088 | 0.8239 | 0.3231 |  |
| AMZ: Lotus | Lotus | daikon slaw | 95884.2 | 1/2 cup | Side | 2.55 | 0.763 | 0.04 | 0.7936 | 0.3112 |  |  |  |
| AMZ: Lotus | Lotus | koji grilled carrots | 176731.1 | 1/2 cup | Side | 2.55 | 0.404 | 0.04 | 0.4202 | 0.1648 |  |  |  |
| AMZ: Lotus | Lotus | sesame roasted carrots | 86471.11 | 1/2 cup | Side | 2.55 | 0.6631 | 0.04 | 0.6896 | 0.2704 |  |  |  |
| AMZ: Lotus | Lotus | vegetable fried rice | 165520.13 | 1 cup | Side | 2.55 | 0.8194 | 0.04 | 0.8522 | 0.3342 |  |  |  |
| AMZ: Lotus | Lotus | Vegetarian Egg Roll | 78386.13 | 1 each | Side | 2.55 | 0.692 | 0.04 | 0.7196 | 0.2822 |  |  |  |
| AMZ: Lotus | Lotus | wok blistered garlic kale | 141183 | 1/2 cup | Side | 2.55 | 0.7111 | 0.04 | 0.7395 | 0.29 |  |  |  |
| AMZ: Lotus | Lotus | brown rice | 16882.7 | 1 cup | Base | 2.55 | 0.153 | 0.04 | 0.1592 | 0.0624 | 0.5808 | 0.2278 | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | jasmine rice | 5354.11 | 1 cup | Base | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | vegetable lo mein | 165520.14 | 1 cup | Base | 2.55 | 1.2079 | 0.04 | 1.2562 | 0.4926 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Lotus | Lotus | Shandong Sauce | 143744 | 1-1/2 ounce | Sub Recipe |  | 0.3731 | 0.04 | 0.388 |  | 0.4074 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Lotus | Lotus | Sweet and Sour Sauce | 31693.4 | 1-1/2 floz | Sub Recipe |  | 0.1348 | 0.04 | 0.1402 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Lotus | Lotus | szechuan dumpling sauce | 193093 | 1-1/2 oz portion | Sub Recipe |  | 0.6672 | 0.04 | 0.6939 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Lotus | Lotus | vegetable dumpling | 80785.1 | 5 each | Extension | 3.85 | 1.2331 | 0.04 | 1.2825 | 0.3331 | 1.2825 | 0.3331 |  |

### AMZ: Masaya

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Masaya | Masaya | chicken adobo | 128042 | 6 ounce | Entree | 11.75 | 1.5332 | 0.04 | 1.5945 | 0.1357 | 2.8051 | 0.2261 | 1 Entree + 1 Base + 2 Sides |
| AMZ: Masaya | Masaya | eggplant and long bean adobo | 128045 | 6 ounce | Entree | 11.75 | 1.2306 | 0.04 | 1.2798 | 0.1089 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Masaya | Masaya | filipino style bbq chicken | 128040 | 1 each | Entree | 11.75 | 1.3776 | 0.04 | 1.4327 | 0.1219 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Masaya | Masaya | filipino style bbq pork | 128041 | 6 ounce | Entree | 11.75 | 1.9905 | 0.04 | 2.0701 | 0.1762 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Masaya | Masaya | grilled pork belly | 128042.3 | 6 ounce | Entree | 13 | 2.9762 | 0.04 | 3.0952 | 0.2381 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Masaya | Masaya | lechon kawali (crispy pork belly) | 128042.12 | 5 ounce | Entree | 13 | 7.3902 | 0.04 | 7.6858 | 0.5912 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Masaya | Masaya | pork adobo | 128049 | 6 ounce | Entree | 11.75 | 2.382 | 0.04 | 2.4773 | 0.2108 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Masaya | Masaya | calrose rice | 128042.8 | 1 cup | Base | 2.55 | 0.8633 | 0.04 | 0.8978 | 0.3521 | 0.6489 | 0.2545 | 1 Entree + 1 Base + 2 Sides |
| AMZ: Masaya | Masaya | garlic fried rice | 128046 | 1 cup | Base | 2.55 | 0.3846 | 0.04 | 0.4 | 0.1569 |  |  | 1 Entree + 1 Base + 2 Sides |
| AMZ: Masaya | Masaya | kamote | 128042.7 | 4 ounce | Side | 2.55 | 0.4349 | 0.04 | 0.4523 | 0.1774 | 0.7582 | 0.2973 |  |
| AMZ: Masaya | Masaya | stir fried bean sprouts with tofu | 128042.2 | 4 ounce | Side | 2.55 | 0.6736 | 0.04 | 0.7005 | 0.2747 |  |  |  |
| AMZ: Masaya | Masaya | stir fried bok choy | 128042.5 | 1/2 cup | Side | 2.55 | 0.8982 | 0.04 | 0.9341 | 0.3663 |  |  |  |
| AMZ: Masaya | Masaya | thai cucumber salad with peanuts | 10908.2 | 4 ounce | Side | 2.55 | 0.9094 | 0.04 | 0.9457 | 0.3709 |  |  |  |
| AMZ: Masaya | Masaya | crispy banana turon lumpia | 128042.19 | 2 each | Extension | 3.85 | 0.8376 | 0.04 | 0.8711 | 0.2263 | 0.9548 | 0.248 |  |
| AMZ: Masaya | Masaya | crispy chicken lumpia | 128042.15 | 2 each | Extension | 3.85 | 0.5383 | 0.04 | 0.5598 | 0.1454 |  |  |  |
| AMZ: Masaya | Masaya | crispy vegetable lumpia | 128042.14 | 2 each | Extension | 3.85 | 0.4308 | 0.04 | 0.4481 | 0.1164 |  |  |  |
| AMZ: Masaya | Masaya | crispy vegetable lumpia | 128042.13 | 2 each | Extension | 3.85 | 0.7496 | 0.04 | 0.7796 | 0.2025 |  |  |  |
| AMZ: Masaya | Masaya | pork asado siopao bao | 128042.22 | 1 each | Extension | 3.85 | 1.5431 | 0.04 | 1.6048 | 0.4168 |  |  |  |
| AMZ: Masaya | Masaya | sweet rice cake | 128042.6 | 1 each | Extension | 3.85 | 1.4089 | 0.04 | 1.4653 | 0.3806 |  |  |  |

### AMZ: Ohana

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Ohana | Hawaiian | garlic shrimp | 81043.1 | 1 serving(s) | Entree | 13 | 3.2799 | 0.04 | 3.4111 | 0.2624 | 2.3787 | 0.1954 | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Grilled Pineapple Tofu | 78853 | 5 ounce | Entree | 11.75 | 0.6002 | 0.04 | 0.6243 | 0.0531 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Huli Huli Chicken | 78857 | 5 ounce | Entree | 11.75 | 1.5884 | 0.04 | 1.6519 | 0.1406 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Huli Huli Chicken | 33065.1 | 1 piece | Entree | 11.75 | 2.0093 | 0.04 | 2.0897 | 0.1778 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Huli Huli Salmon | 157223.1 | 5 ounce | Entree | 13 | 2.7536 | 0.04 | 2.8638 | 0.2203 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Huli Huli Tofu | 157223.2 | 5 ounce | Entree | 11.75 | 1.4054 | 0.04 | 1.4616 | 0.1244 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Loco Moco with Fried Egg and Rice | 141995.1 | 1 plate | Entree | 13 | 3.0662 | 0.04 | 3.1889 | 0.2453 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Luau Pork | 76578 | 5 ounce | Entree | 11.75 | 1.7828 | 0.04 | 1.8541 | 0.1578 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Plant Based Loco Moco | 184526.1 | 1 plate | Entree | 11.75 | 5.1988 | 0.04 | 5.4067 | 0.4601 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Pulled Kahlua Pork | 78640 | 5 ounce | Entree | 11.75 | 1.8248 | 0.04 | 1.8978 | 0.1615 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | Vegetable Stuffed Tofu | 143784 | 6 ounce | Entree | 11.75 | 1.6503 | 0.04 | 1.7163 | 0.1461 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | blistered green beans | 176734 | 4 ounce | Side | 2.55 | 1.4926 | 0.04 | 1.5523 | 0.6088 | 0.6674 | 0.2617 |  |
| AMZ: Ohana | Hawaiian | cucumber carrot slaw | 155925 | 1/2 cup | Side | 2.55 | 0.3683 | 0.04 | 0.3831 | 0.1502 |  |  |  |
| AMZ: Ohana | Hawaiian | Garlic Gai Lan | 143768.2 | 4 ounce | Side | 2.55 | 0.6521 | 0.04 | 0.6782 | 0.2659 |  |  |  |
| AMZ: Ohana | Hawaiian | Hawaiian Slaw | 117248 | 4 ounce | Side | 2.55 | 0.4208 | 0.04 | 0.4376 | 0.1716 |  |  |  |
| AMZ: Ohana | Hawaiian | mac salad | 141992 | 1/2 cup | Side | 2.55 | 0.4779 | 0.04 | 0.497 | 0.1949 |  |  |  |
| AMZ: Ohana | Hawaiian | Stir Fry Vegetables | 81443.1 | 4 ounce | Side | 2.55 | 0.7535 | 0.04 | 0.7837 | 0.3073 |  |  |  |
| AMZ: Ohana | Hawaiian | Sweet Yeast Dinner Roll | 1142.3 | 2 each | Side | 2.55 | 0.3266 | 0.04 | 0.3397 | 0.1332 |  |  |  |
| AMZ: Ohana | Hawaiian | brown rice | 16882.7 | 1 cup | Rice | 2.55 | 0.153 | 0.04 | 0.1592 | 0.0624 | 0.5855 | 0.2296 | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | coconut rice | 123270 | 1 cup | Rice | 2.55 | 1.2216 | 0.04 | 1.2704 | 0.4982 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | jasmine rice | 5354.11 | 1 cup | Rice | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  | Entree + Rice + 2 Sides |
| AMZ: Ohana | Hawaiian | guava lemonade | 1506.5 | 12 floz | Extension | 3.85 | 0.8289 | 0.04 | 0.8621 | 0.2239 | 0.8554 | 0.2222 |  |
| AMZ: Ohana | Hawaiian | Mango Coconut Rice Pudding | 26634.1 | 1/2 cup | Extension | 3.85 | 0.8161 | 0.04 | 0.8488 | 0.2205 |  |  |  |

### AMZ: Pho

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Pho | Pho | beef and meatball pho | 176645.3 | 1 bowl | Entree | 13 | 6.2051 | 0.04 | 6.4533 | 0.4964 | 5.5045 | 0.4443 | 1 Entree |
| AMZ: Pho | Pho | beef pho | 176645.2 | 1 serving(s) | Entree | 13 | 5.6924 | 0.04 | 5.9201 | 0.4554 |  |  | 1 Entree |
| AMZ: Pho | Pho | chicken pho | 176645.8 | 1 serving(s) | Entree | 11.75 | 5.2458 | 0.04 | 5.4557 | 0.4643 |  |  | 1 Entree |
| AMZ: Pho | Pho | mushroom pho | 176645.9 | 1 bowl | Entree | 11.75 | 4.8599 | 0.04 | 5.0543 | 0.4302 |  |  | 1 Entree |
| AMZ: Pho | Pho | spicy shrimp pho | 176645.5 | 1 bowl | Entree | 13 | 5.1326 | 0.04 | 5.3379 | 0.4106 |  |  | 1 Entree |
| AMZ: Pho | Pho | tofu mushroom pho | 176645.6 | 1 serving(s) | Entree | 11.75 | 4.6207 | 0.04 | 4.8055 | 0.409 |  |  | 1 Entree |
| AMZ: Pho | Pho | Sliced Jalapeno Pepper | 63607 | 1 tbsp | Sub Recipe |  | 0.0301 | 0.04 | 0.0313 |  | 0.0313 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ: Piccola Italia

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Piccola Italia | Piccola Italia | chicken marsala | 16570.21 | 1 serving(s) | Entree | 11.75 | 2.2634 | 0.04 | 2.3539 | 0.2003 | 1.9446 | 0.1596 | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | chicken pesto rigatoni | 39174 | 8 ounce | Entree | 11.75 | 1.756 | 0.04 | 1.8263 | 0.1554 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | creamy asparagus tomato rigatoni | 7841.1 | 8 oz portion | Entree | 11.75 | 1.9462 | 0.04 | 2.024 | 0.1723 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | creamy shrimp basil rigatoni | 7841.2 | 8 oz portion | Entree | 13 | 3.3616 | 0.04 | 3.4961 | 0.2689 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | Fettuccine Carbonara - Lg Pt | 85294 | 8 ounce | Entree | 11.75 | 2.3712 | 0.04 | 2.4661 | 0.2099 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | Fettuccine Carbonara - Lg Pt | 85294 | 1 serving(s) | Entree | 11.75 | 4.2608 | 0.04 | 4.4313 | 0.3771 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | fettuccine with mushroom cream sauce | 44561 | 8 oz portion | Entree | 11.75 | 0.6126 | 0.04 | 0.6371 | 0.0542 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | Fresh Vegetable Lasagna | 26965.3 | 1 piece | Entree | 11.75 |  | 0.04 |  |  |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | kale orecchiette pasta | 43505.4 | 8 ounce | Entree | 11.75 | 0.9776 | 0.04 | 1.0167 | 0.0865 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | margherita chicken penne | 47737.3 | 8 ounce | Entree | 11.75 | 1.7863 | 0.04 | 1.8577 | 0.1581 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | penne and meatballs | 5708.21 | 1 serving(s) | Entree | 13 | 2.5725 | 0.04 | 2.6754 | 0.2058 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | penne rustica | 191337 | 8 ounce | Entree | 13 | 1.4364 | 0.04 | 1.4939 | 0.1149 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | shrimp pesto rigatoni | 39174.1 | 8 ounce | Entree | 13 | 2.28 | 0.04 | 2.3712 | 0.1824 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | spaghetti and meatballs | 5708.2 | 8 ounce | Entree | 13 | 1.3667 | 0.04 | 1.4213 | 0.1093 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | spaghetti bolognese | 8358 | 8 oz portion | Entree | 13 | 0.791 | 0.04 | 0.8226 | 0.0633 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | sun-dried tomato fettuccine alfredo | 8290 | 8 ounce | Entree | 11.75 | 1.5699 | 0.04 | 1.6327 | 0.139 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | turkey broccoli rabe lemon rotini | 32978.3 | 8 ounce | Entree | 11.75 | 1.5094 | 0.04 | 1.5698 | 0.1336 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | White Bean and Kale Linguine | 141708 | 8 oz portion | Entree | 11.75 | 0.925 | 0.04 | 0.962 | 0.0819 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | balsamic glazed carrots | 58686.5 | 1/2 cup | Side | 2.55 | 0.2448 | 0.04 | 0.2546 | 0.0998 | 0.8118 | 0.3183 |  |
| AMZ: Piccola Italia | Piccola Italia | balsamic roasted brussels sprouts | 17442 | 4 oz portion | Side | 2.55 | 0.6287 | 0.04 | 0.6539 | 0.2564 |  |  |  |
| AMZ: Piccola Italia | Piccola Italia | caesar salad | 16373.2 | 4 ounce | Side | 2.55 | 1.1546 | 0.04 | 1.2008 | 0.4709 |  |  |  |
| AMZ: Piccola Italia | Piccola Italia | Garlic Bread | 31517.2 | 1/4 loaf | Garlic Bread | 2.55 | 0.8014 | 0.04 | 0.8335 | 0.3268 |  |  | 1 Entree + 2 Sides + Garlic Bread |
| AMZ: Piccola Italia | Piccola Italia | garlic cheese bread | 65369 | 4 ounce | Side | 2.55 | 0.7207 | 0.04 | 0.7496 | 0.2939 |  |  |  |
| AMZ: Piccola Italia | Piccola Italia | garlic lemon broccolini | 4911.5 | 1/2 cup | Side | 2.55 | 1.7524 | 0.04 | 1.8225 | 0.7147 |  |  |  |
| AMZ: Piccola Italia | Piccola Italia | Lemon Green Beans with Capers | 51529.3 | 1/2 cup | Side | 2.55 | 0.2335 | 0.04 | 0.2428 | 0.0952 |  |  |  |
| AMZ: Piccola Italia | Piccola Italia | Roasted Vegetable Mix | 74515.1 | 4 ounce | Side | 2.55 | 0.5885 | 0.04 | 0.612 | 0.24 |  |  |  |
| AMZ: Piccola Italia | Piccola Italia | white bean kale salad | 35089.6 | 1/2 cup | Side | 2.55 | 0.9002 | 0.04 | 0.9362 | 0.3671 |  |  |  |
| AMZ: Piccola Italia | Piccola Italia | tiramisu | 172631.1 | 1 serving(s) | Extension | 3.85 | 0.7393 | 0.04 | 0.7688 | 0.1997 | 1.1646 | 0.3025 |  |
| AMZ: Piccola Italia | Piccola Italia | zeppole with pistachio whipped cream | 38401.9 | 3 each | Extension | 3.85 | 1.5004 | 0.04 | 1.5604 | 0.4053 |  |  |  |

### AMZ: Pizzas & Flatbreads

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Pizzas & Flatbreads | Flatbreads | bbq chicken flatbread | 153945.27 | 1 each | Entree | 9.2 | 2.6115 | 0.04 | 2.7159 | 0.2952 | 2.8941 | 0.2867 |  |
| AMZ: Pizzas & Flatbreads | Flatbreads | chicken pesto flatbread | 153945.26 | 1 each | Entree | 9.2 | 3.468 | 0.04 | 3.6068 | 0.392 |  |  |  |
| AMZ: Pizzas & Flatbreads | Flatbreads | fig and goat cheese flatbread | 153945.31 | 1 each | Entree | 9.2 | 3.4818 | 0.04 | 3.6211 | 0.3936 |  |  |  |
| AMZ: Pizzas & Flatbreads | Flatbreads | foragers flatbread | 118557.2 | 1 each | Entree |  | 3.7209 | 0 | 3.7209 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Pizzas & Flatbreads | Flatbreads | four cheese flatbread | 118557.16 | 1 each | Entree |  | 2.4055 | 0 | 2.4055 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Pizzas & Flatbreads | Flatbreads | greek flatbread | 153945.24 | 1 each | Entree | 9.2 | 2.8057 | 0.04 | 2.918 | 0.3172 |  |  |  |
| AMZ: Pizzas & Flatbreads | Flatbreads | kale and sausage flatbread | 153945.29 | 1 each | Entree | 9.2 | 3.0606 | 0.04 | 3.183 | 0.346 |  |  |  |
| AMZ: Pizzas & Flatbreads | Flatbreads | margherita pesto flatbread | 153945.25 | 1 each | Entree | 9.2 | 2.5686 | 0.04 | 2.6714 | 0.2904 |  |  |  |
| AMZ: Pizzas & Flatbreads | Flatbreads | pepperoni capicola salami flatbread | 118557.19 | 1 each | Entree |  | 2.4587 | 0 | 2.4587 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Pizzas & Flatbreads | Flatbreads | pepperoni flatbread | 153945.23 | 1 each | Entree | 9.2 | 2.5489 | 0.04 | 2.6508 | 0.2881 |  |  |  |
| AMZ: Pizzas & Flatbreads | Flatbreads | sausage and pepper flatbread | 118557.18 | 1 each | Entree |  | 2.6688 | 0 | 2.6688 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Pizzas & Flatbreads | Flatbreads | sicillian flatbread | 153945.3 | 1 each | Entree | 9.2 | 2.762 | 0.04 | 2.8725 | 0.3122 |  |  |  |
| AMZ: Pizzas & Flatbreads | Flatbreads | vegetable flatbread | 130513.101 | 1 each | Entree | 9.2 | 2.4664 | 0.04 | 2.5651 | 0.2788 |  |  |  |
| AMZ: Pizzas & Flatbreads | Flatbreads | wild mushroom flatbread | 153945.28 | 1 each | Entree | 9.2 | 3.0175 | 0.04 | 3.1382 | 0.3411 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | butternut squash ricotta pizza | 118557.9 | 1 each | Entree | 11.25 | 1.8264 | 0.04 | 1.8995 | 0.1688 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | chicken bacon ranch pizza | 118557.14 | 1 each | Entree | 11.25 | 2.5893 | 0.04 | 2.6928 | 0.2394 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | foragers pizza | 118557.7 | 1 each | Entree | 11.25 | 3.5083 | 0.04 | 3.6486 | 0.3243 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | four cheese pizza | 118557.3 | 1 each | Entree | 9.2 | 2.1929 | 0.04 | 2.2806 | 0.2479 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | margherita pizza | 118557.4 | 1 each | Entree | 9.2 | 1.916 | 0.04 | 1.9926 | 0.2166 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | pepperoni capicola salami pizza | 118557.6 | 1 each | Entree | 11.25 | 2.6932 | 0.04 | 2.801 | 0.249 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | pepperoni, sausage and ricotta pizza | 118557.11 | 1 each | Entree | 11.25 | 2.9946 | 0.04 | 3.1144 | 0.2768 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | roasted garlic blue cheese pizza | 118557.13 | 1 each | Entree | 11.25 | 2.489 | 0.04 | 2.5885 | 0.2301 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | salami, basil and hot honey pizza | 118557.12 | 1 each | Entree | 11.25 | 3.1902 | 0.04 | 3.3178 | 0.2949 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | sausage and pepper pizza | 118557.5 | 1 each | Entree | 11.25 | 2.4562 | 0.04 | 2.5544 | 0.2271 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | seattle pizza | 118557.8 | 1 each | Entree | 11.25 | 4.5223 | 0.04 | 4.7032 | 0.4181 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | tarte d'alsace | 118557.2 | 1 each | Entree | 11.25 | 3.0153 | 0.04 | 3.1359 | 0.2787 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | triple meat pizza | 118557.1 | 1 each | Entree | 11.25 | 2.6339 | 0.04 | 2.7393 | 0.2435 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | veggie medley pizza | 130513.1 | 1 each | Entree | 11.25 | 2.2778 | 0.04 | 2.3689 | 0.2106 |  |  |  |
| AMZ: Pizzas & Flatbreads | Pizzas | garlic knots with sauce | 16121.17 | 1 serving(s) | Side | 2.55 | 0.3715 | 0.04 | 0.3863 | 0.1515 | 0.3863 | 0.1515 |  |
| AMZ: Pizzas & Flatbreads | Pizzas | Almond Rocky Road Cookie | 127599.11 | 2 each | Extension | 2.95 | 0.7213 | 0 | 0.7213 | 0.2445 | 0.7213 | 0.2445 |  |

### AMZ: Poke Counter

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Poke Counter | Poke | salmon poke bowl | 141014.3 | 1 each | Entree | 13 | 3.2346 | 0.04 | 3.364 | 0.2588 | 2.4834 | 0.1955 | 1 Entree + 1 Base + 5 Toppings + 1 Sub Recipe |
| AMZ: Poke Counter | Poke | shrimp poke | 193768.2 | 1/2 cup | Entree | 13 | 0.9771 | 0.04 | 1.0161 | 0.0782 |  |  | 1 Entree + 1 Base + 5 Toppings + 1 Sub Recipe |
| AMZ: Poke Counter | Poke | tofu poke bowl | 141014.2 | 1 each | Entree | 11.75 | 2.1052 | 0.04 | 2.1894 | 0.1863 |  |  | 1 Entree + 1 Base + 5 Toppings + 1 Sub Recipe |
| AMZ: Poke Counter | Poke | tuna poke bowl | 141014.4 | 1 each | Entree | 13 | 3.2346 | 0.04 | 3.364 | 0.2588 |  |  | 1 Entree + 1 Base + 5 Toppings + 1 Sub Recipe |
| AMZ: Poke Counter | Poke | brown sushi rice | 76699.2 | 12 ounce | Base |  | 1.5347 | 0.04 | 1.5961 |  | 0.6647 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Spring Mix | 47795.1 | 1 cup | Base |  | 0.5858 | 0.04 | 0.6092 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Wakame Seaweed Salad | 77206 | 1/4 cup | Base |  | 0.2203 | 0.04 | 0.2291 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | wonton chips | 162132.1 | 2-1/4 oz portion | Base |  | 0.838 | 0.04 | 0.8715 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | wonton strips | 10820.8 | 1/8 cup | Base |  | 0.0172 | 0.04 | 0.0178 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Shoyu Yuzu Sauce | 122493 | 2 floz | Sub Recipe |  | 0.4397 | 0.04 | 0.4573 |  | 0.4299 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Sriracha Mayo | 140423 | 2 floz | Sub Recipe |  | 0.387 | 0.04 | 0.4025 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Chopped Dried Nori | 13404.9 | 1/4 cup | Topping |  | 0.0666 | 0.04 | 0.0693 |  | 0.2441 | 0.1368 | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | daikon slaw | 95884.2 | 1/4 cup | Topping |  | 0.3815 | 0.04 | 0.3968 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Diced Avocado | 62292 | 1/4 cup | Topping | 2.05 | 0.2697 | 0.04 | 0.2805 | 0.1368 |  |  | 1 Entree + 1 Base + 5 Toppings + 1 Sub Recipe |
| AMZ: Poke Counter | Poke | Diced Cucumber | 62336 | 1/4 cup | Topping |  | 0.197 | 0.04 | 0.2048 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | fried shallots | 25135.1 | 1/4 cup | Topping |  | 0.2563 | 0.04 | 0.2665 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Julienned Red Onion | 148498 | 1/4 cup | Topping |  | 0.0792 | 0.04 | 0.0823 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Mango | 63580 | 1/4 cup | Topping |  | 0.2485 | 0.04 | 0.2585 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | peppered edamame | 85529 | 2 ounce | Topping |  | 0.444 | 0.04 | 0.4618 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Red & Yellow Bell Pepper Blend | 128180.2 | 2 ounce | Topping |  | 0.5581 | 0.04 | 0.5804 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Roasted Corn | 15306.1 | 1/4 cup | Topping |  | 0.1991 | 0.04 | 0.2071 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Sesame Seeds | 63113 | 1 tbsp | Topping |  | 0.108 | 0.04 | 0.1123 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Shredded Carrots | 119962 | 1/4 cup | Topping |  | 0.129 | 0.04 | 0.1342 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Sliced Pickled Ginger | 63608.1 | 1/4 cup | Topping |  | 0.2393 | 0.04 | 0.2489 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Sliced Radishes | 74414 | 1/4 cup | Topping |  | 0.2722 | 0.04 | 0.283 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Poke Counter | Poke | Sliced Watermelon Radish | 63080.2 | 1/4 cup | Topping |  | 0.0715 | 0.04 | 0.0744 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ: Porto

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Porto | Piri Piri | piri piri chicken | 121026 | 1 piece | Entree | 11.75 | 1.7215 | 0.04 | 1.7904 | 0.1524 | 1.5278 | 0.1258 | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Porto | Piri Piri | piri piri chicken thigh | 121025 | 5 ounce | Entree | 11.75 | 1.2877 | 0.04 | 1.3392 | 0.114 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Porto | Piri Piri | piri piri shrimp skewers | 121023 | 2 each | Entree | 13 | 1.9734 | 0.04 | 2.0524 | 0.1579 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Porto | Piri Piri | piri piri tofu skewers | 121022.2 | 1 each | Entree | 11.75 | 0.8937 | 0.04 | 0.9294 | 0.0791 |  |  | 1 Entree + 2 Sides + 1 Sub Recipe |
| AMZ: Porto | Piri Piri | black eyed pea salad | 120671 | 1/2 cup | Side | 2.55 | 0.5618 | 0.04 | 0.5843 | 0.2291 | 0.7557 | 0.2964 |  |
| AMZ: Porto | Piri Piri | escalivada | 120752 | 1/2 cup | Side | 2.55 | 0.4549 | 0.04 | 0.4731 | 0.1855 |  |  |  |
| AMZ: Porto | Piri Piri | peri peri green beans | 9002.15 | 1/2 cup | Side | 2.55 | 1.239 | 0.04 | 1.2886 | 0.5053 |  |  |  |
| AMZ: Porto | Piri Piri | piri piri potato wedges | 121015 | 4 oz portion | Side | 2.55 | 0.2222 | 0.04 | 0.231 | 0.0906 |  |  |  |
| AMZ: Porto | Piri Piri | pistachio herb couscous salad | 120641 | 1/2 cup | Side | 2.55 | 1.1553 | 0.04 | 1.2015 | 0.4712 |  |  |  |
| AMZ: Porto | Piri Piri | piri piri dipping sauce | 120722 | 2 floz | Sub Recipe |  | 0.7705 | 0.04 | 0.8013 |  | 0.6413 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Porto | Piri Piri | piri-naise dipping sauce | 121071 | 2 floz | Sub Recipe |  | 0.4628 | 0.04 | 0.4813 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Porto | Piri Piri | Piri Piri Guacamole with Crudite | 147707 | 1 serving(s) | Extension | 3.85 | 1.8387 | 0.04 | 1.9122 | 0.4967 | 1.9122 | 0.4967 |  |

### AMZ: Roam BBQ

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Roam BBQ | Roam BBQ | carochina ribs | 191763 | 5 ounce | Entree | 11.75 | 5.1681 | 0.04 | 5.3749 | 0.4574 | 2.4051 | 0.1976 | 1 Entree + 2 Sides + 4 Sub Recipes |
| AMZ: Roam BBQ | Roam BBQ | honey gochu-butter shrimp | 191761 | 1 each | Entree | 13 | 2.6408 | 0.04 | 2.7464 | 0.2113 |  |  | 1 Entree + 2 Sides + 4 Sub Recipes |
| AMZ: Roam BBQ | Roam BBQ | honey gochujang butter chicken | 191762 | 5 oz meat | Entree | 11.75 | 1.1853 | 0.04 | 1.2327 | 0.1049 |  |  | 1 Entree + 2 Sides + 4 Sub Recipes |
| AMZ: Roam BBQ | Roam BBQ | honey gochujang butter eggplant and tofu | 191760 | 1 each | Entree | 11.75 | 1.2476 | 0.04 | 1.2975 | 0.1104 |  |  | 1 Entree + 2 Sides + 4 Sub Recipes |
| AMZ: Roam BBQ | Roam BBQ | shaokao chicken skewer | 191769 | 1 each | Entree | 11.75 | 1.3672 | 0.04 | 1.4219 | 0.121 |  |  | 1 Entree + 2 Sides + 4 Sub Recipes |
| AMZ: Roam BBQ | Roam BBQ | shaokao lamb skewer | 191768 | 1 each | Entree | 13 | 3.9967 | 0.04 | 4.1565 | 0.3197 |  |  | 1 Entree + 2 Sides + 4 Sub Recipes |
| AMZ: Roam BBQ | Roam BBQ | shaokao tofu skewer | 191767 | 1 each | Entree | 11.75 | 1.3855 | 0.04 | 1.4409 | 0.1226 |  |  | 1 Entree + 2 Sides + 4 Sub Recipes |
| AMZ: Roam BBQ | Roam BBQ | sweet gochujang pork belly burnt ends | 191756 | 5 ounce | Entree | 11.75 | 1.5097 | 0.04 | 1.5701 | 0.1336 |  |  | 1 Entree + 2 Sides + 4 Sub Recipes |
| AMZ: Roam BBQ | Roam BBQ | cabbage apple slaw | 91765.2 | 1/2 cup | Side | 2.55 | 0.4372 | 0.04 | 0.4547 | 0.1783 | 0.5488 | 0.2152 |  |
| AMZ: Roam BBQ | Roam BBQ | cheesy tteokbokki | 191753 | 4 ounce | Side | 2.55 | 0.6044 | 0.04 | 0.6286 | 0.2465 |  |  |  |
| AMZ: Roam BBQ | Roam BBQ | Glass Noodles with Vegetables | 86472.1 | 4 ounce | Side | 2.55 | 0.3846 | 0.04 | 0.4 | 0.1569 |  |  |  |
| AMZ: Roam BBQ | Roam BBQ | Steamed Jasmine Rice | 165124 | 1 cup | Side | 2.55 | 0.634 | 0.04 | 0.6594 | 0.2586 |  |  |  |
| AMZ: Roam BBQ | Roam BBQ | wasabi potato salad | 27313.7 | 1/2 cup | Side | 2.55 | 0.5781 | 0.04 | 0.6012 | 0.2358 |  |  |  |
| AMZ: Roam BBQ | Roam BBQ | Bread & Butter Pickles | 63438.1 | 4 each | Sub Recipe |  | 0.0521 | 0.04 | 0.0542 |  | 0.3322 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Roam BBQ | Roam BBQ | carochina mustard sauce | 191747 | 2 floz | Sub Recipe |  | 0.225 | 0.04 | 0.234 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Roam BBQ | Roam BBQ | fire cracker sauce | 191744 | 2 floz | Sub Recipe |  | 0.4113 | 0.04 | 0.4278 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Roam BBQ | Roam BBQ | Kimchi | 144772 | 1/8 cup | Sub Recipe |  | 0.1782 | 0.04 | 0.1854 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Roam BBQ | Roam BBQ | kombu miso eggplant | 191750 | 2 ounce | Sub Recipe |  | 0.4326 | 0.04 | 0.45 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Roam BBQ | Roam BBQ | kombu miso greens | 191751 | 2 ounce | Sub Recipe |  | 0.6371 | 0.04 | 0.6626 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Roam BBQ | Roam BBQ | korean kansas city bbq sauce | 191746 | 2 floz | Sub Recipe |  | 0.2888 | 0.04 | 0.3004 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Roam BBQ | Roam BBQ | ssamjang brussels sprouts | 191748 | 1/4 cup | Sub Recipe |  | 0.4586 | 0.04 | 0.4769 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Roam BBQ | Roam BBQ | sweet fire sauce | 191745 | 2 floz | Sub Recipe |  | 0.1913 | 0.04 | 0.1989 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Roam BBQ | Roam BBQ | banana miso pudding | 191734 | 8 oz parfait | Extension | 3.85 | 1.1572 | 0.04 | 1.2035 | 0.3126 | 1.4331 | 0.3722 |  |
| AMZ: Roam BBQ | Roam BBQ | yuzu cream lemonade | 191743 | 8 floz | Extension | 3.85 | 1.5989 | 0.04 | 1.6628 | 0.4319 |  |  |  |

### AMZ: Saffron

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Saffron | Saffron | chicken apricot tagine | 128359 | 1 cup | Entree | 11.75 | 1.6475 | 0.04 | 1.7134 | 0.1458 | 1.5658 | 0.1286 | 1 Entree + 2 Sides |
| AMZ: Saffron | Saffron | roasted lamb tagine | 128358 | 1 cup | Entree | 13 | 1.6498 | 0.04 | 1.7158 | 0.132 |  |  | 1 Entree + 2 Sides |
| AMZ: Saffron | Saffron | seven vegetable tagine | 128408 | 1-1/4 cup | Entree | 11.75 | 1.2194 | 0.04 | 1.2682 | 0.1079 |  |  | 1 Entree + 2 Sides |
| AMZ: Saffron | Saffron | artichoke snap pea salad with lemon | 128356 | 1/2 cup | Side | 2.55 | 0.4709 | 0.04 | 0.4898 | 0.1921 | 0.4657 | 0.1826 |  |
| AMZ: Saffron | Saffron | citrus almond spiced couscous | 128361 | 1 cup | Side | 2.55 | 0.4001 | 0.04 | 0.4161 | 0.1632 |  |  |  |
| AMZ: Saffron | Saffron | harissa carrot salad | 164784 | 1/2 cup | Side | 2.55 | 0.5239 | 0.04 | 0.5449 | 0.2137 |  |  |  |
| AMZ: Saffron | Saffron | lemon basmati rice | 165425 | 1 cup | Side | 2.55 | 0.3961 | 0.04 | 0.412 | 0.1616 |  |  |  |

### AMZ: Salt & Char

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Salt & Char | Salt & Char | beechers mac and cheese | 164247.3 | 1 bowl | Entree | 8.75 | 5.5942 | 0.04 | 5.818 | 0.6649 | 4.5122 | 0.3852 | 1 Entree + 1 Side |
| AMZ: Salt & Char | Salt & Char | blackened ahi tuna plate | 204429 | 1 plate | Entree | 15.5 | 3.5074 | 0.04 | 3.6476 | 0.2353 |  |  | 1 Entree + 1 Side |
| AMZ: Salt & Char | Salt & Char | blackened steelhead trout blt | 34302.1 | 1 sandwich | Entree | 14.95 | 5.2064 | 0.04 | 5.4146 | 0.3622 |  |  | 1 Entree + 1 Side |
| AMZ: Salt & Char | Salt & Char | brie chicken sandwich | 77139.75 | 1 sandwich | Entree | 11.75 | 3.752 | 0.04 | 3.9021 | 0.3321 |  |  | 1 Entree + 1 Side |
| AMZ: Salt & Char | Salt & Char | cobb salad with avocado ranch | 8374.5 | 1 bowl | Entree | 9.2 | 3.9884 | 0.04 | 4.148 | 0.4509 |  |  | 1 Entree + 1 Side |
| AMZ: Salt & Char | Salt & Char | seared maitake smashburger | 13773.7 | 1 sandwich | Entree | 13.3 | 3.5807 | 0.04 | 3.7239 | 0.28 |  |  | 1 Entree + 1 Side |
| AMZ: Salt & Char | Salt & Char | steelhead trout chowder bread bowl | 195285 | 1 serving(s) | Entree | 13.3 | 4.7417 | 0.04 | 4.9313 | 0.3708 |  |  | 1 Entree + 1 Side |
| AMZ: Salt & Char | Salt & Char | bakers chips | 18733.1 | 2 cup | Side | 2.55 | 0.2868 | 0.04 | 0.2983 | 0.117 | 1.1542 | 0.4526 |  |
| AMZ: Salt & Char | Salt & Char | coconut rice | 149824.1 | 1 cup | Side | 2.55 | 0.8185 | 0.04 | 0.8512 | 0.3338 |  |  |  |
| AMZ: Salt & Char | Salt & Char | garden salad | 16811.8 | 1 each | Side | 2.55 | 1.8115 | 0.04 | 1.884 | 0.7388 |  |  |  |
| AMZ: Salt & Char | Salt & Char | garden salad with balsamic dressing | 16811.5 | 1 each | Side | 2.55 | 1.8119 | 0.04 | 1.8844 | 0.739 |  |  |  |
| AMZ: Salt & Char | Salt & Char | garden salad with italian dressing | 16811.7 | 1 each | Side | 2.55 | 1.5857 | 0.04 | 1.6492 | 0.6467 |  |  |  |
| AMZ: Salt & Char | Salt & Char | Roasted Root Vegetables | 17425.2 | 3/4 cup | Side | 2.55 | 0.9789 | 0.04 | 1.018 | 0.3992 |  |  |  |
| AMZ: Salt & Char | Salt & Char | Waffle Fries | 8414.57 | 4 ounce | Side | 2.55 | 0.4755 | 0.04 | 0.4945 | 0.1939 |  |  |  |
| AMZ: Salt & Char | Salt & Char | Garlic Herb Marinated Tofu | 167505 | 4 ounce | Extension |  | 0.9445 | 0.04 | 0.9823 |  | 1.9531 | 0.3048 | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Salt & Char | Salt & Char | grilled chicken breast | 144591.1 | 1 each | Extension | 8 | 1.5087 | 0.04 | 1.5691 | 0.1961 |  |  |  |
| AMZ: Salt & Char | Salt & Char | large garden salad | 16811.9 | 1 each | Extension | 8 | 3.1808 | 0.04 | 3.3081 | 0.4135 |  |  |  |

### AMZ: Smokehouse BBQ

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Smokehouse BBQ | Big City BBQ | BBQ baby back ribs | 44966 | 4 each | Entree | 13 | 2.6069 | 0.04 | 2.7111 | 0.2085 | 1.9193 | 0.1572 | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | BBQ Chicken Thighs | 171040 | 5 oz portion | Entree | 11.75 | 0.9252 | 0.04 | 0.9622 | 0.0819 |  |  | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | bbq rotisserie chicken | 4651.6 | 1 each | Entree | 11.75 | 1.5114 | 0.04 | 1.5718 | 0.1338 |  |  | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | Braised Shredded Pork | 44948.1 | 5 ounce | Entree | 11.75 | 1.4722 | 0.04 | 1.5311 | 0.1303 |  |  | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | Jackfruit Barbecue Sandwich | 135703 | 1 sandwich | Entree | 11.75 | 1.5618 | 0.04 | 1.6243 | 0.1382 |  |  | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | kielbasa sausage | 5365.6 | 5 ounce | Entree | 11.75 | 1.8025 | 0.04 | 1.8746 | 0.1595 |  |  | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | Memphis Pulled Pork Sandwich | 143209 | 1 sandwich | Entree | 11.75 | 2.1503 | 0.04 | 2.2363 | 0.1903 |  |  | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | Slow Roasted BBQ Spareribs | 178230 | 5 ounce | Entree | 13 | 3.8914 | 0.04 | 4.0471 | 0.3113 |  |  | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | Smoked BBQ Tofu | 87937 | 5 ounce | Entree | 11.75 | 0.6875 | 0.04 | 0.715 | 0.0608 |  |  | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | bbq baked beans | 18314 | 4 oz portion | Side | 2.55 | 0.3349 | 0.04 | 0.3483 | 0.1366 | 0.411 | 0.1612 |  |
| AMZ: Smokehouse BBQ | Big City BBQ | coleslaw | 156388 | 1/2 cup | Side | 2.55 | 0.3435 | 0.04 | 0.3572 | 0.1401 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | Corn Succotash with Lima Beans | 27385.2 | 4 ounce | Side | 2.55 | 0.5385 | 0.04 | 0.5601 | 0.2196 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | Cornbread | 140479 | 4 ounce | Cornbread | 2.55 | 0.2729 | 0.04 | 0.2839 | 0.1113 |  |  | 1 Entree + 2 Sides + Cornbread + 1 Sub Recipe |
| AMZ: Smokehouse BBQ | Big City BBQ | Grilled Corn | 34041.1 | 1 each | Side | 2.55 | 0.3245 | 0.04 | 0.3374 | 0.1323 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | hush puppies | 116037 | 2 each | Side | 2.55 | 0.2557 | 0.04 | 0.266 | 0.1043 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | loaded potato salad | 34989.6 | 1/2 cup | Side | 2.55 | 0.5089 | 0.04 | 0.5292 | 0.2075 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | Mac & Cheese | 135194.3 | 1/2 cup | Side | 2.55 | 0.2235 | 0.04 | 0.2324 | 0.0911 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | roasted sweet potatoes | 5633.3 | 1/2 cup | Side | 2.55 | 0.2446 | 0.04 | 0.2544 | 0.0998 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | root vegetable succotash | 162176 | 1/2 cup | Side | 2.55 | 0.7609 | 0.04 | 0.7913 | 0.3103 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | spicy collard greens | 18326.5 | 1/2 cup | Side | 2.55 | 0.5394 | 0.04 | 0.561 | 0.22 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | Barbecue Sauce | 184229 | 2 ounce | Sub Recipe |  | 0.1717 | 0.04 | 0.1786 |  | 0.2452 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Smokehouse BBQ | Big City BBQ | carochina mustard sauce | 191747 | 2 floz | Sub Recipe |  | 0.225 | 0.04 | 0.234 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Smokehouse BBQ | Big City BBQ | Gold Barbecue Sauce | 39571 | 2 floz | Sub Recipe |  | 0.2295 | 0.04 | 0.2387 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Smokehouse BBQ | Big City BBQ | Honey Barbecue Sauce | 144725 | 2 floz | Sub Recipe |  | 0.2419 | 0 | 0.2419 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Smokehouse BBQ | Big City BBQ | honey BBQ | 27397.2 | 2 floz | Sub Recipe |  | 0.4113 | 0.04 | 0.4277 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Smokehouse BBQ | Big City BBQ | Memphis Style Barbecue Sauce | 142988 | 2 ounce | Sub Recipe |  | 0.1444 | 0.04 | 0.1502 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Smokehouse BBQ | Big City BBQ | Bread Pudding | 159866 | 1 serving(s) | Extension | 3.85 | 1.2032 | 0.04 | 1.2513 | 0.325 | 0.9875 | 0.2565 |  |
| AMZ: Smokehouse BBQ | Big City BBQ | fresh lemonade | 26880.3 | 12 floz | Extension | 3.85 | 0.3153 | 0.04 | 0.3279 | 0.0852 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | old fashioned peach cobbler | 60694.1 | 1 cup | Extension | 3.85 | 0.778 | 0.04 | 0.8091 | 0.2102 |  |  |  |
| AMZ: Smokehouse BBQ | Big City BBQ | pecan pie | 84769 | 1 slice | Extension | 3.85 | 1.5017 | 0.04 | 1.5618 | 0.4057 |  |  |  |

### AMZ: Street Eats

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Street Eats | El Queso Birria | birria queso tacos | 194908 | 1 serving(s) | Entree | 13 | 1.5146 | 0.04 | 1.5752 | 0.1212 | 3.2667 | 0.2645 | 1 Entree + 1 Side |
| AMZ: Street Eats | El Queso Birria | jackfruit birria queso tacos | 194908.1 | 1 serving(s) | Entree | 11.75 | 1.1221 | 0.04 | 1.167 | 0.0993 |  |  | 1 Entree + 1 Side |
| AMZ: Street Eats | Fried Rice | bbq pork chicken fried rice | 88262.3 | 1 each | Entree | 11.75 | 1.5962 | 0.04 | 1.66 | 0.1413 |  |  | 1 Entree |
| AMZ: Street Eats | Fried Rice | shoyu sesame chicken fried rice | 88262.1 | 1 each | Entree | 11.75 | 1.4013 | 0.04 | 1.4574 | 0.124 |  |  | 1 Entree |
| AMZ: Street Eats | Fried Rice | soy glazed mushroom fried rice | 88262.2 | 1 each | Entree | 11.75 | 2.2391 | 0.04 | 2.3286 | 0.1982 |  |  | 1 Entree |
| AMZ: Street Eats | Fried Rice | teriyaki beef fried rice | 88262.4 | 1 each | Entree | 13 | 4.9099 | 0.04 | 5.1063 | 0.3928 |  |  | 1 Entree |
| AMZ: Street Eats | Naan Nomad | chicken tikka masala naanwich | 104707.1 | 1 sandwich | Entree | 11.75 | 3.085 | 0.04 | 3.2084 | 0.2731 |  |  | 1 Entree + 2 Sides |
| AMZ: Street Eats | Naan Nomad | mutter paneer naanwich | 104707.6 | 1 each | Entree | 11.75 | 3.0441 | 0.04 | 3.1659 | 0.2694 |  |  | 1 Entree + 2 Sides |
| AMZ: Street Eats | Naan Nomad | roasted eggplant naanwich | 104707.5 | 1 sandwich | Entree | 11.75 | 2.7721 | 0.04 | 2.883 | 0.2454 |  |  | 1 Entree + 2 Sides |
| AMZ: Street Eats | Naan Nomad | tandoori lamb naanwich | 104707.4 | 1 sandwich | Entree | 13 | 5.8973 | 0.04 | 6.1332 | 0.4718 |  |  | 1 Entree + 2 Sides |
| AMZ: Street Eats | Naan Nomad | tandoori salmon naanwich | 104707.3 | 1 sandwich | Entree | 13 | 6.3316 | 0.04 | 6.5848 | 0.5065 |  |  | 1 Entree + 2 Sides |
| AMZ: Street Eats | Pho Dip | pho-rench dip banh mi | 141291.4 | 1 sandwich | Entree | 13 | 5.1117 | 0.04 | 5.3162 | 0.4089 |  |  | 1 Entree + 1 Side |
| AMZ: Street Eats | Pho Dip | pho-rench dip tofu banh mi | 141291.1 | 1 sandwich | Entree | 11.75 | 3.2519 | 0.04 | 3.3819 | 0.2878 |  |  | 1 Entree + 1 Side |
| AMZ: Street Eats | Quesadillas | cauliflower makhni quesadilla | 194591.1 | 1 each | Entree | 11.75 | 1.9724 | 0.04 | 2.0513 | 0.1746 |  |  | 1 Entree + 2 Sides |
| AMZ: Street Eats | Quesadillas | tandoori chicken quesadilla | 194591 | 1 each | Entree | 11.75 | 2.8667 | 0.04 | 2.9814 | 0.2537 |  |  | 1 Entree + 2 Sides |
| AMZ: Street Eats | El Queso Birria | charro beans | 77114.4 | 4 ounce | Side | 2.55 | 0.7624 | 0.04 | 0.7929 | 0.3109 | 0.7435 | 0.2916 |  |
| AMZ: Street Eats | El Queso Birria | cilantro lime rice | 41689.9 | 1/2 cup | Side | 2.55 | 0.3514 | 0.04 | 0.3655 | 0.1433 |  |  |  |
| AMZ: Street Eats | El Queso Birria | Cilantro Slaw | 81495 | 4 ounce | Side | 2.55 | 1.3815 | 0.04 | 1.4368 | 0.5634 |  |  |  |
| AMZ: Street Eats | El Queso Birria | elote salad | 144664 | 1/2 cup | Side | 2.55 | 0.6095 | 0.04 | 0.6339 | 0.2486 |  |  |  |
| AMZ: Street Eats | El Queso Birria | esquites | 42004.11 | 1/2 cup | Side | 2.55 | 0.5755 | 0.04 | 0.5985 | 0.2347 |  |  |  |
| AMZ: Street Eats | El Queso Birria | Pickled Slaw | 18179.2 | 4 ounce | Side | 2.55 | 0.6591 | 0.04 | 0.6855 | 0.2688 |  |  |  |
| AMZ: Street Eats | El Queso Birria | red rice | 41728.4 | 1/2 cup | Side | 2.55 | 0.3184 | 0.04 | 0.3311 | 0.1299 |  |  |  |
| AMZ: Street Eats | El Queso Birria | spicy black beans | 41579 | 1/2 cup | Side | 2.55 | 0.5294 | 0.04 | 0.5506 | 0.2159 |  |  |  |
| AMZ: Street Eats | Naan Nomad | Aloo Gobhi | 118677 | 1/2 cup | Side | 2.55 | 0.6459 | 0.04 | 0.6717 | 0.2634 |  |  |  |
| AMZ: Street Eats | Naan Nomad | chana masala | 165741.24 | 1/2 cup | Side | 2.55 | 1.1214 | 0.04 | 1.1662 | 0.4573 |  |  |  |
| AMZ: Street Eats | Naan Nomad | Dal Amritsari (Dhaaba Dal) | 118715 | 1/2 cup | Side | 2.55 | 0.4598 | 0.04 | 0.4781 | 0.1875 |  |  |  |
| AMZ: Street Eats | Naan Nomad | kachumbar | 165741.11 | 1/2 cup | Side | 2.55 | 0.6984 | 0.04 | 0.7263 | 0.2848 |  |  |  |
| AMZ: Street Eats | Naan Nomad | taarka dal | 165741.3 | 1/2 cup | Side | 2.55 | 1.3149 | 0.04 | 1.3675 | 0.5363 |  |  |  |
| AMZ: Street Eats | Pho Dip | Cucumber Salad | 76874 | 4 ounce | Side | 2.55 | 0.9035 | 0.04 | 0.9397 | 0.3685 |  |  |  |
| AMZ: Street Eats | Pho Dip | papaya salad | 76877.1 | 4 ounce | Side | 2.55 | 0.6501 | 0.04 | 0.6761 | 0.2651 |  |  |  |
| AMZ: Street Eats | Pho Dip | Sriracha Fries | 89624.1 | 4 ounce | Side | 2.55 | 0.5054 | 0.04 | 0.5256 | 0.2061 |  |  |  |
| AMZ: Street Eats | Pho Dip | Vietnamese Side Salad | 124192 | 1/2 cup | Side | 2.55 | 0.5318 | 0.04 | 0.5531 | 0.2169 |  |  |  |
| AMZ: Street Eats | Quesadillas | chana masala | 165741.24 | 1/2 cup | Side | 2.55 | 1.1214 | 0.04 | 1.1662 | 0.4573 |  |  |  |
| AMZ: Street Eats | Quesadillas | Dal Amritsari (Dhaaba Dal) | 118715 | 1/2 cup | Side | 2.55 | 0.4598 | 0.04 | 0.4781 | 0.1875 |  |  |  |
| AMZ: Street Eats | Quesadillas | kachumbar | 165741.11 | 1/2 cup | Side | 2.55 | 0.6984 | 0.04 | 0.7263 | 0.2848 |  |  |  |
| AMZ: Street Eats | Fried Rice | Kimchi | 144772 | 1 floz | Sub Recipe |  | 0.1782 | 0.04 | 0.1854 |  | 0.1405 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Street Eats | Quesadillas | Raita Sauce | 81281 | 1 ounce | Sub Recipe |  | 0.1604 | 0.04 | 0.1668 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Street Eats | Quesadillas | Spicy Cilantro Chutney | 81768 | 1 ounce | Sub Recipe |  | 0.0668 | 0.04 | 0.0695 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Street Eats | Fried Rice | Fried Egg | 48575.1 | 1 each | Extension | 2.05 | 0.4938 | 0.04 | 0.5135 | 0.2505 | 0.9864 | 0.3148 |  |
| AMZ: Street Eats | Naan Nomad | Mango Lassi | 105093 | 12 ounce | Extension | 3.85 | 1.4033 | 0.04 | 1.4594 | 0.3791 |  |  |  |

### AMZ: Taco Total

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Taco Total | Taco Total | burrito bowl build | 197399.1 | 1 each | Entree | 11.45 | 1.7184 | 0.04 | 1.7872 | 0.1561 | 1.4673 | 0.1388 | Choice of beans (76908.2, 20064.4) and protein (175362.1,174049.2,85478.1,175489,41742.6,57451.2,76680.1,143119,65814.2) |
| AMZ: Taco Total | Taco Total | burrito build | 197399 | 1 each | Entree | 11.45 | 1.7184 | 0.04 | 1.7872 | 0.1561 |  |  | Choice of beans (76908.2, 20064.4) and protein (175362.1,174049.2,85478.1,175489,41742.6,57451.2,76680.1,143119,65814.2) |
| AMZ: Taco Total | Taco Total | cheese quesadilla | 130576.3 | 1 each | Entree | 9.45 | 0.7308 | 0.04 | 0.7601 | 0.0804 |  |  | Choice of beans (76908.2, 20064.4) and protein (175362.1,174049.2,85478.1,175489,41742.6,57451.2,76680.1,143119,65814.2) |
| AMZ: Taco Total | Taco Total | tacos build | 204354 | 3 each | Entree | 9.45 | 1.4758 | 0.04 | 1.5348 | 0.1624 |  |  | Choice of beans (76908.2, 20064.4) and protein (175362.1,174049.2,85478.1,175489,41742.6,57451.2,76680.1,143119,65814.2) |
| AMZ: Taco Total | Taco Total | cilantro lime rice | 41689.9 | 1/2 cup | Side | 2.55 | 0.3514 | 0.04 | 0.3655 | 0.1433 | 0.3503 | 0.1374 |  |
| AMZ: Taco Total | Taco Total | red rice | 41728.4 | 1/2 cup | Side | 2.55 | 0.3184 | 0.04 | 0.3311 | 0.1299 |  |  |  |
| AMZ: Taco Total | Taco Total | seasoned black beans | 76908.2 | 3 oz portion | Side | 2.55 | 0.5097 | 0.04 | 0.5301 | 0.2079 |  |  |  |
| AMZ: Taco Total | Taco Total | Seasoned Pinto Beans | 20064.4 | 3 ounce | Side | 2.55 | 0.1677 | 0.04 | 0.1744 | 0.0684 |  |  |  |
| AMZ: Taco Total | Taco Total | Shredded Romaine | 81493 | 1/2 ounce | Base |  | 0.1639 | 0.04 | 0.1705 |  | 0.1705 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Cotija Cheese | 226776 | 1 ounce | Topping | 0.75 | 0.4088 | 0.04 | 0.4251 | 0.5668 | 0.3891 | 0.3628 |  |
| AMZ: Taco Total | Taco Total | Diced Jalapeno Pepper | 63107.1 | 1 tbsp | Topping |  | 0.0401 | 0.04 | 0.0417 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Diced Tomatoes | 47955.5 | 1/4 cup | Topping |  | 0.1821 | 0.04 | 0.1894 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Guacamole | 15954.18 | 2 ounce | Topping | 2.25 | 0.5183 | 0.04 | 0.539 | 0.2396 |  |  |  |
| AMZ: Taco Total | Taco Total | Habanero Salsa | 41707.8 | 2 floz | Topping |  | 0.3279 | 0.04 | 0.341 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | pico de gallo | 11315 | 1/4 cup | Topping |  | 0.2603 | 0.04 | 0.2707 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Roasted Corn Salsa | 83080 | 2 ounce | Topping |  | 0.4389 | 0.04 | 0.4565 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | salsa roja | 140820 | 2 floz | Topping |  | 0.7321 | 0.04 | 0.7613 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | salsa verde | 8517.3 | 2 floz | Topping |  | 0.2011 | 0 | 0.2011 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Sour Cream | 1105 | 1 ounce | Topping |  | 0.0928 | 0.04 | 0.0965 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | soyrizo | 143820.11 | 4 oz portion | Topping |  | 0.6849 | 0.04 | 0.7122 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | white queso dip | 155685.3 | 1/2 cup | Topping | 2.25 | 0.6102 | 0.04 | 0.6346 | 0.282 |  |  |  |
| AMZ: Taco Total | Taco Total | al pastor cauliflower | 175362.2 | 1/2 cup | Protein |  | 0.6322 | 0.04 | 0.6575 |  | 1.5156 | 0.3588 | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | al pastor pork | 175362.1 | 1/2 cup | Protein |  | 1.2089 | 0.04 | 1.2572 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | beef barbacoa | 174049.2 | 4 ounce | Protein |  | 1.1058 | 0.04 | 1.1501 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | calabacitas | 85478.1 | 4 ounce | Protein |  | 1.2926 | 0.04 | 1.3443 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Carne Asada | 175489 | 1/2 cup | Protein |  | 4.5397 | 0.04 | 4.7213 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Chicken Tinga | 41742.6 | 1/2 cup | Protein |  | 0.667 | 0.04 | 0.6937 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | chili lime shrimp | 57451.2 | 4 ounce | Protein |  | 1.6397 | 0.04 | 1.7053 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Chips and Guacamole | 142649 | 1 plate | Extension | 3.85 | 1.5895 | 0.04 | 1.653 | 0.4294 |  |  |  |
| AMZ: Taco Total | Taco Total | chips and white queso | 142649.1 | 1 plate | Extension | 3.85 | 1.3704 | 0.04 | 1.4252 | 0.3702 |  |  |  |
| AMZ: Taco Total | Taco Total | Chorizo Sausage | 76680.1 | 4 ounce | Protein |  | 1.0607 | 0.04 | 1.1031 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Churro | 141592 | 2 each | Extension | 3.85 | 0.1294 | 0.04 | 0.1346 | 0.0349 |  |  |  |
| AMZ: Taco Total | Taco Total | cochinita pibil | 145025 | 4 oz meat | Protein |  | 1.2088 | 0.04 | 1.2572 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Pork Adobado | 143119 | 4 ounce | Protein |  | 1.6029 | 0.04 | 1.6671 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | Pork Carnitas | 65814.2 | 4 oz portion | Protein |  | 1.5871 | 0.04 | 1.6506 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Taco Total | Taco Total | tri color tortilla chips and salsa | 135924.1 | 1 plate | Extension | 3.85 | 2.2243 | 0.04 | 2.3133 | 0.6009 |  |  |  |

### AMZ: Tavola Nova

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Tavola Nova | Antipasti | brined zucchini salad | 11242.9 | 1 serving(s) | Antipasti | 2.55 | 0.571 | 0.04 | 0.5939 | 0.2329 | 0.6018 | 0.236 |  |
| AMZ: Tavola Nova | Antipasti | eggplant caponata | 135166.1 | 4 ounce | Antipasti | 2.55 | 0.3409 | 0.04 | 0.3545 | 0.139 |  |  |  |
| AMZ: Tavola Nova | Antipasti | garlic bread | 151092.1 | 1 slice | Antipasti | 2.55 | 0.5475 | 0.04 | 0.5694 | 0.2233 |  |  |  |
| AMZ: Tavola Nova | Antipasti | grilled radicchio salad | 135502.2 | 1 serving(s) | Antipasti | 2.55 | 1.1115 | 0.04 | 1.156 | 0.4533 |  |  |  |
| AMZ: Tavola Nova | Antipasti | little gem caesar | 88289.1 | 1 serving(s) | Antipasti | 2.55 | 0.3224 | 0.04 | 0.3353 | 0.1315 |  |  |  |
| AMZ: Tavola Nova | Dolce | matcha tiramisu | 172631.2 | 1 serving(s) | Extension |  | 2.9151 | 0.04 | 3.0318 |  | 1.7763 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Dolce | tiramisu | 172631.1 | 1 serving(s) | Extension |  | 0.7393 | 0.04 | 0.7688 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Dolce | zeppole with pistachio whipped cream | 38401.9 | 3 each | Extension |  | 1.5004 | 0.04 | 1.5604 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Primi | arugula pesto gnocchi with butternut squash and goat cheese | 88770.1 | 6 oz portion | Primi |  | 1.2078 | 0.04 | 1.2561 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Primi | cheese and fresh pea arancini | 192928 | 3 each | Primi |  | 0.7766 | 0.04 | 0.8077 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Primi | pumpkin sage farroto | 16833.4 | 1 cup | Primi |  | 2.602 | 0 | 2.602 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Primi | white bean mushroom ragu | 192939 | 1 serving(s) | Primi |  | 1.1761 | 0.04 | 1.2231 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Primi | zucchini linguine ragu | 43505.7 | 1 serving(s) | Primi |  | 0.7846 | 0.04 | 0.816 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Secondi | butternut squash lasagna | 192951 | 1 serving(s) | Secondi |  | 1.4304 | 0.04 | 1.4876 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Secondi | chicken al mattone | 192946 | 1 serving(s) | Secondi |  | 1.9489 | 0.04 | 2.0269 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Secondi | chicken mushroom lasagna | 192951.1 | 1 serving(s) | Secondi |  | 2.0866 | 0.04 | 2.1701 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Secondi | porchetta with demi glace | 162512.1 | 1 serving(s) | Secondi |  | 2.4385 | 0.04 | 2.536 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Tavola Nova | Secondi | shrimp fra diavolo with polenta | 192949 | 1 serving(s) | Secondi |  | 2.6972 | 0.04 | 2.8051 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ: Wok

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Wok | Bibimbap - Wok | beef bulgogi bibimbap bowl | 145714.3 | 1 bowl | Entree | 13 | 6.0963 | 0.04 | 6.3401 | 0.4877 | 2.6572 | 0.2191 | 1 Entree |
| AMZ: Wok | Bibimbap - Wok | gochujang chicken bibimbap bowl | 145714.1 | 1 bowl | Entree | 11.75 | 3.8932 | 0.04 | 4.0489 | 0.3446 |  |  | 1 Entree |
| AMZ: Wok | Bibimbap - Wok | gochujang pork bibimbap bowl | 145714.4 | 1 bowl | Entree | 11.75 | 4.25 | 0.04 | 4.42 | 0.3762 |  |  | 1 Entree |
| AMZ: Wok | Bibimbap - Wok | gochujang tofu bibimbap bowl | 145714.2 | 1 bowl | Entree | 11.75 | 3.6858 | 0.04 | 3.8332 | 0.3262 |  |  | 1 Entree |
| AMZ: Wok | Bibimbap - Wok | shrimp bibimbap bowl | 145714.5 | 1 bowl | Entree | 11.75 | 5.6685 | 0.04 | 5.8952 | 0.5017 |  |  | 1 Entree |
| AMZ: Wok | Japanese - Wok | ginger pork shogoyaki | 74517.9 | 5 ounce | Entree | 11.75 | 1.6521 | 0.04 | 1.7182 | 0.1462 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Japanese - Wok | Mapo Tofu | 147699.1 | 5 ounce | Entree | 11.75 | 0.7729 | 0.04 | 0.8038 | 0.0684 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Japanese - Wok | sesame soy chicken | 176725 | 1 each | Entree | 11.75 | 0.9185 | 0.04 | 0.9552 | 0.0813 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Japanese - Wok | Sweet and Sour Pork | 104819.3 | 5 ounce | Entree | 11.75 | 0.841 | 0.04 | 0.8746 | 0.0744 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | beef and broccoli | 165520.3 | 1 cup | Entree | 13 | 1.8413 | 0.04 | 1.915 | 0.1473 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | black pepper chicken | 165520.12 | 1 cup | Entree | 11.75 | 1.4139 | 0.04 | 1.4704 | 0.1251 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | general tsos chicken | 165520.11 | 1 cup | Entree | 11.75 | 1.1208 | 0.04 | 1.1656 | 0.0992 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | orange peel chicken | 165520.2 | 1 cup | Entree | 11.75 | 0.6296 | 0.04 | 0.6548 | 0.0557 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | orange peel tofu | 165520.4 | 1 cup | Entree | 11.75 | 0.6283 | 0.04 | 0.6534 | 0.0556 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | peking beef | 165520 | 1 cup | Entree | 13 | 1.9735 | 0.04 | 2.0524 | 0.1579 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | peking tofu | 165520.2 | 1 cup | Entree | 11.75 | 0.5443 | 0.04 | 0.5661 | 0.0482 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | sesame tofu | 165520.8 | 1 cup | Entree | 11.75 | 0.5933 | 0.04 | 0.617 | 0.0525 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | spicy cashew pork | 165520.6 | 1 cup | Entree | 11.75 | 1.6419 | 0.04 | 1.7075 | 0.1453 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | sweet and sour chicken | 165520.5 | 1 cup | Entree | 11.75 | 0.9744 | 0.04 | 1.0134 | 0.0862 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | Sweet and Sour Tofu | 104819.1 | 8 ounce | Entree | 11.75 | 1.2264 | 0.04 | 1.2755 | 0.1086 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Lotus - Wok | szechuan shrimp with peanuts | 165520.1 | 1 cup | Entree | 13 | 1.2682 | 0.04 | 1.319 | 0.1015 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Teriyaki - Wok | Beef Teriyaki | 83244.2 | 6 ounce | Entree | 13 | 6.3055 | 0.04 | 6.5577 | 0.5044 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Teriyaki - Wok | Chicken Teriyaki | 83244.7 | 6 oz portion | Entree | 11.75 | 1.9969 | 0.04 | 2.0768 | 0.1767 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Teriyaki - Wok | portobello tofu teriyaki | 107142.156 | 6 ounce | Entree | 11.75 | 1.0463 | 0.04 | 1.0881 | 0.0926 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Thai - Wok | green curry chicken bowl | 101666.8 | 1 bowl | Entree | 11.75 | 3.5606 | 0.04 | 3.703 | 0.3151 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | green curry fish bowl | 193556 | 1 bowl | Entree | 13 | 3.7865 | 0.04 | 3.938 | 0.3029 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | green curry pork bowl | 101666.11 | 1 each | Entree | 11.75 | 3.6866 | 0.04 | 3.834 | 0.3263 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | green curry shrimp bowl | 193550 | 1 bowl | Entree | 13 | 3.8223 | 0.04 | 3.9752 | 0.3058 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | green curry tofu bowl | 182206.41 | 1 bowl | Entree | 11.75 | 3.1047 | 0.04 | 3.2288 | 0.2748 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | red curry beef bowl | 193357 | 1 bowl | Entree | 13 | 5.6352 | 0.04 | 5.8606 | 0.4508 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | red curry chicken bowl | 193354 | 1 bowl | Entree | 11.75 | 3.0998 | 0.04 | 3.2237 | 0.2744 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | red curry pork bowl | 193354.1 | 1 each | Entree | 11.75 | 3.4232 | 0.04 | 3.5601 | 0.303 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | red curry tofu bowl | 193356 | 1 bowl | Entree | 11.75 | 2.7992 | 0.04 | 2.9112 | 0.2478 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | yellow curry chicken bowl | 193359 | 1 bowl | Entree | 11.75 | 4.1839 | 0.04 | 4.3513 | 0.3703 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | yellow curry pork bowl | 193359.1 | 1 each | Entree | 11.75 | 4.5073 | 0.04 | 4.6876 | 0.3989 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | yellow curry tofu bowl | 193495 | 1 bowl | Entree | 11.75 | 2.7473 | 0.04 | 2.8572 | 0.2432 |  |  | 1 Entree + Rice |
| AMZ: Wok | Thai - Wok | yellow vegetable curry bowl | 101666.9 | 1 bowl | Entree | 11.75 | 3.3491 | 0.04 | 3.483 | 0.2964 |  |  | 1 Entree + Rice |
| AMZ: Wok | Vietnamese - Wok | chili shrimp | 143278.1 | 4 ounce | Entree | 13 | 1.3093 | 0.04 | 1.3616 | 0.1047 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Vietnamese - Wok | lemongrass pork | 118124.1 | 5 ounce | Entree | 11.75 | 1.9751 | 0.04 | 2.0542 | 0.1748 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Vietnamese - Wok | soy lemongrass shredded beef | 149894.1 | 5 oz portion | Entree | 13 | 1.689 | 0.04 | 1.7566 | 0.1351 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Vietnamese - Wok | Vietnamese Marinated Tofu | 118333 | 5 ounce | Entree | 11.75 | 1.0923 | 0.04 | 1.136 | 0.0967 |  |  | 1 Entree + 2 Sides + Rice |
| AMZ: Wok | Bibimbap - Wok | Egg Fried | 182611 | 1 serving(s) | Extension | 2.55 | 0.2576 | 0.04 | 0.2679 | 0.1051 | 0.6801 | 0.2667 |  |
| AMZ: Wok | Japanese - Wok | chili-marinated zucchini | 86421.14 | 4 ounce | Side | 2.55 | 0.9161 | 0.04 | 0.9527 | 0.3736 |  |  |  |
| AMZ: Wok | Japanese - Wok | cucumber carrot slaw | 155925 | 1/2 cup | Side | 2.55 | 0.3683 | 0.04 | 0.3831 | 0.1502 |  |  |  |
| AMZ: Wok | Japanese - Wok | jasmine rice | 5354.11 | 1 cup | Rice | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  |  |
| AMZ: Wok | Japanese - Wok | miso zucchini corn stir fry | 5360.12 | 1/2 cup | Side | 2.55 | 0.6325 | 0.04 | 0.6578 | 0.2579 |  |  |  |
| AMZ: Wok | Japanese - Wok | spiced sesame edamame | 176736.2 | 4 ounce | Side | 2.55 | 0.9014 | 0.04 | 0.9375 | 0.3676 |  |  |  |
| AMZ: Wok | Japanese - Wok | Vegetable Yakisoba | 146838 | 4 ounce | Side | 2.55 | 0.3984 | 0.04 | 0.4144 | 0.1625 |  |  |  |
| AMZ: Wok | Japanese - Wok | wasabi potato salad | 27313.7 | 1/2 cup | Side | 2.55 | 0.5781 | 0.04 | 0.6012 | 0.2358 |  |  |  |
| AMZ: Wok | Lotus - Wok | blistered green beans | 176734 | 4 ounce | Side | 2.55 | 1.4926 | 0.04 | 1.5523 | 0.6088 |  |  |  |
| AMZ: Wok | Lotus - Wok | brown rice | 16882.7 | 1 cup | Rice | 2.55 | 0.153 | 0.04 | 0.1592 | 0.0624 |  |  |  |
| AMZ: Wok | Lotus - Wok | daikon slaw | 95884.2 | 1/2 cup | Side | 2.55 | 0.763 | 0.04 | 0.7936 | 0.3112 |  |  |  |
| AMZ: Wok | Lotus - Wok | jasmine rice | 5354.11 | 1 cup | Rice | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  |  |
| AMZ: Wok | Lotus - Wok | koji grilled carrots | 176731.1 | 1/2 cup | Side | 2.55 | 0.404 | 0.04 | 0.4202 | 0.1648 |  |  |  |
| AMZ: Wok | Lotus - Wok | sesame roasted carrots | 86471.11 | 1/2 cup | Side | 2.55 | 0.6631 | 0.04 | 0.6896 | 0.2704 |  |  |  |
| AMZ: Wok | Lotus - Wok | vegetable fried rice | 165520.13 | 1 cup | Side | 2.55 | 0.8194 | 0.04 | 0.8522 | 0.3342 |  |  |  |
| AMZ: Wok | Lotus - Wok | vegetable lo mein | 165520.14 | 1 cup | Side | 2.55 | 1.2079 | 0.04 | 1.2562 | 0.4926 |  |  |  |
| AMZ: Wok | Lotus - Wok | Vegetarian Egg Roll | 78386.13 | 1 each | Side | 2.55 | 0.692 | 0.04 | 0.7196 | 0.2822 |  |  |  |
| AMZ: Wok | Lotus - Wok | wok blistered garlic kale | 141183 | 1/2 cup | Side | 2.55 | 0.7111 | 0.04 | 0.7395 | 0.29 |  |  |  |
| AMZ: Wok | Teriyaki - Wok | brown rice | 16882.7 | 1 cup | Rice | 2.55 | 0.153 | 0.04 | 0.1592 | 0.0624 |  |  |  |
| AMZ: Wok | Teriyaki - Wok | Cucumber Salad | 76874 | 4 ounce | Side | 2.55 | 0.9035 | 0.04 | 0.9397 | 0.3685 |  |  |  |
| AMZ: Wok | Teriyaki - Wok | jasmine rice | 5354.11 | 1 cup | Rice | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  |  |
| AMZ: Wok | Teriyaki - Wok | steamed broccoli | 4911.4 | 1/2 cup | Side | 2.55 | 1.0243 | 0.04 | 1.0653 | 0.4178 |  |  |  |
| AMZ: Wok | Teriyaki - Wok | Teriyaki Salad | 83251 | 3 ounce | Side | 2.55 | 0.5591 | 0.04 | 0.5814 | 0.228 |  |  |  |
| AMZ: Wok | Teriyaki - Wok | Yakisoba Noodle Stir Fry | 112463 | 4 ounce | Side | 2.55 | 0.5468 | 0.04 | 0.5686 | 0.223 |  |  |  |
| AMZ: Wok | Thai - Wok | jasmine rice | 5354.11 | 1 cup | Rice | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  |  |
| AMZ: Wok | Thai - Wok | Papaya Salad | 107128.2 | 1/2 cup | Side | 2.55 | 0.584 | 0.04 | 0.6074 | 0.2382 |  |  |  |
| AMZ: Wok | Thai - Wok | thai cucumber salad with peanuts | 10908.2 | 4 ounce | Side | 2.55 | 0.9094 | 0.04 | 0.9457 | 0.3709 |  |  |  |
| AMZ: Wok | Thai - Wok | Thai Rice Noodle Salad with Peanuts | 88266.1 | 1/2 cup | Side | 2.55 | 0.3367 | 0.04 | 0.3501 | 0.1373 |  |  |  |
| AMZ: Wok | Thai - Wok | Thai Sweet & Sour Slaw | 35351.4 | 1/2 cup | Side | 2.55 | 0.2741 | 0.04 | 0.2851 | 0.1118 |  |  |  |
| AMZ: Wok | Vietnamese - Wok | garlic ginger baby bok choy | 107142.31 | 1/2 cup | Side | 2.55 | 1.0927 | 0.04 | 1.1364 | 0.4457 |  |  |  |
| AMZ: Wok | Vietnamese - Wok | Garlic Green Beans | 143768 | 4 ounce | Side | 2.55 | 1.6245 | 0.04 | 1.6894 | 0.6625 |  |  |  |
| AMZ: Wok | Vietnamese - Wok | Garlic Spinach | 86904.1 | 1/2 cup | Side | 2.55 | 1.1862 | 0.04 | 1.2336 | 0.4838 |  |  |  |
| AMZ: Wok | Vietnamese - Wok | jasmine rice | 5354.11 | 1 cup | Rice | 2.55 | 0.3144 | 0.04 | 0.3269 | 0.1282 |  |  |  |
| AMZ: Wok | Vietnamese - Wok | Papaya Salad | 107128.2 | 1/2 cup | Side | 2.55 | 0.584 | 0.04 | 0.6074 | 0.2382 |  |  |  |
| AMZ: Wok | Vietnamese - Wok | Seaweed and Cabbage Slaw | 75761.3 | 1/2 cup | Side | 2.55 | 0.413 | 0.04 | 0.4295 | 0.1684 |  |  |  |
| AMZ: Wok | Vietnamese - Wok | vegetable fried rice | 165520.13 | 1 cup | Side | 2.55 | 0.8194 | 0.04 | 0.8522 | 0.3342 |  |  |  |
| AMZ: Wok | Bibimbap - Wok | Ssamjang Sauce | 142259 | 1 floz | Sub Recipe |  | 0.2763 | 0.04 | 0.2873 |  | 0.3635 |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Bibimbap - Wok | unagi sauce | 86977 | 1 floz | Sub Recipe |  | 0.1468 | 0.04 | 0.1527 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Bibimbap - Wok | yuzu mayo | 147394 | 2 tbsp | Sub Recipe |  | 0.6431 | 0.04 | 0.6689 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Japanese - Wok | green sriracha | 176739 | 1-1/2 floz | Sub Recipe |  | 0.5225 | 0.04 | 0.5434 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Japanese - Wok | ponzu sauce | 88514.1 | 1-1/2 floz | Sub Recipe |  | 0.2038 | 0.04 | 0.212 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Lotus - Wok | Shandong Sauce | 143744 | 1-1/2 ounce | Sub Recipe |  | 0.3731 | 0.04 | 0.388 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Lotus - Wok | Sweet and Sour Sauce | 31693.4 | 1-1/2 floz | Sub Recipe |  | 0.1348 | 0.04 | 0.1402 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Lotus - Wok | szechuan dumpling sauce | 193093 | 1-1/2 oz portion | Sub Recipe |  | 0.6672 | 0.04 | 0.6939 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Teriyaki - Wok | Spicy Teriyaki Sauce | 83240 | 2 floz | Sub Recipe |  | 0.4183 | 0.04 | 0.435 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Teriyaki - Wok | Teriyaki Sauce | 83233 | 2 ounce | Sub Recipe |  | 0.1913 | 0 | 0.1913 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Vietnamese - Wok | green sriracha | 176739 | 1-1/2 floz | Sub Recipe |  | 0.5225 | 0.04 | 0.5434 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Vietnamese - Wok | Vietnamese Vinaigrette | 112805 | 1-1/2 ounce | Sub Recipe |  | 0.1024 | 0.04 | 0.1065 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ: Wok | Bibimbap - Wok | sesame peanut hotteok pancake | 210236 | 1 serving(s) | Extension | 3.85 | 0.3579 | 0.04 | 0.3723 | 0.0967 | 0.6807 | 0.1768 |  |
| AMZ: Wok | Japanese - Wok | black sesame miso cookies | 176618 | 3 each | Extension | 3.85 | 0.8524 | 0 | 0.8524 | 0.2214 |  |  |  |
| AMZ: Wok | Lotus - Wok | vegetable dumpling | 80785.1 | 5 each | Extension | 3.85 | 1.2331 | 0.04 | 1.2825 | 0.3331 |  |  |  |
| AMZ: Wok | Thai - Wok | banana pancake | 176860 | 1 each | Extension | 3.85 | 0.691 | 0.04 | 0.7186 | 0.1867 |  |  |  |
| AMZ: Wok | Thai - Wok | Thai Iced Tea | 176858.1 | 12 floz | Extension | 3.85 | 0.3112 | 0.04 | 0.3236 | 0.0841 |  |  |  |
| AMZ: Wok | Vietnamese - Wok | creamy salted tamarind iced tea | 176858.4 | 12 floz | Extension | 3.85 | 0.5143 | 0.04 | 0.5349 | 0.1389 |  |  |  |

### AMZ: Yakisoba

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ: Yakisoba | Yakisoba | beef yakisoba | 130282.1 | 1 plate | Entree | 13 | 5.2647 | 0.04 | 5.4753 | 0.4212 | 4.3292 | 0.3595 | 1 Entree |
| AMZ: Yakisoba | Yakisoba | chicken yakisoba | 130282.3 | 1 plate | Entree | 11.75 | 2.9846 | 0.04 | 3.1039 | 0.2642 |  |  | 1 Entree |
| AMZ: Yakisoba | Yakisoba | pork yakisoba | 130282.5 | 1 plate | Entree | 11.75 | 3.2977 | 0.04 | 3.4296 | 0.2919 |  |  | 1 Entree |
| AMZ: Yakisoba | Yakisoba | shiitake mushroom yakisoba | 130282.4 | 1 plate | Entree | 11.75 | 6.438 | 0.04 | 6.6955 | 0.5698 |  |  | 1 Entree |
| AMZ: Yakisoba | Yakisoba | tofu yakisoba | 130282.2 | 1 plate | Entree | 11.75 | 2.8288 | 0.04 | 2.9419 | 0.2504 |  |  | 1 Entree |

### AMZ+RA: Barbanzo

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Barbanzo | RA BARBANZO | Pita Bread | 192141 | 1 each | Pita |  | 0.276 |  | 0.276 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Whole Wheat Pita Bread | 62266 | 1 each | Pita |  | 0.179 |  | 0.179 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Crumbled Feta Cheese | 62345 | 1 ounce |  |  | 0.22 |  | 0.22 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Diced English Cucumber | 68562.7 | 1/4 cup |  |  | 0.174 |  | 0.174 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Shredded Iceberg Lettuce | 13404 | 1/4 cup |  |  | 0.019 |  | 0.019 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Kalamata Olives | 228188 | 2 ounce |  |  | 0.661 |  | 0.661 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Sliced Red Onion | 46017.23 | 1/4 cup |  |  | 0.071 |  | 0.071 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Sliced Tomatoes | 57721.2 | 1 slice |  |  | 0.058 |  | 0.058 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Baba Ghanoush | 147414.3 | 1 floz |  |  | 0.165 |  | 0.165 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Beef Shawarma | 147417.8 | 4 ounce |  | 12.95 | 3.92 |  | 3.92 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Cacik (Lebanese Yogurt Sauce) | 147136.14 | 1 floz |  |  | 0.35 |  | 0.35 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Carrot Cumin Sauce | 147136.3 | 1 floz |  |  | 0.106 |  | 0.106 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Celeriac Shawarma | 147417.6 | 4 ounce |  | 10.95 | 1.613 | 0.03 | 1.661 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Chicken Kebab | 147417.3 | 1 each |  | 12.95 | 1.737 | 0.04 | 1.806 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Chicken Shawarma | 147417.7 | 4 ounce |  | 12.95 | 1.923 | 0.035 | 1.99 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Ezme Salatsi (Turkish Red Hot Smoked Tomato Relish) | 147136.8 | 1 floz |  |  | 0.173 |  | 0.173 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Falafel | 147417 | 3 each |  | 10.95 | 0.304 | 0.03 | 0.313 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Fattoush | 147414 | 1/2 cup |  |  | 0.663 |  | 0.663 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Harissa | 147136.1 | 1 floz |  |  | 0.121 |  | 0.121 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Hummus | 147136.19 | 1 floz |  |  | 0.143 |  | 0.143 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Iced Turkish Cardamom Coffee | 147725 | 8 floz |  | 3.95 | 0.22 |  | 0.22 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Israeli Pickle | 147136.18 | 1 each |  |  | 0.238 |  | 0.238 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Israeli Salad | 147414.1 | 1/2 cup |  |  | 0.684 |  | 0.684 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Lamb & Beef Kefta | 147417.1 | 4 ounce |  | 12.95 | 1.793 | 0.03 | 1.847 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Fresh Mint Lemonade | 147725.2 | 8 floz |  | 3.95 | 6.71 |  | 6.71 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Malabi Rose Water Pudding with Pomegranate Syrup & Chopped Pistachios | 148070.2 | 1 each |  | 5.95 | 0.426 |  | 0.426 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Red Pepper & Walnut Spread | 147136.9 | 1 floz |  |  | 0.289 |  | 0.289 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Mujadara | 147414.5 | 1/2 cup | Base |  | 0.106 |  | 0.106 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Pomegranate Iced Tea | 147725.1 | 8 floz |  | 3.95 | 1.12 |  | 1.12 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Portobello Shawarma | 147417.5 | 4 ounce |  | 10.95 | 2.714 | 0.03 | 2.795 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Red Wine Vinaigrette | 147136.12 | 1 floz |  |  | 0.418 |  | 0.418 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Salkha (Green Herb Sauce) | 147136.2 | 1 floz |  |  | 0.256 |  | 0.256 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Salmon Kebab | 147417.4 | 1 each |  | 12.95 | 3.007 | 0.04 | 3.127 |  |  |  |  |
| AMZ+RA: Barbanzo | RA BARBANZO | Schug- Spicy Herb Garlic Pepper Sauce | 147136.10 | 1 floz |  |  | 0.066 |  | 0.066 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Tabbouleh | 147414.4 | 1/2 cup | Base |  | 1.025 |  | 1.025 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Tahini Sauce | 147136.4 | 1 floz |  |  | 0.167 |  | 0.167 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Lebanese Garlic Sauce | 147136.11 | 1 floz |  |  | 0.289 |  | 0.289 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Barbanzo | RA BARBANZO | Pickled Hot Peppers | 134510 | 1 ounce |  |  | 0.213 |  | 0.213 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ+RA: Bowl Inc

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Bowl Inc | BOWL INC | Egg Bowl | 124353 | 1 serving(s) |  | 10.95 | 2.077 |  | 2.077 |  |  |  |  |
| AMZ+RA: Bowl Inc | BOWL INC | Guacamole, Shrimp Bowl | 146780 | 1 serving(s) |  | 10.95 | 2.844 |  | 2.844 |  |  |  |  |
| AMZ+RA: Bowl Inc | BOWL INC | Harvest Bowl, Toasted Almonds | 146781 | 1 serving(s) |  | 10.95 |  |  |  |  |  |  |  |
| AMZ+RA: Bowl Inc | BOWL INC | Hummus Bowl, Chicken Shawarma | 146761 | 1 serving(s) |  | 10.95 |  |  |  |  |  |  |  |
| AMZ+RA: Bowl Inc | BOWL INC | Monsoon Bowl, Vegetable Tikka | 147168 | 1 serving(s) |  | 10.95 | 2.88 |  | 2.88 |  |  |  |  |
| AMZ+RA: Bowl Inc | BOWL INC | Salmon Poke Bowl | 124298 | 1 serving(s) |  | 10.95 | 3.286 |  | 3.286 |  |  |  |  |
| AMZ+RA: Bowl Inc | BOWL INC | Tuna Watermelon Poke Bowl, Quinoa Stir Fry, Sriracha Mayo | 144277 | 10 ounce |  | 10.95 | 3.654 |  | 3.654 |  |  |  |  |
| AMZ+RA: Bowl Inc | BOWL INC | Zen Grain Bowl, Carrot Ginger Puree | 144714.1 | 1 serving(s) |  | 10.95 |  |  |  |  |  |  |  |

### AMZ+RA: Chickle

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Chickle | RA CHICKLE | Alabama White Sauce | 121545 | 1 floz |  |  | 0.156 |  | 0.156 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Buttermilk Avocado Ranch | 121545.1 | 1 floz |  |  | 0.184 |  | 0.184 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Creamy Caviar Tamari Sauce | 121545.2 | 1 floz |  |  | 0.251 |  | 0.251 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Creamy Feta Garlic Dressing | 121545.4 | 1 floz |  |  | 0.191 |  | 0.191 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Fried Chicken | 121523 | 8 ounce |  | 10.25 | 2.197 |  | 2.197 |  |  |  |  |
| AMZ+RA: Chickle | RA CHICKLE | Grain Mustard Remoulade | 121545.6 | 1 floz |  |  | 0.192 |  | 0.192 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Grilled Chicken Thigh | 121532 | 8 ounce |  | 10.25 | 2.322 |  | 2.322 |  |  |  |  |
| AMZ+RA: Chickle | RA CHICKLE | Korean Gochujang Sauce | 121545.5 | 1 floz |  |  | 0.256 |  | 0.256 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Beets | 121533.9 | 1/4 cup |  |  | 0.206 |  | 0.206 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Bell Peppers | 121533.4 | 1/4 cup |  |  | 0.285 |  | 0.285 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Blistered Cherry Tomatoes | 121533.7 | 1/4 cup |  |  | 0.414 |  | 0.414 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Cauliflower | 121533.5 | 1/4 cup |  |  | 0.349 |  | 0.349 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Cabbage, Corn Chow Chow | 121533 | 1/4 cup |  |  | 0.158 |  | 0.158 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Cucumbers | 121533.1 | 1/4 cup |  |  | 0.346 |  | 0.346 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Green Beans & Fennel | 121533.8 | 1/4 cup |  |  | 0.309 |  | 0.309 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Heirloom Carrots | 121533.3 | 1/4 cup |  |  | 0.17 |  | 0.17 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Mushrooms | 121533.10 | 1/4 cup |  |  | 0.34 |  | 0.34 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Radish | 121533.2 | 1/4 cup |  |  | 0.634 |  | 0.634 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Pickled Red Onion | 121533.6 | 1/4 cup |  |  | 0.185 |  | 0.185 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Chickle | RA CHICKLE | Sriracha Maple Syrup | 121545.8 | 1 floz |  |  | 1.224 |  | 1.224 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ+RA: Cutlet

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Cutlet | CUTLET | Blackened Chicken, Italian Chopped Mixed Greens, Provolone, Red Wine Vinaigrette | 185157 | 1 serving(s) |  | 12.95 | 4.048 |  | 4.048 |  |  |  |  |
| AMZ+RA: Cutlet | CUTLET | Blackened Chicken, Romaine, Parmesan, Chipotle Caesar Dressing, Pickled Jalapenos | 185150 | 1 serving(s) |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Cutlet | CUTLET | Fried Chicken Milanese, Arugula, Parmesan, Calabrian Chili Tomato Jam, Balsamic Glaze | 188802 | 1 serving(s) |  | 12.95 | 3.35 |  | 3.35 |  |  |  |  |
| AMZ+RA: Cutlet | CUTLET | Jerk Chicken, Pineapple Mango Slaw, Honey Habanero Hot Sauce | 188493 | 1 serving(s) |  | 12.95 | 2.882 |  | 2.882 |  |  |  |  |
| AMZ+RA: Cutlet | CUTLET | Korean Dak Crispy Chicken, Gochujang, Shishito, Cabbage, Sweet Chili Vinaigrette | 188677 | 1 serving(s) |  | 12.95 | 4.591 |  | 4.591 |  |  |  |  |
| AMZ+RA: Cutlet | CUTLET | Lyonnaise Grilled Chicken, Frisee Salad, Bacon, Poached Egg, Shallot Vinaigrette | 188728 | 1 serving(s) |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Cutlet | CUTLET | Mediterranean Chicken Breast, Dolma Salad, Lemon Oregano Vinaigrette | 188704 | 1 serving(s) |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Cutlet | CUTLET | Grilled Chicken, Romaine, Avocado, Black Bean Pico De Gallo, Cotija, Chipotle Vinaigrette | 189007 | 1 serving(s) |  | 12.95 | 3.681 |  | 3.681 |  |  |  |  |
| AMZ+RA: Cutlet | CUTLET | Southwest Grilled Chicken, Hearts of Romaine, Avocado, Grilled Corn, Tomato, Sundried Cranberries, Buttermilk Dressing | 188814 | 1 serving(s) |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Cutlet | CUTLET | Ssam Marinated Chicken, Peanut Sauce, Mango, Green Bean Salad | 144759.1 | 1 serving(s) |  |  |  |  |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ+RA: Global Grains

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Chicken Quinoa Fajita Bowl, Chipotle Yogurt Sauce | 157275 | 1 serving(s) |  | 11.25 | 3.301 |  | 3.301 |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Cuban Mojo Pork Quinoa Bowl, Cilantro Lime Crema | 156945 | 1 serving(s) |  | 11.25 | 2.223 |  | 2.223 |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Falafel Bowl, Tabbouleh, Tahini Dressing | 157211 | 1 serving(s) |  | 10.25 | 3.763 |  | 3.763 |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Firecracker Tofu, Black Rice Bowl, Firecracker Mayo | 157413 | 1 serving(s) |  | 10.95 | 1.799 |  | 1.799 |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Greek Shrimp Saganaki Bowl. Couscous, Feta, Lemon Vinaigrette | 157032 | 1 serving(s) |  | 12.25 | 4.457 |  | 4.457 |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Italian Tofu, Farro, Pesto Bowl | 157400.1 | 1 serving(s) |  | 10.25 |  |  |  |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Italian Chicekn, Farro, Pesto Bowl | 157400 | 1 serving(s) |  | 11.25 | 4.187 |  | 4.187 |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Bibimbap Bowl, Egg, Gochujang Vinaigrette | 156884 | 1 serving(s) |  | 10.25 | 2.425 |  | 2.425 |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Mediterranean Spiced Chickpea, Barley Bowl, Lemon Yogurt Dressing | 157314 | 1 serving(s) |  | 10.25 |  |  |  |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Nourish Bowl, Brown Rice, Red Pepper Tahini Dressing | 156952 | 1 serving(s) |  | 10.25 | 3.749 |  | 3.749 |  |  |  |  |
| AMZ+RA: Global Grains | RA GLOBAL GRAINS | Sorghum, Chicken Kofta Bowl, Feta, Tahini Dressing | 156906 | 1 serving(s) |  | 11.25 | 5.152 |  | 5.152 |  |  |  |  |

### AMZ+RA: Katora

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Katora | RA KATORA | Vegetable Pakora | 169589 | 2 each |  | 3.95 | 0.859 |  | 0.859 |  |  |  |  |
| AMZ+RA: Katora | RA KATORA | Vegetable Samosa | 169590 | 2 each |  | 3.95 | 0.642 |  | 0.642 |  |  |  |  |
| AMZ+RA: Katora | RA KATORA | Kenyan Tomato Onion Salad | 82609.3 | 1/2 cup |  | 3.95 | 0.682 |  | 0.682 |  |  |  |  |
| AMZ+RA: Katora | RA KATORA | Chicken Tandoori Kathi Roll | 176958 | 1 serving(s) |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Katora | RA KATORA | Katora Paneer Trout Bowl | 176934 | 1 serving(s) |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Katora | RA KATORA | Katora Paneer Veggie Bowl | 176928 | 1 serving(s) |  | 11.95 |  |  |  |  |  |  |  |
| AMZ+RA: Katora | RA KATORA | Samosa Chaat Bowl | 176946 | 1 serving(s) |  | 11.95 |  |  |  |  |  |  |  |
| AMZ+RA: Katora | RA KATORA | Samosa Paneer Kathi Roll | 176969 | 1 serving(s) |  | 11.95 |  |  |  |  |  |  |  |
| AMZ+RA: Katora | RA KATORA | Veg Out Paneer Kathi Roll | 176960 | 1 serving(s) |  | 11.95 |  |  |  |  |  |  |  |

### AMZ+RA: La Chino

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: La Chino | La Chino | Alfajores with Shredded Coconut | 154289 | 1 each |  |  | 0.606 |  | 0.606 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: La Chino | La Chino | Black Sesame Shortbread | 154282 | 1 each |  | 2.95 | 0.253 |  | 0.253 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Bulgogi Street Corn | 154300 | 1 each |  | 6.95 | 0.858 |  | 0.858 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Char Siu Pork Taquitos, Chili Lime Crema, Napa Slaw, Pico De Gallo | 155203 | 1 serving(s) |  | 6.95 | 1.995 |  | 1.995 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Cochinita Pibil Torta | 155077 | 1 sandwich |  | 9.95 | 3.687 |  | 3.687 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Coconut Lemongrass & Thai Basil Mango Beverage | 155165 | 12 floz |  | 2.95 | 1.494 |  | 1.494 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Five Spice Coquito | 154314 | 6 floz |  | 2.95 | 1.031 |  | 1.031 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Five Spice Plantains, Chili Lime Crema | 155154 | 4 piece |  | 6.95 | 0.305 |  | 0.305 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | General Tso Cauliflower Torta | 155075 | 1 sandwich |  | 9.95 | 3.199 |  | 3.199 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Roasted Pepper, Cheese & Tofu Enchilada | 154368 | 2 each |  | 9.95 | 1.806 |  | 1.806 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Kung Pao Chicken Tostada | 154366 | 1 each |  | 9.95 | 2.026 |  | 2.026 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Lychee & Green Melon Beverage | 155117 | 12 floz |  | 2.95 | 0.717 |  | 0.717 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | San Choy Shrimp Lettuce Wraps | 154359 | 3 each |  | 6.95 | 3.254 |  | 3.254 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Scallion Plantain Cake | 154208 | 1 each |  | 6.95 | 0.53 |  | 0.53 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Sesame Caesar Salad | 154342 | 1 each |  | 6.95 | 1.1 |  | 1.1 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Shrimp Ceviche | 154353 | 1 serving(s) |  | 6.95 | 3.185 |  | 3.185 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Sticky Chipotle Chicken Wings | 154578 | 5 each |  |  | 3.804 |  | 3.804 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: La Chino | La Chino | Sticky Rice Pudding with Mango Sauce & Whipped Cream | 154298 | 1 each |  | 2.95 | 0.892 |  | 0.892 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Passionfruit Flan | 154318 | 4 ounce |  | 2.95 | 0.915 |  | 0.915 |  |  |  |  |
| AMZ+RA: La Chino | La Chino | Yuzu Watermelon Agua Fresca | 155133 | 12 floz |  | 2.95 | 1.2 |  | 1.2 |  |  |  |  |

### AMZ+RA: Oregano

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Oregano | Oregano | Chicken Souvlaki | 162899 | 5 oz portion |  | 10.95 | 2.223 | 0.04 | 2.312 |  |  |  |  |
| AMZ+RA: Oregano | Oregano | Garlic Herb Vinaigrette | 134804.1 | 2 floz |  |  | 0.613 |  | 0.613 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Oregano | Oregano | Lamb Meatballs | 173173 | 4-1/2 oz portion |  | 10.95 | 1.256 | 0.04 | 1.306 |  |  |  |  |
| AMZ+RA: Oregano | Oregano | Classic Tzatziki | 134246 | 2 floz |  |  | 0.377 |  | 0.377 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Oregano | Oregano | Creamy Hummus Sauce | 134503 | 2 floz |  |  | 0.289 |  | 0.289 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Oregano | Oregano | Feta Stuffed Roast Tomato | 134202 | 2 each |  | 10.95 | 2.634 | 0.04 | 2.739 |  |  |  |  |
| AMZ+RA: Oregano | Oregano | Green Artemis Sauce | 134501 | 2 floz |  |  | 0.286 |  | 0.286 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Oregano | Oregano | Harissa Aioli | 134508 | 2 floz |  |  | 0.411 |  | 0.411 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Oregano | Oregano | Pork Souvlaki | 134058 | 5 ounce |  | 10.95 | 1.325 | 0.04 | 1.378 |  |  |  |  |
| AMZ+RA: Oregano | Oregano | Rice Pilaf | 134243 | 1 cup |  |  | 0.284 | 0.04 | 0.295 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Oregano | Oregano | Roasted Pepper Yogurt Sauce | 134245 | 2 ounce |  |  | 0.291 |  | 0.291 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Oregano | Oregano | Toasted Tomato Orzo | 134244 | 1 cup |  |  | 0.689 | 0.04 | 0.717 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Oregano | Oregano | Warm Lentils | 134203 | 1 cup |  |  | 0.207 | 0.04 | 0.215 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ+RA: Paninoteca

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Paninoteca | RA PANINTOECA | Focaccia Bread | 177638 | 5 ounce |  |  | 1.039 |  | 1.039 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Ciabatta Hero | 135609 | 1 serving(s) |  |  | 0.514 |  | 0.514 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Ingredient: Roll, Mr. Softy, Hero, the Bread Guy Bakery, 6", 4 Oz | 140126 | 1 serving(s) |  |  | 0.405 |  | 0.405 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | 7 Grain Roll | 147620 | 1 each |  |  | 0.662 |  | 0.662 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Whole Wheat Sandwich Roll | 136380 | 1 each |  |  | 0.398 |  | 0.398 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Semolina Hero | 135605 | 1 serving(s) |  |  | 0.549 |  | 0.549 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Alfonso Olive Tapenade | 145929 | 1 floz |  |  | 0.127 |  | 0.127 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Beef & Ricotta Meatballs | 93661.2 | 2 each |  | 12.95 | 0.813 |  | 0.813 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Beef & Ricotta Meatballs | 93661.2 | 2 each |  | 9.95 | 0.813 |  | 0.813 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Beet Chickpea "Meatballs" | 117495 | 3 oz portion |  | 12.95 | 0.334 |  | 0.334 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Beet Chickpea "Meatballs" | 117495 | 3 oz portion |  | 9.95 | 0.334 |  | 0.334 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Broccoli Rabe, Garlic Chip | 145803 | 1/2 cup |  | 2.25 |  |  |  |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Brown Rice | 16882.9 | 1/2 cup |  |  | 0.069 |  | 0.069 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Caesar Salad | 52262.38 | 1 each |  |  | 0.81 |  | 0.81 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Tomato, Basil, Onion Salad | 145927 | 1/2 cup |  | 2.25 | 1.186 |  | 1.186 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Creamy Polenta, Marscarpone, Basil Oil | 145939 | 4 ounce |  |  | 0.222 |  | 0.222 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Cucumber, Dill, Radish Salad | 145938 | 1/4 cup |  | 2.25 | 0.561 |  | 0.561 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Eggplant Caponata | 135166 | 1/2 cup |  | 2.25 | 0.365 |  | 0.365 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Feta Garlic Lemon Smear | 145928 | 1 floz |  |  | 0.545 |  | 0.545 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Balsamic Marinated Portobello | 145487 | 1/2 cup |  | 2.25 | 1.372 |  | 1.372 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Ground Turkey, Fontina & Roasted Sweet Bell Pepper Meatballs | 139880 | 4 each |  | 12.95 | 1.237 |  | 1.237 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Ground Turkey, Fontina & Roasted Sweet Bell Pepper Meatballs | 139880 | 4 each |  | 9.95 | 1.237 |  | 1.237 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Impossible Meatball | 121718 | 3 oz portion |  | 12.95 | 1.355 |  | 1.355 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Impossible Meatball | 121718 | 3 oz portion |  | 9.95 | 1.355 |  | 1.355 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Kale Almond Pesto | 145887 | 1 floz |  |  | 0.498 |  | 0.498 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Mixed Green Salad | 177800 | 1 cup |  |  | 0.494 |  | 0.494 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Lamb Meatball, Fried Capers | 145912 | 1 each |  | 12.95 | 0.519 |  | 0.519 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Veal, Pork & Beef Meatball with Tomato Sauce | 145932 | 3 piece |  | 9.95 | 2.568 |  | 2.568 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Veal, Pork & Beef Meatball with Tomato Sauce | 145932 | 3 piece |  | 12.95 | 2.568 |  | 2.568 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Veal, Pork & Beef Meatball with Tomato Sauce | 145932 | 3 piece |  | 9.95 | 2.568 |  | 2.568 |  |  |  |  |
| AMZ+RA: Paninoteca | RA PANINTOECA | Veal, Pork & Beef Meatball with Tomato Sauce | 145932 | 3 piece |  |  | 2.568 |  | 2.568 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Roasted Garlic Aioli | 145930 | 1 ounce |  |  | 0.211 |  | 0.211 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Paninoteca | RA PANINTOECA | Spicy Pepper Relish | 145931 | 1 ounce |  |  | 0.391 |  | 0.391 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

### AMZ+RA: Q Bowl

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Q Bowl | Q Bowl | Aztec Bowl | 138788 | 1 serving(s) |  | 8.95 | 3.505 |  | 3.505 |  |  |  |  |
| AMZ+RA: Q Bowl | Q Bowl | Indian Bowl | 138877 | 1 serving(s) |  | 8.95 | 3.716 |  | 3.716 |  |  |  |  |
| AMZ+RA: Q Bowl | Q Bowl | Coconut Curry Bowl | 138793 | 1 serving(s) |  | 8.95 | 3.76 |  | 3.76 |  |  |  |  |
| AMZ+RA: Q Bowl | Q Bowl | Fall/Winter Harvest Bowl | 138820 | 1 serving(s) |  | 8.95 | 2.688 |  | 2.688 |  |  |  |  |
| AMZ+RA: Q Bowl | Q Bowl | Korean Bowl | 138824 | 1 serving(s) |  | 8.95 | 3.171 |  | 3.171 |  |  |  |  |
| AMZ+RA: Q Bowl | Q Bowl | Mahkni Bowl | 138760 | 1 serving(s) |  | 8.95 | 2.494 |  | 2.494 |  |  |  |  |
| AMZ+RA: Q Bowl | Q Bowl | Mediterranean Bowl | 138686 | 1 serving(s) |  | 8.95 | 3.71 |  | 3.71 |  |  |  |  |
| AMZ+RA: Q Bowl | Q Bowl | Moroccan Bowl | 138938 | 1 serving(s) |  | 8.95 | 3.225 |  | 3.225 |  |  |  |  |
| AMZ+RA: Q Bowl | Q Bowl | Spring/Summer Bowl | 138865 | 1 serving(s) |  | 8.95 | 3.019 |  | 3.019 |  |  |  |  |
| AMZ+RA: Q Bowl | Q Bowl | Thai Bowl | 138715 | 1 serving(s) |  | 8.95 |  |  |  |  |  |  |  |

### AMZ+RA: Simmers

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Simmers | RA SIMMERS | Beef Stew | 140644 | 1 serving(s) |  | 10.5 | 3.18 |  | 3.18 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Beef Taco Soup | 139262 | 1 serving(s) |  | 10.5 | 2.867 |  | 2.867 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Chana Masala Cauliflower Soup, Tandoori Chicken | 147581.1 | 1 serving(s) |  | 10.5 | 2.961 |  | 2.961 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Cheese Tortelloni, Mushroom Broth | 142402.1 | 1 serving(s) |  | 10.5 | 4.319 |  | 4.319 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Cheese Tortelloni, Mushroom Broth | 142402 | 1 serving(s) |  | 10.5 | 6.569 |  | 6.569 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Chicken Parmesan "Soup" | 137992 | 1 serving(s) |  | 10.5 | 3.676 |  | 3.676 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Chicken & Dumpling Stew | 142439 | 1 serving(s) |  | 10.5 | 3.341 |  | 3.341 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Chicken & Dumpling Stew | 142439.1 | 1 serving(s) |  | 10.5 | 2.115 |  | 2.115 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Coconut Curry | 144461 | 1 serving(s) |  | 10.5 |  |  |  |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Dumpling Stir Fry | 138164 | 1 serving(s) |  | 10.5 | 8.167 |  | 8.167 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Fiery Veggie Chili, Seared Scallops | 147582.1 | 1 serving(s) |  | 11.5 | 8.222 |  | 8.222 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Chana Masala Cauliflower Soup, Tandoori Chicken | 147581 | 1 serving(s) |  | 10.5 | 1.947 |  | 1.947 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Fiery Veggie Chili, Seared Scallops | 147582 | 1 serving(s) |  | 11.5 | 6.937 |  | 6.937 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Native Three Sisters Soup, Pork Belly | 147564 | 1 serving(s) |  | 10.5 | 2.455 |  | 2.455 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Santa Fe Tortilla Soup, Braised Short Ribs, Avocado Lime Crema | 147579 | 1 serving(s) |  | 10.5 | 3.802 |  | 3.802 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Tomato Basil Soup, Taleggio Grilled Cheese | 147737 | 1 serving(s) |  | 10.5 | 2.616 |  | 2.616 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Lobster Pot Pie | 142344 | 1 serving(s) |  | 12.5 | 7.71 |  | 7.71 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Matzo Ball Soup, Corned Beef | 147039 | 1 serving(s) |  | 10.5 |  |  |  |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Mushroom Stew | 139290 | 1 serving(s) |  |  |  |  |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Simmers | RA SIMMERS | Native Three Sisters Soup, Pork Belly | 147564.1 | 1 serving(s) |  | 10.5 | 3.592 |  | 3.592 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Santa Fe Tortilla Soup, Braised Short Ribs, Avocado Lime Crema | 147579.1 | 1 serving(s) |  | 10.5 | 5.016 |  | 5.016 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Seafood Stew, Bacon | 146998.1 | 1 serving(s) |  | 10.5 | 7.127 |  | 7.127 |  |  |  |  |
| AMZ+RA: Simmers | RA SIMMERS | Tomato Basil Soup, Taleggio Grilled Cheese | 147737.1 | 1 serving(s) |  | 10.5 | 3.24 |  | 3.24 |  |  |  |  |

### AMZ+RA: Smaco

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Smaco | RA SMACO | Baked Tater Tots | 68287 | 1 cup |  | 3.95 | 0.4 |  | 0.4 |  |  |  |  |
| AMZ+RA: Smaco | RA SMACO | Mixed Green Salad | 177800 | 1 cup |  | 3.95 | 0.494 |  | 0.494 |  |  |  |  |
| AMZ+RA: Smaco | RA SMACO | Blackened Chicken Caesar Taco | 186384 | 1 serving(s) |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Smaco | RA SMACO | Chicken Ranch Blt Taco | 186423 | 1 serving(s) |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Smaco | RA SMACO | Classic Beef Smash Taco | 185336 | 1 serving(s) |  | 12.95 | 1.52 |  | 1.52 |  |  |  |  |
| AMZ+RA: Smaco | RA SMACO | Jamaican Jerk Chicken Taco | 185294 | 1 serving(s) |  | 12.95 | 1.666 |  | 1.666 |  |  |  |  |
| AMZ+RA: Smaco | RA SMACO | Korean Bbq Pork Tacos | 185570 | 1 each |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Smaco | RA SMACO | Lamb Gryo Taco, Greek Salad | 185415 | 1 serving(s) |  | 12.95 |  |  |  |  |  |  |  |
| AMZ+RA: Smaco | RA SMACO | Shrimp Toast Taco, Cabbage Salad, Sweet Chili Kewpie | 185418 | 1 serving(s) |  | 12.95 | 1.66 |  | 1.66 |  |  |  |  |
| AMZ+RA: Smaco | RA SMACO | Salmon Burger Taco, Fried Capers, Pickled Onions | 185424 | 1 serving(s) |  | 12.95 | 2.883 |  | 2.883 |  |  |  |  |

### AMZ+RA: Smoothies

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Smoothies | Smoothies | Almond Bliss Smoothie, Coconut, Cacao | 112207 | 12 floz |  | 6 | 1.662 | 0.04 | 1.728 |  |  |  |  |
| AMZ+RA: Smoothies | Smoothies | Almond Butter & Banana Smoothie | 108672 | 12 floz |  | 6 | 0.865 | 0.04 | 0.9 |  |  |  |  |
| AMZ+RA: Smoothies | Smoothies | Berry Chia Seed Smoothie | 107923 | 12 floz |  | 6 | 1.542 | 0.04 | 1.604 |  |  |  |  |
| AMZ+RA: Smoothies | Smoothies | Brain Power Smoothie | 107924.1 | 12 floz |  | 6 | 1.683 | 0.04 | 1.75 |  |  |  |  |
| AMZ+RA: Smoothies | Smoothies | Blueberry Spinach Smoothie | 107924 | 12 floz |  | 6 | 1.689 | 0.04 | 1.757 |  |  |  |  |
| AMZ+RA: Smoothies | Smoothies | Tropical Green Smoothie | 107922 | 12 floz |  | 6 | 2.185 | 0.04 | 2.272 |  |  |  |  |
| AMZ+RA: Smoothies | Smoothies | Coffee Cinnamon Smoothie | 112227 | 12 floz |  | 6 | 1.64 | 0.04 | 1.706 |  |  |  |  |
| AMZ+RA: Smoothies | Smoothies | Matcha Almond Milk Smoothie | 108673 | 12 floz |  | 6 | 0.603 | 0.04 | 0.627 |  |  |  |  |
| AMZ+RA: Smoothies | Smoothies | Stress Down Smoothie, Almond Milk, Tropical Fruits | 112206 | 12 floz |  | 6 | 1.771 | 0.04 | 1.842 |  |  |  |  |
| AMZ+RA: Smoothies | Smoothies | Turmeric Mango Smoothie | 109327 | 12 floz |  | 6 | 1.623 | 0.04 | 1.688 |  |  |  |  |

### AMZ+RA: Sushi

| Menu Name | Station | Item | MRN | Portion | Component Type | Sell Price | Item Cost | Waste % | Item + Waste Cost | Food Cost % | Average Cost | Average Cost + Waste | Plate Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AMZ+RA: Sushi | Sushi | Eel Avocado Dragon Roll | 142701 | 1 each |  |  | 4.052 | 0.04 | 4.214 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Hamachi Nigiri | 143225 | 1 each |  |  | 0.516 | 0.04 | 0.537 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Salmon Nigiri | 143222 | 1 piece |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Shrimp Nigiri | 143228 | 1 each |  |  | 0.625 | 0.04 | 0.65 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | California Roll | 69747 | 1 each |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Crazy Roll, Spicy Tuna, Salmon | 127823.9 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Cucumber Avocado Roll | 136205 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Eel Avocado Roll | 69749.15 | 6 piece |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Kiss of Fire Roll | 127823.45 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Salmon Avocado Roll | 69749.1 | 1 each |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Salmon Roll | 69749.7 | 1 each |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Salmon, Mango Roll | 69749.21 | 1 each |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Scorpion Roll, Eel, Shrimp | 127823.1 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Shrimp Tempura Roll | 127823.16 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Soft Shell Crab Roll | 127823.18 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Spicy Tuna Roll | 127823.29 | 6 piece |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Titanic Roll | 127823.44 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Tokyo Roll | 127823.47 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Tuna Avocado Roll | 69749.2 | 1 each |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Tuna Avocado Roll, Sesame | 69749.33 | 1 each |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Tuna Cucumber Roll | 69749.4 | 1 each |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Volcano Roll, Yellowtail, Crab | 127823.14 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Washington Roll | 127823.48 | 1 serving(s) |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Tamago, Avocado Roll | 69749.26 | 1 each |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Tuna Nigiri | 143221 | 1 each |  |  | 0.404 | 0.04 | 0.42 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Eel Nigiri | 143229 | 1 each |  |  | 0.715 | 0.04 | 0.744 |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |
| AMZ+RA: Sushi | Sushi | Yellowtail Cucumber Roll, Sesame Seeds | 69749.27 | 1 each |  |  |  | 0.04 |  |  |  |  | NOT FOR INDIVIDUAL SALE - PLATE_BUILD COMPONENT ONLY |

## Conversion validation

- Source workbook item rows: 1566
- Menu concepts: 53
- Non-RA concepts: 39
- Intentionally unclassified RA concepts: 14
