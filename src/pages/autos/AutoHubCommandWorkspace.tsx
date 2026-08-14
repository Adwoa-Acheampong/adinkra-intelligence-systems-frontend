import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  Car,
  CircleDollarSign,
  Clock3,
  Database,
  ExternalLink,
  Globe2,
  MapPin,
  Radio,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { GlassPanel } from '../../components/ui/GlassPanel';
import {
  buildAutoHubPortfolio,
  type AutoHubEvidence,
  type AutoHubPortfolioSnapshot,
  type AutoHubTenantSnapshot,
} from '../../autos/autoHubPortfolio';

type Focus = 'portfolio' | 'revenue' | 'inventory' | 'workshop' | 'customers' | 'exceptions';
type WindowKey = 'real-time' | 'today' | '7d' | '30d' | 'ytd';
type CurrencyKey = 'GHS' | 'USD';

interface AutoHubCommandWorkspaceProps {
  view?: 'overview' | 'tenants';
}

const number = new Intl.NumberFormat('en-GH', { maximumFractionDigits: 0 });
const ghsMoney = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });
const ghsCompact = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', notation: 'compact', maximumFractionDigits: 1 });
const chartColours = ['#22d3ee', '#fb7185', '#fbbf24', '#34d399', '#a78bfa', '#60a5fa'];
const DEMO_GHS_PER_USD = 15.65;

const windowOptions: Array<{ key: WindowKey; label: string; factor: number; maxAgeMinutes: number }> = [
  { key: 'real-time', label: 'Real-time', factor: 0.018, maxAgeMinutes: 60 },
  { key: 'today', label: 'Today', factor: 0.065, maxAgeMinutes: 1440 },
  { key: '7d', label: '7D', factor: 0.25, maxAgeMinutes: 10080 },
  { key: '30d', label: '30D', factor: 0.62, maxAgeMinutes: 43200 },
  { key: 'ytd', label: 'YTD', factor: 1, maxAgeMinutes: Number.POSITIVE_INFINITY },
];

const commandTrendLabels: Record<WindowKey, string[]> = {
  'real-time': ['-35m', '-30m', '-25m', '-20m', '-15m', '-10m', '-5m', 'Now'],
  today: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', 'Now'],
  '7d': ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'],
  '30d': ['W1', 'W1.5', 'W2', 'W2.5', 'W3', 'W3.5', 'W4', 'Now'],
  ytd: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
};

const trendWeights = [0.09, 0.11, 0.1, 0.14, 0.12, 0.16, 0.13, 0.15];

const moneyFor = (currency: CurrencyKey, compact = false) => new Intl.NumberFormat(
  currency === 'GHS' ? 'en-GH' : 'en-US',
  { style: 'currency', currency, notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0 },
);

const toCurrency = (value: number, currency: CurrencyKey) => currency === 'GHS' ? value : value / DEMO_GHS_PER_USD;

const PortfolioTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#080808]/95 px-3 py-2 shadow-xl">
      {label && <div className="mb-1 text-[9px] font-mono uppercase tracking-wider text-gray-500">{label}</div>}
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-5 text-[10px]" style={{ color: item.color }}>
          <span>{item.name}</span><span className="font-mono">{ghsMoney.format(item.value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
};

const CommandTooltip = ({ active, payload, label, currency }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string; currency: CurrencyKey }) => {
  if (!active || !payload?.length) return null;
  const formatter = moneyFor(currency);
  return (
    <div className="rounded-lg border border-white/10 bg-[#080808]/95 px-3 py-2 shadow-xl">
      <div className="mb-1 text-[9px] font-mono uppercase tracking-wider text-gray-500">{label}</div>
      {payload.map((item) => <div key={item.name} className="flex justify-between gap-5 text-[10px]" style={{ color: item.color }}><span>{item.name}</span><span className="font-mono">{formatter.format(item.value ?? 0)}</span></div>)}
    </div>
  );
};

const SourceBadge: React.FC<{ tenant: AutoHubTenantSnapshot }> = ({ tenant }) => (
  <span className={`rounded-full border px-2 py-1 text-[8px] font-mono uppercase tracking-wider ${tenant.sourceState === 'Operational records' ? 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300' : 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200'}`}>
    {tenant.sourceState}
  </span>
);

