import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ClipboardCheck,
  PackageCheck,
  Plus,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import { GlassPanel } from '../../components/ui/GlassPanel';
import {
  aglProcurementWorkflow,
  type PurchaseOrderDraft,
} from '../../erp/agl/procurementWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const stages = ['Draft', 'Approval required', 'Approved', 'Ordered', 'Part received', 'Received'];
const today = new Date().toISOString().slice(0, 10);
const emptyDraft: PurchaseOrderDraft = {
  supplier: '',
  sku: '',
  name: '',
  quantity: 1,
  unitCostGhs: 0,
  expectedDate: today,
  location: 'Receiving bay',
  demandReference: '',
  owner: 'Quansah Abigail',
  notes: '',
};
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });

export const AglProcurementWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [version, setVersion] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [draftOpen, setDraftOpen] = useState(false);
  const [draft, setDraft] = useState<PurchaseOrderDraft>(emptyDraft);
  const [approver, setApprover] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [supplierReference, setSupplierReference] = useState('');
  const [receiptQuantity, setReceiptQuantity] = useState(1);
  const [goodsReceiptReference, setGoodsReceiptReference] = useState('');
  const [inspectionResult, setInspectionResult] = useState<'Accepted' | 'Quarantined'>('Accepted');
  const [receiptLocation, setReceiptLocation] = useState('Receiving bay');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const purchaseOrders = useMemo(() => aglProcurementWorkflow.purchaseOrders(), [version]);
  const stock = useMemo(() => aglProcurementWorkflow.stock(), [version]);
  const suppliers = useMemo(() => aglProcurementWorkflow.suppliers().filter((supplier) => supplier.status === 'Active'), [version]);
  const staff = useMemo(() => aglErpRepository.list('employees').filter((employee) => employee.status === 'Active'), [version]);
  const stockLocations = Array.from(new Set(['Receiving bay', 'Parts Warehouse', ...stock.map((item) => String(item.location ?? '')).filter(Boolean)]));
  const selected = purchaseOrders.find((item) => item.id === selectedId);
  const openValue = purchaseOrders
    .filter((item) => !['Received', 'Cancelled'].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const due = purchaseOrders.filter((item) => (
    !['Received', 'Cancelled'].includes(item.status)
    && item.expectedDate
    && String(item.expectedDate) < today
  )).length;

  const run = (action: () => unknown, confirmation: string) => {
    setError('');
    try {
      action();
      setNotice(confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The procurement control could not be completed.');
    }
  };

  const createPo = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const created = aglProcurementWorkflow.create(actor, draft);
      setSelectedId(created.id);
      setDraftOpen(false);
      setDraft(emptyDraft);
      setNotice(`${created.id} created as a draft purchase order.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The purchase order could not be created.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-[1760px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><ShieldCheck size={13} /> {tenant.id.toUpperCase()} ERP / procurement control</div>
          <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">Purchase orders & goods receipt</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Separate buying from approval, retain the supplier commitment, and post accepted or quarantined goods into the stock ledger from the receipt evidence.</p>
        </div>
        <button onClick={() => { setDraftOpen(true); setError(''); }} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Plus size={14} /> Create purchase order</button>
      </header>

      {(notice || error) && (
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>
          <span className="flex items-center gap-2">{error ? <AlertTriangle size={14} /> : <Check size={14} />}{error || notice}</span>
          <button onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss message"><X size={13} /></button>
        </div>
      )}

      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4">
        <Signal label="Purchase orders" value={String(purchaseOrders.length)} detail="All retained commitments" />
        <Signal label="Open value" value={money.format(openValue)} detail="Not yet fully received" />
        <Signal label="Awaiting approval" value={String(purchaseOrders.filter((item) => item.status === 'Approval required').length)} detail="Segregation required" />
        <Signal label="Past expected date" value={String(due)} detail="Supplier follow-up" warning={due > 0} />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="custom-scrollbar overflow-x-auto pb-3">
          <div className="grid min-w-max gap-3" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(230px, 1fr))` }}>
            {stages.map((stage) => {
              const stageOrders = purchaseOrders.filter((item) => item.status === stage);
              return (
                <GlassPanel key={stage} className="min-h-[430px] w-[250px] rounded-xl p-3">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-1 pb-3"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-500">{stage}</span><span className="rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[8px] text-gray-600">{stageOrders.length}</span></div>
                  <div className="mt-3 space-y-2">
                    {stageOrders.map((po) => (
                      <button key={po.id} onClick={() => setSelectedId(po.id)} className={`w-full rounded-lg border p-3 text-left transition ${selectedId === po.id ? 'border-vertical-accent/50 bg-vertical-accent-glow' : 'border-white/[0.08] bg-black/25 hover:border-white/[0.15]'}`}>
                        <div className="flex justify-between gap-3"><span className="font-mono text-[8px] text-vertical-accent">{po.id}</span><span className="font-mono text-[8px] text-gray-600">{money.format(Number(po.amount ?? 0))}</span></div>
                        <div className="mt-2 line-clamp-2 text-[11px] font-medium text-white">{String(po.name)}</div>
                        <div className="mt-1 text-[9px] text-gray-600">{String(po.supplier ?? 'No supplier')} · {String(po.quantity ?? 0)} units</div>
                        {Number(po.receivedQuantity ?? 0) > 0 && <div className="mt-3 h-1 overflow-hidden rounded bg-white/[0.06]"><div className="h-full bg-vertical-accent" style={{ width: `${Math.min(100, (Number(po.receivedQuantity) / Number(po.quantity ?? 1)) * 100)}%` }} /></div>}
                      </button>
                    ))}
                    {!stageOrders.length && <div className="rounded-lg border border-dashed border-white/[0.06] p-4 text-center font-mono text-[8px] uppercase text-gray-700">No orders</div>}
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </div>

        <GlassPanel className="h-fit rounded-xl p-5 2xl:sticky 2xl:top-0">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-4"><div><div className="font-mono text-[9px] text-vertical-accent">{selected.id}</div><h2 className="mt-2 text-base font-medium text-white">{String(selected.name)}</h2><p className="mt-1 text-[10px] text-gray-600">{String(selected.supplier)} · {String(selected.sku ?? 'Legacy order: SKU required')}</p></div><span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] uppercase text-gray-400">{selected.status}</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/[0.07] py-4">
                <Mini label="Ordered" value={`${String(selected.quantity ?? 0)} units`} />
                <Mini label="Received" value={`${String(selected.receivedQuantity ?? 0)} units`} />
                <Mini label="Unit cost" value={money.format(Number(selected.unitCostGhs ?? 0))} />
                <Mini label="Total" value={money.format(Number(selected.amount ?? 0))} />
              </div>
              <div className="mt-5 space-y-3">
                {selected.status === 'Draft' && <Action label="Submit for approval" onClick={() => run(() => aglProcurementWorkflow.submit(selected.id, actor), `${selected.id} submitted for independent approval.`)} />}
                {selected.status === 'Approval required' && (
                  <div className="space-y-3">
                    <Field label="Approver"><select value={approver} onChange={(event) => setApprover(event.target.value)}><option value="">Select independent approver</option>{staff.filter((employee) => String(employee.name) !== String(selected.owner)).map((employee) => <option key={employee.id} value={String(employee.name)}>{String(employee.name)} · {String(employee.role)}</option>)}</select></Field>
                    <Field label="Approval basis"><textarea value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} /></Field>
                    <Action label="Approve purchase order" primary disabled={!approver.trim() || !approvalNote.trim()} onClick={() => run(() => aglProcurementWorkflow.approve(selected.id, actor, approver, approvalNote), `${selected.id} approved with segregation of duties.`)} />
                  </div>
                )}
                {selected.status === 'Approved' && (
                  <div className="space-y-3">
                    <Field label="Supplier order reference"><input value={supplierReference} onChange={(event) => setSupplierReference(event.target.value)} /></Field>
                    <Action label="Mark as ordered" primary disabled={!supplierReference.trim()} onClick={() => run(() => aglProcurementWorkflow.markOrdered(selected.id, actor, supplierReference), `${selected.id} sent to supplier.`)} />
                  </div>
                )}
                {['Ordered', 'Part received'].includes(selected.status) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-white"><Truck size={14} className="text-vertical-accent" /> Receive goods</div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Quantity"><input type="number" min="1" value={receiptQuantity} onChange={(event) => setReceiptQuantity(Number(event.target.value))} /></Field>
                      <Field label="Inspection"><select value={inspectionResult} onChange={(event) => setInspectionResult(event.target.value as typeof inspectionResult)}><option>Accepted</option><option>Quarantined</option></select></Field>
                    </div>
                    <Field label="Goods receipt / evidence"><input value={goodsReceiptReference} onChange={(event) => setGoodsReceiptReference(event.target.value)} /></Field>
                    <Field label="Receipt location"><select value={receiptLocation} onChange={(event) => setReceiptLocation(event.target.value)}>{stockLocations.map((location) => <option key={location}>{location}</option>)}</select></Field>
                    <Action label="Post receipt to stock" primary disabled={!goodsReceiptReference.trim() || receiptQuantity <= 0 || !String(selected.sku ?? '').trim()} onClick={() => run(() => aglProcurementWorkflow.receive(selected.id, actor, { quantity: receiptQuantity, goodsReceiptReference, inspectionResult, location: receiptLocation }), `${receiptQuantity} units received against ${selected.id} and posted to stock.`)} />
                    {!String(selected.sku ?? '').trim() && <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-3 text-[9px] leading-4 text-amber-300">This legacy order has no exact SKU. Edit it before posting a receipt.</div>}
                  </div>
                )}
                {selected.status === 'Received' && <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-[10px] text-emerald-300"><PackageCheck size={15} className="mb-2" />Fully received. Stock and creditor evidence retain the purchase-order reference.</div>}
              </div>
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center text-center"><ClipboardCheck size={25} className="text-gray-700" /><div className="mt-3 text-xs text-gray-400">Select a purchase order</div><p className="mt-2 max-w-56 text-[10px] leading-4 text-gray-600">Approval, supplier commitment, receipt, quarantine, and stock posting controls appear here.</p></div>
          )}
        </GlassPanel>
      </div>

      {draftOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" onClick={() => setDraftOpen(false)}>
          <motion.aside initial={{ x: 620 }} animate={{ x: 0 }} onClick={(event) => event.stopPropagation()} className="custom-scrollbar h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5"><div><div className="font-mono text-[9px] uppercase tracking-wider text-vertical-accent">Supplier commitment</div><h2 className="mt-2 text-xl font-medium text-white">Create purchase order</h2><p className="mt-1 text-xs text-gray-600">The draft does not change stock or creditors until it passes the later controls.</p></div><button onClick={() => setDraftOpen(false)} aria-label="Close purchase order" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-500"><X size={16} /></button></div>
            <form onSubmit={createPo} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Supplier"><select value={draft.supplier} onChange={(event) => setDraft((current) => ({ ...current, supplier: event.target.value }))}><option value="">Select approved supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={String(supplier.name)}>{String(supplier.name)}</option>)}</select></Field>
              <Field label="Buyer"><select value={draft.owner} onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}>{staff.map((employee) => <option key={employee.id} value={String(employee.name)}>{String(employee.name)} · {String(employee.role)}</option>)}</select></Field>
              <Field label="SKU"><input value={draft.sku} onChange={(event) => {
                const sku = event.target.value;
                const position = stock.find((item) => item.sku === sku);
                setDraft((current) => ({ ...current, sku, name: String(position?.name ?? current.name), unitCostGhs: Number(position?.unitCost ?? current.unitCostGhs), location: String(position?.location ?? current.location) }));
              }} list="agl-stock-skus" /></Field>
              <datalist id="agl-stock-skus">{stock.map((item) => <option key={item.id} value={String(item.sku)}>{String(item.name)}</option>)}</datalist>
              <Field label="Description"><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></Field>
              <Field label="Quantity"><input type="number" min="1" value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: Number(event.target.value) }))} /></Field>
              <Field label="Unit cost (GHS)"><input type="number" min="0" value={draft.unitCostGhs} onChange={(event) => setDraft((current) => ({ ...current, unitCostGhs: Number(event.target.value) }))} /></Field>
              <Field label="Expected date"><input type="date" value={draft.expectedDate} onChange={(event) => setDraft((current) => ({ ...current, expectedDate: event.target.value }))} /></Field>
              <Field label="Receipt location"><select value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}>{stockLocations.map((location) => <option key={location}>{location}</option>)}</select></Field>
              <Field label="Demand reference"><input value={draft.demandReference} onChange={(event) => setDraft((current) => ({ ...current, demandReference: event.target.value }))} placeholder="VSR, reorder, count, or manager request" /></Field>
              <div className="flex items-end rounded-lg border border-white/[0.08] bg-black/20 p-4"><div><div className="font-mono text-[8px] uppercase text-gray-600">Draft total</div><div className="mt-2 text-lg text-white">{money.format(draft.quantity * draft.unitCostGhs)}</div></div></div>
              <div className="sm:col-span-2"><Field label="Demand and purchasing notes"><textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></Field></div>
              {error && <div className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-3 text-xs text-red-300 sm:col-span-2">{error}</div>}
              <div className="flex justify-end gap-2 border-t border-white/[0.08] pt-5 sm:col-span-2"><button type="button" onClick={() => setDraftOpen(false)} className="min-h-11 rounded-lg border border-white/[0.08] px-4 text-xs text-gray-400">Cancel</button><button type="submit" className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Plus size={14} /> Create draft</button></div>
            </form>
          </motion.aside>
        </motion.div>
      )}
    </motion.div>
  );
};

