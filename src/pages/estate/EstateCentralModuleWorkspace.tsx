import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  Building2,
  CalendarCheck,
  ContactRound,
  Download,
  FileCheck2,
  HandCoins,
  House,
  IdCard,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
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
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { GlassPanel } from '../../components/ui/GlassPanel';
import {
  buildEstatePortfolio,
  type EstateEvidence,
  type EstatePortfolioSnapshot,
  type EstateTenantSnapshot,
} from '../../estate/estatePortfolio';

type CentralModuleId =
  | 'properties'
  | 'owners'
  | 'verification'
  | 'viewings'
  | 'maintenance'
  | 'advisor-desk'
  | 'offers'
  | 'payments'
  | 'customers'
  | 'marketing'
  | 'workforce'
  | 'finance'
  | 'audit';

type VisualKind = 'supply' | 'funnel' | 'composition' | 'trend' | 'scatter' | 'evidence';

interface ModuleSpec {
  eyebrow: string;
  title: string;
  description: string;
  question: string;
  decision: string;
  icon: LucideIcon;
  visual: VisualKind;
  evidence: EstateEvidence['domain'][];
}

const MODULES: Record<CentralModuleId, ModuleSpec> = {
  properties: {
    eyebrow: 'Estate supply control',
    title: 'Properties & listings',
    description: 'Control available homes, rental units, commercial spaces, developments, and land without collapsing unlike asset classes.',
    question: 'Where is marketable property supply concentrated, and what prevents publication?',
    decision: 'Publish, reprice, complete evidence, or rebalance supply',
    icon: House,
    visual: 'supply',
    evidence: ['Property', 'Title'],
  },
  owners: {
    eyebrow: 'Authority and representation',
    title: 'Owners & mandates',
    description: 'Monitor ownership identity, signed authority, mandate expiry, portfolio concentration, and contact readiness.',
    question: 'Which owners and portfolios can BLKK represent with defensible authority?',
    decision: 'Renew, verify, restrict, or escalate a mandate',
    icon: IdCard,
    visual: 'composition',
    evidence: ['Title', 'Property'],
  },
  verification: {
    eyebrow: 'Title and trust control',
    title: 'Title & verification',
    description: 'Trace title, survey, owner identity, authority, encumbrance, inspection, and publication evidence.',
    question: 'Which listings are transaction-ready and which value is blocked by missing proof?',
    decision: 'Approve, request evidence, place a restriction, or route legal review',
    icon: ShieldCheck,
    visual: 'funnel',
    evidence: ['Title', 'Inspection'],
  },
  viewings: {
    eyebrow: 'Access and inspection control',
    title: 'Viewings & inspections',
    description: 'Coordinate qualified demand, confirmed access, advisor assignment, condition reports, attendance, and follow-up.',
    question: 'Where are confirmed property intents failing to become completed viewings and offers?',
    decision: 'Assign capacity, confirm access, recover a no-show, or release the report',
    icon: CalendarCheck,
    visual: 'funnel',
    evidence: ['Viewing', 'Inspection'],
  },
  maintenance: {
    eyebrow: 'Occupied-property service control',
    title: 'Maintenance',
    description: 'Control requests, priority, landlord approvals, vendors, estimates, SLA, completion, and tenant evidence.',
    question: 'Which maintenance constraint threatens occupancy, safety, cost, or landlord trust?',
    decision: 'Dispatch, approve, escalate, reassign, or close with evidence',
    icon: Wrench,
    visual: 'supply',
    evidence: ['Maintenance'],
  },
  'advisor-desk': {
    eyebrow: 'BLKK-mediated demand',
    title: 'Advisor & CRM',
    description: 'Match buyer, renter, investor, and corporate demand to verified property while BLKK controls communication and progression.',
    question: 'Which qualified intents should advisors progress next, against which verified property?',
    decision: 'Qualify, match, schedule, negotiate, nurture, or close',
    icon: ContactRound,
    visual: 'funnel',
    evidence: ['Viewing', 'Offer', 'Property'],
  },
  offers: {
    eyebrow: 'Controlled transaction terms',
    title: 'Offers & agreements',
    description: 'Control price and rent proposals, conditions, expiry, approvals, reservation terms, agreements, and counter-signature.',
    question: 'Where is transaction value stalling between offer, acceptance, agreement, and handover?',
    decision: 'Counter, approve, expire, document, or progress to controlled deposit',
    icon: BadgeDollarSign,
    visual: 'funnel',
    evidence: ['Offer', 'Deposit', 'Lease'],
  },
  payments: {
    eyebrow: 'Estate funds control',
    title: 'Escrow & payments',
    description: 'Separate reservation deposits, tenancy deposits, rent, service charges, releases, refunds, and arrears.',
    question: 'Which funds are held, eligible, overdue, disputed, or missing supporting conditions?',
    decision: 'Hold, release, reconcile, collect, refund, or dispute',
    icon: HandCoins,
    visual: 'composition',
    evidence: ['Deposit', 'Lease'],
  },
  customers: {
    eyebrow: 'Property demand intelligence',
    title: 'Customer intelligence',
    description: 'Understand buyer, renter, investor, landlord, and corporate demand by location, budget, asset class, and journey stage.',
    question: 'Who needs which property outcome, where, by when, and with what verified capacity?',
    decision: 'Prioritize, match, retain, recover, or protect consent',
    icon: Users,
    visual: 'composition',
    evidence: ['Viewing', 'Offer', 'Lease'],
  },
  marketing: {
    eyebrow: 'Verified-demand attribution',
    title: 'Growth & marketing',
    description: 'Connect listing and campaign spend to qualified enquiries, viewings, offers, deposits, leases, and controlled value.',
    question: 'Which campaign and listing creates verified demand rather than empty impressions?',
    decision: 'Scale, pause, reprice, improve evidence, or change audience',
    icon: Megaphone,
    visual: 'funnel',
    evidence: ['Property', 'Viewing', 'Offer'],
  },
  workforce: {
    eyebrow: 'Estate capacity and performance',
    title: 'Workforce',
    description: 'Compare advisors, listing officers, inspectors, title reviewers, property managers, and vendors by workload and outcomes.',
    question: 'Who is converting verified work well, and where is capacity or quality binding?',
    decision: 'Allocate, coach, certify, recognize, or intervene',
    icon: Users,
    visual: 'scatter',
    evidence: ['Viewing', 'Inspection', 'Maintenance', 'Title'],
  },
  finance: {
    eyebrow: 'Estate financial control',
    title: 'Finance',
    description: 'Separate rent roll, arrears, commissions, property costs, controlled deposits, releases, refunds, and sales pipeline.',
    question: 'What value is earned, collectible, controlled, committed, exposed, or ready for release?',
    decision: 'Collect, accrue, release, reconcile, provision, or investigate',
    icon: Banknote,
    visual: 'trend',
    evidence: ['Deposit', 'Lease', 'Maintenance', 'Offer'],
  },
  audit: {
    eyebrow: 'Institutional Estate evidence',
    title: 'Reports & audit',
    description: 'Trace every central Estate claim to tenant, property, actor, time, location, document, approval, and source event.',
    question: 'Can this property, title, agreement, payment, lease, or maintenance claim survive independent review?',
    decision: 'Accept, reproduce, export, request proof, or reopen control review',
    icon: FileCheck2,
    visual: 'evidence',
    evidence: ['Property', 'Title', 'Viewing', 'Inspection', 'Offer', 'Deposit', 'Lease', 'Maintenance'],
  },
};

