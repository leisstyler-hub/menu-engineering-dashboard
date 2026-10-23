import React, { useMemo, useState } from 'react';
import { CATEGORIES, TIERS } from './panReadyModel.js';
import { buildPortfolio } from './wpPortfolioModel.js';
import { Donut } from './WeighPayCharts.jsx';

const pct = n => n == null ? 'Needs information' : `${(n*100).toFixed(1)}%`;
const money = n => n == null ? 'Unavailable' : `$${n.toFixed(2)}`;
const control = 'min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
export default function PanReadyAnalysis({ projections, selectedMenu, rate }) {
  const [category,setCategory]=useState('All'),[search,setSearch]=useState(''),[selectedKey,setSelectedKey]=useState('');
  const [across,setAcross]=useState(false);
  const pool=useMemo(()=>projections.filter(p=>across||!selectedMenu||p.menu===selectedMenu),[projections,selectedMenu,across]);
  const rows=buildPortfolio(pool);
  const visible=rows.filter(r=>(category==='All'||r.category===category)&&`${r.name} ${r.mrn}`.toLowerCase().includes(search.toLowerCase()));
  const key=r=>r.key;
  const selected=rows.find(r=>key(r)===selectedKey);
  const review=pool.flatMap(p=>p.review.filter(r=>r.classificationReason!=='Supporting prep only').map(r=>({...r,menu:p.menu})));
  const counts=CATEGORIES.map(label=>({label,value:visible.filter(r=>r.category===label).length}));
  return <section aria-label="Pan-ready W&P assortment" className="space-y-4 rounded-2xl border border-teal-200 bg-slate-50 p-4">
    <div><h2 className="text-xl font-bold">Pan-ready assortment</h2><p className="mt-1 text-sm text-slate-600">{selectedMenu&&!across?selectedMenu:'All menus'} · ${(rate/16).toFixed(2)}/oz · FC% by documented portion cost and weight</p></div>
    <div className="flex flex-wrap gap-2"><select aria-label="Filter service category" className={control} value={category} onChange={e=>setCategory(e.target.value)}><option>All</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select><input aria-label="Search servable foods" placeholder="Find food or MRN" className={`${control} flex-1`} value={search} onChange={e=>setSearch(e.target.value)}/>{selectedMenu&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={across} onChange={e=>setAcross(e.target.checked)}/>Compare across menus</label>}</div>
    <Donut label="Servable components by category" segments={counts}/>
    <p className="text-xs text-slate-600">{visible.length} serving choices in this selection. Counts preserve menu memberships and distinct source variants; supporting prep is not counted. Classification is source-linked guidance, not final Culinary approval.</p>
    {selectedMenu&&<div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <aside aria-label="Selected food" className="min-w-0 rounded-xl border bg-white p-3"><h3 className="mb-3 font-bold">Selected food</h3>{selected?<FoodCard recipe={selected}/>:<p className="text-sm text-slate-500">Select a food to keep it beside the ranking.</p>}</aside>
      <div aria-label="Food cost ranking" className="min-w-0 space-y-4">{TIERS.map(tier=><section key={tier}><h3 className="mb-2 font-bold">{tier} <span className="font-normal text-slate-500">({visible.filter(r=>r.tier===tier).length})</span></h3><div className="grid gap-2 xl:grid-cols-2">{visible.filter(r=>r.tier===tier).sort((a,b)=>(a.foodCost??Infinity)-(b.foodCost??Infinity)||a.name.localeCompare(b.name)).map(r=><div key={key(r)} className="min-w-0"><FoodCard recipe={r} onSelect={()=>setSelectedKey(key(r))} isSelected={key(r)===selectedKey}/></div>)}</div></section>)}</div>
    </div>}
    {!!selectedMenu&&!!review.length&&<details className="rounded-xl border border-amber-200 bg-amber-50 p-3"><summary className="cursor-pointer font-semibold">Classification review ({review.length})</summary><ul className="mt-2 space-y-2 text-sm">{review.map((r,i)=><li key={`${r.menu}:${r.id}:${i}`}>{r.menu} · {r.name} · MRN {r.mrn} — {r.classificationReason}</li>)}</ul></details>}
  </section>;
}
function FoodCard({recipe:r,depth=0,onSelect,isSelected=false}) {
  const [open,setOpen]=useState(false);
  if(r.issue)return <p className="text-xs text-amber-800">{r.issue}</p>;
  return <article data-testid={depth?'supporting-component':'servable-food'} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-sm"><h4 className="break-words font-bold">{onSelect?<button aria-label={`Compare ${r.name}`} aria-pressed={isSelected} className="text-left underline decoration-slate-300 underline-offset-4" onClick={onSelect}>{r.name} - FC {pct(r.foodCost)}</button>:<>{r.name} - FC {pct(r.foodCost)}</>}</h4><p className="mt-1 text-xs text-slate-500">{r.menu} {r.category&&`· ${r.category}`} · MRN {r.mrn} · {r.portion}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1"><span>Cost {money(r.cost)}</span><span>Weight {r.massOz?`${Number(r.massOz.toFixed(3))} oz`:'Not documented'}</span><span>Cost/lb {money(r.massOz&&r.cost!=null?r.cost/r.massOz*16:null)}</span></div><p className="mt-2 text-xs text-slate-500">{r.costBasis||'Recipe snapshot'} · Weight: {r.weightSource}</p>{r.serviceReasons?.length>0&&<p className="mt-2 text-xs text-amber-900">Service restrictions / review: {r.serviceReasons.join(' · ')}</p>}{r.linkStatus&&<p className="mt-2 text-xs text-amber-900">{r.linkStatus}</p>}{depth<8&&r.components?.length>0&&<details className="mt-3 border-t pt-2" onToggle={e=>setOpen(e.currentTarget.open)}><summary className="cursor-pointer font-semibold text-teal-800">Supporting components ({r.components.length})</summary><p className="my-2 text-xs text-slate-500">Included in the parent total; do not add again.</p><div className="space-y-2">{open&&r.components.map((edge,i)=><div key={i}><p className="mb-1 text-xs">{edge.name} · Contribution {money(edge.contribution)}</p><FoodCard recipe={edge.analysis} depth={depth+1}/></div>)}</div></details>}</article>;
}