const Signal = ({ label, value, detail, warning = false }: { label: string; value: string; detail: string; warning?: boolean }) => <div className="bg-[#090909] px-5 py-4"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><div className={`mt-2 text-lg ${warning ? 'text-amber-300' : 'text-white'}`}>{value}</div><div className="mt-1 text-[9px] text-gray-700">{detail}</div></div>;
const Mini = ({ label, value }: { label: string; value: string }) => <div><div className="font-mono text-[8px] uppercase text-gray-600">{label}</div><div className="mt-1 text-[10px] text-gray-300">{value}</div></div>;
const Action = ({ label, onClick, primary = false, disabled = false }: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) => <button disabled={disabled} onClick={onClick} className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-[10px] disabled:opacity-30 ${primary ? 'bg-vertical-accent font-semibold text-black' : 'border border-white/[0.08] text-gray-300'}`}>{label}<ChevronRight size={13} /></button>;
const Field = ({ label, children }: { label: string; children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement> | React.SelectHTMLAttributes<HTMLSelectElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement>> }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="mt-2 [&_input]:h-11 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.08] [&_input]:bg-black/25 [&_input]:px-3 [&_input]:text-xs [&_input]:text-white [&_input]:outline-none [&_select]:h-11 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.08] [&_select]:bg-[#0b0b0b] [&_select]:px-3 [&_select]:text-xs [&_select]:text-white [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-white/[0.08] [&_textarea]:bg-black/25 [&_textarea]:p-3 [&_textarea]:text-xs [&_textarea]:text-white [&_textarea]:outline-none">{children}</div></label>;
