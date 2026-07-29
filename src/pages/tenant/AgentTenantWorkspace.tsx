import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, MapPin, ShieldCheck, Signal, Users, X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { useTenant } from '../../context/TenantContext';
import { AGENT_TREND, AgentWorkItem, getAgentNetwork, getAgentWorkItems } from '../../data/agentAnalyticsData';

const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });

const moduleCopy: Record<string, { title: string; description: string; primary: string }> = {
  assignments: { title: 'Assignments', description: 'Every issued job, ownership handoff, deadline and outcome.', primary: 'Open assignments' },
  visits: { title: 'Field visits', description: 'GPS-backed visits, duration, forms, signatures and follow-ups.', primary: 'Visits completed' },
  verification: { title: 'Verification queue', description: 'Identity, inventory and asset evidence awaiting adjudication.', primary: 'Pending decisions' },
  listings: { title: 'Listings capture', description: 'Raw inventory and asset records captured at source.', primary: 'Records captured' },
  onboarding: { title: 'Merchant onboarding', description: 'KYC, storefront evidence, agreements and activation readiness.', primary: 'Onboardings' },
  collections: { title: 'Collections', description: 'Platform-mediated receipts, reconciliation and chain of custody.', primary: 'Receipts logged' },
  commissions: { title: 'Commissions', description: 'Accepted work translated into transparent agent earnings.', primary: 'Payable outcomes' },
  sync: { title: 'Offline sync', description: 'Device payloads, connection quality, retries and data freshness.', primary: 'Pending payloads' },
  quality: { title: 'Quality & risk', description: 'Duplicates, evidence gaps, anomalies and supervisor intervention.', primary: 'Open flags' },
  finance: { title: 'Finance', description: 'Field costs, float, commission liability and reconciliations.', primary: 'Open entries' },
  hr: { title: 'HR & workforce', description: 'Agent roster, training, productivity, wellbeing and attendance.', primary: 'Active people' },
  marketing: { title: 'Marketing', description: 'Ground campaigns, referrals, acquisition sources and attribution.', primary: 'Active campaigns' },
  reports: { title: 'Reports & audit', description: 'Immutable activity history and institution-ready evidence packs.', primary: 'Audit events' },
  settings: { title: 'Settings', description: 'Territories, permissions, device policy and operational thresholds.', primary: 'Active policies' },
};

const tone: Record<AgentWorkItem['status'], string> = {
  Complete: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  'In field': 'text-blue-300 bg-blue-400/10 border-blue-400/20',
  'Needs review': 'text-amber-300 bg-amber-400/10 border-amber-400/20',
  Overdue: 'text-red-300 bg-red-400/10 border-red-400/20',
  Queued: 'text-gray-300 bg-white/5 border-white/10',
};

