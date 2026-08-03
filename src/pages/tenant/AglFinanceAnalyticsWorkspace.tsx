import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  CircleDollarSign,
  Landmark,
  Scale,
  ShieldAlert,
  WalletCards,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglErpRepository } from '../../erp/agl/repository';
import { useAglOperatingScope } from '../../context/AglOperatingScopeContext';
import { aglScopeLabel } from '../../erp/agl/operatingScope';

const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('en-GH', { notation: 'compact', maximumFractionDigits: 1 });
const colors = ['#67e8f9', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#60a5fa'];

const amount = (record: AglOperationalRecord) => Number(record.amount ?? 0);
const monthKey = (record: AglOperationalRecord) => {
  const raw = String(record.transactionDate ?? record.expenseDate ?? record.receivedAt ?? record.createdAt ?? '');
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? 'Undated' : date.toLocaleDateString('en-GH', { month: 'short', year: '2-digit' });
};

export const AglFinanceAnalyticsWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const { scope } = useAglOperatingScope();
  const [revision, setRevision] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedSite, setSelectedSite] = useState('');

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const model = useMemo(() => {
    const sales = aglErpRepository.list('sales-ledger');
    const payments = aglErpRepository.list('payments');
    const expenses = aglErpRepository.list('expenses');
    const debtors = aglErpRepository.list('debtors');
    const creditors = aglErpRepository.list('creditors');
    const stock = aglErpRepository.list('stock-ledger');
    const profitLoss = aglErpRepository.list('profit-loss');
    const revenue = sales.reduce((sum, record) => sum + amount(record), 0);
    const operatingExpense = expenses.reduce((sum, record) => sum + amount(record), 0);
    const postedCostOfSales = profitLoss
      .filter((record) => record.category === 'Cost of sales' && record.status === 'Posted')
      .reduce((sum, record) => sum + Math.abs(amount(record)), 0);
    const fallbackCostOfSales = stock.reduce(
      (sum, record) => sum + Number(record.quantity ?? 0) * Number(record.unitCost ?? 0),
      0,
    ) * 0.08;
    const costOfSales = postedCostOfSales || fallbackCostOfSales;
    const grossProfit = revenue - costOfSales;
    const netOperating = grossProfit - operatingExpense;
    const receivables = debtors.reduce((sum, record) => sum + Number(record.outstanding ?? Math.max(0, amount(record) - Number(record.amountPaid ?? 0))), 0);
    const payables = creditors.reduce((sum, record) => sum + Number(record.outstanding ?? Math.max(0, amount(record) - Number(record.amountPaid ?? 0))), 0);
    const collected = payments.reduce((sum, record) => sum + amount(record), 0);

    const months = new Map<string, { month: string; revenue: number; expenses: number; cash: number }>();
    sales.forEach((record) => {
      const month = monthKey(record);
      const row = months.get(month) ?? { month, revenue: 0, expenses: 0, cash: 0 };
      row.revenue += amount(record);
      months.set(month, row);
    });
    expenses.forEach((record) => {
      const month = monthKey(record);
      const row = months.get(month) ?? { month, revenue: 0, expenses: 0, cash: 0 };
      row.expenses += amount(record);
      months.set(month, row);
    });
    payments.forEach((record) => {
      const month = monthKey(record);
      const row = months.get(month) ?? { month, revenue: 0, expenses: 0, cash: 0 };
      row.cash += amount(record);
      months.set(month, row);
    });

    const channels = new Map<string, number>();
    sales.forEach((record) => {
      const key = String(record.saleType ?? record.channel ?? 'Unclassified');
      channels.set(key, (channels.get(key) ?? 0) + amount(record));
    });

    const sites = new Map<string, { site: string; revenue: number; expenses: number; transactions: number }>();
    sales.forEach((record) => {
      const site = String(record.siteName ?? 'Unassigned');
      const row = sites.get(site) ?? { site, revenue: 0, expenses: 0, transactions: 0 };
      row.revenue += amount(record);
      row.transactions += 1;
      sites.set(site, row);
    });
    expenses.forEach((record) => {
      const site = String(record.siteName ?? 'Unassigned');
      const row = sites.get(site) ?? { site, revenue: 0, expenses: 0, transactions: 0 };
      row.expenses += amount(record);
      sites.set(site, row);
    });

    const ageing = [
      { band: 'Current', value: 0 },
      { band: '1–30 days', value: 0 },
      { band: '31–60 days', value: 0 },
      { band: '61–90 days', value: 0 },
      { band: '90+ days', value: 0 },
    ];
    debtors.forEach((record) => {
      const due = new Date(String(record.dueDate ?? record.createdAt));
      const days = Math.floor((Date.now() - due.getTime()) / 86400000);
      const outstanding = Number(record.outstanding ?? Math.max(0, amount(record) - Number(record.amountPaid ?? 0)));
      const index = days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
      ageing[index].value += outstanding;
    });

    return {
      sales,
      expenses,
      debtors,
      revenue,
      operatingExpense,
      costOfSales,
      grossProfit,
      netOperating,
      receivables,
      payables,
      collected,
      grossMargin: revenue ? grossProfit / revenue * 100 : 0,
      collectionRate: revenue ? collected / revenue * 100 : 0,
      trend: [...months.values()].sort((left, right) => new Date(`1 ${left.month}`).getTime() - new Date(`1 ${right.month}`).getTime()),
      channelMix: [...channels].map(([name, value]) => ({ name, value })),
      siteComparison: [...sites.values()].sort((left, right) => right.revenue - left.revenue),
      ageing,
    };
  }, [revision, scope]);

  const evidence = model.sales.filter((record) => (
    (!selectedChannel || String(record.saleType ?? record.channel ?? 'Unclassified') === selectedChannel)
    && (!selectedSite || String(record.siteName ?? 'Unassigned') === selectedSite)
  ));

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{tenant.id.toUpperCase()} ANALYTICS / FINANCE</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">Financial performance & control</h1>
          <p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">Profitability, cash conversion, working capital, revenue composition, and branch contribution derived from the scoped operating ledgers.</p>
        </div>
        <div className="rounded-lg border border-cyan-300/10 bg-cyan-300/[0.035] px-4 py-3 text-right">
          <div className="font-mono text-[7px] uppercase tracking-wider text-cyan-300/60">Analytical population</div>
          <div className="mt-1 max-w-lg text-[9px] text-cyan-50/70">{aglScopeLabel(scope)}</div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi icon={<CircleDollarSign size={14} />} label="Revenue" value={money.format(model.revenue)} detail={`${model.sales.length} source transactions`} />
        <Kpi icon={<Scale size={14} />} label="Gross margin" value={`${model.grossMargin.toFixed(1)}%`} detail={`${money.format(model.grossProfit)} gross profit`} />
        <Kpi icon={<Landmark size={14} />} label="Net operating result" value={money.format(model.netOperating)} detail={`${money.format(model.operatingExpense)} operating expense`} warning={model.netOperating < 0} />
        <Kpi icon={<WalletCards size={14} />} label="Collection rate" value={`${model.collectionRate.toFixed(1)}%`} detail={`${money.format(model.collected)} collected`} warning={model.collectionRate < 85} />
        <Kpi icon={<Banknote size={14} />} label="Receivables" value={money.format(model.receivables)} detail="Customer working capital" warning={model.receivables > model.revenue * 0.25} />
        <Kpi icon={<ShieldAlert size={14} />} label="Payables" value={money.format(model.payables)} detail="Supplier obligations" warning={model.payables > model.receivables} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <ChartPanel title="Revenue, cash and operating expense trend" subtitle="Area = earned revenue; lines compare cash realization and expense load.">
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={model.trend}>
              <defs><linearGradient id="financeRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#67e8f9" stopOpacity={0.35} /><stop offset="95%" stopColor="#67e8f9" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(value) => compact.format(value)} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => money.format(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 9, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="revenue" stroke="#67e8f9" fill="url(#financeRevenue)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="cash" stroke="#34d399" fill="transparent" strokeWidth={2} name="Cash collected" />
              <Area type="monotone" dataKey="expenses" stroke="#fb7185" fill="transparent" strokeWidth={2} name="Operating expense" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Revenue composition" subtitle="Click a segment to constrain the evidence ledger below.">
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie data={model.channelMix} dataKey="value" nameKey="name" innerRadius={68} outerRadius={104} paddingAngle={3} onClick={(entry) => setSelectedChannel(String(entry.name))}>
                {model.channelMix.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} opacity={!selectedChannel || selectedChannel === entry.name ? 1 : 0.25} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => money.format(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 9, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <ChartPanel title="Branch/site contribution" subtitle="Grouped columns compare revenue earned with expenses controlled in the same operating site.">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={model.siteComparison}>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis dataKey="site" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(value) => compact.format(value)} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => money.format(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 9, color: '#94a3b8' }} />
              <Bar dataKey="revenue" fill="#67e8f9" radius={[4, 4, 0, 0]} name="Revenue" onClick={(entry) => setSelectedSite(String((entry as { site?: string }).site ?? ''))} />
              <Bar dataKey="expenses" fill="#fb7185" radius={[4, 4, 0, 0]} name="Expense" onClick={(entry) => setSelectedSite(String((entry as { site?: string }).site ?? ''))} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Receivables ageing" subtitle="Horizontal bars expose collection risk by overdue band.">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={model.ageing} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="rgba(255,255,255,.05)" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => compact.format(value)} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="band" width={80} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => money.format(Number(value))} />
              <Bar dataKey="value" fill="#fbbf24" radius={[0, 4, 4, 0]} name="Outstanding" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909]">
        <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-sm text-white">Contributing sales evidence</h2><p className="mt-1 text-[9px] text-gray-600">{evidence.length} records explain the selected chart segment{selectedChannel ? ` · ${selectedChannel}` : ''}{selectedSite ? ` · ${selectedSite}` : ''}.</p></div>
          <div className="flex gap-2">{(selectedChannel || selectedSite) && <button onClick={() => { setSelectedChannel(''); setSelectedSite(''); }} className="rounded-lg border border-white/[0.08] px-3 py-2 text-[9px] text-gray-400">Clear chart drill</button>}<button onClick={() => navigate(`/${tenant.verticalId}/tenant/${tenant.id}/erp/sales-ledger`)} className="flex items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-[9px] font-semibold text-black">Open operating evidence <ArrowRight size={12} /></button></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-[10px]"><thead className="border-b border-white/[0.07] font-mono text-[8px] uppercase tracking-wider text-gray-600"><tr>{['Date', 'Receipt / job', 'Branch / site', 'Customer', 'Vehicle / sale', 'Owner', 'Amount', 'State'].map((head) => <th key={head} className="px-4 py-3 font-normal">{head}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.06]">{evidence.map((record) => <tr key={record.id} className="text-gray-300 hover:bg-white/[0.025]"><td className="px-4 py-4">{String(record.createdAt).slice(0, 10)}</td><td className="px-4 py-4 font-mono text-[9px] text-cyan-300">{String(record.receiptNumber ?? record.reference ?? record.id)}</td><td className="px-4 py-4">{String(record.branchName ?? '—')}<div className="mt-1 text-[8px] text-gray-600">{String(record.siteName ?? '—')}</div></td><td className="px-4 py-4 text-white">{String(record.customer ?? '—')}</td><td className="px-4 py-4">{String(record.vehicle ?? record.item ?? record.name ?? '—')}</td><td className="px-4 py-4">{String(record.salesRep ?? record.owner ?? '—')}</td><td className="px-4 py-4 font-mono text-white">{money.format(amount(record))}</td><td className="px-4 py-4">{String(record.status)}</td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  );
};

const Kpi = ({ icon, label, value, detail, warning = false }: { icon: React.ReactNode; label: string; value: string; detail: string; warning?: boolean }) => (
  <article className={`rounded-xl border bg-[#090909] p-4 ${warning ? 'border-amber-300/20' : 'border-white/[0.08]'}`}><div className={`flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider ${warning ? 'text-amber-200' : 'text-cyan-300'}`}>{icon}{label}</div><div className="mt-3 text-xl text-white">{value}</div><p className="mt-1 text-[9px] text-gray-600">{detail}</p></article>
);

const ChartPanel = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="mb-4"><h2 className="text-sm text-white">{title}</h2><p className="mt-1 text-[9px] text-gray-600">{subtitle}</p></div>{children}</article>
);

const tooltipStyle = {
  background: '#0a0a0a',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 10,
};
