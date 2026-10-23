import React, { useMemo, useState } from 'react';
import { buildPortfolio } from './wpPortfolioModel.js';

export default function WpMenuPicker({projections, selectedMenus, onChange, trusted}) {
  const [search, setSearch] = useState('');
  const options = useMemo(() => projections.map(p => {
    const foods = buildPortfolio([p]);
    const passing = trusted ? foods.filter(r => r.portfolioStatus === 'Within 40%').length : 0;
    return {name:p.menu, total:foods.length, passing};
  }).sort((a,b) => a.name.localeCompare(b.name)), [projections, trusted]);
  const toggle = name => onChange(selectedMenus.includes(name) ? selectedMenus.filter(n => n !== name) : [...selectedMenus, name]);
  return <fieldset aria-label="Menu selection" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
    <legend className="px-1 text-sm font-bold text-teal-950">Explore menus</legend>
    <div className="flex flex-wrap items-center gap-3">
      <details className="min-w-0 w-full sm:max-w-xl">
        <summary className="cursor-pointer rounded-xl border border-teal-300 bg-teal-50 px-4 py-3 font-semibold text-teal-950">Choose menus | {selectedMenus.length ? `${selectedMenus.length} selected` : 'All eligible menus'}</summary>
        <div className="mt-2 space-y-3 rounded-xl border p-3">
          <label className="block text-sm font-semibold">Search menus<input value={search} onChange={e => setSearch(e.target.value)} className="mt-1 w-full rounded-lg border p-2 font-normal" placeholder="Find a menu"/></label>
          <p className="text-xs text-slate-500">Qualifying unique foods / all unique servable foods in each menu. Missing and review foods remain in the denominator.</p>
          <div className="max-h-64 overflow-y-auto">{options.filter(o => o.name.toLowerCase().includes(search.toLowerCase())).map(o => <label key={o.name} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"><input type="checkbox" checked={selectedMenus.includes(o.name)} onChange={() => toggle(o.name)}/><span className="min-w-0 flex-1 break-words text-sm">{o.name}</span><span className="shrink-0 text-xs text-slate-600">{trusted ? `${o.passing}/${o.total} | ${o.total ? (o.passing/o.total*100).toFixed(1) : 0}%` : 'Reference only'}</span></label>)}{!options.some(o => o.name.toLowerCase().includes(search.toLowerCase())) && <p className="p-2 text-sm">No matching menus. Your selection is retained.</p>}</div>
        </div>
      </details>
      <button type="button" className="rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => {onChange([]);setSearch('');}} aria-label="Clear menu selection">All menus / Clear</button>
    </div>
    <div aria-label="Selected menus" className="mt-3 flex flex-wrap gap-2">{selectedMenus.length ? selectedMenus.map(name => <button key={name} type="button" aria-label={`Remove ${name}`} onClick={() => toggle(name)} className="max-w-full break-words rounded-full bg-teal-100 px-3 py-1 text-left text-sm text-teal-950">{name} <span aria-hidden="true">&times;</span></button>) : <span className="text-sm text-slate-600">All eligible menus | shared foods counted once</span>}</div>
  </fieldset>;
}
