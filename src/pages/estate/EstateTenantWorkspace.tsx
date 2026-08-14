import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarClock,
  ChevronDown,
  Download,
  FileCheck2,
  Filter,
  HandCoins,
  House,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
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
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { Tenant } from '../../types';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { buildEstatePortfolio, type EstateEvidence, type EstateTenantSnapshot } from '../../estate/estatePortfolio';

type EstateTenantMode = 'erp' | 'analytics';
type OperatingRecord = {
  id: string;
  subject: string;
  assetClass: string;
  location: string;
  counterparty: string;
  owner: string;
  status: string;
  priority: string;
  due: string;
  amountGhs?: number;
  notes: string;
};

type OpsProfile = {
  title: string;
  description: string;
  entity: string;
  statuses: string[];
  subjects: string[];
  assetClasses: string[];
  showAmount?: boolean;
};

const opsProfiles: Record<string, OpsProfile> = {
  'property-register': { title: 'Property register', description: 'Create and control every property, unit, development, and land record owned or represented by this tenant.', entity: 'property', statuses: ['Draft', 'Verification', 'Available', 'Reserved', 'Occupied', 'Off market'], subjects: ['Airport Residential apartment A12', 'Cantonments townhouse C4', 'East Legon commercial suite 8'], assetClasses: ['Residential sale', 'Residential rental', 'Commercial', 'Development'] },
  listings: { title: 'Listings', description: 'Publish only mandate-backed, title-reviewed property supply with controlled price, media, and availability.', entity: 'listing', statuses: ['Draft', 'Evidence review', 'Published', 'Paused', 'Reserved', 'Closed'], subjects: ['Garden apartment listing', 'Executive rental listing', 'Serviced land listing'], assetClasses: ['Residential sale', 'Residential rental', 'Commercial', 'Land'] },
  'land-parcels': { title: 'Land parcels', description: 'Control parcel identity, survey references, tenure, site evidence, price, and subdivision status.', entity: 'parcel', statuses: ['Captured', 'Survey review', 'Title review', 'Market ready', 'Reserved', 'Transferred'], subjects: ['Ejisu plot cluster 14', 'Oduom serviced plots', 'Prampram development parcel'], assetClasses: ['Residential land', 'Commercial land', 'Development land'] },
  'owners-mandates': { title: 'Owners & mandates', description: 'Record beneficial ownership, representation rights, mandate dates, fees, and listing authority.', entity: 'mandate', statuses: ['Invited', 'KYC review', 'Mandate review', 'Active', 'Expiring', 'Suspended'], subjects: ['Airport Hills owner mandate', 'Nhyiaeso landlord portfolio', 'Lekki development authority'], assetClasses: ['Individual owner', 'Corporate owner', 'Developer', 'Estate'] },
  'title-files': { title: 'Title files', description: 'Adjudicate title, survey, encumbrance, authority, identity, and site evidence before market release.', entity: 'title case', statuses: ['Received', 'Registry check', 'Legal review', 'Exception', 'Verified', 'Rejected'], subjects: ['Airport Hills title package', 'Ejisu parcel schedule', 'Cantonments encumbrance search'], assetClasses: ['Leasehold', 'Freehold', 'Customary interest', 'Assignment'] },
  enquiries: { title: 'Enquiries', description: 'Capture buyer, renter, investor, and corporate demand while BLKK controls communication and progression.', entity: 'enquiry', statuses: ['New', 'Qualified', 'Matched', 'Viewing proposed', 'Offer ready', 'Closed'], subjects: ['Three-bedroom rental request', 'Accra investment apartment search', 'Serviced land requirement'], assetClasses: ['Buyer', 'Renter', 'Investor', 'Corporate occupier'] },
  viewings: { title: 'Viewings', description: 'Schedule access, assign an Estate agent, record attendance, capture feedback, and control follow-up.', entity: 'viewing', statuses: ['Requested', 'Access pending', 'Confirmed', 'Completed', 'No show', 'Follow-up'], subjects: ['Airport Residential viewing cohort', 'Cantonments apartment viewing', 'East Legon office inspection'], assetClasses: ['In-person viewing', 'Virtual viewing', 'Land site visit'] },
  inspections: { title: 'Inspections', description: 'Capture condition, room and boundary checks, defects, media, signatures, and release decisions.', entity: 'inspection', statuses: ['Planned', 'Assigned', 'On site', 'Evidence review', 'Passed', 'Remediation'], subjects: ['Ahodwo phase B snag inspection', 'Labone tenancy exit inspection', 'Ejisu boundary inspection'], assetClasses: ['Property condition', 'Land boundary', 'Handover', 'Exit'] },
  offers: { title: 'Offers', description: 'Control price, conditions, expiry, negotiation, approval, and the transition to deposit or agreement.', entity: 'offer', statuses: ['Draft', 'Advisor review', 'Submitted', 'Countered', 'Accepted', 'Declined'], subjects: ['Cantonments purchase offer', 'Airport rental offer', 'Oduom plot reservation offer'], assetClasses: ['Purchase', 'Rental', 'Land reservation', 'Commercial lease'], showAmount: true },
  agreements: { title: 'Agreements', description: 'Prepare, review, sign, retain, and version sale, lease, management, and reservation agreements.', entity: 'agreement', statuses: ['Draft', 'Legal review', 'Sent for signature', 'Part signed', 'Executed', 'Superseded'], subjects: ['Residential tenancy agreement', 'Property sale agreement', 'Land reservation agreement'], assetClasses: ['Sale agreement', 'Tenancy agreement', 'Management agreement', 'Reservation'], showAmount: true },
  deposits: { title: 'Deposits & escrow', description: 'Control reservation deposits, rent deposits, holds, release conditions, refunds, and reconciliation.', entity: 'deposit', statuses: ['Expected', 'Pending receipt', 'Held', 'Release review', 'Released', 'Refunded'], subjects: ['Cantonments handover deposit', 'Airport tenancy security deposit', 'Oduom plot reservation'], assetClasses: ['Reservation', 'Security deposit', 'Earnest money', 'Rent advance'], showAmount: true },
  handovers: { title: 'Handovers', description: 'Complete meter, key, condition, document, possession, and release evidence before closing.', entity: 'handover', statuses: ['Planned', 'Checklist open', 'Party sign-off', 'Release review', 'Completed', 'Reopened'], subjects: ['Cantonments unit ER-221', 'East Legon suite handover', 'Nhyiaeso tenancy possession'], assetClasses: ['Sale handover', 'Rental move-in', 'Rental move-out', 'Land possession'] },
  leases: { title: 'Leases', description: 'Control tenancy terms, notice dates, renewals, rent reviews, occupants, deposits, and obligations.', entity: 'lease', statuses: ['Draft', 'Screening', 'Active', 'Renewal due', 'Notice served', 'Closed'], subjects: ['Nhyiaeso renewal cohort', 'Labone apartment tenancy', 'Ikeja commercial lease'], assetClasses: ['Residential lease', 'Commercial lease', 'Short stay', 'Ground lease'], showAmount: true },
  'rent-ledger': { title: 'Rent ledger', description: 'Post rent charges, receipts, arrears, credits, deposits, and collection actions by lease and unit.', entity: 'rent entry', statuses: ['Due', 'Part paid', 'Paid', 'Overdue', 'Disputed', 'Written off'], subjects: ['August residential rent batch', 'Commercial service charge', 'Lease escalation adjustment'], assetClasses: ['Rent', 'Service charge', 'Utility recovery', 'Arrears'], showAmount: true },
  maintenance: { title: 'Maintenance cases', description: 'Log tenant requests, triage severity, assign approved vendors, authorize cost, and retain completion evidence.', entity: 'maintenance case', statuses: ['New', 'Triaged', 'Vendor assigned', 'In progress', 'Quality check', 'Closed'], subjects: ['Labone unit AC failure', 'Cape Coast roof remediation', 'Yaba lift service case'], assetClasses: ['Emergency', 'Corrective', 'Preventive', 'Common area'], showAmount: true },
  vendors: { title: 'Vendors', description: 'Control trades, coverage, rates, insurance, tax records, performance, and approved status.', entity: 'vendor', statuses: ['Invited', 'Due diligence', 'Approved', 'Conditional', 'Suspended', 'Expired'], subjects: ['Electrical services vendor', 'Plumbing response team', 'Property inspection partner'], assetClasses: ['Electrical', 'Plumbing', 'Civil works', 'Inspection'] },
  workforce: { title: 'Estate workforce', description: 'Manage agents, property managers, inspectors, legal reviewers, shifts, targets, and commissions.', entity: 'team record', statuses: ['Active', 'On assignment', 'On leave', 'Training due', 'Review', 'Inactive'], subjects: ['Estate advisor portfolio', 'Property manager assignment', 'Title reviewer workload'], assetClasses: ['Estate agent', 'Property manager', 'Inspector', 'Legal reviewer'] },
  finance: { title: 'Estate finance', description: 'Control commissions, rent receipts, deposits, management fees, receivables, payables, tax, and reconciliation.', entity: 'finance entry', statuses: ['Draft', 'Pending approval', 'Posted', 'Reconciled', 'Exception', 'Reversed'], subjects: ['Management fee accrual', 'Estate agent commission', 'Deposit control reconciliation'], assetClasses: ['Revenue', 'Commission', 'Receivable', 'Payable'], showAmount: true },
};

