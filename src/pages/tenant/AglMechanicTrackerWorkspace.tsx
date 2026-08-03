import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  Check,
  ChevronRight,
  Gauge,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Wrench,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglMechanicWorkflow } from '../../erp/agl/mechanicWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const bays = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5', 'Electrical bay', 'Inspection bay'];

export const AglMechanicTrackerWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [capacity, setCapacity] = useState('All capacity');
  const [jobId, setJobId] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [bay, setBay] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const mechanics = useMemo(() => aglMechanicWorkflow.mechanics(), [version]);
  const jobs = useMemo(() => aglMechanicWorkflow.jobs(), [version]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return mechanics.filter((mechanic) => (
      (capacity === 'All capacity' || mechanic.capacityState === capacity)
      && (!needle || JSON.stringify(mechanic).toLowerCase().includes(needle))
    ));
  }, [mechanics, query, capacity]);
  const unassignedJobs = jobs.filter((job) => !job.mechanic || job.mechanic === 'Unassigned' || !job.bay || job.bay === 'Unassigned');
  const available = mechanics.filter((mechanic) => mechanic.capacityState === 'Available').length;
  const assigned = mechanics.filter((mechanic) => mechanic.capacityState === 'Assigned').length;
  const atCapacity = mechanics.filter((mechanic) => mechanic.capacityState === 'At capacity').length;
  const certified = mechanics.filter((mechanic) => Boolean(mechanic.certification)).length;
  const basePath = `/${tenant.verticalId}/tenant/${tenant.id}/erp`;

  const assign = () => {
    try {
      const assignedJob = aglMechanicWorkflow.assign(actor, { jobId, mechanicId, bay });
      setNotice(`${assignedJob.id} assigned to ${String(assignedJob.mechanic)} in ${String(assignedJob.bay)}. Admin Audit recorded the change.`);
      setError('');
      setJobId('');
      setMechanicId('');
      setBay('');
    } catch (caught) {
      setNotice('');
      setError(caught instanceof Error ? caught.message : 'The assignment could not be completed.');
    }
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-4xl"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><ShieldCheck size={13} /> AGL ERP / Workshop capacity</div><h1 className="mt-3 flex items-center gap-3 text-3xl font-display font-semibold tracking-tight text-white"><Wrench size={26} className="text-vertical-accent" /> Mechanic tracker</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Match active jobs to people, skills, availability, workload, and bays. Performance trends remain in Analytics; this module changes workshop assignments.</p></div><button onClick={() => navigate(`${basePath}/job-board`)} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.09] bg-black/25 px-4 text-[10px] text-gray-300">Open job board <ChevronRight size={13} /></button></header>

      {(notice || error) && <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}><span className="flex items-center gap-2">{error ? <AlertTriangle size={14} /> : <Check size={14} />}{error || notice}</span><button onClick={() => { setNotice(''); setError(''); }}><X size={13} /></button></div>}

      <section aria-label="Mechanic capacity summary" className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-5"><Signal icon={<UserRoundCheck size={14} />} label="Available" value={String(available)} detail="No active assigned job" /><Signal icon={<Wrench size={14} />} label="Assigned" value={String(assigned)} detail="One active job" /><Signal icon={<Gauge size={14} />} label="At capacity" value={String(atCapacity)} detail="Two or more active jobs" warn={atCapacity > 0} /><Signal icon={<AlertTriangle size={14} />} label="Unassigned jobs" value={String(unassignedJobs.length)} detail="Missing person or bay" warn={unassignedJobs.length > 0} /><Signal icon={<Award size={14} />} label="Certified profiles" value={String(certified)} detail={`${mechanics.length} active workshop staff`} /></section>

      <section className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.025] p-5"><div className="flex items-center gap-2 text-sm font-medium text-white"><Wrench size={15} className="text-cyan-300" /> Assign workshop capacity</div><div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_0.7fr_auto]"><Control label="Active work order"><select value={jobId} onChange={(event) => setJobId(event.target.value)}><option value="">Select VSR</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.id} · {String(job.vehicle)} · {String(job.status)}</option>)}</select></Control><Control label="Mechanic"><select value={mechanicId} onChange={(event) => setMechanicId(event.target.value)}><option value="">Select mechanic</option>{mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{String(mechanic.name)} · {String(mechanic.capacityState)}</option>)}</select></Control><Control label="Bay"><select value={bay} onChange={(event) => setBay(event.target.value)}><option value="">Select bay</option>{bays.map((option) => <option key={option}>{option}</option>)}</select></Control><button disabled={!jobId || !mechanicId || !bay} onClick={assign} className="min-h-10 self-end rounded-lg bg-vertical-accent px-5 text-[10px] font-semibold text-black disabled:opacity-35">Assign & audit</button></div></section>

      <section className="space-y-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-medium text-white">Workshop team capacity</h2><p className="mt-1 text-[10px] text-gray-600">Current workload is calculated from live VSR assignments.</p></div><div className="flex gap-2"><label className="relative"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-64 rounded-lg border border-white/[0.08] bg-black/25 pl-9 pr-3 text-[10px] text-white outline-none" placeholder="Name, role, skill, certification…" /></label><select value={capacity} onChange={(event) => setCapacity(event.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[10px] text-white outline-none">{['All capacity', 'Available', 'Assigned', 'At capacity'].map((option) => <option key={option}>{option}</option>)}</select></div></div><div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">{visible.map((mechanic) => <MechanicCard key={mechanic.id} mechanic={mechanic} onOpenJob={(id) => navigate(`${basePath}/job-cards?job=${id}`)} />)}</div>{!visible.length && <div className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center text-xs text-gray-600">No mechanic matches these filters.</div>}</section>
    </div>
  );
};