const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0, notation: 'compact' });
const integer = new Intl.NumberFormat('en-GH');
const colours = ['#34d399', '#22d3ee', '#fbbf24', '#a78bfa', '#fb7185'];

const percent = (numerator: number, denominator: number) => denominator ? (numerator / denominator) * 100 : 0;

const Kpi = ({ label, value, detail, tone = 'text-white' }: { label: string; value: string; detail: string; tone?: string }) => (
  <GlassPanel className="rounded-xl p-4">
    <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-600">{label}</div>
    <div className={`mt-3 text-xl font-semibold ${tone}`}>{value}</div>
    <div className="mt-2 text-[9px] leading-relaxed text-gray-600">{detail}</div>
  </GlassPanel>
);

const evidenceTone = (state: EstateEvidence['state']) => state === 'Blocked'
  ? 'border-rose-400/25 bg-rose-400/[0.08] text-rose-200'
  : state === 'Watch'
    ? 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200'
    : 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200';

const metricSet = (moduleId: CentralModuleId, portfolio: EstatePortfolioSnapshot) => {
  const occupancy = percent(portfolio.occupiedRentalUnits, portfolio.rentalUnits);
  const titleReadiness = percent(portfolio.titleReadyListings, portfolio.verifiedListings);
  const offerRate = percent(portfolio.controlledOffers, portfolio.qualifiedDemand);
  const values: Record<CentralModuleId, Array<[string, string, string, string?]>> = {
    properties: [
      ['Active property records', integer.format(portfolio.activeProperties), 'Sales, rental, commercial, development, and land records'],
      ['Available now', integer.format(portfolio.availableProperties), 'Verified supply currently open to qualified demand', 'text-emerald-300'],
      ['Title-ready listings', `${titleReadiness.toFixed(1)}%`, `${portfolio.titleReadyListings} of ${portfolio.verifiedListings} verified listings`, titleReadiness < 90 ? 'text-amber-200' : 'text-emerald-300'],
      ['Land plots', integer.format(portfolio.landPlots), 'Surveyed and controlled plots remain distinct from buildings'],
    ],
    owners: [
      ['Mandates represented', integer.format(portfolio.verifiedListings), 'Listing authority attached to verified supply'],
      ['Authority ready', `${titleReadiness.toFixed(1)}%`, 'Owner identity, mandate, and property evidence ready', 'text-emerald-300'],
      ['Mandate exceptions', integer.format(portfolio.exceptions), 'Expiry, identity, authority, and document actions', 'text-rose-300'],
      ['Controlled portfolio', money.format(portfolio.salesPipelineGhs), 'Sales pipeline represented under BLKK controls'],
    ],
    verification: [
      ['Verified listings', integer.format(portfolio.verifiedListings), 'Listings that entered Estate trust control'],
      ['Transaction ready', integer.format(portfolio.titleReadyListings), 'Authority and title conditions completed', 'text-emerald-300'],
      ['Readiness rate', `${titleReadiness.toFixed(1)}%`, 'Verified supply eligible for controlled progression'],
      ['Exceptions', integer.format(portfolio.exceptions), 'Evidence or approval actions still open', 'text-rose-300'],
    ],
    viewings: [
      ['Qualified demand', integer.format(portfolio.qualifiedDemand), 'Buyer, renter, investor, and corporate intents'],
      ['Viewings due', integer.format(portfolio.tenants.reduce((sum, item) => sum + item.viewingsDue, 0)), 'Access windows requiring coordination', 'text-cyan-300'],
      ['Inspections due', integer.format(portfolio.tenants.reduce((sum, item) => sum + item.inspectionsDue, 0)), 'Condition and site evidence still outstanding', 'text-amber-200'],
      ['Offer conversion', `${offerRate.toFixed(1)}%`, 'Controlled offers per qualified intent'],
    ],
    maintenance: [
      ['Open cases', integer.format(portfolio.maintenanceOpen), 'Occupied and managed property service cases', 'text-rose-300'],
      ['Rental occupancy', `${occupancy.toFixed(1)}%`, 'Maintenance protects occupied-unit retention'],
      ['Rent roll protected', money.format(portfolio.rentRollGhs), 'Monthly rental value exposed to service quality'],
      ['Evidence exceptions', integer.format(portfolio.tenants.filter((item) => item.maintenanceOpen > 15).length), 'Tenant portfolios above the open-case threshold', 'text-amber-200'],
    ],
    'advisor-desk': [
      ['Qualified intents', integer.format(portfolio.qualifiedDemand), 'Verified demand requiring BLKK-managed progression'],
      ['Marketable supply', integer.format(portfolio.availableProperties), 'Available property records advisors can match'],
      ['Controlled offers', integer.format(portfolio.controlledOffers), 'Offers progressed by the platform'],
      ['Intent to offer', `${offerRate.toFixed(1)}%`, 'Qualified demand converting to controlled terms', 'text-emerald-300'],
    ],
    offers: [
      ['Controlled offers', integer.format(portfolio.controlledOffers), 'Sales and rental proposals under BLKK control'],
      ['Offer value', money.format(portfolio.salesPipelineGhs), 'Sales pipeline represented by active offers'],
      ['Deposits held', money.format(portfolio.depositsHeldGhs), 'Offers progressed into controlled funds', 'text-amber-200'],
      ['Offer conversion', `${offerRate.toFixed(1)}%`, 'Qualified intents reaching controlled terms'],
    ],
    payments: [
      ['Deposits controlled', money.format(portfolio.depositsHeldGhs), 'Reservation and tenancy funds held behind conditions', 'text-amber-200'],
      ['Rent roll', money.format(portfolio.rentRollGhs), 'Recurring monthly rental obligation'],
      ['Rent arrears', money.format(portfolio.rentArrearsGhs), 'Overdue rent requiring collection action', 'text-rose-300'],
      ['Arrears rate', `${percent(portfolio.rentArrearsGhs, portfolio.rentRollGhs).toFixed(1)}%`, 'Arrears relative to current monthly rent roll'],
    ],
    customers: [
      ['Qualified demand', integer.format(portfolio.qualifiedDemand), 'Buyer, renter, investor, and corporate intents'],
      ['Properties available', integer.format(portfolio.availableProperties), 'Verified supply available for matching'],
      ['Demand per property', (portfolio.qualifiedDemand / portfolio.availableProperties).toFixed(1), 'Qualified intents for each available property'],
      ['Controlled outcomes', integer.format(portfolio.controlledOffers), 'Customer intents reaching formal offer stage', 'text-emerald-300'],
    ],
    marketing: [
      ['Marketable listings', integer.format(portfolio.titleReadyListings), 'Title-ready property supply eligible for promotion'],
      ['Qualified demand', integer.format(portfolio.qualifiedDemand), 'Attributed intent—not impressions'],
      ['Viewing actions', integer.format(portfolio.tenants.reduce((sum, item) => sum + item.viewingsDue, 0)), 'Demand progressed into scheduled access'],
      ['Controlled offers', integer.format(portfolio.controlledOffers), 'Attributed commercial outcome', 'text-emerald-300'],
    ],
    workforce: [
      ['Estate specialists', integer.format(portfolio.tenants.reduce((sum, item) => sum + item.agents, 0)), 'Advisors, listing officers, inspectors, and managers'],
      ['Qualified work', integer.format(portfolio.qualifiedDemand), 'Demand workload across Estate tenants'],
      ['Offers per specialist', (portfolio.controlledOffers / portfolio.tenants.reduce((sum, item) => sum + item.agents, 0)).toFixed(1), 'Controlled offers per Estate specialist'],
      ['Open constraints', integer.format(portfolio.exceptions), 'Quality and capacity actions requiring owners', 'text-rose-300'],
    ],
    finance: [
      ['Sales pipeline', money.format(portfolio.salesPipelineGhs), 'Controlled property transaction value'],
      ['Monthly rent roll', money.format(portfolio.rentRollGhs), 'Recurring contractual rental value', 'text-emerald-300'],
      ['Deposits held', money.format(portfolio.depositsHeldGhs), 'Controlled funds not yet recognized as revenue', 'text-amber-200'],
      ['Rent arrears', money.format(portfolio.rentArrearsGhs), 'Collectible overdue rental obligations', 'text-rose-300'],
    ],
    audit: [
      ['Estate tenants', integer.format(portfolio.tenants.length), 'Contributing operating entities'],
      ['Source records', integer.format(portfolio.tenants.reduce((sum, item) => sum + item.evidence.length, 0)), 'Property, title, viewing, payment, lease, and maintenance evidence'],
      ['Locations', integer.format(portfolio.tenants.reduce((sum, item) => sum + item.locations.length, 0)), 'Country, city, office, and portfolio identities'],
      ['Open reviews', integer.format(portfolio.exceptions), 'Claims requiring additional control evidence', 'text-rose-300'],
    ],
  };
  return values[moduleId];
};

