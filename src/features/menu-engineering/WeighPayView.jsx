import React, { useEffect, useMemo, useState } from 'react';
import { evaluateMenus } from './weighPayModel.js';

const button = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50';
const input = 'min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm';
const percent = value => value == null ? '—' : `${(value * 100).toFixed(1)}%`;
const money = value => value == null ? '—' : `$${value.toFixed(2)}`;
function Badge({ status, testId }) {
  const color = status === 'Pass' || status === 'Allowed' ? 'bg-emerald-50 text-emerald-800' : /Fail|Blocked/.test(status) ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-900';
  return <span data-testid={testId} className={`inline-flex rounded-lg px-2 py-1 text-xs font-bold ${color}`}>{status}</span>;
}

export default function WeighPayView() {
  const [data, setData] = useState({ state: 'loading', rows: [], source: '', loadedAt: '', message: '' });
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMenu, setSelectedMenu] = useState('');
  const [editing, setEditing] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setData({ state: 'loading', rows: [], source: '', loadedAt: '', message: '' });
    setOverrides({}); setEditing(false);
    fetch('/api/recipe-library?scope=all', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok || !payload.ok || !Array.isArray(payload.rows)) throw new Error(payload.message || 'Unable to load shared menu data.');
        if (active) setData({ state: 'ready', rows: payload.rows, source: payload.source || 'unknown', loadedAt: new Date().toISOString(), message: payload.warning || '' });
      })
      .catch(error => { if (active) setData({ state: 'error', rows: [], source: '', loadedAt: '', message: error.name === 'AbortError' ? 'Shared menu data timed out. Retry to load guidance.' : error.message }); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [reload]);
  const trusted = data.source.startsWith('supabase-recipe-items');
  const menus = useMemo(() => evaluateMenus(data.rows, overrides, { trusted }), [data.rows, overrides, trusted]);
  const visible = menus.filter(menu => menu.menu.toLowerCase().includes(search.trim().toLowerCase()) && (statusFilter === 'All' || menu.status === statusFilter));
  const selected = menus.find(menu => menu.menu === selectedMenu);
  const categories = selected ? [...new Set(selected.items.map(item => item.category))] : [];
  const exportPackage = async chosen => {
    setExporting(true); setExportError('');
    try {
      const { downloadWeighPayPackage } = await import('./weighPayExport.js');
      await downloadWeighPayPackage(chosen, { source: data.source, loadedAt: data.loadedAt, trusted, sourceMessage: data.message });
    } catch (error) { setExportError(`Export failed: ${error.message}`); }
    finally { setExporting(false); }
  };
  return <section className="space-y-4" aria-label="Weigh & Pay guidance">
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">Weigh &amp; Pay guidance</h2><p className="mt-1 text-sm text-slate-600">$11.99/lb · 40% item food cost · 60% of menu items must pass</p></div>
        <div className="flex flex-wrap gap-2"><button className={button} disabled={data.state === 'loading'} onClick={() => setReload(value => value + 1)}>Refresh data</button><button className={button} disabled={!menus.length || exporting} onClick={() => exportPackage(menus)}>{exporting ? 'Preparing package…' : 'Export all menus'}</button></div>
      </div>
      {data.state === 'ready' && <p className={`mt-3 text-xs ${trusted ? 'text-slate-500' : 'font-semibold text-amber-800'}`}>{trusted ? `Shared Supabase data · ${data.source}` : `Fallback data — reference only · ${data.source}`} · Read {new Date(data.loadedAt).toLocaleString()}{data.message ? ` · ${data.message}` : ''}</p>}
      <details className="mt-3 text-sm text-slate-600"><summary className="cursor-pointer font-semibold">Rules &amp; calculation</summary><p className="mt-2">W&amp;P food cost = stored true cost ÷ (stored portion weight in lb × $11.99). Missing cost/weight and blocked items remain in the denominator; duplicate item identities within each menu count once. A menu pass covers only its allowed assortment and does not predict aggregate café food cost.</p><p className="mt-2">Seafood, lamb/veal, steak/whole-muscle beef, pork tenderloin, handhelds, soup by volume and non-core add-ons stay off W&amp;P. Ground beef and complete guest builds require Culinary validation. Rules use stored categories and item names; review incomplete or ambiguous classifications before service.</p></details>
    </div>
    {data.state === 'loading' && <p role="status" className="p-4 text-sm">Loading current shared menu data…</p>}
    {data.state === 'error' && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-900">{data.message}</p>}
    {exportError && <p role="alert" className="text-rose-800">{exportError}</p>}
    {data.state === 'ready' && <>
      <div className="flex flex-wrap gap-2"><input aria-label="Search W&P menus" className={`${input} flex-1`} placeholder="Search all menus" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter W&P status" className={input} value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>{['All', 'Pass', 'Conditional', 'Fail'].map(status => <option key={status}>{status}</option>)}</select></div>
      <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-xs text-slate-600"><tr><th className="p-3">Menu</th><th className="p-3">Guidance</th><th className="p-3">Allowed / Total</th><th className="p-3">Pass rate</th><th className="p-3">Needs inputs</th></tr></thead><tbody>{visible.map(menu => <tr key={menu.menu} data-testid="wp-menu-row" className={`border-t border-slate-100 ${menu.menu === selectedMenu ? 'bg-emerald-50/50' : ''}`}><td className="p-3"><button className="text-left font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4" onClick={() => { setSelectedMenu(menu.menu); setEditing(false); }}>{menu.menu}</button></td><td className="p-3"><Badge status={menu.status} testId="wp-menu-status" /></td><td className="p-3 whitespace-nowrap">{menu.allowed} / {menu.total}</td><td className="p-3">{percent(menu.passRate)}</td><td className="p-3">{menu.missing}</td></tr>)}</tbody></table>
        {!visible.length && <p className="p-4 text-sm text-slate-500">{menus.length ? 'No menus match these filters.' : 'No menu items are available in the current source.'}</p>}
      </div>
      {!selected && menus.length > 0 && <p className="text-sm text-slate-500">Select a menu to see its assortment by category.</p>}
      {selected && <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{selected.menu}</h2><p className="mt-1 text-sm text-slate-600">Calculated {percent(selected.calculatedPassRate)} · Current guidance {percent(selected.passRate)} · {selected.exceptions} exceptions</p></div><div className="flex flex-wrap gap-2"><button className={button} onClick={() => setEditing(value => !value)}>{editing ? 'Done editing' : 'Edit guidance'}</button><button className={button} disabled={exporting} onClick={() => exportPackage([selected])}>Export menu package</button></div></div>
        {selected.status === 'Conditional' && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Conditional: check unresolved inputs, service reviews, session exceptions or source status before using this assortment.</p>}
        {editing && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Changes apply to this session and exports only. Refreshing data or leaving W&amp;P clears them. Allowing an exception requires valid cost and weight; it never hides the calculated result.</p>}
        {categories.map(category => <section key={category}><h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">{category}</h3><div className="space-y-2">{selected.items.filter(item => item.category === category).map(item => <ItemRow key={item.key} item={item} editing={editing} onApply={override => setOverrides(previous => { const next = { ...previous }; if (override) next[item.key] = override; else delete next[item.key]; return next; })} />)}</div></section>)}
      </div>}
    </>}
  </section>;
}

function ItemRow({ item, editing, onApply }) {
  const [decision, setDecision] = useState('calculated');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setDecision(item.override?.decision || 'calculated'); setReason(item.override?.reason || ''); setError(''); }, [item.override?.decision, item.override?.reason, editing]);
  const apply = () => {
    if (decision !== 'calculated' && !reason.trim()) return setError('Enter a reason for this override.');
    if (decision === 'allow' && (item.missingCost || item.missingWeight)) return setError('Valid cost and weight are required before allowing an item.');
    onApply(decision === 'calculated' ? null : { decision, reason: reason.trim() });
    setError('');
  };
  return <article data-testid="wp-item-row" className="rounded-xl border border-slate-200 p-3">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h4 className="font-semibold break-words">{item.item}</h4><p className="mt-1 text-xs text-slate-500">MRN {item.mrn || '—'} · {item.weightOz == null ? 'Needs weight' : `${Number(item.weightOz.toFixed(3))} oz`} · True cost {money(item.cost)}</p></div><Badge status={item.status} /></div>
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm"><span>W&amp;P FC <strong>{percent(item.foodCost)}</strong></span><span>Cost/lb <strong>{money(item.costPerLb)}</strong></span><span>Margin/lb <strong>{money(item.marginPerLb)}</strong></span></div>
    {(item.reasons.length > 0 || item.reviews.length > 0) && <p className="mt-2 text-xs text-slate-600">{[...item.reasons, ...item.reviews].join(' · ')}</p>}
    {item.override && <p className="mt-2 text-xs text-amber-900">Calculated: {item.calculatedStatus} · Override: {item.override.reason}</p>}
    {editing && <div className="mt-3 flex flex-wrap items-center gap-2"><select className={input} aria-label={`Decision for ${item.item}`} value={decision} onChange={event => setDecision(event.target.value)}><option value="calculated">Use calculated result</option><option value="allow">Allow exception</option><option value="block">Block item</option></select><input className={`${input} flex-1`} aria-label={`Reason for ${item.item}`} placeholder="Reason required for override" maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /><button className={button} onClick={apply}>Apply</button>{error && <p role="alert" className="w-full text-xs text-rose-700">{error}</p>}</div>}
  </article>;
}
