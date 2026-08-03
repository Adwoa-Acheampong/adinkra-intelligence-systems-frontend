import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Filter,
  Gauge,
  Search,
  UserRoundX,
  Wrench,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglServiceWorkflow } from '../../erp/agl/serviceWorkflow';

const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });
const activeStates = ['Intake', 'Diagnosis', 'Awaiting parts', 'In progress', 'Quality control', 'Ready'];

export const AglWorkOrderRegisterWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('All stages');
  const [mechanic, setMechanic] = useState('All mechanics');
  const [bay, setBay] = useState('All bays');
  const [riskOnly, setRiskOnly] = useState(false);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const jobs = useMemo(() => aglServiceWorkflow.listJobs(), [version]);
  const mechanics = useMemo(() => Array.from(new Set(jobs.map((job) => String(job.mechanic ?? 'Unassigned')))).sort(), [jobs]);
  const bays = useMemo(() => Array.from(new Set(jobs.map((job) => String(job.bay ?? 'Unassigned')))).sort(), [jobs]);
  const today = new Date().toISOString().slice(0, 10);
  const isRisk = (job: AglOperationalRecord) => activeStates.includes(job.status) && Boolean(job.promise) && String(job.promise) < today;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => (
      (stage === 'All stages' || job.status === stage)
      && (mechanic === 'All mechanics' || String(job.mechanic ?? 'Unassigned') === mechanic)
      && (bay === 'All bays' || String(job.bay ?? 'Unassigned') === bay)
      && (!riskOnly || isRisk(job))
      && (!needle || JSON.stringify(job).toLowerCase().includes(needle))
    ));
  }, [jobs, query, stage, mechanic, bay, riskOnly]);

  const active = jobs.filter((job) => activeStates.includes(job.status));
  const atRisk = active.filter(isRisk);
  const unassigned = active.filter((job) => !job.mechanic || job.mechanic === 'Unassigned' || !job.bay || job.bay === 'Unassigned');
  const approvedWip = active.reduce((sum, job) => sum + Number(job.amount ?? 0), 0);
  const ready = jobs.filter((job) => job.status === 'Ready').length;
  const basePath = `/${tenant.verticalId}/tenant/${tenant.id}/erp`;
  const openJob = (jobId: string) => navigate(`${basePath}/job-cards?job=${jobId}`);

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><ClipboardList size={13} /> AGL ERP / Workshop</div>
          <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">Work-order register</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Find every VSR, expose overdue promises and assignment gaps, then open the full job card. New work enters through governed customer and vehicle intake.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate(`${basePath}/job-board`)} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.09] bg-black/25 px-4 text-[10px] text-gray-300"><Wrench size={14} /> Open Kanban</button>
          <button onClick={() => navigate(`${basePath}/intake`)} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><ClipboardList size={14} /> New customer intake</button>
        </div>
      </header>

      <section aria-label="Work-order operational summary" className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-5">
        <Signal icon={<Gauge size={14} />} label="Active work" value={String(active.length)} detail={`${jobs.length} retained job cards`} />
        <Signal icon={<CalendarClock size={14} />} label="Promise risk" value={String(atRisk.length)} detail="Active VSRs beyond promise" warn={atRisk.length > 0} />
        <Signal icon={<UserRoundX size={14} />} label="Assignment gaps" value={String(unassigned.length)} detail="Missing mechanic or bay" warn={unassigned.length > 0} />
        <Signal icon={<CircleDollarSign size={14} />} label="Approved WIP" value={money.format(approvedWip)} detail="Estimate value, not booked revenue" />
        <Signal icon={<ClipboardList size={14} />} label="Ready" value={String(ready)} detail="Awaiting payment or release" />
      </section>

      <section className="rounded-xl border border-white/[0.08] bg-[#080808]">
        <div className="grid gap-2 border-b border-white/[0.07] p-4 md:grid-cols-2 xl:grid-cols-[1fr_190px_210px_160px_auto]">
          <label className="relative"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Job, customer, registration, concern…" className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 pl-9 pr-3 text-[10px] text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent" /></label>
          <FilterSelect value={stage} onChange={setStage} label="Stage" options={['All stages', ...activeStates, 'Closed']} />
          <FilterSelect value={mechanic} onChange={setMechanic} label="Mechanic" options={['All mechanics', ...mechanics]} />
          <FilterSelect value={bay} onChange={setBay} label="Bay" options={['All bays', ...bays]} />
          <button onClick={() => setRiskOnly((current) => !current)} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-[9px] ${riskOnly ? 'border-amber-300/30 bg-amber-300/[0.08] text-amber-300' : 'border-white/[0.08] bg-black/20 text-gray-500'}`}><Filter size={12} /> Promise risk</button>
        </div>
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead><tr className="border-b border-white/[0.07] font-mono text-[8px] uppercase tracking-wider text-gray-600"><th className="px-4 py-3">VSR / stage</th><th className="px-4 py-3">Customer & vehicle</th><th className="px-4 py-3">Concern</th><th className="px-4 py-3">Assignment</th><th className="px-4 py-3">Promise</th><th className="px-4 py-3 text-right">Approved</th><th className="w-12 px-4 py-3"></th></tr></thead>
            <tbody>
              {visible.map((job) => {
                const risk = isRisk(job);
                const gap = !job.mechanic || job.mechanic === 'Unassigned' || !job.bay || job.bay === 'Unassigned';
                return (
                  <tr key={job.id} onDoubleClick={() => openJob(job.id)} className="border-b border-white/[0.06] text-[10px] transition hover:bg-white/[0.025]">
                    <td className="px-4 py-4"><button onClick={() => openJob(job.id)} className="font-mono text-[9px] text-vertical-accent hover:underline">{job.id}</button><div className="mt-2"><Status value={job.status} /></div></td>
                    <td className="px-4 py-4"><div className="font-medium text-white">{String(job.customer ?? 'Unlinked customer')}</div><div className="mt-1 text-gray-600">{String(job.vehicle ?? 'Unlinked vehicle')}</div><div className="mt-1 font-mono text-[8px] text-gray-700">{String(job.registration ?? job.vehicleId ?? '')}</div></td>
                    <td className="max-w-sm px-4 py-4 leading-4 text-gray-400">{String(job.concern ?? 'No concern recorded')}</td>
                    <td className="px-4 py-4"><div className={gap ? 'text-amber-300' : 'text-gray-300'}>{String(job.mechanic ?? 'Unassigned')}</div><div className="mt-1 text-gray-600">{String(job.bay ?? 'Unassigned')}</div></td>
                    <td className="px-4 py-4"><div className={risk ? 'flex items-center gap-1.5 text-amber-300' : 'text-gray-300'}>{risk && <AlertTriangle size={11} />}{String(job.promise ?? 'No promise')}</div>{risk && <div className="mt-1 font-mono text-[8px] uppercase text-amber-400/60">Overdue</div>}</td>
                    <td className="px-4 py-4 text-right font-mono text-[10px] text-white">{money.format(Number(job.amount ?? 0))}</td>
                    <td className="px-4 py-4"><button onClick={() => openJob(job.id)} aria-label={`Open ${job.id} job card`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500 hover:border-cyan-300/30 hover:text-cyan-300"><ChevronRight size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!visible.length && <div className="p-10 text-center text-xs text-gray-600">No work orders match these filters in the current operating scope.</div>}
        <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3 font-mono text-[8px] uppercase tracking-wider text-gray-700"><span>{visible.length} of {jobs.length} work orders</span><span>Double-click a row to open the job card</span></div>
      </section>
    </div>
  );
};

const Signal = ({ icon, label, value, detail, warn = false }: { icon: React.ReactNode; label: string; value: string; detail: string; warn?: boolean }) => <div className="bg-[#090909] px-5 py-4"><div className="flex items-center justify-between"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><span className={warn ? 'text-amber-300' : 'text-vertical-accent'}>{icon}</span></div><div className={`mt-2 text-xl font-medium ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</div><div className="mt-1 text-[9px] text-gray-700">{detail}</div></div>;

const FilterSelect = ({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[] }) => <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[10px] text-white outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;

const Status = ({ value }: { value: string }) => {
  const tone = value === 'Closed' ? 'border-gray-500/20 bg-gray-500/[0.05] text-gray-500' : value === 'Ready' ? 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300' : value === 'Awaiting parts' ? 'border-amber-400/20 bg-amber-400/[0.05] text-amber-300' : 'border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-300';
  return <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${tone}`}>{value}</span>;
};
