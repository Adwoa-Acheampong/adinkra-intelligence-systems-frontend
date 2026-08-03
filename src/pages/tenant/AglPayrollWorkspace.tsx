import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronRight, RefreshCw, ShieldCheck, WalletCards, X } from 'lucide-react';
import type { Tenant } from '../../types';
import { GlassPanel } from '../../components/ui/GlassPanel';
import {
  aglPayrollWorkflow,
  calculateNetPay,
  type PayrollAmounts,
} from '../../erp/agl/payrollWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const currentPeriod = 'July 2026';

export const AglPayrollWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [version, setVersion] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [amounts, setAmounts] = useState<PayrollAmounts>({ basePay: 0, bonus: 0, overtime: 0, tax: 0, pension: 0, otherDeductions: 0 });
  const [reason, setReason] = useState('');
  const [approver, setApprover] = useState('');
  const [approvalReference, setApprovalReference] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [period, setPeriod] = useState(currentPeriod);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const allLines = useMemo(() => aglPayrollWorkflow.lines(), [version]);
  const openLines = allLines.filter((line) => line.status !== 'Processed');
  const lines = openLines.length ? openLines : allLines;
  const selected = lines.find((line) => line.id === selectedId);
  useEffect(() => {
    if (!selected) return;
    setAmounts({
      basePay: Number(selected.basePay ?? 0),
      bonus: Number(selected.bonus ?? 0),
      overtime: Number(selected.overtime ?? 0),
      tax: Number(selected.tax ?? 0),
      pension: Number(selected.pension ?? 0),
      otherDeductions: Number(selected.otherDeductions ?? 0),
    });
    setReason('');
  }, [selectedId, selected?.updatedAt]);

  const totals = lines.reduce((result, line) => ({
    gross: result.gross + Number(line.basePay ?? 0) + Number(line.bonus ?? 0) + Number(line.overtime ?? 0),
    deductions: result.deductions + Number(line.tax ?? 0) + Number(line.pension ?? 0) + Number(line.otherDeductions ?? 0),
    net: result.net + Number(line.amount ?? 0),
  }), { gross: 0, deductions: 0, net: 0 });
  const unprocessed = openLines;
  const batchState = unprocessed.length === 0 ? 'Processed' : unprocessed.every((line) => line.status === 'Approved') ? 'Approved' : unprocessed.every((line) => line.status === 'Ready') ? 'Ready' : 'Draft';

  const run = (action: () => unknown, confirmation: string) => {
    setError('');
    try {
      action();
      setNotice(confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The payroll control could not be completed.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-[1760px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><ShieldCheck size={13} /> {tenant.id.toUpperCase()} ERP / payroll control</div><h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">Payroll processing</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Correct individual calculations, require every line to be ready, separate preparation from approval, then process one immutable batch that generates employee payslips.</p></div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="block"><span className="sr-only">Payroll period</span><input value={period} onChange={(event) => setPeriod(event.target.value)} className="h-11 w-36 rounded-lg border border-white/[0.1] bg-black/25 px-3 text-xs text-white" /></label>
          <button onClick={() => run(() => aglPayrollWorkflow.syncFromEmployeeTerms(actor, period), `${period} staff pay terms loaded into a controlled draft batch.`)} className="flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] px-4 text-[10px] text-cyan-200"><RefreshCw size={13} /> Load staff pay terms</button>
          <div className="rounded-lg border border-white/[0.1] bg-black/25 px-4 py-3 text-right"><div className="font-mono text-[8px] uppercase text-gray-600">Batch state</div><div className="mt-1 text-sm text-white">{batchState}</div></div>
        </div>
      </header>

      {(notice || error) && <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}><span className="flex items-center gap-2">{error ? <AlertTriangle size={14} /> : <Check size={14} />}{error || notice}</span><button onClick={() => { setError(''); setNotice(''); }}><X size={13} /></button></div>}

      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4">
        <Signal label="Employees" value={String(lines.length)} detail={`${unprocessed.length} in current batch`} />
        <Signal label="Gross pay" value={money.format(totals.gross)} detail="Base + bonus + overtime" />
        <Signal label="Deductions" value={money.format(totals.deductions)} detail="Tax + pension + other" />
        <Signal label="Net payroll" value={money.format(totals.net)} detail="Payable after controls" accent />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="border-b border-white/[0.07] bg-black/20 font-mono text-[8px] uppercase tracking-wider text-gray-600"><tr><th className="px-5 py-3 font-normal">Employee</th><th className="px-5 py-3 font-normal">Base</th><th className="px-5 py-3 font-normal">Bonus</th><th className="px-5 py-3 font-normal">Overtime</th><th className="px-5 py-3 font-normal">Tax</th><th className="px-5 py-3 font-normal">Pension</th><th className="px-5 py-3 font-normal">Net pay</th><th className="px-5 py-3 font-normal">State</th><th className="px-5 py-3"></th></tr></thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {lines.map((line) => (
                  <tr key={line.id} className={`transition ${selectedId === line.id ? 'bg-vertical-accent-glow' : 'hover:bg-white/[0.025]'}`}>
                    <td className="px-5 py-4"><div className="text-gray-200">{String(line.name)}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{String(line.reference)} · {String(line.payBasis ?? 'Pay basis not set')}</div></td>
                    {[line.basePay, line.bonus, line.overtime, line.tax, line.pension, line.amount].map((value, index) => <td key={index} className={`px-5 py-4 font-mono text-[10px] ${index === 5 ? 'text-white' : 'text-gray-400'}`}>{money.format(Number(value ?? 0))}</td>)}
                    <td className="px-5 py-4"><span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] uppercase text-gray-400">{line.status}</span></td>
                    <td className="px-5 py-4"><button onClick={() => setSelectedId(line.id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><ChevronRight size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-white/[0.08] bg-white/[0.025] text-xs"><tr><td className="px-5 py-4 font-medium text-white">Batch total</td><td colSpan={5}></td><td className="px-5 py-4 font-mono text-white">{money.format(totals.net)}</td><td colSpan={2}></td></tr></tfoot>
            </table>
          </div>
        </GlassPanel>

        <aside className="space-y-4">
          <GlassPanel className="rounded-xl p-5">
            {selected ? (
              <div>
                <div className="flex items-start justify-between gap-4"><div><div className="font-mono text-[9px] text-vertical-accent">{selected.id}</div><h2 className="mt-2 text-base font-medium text-white">{String(selected.name)}</h2></div><span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] uppercase text-gray-400">{selected.status}</span></div>
                {selected.status === 'Processed' ? <div className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-[10px] leading-5 text-emerald-300"><WalletCards size={15} className="mb-2" />Processed under {String(selected.paymentReference)}. Correct it through a later payroll run, not by rewriting this record.</div> : (
                  <div className="mt-5 space-y-3">
                    <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.035] p-3"><div className="font-mono text-[8px] uppercase text-cyan-300">Base pay source</div><div className="mt-2 text-[10px] text-gray-300">{String(selected.compensationSource ?? 'Employee master')} · effective {String(selected.compensationEffectiveDate ?? 'date not set')}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{String(selected.basePayCalculation ?? `${String(selected.payBasis ?? 'Monthly')} employee term`)}</div></div>
                    <div className="grid grid-cols-2 gap-3">{(['basePay', 'bonus', 'overtime', 'tax', 'pension', 'otherDeductions'] as const).map((key) => <NumberField key={key} label={key.replace(/([A-Z])/g, ' $1')} value={amounts[key]} disabled={key === 'basePay'} onChange={(value) => setAmounts((current) => ({ ...current, [key]: value }))} />)}</div>
                    <div className="rounded-lg border border-white/[0.08] bg-black/20 p-4"><div className="font-mono text-[8px] uppercase text-gray-600">Recalculated net</div><div className="mt-2 text-lg text-white">{money.format(calculateNetPay(amounts))}</div></div>
                    <TextArea label="Calculation / correction basis" value={reason} onChange={setReason} />
                    <button disabled={!reason.trim()} onClick={() => run(() => aglPayrollWorkflow.recalculate(selected.id, actor, amounts, reason), `${selected.id} recalculated and marked Ready.`)} className="min-h-10 w-full rounded-lg bg-vertical-accent text-[10px] font-semibold text-black disabled:opacity-30">Recalculate and mark Ready</button>
                  </div>
                )}
              </div>
            ) : <div className="flex min-h-60 flex-col items-center justify-center text-center"><WalletCards size={24} className="text-gray-700" /><div className="mt-3 text-xs text-gray-400">Select a payroll line</div><p className="mt-2 text-[10px] leading-4 text-gray-600">Review and correct the calculation before batch approval.</p></div>}
          </GlassPanel>

          <GlassPanel className="rounded-xl p-5">
            <h2 className="text-sm font-medium text-white">Batch controls</h2>
            {batchState === 'Ready' && <div className="mt-4 space-y-3"><TextField label="Independent approver" value={approver} onChange={setApprover} /><TextField label="Approval reference" value={approvalReference} onChange={setApprovalReference} /><button disabled={!approver.trim() || !approvalReference.trim()} onClick={() => run(() => aglPayrollWorkflow.approveBatch(actor, approver, approvalReference), `Payroll batch approved by ${approver}.`)} className="min-h-10 w-full rounded-lg bg-vertical-accent text-[10px] font-semibold text-black disabled:opacity-30">Approve entire batch</button></div>}
            {batchState === 'Approved' && <div className="mt-4 space-y-3"><TextField label="Payroll period" value={period} onChange={setPeriod} /><TextField label="Payment / bank reference" value={paymentReference} onChange={setPaymentReference} /><button disabled={!paymentReference.trim() || !period.trim()} onClick={() => run(() => aglPayrollWorkflow.processBatch(actor, paymentReference, period), `${period} payroll processed and payslips generated.`)} className="min-h-10 w-full rounded-lg bg-vertical-accent text-[10px] font-semibold text-black disabled:opacity-30">Process batch & generate payslips</button></div>}
            {batchState === 'Draft' && <p className="mt-3 text-[10px] leading-4 text-gray-600">Every unprocessed line must be recalculated or marked Ready before the batch can be approved.</p>}
            {batchState === 'Processed' && <p className="mt-3 text-[10px] leading-4 text-emerald-400/70">Batch processed. Payslips are available in the dedicated register.</p>}
          </GlassPanel>
        </aside>
      </div>
    </motion.div>
  );
};

const Signal = ({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) => <div className="bg-[#090909] px-5 py-4"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><div className={`mt-2 text-lg ${accent ? 'text-vertical-accent' : 'text-white'}`}>{value}</div><div className="mt-1 text-[9px] text-gray-700">{detail}</div></div>;
const fieldClass = 'mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white outline-none focus:border-vertical-accent';
const NumberField = ({ label, value, onChange, disabled = false }: { label: string; value: number; onChange: (value: number) => void; disabled?: boolean }) => <label><span className="font-mono text-[8px] capitalize text-gray-600">{label}</span><input type="number" min="0" value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} className={`${fieldClass} disabled:cursor-not-allowed disabled:border-cyan-300/10 disabled:bg-cyan-300/[0.025] disabled:text-cyan-100`} /></label>;
const TextField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="block"><span className="font-mono text-[8px] uppercase text-gray-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} /></label>;
const TextArea = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="block"><span className="font-mono text-[8px] uppercase text-gray-600">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} min-h-20 py-3`} /></label>;
