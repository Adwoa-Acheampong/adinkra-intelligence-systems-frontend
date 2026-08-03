import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Download,
  FileCheck2,
  FilePenLine,
  FileText,
  LockKeyhole,
  Plus,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { AglSignatureCapture } from '../../components/tenant/AglSignatureCapture';
import {
  AGL_FORM_TEMPLATES,
  aglReportingWorkflow,
  type AglFormField,
  type AglFormTemplate,
} from '../../erp/agl/reportingWorkflow';
import { aglExportWorkflow } from '../../erp/agl/exportWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';
import { AglReportBuilderWorkspace } from './AglReportBuilderWorkspace';

const actor = { name: 'AGL Admin', role: 'Administrator' };
type ReportingMode = 'forms' | 'business-reports' | 'managerial-reports';
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });

const initialValues = (template: AglFormTemplate | undefined) => Object.fromEntries(
  (template?.fields ?? []).map((field) => [
    field.key,
    field.auto === 'today' ? new Date().toISOString().slice(0, 10) : field.auto === 'actor' ? actor.name : '',
  ]),
);

export const AglReportingWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: ReportingMode }) => {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  if (moduleId === 'forms') return <FormsWorkspace tenant={tenant} revision={revision} />;
  return <AglReportBuilderWorkspace tenant={tenant} moduleId={moduleId} revision={revision} />;
};

