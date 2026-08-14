import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CloudCog,
  Database,
  FileCheck2,
  FileText,
  Fingerprint,
  Gauge,
  Globe2,
  Landmark,
  Network,
  PackageCheck,
  Radio,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { DomainFilterBar, useDomainFilters, type DomainFilterState } from '../../components/analytics/DomainFilterBar';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { useTenant } from '../../context/TenantContext';
import { MOCK_TENANTS } from '../../data/mockAnalyticsData';

type EcosystemStatus = 'Critical' | 'At risk' | 'Watch' | 'On track';

interface EcosystemRecord {
  id: string;
  vertical: string;
  tenantId: string;
  tenant: string;
  country: string;
  city: string;
  branch: string;
  site: string;
  actor: string;
  status: EcosystemStatus;
  subject: string;
  decision: string;
  valueGhs: number;
  trust: number;
  ageMinutes: number;
  route: string;
  sourceRecord: string;
  event: string;
}

const records: EcosystemRecord[] = [
  { id: 'AUTO-401', vertical: 'AutoHub', tenantId: 'agl', tenant: 'Automobiles Ghana Limited (AGL)', country: 'Ghana', city: 'Accra', branch: 'AGL Accra', site: 'East Legon', actor: 'Workshop Control', status: 'Critical', subject: 'Inspection capacity below confirmed deal intake', decision: 'Extend the qualified inspector shift and protect 17 vehicle promises', valueGhs: 465000, trust: 96, ageMinutes: 38, route: '/autos/tenant/agl/erp/inspections', sourceRecord: 'INS-24018', event: 'inspection.capacity_breached' },
  { id: 'AUTO-414', vertical: 'AutoHub', tenantId: 'kumasi_motors', tenant: 'Kumasi Motors', country: 'Ghana', city: 'Kumasi', branch: 'Kumasi Motors', site: 'Asokwa', actor: 'Parts Control', status: 'At risk', subject: 'Fast-moving service parts below protected stock', decision: 'Transfer verified stock from Accra before 14 booked services arrive', valueGhs: 186000, trust: 92, ageMinutes: 124, route: '/autos/tenant/kumasi_motors/erp/parts', sourceRecord: 'STK-8841', event: 'inventory.reorder_threshold_crossed' },
  { id: 'AUTO-429', vertical: 'AutoHub', tenantId: 'lagos_autocare', tenant: 'Lagos Autocare & Fleet', country: 'Nigeria', city: 'Lagos', branch: 'Lagos Autocare', site: 'Ikeja', actor: 'Fleet Desk', status: 'Watch', subject: 'Fleet maintenance promise concentration', decision: 'Stagger four fleet batches across available bays', valueGhs: 274000, trust: 89, ageMinutes: 460, route: '/autos/tenant/lagos_autocare/erp/workshops', sourceRecord: 'JOB-10842', event: 'workshop.promise_pressure_changed' },
  { id: 'EST-311', vertical: 'Estate', tenantId: 'prime_accra', tenant: 'Prime Accra Realty', country: 'Ghana', city: 'Accra', branch: 'Prime Accra', site: 'Airport Residential', actor: 'Title Control', status: 'Critical', subject: 'Owner authority evidence incomplete for controlled offer', decision: 'Obtain registry-backed mandate before releasing the offer pack', valueGhs: 620000, trust: 78, ageMinutes: 1860, route: '/estate/tenant/prime_accra/erp/title-files', sourceRecord: 'TTL-1198', event: 'title.authority_evidence_expired' },
  { id: 'EST-326', vertical: 'Estate', tenantId: 'heritage', tenant: 'Heritage Estates', country: 'Ghana', city: 'Kumasi', branch: 'Heritage Kumasi', site: 'Nhyiaeso', actor: 'Rental Control', status: 'At risk', subject: 'Rent arrears rising across occupied units', decision: 'Open the tenant recovery workflow for seven overdue leases', valueGhs: 148000, trust: 87, ageMinutes: 720, route: '/estate/tenant/heritage/erp/rent-ledger', sourceRecord: 'RNT-7712', event: 'rent.arrears_band_changed' },
  { id: 'EST-338', vertical: 'Estate', tenantId: 'lagos_habitat', tenant: 'Lagos Habitat Partners', country: 'Nigeria', city: 'Lagos', branch: 'Lagos Habitat', site: 'Lekki', actor: 'Viewing Desk', status: 'Watch', subject: 'Qualified viewing demand awaiting owner windows', decision: 'Batch owner confirmations and release two viewing blocks', valueGhs: 395000, trust: 90, ageMinutes: 210, route: '/estate/tenant/lagos_habitat/erp/viewings', sourceRecord: 'VWG-6631', event: 'viewing.owner_window_pending' },
  { id: 'FARM-221', vertical: 'Farmers', tenantId: 'techiman_grain', tenant: 'Techiman Grain Co-op', country: 'Ghana', city: 'Techiman', branch: 'Techiman Aggregation', site: 'Main Depot', actor: 'Quality Desk', status: 'Critical', subject: 'Grade review constraining accepted produce release', decision: 'Add a second grader and protect cold-store allocation', valueGhs: 330000, trust: 84, ageMinutes: 330, route: '/farmers/tenant/techiman_grain/erp/quality', sourceRecord: 'GRD-5014', event: 'quality.review_queue_breached' },
  { id: 'FARM-236', vertical: 'Farmers', tenantId: 'akumadan_farms', tenant: 'Akumadan Farms', country: 'Ghana', city: 'Akumadan', branch: 'Akumadan Farms', site: 'Packhouse', actor: 'Cold-chain Control', status: 'At risk', subject: 'Cold-room dwell time approaching quality limit', decision: 'Advance the Accra produce route by four hours', valueGhs: 216000, trust: 91, ageMinutes: 570, route: '/farmers/tenant/akumadan_farms/erp/cold-chain', sourceRecord: 'CLD-4022', event: 'cold_chain.dwell_limit_warning' },
  { id: 'FARM-248', vertical: 'Farmers', tenantId: 'tamale_produce', tenant: 'Tamale Produce Union', country: 'Ghana', city: 'Tamale', branch: 'Tamale Union', site: 'Aggregation Yard', actor: 'Traceability Control', status: 'Watch', subject: 'Farm-source evidence awaiting agent confirmation', decision: 'Close nine source-evidence gaps before buyer allocation', valueGhs: 172000, trust: 88, ageMinutes: 840, route: '/farmers/tenant/tamale_produce/erp/traceability', sourceRecord: 'TRC-8807', event: 'traceability.source_gap_detected' },
  { id: 'MER-181', vertical: 'Merchants', tenantId: 'techvalley', tenant: 'TechValley GH', country: 'Ghana', city: 'Accra', branch: 'TechValley Accra', site: 'Osu Store', actor: 'Inventory Control', status: 'At risk', subject: 'Verified fast movers unavailable against qualified demand', decision: 'Approve supplier substitute and replenish protected stock', valueGhs: 205000, trust: 93, ageMinutes: 150, route: '/merchant/tenant/techvalley/erp/inventory', sourceRecord: 'SKU-7418', event: 'inventory.qualified_demand_unserved' },
  { id: 'MER-196', vertical: 'Merchants', tenantId: 'abossey_parts', tenant: 'Abossey Okai Parts Network', country: 'Ghana', city: 'Accra', branch: 'Abossey Network', site: 'Zone 3', actor: 'Authenticity Control', status: 'Critical', subject: 'Supplier authenticity proof missing for received batch', decision: 'Quarantine the batch until supplier evidence is approved', valueGhs: 284000, trust: 75, ageMinutes: 940, route: '/merchant/tenant/abossey_parts/erp/inventory', sourceRecord: 'BAT-AB19', event: 'inventory.authenticity_hold_opened' },
  { id: 'MER-207', vertical: 'Merchants', tenantId: 'kumasi_trade_depot', tenant: 'Kumasi Trade Depot', country: 'Ghana', city: 'Kumasi', branch: 'Trade Depot', site: 'Adum', actor: 'Fulfilment Control', status: 'Watch', subject: 'Packed orders awaiting verified handoff', decision: 'Consolidate the city dispatch wave', valueGhs: 94000, trust: 90, ageMinutes: 92, route: '/merchant/tenant/kumasi_trade_depot/erp/fulfilment', sourceRecord: 'FUL-3207', event: 'fulfilment.handoff_queue_changed' },
  { id: 'LAB-151', vertical: 'Label', tenantId: 'crushed_diamonds', tenant: 'Crushed Diamonds', country: 'Ghana', city: 'Accra', branch: 'Crushed Diamonds', site: 'Production House', actor: 'Production Control', status: 'At risk', subject: 'Approved collection release constrained by finishing', decision: 'Open a second finishing cell for the committed drop', valueGhs: 118000, trust: 94, ageMinutes: 265, route: '/label/tenant/crushed_diamonds/erp/production', sourceRecord: 'DROP-06', event: 'production.release_constraint_detected' },
  { id: 'LAB-166', vertical: 'Label', tenantId: 'kente_collective', tenant: 'Koforidua Kente Collective', country: 'Ghana', city: 'Koforidua', branch: 'Kente Collective', site: 'Weaving House', actor: 'Collection Control', status: 'Watch', subject: 'Rare kente edition has one verified unit remaining', decision: 'Preserve the listing and route qualified demand through BLKK', valueGhs: 18500, trust: 98, ageMinutes: 55, route: '/label/tenant/kente_collective/erp/inventory', sourceRecord: 'KNT-RARE-01', event: 'inventory.last_verified_unit' },
  { id: 'LAB-174', vertical: 'Label', tenantId: 'havilah', tenant: 'Havilah', country: 'Ghana', city: 'Accra', branch: 'Havilah', site: 'Design Studio', actor: 'Design Control', status: 'On track', subject: 'Variant approval moving within collection SLA', decision: 'Release approved variants to the commerce catalogue', valueGhs: 84000, trust: 96, ageMinutes: 34, route: '/label/tenant/havilah/erp/design', sourceRecord: 'VAR-2074', event: 'design.variant_approved' },
  { id: 'SUS-121', vertical: 'Susu', tenantId: 'accra_susu_union', tenant: 'Accra Susu Union', country: 'Ghana', city: 'Accra', branch: 'Accra Union', site: 'Central Office', actor: 'Settlement Control', status: 'Critical', subject: 'MoMo callback replay created a settlement variance', decision: 'Restrict the event cluster and reconcile batch 726B', valueGhs: 120000, trust: 82, ageMinutes: 420, route: '/susu/tenant/accra_susu_union/erp/settlement', sourceRecord: 'STL-726B', event: 'payments.callback_replay_detected' },
  { id: 'SUS-137', vertical: 'Susu', tenantId: 'lagos_trader_circle', tenant: 'Lagos Trader Savings Circle', country: 'Nigeria', city: 'Lagos', branch: 'Trader Circle', site: 'Balogun', actor: 'Pool Control', status: 'At risk', subject: 'Contribution pool release awaiting member quorum', decision: 'Complete member confirmation before controlled release', valueGhs: 232000, trust: 86, ageMinutes: 780, route: '/susu/tenant/lagos_trader_circle/erp/pools', sourceRecord: 'POOL-1902', event: 'pool.release_quorum_pending' },
  { id: 'SUS-146', vertical: 'Susu', tenantId: 'kumasi_market_susu', tenant: 'Kumasi Market Susu Network', country: 'Ghana', city: 'Kumasi', branch: 'Market Network', site: 'Kejetia', actor: 'Wallet Control', status: 'Watch', subject: 'Dormant wallet verification window approaching', decision: 'Run member re-verification before the next collection cycle', valueGhs: 76000, trust: 91, ageMinutes: 1100, route: '/susu/tenant/kumasi_market_susu/erp/wallets', sourceRecord: 'WAL-8192', event: 'wallet.verification_due' },
  { id: 'GLD-101', vertical: 'Gold', tenantId: 'mining_gh', tenant: 'Ghana Mining Corp', country: 'Ghana', city: 'Tarkwa', branch: 'Ghana Mining', site: 'Controlled Vault', actor: 'Custody Control', status: 'Critical', subject: 'Vault handoff evidence incomplete for controlled lot', decision: 'Capture dual-control custody proof before release', valueGhs: 1840000, trust: 77, ageMinutes: 132, route: '/gold/tenant/mining_gh/erp/vault', sourceRecord: 'LOT-AU-771', event: 'custody.handoff_proof_missing' },
  { id: 'GLD-116', vertical: 'Gold', tenantId: 'ashanti_bullion', tenant: 'Ashanti Bullion Cooperative', country: 'Ghana', city: 'Obuasi', branch: 'Ashanti Bullion', site: 'Assay Desk', actor: 'Assay Control', status: 'At risk', subject: 'Independent assay variance exceeds tolerance', decision: 'Open a controlled re-assay before pricing approval', valueGhs: 920000, trust: 85, ageMinutes: 610, route: '/gold/tenant/ashanti_bullion/erp/assay', sourceRecord: 'ASY-4410', event: 'assay.variance_threshold_crossed' },
  { id: 'GLD-129', vertical: 'Gold', tenantId: 'tarkwa_artisanal', tenant: 'Tarkwa Artisanal Mining Union', country: 'Ghana', city: 'Tarkwa', branch: 'Artisanal Union', site: 'Intake Point', actor: 'Compliance Control', status: 'Watch', subject: 'Miner licence renewal evidence due', decision: 'Refresh the licence pack before the next lot intake', valueGhs: 408000, trust: 89, ageMinutes: 1680, route: '/gold/tenant/tarkwa_artisanal/erp/compliance', sourceRecord: 'CMP-3021', event: 'compliance.licence_expiry_warning' },
  { id: 'AGT-081', vertical: 'Agents', tenantId: 'accra_field_network', tenant: 'Greater Accra Field Network', country: 'Ghana', city: 'Accra', branch: 'Accra Field Network', site: 'East Cluster', actor: 'Field Quality', status: 'At risk', subject: 'Merchant verification visits outside completion SLA', decision: 'Reassign six visits to the nearest qualified agents', valueGhs: 96000, trust: 88, ageMinutes: 360, route: '/agents/tenant/accra_field_network/erp/visits', sourceRecord: 'VIS-2401', event: 'field.visit_sla_breached' },
  { id: 'AGT-097', vertical: 'Agents', tenantId: 'techiman_market_unit', tenant: 'Techiman Market Verification Unit', country: 'Ghana', city: 'Techiman', branch: 'Market Unit', site: 'Central Market', actor: 'Evidence Quality', status: 'Watch', subject: 'Offline evidence payloads awaiting synchronization', decision: 'Open the assisted sync window before review', valueGhs: 68000, trust: 90, ageMinutes: 78, route: '/agents/tenant/techiman_market_unit/erp/sync', sourceRecord: 'SYNC-6612', event: 'field.sync_backlog_changed' },
  { id: 'AGT-108', vertical: 'Agents', tenantId: 'ashanti_trade_desk', tenant: 'Ashanti Trade Agent Desk', country: 'Ghana', city: 'Kumasi', branch: 'Ashanti Trade Desk', site: 'Adum Cluster', actor: 'Assignment Control', status: 'On track', subject: 'High-value trader onboarding completed with evidence', decision: 'Release the verified merchant profile to catalogue control', valueGhs: 152000, trust: 97, ageMinutes: 26, route: '/agents/tenant/ashanti_trade_desk/erp/onboarding', sourceRecord: 'ONB-9017', event: 'merchant.verification_completed' },
];

