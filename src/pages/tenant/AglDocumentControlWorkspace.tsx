import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Archive, Check, FileClock, FilePlus2, FileSignature, FolderLock, Plus, ShieldCheck } from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglDocumentWorkflow } from '../../erp/agl/documentWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };

export const AglDocumentControlWorkspace = ({ tenant }: { tenant: Tenant }) => {
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

  const documents = useMemo(() => aglDocumentWorkflow.documents(), [revision]);
  const activeSelected = selected ? documents.find((item) => item.id === selected.id) ?? selected : null;
  const versions = useMemo(() => activeSelected ? aglDocumentWorkflow.versions(activeSelected.id) : [], [activeSelected, revision]);
  const run = (operation: () => unknown, success: string) => {
    setError('');
    try {
      operation();
      setMessage(success);
      setCreating(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The document action could not be completed.');
    }
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">{tenant.id.toUpperCase()} ERP / controlled records</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">Document control</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Register the business document once, then retain every approved version, effective date, access class, and supersession link. Replacing a file never erases its predecessor.</p>
        </div>
        <button onClick={() => { setCreating(true); setSelected(null); }} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Plus size={15} />Register document</button>
      </header>

      {(message || error) && <div className={`rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>{error || message}</div>}

      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
        <Measure label="Controlled documents" value={String(documents.length)} icon={<FileSignature size={14} />} />
        <Measure label="Effective versions" value={String(aglDocumentWorkflow.versions().filter((item) => item.status === 'Effective').length)} icon={<ShieldCheck size={14} />} />
        <Measure label="Restricted / legal hold" value={String(documents.filter((item) => ['HR restricted', 'Executive restricted', 'Legal hold'].includes(String(item.accessClass))).length)} icon={<FolderLock size={14} />} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <section className="grid content-start gap-3 sm:grid-cols-2">
          {documents.map((item) => (
            <button key={item.id} onClick={() => { setSelected(item); setCreating(false); setError(''); }} className={`rounded-xl border p-5 text-left transition ${selected?.id === item.id ? 'border-vertical-accent/30 bg-vertical-accent/[0.05]' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]'}`}>
              <div className="flex items-start justify-between gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-black/25 text-vertical-accent"><FileSignature size={16} /></div><Status value={item.status} /></div>
              <h2 className="mt-4 text-sm font-medium text-white">{String(item.name)}</h2>
              <div className="mt-2 font-mono text-[8px] text-gray-600">{item.id} · {String(item.category ?? 'Legacy record')}</div>
              <dl className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-[10px]"><Row label="Version" value={item.currentVersion ?? 'Pending'} /><Row label="Owner" value={item.documentOwner ?? item.owner} /><Row label="Access" value={item.accessClass ?? 'Internal'} /><Row label="Evidence" value={item.reference} /></dl>
            </button>
          ))}
        </section>
        <aside className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
          {creating ? <RegisterForm onRun={run} /> : activeSelected ? <DocumentDetail document={activeSelected} versions={versions} onRun={run} /> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><FileClock size={25} className="text-gray-700" /><p className="mt-3 text-xs text-gray-500">Select a controlled document</p><p className="mt-2 max-w-64 text-[10px] leading-4 text-gray-700">Its complete version chain, approver, retention, and file evidence will appear here.</p></div>}
        </aside>
      </div>
    </div>
  );
};

