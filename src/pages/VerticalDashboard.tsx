import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Layers3 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DecisionInsightDashboard } from '../components/analytics/DecisionInsightDashboard';
import { FilterBar } from '../components/analytics/FilterBar';
import { GlassPanel } from '../components/ui/GlassPanel';
import { VERTICAL_ERPS } from '../config/erpWorkspaces';
import { useTenant } from '../context/TenantContext';
import { getVerticalOverviewInsight } from '../data/erpInsightCatalog';
import { getTenantsByVertical } from '../data/mockAnalyticsData';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters';
import type { VerticalId } from '../types';

export const VerticalDashboard: React.FC<{ verticalId: VerticalId }> = ({ verticalId }) => {
  const { setCurrentVertical } = useTenant();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, updateFilter } = useAnalyticsFilters();
  const workspace = VERTICAL_ERPS[verticalId];

  useEffect(() => {
    setCurrentVertical(verticalId);
  }, [verticalId, setCurrentVertical]);

  if (!workspace) return null;

  const insight = getVerticalOverviewInsight(workspace);
  const tenants = getTenantsByVertical(verticalId);
  const selected = searchParams.get('drill') || '';

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
      key={verticalId}
      className="mx-auto max-w-[1560px] space-y-6 pb-12"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-vertical-accent">
            <Layers3 size={12} /> Vertical ERP / {workspace.name}
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white">
            {workspace.name} <span className="text-vertical-accent">command</span>
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-wider text-gray-500">
            <span className="rounded border border-white/[0.08] px-2 py-1">{tenants.length} tenant ERPs</span>
            <span className="rounded border border-white/[0.08] px-2 py-1">{insight.meta.population}</span>
            <span className="rounded border border-white/[0.08] px-2 py-1">{insight.meta.freshness} freshness</span>
            <span className="rounded border border-emerald-400/20 bg-emerald-400/[0.05] px-2 py-1 text-emerald-300">{insight.meta.confidence}% confidence</span>
          </div>
        </div>
        <FilterBar filters={filters} updateFilter={updateFilter} />
      </div>

      <DecisionInsightDashboard insight={insight} selected={selected} onSelect={setSelected} />

      {tenants.length > 0 && (
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">Tenant ERP intervention map</h2>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-gray-600">
              <Building2 size={13} className="text-vertical-accent" /> {tenants.length} operating ERPs
            </div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {tenants.map((tenant, index) => {
              const confidence = 94 - index * 4;
              const valueAtRisk = 84 + index * 47;
              const actions = 9 + index * 6;
              return (
                <button
                  key={tenant.id}
                  onClick={() => navigate(`/${verticalId}/tenant/${tenant.id}`)}
                  className="group rounded-xl border border-white/[0.08] bg-black/20 p-4 text-left transition hover:border-vertical-accent/40 hover:bg-white/[0.035] focus:outline-none focus:ring-2 focus:ring-vertical-accent"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-vertical-accent/20 bg-vertical-accent-glow text-sm font-medium text-vertical-accent">{tenant.name.charAt(0)}</div>
                    <ArrowRight size={15} className="text-gray-600 transition group-hover:translate-x-1 group-hover:text-vertical-accent" />
                  </div>
                  <div className="mt-4 text-sm font-medium text-white">{tenant.name}</div>
                  <div className="mt-1 text-[9px] font-mono uppercase tracking-wider text-gray-600">{tenant.type.replace(/_/g, ' ')} ERP</div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
                    <div><div className={confidence < 90 ? 'text-sm text-amber-300' : 'text-sm text-emerald-300'}>{confidence}%</div><div className="text-[8px] font-mono uppercase text-gray-700">Confidence</div></div>
                    <div><div className="text-sm text-white">{actions}</div><div className="text-[8px] font-mono uppercase text-gray-700">Actions</div></div>
                    <div><div className="text-sm text-red-300">GHS {valueAtRisk}K</div><div className="text-[8px] font-mono uppercase text-gray-700">At risk</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      )}
    </motion.div>
  );
};
