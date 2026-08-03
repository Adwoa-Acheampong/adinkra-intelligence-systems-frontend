import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Bot,
  Car,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Package,
  Plus,
  Printer,
  ReceiptText,
  Search,
  UserRoundCog,
  Wrench,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import { GlassPanel } from '../../components/ui/GlassPanel';
import type { AglJobCardSnapshot, ServiceActor } from '../../erp/agl/serviceWorkflow';
import { aglServiceWorkflow } from '../../erp/agl/serviceWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';
import { AglQualityHandoverPanel } from './AglQualityHandoverPanel';

const actor: ServiceActor = { name: 'AGL Admin', role: 'Administrator' };

const money = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 2,
});

const stages = ['Intake', 'Diagnosis', 'Awaiting parts', 'In progress', 'Quality control', 'Ready', 'Closed'];
type JobCardTab = 'diagnosis' | 'labour' | 'parts' | 'quality' | 'finance' | 'evidence';

const tabOptions: Array<{ id: JobCardTab; label: string; icon: React.ReactNode }> = [
  { id: 'diagnosis', label: 'Diagnosis', icon: <Bot size={14} /> },
  { id: 'labour', label: 'Labour', icon: <Clock3 size={14} /> },
  { id: 'parts', label: 'Parts', icon: <Package size={14} /> },
  { id: 'quality', label: 'Quality & release', icon: <ClipboardCheck size={14} /> },
  { id: 'finance', label: 'Invoice & payment', icon: <ReceiptText size={14} /> },
  { id: 'evidence', label: 'Evidence', icon: <FileCheck2 size={14} /> },
];