const pageMeta: Record<string, { eyebrow: string; title: string; description: string; question: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  '': { eyebrow: 'Continental control plane', title: 'Adinkra ecosystem command', description: 'A live decision surface for the portfolio, shared constraints, institutional trust, and value requiring intervention across every operating ERP.', question: 'What changed across the ecosystem, what value is exposed, and where must leadership intervene now?', icon: Radio },
  'portfolio-intelligence': { eyebrow: 'Capital and operating allocation', title: 'Portfolio intelligence', description: 'Compare vertical contribution, concentration, trust-adjusted value, growth and intervention load without duplicating a tenant operating dashboard.', question: 'Where is value concentrated, which portfolio earns its risk, and where should capital or capacity move?', icon: Gauge },
  'cross-vertical-ops': { eyebrow: 'Shared constraints and handoffs', title: 'Cross-vertical operations', description: 'Trace dependencies that cross ERP boundaries: agent evidence, inventory availability, payments, logistics, verification and release.', question: 'Which shared dependency is blocking the most accepted outcomes across multiple businesses?', icon: Network },
  'central-logistics': { eyebrow: 'Network movement control', title: 'Central logistics', description: 'Control lanes, dispatch, custody, fulfilment promises, cold-chain windows and cross-border exceptions across the ecosystem.', question: 'Which route, handoff or capacity constraint threatens the next delivery promise?', icon: Truck },
  treasury: { eyebrow: 'Group liquidity and settlement', title: 'Finance and treasury', description: 'Aggregate controlled cash, escrow, receivables, payouts, settlement breaks, currency exposure and near-term obligations.', question: 'How much deployable liquidity exists after protected funds and obligations, and what must reconcile first?', icon: Landmark },
  'trust-control': { eyebrow: 'Institutional trust layer', title: 'Trust and verification', description: 'Measure identity, authority, asset, custody, transaction and evidence controls across every contributing ERP.', question: 'Which unverifiable claim or expiring control places the most institutional value at risk?', icon: ShieldCheck },
  'ai-operations': { eyebrow: 'Silent force multiplier', title: 'AI operations', description: 'Govern recommendations, normalisation, anomaly detection, human review, model drift and accepted operational outcomes.', question: 'Where is AI improving accepted throughput, and where must a human override or retrain it?', icon: Bot },
  'institutional-reporting': { eyebrow: 'Evidence-backed disclosure', title: 'Institutional reporting', description: 'Build lender, regulator, insurer, tax and board packs whose claims retain scope and drill back to contributing records.', question: 'Which institutional claim is ready to sign, and which is still blocked by missing evidence?', icon: FileText },
  'system-health': { eyebrow: 'Platform reliability control', title: 'Platform and SRE', description: 'Monitor event ingestion, service availability, connector health, processing lag and evidence freshness across the operating spine.', question: 'Which technical degradation is already affecting a business outcome or evidence chain?', icon: CloudCog },
};

