import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Download,
  Pencil,
  Plus,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglErpRepository } from '../../erp/agl/repository';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const categories = ['Opening', 'Cash reconciliation', 'Sales summary', 'Inventory check', 'Closing', 'Handover', 'Other'] as const;
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

type EntryDraft = {
  date: string;
  category: string;
  name: string;
  notes: string;
  amount: number;
  owner: string;
  flagged: boolean;
};

const emptyDraft = (): EntryDraft => ({
  date: today(),
  category: 'Other',
  name: '',
  notes: '',
  amount: 0,
  owner: 'AGL Admin',
  flagged: false,
});

export const AglDailyOperationsWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [version, setVersion] = useState(0);
  const [category, setCategory] = useState('All');
  const [draft, setDraft] = useState<EntryDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const entries = useMemo(() => aglErpRepository.list('daily-entry'), [version]);
  const filtered = category === 'All' ? entries : entries.filter((entry) => entry.category === category);
  const flagged = entries.filter((entry) => entry.status === 'Flagged');
  const loggedValue = entries.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
  };
  const openEdit = (entry: AglOperationalRecord) => {
    setEditingId(entry.id);
    setDraft({
      date: String(entry.date ?? today()),
      category: String(entry.category ?? 'Other'),
      name: String(entry.name ?? ''),
      notes: String(entry.notes ?? ''),
      amount: Number(entry.amount ?? 0),
      owner: String(entry.owner ?? 'AGL Admin'),
      flagged: entry.status === 'Flagged',
    });
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const values = {
      date: draft.date,
      category: draft.category,
      name: draft.name.trim(),
      notes: draft.notes.trim(),
      amount: Number(draft.amount || 0),
      owner: draft.owner.trim() || actor.name,
      status: draft.flagged ? 'Flagged' : 'Recorded',
    };
    if (editingId) {
      aglErpRepository.update({ moduleId: 'daily-entry', recordId: editingId, actorName: actor.name, actorRole: actor.role, values });
      setFeedback(`${editingId} updated and retained in the Admin Audit log.`);
    } else {
      const created = aglErpRepository.create({ moduleId: 'daily-entry', actorName: actor.name, actorRole: actor.role, values });
      setFeedback(`${created.id} recorded in the live daily operations log.`);
    }
    setDraft(null);
    setEditingId(null);
  };
  const resolve = (entry: AglOperationalRecord) => {
    aglErpRepository.changeStatus({
      moduleId: 'daily-entry',
      recordId: entry.id,
      actorName: actor.name,
      actorRole: actor.role,
      status: entry.status === 'Resolved' ? 'Flagged' : 'Resolved',
      values: {},
    });
    setFeedback(entry.status === 'Resolved' ? `${entry.id} reopened for follow-up.` : `${entry.id} marked resolved.`);
  };
  const remove = (entry: AglOperationalRecord) => {
    if (!window.confirm(`Delete ${entry.id}? The deletion will remain visible in Admin Audit.`)) return;
    aglErpRepository.delete({ moduleId: 'daily-entry', recordId: entry.id, actorName: actor.name, actorRole: actor.role });
    setFeedback(`${entry.id} deleted; its before-state remains in Admin Audit.`);
  };
  const exportCsv = () => {
    const columns = ['id', 'date', 'category', 'name', 'notes', 'amount', 'owner', 'status', 'createdAt', 'updatedAt'];
    const csv = [columns.map(csvCell).join(','), ...filtered.map((entry) => columns.map((key) => csvCell(entry[key])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `agl-daily-operations-${today()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    aglErpRepository.recordAction({
      moduleId: 'daily-entry',
      recordId: `DAY-EXPORT-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'EXPORT',
      summary: `Exported ${filtered.length} daily operations entries as CSV.`,
      values: { category, rows: filtered.length },
    });
    setFeedback(`${filtered.length} daily entries exported.`);
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{tenant.id.toUpperCase()} ERP / MANAGEMENT RECORDS</div>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-display font-semibold text-white"><ClipboardList size={24} className="text-cyan-300" /> Daily operations log</h1>
          <p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">Capture opening, closing, reconciliation, stock-check, and handover facts that do not belong in the sales, workshop, stock, attendance, or finance ledgers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-[10px] text-gray-300"><Download size={13} /> Export CSV</button>
          <button onClick={() => window.print()} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-[10px] text-gray-300"><Printer size={13} /> Print / PDF</button>
          <button onClick={openCreate} className="flex min-h-10 items-center gap-2 rounded-lg bg-cyan-300 px-4 text-[10px] font-semibold text-black"><Plus size={13} /> New entry</button>
        </div>
      </header>

      {feedback && <div className="flex items-center justify-between rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] px-4 py-3 text-xs text-cyan-100"><span className="flex items-center gap-2"><Check size={14} />{feedback}</span><button onClick={() => setFeedback('')} aria-label="Dismiss message"><X size={13} /></button></div>}

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Entries retained" value={entries.length} detail="Live operational entries only" />
        <Metric label="Follow-up flags" value={flagged.length} detail="Exceptions still visible to management" warning={flagged.length > 0} />
        <Metric label="Related value" value={money.format(loggedValue)} detail="Contextual value, not a finance posting" />
      </section>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {['All', ...categories].map((value) => (
          <button key={value} onClick={() => setCategory(value)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[9px] ${category === value ? 'bg-cyan-300 text-black' : 'border border-white/[0.08] text-gray-500'}`}>{value}</button>
        ))}
      </nav>

      <section className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]">
        <table className="w-full min-w-[1050px] text-left text-[10px]">
          <thead className="border-b border-white/[0.08] bg-black/30 text-gray-600"><tr>{['Date', 'Category', 'Summary & evidence', 'Logged by', 'Related value', 'State', 'Actions'].map((head) => <th key={head} className="px-4 py-3 font-normal uppercase tracking-wider">{head}</th>)}</tr></thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-b border-white/[0.06] align-top text-gray-300">
                <td className="px-4 py-4 font-mono text-[9px]">{String(entry.date)}</td>
                <td className="px-4 py-4">{String(entry.category)}</td>
                <td className="px-4 py-4"><strong className="block text-xs text-white">{String(entry.name)}</strong><span className="mt-1 block max-w-xl leading-5 text-gray-500">{String(entry.notes || 'No supporting detail recorded.')}</span><span className="mt-1 block font-mono text-[8px] text-gray-700">{entry.id}</span></td>
                <td className="px-4 py-4">{String(entry.owner)}</td>
                <td className="px-4 py-4">{Number(entry.amount ?? 0) ? money.format(Number(entry.amount)) : '—'}</td>
                <td className="px-4 py-4"><Status value={entry.status} /></td>
                <td className="px-4 py-4"><div className="flex gap-2">
                  <button onClick={() => openEdit(entry)} aria-label={`Edit ${entry.id}`} className="rounded border border-white/[0.08] p-2 text-gray-400 hover:text-white"><Pencil size={12} /></button>
                  {(entry.status === 'Flagged' || entry.status === 'Resolved') && <button onClick={() => resolve(entry)} className="rounded border border-emerald-300/20 px-2 text-[8px] text-emerald-300">{entry.status === 'Resolved' ? 'Reopen' : 'Resolve'}</button>}
                  <button onClick={() => remove(entry)} aria-label={`Delete ${entry.id}`} className="rounded border border-rose-300/15 p-2 text-rose-300"><Trash2 size={12} /></button>
                </div></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-gray-600">No live daily entries match this category.</td></tr>}
          </tbody>
        </table>
      </section>

      {draft && <EntryDialog draft={draft} setDraft={setDraft} editing={Boolean(editingId)} onClose={() => setDraft(null)} onSubmit={save} />}
    </div>
  );
};

const EntryDialog = ({ draft, setDraft, editing, onClose, onSubmit }: { draft: EntryDraft; setDraft: (value: EntryDraft) => void; editing: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) => (
  <div className="custom-scrollbar fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 backdrop-blur-sm">
    <form onSubmit={onSubmit} className="my-auto w-full max-w-2xl rounded-xl border border-white/[0.12] bg-[#0b0b0b] p-5 shadow-2xl">
      <div className="flex items-start justify-between"><div><div className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">{editing ? 'Controlled correction' : 'New operating fact'}</div><h2 className="mt-2 text-xl font-display text-white">{editing ? 'Edit daily entry' : 'Log daily entry'}</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={16} className="text-gray-500" /></button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Operating date"><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required /></Field>
        <Field label="Category"><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <div className="sm:col-span-2"><Field label="Summary"><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></Field></div>
        <div className="sm:col-span-2"><Field label="What happened / evidence"><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></Field></div>
        <Field label="Related value (GHS, optional)"><input type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} /></Field>
        <Field label="Logged by"><input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} required /></Field>
        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-amber-300/15 bg-amber-300/[0.03] px-4 text-[10px] text-amber-100 sm:col-span-2"><input type="checkbox" checked={draft.flagged} onChange={(event) => setDraft({ ...draft, flagged: event.target.checked })} /><AlertTriangle size={13} /> Flag this entry for manager follow-up</label>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-white/[0.1] px-4 text-[10px] text-gray-400">Cancel</button><button className="min-h-10 rounded-lg bg-cyan-300 px-5 text-[10px] font-semibold text-black">{editing ? 'Save controlled correction' : 'Save entry'}</button></div>
    </form>
  </div>
);

const Metric = ({ label, value, detail, warning = false }: { label: string; value: React.ReactNode; detail: string; warning?: boolean }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className={`font-mono text-[8px] uppercase tracking-wider ${warning ? 'text-amber-300' : 'text-cyan-300'}`}>{label}</div><div className="mt-3 text-xl font-display text-white">{value}</div><p className="mt-1 text-[9px] text-gray-600">{detail}</p></article>;
const Status = ({ value }: { value: unknown }) => <span className={`rounded-full border px-2 py-1 text-[8px] ${value === 'Flagged' ? 'border-amber-300/20 bg-amber-300/[0.05] text-amber-200' : value === 'Resolved' ? 'border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200' : 'border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-200'}`}>{String(value)}</span>;
const Field = ({ label, children }: { label: string; children: React.ReactElement }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="mt-2 [&>input]:h-11 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-white/[0.08] [&>input]:bg-black/30 [&>input]:px-3 [&>input]:text-xs [&>input]:text-white [&>select]:h-11 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-white/[0.08] [&>select]:bg-black/30 [&>select]:px-3 [&>select]:text-xs [&>select]:text-white [&>textarea]:min-h-28 [&>textarea]:w-full [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:border-white/[0.08] [&>textarea]:bg-black/30 [&>textarea]:p-3 [&>textarea]:text-xs [&>textarea]:text-white">{children}</div></label>;
