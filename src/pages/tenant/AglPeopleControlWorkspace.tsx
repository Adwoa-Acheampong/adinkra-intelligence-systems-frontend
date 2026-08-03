import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BriefcaseBusiness, Check, FileSignature, Gavel, History, Plus, ShieldCheck, UserRoundCheck } from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglPeopleWorkflow } from '../../erp/agl/peopleWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };
type PeopleMode = 'contracts' | 'employee-cases';

export const AglPeopleControlWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: PeopleMode }) => {
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<AglOperationalRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  useEffect(() => { setCreating(false); setSelected(null); setError(''); }, [moduleId]);

  const employees = useMemo(() => aglPeopleWorkflow.employees(), [revision]);
  const records = useMemo(() => moduleId === 'contracts' ? aglPeopleWorkflow.contracts() : aglPeopleWorkflow.cases(), [moduleId, revision]);
  const activeSelected = selected ? records.find((item) => item.id === selected.id) ?? selected : null;
  const events = useMemo(() => activeSelected && moduleId === 'employee-cases' ? aglPeopleWorkflow.caseEvents(activeSelected.id) : [], [activeSelected, moduleId, revision]);

  const run = (operation: () => unknown, success: string) => {
    setError('');
    try {
      operation();
      setMessage(success);
      setCreating(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The people operation could not be completed.');
    }
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">{tenant.id.toUpperCase()} ERP / people records</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">{moduleId === 'contracts' ? 'Employment contract control' : 'Employee relations casebook'}</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">{moduleId === 'contracts' ? 'Maintain signed employment terms as versions. A new contract supersedes the prior active version without deleting it.' : 'Preserve the complaint, contract, employee response, payroll facts, hearing, decision, and appeal as a restricted chronology. The system records procedure and evidence; it does not make a legal judgment.'}</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Plus size={15} />{moduleId === 'contracts' ? 'Register contract version' : 'Open employee case'}</button>
      </header>

      {(message || error) && <div className={`rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>{error || message}</div>}

      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
        <Measure label={moduleId === 'contracts' ? 'Contract versions' : 'Cases retained'} value={String(records.length)} icon={<BriefcaseBusiness size={14} />} />
        <Measure label={moduleId === 'contracts' ? 'Active contracts' : 'Open / in review'} value={String(records.filter((item) => moduleId === 'contracts' ? item.status === 'Active' : ['Open', 'In review', 'Appealed'].includes(item.status)).length)} icon={<UserRoundCheck size={14} />} />
        <Measure label={moduleId === 'employee-cases' ? 'Restricted evidence events' : 'Signed evidence links'} value={String(moduleId === 'employee-cases' ? aglPeopleWorkflow.caseEvents().length : records.filter((item) => item.signedEvidenceReference).length)} icon={<ShieldCheck size={14} />} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="space-y-2">
          {records.map((item) => (
            <button key={item.id} onClick={() => { setSelected(item); setCreating(false); setError(''); }} className={`grid w-full gap-3 rounded-xl border p-4 text-left transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${selected?.id === item.id ? 'border-vertical-accent/30 bg-vertical-accent/[0.05]' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]'}`}>
              <span className="font-mono text-[9px] text-vertical-accent">{item.id}</span>
              <div><div className="text-xs font-medium text-white">{String(item.employee ?? item.name)}</div><div className="mt-1 text-[10px] text-gray-600">{moduleId === 'contracts' ? `${String(item.jobTitle ?? item.name)} · v${String(item.version ?? 'legacy')} · ${String(item.reference ?? '')}` : `${String(item.caseType ?? 'Legacy case')} · ${String(item.subject ?? item.name)} · owner ${String(item.owner ?? '')}`}</div></div>
              <Status value={item.status} />
            </button>
          ))}
          {!records.length && <div className="rounded-xl border border-dashed border-white/[0.08] p-12 text-center text-xs text-gray-600">No governed records yet.</div>}
        </section>
        <aside className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
          {creating ? (
            moduleId === 'contracts' ? <ContractForm employees={employees} onRun={run} /> : <CaseForm employees={employees} contracts={aglPeopleWorkflow.contracts()} onRun={run} />
          ) : activeSelected ? (
            moduleId === 'contracts' ? <ContractDetail record={activeSelected} /> : <CaseDetail record={activeSelected} events={events} onRun={run} />
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center text-center"><FileSignature size={25} className="text-gray-700" /><p className="mt-3 text-xs text-gray-500">Select a record</p><p className="mt-2 max-w-64 text-[10px] leading-4 text-gray-700">Employment terms and case events stay connected to the governed employee identity and their evidence references.</p></div>
          )}
        </aside>
      </div>
    </div>
  );
};