export const AglJobCardWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [searchParams] = useSearchParams();
  const requestedJobId = searchParams.get('job') ?? '';
  const [version, setVersion] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState(requestedJobId);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<JobCardTab>('diagnosis');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const jobs = useMemo(() => aglServiceWorkflow.listJobs(), [version]);
  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return jobs.filter((job) => !normalized || JSON.stringify(job).toLowerCase().includes(normalized));
  }, [jobs, query]);

  useEffect(() => {
    if (requestedJobId && jobs.some((job) => job.id === requestedJobId)) {
      setSelectedJobId(requestedJobId);
      return;
    }
    if (!selectedJobId && jobs.length) setSelectedJobId(jobs[0].id);
    if (selectedJobId && !jobs.some((job) => job.id === selectedJobId)) setSelectedJobId(jobs[0]?.id ?? '');
  }, [jobs, requestedJobId, selectedJobId]);

  const snapshot = useMemo<AglJobCardSnapshot | null>(() => (
    selectedJobId ? aglServiceWorkflow.snapshot(selectedJobId) : null
  ), [selectedJobId, version]);

  const run = (action: () => unknown, confirmation: string) => {
    setError('');
    try {
      action();
      setNotice(confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    }
  };

  if (!snapshot) {
    return <div className="flex min-h-[420px] items-center justify-center text-xs text-gray-600">No work orders are available. Create or convert an appointment first.</div>;
  }

  const currentStage = Math.max(0, stages.indexOf(String(snapshot.job.status)));

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-[1760px] space-y-5 pb-12">
      <header className="border-b border-white/[0.08] pb-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">{tenant.name} / ERP / Workshop / Job cards</div>
        <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white">Workshop job card</h1>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">
              One controlled record from customer concern to vehicle release. Labour, parts, evidence, QC, invoice, payment, and audit stay attached to the same VSR.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-[9px] uppercase">
            <button
              type="button"
              onClick={() => printJobCard(snapshot)}
              className="agl-no-print flex min-h-8 items-center gap-2 rounded border border-white/[0.08] px-3 text-gray-400 transition hover:border-cyan-300/30 hover:text-cyan-200"
            >
              <Printer size={12} /> Print / PDF
            </button>
            <span className="rounded border border-white/[0.08] px-2 py-1 text-gray-500">{jobs.length} job cards</span>
            <span className="rounded border border-cyan-400/20 bg-cyan-400/[0.05] px-2 py-1 text-cyan-300">{snapshot.job.id}</span>
            <span className="rounded border border-amber-400/20 bg-amber-400/[0.05] px-2 py-1 text-amber-300">{String(snapshot.job.status)}</span>
          </div>
        </div>
      </header>

      {(notice || error) && (
        <div className={`rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>
          {error || notice}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-3 xl:sticky xl:top-0 xl:self-start">
          <label className="relative block">
            <span className="sr-only">Search job cards</span>
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Job, vehicle, customer…" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent" />
          </label>
          <div className="custom-scrollbar max-h-[calc(100vh-230px)] space-y-2 overflow-y-auto pr-1">
            {filteredJobs.map((job) => {
              const active = job.id === selectedJobId;
              return (
                <button
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setActiveTab('diagnosis');
                    setNotice('');
                    setError('');
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-vertical-accent ${active ? 'border-vertical-accent/35 bg-vertical-accent-glow' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[9px] text-vertical-accent">{job.id}</span>
                    <span className="font-mono text-[8px] uppercase text-gray-600">{String(job.status)}</span>
                  </div>
                  <div className="mt-3 text-xs font-medium text-white">{String(job.vehicle)}</div>
                  <div className="mt-1 text-[10px] text-gray-500">{String(job.customer)}</div>
                  <div className="mt-3 flex items-center justify-between text-[9px] text-gray-600"><span>{String(job.mechanic)}</span><span>{String(job.bay)}</span></div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <GlassPanel className="overflow-hidden rounded-xl">
            <div className="grid gap-px bg-white/[0.06] lg:grid-cols-[1.2fr_0.8fr]">
              <div className="bg-[#090909] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-lg font-medium text-white"><Car size={18} className="text-vertical-accent" /> {String(snapshot.job.vehicle)}</div>
                    <div className="mt-2 text-xs text-gray-500">{String(snapshot.job.customer)} · {String(snapshot.job.concern)}</div>
                  </div>
                  <span className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 font-mono text-[9px] uppercase text-gray-400">{String(snapshot.job.status)}</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <JobFact label="Mechanic" value={String(snapshot.job.mechanic)} icon={<UserRoundCog size={13} />} />
                  <JobFact label="Bay" value={String(snapshot.job.bay)} icon={<Wrench size={13} />} />
                  <JobFact label="Promise" value={String(snapshot.job.promise)} icon={<Clock3 size={13} />} />
                  <JobFact label="Approved" value={money.format(Number(snapshot.job.amount ?? 0))} icon={<CircleDollarSign size={13} />} />
                </div>
              </div>
              <div className="bg-[#080808] p-5">
                <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Release controls</div>
                <div className="mt-4 space-y-2">
                  <ControlState label="Diagnosis" passed={Boolean(snapshot.job.diagnostic)} detail={snapshot.job.fixbotCaseId ? `FixBot ${String(snapshot.job.fixbotCaseId)}` : 'Human diagnosis'} />
                  <ControlState label="Estimate" passed={Boolean(snapshot.job.estimateApprovedAt)} detail={snapshot.job.estimateApprovedAt ? 'Customer authority captured' : 'Approval required'} />
                  <ControlState label="Quality" passed={snapshot.job.qcState === 'Pass'} detail={snapshot.job.qcState ? String(snapshot.job.qcState) : 'Final QC required'} />
                  <ControlState label="Payment" passed={snapshot.invoice?.status === 'Paid'} detail={snapshot.invoice ? `${snapshot.invoice.id} · ${String(snapshot.invoice.status)}` : 'Invoice required'} />
                </div>
              </div>
            </div>

            <div className="custom-scrollbar overflow-x-auto border-t border-white/[0.07] p-4">
              <div className="flex min-w-[820px] items-center">
                {stages.map((stage, index) => {
                  const reached = index <= currentStage;
                  return (
                    <div key={stage} className="flex min-w-0 flex-1 items-center">
                      <div className="min-w-0 flex-1">
                        <div className={`h-1 rounded-full ${reached ? 'bg-vertical-accent' : 'bg-white/[0.07]'}`} />
                        <div className={`mt-2 truncate font-mono text-[8px] uppercase ${index === currentStage ? 'text-vertical-accent' : reached ? 'text-gray-400' : 'text-gray-700'}`}>{stage}</div>
                      </div>
                      {index < stages.length - 1 && <ChevronRight size={12} className="mx-2 shrink-0 text-gray-800" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>

          <div className="custom-scrollbar overflow-x-auto">
            <div className="flex min-w-max gap-1 rounded-xl border border-white/[0.08] bg-black/25 p-1">
              {tabOptions.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-[10px] transition focus:outline-none focus:ring-2 focus:ring-vertical-accent ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-300'}`}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'diagnosis' && <DiagnosisPanel snapshot={snapshot} run={run} />}
          {activeTab === 'labour' && <LabourPanel snapshot={snapshot} run={run} />}
          {activeTab === 'parts' && <PartsPanel snapshot={snapshot} run={run} />}
          {activeTab === 'quality' && (
            <AglQualityHandoverPanel
              snapshot={snapshot}
              actor={actor}
              onChanged={(confirmation) => {
                setError('');
                setNotice(confirmation);
              }}
              onError={(message) => {
                setNotice('');
                setError(message);
              }}
            />
          )}
          {activeTab === 'finance' && <FinancePanel snapshot={snapshot} run={run} />}
          {activeTab === 'evidence' && <EvidencePanel snapshot={snapshot} run={run} />}
        </main>
      </div>
    </motion.div>
  );
};

const JobFact = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="rounded-lg border border-white/[0.07] bg-black/20 p-3">
    <div className="flex items-center gap-2 font-mono text-[8px] uppercase text-gray-600">{icon}{label}</div>
    <div className="mt-2 truncate text-xs text-gray-200">{value}</div>
  </div>
);

