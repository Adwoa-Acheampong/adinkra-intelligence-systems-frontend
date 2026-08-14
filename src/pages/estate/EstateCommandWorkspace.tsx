import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarCheck,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  Globe2,
  HandCoins,
  House,
  KeyRound,
  Landmark,
  MapPin,
  Radio,
  RefreshCw,
  ShieldCheck,
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GlassPanel } from '../../components/ui/GlassPanel';
import {
  buildEstatePortfolio,
  type EstateEvidence,
  type EstatePortfolioSnapshot,
  type EstateTenantSnapshot,
} from '../../estate/estatePortfolio';

type EstateView = 'command' | 'tenants';
type WindowKey = 'real-time' | 'today' | '7d' | '30d' | 'ytd';
type CurrencyKey = 'GHS' | 'USD';

const GHS_PER_USD = 15.65;
const count = new Intl.NumberFormat('en-GH', { maximumFractionDigits: 0 });
const compactGhs = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', notation: 'compact', maximumFractionDigits: 1 });
const colours = ['#34d399', '#22d3ee', '#fbbf24', '#a78bfa', '#fb7185', '#60a5fa'];

const windows: Array<{ key: WindowKey; label: string; factor: number; maxAge: number }> = [
  { key: 'real-time', label: 'Real-time', factor: 0.025, maxAge: 60 },
  { key: 'today', label: 'Today', factor: 0.075, maxAge: 1440 },
  { key: '7d', label: '7D', factor: 0.28, maxAge: 10080 },
  { key: '30d', label: '30D', factor: 0.68, maxAge: 43200 },
  { key: 'ytd', label: 'YTD', factor: 1, maxAge: Number.POSITIVE_INFINITY },
];

const trendLabels: Record<WindowKey, string[]> = {
  'real-time': ['-35m', '-30m', '-25m', '-20m', '-15m', '-10m', '-5m', 'Now'],
  today: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', 'Now'],
  '7d': ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'],
  '30d': ['W1', 'W1.5', 'W2', 'W2.5', 'W3', 'W3.5', 'W4', 'Now'],
  ytd: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
};
const weights = [0.09, 0.1, 0.11, 0.13, 0.12, 0.15, 0.14, 0.16];

const formatterFor = (currency: CurrencyKey, compact = false) => new Intl.NumberFormat(currency === 'GHS' ? 'en-GH' : 'en-US', { style: 'currency', currency, notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0 });
const convert = (value: number, currency: CurrencyKey) => currency === 'GHS' ? value : value / GHS_PER_USD;
const percent = (numerator: number, denominator: number) => denominator ? numerator / denominator * 100 : 0;

const ChartTooltip = ({ active, payload, label, currency = 'GHS' }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string; currency?: CurrencyKey }) => {
  if (!active || !payload?.length) return null;
  const money = formatterFor(currency);
  return <div className="rounded-lg border border-white/10 bg-[#080808]/95 px-3 py-2 shadow-xl"><div className="mb-1 text-[8px] font-mono uppercase text-gray-500">{label}</div>{payload.map((item) => <div key={item.name} className="flex justify-between gap-5 text-[10px]" style={{ color: item.color }}><span>{item.name}</span><span className="font-mono">{money.format(item.value ?? 0)}</span></div>)}</div>;
};

const SourceBadge = ({ tenant }: { tenant: EstateTenantSnapshot }) => <span className={`rounded-full border px-2 py-1 text-[8px] font-mono uppercase tracking-wider ${tenant.sourceState === 'Operational records' ? 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300' : 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200'}`}>{tenant.sourceState}</span>;

const Kpi = ({ label, value, detail, icon: Icon, tone = 'text-emerald-300' }: { label: string; value: string; detail: string; icon: React.ElementType; tone?: string }) => <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4"><div className="flex items-center justify-between"><span className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-500">{label}</span><Icon size={15} className={tone} /></div><div className="mt-4 text-xl font-medium text-white">{value}</div><div className="mt-2 text-[9px] leading-relaxed text-gray-500">{detail}</div></div>;