const Signal = ({ icon, label, value, detail, warn = false }: { icon: React.ReactNode; label: string; value: string; detail: string; warn?: boolean }) => <div className="bg-[#090909] px-5 py-4"><div className="flex items-center justify-between"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><span className={warn ? 'text-amber-300' : 'text-vertical-accent'}>{icon}</span></div><div className={`mt-2 text-xl font-medium ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</div><div className="mt-1 text-[9px] text-gray-700">{detail}</div></div>;
const Control = ({ label, children }: { label: string; children: React.ReactNode }) => <label><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="mt-2 [&_select]:h-10 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.08] [&_select]:bg-[#090909] [&_select]:px-3 [&_select]:text-[10px] [&_select]:text-white [&_select]:outline-none">{children}</div></label>;
const MechanicCard = ({ mechanic, onOpenJob }: { mechanic: AglOperationalRecord; onOpenJob: (jobId: string) => void }) => {
  const jobIds = String(mechanic.currentJobIds ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  const tone = mechanic.capacityState === 'Available' ? 'text-emerald-300 border-emerald-400/20 bg-emerald-400/[0.05]' : mechanic.capacityState === 'At capacity' ? 'text-amber-300 border-amber-400/20 bg-amber-400/[0.05]' : 'text-cyan-300 border-cyan-300/20 bg-cyan-300/[0.05]';
  return <article className="rounded-xl border border-white/[0.08] bg-[#080808] p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-medium text-white">{String(mechanic.name)}</h3><div className="mt-1 text-[10px] text-gray-600">{String(mechanic.employeeRole ?? mechanic.role ?? 'Workshop')}</div></div><span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${tone}`}>{String(mechanic.capacityState)}</span></div><div className="mt-4 grid grid-cols-2 gap-2"><Fact label="Primary skill" value={String(mechanic.skill ?? 'General service')} /><Fact label="Certification" value={String(mechanic.certification ?? 'Not recorded')} /><Fact label="Active jobs" value={String(mechanic.currentJobs ?? 0)} /><Fact label="Current bays" value={String(mechanic.bays || 'None')} /></div>{jobIds.length ? <div className="mt-4 space-y-2 border-t border-white/[0.07] pt-3">{jobIds.map((id) => <button key={id} onClick={() => onOpenJob(id)} className="flex min-h-9 w-full items-center justify-between rounded-lg border border-white/[0.07] px-3 font-mono text-[9px] text-cyan-300">{id}<ChevronRight size={12} /></button>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-white/[0.06] p-3 text-center text-[9px] text-gray-700">Available for assignment</div>}</article>;
};
const Fact = ({ label, value }: { label: string; value: string }) => <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3"><div className="font-mono text-[8px] uppercase text-gray-700">{label}</div><div className="mt-1 truncate text-[10px] text-gray-300">{value}</div></div>;
