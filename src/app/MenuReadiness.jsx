import React, { useEffect, useMemo, useRef, useState } from 'react';

const categoryLabels = new Map([['entree','Entrees'],['side','Sides'],['extension','Extensions'],['subrecipe','Subrecipes']]);
const categoryLabel = key => categoryLabels.get(key) || key || 'Uncategorized';
const categoryKey = row => String(row.category || '').trim().toLowerCase();
const reviews = [
  ['Missing true cost', 'missing costs'],
  ['price', 'required prices'],
  ['Missing description', 'missing descriptions'],
  ['Missing allergen detail', 'missing allergen details'],
];

export function useMenuReadiness() {
  const [state,setState]=useState({data:null,loading:false,error:''});
  const controller=useRef(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  const load=async()=>{
    controller.current?.abort();
    const request=new AbortController(); controller.current=request;
    setState(current=>({...current,loading:true,error:''}));
    try {
      const response=await fetch('/api/recipe-library?scope=all',{signal:request.signal,cache:'no-store'});
      const payload=await response.json();
      if(!response.ok||!payload?.ok||!Array.isArray(payload.rows)||payload.rows.some(row=>!row||typeof row!=='object')) throw new Error('Invalid menu response');
      if(!request.signal.aborted) setState({loading:false,error:'',data:{rows:payload.rows,source:payload.source,readAt:new Date().toLocaleString()}});
    } catch(error) {
      if(!request.signal.aborted) setState(current=>({...current,loading:false,error:'Unable to load current menu data. Try again; no missing-data counts have been inferred.'}));
    }
  };
  return {...state,load};
}

export default function MenuReadiness({snapshot,readiness,buildGapRows}) {
  const {data,loading,error,load}=readiness;
  const [selection,setSelection]=useState(null),[search,setSearch]=useState(''),[page,setPage]=useState(0);
  const rows=data?.rows || [];
  const categories=useMemo(()=>{
    const counts=Object.create(null);
    if(data) rows.forEach(row=>{const key=categoryKey(row);counts[key]=(counts[key]||0)+1;});
    else Object.entries(snapshot.categoryCounts).forEach(([key,count])=>{const normalized=key.toLowerCase();counts[normalized]=(counts[normalized]||0)+count;});
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  },[data,snapshot]);
  const gaps=useMemo(()=>data?buildGapRows(rows):[],[data,buildGapRows]);
  const matchesReview=(row,key)=>key==='price'?['Protein price gap','Price-required gap'].includes(row.gapType):row.gapType===key;
  const counts=reviews.map(([key])=>gaps.filter(row=>matchesReview(row,key)).length);
  const matching=useMemo(()=>{
    if(!selection||!data)return [];
    const selected=selection.kind==='category'?rows.filter(row=>categoryKey(row)===selection.key):gaps.filter(row=>matchesReview(row,selection.key));
    const query=search.trim().toLowerCase();
    return selected.filter(row=>[row.item,row.displayName,row.menu,row.mrn].some(value=>String(value??'').toLowerCase().includes(query)));
  },[selection,data,gaps,search]);
  const total=data?rows.length:snapshot.totalItems;
  const choose=next=>{setSelection(next);setSearch('');setPage(0);};
  const refresh=()=>{setSelection(null);setSearch('');setPage(0);load();};
  const disabled=!data||loading||Boolean(error);
  return <section aria-label="Menu readiness details" className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="min-w-0 text-sm">
        <p className="font-bold text-slate-950">{data?(data.source==='supabase-recipe-items'?'Shared Menu Library':'Reference data'):'Bundled snapshot'}</p>
        <p className="mt-1 text-slate-600">{total.toLocaleString()} menu item rows{data?` · Read at ${data.readAt}`:' · Saved MenuWorks summary; not a live catalog count.'}</p>
        <p className="mt-1 text-xs text-slate-500">{data?'Read time is when this view loaded, not a source update timestamp.':`Source: ${snapshot.generatedFrom}. Snapshot update time is not recorded.`}</p>
        {data&&data.source!=='supabase-recipe-items'&&<p className="mt-1 text-xs font-semibold text-amber-900">Source: {data.source||'unspecified'}. Reference rows do not establish current shared-catalog readiness.</p>}
      </div>
      <button type="button" disabled={loading} onClick={refresh} className="rounded-lg bg-teal-800 px-4 py-3 text-sm font-bold text-white hover:bg-teal-900 disabled:opacity-60">{loading?'Loading menu data…':data?'Refresh menu data':'Load current menu data'}</button>
    </div>
    {error&&<p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}{data?' Previously loaded rows are retained; refresh is required before opening review lists.':''}</p>}
    <div>
      <h3 className="text-base font-bold text-slate-950">Category breakdown</h3>
      <p className="mt-1 text-xs text-slate-500">Menu item rows, including menu memberships; not a count of unique foods. Select a category after loading data.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">{categories.map(([key,count])=><button type="button" key={key} disabled={disabled} aria-label={`Review category ${categoryLabel(key)}: ${count}`} onClick={()=>choose({kind:'category',key,title:categoryLabel(key)})} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-500 disabled:cursor-default">
        <span className="block break-words text-sm font-semibold text-slate-700">{categoryLabel(key)}</span>
        <span className="mt-2 block text-xl font-bold text-teal-900">{count.toLocaleString()} <span className="text-xs font-medium text-slate-500">{total?(count/total*100).toFixed(1):'0.0'}%</span></span>
        <span className="mt-2 block h-1.5 rounded bg-slate-100"><span className="block h-full rounded bg-teal-600" style={{width:`${total?count/total*100:0}%`}}/></span>
      </button>)}</div>
    </div>
    <div>
      <h3 className="text-base font-bold text-slate-950">Needs review</h3>
      <p className="mt-1 text-xs text-slate-500">{data?'Counts use the loaded rows and existing trust-gap rules. An item can appear in multiple reviews.':'Load current menu data to calculate exact gap counts and open matching items.'}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">{reviews.map(([key,label],i)=><button type="button" key={key} disabled={disabled} aria-label={`Review ${label}: ${data?counts[i]:'not loaded'}`} onClick={()=>choose({kind:'gap',key,title:label})} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-teal-500 disabled:cursor-default">
        <span className="block break-words text-sm font-semibold capitalize text-slate-700">{label}</span><span className="mt-2 block text-xl font-bold text-slate-950">{data?counts[i].toLocaleString():'—'}</span>
      </button>)}</div>
      <p className="mt-3 text-xs text-slate-600">Price review excludes complimentary rows under the existing rules. Missing allergen detail does not mean allergen-free.</p>
      {data&&!rows.length&&<p className="mt-3 text-sm text-slate-600">No item rows returned. This does not confirm that all menus are ready.</p>}
    </div>
    {selection&&!disabled&&<section role="region" aria-label="Matching menu items" className="min-w-0 rounded-xl border border-teal-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold capitalize">{selection.title} · {matching.length.toLocaleString()} rows</h3><button type="button" onClick={()=>setSelection(null)} className="rounded border px-3 py-2 text-sm">Close review</button></div>
      <label className="mt-3 block text-sm">Search matching items<input value={search} onChange={event=>{setSearch(event.target.value);setPage(0);}} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"/></label>
      <div className="mt-3 max-w-full overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead><tr className="border-b bg-slate-50">{['Item','Menu','MRN','Category'].map(label=><th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead><tbody>{matching.slice(page*25,(page+1)*25).map((row,i)=><tr key={i} className="border-b"><td className="p-2">{row.item||row.displayName||'Unnamed item'}</td><td className="p-2">{row.menu||'Not recorded'}</td><td className="p-2 font-mono">{row.mrn==null||row.mrn===''?'Not recorded':String(row.mrn)}</td><td className="p-2">{categoryLabel(categoryKey(row))}</td></tr>)}</tbody></table></div>
      {!matching.length&&<p className="mt-3 text-sm">No matching items in the loaded rows.</p>}
      {matching.length>25&&<div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><button type="button" disabled={!page} onClick={()=>setPage(page-1)} className="rounded border px-3 py-2 disabled:opacity-40">Previous</button><span>Page {page+1} of {Math.ceil(matching.length/25)}</span><button type="button" disabled={(page+1)*25>=matching.length} onClick={()=>setPage(page+1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button></div>}
    </section>}
  </section>;
}
