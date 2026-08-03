import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRightLeft,
  Boxes,
  Check,
  ClipboardCheck,
  PackageCheck,
  PackageOpen,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglInventoryWorkflow } from '../../erp/agl/inventoryWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });
type Mode = 'catalogue' | 'stock' | 'movements' | 'counts' | 'transfers' | 'provenance';
type Action = 'count' | 'transfer' | 'provenance' | null;

export const AglInventoryControlWorkspace = ({ tenant, moduleId = 'inventory-control' }: { tenant: Tenant; moduleId?: string }) => {
  const [revision, setRevision] = useState(0);
  const [mode, setMode] = useState<Mode>(() => moduleId === 'parts' ? 'catalogue' : moduleId === 'stock-movements' ? 'movements' : 'stock');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AglOperationalRecord | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  useEffect(() => {
    if (moduleId === 'parts') setMode('catalogue');
    else if (moduleId === 'stock-movements') setMode('movements');
    else if (moduleId === 'stock-ledger') setMode('stock');
  }, [moduleId]);

  const catalogue = useMemo(() => aglInventoryWorkflow.catalogue(), [revision]);
  const positions = useMemo(() => aglInventoryWorkflow.positions(), [revision]);
  const movements = useMemo(() => aglInventoryWorkflow.movements(), [revision]);
  const counts = useMemo(() => aglInventoryWorkflow.counts(), [revision]);
  const transfers = useMemo(() => aglInventoryWorkflow.transfers(), [revision]);
  const controls = useMemo(() => aglInventoryWorkflow.controls(), [revision]);
  const visiblePositions = positions.filter((item) => (
    !query.trim() || JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
  ));
  const trustedValue = positions
    .filter((item) => item.status !== 'Quarantined' && item.provenanceStatus !== 'Rejected')
    .reduce((sum, item) => sum + Number(item.quantity ?? 0) * Number(item.unitCost ?? 0), 0);
  const quarantinedValue = positions
    .filter((item) => item.status === 'Quarantined')
    .reduce((sum, item) => sum + Number(item.quantity ?? 0) * Number(item.unitCost ?? 0), 0);
  const activeSelected = selected ? positions.find((item) => item.id === selected.id) ?? selected : null;

  const run = (operation: () => unknown, success: string) => {
    setError('');
    try {
      operation();
      setMessage(success);
      setAction(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The inventory action could not be completed.');
    }
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">{tenant.id.toUpperCase()} ERP / inventory custody</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">Inventory control room</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Count exact stock, move it between controlled locations, and decide whether its provenance permits use. Every posting retains its source evidence.</p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4">
          <Measure label="Trusted value" value={money.format(trustedValue)} />
          <Measure label="Quarantine" value={money.format(quarantinedValue)} warning />
          <Measure label="Open counts" value={String(counts.filter((item) => item.status !== 'Posted').length)} />
          <Measure label="Transfers open" value={String(transfers.filter((item) => item.status !== 'Completed').length)} />
        </div>
      </header>

      {(message || error) && (
        <div className={`rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>
          {error || message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {([
          ['catalogue', 'Parts catalogue', PackageCheck],
          ['stock', 'Stock positions', Boxes],
          ['movements', 'Movement log', PackageOpen],
          ['counts', 'Count sessions', ClipboardCheck],
          ['transfers', 'Location transfers', ArrowRightLeft],
          ['provenance', 'Provenance decisions', ShieldAlert],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setMode(id); setSelected(null); setAction(null); }} className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 text-[10px] transition ${mode === id ? 'border-vertical-accent/40 bg-vertical-accent-glow text-vertical-accent' : 'border-white/[0.08] text-gray-500 hover:text-white'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {mode === 'catalogue' ? (
        <CatalogueWorkspace records={catalogue} onRun={run} />
      ) : mode === 'movements' ? (
        <MovementWorkspace records={movements} catalogue={catalogue} onRun={run} />
      ) : mode === 'stock' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-3 border-b border-white/[0.07] p-3">
              <Search size={14} className="text-gray-600" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SKU, part, location, or owner…" className="h-9 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-700" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-white/[0.07] font-mono text-[8px] uppercase tracking-wider text-gray-600">
                  <tr>{['SKU / part', 'Location', 'On hand', 'Reserved', 'Free', 'Unit cost', 'Provenance', 'Control'].map((label) => <th key={label} className="px-4 py-3 font-normal">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-xs">
                  {visiblePositions.map((item) => {
                    const free = Number(item.quantity ?? 0) - Number(item.reserved ?? 0);
                    return (
                      <tr key={item.id} onClick={() => { setSelected(item); setAction(null); setError(''); }} className={`cursor-pointer transition hover:bg-white/[0.03] ${selected?.id === item.id ? 'bg-vertical-accent/[0.05]' : ''}`}>
                        <td className="px-4 py-4"><div className="font-mono text-[9px] text-vertical-accent">{String(item.sku)}</div><div className="mt-1 text-gray-200">{String(item.name)}</div></td>
                        <td className="px-4 py-4 text-gray-400">{String(item.location)}</td>
                        <td className="px-4 py-4 font-mono text-white">{Number(item.quantity ?? 0)}</td>
                        <td className="px-4 py-4 font-mono text-gray-400">{Number(item.reserved ?? 0)}</td>
                        <td className={`px-4 py-4 font-mono ${free <= 3 ? 'text-amber-300' : 'text-emerald-300'}`}>{free}</td>
                        <td className="px-4 py-4 font-mono text-gray-300">{money.format(Number(item.unitCost ?? 0))}</td>
                        <td className="px-4 py-4 text-gray-400">{String(item.provenanceStatus ?? 'Unreviewed')}</td>
                        <td className="px-4 py-4"><Status value={item.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <aside className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
            {activeSelected ? (
              <>
                <div className="font-mono text-[9px] text-vertical-accent">{activeSelected.id}</div>
                <h2 className="mt-2 text-base font-medium text-white">{String(activeSelected.name)}</h2>
                <p className="mt-1 text-[10px] text-gray-600">{String(activeSelected.sku)} · {String(activeSelected.location)}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <ActionButton icon={<ClipboardCheck size={14} />} label="Count stock" onClick={() => setAction('count')} />
                  <ActionButton icon={<ArrowRightLeft size={14} />} label="Transfer" onClick={() => setAction('transfer')} />
                  <ActionButton icon={<PackageCheck size={14} />} label="Review evidence" onClick={() => setAction('provenance')} wide />
                </div>
                {action === 'count' && <CountForm position={activeSelected} onRun={run} />}
                {action === 'transfer' && <TransferForm position={activeSelected} onRun={run} />}
                {action === 'provenance' && <ProvenanceForm position={activeSelected} onRun={run} />}
                {!action && <EvidenceSummary position={activeSelected} />}
              </>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center text-center"><Boxes size={24} className="text-gray-700" /><p className="mt-3 text-xs text-gray-500">Select a stock position</p><p className="mt-2 max-w-60 text-[10px] leading-4 text-gray-700">Counts, transfers, and provenance decisions act on the exact SKU and location selected.</p></div>
            )}
          </aside>
        </div>
      ) : mode === 'counts' ? (
        <ControlRegister records={counts} kind="count" onRun={run} />
      ) : mode === 'transfers' ? (
        <ControlRegister records={transfers} kind="transfer" onRun={run} />
      ) : (
        <SimpleRegister records={controls} empty="No provenance decisions have been recorded." />
      )}
    </div>
  );
};

const CatalogueWorkspace = ({ records, onRun }: { records: AglOperationalRecord[]; onRun: (operation: () => unknown, success: string) => void }) => {
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AglOperationalRecord | null>(null);
  const [draft, setDraft] = useState({ sku: '', name: '', fitment: '', supplier: '', unitCost: 0, salePrice: 0, openingQuantity: 0, location: 'Main store · A-01', owner: 'Quansah Abigail' });
  const visible = records.filter((item) => !query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-3 sm:flex-row">
        <label className="relative min-w-0 flex-1"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SKU, part, fitment, supplier…" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-white" /></label>
        <button onClick={() => setCreating((value) => !value)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-vertical-accent px-4 text-[10px] font-semibold text-black"><Plus size={13} /> Add part</button>
      </div>
      {creating && <form onSubmit={(event) => { event.preventDefault(); onRun(() => aglInventoryWorkflow.addPart(actor, draft), `${draft.sku} registered and its opening receipt posted.`); }} className="grid gap-3 rounded-xl border border-vertical-accent/20 bg-vertical-accent/[0.03] p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="SKU" value={draft.sku} onChange={(sku) => setDraft({ ...draft, sku })} /><Field label="Part name" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} /><Field label="Fitment" value={draft.fitment} onChange={(fitment) => setDraft({ ...draft, fitment })} /><Field label="Supplier" value={draft.supplier} onChange={(supplier) => setDraft({ ...draft, supplier })} /><Field label="Unit cost GHS" type="number" value={draft.unitCost} onChange={(value) => setDraft({ ...draft, unitCost: Number(value) })} /><Field label="Sale price GHS" type="number" value={draft.salePrice} onChange={(value) => setDraft({ ...draft, salePrice: Number(value) })} /><Field label="Opening quantity" type="number" value={draft.openingQuantity} onChange={(value) => setDraft({ ...draft, openingQuantity: Number(value) })} /><Field label="Opening location" value={draft.location} onChange={(location) => setDraft({ ...draft, location })} /><div className="lg:col-span-4"><Submit>Register part and opening stock</Submit></div>
      </form>}
      <div className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[1000px] text-left text-[10px]"><thead className="border-b border-white/[0.08] font-mono text-[8px] uppercase tracking-wider text-gray-600"><tr>{['SKU', 'Part', 'Fitment', 'Supplier', 'Unit cost', 'Sale price', 'Margin', 'State', 'Edit'].map((head) => <th key={head} className="px-4 py-3 font-normal">{head}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.06]">{visible.map((item) => <tr key={item.id} className="text-gray-300"><td className="px-4 py-4 font-mono text-vertical-accent">{String(item.sku)}</td><td className="px-4 py-4 text-white">{String(item.name)}</td><td className="px-4 py-4">{String(item.fitment ?? '—')}</td><td className="px-4 py-4">{String(item.supplier ?? '—')}</td><td className="px-4 py-4">{money.format(Number(item.unitCost ?? 0))}</td><td className="px-4 py-4">{money.format(Number(item.salePrice ?? 0))}</td><td className="px-4 py-4 text-emerald-300">{Number(item.salePrice ?? 0) ? `${(((Number(item.salePrice) - Number(item.unitCost ?? 0)) / Number(item.salePrice)) * 100).toFixed(1)}%` : '—'}</td><td className="px-4 py-4"><Status value={item.status} /></td><td className="px-4 py-4"><button onClick={() => setEditing(item)} className="rounded border border-white/[0.08] px-2 py-1 text-[8px]">Edit</button></td></tr>)}</tbody></table></div>
      {editing && <PartEdit record={editing} onClose={() => setEditing(null)} onRun={onRun} />}
    </div>
  );
};

const PartEdit = ({ record, onClose, onRun }: { record: AglOperationalRecord; onClose: () => void; onRun: (operation: () => unknown, success: string) => void }) => {
  const [values, setValues] = useState({ name: String(record.name), fitment: String(record.fitment ?? ''), supplier: String(record.supplier ?? ''), unitCost: Number(record.unitCost ?? 0), salePrice: Number(record.salePrice ?? 0) });
  const [newFitment, setNewFitment] = useState('');
  const fitments = values.fitment.split(/\s*[·,;]\s*/).map((value) => value.trim()).filter(Boolean);
  return <div className="custom-scrollbar fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/75 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); onRun(() => aglInventoryWorkflow.updatePart(actor, record.id, values), `${String(record.sku)} master and stock positions updated.`); onClose(); }} className="my-auto w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0a0a0a] p-6"><div className="flex justify-between"><div><h2 className="text-xl text-white">Edit {String(record.sku)}</h2><p className="mt-1 text-[9px] text-gray-500">Quantity changes must be posted through movements or stock counts.</p></div><button type="button" onClick={onClose}>×</button></div><div className="mt-5 space-y-3"><Field label="Part name" value={values.name} onChange={(name) => setValues({ ...values, name })} /><div className="rounded-lg border border-white/[0.07] bg-black/20 p-3"><div className="font-mono text-[8px] uppercase text-gray-600">Vehicle fitments</div><div className="mt-3 flex flex-wrap gap-2">{fitments.map((fitment) => <span key={fitment} className="flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.04] px-3 py-1 text-[9px] text-cyan-100">{fitment}<button type="button" disabled={fitments.length <= 1} aria-label={`Remove ${fitment}`} onClick={() => { onRun(() => aglInventoryWorkflow.removeFitment(actor, record.id, fitment), `${fitment} removed from ${String(record.sku)}.`); setValues((current) => ({ ...current, fitment: current.fitment.split(/\s*[·,;]\s*/).filter((value) => value.trim().toLowerCase() !== fitment.toLowerCase()).join(' · ') })); }} className="text-gray-500 disabled:opacity-20">×</button></span>)}</div><div className="mt-3 flex gap-2"><input value={newFitment} onChange={(event) => setNewFitment(event.target.value)} placeholder="e.g. Toyota Corolla 2014–2019" className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-black/30 px-3 text-xs text-white" /><button type="button" disabled={!newFitment.trim() || fitments.some((value) => value.toLowerCase() === newFitment.trim().toLowerCase())} onClick={() => { onRun(() => aglInventoryWorkflow.addFitment(actor, record.id, newFitment), `${newFitment} linked to ${String(record.sku)}.`); setValues((current) => ({ ...current, fitment: [...current.fitment.split(/\s*[·,;]\s*/).filter(Boolean), newFitment.trim()].join(' · ') })); setNewFitment(''); }} className="rounded-lg bg-cyan-300 px-3 text-[9px] font-semibold text-black disabled:opacity-30">Add</button></div></div><Field label="Supplier" value={values.supplier} onChange={(supplier) => setValues({ ...values, supplier })} /><Field label="Unit cost GHS" type="number" value={values.unitCost} onChange={(value) => setValues({ ...values, unitCost: Number(value) })} /><Field label="Sale price GHS" type="number" value={values.salePrice} onChange={(value) => setValues({ ...values, salePrice: Number(value) })} /></div><div className="mt-5 flex gap-2"><button type="button" onClick={() => { const reason = window.prompt(`Reason for retiring ${String(record.sku)}:`); if (!reason) return; onRun(() => aglInventoryWorkflow.retirePart(actor, record.id, reason), `${String(record.sku)} retired with stock history preserved.`); onClose(); }} className="flex min-h-10 items-center gap-2 rounded-lg border border-rose-300/15 px-3 text-[9px] text-rose-200"><Trash2 size={12} /> Retire</button><div className="flex-1"><Submit>Save part master</Submit></div></div></form></div>;
};

const MovementWorkspace = ({ records, catalogue, onRun }: { records: AglOperationalRecord[]; catalogue: AglOperationalRecord[]; onRun: (operation: () => unknown, success: string) => void }) => {
  const [draft, setDraft] = useState({ movementType: 'Receipt' as 'Receipt' | 'Issue' | 'Return' | 'Adjustment' | 'Reservation', partId: catalogue[0]?.id ?? '', quantity: 1, location: 'Main store · A-01', reference: '', owner: 'Quansah Abigail', notes: '' });
  const part = catalogue.find((item) => item.id === draft.partId);
  return <div className="space-y-4"><form onSubmit={(event) => { event.preventDefault(); onRun(() => aglInventoryWorkflow.postMovement(actor, { movementType: draft.movementType, sku: String(part?.sku ?? ''), name: String(part?.name ?? ''), quantity: draft.quantity, location: draft.location, reference: draft.reference, owner: draft.owner, notes: draft.notes }), `${draft.movementType} posted to the stock ledger.`); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-4"><label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Movement</span><select value={draft.movementType} onChange={(event) => setDraft({ ...draft, movementType: event.target.value as typeof draft.movementType })} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 text-xs text-white">{['Receipt', 'Issue', 'Return', 'Adjustment', 'Reservation'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Part</span><select value={draft.partId} onChange={(event) => setDraft({ ...draft, partId: event.target.value })} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 text-xs text-white">{catalogue.map((item) => <option key={item.id} value={item.id}>{String(item.sku)} · {String(item.name)}</option>)}</select></label><Field label="Quantity" type="number" value={draft.quantity} onChange={(value) => setDraft({ ...draft, quantity: Number(value) })} /><Field label="Location" value={draft.location} onChange={(location) => setDraft({ ...draft, location })} /><Field label="Source reference" value={draft.reference} onChange={(reference) => setDraft({ ...draft, reference })} /><Field label="Recorded by" value={draft.owner} onChange={(owner) => setDraft({ ...draft, owner })} /><Field label="Evidence notes" value={draft.notes} onChange={(notes) => setDraft({ ...draft, notes })} /><div className="self-end"><Submit>Post movement</Submit></div></form><div className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[1000px] text-left text-[10px]"><thead className="border-b border-white/[0.08] font-mono text-[8px] uppercase tracking-wider text-gray-600"><tr>{['Movement', 'Type', 'SKU / part', 'Quantity', 'Location', 'Source', 'Actor', 'Posted'].map((head) => <th key={head} className="px-4 py-3 font-normal">{head}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.06]">{records.map((item) => <tr key={item.id} className="text-gray-300"><td className="px-4 py-4 font-mono text-vertical-accent">{item.id}</td><td className="px-4 py-4">{String(item.movementType)}</td><td className="px-4 py-4"><span className="text-white">{String(item.name)}</span><div className="font-mono text-[8px] text-gray-600">{String(item.sku)}</div></td><td className="px-4 py-4">{String(item.quantity)}</td><td className="px-4 py-4">{String(item.location)}</td><td className="px-4 py-4">{String(item.reference)}</td><td className="px-4 py-4">{String(item.owner)}</td><td className="px-4 py-4"><Status value={item.status} /></td></tr>)}</tbody></table></div></div>;
};

const Measure = ({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) => (
  <div className="min-w-32 bg-[#090909] px-4 py-3"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><div className={`mt-2 text-sm font-medium ${warning ? 'text-amber-300' : 'text-white'}`}>{value}</div></div>
);

const Status = ({ value }: { value: string }) => (
  <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${value === 'Quarantined' || value.includes('required') ? 'border-amber-400/20 bg-amber-400/[0.05] text-amber-300' : value === 'Posted' || value === 'Completed' || value === 'Accepted' ? 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300' : 'border-white/[0.08] text-gray-400'}`}>{value}</span>
);

const ActionButton = ({ icon, label, onClick, wide = false }: { icon: ReactNode; label: string; onClick: () => void; wide?: boolean }) => (
  <button onClick={onClick} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.08] text-[10px] text-gray-300 transition hover:border-vertical-accent/30 hover:text-white ${wide ? 'col-span-2' : ''}`}>{icon}{label}</button>
);

const Field = ({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string }) => (
  <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 text-xs text-white outline-none focus:border-vertical-accent" /></label>
);

const Submit = ({ children }: { children: ReactNode }) => (
  <button type="submit" className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-xs font-semibold text-black"><Check size={14} />{children}</button>
);

const CountForm = ({ position, onRun }: { position: AglOperationalRecord; onRun: (operation: () => unknown, success: string) => void }) => {
  const [quantity, setQuantity] = useState(Number(position.quantity ?? 0));
  const [evidence, setEvidence] = useState('');
  const [counter, setCounter] = useState('Quansah Abigail');
  const [reason, setReason] = useState('');
  return (
    <form className="mt-5 space-y-3 border-t border-white/[0.07] pt-5" onSubmit={(event) => { event.preventDefault(); onRun(() => aglInventoryWorkflow.startCount(position.id, actor, { countedQuantity: quantity, evidenceReference: evidence, counter, reason }), 'Count session recorded. Post immediately when matched, or obtain independent variance approval.'); }}>
      <div className="text-xs font-medium text-white">Blind count result</div>
      <Field label="Counted quantity" value={quantity} type="number" onChange={(value) => setQuantity(Number(value))} />
      <Field label="Count evidence" value={evidence} onChange={setEvidence} placeholder="COUNT-SHEET-0726-04" />
      <Field label="Counted by" value={counter} onChange={setCounter} />
      <Field label="Variance reason / notes" value={reason} onChange={setReason} />
      <Submit>Record count</Submit>
    </form>
  );
};

const TransferForm = ({ position, onRun }: { position: AglOperationalRecord; onRun: (operation: () => unknown, success: string) => void }) => {
  const [quantity, setQuantity] = useState(1);
  const [destination, setDestination] = useState('Workshop issue store · BAY-01');
  const [evidence, setEvidence] = useState('');
  const [reason, setReason] = useState('');
  return (
    <form className="mt-5 space-y-3 border-t border-white/[0.07] pt-5" onSubmit={(event) => { event.preventDefault(); onRun(() => aglInventoryWorkflow.requestTransfer(position.id, actor, { quantity, destinationLocation: destination, reason, evidenceReference: evidence }), 'Transfer requested for independent approval.'); }}>
      <div className="text-xs font-medium text-white">Location transfer request</div>
      <Field label="Quantity" value={quantity} type="number" onChange={(value) => setQuantity(Number(value))} />
      <Field label="Destination" value={destination} onChange={setDestination} />
      <Field label="Request evidence" value={evidence} onChange={setEvidence} placeholder="TRF-REQ-0726-01" />
      <Field label="Operational reason" value={reason} onChange={setReason} />
      <Submit>Request transfer</Submit>
    </form>
  );
};

const ProvenanceForm = ({ position, onRun }: { position: AglOperationalRecord; onRun: (operation: () => unknown, success: string) => void }) => {
  const [document, setDocument] = useState('');
  const [batch, setBatch] = useState('');
  const [reviewer, setReviewer] = useState('Bekoe Adu Benjamin');
  const [decision, setDecision] = useState<'Accepted' | 'Rejected'>('Accepted');
  const [reason, setReason] = useState('');
  return (
    <form className="mt-5 space-y-3 border-t border-white/[0.07] pt-5" onSubmit={(event) => { event.preventDefault(); onRun(() => aglInventoryWorkflow.reviewProvenance(position.id, actor, { supplierDocument: document, batchReference: batch, reviewer, decision, reason }), `Provenance ${decision.toLowerCase()} and stock eligibility updated.`); }}>
      <div className="text-xs font-medium text-white">Provenance decision</div>
      <Field label="Supplier document" value={document} onChange={setDocument} placeholder="COA / invoice / chain reference" />
      <Field label="Batch / serial" value={batch} onChange={setBatch} />
      <Field label="Reviewed by" value={reviewer} onChange={setReviewer} />
      <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Decision</span><select value={decision} onChange={(event) => setDecision(event.target.value as 'Accepted' | 'Rejected')} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0b0b] px-3 text-xs text-white"><option>Accepted</option><option>Rejected</option></select></label>
      <Field label="Decision basis" value={reason} onChange={setReason} />
      <Submit>Record decision</Submit>
    </form>
  );
};

const EvidenceSummary = ({ position }: { position: AglOperationalRecord }) => (
  <dl className="mt-5 space-y-3 border-t border-white/[0.07] pt-5 text-[10px]">
    {[['On hand', position.quantity], ['Reserved', position.reserved], ['Supplier evidence', position.supplierDocument ?? 'Not reviewed'], ['Batch', position.batchReference ?? 'Not captured'], ['Last reviewed by', position.provenanceReviewedBy ?? '—']].map(([label, value]) => (
      <div key={String(label)} className="flex justify-between gap-4"><dt className="text-gray-600">{String(label)}</dt><dd className="max-w-[60%] text-right text-gray-300">{String(value)}</dd></div>
    ))}
  </dl>
);

const ControlRegister = ({ records, kind, onRun }: { records: AglOperationalRecord[]; kind: 'count' | 'transfer'; onRun: (operation: () => unknown, success: string) => void }) => {
  const [approver, setApprover] = useState('Bekoe Adu Benjamin');
  const [basis, setBasis] = useState('');
  const [receipt, setReceipt] = useState('');
  return (
    <div className="space-y-3">
      {records.map((item) => (
        <div key={item.id} className="grid gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div><div className="flex items-center gap-3"><span className="font-mono text-[9px] text-vertical-accent">{item.id}</span><Status value={item.status} /></div><div className="mt-3 text-sm text-white">{String(item.name)} · {String(item.sku)}</div><div className="mt-2 text-[10px] text-gray-500">{kind === 'count' ? `${String(item.location)} · expected ${item.expectedQuantity} · counted ${item.countedQuantity} · variance ${item.variance}` : `${String(item.sourceLocation)} → ${String(item.destinationLocation)} · ${item.quantity} units`}</div></div>
          <div className="grid gap-2 sm:grid-cols-3">
            {item.status === 'Approval required' && <><Field label="Approver" value={approver} onChange={setApprover} /><Field label="Approval basis" value={basis} onChange={setBasis} /><button onClick={() => onRun(() => kind === 'count' ? aglInventoryWorkflow.approveCount(item.id, actor, approver, basis) : aglInventoryWorkflow.approveTransfer(item.id, actor, approver, basis), `${item.id} approved.`)} className="min-h-10 self-end rounded-lg bg-vertical-accent text-xs font-semibold text-black">Approve</button></>}
            {kind === 'count' && item.status === 'Approved' && <button onClick={() => onRun(() => aglInventoryWorkflow.postCount(item.id, actor), `${item.id} posted to the stock ledger.`)} className="min-h-10 rounded-lg bg-vertical-accent text-xs font-semibold text-black">Post count</button>}
            {kind === 'transfer' && item.status === 'Approved' && <><div className="sm:col-span-2"><Field label="Destination receipt" value={receipt} onChange={setReceipt} /></div><button onClick={() => onRun(() => aglInventoryWorkflow.completeTransfer(item.id, actor, receipt), `${item.id} dispatched and received under one correlation.`)} className="min-h-10 self-end rounded-lg bg-vertical-accent text-xs font-semibold text-black">Complete transfer</button></>}
          </div>
        </div>
      ))}
      {!records.length && <div className="rounded-xl border border-dashed border-white/[0.08] p-12 text-center text-xs text-gray-600">No control records yet. Start from an exact stock position.</div>}
    </div>
  );
};

const SimpleRegister = ({ records, empty }: { records: AglOperationalRecord[]; empty: string }) => (
  <div className="space-y-2">
    {records.map((item) => <div key={item.id} className="grid gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"><span className="font-mono text-[9px] text-vertical-accent">{item.id}</span><div><div className="text-xs text-white">{String(item.name)} · {String(item.sku)}</div><div className="mt-1 text-[10px] text-gray-600">{String(item.supplierDocument)} · {String(item.batchReference)} · {String(item.notes)}</div></div><Status value={item.status} /></div>)}
    {!records.length && <div className="rounded-xl border border-dashed border-white/[0.08] p-12 text-center text-xs text-gray-600">{empty}</div>}
  </div>
);
