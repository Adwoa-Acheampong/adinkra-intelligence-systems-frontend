import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, CheckCircle2, MapPinned, ShieldCheck, Signal, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FilterBar } from '../components/analytics/FilterBar';
import { GlassPanel } from '../components/ui/GlassPanel';
import { useTenant } from '../context/TenantContext';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters';
import { AGENT_NETWORKS, AGENT_TREND, AGENT_WORK_ITEMS } from '../data/agentAnalyticsData';
import { getTenantById } from '../data/mockAnalyticsData';

const number = new Intl.NumberFormat('en-GH');
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 });

const statusTone: Record<string, string> = {
  Complete: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  'In field': 'text-blue-300 bg-blue-400/10 border-blue-400/20',
  'Needs review': 'text-amber-300 bg-amber-400/10 border-amber-400/20',
  Overdue: 'text-red-300 bg-red-400/10 border-red-400/20',
  Queued: 'text-gray-300 bg-white/5 border-white/10',
};

export const AgentsDashboard: React.FC = () => {
  const { setCurrentVertical } = useTenant();
  const navigate = useNavigate();
  const { filters, updateFilter } = useAnalyticsFilters({ source: 'All Native Apps' });

  useEffect(() => setCurrentVertical('agents'), [setCurrentVertical]);

  const totals = AGENT_NETWORKS.reduce(
    (sum, row) => ({
      agents: sum.agents + row.agents,
      online: sum.online + row.online,
      assignments: sum.assignments + row.assignments,
      completed: sum.completed + row.completed,
      verified: sum.verified + row.verified,
      backlog: sum.backlog + row.syncBacklog,
      commission: sum.commission + row.commission,
    }),
    { agents: 0, online: 0, assignments: 0, completed: 0, verified: 0, backlog: 0, commission: 0 },
  );
  const metricCards: Array<{ label: string; value: React.ReactNode; detail: string; icon: React.ElementType }> = [
    { label: 'Registered agents', value: number.format(totals.agents), detail: `${totals.online} online`, icon: Users },
    { label: 'Assignments · 7D', value: number.format(totals.assignments), detail: `${Math.round((totals.completed / totals.assignments) * 100)}% complete`, icon: MapPinned },
    { label: 'Verified outcomes', value: number.format(totals.verified), detail: `${Math.round((totals.verified / totals.completed) * 100)}% accepted`, icon: ShieldCheck },
    { label: 'Evidence backlog', value: number.format(totals.backlog), detail: 'offline + review', icon: Activity },
    { label: 'SLA compliance', value: '94.0%', detail: 'target ≥ 92%', icon: CheckCircle2 },
    { label: 'Commission due', value: money.format(totals.commission), detail: 'verified work only', icon: Signal },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-purple-300">
            <Signal size={13} /> Live operational network
          </div>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-white">Field Agents <span className="text-vertical-accent">Central</span></h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">Every field observation is traceable from regional network to agent, assignment, evidence, verification decision and payout.</p>
        </div>
        <FilterBar filters={filters} updateFilter={updateFilter} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metricCards.map(({ label, value, detail, icon: Icon }) => (
          <GlassPanel key={label} className="rounded-xl p-4">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-gray-500">
              {label}<Icon size={14} className="text-vertical-accent" />
            </div>
            <div className="mt-4 text-2xl font-display text-white">{value}</div>
            <div className="mt-1 text-xs text-gray-500">{detail}</div>
          </GlassPanel>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <GlassPanel className="h-[330px] rounded-xl p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Assignment throughput</h3>
              <p className="mt-1 text-xs text-gray-500">Assigned → completed → institutionally verified</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-purple-300">7 days</span>
          </div>
          <div className="h-[245px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AGENT_TREND} margin={{ left: -18, right: 4 }}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#090909', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="assigned" fill="#3f3f46" radius={[3, 3, 0, 0]} />
                <Bar dataKey="completed" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                <Bar dataKey="verified" fill="#c084fc" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Live exception queue</h3>
              <p className="mt-1 text-xs text-gray-500">Evidence and sync issues requiring action</p>
            </div>
            <span className="rounded border border-amber-400/20 bg-amber-400/10 px-2 py-1 font-mono text-[10px] text-amber-300">5 OPEN</span>
          </div>
          <div className="space-y-2">
            {AGENT_WORK_ITEMS.filter((item) => item.risk !== 'Low').slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-lg border border-white/[0.07] bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-white">{item.subject}</div>
                    <div className="mt-1 text-[11px] text-gray-500">{item.id} · {item.agent} · {item.location}</div>
                  </div>
                  <span className={`shrink-0 rounded border px-2 py-0.5 text-[9px] font-mono uppercase ${statusTone[item.status]}`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-gray-400">Agent operating tenants</h3>
            <p className="mt-1 text-xs text-gray-600">Open a network to drill through departments, people, assignments and evidence.</p>
          </div>
          <span className="text-[10px] font-mono text-purple-300">{AGENT_NETWORKS.length} ACTIVE TENANTS</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {AGENT_NETWORKS.map((network) => {
            const tenant = getTenantById(network.tenantId);
            return (
              <button
                key={network.tenantId}
                onClick={() => navigate(`/agents/tenant/${network.tenantId}`)}
                className="group rounded-xl border border-white/10 bg-white/[0.025] p-5 text-left transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-white/[0.045] focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg border border-purple-400/20 bg-purple-400/10 p-2 text-purple-300"><MapPinned size={18} /></div>
                  <ArrowRight size={16} className="text-gray-600 transition group-hover:translate-x-1 group-hover:text-purple-300" />
                </div>
                <h4 className="mt-4 min-h-10 text-sm font-medium text-white">{tenant?.name}</h4>
                <p className="mt-1 text-xs text-gray-500">{network.region} · Lead: {network.lead}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-4">
                  <div><div className="text-lg text-white">{network.agents}</div><div className="text-[9px] font-mono uppercase text-gray-600">Agents</div></div>
                  <div><div className="text-lg text-white">{network.sla}%</div><div className="text-[9px] font-mono uppercase text-gray-600">SLA</div></div>
                  <div><div className="text-lg text-white">{network.syncBacklog}</div><div className="text-[9px] font-mono uppercase text-gray-600">Backlog</div></div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="text-sm font-medium text-white">Recent ground-truth events</h3>
          <p className="mt-1 text-xs text-gray-500">Raw operational signals before aggregation</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-black/20 text-[10px] font-mono uppercase tracking-wider text-gray-500">
              <tr>{['Event', 'Agent', 'Subject', 'Location', 'Evidence', 'Status'].map((head) => <th key={head} className="px-5 py-3 font-normal">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {AGENT_WORK_ITEMS.slice(0, 6).map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.025]">
                  <td className="px-5 py-3 font-mono text-purple-300">{item.id}</td>
                  <td className="px-5 py-3 text-white">{item.agent}</td>
                  <td className="px-5 py-3 text-gray-300">{item.subject}</td>
                  <td className="px-5 py-3 text-gray-500">{item.location}</td>
                  <td className="px-5 py-3 text-gray-500">{item.evidence}</td>
                  <td className="px-5 py-3"><span className={`rounded border px-2 py-1 text-[9px] font-mono uppercase ${statusTone[item.status]}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </motion.div>
  );
};
