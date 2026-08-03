import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeDollarSign,
  BookOpenCheck,
  ChevronRight,
  CircleDollarSign,
  Landmark,
  ReceiptText,
  RefreshCcw,
  Scale,
  WalletCards,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglErpRepository } from '../../erp/agl/repository';

const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const total = (records: AglOperationalRecord[]) => records.reduce((sum, record) => sum + Number(record.amount ?? 0), 0);

export const AglProfitLossWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const data = useMemo(() => {
    const sales = aglErpRepository.list('sales-ledger').filter((record) => ['Paid', 'Part paid'].includes(record.status));
    const expenses = aglErpRepository.list('expenses');
    const postedExpenses = expenses.filter((record) => ['Approved', 'Settled'].includes(record.status));
    const payroll = aglErpRepository.list('payroll');
    const postedPayroll = payroll.filter((record) => ['Approved', 'Processed'].includes(record.status));
    const pendingPayroll = payroll.filter((record) => ['Draft', 'Ready'].includes(record.status));
    const generalLedger = aglErpRepository.list('profit-loss').filter((record) => ['Posted', 'Adjusted'].includes(record.status));
    const revenue = total(sales) + total(generalLedger.filter((record) => record.category === 'Revenue'));
    const costOfSales = Math.abs(total(generalLedger.filter((record) => record.category === 'Cost of sales')));
    const operatingExpenses = total(postedExpenses) + Math.abs(total(generalLedger.filter((record) => record.category === 'Operating expense')));
    const payrollCost = total(postedPayroll);
    const tax = Math.abs(total(generalLedger.filter((record) => record.category === 'Tax')));
    const grossProfit = revenue - costOfSales;
    const operatingResult = grossProfit - operatingExpenses - payrollCost;
    const netResult = operatingResult - tax;
    return {
      sales,
      expenses,
      postedExpenses,
      payroll,
      pendingPayroll,
      generalLedger,
      revenue,
      costOfSales,
      operatingExpenses,
      payrollCost,
      tax,
      grossProfit,
      operatingResult,
      netResult,
      margin: revenue ? (netResult / revenue) * 100 : 0,
    };
  }, [version]);

  const basePath = `/${tenant.verticalId}/tenant/${tenant.id}/erp`;
  const lines = [
    { label: 'Revenue', value: data.revenue, detail: `${data.sales.length} sales-ledger records`, route: 'sales-ledger', emphasis: true },
    { label: 'Cost of sales', value: -data.costOfSales, detail: 'Posted direct-cost ledger lines', route: 'finance-journals' },
    { label: 'Gross profit', value: data.grossProfit, detail: 'Revenue less direct cost', route: '', subtotal: true },
    { label: 'Operating expenses', value: -data.operatingExpenses, detail: `${data.postedExpenses.length} approved or settled expenses`, route: 'expenses' },
    { label: 'Posted payroll', value: -data.payrollCost, detail: `${data.payroll.length - data.pendingPayroll.length} approved or processed lines`, route: 'payroll' },
    { label: 'Operating result', value: data.operatingResult, detail: 'Before posted tax', route: '', subtotal: true },
    { label: 'Posted tax', value: -data.tax, detail: 'Tax journal entries in this scope', route: 'finance-journals' },
    { label: 'Net operating result', value: data.netResult, detail: 'Current governed ledger position', route: '', total: true },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><BookOpenCheck size={13} /> AGL ERP / Finance</div><h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">Profit & loss control</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">A live operating statement derived from scoped sales, posted direct costs, approved expenses, processed payroll, and controlled journals. Source ledgers remain the place where records are changed.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => navigate(`${basePath}/reconciliation`)} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.09] bg-black/25 px-4 text-[10px] text-gray-300"><Scale size={14} /> Reconcile tenders</button><button onClick={() => navigate(`${basePath}/finance-journals`)} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Landmark size={14} /> New journal adjustment</button></div>
      </header>

      <section aria-label="Profit and loss operational summary" className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-5">
        <Signal icon={<CircleDollarSign size={14} />} label="Revenue" value={money.format(data.revenue)} detail="Paid and part-paid sales" />
        <Signal icon={<WalletCards size={14} />} label="Gross profit" value={money.format(data.grossProfit)} detail={`${data.revenue ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : '0.0'}% gross margin`} warn={data.grossProfit < 0} />
        <Signal icon={<ReceiptText size={14} />} label="Operating expense" value={money.format(data.operatingExpenses)} detail="Approved and settled" />
        <Signal icon={<BadgeDollarSign size={14} />} label="Net result" value={money.format(data.netResult)} detail={`${data.margin.toFixed(1)}% operating margin`} warn={data.netResult < 0} />
        <Signal icon={<RefreshCcw size={14} />} label="Unposted payroll" value={money.format(total(data.pendingPayroll))} detail={`${data.pendingPayroll.length} draft or ready lines`} warn={data.pendingPayroll.length > 0} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.66fr_0.34fr]">
        <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#080808]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Operating statement</h2><p className="mt-1 text-[9px] text-gray-600">Current operating scope and period</p></div><span className="rounded border border-emerald-400/20 bg-emerald-400/[0.05] px-2 py-1 font-mono text-[8px] uppercase text-emerald-300">Live ledger</span></div>
          <div className="p-5">
            {lines.map((line) => (
              <div key={line.label} className={`grid grid-cols-[1fr_auto] items-center gap-5 border-b px-2 py-4 ${line.total ? 'mt-2 border-emerald-400/20 bg-emerald-400/[0.035]' : line.subtotal ? 'border-white/[0.12] bg-white/[0.015]' : 'border-white/[0.06]'}`}>
                <div><div className={`text-[11px] ${line.total || line.subtotal || line.emphasis ? 'font-medium text-white' : 'text-gray-300'}`}>{line.label}</div><div className="mt-1 text-[9px] text-gray-700">{line.detail}</div></div>
                <div className="flex items-center gap-3"><span className={`font-mono text-[11px] ${line.value < 0 ? 'text-red-300' : line.total ? 'text-emerald-300' : 'text-white'}`}>{money.format(line.value)}</span>{line.route ? <button onClick={() => navigate(`${basePath}/${line.route}`)} aria-label={`Open ${line.label} source ledger`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-gray-600 hover:border-cyan-300/30 hover:text-cyan-300"><ChevronRight size={12} /></button> : <span className="h-8 w-8" />}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <SourceControl icon={<CircleDollarSign size={15} />} title="Sales evidence" value={`${data.sales.length} records`} detail={money.format(data.revenue)} action="Open sales ledger" onClick={() => navigate(`${basePath}/sales-ledger`)} />
          <SourceControl icon={<ReceiptText size={15} />} title="Expense control" value={`${data.postedExpenses.length} posted`} detail={`${data.expenses.length - data.postedExpenses.length} awaiting posting`} action="Open expenses" onClick={() => navigate(`${basePath}/expenses`)} warn={data.expenses.length > data.postedExpenses.length} />
          <SourceControl icon={<BadgeDollarSign size={15} />} title="Payroll control" value={`${data.payroll.length - data.pendingPayroll.length} posted`} detail={`${data.pendingPayroll.length} excluded until approval`} action="Open payroll" onClick={() => navigate(`${basePath}/payroll`)} warn={data.pendingPayroll.length > 0} />
          <SourceControl icon={<Landmark size={15} />} title="Journal controls" value={`${data.generalLedger.length} lines`} detail="Direct cost, tax, and authorised adjustments" action="Open journals" onClick={() => navigate(`${basePath}/finance-journals`)} />
        </div>
      </div>
    </div>
  );
};

const Signal = ({ icon, label, value, detail, warn = false }: { icon: React.ReactNode; label: string; value: string; detail: string; warn?: boolean }) => <div className="bg-[#090909] px-5 py-4"><div className="flex items-center justify-between"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><span className={warn ? 'text-amber-300' : 'text-vertical-accent'}>{icon}</span></div><div className={`mt-2 text-lg font-medium ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</div><div className="mt-1 text-[9px] text-gray-700">{detail}</div></div>;

const SourceControl = ({ icon, title, value, detail, action, onClick, warn = false }: { icon: React.ReactNode; title: string; value: string; detail: string; action: string; onClick: () => void; warn?: boolean }) => <section className="rounded-xl border border-white/[0.08] bg-[#080808] p-4"><div className="flex items-start justify-between gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${warn ? 'border-amber-400/20 bg-amber-400/[0.05] text-amber-300' : 'border-cyan-300/15 bg-cyan-300/[0.04] text-cyan-300'}`}>{icon}</div><span className="font-mono text-[9px] text-white">{value}</span></div><h3 className="mt-4 text-xs font-medium text-white">{title}</h3><p className="mt-1 text-[9px] leading-4 text-gray-600">{detail}</p><button onClick={onClick} className="mt-4 flex min-h-9 w-full items-center justify-between rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400 hover:border-cyan-300/25 hover:text-cyan-300">{action}<ChevronRight size={12} /></button></section>;
