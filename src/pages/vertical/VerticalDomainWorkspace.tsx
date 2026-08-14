import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Database,
  Download,
  Gauge,
  Network,
  RefreshCw,
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
  Line,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { DomainFilterBar, useDomainFilters, type DomainFilterState } from '../../components/analytics/DomainFilterBar';
import { GlassPanel } from '../../components/ui/GlassPanel';
import type { ERPModuleDefinition, ERPWorkspaceDefinition } from '../../config/erpWorkspaces';
import {
  domainSeedsForModule,
  familyForModule,
  VERTICAL_DOMAIN_CONTRACTS,
  type DomainFamily,
  type DomainStatus,
  type DomainVerticalId,
} from '../../data/verticalDomainContracts';
import { domainModuleSeeds, getDomainModuleProfile } from '../../data/verticalModuleProfiles';
import { getTenantsByVertical } from '../../data/mockAnalyticsData';

export interface DomainRecord {
  id: string;
  subject: string;
  segment: string;
  owner: string;
  age: string;
  impact: string;
  action: string;
  status: DomainStatus;
  tenantId: string;
  tenant: string;
  country: string;
  city: string;
  branch: string;
  site: string;
  channel: string;
  facet: string;
  ageMinutes: number;
  date: string;
  value: number;
  route: string;
}

const compactMoney = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', notation: 'compact', maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('en-GH');
const palette = ['#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#60a5fa'];
const statuses: DomainStatus[] = ['Critical', 'At risk', 'Watch', 'On track'];

const hash = (value: string) => [...value].reduce((total, char) => total + char.charCodeAt(0), 0);
const toCurrency = (value: number, currency: DomainFilterState['currency']) => currency === 'USD' ? value / 15.65 : value;
const moneyFor = (currency: DomainFilterState['currency']) => new Intl.NumberFormat(currency === 'GHS' ? 'en-GH' : 'en-US', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 });

export const familyForVerticalModule = (verticalId: DomainVerticalId, moduleId: string): DomainFamily => {
  const moduleProfile = getDomainModuleProfile(verticalId, moduleId);
  if (moduleProfile) return moduleProfile.family;
  if (verticalId === 'label' && moduleId === 'collections') return 'asset';
  return familyForModule(moduleId);
};

