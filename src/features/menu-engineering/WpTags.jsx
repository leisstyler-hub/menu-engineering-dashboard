import React from 'react';
import {profileFor} from './wpSmartModel.js';
export default function WpTags({food}) {
 const p=profileFor(food),reviewed=food.culinaryProfile?.reviewStatus==='Reviewed'?food.culinaryProfile:null;
 const tags=reviewed||p;
 return <span className="mt-1 block break-words text-xs font-normal text-slate-500">Tags / {[...(tags.placements||[]),tags.role,...(tags.cuisines||[]),...(tags.flavors||[]),...(tags.textures||[]),...(tags.seasons||[])].filter(Boolean).join(' / ')||'Needs review'} / {reviewed?'Reviewed':'Proposed'}{!(tags.placements||[]).length?' / Service: Needs review':''}</span>;
}