const colours = ['#22d3ee', '#34d399', '#a78bfa', '#fbbf24', '#fb7185', '#60a5fa', '#f97316', '#e879f9'];
const statusRank: Record<EcosystemStatus, number> = { Critical: 4, 'At risk': 3, Watch: 2, 'On track': 1 };
const verticalNames = [...new Set(records.map((record) => record.vertical))];
const actors = [...new Set(records.map((record) => record.actor))];
const locations = records.map((record) => ({ country: record.country, city: record.city, branch: record.branch, site: record.site }));
const activeTenants = MOCK_TENANTS.filter((tenant) => records.some((record) => record.tenantId === tenant.id));

const periodAllows = (record: EcosystemRecord, period: DomainFilterState['period']) => {
  if (period === 'real-time') return record.ageMinutes <= 60;
  if (period === 'today') return record.ageMinutes <= 1440;
  if (period === '7d') return record.ageMinutes <= 10080;
  return true;
};

const filterRecords = (filters: DomainFilterState) => records.filter((record) =>
  periodAllows(record, filters.period)
  && (filters.country === 'all' || record.country === filters.country)
  && (filters.city === 'all' || record.city === filters.city)
  && (filters.tenant === 'all' || record.tenantId === filters.tenant)
  && (filters.branch === 'all' || record.branch === filters.branch)
  && (filters.site === 'all' || record.site === filters.site)
  && (filters.status === 'all' || record.status === filters.status)
  && (filters.actor === 'all' || record.actor === filters.actor)
  && (filters.facet === 'all' || record.vertical === filters.facet)
);

const formatValue = (valueGhs: number, currency: DomainFilterState['currency'], compact = true) => new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency,
  notation: compact ? 'compact' : 'standard',
  maximumFractionDigits: compact ? 1 : 2,
}).format(currency === 'USD' ? valueGhs / 15.4 : valueGhs);

const StatusPill = ({ status }: { status: EcosystemStatus }) => <span className={`w-fit rounded border px-2 py-1 font-mono text-[8px] uppercase ${status === 'Critical' ? 'border-rose-400/25 bg-rose-400/[0.08] text-rose-200' : status === 'At risk' ? 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200' : status === 'Watch' ? 'border-blue-400/25 bg-blue-400/[0.07] text-blue-200' : 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200'}`}>{status}</span>;

const Metric = ({ label, value, detail, icon: Icon, tone = 'text-white' }: { label: string; value: React.ReactNode; detail: string; icon: React.ComponentType<{ size?: number }>; tone?: string }) => <GlassPanel className="rounded-xl p-4"><div className="flex items-start justify-between"><div className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-600">{label}</div><Icon size={14} /></div><div className={`mt-3 text-xl font-semibold ${tone}`}>{value}</div><div className="mt-2 text-[9px] leading-4 text-gray-600">{detail}</div></GlassPanel>;

const PanelHeading = ({ title, detail, icon: Icon }: { title: string; detail: string; icon: React.ComponentType<{ size?: number; className?: string }> }) => <div className="flex items-start justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-sm font-medium text-white">{title}</h2><p className="mt-1 text-[9px] text-gray-600">{detail}</p></div><Icon size={16} className="text-vertical-accent" /></div>;

const verticalSummaryFor = (scoped: EcosystemRecord[]) => verticalNames.map((vertical, index) => {
  const rows = scoped.filter((row) => row.vertical === vertical);
  const value = rows.reduce((sum, row) => sum + row.valueGhs, 0);
  const trust = rows.length ? rows.reduce((sum, row) => sum + row.trust, 0) / rows.length : 0;
  const risk = rows.reduce((sum, row) => sum + statusRank[row.status], 0);
  return { name: vertical, value, trust: Number(trust.toFixed(1)), risk, records: rows.length, returnRate: 8 + ((index * 7) % 19), size: Math.max(1, value / 10000) };
}).filter((row) => row.records > 0);