const Measure = ({ label, value, icon }: { label: string; value: string; icon: ReactNode }) => <div className="flex items-center justify-between bg-[#090909] px-4 py-3"><div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><div className="mt-2 text-lg font-medium text-white">{value}</div></div><span className="text-vertical-accent">{icon}</span></div>;
const Status = ({ value }: { value: string }) => <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${value === 'Active' || value === 'Effective' ? 'border-emerald-400/20 text-emerald-300' : value === 'Archived' || value === 'Superseded' ? 'border-white/[0.08] text-gray-500' : 'border-amber-400/20 text-amber-300'}`}>{value}</span>;
const Row = ({ label, value }: { label: string; value: unknown }) => <div className="flex justify-between gap-4"><dt className="text-gray-600">{label}</dt><dd className="max-w-[65%] truncate text-right text-gray-300">{String(value ?? '—')}</dd></div>;
const Field = ({ label, value, onChange, type = 'text', options }: { label: string; value: string; onChange: (value: string) => void; type?: string; options?: string[] }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>{options ? <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0b0b] px-3 text-xs text-white">{options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 text-xs text-white outline-none focus:border-vertical-accent" />}</label>;
const Commit = ({ children }: { children: ReactNode }) => <button type="submit" className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-xs font-semibold text-black"><Check size={14} />{children}</button>;
const PanelTitle = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => <div className="flex items-center gap-2 border-b border-white/[0.07] pb-4 text-xs font-medium text-white"><span className="text-vertical-accent">{icon}</span>{children}</div>;

const RegisterForm = ({ onRun }: { onRun: (operation: () => unknown, success: string) => void }) => {
  const [values, setValues] = useState({ name: '', category: 'Workshop policy', documentOwner: 'AGL Admin', accessClass: 'Internal', retentionRule: 'Active + 7 years', description: '' });
  const field = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onRun(() => aglDocumentWorkflow.register(actor, values), 'Document identity registered. Add an independently approved version to make it effective.'); }}><PanelTitle icon={<FilePlus2 size={15} />}>New document identity</PanelTitle><Field label="Document name" value={values.name} onChange={field('name')} /><Field label="Category" value={values.category} onChange={field('category')} options={['Workshop policy', 'HR policy', 'Employment record', 'Finance evidence', 'Supplier evidence', 'Customer authority', 'Compliance certificate']} /><Field label="Accountable owner" value={values.documentOwner} onChange={field('documentOwner')} /><Field label="Access class" value={values.accessClass} onChange={field('accessClass')} options={['Internal', 'Management', 'HR restricted', 'Executive restricted', 'Legal hold']} /><Field label="Retention rule" value={values.retentionRule} onChange={field('retentionRule')} /><Field label="Description" value={values.description} onChange={field('description')} /><Commit>Register document</Commit></form>;
};

const DocumentDetail = ({ document, versions, onRun }: { document: AglOperationalRecord; versions: AglOperationalRecord[]; onRun: (operation: () => unknown, success: string) => void }) => {
  const [versionLabel, setVersion] = useState(`v${versions.length + 1}.0`);
  const [effectiveDate, setEffectiveDate] = useState('2026-07-30');
  const [evidenceReference, setEvidence] = useState('');
  const [changeSummary, setSummary] = useState('');
  const [author, setAuthor] = useState('AGL Admin');
  const [approver, setApprover] = useState('Bekoe Adu Benjamin');
  const [archiveBasis, setArchiveBasis] = useState('');
  useEffect(() => {
    setVersion(`v${versions.length + 1}.0`);
  }, [versions.length]);
  return <div className="space-y-4"><PanelTitle icon={<FileSignature size={15} />}>{document.id}</PanelTitle><div><div className="text-sm font-medium text-white">{String(document.name)}</div><div className="mt-1 text-[10px] text-gray-600">{String(document.category)} · {String(document.accessClass ?? 'Internal')}</div></div><div className="max-h-56 space-y-2 overflow-y-auto pr-1">{versions.map((version) => <div key={version.id} className="rounded-lg border border-white/[0.07] bg-black/25 p-3"><div className="flex items-center justify-between gap-3"><div className="font-mono text-[9px] text-vertical-accent">{String(version.versionLabel)}</div><Status value={version.status} /></div><p className="mt-2 text-[10px] leading-4 text-gray-500">{String(version.changeSummary)}</p><div className="mt-2 flex justify-between font-mono text-[8px] text-gray-600"><span>{String(version.evidenceReference)}</span><span>{String(version.effectiveDate)}</span></div><div className="mt-2 text-[9px] text-gray-700">Author {String(version.author)} · approved by {String(version.approver)}</div></div>)}{!versions.length && <div className="rounded-lg border border-dashed border-white/[0.07] p-5 text-center text-[10px] text-gray-700">No controlled version yet.</div>}</div>{document.status !== 'Archived' && <form className="space-y-3 border-t border-white/[0.07] pt-4" onSubmit={(event) => { event.preventDefault(); onRun(() => aglDocumentWorkflow.addVersion(document.id, actor, { versionLabel, effectiveDate, evidenceReference, changeSummary, author, approver }), `${versionLabel} approved and made effective; the prior version remains superseded.`); }}><PanelTitle icon={<FilePlus2 size={14} />}>Add effective version</PanelTitle><div className="grid grid-cols-2 gap-3"><Field label="Version" value={versionLabel} onChange={setVersion} /><Field label="Effective date" value={effectiveDate} onChange={setEffectiveDate} type="date" /></div><Field label="File evidence reference" value={evidenceReference} onChange={setEvidence} /><Field label="Change summary" value={changeSummary} onChange={setSummary} /><Field label="Author" value={author} onChange={setAuthor} /><Field label="Independent approver" value={approver} onChange={setApprover} /><Commit>Approve and make effective</Commit></form>}{document.status !== 'Archived' && <div className="space-y-3 border-t border-white/[0.07] pt-4"><Field label="Archive basis" value={archiveBasis} onChange={setArchiveBasis} /><button onClick={() => onRun(() => aglDocumentWorkflow.archive(document.id, actor, archiveBasis), `${document.id} archived without deleting its version history.`)} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:text-white"><Archive size={14} />Archive document</button></div>}</div>;
};