const analyticsTitles: Record<string, [string, string]> = {
  dashboard: ['Estate analytics dashboard', 'Everything important about this Estate tenant at a glance, with every measure scoped to property operations.'],
  supply: ['Supply & listing intelligence', 'Find the property classes, locations, price bands, and title gaps shaping marketable supply.'],
  rentals: ['Rentals & occupancy intelligence', 'Measure occupancy, vacancy, rent roll, arrears, renewals, and tenant service pressure.'],
  land: ['Land intelligence', 'Compare parcel supply, title readiness, site demand, reservation value, and geography.'],
  title: ['Title & verification intelligence', 'Locate evidence gaps, review ageing, exposure, source quality, and release bottlenecks.'],
  demand: ['Demand intelligence', 'Understand buyer, renter, investor, and corporate intent by location, asset class, budget, and stage.'],
  viewings: ['Viewing conversion', 'Compare access confirmation, attendance, feedback, offer progression, and agent follow-up.'],
  deals: ['Deal conversion', 'Trace qualified intent through offer, deposit, agreement, handover, and value realization.'],
  maintenance: ['Maintenance performance', 'Compare response SLA, vendor completion, repeat defects, property exposure, and cost.'],
  workforce: ['Estate workforce performance', 'Compare agent conversion, inspection quality, property workload, collection, and service outcomes.'],
  finance: ['Estate finance analytics', 'Explain rent, commissions, deposits, management fees, receivables, cash, and portfolio contribution.'],
  marketing: ['Property marketing attribution', 'Connect campaign spend and listing distribution to qualified demand, viewings, offers, and deposits.'],
  reports: ['Reports & evidence', 'Assemble controlled Estate reports and drill every reported claim back to its contributing record.'],
};