const EvidenceRows = ({ scoped, currency, onOpen, limit = 8 }: { scoped: EcosystemRecord[]; currency: DomainFilterState['currency']; onOpen: (record: EcosystemRecord) => void; limit?: number }) => <div className="divide-y divide-white/[0.06]">{[...scoped].sort((a, b) => statusRank[b.status] - statusRank[a.status] || b.valueGhs - a.valueGhs).slice(0, limit).map((record) => <button key={record.id} type="button" onClick={() => onOpen(record)} className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-white/[0.025] md:grid-cols-[78px_1.2fr_1fr_150px_90px_auto] md:items-center"><StatusPill status={record.status} /><span><span className="block text-[11px] text-white">{record.subject}</span><span className="mt-1 block font-mono text-[8px] text-gray-600">{record.id} · {record.sourceRecord}</span></span><span><span className="block text-[9px] text-gray-300">{record.tenant}</span><span className="mt-1 block text-[8px] text-gray-600">{record.city} · {record.site}</span></span><span className="text-[9px] text-gray-400">{record.actor}</span><span className="font-mono text-[9px] text-gray-300">{formatValue(record.valueGhs, currency)}</span><ArrowRight size={12} className="text-gray-600" /></button>)}</div>;

interface WorkspaceViewProps {
  scoped: EcosystemRecord[];
  currency: DomainFilterState['currency'];
  onOpen: (record: EcosystemRecord) => void;
}

const CommandView = ({ scoped, currency, onOpen }: WorkspaceViewProps) => {
  const summary = verticalSummaryFor(scoped);
  const total = scoped.reduce((sum, row) => sum + row.valueGhs, 0);
  const exposed = scoped.filter((row) => row.status !== 'On track').reduce((sum, row) => sum + row.valueGhs, 0);
  const countries = new Set(scoped.map((row) => row.country)).size;
  const tenants = new Set(scoped.map((row) => row.tenantId)).size;
  const critical = scoped.filter((row) => row.status === 'Critical').length;
  const trust = scoped.length ? scoped.reduce((sum, row) => sum + row.trust, 0) / scoped.length : 0;
  const trend = ['08:00', '10:00', '12:00', '14:00', '16:00', 'Now'].map((period, index) => ({ period, accepted: total * [0.66, 0.72, 0.78, 0.83, 0.91, 1][index], exposed: exposed * [0.58, 0.64, 0.7, 0.76, 0.88, 1][index] }));
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Metric label="Controlled position" value={formatValue(total, currency)} detail="Value represented by records inside the exact command scope" icon={CircleDollarSign} /><Metric label="Value requiring action" value={formatValue(exposed, currency)} detail="Critical, at-risk, and watch records only" icon={AlertTriangle} tone="text-rose-200" /><Metric label="Contributing tenants" value={tenants} detail={`${countries} countries contribute original records`} icon={Building2} /><Metric label="Binding constraints" value={critical} detail="Cross-ERP decisions requiring immediate ownership" icon={Network} tone="text-amber-200" /><Metric label="Mean trust coverage" value={`${trust.toFixed(1)}%`} detail="Identity, asset, authority, evidence, and transaction controls" icon={ShieldCheck} /><Metric label="Original records" value={scoped.length} detail="Every summary resolves to its tenant record and event" icon={Database} /></section>
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><GlassPanel className="rounded-xl p-5"><div className="flex items-start justify-between"><div><h2 className="text-sm font-medium text-white">Accepted value and intervention exposure</h2><p className="mt-1 text-[9px] text-gray-600">The command surface separates value moving normally from value that needs a decision.</p></div><Activity size={16} className="text-vertical-accent" /></div><div className="mt-4 h-[280px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="acceptedCommand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(value) => formatValue(Number(value), currency)} axisLine={false} /><Tooltip formatter={(value) => formatValue(Number(value), currency, false)} /><Area dataKey="accepted" name="Controlled position" stroke="#22d3ee" fill="url(#acceptedCommand)" strokeWidth={2} /><Line dataKey="exposed" name="Requires action" stroke="#fb7185" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div></GlassPanel><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Value allocation by ERP</h2><p className="mt-1 text-[9px] text-gray-600">Clicking a source record below opens its full lineage.</p><div className="mt-4 h-[250px]"><ResponsiveContainer width="100%" height="100%"><Treemap data={summary} dataKey="value" nameKey="name" stroke="#070707" fill="#22d3ee">{summary.map((item, index) => <Cell key={item.name} fill={colours[index % colours.length]} />)}</Treemap></ResponsiveContainer></div></GlassPanel></section>
    <GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Cross-ERP intervention board" detail="Highest-value constraints first; every row retains vertical, tenant, location, owner, record, and event." icon={Network} /><EvidenceRows scoped={scoped} currency={currency} onOpen={onOpen} limit={10} /></GlassPanel>
  </>;
};

const PortfolioView = ({ scoped, currency, onOpen }: WorkspaceViewProps) => {
  const summary = verticalSummaryFor(scoped);
  const total = summary.reduce((sum, row) => sum + row.value, 0);
  const top = [...summary].sort((a, b) => b.value - a.value)[0];
  const atRisk = summary.reduce((sum, row) => sum + (row.risk >= 7 ? row.value : 0), 0);
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Portfolio value" value={formatValue(total, currency)} detail="Controlled value inside the current geographic and period scope" icon={CircleDollarSign} /><Metric label="Largest allocation" value={top?.name ?? '—'} detail={`${top ? formatValue(top.value, currency) : 'No value'} in the leading vertical`} icon={Boxes} /><Metric label="Risk-weighted exposure" value={formatValue(atRisk, currency)} detail="Vertical positions carrying concentrated intervention load" icon={AlertTriangle} tone="text-amber-200" /><Metric label="Portfolio breadth" value={`${summary.length} ERPs`} detail="Independent vertical operating systems in the selected scope" icon={Globe2} /><Metric label="Source records" value={scoped.length} detail="Contributing operating evidence, not duplicated vertical dashboards" icon={Database} /></section>
    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Trust-adjusted portfolio map</h2><p className="mt-1 text-[9px] text-gray-600">X = trust coverage, Y = simulated return signal, bubble = controlled value, colour = vertical.</p><div className="mt-4 h-[330px]"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ left: 4, right: 20 }}><CartesianGrid stroke="rgba(255,255,255,0.05)" /><XAxis type="number" dataKey="trust" name="Trust coverage" domain={[65, 100]} stroke="#64748b" tick={{ fontSize: 9 }} unit="%" /><YAxis type="number" dataKey="returnRate" name="Return signal" stroke="#64748b" tick={{ fontSize: 9 }} unit="%" /><ZAxis type="number" dataKey="size" range={[180, 1200]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Scatter data={summary}>{summary.map((item, index) => <Cell key={item.name} fill={colours[index % colours.length]} />)}</Scatter></ScatterChart></ResponsiveContainer></div></GlassPanel><GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Allocation and concentration" detail="Contribution, trust and decision pressure by independent ERP." icon={Gauge} /><div className="divide-y divide-white/[0.06]">{[...summary].sort((a, b) => b.value - a.value).map((row, index) => <div key={row.name} className="px-5 py-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[11px] text-white"><span className="h-2 w-2 rounded-full" style={{ background: colours[index % colours.length] }} />{row.name}</span><span className="font-mono text-[9px] text-gray-300">{formatValue(row.value, currency)}</span></div><div className="mt-3 grid grid-cols-3 gap-3 text-[8px]"><span className="text-gray-600">ALLOCATION <b className="block text-gray-300">{total ? (row.value / total * 100).toFixed(1) : 0}%</b></span><span className="text-gray-600">TRUST <b className="block text-emerald-300">{row.trust}%</b></span><span className="text-gray-600">PRESSURE <b className="block text-amber-200">{row.risk}</b></span></div><div className="mt-3 h-1 overflow-hidden rounded bg-white/[0.06]"><div className="h-full rounded" style={{ width: `${total ? row.value / total * 100 : 0}%`, background: colours[index % colours.length] }} /></div></div>)}</div></GlassPanel></section>
    <GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Contributing portfolio evidence" detail="Open a record to reconcile any portfolio claim to the original tenant system." icon={Fingerprint} /><EvidenceRows scoped={scoped} currency={currency} onOpen={onOpen} limit={6} /></GlassPanel>
  </>;
};

