import React, { useState, useEffect, useRef } from 'react';
import { recipeGuidance, recipeTree } from './privateRecipeModel.js';

export function PrivateRecipeAccess({ onLoad, onLock }) {
  const expiry = useRef(null);
  useEffect(()=>()=>clearTimeout(expiry.current),[]);
  const lock=()=>{clearTimeout(expiry.current);onLock();setUnlocked(false);setMessage('Private recipes locked.');};
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const [unlocked,setUnlocked] = useState(false);
  const unlock = async event => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const auth = await fetch('/api/private-recipes', {method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const session = await auth.json();
      if (!auth.ok || !session.accessToken) throw new Error(session.message || 'Private sign-in failed.');
      const response = await fetch('/api/private-recipes',{cache:'no-store',headers:{Authorization:`Bearer ${session.accessToken}`}});
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || 'Private recipes unavailable.');
      onLoad(payload); clearTimeout(expiry.current); expiry.current=setTimeout(lock,Math.min(900,Number(session.expiresIn)||900)*1000); setUnlocked(true); setMessage('Private Andes recipes unlocked for this view.');
    } catch(error) { onLock(); setUnlocked(false); setMessage(error.message); }
    finally { setPassword(''); setBusy(false); }
  };
  return <details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold">Private Andes recipes</summary><p className="my-2 text-sm text-slate-600">Recipe access requires approved private sign-in. Recipes stay separate from Menu Library and exports.</p>{unlocked ? <button className="rounded-lg border p-2" onClick={lock}>Lock recipes</button> : <form onSubmit={unlock} className="flex flex-wrap gap-2"><input className="min-w-0 rounded-lg border p-2" type="email" required autoComplete="username" aria-label="Private recipe email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input className="min-w-0 rounded-lg border p-2" type="password" required autoComplete="current-password" aria-label="Private recipe password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button className="rounded-lg border p-2 font-semibold" disabled={busy}>{busy?'Signing in…':'Sign in to recipes'}</button></form>}{message&&<p role="status" className="mt-2 text-sm">{message}</p>}</details>;
}

export function PrivateRecipePanel({ itemKey, data, pricePerLb }) {
  const link = data?.links?.find(value=>value.menu_item_identity===itemKey && value.approved_at);
  if (!link) return <details className="mt-3 border-t pt-2 text-sm"><summary className="cursor-pointer font-semibold">Recipe &amp; components</summary><p className="mt-2 text-slate-500">{data?'No approved recipe association for this item.':'Sign in to private Andes recipes to view approved components.'}</p></details>;
  return <details className="mt-3 border-t pt-2 text-sm"><summary className="cursor-pointer font-semibold">Recipe &amp; components</summary><RecipeNode node={recipeTree(link.recipe_variant_id,data.variants,data.components)} pricePerLb={pricePerLb}/></details>;
}
function RecipeNode({node,pricePerLb}) {
  if(node.issue) return <p className="my-2 text-amber-800">{node.issue}</p>;
  const recipe=node.recipe;
  const guidance=recipeGuidance(recipe,pricePerLb);
  return <div className="my-2 rounded-lg border border-slate-200 p-3"><strong>{recipe.recipe_name}</strong><p className="mt-1 text-xs text-slate-600">MRN {recipe.mrn} · Serving {recipe.serving_size_text||'Needs size'} · Serving cost {recipe.serving_cost==null?'Needs cost':`$${Number(recipe.serving_cost).toFixed(4)}`} · Component guidance: {guidance.status}</p><p className="mt-2">Serving pan: <span aria-label={`Serving pan for ${recipe.recipe_name}`} className="inline-block min-w-24 border-b">{recipe.serving_pan||'\u00a0'}</span></p>{guidance.reasons.length>0&&<p className="mt-1 text-xs">{guidance.reasons.join(' · ')}</p>}{recipe.private_source_payload?.method&&<p className="mt-2 whitespace-pre-wrap">{recipe.private_source_payload.method}</p>}{recipe.private_source_payload?.pages?.length>0&&<details className="mt-2"><summary className="cursor-pointer">Full recipe source · ingredients and method</summary>{recipe.private_source_payload.pages.map(page=><div key={page.page} className="mt-2"><strong>Source page {page.page}</strong><pre className="mt-1 whitespace-pre-wrap break-words font-sans text-xs">{page.text}</pre></div>)}</details>}{node.components.map((component,index)=><details key={component.id||index} className="mt-2 border-l-2 pl-3"><summary className="cursor-pointer">{component.component_name} · {component.source_quantity_text||'Usage needs review'}</summary><RecipeNode node={component.recipe} pricePerLb={pricePerLb}/></details>)}<p className="mt-2 text-xs text-slate-500">Component results do not change the parent dish or menu score.</p></div>;
}
