import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  AreaChart as AreaChartIcon,
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  ChevronRight,
  CircleGauge,
  CreditCard,
  Database,
  FileSearch,
  Filter,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  WalletCards,
  Wrench,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Tenant } from '../../types';
import {
  AGL_REPORT_SUBJECTS,
  aglReportingWorkflow,
  defaultAglReportConfig,
  type AglReportConfig,
  type AglReportFormat,
  type AglReportMeasure,
  type AglReportResult,
  type AglReportRow,
} from '../../erp/agl/reportingWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';
import {
  AGL_ANALYTICS_SETTINGS_EVENT,
  DEFAULT_AGL_ANALYTICS_SETTINGS,
  readAglAnalyticsSettings,
  resetAglAnalyticsSettings,
  saveAglAnalyticsSettings,
  type AglAnalyticsSettings,
} from '../../erp/agl/analyticsSettings';
import { GlassPanel } from '../../components/ui/GlassPanel';

type AnalyticsModule =
  | 'overview'
  | 'fixbot'
  | 'workshop'
  | 'vehicles'
  | 'crm'
  | 'inventory'
  | 'sales'
  | 'blkk-ops'
  | 'finance'
  | 'hr'
  | 'marketing'
  | 'reports'
  | 'settings'
  | string;

interface AnalyticsPreset {
  title: string;
  eyebrow: string;
  question: string;
  decision: string;
  subjectId: string;
  groupBy: string;
  primaryMeasure: string;
  metricKeys: string[];
}

const presets: Record<string, AnalyticsPreset> = {
  overview: {
    title: 'AGL performance command',
    eyebrow: 'Tenant analytics / all departments',
    question: 'What is happening in AGL, what is driving it, and where should management intervene?',
    decision: 'Move from the summary into the exact product, employee, job, stock item, customer, or audit record responsible.',
    subjectId: 'sales-activity',
    groupBy: 'item',
    primaryMeasure: 'revenue',
    metricKeys: ['revenue', 'salesCount', 'averageSale', 'units'],
  },
  fixbot: {
    title: 'FixBot diagnostic intelligence',
    eyebrow: 'Workshop / diagnostic flow',
    question: 'Where is diagnostic work accumulating and which mechanics, vehicles, or promises explain it?',
    decision: 'Reassign work, resolve missing parts, protect promises, or open the contributing job cards.',
    subjectId: 'workshop-flow',
    groupBy: 'status',
    primaryMeasure: 'jobCount',
    metricKeys: ['jobCount', 'approvedValue', 'completionRate', 'promiseRisk'],
  },
  workshop: {
    title: 'Workshop performance',
    eyebrow: 'Service operations / flow',
    question: 'How much work is moving, where is it constrained, and who owns the jobs at risk?',
    decision: 'Rebalance bays and mechanics, clear promise risk, and inspect the source job cards.',
    subjectId: 'workshop-flow',
    groupBy: 'status',
    primaryMeasure: 'jobCount',
    metricKeys: ['jobCount', 'approvedValue', 'averageJobValue', 'promiseRisk'],
  },
  vehicles: {
    title: 'Vehicle and fleet intelligence',
    eyebrow: 'Workshop / vehicle demand',
    question: 'Which vehicles and customers are creating workshop demand, approved value, and delivery risk?',
    decision: 'Prioritize vehicle work, identify repeat demand, and inspect the linked work order.',
    subjectId: 'workshop-flow',
    groupBy: 'vehicle',
    primaryMeasure: 'approvedValue',
    metricKeys: ['jobCount', 'approvedValue', 'averageJobValue', 'promiseRisk'],
  },
  crm: {
    title: 'Customer and CRM intelligence',
    eyebrow: 'Customers / commercial relationship',
    question: 'Which customer segments and acquisition sources create activity and sales value?',
    decision: 'Protect valuable relationships, recover inactive accounts, and inspect customer evidence.',
    subjectId: 'customer-base',
    groupBy: 'customerType',
    primaryMeasure: 'salesValue',
    metricKeys: ['customerCount', 'salesCount', 'salesValue', 'vehicles'],
  },
  inventory: {
    title: 'Inventory and parts intelligence',
    eyebrow: 'Stock / working capital',
    question: 'What stock value is available, reserved, constrained, or concentrated in specific parts and locations?',
    decision: 'Replenish, transfer, release reservations, or inspect the source stock position.',
    subjectId: 'inventory-position',
    groupBy: 'status',
    primaryMeasure: 'stockValue',
    metricKeys: ['stockValue', 'skuCount', 'unitsOnHand', 'unitsAvailable'],
  },
  sales: {
    title: 'Sales and product intelligence',
    eyebrow: 'Commerce / revenue',
    question: 'What is AGL’s best seller, who sold it, through which channel, and at what value?',
    decision: 'Back winning products and channels, coach sales ownership, and inspect each transaction.',
    subjectId: 'sales-activity',
    groupBy: 'item',
    primaryMeasure: 'revenue',
    metricKeys: ['revenue', 'salesCount', 'averageSale', 'units'],
  },
  'blkk-ops': {
    title: 'BLKK control activity',
    eyebrow: 'Governance / accountable access',
    question: 'Who performed controlled work inside AGL and which modules and records changed?',
    decision: 'Investigate anomalies, prove accountability, and drill to the exact audit event.',
    subjectId: 'audit-activity',
    groupBy: 'action',
    primaryMeasure: 'eventCount',
    metricKeys: ['eventCount', 'actors', 'records', 'approvals'],
  },
  hr: {
    title: 'People and performance intelligence',
    eyebrow: 'HR / quality-adjusted contribution',
    question: 'Who is performing, what work supports that conclusion, and where are attendance or capacity gaps?',
    decision: 'Recognize contribution, rebalance work, coach gaps, and inspect the employee’s source records.',
    subjectId: 'employee-performance',
    groupBy: 'name',
    primaryMeasure: 'approvedJobValue',
    metricKeys: ['employeeCount', 'jobsCompleted', 'approvedJobValue', 'attendanceHours'],
  },
  marketing: {
    title: 'Marketing and acquisition intelligence',
    eyebrow: 'Growth / customer acquisition',
    question: 'Which acquisition sources create customers, transactions, vehicles, and sales value?',
    decision: 'Reallocate effort toward productive acquisition sources and inspect the customer population behind them.',
    subjectId: 'customer-base',
    groupBy: 'acquisitionChannel',
    primaryMeasure: 'salesValue',
    metricKeys: ['customerCount', 'salesCount', 'salesValue', 'vehicles'],
  },
  reports: {
    title: 'Report and audit intelligence',
    eyebrow: 'Evidence / governance',
    question: 'What governed activity exists, who created it, and can every claim be traced to a source record?',
    decision: 'Open audit populations, verify approvals, and move to ERP Reports to freeze and sign a defined report.',
    subjectId: 'audit-activity',
    groupBy: 'moduleId',
    primaryMeasure: 'eventCount',
    metricKeys: ['eventCount', 'actors', 'records', 'approvals'],
  },
};