const ControlState = ({ label, passed, detail }: { label: string; passed: boolean; detail: string }) => (
  <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${passed ? 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300' : 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300'}`}>{passed ? <Check size={12} /> : <Clock3 size={11} />}</div>
    <div className="min-w-0"><div className="text-[10px] text-gray-300">{label}</div><div className="truncate text-[8px] text-gray-600">{detail}</div></div>
  </div>
);

type RunAction = (action: () => unknown, confirmation: string) => void;

type DiagnosticFindingDraft = {
  systemComponent: string;
  faultCode: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  finding: string;
  actionRequired: string;
};

const emptyDiagnosticFinding = (): DiagnosticFindingDraft => ({
  systemComponent: 'Engine management',
  faultCode: '',
  severity: 'Medium',
  finding: '',
  actionRequired: '',
});

const DiagnosisPanel = ({ snapshot, run }: { snapshot: AglJobCardSnapshot; run: RunAction }) => {
  const [diagnosis, setDiagnosis] = useState(String(snapshot.job.diagnostic ?? ''));
  const [findingDrafts, setFindingDrafts] = useState<DiagnosticFindingDraft[]>([]);
  useEffect(() => setDiagnosis(String(snapshot.job.diagnostic ?? '')), [snapshot.job.id, snapshot.job.diagnostic]);
  useEffect(() => setFindingDrafts(snapshot.diagnosticFindings.map((record) => ({
    systemComponent: String(record.systemComponent ?? record.name ?? ''),
    faultCode: String(record.faultCode ?? ''),
    severity: (String(record.severity ?? 'Medium') as DiagnosticFindingDraft['severity']),
    finding: String(record.finding ?? record.notes ?? ''),
    actionRequired: String(record.actionRequired ?? record.workOrder ?? ''),
  }))), [snapshot.job.id, snapshot.diagnosticFindings]);
  const relatedFixBot = aglErpRepository.list('fixbot').filter((item) => item.jobId === snapshot.job.id);
  return (
    <GlassPanel className="rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-sm font-medium text-white">Diagnosis and authority</h2><p className="mt-1 text-[10px] text-gray-600">Record the accepted technical conclusion. FixBot recommendations remain advisory until a human accepts them.</p></div>
        <Bot size={16} className="text-vertical-accent" />
      </div>
      <textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Observed condition, tests performed, probable cause, and repair recommendation…" className="mt-5 min-h-36 w-full rounded-xl border border-white/[0.08] bg-black/25 p-4 text-xs leading-5 text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent" />
      <div className="mt-3 flex justify-end">
        <button onClick={() => run(() => aglServiceWorkflow.saveDiagnosis(snapshot.job.id, actor, diagnosis), 'Diagnosis saved to the job card and Admin Audit.')} className="min-h-10 rounded-lg bg-vertical-accent px-4 text-[10px] font-semibold text-black">Save diagnosis</button>
      </div>
      <div className="mt-5 border-t border-white/[0.07] pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Structured diagnostic findings</div><p className="mt-1 text-[9px] leading-4 text-gray-600">Record every inspected system separately so severity, fault evidence, quotation scope, and approved work remain traceable.</p></div>
          <button type="button" onClick={() => setFindingDrafts((current) => [...current, emptyDiagnosticFinding()])} className="flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-300 hover:border-vertical-accent/40"><Plus size={12} /> Add finding</button>
        </div>
        <div className="mt-3 space-y-3">
          {findingDrafts.map((finding, index) => (
            <div key={`${snapshot.job.id}-finding-${index}`} className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.65fr_auto]">
                <Field label="System / component"><select value={finding.systemComponent} onChange={(event) => setFindingDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, systemComponent: event.target.value } : item))}><option>Engine management</option><option>Steering</option><option>Suspension</option><option>Brakes</option><option>Transmission</option><option>Electrical</option><option>Cooling</option><option>Fuel system</option><option>Tyres & alignment</option><option>Body & safety</option><option>HVAC</option><option>Other</option></select></Field>
                <Field label="Fault / OBD code"><input value={finding.faultCode} onChange={(event) => setFindingDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, faultCode: event.target.value } : item))} placeholder="P0302 or visual" /></Field>
                <Field label="Severity"><select value={finding.severity} onChange={(event) => setFindingDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, severity: event.target.value as DiagnosticFindingDraft['severity'] } : item))}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field>
                <button type="button" aria-label={`Remove diagnostic finding ${index + 1}`} onClick={() => setFindingDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mt-5 flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/15 text-red-300 hover:bg-red-400/[0.06]"><X size={13} /></button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Finding / fault description"><textarea value={finding.finding} onChange={(event) => setFindingDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, finding: event.target.value } : item))} placeholder="Observed condition and test evidence…" /></Field>
                <Field label="Action required / work order"><textarea value={finding.actionRequired} onChange={(event) => setFindingDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, actionRequired: event.target.value } : item))} placeholder="Repair, replace, adjust, monitor, or no action…" /></Field>
              </div>
            </div>
          ))}
          {!findingDrafts.length && <div className="rounded-xl border border-dashed border-white/[0.06] p-5 text-center text-[10px] text-gray-600">No structured findings recorded. Add a row after the initial inspection.</div>}
        </div>
        <div className="mt-3 flex justify-end"><button type="button" onClick={() => run(() => aglServiceWorkflow.saveDiagnosticFindings(snapshot.job.id, actor, findingDrafts), `${findingDrafts.length} diagnostic finding${findingDrafts.length === 1 ? '' : 's'} retained against ${snapshot.job.id}.`)} className="min-h-10 rounded-lg border border-cyan-400/25 bg-cyan-400/[0.08] px-4 text-[10px] font-semibold text-cyan-200">Save structured findings</button></div>
      </div>
      <div className="mt-5 border-t border-white/[0.07] pt-4">
        <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Related FixBot cases</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {relatedFixBot.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/[0.07] bg-black/20 p-3">
              <div className="flex justify-between gap-3"><span className="font-mono text-[9px] text-vertical-accent">{item.id}</span><span className="font-mono text-[8px] uppercase text-gray-500">{item.status}</span></div>
              <div className="mt-2 text-[10px] leading-4 text-gray-400">{String(item.recommendation)}</div>
            </div>
          ))}
          {!relatedFixBot.length && <div className="rounded-lg border border-dashed border-white/[0.06] p-4 text-[10px] text-gray-600">Create a FixBot case with this VSR to attach diagnostic assistance.</div>}
        </div>
      </div>
    </GlassPanel>
  );
};

const LabourPanel = ({ snapshot, run }: { snapshot: AglJobCardSnapshot; run: RunAction }) => {
  const [mechanic, setMechanic] = useState(String(snapshot.job.mechanic ?? ''));
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState(1);
  const [rate, setRate] = useState(180);
  return (
    <div className="grid gap-5 lg:grid-cols-[0.38fr_0.62fr]">
      <GlassPanel className="rounded-xl p-5">
        <h2 className="text-sm font-medium text-white">Record labour</h2>
        <div className="mt-4 space-y-3">
          <Field label="Mechanic"><input value={mechanic} onChange={(event) => setMechanic(event.target.value)} /></Field>
          <Field label="Work performed"><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Injector balance test" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hours"><input type="number" min="0.1" step="0.1" value={hours} onChange={(event) => setHours(Number(event.target.value))} /></Field>
            <Field label="Rate (GHS)"><input type="number" min="0" value={rate} onChange={(event) => setRate(Number(event.target.value))} /></Field>
          </div>
          <button disabled={!description.trim() || hours <= 0} onClick={() => run(() => {
            aglServiceWorkflow.addLabour(snapshot.job.id, actor, { mechanic, description, hours, rateGhs: rate });
            setDescription('');
          }, 'Labour posted and work-order totals recalculated.')} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-[10px] font-semibold text-black disabled:opacity-40"><Plus size={13} /> Post labour</button>
        </div>
      </GlassPanel>
      <GlassPanel className="overflow-hidden rounded-xl">
        <PanelHeading title="Labour ledger" detail={`${snapshot.labour.length} entries · ${money.format(snapshot.labourTotalGhs)}`} />
        <RecordRows records={snapshot.labour} empty="No labour has been posted." detail={(item) => `${String(item.mechanic)} · ${String(item.hours)}h × ${money.format(Number(item.rateGhs ?? 0))}`} />
      </GlassPanel>
    </div>
  );
};

const PartsPanel = ({ snapshot, run }: { snapshot: AglJobCardSnapshot; run: RunAction }) => {
  const stock = aglErpRepository.list('stock-ledger');
  const [movementType, setMovementType] = useState<'Reservation' | 'Issue' | 'Return'>('Reservation');
  const [sku, setSku] = useState(String(stock[0]?.sku ?? ''));
  const selectedStock = stock.find((item) => item.sku === sku);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(Number(selectedStock?.unitCost ?? 0));
  useEffect(() => setUnitPrice(Number(selectedStock?.unitCost ?? 0)), [sku, selectedStock?.unitCost]);
  return (
    <div className="grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
      <GlassPanel className="rounded-xl p-5">
        <h2 className="text-sm font-medium text-white">Reserve, issue, or return a part</h2>
        <div className="mt-4 space-y-3">
          <Field label="Stock action"><select value={movementType} onChange={(event) => setMovementType(event.target.value as typeof movementType)}><option>Reservation</option><option>Issue</option><option>Return</option></select></Field>
          <Field label="SKU / part"><select value={sku} onChange={(event) => setSku(event.target.value)}>{stock.map((item) => <option key={item.id} value={String(item.sku)}>{String(item.sku)} · {String(item.name)} · {String(item.quantity)} on hand</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity"><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></Field>
            <Field label="Unit price (GHS)"><input type="number" min="0" value={unitPrice} onChange={(event) => setUnitPrice(Number(event.target.value))} /></Field>
          </div>
          <div className="rounded-lg border border-white/[0.07] bg-black/20 p-3 text-[10px] text-gray-500">
            Available after reservations: <span className="text-white">{Math.max(0, Number(selectedStock?.quantity ?? 0) - Number(selectedStock?.reserved ?? 0))}</span>
          </div>
          <button disabled={!selectedStock || quantity <= 0} onClick={() => run(() => aglServiceWorkflow.addPart(snapshot.job.id, actor, {
            movementType,
            sku,
            name: String(selectedStock?.name ?? sku),
            quantity,
            unitPriceGhs: unitPrice,
            location: String(selectedStock?.location ?? 'Main store'),
          }), `${movementType} posted to the job card and stock ledger.`)} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-[10px] font-semibold text-black disabled:opacity-40"><Package size={13} /> Post {movementType.toLowerCase()}</button>
        </div>
      </GlassPanel>
      <GlassPanel className="overflow-hidden rounded-xl">
        <PanelHeading title="Job parts" detail={`${snapshot.parts.length} entries · ${money.format(snapshot.partsTotalGhs)}`} />
        <RecordRows records={snapshot.parts} empty="No parts have been reserved or issued." detail={(item) => `${String(item.movementType)} · ${String(item.quantity)} × ${money.format(Number(item.unitPriceGhs ?? 0))}`} />
      </GlassPanel>
    </div>
  );
};

const FinancePanel = ({ snapshot, run }: { snapshot: AglJobCardSnapshot; run: RunAction }) => {
  const [method, setMethod] = useState('MoMo');
  const [amount, setAmount] = useState(snapshot.balanceGhs || Number(snapshot.job.amount ?? 0));
  const [reference, setReference] = useState('');
  useEffect(() => setAmount(snapshot.balanceGhs || Number(snapshot.job.amount ?? 0)), [snapshot.job.id, snapshot.balanceGhs, snapshot.job.amount]);
  const estimateTotal = snapshot.labourTotalGhs + snapshot.partsTotalGhs;
  return (
    <div className="grid gap-5 lg:grid-cols-[0.48fr_0.52fr]">
      <GlassPanel className="rounded-xl p-5">
        <h2 className="text-sm font-medium text-white">Estimate and invoice</h2>
        <div className="mt-4 divide-y divide-white/[0.06] text-xs">
          <FinanceLine label="Labour" value={snapshot.labourTotalGhs} />
          <FinanceLine label="Parts" value={snapshot.partsTotalGhs} />
          <FinanceLine label="Calculated estimate" value={estimateTotal} strong />
          <FinanceLine label="Approved job value" value={Number(snapshot.job.amount ?? 0)} />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button onClick={() => run(() => aglServiceWorkflow.approveEstimate(snapshot.job.id, actor), `Estimate of ${money.format(estimateTotal)} approved and audited.`)} disabled={estimateTotal <= 0} className="min-h-10 rounded-lg border border-white/[0.08] px-3 text-[10px] text-gray-300 hover:text-white disabled:opacity-35">Approve estimate</button>
          <button onClick={() => run(() => aglServiceWorkflow.createInvoice(snapshot.job.id, actor), 'Invoice created and posted to the sales ledger.')} disabled={!snapshot.job.estimateApprovedAt || Boolean(snapshot.invoice)} className="min-h-10 rounded-lg bg-vertical-accent px-3 text-[10px] font-semibold text-black disabled:opacity-35">{snapshot.invoice ? `Invoice ${snapshot.invoice.id}` : 'Create invoice'}</button>
          {snapshot.invoice && <button onClick={() => printInvoice(snapshot)} className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] px-3 text-[10px] text-cyan-200 sm:col-span-2"><Printer size={12} /> Print invoice / PDF</button>}
        </div>
      </GlassPanel>
      <GlassPanel className="rounded-xl p-5">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-medium text-white">Take payment</h2><p className="mt-1 text-[10px] text-gray-600">{snapshot.invoice ? `${snapshot.invoice.id} · ${String(snapshot.invoice.status)}` : 'Create the invoice first.'}</p></div><CircleDollarSign size={16} className="text-vertical-accent" /></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Payment method"><select value={method} onChange={(event) => setMethod(event.target.value)}><option>MoMo</option><option>Cash</option><option>POS</option><option>Bank transfer</option><option>Credit</option></select></Field>
          <Field label="Amount (GHS)"><input type="number" min="0" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></Field>
          <div className="sm:col-span-2"><Field label="Payment reference"><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="MoMo transaction, receipt, POS, or bank reference" /></Field></div>
        </div>
        <button disabled={!snapshot.invoice || amount <= 0 || !reference.trim() || snapshot.invoice.status === 'Paid'} onClick={() => run(() => aglServiceWorkflow.recordPayment(snapshot.job.id, actor, { paymentMethod: method, amountGhs: amount, reference }), 'Payment posted to the invoice, payment register, work order, and audit log.')} className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-[10px] font-semibold text-black disabled:opacity-35"><CircleDollarSign size={13} /> Record payment</button>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-4 text-center">
          <FinanceMini label="Invoiced" value={Number(snapshot.invoice?.amount ?? 0)} />
          <FinanceMini label="Paid" value={snapshot.paidGhs} />
          <FinanceMini label="Balance" value={snapshot.balanceGhs} warning={snapshot.balanceGhs > 0} />
        </div>
      </GlassPanel>
    </div>
  );
};

const EvidencePanel = ({ snapshot, run }: { snapshot: AglJobCardSnapshot; run: RunAction }) => {
  const [type, setType] = useState('Technician note');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="grid gap-5 lg:grid-cols-[0.38fr_0.62fr]">
      <GlassPanel className="rounded-xl p-5">
        <h2 className="text-sm font-medium text-white">Attach evidence reference</h2>
        <div className="mt-4 space-y-3">
          <Field label="Evidence type"><select value={type} onChange={(event) => setType(event.target.value)}><option>Technician note</option><option>Diagnostic scan</option><option>Inspection photo</option><option>Customer approval</option><option>Supplier document</option><option>QC sign-off</option></select></Field>
          <Field label="Document / object reference"><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="DOC-…, S3 object key, or controlled file ID" /></Field>
          <Field label="Evidence note"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What this evidence proves…" /></Field>
          <button disabled={!reference.trim()} onClick={() => run(() => {
            aglServiceWorkflow.addEvidence(snapshot.job.id, actor, { evidenceType: type, reference, notes });
            setReference('');
            setNotes('');
          }, 'Evidence reference attached to the job and Admin Audit.')} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-[10px] font-semibold text-black disabled:opacity-35"><Plus size={13} /> Attach evidence</button>
        </div>
      </GlassPanel>
      <GlassPanel className="overflow-hidden rounded-xl">
        <PanelHeading title="Evidence chain" detail={`${snapshot.evidence.length} controlled references`} />
        <RecordRows records={snapshot.evidence} empty="No evidence references have been attached." detail={(item) => `${String(item.reference)} · ${String(item.owner)}`} />
      </GlassPanel>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement> | React.SelectHTMLAttributes<HTMLSelectElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement>> }) => (
  <label className="block">
    <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>
    <div className="mt-2 [&_input]:h-10 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.08] [&_input]:bg-black/25 [&_input]:px-3 [&_input]:text-xs [&_input]:text-white [&_input]:outline-none [&_input]:focus:border-vertical-accent [&_select]:h-10 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.08] [&_select]:bg-[#0b0b0b] [&_select]:px-3 [&_select]:text-xs [&_select]:text-white [&_select]:outline-none [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-white/[0.08] [&_textarea]:bg-black/25 [&_textarea]:p-3 [&_textarea]:text-xs [&_textarea]:text-white [&_textarea]:outline-none">{children}</div>
  </label>
);

const PanelHeading = ({ title, detail }: { title: string; detail: string }) => (
  <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4"><h2 className="text-sm font-medium text-white">{title}</h2><span className="font-mono text-[8px] uppercase text-gray-600">{detail}</span></div>
);

const RecordRows = ({ records, empty, detail }: { records: AglJobCardSnapshot['labour']; empty: string; detail: (record: AglJobCardSnapshot['labour'][number]) => string }) => (
  <div className="divide-y divide-white/[0.06]">
    {records.map((item) => (
      <div key={item.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div><div className="text-xs text-gray-200">{String(item.name)}</div><div className="mt-1 text-[9px] text-gray-600">{detail(item)}</div></div>
        <div className="text-left font-mono text-[9px] text-gray-400 sm:text-right">{Number(item.amount ?? 0) ? money.format(Number(item.amount)) : String(item.status)}</div>
      </div>
    ))}
    {!records.length && <div className="p-8 text-center text-xs text-gray-600">{empty}</div>}
  </div>
);

const FinanceLine = ({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) => (
  <div className={`flex justify-between gap-4 py-3 ${strong ? 'font-medium text-white' : 'text-gray-400'}`}><span>{label}</span><span className="font-mono">{money.format(value)}</span></div>
);

const FinanceMini = ({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) => (
  <div><div className="font-mono text-[8px] uppercase text-gray-600">{label}</div><div className={`mt-2 text-xs ${warning ? 'text-amber-300' : 'text-gray-200'}`}>{money.format(value)}</div></div>
);

const printJobCard = (snapshot: AglJobCardSnapshot) => {
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) return;

  aglErpRepository.recordAction({
    moduleId: 'work-orders',
    recordId: snapshot.job.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'PRINT',
    summary: `Prepared controlled job card ${snapshot.job.id} for print/PDF.`,
  });

  const job = snapshot.job;
  const recalls = aglErpRepository.list('recalls').filter((record) => (
    String(record.jobId ?? record.reference ?? '') === job.id
  ));
  const control = (label: string, passed: boolean, detail: unknown) => `
    <div class="control ${passed ? 'pass' : 'hold'}">
      <strong>${escapeHtml(label)}</strong><span>${passed ? 'PASS' : 'HOLD'}</span>
      <small>${escapeHtml(detail)}</small>
    </div>`;
  const rows = (records: AglJobCardSnapshot['labour'], fields: Array<[string, (record: AglJobCardSnapshot['labour'][number]) => unknown]>) => (
    records.length
      ? records.map((record) => `<tr>${fields.map(([, value]) => `<td>${escapeHtml(value(record))}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${fields.length}" class="empty">No entries recorded</td></tr>`
  );
  const labourFields: Array<[string, (record: AglJobCardSnapshot['labour'][number]) => unknown]> = [
    ['Work performed', (record) => record.name],
    ['Mechanic', (record) => record.mechanic],
    ['Hours', (record) => record.hours],
    ['Rate', (record) => money.format(Number(record.rateGhs ?? 0))],
    ['Amount', (record) => money.format(Number(record.amount ?? 0))],
  ];
  const partFields: typeof labourFields = [
    ['Part / item', (record) => record.name],
    ['Action', (record) => record.movementType],
    ['Quantity', (record) => record.quantity],
    ['Unit price', (record) => money.format(Number(record.unitPriceGhs ?? 0))],
    ['Amount', (record) => money.format(Number(record.amount ?? 0))],
  ];
  const evidenceFields: typeof labourFields = [
    ['Evidence', (record) => record.name],
    ['Type', (record) => record.evidenceType],
    ['Reference', (record) => record.reference],
    ['Owner', (record) => record.owner],
    ['State', (record) => record.status],
  ];
  const total = snapshot.labourTotalGhs + snapshot.partsTotalGhs;
  const diagnosticRows = snapshot.diagnosticFindings.length
    ? snapshot.diagnosticFindings.map((record) => `<tr><td>${escapeHtml(record.systemComponent ?? record.name)}</td><td>${escapeHtml(record.faultCode ?? '—')}</td><td>${escapeHtml(record.finding ?? record.notes)}</td><td>${escapeHtml(record.severity)}</td><td>${escapeHtml(record.actionRequired ?? record.workOrder)}</td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">No structured diagnostic findings recorded</td></tr>';
  const recallRows = recalls.length
    ? recalls.map((record) => `<tr><td>${escapeHtml(record.id)}</td><td>${escapeHtml(record.reason ?? record.notes)}</td><td>${escapeHtml(record.mechanicIds ?? 'Not attributed')}</td><td>${escapeHtml(money.format(Number(record.penaltyGhs ?? record.amount ?? 0)))}</td><td>${escapeHtml(record.status)}</td><td>${escapeHtml(record.resolution ?? 'Open')}</td></tr>`).join('')
    : '<tr><td colspan="6" class="empty">No recalls or financial penalties recorded against this job</td></tr>';

  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(job.id)} · AGL Job Card</title><style>
    *{box-sizing:border-box}body{margin:0;background:#ececea;color:#111;font:12px/1.45 Arial,sans-serif}.page{width:210mm;min-height:297mm;margin:12mm auto;background:#fff;padding:15mm;box-shadow:0 8px 30px #0002}.brand{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #111;padding-bottom:14px}.eyebrow{font-size:10px;letter-spacing:.2em;color:#087f8c;font-weight:700}.brand h1{margin:6px 0 0;font-size:27px}.meta{text-align:right;color:#555}.meta strong{display:block;color:#111;font-size:16px}.facts{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #bbb;border-radius:8px;overflow:hidden;margin-top:18px}.fact{padding:12px;border-right:1px solid #ddd}.fact:last-child{border:0}.label{display:block;color:#777;font-size:8px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px}.summary{display:grid;grid-template-columns:1.25fr .75fr;gap:16px;margin-top:18px}.box{border:1px solid #ccc;border-radius:8px;padding:14px}.box h2,.section h2{font-size:13px;margin:0 0 9px}.concern{white-space:pre-wrap}.controls{display:grid;gap:6px}.control{display:grid;grid-template-columns:1fr auto;gap:3px 12px;border-left:4px solid;padding:8px 9px;background:#f7f7f5}.control.pass{border-color:#11845b}.control.hold{border-color:#c98512}.control span{font-size:9px;font-weight:700}.control small{grid-column:1/-1;color:#666}.section{margin-top:18px;break-inside:avoid}table{width:100%;border-collapse:collapse;border:1px solid #ccc}th{background:#f1f1ee;text-align:left;text-transform:uppercase;letter-spacing:.08em;font-size:8px;color:#666}th,td{padding:8px;border-bottom:1px solid #ddd;vertical-align:top}.empty{text-align:center;color:#888}.financials{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid #bbb;margin-top:18px}.financials div{padding:10px;border-right:1px solid #ddd}.financials div:last-child{border:0}.financials strong{display:block;margin-top:5px;font-size:13px}.footer{margin-top:28px;padding-top:12px;border-top:1px solid #bbb;display:flex;justify-content:space-between;color:#666;font-size:9px}@media print{body{background:#fff}.page{margin:0;width:auto;min-height:auto;box-shadow:none;padding:9mm}@page{size:A4;margin:0}}
  </style></head><body><article class="page">
    <header class="brand"><div><div class="eyebrow">AUTOMOBILES GHANA LIMITED · CONTROLLED WORKSHOP RECORD</div><h1>Vehicle service report</h1></div><div class="meta"><strong>${escapeHtml(job.id)}</strong>${escapeHtml(new Date().toLocaleString('en-GB'))}<br>${escapeHtml(job.siteName ?? job.branchName ?? 'AGL')}</div></header>
    <section class="facts"><div class="fact"><span class="label">Vehicle</span>${escapeHtml(job.vehicle)}</div><div class="fact"><span class="label">Customer</span>${escapeHtml(job.customer)}</div><div class="fact"><span class="label">Mechanic / bay</span>${escapeHtml(job.mechanic)} · ${escapeHtml(job.bay)}</div><div class="fact"><span class="label">Stage / promise</span>${escapeHtml(job.status)} · ${escapeHtml(job.promise)}</div></section>
    <section class="summary"><div class="box"><h2>Customer concern and accepted diagnosis</h2><span class="label">Concern</span><div class="concern">${escapeHtml(job.concern)}</div><span class="label" style="margin-top:12px">Diagnosis</span><div class="concern">${escapeHtml(job.diagnostic ?? 'Not yet recorded')}</div></div><div class="box"><h2>Release controls</h2><div class="controls">${control('Diagnosis', Boolean(job.diagnostic), job.fixbotCaseId ? `FixBot ${String(job.fixbotCaseId)}` : 'Human diagnosis')}${control('Estimate', Boolean(job.estimateApprovedAt), job.estimateApprovedAt ? 'Customer authority captured' : 'Approval required')}${control('Quality', job.qcState === 'Pass', job.qcState ?? 'Final QC required')}${control('Payment', snapshot.invoice?.status === 'Paid', snapshot.invoice ? `${snapshot.invoice.id} · ${String(snapshot.invoice.status)}` : 'Invoice required')}</div></div></section>
    <section class="section"><h2>Diagnostic findings</h2><table><thead><tr><th>System / component</th><th>Fault code</th><th>Finding</th><th>Severity</th><th>Action required</th></tr></thead><tbody>${diagnosticRows}</tbody></table></section>
    <section class="section"><h2>Labour ledger</h2><table><thead><tr>${labourFields.map(([label]) => `<th>${escapeHtml(label)}</th>`).join('')}</tr></thead><tbody>${rows(snapshot.labour, labourFields)}</tbody></table></section>
    <section class="section"><h2>Parts ledger</h2><table><thead><tr>${partFields.map(([label]) => `<th>${escapeHtml(label)}</th>`).join('')}</tr></thead><tbody>${rows(snapshot.parts, partFields)}</tbody></table></section>
    <section class="financials"><div><span class="label">Labour</span><strong>${escapeHtml(money.format(snapshot.labourTotalGhs))}</strong></div><div><span class="label">Parts</span><strong>${escapeHtml(money.format(snapshot.partsTotalGhs))}</strong></div><div><span class="label">Total</span><strong>${escapeHtml(money.format(total))}</strong></div><div><span class="label">Paid</span><strong>${escapeHtml(money.format(snapshot.paidGhs))}</strong></div><div><span class="label">Balance</span><strong>${escapeHtml(money.format(snapshot.balanceGhs))}</strong></div></section>
    <section class="section"><h2>Recalls and remedy history</h2><table><thead><tr><th>Case</th><th>Reason</th><th>Responsible mechanic(s)</th><th>Remedy / penalty</th><th>State</th><th>Resolution</th></tr></thead><tbody>${recallRows}</tbody></table></section>
    <section class="section"><h2>Evidence chain</h2><table><thead><tr>${evidenceFields.map(([label]) => `<th>${escapeHtml(label)}</th>`).join('')}</tr></thead><tbody>${rows(snapshot.evidence, evidenceFields)}</tbody></table></section>
    <footer class="footer"><span>Printed by ${escapeHtml(actor.name)} · ${escapeHtml(actor.role)}</span><span>Source: AGL Operational ERP · ${escapeHtml(job.id)}</span></footer>
  </article><script>window.addEventListener('load',()=>window.print())</script></body></html>`);
  popup.document.close();
};

const printInvoice = (snapshot: AglJobCardSnapshot) => {
  if (!snapshot.invoice) return;
  const invoice = snapshot.invoice;
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) return;
  aglErpRepository.recordAction({
    moduleId: 'invoices',
    recordId: invoice.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'PRINT',
    summary: `Prepared workshop invoice ${invoice.id} from job card ${snapshot.job.id} for print/PDF.`,
  });
  const lines = [
    ...snapshot.labour.map((record) => ({ description: String(record.name), quantity: Number(record.hours ?? 0), unit: Number(record.rateGhs ?? 0), amount: Number(record.amount ?? 0) })),
    ...snapshot.parts.filter((record) => record.status === 'Issue').map((record) => ({ description: String(record.name), quantity: Number(record.quantity ?? 0), unit: Number(record.unitPriceGhs ?? 0), amount: Number(record.amount ?? 0) })),
  ];
  const invoiceTotal = Number(invoice.amount ?? snapshot.labourTotalGhs + snapshot.partsTotalGhs);
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(invoice.id)} · AGL Invoice</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eee;color:#111;font:13px/1.45 Arial,sans-serif}.page{width:210mm;min-height:297mm;margin:12mm auto;background:#fff;padding:18mm;box-shadow:0 8px 30px #0002}header{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #111;padding-bottom:18px}.eyebrow{font-size:9px;font-weight:700;letter-spacing:.2em;color:#087f8c}h1{margin:6px 0 0;font-size:30px}.right{text-align:right}.right strong{display:block;font-size:16px}.parties{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:24px 0}.box{border:1px solid #ccc;border-radius:8px;padding:14px}.label{display:block;margin-bottom:5px;color:#777;font-size:8px;letter-spacing:.12em;text-transform:uppercase}table{width:100%;border-collapse:collapse;border:1px solid #ccc}th{background:#f1f1ee;text-align:left;text-transform:uppercase;letter-spacing:.08em;font-size:8px;color:#666}th,td{padding:10px;border-bottom:1px solid #ddd}th:nth-child(n+2),td:nth-child(n+2){text-align:right}.totals{width:310px;margin:22px 0 0 auto}.totals div{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:8px 0}.totals .due{border-top:2px solid #111;font-size:16px;font-weight:700}.payments{margin-top:28px}.footer{margin-top:42px;border-top:1px solid #bbb;padding-top:12px;display:flex;justify-content:space-between;color:#666;font-size:9px}@media print{body{background:#fff}.page{width:auto;min-height:auto;margin:0;box-shadow:none;padding:10mm}@page{size:A4;margin:0}}
  </style></head><body><article class="page"><header><div><div class="eyebrow">AUTOMOBILES GHANA LIMITED · CUSTOMER DOCUMENT</div><h1>Invoice</h1></div><div class="right"><strong>${escapeHtml(invoice.id)}</strong><span>${escapeHtml(String(invoice.issuedAt ?? invoice.createdAt).slice(0, 10))}</span><br><span>Source ${escapeHtml(snapshot.job.id)}</span></div></header>
  <section class="parties"><div class="box"><span class="label">Bill to</span><strong>${escapeHtml(snapshot.job.customer)}</strong><br>${escapeHtml(snapshot.job.customerContact ?? invoice.customerContact ?? '')}</div><div class="box"><span class="label">Vehicle / service</span><strong>${escapeHtml(snapshot.job.vehicle)}</strong><br>${escapeHtml(snapshot.job.concern)}</div></section>
  <table><thead><tr><th>Description</th><th>Qty / hours</th><th>Unit</th><th>Amount</th></tr></thead><tbody>${lines.length ? lines.map((line) => `<tr><td>${escapeHtml(line.description)}</td><td>${escapeHtml(line.quantity)}</td><td>${escapeHtml(money.format(line.unit))}</td><td>${escapeHtml(money.format(line.amount))}</td></tr>`).join('') : '<tr><td colspan="4">No itemized lines recorded.</td></tr>'}</tbody></table>
  <section class="totals"><div><span>Invoice total</span><strong>${escapeHtml(money.format(invoiceTotal))}</strong></div><div><span>Paid</span><strong>${escapeHtml(money.format(snapshot.paidGhs))}</strong></div><div class="due"><span>Balance due</span><strong>${escapeHtml(money.format(snapshot.balanceGhs))}</strong></div></section>
  <section class="payments"><span class="label">Payment references</span>${snapshot.payments.length ? snapshot.payments.map((payment) => `<div>${escapeHtml(payment.paymentMethod ?? payment.name)} · ${escapeHtml(payment.reference)} · ${escapeHtml(money.format(Number(payment.amount ?? 0)))}</div>`).join('') : '<div>No payment posted.</div>'}</section>
  <footer class="footer"><span>Prepared by ${escapeHtml(actor.name)} · ${escapeHtml(actor.role)}</span><span>${escapeHtml(snapshot.job.siteName ?? snapshot.job.branchName ?? 'AGL')} · ${escapeHtml(invoice.status)}</span></footer></article><script>window.addEventListener('load',()=>window.print())</script></body></html>`);
  popup.document.close();
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');
