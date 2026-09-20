import LOOKUP from "./data/ingredientCosting91926.json" with { type: "json" };

const cleanMrn = (value) => String(value ?? "").trim().replace(/^'/, "");
const text = (value) => String(value ?? "").trim();

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }
  const recipeMrn = cleanMrn(req.query?.mrn);
  if (!recipeMrn) return res.status(400).json({ ok: false, message: "A menu-item MRN is required." });
  const recipe = LOOKUP.recipes[recipeMrn];
  if (!recipe?.components?.length) return res.status(404).json({ ok: false, message: "No priced ingredient breakdown is available for this menu item." });
  const components = recipe.components.map((component) => ({ ...component, allocationPerPortion: Number(component.allocationPerPortion) }));
  return res.status(200).json({
    ok: true,
    recipeMrn,
    recipeName: recipe.recipeName,
    resource: LOOKUP.resource,
    components,
    allocationPerPortion: Number(components.reduce((sum, component) => sum + component.allocationPerPortion, 0).toFixed(4)),
  });
}