const colors = ['#22d3ee', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#60a5fa', '#f97316'];
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-GH', { maximumFractionDigits: 1 });

export const AglAnalyticsWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: AnalyticsModule }) => {
  if (moduleId === 'settings') return <AglAnalyticsSettingsWorkspace tenant={tenant} />;
  if (moduleId === 'overview') return <AglExecutiveCommandDashboard tenant={tenant} />;
  return <AglDecisionAnalytics tenant={tenant} moduleId={moduleId} />;
};

const AglExecutiveCommandDashboard = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const command = useMemo(() => {
    const sales = aglReportingWorkflow.buildReport({
      ...defaultAglReportConfig('sales-activity'),
      groupBy: 'item',
      primaryMeasure: 'revenue',
    });
    const salesByChannel = aglReportingWorkflow.buildReport({
      ...defaultAglReportConfig('sales-activity'),
      groupBy: 'channel',
      primaryMeasure: 'revenue',
    });
    const paymentMix = aglReportingWorkflow.buildReport({
      ...defaultAglReportConfig('sales-activity'),
      groupBy: 'paymentMethod',
      primaryMeasure: 'revenue',
    });
    const expenses = aglReportingWorkflow.buildReport({
      ...defaultAglReportConfig('expense-control'),
      groupBy: 'name',
      primaryMeasure: 'spend',
    });
    const workshop = aglReportingWorkflow.buildReport({
      ...defaultAglReportConfig('workshop-flow'),
      groupBy: 'status',
      primaryMeasure: 'jobCount',
    });
    const mechanics = aglReportingWorkflow.buildReport({
      ...defaultAglReportConfig('employee-performance'),
      groupBy: 'name',
      primaryMeasure: 'approvedJobValue',
    });
    const inventory = aglReportingWorkflow.buildReport({
      ...defaultAglReportConfig('inventory-position'),
      groupBy: 'name',
      primaryMeasure: 'stockValue',
    });
    const customers = aglReportingWorkflow.buildReport({
      ...defaultAglReportConfig('customer-base'),
      groupBy: 'name',
      primaryMeasure: 'salesValue',
    });
    const revenue = measureOf(sales, 'revenue');
    const spend = measureOf(expenses, 'spend');
    const lowStock = inventory.rows.filter((row) => (
      ['Low stock', 'Stockout', 'Quarantined'].includes(String(row.status))
      || Number(row.available ?? 0) <= 3
    ));
    const activeJobs = workshop.rows.filter((row) => !['Closed', 'Ready'].includes(String(row.status)));
    const upcoming = [...aglErpRepository.list('appointments'), ...aglErpRepository.list('work-orders')]
      .filter((row) => !['Closed', 'Cancelled'].includes(String(row.status)))
      .sort((a, b) => String(a.date ?? a.promise ?? '').localeCompare(String(b.date ?? b.promise ?? '')))
      .slice(0, 5);
    return {
      sales,
      salesByChannel,
      paymentMix,
      expenses,
      workshop,
      mechanics,
      inventory,
      customers,
      revenue,
      spend,
      operatingContribution: revenue - spend,
      activeJobs,
      lowStock,
      upcoming,
      recentAudit: aglErpRepository.audit().slice(0, 5),
      trend: buildTrend(sales.rows, sales.primaryMeasure),
    };
  }, [revision]);

  const headline = [
    { label: 'Revenue', value: money.format(command.revenue), detail: `${command.sales.rowCount} transactions`, Icon: WalletCards, route: 'sales' },
    { label: 'Operating contribution', value: money.format(command.operatingContribution), detail: `${money.format(command.spend)} controlled spend`, Icon: CircleGauge, route: 'finance' },
    { label: 'Customers', value: number.format(command.customers.rowCount), detail: `${command.customers.groups.filter((group) => group.value > 0).length} revenue-producing`, Icon: Users, route: 'crm' },
    { label: 'Active workshop work', value: number.format(command.activeJobs.length), detail: `${measureOf(command.workshop, 'promiseRisk')} beyond promise`, Icon: Wrench, route: 'workshop' },
    { label: 'Inventory value', value: money.format(measureOf(command.inventory, 'stockValue')), detail: `${command.lowStock.length} positions need attention`, Icon: Boxes, route: 'inventory' },
    { label: 'Average transaction', value: money.format(measureOf(command.sales, 'averageSale')), detail: `${command.salesByChannel.groups.length} active channels`, Icon: CreditCard, route: 'sales' },
  ];

  const go = (module: string) => navigate(`/autos/tenant/agl/analytics/${module}`);

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><Activity size={13} /> {tenant.name} / executive operating brief</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">AGL analytics command</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-300">One governed view of sales, customers, workshop flow, inventory, finance, people, and current exceptions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['Sales', 'sales'],
            ['Workshop', 'workshop'],
            ['People', 'hr'],
            ['Finance', 'finance'],
            ['Inventory', 'inventory'],
          ].map(([label, module]) => (
            <button key={module} onClick={() => go(module)} className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[9px] text-gray-300 transition hover:border-cyan-300/25 hover:text-cyan-200">{label}</button>
          ))}
        </div>
      </header>

      <section aria-label="AGL headline performance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {headline.map(({ label, value, detail, Icon, route }) => (
          <button key={label} onClick={() => go(route)} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/[0.035]">
            <div className="flex items-center justify-between gap-3"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-500">{label}</span><Icon size={14} className="text-cyan-300" /></div>
            <div className="mt-3 text-xl font-semibold text-white">{value}</div>
            <div className="mt-1 text-[9px] text-gray-600">{detail}</div>
          </button>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="rounded-xl p-5">
          <DashboardHeading icon={AreaChartIcon} title="Revenue movement" detail={`${money.format(command.revenue)} across the active operating scope`} action="Open sales" onAction={() => go('sales')} />
          <div className="mt-4 h-64">
            {command.trend.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={command.trend}>
                  <defs><linearGradient id="agl-command-revenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="#ffffff0b" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#667085', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#667085', fontSize: 9 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => money.format(Number(value))} />
                  <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#agl-command-revenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyVisual message="Choose a wider period in Operating Scope to compare revenue movement." />}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <DashboardHeading icon={BarChart3} title="Sales by channel" detail={`${command.salesByChannel.groups.length} channels contributing revenue`} action="Compare channels" onAction={() => go('sales')} />
          <CompactRankedList groups={command.salesByChannel.groups} format="money" color="#34d399" onOpen={() => go('sales')} />
        </GlassPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="rounded-xl p-5">
          <DashboardHeading icon={Trophy} title="Best-selling products and services" detail={`${command.sales.groups.length} distinct commercial lines`} action="Product analytics" onAction={() => go('sales')} />
          <div className="mt-4 grid gap-2">
            {command.sales.groups.slice(0, 10).map((group, index) => {
              const sourceRows = command.sales.rows.filter((row) => String(row.item ?? '') === group.label);
              const units = sourceRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
              const max = Math.max(Math.abs(command.sales.groups[0]?.value ?? 1), 1);
              return (
                <button key={group.label} onClick={() => go('sales')} className="rounded-lg px-2 py-2 text-left hover:bg-white/[0.025]">
                  <div className="flex items-center justify-between gap-4"><span className="truncate text-[10px] text-gray-200"><span className="mr-2 font-mono text-[8px] text-cyan-300">{String(index + 1).padStart(2, '0')}</span>{group.label}</span><span className="whitespace-nowrap font-mono text-[9px] text-white">{money.format(group.value)} <span className="text-gray-600">· {units} units · {group.count} sales</span></span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-cyan-300/80" style={{ width: `${Math.max(3, (Math.abs(group.value) / max) * 100)}%` }} /></div>
                </button>
              );
            })}
          </div>
        </GlassPanel>

        <div className="grid gap-5">
          <GlassPanel className="rounded-xl p-5">
            <DashboardHeading icon={CreditCard} title="Payment method mix" detail="Revenue by tender" action="Payment evidence" onAction={() => go('sales')} />
            <MixBar groups={command.paymentMix.groups} />
          </GlassPanel>
          <GlassPanel className="rounded-xl p-5">
            <DashboardHeading icon={CircleGauge} title="Expense breakdown" detail={`${money.format(command.spend)} in controlled operating spend`} action="Finance analytics" onAction={() => go('finance')} />
            <CompactRankedList groups={command.expenses.groups} format="money" color="#fb7185" onOpen={() => go('finance')} limit={6} />
          </GlassPanel>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel className="rounded-xl p-5">
          <DashboardHeading icon={Wrench} title="Workshop and people pulse" detail="Work stage pressure and quality-adjusted contribution" action="Open workshop" onAction={() => go('workshop')} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Jobs by stage</div>
              <CompactRankedList groups={command.workshop.groups} format="number" color="#a78bfa" onOpen={() => go('workshop')} limit={5} />
            </div>
            <div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Top staff contribution</div>
              <CompactRankedList groups={command.mechanics.groups} format="money" color="#fbbf24" onOpen={() => go('hr')} limit={5} />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <DashboardHeading icon={CalendarDays} title="Upcoming and active work" detail="The next promises requiring operating attention" action="Workshop drill" onAction={() => go('workshop')} />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-[9px]">
              <thead className="font-mono uppercase tracking-wider text-gray-600"><tr><th className="pb-3 font-normal">Vehicle</th><th className="pb-3 font-normal">Customer</th><th className="pb-3 font-normal">Service / concern</th><th className="pb-3 font-normal">Promise</th><th className="pb-3 font-normal">State</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {command.upcoming.map((row) => (
                  <tr key={row.id} className="cursor-pointer text-gray-300 hover:bg-white/[0.025]" onClick={() => go('workshop')}>
                    <td className="py-3 pr-3 text-white">{String(row.vehicle ?? 'Not recorded')}</td>
                    <td className="py-3 pr-3">{String(row.customer ?? 'Not recorded')}</td>
                    <td className="max-w-64 truncate py-3 pr-3">{String(row.service ?? row.concern ?? 'Not recorded')}</td>
                    <td className="py-3 pr-3">{formatCell(String(row.date ?? row.promise ?? ''), 'date')}</td>
                    <td className="py-3"><span className="rounded border border-cyan-300/15 bg-cyan-300/[0.04] px-2 py-1 text-cyan-200">{row.status}</span></td>
                  </tr>
                ))}
                {!command.upcoming.length && <tr><td colSpan={5} className="py-10 text-center text-gray-600">No upcoming or active work in this scope.</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </section>

      {command.lowStock.length > 0 && (
        <button onClick={() => go('inventory')} className="flex w-full flex-col gap-4 rounded-xl border border-rose-400/25 bg-rose-400/[0.055] p-5 text-left sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-400/12 text-rose-300"><AlertTriangle size={20} /></span><span><span className="font-mono text-[8px] uppercase tracking-[0.2em] text-rose-300">Inventory action required</span><span className="mt-2 block text-sm font-semibold text-white">{command.lowStock.length} stock positions are constrained</span><span className="mt-1 block text-[10px] text-gray-500">{command.lowStock.slice(0, 3).map((row) => row.name).join(', ')}. Replenish, transfer, or release reservations before the next service promise.</span></span></span>
          <span className="flex items-center gap-2 text-[9px] text-rose-200">Open inventory <ChevronRight size={13} /></span>
        </button>
      )}

      <GlassPanel className="rounded-xl p-5">
        <DashboardHeading icon={Database} title="Recent governed activity" detail="The latest accountable ERP events in the selected scope" action="Open audit analytics" onAction={() => go('blkk-ops')} />
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {command.recentAudit.map((event) => (
            <button key={event.id} onClick={() => go('blkk-ops')} className="rounded-lg border border-white/[0.07] bg-black/20 p-3 text-left hover:border-cyan-300/20">
              <div className="flex items-center justify-between gap-2"><span className="font-mono text-[7px] uppercase text-cyan-300">{event.action} · {event.moduleId}</span><ChevronRight size={11} className="text-gray-700" /></div>
              <div className="mt-2 line-clamp-2 text-[10px] leading-5 text-gray-300">{event.summary}</div>
              <div className="mt-2 text-[8px] text-gray-600">{event.actorName} · {new Date(event.occurredAt).toLocaleString('en-GH')}</div>
            </button>
          ))}
          {!command.recentAudit.length && <div className="text-[10px] text-gray-600">No governed activity in this scope.</div>}
        </div>
      </GlassPanel>
    </div>
  );
};

