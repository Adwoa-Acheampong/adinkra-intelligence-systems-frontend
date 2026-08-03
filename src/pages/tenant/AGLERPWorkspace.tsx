import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Boxes,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileCheck2,
  History,
  Pencil,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import { GlassPanel } from '../../components/ui/GlassPanel';
import type {
  AglAuditEvent,
  AglFieldDefinition,
  AglModuleDefinition,
  AglOperationalRecord,
  AglRecordValue,
} from '../../erp/agl/contracts';
import { getAglModuleDefinition } from '../../erp/agl/moduleDefinitions';
import { aglErpRepository } from '../../erp/agl/repository';
import { buildAglOperationalSummary } from '../../erp/agl/operationalSummary';

const money = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 2,
});

const actor = {
  name: 'AGL Admin',
  role: 'Administrator',
};

export const AGLERPWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: string }) => {
  const navigate = useNavigate();
  const definition = useMemo(() => getAglModuleDefinition(moduleId), [moduleId]);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AglOperationalRecord | 'new' | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  useEffect(() => {
    setQuery('');
    setEditing(null);
    setFeedback('');
  }, [moduleId]);

  const records = useMemo(
    () => moduleId === 'audit-log' ? [] : aglErpRepository.list(moduleId),
    [moduleId, version],
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((item) => JSON.stringify(item).toLowerCase().includes(normalized));
  }, [query, records]);

  const summaryMeasures = useMemo(
    () => buildAglOperationalSummary(moduleId, definition, records),
    [moduleId, definition, records],
  );
  const actionLabel = moduleId === 'audit-log' ? 'Export audit' : definition.primaryAction;

  const handlePrimaryAction = () => {
    if (moduleId === 'audit-log') {
      exportAudit(aglErpRepository.audit());
      setFeedback('Audit export prepared.');
      return;
    }
    setEditing('new');
  };

  const changeStatus = (record: AglOperationalRecord, status: string) => {
    aglErpRepository.changeStatus({
      moduleId,
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      status,
      values: {},
    });
    setFeedback(`${record.id} moved to ${status}.`);
  };

  return (
    <motion.div
      key={moduleId}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="mx-auto max-w-[1680px] space-y-5 pb-12"
    >
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">
            <ShieldCheck size={13} /> {tenant.id.toUpperCase()} ERP / {moduleId.replace(/-/g, ' ')}
          </div>
          <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">{definition.title}</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">{definition.description}</p>
        </div>
        <button
          onClick={handlePrimaryAction}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white"
        >
          {moduleId === 'audit-log' ? <Download size={15} /> : <Plus size={15} />} {actionLabel}
        </button>
      </header>

      {feedback && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-3 text-xs text-emerald-200">
          <span className="flex items-center gap-2"><Check size={14} /> {feedback}</span>
          <button onClick={() => setFeedback('')} aria-label="Dismiss confirmation" className="rounded p-1 hover:bg-white/5"><X size={13} /></button>
        </div>
      )}

      {moduleId !== 'audit-log' && (
        <section aria-label={`${definition.title} operational summary`} className="grid gap-3 sm:grid-cols-3">
          {summaryMeasures.map((measure) => (
            <OperationalMeasure
              key={measure.label}
              label={measure.label}
              value={measure.semantic === 'money' ? money.format(measure.value) : measure.value.toLocaleString()}
              detail={measure.detail}
              icon={measure.semantic === 'money'
                ? <CircleDollarSign size={15} />
                : measure.semantic === 'quantity'
                  ? <Boxes size={15} />
                  : measure.semantic === 'attention'
                    ? <Clock3 size={15} />
                    : <FileCheck2 size={15} />}
              warning={measure.warning}
            />
          ))}
        </section>
      )}

      {definition.view === 'assistant' && (
        <FixBotConsole
          onCaseCreated={(record) => {
            setFeedback(`${record.id} created and assigned for human review.`);
          }}
        />
      )}

      {definition.view === 'audit' ? (
        <AuditLog events={aglErpRepository.audit()} query={query} onQuery={setQuery} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-md">
              <span className="sr-only">Search {definition.title}</span>
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${definition.entityName} records…`}
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent"
              />
            </label>
            <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">{visible.length} of {records.length} records</div>
          </div>

          {definition.view === 'workflow' ? (
            <WorkflowBoard
              definition={definition}
              records={visible}
              onEdit={setEditing}
              onStatus={changeStatus}
              onOpenJobCard={moduleId === 'job-board'
                ? (record) => navigate(`/${tenant.verticalId}/tenant/${tenant.id}/erp/job-cards?job=${record.id}`)
                : undefined}
            />
          ) : definition.view === 'statement' ? (
            <ProfitLossStatement records={visible} onEdit={setEditing} />
          ) : definition.view === 'directory' ? (
            <DirectoryView definition={definition} records={visible} onEdit={setEditing} />
          ) : definition.view === 'documents' ? (
            <DocumentsView definition={definition} records={visible} onEdit={setEditing} />
          ) : (
            <RecordTable definition={definition} records={visible} onEdit={setEditing} />
          )}
        </>
      )}

      {createPortal(
        <AnimatePresence>
          {editing && editing !== 'new' && (
            <RecordEditor
              definition={definition}
              record={editing}
              onClose={() => setEditing(null)}
              onSaved={(saved) => {
                setEditing(null);
                setFeedback(`${saved.id} updated. Admin Audit recorded the change.`);
              }}
            />
          )}
          {editing === 'new' && (
            <RecordEditor
              definition={definition}
              onClose={() => setEditing(null)}
              onSaved={(saved) => {
                setEditing(null);
                setFeedback(`${saved.id} created. Admin Audit recorded the action.`);
              }}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
};

const OperationalMeasure = ({
  label,
  value,
  detail,
  icon,
  warning = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  warning?: boolean;
}) => (
  <GlassPanel className="rounded-xl px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-600">{label}</div>
        <div className={`mt-2 text-xl font-medium ${warning ? 'text-amber-300' : 'text-white'}`}>{value}</div>
        <div className="mt-1 text-[9px] text-gray-600">{detail}</div>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/25 text-vertical-accent">{icon}</div>
    </div>
  </GlassPanel>
);

const FixBotConsole = ({ onCaseCreated }: { onCaseCreated: (record: AglOperationalRecord) => void }) => {
  const [customer, setCustomer] = useState('Ama Serwaa');
  const [vehicle, setVehicle] = useState('Honda Civic · GW 4821-24');
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [working, setWorking] = useState(false);

  const ask = () => {
    if (!prompt.trim()) return;
    setWorking(true);
    window.setTimeout(() => {
      const recommendation = `Probable path: verify stored fault codes and freeze-frame data, inspect the affected circuit, then compare the observed values against the vehicle history before authorising parts. Human acceptance is required before this recommendation can affect a work order.`;
      setAnswer(recommendation);
      const created = aglErpRepository.create({
        moduleId: 'fixbot',
        actorName: actor.name,
        actorRole: actor.role,
        values: {
          customer,
          vehicle,
          symptoms: prompt,
          recommendation,
          owner: 'Workshop supervisor',
          status: 'Human review',
        },
      });
      setWorking(false);
      onCaseCreated(created);
    }, 450);
  };

  return (
    <GlassPanel className="overflow-hidden rounded-xl">
      <div className="grid lg:grid-cols-[0.38fr_0.62fr]">
        <div className="border-b border-white/[0.07] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><Bot size={16} className="text-vertical-accent" /> Operational context</div>
          <p className="mt-2 text-[10px] leading-4 text-gray-600">FixBot can read context and propose work. It cannot silently change a job, stock, sale, or customer record.</p>
          <label className="mt-5 block">
            <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Customer</span>
            <input value={customer} onChange={(event) => setCustomer(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white outline-none focus:border-vertical-accent" />
          </label>
          <label className="mt-3 block">
            <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Vehicle</span>
            <input value={vehicle} onChange={(event) => setVehicle(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white outline-none focus:border-vertical-accent" />
          </label>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><Sparkles size={15} className="text-vertical-accent" /> Ask FixBot</div>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe symptoms, codes, history, or the workshop decision you need help with…"
            className="mt-4 min-h-28 w-full resize-y rounded-xl border border-white/[0.08] bg-black/25 p-4 text-xs leading-5 text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent"
          />
          <div className="mt-3 flex justify-end">
            <button onClick={ask} disabled={!prompt.trim() || working} className="flex min-h-10 items-center gap-2 rounded-lg bg-vertical-accent px-4 text-[10px] font-semibold text-black disabled:opacity-40">
              <Send size={13} /> {working ? 'Analysing context…' : 'Ask and open case'}
            </button>
          </div>
          {answer && (
            <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
              <div className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">Recommendation · Human review required</div>
              <p className="mt-2 text-xs leading-5 text-gray-300">{answer}</p>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
};

const WorkflowBoard = ({
  definition,
  records,
  onEdit,
  onStatus,
  onOpenJobCard,
}: {
  definition: AglModuleDefinition;
  records: AglOperationalRecord[];
  onEdit: (record: AglOperationalRecord) => void;
  onStatus: (record: AglOperationalRecord, status: string) => void;
  onOpenJobCard?: (record: AglOperationalRecord) => void;
}) => (
  <div className="custom-scrollbar overflow-x-auto pb-3">
    <div className="grid min-w-max gap-3" style={{ gridTemplateColumns: `repeat(${definition.statuses.length}, minmax(220px, 1fr))` }}>
      {definition.statuses.map((status, statusIndex) => {
        const stageRecords = records.filter((item) => item.status === status);
        const nextStatus = definition.statuses[statusIndex + 1];
        return (
          <GlassPanel key={status} className="min-h-64 w-[240px] rounded-xl p-3">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-1 pb-3">
              <span className="font-mono text-[8px] uppercase tracking-wider text-gray-500">{status}</span>
              <span className="rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[8px] text-gray-600">{stageRecords.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {stageRecords.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/[0.08] bg-black/25 p-3">
                  <button onClick={() => onEdit(item)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-vertical-accent">
                    <div className="font-mono text-[8px] text-vertical-accent">{item.id}</div>
                    <div className="mt-2 line-clamp-2 text-[11px] font-medium text-white">{String(item.vehicle ?? item.customer ?? item.name ?? item.reference ?? definition.entityName)}</div>
                    <div className="mt-1 line-clamp-2 text-[9px] leading-4 text-gray-600">{String(item.concern ?? item.notes ?? item.owner ?? '')}</div>
                  </button>
                  {nextStatus && (
                    <button onClick={() => onStatus(item, nextStatus)} className="mt-3 flex min-h-9 w-full items-center justify-between rounded-md border border-white/[0.08] px-2 text-[9px] text-gray-400 transition hover:border-vertical-accent/30 hover:text-white">
                      Move to {nextStatus}<ChevronRight size={12} />
                    </button>
                  )}
                  {onOpenJobCard && (
                    <button onClick={() => onOpenJobCard(item)} className="mt-2 flex min-h-9 w-full items-center justify-between rounded-md border border-vertical-accent/20 bg-vertical-accent-glow px-2 text-[9px] text-vertical-accent transition hover:border-vertical-accent/50">
                      Open linked Job Card<FileCheck2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              {!stageRecords.length && <div className="rounded-lg border border-dashed border-white/[0.06] p-4 text-center font-mono text-[8px] uppercase text-gray-700">No records</div>}
            </div>
          </GlassPanel>
        );
      })}
    </div>
  </div>
);

const RecordTable = ({
  definition,
  records,
  onEdit,
}: {
  definition: AglModuleDefinition;
  records: AglOperationalRecord[];
  onEdit: (record: AglOperationalRecord) => void;
}) => (
  <GlassPanel className="overflow-hidden rounded-xl">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead className="border-b border-white/[0.07] bg-black/20 font-mono text-[8px] uppercase tracking-wider text-gray-600">
          <tr>
            <th className="px-5 py-3 font-normal">ID</th>
            {definition.columns.map((column) => <th key={column.key} className="px-5 py-3 font-normal">{column.label}</th>)}
            <th className="px-5 py-3 text-right font-normal">Edit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06] text-xs">
          {records.map((item) => (
            <tr key={item.id} className="transition hover:bg-white/[0.025]">
              <td className="px-5 py-3 font-mono text-[9px] text-vertical-accent">{item.id}</td>
              {definition.columns.map((column) => <td key={column.key} className="max-w-80 px-5 py-3 text-gray-300">{formatValue(item[column.key], column.format)}</td>)}
              <td className="px-5 py-3 text-right">
                <button onClick={() => onEdit(item)} aria-label={`Edit ${item.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"><Pencil size={13} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!records.length && <EmptyRegister action={definition.primaryAction} />}
    </div>
  </GlassPanel>
);

const DirectoryView = ({
  definition,
  records,
  onEdit,
}: {
  definition: AglModuleDefinition;
  records: AglOperationalRecord[];
  onEdit: (record: AglOperationalRecord) => void;
}) => (
  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
    {records.map((item) => (
      <button key={item.id} onClick={() => onEdit(item)} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 text-left transition hover:border-vertical-accent/30 hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-vertical-accent">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-vertical-accent">{item.id}</div>
            <div className="mt-3 text-base font-medium text-white">{String(item.name ?? item.vehicle ?? item.customer ?? item.registration ?? definition.entityName)}</div>
          </div>
          <span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] uppercase text-gray-500">{item.status}</span>
        </div>
        <div className="mt-4 grid gap-2 border-t border-white/[0.06] pt-4 text-[10px] text-gray-500">
          {definition.columns.slice(0, 4).map((column) => (
            <div key={column.key} className="flex justify-between gap-4"><span>{column.label}</span><span className="max-w-[60%] truncate text-gray-300">{formatValue(item[column.key], column.format)}</span></div>
          ))}
        </div>
      </button>
    ))}
    {!records.length && <EmptyRegister action={definition.primaryAction} />}
  </div>
);

const DocumentsView = ({
  definition,
  records,
  onEdit,
}: {
  definition: AglModuleDefinition;
  records: AglOperationalRecord[];
  onEdit: (record: AglOperationalRecord) => void;
}) => (
  <GlassPanel className="rounded-xl p-4">
    <div className="grid gap-2">
      {records.map((item) => (
        <button key={item.id} onClick={() => onEdit(item)} className="grid min-h-16 gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3 text-left transition hover:border-vertical-accent/25 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-vertical-accent"><FileCheck2 size={15} /></div>
          <div><div className="text-xs text-white">{String(item.name ?? item.reference ?? definition.entityName)}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{item.id} · {String(item.owner ?? 'AGL Admin')}</div></div>
          <span className="font-mono text-[8px] uppercase text-gray-500">{item.status}</span>
        </button>
      ))}
      {!records.length && <EmptyRegister action={definition.primaryAction} />}
    </div>
  </GlassPanel>
);

const ProfitLossStatement = ({ records, onEdit }: { records: AglOperationalRecord[]; onEdit: (record: AglOperationalRecord) => void }) => {
  const byCategory = records.reduce<Record<string, number>>((accumulator, item) => {
    const category = String(item.category ?? 'Adjustment');
    accumulator[category] = (accumulator[category] ?? 0) + Number(item.amount ?? 0);
    return accumulator;
  }, {});
  const net = Object.values(byCategory).reduce((sum, value) => sum + value, 0);
  return (
    <div className="grid gap-5 xl:grid-cols-[0.7fr_0.3fr]">
      <GlassPanel className="rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
          <div><h2 className="text-sm font-medium text-white">Current period statement</h2><p className="mt-1 text-[10px] text-gray-600">Derived from posted operational lines in this frontend repository.</p></div>
          <span className="font-mono text-[8px] uppercase text-gray-600">July 2026</span>
        </div>
        <div className="mt-4 divide-y divide-white/[0.06]">
          {Object.entries(byCategory).map(([category, value]) => (
            <div key={category} className="flex justify-between gap-5 py-4 text-xs"><span className="text-gray-400">{category}</span><span className={value < 0 ? 'font-mono text-red-300' : 'font-mono text-emerald-300'}>{money.format(value)}</span></div>
          ))}
          <div className="flex justify-between gap-5 py-5 text-sm font-medium"><span className="text-white">Net profit</span><span className={net >= 0 ? 'font-mono text-emerald-300' : 'font-mono text-red-300'}>{money.format(net)}</span></div>
        </div>
      </GlassPanel>
      <GlassPanel className="rounded-xl p-5">
        <h2 className="text-sm font-medium text-white">Source lines</h2>
        <div className="mt-4 space-y-2">
          {records.map((item) => <button key={item.id} onClick={() => onEdit(item)} className="w-full rounded-lg border border-white/[0.07] bg-black/20 p-3 text-left"><div className="text-[10px] text-gray-300">{String(item.name)}</div><div className="mt-1 flex justify-between font-mono text-[8px] text-gray-600"><span>{String(item.reference)}</span><span>{money.format(Number(item.amount ?? 0))}</span></div></button>)}
        </div>
      </GlassPanel>
    </div>
  );
};

const AuditLog = ({ events, query, onQuery }: { events: AglAuditEvent[]; query: string; onQuery: (value: string) => void }) => {
  const normalized = query.trim().toLowerCase();
  const visible = events.filter((event) => !normalized || JSON.stringify(event).toLowerCase().includes(normalized));
  return (
    <>
      <label className="relative block w-full max-w-lg">
        <span className="sr-only">Search audit events</span>
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search actor, action, record, module, or correlation ID…" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent" />
      </label>
      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="border-b border-white/[0.07] bg-black/20 font-mono text-[8px] uppercase tracking-wider text-gray-600">
              <tr>{['Time', 'Actor', 'Action', 'Module', 'Record', 'Summary', 'Correlation'].map((label) => <th key={label} className="px-5 py-3 font-normal">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {visible.map((event) => (
                <tr key={event.id} className="hover:bg-white/[0.025]">
                  <td className="px-5 py-3 font-mono text-[9px] text-gray-500">{new Date(event.occurredAt).toLocaleString()}</td>
                  <td className="px-5 py-3"><div className="text-gray-200">{event.actorName}</div><div className="mt-1 text-[9px] text-gray-600">{event.actorRole}</div></td>
                  <td className="px-5 py-3"><span className="rounded border border-vertical-accent/20 bg-vertical-accent-glow px-2 py-1 font-mono text-[8px] text-vertical-accent">{event.action}</span></td>
                  <td className="px-5 py-3 text-gray-400">{event.moduleId}</td>
                  <td className="px-5 py-3 font-mono text-[9px] text-gray-300">{event.recordId}</td>
                  <td className="max-w-md px-5 py-3 text-gray-300">{event.summary}</td>
                  <td className="px-5 py-3 font-mono text-[8px] text-gray-600">{event.correlationId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </>
  );
};

const RecordEditor = ({
  definition,
  record,
  onClose,
  onSaved,
}: {
  definition: AglModuleDefinition;
  record?: AglOperationalRecord;
  onClose: () => void;
  onSaved: (record: AglOperationalRecord) => void;
}) => {
  const [values, setValues] = useState<Record<string, AglRecordValue>>(() => {
    const initial: Record<string, AglRecordValue> = {};
    definition.fields.forEach((field) => {
      initial[field.key] = record?.[field.key] ?? '';
    });
    return initial;
  });
  const [status, setStatus] = useState(record?.status ?? definition.statuses[0] ?? 'Open');
  const [error, setError] = useState('');

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const missing = definition.fields.find((field) => field.required && String(values[field.key] ?? '').trim() === '');
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    try {
      const saved = record
        ? aglErpRepository.update({
            moduleId: definition.id,
            recordId: record.id,
            actorName: actor.name,
            actorRole: actor.role,
            values: { ...values, status },
          })
        : aglErpRepository.create({
            moduleId: definition.id,
            actorName: actor.name,
            actorRole: actor.role,
            values: { ...values, status },
          });
      if (saved.status !== status) {
        aglErpRepository.changeStatus({
          moduleId: definition.id,
          recordId: saved.id,
          actorName: actor.name,
          actorRole: actor.role,
          status,
          values: {},
        });
      }
      onSaved({ ...saved, status });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The record could not be saved.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <motion.aside initial={{ x: 560 }} animate={{ x: 0 }} exit={{ x: 560 }} role="dialog" aria-modal="true" aria-labelledby="record-editor-title" onClick={(event) => event.stopPropagation()} className="custom-scrollbar h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-vertical-accent">{definition.title}</div>
            <h2 id="record-editor-title" className="mt-2 text-xl font-medium text-white">{record ? `Edit ${record.id}` : definition.primaryAction}</h2>
            <p className="mt-1 text-xs text-gray-600">Saving writes an actor-attributed Admin Audit event.</p>
          </div>
          <button onClick={onClose} aria-label="Close editor" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={save} className="mt-6 space-y-4">
          {definition.fields.map((field) => (
            <EditorField key={field.key} field={field} value={values[field.key]} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} />
          ))}
          <label className="block">
            <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Operational status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b0b0b] px-3 text-xs text-white outline-none focus:border-vertical-accent">
              {definition.statuses.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          {error && <div className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-xs text-red-300">{error}</div>}
          <div className="flex justify-end gap-2 border-t border-white/[0.08] pt-5">
            <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-white/[0.08] px-4 text-xs text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Check size={14} /> Save record</button>
          </div>
        </form>
      </motion.aside>
    </motion.div>
  );
};

const editorSuggestions = (field: AglFieldDefinition): string[] => {
  const people = aglErpRepository.list('employees');
  const key = field.key.toLowerCase();
  if (['owner', 'approver', 'reviewer', 'supervisor', 'mechanic', 'collectedby', 'receivedby'].includes(key)) {
    return people
      .filter((person) => person.status === 'Active')
      .filter((person) => key !== 'mechanic' || String(person.department).toLowerCase() === 'workshop')
      .map((person) => String(person.name));
  }
  if (key === 'customer') return aglErpRepository.list('customers').map((record) => String(record.name));
  if (key === 'vehicle') return aglErpRepository.list('vehicles').map((record) => `${String(record.registration ?? record.id)} · ${String(record.vehicle ?? record.name)}`);
  if (key === 'supplier') return aglErpRepository.list('suppliers').filter((record) => record.status === 'Active').map((record) => String(record.name));
  if (key === 'sku') return aglErpRepository.list('parts').map((record) => String(record.sku));
  if (key === 'jobid' || key === 'job') return aglErpRepository.list('work-orders').map((record) => record.id);
  if (key === 'department') return ['Workshop', 'Inventory', 'Sales', 'Finance', 'People & HR', 'Marketing', 'Management', 'Administration'];
  if (key === 'role') return ['Mechanic', 'Senior Mechanic', 'Workshop Supervisor', 'Service Advisor', 'Inventory Attendant', 'Sales Executive', 'Finance Officer', 'HR Officer', 'Operations Manager'];
  if (key === 'location' || key === 'bay') return ['Receiving bay', 'Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5', 'AGL Main Workshop', 'Parts Warehouse', 'Head Office'];
  if (key === 'service') return ['Diagnostics', 'Preventive maintenance', 'Engine repair', 'Suspension work', 'Electrical repair', 'Air-conditioning service', 'Inspection'];
  return [];
};

const EditorField = ({ field, value, onChange }: { field: AglFieldDefinition; value: AglRecordValue; onChange: (value: AglRecordValue) => void }) => {
  const suggestions = field.type === 'text' ? editorSuggestions(field) : [];
  const listId = suggestions.length ? `agl-${field.key.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-suggestions` : undefined;
  return (
  <label className="block">
    <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{field.label}{field.required ? ' *' : ''}</span>
    {field.type === 'textarea' ? (
      <textarea value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className="mt-2 min-h-24 w-full rounded-lg border border-white/[0.08] bg-black/25 p-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent" />
    ) : field.type === 'select' ? (
      <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b0b0b] px-3 text-xs text-white outline-none focus:border-vertical-accent">
        <option value="">Select {field.label.toLowerCase()}</option>
        {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    ) : (
      <input
        type={field.type}
        list={listId}
        value={typeof value === 'number' ? value : String(value ?? '')}
        onChange={(event) => onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)}
        placeholder={field.placeholder}
        className="mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent"
      />
    )}
    {listId && <datalist id={listId}>{suggestions.map((option) => <option key={option} value={option} />)}</datalist>}
  </label>
  );
};

const EmptyRegister = ({ action }: { action: string }) => (
  <div className="col-span-full flex min-h-44 items-center justify-center p-8 text-center">
    <div><History size={20} className="mx-auto text-gray-700" /><div className="mt-3 text-xs text-gray-500">No operational records match this view.</div><div className="mt-1 text-[10px] text-gray-700">Use “{action}” to create the first accountable record.</div></div>
  </div>
);

const formatValue = (value: AglRecordValue, format?: string) => {
  if (value === undefined || value === '') return '—';
  if (format === 'money') return money.format(Number(value));
  if (format === 'number') return Number(value).toLocaleString();
  if (format === 'date') {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }
  if (format === 'status') return <span className="rounded border border-white/[0.08] bg-white/[0.025] px-2 py-1 font-mono text-[8px] uppercase text-gray-400">{String(value)}</span>;
  return String(value);
};

const exportAudit = (events: AglAuditEvent[]) => {
  const header = ['occurredAt', 'actorName', 'actorRole', 'action', 'moduleId', 'recordId', 'summary', 'correlationId'];
  const rows = events.map((event) => header.map((key) => `"${String(event[key as keyof AglAuditEvent] ?? '').replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = `agl-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(href);
};