const MetricButton: React.FC<{ label: string; value: string; detail: string; icon: React.ElementType; tone?: string; active?: boolean; onClick: () => void }> = ({ label, value, detail, icon: Icon, tone = 'text-cyan-300', active, onClick }) => (
  <button type="button" onClick={onClick} className={`min-h-32 rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${active ? 'border-cyan-300/50 bg-cyan-300/[0.08]' : 'border-white/[0.08] bg-black/25 hover:border-cyan-300/30 hover:bg-white/[0.035]'}`}>
    <div className="flex items-center justify-between"><span className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-500">{label}</span><Icon size={15} className={tone} /></div>
    <div className="mt-4 text-xl font-medium text-white">{value}</div>
    <div className="mt-2 text-[9px] leading-relaxed text-gray-500">{detail}</div>
  </button>
);

const CommandKpi: React.FC<{ label: string; value: string; detail: string; icon: React.ElementType; tone?: string }> = ({ label, value, detail, icon: Icon, tone = 'text-cyan-300' }) => (
  <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4">
    <div className="flex items-center justify-between"><span className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-500">{label}</span><Icon size={15} className={tone} /></div>
    <div className="mt-4 text-xl font-medium text-white">{value}</div>
    <div className="mt-2 text-[9px] leading-relaxed text-gray-500">{detail}</div>
  </div>
);

const focusModule: Partial<Record<Focus, string>> = { revenue: 'sales-ledger', inventory: 'stock-ledger', workshop: 'work-orders' };
const evidenceFor = (tenant: AutoHubTenantSnapshot, focus: Focus) => {
  const moduleId = focusModule[focus];
  return moduleId ? tenant.evidence.filter((item) => item.moduleId === moduleId) : tenant.evidence;
};

const pressureTone = (score: number) => score >= 70 ? 'bg-rose-400/20 text-rose-200 border-rose-400/30' : score >= 40 ? 'bg-amber-400/15 text-amber-200 border-amber-400/25' : 'bg-emerald-400/10 text-emerald-200 border-emerald-400/20';