const AglDecisionAnalytics = ({ tenant, moduleId }: { tenant: Tenant; moduleId: AnalyticsModule }) => {
  const preset = presets[moduleId] ?? presets.overview;
  const [revision, setRevision] = useState(0);
  const [config, setConfig] = useState<AglReportConfig>(() => presetConfig(preset));
  const [query, setQuery] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showEvidence, setShowEvidence] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AglReportRow | null>(null);
  const [settings, setSettings] = useState(readAglAnalyticsSettings);

  useEffect(() => {
    setConfig(presetConfig(preset));
    setQuery('');
    setFilterField('');
    setFilterValue('');
    setSelectedGroup('');
    setShowEvidence(false);
    setSelectedRow(null);
  }, [moduleId, preset]);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    const refreshSettings = () => setSettings(readAglAnalyticsSettings());
    window.addEventListener('agl-erp-change', refresh);
    window.addEventListener(AGL_ANALYTICS_SETTINGS_EVENT, refreshSettings);
    return () => {
      window.removeEventListener('agl-erp-change', refresh);
      window.removeEventListener(AGL_ANALYTICS_SETTINGS_EVENT, refreshSettings);
    };
  }, []);

  const subject = AGL_REPORT_SUBJECTS.find((candidate) => candidate.id === config.subjectId) ?? AGL_REPORT_SUBJECTS[0];
  const effectiveConfig = useMemo(() => ({
    ...config,
    search: query,
    filterFieldA: filterField,
    filterValueA: filterValue,
  }), [config, filterField, filterValue, query]);
  const result = useMemo(() => aglReportingWorkflow.buildReport(effectiveConfig), [effectiveConfig, revision]);
  const options = filterField
    ? [...new Set(result.rows.map((row) => String(row[filterField] ?? '')).filter(Boolean))].sort()
    : [];
  const evidenceRows = selectedGroup
    ? result.rows.filter((row) => (String(row[result.groupBy.key] ?? '').trim() || '(Not recorded)') === selectedGroup)
    : result.rows;
  const top = result.groups[0];
  const totalPrimary = result.groups.reduce((sum, group) => sum + group.value, 0);
  const concentration = top && totalPrimary ? Math.abs((top.value / totalPrimary) * 100) : 0;
  const trend = buildTrend(result.rows, result.primaryMeasure);

  const patchConfig = (patch: Partial<AglReportConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
    setSelectedGroup('');
    setShowEvidence(false);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><Activity size={13} /> {tenant.name} / {preset.eyebrow}</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">{preset.title}</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-300">{preset.question}</p>
          <p className="mt-1 max-w-4xl text-[10px] leading-5 text-gray-600">{preset.decision}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.04] px-3 py-2 font-mono text-[8px] uppercase tracking-wider text-cyan-200">{result.rowCount} governed records</span>
          <span className="rounded-lg border border-white/[0.08] px-3 py-2 font-mono text-[8px] uppercase tracking-wider text-gray-500">{result.sourceModules.join(' + ')}</span>
        </div>
      </header>

      {moduleId === 'overview' && <ExecutiveHighlights revision={revision} />}

      <section aria-label="Key performance indicators" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {result.metrics.map((metric, index) => {
          const target = targetForMetric(metric.key, settings);
          const Icon = [CircleGauge, Target, Trophy, ShieldCheck][index % 4];
          return (
            <GlassPanel key={metric.key} className="rounded-xl p-4">
              <div className="flex items-center justify-between gap-3"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-500">{metric.label}</span><Icon size={14} className="text-cyan-300" /></div>
              <div className="mt-3 text-2xl font-semibold text-white">{formatValue(metric.value, metric.format)}</div>
              <div className="mt-1 text-[9px] text-gray-600">{settings.showTargets && target ? `Configured target: ${target}` : `${result.rowCount} source records in scope`}</div>
            </GlassPanel>
          );
        })}
      </section>

      <GlassPanel className="rounded-xl p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-white"><Filter size={14} className="text-cyan-300" /> Ask a narrower question</div>
            <p className="mt-1 text-[9px] text-gray-600">Operating Scope controls country, branch, site, and period. These controls choose the analytical measure and population within it.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <ControlSelect label="Measure" value={config.primaryMeasure} onChange={(value) => patchConfig({ primaryMeasure: value })} options={subject.measures.map((item) => ({ value: item.key, label: item.label }))} />
            <ControlSelect label="Compare by" value={config.groupBy} onChange={(value) => patchConfig({ groupBy: value })} options={subject.dimensions.map((item) => ({ value: item.key, label: item.label }))} />
            <ControlSelect label="Filter field" value={filterField} onChange={(value) => { setFilterField(value); setFilterValue(''); }} options={[{ value: '', label: 'No filter' }, ...subject.dimensions.map((item) => ({ value: item.key, label: item.label }))]} />
            <ControlSelect label="Filter value" value={filterValue} onChange={setFilterValue} disabled={!filterField} options={[{ value: '', label: 'All values' }, ...options.map((value) => ({ value, label: value }))]} />
            <label className="block"><span className="font-mono text-[7px] uppercase tracking-wider text-gray-600">Search evidence</span><div className="relative mt-1"><Search size={12} className="absolute left-2.5 top-2.5 text-gray-700" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, ID, vehicle..." className="h-8 w-full rounded-md border border-white/[0.08] bg-black/30 pl-8 pr-2 text-[9px] text-white" /></div></label>
          </div>
        </div>
      </GlassPanel>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassPanel className="rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="flex items-center gap-2 text-sm text-white"><BarChart3 size={15} className="text-cyan-300" /> {result.primaryMeasure.label} by {result.groupBy.label}</h2><p className="mt-1 text-[9px] text-gray-600">Select any bar to expose its contributing ERP records.</p></div>
            {selectedGroup && <button onClick={() => { setSelectedGroup(''); setShowEvidence(false); }} className="rounded border border-white/[0.08] px-2 py-1 text-[8px] text-gray-500"><X size={10} className="mr-1 inline" /> Clear drill</button>}
          </div>
          <RankedBars result={result} selected={selectedGroup} onSelect={(label) => { setSelectedGroup(label); setShowEvidence(true); }} />
        </GlassPanel>

        <div className="grid gap-5">
          <GlassPanel className="rounded-xl p-5">
            <div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-sm text-white"><PieChartIcon size={15} className="text-cyan-300" /> Mix and concentration</h2><p className="mt-1 text-[9px] text-gray-600">Share of the selected primary measure.</p></div>{top && <div className="text-right"><div className="font-mono text-[8px] uppercase text-gray-600">Leader share</div><div className="mt-1 text-lg text-white">{number.format(concentration)}%</div></div>}</div>
            <div className="mt-3 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={result.groups.slice(0, 7)} dataKey="value" nameKey="label" innerRadius={48} outerRadius={78} paddingAngle={2}>
                    {result.groups.slice(0, 7).map((group, index) => <Cell key={group.label} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatValue(Number(value), result.primaryMeasure.format)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {top && <button onClick={() => { setSelectedGroup(top.label); setShowEvidence(true); }} className="flex w-full items-center justify-between rounded-lg border border-cyan-300/12 bg-cyan-300/[0.035] px-3 py-3 text-left"><span><span className="block font-mono text-[7px] uppercase text-cyan-300">Top result</span><span className="mt-1 block text-[10px] text-white">{top.label}</span></span><span className="font-mono text-[10px] text-cyan-100">{formatValue(top.value, result.primaryMeasure.format)}</span></button>}
          </GlassPanel>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.55fr]">
        <GlassPanel className="rounded-xl p-5">
          <div><h2 className="flex items-center gap-2 text-sm text-white"><AreaChartIcon size={15} className="text-cyan-300" /> Period movement</h2><p className="mt-1 text-[9px] text-gray-600">{result.primaryMeasure.label} across dated source records in the active period.</p></div>
          <div className="mt-4 h-64">
            {trend.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs><linearGradient id={`agl-trend-${moduleId}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="#ffffff0b" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#667085', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#667085', fontSize: 9 }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatValue(Number(value), result.primaryMeasure.format)} />
                  <Area type="monotone" dataKey="value" stroke="#22d3ee" fill={`url(#agl-trend-${moduleId})`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyVisual message="Select a wider period in Operating Scope to compare movement over time." />}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <h2 className="flex items-center gap-2 text-sm text-white"><FileSearch size={15} className="text-cyan-300" /> What this view proves</h2>
          <div className="mt-4 space-y-3">
            <InsightLine label="Population" value={`${result.rowCount} records from ${result.sourceModules.join(', ')}`} />
            <InsightLine label="Calculation" value={result.methodology} />
            <InsightLine label="Leading result" value={top ? `${top.label} · ${formatValue(top.value, result.primaryMeasure.format)}` : 'No evidence in scope'} />
            <InsightLine label="Drill path" value={`${result.groupBy.label} → source module → record ID → ERP evidence`} />
          </div>
          <button onClick={() => setShowEvidence(true)} className="mt-5 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] text-[9px] text-cyan-200"><Database size={13} /> Open source evidence</button>
        </GlassPanel>
      </section>

      {showEvidence && (
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-sm text-white">Evidence drill {selectedGroup ? `· ${selectedGroup}` : ''}</h2><p className="mt-1 text-[9px] text-gray-600">{evidenceRows.length} records generate this result. Select one to inspect all retained fields.</p></div>
            <button onClick={() => setShowEvidence(false)} className="flex h-8 w-8 items-center justify-center rounded border border-white/[0.08] text-gray-500"><X size={13} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-[9px]">
              <thead className="bg-black/30 font-mono uppercase tracking-wider text-gray-600"><tr>{result.columns.map((column) => <th key={column.key} className="px-4 py-3 font-normal">{column.label}</th>)}<th className="w-10 px-3 py-3" /></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">{evidenceRows.slice(0, settings.evidencePreviewLimit).map((row) => <tr key={`${row.sourceModule}-${row.sourceId}`} className="hover:bg-white/[0.025]">{result.columns.map((column) => <td key={column.key} className="max-w-64 px-4 py-3 text-gray-300">{formatCell(row[column.key], column.format)}</td>)}<td className="px-3"><button onClick={() => setSelectedRow(row)} title={`Inspect ${row.sourceId}`}><ArrowRight size={12} className="text-cyan-300" /></button></td></tr>)}</tbody>
            </table>
          </div>
          {evidenceRows.length > settings.evidencePreviewLimit && <div className="border-t border-white/[0.06] px-5 py-3 text-[9px] text-gray-600">Showing the configured preview limit of {settings.evidencePreviewLimit}. Narrow the population or use ERP Reports to export it.</div>}
        </GlassPanel>
      )}

      {selectedRow && <EvidenceInspector row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
};

const ExecutiveHighlights = ({ revision }: { revision: number }) => {
  const highlights = useMemo(() => {
    const sales = aglReportingWorkflow.buildReport({ ...defaultAglReportConfig('sales-activity'), groupBy: 'item', primaryMeasure: 'revenue' });
    const staff = aglReportingWorkflow.buildReport({ ...defaultAglReportConfig('employee-performance'), groupBy: 'name', primaryMeasure: 'approvedJobValue' });
    const inventory = aglReportingWorkflow.buildReport(defaultAglReportConfig('inventory-position'));
    const workshop = aglReportingWorkflow.buildReport(defaultAglReportConfig('workshop-flow'));
    const customers = aglReportingWorkflow.buildReport({ ...defaultAglReportConfig('customer-base'), groupBy: 'name', primaryMeasure: 'salesValue' });
    return [
      { label: 'Best seller', value: sales.groups[0]?.label ?? 'No sales in scope', detail: sales.groups[0] ? money.format(sales.groups[0].value) : '—', Icon: Trophy },
      { label: 'Top staff contribution', value: staff.groups[0]?.label ?? 'No staff evidence', detail: staff.groups[0] ? money.format(staff.groups[0].value) : '—', Icon: Users },
      { label: 'Inventory value', value: metricValue(inventory, 'stockValue', 'money'), detail: `${inventory.rowCount} stock positions`, Icon: Boxes },
      { label: 'Workshop load', value: metricValue(workshop, 'jobCount', 'number'), detail: `${metricValue(workshop, 'promiseRisk', 'number')} beyond promise`, Icon: Wrench },
      { label: 'Most valuable customer', value: customers.groups[0]?.label ?? 'No customer sales', detail: customers.groups[0] ? money.format(customers.groups[0].value) : '—', Icon: CircleGauge },
    ];
  }, [revision]);
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {highlights.map(({ label, value, detail, Icon }) => <GlassPanel key={label} className="rounded-xl border-cyan-300/10 p-4"><div className="flex items-center justify-between"><span className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">{label}</span><Icon size={14} className="text-cyan-300" /></div><div className="mt-3 truncate text-sm font-semibold text-white" title={value}>{value}</div><div className="mt-1 text-[9px] text-gray-600">{detail}</div></GlassPanel>)}
    </section>
  );
};

const AglAnalyticsSettingsWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [settings, setSettings] = useState(readAglAnalyticsSettings);
  const [notice, setNotice] = useState('');
  const save = () => {
    saveAglAnalyticsSettings(settings);
    aglErpRepository.recordAction({
      moduleId: 'analytics-settings',
      recordId: 'AGL-ANALYTICS-PREFERENCES',
      actorName: 'AGL Admin',
      actorRole: 'Administrator',
      action: 'UPDATE',
      summary: 'Updated AGL Analytics targets and presentation controls.',
      values: {
        currency: settings.currency,
        fiscalYearStart: settings.fiscalYearStart,
        defaultChart: settings.defaultChart,
        evidencePreviewLimit: settings.evidencePreviewLimit,
      },
    });
    setNotice('Analytics controls saved and applied to all AGL analytical pages.');
  };
  const reset = () => {
    resetAglAnalyticsSettings();
    setSettings(DEFAULT_AGL_ANALYTICS_SETTINGS);
    setNotice('Analytics controls reset to the governed defaults.');
  };
  const sources = ['sales-ledger', 'work-orders', 'stock-ledger', 'customers', 'employees', 'attendance', 'payroll', 'expenses', 'audit-log'];
  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-12">
      <header className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><Settings2 size={13} /> {tenant.name} / analytics administration</div>
        <h1 className="mt-3 text-3xl font-display font-semibold text-white">Analytics settings</h1>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">These are analytical targets and presentation controls. They do not alter ERP transactions, tax rules, payroll calculations, or operating records.</p>
      </header>
      {notice && <div className="flex items-center justify-between rounded-lg border border-emerald-300/20 bg-emerald-300/[0.05] px-4 py-3 text-xs text-emerald-200"><span>{notice}</span><button onClick={() => setNotice('')}><X size={13} /></button></div>}
      <div className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
        <GlassPanel className="rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-white"><Target size={15} className="text-cyan-300" /> Decision targets</div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SettingSelect label="Display currency" value={settings.currency} onChange={(currency) => setSettings({ ...settings, currency: currency as AglAnalyticsSettings['currency'] })} options={[['GHS', 'Ghana cedi (GHS)'], ['USD', 'US dollar (USD)']]} />
            <SettingSelect label="Fiscal year starts" value={settings.fiscalYearStart} onChange={(fiscalYearStart) => setSettings({ ...settings, fiscalYearStart })} options={Array.from({ length: 12 }, (_, index) => [String(index + 1).padStart(2, '0'), new Date(2026, index, 1).toLocaleDateString('en-GH', { month: 'long' })])} />
            <SettingNumber label="Scoped sales target (GHS)" value={settings.salesTargetGhs} onChange={(salesTargetGhs) => setSettings({ ...settings, salesTargetGhs })} />
            <SettingNumber label="Workshop completion target (%)" value={settings.workshopCompletionTarget} onChange={(workshopCompletionTarget) => setSettings({ ...settings, workshopCompletionTarget })} />
            <SettingNumber label="First-pass quality target (%)" value={settings.firstPassQualityTarget} onChange={(firstPassQualityTarget) => setSettings({ ...settings, firstPassQualityTarget })} />
            <SettingNumber label="Inventory availability target (%)" value={settings.inventoryAvailabilityTarget} onChange={(inventoryAvailabilityTarget) => setSettings({ ...settings, inventoryAvailabilityTarget })} />
            <SettingNumber label="Scoped payroll budget (GHS)" value={settings.payrollBudgetGhs} onChange={(payrollBudgetGhs) => setSettings({ ...settings, payrollBudgetGhs })} />
            <SettingNumber label="Low-stock threshold (units)" value={settings.lowStockThreshold} onChange={(lowStockThreshold) => setSettings({ ...settings, lowStockThreshold })} />
          </div>
        </GlassPanel>

        <div className="space-y-5">
          <GlassPanel className="rounded-xl p-5">
            <div className="flex items-center gap-2 text-sm text-white"><LineChartIcon size={15} className="text-cyan-300" /> Presentation and drill</div>
            <div className="mt-5 space-y-4">
              <SettingSelect label="Default chart emphasis" value={settings.defaultChart} onChange={(defaultChart) => setSettings({ ...settings, defaultChart: defaultChart as AglAnalyticsSettings['defaultChart'] })} options={[['ranked-bar', 'Ranked comparison'], ['donut', 'Composition / mix'], ['trend', 'Period movement']]} />
              <SettingNumber label="Evidence preview rows" value={settings.evidencePreviewLimit} onChange={(evidencePreviewLimit) => setSettings({ ...settings, evidencePreviewLimit: Math.max(5, Math.min(100, evidencePreviewLimit)) })} />
              <label className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-3"><span><span className="block text-[10px] text-gray-300">Show targets on KPI cards</span><span className="mt-1 block text-[8px] text-gray-600">Keeps actual and configured ambition together.</span></span><input type="checkbox" checked={settings.showTargets} onChange={(event) => setSettings({ ...settings, showTargets: event.target.checked })} /></label>
            </div>
          </GlassPanel>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={reset} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.08] text-[10px] text-gray-400"><RotateCcw size={13} /> Reset</button>
            <button onClick={save} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-300 text-[10px] font-semibold text-black"><Save size={13} /> Save and apply</button>
          </div>
        </div>
      </div>

      <GlassPanel className="rounded-xl p-5">
        <div className="flex items-center gap-2 text-sm text-white"><Database size={15} className="text-cyan-300" /> Wired analytical sources</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => {
            const records = source === 'audit-log' ? aglErpRepository.audit().length : aglErpRepository.list(source).length;
            return <div key={source} className="rounded-lg border border-white/[0.07] bg-black/20 p-3"><div className="flex items-center justify-between"><span className="font-mono text-[9px] text-cyan-200">{source}</span><Check size={12} className="text-emerald-300" /></div><div className="mt-2 text-xl text-white">{records}</div><div className="mt-1 text-[8px] text-gray-600">records in current Operating Scope</div></div>;
          })}
        </div>
      </GlassPanel>
    </div>
  );
};

