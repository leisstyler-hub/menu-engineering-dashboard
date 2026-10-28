import React, {useEffect, useMemo, useRef, useState} from 'react';
import {projectStation} from './wpStationModel.js';

const money = value => value == null ? 'Incomplete' : `$${value.toFixed(2)}`;
const field = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white p-2 text-sm';

export default function WpStationBuild({entries, onChange, catalog, rate, trusted}) {
  const [sellThrough, setSellThrough] = useState('100');
  const [detailKey,setDetailKey] = useState('');
  const dialog = useRef(null);
  const detail = catalog.find(food=>food.key===detailKey);
  const detailEntry = entries.find(entry=>entry.key===detailKey);
  useEffect(()=>{if(detailKey&&dialog.current&&!dialog.current.open)dialog.current.showModal();},[detailKey]);
  const [exporting,setExporting] = useState(false), [exportError,setExportError] = useState('');
  const projection = useMemo(() => projectStation(entries, catalog, rate, sellThrough, trusted), [entries, catalog, rate, sellThrough, trusted]);
  const exportStation = async () => {
    setExporting(true);setExportError('');
    try {const {downloadStationWorkbook}=await import('./wpStationExport.js');downloadStationWorkbook(projection,{rate,sellThrough,trusted});}
    catch(error){setExportError(`Station export failed: ${error.message}`);}
    finally{setExporting(false);}
  };
  return <aside id="wp-station" tabIndex={-1} aria-label="Station build" className="wp-station min-w-0 space-y-4 rounded-2xl border bg-white p-4 md:p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-teal-700">02 / Your station</p><h3 className="text-xl font-bold text-teal-950">Build your spread</h3></div><button type="button" disabled={!entries.length} onClick={()=>onChange([])} className="rounded-lg border bg-white px-3 py-2 text-xs disabled:opacity-50">Clear selections</button></div>
    <p className="text-xs text-slate-600">{entries.length} foods selected. Switching menu tiles keeps your build; refreshing data or leaving W&amp;P clears it. Enter planned finished pounds.</p>
    <section aria-label="Station projections" className="wp-projection rounded-xl p-4"><h4 className="font-bold">Your station at a glance{projection.approximate?' · estimate':''}</h4><dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{[
      ['Finished pounds',projection.pounds==null?'Incomplete':projection.pounds.toFixed(2)],
      ['Planned food cost',money(projection.cost)],['Projected sales',money(projection.sales)],
      ['Projected FC%',projection.foodCost==null?'Incomplete':`${(projection.foodCost*100).toFixed(1)}%`],
      ['Remaining for labor & other costs',money(projection.contribution)]
    ].map(([label,value])=><div key={label}><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-1 text-lg font-bold" data-testid={`station-${label.toLowerCase().replace(/[^a-z]+/g,'-')}`}>{value}</dd></div>)}</dl>
      <p className="mt-3 text-xs text-slate-600">Food cost includes all planned pounds. Sales use expected sell-through at {money(rate)}/lb. Remaining amount is projected sales minus all planned food cost, before labor, overhead and tax.</p>
      {projection.reviewCount>0&&<p className="mt-2 text-xs text-amber-900">{projection.reviewCount} foods retain service restrictions. A station FC% does not approve service.</p>}
    </section>
    <button type="button" disabled={!entries.length||exporting} onClick={exportStation} className="wp-primary w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{exporting?'Preparing workbook…':'Export station selections'}</button>
    {exportError&&<p role="alert" className="text-sm text-rose-800">{exportError}</p>}
    {!trusted&&<p className="text-sm font-semibold text-amber-900">Reference data only. Load shared data for cost projections.</p>}
    {!entries.length&&<p className="rounded-xl border border-dashed border-teal-300 p-5 text-sm">Add foods from the menu selection to start your station.</p>}
    <div className="space-y-3">{projection.rows.map(row=><article key={row.key} data-testid="station-food" className="wp-station-food min-w-0 rounded-xl border bg-white p-4">
      <button type="button" aria-label={`Details for ${row.name}`} onClick={()=>setDetailKey(row.key)} className="block w-full break-words text-left text-sm font-bold text-teal-900 hover:underline underline-offset-4">{row.food?.name||row.name}</button>
      <p className="mt-1 break-words text-xs text-slate-500">{row.food?.menus?.join(' · ')||'Source no longer available'} | MRN {row.food?.mrn||'Unresolved'}</p>
      <div className="mt-3 grid grid-cols-2 items-end gap-3"><label className="text-xs font-semibold">Finished lb<input aria-label={`Finished pounds for ${row.name}`} type="number" min="0.001" step="any" value={entries.find(entry=>entry.key===row.key).pounds} onChange={e=>onChange(entries.map(entry=>entry.key===row.key?{...entry,pounds:e.target.value}:entry))} className={`${field} mt-1`}/></label><div className="text-right text-sm"><p>{money(row.food?.costPerLb)}/lb</p><strong>{money(row.cost)} planned cost</strong></div></div>
      {row.pounds==null&&<p className="mt-2 text-xs text-amber-900">Enter finished pounds greater than zero.</p>}
      {row.cost==null&&<p className="mt-2 text-xs text-amber-900">Incomplete estimate: valid quantity and trusted, compatible cost/weight evidence required.</p>}
      {!!row.food?.informationReasons?.length&&<p className="mt-2 text-xs text-amber-900">{row.food.informationReasons.join('; ')}</p>}
      {!!row.food?.serviceReasons?.length&&<p className="mt-2 text-xs text-amber-900">Service review: {row.food.serviceReasons.join('; ')}</p>}
      {row.food?.weightApproximate&&<p className="mt-2 text-xs text-amber-900">Approximate source weight; estimated economics.</p>}
    </article>)}</div>
    <label className="block text-sm font-semibold">Expected sell-through %<input aria-label="Expected sell-through percent" className={`${field} mt-1`} type="number" min="0" max="100" step="any" value={sellThrough} onChange={e=>setSellThrough(e.target.value)}/></label>
    {(sellThrough.trim()===''||!Number.isFinite(Number(sellThrough))||Number(sellThrough)<0||Number(sellThrough)>100)&&<p role="alert" className="text-sm text-amber-900">Enter sell-through from 0 to 100%.</p>}
    {detailKey&&<dialog ref={dialog} aria-label="Food details" onClose={()=>setDetailKey('')} className="m-auto max-h-[80vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-teal-200 bg-white p-5 shadow-2xl backdrop:bg-slate-950/40">
      <button type="button" autoFocus onClick={()=>dialog.current.close()} className="float-right rounded-lg border px-3 py-2 text-xs">Close details</button>
      <h3 className="clear-both pt-3 text-xl font-bold">{detail?.name||detailEntry?.name}</h3>
      <p className="mt-3 break-words text-sm">MRN {detail?.mrn||detailEntry?.mrn||'Unresolved'} | {detail?.portion}</p>
      <p className="mt-2 text-sm">{detail?.category} | {money(detail?.costPerLb)}/lb | FC {detail?.foodCost==null?'Needs information':`${(detail.foodCost*100).toFixed(1)}%`}</p>
      <p className="mt-2 text-sm">Cost: {money(detail?.cost)} | Weight: {detail?.massOz?`${detail.weightApproximate?'~':''}${Number(detail.massOz.toFixed(3))} oz`:'Unresolved'}</p>
      <p className="mt-2 break-words text-sm">{detail?.menus?.join(' · ')||'Source no longer available'}</p>
      {detail?.weightApproximate&&<p className="mt-2 text-sm text-amber-900">Approximate source weight; calculated FC is an estimate.</p>}
      {!!detail?.informationReasons?.length&&<p className="mt-2 text-sm text-amber-900">Information needed: {detail.informationReasons.join('; ')}</p>}
      {!!detail?.serviceReasons?.length&&<p className="mt-2 text-sm text-amber-900">Service review: {detail.serviceReasons.join('; ')}</p>}
      <p className="mt-3 text-xs text-slate-500">Source: {detail?.costBasis||'Recipe snapshot'} | Weight: {detail?.weightSource||'See source record'}. Economic qualification remains separate from Culinary approval.</p>
      <button type="button" onClick={()=>{onChange(entries.filter(entry=>entry.key!==detailKey));dialog.current.close();}} className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Delete from station</button>
    </dialog>}
  </aside>;
}