const FormsWorkspace = ({ tenant, revision }: { tenant: Tenant; revision: number }) => {
  const [templateId, setTemplateId] = useState(AGL_FORM_TEMPLATES[0].id);
  const template = AGL_FORM_TEMPLATES.find((item) => item.id === templateId) ?? AGL_FORM_TEMPLATES[0];
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(template));
  const [signature, setSignature] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [preview, setPreview] = useState(false);
  const [approver, setApprover] = useState('Bekoe Adu Benjamin');
  const [approvalSignature, setApprovalSignature] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const submissions = useMemo(() => aglReportingWorkflow.formSubmissions(), [revision]);
  const customers = useMemo(() => aglErpRepository.list('customers'), [revision]);
  const vehicles = useMemo(() => aglErpRepository.list('vehicles'), [revision]);
  const employees = useMemo(() => aglErpRepository.list('employees').filter((item) => item.status === 'Active'), [revision]);
  const departments = useMemo(() => aglErpRepository.list('departments'), [revision]);
  const suppliers = useMemo(() => aglErpRepository.list('suppliers'), [revision]);
  const selected = submissions.find((item) => item.id === selectedId);
  const pending = submissions.filter((item) => item.status === 'Pending').length;
  const approved = submissions.filter((item) => item.status === 'Approved').length;

  const selectTemplate = (id: string) => {
    const next = AGL_FORM_TEMPLATES.find((item) => item.id === id);
    setTemplateId(id);
    setValues(initialValues(next));
    setSignature(null);
    setPreview(false);
    setError('');
  };
  const run = (operation: () => unknown, confirmation: string) => {
    setError('');
    try {
      const result = operation() as AglOperationalRecord | undefined;
      if (result?.id) setSelectedId(result.id);
      setNotice(confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The form operation could not be completed.');
    }
  };
  const selectedValues = safeJson(selected?.payload);
  const printable = preview
    ? { name: template.label, status: signature ? 'Approved' : 'Pending', payload: values, signature, owner: actor.name, submittedAt: new Date().toISOString() }
    : selected
      ? { ...selected, payload: selectedValues, signature: String(selected.signature ?? '') || null }
      : null;

  const renderControl = (field: AglFormField) => {
    const employeeFields = ['receivedBy', 'requestedBy', 'signatory', 'reporter', 'persons'];
    const catalogue = field.key === 'customer'
      ? customers.map((item) => ({ value: String(item.name), label: `${String(item.name)} · ${String(item.phone ?? 'no phone')}` }))
      : field.key === 'vehicle'
        ? vehicles.map((item) => ({ value: `${String(item.registration ?? '')} · ${String(item.vehicle ?? item.name ?? '')}`, label: `${String(item.registration ?? 'Unregistered')} · ${String(item.vehicle ?? item.name ?? '')}` }))
        : employeeFields.includes(field.key)
          ? [
            { value: actor.name, label: `${actor.name} · current operator` },
            ...employees.filter((item) => String(item.name) !== actor.name).map((item) => ({ value: String(item.name), label: `${String(item.name)} · ${String(item.role ?? item.department ?? 'Staff')}` })),
          ]
          : field.key === 'department'
            ? departments.map((item) => ({ value: String(item.name), label: String(item.name) }))
            : field.key === 'vendor'
              ? suppliers.map((item) => ({ value: String(item.name), label: `${String(item.name)} · ${String(item.phone ?? item.email ?? 'Supplier')}` }))
              : field.key === 'budgetCode'
                ? ['Workshop operations', 'Inventory replenishment', 'Customer recovery', 'Safety & compliance', 'Administration'].map((item) => ({ value: item, label: item }))
                : [];
    const catalogueField = ['customer', 'vehicle', 'receivedBy', 'requestedBy', 'signatory', 'reporter', 'persons', 'department', 'vendor', 'budgetCode'].includes(field.key);
    if (catalogueField) return <select value={values[field.key] ?? ''} onChange={(event) => {
      const next = { ...values, [field.key]: event.target.value };
      if (field.key === 'customer') next.phone = String(customers.find((item) => String(item.name) === event.target.value)?.phone ?? values.phone ?? '');
      setValues(next);
    }} required={field.required} className="mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-[#050505] px-3 text-xs text-white"><option value="">{catalogue.length ? `Select ${field.label.toLowerCase()}` : `No ${field.label.toLowerCase()} available in this operating scope`}</option>{catalogue.map((item) => <option key={`${field.key}-${item.value}`} value={item.value}>{item.label}</option>)}</select>;
    if (field.type === 'textarea') return <textarea value={values[field.key] ?? ''} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} placeholder={field.placeholder} required={field.required} className="mt-2 min-h-28 w-full rounded-lg border border-white/[0.08] bg-black/25 p-3 text-xs text-white" />;
    return <input type={field.type} value={values[field.key] ?? ''} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} placeholder={field.placeholder} required={field.required} className="mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" />;
  };

  return (
    <div className="mx-auto max-w-[1700px] space-y-5 pb-12">
      <header className="agl-no-print border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><FilePenLine size={13} /> {tenant.id.toUpperCase()} ERP / controlled forms</div>
        <h1 className="mt-3 text-3xl font-display font-semibold text-white">Forms, signatures & approvals</h1>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">System-filled forms remain editable until submitted, then retain their payload, approval signature, signatory, status, and printable evidence.</p>
      </header>
      <div className="agl-no-print"><Message notice={notice} error={error} onClose={() => { setNotice(''); setError(''); }} /></div>

      <section className="agl-no-print grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FormMetric label="Available templates" value={AGL_FORM_TEMPLATES.length} detail="Controlled operating documents" />
        <FormMetric label="Total submissions" value={submissions.length} detail="Retained with actor and timestamp" />
        <FormMetric label="Pending approval" value={pending} detail="Manager action required" warning={pending > 0} />
        <FormMetric label="Approved & signed" value={approved} detail="Printable governed evidence" />
      </section>

      <div className="agl-no-print grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_390px]">
        <aside className="h-fit rounded-xl border border-white/[0.08] bg-[#090909] p-3">
          <div className="px-2 py-2 font-mono text-[8px] uppercase tracking-wider text-gray-600">Form library</div>
          {AGL_FORM_TEMPLATES.map((item) => (
            <button key={item.id} onClick={() => selectTemplate(item.id)} className={`mt-1 w-full rounded-lg px-3 py-3 text-left transition ${templateId === item.id ? 'bg-cyan-300/[0.07] text-cyan-200' : 'text-gray-500 hover:bg-white/[0.025] hover:text-white'}`}>
              <div className="text-[11px] font-medium">{item.label}</div>
              <div className="mt-1 line-clamp-2 text-[9px] leading-4 text-gray-700">{item.description}</div>
            </button>
          ))}
        </aside>

        <section className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
          <div className="flex items-start justify-between gap-4">
            <div><div className="font-mono text-[8px] uppercase text-cyan-300">Active template</div><h2 className="mt-2 text-base text-white">{template.label}</h2><p className="mt-1 text-[10px] leading-4 text-gray-600">{template.description}</p></div>
            <button onClick={() => setPreview((value) => !value)} className="min-h-9 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400">{preview ? 'Edit form' : 'Preview'}</button>
          </div>
          {!preview ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                run(() => aglReportingWorkflow.submitForm(actor, template.id, values, signature), `${template.label} submitted.`);
                setPreview(true);
              }}
              className="mt-6 space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {template.fields.map((field) => (
                  <label key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{field.label}{field.required ? ' *' : ''}{field.auto && <span className="ml-1 text-emerald-400">· auto</span>}</span>
                    {renderControl(field)}
                  </label>
                ))}
              </div>
              <AglSignatureCapture label="Manager signature (optional immediate approval)" value={signature} onCapture={setSignature} />
              <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-xs font-semibold text-black"><Check size={14} /> Submit and retain</button>
            </form>
          ) : (
            <div className="mt-6"><DocumentPreview record={printable} /></div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#090909] p-4">
            <div className="flex items-center justify-between"><h2 className="text-sm text-white">Recent submissions</h2><span className="font-mono text-[8px] text-gray-600">{submissions.length}</span></div>
            <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto pr-1">
              {submissions.map((item) => (
                <button key={item.id} onClick={() => { setSelectedId(item.id); setPreview(false); setApprovalSignature(null); }} className={`w-full rounded-lg border p-3 text-left ${selectedId === item.id ? 'border-cyan-300/25 bg-cyan-300/[0.05]' : 'border-white/[0.07] bg-black/20'}`}>
                  <div className="flex items-center justify-between gap-3"><span className="font-mono text-[8px] text-cyan-300">{item.id}</span><Status value={item.status} /></div>
                  <div className="mt-2 text-[11px] text-gray-200">{String(item.name)}</div>
                  <div className="mt-1 text-[9px] text-gray-600">{String(item.submittedBy ?? item.owner)}</div>
                </button>
              ))}
            </div>
          </div>
          {selected && (
            <div className="rounded-xl border border-white/[0.08] bg-[#090909] p-4">
              <h2 className="text-sm text-white">Submission controls</h2>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { aglReportingWorkflow.recordPrint(actor, 'forms', selected.id); window.print(); }} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.08] text-[9px] text-gray-400"><Printer size={13} /> Print / PDF</button>
                <button onClick={() => setPreview(false)} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.08] text-[9px] text-gray-400"><FileText size={13} /> Review</button>
              </div>
              {selected.status === 'Pending' && (
                <div className="mt-5 space-y-4 border-t border-white/[0.07] pt-4">
                  <label><span className="font-mono text-[8px] uppercase text-gray-600">Approver</span><input value={approver} onChange={(event) => setApprover(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" /></label>
                  <AglSignatureCapture label="Approval signature" value={approvalSignature} onCapture={setApprovalSignature} />
                  <button onClick={() => run(() => aglReportingWorkflow.approveForm(actor, selected.id, approvalSignature ?? '', approver), `${selected.id} approved and signed.`)} className="min-h-10 w-full rounded-lg bg-emerald-400 text-[10px] font-semibold text-black">Sign and approve</button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {printable && <div className="hidden print:block"><DocumentPreview record={printable} print /></div>}
    </div>
  );
};

export const ReportsWorkspace = ({ tenant, moduleId, revision }: { tenant: Tenant; moduleId: 'business-reports' | 'managerial-reports'; revision: number }) => {
  const [title, setTitle] = useState(moduleId === 'business-reports' ? 'AGL operating report' : 'AGL managerial control report');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [selectedId, setSelectedId] = useState('');
  const [signatory, setSignatory] = useState('Bekoe Adu Benjamin');
  const [signature, setSignature] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const reports = useMemo(() => aglReportingWorkflow.reports(moduleId), [moduleId, revision]);
  const selected = reports.find((report) => report.id === selectedId) ?? reports[0];
  const retainedSnapshot = selected ? safeJson(selected.payload) : {};
  const snapshot = Object.keys(retainedSnapshot).length
    ? retainedSnapshot
    : aglReportingWorkflow.currentSnapshot();
  const run = (operation: () => unknown, confirmation: string) => {
    setError('');
    try {
      const result = operation() as AglOperationalRecord | undefined;
      if (result?.id) setSelectedId(result.id);
      setNotice(confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The report operation could not be completed.');
    }
  };

  return (
    <div className="mx-auto max-w-[1760px] space-y-5 pb-12">
      <header className="agl-no-print flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><FileCheck2 size={13} /> {tenant.id.toUpperCase()} ERP / {moduleId.replace('-', ' ')}</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{moduleId === 'business-reports' ? 'Business reports' : 'Managerial reports'}</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Generate a point-in-time operating pack from the ledgers, retain it as evidence, sign it, and transfer it to PDF through the print layer.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => selected && aglExportWorkflow.xlsx({ key: selected.id, label: String(selected.name), description: 'Report supporting ledgers', modules: ['sales-ledger', 'expenses', 'work-orders', 'stock-ledger', 'attendance', 'payroll'] })} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300"><Download size={14} /> Evidence XLSX</button><button onClick={() => { if (selected) aglReportingWorkflow.recordPrint(actor, moduleId, selected.id); window.print(); }} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Printer size={14} /> Print / PDF</button></div>
      </header>
      <div className="agl-no-print"><Message notice={notice} error={error} onClose={() => { setNotice(''); setError(''); }} /></div>
      <div className="agl-no-print grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)_360px]">
        <aside className="space-y-4">
          <form onSubmit={(event) => { event.preventDefault(); run(() => aglReportingWorkflow.generateReport(actor, moduleId, { ...aglReportingWorkflow.defaultConfig(moduleId === 'business-reports' ? 'sales-activity' : 'mechanic-performance'), title }), `${title} generated.`); }} className="space-y-4 rounded-xl border border-white/[0.08] bg-[#090909] p-4">
            <div className="flex items-center gap-2 text-sm text-white"><Plus size={14} className="text-cyan-300" /> Generate report</div>
            <label><span className="font-mono text-[8px] uppercase text-gray-600">Report title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" /></label>
            <label><span className="font-mono text-[8px] uppercase text-gray-600">Period</span><input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" /></label>
            <button className="min-h-10 w-full rounded-lg bg-cyan-300 text-[10px] font-semibold text-black">Freeze current ledger position</button>
          </form>
          <div className="rounded-xl border border-white/[0.08] bg-[#090909] p-3">
            <div className="px-2 py-2 font-mono text-[8px] uppercase text-gray-600">Retained reports</div>
            <div className="max-h-[460px] space-y-2 overflow-y-auto">
              {reports.map((report) => <button key={report.id} onClick={() => { setSelectedId(report.id); setSignature(null); }} className={`w-full rounded-lg border p-3 text-left ${selected?.id === report.id ? 'border-cyan-300/25 bg-cyan-300/[0.05]' : 'border-white/[0.07] bg-black/20'}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-[8px] text-cyan-300">{report.id}</span><Status value={report.status} /></div><div className="mt-2 text-[11px] text-gray-200">{String(report.name)}</div><div className="mt-1 text-[9px] text-gray-600">{String(report.period ?? report.reference)}</div></button>)}
              {!reports.length && <div className="p-8 text-center text-[10px] text-gray-700">Generate the first retained report.</div>}
            </div>
          </div>
        </aside>
        <ReportDocument record={selected} snapshot={snapshot} />
        <aside className="h-fit rounded-xl border border-white/[0.08] bg-[#090909] p-4">
          <div className="flex items-center gap-2 text-sm text-white"><LockKeyhole size={14} className="text-cyan-300" /> Approval control</div>
          {selected ? (
            selected.status === 'Approved' ? <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.05] p-4 text-[10px] leading-5 text-emerald-200"><ShieldCheck size={15} className="mb-2" />Signed by {String(selected.signatory)} on {new Date(String(selected.signedAt)).toLocaleString()}.</div> : (
              <div className="mt-5 space-y-4">
                <label><span className="font-mono text-[8px] uppercase text-gray-600">Signatory</span><input value={signatory} onChange={(event) => setSignatory(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" /></label>
                <AglSignatureCapture label="Report signature" value={signature} onCapture={setSignature} />
                <button onClick={() => run(() => aglReportingWorkflow.signReport(actor, moduleId, selected.id, signature ?? '', signatory), `${selected.id} signed and approved.`)} className="min-h-10 w-full rounded-lg bg-emerald-400 text-[10px] font-semibold text-black">Sign and approve report</button>
              </div>
            )
          ) : <p className="mt-4 text-[10px] leading-4 text-gray-600">Generate and select a report before approval.</p>}
        </aside>
      </div>
      <div className="hidden print:block"><ReportDocument record={selected} snapshot={snapshot} print /></div>
    </div>
  );
};

const ReportDocument = ({ record, snapshot, print = false }: { record?: AglOperationalRecord; snapshot: Record<string, unknown>; print?: boolean }) => (
  <article className={`${print ? 'agl-print-root' : ''} overflow-hidden rounded-xl border ${print ? 'border-gray-300 bg-white text-black' : 'border-white/[0.08] bg-[#f8f7f3] text-[#121212]'}`}>
    <div className="border-b border-black/10 p-7">
      <div className="flex items-start justify-between gap-6"><div><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-600">AGL OPS · controlled report</div><h2 className="mt-3 font-serif text-3xl font-bold">{String(record?.name ?? 'Live operating position')}</h2><p className="mt-2 text-xs text-gray-500">Automobiles Ghana Limited · {String(record?.period ?? 'Current ledgers')}</p></div><div className="text-right text-[10px] text-gray-500"><div>{String(record?.id ?? 'LIVE-PREVIEW')}</div><div className="mt-1">{new Date(String(record?.generatedAt ?? snapshot.generatedAt ?? new Date())).toLocaleString()}</div></div></div>
    </div>
    <div className="grid grid-cols-2 gap-px bg-black/10 sm:grid-cols-4">
      <PaperMetric label="Revenue" value={money.format(Number(snapshot.revenue ?? 0))} />
      <PaperMetric label="Operating position" value={money.format(Number(snapshot.operatingPosition ?? 0))} />
      <PaperMetric label="Inventory value" value={money.format(Number(snapshot.inventoryValue ?? 0))} />
      <PaperMetric label="Net payroll" value={money.format(Number(snapshot.netPayroll ?? 0))} />
    </div>
    <div className="grid gap-8 p-7 lg:grid-cols-2">
      <PaperSection title="Commerce & finance" rows={[['Orders', snapshot.orders], ['Average order', money.format(Number(snapshot.averageOrder ?? 0))], ['Operating expenses', money.format(Number(snapshot.operatingExpenses ?? 0))], ['Purchase commitments', money.format(Number(snapshot.purchaseCommitments ?? 0))]]} />
      <PaperSection title="Workshop" rows={[['Active jobs', snapshot.activeJobs], ['Completed jobs', snapshot.completedJobs], ['Promise risk', snapshot.promiseRisk], ['Inventory units', snapshot.inventoryUnits]]} />
      <PaperSection title="People" rows={[['Active staff', snapshot.activeStaff], ['Attendance records', snapshot.attendanceRows], ['Excused absences', snapshot.excusedAbsences], ['Payroll', money.format(Number(snapshot.netPayroll ?? 0))]]} />
      <PaperSection title="Control" rows={[['Report state', record?.status ?? 'Live preview'], ['Owner', record?.owner ?? actor.name], ['Signatory', record?.signatory ?? 'Pending'], ['Signed', record?.signedAt ? new Date(String(record.signedAt)).toLocaleString() : 'Pending']]} />
    </div>
    {record?.signature && <div className="border-t border-black/10 p-7"><div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Authorized signature</div><img src={String(record.signature)} alt="Report signature" className="mt-3 max-h-20 max-w-xs" /><p className="mt-2 text-[10px] text-gray-500">{String(record.signatory)}</p></div>}
  </article>
);

const DocumentPreview = ({ record, print = false }: { record: any; print?: boolean }) => {
  if (!record) return null;
  const payload = record.payload ?? {};
  return (
    <article className={`${print ? 'agl-print-root' : ''} rounded-xl border border-black/10 bg-[#f8f7f3] p-7 text-[#121212]`}>
      <div className="flex items-start justify-between gap-6 border-b border-black/10 pb-5"><div><div className="text-[9px] font-bold uppercase tracking-[0.22em] text-red-600">AGL OPS · governed form</div><h2 className="mt-3 font-serif text-3xl font-bold">{String(record.name)}</h2></div><Status value={String(record.status)} /></div>
      <dl className="mt-6 space-y-4">{Object.entries(payload).map(([key, value]) => <div key={key} className="grid gap-1 border-b border-black/[0.06] pb-3 sm:grid-cols-[180px_1fr]"><dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="whitespace-pre-wrap text-sm">{String(value || '—')}</dd></div>)}</dl>
      {record.signature && <div className="mt-8 border-t border-black/10 pt-5"><div className="text-[10px] font-bold uppercase text-gray-500">Approval signature</div><img src={record.signature} alt="Approval signature" className="mt-3 max-h-20 max-w-xs" /><p className="mt-2 text-[10px] text-gray-500">{String(record.approvedBy ?? record.owner)} · {new Date(String(record.approvedAt ?? record.submittedAt)).toLocaleString()}</p></div>}
    </article>
  );
};

const PaperMetric = ({ label, value }: { label: string; value: string }) => <div className="bg-white p-5"><div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</div><div className="mt-2 font-mono text-base font-bold">{value}</div></div>;
const FormMetric = ({ label, value, detail, warning = false }: { label: string; value: number; detail: string; warning?: boolean }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className={`font-mono text-[8px] uppercase tracking-wider ${warning ? 'text-amber-300' : 'text-cyan-300'}`}>{label}</div><div className={`mt-3 text-xl font-display ${warning ? 'text-amber-100' : 'text-white'}`}>{value.toLocaleString()}</div><p className="mt-1 text-[9px] text-gray-600">{detail}</p></article>;
const PaperSection = ({ title, rows }: { title: string; rows: Array<[string, unknown]> }) => <section><h3 className="border-b border-black/15 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{title}</h3><dl className="mt-3 space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 text-xs"><dt className="text-gray-500">{label}</dt><dd className="font-mono font-semibold">{String(value ?? '—')}</dd></div>)}</dl></section>;
const Status = ({ value }: { value: string }) => <span className="inline-flex rounded border border-current/15 px-2 py-1 font-mono text-[8px] uppercase opacity-75">{value}</span>;
const Message = ({ notice, error, onClose }: { notice: string; error: string; onClose: () => void }) => !notice && !error ? null : <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}><span>{error || notice}</span><button onClick={onClose}><X size={13} /></button></div>;
const safeJson = (value: unknown): Record<string, any> => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : (value as Record<string, any>) ?? {};
  } catch {
    return {};
  }
};
