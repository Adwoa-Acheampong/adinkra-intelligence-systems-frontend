import { useEffect, useMemo, useState } from 'react';
import { Archive, Check, DatabaseBackup, Download, FileInput, Search, ShieldAlert, X } from 'lucide-react';
import type { Tenant } from '../../types';
import { aglErpRepository } from '../../erp/agl/repository';
import { AGL_IMPORT_TARGETS, aglArchiveWorkflow } from '../../erp/agl/archiveWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };

export const AglArchivesWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [version, setVersion] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [target, setTarget] = useState('archives');
  const [structuredFile, setStructuredFile] = useState<File | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  const records = useMemo(() => aglErpRepository.list('archives'), [version]);
  const visible = useMemo(() => records.filter((item) => {
    const text = JSON.stringify(item).toLowerCase();
    const date = String(item.createdAt).slice(0, 10);
    return (!query.trim() || text.includes(query.toLowerCase()))
      && (!from || date >= from)
      && (!to || date <= to);
  }), [records, query, from, to]);
  const imported = records.filter((item) => item.sourceType === 'Structured file import' || item.importFile).length;

  const importFile = async () => {
    if (!structuredFile) return setFeedback('Choose a CSV or XLSX file first.');
    setBusy(true);
    try {
      const result = await aglArchiveWorkflow.importStructured(actor, structuredFile, target);
      setFeedback(`${result.rows} rows imported into ${result.targetModuleId}. Every row has file-and-row evidence.`);
      setStructuredFile(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The structured import failed.');
    } finally {
      setBusy(false);
    }
  };
  const restore = async () => {
    if (!backupFile) return setFeedback('Choose an AGL JSON backup first.');
    if (!confirmed) return setFeedback('Confirm that you understand the restore mode before continuing.');
    setBusy(true);
    try {
      const result = await aglArchiveWorkflow.restoreJson(actor, backupFile, restoreMode);
      setFeedback(`${restoreMode === 'replace' ? 'Restored' : 'Merged'} ${result.records} records across ${result.modules} modules. The restore is in Admin Audit.`);
      setBackupFile(null);
      setConfirmed(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The backup restore failed.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
    <header className="border-b border-white/[0.08] pb-5"><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{tenant.id.toUpperCase()} ERP / CONTROLLED DATA INTAKE</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">Data archives & imports</h1><p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">Preserve imported historical records, map structured files into governed operational ledgers, and restore AGL JSON backups with explicit merge or replacement intent.</p></header>
    {feedback && <div className="flex items-center justify-between rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] px-4 py-3 text-xs text-cyan-100"><span className="flex items-center gap-2"><Check size={14} />{feedback}</span><button onClick={() => setFeedback('')}><X size={13} /></button></div>}
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Archive records" value={records.length} detail="Retained historical objects" /><Metric label="File-imported rows" value={imported} detail="Traceable to source file and row" /><Metric label="Visible in filter" value={visible.length} detail="Current review set" /></section>
    <section className="grid gap-4 xl:grid-cols-2">
      <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-300"><FileInput size={17} /></span><div><h2 className="text-sm text-white">Structured CSV / Excel import</h2><p className="mt-1 text-[10px] leading-5 text-gray-500">Map the first worksheet into a supported ledger or retain it as archive-only evidence. Up to 2,000 rows / 5 MB.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Destination"><select value={target} onChange={(event) => setTarget(event.target.value)}>{AGL_IMPORT_TARGETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field><Field label="Source file"><input type="file" accept=".csv,.xlsx,.xls" onChange={(event) => setStructuredFile(event.target.files?.[0] ?? null)} /></Field></div><button disabled={busy || !structuredFile} onClick={importFile} className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 text-[10px] font-semibold text-black disabled:opacity-35"><FileInput size={13} /> Import, map, and audit</button></article>
      <article className="rounded-xl border border-amber-300/20 bg-amber-300/[0.025] p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/[0.05] text-amber-300"><DatabaseBackup size={17} /></span><div><h2 className="text-sm text-white">Restore AGL JSON backup</h2><p className="mt-1 text-[10px] leading-5 text-gray-500">Merge is non-destructive by record ID. Replace overwrites every module present in the backup while retaining newly introduced module seeds.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Restore mode"><select value={restoreMode} onChange={(event) => { setRestoreMode(event.target.value as 'merge' | 'replace'); setConfirmed(false); }}><option value="merge">Merge by record ID</option><option value="replace">Replace imported modules</option></select></Field><Field label="Backup file"><input type="file" accept=".json,application/json" onChange={(event) => setBackupFile(event.target.files?.[0] ?? null)} /></Field></div><label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-[9px] leading-4 text-gray-400"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5" /><span>I reviewed the selected mode and understand that replace changes local operational state. The original file remains outside the ERP.</span></label><button disabled={busy || !backupFile || !confirmed} onClick={restore} className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-amber-300 text-[10px] font-semibold text-black disabled:opacity-35"><ShieldAlert size={13} /> Validate and {restoreMode}</button></article>
    </section>
    <section className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-4 lg:flex-row lg:items-end"><Field label="Search archive"><div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Work order, vehicle, customer, file…" /></div></Field><Field label="From"><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Field><Field label="To"><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></Field><button onClick={() => exportArchive(visible)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-4 text-[10px] text-gray-400"><Download size={13} /> Export filtered CSV</button></div>
      <div className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[1100px] text-left text-[10px]"><thead className="border-b border-white/[0.08] text-gray-600"><tr>{['Archive', 'Reference', 'Source file', 'Source row', 'Owner', 'Captured', 'Status', 'Evidence / notes'].map((head) => <th key={head} className="px-4 py-3 font-normal uppercase tracking-wider">{head}</th>)}</tr></thead><tbody>{visible.map((item) => <tr key={item.id} className="border-b border-white/[0.06] text-gray-300"><td className="px-4 py-4"><span className="flex items-center gap-2"><Archive size={13} className="text-cyan-300" /><strong className="text-white">{String(item.name)}</strong></span><div className="mt-1 font-mono text-[8px] text-gray-600">{item.id}</div></td><td className="px-4 py-4">{String(item.reference ?? '—')}</td><td className="px-4 py-4">{String(item.importFile ?? 'Native')}</td><td className="px-4 py-4">{String(item.importRow ?? '—')}</td><td className="px-4 py-4">{String(item.owner ?? '—')}</td><td className="px-4 py-4">{new Date(item.createdAt).toLocaleString()}</td><td className="px-4 py-4"><span className="rounded-full border border-cyan-300/15 px-2 py-1 text-[8px] text-cyan-200">{item.status}</span></td><td className="max-w-md px-4 py-4 text-gray-500">{String(item.importEvidence ?? item.notes ?? '—')}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
};

const exportArchive = (rows: ReturnType<typeof aglErpRepository.list>) => {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
  const csv = [keys.map(escape).join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
  const href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = href;
  link.download = `agl-data-archives-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(href);
  aglErpRepository.recordAction({ moduleId: 'archives', recordId: `ARCHIVE-EXPORT-${Date.now()}`, actorName: actor.name, actorRole: actor.role, action: 'EXPORT', summary: `Exported ${rows.length} filtered archive records as CSV.` });
};
const Metric = ({ label, value, detail }: { label: string; value: number; detail: string }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">{label}</div><div className="mt-3 text-xl font-display text-white">{value}</div><p className="mt-1 text-[9px] text-gray-600">{detail}</p></article>;
const Field = ({ label, children }: { label: string; children: React.ReactElement }) => <label className="block min-w-0 flex-1"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="mt-2 [&_input]:h-11 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.08] [&_input]:bg-black/30 [&_input]:px-3 [&_input]:text-xs [&_input]:text-white [&_select]:h-11 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.08] [&_select]:bg-black/30 [&_select]:px-3 [&_select]:text-xs [&_select]:text-white">{children}</div></label>;
