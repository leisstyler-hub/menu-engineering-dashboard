import React from 'react';
import {PAN_REFERENCE} from './wpPanEstimate.js';
const field='mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-2 text-sm';
export default function WpPanFields({entry,onChange}) {
 return <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Pan size<select aria-label={`Pan size for ${entry.name}`} value={entry.panSize||'half'} className={field} onChange={e=>onChange({...entry,quantityMode:'pan',panSize:e.target.value})}>{Object.entries(PAN_REFERENCE).map(([key,p])=><option key={key} value={key}>{p.label} / 4-inch deep</option>)}</select></label><label className="text-xs font-semibold">Total pans to prepare<input aria-label={`Total pans to prepare for ${entry.name}`} className={field} type="number" min="1" step="1" value={entry.totalPans??'1'} onChange={e=>onChange({...entry,quantityMode:'pan',totalPans:e.target.value})}/></label></div>;
}