const CrossOpsView = ({ scoped, currency, onOpen }: WorkspaceViewProps) => {
  const stages = [
    { name: 'Ground truth captured', value: scoped.length },
    { name: 'Identity and asset verified', value: scoped.filter((row) => row.trust >= 85).length },
    { name: 'Commercially accepted', value: scoped.filter((row) => row.status !== 'Critical').length },
    { name: 'Payment or obligation controlled', value: scoped.filter((row) => !['Critical', 'At risk'].includes(row.status)).length },
    { name: 'Released outcome', value: scoped.filter((row) => row.status === 'On track').length },
  ];
  const dependencies = [
    ['Agent evidence', 'Trust control', scoped.filter((row) => row.vertical === 'Agents').length, 'Field capture → verified entity'],
    ['Asset availability', 'Commerce', scoped.filter((row) => ['AutoHub', 'Merchants', 'Farmers', 'Label', 'Estate', 'Gold'].includes(row.vertical)).length, 'Verified asset → qualified demand'],
    ['Payment control', 'Treasury', scoped.filter((row) => ['Susu', 'Merchants', 'Estate'].includes(row.vertical)).length, 'Escrow / settlement → release'],
    ['Physical movement', 'Central logistics', scoped.filter((row) => /transfer|route|handoff|dispatch|cold/i.test(`${row.subject} ${row.decision}`)).length, 'Custody handoff → delivered evidence'],
  ];
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{dependencies.map(([name, owner, count, detail], index) => <Metric key={String(name)} label={String(name)} value={String(count)} detail={`${detail} · accountable: ${owner}`} icon={[Fingerprint, Boxes, CircleDollarSign, Truck][index]} />)}</section>
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Accepted-outcome flow</h2><p className="mt-1 text-[9px] text-gray-600">The funnel exposes where shared controls stop records moving between ERPs.</p><div className="mt-6 space-y-3">{stages.map((stage, index) => { const width = stages[0].value ? Math.max(8, stage.value / stages[0].value * 100) : 8; return <div key={stage.name}><div className="mb-1 flex justify-between text-[9px]"><span className="text-gray-400">{index + 1}. {stage.name}</span><span className="font-mono text-gray-300">{stage.value}{index > 0 && <span className="ml-2 text-rose-300">−{stages[index - 1].value - stage.value}</span>}</span></div><div className="h-9 rounded bg-white/[0.04]"><div className="flex h-full items-center rounded bg-gradient-to-r from-cyan-300 to-emerald-300/40 px-3 font-mono text-[8px] text-black" style={{ width: `${width}%` }}>{Math.round(width)}%</div></div></div>; })}</div></GlassPanel><GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Shared binding constraints" detail="Ranked by intervention severity and controlled value across ERP boundaries." icon={Network} /><EvidenceRows scoped={scoped.filter((row) => row.status !== 'On track')} currency={currency} onOpen={onOpen} limit={8} /></GlassPanel></section>
    <GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Dependency contract map</h2><p className="mt-1 text-[9px] text-gray-600">Each contract identifies the producer, consumer, acceptance rule and evidence required to release the next step.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{dependencies.map(([name, owner, count, detail], index) => <div key={String(name)} className="relative rounded-xl border border-white/[0.08] bg-black/25 p-4"><div className="font-mono text-[8px] uppercase text-vertical-accent">Contract {index + 1}</div><div className="mt-3 text-xs text-white">{name}</div><div className="mt-2 text-[9px] leading-4 text-gray-600">{detail}</div><div className="mt-4 border-t border-white/[0.06] pt-3 text-[8px] text-gray-500">OWNER <span className="float-right text-gray-300">{owner}</span><br />OPEN <span className="float-right text-amber-200">{count}</span></div></div>)}</div></GlassPanel>
  </>;
};

const LogisticsView = ({ scoped, currency, onOpen }: WorkspaceViewProps) => {
  const laneRecords = scoped.filter((row) => /route|handoff|dispatch|transfer|cold|custody|viewing/i.test(`${row.subject} ${row.decision}`));
  const lanes = [
    { lane: 'Accra → Kumasi', promised: 42, delivered: 36, dwell: 4.2, value: 584000 },
    { lane: 'Techiman → Accra', promised: 31, delivered: 24, dwell: 7.8, value: 412000 },
    { lane: 'Accra city', promised: 68, delivered: 63, dwell: 2.1, value: 326000 },
    { lane: 'Tarkwa → Accra vault', promised: 9, delivered: 8, dwell: 5.6, value: 1840000 },
    { lane: 'Lagos city', promised: 27, delivered: 23, dwell: 6.4, value: 669000 },
  ];
  const totalValue = laneRecords.reduce((sum, row) => sum + row.valueGhs, 0);
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Active lane value" value={formatValue(totalValue, currency)} detail="Value attached to movements and custody handoffs in scope" icon={Truck} /><Metric label="Promised movements" value={lanes.reduce((sum, lane) => sum + lane.promised, 0)} detail="Deliveries, transfers, inspections, and custody handoffs" icon={PackageCheck} /><Metric label="On-time release" value="86.5%" detail="Released within the domain-specific promise window" icon={CheckCircle2} tone="text-emerald-200" /><Metric label="Exception records" value={laneRecords.filter((row) => row.status !== 'On track').length} detail="Route, cold-chain, custody, dispatch, or handoff decisions" icon={AlertTriangle} tone="text-amber-200" /><Metric label="Countries" value={new Set(laneRecords.map((row) => row.country)).size} detail="National and cross-border movement scopes represented" icon={Globe2} /></section>
    <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Lane promise performance</h2><p className="mt-1 text-[9px] text-gray-600">Grouped columns compare promised movements with released outcomes; the line shows dwell hours.</p><div className="mt-4 h-[320px]"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={lanes}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="lane" stroke="#64748b" tick={{ fontSize: 8 }} /><YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 9 }} /><YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 9 }} unit="h" /><Tooltip /><Legend /><Bar yAxisId="left" dataKey="promised" name="Promised" fill="#334155" /><Bar yAxisId="left" dataKey="delivered" name="Released" fill="#22d3ee" /><Line yAxisId="right" dataKey="dwell" name="Dwell hours" stroke="#fb7185" strokeWidth={2} /></ComposedChart></ResponsiveContainer></div></GlassPanel><GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Movement control by lane" detail="Value and decision pressure across shared routes." icon={RouteIcon} /><div className="divide-y divide-white/[0.06]">{lanes.map((lane) => <div key={lane.lane} className="px-5 py-4"><div className="flex justify-between"><span className="text-[11px] text-white">{lane.lane}</span><span className="font-mono text-[9px] text-gray-300">{formatValue(lane.value, currency)}</span></div><div className="mt-3 flex justify-between text-[8px] text-gray-600"><span>RELEASE {Math.round(lane.delivered / lane.promised * 100)}%</span><span>DWELL {lane.dwell}h</span></div><div className="mt-2 h-1.5 overflow-hidden rounded bg-white/[0.06]"><div className="h-full rounded bg-cyan-300" style={{ width: `${lane.delivered / lane.promised * 100}%` }} /></div></div>)}</div></GlassPanel></section>
    <GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Logistics decision queue" detail="Open the originating ERP record before dispatch, reroute, transfer, or release." icon={Truck} /><EvidenceRows scoped={laneRecords} currency={currency} onOpen={onOpen} limit={8} /></GlassPanel>
  </>;
};

const TreasuryView = ({ scoped, currency, onOpen }: WorkspaceViewProps) => {
  const gross = scoped.reduce((sum, row) => sum + row.valueGhs, 0);
  const protectedFunds = scoped.filter((row) => ['Estate', 'Susu', 'Gold'].includes(row.vertical)).reduce((sum, row) => sum + row.valueGhs * 0.28, 0);
  const obligations = gross * 0.19;
  const deployable = gross - protectedFunds - obligations;
  const settlement = scoped.filter((row) => /settlement|payment|deposit|rent|offer|value/i.test(`${row.subject} ${row.decision}`));
  const waterfall = [
    { label: 'Controlled inflow', value: gross, tone: '#22d3ee' },
    { label: 'Protected escrow', value: -protectedFunds, tone: '#a78bfa' },
    { label: 'Near-term obligations', value: -obligations, tone: '#fb7185' },
    { label: 'Deployable liquidity', value: deployable, tone: '#34d399' },
  ];
  const composition = verticalSummaryFor(scoped);
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Controlled cash position" value={formatValue(gross, currency)} detail="Cash-like operating value represented in the selected scope" icon={CircleDollarSign} /><Metric label="Protected funds" value={formatValue(protectedFunds, currency)} detail="Escrow, deposits, pools, custody, and restricted balances" icon={ShieldCheck} /><Metric label="Near-term obligations" value={formatValue(obligations, currency)} detail="Payout, settlement, payroll, supplier, and release commitments" icon={FileCheck2} tone="text-amber-200" /><Metric label="Deployable liquidity" value={formatValue(deployable, currency)} detail="Position after protected balances and near-term obligations" icon={Landmark} tone="text-emerald-200" /><Metric label="Reconciliation actions" value={settlement.filter((row) => row.status !== 'On track').length} detail="Variance or evidence decisions still preventing release" icon={AlertTriangle} /></section>
    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Liquidity waterfall</h2><p className="mt-1 text-[9px] text-gray-600">What remains deployable after funds the group may not use and obligations it must honour.</p><div className="mt-6 space-y-5">{waterfall.map((step) => { const width = gross ? Math.max(8, Math.abs(step.value) / gross * 100) : 8; return <div key={step.label}><div className="mb-2 flex justify-between text-[10px]"><span className="text-gray-400">{step.label}</span><span className="font-mono text-gray-200">{step.value < 0 ? '−' : ''}{formatValue(Math.abs(step.value), currency, false)}</span></div><div className="h-8 rounded bg-white/[0.04]"><div className="h-full rounded" style={{ width: `${width}%`, background: step.tone }} /></div></div>; })}</div></GlassPanel><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Treasury exposure by ERP</h2><p className="mt-1 text-[9px] text-gray-600">Composition is shown independently from operational revenue dashboards.</p><div className="mt-4 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={composition} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} /><XAxis type="number" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(value) => formatValue(Number(value), currency)} /><YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} width={70} /><Tooltip formatter={(value) => formatValue(Number(value), currency, false)} /><Bar dataKey="value" name="Controlled value" fill="#22d3ee" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></GlassPanel></section>
    <GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Settlement and obligation evidence" detail="Each treasury position remains linked to the operational transaction or control record." icon={Landmark} /><EvidenceRows scoped={settlement.length ? settlement : scoped} currency={currency} onOpen={onOpen} limit={8} /></GlassPanel>
  </>;
};

