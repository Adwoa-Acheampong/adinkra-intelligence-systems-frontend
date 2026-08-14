import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Layers3 } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DecisionInsightDashboard } from '../components/analytics/DecisionInsightDashboard';
import { GlassPanel } from '../components/ui/GlassPanel';
import { getModuleForWorkspace, getWorkspaceForPath } from '../config/erpWorkspaces';
import { useTenant } from '../context/TenantContext';
import { getERPInsightDefinition, getTenantRegistryInsight } from '../data/erpInsightCatalog';
import { getTenantsByVertical } from '../data/mockAnalyticsData';
import { isDomainVertical } from '../data/verticalDomainContracts';
import { AutoHubCommandWorkspace } from './autos/AutoHubCommandWorkspace';
import { EstateCommandWorkspace } from './estate/EstateCommandWorkspace';
import { EstateCentralModuleWorkspace } from './estate/EstateCentralModuleWorkspace';
import { VerticalModuleWorkspace, VerticalTenantControl } from './vertical/VerticalDomainWorkspace';
import { EcosystemWorkspace } from './global/EcosystemWorkspace';

export const ERPModulePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCurrentVertical } = useTenant();
  const workspace = useMemo(() => getWorkspaceForPath(location.pathname), [location.pathname]);
  const segments = location.pathname.split('/').filter(Boolean);
  const moduleId = segments[segments.length - 1] || '';
  const moduleDefinition = getModuleForWorkspace(workspace, moduleId);

  useEffect(() => {
    setCurrentVertical(workspace.verticalId);
  }, [setCurrentVertical, workspace.verticalId]);

  if (!moduleDefinition) return null;
  if (workspace.verticalId === 'global') {
    return <EcosystemWorkspace moduleId={moduleId} />;
  }
  if (workspace.verticalId === 'autos' && moduleId === 'tenants') {
    return <AutoHubCommandWorkspace view="tenants" />;
  }
  if (workspace.verticalId === 'estate' && moduleId === 'tenants') {
    return <EstateCommandWorkspace view="tenants" />;
  }
  if (workspace.verticalId === 'estate') {
    return <EstateCentralModuleWorkspace moduleId={moduleId} />;
  }
  if (isDomainVertical(workspace.verticalId)) {
    if (moduleId === 'tenants') return <VerticalTenantControl workspace={workspace} />;
    return <VerticalModuleWorkspace workspace={workspace} module={moduleDefinition} />;
  }

  const selected = searchParams.get('drill') || '';
  const tenants = moduleId === 'tenants' ? getTenantsByVertical(workspace.verticalId) : [];
  const insight = moduleId === 'tenants'
    ? getTenantRegistryInsight(workspace, tenants)
    : getERPInsightDefinition(workspace, moduleId, moduleDefinition.label);

  const setSelected = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('drill', value);
    else next.delete('drill');
    setSearchParams(next, { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      key={`${workspace.id}-${moduleId}`}
      className="mx-auto max-w-[1560px] space-y-6 pb-10"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-vertical-accent">
            <Layers3 size={12} /> {workspace.descriptor} / {workspace.name}
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white">{moduleDefinition.label}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">{moduleDefinition.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-vertical-accent/20 bg-vertical-accent/[0.06] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-vertical-accent">
            {insight.family} decision view
          </span>
          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-gray-500">
            Ghana · demonstration
          </span>
        </div>
      </div>

      <DecisionInsightDashboard insight={insight} selected={selected} onSelect={setSelected} />

      {tenants.length > 0 && (
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-medium text-white">{workspace.shortName} ERP registry</h2>
            </div>
            <Building2 size={16} className="text-vertical-accent" />
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {tenants.map((tenant, index) => (
              <button
                key={tenant.id}
                onClick={() => navigate(`/${tenant.verticalId}/tenant/${tenant.id}`)}
                className="group rounded-xl border border-white/[0.08] bg-black/20 p-4 text-left transition hover:border-vertical-accent/40 hover:bg-white/[0.035] focus:outline-none focus:ring-2 focus:ring-vertical-accent"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-vertical-accent/20 bg-vertical-accent-glow text-sm font-medium text-vertical-accent">
                    {tenant.name.charAt(0)}
                  </div>
                  <ArrowRight size={15} className="text-gray-600 transition group-hover:translate-x-1 group-hover:text-vertical-accent" />
                </div>
                <div className="mt-4 text-sm font-medium text-white">{tenant.name}</div>
                <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-gray-600">{tenant.type.replace(/_/g, ' ')} ERP</div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
                  <div><div className="text-sm text-white">{Math.min(98, 86 + index * 2)}%</div><div className="text-[8px] font-mono uppercase text-gray-700">Confidence</div></div>
                  <div><div className="text-sm text-amber-300">{4 + index * 3}</div><div className="text-[8px] font-mono uppercase text-gray-700">Actions</div></div>
                  <div><div className="text-sm text-red-300">GHS {38 + index * 17}K</div><div className="text-[8px] font-mono uppercase text-gray-700">At risk</div></div>
                </div>
              </button>
            ))}
          </div>
        </GlassPanel>
      )}
    </motion.div>
  );
};
