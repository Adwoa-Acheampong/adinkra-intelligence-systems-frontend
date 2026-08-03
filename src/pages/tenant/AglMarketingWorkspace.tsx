import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CircleDollarSign,
  Eye,
  Filter,
  Megaphone,
  MousePointerClick,
  Pause,
  Pencil,
  Play,
  Plus,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglCommunicationsWorkflow, type CampaignInput } from '../../erp/agl/communicationsWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });
const platforms = ['All platforms', 'Facebook', 'Instagram', 'TikTok', 'Google', 'WhatsApp', 'Radio', 'Outdoor', 'Referral'];
const today = () => new Date().toISOString().slice(0, 10);
const inThirtyDays = () => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

export const AglMarketingWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [revision, setRevision] = useState(0);
  const [platform, setPlatform] = useState('All platforms');
  const [status, setStatus] = useState('All statuses');
  const [editing, setEditing] = useState<AglOperationalRecord | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const campaigns = useMemo(() => aglCommunicationsWorkflow.campaigns(), [revision]);
  const visible = campaigns.filter((item) =>
    (platform === 'All platforms' || item.platform === platform)
    && (status === 'All statuses' || item.status === status));
  const active = visible.filter((item) => item.status === 'Active');
  const totals = visible.reduce((result, item) => ({
    spend: result.spend + num(item.spendGhs),
    impressions: result.impressions + num(item.impressions),
    clicks: result.clicks + num(item.clicks),
    conversions: result.conversions + num(item.conversions),
    revenue: result.revenue + num(item.attributedRevenueGhs),
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cvr = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;
  const roas = totals.spend ? totals.revenue / totals.spend : 0;
  const netContribution = totals.revenue - totals.spend;

  const run = (operation: () => unknown, confirmation: string) => {
    setError('');
    try {
      operation();
      setNotice(confirmation);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The campaign operation could not be completed.');
      return false;
    }
  };
  const move = (record: AglOperationalRecord, nextStatus: string) => run(() => aglErpRepository.changeStatus({
    moduleId: 'campaigns', recordId: record.id, actorName: actor.name, actorRole: actor.role, status: nextStatus, values: {},
  }), `${String(record.name)} moved to ${nextStatus}.`);

  return (
    <div className="mx-auto max-w-[1700px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><Megaphone size={13} /> {tenant.id.toUpperCase()} ERP / MARKETING</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">Campaign operations</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Plan and control automotive campaigns, retain the funnel evidence, and post campaign spend into the operating records.</p>
        </div>
        <button onClick={() => setEditing(null)} className="flex min-h-11 items-center gap-2 rounded-lg bg-cyan-300 px-5 text-xs font-semibold text-black"><Plus size={14} /> New campaign</button>
      </header>

      {(notice || error) && <Message value={error || notice} error={Boolean(error)} onClose={() => { setNotice(''); setError(''); }} />}

      <section aria-label="Campaign summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={<Megaphone size={14} />} label="Active" value={active.length} detail={`${visible.length} in view`} />
        <Metric icon={<CircleDollarSign size={14} />} label="Spend" value={money.format(totals.spend)} detail="Posted campaign cost" danger />
        <Metric icon={<Eye size={14} />} label="Impressions" value={compact(totals.impressions)} detail="Verified reach" />
        <Metric icon={<MousePointerClick size={14} />} label="Clicks" value={compact(totals.clicks)} detail={`${ctr.toFixed(2)}% CTR`} />
        <Metric icon={<Target size={14} />} label="Conversions" value={compact(totals.conversions)} detail={`${cvr.toFixed(2)}% CVR`} />
        <Metric icon={<TrendingUp size={14} />} label="ROAS" value={`${roas.toFixed(2)}×`} detail={`${money.format(totals.revenue)} attributed`} positive={roas >= 3} />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Impact label="Ad spend (cost)" value={`− ${money.format(totals.spend)}`} tone="red" />
        <Impact label="Attributed revenue" value={`+ ${money.format(totals.revenue)}`} tone="green" />
        <Impact label="Net contribution" value={`${netContribution >= 0 ? '+' : '−'} ${money.format(Math.abs(netContribution))}`} tone={netContribution >= 0 ? 'green' : 'red'} />
      </section>

      <section className="rounded-xl border border-white/[0.08] bg-[#090909]">
        <div className="border-b border-white/[0.07] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {platforms.map((item) => <button key={item} onClick={() => setPlatform(item)} className={`min-h-9 rounded-full border px-3 text-[9px] transition ${platform === item ? 'border-cyan-300/30 bg-cyan-300 text-black' : 'border-white/[0.08] text-gray-500 hover:text-white'}`}>{item}</button>)}
            <label className="ml-auto flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-500"><Filter size={12} /><select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-[#090909] text-gray-300 outline-none"><option>All statuses</option><option>Draft</option><option>Active</option><option>Paused</option><option>Completed</option></select></label>
          </div>
        </div>
        <div className="custom-scrollbar overflow-x-auto">
          <table className="min-w-[1280px] w-full text-left text-[10px]">
            <thead className="border-b border-white/[0.07] font-mono text-[8px] uppercase tracking-wider text-gray-600"><tr><th className="px-4 py-3">Campaign</th><th className="px-4 py-3">Platform</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Spend</th><th className="px-4 py-3">Impressions</th><th className="px-4 py-3">Clicks / CTR</th><th className="px-4 py-3">Conversions / CVR</th><th className="px-4 py-3">CPA</th><th className="px-4 py-3">Revenue</th><th className="px-4 py-3">ROAS</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody>{visible.map((item) => {
              const itemSpend = num(item.spendGhs); const itemClicks = num(item.clicks); const conversions = num(item.conversions);
              return <tr key={item.id} className="border-b border-white/[0.06] text-gray-300 hover:bg-white/[0.015]">
                <td className="px-4 py-4"><strong className="block text-white">{String(item.name)}</strong><span className="mt-1 block font-mono text-[8px] text-cyan-300/70">{item.id} · {String(item.objective ?? '')}</span></td>
                <td className="px-4 py-4">{String(item.platform ?? '—')}</td><td className="px-4 py-4"><Status value={item.status} /></td><td className="px-4 py-4 text-red-200">{money.format(itemSpend)}</td><td className="px-4 py-4">{compact(num(item.impressions))}</td><td className="px-4 py-4">{compact(itemClicks)} <span className="text-gray-600">· {num(item.ctr).toFixed(2)}%</span></td><td className="px-4 py-4">{compact(conversions)} <span className="text-gray-600">· {num(item.conversionRate).toFixed(2)}%</span></td><td className="px-4 py-4">{money.format(conversions ? itemSpend / conversions : 0)}</td><td className="px-4 py-4 text-emerald-200">{money.format(num(item.attributedRevenueGhs))}</td><td className="px-4 py-4 font-semibold text-white">{num(item.roas).toFixed(2)}×</td>
                <td className="px-4 py-4"><div className="flex gap-1"><button onClick={() => setEditing(item)} className="rounded border border-white/[0.08] p-2 text-gray-400" aria-label={`Edit ${String(item.name)}`}><Pencil size={11} /></button>{item.status === 'Active' ? <button onClick={() => move(item, 'Paused')} className="rounded border border-amber-300/20 p-2 text-amber-200" aria-label="Pause"><Pause size={11} /></button> : item.status === 'Paused' || item.status === 'Draft' ? <button onClick={() => move(item, 'Active')} className="rounded border border-emerald-300/20 p-2 text-emerald-200" aria-label="Activate"><Play size={11} /></button> : null}</div></td>
              </tr>;
            })}{!visible.length && <tr><td colSpan={11} className="px-4 py-14 text-center text-gray-700">No campaigns match this channel and state.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      {editing !== undefined && <CampaignDialog record={editing} onClose={() => setEditing(undefined)} onSave={(values) => {
        const ok = run(() => editing ? aglCommunicationsWorkflow.updateCampaign(actor, editing, values) : aglCommunicationsWorkflow.createCampaign(actor, values), editing ? 'Campaign changes saved.' : 'Campaign created and spend posted.');
        if (ok) setEditing(undefined);
      }} />}
    </div>
  );
};

const CampaignDialog = ({ record, onClose, onSave }: { record: AglOperationalRecord | null; onClose: () => void; onSave: (values: CampaignInput) => void }) => {
  const [values, setValues] = useState<CampaignInput>(() => ({
    name: String(record?.name ?? ''), platform: String(record?.platform ?? 'Facebook'), objective: String(record?.objective ?? 'Workshop bookings'), startDate: String(record?.startDate ?? today()), endDate: String(record?.endDate ?? inThirtyDays()), spendGhs: num(record?.spendGhs), impressions: num(record?.impressions), clicks: num(record?.clicks), conversions: num(record?.conversions), attributedRevenueGhs: num(record?.attributedRevenueGhs), owner: String(record?.owner ?? actor.name), notes: String(record?.notes ?? ''),
  }));
  const setNumber = (key: keyof CampaignInput, value: string) => setValues({ ...values, [key]: Number(value) });
  return <div role="dialog" aria-modal="true" className="custom-scrollbar fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="my-4 w-full max-w-3xl rounded-xl border border-white/[0.12] bg-[#090909] shadow-2xl"><header className="sticky top-0 z-10 flex items-start justify-between border-b border-white/[0.08] bg-[#090909] p-5"><div><div className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">Campaign control</div><h2 className="mt-2 text-xl text-white">{record ? 'Edit campaign' : 'New campaign'}</h2></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><X size={14} /></button></header><form onSubmit={(event) => { event.preventDefault(); onSave(values); }} className="grid gap-4 p-5 md:grid-cols-2">
    <Field label="Campaign name" wide><input required value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></Field>
    <Field label="Platform"><select value={values.platform} onChange={(event) => setValues({ ...values, platform: event.target.value })}>{platforms.slice(1).map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Objective"><select value={values.objective} onChange={(event) => setValues({ ...values, objective: event.target.value })}><option>Workshop bookings</option><option>Parts sales</option><option>Fleet diagnostics</option><option>Service retention</option><option>Brand awareness</option><option>Lead generation</option></select></Field>
    <Field label="Start date"><input type="date" value={values.startDate} onChange={(event) => setValues({ ...values, startDate: event.target.value })} /></Field><Field label="End date"><input type="date" value={values.endDate} onChange={(event) => setValues({ ...values, endDate: event.target.value })} /></Field>
    <Field label="Spend (GHS)"><input type="number" min="0" value={values.spendGhs || ''} onChange={(event) => setNumber('spendGhs', event.target.value)} /></Field><Field label="Attributed revenue (GHS)"><input type="number" min="0" value={values.attributedRevenueGhs || ''} onChange={(event) => setNumber('attributedRevenueGhs', event.target.value)} /></Field>
    <Field label="Impressions"><input type="number" min="0" value={values.impressions || ''} onChange={(event) => setNumber('impressions', event.target.value)} /></Field><Field label="Clicks"><input type="number" min="0" value={values.clicks || ''} onChange={(event) => setNumber('clicks', event.target.value)} /></Field><Field label="Conversions"><input type="number" min="0" value={values.conversions || ''} onChange={(event) => setNumber('conversions', event.target.value)} /></Field><Field label="Owner"><input value={values.owner} onChange={(event) => setValues({ ...values, owner: event.target.value })} /></Field>
    <Field label="Operating notes" wide><textarea value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></Field>
    <button className="min-h-11 rounded-lg bg-cyan-300 text-xs font-semibold text-black md:col-span-2">{record ? 'Save campaign' : 'Create and activate campaign'}</button>
  </form></section></div>;
};

const Field = ({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactElement }) => <label className={wide ? 'md:col-span-2' : ''}><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="mt-2 [&>input]:h-11 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-white/[0.08] [&>input]:bg-black/25 [&>input]:px-3 [&>input]:text-xs [&>input]:text-white [&>select]:h-11 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-white/[0.08] [&>select]:bg-[#050505] [&>select]:px-3 [&>select]:text-xs [&>select]:text-white [&>textarea]:min-h-24 [&>textarea]:w-full [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:border-white/[0.08] [&>textarea]:bg-black/25 [&>textarea]:p-3 [&>textarea]:text-xs [&>textarea]:text-white">{children}</div></label>;
const Metric = ({ icon, label, value, detail, danger = false, positive = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; detail: string; danger?: boolean; positive?: boolean }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className={`flex items-center gap-2 ${danger ? 'text-red-300' : positive ? 'text-emerald-300' : 'text-cyan-300'}`}>{icon}<span className="font-mono text-[8px] uppercase tracking-wider">{label}</span></div><div className="mt-3 truncate text-xl font-display text-white">{value}</div><p className="mt-1 truncate text-[9px] text-gray-600">{detail}</p></article>;
const Impact = ({ label, value, tone }: { label: string; value: string; tone: 'red' | 'green' }) => <article className={`rounded-xl border p-4 ${tone === 'green' ? 'border-emerald-300/20 bg-emerald-300/[0.04]' : 'border-red-300/20 bg-red-300/[0.04]'}`}><div className={`font-mono text-[8px] uppercase tracking-wider ${tone === 'green' ? 'text-emerald-300' : 'text-red-300'}`}>{label}</div><div className={`mt-2 text-lg font-semibold ${tone === 'green' ? 'text-emerald-100' : 'text-red-100'}`}>{value}</div></article>;
const Status = ({ value }: { value: unknown }) => <span className={`rounded-full border px-2 py-1 font-mono text-[8px] uppercase ${value === 'Active' ? 'border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200' : value === 'Paused' ? 'border-amber-300/20 bg-amber-300/[0.05] text-amber-200' : 'border-white/[0.08] text-gray-500'}`}>{String(value)}</span>;
const Message = ({ value, error, onClose }: { value: string; error: boolean; onClose: () => void }) => <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-300/20 bg-red-300/[0.05] text-red-200' : 'border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200'}`}><span className="flex items-center gap-2">{error ? <X size={14} /> : <Check size={14} />}{value}</span><button onClick={onClose} aria-label="Dismiss"><X size={13} /></button></div>;
const num = (value: unknown) => Number(value ?? 0) || 0;
const compact = (value: number) => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