const TrustView = ({ scoped, currency, onOpen }: WorkspaceViewProps) => {
  const summary = verticalSummaryFor(scoped);
  const evidenceAges = [
    { band: '< 1 hour', records: scoped.filter((row) => row.ageMinutes < 60).length },
    { band: '1–6 hours', records: scoped.filter((row) => row.ageMinutes >= 60 && row.ageMinutes < 360).length },
    { band: '6–24 hours', records: scoped.filter((row) => row.ageMinutes >= 360 && row.ageMinutes < 1440).length },
    { band: '> 24 hours', records: scoped.filter((row) => row.ageMinutes >= 1440).length },
  ];
  const controls = [
    { control: 'Identity / KYB', coverage: 94, target: 98 },
    { control: 'Authority / mandate', coverage: 82, target: 96 },
    { control: 'Asset authenticity', coverage: 87, target: 97 },
    { control: 'Transaction integrity', coverage: 91, target: 98 },
    { control: 'Custody / delivery proof', coverage: 84, target: 96 },
    { control: 'Evidence currency', coverage: 79, target: 95 },
  ];
  const exposed = scoped.filter((row) => row.trust < 90).reduce((sum, row) => sum + row.valueGhs, 0);
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Trust-covered value" value={formatValue(scoped.reduce((sum, row) => sum + row.valueGhs * row.trust / 100, 0), currency)} detail="Controlled value weighted by current evidence coverage" icon={ShieldCheck} /><Metric label="Value below trust threshold" value={formatValue(exposed, currency)} detail="Records under 90% institutional trust coverage" icon={AlertTriangle} tone="text-rose-200" /><Metric label="Critical controls" value={scoped.filter((row) => row.trust < 80).length} detail="Identity, authority, authenticity, transaction, or custody gaps" icon={Fingerprint} /><Metric label="Evidence sources" value={new Set(scoped.map((row) => row.sourceRecord)).size} detail="Original tenant records contributing to trust decisions" icon={Database} /><Metric label="Countries" value={new Set(scoped.map((row) => row.country)).size} detail="Jurisdictions represented in the selected control scope" icon={Globe2} /></section>
    <section className="grid gap-4 xl:grid-cols-3"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Trust coverage by ERP</h2><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><RadialBarChart innerRadius="24%" outerRadius="95%" data={summary.map((row, index) => ({ ...row, fill: colours[index % colours.length] }))} startAngle={90} endAngle={-270}><RadialBar dataKey="trust" background cornerRadius={5} /><Tooltip /></RadialBarChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-2">{summary.map((row, index) => <div key={row.name} className="flex justify-between text-[8px]"><span className="flex items-center gap-2 text-gray-500"><span className="h-2 w-2 rounded-full" style={{ background: colours[index % colours.length] }} />{row.name}</span><span className="text-gray-300">{row.trust}%</span></div>)}</div></GlassPanel><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Control coverage against target</h2><div className="mt-5 space-y-4">{controls.map((control) => <div key={control.control}><div className="mb-2 flex justify-between text-[9px]"><span className="text-gray-400">{control.control}</span><span className="font-mono text-gray-300">{control.coverage}% / {control.target}%</span></div><div className="relative h-2 overflow-hidden rounded bg-white/[0.06]"><div className="h-full rounded bg-vertical-accent" style={{ width: `${control.coverage}%` }} /><span className="absolute inset-y-0 w-px bg-white" style={{ left: `${control.target}%` }} /></div></div>)}</div></GlassPanel><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Evidence age histogram</h2><p className="mt-1 text-[9px] text-gray-600">Older evidence increases uncertainty even when the original record exists.</p><div className="mt-4 h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={evidenceAges}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="band" stroke="#64748b" tick={{ fontSize: 8 }} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} allowDecimals={false} /><Tooltip /><Bar dataKey="records" name="Records" fill="#fbbf24" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></GlassPanel></section>
    <GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Institutional trust decision queue" detail="The queue prioritises unverifiable value, not raw record volume." icon={ShieldCheck} /><EvidenceRows scoped={scoped.filter((row) => row.trust < 95)} currency={currency} onOpen={onOpen} limit={10} /></GlassPanel>
  </>;
};

const AiOperationsView = ({ scoped, currency, onOpen }: WorkspaceViewProps) => {
  const models = [
    { model: 'Record normaliser', proposed: 1840, accepted: 1762, overridden: 38, confidence: 96 },
    { model: 'Duplicate entity resolver', proposed: 412, accepted: 361, overridden: 29, confidence: 88 },
    { model: 'Constraint detector', proposed: 286, accepted: 233, overridden: 21, confidence: 84 },
    { model: 'Next-best action', proposed: 194, accepted: 151, overridden: 28, confidence: 79 },
    { model: 'Evidence anomaly flagger', proposed: 128, accepted: 99, overridden: 17, confidence: 82 },
  ];
  const reviewed = models.reduce((sum, model) => sum + model.accepted, 0);
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Accepted recommendations" value={reviewed.toLocaleString()} detail="Human-accepted normalisations, matches, constraints, and actions" icon={Sparkles} /><Metric label="Human override rate" value="5.3%" detail="Recommendations corrected or rejected by accountable operators" icon={Users} /><Metric label="Median confidence" value="85.8%" detail="Calibrated confidence across production recommendation classes" icon={Gauge} /><Metric label="Review backlog" value={scoped.filter((row) => row.status !== 'On track').length} detail="Operational decisions awaiting evidence or accountable review" icon={AlertTriangle} /><Metric label="Value influenced" value={formatValue(scoped.reduce((sum, row) => sum + row.valueGhs, 0) * 0.41, currency)} detail="Controlled value touched by a recommendation, never autonomously released" icon={CircleDollarSign} /></section>
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Recommendation acceptance and override</h2><p className="mt-1 text-[9px] text-gray-600">The grouped columns distinguish model output from accepted operational action.</p><div className="mt-4 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={models}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="model" stroke="#64748b" tick={{ fontSize: 8 }} interval={0} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} /><Tooltip /><Legend /><Bar dataKey="proposed" name="Proposed" fill="#334155" /><Bar dataKey="accepted" name="Accepted" fill="#34d399" /><Bar dataKey="overridden" name="Overridden" fill="#fb7185" /></BarChart></ResponsiveContainer></div></GlassPanel><GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Model control register" detail="Confidence, acceptance, override and review ownership." icon={Bot} /><div className="divide-y divide-white/[0.06]">{models.map((model) => <div key={model.model} className="px-5 py-4"><div className="flex justify-between"><span className="text-[11px] text-white">{model.model}</span><span className="font-mono text-[9px] text-emerald-300">{model.confidence}%</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-[8px] text-gray-600"><span>PROPOSED <b className="block text-gray-300">{model.proposed}</b></span><span>ACCEPTED <b className="block text-emerald-300">{model.accepted}</b></span><span>OVERRIDE <b className="block text-rose-300">{model.overridden}</b></span></div></div>)}</div></GlassPanel></section>
    <GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Human review queue" detail="AI points to evidence; accountable operators decide and the original ERP records remain authoritative." icon={Users} /><EvidenceRows scoped={scoped.filter((row) => row.status !== 'On track')} currency={currency} onOpen={onOpen} limit={8} /></GlassPanel>
  </>;
};

