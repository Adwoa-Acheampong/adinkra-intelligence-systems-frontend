import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import type { VerticalId } from '../../types';
import { TenantOverview } from '../../pages/tenant/TenantOverview';
import { AgentTenantModule, AgentTenantOverview } from '../../pages/tenant/AgentTenantWorkspace';
import { AutoTenantModule } from '../../pages/tenant/AutoTenantWorkspace';
import { AGLERPWorkspace } from '../../pages/tenant/AGLERPWorkspace';
import { TenantSystemChooser } from '../../pages/tenant/TenantSystemChooser';
import { getTenantById } from '../../data/mockAnalyticsData';
import { GenericEntityTable } from './GenericEntityTable';
import { Sidebar } from '../layout/Sidebar';

export const TenantERPShell = () => {
  const { verticalId, tenantId } = useParams<{ verticalId: VerticalId; tenantId: string }>();
  const { setCurrentVertical, setCurrentTenant, currentTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (verticalId) setCurrentVertical(verticalId);

    const tenant = getTenantById(tenantId || '');
    if (tenant) {
      setCurrentTenant(tenant);
    } else {
      navigate('/');
    }

    return () => setCurrentTenant(null);
  }, [verticalId, tenantId, setCurrentVertical, setCurrentTenant, navigate]);

  if (!currentTenant) return null;

  const basePath = `/${currentTenant.verticalId}/tenant/${currentTenant.id}`;
  const relativePath = location.pathname.slice(basePath.length).replace(/^\/+/, '');
  const segments = relativePath.split('/').filter(Boolean);
  const dualSystemTenant = currentTenant.verticalId === 'autos' && currentTenant.id === 'agl';
  const tenantMode = segments[0] === 'erp' ? 'erp' : 'analytics';

  if (dualSystemTenant && segments.length === 0) {
    return <TenantSystemChooser tenant={currentTenant} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050505] text-white">
      <Sidebar tenant={currentTenant} tenantMode={tenantMode} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          className="pointer-events-none absolute right-0 top-0 z-0 h-[400px] w-[600px] rounded-full opacity-[0.1] blur-[120px]"
          style={{ background: 'var(--theme-accent)' }}
        />

        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-surface-border bg-[#050505]/80 px-4 backdrop-blur-md md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="truncate font-display font-medium text-white">{currentTenant.name}</span>
            <span className="hidden whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400 sm:inline-flex">
              {tenantMode === 'erp' ? 'Operational ERP · PROD' : 'Analytics · PROD'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {dualSystemTenant && (
              <div className="hidden items-center rounded-lg border border-white/[0.08] bg-black/30 p-1 sm:flex">
                <button
                  onClick={() => navigate(`${basePath}/analytics`)}
                  className={`min-h-8 rounded-md px-3 text-[10px] transition ${tenantMode === 'analytics' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-300'}`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => navigate(`${basePath}/erp/work-orders`)}
                  className={`min-h-8 rounded-md px-3 text-[10px] transition ${tenantMode === 'erp' ? 'bg-vertical-accent text-black' : 'text-gray-600 hover:text-gray-300'}`}
                >
                  ERP
                </button>
              </div>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-surface-glass text-xs font-medium text-gray-300">AD</div>
          </div>
        </header>

        <main id="main-content" className="custom-scrollbar relative z-10 flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          {dualSystemTenant ? (
            <Routes>
              <Route path="analytics" element={<TenantOverview />} />
              <Route path="analytics/*" element={<AutoModuleRoute tenant={currentTenant} />} />
              <Route path="erp" element={<Navigate to={`${basePath}/erp/work-orders`} replace />} />
              <Route path="erp/*" element={<AglOperationalRoute tenant={currentTenant} />} />
              <Route path="*" element={<LegacyAnalyticsRedirect basePath={basePath} />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={currentTenant.verticalId === 'agents' ? <AgentTenantOverview /> : <TenantOverview />} />
              <Route
                path="*"
                element={
                  currentTenant.verticalId === 'agents'
                    ? <AgentModuleRoute />
                    : currentTenant.verticalId === 'autos'
                      ? <AutoModuleRoute tenant={currentTenant} />
                      : <GenericEntityTable />
                }
              />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
};

const AgentModuleRoute = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const moduleId = segments[segments.length - 1] || 'assignments';
  return <AgentTenantModule module={moduleId} />;
};

const AutoModuleRoute = ({ tenant }: { tenant: NonNullable<ReturnType<typeof getTenantById>> }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const moduleId = segments[segments.length - 1] || 'workshop';
  return <AutoTenantModule tenant={tenant} moduleId={moduleId} />;
};

const AglOperationalRoute = ({ tenant }: { tenant: NonNullable<ReturnType<typeof getTenantById>> }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const moduleId = segments[segments.length - 1] || 'work-orders';
  return <AGLERPWorkspace tenant={tenant} moduleId={moduleId} />;
};

const LegacyAnalyticsRedirect = ({ basePath }: { basePath: string }) => {
  const location = useLocation();
  const relative = location.pathname.slice(basePath.length).replace(/^\/+/, '');
  return <Navigate to={`${basePath}/analytics${relative ? `/${relative}` : ''}`} replace />;
};