const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', notation: 'compact', maximumFractionDigits: 1 });
const fullMoney = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });
const count = new Intl.NumberFormat('en-GH');
const colours = ['#34d399', '#22d3ee', '#fbbf24', '#a78bfa', '#fb7185'];
const today = new Date().toISOString().slice(0, 10);

const getSnapshot = (tenant: Tenant) => buildEstatePortfolio().tenants.find((item) => item.id === tenant.id) ?? buildEstatePortfolio().tenants[0];

const recordSeed = (profile: OpsProfile, snapshot: EstateTenantSnapshot): OperatingRecord[] => profile.subjects.map((subject, index) => ({
  id: `EST-${snapshot.id.slice(0, 3).toUpperCase()}-${401 + index}`,
  subject,
  assetClass: profile.assetClasses[index % profile.assetClasses.length],
  location: snapshot.locations[index % snapshot.locations.length]?.portfolio ?? 'Tenant portfolio',
  counterparty: ['Owner record', 'Qualified client', 'Approved vendor'][index % 3],
  owner: ['Portfolio desk', 'Title & Legal', 'Property manager'][index % 3],
  status: profile.statuses[Math.min(index + 1, profile.statuses.length - 1)],
  priority: ['High', 'Normal', 'Low'][index % 3],
  due: new Date(Date.now() + (index + 1) * 86400000).toISOString().slice(0, 10),
  amountGhs: profile.showAmount ? [420000, 184000, 46000][index] : undefined,
  notes: `Controlled ${profile.entity} record for ${subject}.`,
}));

const loadRecords = (key: string, seed: OperatingRecord[]) => {
  if (typeof window === 'undefined') return seed;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as OperatingRecord[] : seed;
  } catch {
    return seed;
  }
};

