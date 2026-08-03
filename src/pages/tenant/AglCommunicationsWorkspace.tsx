import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  CircleDollarSign,
  ContactRound,
  Eye,
  EyeOff,
  Mail,
  Megaphone,
  MessageCircle,
  Plus,
  Send,
  Target,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglErpRepository } from '../../erp/agl/repository';
import { aglCommunicationsWorkflow, type CampaignInput } from '../../erp/agl/communicationsWorkflow';

type ModuleId = 'campaigns' | 'promotions' | 'leads' | 'marketing-spend' | 'reminders' | 'notifications';
const actor = { name: 'AGL Admin', role: 'Administrator' };
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

export const AglCommunicationsWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: ModuleId }) => {
  const [version, setVersion] = useState(0);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  const run = (work: () => unknown, message: string) => {
    try {
      work();
      setFeedback(message);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The operation could not be completed.');
    }
  };
  const common = { version, run };
  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="border-b border-white/[0.08] pb-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{tenant.id.toUpperCase()} ERP / CUSTOMER GROWTH & COMMUNICATIONS</div>
        <h1 className="mt-3 text-3xl font-display font-semibold text-white">{titles[moduleId]}</h1>
        <p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">{descriptions[moduleId]}</p>
      </header>
      {feedback && <div className="flex items-center justify-between rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] px-4 py-3 text-xs text-cyan-100"><span className="flex items-center gap-2"><Check size={14} />{feedback}</span><button onClick={() => setFeedback('')} aria-label="Dismiss"><X size={13} /></button></div>}
      {moduleId === 'campaigns' && <Campaigns {...common} />}
      {moduleId === 'promotions' && <Promotions {...common} />}
      {moduleId === 'leads' && <Leads {...common} />}
      {moduleId === 'marketing-spend' && <MarketingSpend version={version} />}
      {moduleId === 'reminders' && <Reminders {...common} />}
      {moduleId === 'notifications' && <Notifications {...common} />}
    </div>
  );
};

const Campaigns = ({ version, run }: WorkspaceProps) => {
  const campaigns = useMemo(() => aglErpRepository.list('campaigns'), [version]);
  const [open, setOpen] = useState(false);
  const totals = campaigns.reduce((sum, item) => ({
    spend: sum.spend + Number(item.spendGhs ?? 0),
    revenue: sum.revenue + Number(item.attributedRevenueGhs ?? item.amount ?? 0),
    conversions: sum.conversions + Number(item.conversions ?? 0),
    impressions: sum.impressions + Number(item.impressions ?? 0),
  }), { spend: 0, revenue: 0, conversions: 0, impressions: 0 });
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<CircleDollarSign size={15} />} label="Committed spend" value={money.format(totals.spend)} detail="Posted into marketing spend" />
      <Metric icon={<Target size={15} />} label="Attributed revenue" value={money.format(totals.revenue)} detail={`${totals.spend ? (totals.revenue / totals.spend).toFixed(2) : '0.00'}× portfolio ROAS`} />
      <Metric icon={<ContactRound size={15} />} label="Conversions" value={totals.conversions.toLocaleString()} detail="Accepted campaign outcomes" />
      <Metric icon={<Eye size={15} />} label="Impressions" value={totals.impressions.toLocaleString()} detail={`${campaigns.length} governed campaigns`} />
    </section>
    <div className="flex justify-end"><button onClick={() => setOpen((value) => !value)} className="flex min-h-10 items-center gap-2 rounded-lg bg-cyan-300 px-4 text-[10px] font-semibold text-black"><Plus size={13} /> New campaign</button></div>
    {open && <CampaignForm onSubmit={(values) => run(() => aglCommunicationsWorkflow.createCampaign(actor, values), 'Campaign created; spend posted to Finance and the audit trail.')} />}
    <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909]">
      <table className="w-full min-w-[1000px] text-left text-[10px]"><thead className="border-b border-white/[0.08] bg-black/30 text-gray-600"><tr>{['Campaign', 'Platform', 'Objective', 'Period', 'Spend', 'Funnel', 'Revenue', 'ROAS', 'State'].map((head) => <th key={head} className="px-4 py-3 font-normal uppercase tracking-wider">{head}</th>)}</tr></thead>
        <tbody>{campaigns.map((item) => <tr key={item.id} className="border-b border-white/[0.06] text-gray-300"><td className="px-4 py-4"><strong className="block text-white">{String(item.name)}</strong><span className="font-mono text-[8px] text-gray-600">{item.id}</span></td><td className="px-4 py-4">{String(item.platform ?? '—')}</td><td className="px-4 py-4">{String(item.objective ?? '—')}</td><td className="px-4 py-4">{String(item.startDate ?? '—')} → {String(item.endDate ?? 'open')}</td><td className="px-4 py-4">{money.format(Number(item.spendGhs ?? 0))}</td><td className="px-4 py-4">{Number(item.impressions ?? 0).toLocaleString()} → {Number(item.clicks ?? 0).toLocaleString()} → {Number(item.conversions ?? 0).toLocaleString()}</td><td className="px-4 py-4 text-emerald-300">{money.format(Number(item.attributedRevenueGhs ?? item.amount ?? 0))}</td><td className="px-4 py-4">{Number(item.roas ?? 0).toFixed(2)}×</td><td className="px-4 py-4"><Status value={item.status} /></td></tr>)}</tbody>
      </table>
    </section>
  </>;
};

