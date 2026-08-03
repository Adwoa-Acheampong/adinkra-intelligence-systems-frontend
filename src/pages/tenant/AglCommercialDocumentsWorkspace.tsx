import { useEffect, useMemo, useState } from 'react';
import { Check, FileText, Printer, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglErpRepository } from '../../erp/agl/repository';
import { aglCommercialDocumentsWorkflow } from '../../erp/agl/commercialDocumentsWorkflow';

type ModuleId = 'sales-ledger' | 'quotations' | 'invoices' | 'payments' | 'creditors' | 'debtors';
const actor = { name: 'AGL Admin', role: 'Administrator' };
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

export const AglCommercialDocumentsWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: ModuleId }) => {
  const [version, setVersion] = useState(0);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  const run = (work: () => unknown, message: string) => {
    try { work(); setFeedback(message); } catch (error) { setFeedback(error instanceof Error ? error.message : 'The commercial action failed.'); }
  };
  return <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
    <header className="border-b border-white/[0.08] pb-5"><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{tenant.id.toUpperCase()} ERP / COMMERCIAL DOCUMENTS & CREDIT CONTROL</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{titles[moduleId]}</h1><p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">{descriptions[moduleId]}</p></header>
    {feedback && <div className="flex items-center justify-between rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] px-4 py-3 text-xs text-cyan-100"><span className="flex items-center gap-2"><Check size={14} />{feedback}</span><button onClick={() => setFeedback('')}><X size={13} /></button></div>}
    {moduleId === 'quotations' && <Quotations version={version} run={run} />}
    {moduleId === 'invoices' && <Invoices version={version} run={run} />}
    {moduleId === 'payments' && <Payments version={version} run={run} />}
    {moduleId === 'sales-ledger' && <SalesLedger version={version} />}
    {(moduleId === 'creditors' || moduleId === 'debtors') && <CreditControl version={version} run={run} moduleId={moduleId} />}
  </div>;
};

interface Props { version: number; run: (work: () => unknown, message: string) => void }

