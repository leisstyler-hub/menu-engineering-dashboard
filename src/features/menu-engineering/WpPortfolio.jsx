import React,{useMemo,useState} from 'react';
import {CATEGORIES} from './panReadyModel.js';
import {buildPortfolio} from './wpPortfolioModel.js';
import WpStationBuild from './WpStationBuild.jsx';
import './wpWorkbench.css';

const fc = value => value == null ? 'Needs info' : `${(value*100).toFixed(1)}%`;
const money = value => value == null ? 'Pending' : `$${value.toFixed(2)}`;

export function EnterpriseOverview({projections,trusted,rate}) {
  const rows=useMemo(()=>buildPortfolio(projections),[projections]);
  const passing=trusted ? rows.filter(r=>r.portfolioStatus==='Within 40%') : [];

  return <section aria-label="Enterprise W&P overview" className="rounded-2xl border border-teal-200 bg-teal-950 text-white">
    <details className="p-4 md:p-5">
      <summary className="cursor-pointer"><span className="text-lg font-bold">Enterprise overview</span><span className="mt-1 block text-sm text-teal-100">{projections.length} menus | {trusted ? passing.length : 'Unverified'} qualifying foods | {rows.length} unique components</span></summary>
      <p className="mt-3 text-xs text-teal-100">All source menus, independent of menu selection | {money((rate||0)/16)}/oz session price | 40% FC target. Qualification is assessed per food.</p>
      {!trusted && <p className="mt-2 font-semibold">Reference only - shared data required to confirm qualification.</p>}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{CATEGORIES.filter((c,i)=>i<3||rows.some(r=>r.category===c)).map(category=>{const total=rows.filter(r=>r.category===category).length, count=passing.filter(r=>r.category===category).length;return <div key={category} className="rounded-xl bg-white/10 p-3"><p className="text-sm">{category}</p><p className="mt-1 text-2xl font-bold">{trusted?count:'Unavailable'} <span className="text-xs font-normal">qualifying / {total} unique</span></p><div className="mt-2 h-1.5 rounded bg-white/20"><div className="h-full rounded bg-teal-300" style={{width:`${total?count/total*100:0}%`}}/></div></div>;})}</div>
      <p className="mt-3 text-sm text-teal-100">{rows.filter(r=>r.portfolioStatus==='Needs information').length} missing information | {rows.filter(r=>r.portfolioStatus==='Service review').length} service review | {rows.filter(r=>r.portfolioStatus==='Above 40%').length} above 40%. Unique foods are not menu memberships or a prediction of enterprise food cost.</p>
    </details>
  </section>;
}