const RankedBars = ({ result, selected, onSelect }: { result: AglReportResult; selected: string; onSelect: (label: string) => void }) => {
  const max = Math.max(...result.groups.map((group) => Math.abs(group.value)), 1);
  if (!result.groups.length) return <EmptyVisual message="No ERP evidence matches this scope and filter." />;
  return (
    <div className="mt-5 space-y-2">
      {result.groups.slice(0, 12).map((group) => (
        <button key={group.label} onClick={() => onSelect(group.label)} className={`grid w-full grid-cols-[minmax(120px,0.8fr)_minmax(160px,2fr)_auto] items-center gap-3 rounded-lg px-3 py-2 text-left transition ${selected === group.label ? 'bg-cyan-300/[0.08] ring-1 ring-cyan-300/30' : 'hover:bg-white/[0.025]'}`}>
          <span className="truncate text-[10px] text-gray-300">{group.label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-white/[0.05]"><span className="block h-full rounded-full bg-cyan-300/80" style={{ width: `${Math.max(2, (Math.abs(group.value) / max) * 100)}%` }} /></span>
          <span className="min-w-24 text-right font-mono text-[9px] text-white">{formatValue(group.value, result.primaryMeasure.format)} <span className="text-gray-600">· {group.count}</span></span>
        </button>
      ))}
    </div>
  );
};

const DashboardHeading = ({
  icon: Icon,
  title,
  detail,
  action,
  onAction,
}: {
  icon: typeof Activity;
  title: string;
  detail: string;
  action: string;
  onAction: () => void;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h2 className="flex items-center gap-2 text-sm text-white"><Icon size={15} className="text-cyan-300" /> {title}</h2>
      <p className="mt-1 text-[9px] text-gray-600">{detail}</p>
    </div>
    <button onClick={onAction} className="flex shrink-0 items-center gap-1 text-[8px] text-cyan-300/70 hover:text-cyan-200">{action}<ChevronRight size={11} /></button>
  </div>
);

const CompactRankedList = ({
  groups,
  format,
  color,
  onOpen,
  limit = 7,
}: {
  groups: AglReportResult['groups'];
  format: 'money' | 'number';
  color: string;
  onOpen: () => void;
  limit?: number;
}) => {
  const max = Math.max(...groups.map((group) => Math.abs(group.value)), 1);
  if (!groups.length) return <EmptyVisual message="No governed records match this scope." />;
  return (
    <div className="mt-4 space-y-2">
      {groups.slice(0, limit).map((group) => (
        <button key={group.label} onClick={onOpen} className="w-full rounded-lg px-2 py-2 text-left hover:bg-white/[0.025]">
          <div className="flex items-center justify-between gap-4"><span className="truncate text-[10px] text-gray-300">{group.label}</span><span className="whitespace-nowrap font-mono text-[9px] text-white">{format === 'money' ? money.format(group.value) : number.format(group.value)} <span className="text-gray-600">· {group.count}</span></span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full" style={{ width: `${Math.max(3, (Math.abs(group.value) / max) * 100)}%`, backgroundColor: color }} /></div>
        </button>
      ))}
    </div>
  );
};

const MixBar = ({ groups }: { groups: AglReportResult['groups'] }) => {
  const total = groups.reduce((sum, group) => sum + Math.max(0, group.value), 0);
  if (!groups.length || total <= 0) return <EmptyVisual message="No payment evidence matches this scope." />;
  return (
    <div className="mt-5">
      <div className="flex h-6 overflow-hidden rounded-full bg-white/[0.05]">
        {groups.slice(0, colors.length).map((group, index) => (
          <div key={group.label} title={`${group.label}: ${money.format(group.value)}`} style={{ width: `${(Math.max(0, group.value) / total) * 100}%`, backgroundColor: colors[index % colors.length] }} />
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {groups.slice(0, colors.length).map((group, index) => (
          <div key={group.label} className="flex items-center justify-between gap-3 text-[9px]"><span className="flex items-center gap-2 text-gray-300"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />{group.label}</span><span className="font-mono text-white">{number.format((Math.max(0, group.value) / total) * 100)}%</span></div>
        ))}
      </div>
    </div>
  );
};

const EvidenceInspector = ({ row, onClose }: { row: AglReportRow; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" onClick={onClose}>
    <aside className="custom-scrollbar h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-white/[0.08] pb-5"><div><div className="font-mono text-[9px] uppercase tracking-wider text-cyan-300">{row.sourceModule} / {row.sourceId}</div><h2 className="mt-2 text-xl text-white">{row.sourceLabel}</h2></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded border border-white/[0.08] text-gray-500"><X size={14} /></button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(row).map(([key, value]) => <div key={key} className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3"><div className="font-mono text-[7px] uppercase tracking-wider text-gray-600">{key.replace(/([A-Z])/g, ' $1')}</div><div className="mt-2 break-words text-[10px] text-gray-200">{String(value || '—')}</div></div>)}</div>
      <div className="mt-5 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.035] p-4 text-[9px] leading-5 text-cyan-100/70"><ShieldCheck size={13} className="mb-2 text-cyan-300" />This analytical row resolves to the governed <span className="text-cyan-200">{row.sourceModule}</span> record <span className="text-cyan-200">{row.sourceId}</span>. Open the matching ERP module to change the source; Analytics remains read-only.</div>
    </aside>
  </div>
);

const ControlSelect = ({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; disabled?: boolean }) => <label className="block"><span className="font-mono text-[7px] uppercase tracking-wider text-gray-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-1 h-8 w-full rounded-md border border-white/[0.08] bg-[#080808] px-2 text-[9px] text-gray-300 disabled:opacity-35">{options.map((option) => <option key={`${label}-${option.value}`} value={option.value}>{option.label}</option>)}</select></label>;
const SettingSelect = ({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-[#080808] px-3 text-[10px] text-white">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
const SettingNumber = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-[10px] text-white" /></label>;
const InsightLine = ({ label, value }: { label: string; value: string }) => <div className="rounded-lg border border-white/[0.07] bg-black/20 p-3"><div className="font-mono text-[7px] uppercase tracking-wider text-gray-600">{label}</div><div className="mt-2 text-[10px] leading-5 text-gray-300">{value}</div></div>;
const EmptyVisual = ({ message }: { message: string }) => <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-white/[0.07] px-6 text-center text-[10px] text-gray-600">{message}</div>;

const presetConfig = (preset: AnalyticsPreset): AglReportConfig => ({
  ...defaultAglReportConfig(preset.subjectId),
  title: preset.title,
  groupBy: preset.groupBy,
  primaryMeasure: preset.primaryMeasure,
  metricKeys: preset.metricKeys,
  detailLevel: 'summary',
});
const formatValue = (value: number, format: Exclude<AglReportFormat, 'text' | 'date'>) => format === 'money' ? money.format(value) : format === 'percent' ? `${number.format(value)}%` : number.format(value);
const formatCell = (value: string | number | undefined, format?: AglReportFormat) => {
  if (value === undefined || value === '') return '—';
  if (format === 'money') return money.format(Number(value));
  if (format === 'number') return number.format(Number(value));
  if (format === 'percent') return `${number.format(Number(value))}%`;
  if (format === 'date') {
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString('en-GH');
  }
  return String(value);
};
const buildTrend = (rows: AglReportRow[], measure: AglReportMeasure) => {
  const values = new Map<string, { label: string; value: number }>();
  rows.forEach((row) => {
    if (!row.date) return;
    const parsed = new Date(row.date);
    if (Number.isNaN(parsed.getTime())) return;
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    const label = parsed.toLocaleDateString('en-GH', { month: 'short', year: '2-digit' });
    const value = ['count', 'distinct', 'rate'].includes(measure.aggregation) ? 1 : Number(row[measure.field ?? 'amount'] ?? 0);
    const current = values.get(key)?.value ?? 0;
    values.set(key, { label, value: current + (Number.isFinite(value) ? value : 0) });
  });
  return [...values.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, item]) => item);
};
const metricValue = (result: AglReportResult, key: string, format: Exclude<AglReportFormat, 'text' | 'date'>) => formatValue(result.metrics.find((metric) => metric.key === key)?.value ?? 0, format);
const measureOf = (result: AglReportResult, key: string) => result.metrics.find((metric) => metric.key === key)?.value ?? 0;
const targetForMetric = (key: string, settings: AglAnalyticsSettings) => {
  if (key === 'revenue') return money.format(settings.salesTargetGhs);
  if (key === 'completionRate') return `${settings.workshopCompletionTarget}%`;
  if (key === 'netPay') return money.format(settings.payrollBudgetGhs);
  return '';
};
const tooltipStyle = { background: '#080808', border: '1px solid #ffffff18', borderRadius: 8, color: '#fff', fontSize: 10 };