const isoDateBefore = (days: number) => {
  const date = new Date('2026-08-08T12:00:00Z');
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

export const getDomainFacet = (family: DomainFamily) => {
  const facets: Record<DomainFamily, [string, string[]]> = {
    tenant: ['Entity state', ['Connected', 'Simulation', 'Review required']],
    asset: ['Asset state', ['Available', 'Reserved', 'Evidence incomplete', 'Restricted']],
    operations: ['Work state', ['Queued', 'In progress', 'Quality check', 'Released']],
    workflow: ['Journey stage', ['Intake', 'Confirmed', 'Assigned', 'Completed']],
    logistics: ['Route state', ['Planned', 'Dispatched', 'In transit', 'Delivered']],
    money: ['Funds state', ['Initiated', 'Held', 'Reconciled', 'Released', 'Overdue']],
    customer: ['Customer stage', ['New', 'Qualified', 'Active', 'Repeat', 'At risk']],
    workforce: ['Capacity band', ['Available', 'Balanced', 'High load', 'Over capacity']],
    growth: ['Attribution stage', ['Reach', 'Qualified intent', 'Conversion', 'Retained']],
    trust: ['Control state', ['Evidence due', 'Under review', 'Approved', 'Restricted']],
    audit: ['Evidence type', ['Identity', 'Asset', 'Transaction', 'Payment', 'Approval']],
    technology: ['Sync state', ['Online', 'Queued', 'Retrying', 'Failed']],
  };
  return facets[family];
};

const questionFor = (family: DomainFamily, label: string, assets: string, outcome: string) => {
  const questions: Record<DomainFamily, string> = {
    tenant: `Which operating tenants contribute to ${label}, and where does one need intervention?`,
    asset: `Which ${assets} are genuinely available, controlled, and ready to progress through ${label}?`,
    operations: `Where is ${label} capacity, quality, or cycle time blocking the next accepted outcome?`,
    workflow: `Where does work stall in ${label} before it becomes a ${outcome}?`,
    logistics: `Which ${label} route, handoff, or proof condition threatens a promised outcome?`,
    money: `Which value in ${label} is earned, held, due, unmatched, releasable, or exposed?`,
    customer: `Which customer intent should ${label} progress next and why?`,
    workforce: `Who has the right capacity and quality for ${label}, and where is load binding?`,
    growth: `Which ${label} source produces qualified, attributable outcomes rather than empty activity?`,
    trust: `Which ${label} claim can be accepted, and which requires evidence or restriction?`,
    audit: `Can every ${label} claim be reproduced from actor, time, place, record, and original evidence?`,
    technology: `Which ${label} payloads are fresh, complete, retrying, or unable to reach the governed record?`,
  };
  return questions[family];
};

const decisionFor = (family: DomainFamily) => ({
  tenant: 'Compare, enter Analytics, enter ERP, or escalate a tenant constraint',
  asset: 'Publish, reserve, replenish, transfer, reprice, restrict, or retire',
  operations: 'Prioritize, assign capacity, approve, rework, or release',
  workflow: 'Qualify, progress, recover, cancel, or close',
  logistics: 'Dispatch, reroute, confirm handoff, recover, or complete',
  money: 'Collect, hold, reconcile, release, refund, provision, or investigate',
  customer: 'Match, contact, nurture, recover, retain, or close',
  workforce: 'Allocate, coach, certify, recognize, or intervene',
  growth: 'Scale, pause, retarget, improve the offer, or fix availability',
  trust: 'Approve, request proof, restrict, quarantine, or escalate',
  audit: 'Accept, reproduce, export, reopen, or request source evidence',
  technology: 'Retry, reconcile, quarantine, restore, or escalate',
}[family]);

export const buildDomainModuleRecords = (verticalId: DomainVerticalId, moduleId: string): DomainRecord[] => {
  const contract = VERTICAL_DOMAIN_CONTRACTS[verticalId];
  const tenants = getTenantsByVertical(verticalId);
  const exactSeeds = domainModuleSeeds(verticalId, moduleId);
  const seeds = exactSeeds.length ? exactSeeds : domainSeedsForModule(verticalId, moduleId);
  const family = familyForVerticalModule(verticalId, moduleId);
  const [, facetOptions] = getDomainFacet(family);
  const prefix = `${verticalId.slice(0, 3).toUpperCase()}-${moduleId.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase() || 'CMD'}`;
  return seeds.map((item, index) => {
    const tenant = tenants[index % tenants.length];
    const place = contract.locations[index % contract.locations.length];
    const status = statuses[index % statuses.length];
    return {
      id: `${prefix}-${String(701 + index * 7).padStart(3, '0')}`,
      ...item,
      age: ['18 min', '52 min', '3 hr', '7 hr', '21 hr', '2 days', '5 days', '11 days'][index],
      ageMinutes: [18, 52, 180, 420, 1260, 2880, 7200, 15840][index],
      date: isoDateBefore([0, 0, 1, 3, 6, 14, 32, 72][index]),
      status,
      tenantId: tenant.id,
      tenant: tenant.name,
      ...place,
      channel: contract.channels[index % contract.channels.length],
      facet: facetOptions[index % facetOptions.length],
      value: 42000 + (hash(`${verticalId}:${moduleId}:${item.subject}`) % 28) * 19000,
      route: `/${verticalId}/tenant/${tenant.id}/analytics/${moduleId}`,
    };
  });
};

export const buildDomainCommandRecords = (verticalId: DomainVerticalId): DomainRecord[] => {
  const contract = VERTICAL_DOMAIN_CONTRACTS[verticalId];
  const tenants = getTenantsByVertical(verticalId);
  const commandFacets = ['Value flow', 'Binding constraints', 'Evidence gaps', 'Tenant contribution'];
  return contract.seeds.map((item, index) => {
    const tenant = tenants[index % tenants.length];
    const place = contract.locations[index % contract.locations.length];
    const ageMinutes = [12, 38, 74, 180, 360, 720, 1260, 2880, 5760, 11520, 25920, 48960][index] ?? 48960 + (index - 11) * 10080;
    const ageDays = [0, 0, 0, 1, 2, 4, 6, 12, 21, 33, 61, 94][index] ?? 94 + (index - 11) * 7;
    return {
      id: `${verticalId.slice(0, 3).toUpperCase()}-CMD-${String(801 + index * 7).padStart(3, '0')}`,
      ...item,
      age: ['12 min', '38 min', '74 min', '3 hr', '6 hr', '12 hr', '21 hr', '2 days', '4 days', '8 days', '18 days', '34 days'][index],
      ageMinutes,
      date: isoDateBefore(ageDays),
      status: statuses[index % statuses.length],
      tenantId: tenant.id,
      tenant: tenant.name,
      ...place,
      channel: contract.channels[index % contract.channels.length],
      facet: commandFacets[index % commandFacets.length],
      value: 68000 + (hash(`${verticalId}:command:${item.subject}`) % 36) * 27000,
      route: `/${verticalId}/tenant/${tenant.id}/analytics`,
    };
  });
};

const withinPeriod = (record: Pick<DomainRecord, 'ageMinutes' | 'date'>, filters: DomainFilterState) => {
  if (filters.period === 'custom') {
    return (!filters.from || record.date >= filters.from) && (!filters.to || record.date <= filters.to);
  }
  const ceiling: Record<Exclude<DomainFilterState['period'], 'custom'>, number> = {
    'real-time': 60,
    today: 1440,
    '7d': 10080,
    '30d': 43200,
    ytd: Number.POSITIVE_INFINITY,
  };
  return record.ageMinutes <= ceiling[filters.period];
};

export const filterDomainRecords = (records: DomainRecord[], filters: DomainFilterState) => records.filter((item) =>
  withinPeriod(item, filters)
  && (filters.country === 'all' || item.country === filters.country)
  && (filters.city === 'all' || item.city === filters.city)
  && (filters.tenant === 'all' || item.tenantId === filters.tenant)
  && (filters.branch === 'all' || item.branch === filters.branch)
  && (filters.site === 'all' || item.site === filters.site)
  && (filters.status === 'all' || item.status === filters.status)
  && (filters.actor === 'all' || item.owner === filters.actor)
  && (filters.facet === 'all' || item.facet === filters.facet));

const statusTone = (status: DomainStatus) => ({
  Critical: 'border-rose-400/25 bg-rose-400/[0.08] text-rose-200',
  'At risk': 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200',
  Watch: 'border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-200',
  'On track': 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200',
}[status]);

const Metric = ({ label, value, detail, tone = 'text-white' }: { label: string; value: string; detail: string; tone?: string }) => <GlassPanel className="rounded-xl p-4"><div className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-600">{label}</div><div className={`mt-3 text-xl font-semibold ${tone}`}>{value}</div><div className="mt-2 text-[9px] leading-relaxed text-gray-600">{detail}</div></GlassPanel>;

export const DomainPrimaryVisual = ({ family, records, verticalId, pipeline }: { family: DomainFamily; records: DomainRecord[]; verticalId: DomainVerticalId; pipeline: string[] }) => {
  const bars = records.map((item, index) => ({ name: item.subject.split(' ').slice(0, 2).join(' '), value: item.value, volume: 18 + (hash(item.id) % 74), risk: item.status === 'Critical' ? 88 : item.status === 'At risk' ? 64 : item.status === 'Watch' ? 42 : 18, index }));
  const trend = ['W1', 'W2', 'W3', 'W4', 'Now'].map((name, index) => ({ name, value: records.reduce((sum, item) => sum + item.value, 0) * (0.13 + index * 0.025), exceptions: Math.max(1, records.length + 4 - index) }));
  const stages = pipeline.map((name, index) => ({ name, value: Math.max(8, Math.round(1840 * Math.pow(0.76, index) * (0.9 + (hash(verticalId) % 11) / 100))) }));
  const mix = bars.slice(0, 5).map((item) => ({ name: item.name, value: item.volume }));

  if (family === 'workflow' || family === 'growth') return <div className="space-y-3 pt-2">{stages.map((stage, index) => { const width = Math.max(10, stage.value / stages[0].value * 100); return <div key={stage.name}><div className="mb-1 flex justify-between text-[9px]"><span className="text-gray-400">{stage.name}</span><span className="font-mono text-gray-300">{integer.format(stage.value)}{index > 0 && <span className="ml-2 text-rose-300">−{integer.format(stages[index - 1].value - stage.value)}</span>}</span></div><div className="h-8 rounded bg-white/[0.04]"><div className="flex h-full items-center rounded bg-gradient-to-r from-vertical-accent to-vertical-accent/25 px-3 font-mono text-[8px] text-black" style={{ width: `${width}%` }}>{width.toFixed(1)}%</div></div></div>; })}</div>;

  if (family === 'money' || family === 'technology') return <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#64748b" /><YAxis tick={{ fontSize: 9 }} stroke="#64748b" /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /><Area dataKey="value" name="Controlled value" stroke="#34d399" fill="#34d39920" /><Line dataKey="exceptions" name="Exceptions" stroke="#fb7185" /></AreaChart></ResponsiveContainer>;

  if (family === 'workforce' || family === 'customer') return <ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid stroke="rgba(255,255,255,.05)" /><XAxis type="number" dataKey="volume" name="Workload" stroke="#64748b" tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="risk" name="Risk / opportunity" stroke="#64748b" tick={{ fontSize: 9 }} /><ZAxis type="number" dataKey="value" range={[140, 720]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Scatter data={bars} fill="#22d3ee" /></ScatterChart></ResponsiveContainer>;

  if (family === 'trust') return <ResponsiveContainer width="100%" height="100%"><RadialBarChart innerRadius="18%" outerRadius="95%" data={bars.slice(0, 5).map((item, index) => ({ ...item, fill: palette[index] }))} startAngle={90} endAngle={-270}><RadialBar dataKey="risk" background label={{ fill: '#d1d5db', fontSize: 8, position: 'insideStart' }} /><Legend wrapperStyle={{ fontSize: 9 }} /><Tooltip /></RadialBarChart></ResponsiveContainer>;

  if (family === 'audit') return <div className="grid h-full place-items-center"><div className="w-full max-w-2xl space-y-3">{['Tenant operating record', 'Actor + time + location', 'Domain control and approval', 'Vertical projection', 'Decision or institutional claim'].map((item, index) => <div key={item} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-vertical-accent/30 font-mono text-[9px] text-vertical-accent">{index + 1}</span><div className="flex-1 rounded-lg border border-white/[0.07] p-3 text-[10px] text-gray-300">{item}</div>{index < 4 && <ArrowRight size={12} className="text-gray-700" />}</div>)}</div></div>;

  if (family === 'asset' || family === 'operations' || family === 'logistics') return <ResponsiveContainer width="100%" height="100%"><BarChart data={bars.slice(0, 6)}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 8 }} stroke="#64748b" /><YAxis tick={{ fontSize: 9 }} stroke="#64748b" /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="volume" name="Volume / throughput" fill="#22d3ee" radius={[4, 4, 0, 0]} /><Bar dataKey="risk" name="Constraint pressure" fill="#fb7185" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>;

  return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={mix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={105}>{mix.map((item, index) => <Cell key={item.name} fill={palette[index]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /></PieChart></ResponsiveContainer>;
};

const Records = ({ records, navigate }: { records: DomainRecord[]; navigate: ReturnType<typeof useNavigate> }) => <GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Decision queue</h2><p className="mt-1 text-[9px] text-gray-600">Every row inherits the active custom filter and opens its owning tenant context.</p></div><Database size={15} className="text-vertical-accent" /></div>{records.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left"><thead className="border-b border-white/[0.06] bg-white/[0.02] font-mono text-[8px] uppercase tracking-wider text-gray-600"><tr><th className="px-5 py-3">Record</th><th className="px-3 py-3">Decision subject</th><th className="px-3 py-3">Tenant / place</th><th className="px-3 py-3">Owner</th><th className="px-3 py-3">Age</th><th className="px-3 py-3">Impact</th><th className="px-3 py-3">Next best action</th><th className="px-3 py-3">Status</th><th className="px-5 py-3" /></tr></thead><tbody>{records.map((item) => <tr key={item.id} className="border-b border-white/[0.05] text-[10px]"><td className="px-5 py-4 font-mono text-vertical-accent">{item.id}</td><td className="px-3 py-4"><div className="text-[11px] text-white">{item.subject}</div><div className="mt-1 text-[8px] text-gray-600">{item.segment} · {item.channel}</div></td><td className="px-3 py-4"><div className="text-gray-300">{item.tenant}</div><div className="mt-1 text-[8px] text-gray-600">{item.city} · {item.site}</div></td><td className="px-3 py-4 text-gray-400">{item.owner}</td><td className="px-3 py-4 font-mono text-gray-500">{item.age}</td><td className="px-3 py-4 text-gray-300">{item.impact}</td><td className="px-3 py-4 text-gray-300">{item.action}</td><td className="px-3 py-4"><span className={`inline-flex rounded border px-2 py-1 font-mono text-[8px] ${statusTone(item.status)}`}>{item.status}</span></td><td className="px-5 py-4"><button type="button" onClick={() => navigate(item.route)} aria-label={`Open ${item.id}`} className="text-vertical-accent"><ArrowRight size={13} /></button></td></tr>)}</tbody></table></div> : <div className="p-10 text-center text-[10px] text-gray-500">No records match this exact filter combination.</div>}</GlassPanel>;

export const VerticalModuleWorkspace = ({ workspace, module }: { workspace: ERPWorkspaceDefinition; module: ERPModuleDefinition }) => {
  const verticalId = workspace.verticalId as DomainVerticalId;
  const contract = VERTICAL_DOMAIN_CONTRACTS[verticalId];
  const moduleProfile = getDomainModuleProfile(verticalId, module.id);
  const tenants = getTenantsByVertical(verticalId);
  const family = familyForVerticalModule(verticalId, module.id);
  const [facetLabel, facetOptions] = moduleProfile?.facet ?? getDomainFacet(family);
  const namespace = `${verticalId}.${module.id || 'command'}`;
  const { filters, update, reset } = useDomainFilters(namespace);
  const navigate = useNavigate();
  const [revision, setRevision] = useState(0);
  const allRecords = useMemo(() => buildDomainModuleRecords(verticalId, module.id), [verticalId, module.id, revision]);
  const records = filterDomainRecords(allRecords, filters);
  const formatter = moneyFor(filters.currency);
  const value = records.reduce((sum, item) => sum + item.value, 0);
  const critical = records.filter((item) => item.status === 'Critical').length;
  const coverage = records.length ? Math.max(72, 98 - critical * 4) : 0;
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-12">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">{workspace.shortName} · {family} control</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{module.label}</h1><p className="mt-2 max-w-4xl text-xs leading-relaxed text-gray-500">{module.description}</p></div><div className="flex gap-2"><button type="button" onClick={() => setRevision((value) => value + 1)} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400"><RefreshCw size={12} /> Refresh</button><button type="button" onClick={() => window.print()} className="flex min-h-10 items-center gap-2 rounded-lg border border-vertical-accent/20 px-3 text-[9px] text-vertical-accent"><Download size={12} /> Export</button></div></header>
    <DomainFilterBar label={namespace} tenants={tenants} locations={contract.locations} actors={contract.actors} facetLabel={facetLabel} facetOptions={facetOptions} filters={filters} update={update} reset={reset} />
    <GlassPanel className="rounded-xl p-4"><div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]"><div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Question</div><div className="mt-2 text-[11px] text-gray-300">{moduleProfile?.question ?? questionFor(family, module.label, contract.assets, contract.outcome)}</div></div><ArrowRight size={14} className="hidden self-center text-vertical-accent lg:block" /><div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Decision</div><div className="mt-2 text-[11px] text-vertical-accent">{moduleProfile?.decision ?? decisionFor(family)}</div></div></div></GlassPanel>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label={moduleProfile?.measures[0] ?? 'Controlled exposure'} value={formatter.format(toCurrency(value, filters.currency))} detail={`${records.length} contributing ${moduleProfile?.noun ?? module.label.toLowerCase()} records`} /><Metric label={moduleProfile?.measures[1] ?? contract.measures[1]} value={`${coverage}%`} detail="Records meeting this page's outcome and evidence controls" tone={coverage < 85 ? 'text-amber-200' : 'text-emerald-300'} /><Metric label={moduleProfile?.measures[2] ?? contract.measures[2]} value={integer.format(records.reduce((sum, item) => sum + 18 + hash(item.id) % 41, 0))} detail={`${moduleProfile?.noun ?? contract.asset} observations in the active scope`} /><Metric label={moduleProfile?.measures[3] ?? 'Needs intervention'} value={integer.format(critical)} detail="Critical route-owned decisions inside the active filters" tone="text-rose-300" /></section>
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm text-white">{family === 'workflow' || family === 'growth' ? `${module.label} conversion` : family === 'trust' ? `${module.label} control pressure` : family === 'money' ? `${module.label} value movement` : family === 'audit' ? 'Claim-to-source lineage' : `${module.label} decision view`}</h2><p className="mt-1 text-[9px] text-gray-600">A route-specific visual; selections and totals follow the filter contract above.</p><div className="mt-4 h-[330px]"><DomainPrimaryVisual family={family} records={records} verticalId={verticalId} pipeline={moduleProfile?.pipeline ?? contract.pipeline} /></div></GlassPanel><GlassPanel className="overflow-hidden rounded-xl"><div className="border-b border-white/[0.08] p-5"><h2 className="text-sm text-white">Tenant contribution</h2><p className="mt-1 text-[9px] text-gray-600">Central control aggregates tenants; it does not replace their operating ERPs.</p></div><div className="divide-y divide-white/[0.06]">{tenants.map((tenant, index) => { const tenantRecords = allRecords.filter((item) => item.tenantId === tenant.id); return <button key={tenant.id} onClick={() => update({ tenant: filters.tenant === tenant.id ? 'all' : tenant.id })} className={`w-full p-5 text-left ${filters.tenant === tenant.id ? 'bg-vertical-accent/[0.06]' : 'hover:bg-white/[0.025]'}`}><div className="flex justify-between"><span className="text-[11px] text-white">{tenant.name}</span><span className="font-mono text-[8px] text-vertical-accent">{tenantRecords.length} records</span></div><div className="mt-4 grid grid-cols-3 gap-2">{[[formatter.format(toCurrency(tenantRecords.reduce((sum, item) => sum + item.value, 0), filters.currency)), 'Value'], [82 + index * 5, 'Coverage %'], [tenantRecords.filter((item) => item.status !== 'On track').length, 'Actions']].map(([metric, label]) => <div key={label}><div className="font-mono text-[9px] text-gray-300">{metric}</div><div className="mt-1 text-[7px] uppercase text-gray-700">{label}</div></div>)}</div></button>; })}</div></GlassPanel></section>
    <Records records={records} navigate={navigate} />
  </motion.div>;
};

const CommandVisual = ({ verticalId, records, pipeline }: { verticalId: DomainVerticalId; records: DomainRecord[]; pipeline: string[] }) => {
  const tenants = getTenantsByVertical(verticalId);
  const tenantData = tenants.map((tenant, index) => ({ name: tenant.name.split(' ').slice(0, 2).join(' '), accepted: 74 + index * 21 + hash(verticalId) % 18, constrained: 12 + index * 5, value: records.filter((item) => item.tenantId === tenant.id).reduce((sum, item) => sum + item.value, 0) }));
  if (verticalId === 'farmers' || verticalId === 'gold') return <DomainPrimaryVisual family="workflow" records={records} verticalId={verticalId} pipeline={pipeline} />;
  if (verticalId === 'susu') return <DomainPrimaryVisual family="money" records={records} verticalId={verticalId} pipeline={pipeline} />;
  if (verticalId === 'agents') return <DomainPrimaryVisual family="workforce" records={records} verticalId={verticalId} pipeline={pipeline} />;
  if (verticalId === 'label') return <ResponsiveContainer width="100%" height="100%"><BarChart data={tenantData}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#64748b" /><YAxis tick={{ fontSize: 9 }} stroke="#64748b" /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="accepted" name="Release-ready units" stackId="a" fill="#34d399" /><Bar dataKey="constrained" name="Blocked units" stackId="a" fill="#fb7185" /></BarChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={tenantData}><CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#64748b" /><YAxis tick={{ fontSize: 9 }} stroke="#64748b" /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="accepted" name="Accepted outcomes" fill="#22d3ee" /><Bar dataKey="constrained" name="Constraints" fill="#fb7185" /></BarChart></ResponsiveContainer>;
};

export const VerticalCommandWorkspace = ({ workspace }: { workspace: ERPWorkspaceDefinition }) => {
  const verticalId = workspace.verticalId as DomainVerticalId;
  const contract = VERTICAL_DOMAIN_CONTRACTS[verticalId];
  const tenants = getTenantsByVertical(verticalId);
  const namespace = `${verticalId}.command`;
  const { filters, update, reset } = useDomainFilters(namespace);
  const navigate = useNavigate();
  const [revision, setRevision] = useState(0);
  const records = useMemo(() => buildDomainCommandRecords(verticalId), [verticalId, revision]);
  const scoped = filterDomainRecords(records, filters);
  const formatter = moneyFor(filters.currency);
  const value = scoped.reduce((sum, item) => sum + item.value, 0);
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-12">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><Network size={13} /> {workspace.shortName} central</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{contract.commandName}</h1><p className="mt-2 max-w-4xl text-xs leading-relaxed text-gray-500">{contract.commandQuestion}</p></div><button type="button" onClick={() => navigate(`/${verticalId}/tenants`)} className="flex min-h-10 items-center gap-2 rounded-lg border border-vertical-accent/25 bg-vertical-accent/[0.06] px-4 text-[9px] text-vertical-accent">Open {workspace.shortName} Tenant Control <ArrowRight size={12} /></button></header>
    <DomainFilterBar label={namespace} tenants={tenants} locations={contract.locations} actors={contract.actors} facetLabel="Command focus" facetOptions={['Value flow', 'Binding constraints', 'Evidence gaps', 'Tenant contribution']} filters={filters} update={update} reset={reset} />
    <GlassPanel className="rounded-xl p-4"><div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]"><div><div className="font-mono text-[8px] uppercase text-gray-600">Central command question</div><div className="mt-2 text-[11px] text-gray-300">{contract.commandQuestion}</div></div><ArrowRight size={14} className="hidden self-center text-vertical-accent lg:block" /><div><div className="font-mono text-[8px] uppercase text-gray-600">Current decision envelope</div><div className="mt-2 text-[11px] text-vertical-accent">{contract.commandDecision}</div></div></div></GlassPanel>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Metric label="Controlled value" value={formatter.format(toCurrency(value, filters.currency))} detail={`${scoped.length} current command signals`} /><Metric label={contract.measures[0]} value={integer.format(1240 + hash(verticalId) * 2)} detail={`Accepted ${contract.outcome} measures`} tone="text-emerald-300" /><Metric label={contract.measures[1]} value={`${86 + hash(verticalId) % 9}%`} detail="Outcome quality inside target" /><Metric label={contract.measures[2]} value={integer.format(382 + hash(verticalId) % 240)} detail={`${contract.assets} in controlled scope`} /><Metric label="Tenant coverage" value={`${tenants.length}/${tenants.length}`} detail="Every listed tenant has Analytics and ERP entry" tone="text-cyan-300" /><Metric label="Critical decisions" value={integer.format(scoped.filter((item) => item.status === 'Critical').length)} detail="Binding constraints requiring accountable action" tone="text-rose-300" /></section>
    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm text-white">{verticalId === 'farmers' ? 'Farm-to-market loss and release' : verticalId === 'gold' ? 'Licensed lot-to-settlement control' : verticalId === 'susu' ? 'Safeguarded funds and settlement movement' : verticalId === 'agents' ? 'Capacity-to-accepted-evidence relationship' : verticalId === 'label' ? 'Collection release by house' : 'Tenant outcome and constraint comparison'}</h2><p className="mt-1 text-[9px] text-gray-600">The command visual is owned by this vertical's value stream.</p><div className="mt-4 h-[330px]"><CommandVisual verticalId={verticalId} records={scoped} pipeline={contract.pipeline} /></div></GlassPanel><GlassPanel className="overflow-hidden rounded-xl"><div className="border-b border-white/[0.08] p-5"><h2 className="text-sm text-white">Tenant command position</h2><p className="mt-1 text-[9px] text-gray-600">Compare entities here; operate them inside their own ERP.</p></div><div className="divide-y divide-white/[0.06]">{tenants.map((tenant, index) => <button key={tenant.id} onClick={() => navigate(`/${verticalId}/tenant/${tenant.id}`)} className="w-full p-5 text-left hover:bg-white/[0.025]"><div className="flex justify-between"><span className="text-[11px] text-white">{tenant.name}</span><ArrowRight size={12} className="text-vertical-accent" /></div><div className="mt-4 grid grid-cols-3 gap-2">{[[86 + index * 4, 'Coverage %'], [12 + index * 7, 'Decisions'], [compactMoney.format(320000 + index * 186000), 'Controlled']].map(([metric, label]) => <div key={label}><div className="font-mono text-[9px] text-gray-300">{metric}</div><div className="mt-1 text-[7px] uppercase text-gray-700">{label}</div></div>)}</div></button>)}</div></GlassPanel></section>
    <Records records={scoped} navigate={navigate} />
    <div className="flex justify-end"><button type="button" onClick={() => setRevision((value) => value + 1)} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400"><RefreshCw size={12} /> Refresh command projection</button></div>
  </motion.div>;
};

export const VerticalTenantControl = ({ workspace }: { workspace: ERPWorkspaceDefinition }) => {
  const verticalId = workspace.verticalId as DomainVerticalId;
  const contract = VERTICAL_DOMAIN_CONTRACTS[verticalId];
  const tenants = getTenantsByVertical(verticalId);
  const namespace = `${verticalId}.tenants`;
  const { filters, update, reset } = useDomainFilters(namespace);
  const navigate = useNavigate();
  const tenantRows = tenants.map((tenant, index) => ({
    tenant,
    location: contract.locations[index % contract.locations.length],
    owner: contract.actors[index % contract.actors.length],
    status: statuses[index % statuses.length],
    connection: ['Operational feed', 'Domain simulation', 'Review required'][index % 3],
    ageMinutes: [42, 2880, 8640, 20160][index % 4],
    date: isoDateBefore([0, 2, 6, 14][index % 4]),
  }));
  const visible = tenantRows.filter((row) => {
    const periodRecord = { ageMinutes: row.ageMinutes, date: row.date };
    return withinPeriod(periodRecord, filters)
      && (filters.tenant === 'all' || row.tenant.id === filters.tenant)
      && (filters.country === 'all' || row.location.country === filters.country)
      && (filters.city === 'all' || row.location.city === filters.city)
      && (filters.branch === 'all' || row.location.branch === filters.branch)
      && (filters.site === 'all' || row.location.site === filters.site)
      && (filters.actor === 'all' || row.owner === filters.actor)
      && (filters.status === 'all' || row.status === filters.status)
      && (filters.facet === 'all' || row.connection === filters.facet);
  });
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-12"><header className="border-b border-white/[0.08] pb-5"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><Building2 size={13} /> {workspace.shortName} portfolio</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{workspace.shortName} Tenant Control</h1><p className="mt-2 max-w-4xl text-xs text-gray-500">Select a tenant company, compare its governed contribution, then choose its operational ERP or analytical system.</p></header><DomainFilterBar label={namespace} tenants={tenants} locations={contract.locations} actors={contract.actors} facetLabel="Connection" facetOptions={['Operational feed', 'Domain simulation', 'Review required']} filters={filters} update={update} reset={reset} /><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Tenants in scope" value={String(visible.length)} detail={`${tenants.length} total domain tenants represented`} /><Metric label="Countries" value={String(new Set(visible.map((row) => row.location.country)).size)} detail="Country-level operating scope after filtering" /><Metric label="Branches and sites" value={String(new Set(visible.map((row) => `${row.location.branch}:${row.location.site}`)).size)} detail="Location identities after filtering" /><Metric label="Portfolio evidence" value={`${82 + hash(verticalId) % 14}%`} detail="Record-to-source coverage" tone="text-emerald-300" /></section><section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{visible.map(({ tenant, location, connection, owner }, index) => <GlassPanel key={tenant.id} className="rounded-xl p-5"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-lg border border-vertical-accent/25 bg-vertical-accent/[0.07] font-display text-vertical-accent">{tenant.name.charAt(0)}</div><span className="rounded border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-1 font-mono text-[8px] text-emerald-300">{connection}</span></div><h2 className="mt-5 text-base text-white">{tenant.name}</h2><p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-gray-600">{tenant.type.replace(/_/g, ' ')} ERP · {location.city} · {location.site}</p><p className="mt-3 text-[9px] text-gray-500">Accountable work centre: {owner}</p><div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-white/[0.07]">{[[86 + index * 5, 'Coverage %'], [18 + index * 11, 'Actions'], [compactMoney.format(420000 + index * 315000), 'Controlled']].map(([value, label]) => <div key={label} className="bg-[#090909] p-3"><div className="font-mono text-[10px] text-gray-300">{value}</div><div className="mt-1 text-[7px] uppercase text-gray-700">{label}</div></div>)}</div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => navigate(`/${verticalId}/tenant/${tenant.id}/analytics`)} className="flex min-h-11 items-center justify-between rounded-lg bg-vertical-accent px-3 text-[9px] font-semibold text-black">Analytics <Gauge size={13} /></button><button onClick={() => navigate(`/${verticalId}/tenant/${tenant.id}/erp`)} className="flex min-h-11 items-center justify-between rounded-lg border border-white/[0.09] px-3 text-[9px] text-gray-300">ERP <ArrowRight size={13} /></button></div></GlassPanel>)}</section>{visible.length === 0 && <GlassPanel className="rounded-xl p-10 text-center text-[10px] text-gray-500">No tenant matches this exact scope. Reset or widen one filter.</GlassPanel>}</motion.div>;
};
