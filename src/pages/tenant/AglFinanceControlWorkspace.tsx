import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Banknote, Check, Landmark, Plus, ReceiptText, Save, Scale, Settings, ShieldCheck } from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglFinanceWorkflow } from '../../erp/agl/financeWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
type FinanceMode = 'finance-controls' | 'expenses' | 'petty-cash' | 'reconciliation' | 'finance-journals';

export const AglFinanceControlWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: FinanceMode }) => {
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

  useEffect(() => {
    setCreating(false);
    setSelected(null);
    setError('');
  }, [moduleId]);

  const records = useMemo(() => (
    moduleId === 'finance-controls' ? (aglFinanceWorkflow.controls() ? [aglFinanceWorkflow.controls()!] : [])
      : moduleId === 'expenses' ? aglFinanceWorkflow.expenses()
      : moduleId === 'petty-cash' ? aglFinanceWorkflow.pettyCash()
        : moduleId === 'reconciliation' ? aglFinanceWorkflow.reconciliations()
          : aglFinanceWorkflow.journals()
  ), [moduleId, revision]);
  const unsettled = records.filter((item) => !['Settled', 'Posted'].includes(item.status));
  const value = records.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const variance = moduleId === 'reconciliation' ? records.reduce((sum, item) => sum + Math.abs(Number(item.variance ?? 0)), 0) : 0;
  const activeSelected = selected ? records.find((item) => item.id === selected.id) ?? selected : null;

  const run = (operation: () => unknown, success: string) => {
    setError('');
    try {
      operation();
      setMessage(success);
      setCreating(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The finance action could not be completed.');
    }
  };

  if (moduleId === 'finance-controls') {
    return <FinanceControls tenant={tenant} stored={records[0]} message={message} error={error} onRun={run} />;
  }

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">{tenant.id.toUpperCase()} ERP / finance control</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">{titleFor(moduleId)}</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">{descriptionFor(moduleId)}</p>
        </div>
        {moduleId !== 'finance-journals' && <button onClick={() => setCreating(true)} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Plus size={15} />{createLabelFor(moduleId)}</button>}
      </header>

      {(message || error) && <div className={`rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>{error || message}</div>}

      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
        <Measure label="Records in this book" value={String(records.length)} icon={<ReceiptText size={14} />} />
        <Measure label={moduleId === 'finance-journals' ? 'Posted value' : 'Awaiting control'} value={moduleId === 'finance-journals' ? money.format(value) : String(unsettled.length)} icon={<ShieldCheck size={14} />} warning={unsettled.length > 0 && moduleId !== 'finance-journals'} />
        <Measure label={moduleId === 'reconciliation' ? 'Absolute break' : 'Book value'} value={money.format(moduleId === 'reconciliation' ? variance : value)} icon={<Scale size={14} />} warning={variance > 0} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-white/[0.07] font-mono text-[8px] uppercase tracking-wider text-gray-600">
                <tr>{columnsFor(moduleId).map((column) => <th key={column} className="px-4 py-3 font-normal">{column}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {records.map((item) => <FinanceRow key={item.id} item={item} mode={moduleId} selected={selected?.id === item.id} onClick={() => { setSelected(item); setCreating(false); setError(''); }} />)}
              </tbody>
            </table>
          </div>
          {!records.length && <div className="p-12 text-center text-xs text-gray-600">No records have been posted in this operational book.</div>}
        </section>
        <aside className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
          {creating ? (
            moduleId === 'expenses' ? <ExpenseCreate onRun={run} />
              : moduleId === 'petty-cash' ? <PettyCashCreate onRun={run} />
                : <ReconciliationCreate onRun={run} />
          ) : activeSelected ? (
            <FinanceActions mode={moduleId} record={activeSelected} onRun={run} />
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center text-center"><Landmark size={25} className="text-gray-700" /><p className="mt-3 text-xs text-gray-500">Select a finance record</p><p className="mt-2 max-w-60 text-[10px] leading-4 text-gray-700">Available controls depend on the record state. Posted journal lines remain immutable.</p></div>
          )}
        </aside>
      </div>
    </div>
  );
};

const FinanceControls = ({
  tenant,
  stored,
  message,
  error,
  onRun,
}: {
  tenant: Tenant;
  stored?: AglOperationalRecord;
  message: string;
  error: string;
  onRun: (operation: () => unknown, success: string) => void;
}) => {
  const [values, setValues] = useState({
    name: String(stored?.name ?? 'AGL Ghana finance controls'),
    currency: String(stored?.currency ?? 'GHS'),
    fiscalYearStartMonth: String(stored?.fiscalYearStartMonth ?? 'January'),
    vatRate: Number(stored?.vatRate ?? 15),
    nhilRate: Number(stored?.nhilRate ?? 2.5),
    getfundRate: Number(stored?.getfundRate ?? 2.5),
    defaultPaymentTermsDays: Number(stored?.defaultPaymentTermsDays ?? 30),
    expenseApprovalThresholdGhs: Number(stored?.expenseApprovalThresholdGhs ?? 5000),
    invoicePrefix: String(stored?.invoicePrefix ?? 'AGL'),
    owner: String(stored?.owner ?? 'Finance Controller'),
    notes: String(stored?.notes ?? ''),
  });
  const update = (key: keyof typeof values, value: string | number) => setValues((current) => ({ ...current, [key]: value }));
  const combinedRate = values.vatRate + values.nhilRate + values.getfundRate;
  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="border-b border-white/[0.08] pb-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">{tenant.id.toUpperCase()} ERP / finance control</div>
        <h1 className="mt-3 text-3xl font-display font-semibold text-white">Finance settings & tax</h1>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Own the calculation parameters used by invoices, statutory reporting, approval routing, and finance documents. These controls no longer live in technical ERP settings.</p>
      </header>
      {(message || error) && <div className={`rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>{error || message}</div>}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Measure label="Combined statutory rate" value={`${combinedRate.toFixed(1)}%`} icon={<Scale size={14} />} />
        <Measure label="Default payment terms" value={`${values.defaultPaymentTermsDays} days`} icon={<ReceiptText size={14} />} />
        <Measure label="Approval threshold" value={money.format(values.expenseApprovalThresholdGhs)} icon={<ShieldCheck size={14} />} />
        <Measure label="Document currency" value={values.currency} icon={<Landmark size={14} />} />
      </section>
      <form onSubmit={(event) => { event.preventDefault(); onRun(() => aglFinanceWorkflow.saveControls(actor, values), 'Finance controls saved with an attributed audit event.'); }} className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <section className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
          <PanelTitle icon={<Scale size={15} />} title="Statutory & fiscal calculation" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input label="Control set name" value={values.name} onChange={(value) => update('name', value)} />
            <Input label="Currency" value={values.currency} onChange={(value) => update('currency', value)} options={['GHS', 'NGN', 'USD', 'EUR']} />
            <Input label="Fiscal year starts" value={values.fiscalYearStartMonth} onChange={(value) => update('fiscalYearStartMonth', value)} options={['January', 'April', 'July', 'October']} />
            <Input label="VAT %" value={values.vatRate} onChange={(value) => update('vatRate', Number(value))} type="number" />
            <Input label="NHIL %" value={values.nhilRate} onChange={(value) => update('nhilRate', Number(value))} type="number" />
            <Input label="GETFund %" value={values.getfundRate} onChange={(value) => update('getfundRate', Number(value))} type="number" />
          </div>
        </section>
        <section className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
          <PanelTitle icon={<Settings size={15} />} title="Documents & approvals" />
          <div className="mt-5 space-y-4">
            <Input label="Invoice prefix" value={values.invoicePrefix} onChange={(value) => update('invoicePrefix', value.toUpperCase())} />
            <Input label="Default payment terms (days)" value={values.defaultPaymentTermsDays} onChange={(value) => update('defaultPaymentTermsDays', Number(value))} type="number" />
            <Input label="Expense approval threshold (GHS)" value={values.expenseApprovalThresholdGhs} onChange={(value) => update('expenseApprovalThresholdGhs', Number(value))} type="number" />
            <Input label="Accountable owner" value={values.owner} onChange={(value) => update('owner', value)} />
            <Input label="Control note" value={values.notes} onChange={(value) => update('notes', value)} />
          </div>
        </section>
        <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black xl:col-span-2"><Save size={14} /> Save finance controls</button>
      </form>
    </div>
  );
};

const titleFor = (mode: FinanceMode) => ({ 'finance-controls': 'Finance settings & tax', expenses: 'Expense control', 'petty-cash': 'Petty-cash custody', reconciliation: 'Tender reconciliation', 'finance-journals': 'Finance journal' }[mode]);
const descriptionFor = (mode: FinanceMode) => ({
  'finance-controls': 'Govern finance-owned calculation rules, statutory rates, fiscal calendar, document numbering, payment terms, and approval thresholds.',
  expenses: 'Capture the source invoice, separate preparation from approval, settle against an external payment reference, and retain the resulting ledger lineage.',
  'petty-cash': 'Control each disbursement and replenishment through a named custodian, independent approval, voucher evidence, and journal posting.',
  reconciliation: 'Compare the operational tender ledger with bank, MoMo, POS, and cash evidence; resolve every break without concealing the original variance.',
  'finance-journals': 'Read the immutable postings generated by controlled operational actions. Corrections are new entries, never silent edits.',
}[mode]);
const createLabelFor = (mode: FinanceMode) => ({ 'finance-controls': '', expenses: 'Record expense', 'petty-cash': 'Request cash movement', reconciliation: 'Start reconciliation', 'finance-journals': '' }[mode]);
const columnsFor = (mode: FinanceMode) => mode === 'finance-journals'
  ? ['Journal', 'Posting', 'Debit', 'Credit', 'Amount', 'Source', 'Status']
  : mode === 'reconciliation'
    ? ['Reconciliation', 'Channel / period', 'Expected', 'Declared', 'Variance', 'Evidence', 'Status']
    : ['Record', 'Purpose', 'Counterparty / custodian', 'Amount', 'Evidence', 'Owner', 'Status'];

const Measure = ({ label, value, icon, warning = false }: { label: string; value: string; icon: ReactNode; warning?: boolean }) => (
  <div className="flex items-center justify-between bg-[#090909] px-4 py-3"><div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><div className={`mt-2 text-lg font-medium ${warning ? 'text-amber-300' : 'text-white'}`}>{value}</div></div><span className="text-vertical-accent">{icon}</span></div>
);

const FinanceRow = ({ item, mode, selected, onClick }: { item: AglOperationalRecord; mode: FinanceMode; selected: boolean; onClick: () => void }) => {
  const cells = mode === 'finance-journals'
    ? [item.id, item.name, item.debitAccount, item.creditAccount, money.format(Number(item.amount ?? 0)), `${String(item.sourceModule ?? '')} · ${String(item.sourceRecordId ?? '')}`, <Status key="status" value={item.status} />]
    : mode === 'reconciliation'
      ? [item.id, `${String(item.channel ?? item.name)} · ${String(item.period ?? '')}`, money.format(Number(item.expectedAmount ?? item.amount ?? 0)), money.format(Number(item.declaredAmount ?? 0)), money.format(Number(item.variance ?? 0)), item.statementReference ?? item.reference, <Status key="status" value={item.status} />]
      : [item.id, item.name, item.vendor ?? item.custodian ?? '—', money.format(Number(item.amount ?? 0)), item.evidenceReference ?? item.reference, item.owner, <Status key="status" value={item.status} />];
  return <tr onClick={onClick} className={`cursor-pointer transition hover:bg-white/[0.03] ${selected ? 'bg-vertical-accent/[0.05]' : ''}`}>{cells.map((cell, index) => <td key={index} className={`px-4 py-4 ${index === 0 ? 'font-mono text-[9px] text-vertical-accent' : 'text-gray-300'}`}>{cell as ReactNode}</td>)}</tr>;
};

const Status = ({ value }: { value: string }) => (
  <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${value === 'Approval required' ? 'border-amber-400/20 text-amber-300' : ['Approved', 'Settled', 'Posted'].includes(value) ? 'border-emerald-400/20 text-emerald-300' : 'border-white/[0.08] text-gray-400'}`}>{value}</span>
);

const Input = ({ label, value, onChange, type = 'text', options }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; options?: string[] }) => (
  <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>{options ? <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0b0b] px-3 text-xs text-white">{options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 text-xs text-white outline-none focus:border-vertical-accent" />}</label>
);
const Commit = ({ children }: { children: ReactNode }) => <button type="submit" className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-xs font-semibold text-black"><Check size={14} />{children}</button>;

const ExpenseCreate = ({ onRun }: { onRun: (operation: () => unknown, success: string) => void }) => {
  const [values, setValues] = useState({ name: '', category: 'Utilities', vendor: '', amount: 0, expenseDate: '2026-07-30', paymentMethod: 'Bank transfer', evidenceReference: '', owner: 'Alex Morgan', notes: '' });
  const field = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: key === 'amount' ? Number(value) : value }));
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onRun(() => aglFinanceWorkflow.createExpense(actor, values), 'Draft expense recorded. Submit it before independent approval.'); }}><PanelTitle icon={<ReceiptText size={15} />} title="New expense source" /><Input label="Expense" value={values.name} onChange={field('name')} /><Input label="Category" value={values.category} onChange={field('category')} options={['Utilities', 'Fuel', 'Maintenance', 'Telecoms', 'Office', 'Delivery', 'Travel']} /><Input label="Vendor / payee" value={values.vendor} onChange={field('vendor')} /><Input label="Amount (GHS)" value={values.amount} onChange={field('amount')} type="number" /><Input label="Expense date" value={values.expenseDate} onChange={field('expenseDate')} type="date" /><Input label="Payment method" value={values.paymentMethod} onChange={field('paymentMethod')} options={['Bank transfer', 'MoMo', 'Cash', 'Cheque', 'Card']} /><Input label="Invoice / receipt evidence" value={values.evidenceReference} onChange={field('evidenceReference')} /><Input label="Prepared by" value={values.owner} onChange={field('owner')} /><Input label="Notes" value={values.notes} onChange={field('notes')} /><Commit>Save draft expense</Commit></form>;
};

const PettyCashCreate = ({ onRun }: { onRun: (operation: () => unknown, success: string) => void }) => {
  const [entryType, setEntryType] = useState<'Disbursement' | 'Replenishment'>('Disbursement');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [custodian, setCustodian] = useState('Alex Morgan');
  const [evidenceReference, setEvidence] = useState('');
  const [notes, setNotes] = useState('');
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onRun(() => aglFinanceWorkflow.requestPettyCash(actor, { entryType, name, amount, custodian, evidenceReference, notes }), 'Petty-cash movement sent for independent approval.'); }}><PanelTitle icon={<Banknote size={15} />} title="Cash custody request" /><Input label="Movement" value={entryType} onChange={(value) => setEntryType(value as typeof entryType)} options={['Disbursement', 'Replenishment']} /><Input label="Purpose" value={name} onChange={setName} /><Input label="Amount (GHS)" value={amount} onChange={(value) => setAmount(Number(value))} type="number" /><Input label="Custodian" value={custodian} onChange={setCustodian} /><Input label="Request evidence" value={evidenceReference} onChange={setEvidence} /><Input label="Notes" value={notes} onChange={setNotes} /><Commit>Request cash movement</Commit></form>;
};

const ReconciliationCreate = ({ onRun }: { onRun: (operation: () => unknown, success: string) => void }) => {
  const [values, setValues] = useState({ channel: 'MTN MoMo', period: '2026-07-30', expectedAmount: 0, declaredAmount: 0, statementReference: '', owner: 'Alex Morgan', notes: '' });
  const field = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: ['expectedAmount', 'declaredAmount'].includes(key) ? Number(value) : value }));
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onRun(() => aglFinanceWorkflow.startReconciliation(actor, values), values.expectedAmount === values.declaredAmount ? 'Tender reconciled with no break.' : 'Reconciliation break opened for controlled resolution.'); }}><PanelTitle icon={<Scale size={15} />} title="External-to-ledger match" /><Input label="Tender channel" value={values.channel} onChange={field('channel')} options={['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money', 'Cash', 'POS', 'Bank transfer']} /><Input label="Period" value={values.period} onChange={field('period')} type="date" /><Input label="Expected from ledger" value={values.expectedAmount} onChange={field('expectedAmount')} type="number" /><Input label="Declared by provider / custodian" value={values.declaredAmount} onChange={field('declaredAmount')} type="number" /><Input label="Statement reference" value={values.statementReference} onChange={field('statementReference')} /><Input label="Prepared by" value={values.owner} onChange={field('owner')} /><Input label="Notes" value={values.notes} onChange={field('notes')} /><Commit>Compare balances</Commit></form>;
};

const FinanceActions = ({ mode, record, onRun }: { mode: FinanceMode; record: AglOperationalRecord; onRun: (operation: () => unknown, success: string) => void }) => {
  const [approver, setApprover] = useState('Bekoe Adu Benjamin');
  const [basis, setBasis] = useState('');
  const [reference, setReference] = useState('');
  if (mode === 'finance-journals') return <div><PanelTitle icon={<Landmark size={15} />} title={record.id} /><Evidence record={record} /></div>;
  return (
    <div className="space-y-4">
      <PanelTitle icon={<ShieldCheck size={15} />} title={record.id} />
      <div className="text-sm text-white">{String(record.name)}</div>
      <div className="text-[10px] text-gray-600">{money.format(Number(record.amount ?? 0))} · {String(record.reference ?? '')}</div>
      <Evidence record={record} />
      {mode === 'expenses' && record.status === 'Draft' && <button onClick={() => onRun(() => aglFinanceWorkflow.submitExpense(record.id, actor), `${record.id} submitted for approval.`)} className="min-h-10 w-full rounded-lg bg-vertical-accent text-xs font-semibold text-black">Submit for approval</button>}
      {record.status === 'Approval required' && (
        <div className="space-y-3 border-t border-white/[0.07] pt-4">
          <Input label="Independent approver" value={approver} onChange={setApprover} />
          <Input label={mode === 'reconciliation' ? 'Resolution' : 'Approval basis'} value={basis} onChange={setBasis} />
          {mode === 'reconciliation' && <Input label="Resolution evidence" value={reference} onChange={setReference} />}
          <button onClick={() => onRun(() => mode === 'expenses' ? aglFinanceWorkflow.approveExpense(record.id, actor, approver, basis) : mode === 'petty-cash' ? aglFinanceWorkflow.approvePettyCash(record.id, actor, approver, basis) : aglFinanceWorkflow.resolveReconciliation(record.id, actor, { approver, resolution: basis, evidenceReference: reference }), `${record.id} ${mode === 'reconciliation' ? 'resolved' : 'approved'} with linked journal evidence.`)} className="min-h-10 w-full rounded-lg bg-vertical-accent text-xs font-semibold text-black">{mode === 'reconciliation' ? 'Resolve break' : 'Approve'}</button>
        </div>
      )}
      {record.status === 'Approved' && mode !== 'reconciliation' && (
        <div className="space-y-3 border-t border-white/[0.07] pt-4"><Input label={mode === 'expenses' ? 'Payment reference' : 'Voucher / replenishment reference'} value={reference} onChange={setReference} /><button onClick={() => onRun(() => mode === 'expenses' ? aglFinanceWorkflow.settleExpense(record.id, actor, reference) : aglFinanceWorkflow.settlePettyCash(record.id, actor, reference), `${record.id} settled and journalled.`)} className="min-h-10 w-full rounded-lg bg-vertical-accent text-xs font-semibold text-black">Settle and post</button></div>
      )}
    </div>
  );
};

const PanelTitle = ({ icon, title }: { icon: ReactNode; title: string }) => <div className="flex items-center gap-2 border-b border-white/[0.07] pb-4 text-xs font-medium text-white"><span className="text-vertical-accent">{icon}</span>{title}</div>;
const Evidence = ({ record }: { record: AglOperationalRecord }) => <dl className="space-y-2 border-t border-white/[0.07] pt-4 text-[10px]">{[['State', record.status], ['Owner', record.owner], ['Evidence', record.evidenceReference ?? record.statementReference ?? record.reference], ['Approver', record.approver ?? '—'], ['Payment', record.paymentReference ?? record.cashReference ?? '—']].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-3"><dt className="text-gray-600">{String(label)}</dt><dd className="max-w-[65%] text-right text-gray-300">{String(value ?? '—')}</dd></div>)}</dl>;
