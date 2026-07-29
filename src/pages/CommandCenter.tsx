import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Command, Fingerprint, Network, ShieldAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DecisionInsightDashboard } from '../components/analytics/DecisionInsightDashboard';
import { FilterBar } from '../components/analytics/FilterBar';
import { GlassPanel } from '../components/ui/GlassPanel';
import { ERP_SWITCHER, GLOBAL_ERP } from '../config/erpWorkspaces';
import { useTenant } from '../context/TenantContext';
import { getERPInsightDefinition } from '../data/erpInsightCatalog';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters';

const operatingSignals = [
  { vertical: 'Estate', constraint: 'Title & mandate controls', decision: 'Escalate 7 high-value mandates', value: 'GHS 620K', confidence: 78, path: '/estate/verification' },
  { vertical: 'AutoHub', constraint: 'Inspection and parts supply', decision: 'Extend inspectors; transfer stock', value: 'GHS 465K', confidence: 86, path: '/autos/inspections' },
  { vertical: 'Farmers', constraint: 'Cold-chain and grade review', decision: 'Reroute 18.4 t; add grader', value: 'GHS 330K', confidence: 82, path: '/farmers/quality' },
  { vertical: 'Merchants', constraint: 'Fast-moving stockouts', decision: 'Approve verified substitutes', value: 'GHS 205K', confidence: 88, path: '/merchant/inventory' },
  { vertical: 'Susu Rail', constraint: 'Settlement callback breaks', decision: 'Reconcile MTN batch 726B', value: 'GHS 120K', confidence: 94, path: '/susu/settlement' },
];

export const CommandCenter: React.FC = () => {
  const { setCurrentVertical } = useTenant();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, updateFilter } = useAnalyticsFilters();
  const insight = getERPInsightDefinition(GLOBAL_ERP, '', 'Ecosystem');
  const selected = searchParams.get('drill') || '';

  useEffect(() => {
    setCurrentVertical('global');
  }, [setCurrentVertical]);

  const setSelected = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('drill', value);
    else next.delete('drill');
    setSearchParams(next, { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-[1600px] space-y-6 pb-12"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-vertical-accent">
            <Command size={12} /> Ecosystem ERP / Central command
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white">Adinkra decision command</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-wider text-gray-500">
            <span className="rounded border border-white/[0.08] px-2 py-1">9 ERPs</span>
            <span className="rounded border border-white/[0.08] px-2 py-1">31 tenants</span>
            <span className="rounded border border-white/[0.08] px-2 py-1">18,420 events</span>
            <span className="rounded border border-red-400/20 bg-red-400/[0.05] px-2 py-1 text-red-300">17 blockers</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={() => navigate('/intelligence?metric=inventory.trusted_value')}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-vertical-accent/25 bg-vertical-accent/[0.07] px-3 font-mono text-[9px] uppercase tracking-wider text-vertical-accent transition hover:bg-vertical-accent/[0.12] focus:outline-none focus:ring-2 focus:ring-vertical-accent"
          >
            <Fingerprint size={13} /> Open claim evidence
          </button>
          <FilterBar filters={filters} updateFilter={updateFilter} />
        </div>
      </div>

      <DecisionInsightDashboard insight={insight} selected={selected} onSelect={setSelected} />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-medium text-white">Cross-ERP intervention board</h2>
            </div>
            <Network size={16} className="text-vertical-accent" />
          </div>
          <div className="divide-y divide-white/[0.06]">
            {operatingSignals.map((signal) => (
              <button
                key={signal.vertical}
                onClick={() => navigate(signal.path)}
                className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-white/[0.025] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-vertical-accent md:grid-cols-[0.6fr_1.1fr_1.2fr_0.6fr_0.7fr_auto] md:items-center"
              >
                <div className="text-xs font-medium text-white">{signal.vertical}</div>
                <div className="text-xs text-gray-400">{signal.constraint}</div>
                <div className="text-xs text-gray-200">{signal.decision}</div>
                <div className="font-mono text-[10px] text-red-300">{signal.value}</div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[8px] font-mono uppercase text-gray-600"><span>Confidence</span><span>{signal.confidence}%</span></div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-vertical-accent/70" style={{ width: `${signal.confidence}%` }} /></div>
                </div>
                <ArrowRight size={13} className="text-vertical-accent" />
              </button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-red-300">
            <ShieldAlert size={14} /> Institutional readiness gaps
          </div>
          <div className="mt-5 space-y-3">
            {[
              ['Source lineage', '74%', 'Payment and field-event lineage incomplete'],
              ['Entity resolution', '81%', 'Cross-product identity duplicates remain'],
              ['Evidence currency', '86%', 'Title, licence and assay expiry risk'],
              ['Reconciliation', '92%', 'MoMo and payout breaks outside tolerance'],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-lg border border-white/[0.07] bg-black/20 p-3">
                <div className="flex items-center justify-between"><span className="text-xs text-gray-300">{label}</span><span className="font-mono text-xs text-amber-300">{value}</span></div>
                <div className="mt-2 text-[10px] leading-relaxed text-gray-600">{detail}</div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/intelligence?view=ontology')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-vertical-accent/25 bg-vertical-accent/[0.07] py-2.5 text-[10px] font-mono uppercase tracking-wider text-vertical-accent transition hover:bg-vertical-accent/[0.12]">
            Open ontology controls <ArrowRight size={12} />
          </button>
        </GlassPanel>
      </div>

      <div>
        <div className="mb-3 text-[9px] font-mono uppercase tracking-[0.18em] text-gray-600">Enter an operating ERP</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ERP_SWITCHER.filter((item) => item.path !== '/').map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 p-3 text-left transition hover:border-vertical-accent/35 hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-vertical-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-500 transition group-hover:border-vertical-accent/20 group-hover:text-vertical-accent"><Icon size={16} /></div>
                <div><div className="text-xs text-gray-200">{item.label}</div><div className="mt-1 text-[8px] font-mono uppercase tracking-wider text-gray-700">Independent ERP</div></div>
                <ArrowRight size={12} className="ml-auto text-gray-700 group-hover:text-vertical-accent" />
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