const EstateVisual = ({ kind, portfolio }: { kind: VisualKind; portfolio: EstatePortfolioSnapshot }) => {
  const supply = portfolio.tenants.map((tenant) => ({ name: tenant.name.split(' ').slice(0, 2).join(' '), available: tenant.availableProperties, demand: tenant.qualifiedDemand, maintenance: tenant.maintenanceOpen }));
  const stages = [
    { name: 'Qualified intent', value: portfolio.qualifiedDemand },
    { name: 'Title-ready match', value: Math.min(portfolio.qualifiedDemand, portfolio.titleReadyListings * 3) },
    { name: 'Viewing / inspection', value: portfolio.tenants.reduce((sum, item) => sum + item.viewingsDue + item.inspectionsDue, 0) },
    { name: 'Controlled offer', value: portfolio.controlledOffers },
    { name: 'Deposit / agreement', value: Math.round(portfolio.controlledOffers * 0.62) },
  ];
  const composition = portfolio.propertyMix;
  const trend = portfolio.monthlyControlledValue.map((item, index) => ({ ...item, rent: Math.round(portfolio.rentRollGhs * (0.88 + index * 0.024)), arrears: Math.round(portfolio.rentArrearsGhs * (1.08 - index * 0.025)) }));
  const performance = portfolio.tenants.map((tenant) => ({ name: tenant.name, capacity: tenant.agents, conversion: percent(tenant.controlledOffers, tenant.qualifiedDemand), quality: tenant.confidence, size: tenant.qualifiedDemand }));

  if (kind === 'funnel') return <div className="space-y-3 pt-3">{stages.map((stage, index) => { const width = Math.max(9, percent(stage.value, stages[0].value)); return <div key={stage.name}><div className="mb-1 flex justify-between text-[9px]"><span className="text-gray-400">{stage.name}</span><span className="font-mono text-gray-300">{integer.format(stage.value)}{index > 0 && <span className="ml-2 text-rose-300">−{integer.format(stages[index - 1].value - stage.value)}</span>}</span></div><div className="h-8 rounded bg-white/[0.04]"><div className="flex h-full items-center rounded bg-gradient-to-r from-emerald-300 to-cyan-300/35 px-3 font-mono text-[8px] text-black" style={{ width: `${width}%` }}>{width.toFixed(1)}%</div></div></div>; })}</div>;

  if (kind === 'composition') return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={composition} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={3}>{composition.map((item, index) => <Cell key={item.name} fill={colours[index % colours.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /></PieChart></ResponsiveContainer>;

  if (kind === 'trend') return <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#64748b" /><YAxis tick={{ fontSize: 9 }} stroke="#64748b" tickFormatter={(value) => money.format(Number(value))} /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /><Area dataKey="value" name="Controlled transaction value" stroke="#34d399" fill="#34d39920" /><Area dataKey="rent" name="Rent roll" stroke="#22d3ee" fill="#22d3ee12" /><Line dataKey="arrears" name="Arrears" stroke="#fb7185" /></AreaChart></ResponsiveContainer>;

  if (kind === 'scatter') return <ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid stroke="rgba(255,255,255,0.05)" /><XAxis type="number" dataKey="capacity" name="Estate specialists" stroke="#64748b" tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="conversion" name="Offer conversion" unit="%" stroke="#64748b" tick={{ fontSize: 9 }} /><ZAxis type="number" dataKey="size" range={[180, 760]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Scatter data={performance} name="Estate tenant performance" fill="#34d399" /></ScatterChart></ResponsiveContainer>;

  if (kind === 'evidence') return <div className="grid h-full place-items-center"><div className="w-full max-w-2xl space-y-3">{['Operating ERP record', 'Identity, time, location, and actor', 'Evidence and approval controls', 'Central Estate projection', 'Report or decision claim'].map((label, index) => <div key={label} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/30 font-mono text-[9px] text-emerald-300">{index + 1}</span><div className="flex-1 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 text-[10px] text-gray-300">{label}</div>{index < 4 && <ArrowRight size={12} className="text-gray-700" />}</div>)}</div></div>;

  return <ResponsiveContainer width="100%" height="100%"><BarChart data={supply}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#64748b" /><YAxis tick={{ fontSize: 9 }} stroke="#64748b" /><Tooltip /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="available" name="Available property" fill="#34d399" radius={[4, 4, 0, 0]} /><Bar dataKey="demand" name="Qualified demand" fill="#22d3ee" radius={[4, 4, 0, 0]} /><Bar dataKey="maintenance" name="Maintenance cases" fill="#fb7185" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>;
};

export const EstateCentralModuleWorkspace = ({ moduleId }: { moduleId: string }) => {
  const navigate = useNavigate();
  const id = moduleId as CentralModuleId;
  const spec = MODULES[id];
  const [tenantId, setTenantId] = useState('all');
  const [revision, setRevision] = useState(0);
  const portfolio = useMemo(() => buildEstatePortfolio(), [revision]);
  if (!spec) return null;
  const Icon = spec.icon;
  const selectedTenants = tenantId === 'all' ? portfolio.tenants : portfolio.tenants.filter((tenant) => tenant.id === tenantId);
  const selectedIds = new Set(selectedTenants.map((tenant) => tenant.id));
  const evidence = selectedTenants.flatMap((tenant) => tenant.evidence).filter((item) => spec.evidence.includes(item.domain));
  const metrics = metricSet(id, portfolio);

  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-12">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300"><Icon size={13} /> {spec.eyebrow}</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{spec.title}</h1><p className="mt-2 max-w-4xl text-xs leading-relaxed text-gray-500">{spec.description}</p></div>
      <div className="flex flex-wrap gap-2"><label className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-[9px] text-gray-500"><span className="sr-only">Estate tenant scope</span><select value={tenantId} onChange={(event) => setTenantId(event.target.value)} className="bg-transparent text-gray-200 outline-none"><option value="all">All Estate tenants</option>{portfolio.tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label><button type="button" onClick={() => setRevision((value) => value + 1)} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400"><RefreshCw size={12} /> Refresh</button><button type="button" onClick={() => window.print()} className="flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300/20 px-3 text-[9px] text-emerald-300"><Download size={12} /> Export view</button></div>
    </header>

    <GlassPanel className="rounded-xl p-4"><div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]"><div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Question answered</div><div className="mt-2 text-[11px] leading-relaxed text-gray-300">{spec.question}</div></div><ArrowRight size={14} className="hidden self-center text-emerald-300 lg:block" /><div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Decision supported</div><div className="mt-2 text-[11px] leading-relaxed text-emerald-200">{spec.decision}</div></div></div></GlassPanel>

    <section aria-label={`${spec.title} measures`} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, detail, tone]) => <Kpi key={label} label={label} value={value} detail={detail} tone={tone} />)}</section>

    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">{spec.visual === 'funnel' ? 'Stage conversion and loss' : spec.visual === 'composition' ? 'Portfolio composition' : spec.visual === 'scatter' ? 'Capacity and outcome relationship' : spec.visual === 'trend' ? 'Controlled value movement' : spec.visual === 'evidence' ? 'Claim-to-source lineage' : 'Tenant operating comparison'}</h2><p className="mt-1 text-[9px] text-gray-600">This visual is chosen for the decision on this page; it is not a shared generic ledger.</p><div className="mt-4 h-[320px]"><EstateVisual kind={spec.visual} portfolio={portfolio} /></div></GlassPanel>
      <GlassPanel className="overflow-hidden rounded-xl"><div className="border-b border-white/[0.08] p-5"><h2 className="text-sm font-medium text-white">Estate tenant contribution</h2><p className="mt-1 text-[9px] text-gray-600">The selected tenant filter controls this comparison and the evidence queue.</p></div><div className="divide-y divide-white/[0.06]">{portfolio.tenants.map((tenant: EstateTenantSnapshot) => <button key={tenant.id} type="button" onClick={() => setTenantId(tenant.id === tenantId ? 'all' : tenant.id)} className={`w-full p-5 text-left hover:bg-white/[0.025] ${selectedIds.has(tenant.id) ? 'bg-emerald-300/[0.04]' : ''}`}><div className="flex items-center justify-between"><span className="text-[11px] text-white">{tenant.name}</span><span className="font-mono text-[8px] text-emerald-300">{tenant.sourceState}</span></div><div className="mt-4 grid grid-cols-4 gap-2">{[[tenant.availableProperties, 'Available'], [tenant.qualifiedDemand, 'Demand'], [tenant.controlledOffers, 'Offers'], [tenant.exceptions, 'Actions']].map(([value, label]) => <div key={label}><div className="font-mono text-[10px] text-gray-300">{value}</div><div className="mt-1 text-[7px] uppercase text-gray-700">{label}</div></div>)}</div></button>)}</div></GlassPanel>
    </section>

    <GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Estate decision evidence</h2><p className="mt-1 text-[9px] text-gray-600">Only property, ownership, title, viewing, inspection, offer, deposit, lease, and maintenance records can contribute here.</p></div><AlertTriangle size={15} className="text-amber-200" /></div>{evidence.length ? <div className="divide-y divide-white/[0.06]">{evidence.map((item) => { const tenant = portfolio.tenants.find((entry) => entry.id === item.tenantId); return <button key={item.id} type="button" onClick={() => navigate(item.route)} className="grid w-full gap-3 px-5 py-4 text-left hover:bg-white/[0.025] md:grid-cols-[90px_1fr_170px_100px]"><span className={`w-fit rounded border px-2 py-1 font-mono text-[8px] ${evidenceTone(item.state)}`}>{item.id}</span><span><span className="block text-[11px] text-white">{item.subject}</span><span className="mt-1 block text-[9px] text-gray-600">{item.detail}</span></span><span><span className="block text-[9px] text-gray-300">{tenant?.name}</span><span className="mt-1 block text-[8px] text-gray-600">{item.domain} · {item.location}</span></span><span className="flex items-center justify-end gap-2 font-mono text-[9px] text-gray-300">{item.exposureGhs ? money.format(item.exposureGhs) : item.state}<ArrowRight size={11} /></span></button>; })}</div> : <div className="p-10 text-center text-[10px] text-gray-500">No open {spec.title.toLowerCase()} evidence for this tenant scope.</div>}</GlassPanel>

    <button type="button" onClick={() => navigate('/estate/tenants')} className="flex min-h-11 items-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/[0.05] px-4 text-[10px] text-emerald-200"><Building2 size={13} /> Open Estate Tenant Control <ArrowRight size={12} /></button>
  </motion.div>;
};
