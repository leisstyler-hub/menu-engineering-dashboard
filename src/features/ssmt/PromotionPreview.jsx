import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PromotionPreview({menu}) {
  const [open,setOpen]=useState(false),[position,setPosition]=useState({top:0,left:0}),[search,setSearch]=useState('');
  const trigger=useRef(null),popup=useRef(null),timer=useRef(null),suppressFocus=useRef(false),id=useId();
  const cancel=()=>clearTimeout(timer.current);
  const close=()=>{cancel();setOpen(false);setSearch('');};
  const show=()=>{
    cancel();const rect=trigger.current.getBoundingClientRect();
    const width=Math.min(400,window.innerWidth-24);
    const left=rect.right+8+width<=window.innerWidth-12?rect.right+8:rect.left-width-8>=12?rect.left-width-8:Math.max(12,window.innerWidth-width-12);
    setPosition({left,top:Math.max(12,Math.min(rect.top,window.innerHeight-420))});setOpen(true);
  };
  const leave=()=>{cancel();timer.current=setTimeout(()=>{if(!trigger.current?.contains(document.activeElement)&&!popup.current?.contains(document.activeElement))close();},180);};
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  useEffect(()=>{
    if(!open)return;
    const dismiss=event=>{if(!trigger.current?.contains(event.target)&&!popup.current?.contains(event.target))close();};
    const escape=event=>{if(event.key==='Escape'){close();suppressFocus.current=true;trigger.current?.focus();suppressFocus.current=false;}};
    document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);
    window.addEventListener('resize',close);
    return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);window.removeEventListener('resize',close);};
  },[open]);
  const items=Array.isArray(menu.items)?menu.items.filter(item=>item.recordType!=='divider'&&(item.label||item.name)):null;
  const visible=items?.filter(item=>`${item.label||item.name} ${item.description||''}`.toLowerCase().includes(search.toLowerCase()))||[];
  return <>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={open?id:undefined} aria-haspopup="dialog" onMouseEnter={show} onMouseLeave={leave} onFocus={()=>{if(!suppressFocus.current)show();}} onBlur={leave} onClick={show} className="block w-full rounded-md border border-purple-300 bg-purple-100 px-2 py-1 text-left text-[11px] font-black leading-4 text-purple-950 hover:border-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-600">{menu.name}</button>
    {open&&createPortal(<section id={id} ref={popup} role="dialog" aria-label={`${menu.name} preview`} onMouseEnter={cancel} onMouseLeave={leave} onFocus={cancel} onBlur={leave} style={{top:position.top,left:position.left,width:'min(400px, calc(100vw - 24px))',maxHeight:`${Math.max(120,window.innerHeight-position.top-12)}px`}} className="fixed z-[80] overflow-y-auto rounded-2xl border border-purple-200 bg-white p-4 text-slate-950 shadow-2xl">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-purple-700">BYPTWD pilot preview</p><h3 className="mt-1 text-lg font-bold">{menu.name}</h3></div><button type="button" onClick={close} className="rounded border px-2 py-1 text-sm">Close</button></div>
      {menu.previewSource&&<p className="mt-2 text-xs text-slate-500">{menu.previewSource}</p>}
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm"><dt className="text-slate-500">Dates</dt><dd>{menu.activeStart} to {menu.activeEnd}</dd><dt className="text-slate-500">Menu type</dt><dd>{menu.type||'Not supplied to this view'}</dd><dt className="text-slate-500">Status</dt><dd>{menu.phase||'Not supplied to this view'}</dd><dt className="text-slate-500">FIXY designation</dt><dd className="break-words">{menu.fixyDesignation||'Not supplied to this preview'}</dd></dl>
      <div className="mt-4 border-t pt-3"><h4 className="font-bold">Menu items {items?`(${items.length})`:''}</h4>
        {items?.length?<><label className="mt-2 block text-xs font-semibold">Search menu items<input value={search} onChange={event=>setSearch(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"/></label><ul className="mt-3 max-h-48 space-y-3 overflow-y-auto pr-1">{visible.map((item,index)=><li key={index} className="border-b pb-2"><p className="text-sm font-semibold">{item.label||item.name}</p>{item.description&&<p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>}{item.calories!=null&&item.calories!==''&&<p className="mt-1 text-xs text-slate-500">{item.calories} calories</p>}</li>)}{!visible.length&&<li className="text-sm text-slate-600">No matching menu items.</li>}</ul></>:<p className="mt-2 text-sm text-slate-600">Item details are not supplied to this calendar preview. This does not mean the menu is unfinished.</p>}
      </div>
    </section>,document.body)}
  </>;
}