const Measure = ({ label, value, icon }: { label: string; value: string; icon: ReactNode }) => <div className="flex items-center justify-between bg-[#090909] px-4 py-3"><div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><div className="mt-2 text-lg font-medium text-white">{value}</div></div><span className="text-vertical-accent">{icon}</span></div>;
const Status = ({ value }: { value: string }) => <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${['Active', 'Closed'].includes(value) ? 'border-emerald-400/20 text-emerald-300' : ['Terminated', 'Superseded'].includes(value) ? 'border-red-400/20 text-red-300' : 'border-amber-400/20 text-amber-300'}`}>{value}</span>;
const Field = ({ label, value, onChange, type = 'text', options }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; options?: { value: string; label: string }[] }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>{options ? <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0b0b] px-3 text-xs text-white"><option value="">Select…</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 text-xs text-white outline-none focus:border-vertical-accent" />}</label>;
const Commit = ({ children }: { children: ReactNode }) => <button type="submit" className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-xs font-semibold text-black"><Check size={14} />{children}</button>;
const SectionTitle = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => <div className="flex items-center gap-2 border-b border-white/[0.07] pb-4 text-xs font-medium text-white"><span className="text-vertical-accent">{icon}</span>{children}</div>;

const ContractForm = ({ employees, onRun }: { employees: AglOperationalRecord[]; onRun: (operation: () => unknown, success: string) => void }) => {
  const [values, setValues] = useState({ employeeId: employees[0]?.id ?? '', contractType: 'Permanent', jobTitle: '', department: 'Workshop', startDate: '2026-08-01', endDate: '', payBasis: 'Monthly', basePayGhs: 0, noticeTerms: '', policyVersion: 'AGL-HR-2026.2', signedEvidenceReference: '', owner: 'Alex Morgan' });
  const field = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: key === 'basePayGhs' ? Number(value) : value }));
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onRun(() => aglPeopleWorkflow.registerContract(actor, values), 'Signed contract version activated and prior active version retained as superseded.'); }}><SectionTitle icon={<FileSignature size={15} />}>Register signed terms</SectionTitle><Field label="Employee" value={values.employeeId} onChange={field('employeeId')} options={employees.map((item) => ({ value: item.id, label: `${String(item.name)} · ${item.id}` }))} /><Field label="Contract type" value={values.contractType} onChange={field('contractType')} options={['Permanent', 'Fixed term', 'Part time', 'Apprenticeship', 'Contractor'].map((value) => ({ value, label: value }))} /><Field label="Job title" value={values.jobTitle} onChange={field('jobTitle')} /><Field label="Department" value={values.department} onChange={field('department')} /><div className="grid grid-cols-2 gap-3"><Field label="Start date" value={values.startDate} onChange={field('startDate')} type="date" /><Field label="End date" value={values.endDate} onChange={field('endDate')} type="date" /></div><Field label="Pay basis" value={values.payBasis} onChange={field('payBasis')} options={['Monthly', 'Daily', 'Hourly', 'Commission'].map((value) => ({ value, label: value }))} /><Field label="Base pay (GHS)" value={values.basePayGhs} onChange={field('basePayGhs')} type="number" /><Field label="Notice terms" value={values.noticeTerms} onChange={field('noticeTerms')} /><Field label="Policy version" value={values.policyVersion} onChange={field('policyVersion')} /><Field label="Signed evidence reference" value={values.signedEvidenceReference} onChange={field('signedEvidenceReference')} /><Field label="HR owner" value={values.owner} onChange={field('owner')} /><Commit>Activate contract version</Commit><p className="text-[9px] leading-4 text-gray-700">Configuration support only. Employment terms require jurisdiction-specific legal review before use.</p></form>;
};

const CaseForm = ({ employees, contracts, onRun }: { employees: AglOperationalRecord[]; contracts: AglOperationalRecord[]; onRun: (operation: () => unknown, success: string) => void }) => {
  const [values, setValues] = useState({ employeeId: employees[0]?.id ?? '', caseType: 'Grievance', subject: '', summary: '', raisedBy: '', receivedDate: '2026-07-30', contractId: '', initialEvidenceReference: '', caseOwner: 'Alex Morgan', accessClass: 'HR restricted' });
  const field = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const employeeContracts = contracts.filter((item) => !item.employeeId || item.employeeId === values.employeeId);
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onRun(() => aglPeopleWorkflow.openCase(actor, values), 'Restricted employee case opened with its first evidence event.'); }}><SectionTitle icon={<ShieldCheck size={15} />}>Open restricted case</SectionTitle><Field label="Employee" value={values.employeeId} onChange={field('employeeId')} options={employees.map((item) => ({ value: item.id, label: `${String(item.name)} · ${item.id}` }))} /><Field label="Case type" value={values.caseType} onChange={field('caseType')} options={['Grievance', 'Payroll dispute', 'Performance', 'Discipline', 'Safety', 'Termination review', 'Appeal'].map((value) => ({ value, label: value }))} /><Field label="Subject" value={values.subject} onChange={field('subject')} /><Field label="Factual summary" value={values.summary} onChange={field('summary')} /><Field label="Raised by" value={values.raisedBy} onChange={field('raisedBy')} /><Field label="Received date" value={values.receivedDate} onChange={field('receivedDate')} type="date" /><Field label="Governing contract" value={values.contractId} onChange={field('contractId')} options={employeeContracts.map((item) => ({ value: item.id, label: `${item.id} · ${String(item.name)}` }))} /><Field label="Initial evidence reference" value={values.initialEvidenceReference} onChange={field('initialEvidenceReference')} /><Field label="Case owner" value={values.caseOwner} onChange={field('caseOwner')} /><Field label="Access class" value={values.accessClass} onChange={field('accessClass')} options={['HR restricted', 'Executive restricted', 'Legal hold'].map((value) => ({ value, label: value }))} /><Commit>Open case</Commit></form>;
};

const ContractDetail = ({ record }: { record: AglOperationalRecord }) => <div><SectionTitle icon={<FileSignature size={15} />}>{record.id}</SectionTitle><h2 className="mt-4 text-sm font-medium text-white">{String(record.employee ?? record.name)}</h2><dl className="mt-5 space-y-3 text-[10px]">{[['Version', record.version ?? 'Legacy'], ['Role', record.jobTitle ?? record.name], ['Department', record.department ?? '—'], ['Effective', record.startDate ?? record.effectiveAt ?? '—'], ['End', record.endDate ?? 'Open'], ['Pay basis', record.payBasis ?? '—'], ['Policy', record.policyVersion ?? '—'], ['Signed evidence', record.signedEvidenceReference ?? record.reference], ['State', record.status]].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-4"><dt className="text-gray-600">{String(label)}</dt><dd className="max-w-[65%] text-right text-gray-300">{String(value)}</dd></div>)}</dl></div>;

const CaseDetail = ({ record, events, onRun }: { record: AglOperationalRecord; events: AglOperationalRecord[]; onRun: (operation: () => unknown, success: string) => void }) => {
  const [mode, setMode] = useState<'event' | 'decision'>('event');
  const [eventType, setEventType] = useState('Employee response');
  const [eventDate, setEventDate] = useState('2026-07-30');
  const [summary, setSummary] = useState('');
  const [evidence, setEvidence] = useState('');
  const [recordedBy, setRecordedBy] = useState('Alex Morgan');
  const [outcome, setOutcome] = useState<'No action' | 'Remediation' | 'Written warning' | 'Suspension' | 'Termination'>('Remediation');
  const [decisionMaker, setDecisionMaker] = useState('Bekoe Adu Benjamin');
  const [basis, setBasis] = useState('');
  return <div className="space-y-4"><SectionTitle icon={<History size={15} />}>{record.id} · restricted chronology</SectionTitle><div><div className="text-sm font-medium text-white">{String(record.subject ?? record.name)}</div><div className="mt-1 text-[10px] text-gray-600">{String(record.employee)} · {String(record.caseType)} · <Status value={record.status} /></div></div><div className="max-h-64 space-y-2 overflow-y-auto pr-1">{events.map((event) => <div key={event.id} className="rounded-lg border border-white/[0.07] bg-black/25 p-3"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-medium text-white">{String(event.eventType)}</span><span className="font-mono text-[8px] text-gray-600">{String(event.eventDate)}</span></div><p className="mt-2 text-[10px] leading-4 text-gray-500">{String(event.summary)}</p><div className="mt-2 font-mono text-[8px] text-vertical-accent">{String(event.evidenceReference)}</div></div>)}</div>{!['Closed', 'Terminated'].includes(record.status) && <><div className="grid grid-cols-2 gap-2"><button onClick={() => setMode('event')} className={`min-h-9 rounded-lg border text-[10px] ${mode === 'event' ? 'border-vertical-accent/30 text-vertical-accent' : 'border-white/[0.08] text-gray-500'}`}>Add evidence event</button><button onClick={() => setMode('decision')} className={`min-h-9 rounded-lg border text-[10px] ${mode === 'decision' ? 'border-vertical-accent/30 text-vertical-accent' : 'border-white/[0.08] text-gray-500'}`}>Record decision</button></div>{mode === 'event' ? <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onRun(() => aglPeopleWorkflow.addCaseEvent(record.id, actor, { eventType, eventDate, summary, evidenceReference: evidence, recordedBy }), `${eventType} added to ${record.id}.`); }}><Field label="Event type" value={eventType} onChange={setEventType} options={['Contract review', 'Employee response', 'Payroll review', 'Performance evidence', 'Manager response', 'Hearing', 'Witness statement', 'Appeal received'].map((value) => ({ value, label: value }))} /><Field label="Event date" value={eventDate} onChange={setEventDate} type="date" /><Field label="Factual summary" value={summary} onChange={setSummary} /><Field label="Evidence reference" value={evidence} onChange={setEvidence} /><Field label="Recorded by" value={recordedBy} onChange={setRecordedBy} /><Commit>Add restricted event</Commit></form> : <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onRun(() => aglPeopleWorkflow.decideCase(record.id, actor, { outcome, decisionMaker, decisionBasis: basis, decisionEvidenceReference: evidence, effectiveDate: eventDate }), `${record.id} decision recorded with its supporting evidence.`); }}><SectionTitle icon={<Gavel size={14} />}>Controlled decision</SectionTitle><Field label="Outcome" value={outcome} onChange={(value) => setOutcome(value as typeof outcome)} options={['No action', 'Remediation', 'Written warning', 'Suspension', 'Termination'].map((value) => ({ value, label: value }))} /><Field label="Decision maker" value={decisionMaker} onChange={setDecisionMaker} /><Field label="Decision basis" value={basis} onChange={setBasis} /><Field label="Decision evidence" value={evidence} onChange={setEvidence} /><Field label="Effective date" value={eventDate} onChange={setEventDate} type="date" /><Commit>Record decision</Commit>{outcome === 'Termination' && <p className="text-[9px] leading-4 text-amber-300">Termination requires a linked contract plus Contract review, Employee response, and Payroll review events.</p>}</form>}</>}</div>;
};
