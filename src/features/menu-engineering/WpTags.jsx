import React from 'react';
import {profileFor} from './wpSmartModel.js';
export default function WpTags({food}) {
 const p=profileFor(food);
 const tags=p;
 return <span className="mt-1 block break-words text-xs font-normal text-slate-500">Service: {tags.placements.length===1?tags.placements[0]:'Needs review'} / Tags / {[...(tags.placements||[]),tags.role,...(tags.cuisines||[]),...(tags.flavors||[]),...(tags.textures||[]),...(tags.seasons||[])].filter(Boolean).join(' / ')||'Needs review'} / {p.reviewStatus}{!(tags.placements||[]).length?' / Service: Needs review':''}
  <span className="mt-1 block text-slate-700" aria-label="TACT sensory tags">{['taste','aroma','color','texture'].map(d=>{
   const field=p.tact[d],label=d[0].toUpperCase()+d.slice(1);
   return <span key={d} className="block" title={field.evidence.map(e=>`${e.source}: ${e.phrase} (${e.tag})`).join('; ')}>{label}: {field.values.join(', ')||(field.status==='Reviewed'?'None recorded':'Needs review')} ({field.status})</span>;
  })}<span className="block text-slate-500">TACT proposals describe likely qualities; confirm the finished food.</span></span>
 </span>;
}