const CampaignForm = ({ onSubmit }: { onSubmit: (values: CampaignInput) => void }) => {
  const [values, setValues] = useState<CampaignInput>({ name: '', platform: 'Facebook', objective: 'Lead generation', startDate: today(), endDate: '', spendGhs: 0, impressions: 0, clicks: 0, conversions: 0, attributedRevenueGhs: 0, owner: 'Marketing lead', notes: '' });
  const set = (key: keyof CampaignInput, value: string | number) => setValues((current) => ({ ...current, [key]: value }));
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit(values); }} className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.03] p-5">
    <h2 className="flex items-center gap-2 text-sm text-white"><Megaphone size={15} className="text-cyan-300" /> Campaign operating record</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Campaign"><input value={values.name} onChange={(e) => set('name', e.target.value)} required /></Field>
      <Field label="Platform"><select value={values.platform} onChange={(e) => set('platform', e.target.value)}>{['Facebook', 'Instagram', 'TikTok', 'Google', 'WhatsApp', 'Radio', 'Outdoor', 'Referral'].map((value) => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Objective"><select value={values.objective} onChange={(e) => set('objective', e.target.value)}>{['Awareness', 'Lead generation', 'Bookings', 'Parts sales', 'Retention'].map((value) => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Owner"><input value={values.owner} onChange={(e) => set('owner', e.target.value)} /></Field>
      <Field label="Start"><input type="date" value={values.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
      <Field label="End"><input type="date" value={values.endDate} onChange={(e) => set('endDate', e.target.value)} /></Field>
      <Field label="Spend GHS"><input type="number" min="0" value={values.spendGhs} onChange={(e) => set('spendGhs', Number(e.target.value))} /></Field>
      <Field label="Attributed revenue GHS"><input type="number" min="0" value={values.attributedRevenueGhs} onChange={(e) => set('attributedRevenueGhs', Number(e.target.value))} /></Field>
      <Field label="Impressions"><input type="number" min="0" value={values.impressions} onChange={(e) => set('impressions', Number(e.target.value))} /></Field>
      <Field label="Clicks"><input type="number" min="0" value={values.clicks} onChange={(e) => set('clicks', Number(e.target.value))} /></Field>
      <Field label="Conversions"><input type="number" min="0" value={values.conversions} onChange={(e) => set('conversions', Number(e.target.value))} /></Field>
      <Field label="Notes"><input value={values.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
    </div><button className="mt-4 min-h-10 rounded-lg bg-cyan-300 px-5 text-[10px] font-semibold text-black">Activate campaign and post spend</button>
  </form>;
};

const Promotions = ({ version, run }: WorkspaceProps) => {
  const records = useMemo(() => aglErpRepository.list('promotions'), [version]);
  const campaigns = useMemo(() => aglErpRepository.list('campaigns'), [version]);
  const [values, setValues] = useState({ name: '', campaignId: campaigns[0]?.id ?? '', code: '', discount: 10, starts: today(), ends: '', owner: 'Sales manager' });
  return <>
    <form onSubmit={(event) => { event.preventDefault(); run(() => aglCommunicationsWorkflow.createPromotion(actor, values), 'Controlled promotion created.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Promotion"><input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required /></Field><Field label="Campaign"><select value={values.campaignId} onChange={(e) => setValues({ ...values, campaignId: e.target.value })}><option value="">Standalone</option>{campaigns.map((item) => <option key={item.id} value={item.id}>{String(item.name)}</option>)}</select></Field><Field label="Code"><input value={values.code} onChange={(e) => setValues({ ...values, code: e.target.value.toUpperCase() })} required /></Field><Field label="Discount %"><input type="number" value={values.discount} onChange={(e) => setValues({ ...values, discount: Number(e.target.value) })} /></Field><Field label="Starts"><input type="date" value={values.starts} onChange={(e) => setValues({ ...values, starts: e.target.value })} /></Field><Field label="Ends"><input type="date" value={values.ends} onChange={(e) => setValues({ ...values, ends: e.target.value })} /></Field><Field label="Owner"><input value={values.owner} onChange={(e) => setValues({ ...values, owner: e.target.value })} /></Field><button className="min-h-11 self-end rounded-lg bg-cyan-300 text-[10px] font-semibold text-black">Create promotion</button>
    </form>
    <CardGrid records={records} extra={(item) => <><Row label="Code" value={item.code ?? item.reference} /><Row label="Discount" value={`${Number(item.discount ?? item.amount ?? 0)}%`} /><Row label="Campaign" value={item.campaignId} /><Row label="Validity" value={`${String(item.starts ?? '—')} → ${String(item.ends ?? 'open')}`} /></>} />
  </>;
};

const Leads = ({ version, run }: WorkspaceProps) => {
  const records = useMemo(() => aglErpRepository.list('leads'), [version]);
  const [values, setValues] = useState({ name: '', contact: '', source: 'Walk-in', interest: '', owner: 'Sales advisor' });
  return <>
    <form onSubmit={(event) => { event.preventDefault(); run(() => aglCommunicationsWorkflow.createLead(actor, values), 'Lead captured and assigned.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="Prospect"><input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required /></Field><Field label="Contact"><input value={values.contact} onChange={(e) => setValues({ ...values, contact: e.target.value })} required /></Field><Field label="Source"><select value={values.source} onChange={(e) => setValues({ ...values, source: e.target.value })}>{['Walk-in', 'WhatsApp', 'Facebook', 'Referral', 'Website', 'Phone'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Interest"><input value={values.interest} onChange={(e) => setValues({ ...values, interest: e.target.value })} /></Field><button className="min-h-11 self-end rounded-lg bg-cyan-300 text-[10px] font-semibold text-black">Capture lead</button>
    </form>
    <section className="grid gap-3 lg:grid-cols-3">{['Pending', 'Approved', 'Completed'].map((stage) => <div key={stage} className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><h2 className="mb-4 flex items-center justify-between text-xs text-white"><span>{stage === 'Pending' ? 'New / contact due' : stage === 'Approved' ? 'Qualified / active' : 'Converted / closed'}</span><span className="font-mono text-gray-600">{records.filter((item) => item.status === stage).length}</span></h2><div className="space-y-3">{records.filter((item) => item.status === stage).map((item) => <article key={item.id} className="rounded-lg border border-white/[0.07] bg-black/25 p-4"><strong className="text-xs text-white">{String(item.name)}</strong><p className="mt-1 text-[9px] text-gray-500">{String(item.contact ?? '—')} · {String(item.source ?? '—')}</p><p className="mt-3 text-[10px] text-gray-400">{String(item.interest ?? item.notes ?? 'No interest recorded')}</p><div className="mt-3 flex gap-2">{stage !== 'Approved' && <button onClick={() => run(() => aglCommunicationsWorkflow.progressLead(actor, item.id, 'Approved'), `${item.id} qualified.`)} className="rounded border border-cyan-300/20 px-2 py-1 text-[8px] text-cyan-300">Qualify</button>}{stage !== 'Completed' && <button onClick={() => run(() => aglCommunicationsWorkflow.progressLead(actor, item.id, 'Completed'), `${item.id} closed.`)} className="rounded border border-emerald-300/20 px-2 py-1 text-[8px] text-emerald-300">Complete</button>}</div></article>)}</div></div>)}</section>
  </>;
};

const MarketingSpend = ({ version }: { version: number }) => {
  const rows = useMemo(() => aglErpRepository.list('marketing-spend'), [version]);
  const total = rows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  return <><Metric icon={<CircleDollarSign size={15} />} label="Marketing expense book" value={money.format(total)} detail={`${rows.length} source-linked entries`} /><SimpleTable records={rows} columns={['name', 'reference', 'category', 'date', 'amount', 'owner', 'status']} /></>;
};

const Reminders = ({ version, run }: WorkspaceProps) => {
  const templates = useMemo(() => aglErpRepository.list('reminder-templates'), [version]);
  const deliveries = useMemo(() => aglErpRepository.list('reminder-deliveries'), [version]);
  const customers = useMemo(() => aglErpRepository.list('customers'), [version]);
  const vehicles = useMemo(() => aglErpRepository.list('vehicles'), [version]);
  const [tab, setTab] = useState<'compose' | 'templates' | 'deliveries'>('compose');
  const [template, setTemplate] = useState({ name: '', category: 'Service due', channel: 'WhatsApp', body: 'Hello {{customer}}, {{vehicle}} is due for service at {{business}}.', owner: 'Customer care' });
  const [message, setMessage] = useState({ templateId: templates[0]?.id ?? '', customerId: customers[0]?.id ?? '', vehicleId: '', channel: 'WhatsApp' as const, body: '' });
  return <>
    <div className="flex gap-2">{(['compose', 'templates', 'deliveries'] as const).map((value) => <button key={value} onClick={() => setTab(value)} className={`rounded-lg px-4 py-2 text-[10px] capitalize ${tab === value ? 'bg-cyan-300 text-black' : 'border border-white/[0.08] text-gray-500'}`}>{value}</button>)}</div>
    {tab === 'compose' && <form onSubmit={(event) => { event.preventDefault(); run(() => aglCommunicationsWorkflow.sendReminder(actor, message), 'Reminder rendered, sent, and written to the delivery and notification logs.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2">
      <Field label="Customer"><select value={message.customerId} onChange={(e) => setMessage({ ...message, customerId: e.target.value })}>{customers.map((item) => <option key={item.id} value={item.id}>{String(item.name)}</option>)}</select></Field><Field label="Vehicle (optional)"><select value={message.vehicleId} onChange={(e) => setMessage({ ...message, vehicleId: e.target.value })}><option value="">No vehicle</option>{vehicles.map((item) => <option key={item.id} value={item.id}>{String(item.registration ?? item.name)}</option>)}</select></Field><Field label="Template"><select value={message.templateId} onChange={(e) => setMessage({ ...message, templateId: e.target.value })}><option value="">Manual message</option>{templates.map((item) => <option key={item.id} value={item.id}>{String(item.name)}</option>)}</select></Field><Field label="Channel"><select value={message.channel} onChange={(e) => setMessage({ ...message, channel: e.target.value as typeof message.channel })}>{['WhatsApp', 'SMS', 'Email', 'Phone'].map((value) => <option key={value}>{value}</option>)}</select></Field><div className="sm:col-span-2"><Field label="Override / manual message"><textarea value={message.body} onChange={(e) => setMessage({ ...message, body: e.target.value })} placeholder="Leave blank to use the selected template." /></Field></div><button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-300 text-[10px] font-semibold text-black sm:col-span-2"><Send size={13} /> Send now</button>
    </form>}
    {tab === 'templates' && <><form onSubmit={(event) => { event.preventDefault(); run(() => aglCommunicationsWorkflow.createTemplate(actor, template), 'Reminder template saved.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2"><Field label="Template name"><input value={template.name} onChange={(e) => setTemplate({ ...template, name: e.target.value })} /></Field><Field label="Category"><input value={template.category} onChange={(e) => setTemplate({ ...template, category: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Body"><textarea value={template.body} onChange={(e) => setTemplate({ ...template, body: e.target.value })} /></Field></div><button className="min-h-10 rounded-lg bg-cyan-300 text-[10px] font-semibold text-black">Save template</button></form><CardGrid records={templates} extra={(item) => <><Row label="Category" value={item.category} /><Row label="Channel" value={item.channel} /><p className="mt-3 text-[10px] leading-5 text-gray-400">{String(item.body ?? '')}</p></>} /></>}
    {tab === 'deliveries' && <SimpleTable records={deliveries} columns={['sentAt', 'name', 'channel', 'recipient', 'reference', 'status']} />}
  </>;
};

const Notifications = ({ version, run }: WorkspaceProps) => {
  const records = useMemo(() => aglErpRepository.list('notifications'), [version]);
  const unread = records.filter((item) => !item.read);
  return <>
    <section className="grid gap-3 sm:grid-cols-3"><Metric icon={<Bell size={15} />} label="Unread" value={unread.length} detail="Needs acknowledgement" /><Metric icon={<Mail size={15} />} label="All notifications" value={records.length} detail="Retained operating inbox" /><Metric icon={<MessageCircle size={15} />} label="Customer communications" value={records.filter((item) => item.category === 'Customer communication').length} detail="Linked to delivery evidence" /></section>
    <div className="flex justify-end"><button onClick={() => unread.forEach((item) => aglCommunicationsWorkflow.markNotification(actor, item.id, true))} className="rounded-lg border border-white/[0.08] px-4 py-2 text-[10px] text-gray-400">Mark all read</button></div>
    <section className="space-y-3">{records.map((item) => <article key={item.id} className={`flex items-start gap-4 rounded-xl border p-4 ${item.read ? 'border-white/[0.06] bg-[#090909]' : 'border-cyan-300/20 bg-cyan-300/[0.04]'}`}><span className="mt-1 text-cyan-300">{item.read ? <EyeOff size={16} /> : <Bell size={16} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-xs text-white">{String(item.name)}</strong><span className="font-mono text-[8px] text-gray-600">{new Date(item.createdAt).toLocaleString()}</span></div><p className="mt-2 text-[10px] leading-5 text-gray-500">{String(item.notes ?? '')}</p><p className="mt-2 font-mono text-[8px] text-gray-700">{String(item.reference ?? item.id)}</p></div><button onClick={() => run(() => aglCommunicationsWorkflow.markNotification(actor, item.id, !Boolean(item.read)), item.read ? 'Notification marked unread.' : 'Notification acknowledged.')} className="rounded border border-white/[0.08] px-3 py-2 text-[8px] text-gray-400">{item.read ? 'Mark unread' : 'Mark read'}</button></article>)}</section>
  </>;
};

interface WorkspaceProps { version: number; run: (work: () => unknown, message: string) => void }
const titles: Record<ModuleId, string> = { campaigns: 'Campaign tracker', promotions: 'Promotions', leads: 'Marketing leads', 'marketing-spend': 'Marketing spend', reminders: 'Customer reminders', notifications: 'Notification centre' };
const descriptions: Record<ModuleId, string> = {
  campaigns: 'Operate channel campaigns and connect spend, funnel evidence, attributed revenue, and return on advertising spend.',
  promotions: 'Issue controlled offers with validity, discount authority, campaign lineage, and lifecycle state.',
  leads: 'Capture, assign, qualify, and close prospective customer demand without losing its source.',
  'marketing-spend': 'Review the finance-linked expense book created by campaign commitments.',
  reminders: 'Maintain reusable customer templates and send traceable service, booking, payment, and follow-up reminders.',
  notifications: 'Acknowledge operational events without deleting their retained source and delivery evidence.',
};

const Metric = ({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: React.ReactNode; detail: string }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className="flex items-center gap-2 text-cyan-300">{icon}<span className="font-mono text-[8px] uppercase tracking-wider">{label}</span></div><div className="mt-3 text-xl font-display text-white">{value}</div><p className="mt-1 text-[9px] text-gray-600">{detail}</p></article>;
const Field = ({ label, children }: { label: string; children: React.ReactElement }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>{<div className="mt-2 [&>input]:h-11 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-white/[0.08] [&>input]:bg-black/30 [&>input]:px-3 [&>input]:text-xs [&>input]:text-white [&>select]:h-11 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-white/[0.08] [&>select]:bg-black/30 [&>select]:px-3 [&>select]:text-xs [&>select]:text-white [&>textarea]:min-h-28 [&>textarea]:w-full [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:border-white/[0.08] [&>textarea]:bg-black/30 [&>textarea]:p-3 [&>textarea]:text-xs [&>textarea]:text-white">{children}</div>}</label>;
const Status = ({ value }: { value: unknown }) => <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-2 py-1 text-[8px] text-cyan-200">{String(value)}</span>;
const Row = ({ label, value }: { label: string; value: unknown }) => <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2 text-[9px]"><span className="text-gray-600">{label}</span><span className="text-right text-gray-300">{String(value ?? '—')}</span></div>;
const CardGrid = ({ records, extra }: { records: AglOperationalRecord[]; extra: (record: AglOperationalRecord) => React.ReactNode }) => <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{records.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-start justify-between"><div><strong className="text-sm text-white">{String(item.name)}</strong><p className="mt-1 font-mono text-[8px] text-gray-600">{item.id}</p></div><Status value={item.status} /></div><div className="mt-4">{extra(item)}</div></article>)}</section>;
const SimpleTable = ({ records, columns }: { records: AglOperationalRecord[]; columns: string[] }) => <section className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[900px] text-left text-[10px]"><thead className="border-b border-white/[0.08] bg-black/30 text-gray-600"><tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-normal uppercase tracking-wider">{column.replace(/([A-Z])/g, ' $1')}</th>)}</tr></thead><tbody>{records.map((item) => <tr key={item.id} className="border-b border-white/[0.06] text-gray-300">{columns.map((column) => <td key={column} className="px-4 py-4">{column === 'amount' ? money.format(Number(item[column] ?? 0)) : column === 'status' ? <Status value={item[column]} /> : String(item[column] ?? '—')}</td>)}</tr>)}</tbody></table></section>;