const severityClass = (state: EstateEvidence['state']) => state === 'Blocked' ? 'border-rose-400/25 bg-rose-400/[0.08] text-rose-200' : state === 'Watch' ? 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200' : 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200';
const pressureClass = (value: number) => value >= 65 ? 'border-rose-400/30 bg-rose-400/20 text-rose-200' : value >= 35 ? 'border-amber-400/25 bg-amber-400/15 text-amber-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';

const EstateCommand = ({ portfolio, refresh }: { portfolio: EstatePortfolioSnapshot; refresh: () => void }) => {
  const navigate = useNavigate();
  const [windowKey, setWindowKey] = useState<WindowKey>('real-time');
  const [currency, setCurrency] = useState<CurrencyKey>('GHS');
  const [scope, setScope] = useState('Global');
  const currentWindow = windows.find((item) => item.key === windowKey) ?? windows[0];
  const countries = useMemo(() => [...new Set(portfolio.tenants.flatMap((tenant) => tenant.locations.map((location) => location.country)))].sort(), [portfolio]);
  const scoped = useMemo(() => portfolio.tenants.map((tenant) => {
    const locations = scope === 'Global' ? tenant.locations : tenant.locations.filter((location) => location.country === scope);
    const allValue = tenant.locations.reduce((total, location) => total + location.portfolioValueGhs, 0);
    const selectedValue = locations.reduce((total, location) => total + location.portfolioValueGhs, 0);
    return { tenant, locations, ratio: scope === 'Global' ? 1 : selectedValue / Math.max(1, allValue) };
  }).filter((entry) => entry.locations.length > 0), [portfolio, scope]);
  const sum = (selector: (tenant: EstateTenantSnapshot) => number) => scoped.reduce((total, entry) => total + selector(entry.tenant) * entry.ratio, 0);
  const qualifiedDemand = Math.round(sum((tenant) => tenant.qualifiedDemand) * currentWindow.factor);
  const controlledOffers = Math.round(sum((tenant) => tenant.controlledOffers) * currentWindow.factor);
  const titleBlocks = Math.round(sum((tenant) => tenant.verifiedListings - tenant.titleReadyListings));
  const viewingsDue = Math.round(sum((tenant) => tenant.viewingsDue));
  const maintenanceOpen = Math.round(sum((tenant) => tenant.maintenanceOpen));
  const depositsHeld = sum((tenant) => tenant.depositsHeldGhs);
  const rentArrears = sum((tenant) => tenant.rentArrearsGhs);
  const pipeline = sum((tenant) => tenant.salesPipelineGhs) * currentWindow.factor;
  const compactMoney = formatterFor(currency, true);
  const totalWindowValue = pipeline + depositsHeld * currentWindow.factor;
  const locationCount = scoped.reduce((total, entry) => total + entry.locations.length, 0);

  const flow = [
    { label: 'Qualified property intent', value: qualifiedDemand },
    { label: 'Title-ready match', value: Math.round(qualifiedDemand * 0.73) },
    { label: 'Viewing completed', value: Math.round(qualifiedDemand * 0.5) },
    { label: 'Controlled offer', value: controlledOffers },
    { label: 'Deposit secured', value: Math.round(controlledOffers * 0.69) },
    { label: 'Agreement / handover', value: Math.round(controlledOffers * 0.51) },
  ];
  const trend = trendLabels[windowKey].map((period, index) => ({ period, value: convert(totalWindowValue * weights[index], currency) }));
  const ageByIndex = [12, 34, 52, 180, 520, 960, 2400, 7600, 18000, 42000, 72000, 110000];
  const events = scoped.flatMap((entry) => entry.tenant.evidence.map((evidence, index) => ({ ...evidence, tenantName: entry.tenant.name, age: ageByIndex[(index + portfolio.tenants.indexOf(entry.tenant) * 3) % ageByIndex.length] }))).filter((event) => event.age <= currentWindow.maxAge).sort((left, right) => left.age - right.age);
  const cityPulse = [...new Set(scoped.flatMap((entry) => entry.locations.map((location) => `${location.country}|${location.city}`)))].map((key) => {
    const [country, city] = key.split('|');
    const locations = scoped.flatMap((entry) => entry.locations).filter((location) => location.country === country && location.city === city);
    return { country, city, offices: locations.length, supply: locations.reduce((total, location) => total + location.availableProperties, 0), demand: locations.reduce((total, location) => total + location.qualifiedDemand, 0), deposits: locations.reduce((total, location) => total + location.depositsHeldGhs, 0) };
  }).sort((left, right) => right.demand - left.demand);
  const constraintLabels = ['Title / mandate gap', 'Rental vacancy', 'Demand pressure', 'Rent arrears', 'Maintenance load'];
  const constraints = scoped.map(({ tenant }) => ({ tenant, values: [
    Math.round(100 - percent(tenant.titleReadyListings, tenant.verifiedListings)),
    Math.round(100 - percent(tenant.occupiedRentalUnits, tenant.rentalUnits)),
    Math.min(100, Math.round(tenant.qualifiedDemand / Math.max(1, tenant.availableProperties) * 16)),
    Math.min(100, Math.round(percent(tenant.rentArrearsGhs, tenant.rentRollGhs) * 5)),
    Math.min(100, Math.round(tenant.maintenanceOpen / Math.max(1, tenant.activeProperties) * 700)),
  ] }));

  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-12">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300"><Radio size={13} /> Estate central</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">Estate command</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-gray-500">Control verified property supply, demand, title, viewings, deposits, rentals, land, and maintenance across every Estate tenant.</p></div><button type="button" onClick={() => navigate('/estate/tenants')} className="flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/[0.06] px-4 text-[9px] text-emerald-200">Open Estate Tenant Control <ArrowRight size={12} /></button></header>

    <GlassPanel className="rounded-xl p-3"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-1.5" aria-label="Estate command period">{windows.map((option) => <button key={option.key} type="button" onClick={() => setWindowKey(option.key)} className={`min-h-9 rounded-lg px-3 text-[9px] font-medium ${windowKey === option.key ? 'bg-emerald-300 text-black' : 'border border-white/[0.08] bg-black/20 text-gray-400'}`}>{option.label}</button>)}</div><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-lg border border-white/[0.08] bg-black/20 p-1" aria-label="Estate reporting currency">{(['GHS', 'USD'] as CurrencyKey[]).map((item) => <button key={item} type="button" onClick={() => setCurrency(item)} className={`min-h-8 rounded-md px-3 text-[9px] font-mono ${currency === item ? 'bg-white text-black' : 'text-gray-500'}`}>{item}</button>)}</div><label className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-[9px] text-gray-400"><Globe2 size={13} className="text-emerald-300" /><span className="sr-only">Estate geographic scope</span><select value={scope} onChange={(event) => setScope(event.target.value)} className="bg-transparent text-gray-200 outline-none"><option value="Global">Global</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select></label><button type="button" onClick={refresh} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400"><RefreshCw size={12} /> Refresh</button></div></div><div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-white/[0.05] pt-3 text-[8px] font-mono uppercase tracking-wider text-gray-600"><span>{currentWindow.label} · {scope} · {scoped.length} tenants · {locationCount} offices</span><span>{currency === 'USD' ? `Demonstration FX basis: ${GHS_PER_USD} GHS/USD` : 'Local reporting basis: GHS'}</span></div></GlassPanel>

    <section aria-label="Estate command measures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Kpi label="Controlled value" value={compactMoney.format(convert(totalWindowValue, currency))} detail="Sales pipeline and controlled deposits in this window" icon={CircleDollarSign} /><Kpi label="Title / mandate blocks" value={count.format(titleBlocks)} detail="Verified listings not yet title-ready" icon={ShieldCheck} tone="text-rose-300" /><Kpi label="Viewings due" value={count.format(viewingsDue)} detail="Confirmed access and inspection work requiring coordination" icon={CalendarCheck} tone="text-cyan-300" /><Kpi label="Deposits controlled" value={compactMoney.format(convert(depositsHeld, currency))} detail="Funds held behind title, agreement, or handover controls" icon={HandCoins} tone="text-amber-200" /><Kpi label="Rent arrears" value={compactMoney.format(convert(rentArrears, currency))} detail="Outstanding rent requiring collection or case action" icon={Banknote} tone="text-rose-300" /><Kpi label="Maintenance open" value={count.format(maintenanceOpen)} detail="Occupied and managed property service cases" icon={Wrench} tone="text-violet-300" /></section>

    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"><GlassPanel className="rounded-xl p-5"><div className="flex justify-between"><div><h2 className="text-sm font-medium text-white">Controlled estate value velocity</h2><p className="mt-1 text-[9px] text-gray-600">Value moving through BLKK-mediated Estate workflows in the selected window.</p></div><Landmark size={16} className="text-emerald-300" /></div><div className="mt-4 h-[270px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="estateValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.35} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value) => compactMoney.format(Number(value))} /><Tooltip content={<ChartTooltip currency={currency} />} /><Area type="monotone" dataKey="value" name="Controlled value" stroke="#34d399" strokeWidth={2} fill="url(#estateValue)" /></AreaChart></ResponsiveContainer></div></GlassPanel><GlassPanel className="rounded-xl p-5"><div className="flex justify-between"><div><h2 className="text-sm font-medium text-white">Verified demand path</h2><p className="mt-1 text-[9px] text-gray-600">Intent → title-ready match → viewing → BLKK-controlled offer → deposit → handover.</p></div><KeyRound size={16} className="text-amber-200" /></div><div className="mt-5 space-y-2.5">{flow.map((stage, index) => { const width = flow[0].value ? Math.max(10, stage.value / flow[0].value * 100) : 10; const loss = index ? flow[index - 1].value - stage.value : 0; return <div key={stage.label}><div className="mb-1 flex justify-between text-[9px]"><span className="text-gray-300">{stage.label}</span><span className="font-mono text-gray-400">{stage.value}{index > 0 && <span className="ml-2 text-rose-300">-{loss}</span>}</span></div><div className="h-6 rounded bg-white/[0.04]"><div className="flex h-full items-center rounded bg-gradient-to-r from-emerald-400/80 to-emerald-300/20 px-2 font-mono text-[8px] text-black" style={{ width: `${width}%` }}>{Math.round(width)}%</div></div></div>; })}</div></GlassPanel></section>

    <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]"><GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Estate intervention queue</h2><p className="mt-1 text-[9px] text-gray-600">Title, access, agreement, deposit, lease, and maintenance signals inside the selected scope.</p></div><AlertTriangle size={16} className="text-rose-300" /></div>{events.length ? <div className="divide-y divide-white/[0.06]">{events.slice(0, 9).map((event) => <button key={event.id} onClick={() => navigate(event.route)} className="grid w-full gap-3 px-5 py-4 text-left hover:bg-white/[0.025] md:grid-cols-[75px_1fr_160px_90px]"><span className={`w-fit rounded border px-2 py-1 text-[8px] font-mono uppercase ${severityClass(event.state)}`}>{event.state}</span><span><span className="block text-[11px] text-white">{event.subject}</span><span className="mt-1 block text-[9px] text-gray-600">{event.detail}</span></span><span><span className="block text-[9px] text-gray-300">{event.tenantName}</span><span className="mt-1 block text-[8px] text-gray-600">{event.location}</span></span><span className="flex items-center justify-end gap-2 font-mono text-[8px] text-gray-500">{event.exposureGhs ? compactMoney.format(convert(event.exposureGhs, currency)) : event.domain}<ArrowRight size={11} /></span></button>)}</div> : <div className="p-10 text-center text-[10px] text-gray-500">No Estate intervention signals fall inside this exact window.</div>}</GlassPanel><GlassPanel className="overflow-hidden rounded-xl"><div className="border-b border-white/[0.08] px-5 py-4"><h2 className="text-sm font-medium text-white">City and market pulse</h2><p className="mt-1 text-[9px] text-gray-600">Where verified supply and qualified property demand are concentrated.</p></div><div className="divide-y divide-white/[0.06]">{cityPulse.map((market) => <div key={`${market.country}-${market.city}`} className="p-5"><div className="flex items-center gap-2 text-xs text-white"><MapPin size={13} className="text-emerald-300" />{market.city}, {market.country}</div><div className="mt-4 grid grid-cols-4 gap-2">{[[market.offices, 'Offices'], [market.supply, 'Available'], [market.demand, 'Demand'], [compactMoney.format(convert(market.deposits, currency)), 'Deposits']].map(([value, label]) => <div key={label}><div className="font-mono text-[10px] text-gray-200">{value}</div><div className="mt-1 text-[7px] uppercase text-gray-700">{label}</div></div>)}</div></div>)}</div></GlassPanel></section>

    <GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Cross-tenant Estate constraint heatmap</h2><p className="mt-1 text-[9px] text-gray-600">Normalized pressure shows whether title, vacancy, demand, collection, or maintenance is binding each tenant.</p></div><ClipboardCheck size={16} className="text-emerald-300" /></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="border-b border-white/[0.06] bg-white/[0.02] text-[8px] font-mono uppercase tracking-wider text-gray-600"><tr><th className="px-5 py-3">Estate tenant</th>{constraintLabels.map((label) => <th key={label} className="px-3 py-3">{label}</th>)}<th className="px-5 py-3" /></tr></thead><tbody>{constraints.map(({ tenant, values }) => <tr key={tenant.id} className="border-b border-white/[0.05]"><td className="px-5 py-4"><div className="text-[11px] text-white">{tenant.name}</div><div className="mt-2"><SourceBadge tenant={tenant} /></div></td>{values.map((value, index) => <td key={constraintLabels[index]} className="px-3 py-4"><span className={`inline-flex min-w-14 justify-center rounded border px-2 py-2 font-mono text-[9px] ${pressureClass(value)}`}>{value}%</span></td>)}<td className="px-5 py-4"><button onClick={() => navigate(`/estate/tenant/${tenant.id}`)} className="text-emerald-300"><ArrowRight size={13} /></button></td></tr>)}</tbody></table></div></GlassPanel>
  </motion.div>;
};