const InstitutionalReportingView = ({ scoped, currency, onOpen }: WorkspaceViewProps) => {
  const [packType, setPackType] = useState('Lender collateral and cash-flow pack');
  const [sections, setSections] = useState(['Executive position', 'Portfolio allocation', 'Trust controls', 'Contributing evidence']);
  const options = ['Executive position', 'Portfolio allocation', 'Cross-ERP constraints', 'Trust controls', 'Tax and jurisdiction', 'Contributing evidence', 'Exceptions and qualifications'];
  const packs = [
    ['LND-2026-08', 'Lender collateral and cash-flow pack', 'Draft', '3 evidence gaps'],
    ['REG-2026-Q3', 'Regulator operating and trust return', 'Review', '1 approval due'],
    ['INS-2026-08', 'Insurer controlled-asset exposure', 'Ready', 'Signed evidence'],
    ['TAX-2026-07', 'Tax and transaction position', 'Retained', 'Filed snapshot'],
  ];
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Reportable value" value={formatValue(scoped.reduce((sum, row) => sum + row.valueGhs, 0), currency)} detail="Scoped operating value eligible for evidence-backed disclosure" icon={CircleDollarSign} /><Metric label="Source coverage" value={`${Math.round(scoped.reduce((sum, row) => sum + row.trust, 0) / Math.max(1, scoped.length))}%`} detail="Average evidence coverage across claims in this reporting scope" icon={ShieldCheck} /><Metric label="Ready packs" value="7" detail="Retained, review-complete packs available for signing" icon={FileCheck2} /><Metric label="Qualification gaps" value={scoped.filter((row) => row.trust < 90).length} detail="Claims requiring qualification or additional evidence" icon={AlertTriangle} /><Metric label="Contributing records" value={scoped.length} detail="Original ERP records linked to current reporting claims" icon={Database} /></section>
    <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Assemble institutional pack</h2><p className="mt-1 text-[9px] text-gray-600">Choose the recipient’s decision and include only the evidence needed to support it.</p><label className="mt-5 block"><span className="font-mono text-[8px] uppercase text-gray-600">Pack type</span><select value={packType} onChange={(event) => setPackType(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[10px] text-gray-300"><option>Lender collateral and cash-flow pack</option><option>Regulator operating and trust return</option><option>Insurer controlled-asset exposure</option><option>Tax and transaction position</option><option>Board portfolio and constraint brief</option></select></label><div className="mt-5 font-mono text-[8px] uppercase text-gray-600">Sections</div><div className="mt-2 grid gap-2">{options.map((item) => <label key={item} className="flex min-h-10 items-center gap-3 rounded-lg border border-white/[0.07] px-3 text-[9px] text-gray-400"><input type="checkbox" checked={sections.includes(item)} onChange={() => setSections((current) => current.includes(item) ? current.filter((section) => section !== item) : [...current, item])} />{item}</label>)}</div><button type="button" onClick={() => window.print()} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-[10px] font-semibold text-black"><FileText size={14} /> Print / save evidence pack</button></GlassPanel><article className="rounded-xl bg-[#f4f2eb] p-7 text-[#121212]"><div className="flex justify-between border-b border-black/15 pb-5"><div><div className="font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-700">Adinkra controlled report</div><h2 className="mt-3 text-2xl font-semibold">{packType}</h2><p className="mt-2 text-xs text-gray-600">Global operating scope · governed frontend simulation</p></div><div className="text-right font-mono text-[9px] text-gray-500">LIVE PREVIEW<br />2026-08-10</div></div><div className="mt-6 grid grid-cols-4 gap-3">{[[formatValue(scoped.reduce((sum, row) => sum + row.valueGhs, 0), currency), 'Controlled value'], [new Set(scoped.map((row) => row.tenantId)).size, 'Tenants'], [new Set(scoped.map((row) => row.country)).size, 'Countries'], [scoped.filter((row) => row.status === 'Critical').length, 'Qualifications']].map(([value, label]) => <div key={String(label)} className="border border-black/10 p-3"><div className="text-lg font-semibold">{value}</div><div className="mt-1 text-[8px] uppercase text-gray-500">{label}</div></div>)}</div><div className="mt-7 space-y-6">{sections.map((section) => <section key={section}><h3 className="border-b border-black/10 pb-2 text-sm font-semibold">{section}</h3><p className="mt-3 text-xs leading-5 text-gray-600">Generated for the selected geography, period, ERP, tenant, status and work-centre scope. Claims remain linked to their contributing record IDs and events.</p></section>)}</div></article></section>
    <GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Retained report register" detail="Draft, review, signature, retention and evidence-gap state." icon={FileCheck2} /><div className="divide-y divide-white/[0.06]">{packs.map(([id, name, status, detail]) => <div key={id} className="grid gap-3 px-5 py-4 text-[10px] md:grid-cols-[120px_1fr_120px_160px_auto] md:items-center"><span className="font-mono text-vertical-accent">{id}</span><span className="text-white">{name}</span><span className="text-gray-300">{status}</span><span className="text-gray-500">{detail}</span><ArrowRight size={12} className="text-gray-600" /></div>)}</div></GlassPanel>
    <GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Claims requiring evidence" detail="Open a contributing record before signing or qualifying a report claim." icon={Fingerprint} /><EvidenceRows scoped={scoped.filter((row) => row.trust < 95)} currency={currency} onOpen={onOpen} limit={6} /></GlassPanel>
  </>;
};

const SystemHealthView = ({ scoped, currency, onOpen }: WorkspaceViewProps) => {
  const services = [
    { service: 'Identity and tenant scope', uptime: 99.99, p95: 82, lag: 0, state: 'Healthy' },
    { service: 'Event ingestion', uptime: 99.95, p95: 148, lag: 920, state: 'Watch' },
    { service: 'Ontology and entity resolution', uptime: 99.91, p95: 224, lag: 184, state: 'Watch' },
    { service: 'Orders, escrow and settlement', uptime: 99.98, p95: 167, lag: 16, state: 'Healthy' },
    { service: 'Evidence storage and reports', uptime: 99.97, p95: 196, lag: 32, state: 'Healthy' },
    { service: 'AI recommendation queue', uptime: 99.86, p95: 684, lag: 71, state: 'At risk' },
  ];
  const latency = ['08:00', '10:00', '12:00', '14:00', '16:00', 'Now'].map((period, index) => ({ period, ingestion: [112, 118, 141, 236, 176, 148][index], ontology: [184, 192, 201, 318, 249, 224][index], payments: [144, 151, 162, 179, 171, 167][index] }));
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Platform availability" value="99.95%" detail="Weighted availability across business-critical services" icon={CloudCog} /><Metric label="Event processing lag" value="47 sec" detail="p95 from tenant mutation to command projection" icon={Activity} /><Metric label="Connector backlog" value="1,223" detail="Events waiting for retry, reconciliation, or field sync" icon={Database} tone="text-amber-200" /><Metric label="Affected business records" value={scoped.filter((row) => row.status !== 'On track').length} detail="Operating records already touched by a technical degradation" icon={AlertTriangle} /><Metric label="Value under degraded flow" value={formatValue(scoped.filter((row) => row.status !== 'On track').reduce((sum, row) => sum + row.valueGhs, 0), currency)} detail="Business value linked to watch or at-risk service paths" icon={CircleDollarSign} /></section>
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Business-path latency</h2><p className="mt-1 text-[9px] text-gray-600">Service latency is shown only where it participates in an operating evidence chain.</p><div className="mt-4 h-[320px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={latency}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 9 }} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} unit="ms" /><Tooltip /><Legend /><Line dataKey="ingestion" name="Event ingestion" stroke="#22d3ee" strokeWidth={2} /><Line dataKey="ontology" name="Ontology" stroke="#a78bfa" strokeWidth={2} /><Line dataKey="payments" name="Payments" stroke="#34d399" strokeWidth={2} /></LineChart></ResponsiveContainer></div></GlassPanel><GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Service objective register" detail="Availability, latency, backlog and current operating state." icon={CloudCog} /><div className="divide-y divide-white/[0.06]">{services.map((service) => <div key={service.service} className="px-5 py-4"><div className="flex justify-between"><span className="text-[10px] text-white">{service.service}</span><span className={service.state === 'Healthy' ? 'text-[8px] text-emerald-300' : service.state === 'Watch' ? 'text-[8px] text-amber-200' : 'text-[8px] text-rose-300'}>{service.state}</span></div><div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[8px] text-gray-600"><span>UPTIME <b className="block text-gray-300">{service.uptime}%</b></span><span>P95 <b className="block text-gray-300">{service.p95}ms</b></span><span>BACKLOG <b className="block text-gray-300">{service.lag}</b></span></div></div>)}</div></GlassPanel></section>
    <GlassPanel className="overflow-hidden rounded-xl"><PanelHeading title="Business-impact correlation" detail="A technical alert is actionable only when it resolves to the operating records and value it affects." icon={Activity} /><EvidenceRows scoped={scoped.filter((row) => row.status !== 'On track')} currency={currency} onOpen={onOpen} limit={8} /></GlassPanel>
  </>;
};

const TrustRadar = ({ scoped }: { scoped: EcosystemRecord[] }) => {
  const data = [
    { subject: 'Identity', value: 94 },
    { subject: 'Authority', value: 82 },
    { subject: 'Asset', value: Math.round(scoped.reduce((sum, row) => sum + row.trust, 0) / Math.max(1, scoped.length)) },
    { subject: 'Transaction', value: 91 },
    { subject: 'Custody', value: 84 },
    { subject: 'Currency', value: 79 },
  ];
  return <ResponsiveContainer width="100%" height="100%"><RadarChart data={data}><PolarGrid stroke="rgba(255,255,255,0.09)" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8 }} /><Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.22} /></RadarChart></ResponsiveContainer>;
};

