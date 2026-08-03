import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CarFront,
  CheckCircle2,
  ChevronRight,
  ClipboardSignature,
  History,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { Tenant } from '../../types';
import { aglErpRepository } from '../../erp/agl/repository';
import { aglServiceWorkflow } from '../../erp/agl/serviceWorkflow';

type ServiceControlModule = 'job-corrections' | 'vehicle-handovers';

export const AglServiceControlRegisterWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: ServiceControlModule }) => {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [state, setState] = useState('All states');

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const records = useMemo(() => aglErpRepository.list(moduleId), [moduleId, version]);
  const jobs = useMemo(() => aglServiceWorkflow.listJobs(), [version]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => (
      (state === 'All states' || record.status === state)
      && (!needle || JSON.stringify(record).toLowerCase().includes(needle))
    ));
  }, [records, query, state]);

  const corrections = moduleId === 'job-corrections';
  const title = corrections ? 'Job correction control' : 'Vehicle handover register';
  const description = corrections
    ? 'Retain every authorised post-close reopen with its reason, approver, evidence, original release, and linked VSR. Corrections are requested and applied only inside the job card.'
    : 'Review vehicle release evidence, final preparation, supervisor sign-off, collection authority, customer feedback, and the VSR that produced each handover.';
  const basePath = `/${tenant.verticalId}/tenant/${tenant.id}/erp`;
  const eligibleJobs = corrections ? jobs.filter((job) => job.status === 'Closed') : jobs.filter((job) => ['Ready', 'Closed'].includes(job.status));
  const states = corrections ? ['Requested', 'Approved', 'Applied', 'Rejected'] : ['Preparing', 'Ready', 'Released', 'Collection disputed'];
  const primary = records.filter((record) => record.status === (corrections ? 'Requested' : 'Released')).length;
  const controlled = records.filter((record) => corrections ? ['Approved', 'Applied'].includes(record.status) : Boolean(record.supervisor)).length;
  const exceptions = records.filter((record) => corrections ? record.status === 'Rejected' : record.status === 'Collection disputed').length;
  const evidenced = records.filter((record) => Boolean(record.evidenceReference || record.collectedBy || record.customerSignature)).length;

  const openJob = (jobId: string) => navigate(`${basePath}/job-cards?job=${jobId}`);
  const openEligible = () => {
    if (eligibleJobs[0]) openJob(eligibleJobs[0].id);
    else navigate(`${basePath}/job-cards`);
  };

  return (
    <div className="mx-auto max-w-[1640px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><ShieldCheck size={13} /> AGL ERP / Workshop / Release control</div><h1 className="mt-3 flex items-center gap-3 text-3xl font-display font-semibold tracking-tight text-white">{corrections ? <RotateCcw size={26} className="text-vertical-accent" /> : <CarFront size={26} className="text-vertical-accent" />}{title}</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">{description}</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => navigate(`${basePath}/job-board`)} className="min-h-11 rounded-lg border border-white/[0.09] bg-black/25 px-4 text-[10px] text-gray-300">Open job board</button><button onClick={openEligible} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black">{corrections ? <RotateCcw size={14} /> : <ClipboardSignature size={14} />}{corrections ? 'Open closed job' : 'Open release-ready job'}</button></div>
      </header>

      <section aria-label={`${title} operational summary`} className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-4">
        <Signal icon={corrections ? <History size={14} /> : <CarFront size={14} />} label={corrections ? 'Open requests' : 'Released'} value={String(primary)} detail={corrections ? 'Awaiting correction decision' : 'Completed handovers'} warn={corrections && primary > 0} />
        <Signal icon={<CheckCircle2 size={14} />} label={corrections ? 'Approved / applied' : 'Supervisor signed'} value={String(controlled)} detail="Governed control completed" />
        <Signal icon={<AlertTriangle size={14} />} label="Exceptions" value={String(exceptions)} detail={corrections ? 'Rejected correction requests' : 'Collection disputes'} warn={exceptions > 0} />
        <Signal icon={<UserCheck size={14} />} label="Evidence retained" value={String(evidenced)} detail={`${eligibleJobs.length} VSRs currently eligible`} />
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#080808]">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="VSR, customer, vehicle, evidence, approver…" className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 pl-9 pr-3 text-[10px] text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent" /></label>
          <select value={state} onChange={(event) => setState(event.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[10px] text-white outline-none"><option>All states</option>{states.map((option) => <option key={option}>{option}</option>)}</select>
        </div>
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead><tr className="border-b border-white/[0.07] font-mono text-[8px] uppercase tracking-wider text-gray-600"><th className="px-4 py-3">Control record</th><th className="px-4 py-3">Linked VSR</th><th className="px-4 py-3">{corrections ? 'Reason / evidence' : 'Customer / vehicle'}</th><th className="px-4 py-3">{corrections ? 'Authority' : 'Release evidence'}</th><th className="px-4 py-3">State</th><th className="w-12 px-4 py-3"></th></tr></thead>
            <tbody>
              {visible.map((record) => (
                <tr key={record.id} className="border-b border-white/[0.06] text-[10px] hover:bg-white/[0.025]">
                  <td className="px-4 py-4"><div className="font-mono text-[9px] text-vertical-accent">{record.id}</div><div className="mt-1 text-gray-700">{new Date(record.updatedAt).toLocaleString()}</div></td>
                  <td className="px-4 py-4"><button disabled={!record.jobId} onClick={() => openJob(String(record.jobId))} className="font-mono text-[9px] text-cyan-300 disabled:text-gray-700">{String(record.jobId ?? 'Unlinked')}</button><div className="mt-1 text-gray-600">{String(record.originalReleaseAt ?? record.releasedAt ?? '')}</div></td>
                  <td className="max-w-md px-4 py-4"><div className="text-gray-300">{String(corrections ? record.reason ?? 'No reason recorded' : record.customer ?? 'Customer not recorded')}</div><div className="mt-1 text-gray-600">{String(corrections ? record.evidenceReference ?? 'No evidence reference' : record.vehicle ?? '')}</div></td>
                  <td className="px-4 py-4"><div className="text-gray-300">{String(corrections ? record.approver ?? 'Awaiting approver' : record.collectedBy ?? 'Collection pending')}</div><div className="mt-1 text-gray-600">{String(corrections ? record.owner ?? '' : record.supervisor ?? 'Supervisor pending')}</div></td>
                  <td className="px-4 py-4"><Status value={record.status} /></td>
                  <td className="px-4 py-4"><button disabled={!record.jobId} onClick={() => openJob(String(record.jobId))} aria-label={`Open linked job card for ${record.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500 disabled:opacity-25"><ChevronRight size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && <div className="p-10 text-center text-xs text-gray-600">No {corrections ? 'correction' : 'handover'} records match this scope. Start the controlled action from an eligible job card.</div>}
        <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3 font-mono text-[8px] uppercase text-gray-700"><span>{visible.length} of {records.length} controls</span><span>Mutations occur inside the linked VSR</span></div>
      </section>
    </div>
  );
};

const Signal = ({ icon, label, value, detail, warn = false }: { icon: React.ReactNode; label: string; value: string; detail: string; warn?: boolean }) => <div className="bg-[#090909] px-5 py-4"><div className="flex items-center justify-between"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><span className={warn ? 'text-amber-300' : 'text-vertical-accent'}>{icon}</span></div><div className={`mt-2 text-xl font-medium ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</div><div className="mt-1 text-[9px] text-gray-700">{detail}</div></div>;
const Status = ({ value }: { value: string }) => <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${['Released', 'Approved', 'Applied'].includes(value) ? 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300' : ['Rejected', 'Collection disputed'].includes(value) ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-amber-400/20 bg-amber-400/[0.05] text-amber-300'}`}>{value}</span>;
