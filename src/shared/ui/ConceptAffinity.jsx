import React,{useEffect,useMemo,useState} from 'react';
import {canonicalConceptName} from '../conceptPillars.js';
import {isRaConcept} from '../raConcepts.js';
import {affinityPartners,affinitySummary} from '../conceptAffinity.js';
const pct=n=>n==null?'Unknown':`${(n*100).toFixed(1)}%`;
export default function ConceptAffinity({data,availableMenus,selectedMenus=[],onSelect,includeRa=false}) {
 const [remote,setRemote]=useState(null),[message,setMessage]=useState(''),[anchor,setAnchor]=useState('');
 useEffect(()=>{
  if(data)return;
  const controller=new AbortController();
  fetch('/api/recipe-pairwise',{signal:controller.signal,cache:'no-store'}).then(async r=>{
   const p=await r.json();if(!r.ok||!p.ok||p.data?.source!=='recipe-ingredient-presence'||!Array.isArray(p.data.menus))throw Error('Ingredient fit is unavailable; existing menu selection is unchanged.');setRemote(p.data);
  }).catch(e=>{if(e.name!=='AbortError')setMessage(e.message);});
  return()=>controller.abort();
 },[data]);
 const cohort=useMemo(()=>{const source=data||remote;return source?{...source,menus:source.menus.filter(m=>includeRa||!isRaConcept(m.name))}:null;},[data,remote,includeRa]);
 const names=availableMenus||(cohort?.menus||[]).map(m=>m.name),validAnchor=names.includes(anchor)?anchor:names[0]||'';
 const partners=affinityPartners(cohort,validAnchor,names),summary=affinitySummary(cohort,selectedMenus);
 const displayName=name=>names.find(n=>canonicalConceptName(n)===canonicalConceptName(name));
 return <details aria-label="Ingredient-fit planning groups" className="rounded-xl border border-teal-200 bg-white p-4">
  <summary className="cursor-pointer text-sm font-bold text-teal-950">Ingredient-fit planning groups</summary>
  <p className="mt-2 text-xs text-slate-600">Cuisine pillars retain their identity. Compare an anchor's exact ingredient overlap; group size is not a balance score. Mediterranean has two default menus plus Barbanzo and Oregano when RA is included.</p>
  <p className="mt-1 break-words text-xs text-slate-500">{cohort?.source||message||'Loading current recipe cohort…'} | Version {cohort?.releaseVersion||cohort?.schemaVersion||'Unavailable'} | {includeRa?'RA included':'RA excluded'}</p>
  <label className="mt-3 block text-xs font-bold">Anchor menu<select aria-label="Ingredient-fit anchor" className="mt-1 w-full rounded-lg border p-2 text-sm" value={validAnchor} onChange={e=>setAnchor(e.target.value)}>{names.map(n=><option key={n}>{n}</option>)}</select></label>
  <div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-left text-xs"><thead><tr><th>Partner</th><th>Shared / union</th><th>Overlap</th>{onSelect&&<th>Plan</th>}</tr></thead><tbody>{partners.slice(0,10).map(p=><tr key={p.name} className="border-t"><td className="p-2">{p.name}<span className="block text-slate-500">{p.pillar}</span></td><td>{p.shared} / {p.union}</td><td>{pct(p.score)}</td>{onSelect&&<td><button type="button" aria-label={`Add ingredient-fit partner ${p.name}`} className="rounded border px-2 py-1" onClick={()=>onSelect([...new Set([...selectedMenus,validAnchor,displayName(p.name)].filter(Boolean))])}>Add</button></td>}</tr>)}</tbody></table></div>
  {!partners.length&&<p className="mt-2 text-xs text-amber-900">No scored partners in this cohort. Missing coverage is unknown, not zero overlap.</p>}
  {onSelect&&<p className="mt-2 text-xs">Selection coverage {summary.covered}/{summary.requested}; {summary.pairs} pairs; mean {pct(summary.mean)}; minimum {pct(summary.minimum)}; maximum {pct(summary.maximum)}.</p>}
  <p className="mt-2 text-xs text-slate-500">Jaccard = shared / union ingredient identities. A high score does not establish culinary fit, labor savings or service approval.</p>
 </details>;
}