const EvidenceDrawer = ({ record, currency, onClose }: { record: EcosystemRecord; currency: DomainFilterState['currency']; onClose: () => void }) => {
  const navigate = useNavigate();
  return <div className="fixed inset-0 z-[100] flex justify-end bg-black/75 backdrop-blur-sm" onClick={onClose}><motion.aside initial={{ x: 620 }} animate={{ x: 0 }} onClick={(event) => event.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/[0.1] bg-[#080808] p-6"><div className="flex items-start justify-between border-b border-white/[0.08] pb-5"><div><div className="font-mono text-[8px] uppercase tracking-[0.18em] text-vertical-accent">Original evidence drill</div><h2 className="mt-3 text-xl font-medium text-white">{record.subject}</h2><p className="mt-2 text-[10px] text-gray-500">{record.vertical} · {record.tenant} · {record.city} / {record.site}</p></div><button type="button" onClick={onClose} aria-label="Close evidence drill" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><X size={16} /></button></div><section className="mt-6 grid grid-cols-2 gap-3">{[[record.id, 'Command record'], [record.sourceRecord, 'Source record'], [record.event, 'Source event'], [formatValue(record.valueGhs, currency, false), 'Controlled value'], [`${record.trust}%`, 'Trust coverage'], [record.actor, 'Accountable work centre']].map(([value, label]) => <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-4"><div className="font-mono text-[8px] uppercase text-gray-600">{label}</div><div className="mt-2 break-words text-[11px] text-gray-200">{value}</div></div>)}</section><GlassPanel className="mt-5 rounded-xl p-5"><div className="font-mono text-[8px] uppercase tracking-wider text-vertical-accent">Decision lineage</div><ol className="mt-5 space-y-5">{[
    ['1', 'Original capture', `${record.sourceRecord} was written in ${record.tenant} at ${record.site}.`],
    ['2', 'Domain control', `${record.actor} evaluated the record against ${record.vertical} operating rules.`],
    ['3', 'Canonical event', `${record.event} preserved tenant, location, actor, time and record identity.`],
    ['4', 'Ecosystem projection', `${record.id} entered this command scope without becoming a second source of truth.`],
    ['5', 'Accountable decision', record.decision],
  ].map(([step, label, detail]) => <li key={step} className="grid grid-cols-[28px_1fr] gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-vertical-accent/25 font-mono text-[8px] text-vertical-accent">{step}</span><span><span className="block text-[10px] text-white">{label}</span><span className="mt-1 block text-[9px] leading-4 text-gray-600">{detail}</span></span></li>)}</ol></GlassPanel><button type="button" onClick={() => { onClose(); navigate(record.route); }} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-vertical-accent text-[10px] font-semibold text-black">Open original tenant record <ArrowRight size={13} /></button></motion.aside></div>;
};

export const EcosystemWorkspace: React.FC<{ moduleId?: string }> = ({ moduleId = '' }) => {
  const { setCurrentVertical } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  const namespace = `ecosystem.${moduleId || 'command'}`;
  const { filters, update, reset } = useDomainFilters(namespace);
  const scoped = useMemo(() => filterRecords(filters), [filters]);
  const selectedId = searchParams.get('record');
  const selected = records.find((record) => record.id === selectedId);
  const meta = pageMeta[moduleId] ?? pageMeta[''];
  const Icon = meta.icon;

  useEffect(() => setCurrentVertical('global'), [setCurrentVertical]);

  const openRecord = (record: EcosystemRecord) => {
    const next = new URLSearchParams(searchParams);
    next.set('record', record.id);
    setSearchParams(next, { replace: true });
  };

  const closeRecord = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('record');
    setSearchParams(next, { replace: true });
  };

  const viewProps = { scoped, currency: filters.currency, onOpen: openRecord };
  const content = moduleId === 'portfolio-intelligence' ? <PortfolioView {...viewProps} />
    : moduleId === 'cross-vertical-ops' ? <CrossOpsView {...viewProps} />
      : moduleId === 'central-logistics' ? <LogisticsView {...viewProps} />
        : moduleId === 'treasury' ? <TreasuryView {...viewProps} />
          : moduleId === 'trust-control' ? <TrustView {...viewProps} />
            : moduleId === 'ai-operations' ? <AiOperationsView {...viewProps} />
              : moduleId === 'institutional-reporting' ? <InstitutionalReportingView {...viewProps} />
                : moduleId === 'system-health' ? <SystemHealthView {...viewProps} />
                  : <CommandView {...viewProps} />;

  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={moduleId || 'command'} className="mx-auto max-w-[1600px] space-y-5 pb-12"><header className="border-b border-white/[0.08] pb-5"><div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent"><Icon size={13} /> {meta.eyebrow}</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{meta.title}</h1><p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">{meta.description}</p></div><div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 xl:max-w-md"><div className="font-mono text-[7px] uppercase tracking-wider text-gray-600">Decision question</div><p className="mt-2 text-[10px] leading-4 text-gray-300">{meta.question}</p></div></div></header><DomainFilterBar label={meta.title} tenants={activeTenants} locations={locations} actors={actors} facetLabel="ERP / vertical" facetOptions={verticalNames} filters={filters} update={update} reset={reset} />{scoped.length ? content : <GlassPanel className="rounded-xl p-12 text-center"><Database size={24} className="mx-auto text-gray-700" /><h2 className="mt-4 text-sm text-white">No contributing records in this exact scope</h2><p className="mt-2 text-[10px] text-gray-600">Reset or broaden the country, tenant, status, owner, period, or ERP filter.</p></GlassPanel>}{moduleId === 'trust-control' && <GlassPanel className="rounded-xl p-5"><div className="h-[260px]"><TrustRadar scoped={scoped} /></div></GlassPanel>}{selected && <EvidenceDrawer record={selected} currency={filters.currency} onClose={closeRecord} />}</motion.div>;
};
