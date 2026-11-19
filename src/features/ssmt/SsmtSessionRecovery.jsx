import React,{useState} from "react";
export default function SsmtSessionRecovery({guard,email}) {
 const [password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const block=guard.block;const checking=block.kind==="checking"||block.kind==="saving";
 return <main className="mx-auto my-12 max-w-xl space-y-4 rounded-xl border-2 border-sky-300 bg-white p-6 text-slate-950" aria-label="SSMT session recovery">
 <h1 className="text-2xl font-black text-sky-950">{block.kind==="expired"?"You've been logged out":checking?"Protecting your open menu":"Editing paused"}</h1>
 <p role="status">{block.message}</p><p className="text-sm">Open menu: <strong>{block.name}</strong>. {block.dirty||block.inFlight?"Some changes are not confirmed saved.":"No unsaved menu changes were detected."} Keep this tab open while recovering.</p>
 <button type="button" className="rounded border border-sky-700 px-4 py-3 font-bold" onClick={guard.download}>Download private draft</button>
 {!checking&&<><button type="button" className="ml-2 rounded border px-4 py-3" onClick={guard.retry}>Check connection again</button><form className="space-y-3" onSubmit={async event=>{event.preventDefault();setBusy(true);setError("");try{await guard.resume(password);setPassword("");}catch(e){setError(e.message);}finally{setBusy(false);}}}><p className="text-sm">Sign back in as {email}. Your retained draft will not be replaced by a fresh workspace.</p><label className="block font-bold">Password<input aria-label="Session password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 block w-full rounded border p-3"/></label><button disabled={busy} className="rounded bg-sky-700 px-4 py-3 font-bold text-white">Sign in and resume draft</button>{error&&<p role="alert">{error}</p>}</form></>}
 </main>;
}
