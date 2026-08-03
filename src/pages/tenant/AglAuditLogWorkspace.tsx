import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronDown,
  Download,
  Fingerprint,
  History,
  Search,
  ShieldAlert,
  UserRoundCheck,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglAuditEvent } from '../../erp/agl/contracts';
import { aglErpRepository } from '../../erp/agl/repository';

const highRiskActions = new Set<AglAuditEvent['action']>(['DELETE', 'APPROVE', 'SIGN', 'IMPORT']);

export const AglAuditLogWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [module, setModule] = useState('');
  const [actor, setActor] = useState('');
  const [selected, setSelected] = useState<AglAuditEvent | null>(null);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const events = useMemo(() => aglErpRepository.audit(), [revision]);
  const actions = [...new Set(events.map((event) => event.action))].sort();
  const modules = [...new Set(events.map((event) => event.moduleId))].sort();
  const actors = [...new Set(events.map((event) => event.actorName))].sort();
  const visible = events.filter((event) => {
    const normalized = query.trim().toLowerCase();
    return (!normalized || JSON.stringify(event).toLowerCase().includes(normalized))
      && (!action || event.action === action)
      && (!module || event.moduleId === module)
      && (!actor || event.actorName === actor);
  });
  const correlations = new Set(visible.map((event) => event.correlationId)).size;
  const branches = new Set(visible.map((event) => `${event.branchId}:${event.siteId}`)).size;

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><Fingerprint size={13} /> {tenant.id.toUpperCase()} ERP / SYSTEM EVIDENCE</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">Audit log</h1>
          <p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">Every login and operational mutation, attributed to an actor, record, organisational site, timestamp, and correlation chain. The global scope above constrains this evidence without deleting history.</p>
        </div>
        <button onClick={() => exportAudit(visible)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-xs font-semibold text-black"><Download size={14} /> Export current evidence</button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<History size={14} />} label="Events in scope" value={visible.length} detail={`${events.length} events before page filters`} />
        <Metric icon={<UserRoundCheck size={14} />} label="Actors" value={new Set(visible.map((event) => event.actorId)).size} detail="Distinct accountable identities" />
        <Metric icon={<Activity size={14} />} label="Correlation chains" value={correlations} detail="Related multi-module actions" />
        <Metric icon={<ShieldAlert size={14} />} label="Sensitive actions" value={visible.filter((event) => highRiskActions.has(event.action)).length} detail={`${branches} branch/site scopes represented`} warning />
      </section>

      <section className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-4 md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(3,0.7fr)]">
        <label className="relative">
          <span className="sr-only">Search audit evidence</span>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Actor, record, summary, correlation ID…" className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-white outline-none focus:border-cyan-300/40" />
        </label>
        <FilterSelect label="Action" value={action} onChange={setAction} options={actions} />
        <FilterSelect label="Module" value={module} onChange={setModule} options={modules} />
        <FilterSelect label="Actor" value={actor} onChange={setActor} options={actors} />
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-[10px]">
            <thead className="border-b border-white/[0.08] bg-black/20 font-mono text-[8px] uppercase tracking-wider text-gray-600">
              <tr>{['Time', 'Actor', 'Action', 'Module / record', 'Branch / site', 'Summary', 'Correlation', 'Evidence'].map((label) => <th key={label} className="px-4 py-3 font-normal">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {visible.map((event) => (
                <tr key={event.id} className="text-gray-300 transition hover:bg-white/[0.025]">
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-[8px] text-gray-500">{new Date(event.occurredAt).toLocaleString()}</td>
                  <td className="px-4 py-4"><strong className="text-white">{event.actorName}</strong><div className="mt-1 text-[8px] text-gray-600">{event.actorRole}</div></td>
                  <td className="px-4 py-4"><span className={`rounded border px-2 py-1 font-mono text-[8px] ${highRiskActions.has(event.action) ? 'border-amber-300/20 bg-amber-300/[0.05] text-amber-200' : 'border-cyan-300/15 bg-cyan-300/[0.04] text-cyan-200'}`}>{event.action}</span></td>
                  <td className="px-4 py-4"><div>{event.moduleId}</div><div className="mt-1 font-mono text-[8px] text-cyan-300/70">{event.recordId}</div></td>
                  <td className="px-4 py-4"><div>{event.branchName ?? 'Unassigned'}</div><div className="mt-1 text-[8px] text-gray-600">{event.orgCountry} / {event.orgCity} / {event.siteName}</div></td>
                  <td className="max-w-md px-4 py-4 leading-5">{event.summary}</td>
                  <td className="px-4 py-4 font-mono text-[8px] text-gray-600">{event.correlationId}</td>
                  <td className="px-4 py-4"><button onClick={() => setSelected(event)} className="flex items-center gap-1 rounded border border-white/[0.08] px-2 py-1.5 text-[8px] text-gray-400 hover:text-white">Inspect <ChevronDown size={10} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && <div className="p-12 text-center text-xs text-gray-600">No audit evidence matches this operating and page scope.</div>}
      </section>

      {selected && <AuditEvidenceDrawer event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

const AuditEvidenceDrawer = ({ event, onClose }: { event: AglAuditEvent; onClose: () => void }) => (
  <div className="fixed inset-0 z-[130] flex justify-end bg-black/75 backdrop-blur-sm" onClick={onClose}>
    <aside className="custom-scrollbar h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6" onClick={(click) => click.stopPropagation()}>
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div><div className="font-mono text-[9px] uppercase tracking-wider text-cyan-300">{event.action} · {event.moduleId}</div><h2 className="mt-2 text-xl text-white">{event.recordId}</h2><p className="mt-2 text-xs leading-5 text-gray-500">{event.summary}</p></div>
        <button onClick={onClose} aria-label="Close audit evidence" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:text-white"><X size={16} /></button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ['Actor', `${event.actorName} · ${event.actorRole}`],
          ['Occurred', new Date(event.occurredAt).toLocaleString()],
          ['Correlation', event.correlationId],
          ['Scope', `${event.orgCountry} / ${event.orgCity} / ${event.branchName} / ${event.siteName}`],
        ].map(([label, value]) => <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><div className="font-mono text-[8px] uppercase text-gray-600">{label}</div><div className="mt-2 break-words text-xs text-gray-200">{value}</div></div>)}
      </div>
      <StateBlock title="Before" value={event.before} />
      <StateBlock title="After / action data" value={event.after} />
    </aside>
  </div>
);

const StateBlock = ({ title, value }: { title: string; value?: Record<string, unknown> }) => (
  <section className="mt-5">
    <h3 className="font-mono text-[8px] uppercase tracking-wider text-gray-500">{title}</h3>
    <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-black/30 p-4 font-mono text-[9px] leading-5 text-gray-400">{value ? JSON.stringify(value, null, 2) : 'No state snapshot recorded for this event.'}</pre>
  </section>
);

const Metric = ({ icon, label, value, detail, warning = false }: { icon: React.ReactNode; label: string; value: number; detail: string; warning?: boolean }) => (
  <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className={`flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider ${warning ? 'text-amber-200' : 'text-cyan-300'}`}>{icon}{label}</div><div className="mt-3 text-2xl text-white">{value}</div><p className="mt-1 text-[9px] text-gray-600">{detail}</p></article>
);

const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
  <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 text-[10px] text-white outline-none focus:border-cyan-300/40"><option value="">All {label.toLowerCase()}s</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
);

const exportAudit = (events: AglAuditEvent[]) => {
  const header = ['occurredAt', 'actorName', 'actorRole', 'action', 'moduleId', 'recordId', 'orgCountry', 'orgCity', 'branchName', 'siteName', 'summary', 'correlationId'];
  const rows = events.map((event) => header.map((key) => `"${String(event[key as keyof AglAuditEvent] ?? '').replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = `agl-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(href);
};