const saveCsv = (filename: string, rows: OperatingRecord[]) => {
  const headers = ['Reference', 'Subject', 'Class', 'Location', 'Counterparty', 'Owner', 'Status', 'Priority', 'Due', 'Amount GHS', 'Notes'];
  const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers, ...rows.map((row) => [row.id, row.subject, row.assetClass, row.location, row.counterparty, row.owner, row.status, row.priority, row.due, row.amountGhs ?? '', row.notes])].map((row) => row.map(quote).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const MetricCard = ({ label, value, detail, icon: Icon, tone = 'text-emerald-300' }: { label: string; value: string; detail: string; icon: React.ElementType; tone?: string }) => <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4"><div className="flex items-center justify-between"><span className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-500">{label}</span><Icon size={15} className={tone} /></div><div className="mt-4 text-xl font-medium text-white">{value}</div><div className="mt-2 text-[9px] leading-4 text-gray-600">{detail}</div></div>;

const EstateOperations = ({ tenant, moduleId }: { tenant: Tenant; moduleId: string }) => {
  const snapshot = getSnapshot(tenant);
  const profile = opsProfiles[moduleId] ?? opsProfiles['property-register'];
  const storageKey = `adinkra_estate_ops:${tenant.id}:${moduleId}`;
  const seed = useMemo(() => recordSeed(profile, snapshot), [profile, snapshot]);
  const [records, setRecords] = useState<OperatingRecord[]>(() => loadRecords(storageKey, seed));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [location, setLocation] = useState('All portfolios');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<OperatingRecord>(() => ({ id: '', subject: '', assetClass: profile.assetClasses[0], location: snapshot.locations[0]?.portfolio ?? '', counterparty: '', owner: 'Portfolio desk', status: profile.statuses[0], priority: 'Normal', due: today, amountGhs: profile.showAmount ? 0 : undefined, notes: '' }));
  const filtered = records.filter((row) => (status === 'All statuses' || row.status === status) && (location === 'All portfolios' || row.location === location) && `${row.id} ${row.subject} ${row.counterparty} ${row.owner}`.toLowerCase().includes(search.toLowerCase()));
  const persist = (next: OperatingRecord[]) => { setRecords(next); window.localStorage.setItem(storageKey, JSON.stringify(next)); };
  const updateStatus = (id: string, nextStatus: string) => persist(records.map((row) => row.id === id ? { ...row, status: nextStatus } : row));
  const createRecord = () => {
    if (!draft.subject.trim()) return;
    const next = [{ ...draft, id: `EST-${moduleId.slice(0, 3).toUpperCase()}-${String(records.length + 1).padStart(3, '0')}` }, ...records];
    persist(next);
    setOpen(false);
  };
  const openCount = records.filter((row) => !['Available', 'Published', 'Active', 'Verified', 'Accepted', 'Executed', 'Released', 'Completed', 'Paid', 'Closed', 'Reconciled'].includes(row.status)).length;
  const dueSoon = records.filter((row) => row.due <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).length;
  const value = records.reduce((total, row) => total + (row.amountGhs ?? 0), 0);
  const entityPlural = profile.entity.endsWith('y') ? `${profile.entity.slice(0, -1)}ies` : `${profile.entity}s`;

  if (moduleId === 'reports') return <EstateReports tenant={tenant} snapshot={snapshot} />;
  if (moduleId === 'audit') return <EstateAudit tenant={tenant} snapshot={snapshot} />;
  if (moduleId === 'settings') return <EstateSettings tenant={tenant} snapshot={snapshot} />;

  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1560px] space-y-5 pb-12">
    <header className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-end"><div><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300">{tenant.name} ERP · {profile.entity} control</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{profile.title}</h1><p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">{profile.description}</p></div><div className="flex gap-2"><button onClick={() => saveCsv(`${tenant.id}-${moduleId}.csv`, filtered)} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.09] px-3 text-[9px] text-gray-300"><Download size={13} /> Export CSV</button><button onClick={() => setOpen(true)} className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-300 px-4 text-[10px] font-semibold text-black"><Plus size={14} /> New {profile.entity}</button></div></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label={`Total ${entityPlural}`} value={count.format(records.length)} detail="Records in the selected tenant ledger" icon={Building2} /><MetricCard label="Open work" value={count.format(openCount)} detail="Records that still require an operating decision" icon={AlertTriangle} tone="text-amber-200" /><MetricCard label="Due within 7 days" value={count.format(dueSoon)} detail="Deadlines inside the active control window" icon={CalendarClock} tone="text-cyan-300" />{profile.showAmount ? <MetricCard label="Controlled value" value={money.format(value)} detail="Value represented by the filtered records" icon={HandCoins} /> : <MetricCard label="Source coverage" value={`${snapshot.confidence}%`} detail="Tenant simulation evidence confidence" icon={BadgeCheck} />}</section>
    <GlassPanel className="rounded-xl p-4"><div className="grid gap-3 lg:grid-cols-[1fr_220px_260px_auto]"><label className="relative"><Search size={14} className="absolute left-3 top-3 text-gray-600" /><input aria-label={`Search ${profile.entity} records`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search reference, ${profile.entity}, party, or owner`} className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-white outline-none focus:border-emerald-300/40" /></label><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[10px] text-gray-300"><option>All statuses</option>{profile.statuses.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by portfolio" value={location} onChange={(event) => setLocation(event.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[10px] text-gray-300"><option>All portfolios</option>{snapshot.locations.map((item) => <option key={item.portfolio}>{item.portfolio}</option>)}</select><div className="flex items-center justify-end gap-2 rounded-lg border border-white/[0.07] px-3 font-mono text-[8px] uppercase text-gray-600"><Filter size={12} /> {filtered.length} records</div></div></GlassPanel>
    <GlassPanel className="overflow-hidden rounded-xl"><div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left"><thead className="border-b border-white/[0.07] bg-white/[0.02] text-[8px] font-mono uppercase tracking-wider text-gray-600"><tr><th className="px-5 py-3">Reference</th><th className="px-3 py-3">{profile.entity}</th><th className="px-3 py-3">Class</th><th className="px-3 py-3">Portfolio</th><th className="px-3 py-3">Counterparty</th><th className="px-3 py-3">Owner</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Due</th>{profile.showAmount && <th className="px-3 py-3 text-right">Amount</th>}<th className="px-5 py-3" /></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} className="border-b border-white/[0.05] text-[10px] hover:bg-white/[0.02]"><td className="px-5 py-4 font-mono text-emerald-300">{row.id}</td><td className="px-3 py-4"><div className="text-[11px] text-white">{row.subject}</div><div className="mt-1 text-[8px] text-gray-600">{row.priority} priority</div></td><td className="px-3 py-4 text-gray-400">{row.assetClass}</td><td className="px-3 py-4 text-gray-400">{row.location}</td><td className="px-3 py-4 text-gray-400">{row.counterparty}</td><td className="px-3 py-4 text-gray-400">{row.owner}</td><td className="px-3 py-4"><select aria-label={`Status for ${row.id}`} value={row.status} onChange={(event) => updateStatus(row.id, event.target.value)} className="h-8 rounded border border-white/[0.08] bg-[#0b0b0b] px-2 text-[9px] text-gray-300">{profile.statuses.map((item) => <option key={item}>{item}</option>)}</select></td><td className="px-3 py-4 font-mono text-gray-500">{row.due}</td>{profile.showAmount && <td className="px-3 py-4 text-right font-mono text-gray-300">{fullMoney.format(row.amountGhs ?? 0)}</td>}<td className="px-5 py-4"><button className="text-gray-600 hover:text-emerald-300" aria-label={`Open ${row.id}`}><ArrowRight size={13} /></button></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="p-10 text-center text-xs text-gray-600">No {profile.entity} records match the current filters.</div>}</GlassPanel>
    {open && <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"><div className="mx-auto my-8 max-h-[calc(100vh-4rem)] max-w-4xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#090909] shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#090909]/95 px-6 py-5 backdrop-blur"><div><div className="font-mono text-[8px] uppercase tracking-wider text-emerald-300">Create controlled record</div><h2 className="mt-2 text-xl font-medium text-white">New {profile.entity}</h2></div><button onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><X size={16} /></button></div><div className="grid gap-5 p-6 md:grid-cols-2"><Field label={`${profile.entity} / subject`}><input value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} className="field" placeholder={`Describe the ${profile.entity}`} /></Field><Field label="Record class"><select value={draft.assetClass} onChange={(event) => setDraft({ ...draft, assetClass: event.target.value })} className="field">{profile.assetClasses.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Portfolio / property location"><select value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} className="field">{snapshot.locations.map((item) => <option key={item.portfolio}>{item.portfolio}</option>)}</select></Field><Field label="Counterparty / related party"><input value={draft.counterparty} onChange={(event) => setDraft({ ...draft, counterparty: event.target.value })} className="field" placeholder="Select or enter controlled party" /></Field><Field label="Responsible desk"><select value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} className="field"><option>Portfolio desk</option><option>Title & Legal</option><option>Viewing coordinator</option><option>Property manager</option><option>Finance control</option></select></Field><Field label="Initial workflow status"><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className="field">{profile.statuses.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Priority"><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })} className="field"><option>High</option><option>Normal</option><option>Low</option></select></Field><Field label="Due / review date"><input type="date" value={draft.due} onChange={(event) => setDraft({ ...draft, due: event.target.value })} className="field" /></Field>{profile.showAmount && <Field label="Controlled amount (GHS)"><input type="number" min="0" value={draft.amountGhs ?? 0} onChange={(event) => setDraft({ ...draft, amountGhs: Number(event.target.value) })} className="field" /></Field>}<div className="md:col-span-2"><Field label="Evidence, conditions, or operating note"><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="field min-h-32 resize-y" placeholder="Record the facts needed for the next accountable decision." /></Field></div></div><div className="sticky bottom-0 flex justify-end gap-3 border-t border-white/[0.08] bg-[#090909]/95 px-6 py-5 backdrop-blur"><button onClick={() => setOpen(false)} className="min-h-11 rounded-lg border border-white/[0.08] px-5 text-xs text-gray-400">Cancel</button><button onClick={createRecord} className="min-h-11 rounded-lg bg-emerald-300 px-6 text-xs font-semibold text-black">Save {profile.entity}</button></div></div></div>}
  </motion.div>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="space-y-2"><span className="block font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>{children}</label>;

const EstateAnalytics = ({ tenant, moduleId }: { tenant: Tenant; moduleId: string }) => {
  const snapshot = getSnapshot(tenant);
  const [title, description] = analyticsTitles[moduleId] ?? analyticsTitles.dashboard;
  const [period, setPeriod] = useState('30D');
  const [portfolio, setPortfolio] = useState('All portfolios');
  const location = snapshot.locations.find((item) => item.portfolio === portfolio);
  const ratio = location ? location.portfolioValueGhs / snapshot.locations.reduce((sum, item) => sum + item.portfolioValueGhs, 0) : 1;
  const metric = (value: number) => Math.round(value * ratio);
  const mix = Object.entries(snapshot.propertyMix).map(([name, value]) => ({ name, value: metric(value) }));
  const trend = snapshot.monthlyControlledValueGhs.map((value, index) => ({ month: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][index], value: Math.round(value * ratio), rent: Math.round(snapshot.rentRollGhs * ratio * (0.72 + index * 0.055)) }));
  const stages = [
    { name: 'Qualified intent', value: metric(snapshot.qualifiedDemand) },
    { name: 'Title-ready match', value: metric(Math.round(snapshot.qualifiedDemand * 0.71)) },
    { name: 'Viewing completed', value: metric(Math.round(snapshot.qualifiedDemand * 0.49)) },
    { name: 'Controlled offer', value: metric(snapshot.controlledOffers) },
    { name: 'Deposit secured', value: metric(Math.round(snapshot.controlledOffers * 0.64)) },
  ];
  const locationBars = snapshot.locations.map((item) => ({ name: item.office.replace(' Office', ''), supply: item.availableProperties, demand: item.qualifiedDemand, deposits: item.depositsHeldGhs / 10000 }));
  const performance = snapshot.locations.map((item, index) => ({ name: item.office, conversion: 14 + index * 6, response: 82 + index * 4, value: item.portfolioValueGhs / 100000, size: item.qualifiedDemand }));
  const evidence = snapshot.evidence.filter((item) => moduleId === 'dashboard' || moduleId === 'reports' || ({ title: 'title-files', viewings: 'viewings', deals: 'offers', maintenance: 'maintenance', rentals: 'leases' } as Record<string, string>)[moduleId] === item.route.split('/').pop());
  const isFunnel = ['demand', 'viewings', 'deals', 'marketing'].includes(moduleId);
  const isScatter = ['workforce', 'maintenance'].includes(moduleId);
  const isComposition = ['supply', 'rentals', 'land', 'title'].includes(moduleId);

  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1560px] space-y-5 pb-12">
    <header className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end"><div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300"><BarChart3 size={13} /> {tenant.name} analytics · {moduleId}</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{title}</h1><p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">{description}</p></div><div className="flex flex-wrap gap-2"><div className="flex rounded-lg border border-white/[0.08] p-1">{['Today', '7D', '30D', 'YTD'].map((item) => <button key={item} onClick={() => setPeriod(item)} className={`min-h-8 rounded-md px-3 text-[9px] ${period === item ? 'bg-emerald-300 text-black' : 'text-gray-500'}`}>{item}</button>)}</div><select aria-label="Analytics portfolio" value={portfolio} onChange={(event) => setPortfolio(event.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[9px] text-gray-300"><option>All portfolios</option>{snapshot.locations.map((item) => <option key={item.portfolio}>{item.portfolio}</option>)}</select></div></header>
    <section aria-label="Estate analytics measures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><MetricCard label="Active properties" value={count.format(metric(snapshot.activeProperties))} detail={`${count.format(metric(snapshot.availableProperties))} currently available`} icon={House} /><MetricCard label="Title readiness" value={`${(snapshot.titleReadyListings / snapshot.verifiedListings * 100).toFixed(1)}%`} detail={`${metric(snapshot.titleReadyListings)} title-ready listings`} icon={ShieldCheck} /><MetricCard label="Rental occupancy" value={`${(snapshot.occupiedRentalUnits / snapshot.rentalUnits * 100).toFixed(1)}%`} detail={`${metric(snapshot.rentalUnits - snapshot.occupiedRentalUnits)} vacant rental units`} icon={KeyRound} /><MetricCard label="Qualified demand" value={count.format(metric(snapshot.qualifiedDemand))} detail={`${metric(snapshot.viewingsDue)} viewings require coordination`} icon={Users} /><MetricCard label="Controlled deposits" value={money.format(snapshot.depositsHeldGhs * ratio)} detail="Funds held behind agreement and handover controls" icon={HandCoins} /><MetricCard label="Exceptions" value={count.format(metric(snapshot.exceptions))} detail="Title, lease, deposit, and maintenance actions" icon={AlertTriangle} tone="text-rose-300" /></section>
    {moduleId === 'dashboard' && <section className="grid gap-4 lg:grid-cols-3"><GlassPanel className="rounded-xl p-5 lg:col-span-2"><h2 className="text-sm font-medium text-white">Controlled value trend</h2><p className="mt-1 text-[9px] text-gray-600">Property transactions and rent controlled through the selected portfolio.</p><div className="mt-4 h-[270px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="estateTenantValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.35} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(value) => money.format(value)} axisLine={false} /><Tooltip /><Area dataKey="value" name="Controlled value" stroke="#34d399" fill="url(#estateTenantValue)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></GlassPanel><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Property class mix</h2><p className="mt-1 text-[9px] text-gray-600">Supply is separated by how the asset is operated.</p><div className="h-[210px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={mix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}>{mix.map((item, index) => <Cell key={item.name} fill={colours[index % colours.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="space-y-2">{mix.map((item, index) => <div key={item.name} className="flex justify-between text-[9px]"><span className="flex items-center gap-2 text-gray-500"><span className="h-2 w-2 rounded-full" style={{ background: colours[index % colours.length] }} />{item.name}</span><span className="font-mono text-gray-300">{item.value}</span></div>)}</div></GlassPanel></section>}
    {moduleId !== 'dashboard' && <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">{isFunnel ? 'Stage conversion and loss' : isScatter ? 'Performance relationship' : isComposition ? 'Portfolio composition' : 'Value movement over time'}</h2><p className="mt-1 text-[9px] text-gray-600">The visual changes with the decision this page exists to support.</p><div className="mt-4 h-[300px]">{isFunnel ? <div className="space-y-3 pt-2">{stages.map((stage, index) => { const width = stages[0].value ? Math.max(10, stage.value / stages[0].value * 100) : 10; return <div key={stage.name}><div className="mb-1 flex justify-between text-[9px]"><span className="text-gray-400">{stage.name}</span><span className="font-mono text-gray-300">{stage.value}{index > 0 && <span className="ml-2 text-rose-300">-{stages[index - 1].value - stage.value}</span>}</span></div><div className="h-8 rounded bg-white/[0.04]"><div className="flex h-full items-center rounded bg-gradient-to-r from-emerald-300 to-cyan-300/40 px-3 font-mono text-[8px] text-black" style={{ width: `${width}%` }}>{Math.round(width)}%</div></div></div>; })}</div> : isScatter ? <ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid stroke="rgba(255,255,255,0.05)" /><XAxis type="number" dataKey="response" name="Response score" stroke="#64748b" tick={{ fontSize: 9 }} /><YAxis type="number" dataKey="conversion" name="Outcome rate" stroke="#64748b" tick={{ fontSize: 9 }} /><ZAxis type="number" dataKey="size" range={[120, 600]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Scatter data={performance} fill="#34d399" /></ScatterChart></ResponsiveContainer> : isComposition ? <ResponsiveContainer width="100%" height="100%"><BarChart data={locationBars}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} /><Tooltip /><Bar dataKey="supply" name="Available supply" fill="#34d399" radius={[4, 4, 0, 0]} /><Bar dataKey="demand" name="Qualified demand" fill="#22d3ee" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 9 }} /><YAxis stroke="#64748b" tick={{ fontSize: 9 }} /><Tooltip /><Area dataKey="value" name="Controlled value" stroke="#34d399" fill="#34d39922" /><Area dataKey="rent" name="Rent roll" stroke="#22d3ee" fill="#22d3ee18" /></AreaChart></ResponsiveContainer>}</div></GlassPanel><GlassPanel className="rounded-xl p-5"><h2 className="text-sm font-medium text-white">Location comparison</h2><p className="mt-1 text-[9px] text-gray-600">Supply, demand, and deposit contribution by office.</p><div className="mt-5 space-y-4">{snapshot.locations.map((item) => <div key={item.office} className="rounded-lg border border-white/[0.07] p-4"><div className="flex items-center justify-between"><div><div className="text-[11px] text-white">{item.office}</div><div className="mt-1 text-[8px] text-gray-600">{item.city} · {item.portfolio}</div></div><span className="font-mono text-[9px] text-emerald-300">{money.format(item.portfolioValueGhs)}</span></div><div className="mt-4 grid grid-cols-3 gap-2">{[[item.availableProperties, 'Available'], [item.qualifiedDemand, 'Demand'], [money.format(item.depositsHeldGhs), 'Deposits']].map(([value, label]) => <div key={label}><div className="font-mono text-[9px] text-gray-300">{value}</div><div className="mt-1 text-[7px] uppercase text-gray-700">{label}</div></div>)}</div></div>)}</div></GlassPanel></section>}
    <GlassPanel className="overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm font-medium text-white">Contributing Estate evidence</h2><p className="mt-1 text-[9px] text-gray-600">These are the operating records behind the selected claim—not a generic ledger.</p></div><FileCheck2 size={16} className="text-emerald-300" /></div><div className="divide-y divide-white/[0.06]">{(evidence.length ? evidence : snapshot.evidence).map((item: EstateEvidence) => <button key={item.id} className="grid w-full gap-3 px-5 py-4 text-left hover:bg-white/[0.025] md:grid-cols-[90px_1fr_180px_100px]"><span className="font-mono text-[9px] text-emerald-300">{item.id}</span><span><span className="block text-[11px] text-white">{item.subject}</span><span className="mt-1 block text-[9px] text-gray-600">{item.detail}</span></span><span className="text-[9px] text-gray-400">{item.domain} · {item.location}</span><span className="flex items-center justify-end gap-2 font-mono text-[9px] text-gray-300">{item.exposureGhs ? money.format(item.exposureGhs) : item.state}<ArrowRight size={11} /></span></button>)}</div></GlassPanel>
  </motion.div>;
};

const EstateReports = ({ tenant, snapshot }: { tenant: Tenant; snapshot: EstateTenantSnapshot }) => {
  const [report, setReport] = useState('Property portfolio report');
  const [period, setPeriod] = useState('This month');
  const [sections, setSections] = useState(['Executive summary', 'Property supply', 'Title exceptions', 'Demand & viewings']);
  const options = ['Executive summary', 'Property supply', 'Title exceptions', 'Demand & viewings', 'Offers & deposits', 'Rental occupancy', 'Rent arrears', 'Maintenance performance', 'Agent performance'];
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-[1500px] space-y-5 pb-12"><header className="border-b border-white/[0.08] pb-5"><div className="font-mono text-[9px] uppercase tracking-wider text-emerald-300">{tenant.name} ERP · controlled reporting</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">Estate report builder</h1><p className="mt-2 text-xs text-gray-500">Choose the exact Estate report, scope, period, and sections. Every retained claim remains connected to source records.</p></header><div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]"><GlassPanel className="rounded-xl p-5"><div className="space-y-4"><Field label="Report type"><select value={report} onChange={(event) => setReport(event.target.value)} className="field"><option>Property portfolio report</option><option>Sales pipeline report</option><option>Rental performance report</option><option>Land & title report</option><option>Maintenance report</option><option>Agent performance report</option><option>Deposits & escrow report</option></select></Field><Field label="Reporting period"><select value={period} onChange={(event) => setPeriod(event.target.value)} className="field"><option>Today</option><option>This week</option><option>This month</option><option>This quarter</option><option>Year to date</option><option>Custom dates</option></select></Field><Field label="Portfolio"><select className="field"><option>All portfolios</option>{snapshot.locations.map((item) => <option key={item.portfolio}>{item.portfolio}</option>)}</select></Field><div><div className="mb-2 font-mono text-[8px] uppercase tracking-wider text-gray-600">Report sections</div><div className="grid gap-2">{options.map((item) => <label key={item} className="flex min-h-10 items-center gap-3 rounded-lg border border-white/[0.07] px-3 text-[10px] text-gray-400"><input type="checkbox" checked={sections.includes(item)} onChange={() => setSections((current) => current.includes(item) ? current.filter((section) => section !== item) : [...current, item])} />{item}</label>)}</div></div><button onClick={() => window.print()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 text-xs font-semibold text-black"><Download size={14} /> Print / save as PDF</button></div></GlassPanel><article className="rounded-xl bg-[#f7f5ef] p-8 text-[#151515] shadow-2xl"><div className="flex justify-between border-b border-black/15 pb-5"><div><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-700">Controlled Estate report</div><h2 className="mt-3 text-3xl font-semibold">{report}</h2><p className="mt-2 text-sm text-gray-600">{tenant.name} · {period}</p></div><div className="text-right text-xs text-gray-500">LIVE PREVIEW<br />{today}</div></div><div className="mt-6 grid grid-cols-4 gap-3">{[[snapshot.activeProperties, 'Active properties'], [snapshot.availableProperties, 'Available'], [`${(snapshot.occupiedRentalUnits / snapshot.rentalUnits * 100).toFixed(1)}%`, 'Occupancy'], [money.format(snapshot.depositsHeldGhs), 'Deposits held']].map(([value, label]) => <div key={label} className="border border-black/10 p-3"><div className="text-lg font-semibold">{value}</div><div className="mt-1 text-[9px] uppercase text-gray-500">{label}</div></div>)}</div><div className="mt-8 space-y-6">{sections.map((section) => <section key={section}><h3 className="border-b border-black/10 pb-2 text-sm font-semibold">{section}</h3><p className="mt-3 text-xs leading-5 text-gray-600">This section is generated from the selected {tenant.name} Estate records and retains tenant, portfolio, period, record identity, and evidence lineage.</p></section>)}</div></article></div></motion.div>;
};

const EstateAudit = ({ tenant, snapshot }: { tenant: Tenant; snapshot: EstateTenantSnapshot }) => <div className="mx-auto max-w-[1500px] space-y-5 pb-12"><header className="border-b border-white/[0.08] pb-5"><div className="font-mono text-[9px] uppercase tracking-wider text-emerald-300">{tenant.name} ERP · accountable actor trail</div><h1 className="mt-3 text-3xl font-display font-semibold">Estate audit log</h1><p className="mt-2 text-xs text-gray-500">Who changed which Estate record, when, from where, and what evidence or value was affected.</p></header><section className="grid gap-3 sm:grid-cols-3"><MetricCard label="Recorded actions" value="184" detail="Create, update, approve, export, and status actions" icon={FileCheck2} /><MetricCard label="Property scope" value={`${snapshot.offices} offices`} detail={`${snapshot.activeProperties} property and land records`} icon={Building2} /><MetricCard label="Unresolved review" value={`${snapshot.exceptions}`} detail="Actions still requiring accountable review" icon={AlertTriangle} tone="text-rose-300" /></section><GlassPanel className="overflow-hidden rounded-xl"><div className="grid gap-3 border-b border-white/[0.08] p-4 md:grid-cols-4"><input className="field" placeholder="Search actor, record, or action" /><select className="field"><option>All Estate modules</option><option>Property register</option><option>Title files</option><option>Offers</option><option>Deposits</option><option>Leases</option></select><select className="field"><option>All actions</option><option>Create</option><option>Update</option><option>Approve</option><option>Export</option></select><input type="date" className="field" /></div><div className="divide-y divide-white/[0.06]">{snapshot.evidence.map((item, index) => <div key={item.id} className="grid gap-3 px-5 py-4 text-[10px] md:grid-cols-[130px_140px_1fr_180px]"><span className="font-mono text-gray-500">2026-08-0{8 - index} 0{9 + index}:24</span><span className="text-emerald-300">{['Portfolio desk', 'Title reviewer', 'Property manager', 'Finance control'][index]}</span><span><span className="block text-white">Updated {item.id} · {item.subject}</span><span className="mt-1 block text-[8px] text-gray-600">{item.domain} status/evidence decision · {item.detail}</span></span><span className="text-right font-mono text-gray-500">{item.location}</span></div>)}</div></GlassPanel></div>;

const EstateSettings = ({ tenant, snapshot }: { tenant: Tenant; snapshot: EstateTenantSnapshot }) => <div className="mx-auto max-w-[1400px] space-y-5 pb-12"><header className="border-b border-white/[0.08] pb-5"><div className="font-mono text-[9px] uppercase tracking-wider text-emerald-300">{tenant.name} ERP · technical controls</div><h1 className="mt-3 text-3xl font-display font-semibold">Estate system settings</h1><p className="mt-2 text-xs text-gray-500">Technical tenant-wide configuration only. Rent rules, taxes, commissions, and operating approvals remain inside Finance and their owning modules.</p></header><div className="grid gap-4 md:grid-cols-2"><SettingsPanel title="Record identity" detail="Prefixes and numbering for property, title, viewing, lease, maintenance, and deposit records." fields={['Estate record prefix: EST', 'Timezone: Africa/Accra', 'Base currency: GHS']} /><SettingsPanel title="Location hierarchy" detail="Tenant → country → city → office → portfolio controls used across ERP and Analytics." fields={snapshot.locations.map((item) => `${item.country} / ${item.city} / ${item.office} / ${item.portfolio}`)} /><SettingsPanel title="Access & security" detail="Authentication, session, role, and approval controls for Estate records." fields={['MFA required for approvals', 'Deposit release requires two actors', 'Title release limited to Legal role']} /><SettingsPanel title="Integrations" detail="Typed connector seams for the later Estate backend merge." fields={['Property registry connector · simulated', 'MoMo / bank escrow · simulated', 'Maps and geocoding · simulated']} /></div></div>;

const SettingsPanel = ({ title, detail, fields }: { title: string; detail: string; fields: string[] }) => <GlassPanel className="rounded-xl p-5"><div className="flex items-start justify-between"><div><h2 className="text-sm font-medium text-white">{title}</h2><p className="mt-1 text-[9px] leading-4 text-gray-600">{detail}</p></div><SlidersHorizontal size={15} className="text-emerald-300" /></div><div className="mt-5 space-y-2">{fields.map((item) => <div key={item} className="flex min-h-10 items-center justify-between rounded-lg border border-white/[0.07] px-3 text-[10px] text-gray-400"><span>{item}</span><ChevronDown size={12} className="text-gray-700" /></div>)}</div></GlassPanel>;

export const EstateTenantWorkspace = ({ tenant, mode, moduleId }: { tenant: Tenant; mode: EstateTenantMode; moduleId: string }) => mode === 'erp' ? <EstateOperations tenant={tenant} moduleId={moduleId} /> : <EstateAnalytics tenant={tenant} moduleId={moduleId} />;