export const AgentTenantOverview: React.FC = () => {
  const { currentTenant } = useTenant();
  const network = currentTenant ? getAgentNetwork(currentTenant.id) : undefined;
  if (!network) return null;

  const completion = Math.round((network.completed / network.assignments) * 100);
  const acceptance = Math.round((network.verified / network.completed) * 100);
  const metricCards: Array<{ label: string; value: React.ReactNode; detail: string; icon: React.ElementType }> = [
    { label: 'Active agents', value: network.online, detail: `${network.agents} rostered`, icon: Users },
    { label: 'Assignments', value: network.assignments.toLocaleString(), detail: 'last 7 days', icon: MapPin },
    { label: 'Completion', value: `${completion}%`, detail: `${network.completed.toLocaleString()} outcomes`, icon: CheckCircle2 },
    { label: 'Acceptance', value: `${acceptance}%`, detail: `${network.verified.toLocaleString()} verified`, icon: ShieldCheck },
    { label: 'Sync backlog', value: network.syncBacklog, detail: 'payloads pending', icon: Signal },
    { label: 'Commission', value: money.format(network.commission), detail: 'due after verification', icon: Activity },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-purple-300"><Signal size={12} /> Tenant operations · live</div>
          <h1 className="text-2xl font-display text-white">{currentTenant?.name}</h1>
          <p className="mt-2 text-sm text-gray-400">{network.region} · Network lead {network.lead} · {network.online} of {network.agents} agents online</p>
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300">SLA healthy · {network.sla}%</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metricCards.map(({ label, value, detail, icon: Icon }) => (
          <GlassPanel key={label} className="rounded-xl p-4">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-gray-500">{label}<Icon size={13} className="text-purple-300" /></div>
            <div className="mt-4 text-xl text-white">{value}</div>
            <div className="mt-1 text-[11px] text-gray-600">{detail}</div>
          </GlassPanel>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <GlassPanel className="h-[320px] rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-white">Verified output trend</h2>
            <p className="mt-1 text-xs text-gray-500">Network completion and evidence acceptance by day</p>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={AGENT_TREND}>
                <defs><linearGradient id="agentTenantFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} /><stop offset="95%" stopColor="#c084fc" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#090909', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="verified" stroke="#c084fc" strokeWidth={2} fill="url(#agentTenantFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <h2 className="text-sm font-medium text-white">Vertical coverage</h2>
          <p className="mt-1 text-xs text-gray-500">Assignment mix and completion</p>
          <div className="mt-5 space-y-5">
            {network.coverage.map((row) => (
              <div key={row.vertical}>
                <div className="mb-2 flex justify-between text-xs"><span className="text-gray-300">{row.vertical}</span><span className="font-mono text-gray-500">{row.assignments.toLocaleString()} · {row.completion}%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-purple-400" style={{ width: `${row.completion}%` }} /></div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <AgentWorkTable items={getAgentWorkItems()} title="Tenant activity stream" description="Open any row for the raw assignment, evidence and decision trail." />
    </motion.div>
  );
};

export const AgentTenantModule: React.FC<{ module: string }> = ({ module }) => {
  const { currentTenant } = useTenant();
  const network = currentTenant ? getAgentNetwork(currentTenant.id) : undefined;
  const copy = moduleCopy[module] ?? { title: module.replace(/-/g, ' '), description: 'Operational records for this tenant.', primary: 'Records' };
  const scoped = useMemo(() => {
    const exact = getAgentWorkItems(module);
    return exact.length ? exact : getAgentWorkItems();
  }, [module]);

  if (!network) return null;

  return (
    <motion.div key={module} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6">
      <div className="border-b border-white/10 pb-5">
        <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-purple-300">{currentTenant?.name} / {module}</div>
        <h1 className="text-2xl font-display capitalize text-white">{copy.title}</h1>
        <p className="mt-2 text-sm text-gray-400">{copy.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [copy.primary, module === 'sync' ? network.syncBacklog : Math.max(scoped.length * 18, scoped.length), 'current scope'],
          ['Completed / accepted', module === 'verification' ? network.verified.toLocaleString() : `${Math.round((network.completed / network.assignments) * 100)}%`, '7-day window'],
          ['Needs intervention', scoped.filter((item) => item.risk === 'High').length, 'high-risk records'],
          ['Evidence coverage', '97.6%', 'GPS + media + form'],
        ].map(([label, value, detail]) => (
          <GlassPanel key={String(label)} className="rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500">{label}</div>
            <div className="mt-4 text-2xl text-white">{value}</div>
            <div className="mt-1 text-xs text-gray-600">{detail}</div>
          </GlassPanel>
        ))}
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-300" />
          <div><div className="text-xs font-medium text-amber-200">Institutional control</div><p className="mt-1 text-xs leading-relaxed text-gray-400">Only evidence accepted by BLKK operations becomes verified inventory, a payable commission, or an institution-readable business signal. Agents never transact directly between buyer and seller.</p></div>
        </div>
      </div>

      <AgentWorkTable items={scoped} title={`${copy.title} ledger`} description="Micro-level records with field owner, location, evidence state, risk and adjudication status." />
    </motion.div>
  );
};

const AgentWorkTable: React.FC<{ items: AgentWorkItem[]; title: string; description: string }> = ({ items, title, description }) => {
  const [selected, setSelected] = useState<AgentWorkItem | null>(null);

  return (
    <>
      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div><h2 className="text-sm font-medium text-white">{title}</h2><p className="mt-1 text-xs text-gray-500">{description}</p></div>
          <span className="font-mono text-[10px] text-purple-300">{items.length} RECORDS SHOWN</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-black/20 text-[10px] font-mono uppercase tracking-wider text-gray-500"><tr>{['Record', 'Agent', 'Subject', 'Location', 'Evidence', 'Risk', 'State', ''].map((head) => <th key={head} className="px-5 py-3 font-normal">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {items.map((item) => (
                <tr key={item.id} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-white/[0.035]">
                  <td className="px-5 py-3 font-mono text-purple-300">{item.id}</td>
                  <td className="px-5 py-3 text-white">{item.agent}</td>
                  <td className="px-5 py-3 text-gray-300">{item.subject}</td>
                  <td className="px-5 py-3 text-gray-500">{item.location}</td>
                  <td className="px-5 py-3 text-gray-500">{item.evidence}</td>
                  <td className={`px-5 py-3 ${item.risk === 'High' ? 'text-red-300' : item.risk === 'Medium' ? 'text-amber-300' : 'text-emerald-300'}`}>{item.risk}</td>
                  <td className="px-5 py-3"><span className={`rounded border px-2 py-1 text-[9px] font-mono uppercase ${tone[item.status]}`}>{item.status}</span></td>
                  <td className="px-5 py-3"><ChevronRight size={14} className="text-gray-600" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <motion.aside initial={{ x: 480 }} animate={{ x: 0 }} onClick={(event) => event.stopPropagation()} className="h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#080808] p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div><div className="font-mono text-xs text-purple-300">{selected.id}</div><h3 className="mt-2 text-xl text-white">{selected.subject}</h3></div>
              <button onClick={() => setSelected(null)} aria-label="Close record detail" className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white"><X size={17} /></button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ['Field owner', selected.agent],
                ['Location', selected.location],
                ['Captured', selected.captured],
                ['Risk', selected.risk],
                ['State', selected.status],
                ['Evidence', selected.evidence],
              ].map(([label, value]) => <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><div className="text-[9px] font-mono uppercase tracking-wider text-gray-600">{label}</div><div className="mt-2 text-xs text-gray-200">{value}</div></div>)}
            </div>
            <div className="mt-6 rounded-xl border border-purple-400/20 bg-purple-400/[0.06] p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-purple-300">Evidence chain</div>
              <div className="mt-4 space-y-4">
                {['Assignment issued by BLKK operations', 'Agent identity and device attested', 'GPS and timestamp captured', 'Media hashes stored', 'Verification decision pending / recorded'].map((event, index) => (
                  <div key={event} className="flex gap-3 text-xs text-gray-300"><div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-400/15 font-mono text-[9px] text-purple-300">{index + 1}</div><span>{event}</span></div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </>
  );
};
