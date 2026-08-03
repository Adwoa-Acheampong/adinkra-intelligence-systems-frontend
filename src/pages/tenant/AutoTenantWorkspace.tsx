import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Car,
  CheckCircle2,
  Clock3,
  Gauge,
  Search,
  ShieldCheck,
  UserRoundCog,
  Wrench,
  X,
} from 'lucide-react';
import type {
  AutoWorkshopSnapshot,
  AutoWorkOrder,
  EvidenceState,
  WorkOrderStatus,
} from '../../contracts/autoOperations';
import type { Tenant } from '../../types';
import { fixtureAutoOperationsPort } from '../../data/autoOperationsFixtures';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { GenericEntityTable } from '../../components/tenant/GenericEntityTable';
import { AutoInventoryWorkspace } from './AutoInventoryWorkspace';
import { AutoSalesWorkspace } from './AutoSalesWorkspace';
import { AutoFixbotWorkspace } from './AutoFixbotWorkspace';
import { AglFinanceAnalyticsWorkspace } from './AglFinanceAnalyticsWorkspace';
import { AglAnalyticsWorkspace } from './AglAnalyticsWorkspace';

const statusOrder: WorkOrderStatus[] = ['Diagnosis', 'Awaiting parts', 'In progress', 'Quality control', 'Ready'];

const statusTone: Record<WorkOrderStatus, string> = {
  Diagnosis: 'border-blue-400/25 bg-blue-400/[0.08] text-blue-300',
  'Awaiting parts': 'border-red-400/25 bg-red-400/[0.08] text-red-300',
  'In progress': 'border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-300',
  'Quality control': 'border-amber-400/25 bg-amber-400/[0.08] text-amber-300',
  Ready: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300',
};

const priorityTone = {
  Routine: 'text-gray-500',
  Priority: 'text-amber-300',
  Critical: 'text-red-300',
};

const evidenceTone: Record<EvidenceState, string> = {
  Accepted: 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300',
  Pending: 'border-amber-400/20 bg-amber-400/[0.07] text-amber-300',
  Missing: 'border-red-400/20 bg-red-400/[0.07] text-red-300',
};

const money = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 0,
});

export const AutoTenantModule = ({ tenant, moduleId }: { tenant: Tenant; moduleId: string }) => {
  if (tenant.id === 'agl' && moduleId !== 'finance') return <AglAnalyticsWorkspace tenant={tenant} moduleId={moduleId} />;
  if (moduleId === 'fixbot') return <AutoFixbotWorkspace tenant={tenant} />;
  if (moduleId === 'workshop') return <AutoWorkshopWorkspace tenant={tenant} />;
  if (moduleId === 'inventory') return <AutoInventoryWorkspace tenant={tenant} />;
  if (moduleId === 'sales') return <AutoSalesWorkspace tenant={tenant} />;
  if (tenant.id === 'agl' && moduleId === 'finance') return <AglFinanceAnalyticsWorkspace tenant={tenant} />;
  return <GenericEntityTable />;
};

const AutoWorkshopWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [snapshot, setSnapshot] = useState<AutoWorkshopSnapshot | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<WorkOrderStatus | 'All'>('All');
  const [selected, setSelected] = useState<AutoWorkOrder | null>(null);

  useEffect(() => {
    let active = true;
    fixtureAutoOperationsPort.loadWorkshopSnapshot({ tenantId: tenant.id, period: 'today' }).then((data) => {
      if (active) setSnapshot(data);
    });
    return () => {
      active = false;
    };
  }, [tenant.id]);

  const visible = useMemo(() => {
    if (!snapshot) return [];
    const normalized = query.trim().toLowerCase();
    return snapshot.workOrders.filter((order) => (
      (status === 'All' || order.status === status)
      && (!normalized || `${order.id} ${order.registration} ${order.vehicle} ${order.customer} ${order.mechanic}`.toLowerCase().includes(normalized))
    ));
  }, [query, snapshot, status]);

  if (!snapshot) {
    return <div className="flex min-h-[420px] items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-gray-600">Loading workshop contract…</div>;
  }

  const overdue = snapshot.workOrders.filter((order) => order.elapsedHours > order.targetHours && order.status !== 'Ready');
  const shortParts = snapshot.workOrders.filter((order) => order.parts.some((part) => part.state === 'Short'));
  const promisedToday = snapshot.workOrders.filter((order) => order.promisedAt.startsWith('28 Jul'));
  const openValue = snapshot.workOrders.filter((order) => order.status !== 'Ready').reduce((sum, order) => sum + order.approvedGhs, 0);

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-10">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">
            <Wrench size={13} /> {tenant.name} / Workshop execution
          </div>
          <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">Workshop control</h1>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-wider text-gray-500">
            <span className="rounded border border-white/[0.08] px-2 py-1">{snapshot.workOrders.length} active job cards</span>
            <span className="rounded border border-red-400/20 bg-red-400/[0.05] px-2 py-1 text-red-300">{overdue.length} promise breaches</span>
            <span className="rounded border border-emerald-400/20 bg-emerald-400/[0.05] px-2 py-1 text-emerald-300">{snapshot.coverage}% evidence coverage</span>
            <span className="rounded border border-amber-400/20 bg-amber-400/[0.05] px-2 py-1 text-amber-200">Contract fixture</span>
          </div>
        </div>
        <div className="text-left xl:text-right">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">As of</div>
          <div className="mt-1 text-xs text-gray-300">{snapshot.asOf}</div>
          <div className="mt-1 max-w-md text-[10px] text-gray-600">{snapshot.source}</div>
        </div>
      </header>

      <section aria-label="Workshop key measures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Open work value', value: money.format(openValue), detail: 'approved active job cards', Icon: Gauge, tone: 'text-white' },
          { label: 'Waiting for parts', value: String(shortParts.length), detail: 'jobs with verified shortages', Icon: Boxes, tone: shortParts.length ? 'text-red-300' : 'text-emerald-300' },
          { label: 'Promised today', value: String(promisedToday.length), detail: `${overdue.length} currently breached`, Icon: Clock3, tone: overdue.length ? 'text-amber-300' : 'text-white' },
          { label: 'First-pass QC', value: `${snapshot.firstPassQc}%`, detail: 'target ≥ 95%', Icon: BadgeCheck, tone: 'text-amber-300' },
          { label: 'Evidence coverage', value: `${snapshot.coverage}%`, detail: 'target 100%', Icon: ShieldCheck, tone: 'text-emerald-300' },
        ].map(({ label, value, detail, Icon, tone }) => (
          <GlassPanel key={label} className="rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[9px] uppercase tracking-wider text-gray-500">{label}</div>
              <Icon size={14} className="text-vertical-accent" />
            </div>
            <div className={`mt-3 text-2xl font-medium ${tone}`}>{value}</div>
            <div className="mt-1 text-[10px] text-gray-500">{detail}</div>
          </GlassPanel>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div>
              <h2 className="text-sm font-medium text-white">Live job-card flow</h2>
              <p className="mt-1 text-[10px] text-gray-500">Each card is a real workshop decision state, not a generic task.</p>
            </div>
            <Car size={16} className="text-vertical-accent" />
          </div>
          <div className="grid gap-px bg-white/[0.05] md:grid-cols-5">
            {statusOrder.map((stage) => {
              const orders = snapshot.workOrders.filter((order) => order.status === stage);
              return (
                <div key={stage} className="min-h-56 bg-[#090909] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-[8px] uppercase tracking-wider text-gray-500">{stage}</span>
                    <span className="rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[8px] text-gray-500">{orders.length}</span>
                  </div>
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelected(order)}
                        className="w-full cursor-pointer rounded-lg border border-white/[0.08] bg-black/30 p-3 text-left transition hover:border-vertical-accent/35 hover:bg-white/[0.035] focus:outline-none focus:ring-2 focus:ring-vertical-accent"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[9px] text-vertical-accent">{order.id}</span>
                          <span className={`font-mono text-[8px] uppercase ${priorityTone[order.priority]}`}>{order.priority}</span>
                        </div>
                        <div className="mt-2 text-[11px] font-medium leading-4 text-white">{order.vehicle}</div>
                        <div className="mt-1 text-[9px] text-gray-500">{order.registration} · {order.bay}</div>
                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-vertical-accent/80" style={{ width: `${order.completion}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[8px] text-gray-600">
                          <span>{order.mechanic}</span>
                          <span>{order.completion}%</span>
                        </div>
                      </button>
                    ))}
                    {orders.length === 0 && <div className="rounded-lg border border-dashed border-white/[0.06] p-4 text-center font-mono text-[8px] uppercase text-gray-700">No jobs</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">Capacity and constraints</h2>
              <p className="mt-1 text-[10px] text-gray-500">Current assignment against available workshop capacity.</p>
            </div>
            <AlertTriangle size={16} className="text-amber-300" />
          </div>
          <div className="mt-5 space-y-4">
            {snapshot.capacity.map((item) => {
              const load = Math.round((item.assigned / item.capacity) * 100);
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="text-gray-300">{item.label}</span>
                    <span className={load >= 100 ? 'text-red-300' : load >= 85 ? 'text-amber-300' : 'text-gray-400'}>{item.assigned}/{item.capacity} {item.unit}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${load >= 100 ? 'bg-red-400/80' : load >= 85 ? 'bg-amber-400/80' : 'bg-vertical-accent/75'}`} style={{ width: `${Math.min(100, load)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 space-y-2 border-t border-white/[0.07] pt-4">
            {[
              { label: 'Injector batch INJ-HLX-044', detail: 'VSR-2051 · supplier provenance missing', tone: 'border-red-400/20 bg-red-400/[0.05]' },
              { label: 'Diagnostic stations saturated', detail: '2 of 2 active · next slot 15:30', tone: 'border-amber-400/20 bg-amber-400/[0.05]' },
              { label: 'Civic QC due', detail: 'VSR-2048 · road-test before 16:30', tone: 'border-blue-400/20 bg-blue-400/[0.05]' },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg border p-3 ${item.tone}`}>
                <div className="text-[10px] font-medium text-gray-200">{item.label}</div>
                <div className="mt-1 text-[9px] text-gray-500">{item.detail}</div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-medium text-white">Workshop work orders</h2>
            <p className="mt-1 text-[10px] text-gray-500">{visible.length} of {snapshot.workOrders.length} job cards in the current evidence scope.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Search job cards</span>
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Job, vehicle, customer…" className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent sm:w-64" />
            </label>
            <label>
              <span className="sr-only">Filter by job status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as WorkOrderStatus | 'All')} className="h-10 rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 text-xs text-gray-300 outline-none focus:border-vertical-accent">
                <option value="All">All statuses</option>
                {statusOrder.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-black/20 font-mono text-[9px] uppercase tracking-wider text-gray-500">
              <tr>
                {['Job card', 'Vehicle', 'Customer', 'State', 'Mechanic / bay', 'Promise', 'Approved', 'Evidence', 'Decision'].map((head) => <th key={head} className="px-5 py-3 font-normal">{head}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {visible.map((order) => {
                const acceptedEvidence = order.evidence.filter((item) => item.state === 'Accepted').length;
                return (
                  <tr key={order.id} className="hover:bg-white/[0.025]">
                    <td className="px-5 py-3">
                      <button onClick={() => setSelected(order)} className="cursor-pointer font-mono text-vertical-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent">{order.id}</button>
                    </td>
                    <td className="px-5 py-3"><div className="text-gray-200">{order.vehicle}</div><div className="mt-1 font-mono text-[9px] text-gray-600">{order.registration}</div></td>
                    <td className="px-5 py-3 text-gray-400">{order.customer}</td>
                    <td className="px-5 py-3"><span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${statusTone[order.status]}`}>{order.status}</span></td>
                    <td className="px-5 py-3"><div className="text-gray-300">{order.mechanic}</div><div className="mt-1 text-[9px] text-gray-600">{order.bay}</div></td>
                    <td className="px-5 py-3"><div className={order.elapsedHours > order.targetHours && order.status !== 'Ready' ? 'text-red-300' : 'text-gray-300'}>{order.promisedAt}</div><div className="mt-1 text-[9px] text-gray-600">{order.elapsedHours}h / {order.targetHours}h</div></td>
                    <td className="px-5 py-3 font-mono text-gray-300">{money.format(order.approvedGhs)}</td>
                    <td className="px-5 py-3 text-gray-400">{acceptedEvidence}/{order.evidence.length} accepted</td>
                    <td className="max-w-64 px-5 py-3">
                      <button onClick={() => setSelected(order)} className="flex cursor-pointer items-center gap-2 text-left text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent">
                        <span className="line-clamp-2">{order.nextDecision}</span><ArrowRight size={12} className="shrink-0 text-vertical-accent" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {createPortal(
        <AnimatePresence>
          {selected && <WorkOrderDrawer order={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
};

const WorkOrderDrawer = ({ order, onClose }: { order: AutoWorkOrder; onClose: () => void }) => {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: 560 }}
        animate={{ x: 0 }}
        exit={{ x: 560 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-order-title"
        onClick={(event) => event.stopPropagation()}
        className="custom-scrollbar h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-vertical-accent">{order.id} · {order.registration}</div>
            <h2 id="work-order-title" className="mt-2 text-xl font-medium text-white">{order.vehicle}</h2>
            <p className="mt-1 text-xs text-gray-500">{order.customer} · {order.complaint}</p>
          </div>
          <button onClick={onClose} aria-label="Close work-order detail" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"><X size={17} /></button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Status', order.status],
            ['Mechanic', order.mechanic],
            ['Bay', order.bay],
            ['Promise', order.promisedAt],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div>
              <div className="mt-2 text-xs text-gray-200">{value}</div>
            </div>
          ))}
        </div>

        <section className="mt-6">
          <div className="flex items-center gap-2"><Wrench size={15} className="text-vertical-accent" /><h3 className="text-sm font-medium text-white">Diagnosis and next decision</h3></div>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/25 p-4">
            <p className="text-xs leading-5 text-gray-300">{order.diagnostic}</p>
            <div className="mt-4 border-t border-white/[0.07] pt-3">
              <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Next controlled decision</div>
              <div className="mt-2 text-xs text-white">{order.nextDecision}</div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2"><Boxes size={15} className="text-vertical-accent" /><h3 className="text-sm font-medium text-white">Parts requirement</h3></div>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08]">
            {order.parts.length ? order.parts.map((part) => (
              <div key={part.sku} className="grid gap-3 border-b border-white/[0.06] bg-black/20 p-3 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div><div className="text-xs text-gray-200">{part.name}</div><div className="mt-1 font-mono text-[9px] text-gray-600">{part.sku} · {part.source}</div></div>
                <div className="text-[10px] text-gray-400">Need {part.quantity} · Available {part.available}</div>
                <div className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${part.state === 'Short' ? 'border-red-400/20 bg-red-400/[0.07] text-red-300' : part.state === 'Issued' ? 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300' : 'border-blue-400/20 bg-blue-400/[0.07] text-blue-300'}`}>{part.state}</div>
              </div>
            )) : <div className="p-4 text-xs text-gray-600">No parts committed until diagnosis is accepted.</div>}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2"><ShieldCheck size={15} className="text-vertical-accent" /><h3 className="text-sm font-medium text-white">Evidence chain</h3></div>
          <div className="mt-3 space-y-2">
            {order.evidence.map((item, index) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.08] font-mono text-[9px] text-gray-500">{index + 1}</div>
                <div className="min-w-0 flex-1"><div className="text-xs text-gray-200">{item.label}</div><div className="mt-1 text-[9px] text-gray-600">{item.capturedAt ? `Captured ${item.capturedAt}` : 'Awaiting controlled evidence'}</div></div>
                <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${evidenceTone[item.state]}`}>{item.state}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 sm:grid-cols-3">
          <div><div className="font-mono text-[8px] uppercase text-gray-600">Estimate</div><div className="mt-2 text-sm text-gray-300">{money.format(order.estimateGhs)}</div></div>
          <div><div className="font-mono text-[8px] uppercase text-gray-600">Approved</div><div className="mt-2 text-sm text-white">{money.format(order.approvedGhs)}</div></div>
          <div><div className="font-mono text-[8px] uppercase text-gray-600">Supervisor</div><div className="mt-2 flex items-center gap-2 text-sm text-gray-300"><UserRoundCog size={13} /> {order.supervisor}</div></div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2 text-[9px] text-emerald-200/80">
          <CheckCircle2 size={13} /> Frontend contract ready for backend work-order, inventory-issue, QC and audit endpoints.
        </div>
      </motion.aside>
    </motion.div>
  );
};