export default function WpPortfolio({projections,catalogProjections=projections,trusted,rate,onExport,exporting}) {
  const [entries,setEntries]=useState([]);
  const catalog=useMemo(()=>buildPortfolio(catalogProjections),[catalogProjections]);
  const [category,setCategory]=useState('All'),[status,setStatus]=useState('Within 40%'),[search,setSearch]=useState('');
  const rows=useMemo(()=>buildPortfolio(projections),[projections]);
  const passing=trusted?rows.filter(r=>r.portfolioStatus==='Within 40%'):[];
  const counts=CATEGORIES.map(label=>({label,count:passing.filter(r=>r.category===label).length}));
  const visible=rows.filter(r=>(category==='All'||r.category===category)&&(status==='All'||r.portfolioStatus===status)&&(trusted||status!=='Within 40%')&&`${r.name} ${r.mrn} ${r.menus.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const toggleFood = r => setEntries(previous=>previous.some(entry=>entry.key===r.key)?previous.filter(entry=>entry.key!==r.key):[...previous,{key:r.key,name:r.name,mrn:r.mrn,menus:r.menus,pounds:'1'}]);
  return <section aria-label="W&P qualifying portfolio" className="wp-workbench space-y-5 rounded-2xl border p-4 md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Working selection | {projections.length} menus</p><h2 className="mt-1 text-2xl font-bold text-teal-950">Plan your W&amp;P station</h2><p className="mt-1 text-sm text-slate-600">Unique servable components | ${((rate||0)/16).toFixed(2)}/oz | each food counted once across menus</p></div><button className="wp-menu-export rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={exporting||!rate||!trusted||!visible.length} onClick={()=>onExport(visible)}>Export browse results</button></div>
    {!trusted&&<p className="text-sm text-amber-900">Load current shared data before using qualifying portfolio counts.</p>}
    <button type="button" className="wp-station-jump xl:hidden" onClick={()=>{const station=document.getElementById('wp-station');station?.scrollIntoView({block:'start'});station?.focus({preventScroll:true});}}>View your station <span>{entries.length} selected &darr;</span></button>
    <div className="wp-workspace grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="wp-browse min-w-0 rounded-2xl border bg-white">
    <div className="wp-browse-heading"><p className="wp-step">01 / Choose your foods</p><h3 className="text-xl font-bold">Browse foods</h3><p className="mt-1 text-sm text-slate-500">Click a food to select it. Click again to unselect.</p></div>
    <div aria-label="Qualifying components by category" className="wp-category-list">{counts.filter((c,i)=>i<3||c.count>0).map(c=><button key={c.label} aria-label={`${c.label}: ${c.count} qualifying components`} aria-pressed={category===c.label} onClick={()=>{setCategory(c.label);setStatus('Within 40%');}} className="wp-category"><span>{c.label}</span><strong>{c.count}</strong><span className="sr-only">within 40% FC</span></button>)}</div>
    <div className="flex flex-wrap gap-2 px-4 py-3"><select aria-label="Portfolio category" className="min-w-0 rounded-lg border p-2" value={category} onChange={e=>setCategory(e.target.value)}><option>All</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select><select aria-label="Portfolio result" className="min-w-0 rounded-lg border p-2" value={status} onChange={e=>setStatus(e.target.value)}>{['Within 40%','Above 40%','Service review','Needs information','All'].map(s=><option key={s}>{s}</option>)}</select><input aria-label="Search portfolio foods" placeholder="Find food, MRN or menu" value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 flex-1 rounded-lg border p-2"/></div>
    <p role="status" className="px-4 pb-3 text-xs font-semibold text-slate-500">{visible.length} unique {visible.length===1?'component':'components'} | {category} | {status}</p>

      <div aria-label="Portfolio food list" tabIndex={0} className="wp-food-list min-w-0"><div className="grid grid-cols-[minmax(0,1fr)_4rem_4rem] gap-2 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"><span>Food / exact MRN</span><span>FC%</span><span>Cost/lb</span></div>{visible.map(r=>{const added=entries.some(entry=>entry.key===r.key);return <button type="button" key={r.key} data-testid="portfolio-food" aria-label={`Select ${r.name}`} aria-pressed={added} onClick={()=>toggleFood(r)} className={`wp-food block w-full border-t p-4 text-left hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-700 ${added?'bg-teal-50 ring-1 ring-inset ring-teal-500':''}`}><span className="grid grid-cols-[minmax(0,1fr)_4rem_4rem] items-start gap-2 text-sm"><span className="min-w-0"><strong className="block break-words text-teal-900">{added?'\u2713 ': '+ '}{r.name}</strong><span className="mt-1 block break-words text-xs text-slate-500">{r.menus.join(' \u00b7 ')} | MRN {r.mrn||'Unresolved'}</span></span><span className="break-words font-bold text-teal-800">{fc(r.foodCost)}</span><span className="break-words">{money(r.costPerLb)}</span></span>{r.conflict&&<span className="mt-2 block text-xs text-amber-900">Conflicting source variants - economics require review.</span>}{!!r.serviceReasons.length&&<span className="mt-2 block text-xs text-amber-900">{r.serviceReasons.join(' \u00b7 ')}</span>}{!!r.informationReasons?.length&&<span className="mt-2 block text-xs text-amber-900">{r.informationReasons.join('; ')}</span>}</button>;})}{!visible.length&&<p className="p-4 text-sm">No components match this selection.</p>}</div>
    </div><WpStationBuild entries={entries} onChange={setEntries} catalog={catalog} rate={rate} trusted={trusted}/></div>
    <details className="text-xs text-slate-500"><summary className="cursor-pointer">Eligibility and data limits</summary><p className="mt-2">All source menus are shown. Handhelds and plain single ingredients remain excluded from servable components. Missing information and conflicting sources never count as a pass. Classification remains source-based guidance.</p></details>
  </section>;
}
