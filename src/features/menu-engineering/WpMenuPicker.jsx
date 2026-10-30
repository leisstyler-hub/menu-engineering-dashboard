import React, { useMemo, useState } from 'react';
import { buildPortfolio } from './wpPortfolioModel.js';
import {PILLARS,pillarMenus} from './wpSmartModel.js';

export default function WpMenuPicker({projections, selectedMenus, onChange, trusted}) {
  const [search, setSearch] = useState('');
  const options = useMemo(() => projections.map(p => {
    const foods = buildPortfolio([p]);
    const passing = trusted ? foods.filter(r => r.portfolioStatus === 'Within 40%').length : 0;
    return {name:p.menu, total:foods.length, passing};
  }).sort((a,b) => a.name.localeCompare(b.name)), [projections, trusted]);
  const toggle = name => onChange(selectedMenus.includes(name) ? selectedMenus.filter(n => n !== name) : [...selectedMenus, name]);
  const visible = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  return <fieldset aria-label="Menu selection" className="min-w-0 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50/60 p-4 md:p-5">
    <legend className="px-2 text-sm font-bold text-teal-950">Explore menus</legend>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><h3 className="text-lg font-bold tracking-tight text-slate-950">Find your W&amp;P spread</h3><p className="mt-1 text-sm text-slate-500">{selectedMenus.length ? `${selectedMenus.length} menus selected` : 'All menus'} / {options.length} available</p></div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto"><label className="min-w-0 flex-1 sm:w-64"><span className="sr-only">Search menus</span><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Search menus"/></label><button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold shadow-sm hover:bg-teal-50" onClick={()=>{onChange([]);setSearch('');}} aria-label="Clear filters">Clear filters</button></div>
    </div>
    <div aria-label="Select menus by pillar" className="mb-4 flex flex-wrap gap-2">{PILLARS.map(pillar=>{
      const names=pillarMenus(pillar,options.map(o=>o.name));
      const active=names.length>0&&names.every(n=>selectedMenus.includes(n));
      return <button type="button" key={pillar} disabled={!names.length} aria-pressed={active} onClick={()=>onChange(active?selectedMenus.filter(n=>!names.includes(n)):[...new Set([...selectedMenus,...names])])} className={`rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${active?'bg-teal-900 text-white':'bg-white text-teal-950'}`}>{pillar} ({names.length})</button>;
    })}</div>
    <p className="mb-3 text-xs text-slate-500">Pillars select their mapped menu tiles; adjust tiles individually. Unmapped menus remain available below.</p>
    <div data-testid="menu-tile-grid" className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">{visible.map(o=>{
      const selected=selectedMenus.includes(o.name);
      return <label data-testid="menu-tile" key={o.name} className={`relative flex min-h-24 min-w-0 cursor-pointer flex-col justify-between rounded-2xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2 ${selected?'border-teal-800 bg-teal-900 text-white shadow-md':'border-slate-200 bg-white text-slate-800 shadow-sm hover:border-teal-400 hover:bg-teal-50'}`}>
        <input type="checkbox" aria-label={o.name} checked={selected} onChange={()=>toggle(o.name)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/>
        <span className="flex items-start justify-between gap-2"><span className="min-w-0 break-words text-sm font-semibold leading-snug">{o.name}</span><span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs ${selected?'border-teal-200 bg-teal-200 text-teal-950':'border-slate-300 text-transparent'}`}>&#10003;</span></span>
        <span className={`mt-3 text-xs ${selected?'text-teal-100':'text-slate-500'}`}>{trusted ? <><strong className={`text-base ${selected?'text-white':'text-teal-800'}`}>{o.total?(o.passing/o.total*100).toFixed(1):'0.0'}%</strong><span className="ml-1">qualifying</span><span className="mt-0.5 block">{o.passing} / {o.total} foods</span></> : 'Reference only'}</span>
      </label>;
    })}</div>
    {!visible.length&&<p className="rounded-xl bg-white p-4 text-sm text-slate-600">No matching menus. Your selection is retained.</p>}
    <div aria-label="Selected menus" className="mt-4 flex flex-wrap gap-2">{selectedMenus.length?selectedMenus.map(name=><button key={name} type="button" aria-label={`Remove ${name}`} onClick={()=>toggle(name)} className="max-w-full break-words rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-left text-xs font-semibold text-teal-900">{name} <span aria-hidden="true">&times;</span></button>):<span className="text-xs text-slate-500">Choose any combination. Shared foods appear once.</span>}</div>
    <p className="mt-3 text-xs text-slate-500">Qualifying / all unique servable foods per menu; review and missing information remain in the denominator.</p>
  </fieldset>;
}