const Quotations = ({ version, run }: Props) => {
  const rows = useMemo(() => aglErpRepository.list('quotations'), [version]);
  const [values, setValues] = useState({ customer: '', customerContact: '', scope: '', amount: 0, validUntil: '', owner: 'Sales advisor', notes: '' });
  return <>
    <form onSubmit={(event) => { event.preventDefault(); run(() => aglCommercialDocumentsWorkflow.createQuotation(actor, values), 'Quotation drafted with customer, scope, validity, and owner.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-4"><Field label="Customer"><input value={values.customer} onChange={(e) => setValues({ ...values, customer: e.target.value })} /></Field><Field label="Customer contact"><input value={values.customerContact} onChange={(e) => setValues({ ...values, customerContact: e.target.value })} /></Field><Field label="Scope / lines"><input value={values.scope} onChange={(e) => setValues({ ...values, scope: e.target.value })} /></Field><Field label="Amount GHS"><input type="number" min="0" value={values.amount} onChange={(e) => setValues({ ...values, amount: Number(e.target.value) })} /></Field><Field label="Valid until"><input type="date" value={values.validUntil} onChange={(e) => setValues({ ...values, validUntil: e.target.value })} /></Field><Field label="Owner"><input value={values.owner} onChange={(e) => setValues({ ...values, owner: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Terms / notes"><input value={values.notes} onChange={(e) => setValues({ ...values, notes: e.target.value })} /></Field></div><button className="min-h-10 rounded-lg bg-cyan-300 text-[10px] font-semibold text-black lg:col-span-4">Create quotation</button></form>
    <section className="grid gap-3 lg:grid-cols-2">{rows.map((item) => <DocumentCard key={item.id} item={item}><Row label="Customer" value={item.customer} /><Row label="Contact" value={item.customerContact} /><Row label="Valid until" value={item.validUntil} /><Row label="Amount" value={money.format(Number(item.amount ?? 0))} /><div className="mt-4 flex gap-2">{item.status === 'Draft' && <button onClick={() => run(() => aglCommercialDocumentsWorkflow.sendQuotation(actor, item), `${item.id} marked sent.`)} className="rounded-lg border border-cyan-300/20 px-3 py-2 text-[9px] text-cyan-300">Mark sent</button>}{['Sent', 'Accepted'].includes(item.status) && <button onClick={() => run(() => aglCommercialDocumentsWorkflow.acceptAndInvoice(actor, item), `${item.id} accepted and converted to invoice.`)} className="rounded-lg bg-emerald-300 px-3 py-2 text-[9px] font-semibold text-black">Accept & invoice</button>}<PrintButton item={item} kind="Quotation" /></div></DocumentCard>)}</section>
  </>;
};

const Invoices = ({ version, run }: Props) => {
  const rows = useMemo(() => aglErpRepository.list('invoices'), [version]);
  const [values, setValues] = useState({ customer: '', scope: '', sourceReference: '', amount: 0, dueDate: '', owner: 'Sales advisor', notes: '' });
  const [paying, setPaying] = useState<AglOperationalRecord | null>(null);
  return <>
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Invoiced" value={money.format(rows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0))} /><Metric label="Outstanding" value={money.format(rows.reduce((sum, item) => sum + Number(item.balanceGhs ?? (item.status === 'Paid' ? 0 : item.amount ?? 0)), 0))} /><Metric label="Overdue / open" value={rows.filter((item) => item.status !== 'Paid').length} /></section>
    <form onSubmit={(event) => { event.preventDefault(); run(() => aglCommercialDocumentsWorkflow.createInvoice(actor, values), 'Invoice issued from a controlled source reference.'); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-4"><Field label="Customer"><input value={values.customer} onChange={(e) => setValues({ ...values, customer: e.target.value })} /></Field><Field label="Scope"><input value={values.scope} onChange={(e) => setValues({ ...values, scope: e.target.value })} /></Field><Field label="Source job / sale / quote"><input value={values.sourceReference} onChange={(e) => setValues({ ...values, sourceReference: e.target.value })} /></Field><Field label="Amount GHS"><input type="number" value={values.amount} onChange={(e) => setValues({ ...values, amount: Number(e.target.value) })} /></Field><Field label="Due date"><input type="date" value={values.dueDate} onChange={(e) => setValues({ ...values, dueDate: e.target.value })} /></Field><Field label="Owner"><input value={values.owner} onChange={(e) => setValues({ ...values, owner: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Notes"><input value={values.notes} onChange={(e) => setValues({ ...values, notes: e.target.value })} /></Field></div><button className="min-h-10 rounded-lg bg-cyan-300 text-[10px] font-semibold text-black lg:col-span-4">Issue invoice</button></form>
    <div className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[1100px] text-left text-[10px]"><thead className="border-b border-white/[0.08] text-gray-600"><tr>{['Invoice', 'Customer', 'Source', 'Issued', 'Due', 'Amount', 'Paid', 'Balance', 'Status', 'Actions'].map((head) => <th key={head} className="px-4 py-3 font-normal uppercase tracking-wider">{head}</th>)}</tr></thead><tbody>{rows.map((item) => { const snapshot = aglCommercialDocumentsWorkflow.invoiceSnapshot(item.id); return <tr key={item.id} className="border-b border-white/[0.06] text-gray-300"><td className="px-4 py-4"><strong className="text-white">{item.id}</strong><div>{String(item.name)}</div></td><td className="px-4 py-4">{String(item.customer ?? '—')}</td><td className="px-4 py-4">{String(item.reference)}</td><td className="px-4 py-4">{String(item.issuedAt ?? item.createdAt).slice(0, 10)}</td><td className="px-4 py-4">{String(item.dueDate ?? '—')}</td><td className="px-4 py-4">{money.format(Number(item.amount ?? 0))}</td><td className="px-4 py-4 text-emerald-300">{money.format(snapshot.paid)}</td><td className="px-4 py-4 text-amber-200">{money.format(snapshot.balance)}</td><td className="px-4 py-4"><Status value={item.status} /></td><td className="px-4 py-4"><div className="flex gap-2">{snapshot.balance > 0 && <button onClick={() => setPaying(item)} className="rounded border border-emerald-300/20 px-2 py-1 text-[8px] text-emerald-300">Pay</button>}<PrintButton item={item} kind="Invoice" /></div></td></tr>; })}</tbody></table></div>
    {paying && <PaymentModal invoice={paying} onClose={() => setPaying(null)} onPay={(values) => { run(() => aglCommercialDocumentsWorkflow.recordPayment(actor, paying.id, values), `Payment posted against ${paying.id}.`); setPaying(null); }} />}
  </>;
};

const PaymentModal = ({ invoice, onClose, onPay }: { invoice: AglOperationalRecord; onClose: () => void; onPay: (values: { amount: number; method: string; reference: string; receivedBy: string }) => void }) => {
  const snapshot = aglCommercialDocumentsWorkflow.invoiceSnapshot(invoice.id);
  const [values, setValues] = useState({ amount: snapshot.balance, method: 'MoMo', reference: '', receivedBy: 'AGL cashier' });
  return <div className="custom-scrollbar fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/75 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); onPay(values); }} className="my-auto w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0a0a0a] p-6"><div className="flex justify-between"><div><h2 className="text-xl text-white">Record payment</h2><p className="mt-1 text-[10px] text-gray-500">{invoice.id} · balance {money.format(snapshot.balance)}</p></div><button type="button" onClick={onClose}><X size={17} /></button></div><div className="mt-5 space-y-3"><Field label="Amount GHS"><input type="number" min=".01" max={snapshot.balance} value={values.amount} onChange={(e) => setValues({ ...values, amount: Number(e.target.value) })} /></Field><Field label="Method"><select value={values.method} onChange={(e) => setValues({ ...values, method: e.target.value })}>{['MoMo', 'Cash', 'POS', 'Bank transfer', 'Card'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Tender reference"><input value={values.reference} onChange={(e) => setValues({ ...values, reference: e.target.value })} /></Field><Field label="Received by"><input value={values.receivedBy} onChange={(e) => setValues({ ...values, receivedBy: e.target.value })} /></Field></div><button className="mt-5 min-h-11 w-full rounded-lg bg-emerald-300 text-[10px] font-semibold text-black">Post payment</button></form></div>;
};

const Payments = ({ version, run }: Props) => {
  const rows = useMemo(() => aglErpRepository.list('payments'), [version]);
  const invoices = useMemo(() => aglErpRepository.list('invoices').filter((item) => aglCommercialDocumentsWorkflow.invoiceSnapshot(item.id).balance > 0), [version]);
  const [invoice, setInvoice] = useState<AglOperationalRecord | null>(null);
  return <><section className="grid gap-3 sm:grid-cols-3"><Metric label="Payment records" value={rows.length} /><Metric label="Collected" value={money.format(rows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0))} /><Metric label="Invoices awaiting payment" value={invoices.length} /></section>{invoice && <PaymentModal invoice={invoice} onClose={() => setInvoice(null)} onPay={(values) => { run(() => aglCommercialDocumentsWorkflow.recordPayment(actor, invoice.id, values), `Payment posted against ${invoice.id}.`); setInvoice(null); }} />}<div className="flex justify-end"><select value={invoice?.id ?? ''} onChange={(event) => setInvoice(invoices.find((item) => item.id === event.target.value) ?? null)} className="h-10 rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[10px] text-white"><option value="">Record payment for invoice…</option>{invoices.map((item) => <option key={item.id} value={item.id}>{item.id} · {String(item.customer ?? item.name)}</option>)}</select></div><OperationalTable rows={rows} columns={['receivedAt', 'invoiceId', 'name', 'paymentMethod', 'reference', 'amount', 'receivedBy', 'status']} /></>;
};

const SalesLedger = ({ version }: { version: number }) => {
  const rows = useMemo(() => aglErpRepository.list('sales-ledger'), [version]);
  const [filters, setFilters] = useState({
    query: '',
    salesRep: '',
    mechanic: '',
    customer: '',
    vehicle: '',
    saleType: '',
    channel: '',
    paymentMethod: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minimumAmount: '',
    maximumAmount: '',
  });
  const option = (key: string) => [...new Set(rows.map((item) => String(item[key] ?? '')).filter(Boolean))].sort();
  const visible = rows.filter((item) => {
    const date = String(item.createdAt ?? '').slice(0, 10);
    const amount = Number(item.amount ?? 0);
    const normalized = filters.query.trim().toLowerCase();
    return (!normalized || JSON.stringify(item).toLowerCase().includes(normalized))
      && (!filters.salesRep || String(item.salesRep ?? item.owner) === filters.salesRep)
      && (!filters.mechanic || String(item.mechanic ?? '') === filters.mechanic)
      && (!filters.customer || String(item.customer ?? '') === filters.customer)
      && (!filters.vehicle || String(item.vehicle ?? item.registration ?? '') === filters.vehicle)
      && (!filters.saleType || String(item.saleType ?? '') === filters.saleType)
      && (!filters.channel || String(item.channel ?? '') === filters.channel)
      && (!filters.paymentMethod || String(item.paymentMethod ?? '') === filters.paymentMethod)
      && (!filters.status || String(item.status) === filters.status)
      && (!filters.dateFrom || date >= filters.dateFrom)
      && (!filters.dateTo || date <= filters.dateTo)
      && (!filters.minimumAmount || amount >= Number(filters.minimumAmount))
      && (!filters.maximumAmount || amount <= Number(filters.maximumAmount));
  });
  const total = visible.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const average = visible.length ? total / visible.length : 0;
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const set = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const reset = () => setFilters({ query: '', salesRep: '', mechanic: '', customer: '', vehicle: '', saleType: '', channel: '', paymentMethod: '', status: '', dateFrom: '', dateTo: '', minimumAmount: '', maximumAmount: '' });
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Transactions in drill" value={visible.length} />
      <Metric label="Revenue in drill" value={money.format(total)} />
      <Metric label="Average transaction" value={money.format(average)} />
      <Metric label="Open / part paid" value={visible.filter((item) => ['Credit', 'Part paid', 'Awaiting payment', 'Open'].includes(String(item.status))).length} />
    </section>
    <section className="rounded-xl border border-white/[0.08] bg-[#090909] p-4">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="flex items-center gap-2 text-xs font-medium text-white"><SlidersHorizontal size={14} className="text-cyan-300" /> Transaction drill</h2><p className="mt-1 text-[9px] text-gray-600">The organisational and main period scope comes from the strip above. Refine the sales evidence here.</p></div>
        <button onClick={reset} className="flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400 hover:text-white"><RotateCcw size={12} /> Clear {activeFilters ? `${activeFilters} filters` : 'filters'}</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
        <label className="relative sm:col-span-2"><span className="sr-only">Search sales</span><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={filters.query} onChange={(event) => set('query', event.target.value)} placeholder="Receipt, job, customer, vehicle, line…" className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-[10px] text-white" /></label>
        <DrillSelect label="Salesperson" value={filters.salesRep} onChange={(value) => set('salesRep', value)} options={option('owner')} />
        <DrillSelect label="Mechanic" value={filters.mechanic} onChange={(value) => set('mechanic', value)} options={option('mechanic')} />
        <DrillSelect label="Customer" value={filters.customer} onChange={(value) => set('customer', value)} options={option('customer')} />
        <DrillSelect label="Vehicle" value={filters.vehicle} onChange={(value) => set('vehicle', value)} options={[...new Set(rows.map((item) => String(item.vehicle ?? item.registration ?? '')).filter(Boolean))].sort()} />
        <DrillSelect label="Sale type" value={filters.saleType} onChange={(value) => set('saleType', value)} options={option('saleType')} />
        <DrillSelect label="Channel" value={filters.channel} onChange={(value) => set('channel', value)} options={option('channel')} />
        <DrillSelect label="Tender" value={filters.paymentMethod} onChange={(value) => set('paymentMethod', value)} options={option('paymentMethod')} />
        <DrillSelect label="State" value={filters.status} onChange={(value) => set('status', value)} options={option('status')} />
        <DrillInput label="From" type="date" value={filters.dateFrom} onChange={(value) => set('dateFrom', value)} />
        <DrillInput label="To" type="date" value={filters.dateTo} onChange={(value) => set('dateTo', value)} />
        <DrillInput label="Minimum GHS" type="number" value={filters.minimumAmount} onChange={(value) => set('minimumAmount', value)} />
        <DrillInput label="Maximum GHS" type="number" value={filters.maximumAmount} onChange={(value) => set('maximumAmount', value)} />
      </div>
    </section>
    <div className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]">
      <table className="w-full min-w-[1450px] text-left text-[10px]">
        <thead className="border-b border-white/[0.08] font-mono text-[8px] uppercase tracking-wider text-gray-600"><tr>{['Date / receipt', 'Branch / site', 'Customer', 'Vehicle', 'Sale', 'Channel', 'Tender', 'Salesperson', 'Mechanic', 'Amount', 'State'].map((head) => <th key={head} className="px-4 py-3 font-normal">{head}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/[0.06]">
          {visible.map((item) => <tr key={item.id} className="text-gray-300 hover:bg-white/[0.025]"><td className="px-4 py-4"><strong className="font-mono text-[9px] text-cyan-300">{String(item.receiptNumber ?? item.reference ?? item.id)}</strong><div className="mt-1 text-[8px] text-gray-600">{String(item.createdAt).slice(0, 10)}</div></td><td className="px-4 py-4">{String(item.branchName ?? '—')}<div className="mt-1 text-[8px] text-gray-600">{String(item.siteName ?? '—')}</div></td><td className="px-4 py-4 text-white">{String(item.customer ?? '—')}</td><td className="px-4 py-4">{String(item.vehicle ?? item.registration ?? '—')}</td><td className="px-4 py-4">{String(item.item ?? item.name ?? '—')}<div className="mt-1 text-[8px] text-gray-600">{String(item.saleType ?? 'Unclassified')}</div></td><td className="px-4 py-4">{String(item.channel ?? '—')}</td><td className="px-4 py-4">{String(item.paymentMethod ?? '—')}</td><td className="px-4 py-4">{String(item.salesRep ?? item.owner ?? '—')}</td><td className="px-4 py-4">{String(item.mechanic ?? '—')}</td><td className="px-4 py-4 font-mono text-white">{money.format(Number(item.amount ?? 0))}</td><td className="px-4 py-4"><Status value={item.status} /></td></tr>)}
        </tbody>
      </table>
      {!visible.length && <div className="p-12 text-center text-xs text-gray-600">No sale matches this branch, period, person, customer, vehicle, service, and amount drill.</div>}
    </div>
  </>;
};

const LegacySalesLedger = ({ version }: { version: number }) => {
  const rows = useMemo(() => aglErpRepository.list('sales-ledger'), [version]);
  const [query, setQuery] = useState('');
  const visible = rows.filter((item) => !query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  return <><section className="grid gap-3 sm:grid-cols-3"><Metric label="Sales records" value={rows.length} /><Metric label="Ledger revenue" value={money.format(rows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0))} /><Metric label="Credit / open" value={rows.filter((item) => ['Credit', 'Part paid', 'Awaiting payment'].includes(String(item.status))).length} /></section><label className="relative block max-w-lg"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sale, receipt, customer, channel, tender…" className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#090909] pl-9 pr-3 text-xs text-white" /></label><OperationalTable rows={visible} columns={['createdAt', 'receiptNumber', 'customer', 'item', 'channel', 'paymentMethod', 'amount', 'owner', 'status']} /></>;
};
void LegacySalesLedger;

const CreditControl = ({ version, run, moduleId }: Props & { moduleId: 'creditors' | 'debtors' }) => {
  const rows = useMemo(() => aglErpRepository.list(moduleId), [version, moduleId]);
  const [values, setValues] = useState({ name: '', contact: '', sourceReference: '', totalAmount: 0, amountPaid: 0, transactionDate: today(), dueDate: '', owner: 'Finance officer', notes: '' });
  const [settlement, setSettlement] = useState({ id: '', amount: 0, reference: '' });
  const total = rows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const outstanding = rows.reduce((sum, item) => sum + Number(item.outstanding ?? Math.max(0, Number(item.amount ?? 0) - Number(item.amountPaid ?? 0))), 0);
  return <>
    <section className="grid gap-3 sm:grid-cols-3"><Metric label={moduleId === 'debtors' ? 'Customer credit issued' : 'Supplier obligations'} value={money.format(total)} /><Metric label="Outstanding" value={money.format(outstanding)} /><Metric label="Past due" value={rows.filter((item) => item.status !== 'Settled' && item.dueDate && String(item.dueDate) < today()).length} /></section>
    <form onSubmit={(event) => { event.preventDefault(); run(() => aglCommercialDocumentsWorkflow.createCreditAccount(actor, moduleId, values), `${moduleId === 'debtors' ? 'Debtor' : 'Creditor'} account created.`); }} className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-5 sm:grid-cols-2 lg:grid-cols-4"><Field label={moduleId === 'debtors' ? 'Customer' : 'Supplier'}><input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></Field><Field label="Contact"><input value={values.contact} onChange={(e) => setValues({ ...values, contact: e.target.value })} /></Field><Field label="Invoice / PO / source"><input value={values.sourceReference} onChange={(e) => setValues({ ...values, sourceReference: e.target.value })} /></Field><Field label="Total amount GHS"><input type="number" value={values.totalAmount} onChange={(e) => setValues({ ...values, totalAmount: Number(e.target.value) })} /></Field><Field label="Already paid GHS"><input type="number" value={values.amountPaid} onChange={(e) => setValues({ ...values, amountPaid: Number(e.target.value) })} /></Field><Field label="Transaction date"><input type="date" value={values.transactionDate} onChange={(e) => setValues({ ...values, transactionDate: e.target.value })} /></Field><Field label="Due date"><input type="date" value={values.dueDate} onChange={(e) => setValues({ ...values, dueDate: e.target.value })} /></Field><Field label="Owner"><input value={values.owner} onChange={(e) => setValues({ ...values, owner: e.target.value })} /></Field><button className="min-h-10 rounded-lg bg-cyan-300 text-[10px] font-semibold text-black lg:col-span-4">Open account</button></form>
    <div className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[1100px] text-left text-[10px]"><thead className="border-b border-white/[0.08] text-gray-600"><tr>{['Account', 'Contact', 'Source', 'Date', 'Due', 'Total', 'Paid', 'Outstanding', 'Status', 'Settlement'].map((head) => <th key={head} className="px-4 py-3 font-normal uppercase tracking-wider">{head}</th>)}</tr></thead><tbody>{rows.map((item) => { const due = Number(item.outstanding ?? Math.max(0, Number(item.amount ?? 0) - Number(item.amountPaid ?? 0))); return <tr key={item.id} className="border-b border-white/[0.06] text-gray-300"><td className="px-4 py-4"><strong className="text-white">{String(item.name)}</strong><div className="font-mono text-[8px] text-gray-600">{item.id}</div></td><td className="px-4 py-4">{String(item.contact ?? '—')}</td><td className="px-4 py-4">{String(item.reference)}</td><td className="px-4 py-4">{String(item.transactionDate ?? item.createdAt).slice(0, 10)}</td><td className={`px-4 py-4 ${item.status !== 'Settled' && item.dueDate && String(item.dueDate) < today() ? 'text-red-300' : ''}`}>{String(item.dueDate ?? '—')}</td><td className="px-4 py-4">{money.format(Number(item.amount ?? 0))}</td><td className="px-4 py-4">{money.format(Number(item.amountPaid ?? 0))}</td><td className="px-4 py-4 text-amber-200">{money.format(due)}</td><td className="px-4 py-4"><Status value={item.status} /></td><td className="px-4 py-4">{due > 0 && (settlement.id === item.id ? <div className="flex gap-1"><input type="number" value={settlement.amount} onChange={(e) => setSettlement({ ...settlement, amount: Number(e.target.value) })} className="h-8 w-20 rounded border border-white/[0.08] bg-black/30 px-2" /><input value={settlement.reference} onChange={(e) => setSettlement({ ...settlement, reference: e.target.value })} placeholder="Reference" className="h-8 w-28 rounded border border-white/[0.08] bg-black/30 px-2" /><button onClick={() => run(() => aglCommercialDocumentsWorkflow.settleCredit(actor, moduleId, item, settlement.amount, settlement.reference), `${item.id} settlement posted.`)} className="rounded bg-emerald-300 px-2 text-[8px] text-black">Post</button></div> : <button onClick={() => setSettlement({ id: item.id, amount: due, reference: '' })} className="rounded border border-white/[0.08] px-2 py-1 text-[8px]">Settle</button>)}</td></tr>; })}</tbody></table></div>
  </>;
};

const OperationalTable = ({ rows, columns }: { rows: AglOperationalRecord[]; columns: string[] }) => <div className="overflow-auto rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[1000px] text-left text-[10px]"><thead className="border-b border-white/[0.08] text-gray-600"><tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-normal uppercase tracking-wider">{column.replace(/([A-Z])/g, ' $1')}</th>)}</tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-b border-white/[0.06] text-gray-300">{columns.map((column) => <td key={column} className="px-4 py-4">{column === 'amount' ? money.format(Number(item[column] ?? 0)) : column === 'status' ? <Status value={item[column]} /> : column.toLowerCase().includes('at') && item[column] ? new Date(String(item[column])).toLocaleString() : String(item[column] ?? '—')}</td>)}</tr>)}</tbody></table></div>;
const DocumentCard = ({ item, children }: { item: AglOperationalRecord; children: React.ReactNode }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-start justify-between"><div><span className="flex items-center gap-2 text-cyan-300"><FileText size={15} /><strong className="text-sm text-white">{String(item.name)}</strong></span><p className="mt-1 font-mono text-[8px] text-gray-600">{item.id} · {String(item.reference)}</p></div><Status value={item.status} /></div><dl className="mt-4">{children}</dl></article>;
const PrintButton = ({ item, kind }: { item: AglOperationalRecord; kind: string }) => <button onClick={() => printDocument(item, kind)} className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 text-[8px] text-gray-400"><Printer size={10} /> Print / PDF</button>;
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] ?? character));
const printDocument = (item: AglOperationalRecord, kind: string) => { aglErpRepository.recordAction({ moduleId: kind.toLowerCase() === 'invoice' ? 'invoices' : 'quotations', recordId: item.id, actorName: actor.name, actorRole: actor.role, action: 'PRINT', summary: `Prepared ${kind.toLowerCase()} ${item.id} for print/PDF.` }); const popup = window.open('', '_blank', 'noopener,noreferrer'); if (!popup) return; popup.document.write(`<html><head><title>${escapeHtml(item.id)}</title><style>body{font:14px Arial;padding:48px;color:#111}header{border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:28px}dl{display:grid;grid-template-columns:180px 1fr;gap:10px}dt{color:#666}dd{margin:0;border-bottom:1px solid #ddd;padding-bottom:8px}</style></head><body><header><h1>Automobiles Ghana Limited</h1><p>${escapeHtml(kind)} ${escapeHtml(item.id)}</p></header><dl>${Object.entries(item).map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl><script>window.print()</script></body></html>`); popup.document.close(); };
const titles: Record<ModuleId, string> = { 'sales-ledger': 'Sales ledger', quotations: 'Quotations', invoices: 'Invoices', payments: 'Payment register', creditors: 'Supplier creditors', debtors: 'Customer debtors' };
const descriptions: Record<ModuleId, string> = { 'sales-ledger': 'Review every completed counter, workshop, and imported sale with customer, receipt, channel, tender, value, and owner.', quotations: 'Draft, send, accept, print, and convert controlled customer offers into invoices.', invoices: 'Issue source-linked invoices, monitor balance, collect payments, and print customer documents.', payments: 'Retain every tender reference and its allocation to a source invoice.', creditors: 'Control supplier obligations, due dates, partial settlements, and payment references.', debtors: 'Control customer credit, ageing, partial receipts, and outstanding collection responsibility.' };
const DrillSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => <label><span className="font-mono text-[7px] uppercase tracking-wider text-gray-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 text-[10px] text-white"><option value="">All {label.toLowerCase()}</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
const DrillInput = ({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) => <label><span className="font-mono text-[7px] uppercase tracking-wider text-gray-600">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 text-[10px] text-white" /></label>;
const Metric = ({ label, value }: { label: string; value: string | number }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">{label}</div><div className="mt-3 text-xl font-display text-white">{value}</div></article>;
const Field = ({ label, children }: { label: string; children: React.ReactElement }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="mt-2 [&_input]:h-11 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.08] [&_input]:bg-black/30 [&_input]:px-3 [&_input]:text-xs [&_input]:text-white [&_select]:h-11 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.08] [&_select]:bg-black/30 [&_select]:px-3 [&_select]:text-xs [&_select]:text-white">{children}</div></label>;
const Row = ({ label, value }: { label: string; value: unknown }) => <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2 text-[9px]"><dt className="text-gray-600">{label}</dt><dd className="text-right text-gray-300">{String(value ?? '—')}</dd></div>;
const Status = ({ value }: { value: unknown }) => <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-2 py-1 text-[8px] text-cyan-200">{String(value)}</span>;
