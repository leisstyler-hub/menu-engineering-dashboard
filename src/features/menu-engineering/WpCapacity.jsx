import React from 'react';
import {spreadProgress} from './wpSmartModel.js';
const fields=[['hot','Hot','Hot full-pan spaces'],['cold','Cold','Cold full-pan spaces'],['ambient','Ambient','Ambient display positions']];
export default function WpCapacity({entries,catalog,capacity,onChange,children,priorities}){
 const progress=spreadProgress(entries,catalog,capacity);
 return <section aria-label="Spread capacity" className="wp-capacity wp-bar-plan rounded-2xl border p-4 md:p-5">
 <div className="wp-bar-settings"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-bold">Plan your W&amp;P Bar</h3><strong role="status" className="text-xs">{progress.complete?'Spread complete':'Fill the open slots'}</strong></div>
 <p className="mt-2 text-sm">One slot = one full pan. Half pan = 1/2 slot; bullet = 1/6 slot.</p><p className="mt-1 text-xs">4-inch pan reference at 80% fill: full 11.36 qt, half 5.36 qt, bullet 1.44 qt. Filled bars show selected display space.</p><div className="mt-3 grid grid-cols-3 gap-2">{fields.map(([key,label])=><div key={key} className="min-w-0 text-xs"><span className="block font-semibold">{key==='individual'?'Individual':label}</span><span>{Number(progress.used[label].toFixed(2))} / {capacity[key]||0} filled</span><span aria-label={`${label} slots`} className="mt-1 flex flex-wrap gap-1">{Array.from({length:Math.min(40,Math.max(0,Math.floor(Number(capacity[key])||0)))},(_,i)=><span key={i} className="h-2 w-3 rounded-sm border border-teal-700" style={{background:`linear-gradient(to right, #52725c ${Math.max(0,Math.min(1,progress.used[label]-i))*100}%, #fff 0)`}}/>)}</span></div>)}</div>
 <details className="mt-2 text-xs"><summary className="cursor-pointer font-semibold">Edit capacity</summary><div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">{fields.map(([key,,aria])=><label key={key} className="min-w-0 font-semibold">{aria}<input aria-label={aria} type="number" min="0" max="40" step="1" className="mt-1 w-full rounded border p-1.5" value={capacity[key]} onChange={e=>onChange({...capacity,[key]:e.target.value})}/></label>)}</div><p className="mt-2 text-slate-500">Hot/cold slots measure display footprint, not reserve pans. Served portions are forecast on each food card.</p></details>
 {[...progress.issues,...progress.quantityIssues].map(issue=><p role="alert" key={issue} className="mt-1 text-xs text-amber-900">{issue}</p>)}
 <div className="mt-5">{priorities}</div></div><div className="wp-bar-sensory">{children}</div>
 </section>;
}
