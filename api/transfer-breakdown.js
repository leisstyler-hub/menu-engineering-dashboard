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
  if (!recipe || (!recipe.components?.length && !recipe.unpricedComponents?.length)) return res.status(404).json({ ok: false, message: "No ingredient mapping is available for this menu item." });
  const components = recipe.components.map((component) => ({ ...component, allocationPerPortion: Number(component.allocationPerPortion) }));
  const unpricedComponents = (recipe.unpricedComponents || []).map((component) => ({ ...component, allocationPerPortion: null }));
  return res.status(200).json({
    ok: true,
    recipeMrn,
    recipeName: recipe.recipeName,
    resource: LOOKUP.resource,
    components,
    unpricedComponents,
    pricingComplete: unpricedComponents.length === 0 && components.length > 0,
    allocationPerPortion: Number(components.reduce((sum, component) => sum + component.allocationPerPortion, 0).toFixed(4)),
  });
}
