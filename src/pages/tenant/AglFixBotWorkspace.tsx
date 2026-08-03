import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  FilePlus2,
  Link2,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Wrench,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglFixBotWorkflow } from '../../erp/agl/fixBotWorkflow';
import { GlassPanel } from '../../components/ui/GlassPanel';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const emptyForm = {
  customerId: '',
  vehicleId: '',
  jobId: '',
  category: 'Engine & drivetrain',
  urgency: 'Routine',
  symptoms: '',
  warningLights: '',
  obdCodes: '',
  mileage: 0,
  priorWork: '',
  testHistory: '',
  reviewer: '',
  customerConsent: false,
};

export const AglFixBotWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All states');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [lastCaseId, setLastCaseId] = useState('');
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const customers = useMemo(() => aglFixBotWorkflow.customers(), [version]);
  const vehicles = useMemo(() => aglFixBotWorkflow.vehicles(form.customerId), [form.customerId, version]);
  const jobs = useMemo(() => aglFixBotWorkflow.jobs(form.vehicleId), [form.vehicleId, version]);
  const reviewers = useMemo(() => aglFixBotWorkflow.reviewers(), [version]);
  const cases = useMemo(() => aglFixBotWorkflow.cases(), [version]);
  const visibleCases = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cases.filter((diagnosticCase) => (
      (status === 'All states' || diagnosticCase.status === status)
      && (!needle || JSON.stringify(diagnosticCase).toLowerCase().includes(needle))
    ));
  }, [cases, query, status]);

  useEffect(() => {
    if (!form.customerId && customers.length) {
      setForm((current) => ({ ...current, customerId: customers[0].id }));
    }
  }, [customers, form.customerId]);

  useEffect(() => {
    if (!vehicles.some((vehicle) => vehicle.id === form.vehicleId)) {
      setForm((current) => ({ ...current, vehicleId: vehicles[0]?.id ?? '', jobId: '' }));
    }
  }, [vehicles, form.vehicleId]);

  useEffect(() => {
    if (!form.reviewer && reviewers.length) {
      setForm((current) => ({ ...current, reviewer: String(reviewers[0].name) }));
    }
  }, [reviewers, form.reviewer]);

  useEffect(() => {
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicleId);
    if (selectedVehicle && !form.mileage) {
      setForm((current) => ({ ...current, mileage: Number(selectedVehicle.mileage ?? 0) }));
    }
  }, [vehicles, form.vehicleId, form.mileage]);

  const summary = useMemo(() => {
    const withConfidence = cases.filter((item) => Number(item.confidence ?? 0) > 0);
    return {
      review: cases.filter((item) => item.status === 'Human review').length,
      accepted: cases.filter((item) => item.status === 'Accepted').length,
      escalated: cases.filter((item) => item.status === 'Escalated').length,
      attached: cases.filter((item) => Boolean(item.jobId)).length,
      confidence: withConfidence.length
        ? Math.round(withConfidence.reduce((sum, item) => sum + Number(item.confidence), 0) / withConfidence.length)
        : 0,
    };
  }, [cases]);

  const run = (action: () => unknown, confirmation: string) => {
    try {
      setError('');
      action();
      setNotice(confirmation);
    } catch (caught) {
      setNotice('');
      setError(caught instanceof Error ? caught.message : 'The operational action could not be completed.');
    }
  };

  const analyse = () => {
    setWorking(true);
    window.setTimeout(() => {
      try {
        const created = aglFixBotWorkflow.createCase(actor, form);
        setLastCaseId(created.id);
        setNotice(`${created.id} is ready for human review. No job or stock record was changed.`);
        setError('');
        setForm((current) => ({
          ...emptyForm,
          customerId: current.customerId,
          vehicleId: current.vehicleId,
          reviewer: current.reviewer,
        }));
        setExpanded(false);
      } catch (caught) {
        setNotice('');
        setError(caught instanceof Error ? caught.message : 'FixBot could not open the diagnostic case.');
      } finally {
        setWorking(false);
      }
    }, 350);
  };

  const openJob = (jobId: string) => navigate(`/${tenant.verticalId}/tenant/${tenant.id}/erp/job-cards?job=${jobId}`);

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><ShieldCheck size={13} /> AGL ERP / Workshop control</div>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-display font-semibold tracking-tight text-white"><Bot size={27} className="text-vertical-accent" /> FixBot diagnostic operations</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Structure vehicle symptoms, propose an evidence-based test path, route it to a human reviewer, and attach only an accepted conclusion to a governed work order.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate(`/${tenant.verticalId}/tenant/${tenant.id}/erp/job-board`)} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.09] bg-black/25 px-4 text-[10px] text-gray-300"><Wrench size={14} /> Open workshop</button>
          <button onClick={() => setExpanded((current) => !current)} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Sparkles size={14} /> {expanded ? 'Hide intake' : 'New diagnosis'}</button>
        </div>
      </header>

      {(notice || error) && (
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>
          <span className="flex items-center gap-2">{error ? <AlertTriangle size={14} /> : <Check size={14} />}{error || notice}</span>
          <button onClick={() => { setNotice(''); setError(''); }} aria-label="Dismiss message"><X size={13} /></button>
        </div>
      )}

      <section aria-label="FixBot operational control summary" className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-5">
        <Signal icon={<UserRoundCheck size={14} />} label="Human review" value={String(summary.review)} detail="Awaiting an accountable decision" warn={summary.review > 0} />
        <Signal icon={<ClipboardCheck size={14} />} label="Accepted" value={String(summary.accepted)} detail="Human-approved recommendations" />
        <Signal icon={<AlertTriangle size={14} />} label="Escalated" value={String(summary.escalated)} detail="Specialist attention required" warn={summary.escalated > 0} />
        <Signal icon={<Link2 size={14} />} label="Linked jobs" value={String(summary.attached)} detail="Cases attached to VSR job cards" />
        <Signal icon={<CircleGauge size={14} />} label="Avg confidence" value={`${summary.confidence}%`} detail="Context completeness indicator" />
      </section>

      {expanded && (
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white"><BrainCircuit size={16} className="text-vertical-accent" /> Open a governed diagnostic case</div>
            <p className="mt-1 text-[10px] text-gray-600">Customer and vehicle come from their master records. Existing work is optional; otherwise an accepted case can create a linked VSR later.</p>
          </div>
          <div className="grid gap-5 p-5 xl:grid-cols-[0.42fr_0.58fr]">
            <div className="grid content-start gap-4 sm:grid-cols-2">
              <Field label="Customer master"><select value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value, vehicleId: '', jobId: '' })}><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{String(customer.name)} · {String(customer.phone ?? customer.id)}</option>)}</select></Field>
              <Field label="Registered vehicle"><select value={form.vehicleId} onChange={(event) => setForm({ ...form, vehicleId: event.target.value, jobId: '', mileage: 0 })}><option value="">{vehicles.length ? 'Select vehicle' : 'No linked vehicles in this scope'}</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{String(vehicle.registration ?? vehicle.id)} · {String(vehicle.vehicle)}</option>)}</select></Field>
              <Field label="Existing work order (optional)"><select value={form.jobId} onChange={(event) => setForm({ ...form, jobId: event.target.value })}><option value="">Create case without a VSR</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.id} · {String(job.status)}</option>)}</select></Field>
              <Field label="Human reviewer"><select value={form.reviewer} onChange={(event) => setForm({ ...form, reviewer: event.target.value })}><option value="">Select accountable reviewer</option>{reviewers.map((reviewer) => <option key={reviewer.id} value={String(reviewer.name)}>{String(reviewer.name)} · {String(reviewer.role ?? reviewer.department)}</option>)}</select></Field>
              <Field label="Diagnostic area"><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['Engine & drivetrain', 'Electrical & charging', 'Brakes & ABS', 'Steering & suspension', 'Cooling system', 'Air conditioning', 'Body & safety', 'General inspection'].map((option) => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Urgency"><select value={form.urgency} onChange={(event) => setForm({ ...form, urgency: event.target.value })}>{['Routine', 'Urgent', 'Vehicle unsafe'].map((option) => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Odometer"><input type="number" min="0" value={form.mileage || ''} onChange={(event) => setForm({ ...form, mileage: Number(event.target.value) })} placeholder="Current mileage" /></Field>
              <Field label="Warning lights"><input value={form.warningLights} onChange={(event) => setForm({ ...form, warningLights: event.target.value })} placeholder="ABS, check engine, battery…" /></Field>
            </div>
            <div className="space-y-4">
              <Field label="Observed symptoms and customer concern"><textarea className="min-h-24" value={form.symptoms} onChange={(event) => setForm({ ...form, symptoms: event.target.value })} placeholder="What happens, under which conditions, how often, and what did the customer experience?" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="OBD / fault codes"><input value={form.obdCodes} onChange={(event) => setForm({ ...form, obdCodes: event.target.value })} placeholder="e.g. P0302, C0035" /></Field>
                <Field label="Tests already performed"><input value={form.testHistory} onChange={(event) => setForm({ ...form, testHistory: event.target.value })} placeholder="Readings, pressure, scan result…" /></Field>
              </div>
              <Field label="Previous work / relevant history"><textarea className="min-h-20" value={form.priorWork} onChange={(event) => setForm({ ...form, priorWork: event.target.value })} placeholder="Recent repairs, repeat failures, parts replaced, accident history…" /></Field>
              <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-[10px] leading-4 text-gray-400">
                <input type="checkbox" checked={form.customerConsent} onChange={(event) => setForm({ ...form, customerConsent: event.target.checked })} className="mt-0.5 h-4 w-4 accent-cyan-300" />
                <span><strong className="block text-gray-200">Diagnostic consent recorded</strong>The customer authorised diagnostic data capture and understands that FixBot advice requires human review before work or parts are approved.</span>
              </label>
              <button disabled={!form.customerId || !form.vehicleId || !form.reviewer || !form.symptoms.trim() || !form.customerConsent || working} onClick={analyse} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-35"><Sparkles size={14} />{working ? 'Structuring evidence…' : 'Analyse and open human review'}</button>
            </div>
          </div>
        </GlassPanel>
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-medium text-white">Diagnostic case register</h2><p className="mt-1 text-[10px] text-gray-600">Every acceptance, escalation, attachment, and VSR creation is written to Admin Audit.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 pl-9 pr-3 text-[10px] text-white outline-none sm:w-64" placeholder="Case, customer, vehicle, code…" /></label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[10px] text-white outline-none"><option>All states</option>{['Human review', 'Accepted', 'Escalated', 'Intake', 'Analysing'].map((option) => <option key={option}>{option}</option>)}</select>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {visibleCases.map((diagnosticCase) => (
            <CaseCard
              key={diagnosticCase.id}
              diagnosticCase={diagnosticCase}
              highlighted={diagnosticCase.id === lastCaseId}
              onAccept={() => run(() => aglFixBotWorkflow.accept(diagnosticCase.id, actor), `${diagnosticCase.id} accepted after human review.`)}
              onEscalate={() => {
                const reason = window.prompt('Why is specialist escalation required?', String(diagnosticCase.escalationReason ?? ''));
                if (reason !== null) run(() => aglFixBotWorkflow.escalate(diagnosticCase.id, actor, reason), `${diagnosticCase.id} escalated with an audit reason.`);
              }}
              onCreateJob={() => run(() => {
                const job = aglFixBotWorkflow.createJob(diagnosticCase.id, actor);
                window.setTimeout(() => openJob(job.id), 0);
              }, `${diagnosticCase.id} accepted and converted to a linked work order.`)}
              onOpenJob={() => openJob(String(diagnosticCase.jobId))}
            />
          ))}
        </div>
        {!visibleCases.length && <div className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center text-xs text-gray-600">No diagnostic cases match this scope and filter.</div>}
      </section>
    </div>
  );
};

