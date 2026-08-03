import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  Car,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Columns3,
  Filter,
  GripVertical,
  Search,
  ShieldCheck,
  UserRoundCog,
  Wrench,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglErpRepository } from '../../erp/agl/repository';
import { aglServiceWorkflow } from '../../erp/agl/serviceWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const stages = ['Intake', 'Diagnosis', 'Awaiting parts', 'In progress', 'Quality control', 'Ready', 'Closed'] as const;
type Stage = typeof stages[number];
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });

const stageTone: Record<Stage, string> = {
  Intake: 'text-sky-300 border-sky-300/20 bg-sky-300/[0.05]',
  Diagnosis: 'text-violet-300 border-violet-300/20 bg-violet-300/[0.05]',
  'Awaiting parts': 'text-amber-300 border-amber-300/20 bg-amber-300/[0.05]',
  'In progress': 'text-cyan-300 border-cyan-300/20 bg-cyan-300/[0.05]',
  'Quality control': 'text-fuchsia-300 border-fuchsia-300/20 bg-fuchsia-300/[0.05]',
  Ready: 'text-emerald-300 border-emerald-300/20 bg-emerald-300/[0.05]',
  Closed: 'text-gray-400 border-white/[0.1] bg-white/[0.025]',
};

export const AglWorkshopBoardWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [mechanic, setMechanic] = useState('All mechanics');
  const [draggedId, setDraggedId] = useState('');
  const [dragTarget, setDragTarget] = useState<Stage | ''>('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const jobs = useMemo(() => aglServiceWorkflow.listJobs(), [revision]);
  const mechanics = useMemo(() => [
    'All mechanics',
    ...Array.from(new Set(jobs.map((job) => String(job.mechanic ?? 'Unassigned')))),
  ], [jobs]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return jobs.filter((job) => (
      (!normalized || JSON.stringify(job).toLowerCase().includes(normalized))
      && (mechanic === 'All mechanics' || String(job.mechanic ?? 'Unassigned') === mechanic)
    ));
  }, [jobs, mechanic, query]);
  const columns = useMemo(() => Object.fromEntries(stages.map((stage) => [
    stage,
    filtered.filter((job) => job.status === stage),
  ])) as Record<Stage, AglOperationalRecord[]>, [filtered]);

  const run = (operation: () => unknown, confirmation: string) => {
    setError('');
    try {
      operation();
      setNotice(confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The job stage could not be changed.');
    }
  };

  const move = (jobId: string, next: Stage) => run(() => {
    const snapshot = aglServiceWorkflow.snapshot(jobId);
    if (snapshot.job.status === 'Closed') {
      throw new Error(`${jobId} is closed. Use Job corrections to reopen it with approval and evidence.`);
    }
    if (next === 'Ready' && snapshot.job.qcState !== 'Pass') {
      throw new Error(`${jobId} needs a passed QC inspection before it can move to Ready.`);
    }
    if (next === 'Closed') {
      throw new Error(`${jobId} can only close through the governed vehicle handover in its Job Card.`);
    }
    aglErpRepository.changeStatus({
      moduleId: 'job-board',
      recordId: jobId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-KANBAN-${Date.now()}`,
      status: next,
      values: {
        stageChangedBy: actor.name,
        stageChangedAt: new Date().toISOString(),
      },
    });
  }, `${jobId} moved to ${next}.`);

  const active = jobs.filter((job) => job.status !== 'Closed');
  const atRisk = active.filter((job) => {
    const promise = new Date(String(job.promise ?? ''));
    return !Number.isNaN(promise.getTime()) && promise < new Date();
  });
  const approvedValue = active.reduce((sum, job) => sum + Number(job.amount ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1920px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">
            <Columns3 size={13} /> {tenant.id.toUpperCase()} ERP / workshop / live board
          </div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">Workshop Kanban</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">
            Drag a vehicle between operating stages or use its stage selector. Every move updates the linked work order and Admin Audit; closure remains gated by QC, invoice payment, and handover.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="relative block min-w-64">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Job, customer, vehicle…" className="h-11 w-full rounded-lg border border-white/[0.1] bg-black/25 pl-9 pr-3 text-xs text-white placeholder:text-gray-700" />
          </label>
          <label className="relative block min-w-52">
            <Filter size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <select value={mechanic} onChange={(event) => setMechanic(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-white/[0.1] bg-[#070707] pl-9 pr-3 text-xs text-white">
              {mechanics.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <button onClick={() => navigate(`/${tenant.verticalId}/tenant/${tenant.id}/erp/intake`)} className="min-h-11 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black">New intake</button>
        </div>
      </header>

      {(notice || error) && (
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>
          <span className="flex items-center gap-2">{error ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}{error || notice}</span>
          <button onClick={() => { setNotice(''); setError(''); }}><X size={13} /></button>
        </div>
      )}

      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-4">
        <Signal label="Active work" value={String(active.length)} detail={`${jobs.length} total retained job cards`} />
        <Signal label="Promise risk" value={String(atRisk.length)} detail="Active jobs beyond promised date" warn={atRisk.length > 0} />
        <Signal label="Approved workload" value={money.format(approvedValue)} detail="Open estimate value, not booked revenue" />
        <Signal label="Ready for release" value={String(columns.Ready.length)} detail="QC passed; complete payment and handover" />
      </section>

      <div className="custom-scrollbar overflow-x-auto pb-3">
        <section className="grid min-w-[2140px] grid-cols-7 gap-3">
          {stages.map((stage) => (
            <div
              key={stage}
              onDragOver={(event) => { event.preventDefault(); setDragTarget(stage); }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragTarget('');
              }}
              onDrop={(event) => {
                event.preventDefault();
                const jobId = event.dataTransfer.getData('text/plain') || draggedId;
                setDragTarget('');
                setDraggedId('');
                if (jobId) move(jobId, stage);
              }}
              className={`min-h-[560px] rounded-xl border p-3 transition ${dragTarget === stage ? 'border-cyan-300/35 bg-cyan-300/[0.04]' : 'border-white/[0.08] bg-[#080808]'}`}
            >
              <div className="flex items-center justify-between gap-3 px-1 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full border ${stageTone[stage]}`} />
                  <h2 className="text-[11px] font-medium text-gray-200">{stage}</h2>
                </div>
                <span className="rounded-md border border-white/[0.07] bg-black/20 px-2 py-1 font-mono text-[8px] text-gray-600">{columns[stage].length}</span>
              </div>
              <div className="mt-2 space-y-3">
                {columns[stage].map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onOpen={() => navigate(`/${tenant.verticalId}/tenant/${tenant.id}/erp/job-cards?job=${job.id}`)}
                    onMove={(next) => move(job.id, next)}
                    onDragStart={(event) => {
                      setDraggedId(job.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', job.id);
                    }}
                    onDragEnd={() => { setDraggedId(''); setDragTarget(''); }}
                    dragging={draggedId === job.id}
                  />
                ))}
                {!columns[stage].length && <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-white/[0.07] text-center font-mono text-[8px] uppercase tracking-wider text-gray-700">Drop job here</div>}
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Control icon={<Bot size={15} />} title="Diagnosis remains attached" detail="FixBot or human recommendations are accepted into the same VSR before execution." />
        <Control icon={<ClipboardCheck size={15} />} title="Ready means QC passed" detail="The board cannot bypass a failed or missing final inspection." />
        <Control icon={<ShieldCheck size={15} />} title="Closed means released" detail="Only the job-card handover can close a vehicle after payment and collection evidence." />
      </section>
    </div>
  );
};

const JobCard = ({
  job,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  job: AglOperationalRecord;
  onOpen: () => void;
  onMove: (stage: Stage) => void;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  dragging: boolean;
}) => {
  const promise = new Date(String(job.promise ?? ''));
  const overdue = job.status !== 'Closed' && !Number.isNaN(promise.getTime()) && promise < new Date();
  return (
    <article
      draggable={job.status !== 'Closed'}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group rounded-xl border border-white/[0.08] bg-[#0d0d0d] p-4 shadow-lg transition ${job.status !== 'Closed' ? 'cursor-grab active:cursor-grabbing' : ''} ${dragging ? 'scale-[0.98] opacity-40' : 'hover:border-white/[0.16]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <GripVertical size={13} className="shrink-0 text-gray-700" />
          <span className="font-mono text-[9px] text-cyan-300">{job.id}</span>
        </div>
        {overdue && <span className="rounded border border-amber-300/20 bg-amber-300/[0.05] px-1.5 py-1 font-mono text-[7px] uppercase text-amber-300">Promise risk</span>}
      </div>
      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/25 text-gray-500"><Car size={15} /></span>
        <div className="min-w-0"><h3 className="truncate text-[11px] font-medium text-gray-100">{String(job.vehicle)}</h3><p className="mt-1 truncate text-[9px] text-gray-600">{String(job.customer)}</p></div>
      </div>
      <p className="mt-4 line-clamp-2 min-h-8 text-[10px] leading-4 text-gray-500">{String(job.concern)}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Fact icon={<UserRoundCog size={11} />} value={String(job.mechanic ?? 'Unassigned')} />
        <Fact icon={<Wrench size={11} />} value={String(job.bay ?? 'Unassigned')} />
        <Fact icon={<Clock3 size={11} />} value={String(job.promise ?? 'No promise')} warn={overdue} />
        <Fact icon={<CheckCircle2 size={11} />} value={money.format(Number(job.amount ?? 0))} />
      </div>
      <div className="mt-4 border-t border-white/[0.07] pt-3">
        <select
          aria-label={`Move ${job.id}`}
          value={job.status}
          disabled={job.status === 'Closed'}
          onChange={(event) => onMove(event.target.value as Stage)}
          className={`h-9 w-full rounded-lg border px-2 font-mono text-[8px] uppercase outline-none disabled:opacity-40 ${stageTone[job.status as Stage] ?? stageTone.Intake}`}
        >
          {stages.map((stage) => <option key={stage} value={stage} className="bg-[#090909] text-white">{stage}</option>)}
        </select>
        <button onClick={onOpen} className="mt-2 flex min-h-9 w-full items-center justify-between rounded-lg border border-white/[0.07] px-3 text-[9px] text-gray-400 hover:border-cyan-300/25 hover:text-cyan-300">
          Open linked job card <ChevronRight size={12} />
        </button>
      </div>
    </article>
  );
};

const Signal = ({ label, value, detail, warn = false }: { label: string; value: string; detail: string; warn?: boolean }) => <div className="bg-[#090909] px-5 py-4"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><div className={`mt-2 text-lg ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</div><div className="mt-1 text-[9px] text-gray-700">{detail}</div></div>;
const Fact = ({ icon, value, warn = false }: { icon: React.ReactNode; value: string; warn?: boolean }) => <div className={`flex min-w-0 items-center gap-1.5 rounded-md border border-white/[0.06] bg-black/20 px-2 py-2 text-[8px] ${warn ? 'text-amber-300' : 'text-gray-600'}`}>{icon}<span className="truncate">{value}</span></div>;
const Control = ({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) => <div className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className="flex items-center gap-2 text-xs text-white">{icon}{title}</div><p className="mt-2 text-[10px] leading-4 text-gray-600">{detail}</p></div>;
