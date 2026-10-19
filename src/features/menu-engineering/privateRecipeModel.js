import { evaluateItem } from './weighPayModel.js';

export function recipeGuidance(recipe, pricePerLb) {
  const result = evaluateItem({ item: recipe.recipe_name, mrn: recipe.mrn, trueCost: recipe.serving_cost, portionOz: recipe.serving_mass_oz, portion: recipe.serving_size_text, category: recipe.category || '' }, null, { pricePerLb });
  if (recipe.reconciliation_status !== 'validated' || !String(recipe.category || '').trim()) return { ...result, status:'Review', reviews:[...result.reviews, 'Recipe serving basis and service category require validation'] };
  return result;
}

// Version IDs, never MRN/name alone, resolve variants. Usage amounts remain on edges.
export function recipeTree(id, variants, edges, seen = [], depth = 0) {
  if (seen.includes(id)) return { issue:'Cycle requires review' };
  if (depth >= 8) return { issue:'Depth limit requires review' };
  const recipe = variants.find(value => value.id === id);
  if (!recipe) return { issue:'Recipe unavailable' };
  const components = edges.filter(edge => edge.parent_variant_id === id).sort((a,b) => a.position-b.position).map(edge => ({ ...edge, recipe:edge.child_variant_id ? recipeTree(edge.child_variant_id, variants, edges, [...seen,id], depth+1) : { issue:'No validated component recipe link' } }));
  return { recipe, components };
}