const AutomotiveCommand: React.FC<{ portfolio: AutoHubPortfolioSnapshot; refresh: () => void }> = ({ portfolio, refresh }) => {
  const navigate = useNavigate();
  const [windowKey, setWindowKey] = useState<WindowKey>('real-time');
  const [currency, setCurrency] = useState<CurrencyKey>('GHS');
  const [scope, setScope] = useState('Global');
  const windowConfig = windowOptions.find((item) => item.key === windowKey) ?? windowOptions[0];
  const countries = useMemo(() => [...new Set(portfolio.tenants.flatMap((tenant) => tenant.siteBreakdown.map((site) => site.country)))].sort(), [portfolio]);
  const scopedTenants = useMemo(() => portfolio.tenants.map((tenant) => {
    const allRevenue = tenant.siteBreakdown.reduce((total, site) => total + site.revenue, 0) || tenant.revenue;
    const selectedSites = scope === 'Global' ? tenant.siteBreakdown : tenant.siteBreakdown.filter((site) => site.country === scope);
    const selectedRevenue = scope === 'Global' ? tenant.revenue : selectedSites.reduce((total, site) => total + site.revenue, 0);
    return { tenant, sites: selectedSites, ratio: scope === 'Global' ? 1 : selectedRevenue / allRevenue, selectedRevenue };
  }).filter((entry) => entry.sites.length > 0 || scope === 'Global'), [portfolio, scope]);

  const baseRevenue = scopedTenants.reduce((total, entry) => total + entry.selectedRevenue, 0);
  const windowRevenue = baseRevenue * windowConfig.factor;
  const inventoryValue = scopedTenants.reduce((total, entry) => total + (scope === 'Global' ? entry.tenant.inventoryValue : entry.sites.reduce((sum, site) => sum + site.inventoryValue, 0)), 0);
  const activeJobs = Math.round(scopedTenants.reduce((total, entry) => total + (scope === 'Global' ? entry.tenant.activeJobs : entry.sites.reduce((sum, site) => sum + site.activeJobs, 0)), 0));
  const exceptions = Math.round(scopedTenants.reduce((total, entry) => total + entry.tenant.exceptions * entry.ratio, 0));
  const customers = Math.round(scopedTenants.reduce((total, entry) => total + entry.tenant.customers * entry.ratio, 0));
  const siteCount = scopedTenants.reduce((total, entry) => total + entry.sites.length, 0);
  const connectedTenants = scopedTenants.filter((entry) => entry.tenant.sourceState === 'Operational records').length;
  const coverage = scopedTenants.length ? Math.round(scopedTenants.reduce((total, entry) => total + entry.tenant.confidence, 0) / scopedTenants.length) : 0;
  const compactCurrency = moneyFor(currency, true);

  const trendData = commandTrendLabels[windowKey].map((period, index) => ({ period, value: toCurrency(windowRevenue * trendWeights[index], currency) }));
  const enquiryBase = Math.max(1, Math.round(customers * windowConfig.factor * 0.82));
  const flow = [
    { label: 'Demand captured', value: enquiryBase },
    { label: 'Orders accepted', value: Math.round(enquiryBase * 0.64) },
    { label: 'Payment secured', value: Math.round(enquiryBase * 0.52) },
    { label: 'Work assigned', value: Math.round(enquiryBase * 0.43) },
    { label: 'Released outcome', value: Math.round(enquiryBase * 0.36) },
  ];

  const events = scopedTenants.flatMap((entry, tenantIndex) => {
    const site = entry.sites[0];
    const route = `/autos/tenant/${entry.tenant.id}/analytics`;
    return [
      { id: `${entry.tenant.id}-exceptions`, age: 8 + tenantIndex * 17, severity: entry.tenant.exceptions >= 15 ? 'Critical' : 'Watch', tenant: entry.tenant.name, place: site ? `${site.city} / ${site.site}` : 'Tenant network', title: `${Math.max(1, Math.round(entry.tenant.exceptions * entry.ratio))} exceptions require control review`, detail: 'Stock, workshop, approval, and customer exceptions awaiting accountable action.', route },
      { id: `${entry.tenant.id}-workshop`, age: 95 + tenantIndex * 280, severity: entry.tenant.activeJobs > entry.tenant.staff * 0.55 ? 'Critical' : 'Watch', tenant: entry.tenant.name, place: site ? `${site.city} / ${site.site}` : 'Tenant network', title: `${Math.max(1, Math.round(entry.tenant.activeJobs * entry.ratio))} active jobs need capacity balancing`, detail: 'Compare bay load, promised delivery, mechanic capacity, and parts readiness.', route },
    ];
  }).filter((event) => event.age <= windowConfig.maxAgeMinutes).sort((left, right) => left.age - right.age);

  const countryPulse = countries.filter((country) => scope === 'Global' || country === scope).map((country) => {
    const sites = portfolio.tenants.flatMap((tenant) => tenant.siteBreakdown.filter((site) => site.country === country));
    return {
      country,
      tenants: new Set(sites.map((site) => site.tenantId)).size,
      sites: sites.length,
      jobs: sites.reduce((total, site) => total + site.activeJobs, 0),
      inventory: sites.reduce((total, site) => total + site.inventoryValue, 0),
    };
  });

  const constraints = scopedTenants.map(({ tenant, sites }) => {
    const siteDivisor = Math.max(1, sites.length || tenant.sites);
    const maxTender = Math.max(0, ...Object.values(tenant.paymentMix));
    return {
      tenant,
      values: [
        Math.min(100, Math.round((tenant.activeJobs / Math.max(1, tenant.staff)) * 100)),
        Math.min(100, Math.round((tenant.exceptions / Math.max(1, tenant.activeJobs + tenant.completedJobs)) * 500)),
        Math.min(100, Math.round((maxTender / Math.max(1, tenant.revenue)) * 100)),
        Math.min(100, Math.round((tenant.activeJobs / siteDivisor) * 7)),
        100 - tenant.confidence,
      ],
    };
  });
  const constraintLabels = ['Workshop pressure', 'Exception load', 'Tender concentration', 'Branch load', 'Data gap'];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><Radio size={13} /> AutoHub central</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">Automotive command</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-gray-500">See what needs intervention across the automotive network now, then move directly to the accountable tenant.</p></div>
        <button type="button" onClick={() => navigate('/autos/tenants')} className="flex min-h-10 items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/[0.06] px-4 text-[9px] text-cyan-200 hover:bg-cyan-300/[0.1]">Open Auto Tenant Control <ArrowRight size={12} /></button>
      </header>

      <GlassPanel className="rounded-xl p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-1.5" aria-label="Command period">
            {windowOptions.map((option) => <button key={option.key} type="button" onClick={() => setWindowKey(option.key)} className={`min-h-9 rounded-lg px-3 text-[9px] font-medium transition ${windowKey === option.key ? 'bg-cyan-300 text-black' : 'border border-white/[0.08] bg-black/20 text-gray-400 hover:text-white'}`}>{option.label}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-white/[0.08] bg-black/20 p-1" aria-label="Reporting currency">{(['GHS', 'USD'] as CurrencyKey[]).map((item) => <button key={item} type="button" onClick={() => setCurrency(item)} className={`min-h-8 rounded-md px-3 text-[9px] font-mono ${currency === item ? 'bg-white text-black' : 'text-gray-500'}`}>{item}</button>)}</div>
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-[9px] text-gray-400"><Globe2 size={13} className="text-cyan-300" /><span className="sr-only">Geographic scope</span><select value={scope} onChange={(event) => setScope(event.target.value)} className="bg-transparent text-gray-200 outline-none"><option value="Global">Global</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select></label>
            <button type="button" onClick={refresh} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400 hover:text-white"><RefreshCw size={12} /> Refresh</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] pt-3 text-[8px] font-mono uppercase tracking-wider text-gray-600"><span>{windowConfig.label} · {scope} · {scopedTenants.length} tenants · {siteCount} sites</span><span>{currency === 'USD' ? `Demonstration FX basis: ${DEMO_GHS_PER_USD} GHS/USD` : 'Local reporting basis: GHS'}</span></div>
      </GlassPanel>

      <section aria-label="Automotive command measures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <CommandKpi label="Value moving" value={compactCurrency.format(toCurrency(windowRevenue, currency))} detail={`Accepted automotive value in the ${windowConfig.label.toLowerCase()} window`} icon={CircleDollarSign} />
        <CommandKpi label="Promise exceptions" value={number.format(exceptions)} detail="Tenant commitments requiring intervention" icon={AlertTriangle} tone="text-rose-300" />
        <CommandKpi label="Active work queue" value={number.format(activeJobs)} detail="Open workshop jobs across selected scope" icon={Wrench} tone="text-amber-200" />
        <CommandKpi label="Stock exposed" value={compactCurrency.format(toCurrency(inventoryValue, currency))} detail="Capital held in automotive inventory" icon={Boxes} tone="text-violet-300" />
        <CommandKpi label="Source coverage" value={`${coverage}%`} detail={`${connectedTenants}/${scopedTenants.length} tenant feeds use operating records`} icon={Database} tone="text-emerald-300" />
        <CommandKpi label="Network reach" value={`${siteCount} sites`} detail={`${countryPulse.length} countries in the selected command scope`} icon={Globe2} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="rounded-xl p-5">
          <div className="flex items-start justify-between"><div><h2 className="text-sm font-medium text-white">Network value velocity</h2><p className="mt-1 text-[9px] text-gray-600">Accepted value moving through the selected command window.</p></div><Activity size={16} className="text-cyan-300" /></div>
          <div className="mt-4 h-[270px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="commandVelocity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value) => compactCurrency.format(Number(value))} /><Tooltip content={<CommandTooltip currency={currency} />} /><Area type="monotone" dataKey="value" name="Accepted value" stroke="#22d3ee" strokeWidth={2} fill="url(#commandVelocity)" /></AreaChart></ResponsiveContainer></div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <div className="flex items-start justify-between"><div><h2 className="text-sm font-medium text-white">Value stream now</h2><p className="mt-1 text-[9px] text-gray-600">Demand captured → released outcome. The largest fall identifies the current conversion constraint.</p></div><SlidersHorizontal size={16} className="text-amber-200" /></div>
          <div className="mt-5 space-y-3">{flow.map((stage, index) => { const width = flow[0].value ? Math.max(12, stage.value / flow[0].value * 100) : 12; const loss = index ? flow[index - 1].value - stage.value : 0; return <div key={stage.label}><div className="mb-1.5 flex items-center justify-between text-[10px]"><span className="text-gray-300">{stage.label}</span><span className="font-mono text-gray-400">{stage.value}{index > 0 && <span className="ml-2 text-rose-300">-{loss}</span>}</span></div><div className="h-7 overflow-hidden rounded-md bg-white/[0.04]"><div className="flex h-full items-center rounded-md bg-gradient-to-r from-cyan-400/80 to-cyan-300/25 px-2 text-[8px] font-mono text-black" style={{ width: `${width}%` }}>{Math.round(width)}%</div></div></div>; })}</div>
        </GlassPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Live intervention queue</h2><p className="mt-1 text-[9px] text-gray-600">Only signals inside the selected period and geography are shown.</p></div><Clock3 size={16} className="text-rose-300" /></div>
          {events.length ? <div className="divide-y divide-white/[0.06]">{events.slice(0, 8).map((event) => <button key={event.id} type="button" onClick={() => navigate(event.route)} className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-white/[0.025] md:grid-cols-[80px_1fr_150px_70px]"><span className={`w-fit rounded border px-2 py-1 text-[8px] font-mono uppercase ${event.severity === 'Critical' ? 'border-rose-400/25 bg-rose-400/[0.08] text-rose-200' : 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200'}`}>{event.severity}</span><span><span className="block text-[11px] text-white">{event.title}</span><span className="mt-1 block text-[9px] text-gray-600">{event.detail}</span></span><span><span className="block text-[9px] text-gray-300">{event.tenant}</span><span className="mt-1 block text-[8px] text-gray-600">{event.place}</span></span><span className="flex items-center justify-end gap-2 font-mono text-[8px] text-gray-500">{event.age < 60 ? `${event.age}m` : `${Math.round(event.age / 60)}h`} <ArrowRight size={11} /></span></button>)}</div> : <div className="p-10 text-center text-[10px] text-gray-500">No intervention signals fall inside this exact command window.</div>}
        </GlassPanel>

        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="border-b border-white/[0.08] px-5 py-4"><h2 className="text-sm font-medium text-white">Network pulse</h2><p className="mt-1 text-[9px] text-gray-600">Country contribution to current automotive capacity.</p></div>
          <div className="divide-y divide-white/[0.06]">{countryPulse.map((country) => <button key={country.country} type="button" onClick={() => setScope(country.country)} className="w-full p-5 text-left transition hover:bg-cyan-300/[0.03]"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-white"><MapPin size={13} className="text-cyan-300" />{country.country}</span><ArrowRight size={12} className="text-gray-600" /></div><div className="mt-4 grid grid-cols-4 gap-2">{[[country.tenants, 'Tenants'], [country.sites, 'Sites'], [country.jobs, 'Open jobs'], [compactCurrency.format(toCurrency(country.inventory, currency)), 'Stock']].map(([value, label]) => <div key={label}><div className="font-mono text-[10px] text-gray-200">{value}</div><div className="mt-1 text-[7px] uppercase text-gray-700">{label}</div></div>)}</div></button>)}</div>
        </GlassPanel>
      </section>

      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Cross-tenant constraint heatmap</h2><p className="mt-1 text-[9px] text-gray-600">Normalized pressure scores expose which tenant and operating dimension is binding the network.</p></div><ShieldCheck size={16} className="text-cyan-300" /></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="border-b border-white/[0.06] bg-white/[0.02] text-[8px] font-mono uppercase tracking-wider text-gray-600"><tr><th className="px-5 py-3">Tenant</th>{constraintLabels.map((label) => <th key={label} className="px-3 py-3">{label}</th>)}<th className="px-5 py-3" /></tr></thead><tbody>{constraints.map(({ tenant, values }) => <tr key={tenant.id} className="border-b border-white/[0.05]"><td className="px-5 py-4"><div className="text-[11px] text-white">{tenant.name}</div><div className="mt-2"><SourceBadge tenant={tenant} /></div></td>{values.map((value, index) => <td key={constraintLabels[index]} className="px-3 py-4"><span className={`inline-flex min-w-14 justify-center rounded border px-2 py-2 font-mono text-[9px] ${pressureTone(value)}`}>{value}%</span></td>)}<td className="px-5 py-4"><button type="button" onClick={() => navigate(`/autos/tenant/${tenant.id}/analytics`)} className="text-cyan-300"><ArrowRight size={13} /></button></td></tr>)}</tbody></table></div>
        <div className="border-t border-white/[0.06] px-5 py-3 text-[8px] leading-relaxed text-gray-600">Pressure contracts: active jobs/staff · exceptions/open and completed work · largest tender/revenue · active jobs/site · 100 minus record coverage. Select a tenant to investigate its evidence.</div>
      </GlassPanel>
    </motion.div>
  );
};

const TenantControl: React.FC<{ portfolio: AutoHubPortfolioSnapshot; refresh: () => void }> = ({ portfolio, refresh }) => {
  const navigate = useNavigate();
  const [selectedTenantId, setSelectedTenantId] = useState('agl');
  const [focus, setFocus] = useState<Focus>('portfolio');
  const selectedTenant = portfolio.tenants.find((tenant) => tenant.id === selectedTenantId) ?? portfolio.tenants[0];
  const selectedEvidence = evidenceFor(selectedTenant, focus);
  const comparison = portfolio.tenants.map((tenant) => ({ id: tenant.id, name: tenant.name.replace('Automobiles Ghana Limited (AGL)', 'AGL').replace('Adinkra Motors Workshop', 'Adinkra Motors'), revenue: tenant.revenue, inventory: tenant.inventoryValue }));
  const inventoryShare = portfolio.tenants.map((tenant) => ({ name: tenant.name.replace('Automobiles Ghana Limited (AGL)', 'AGL'), value: tenant.inventoryValue }));
  const openTenant = (tenantId: string, system: 'analytics' | 'erp') => navigate(`/autos/tenant/${tenantId}/${system === 'erp' ? 'erp/work-orders' : 'analytics'}`);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><Car size={13} /> AutoHub portfolio</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">Auto Tenant Control</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-gray-500">Compare dealer and workshop tenants, select one company, and drill into its own operating evidence and site hierarchy.</p></div><div className="flex gap-2"><button type="button" onClick={() => navigate('/autos')} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400 hover:text-white">Automotive Command <ArrowRight size={12} /></button><button type="button" onClick={refresh} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400 hover:text-white"><RefreshCw size={12} /> Refresh</button></div></header>

      <section aria-label="Auto tenant portfolio measures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricButton label="Tenant companies" value={number.format(portfolio.tenants.length)} detail={`${portfolio.verifiedTenants} connected to operational records`} icon={Building2} active={focus === 'portfolio'} onClick={() => setFocus('portfolio')} />
        <MetricButton label="Revenue position" value={ghsCompact.format(portfolio.revenue)} detail={`${number.format(portfolio.customers)} customers represented`} icon={CircleDollarSign} active={focus === 'revenue'} onClick={() => setFocus('revenue')} />
        <MetricButton label="Inventory value" value={ghsCompact.format(portfolio.inventoryValue)} detail={`${number.format(portfolio.inventoryUnits)} units across tenant stores`} icon={Boxes} active={focus === 'inventory'} onClick={() => setFocus('inventory')} />
        <MetricButton label="Workshop load" value={number.format(portfolio.activeJobs)} detail={`${number.format(portfolio.completedJobs)} completed work orders`} icon={Wrench} active={focus === 'workshop'} onClick={() => setFocus('workshop')} />
        <MetricButton label="Vehicle records" value={number.format(portfolio.vehicles)} detail={`${number.format(portfolio.staff)} operating staff`} icon={Users} active={focus === 'customers'} onClick={() => setFocus('customers')} />
        <MetricButton label="Needs intervention" value={number.format(portfolio.exceptions)} detail="Stock, approval, complaint, and recall exceptions" icon={AlertTriangle} tone="text-rose-300" active={focus === 'exceptions'} onClick={() => setFocus('exceptions')} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <GlassPanel className="rounded-xl p-5"><div className="flex items-start justify-between"><div><h2 className="text-sm font-medium text-white">Tenant scale comparison</h2><p className="mt-1 text-[9px] text-gray-600">Revenue compared with capital held in inventory.</p></div><BadgeCheck size={16} className="text-cyan-300" /></div><div className="mt-5 h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}K`} /><Tooltip content={<PortfolioTooltip />} /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="revenue" name="Revenue" fill="#22d3ee" radius={[4, 4, 0, 0]} /><Bar dataKey="inventory" name="Inventory value" fill="#fb7185" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></GlassPanel>
        <GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Inventory concentration</h2><p className="mt-1 text-[9px] text-gray-600">Share of automotive stock value by tenant.</p><div className="mt-3 h-[220px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={inventoryShare} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>{inventoryShare.map((entry, index) => <Cell key={entry.name} fill={chartColours[index % chartColours.length]} />)}</Pie><Tooltip content={<PortfolioTooltip />} /></PieChart></ResponsiveContainer></div><div className="space-y-2">{inventoryShare.map((item, index) => <div key={item.name} className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-2 text-gray-400"><span className="h-2 w-2 rounded-full" style={{ background: chartColours[index % chartColours.length] }} />{item.name}</span><span className="font-mono text-gray-300">{ghsCompact.format(item.value)}</span></div>)}</div></GlassPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Tenant operating position</h2><p className="mt-1 text-[9px] text-gray-600">Select a tenant to update every detail and drill below.</p></div><Building2 size={16} className="text-cyan-300" /></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="border-b border-white/[0.06] bg-white/[0.02] text-[8px] font-mono uppercase tracking-wider text-gray-600"><tr><th className="px-5 py-3">Tenant</th><th className="px-3 py-3">Revenue</th><th className="px-3 py-3">Inventory</th><th className="px-3 py-3">Jobs</th><th className="px-3 py-3">Exceptions</th><th className="px-3 py-3">Scope</th><th className="px-3 py-3">Coverage</th><th className="px-5 py-3" /></tr></thead><tbody>{portfolio.tenants.map((tenant) => <tr key={tenant.id} onClick={() => setSelectedTenantId(tenant.id)} className={`cursor-pointer border-b border-white/[0.05] text-[10px] transition hover:bg-white/[0.025] ${selectedTenant.id === tenant.id ? 'bg-cyan-300/[0.06]' : ''}`}><td className="px-5 py-4"><div className="text-xs font-medium text-white">{tenant.name}</div><div className="mt-2"><SourceBadge tenant={tenant} /></div></td><td className="px-3 py-4 font-mono text-gray-200">{ghsMoney.format(tenant.revenue)}</td><td className="px-3 py-4 font-mono text-gray-200">{ghsMoney.format(tenant.inventoryValue)}</td><td className="px-3 py-4 text-gray-300">{tenant.activeJobs}</td><td className="px-3 py-4 text-amber-200">{tenant.exceptions}</td><td className="px-3 py-4 text-gray-400">{tenant.countries} countries · {tenant.sites} sites</td><td className="px-3 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${tenant.confidence}%` }} /></div><span className="font-mono text-gray-400">{tenant.confidence}%</span></div></td><td className="px-5 py-4"><ArrowRight size={14} className="text-gray-600" /></td></tr>)}</tbody></table></div></GlassPanel>
        <GlassPanel className="rounded-xl p-5"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">Selected tenant</div><h2 className="mt-2 text-base font-medium text-white">{selectedTenant.name}</h2><p className="mt-1 text-[9px] text-gray-600">{selectedTenant.kind}</p></div><SourceBadge tenant={selectedTenant} /></div><div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07]">{[['Best seller', selectedTenant.topSeller], ['Seller value', ghsMoney.format(selectedTenant.topSellerValue)], ['Customers', number.format(selectedTenant.customers)], ['Vehicles', number.format(selectedTenant.vehicles)]].map(([label, value]) => <div key={label} className="bg-[#090909] p-3"><div className="font-mono text-[7px] uppercase tracking-wider text-gray-600">{label}</div><div className="mt-2 text-[10px] text-gray-300">{value}</div></div>)}</div><div className="mt-5 space-y-2"><button onClick={() => openTenant(selectedTenant.id, 'analytics')} className="flex min-h-11 w-full items-center justify-between rounded-lg bg-cyan-300 px-4 text-[10px] font-semibold text-black">Open tenant analytics <ExternalLink size={13} /></button>{selectedTenant.id === 'agl' && <button onClick={() => openTenant(selectedTenant.id, 'erp')} className="flex min-h-11 w-full items-center justify-between rounded-lg border border-white/[0.09] px-4 text-[10px] text-gray-300">Operate tenant ERP <ArrowRight size={13} /></button>}</div>{selectedTenant.sourceState === 'Connector simulation' && <div className="mt-4 rounded-lg border border-amber-400/15 bg-amber-400/[0.05] p-3 text-[9px] leading-relaxed text-amber-100/70">Comparison and site values are demonstration data until this tenant publishes its governed operational feed.</div>}</GlassPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel className="rounded-xl p-5"><div className="flex items-start justify-between"><div><h2 className="text-sm font-medium text-white">{selectedTenant.name} payment mix</h2><p className="mt-1 text-[9px] text-gray-600">Tender contribution changes with the selected tenant.</p></div><ShieldCheck size={16} className="text-emerald-300" /></div><div className="mt-5 space-y-3">{Object.entries(selectedTenant.paymentMix).sort((a, b) => b[1] - a[1]).map(([method, value], index) => { const share = selectedTenant.revenue ? value / selectedTenant.revenue * 100 : 0; return <div key={method}><div className="flex justify-between text-[10px]"><span className="text-gray-300">{method}</span><span className="font-mono text-gray-400">{ghsMoney.format(value)} · {share.toFixed(1)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full" style={{ width: `${share}%`, background: chartColours[index % chartColours.length] }} /></div></div>; })}</div></GlassPanel>
        <GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">{focus === 'portfolio' ? 'Contributing records' : `${focus.charAt(0).toUpperCase()}${focus.slice(1)} evidence`}</h2><p className="mt-1 text-[9px] text-gray-600">{selectedTenant.name} · select a record to open its operating ledger.</p></div><Database size={16} className="text-cyan-300" /></div>{selectedEvidence.length ? <div className="divide-y divide-white/[0.06]">{selectedEvidence.map((item: AutoHubEvidence) => <button key={`${item.moduleId}-${item.recordId}`} onClick={() => navigate(item.route)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03]"><span className="rounded border border-cyan-300/20 bg-cyan-300/[0.05] px-2 py-1 font-mono text-[8px] text-cyan-300">{item.recordId}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] text-white">{item.label}</span><span className="mt-1 block truncate text-[9px] text-gray-600">{item.detail}</span></span>{item.amount !== undefined && <span className="font-mono text-[10px] text-gray-300">{ghsMoney.format(item.amount)}</span>}<ArrowRight size={13} className="text-gray-600" /></button>)}</div> : <div className="p-8 text-center"><Database size={22} className="mx-auto text-gray-700" /><div className="mt-3 text-xs text-gray-400">No governed source records connected.</div><div className="mt-2 text-[9px] text-gray-600">The tenant remains isolated as connector simulation data.</div></div>}</GlassPanel>
      </section>

      <GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">{selectedTenant.name} branch and site contribution</h2><p className="mt-1 text-[9px] text-gray-600">Country → city → branch → site. This hierarchy follows the tenant selected above.</p></div><MapPin size={16} className="text-cyan-300" /></div><div className="grid gap-px bg-white/[0.06] md:grid-cols-2 xl:grid-cols-4">{selectedTenant.siteBreakdown.map((site) => <button key={`${site.tenantId}-${site.site}`} onClick={() => openTenant(selectedTenant.id, 'analytics')} className="bg-[#090909] p-4 text-left transition hover:bg-cyan-300/[0.04]"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{site.country} / {site.city}</div><div className="mt-2 text-xs text-white">{site.branch} · {site.site}</div><div className="mt-4 grid grid-cols-3 gap-2"><div><div className="font-mono text-[10px] text-cyan-200">{ghsCompact.format(site.revenue)}</div><div className="mt-1 text-[7px] uppercase text-gray-700">Revenue</div></div><div><div className="font-mono text-[10px] text-rose-200">{ghsCompact.format(site.inventoryValue)}</div><div className="mt-1 text-[7px] uppercase text-gray-700">Stock</div></div><div><div className="font-mono text-[10px] text-gray-300">{site.activeJobs}</div><div className="mt-1 text-[7px] uppercase text-gray-700">Open jobs</div></div></div><div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[8px] text-gray-600"><span>{selectedTenant.sourceState === 'Operational records' ? `${site.sourceRecords} source records` : 'Connector simulation'}</span><ArrowRight size={11} /></div></button>)}</div></GlassPanel>
    </motion.div>
  );
};

export const AutoHubCommandWorkspace: React.FC<AutoHubCommandWorkspaceProps> = ({ view = 'overview' }) => {
  const [revision, setRevision] = useState(0);
  useEffect(() => { const refresh = () => setRevision((value) => value + 1); window.addEventListener('agl-erp-change', refresh); window.addEventListener('storage', refresh); return () => { window.removeEventListener('agl-erp-change', refresh); window.removeEventListener('storage', refresh); }; }, []);
  const portfolio = useMemo(() => buildAutoHubPortfolio(), [revision]);
  const refresh = () => setRevision((value) => value + 1);
  return view === 'tenants' ? <TenantControl portfolio={portfolio} refresh={refresh} /> : <AutomotiveCommand portfolio={portfolio} refresh={refresh} />;
};
