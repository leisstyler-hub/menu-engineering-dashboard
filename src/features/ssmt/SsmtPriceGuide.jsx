import React, {useState} from 'react';
import {GUIDE_COLUMNS, guideRows} from './ssmtPriceGuide.js';

export default function SsmtPriceGuide({priceBook = []}) {
  const [query,setQuery]=useState('');
  const rows=guideRows(priceBook);
  if(!rows.length)return null;
  const filtered=rows.filter(row=>`${row.sourceGuide.sourceName} ${row.category} ${row.sourceGuide.section}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section data-testid="ssmt-source-price-guide" className="rounded-xl border-2 border-emerald-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h3 className="text-xl font-black text-slate-950">Workbook pricing · E–S</h3>
        <p className="mt-1 text-sm text-slate-600">Prepared Foods Guide · GREF Current Price · {rows.length} categories. Canada is CAD; other columns are USD.</p>
        <p className="mt-1 text-xs text-slate-600">Exact source names and prices. Missing values stay explicit. Tier and Canada reference columns do not assign campus fallback prices. Deli and grill service excludes sides; source wording is retained below.</p></div>
      <label className="grid gap-1 text-sm font-bold">Find a category<input value={query} onChange={event=>setQuery(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" type="search" /></label>
    </div>
    <div className="mt-4 max-h-[55vh] overflow-auto rounded-lg border border-slate-200" tabIndex={0} role="region" aria-label="Workbook E through S pricing table">
      <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-100"><tr><th className="px-3 py-3">Source category</th>{GUIDE_COLUMNS.map(column=><th key={column} className="px-3 py-3 whitespace-nowrap">{column}{column==='Canada'?' (CAD)':''}</th>)}</tr></thead>
        <tbody>{filtered.map(row=><tr key={row.id} className="border-t border-slate-200 odd:bg-white even:bg-slate-50">
          <th scope="row" className="min-w-[260px] px-3 py-3 font-bold"><span className="block text-xs font-normal text-slate-500">{row.sourceGuide.section} · row {row.sourceGuide.sourceRow}</span>{row.sourceGuide.sourceName}{row.category!==row.sourceGuide.sourceName&&<span className="block text-xs font-normal text-slate-600">SSMT: {row.category}</span>}</th>
          {GUIDE_COLUMNS.map(column=>{const value=row.sourceGuide.prices?.[column];return <td key={column} className="px-3 py-3 tabular-nums whitespace-nowrap">{value==null?<span className="text-slate-400">Missing</span>:`$${Number(value).toFixed(2)}`}</td>;})}
        </tr>)}</tbody>
      </table>
    </div>
    {!filtered.length&&<p className="mt-3 text-sm text-slate-600">No matching categories.</p>}
  </section>;
}