const EstateTenantControl = ({ portfolio, refresh }: { portfolio: EstatePortfolioSnapshot; refresh: () => void }) => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('prime_accra');
  const selected = portfolio.tenants.find((tenant) => tenant.id === selectedId) ?? portfolio.tenants[0];
  const propertyMix = Object.entries(selected.propertyMix).map(([name, value]) => ({ name, value }));
  const comparison = portfolio.tenants.map((tenant) => ({ name: tenant.name.replace('Prime Accra Realty', 'Prime Accra').replace('Lagos Habitat Partners', 'Lagos Habitat'), verified: tenant.verifiedListings, titleReady: tenant.titleReadyListings, offers: tenant.controlledOffers }));
  const occupancy = percent(selected.occupiedRentalUnits, selected.rentalUnits);
  const titleReadiness = percent(selected.titleReadyListings, selected.verifiedListings);

  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-12">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300"><Building2 size={13} /> Estate portfolio</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">Estate Tenant Control</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-gray-500">Compare estate companies, then inspect one tenant’s verified supply, rentals, land, controlled transactions, offices, and source evidence.</p></div><div className="flex gap-2"><button onClick={() => navigate('/estate')} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400">Estate Command <ArrowRight size={12} /></button><button onClick={refresh} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400"><RefreshCw size={12} /> Refresh</button></div></header>

    <section aria-label="Estate tenant portfolio measures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Kpi label="Estate tenants" value={count.format(portfolio.tenants.length)} detail="Agencies, landlords, developers, and managers" icon={Building2} /><Kpi label="Available properties" value={count.format(portfolio.availableProperties)} detail={`${count.format(portfolio.activeProperties)} active properties across portfolios`} icon={House} /><Kpi label="Rental occupancy" value={`${percent(portfolio.occupiedRentalUnits, portfolio.rentalUnits).toFixed(1)}%`} detail={`${portfolio.occupiedRentalUnits}/${portfolio.rentalUnits} rental units occupied`} icon={KeyRound} /><Kpi label="Land plots" value={count.format(portfolio.landPlots)} detail="Surveyed and controlled land supply" icon={Landmark} /><Kpi label="Deposits held" value={compactGhs.format(portfolio.depositsHeldGhs)} detail="Escrow and reservation funds under control" icon={HandCoins} tone="text-amber-200" /><Kpi label="Exceptions" value={count.format(portfolio.exceptions)} detail="Title, viewing, lease, deposit, and maintenance actions" icon={AlertTriangle} tone="text-rose-300" /></section>

    <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"><GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Estate tenant operating position</h2><p className="mt-1 text-[9px] text-gray-600">Select a tenant to update the asset mix, office contribution, commercial controls, and evidence below.</p></div><BadgeCheck size={16} className="text-emerald-300" /></div><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left"><thead className="border-b border-white/[0.06] bg-white/[0.02] text-[8px] font-mono uppercase tracking-wider text-gray-600"><tr><th className="px-5 py-3">Estate tenant</th><th className="px-3 py-3">Available</th><th className="px-3 py-3">Rentals</th><th className="px-3 py-3">Land</th><th className="px-3 py-3">Title ready</th><th className="px-3 py-3">Demand</th><th className="px-3 py-3">Deposits</th><th className="px-3 py-3">Actions</th><th className="px-5 py-3" /></tr></thead><tbody>{portfolio.tenants.map((tenant) => <tr key={tenant.id} onClick={() => setSelectedId(tenant.id)} className={`cursor-pointer border-b border-white/[0.05] text-[10px] hover:bg-white/[0.025] ${selected.id === tenant.id ? 'bg-emerald-300/[0.06]' : ''}`}><td className="px-5 py-4"><div className="text-xs font-medium text-white">{tenant.name}</div><div className="mt-2"><SourceBadge tenant={tenant} /></div></td><td className="px-3 py-4 text-gray-200">{tenant.availableProperties}</td><td className="px-3 py-4 text-gray-200">{tenant.occupiedRentalUnits}/{tenant.rentalUnits}</td><td className="px-3 py-4 text-gray-200">{tenant.landPlots}</td><td className="px-3 py-4 font-mono text-gray-200">{percent(tenant.titleReadyListings, tenant.verifiedListings).toFixed(1)}%</td><td className="px-3 py-4 text-gray-200">{tenant.qualifiedDemand}</td><td className="px-3 py-4 font-mono text-gray-200">{compactGhs.format(tenant.depositsHeldGhs)}</td><td className="px-3 py-4 text-rose-200">{tenant.exceptions}</td><td className="px-5 py-4"><ArrowRight size={13} className="text-gray-600" /></td></tr>)}</tbody></table></div></GlassPanel><GlassPanel className="rounded-xl p-5"><div className="flex items-start justify-between"><div><div className="font-mono text-[8px] uppercase tracking-wider text-emerald-300">Selected Estate tenant</div><h2 className="mt-2 text-base font-medium text-white">{selected.name}</h2><p className="mt-1 text-[9px] text-gray-600">{selected.kind}</p></div><SourceBadge tenant={selected} /></div><div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07]">{[['Title readiness', `${titleReadiness.toFixed(1)}%`], ['Rental occupancy', `${occupancy.toFixed(1)}%`], ['Rent roll', compactGhs.format(selected.rentRollGhs)], ['Sales pipeline', compactGhs.format(selected.salesPipelineGhs)], ['Viewings due', String(selected.viewingsDue)], ['Maintenance', String(selected.maintenanceOpen)]].map(([label, value]) => <div key={label} className="bg-[#090909] p-3"><div className="font-mono text-[7px] uppercase text-gray-600">{label}</div><div className="mt-2 text-[10px] text-gray-300">{value}</div></div>)}</div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => navigate(`/estate/tenant/${selected.id}/analytics`)} className="flex min-h-11 items-center justify-between rounded-lg bg-emerald-300 px-4 text-[10px] font-semibold text-black">Analytics <ArrowRight size={13} /></button><button onClick={() => navigate(`/estate/tenant/${selected.id}/erp`)} className="flex min-h-11 items-center justify-between rounded-lg border border-white/[0.09] px-4 text-[10px] text-gray-300">ERP <ArrowRight size={13} /></button></div></GlassPanel></section>

    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"><GlassPanel className="rounded-xl p-5"><div><h2 className="text-sm font-medium text-white">Tenant readiness comparison</h2><p className="mt-1 text-[9px] text-gray-600">Verified supply narrows through title readiness to controlled offers.</p></div><div className="mt-4 h-[270px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="verified" name="Verified listings" fill="#22d3ee" radius={[4, 4, 0, 0]} /><Bar dataKey="titleReady" name="Title ready" fill="#34d399" radius={[4, 4, 0, 0]} /><Bar dataKey="offers" name="Controlled offers" fill="#fbbf24" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></GlassPanel><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">{selected.name} asset mix</h2><p className="mt-1 text-[9px] text-gray-600">Residential sales, rentals, commercial property, land, and developments remain distinct asset classes.</p><div className="mt-3 h-[220px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={propertyMix} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>{propertyMix.map((item, index) => <Cell key={item.name} fill={colours[index % colours.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="space-y-2">{propertyMix.map((item, index) => <div key={item.name} className="flex justify-between text-[9px]"><span className="flex items-center gap-2 text-gray-400"><span className="h-2 w-2 rounded-full" style={{ background: colours[index % colours.length] }} />{item.name}</span><span className="font-mono text-gray-300">{item.value}</span></div>)}</div></GlassPanel></section>

    <GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">{selected.name} office and portfolio contribution</h2><p className="mt-1 text-[9px] text-gray-600">Tenant → country → city → office → portfolio. Selection above controls every card.</p></div><MapPin size={16} className="text-emerald-300" /></div><div className="grid gap-px bg-white/[0.06] md:grid-cols-2 xl:grid-cols-3">{selected.locations.map((location) => <button key={`${location.office}-${location.portfolio}`} onClick={() => navigate(`/estate/tenant/${selected.id}/erp/property-register`)} className="bg-[#090909] p-4 text-left hover:bg-emerald-300/[0.04]"><div className="font-mono text-[8px] uppercase text-gray-600">{location.country} / {location.city}</div><div className="mt-2 text-xs text-white">{location.office}</div><div className="mt-1 text-[9px] text-gray-500">{location.portfolio}</div><div className="mt-4 grid grid-cols-4 gap-2">{[[compactGhs.format(location.portfolioValueGhs), 'Value'], [location.availableProperties, 'Available'], [location.vacantRentalUnits, 'Vacant'], [location.landPlots, 'Plots']].map(([value, label]) => <div key={label}><div className="font-mono text-[9px] text-gray-200">{value}</div><div className="mt-1 text-[7px] uppercase text-gray-700">{label}</div></div>)}</div><div className="mt-3 flex justify-between border-t border-white/[0.05] pt-3 text-[8px] text-gray-600"><span>{location.qualifiedDemand} qualified intents · {compactGhs.format(location.depositsHeldGhs)} deposits</span><ArrowRight size={11} /></div></button>)}</div></GlassPanel>

    <GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">{selected.name} governed Estate evidence</h2><p className="mt-1 text-[9px] text-gray-600">Property, title, inspection, lease, deposit, and maintenance cases only.</p></div><Database size={16} className="text-emerald-300" /></div><div className="divide-y divide-white/[0.06]">{selected.evidence.map((item) => <button key={item.id} onClick={() => navigate(item.route)} className="grid w-full gap-3 px-5 py-4 text-left hover:bg-white/[0.025] md:grid-cols-[90px_1fr_180px_100px]"><span className={`w-fit rounded border px-2 py-1 text-[8px] font-mono ${severityClass(item.state)}`}>{item.id}</span><span><span className="block text-[11px] text-white">{item.subject}</span><span className="mt-1 block text-[9px] text-gray-600">{item.detail}</span></span><span className="text-[9px] text-gray-400">{item.domain} · {item.location}</span><span className="flex items-center justify-end gap-2 font-mono text-[9px] text-gray-300">{item.exposureGhs ? compactGhs.format(item.exposureGhs) : item.state}<ArrowRight size={11} /></span></button>)}</div></GlassPanel>
  </motion.div>;
};

export const EstateCommandWorkspace = ({ view = 'command' }: { view?: EstateView }) => {
  const [revision, setRevision] = useState(0);
  const portfolio = useMemo(() => buildEstatePortfolio(), [revision]);
  const refresh = () => setRevision((value) => value + 1);
  return view === 'tenants' ? <EstateTenantControl portfolio={portfolio} refresh={refresh} /> : <EstateCommand portfolio={portfolio} refresh={refresh} />;
};
