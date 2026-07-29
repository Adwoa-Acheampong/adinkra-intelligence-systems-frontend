import { motion } from 'framer-motion';
import { Building2, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { DecisionInsightDashboard } from '../../components/analytics/DecisionInsightDashboard';
import { VERTICAL_ERPS } from '../../config/erpWorkspaces';
import { useTenant } from '../../context/TenantContext';
import { getTenantOverviewInsight } from '../../data/erpInsightCatalog';

export const TenantOverview = () => {
  const { currentTenant } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!currentTenant) return null;
  const workspace = VERTICAL_ERPS[currentTenant.verticalId];
  if (!workspace) return null;

  const insight = getTenantOverviewInsight(workspace, currentTenant);
  const selected = searchParams.get('drill') || '';

  const setSelected = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('drill', value);
    else next.delete('drill');
    setSearchParams(next, { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-[1560px] space-y-6 pb-10"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-vertical-accent">
            <Building2 size={12} /> {workspace.shortName} / Tenant ERP
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white">{currentTenant.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-wider text-gray-500">
            <span className="rounded border border-white/[0.08] px-2 py-1">{currentTenant.type.replace(/_/g, ' ')}</span>
            <span className="flex items-center gap-1 rounded border border-white/[0.08] px-2 py-1"><MapPin size={10} /> Ghana</span>
            <span className="rounded border border-white/[0.08] px-2 py-1">{insight.meta.observations}</span>
            <span className="rounded border border-emerald-400/20 bg-emerald-400/[0.05] px-2 py-1 text-emerald-300">{insight.meta.coverage}% coverage</span>
          </div>
        </div>
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-amber-200">
          Mock operating dataset
        </div>
      </div>

      <DecisionInsightDashboard insight={insight} selected={selected} onSelect={setSelected} />
    </motion.div>
  );
};
