import React, { useEffect, useMemo, useState } from 'react';
import { pricePerLb, WP_PRICE_PER_LB } from './weighPayModel.js';

import andesSource from '../../data/andesWpAnalysis.json';
import baltiSource from '../../data/baltiWpAnalysis.json';
import allMenusSource from '../../data/allMenusWpAnalysis.json';
import { buildMenuAnalysisSource } from './menuAnalysisSource.js';
import WpPortfolio, { EnterpriseOverview } from './WpPortfolio.jsx';
import WpMenuPicker from './WpMenuPicker.jsx';
import { includeWpMenu } from './wpPortfolioModel.js';
import { panReadyMenu, assessPanReadyMenu } from './panReadyModel.js';


const button = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50';
const input = 'min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm';
const percent = value => value == null ? '—' : `${(value * 100).toFixed(1)}%`;
const money = value => value == null ? '—' : `$${value.toFixed(2)}`;
function Badge({ status, testId }) {
  const color = status === 'Pass' || status === 'Allowed' ? 'bg-emerald-50 text-emerald-800' : /Fail|Blocked/.test(status) ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-900';
  return <span data-testid={testId} className={`inline-flex rounded-lg px-2 py-1 text-xs font-bold ${color}`}>{status}</span>;
}

export default function WeighPayView() {
  const [rateText, setRateText] = useState((WP_PRICE_PER_LB/16).toFixed(2));
  const [rateUnit, setRateUnit] = useState('oz');
  const rate = pricePerLb(rateText, rateUnit);
  const [data, setData] = useState({ state: 'loading', rows: [], source: '', loadedAt: '', message: '' });
  const [reload, setReload] = useState(0);
  const [selectedMenus, setSelectedMenus] = useState([]);

  const [approvalFilter, setApprovalFilter] = useState('all');
  const [editing, setEditing] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 45000);
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
  const menuNames=useMemo(()=>[...new Set(data.rows.map(row=>String(row.menu||'Unassigned menu')))].filter(includeWpMenu), [data.rows]);
  const activeMenus = selectedMenus.filter(name => menuNames.includes(name));
  const selectedMenu = activeMenus.length === 1 ? activeMenus[0] : '';
  const conceptSources=useMemo(()=>Object.fromEntries(menuNames.map(menu=>[menu,buildMenuAnalysisSource(menu,data.rows,{'AMZ: Andes':andesSource,'AMZ: Balti':baltiSource}[menu]||allMenusSource,trusted)])),[menuNames,data.rows,trusted]);
  const projections = useMemo(() => Object.values(conceptSources).map(source=>panReadyMenu(source,rate,trusted?data.rows:[])),[conceptSources,rate,trusted,data.rows]);
  const menus = useMemo(() => projections.map(p=>assessPanReadyMenu(p,rate,trusted,overrides)),[projections,overrides,trusted,rate]);
  const selected = menus.find(menu => menu.menu === selectedMenu);
  const categories = selected ? [...new Set(selected.items.map(item => item.category))] : [];
  const exportPackage = async chosen => {
    setExporting(true); setExportError('');
    try {
      const { downloadWeighPayPackage } = await import('./weighPayExport.js');
      await downloadWeighPayPackage(chosen, { source: data.source, loadedAt: data.loadedAt, trusted, sourceMessage: data.message, pricePerLb: rate, conceptAnalyses: Object.fromEntries(projections.map(p=>[p.menu,p.items])), classificationReviews: Object.fromEntries(projections.map(p=>[p.menu,p.review])) });
    } catch (error) { setExportError(`Export failed: ${error.message}`); }
    finally { setExporting(false); }
  };
  const exportPortfolio = async rows => {
    setExporting(true); setExportError('');
    try {
      const { downloadWeighPayPackage } = await import('./weighPayExport.js');
      await downloadWeighPayPackage([], {source:data.source,loadedAt:data.loadedAt,trusted,pricePerLb:rate,portfolioRows:rows});
    } catch(error) {setExportError(`Export failed: ${error.message}`);}
    finally {setExporting(false);}
  };
  return <section className="space-y-4 pb-24 md:pb-0" aria-label="Weigh & Pay guidance">
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">Weigh &amp; Pay guidance</h2><p className="mt-1 text-sm text-slate-600">{money(rate)}/lb · 40% item food cost · 60% of servable components must pass</p></div>
        <div className="flex flex-wrap gap-2"><button className={button} disabled={data.state === 'loading'} onClick={() => setReload(value => value + 1)}>Refresh data</button><button className={button} disabled={!menus.length || exporting || !rate} onClick={() => exportPackage(menus)}>{exporting ? 'Preparing package…' : 'Export all menus'}</button></div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><label className="text-sm font-semibold" htmlFor="wp-price">W&amp;P selling price</label><input id="wp-price" aria-label="W&P selling price" className={`${input} w-28`} type="number" min="0.000001" step="any" value={rateText} onChange={e=>setRateText(e.target.value)}/><select aria-label="W&P price unit" className={input} value={rateUnit} onChange={e=>{const unit=e.target.value;setRateText(rate==null?'':String(unit==='oz'?rate/16:rate));setRateUnit(unit);}}><option value="lb">$/lb</option><option value="oz">$/oz</option></select><span className="text-xs text-slate-500">Session scenario · {rate==null?'Enter a positive price':`${money(rate)}/lb · $${(rate/16).toFixed(4)}/oz`}</span></div>
      {!rate&&<p role="alert" className="mt-2 text-sm text-amber-800">Enter a positive selling price to calculate or export guidance.</p>}
      {data.state === 'ready' && <p className={`mt-3 text-xs ${trusted ? 'text-slate-500' : 'font-semibold text-amber-800'}`}>{trusted ? `Shared Supabase data · ${data.source}` : `Fallback data — reference only · ${data.source}`} · Read {new Date(data.loadedAt).toLocaleString()}{data.message ? ` · ${data.message}` : ''}</p>}
      <details className="mt-3 text-sm text-slate-600"><summary className="cursor-pointer font-semibold">Rules &amp; calculation</summary><p className="mt-2">True Food Cost = stored true cost / (stored portion weight in lb multiplied by the selected selling price). Missing cost/weight and blocked items remain in the denominator; identical servable component variants within each menu count once. A menu pass covers only its allowed assortment and does not predict aggregate café food cost.</p><p className="mt-2">Seafood, lamb/veal, steak/whole-muscle beef, pork tenderloin, handhelds, soup by volume and non-core add-ons stay off W&amp;P. Ground beef and complete guest builds require Culinary validation. Rules use stored categories and item names; review incomplete or ambiguous classifications before service.</p></details>
    </div>

    {data.state === 'loading' && <p role="status" className="p-4 text-sm">Loading current shared menu data…</p>}
    {data.state === 'error' && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-900">{data.message}</p>}
    {exportError && <p role="alert" className="text-rose-800">{exportError}</p>}
    {data.state === 'ready' && <>
      <EnterpriseOverview projections={projections} trusted={trusted} rate={rate}/>
      <WpMenuPicker projections={projections} selectedMenus={activeMenus} trusted={trusted} onChange={names=>{setSelectedMenus(names);setEditing(false);setApprovalFilter('all');}}/>
      <WpPortfolio catalogProjections={projections} projections={projections.filter(p=>!activeMenus.length||activeMenus.includes(p.menu))} trusted={trusted} rate={rate} onExport={exportPortfolio} exporting={exporting}/>
      {selected&&<p className="text-sm text-slate-600">{selected.menu} - {selected.allowed}/{selected.total} allowed components - {percent(selected.passRate)} - {selected.status}</p>}
      {selected && conceptSources[selected.menu] && <div className="space-y-3"><button className={button} disabled={exporting||!rate} onClick={()=>exportPackage(menus.filter(m=>m.menu===selected.menu))}>Export menu package</button></div>}
      {selected && !['AMZ: Andes','AMZ: Balti'].includes(selected.menu) && <details key={`adjustments:${selected.menu}`} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4"><summary className="cursor-pointer text-sm font-semibold text-teal-800">Servable component guidance and session adjustments</summary>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{selected.menu}</h2><p className="mt-1 text-sm text-slate-600">Calculated {percent(selected.calculatedPassRate)} · Current guidance {percent(selected.passRate)} · {selected.exceptions} exceptions</p></div><div className="flex flex-wrap gap-2"><button className={button} onClick={() => setEditing(value => !value)}>{editing ? 'Done editing' : 'Edit guidance'}</button><button className={button} disabled={exporting || !rate} onClick={() => exportPackage(menus.filter(m=>m.menu===selected.menu))}>Export shared guidance</button></div></div>
        {selected.status === 'Conditional' && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Conditional: check unresolved inputs, service reviews, session exceptions or source status before using this assortment.</p>}
        {editing && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Changes apply to this session and exports only. Refreshing data or leaving W&amp;P clears them. Allowing an exception requires valid cost and weight; it never hides the calculated result.</p>}
        <div className="flex flex-wrap gap-2" aria-label="Component approval filters">{[['approved','Show only approved components'],['unapproved','Show only unapproved components']].map(([value,label])=><button key={value} className={button} aria-pressed={approvalFilter===value} onClick={()=>setApprovalFilter(approvalFilter===value?'all':value)}>{label}</button>)}<button className={button} onClick={()=>{setApprovalFilter('all');}}>Clear filter</button></div>
        <p className="text-xs text-slate-500">Approved filter shows Allowed guidance, including explicit session exceptions. Culinary service approval remains separate.</p>
        {categories.map(category => <section key={category}><h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">{category}</h3><div className="space-y-2">{selected.items.filter(item => item.category === category && (approvalFilter==='all'||(approvalFilter==='approved'?item.status.startsWith('Allowed'):!item.status.startsWith('Allowed')))).map(item => <ItemRow key={item.key} item={item} editing={editing} onApply={override => setOverrides(previous => { const next = { ...previous }; if (override) next[item.key] = override; else delete next[item.key]; return next; })} />)}</div></section>)}
      </details>}
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
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm"><span>True Food Cost <strong>{percent(item.foodCost)}</strong></span><span>Cost/lb <strong>{money(item.costPerLb)}</strong></span><span>Margin/lb <strong>{money(item.marginPerLb)}</strong></span></div>
    {(item.reasons.length > 0 || item.reviews.length > 0) && <p className="mt-2 text-xs text-slate-600">{[...item.reasons, ...item.reviews].join(' · ')}</p>}
    {item.override && <p className="mt-2 text-xs text-amber-900">Calculated: {item.calculatedStatus} · Override: {item.override.reason}</p>}
    {editing && <div className="mt-3 flex flex-wrap items-center gap-2"><select className={input} aria-label={`Decision for ${item.item}`} value={decision} onChange={event => setDecision(event.target.value)}><option value="calculated">Use calculated result</option><option value="allow">Allow exception</option><option value="block">Block item</option></select><input className={`${input} flex-1`} aria-label={`Reason for ${item.item}`} placeholder="Reason required for override" maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /><button className={button} onClick={apply}>Apply</button>{error && <p role="alert" className="w-full text-xs text-rose-700">{error}</p>}</div>}
  </article>;
}