const Signal = ({ icon, label, value, detail, warn = false }: { icon: React.ReactNode; label: string; value: string; detail: string; warn?: boolean }) => (
  <div className="bg-[#090909] px-5 py-4">
    <div className="flex items-center justify-between"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><span className={warn ? 'text-amber-300' : 'text-vertical-accent'}>{icon}</span></div>
    <div className={`mt-2 text-xl font-medium ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</div>
    <div className="mt-1 text-[9px] text-gray-700">{detail}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>
    <div className="mt-2 [&_input]:h-10 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.08] [&_input]:bg-black/25 [&_input]:px-3 [&_input]:text-xs [&_input]:text-white [&_input]:outline-none [&_input]:placeholder:text-gray-700 [&_select]:h-10 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.08] [&_select]:bg-[#090909] [&_select]:px-3 [&_select]:text-xs [&_select]:text-white [&_select]:outline-none [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-white/[0.08] [&_textarea]:bg-black/25 [&_textarea]:p-3 [&_textarea]:text-xs [&_textarea]:leading-5 [&_textarea]:text-white [&_textarea]:outline-none [&_textarea]:placeholder:text-gray-700">{children}</div>
  </label>
);

const CaseCard = ({ diagnosticCase, highlighted, onAccept, onEscalate, onCreateJob, onOpenJob }: {
  diagnosticCase: AglOperationalRecord;
  highlighted: boolean;
  onAccept: () => void;
  onEscalate: () => void;
  onCreateJob: () => void;
  onOpenJob: () => void;
}) => (
  <GlassPanel className={`rounded-xl p-5 ${highlighted ? 'ring-1 ring-cyan-300/40' : ''}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="font-mono text-[9px] text-vertical-accent">{diagnosticCase.id}</div><div className="mt-2 text-sm font-medium text-white">{String(diagnosticCase.customer)}</div><div className="mt-1 text-[10px] text-gray-600">{String(diagnosticCase.vehicle)}</div></div>
      <div className="flex items-center gap-2"><span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] uppercase text-gray-400">{diagnosticCase.status}</span><span className="rounded border border-cyan-300/20 bg-cyan-300/[0.05] px-2 py-1 font-mono text-[8px] text-cyan-300">{Number(diagnosticCase.confidence ?? 0)}% context</span></div>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3"><div className="font-mono text-[8px] uppercase text-gray-600">Observed</div><p className="mt-2 text-[10px] leading-4 text-gray-300">{String(diagnosticCase.symptoms)}</p><div className="mt-2 text-[9px] text-gray-600">{String(diagnosticCase.obdCodes || 'No OBD code recorded')} · {String(diagnosticCase.urgency || 'Routine')}</div></div>
      <div className="rounded-lg border border-cyan-300/10 bg-cyan-300/[0.025] p-3"><div className="font-mono text-[8px] uppercase text-cyan-300">Proposed test path</div><p className="mt-2 text-[10px] leading-4 text-gray-300">{String(diagnosticCase.recommendation)}</p></div>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
      <div className="text-[9px] text-gray-600">Reviewer <span className="text-gray-300">{String(diagnosticCase.owner)}</span>{diagnosticCase.jobId ? <> · VSR <span className="text-cyan-300">{String(diagnosticCase.jobId)}</span></> : null}</div>
      <div className="flex flex-wrap gap-2">
        {['Human review', 'Escalated'].includes(diagnosticCase.status) && <button onClick={onAccept} className="flex min-h-9 items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 text-[9px] text-emerald-300"><ClipboardCheck size={12} /> Accept</button>}
        {diagnosticCase.status !== 'Escalated' && diagnosticCase.status !== 'Accepted' && <button onClick={onEscalate} className="flex min-h-9 items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 text-[9px] text-amber-300"><AlertTriangle size={12} /> Escalate</button>}
        {!diagnosticCase.jobId && ['Human review', 'Accepted'].includes(diagnosticCase.status) && <button onClick={onCreateJob} className="flex min-h-9 items-center gap-2 rounded-lg bg-vertical-accent px-3 text-[9px] font-semibold text-black"><FilePlus2 size={12} /> Accept & create VSR</button>}
        {diagnosticCase.jobId && <button onClick={onOpenJob} className="flex min-h-9 items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] px-3 text-[9px] text-cyan-300">Open job card <ChevronRight size={12} /></button>}
      </div>
    </div>
  </GlassPanel>
);
