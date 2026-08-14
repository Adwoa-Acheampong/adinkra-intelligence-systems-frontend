import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import type { VerticalId } from '../../types';
import { TenantOverview } from '../../pages/tenant/TenantOverview';
import { AgentTenantModule, AgentTenantOverview } from '../../pages/tenant/AgentTenantWorkspace';
import { AutoTenantModule } from '../../pages/tenant/AutoTenantWorkspace';
import { AGLERPWorkspace } from '../../pages/tenant/AGLERPWorkspace';
import { AglJobCardWorkspace } from '../../pages/tenant/AglJobCardWorkspace';
import { AglCustomerIntakeWorkspace } from '../../pages/tenant/AglCustomerIntakeWorkspace';
import { AglAppointmentScheduler } from '../../pages/tenant/AglAppointmentScheduler';
import { AglProcurementWorkspace } from '../../pages/tenant/AglProcurementWorkspace';
import { AglPayrollWorkspace } from '../../pages/tenant/AglPayrollWorkspace';
import { AglInventoryControlWorkspace } from '../../pages/tenant/AglInventoryControlWorkspace';
import { AglFinanceControlWorkspace } from '../../pages/tenant/AglFinanceControlWorkspace';
import { AglPeopleControlWorkspace } from '../../pages/tenant/AglPeopleControlWorkspace';
import { AglDocumentControlWorkspace } from '../../pages/tenant/AglDocumentControlWorkspace';
import { AglAttendanceWorkspace } from '../../pages/tenant/AglAttendanceWorkspace';
import { AglWorkshopBoardWorkspace } from '../../pages/tenant/AglWorkshopBoardWorkspace';
import { AglReportingWorkspace } from '../../pages/tenant/AglReportingWorkspace';
import { AglExportCenterWorkspace } from '../../pages/tenant/AglExportCenterWorkspace';
import { AglPointOfSaleWorkspace } from '../../pages/tenant/AglPointOfSaleWorkspace';
import { AglWorkforceWorkspace } from '../../pages/tenant/AglWorkforceWorkspace';
import { AglCustomerFleetWorkspace } from '../../pages/tenant/AglCustomerFleetWorkspace';
import { AglSubscriptionsWorkspace } from '../../pages/tenant/AglSubscriptionsWorkspace';
import { AglCommunicationsWorkspace } from '../../pages/tenant/AglCommunicationsWorkspace';
import { AglMarketingWorkspace } from '../../pages/tenant/AglMarketingWorkspace';
import { AglFixBotWorkspace } from '../../pages/tenant/AglFixBotWorkspace';
import { AglWorkOrderRegisterWorkspace } from '../../pages/tenant/AglWorkOrderRegisterWorkspace';
import { AglProfitLossWorkspace } from '../../pages/tenant/AglProfitLossWorkspace';
import { AglServiceControlRegisterWorkspace } from '../../pages/tenant/AglServiceControlRegisterWorkspace';
import { AglMechanicTrackerWorkspace } from '../../pages/tenant/AglMechanicTrackerWorkspace';
import { AglOperationalFormsWorkspace } from '../../pages/tenant/AglOperationalFormsWorkspace';
import { AglAdministrationWorkspace } from '../../pages/tenant/AglAdministrationWorkspace';
import { AglArchivesWorkspace } from '../../pages/tenant/AglArchivesWorkspace';
import { AglServiceRecoveryWorkspace } from '../../pages/tenant/AglServiceRecoveryWorkspace';
import { AglCommercialDocumentsWorkspace } from '../../pages/tenant/AglCommercialDocumentsWorkspace';
import { AglStaffPortalWorkspace } from '../../pages/tenant/AglStaffPortalWorkspace';
import { AglTaskWorkspace } from '../../pages/tenant/AglTaskWorkspace';
import { AglPeopleDevelopmentWorkspace } from '../../pages/tenant/AglPeopleDevelopmentWorkspace';
import { AglManagerDeskWorkspace } from '../../pages/tenant/AglManagerDeskWorkspace';
import { AglSupplierWorkspace } from '../../pages/tenant/AglSupplierWorkspace';
import { AglDailyOperationsWorkspace } from '../../pages/tenant/AglDailyOperationsWorkspace';
import { AglAuditLogWorkspace } from '../../pages/tenant/AglAuditLogWorkspace';
import { AglAnalyticsWorkspace } from '../../pages/tenant/AglAnalyticsWorkspace';
import { EstateTenantWorkspace } from '../../pages/estate/EstateTenantWorkspace';
import { TenantSystemChooser } from '../../pages/tenant/TenantSystemChooser';
import { DomainTenantWorkspace } from '../../pages/tenant/DomainTenantWorkspace';
import { getTenantById } from '../../data/mockAnalyticsData';
import { isDomainVertical } from '../../data/verticalDomainContracts';
import { getDomainTenantErpStart } from '../../config/routes';
import { GenericEntityTable } from './GenericEntityTable';
import { Sidebar } from '../layout/Sidebar';
import { AglOperatingScopeProvider } from '../../context/AglOperatingScopeContext';
import { AglOperatingScopeBar } from './AglOperatingScopeBar';
import { AglCommandPalette } from './AglCommandPalette';
import { AglNotificationBell } from './AglNotificationBell';

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
  const aglDualSystemTenant = currentTenant.verticalId === 'autos' && currentTenant.id === 'agl';
  const estateDualSystemTenant = currentTenant.verticalId === 'estate';
  const domainDualSystemTenant = isDomainVertical(currentTenant.verticalId);
  const genericDomainTenant = domainDualSystemTenant && !aglDualSystemTenant;
  const dualSystemTenant = domainDualSystemTenant || estateDualSystemTenant;
  const tenantMode = segments[0] === 'erp' ? 'erp' : 'analytics';
  const erpStart = estateDualSystemTenant
    ? 'property-register'
    : aglDualSystemTenant
      ? 'work-orders'
      : getDomainTenantErpStart(currentTenant.verticalId);

  if (dualSystemTenant && segments.length === 0) {
    return <TenantSystemChooser tenant={currentTenant} />;
  }

  const shell = (
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
          {aglDualSystemTenant && (
            <button type="button" aria-label="Search AGL pages and actions" onClick={() => window.dispatchEvent(new CustomEvent('agl-command-palette:open'))} className="mx-5 hidden h-9 min-w-0 max-w-md flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-left text-[10px] text-gray-600 transition hover:border-cyan-300/20 hover:text-gray-400 lg:flex">
              <Search size={13} className="text-cyan-300/70" />
              <span className="min-w-0 flex-1 truncate">Search pages, actions, or settings…</span>
              <kbd className="rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[8px]">Ctrl K</kbd>
            </button>
          )}
          <div className="flex items-center gap-3">
            {aglDualSystemTenant && <button type="button" aria-label="Search AGL pages and actions" onClick={() => window.dispatchEvent(new CustomEvent('agl-command-palette:open'))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-cyan-300/70 lg:hidden"><Search size={14} /></button>}
            {dualSystemTenant && (
              <div className="hidden items-center rounded-lg border border-white/[0.08] bg-black/30 p-1 sm:flex">
                <button
                  onClick={() => navigate(`${basePath}/analytics`)}
                  className={`min-h-8 rounded-md px-3 text-[10px] transition ${tenantMode === 'analytics' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-300'}`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => navigate(`${basePath}/erp/${erpStart}`)}
                  className={`min-h-8 rounded-md px-3 text-[10px] transition ${tenantMode === 'erp' ? 'bg-vertical-accent text-black' : 'text-gray-600 hover:text-gray-300'}`}
                >
                  ERP
                </button>
              </div>
            )}
            {aglDualSystemTenant && <AglNotificationBell basePath={basePath} />}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-surface-glass text-xs font-medium text-gray-300">AD</div>
          </div>
        </header>

        {aglDualSystemTenant && <AglCommandPalette basePath={basePath} />}

        {aglDualSystemTenant && <AglOperatingScopeBar />}

        <main id="main-content" className="custom-scrollbar relative flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          {estateDualSystemTenant ? (
            <Routes>
              <Route path="analytics" element={<EstateTenantWorkspace tenant={currentTenant} mode="analytics" moduleId="dashboard" />} />
              <Route path="analytics/*" element={<EstateTenantModuleRoute tenant={currentTenant} mode="analytics" />} />
              <Route path="erp" element={<Navigate to={`${basePath}/erp/property-register`} replace />} />
              <Route path="erp/*" element={<EstateTenantModuleRoute tenant={currentTenant} mode="erp" />} />
              <Route path="*" element={<Navigate to={`${basePath}/analytics`} replace />} />
            </Routes>
          ) : aglDualSystemTenant ? (
            <Routes>
              <Route path="analytics" element={<AglAnalyticsWorkspace tenant={currentTenant} moduleId="overview" />} />
              <Route path="analytics/*" element={<AutoModuleRoute tenant={currentTenant} />} />
              <Route path="erp" element={<Navigate to={`${basePath}/erp/work-orders`} replace />} />
              <Route path="erp/*" element={<AglOperationalRoute tenant={currentTenant} />} />
              <Route path="*" element={<LegacyAnalyticsRedirect basePath={basePath} />} />
            </Routes>
          ) : genericDomainTenant ? (
            <Routes>
              <Route path="analytics" element={<DomainTenantWorkspace tenant={currentTenant} mode="analytics" moduleId="overview" />} />
              <Route path="analytics/*" element={<DomainTenantModuleRoute tenant={currentTenant} mode="analytics" />} />
              <Route path="erp" element={<Navigate to={`${basePath}/erp/${erpStart}`} replace />} />
              <Route path="erp/*" element={<DomainTenantModuleRoute tenant={currentTenant} mode="erp" />} />
              <Route path="*" element={<Navigate to={`${basePath}/analytics`} replace />} />
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
  return aglDualSystemTenant
    ? <AglOperatingScopeProvider>{shell}</AglOperatingScopeProvider>
    : shell;
};

const DomainTenantModuleRoute = ({ tenant, mode }: { tenant: NonNullable<ReturnType<typeof getTenantById>>; mode: 'erp' | 'analytics' }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const moduleId = segments[segments.length - 1] || (mode === 'analytics' ? 'overview' : getDomainTenantErpStart(tenant.verticalId));
  return <DomainTenantWorkspace tenant={tenant} mode={mode} moduleId={moduleId} />;
};

const EstateTenantModuleRoute = ({ tenant, mode }: { tenant: NonNullable<ReturnType<typeof getTenantById>>; mode: 'erp' | 'analytics' }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const moduleId = segments[segments.length - 1] || (mode === 'erp' ? 'property-register' : 'dashboard');
  return <EstateTenantWorkspace tenant={tenant} mode={mode} moduleId={moduleId} />;
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
  if (moduleId === 'fixbot') {
    return <AglFixBotWorkspace tenant={tenant} />;
  }
  if (moduleId === 'work-orders') {
    return <AglWorkOrderRegisterWorkspace tenant={tenant} />;
  }
  if (moduleId === 'profit-loss') {
    return <AglProfitLossWorkspace tenant={tenant} />;
  }
  if (moduleId === 'job-corrections' || moduleId === 'vehicle-handovers') {
    return <AglServiceControlRegisterWorkspace tenant={tenant} moduleId={moduleId} />;
  }
  if (moduleId === 'job-cards') {
    return <AglJobCardWorkspace tenant={tenant} />;
  }
  if (moduleId === 'job-board') {
    return <AglWorkshopBoardWorkspace tenant={tenant} />;
  }
  if (moduleId === 'intake') {
    return <AglCustomerIntakeWorkspace tenant={tenant} />;
  }
  if (moduleId === 'appointments') {
    return <AglAppointmentScheduler tenant={tenant} />;
  }
  if (moduleId === 'purchase-orders') {
    return <AglProcurementWorkspace tenant={tenant} />;
  }
  if (moduleId === 'suppliers') {
    return <AglSupplierWorkspace tenant={tenant} />;
  }
  if (moduleId === 'new-sale') {
    return <AglPointOfSaleWorkspace tenant={tenant} />;
  }
  if (['sales-ledger', 'quotations', 'invoices', 'payments', 'creditors', 'debtors'].includes(moduleId)) {
    return <AglCommercialDocumentsWorkspace tenant={tenant} moduleId={moduleId as 'sales-ledger' | 'quotations' | 'invoices' | 'payments' | 'creditors' | 'debtors'} />;
  }
  if (moduleId === 'subscriptions') {
    return <AglSubscriptionsWorkspace tenant={tenant} />;
  }
  if (moduleId === 'customers' || moduleId === 'vehicles') {
    return <AglCustomerFleetWorkspace tenant={tenant} moduleId={moduleId} />;
  }
  if (moduleId === 'campaigns') {
    return <AglMarketingWorkspace tenant={tenant} />;
  }
  if (['promotions', 'leads', 'marketing-spend', 'reminders', 'notifications'].includes(moduleId)) {
    return <AglCommunicationsWorkspace tenant={tenant} moduleId={moduleId as 'promotions' | 'leads' | 'marketing-spend' | 'reminders' | 'notifications'} />;
  }
  if (moduleId === 'payroll') {
    return <AglPayrollWorkspace tenant={tenant} />;
  }
  if (moduleId === 'staff-portal' || moduleId === 'clock-kiosk') {
    return <AglStaffPortalWorkspace tenant={tenant} mode={moduleId === 'clock-kiosk' ? 'kiosk' : 'portal'} />;
  }
  if (moduleId === 'tasks') {
    return <AglTaskWorkspace tenant={tenant} />;
  }
  if (['organisation', 'onboarding', 'certifications'].includes(moduleId)) {
    return <AglPeopleDevelopmentWorkspace tenant={tenant} moduleId={moduleId as 'organisation' | 'onboarding' | 'certifications'} />;
  }
  if (moduleId === 'attendance' || moduleId === 'leave') {
    return <AglAttendanceWorkspace tenant={tenant} moduleId={moduleId} />;
  }
  if (['employees', 'departments', 'schedules', 'training', 'performance', 'payslips'].includes(moduleId)) {
    return <AglWorkforceWorkspace tenant={tenant} moduleId={moduleId as 'employees' | 'departments' | 'schedules' | 'training' | 'performance' | 'payslips'} />;
  }
  if (moduleId === 'mechanics') return <AglMechanicTrackerWorkspace tenant={tenant} />;
  if (['complaints', 'recalls', 'inspections'].includes(moduleId)) {
    return <AglServiceRecoveryWorkspace tenant={tenant} moduleId={moduleId as 'complaints' | 'recalls' | 'inspections'} />;
  }
  if (['parts', 'inventory-control', 'stock-ledger', 'stock-movements'].includes(moduleId)) {
    return <AglInventoryControlWorkspace tenant={tenant} moduleId={moduleId} />;
  }
  if (['finance-controls', 'expenses', 'petty-cash', 'reconciliation', 'finance-journals'].includes(moduleId)) {
    return <AglFinanceControlWorkspace tenant={tenant} moduleId={moduleId as 'finance-controls' | 'expenses' | 'petty-cash' | 'reconciliation' | 'finance-journals'} />;
  }
  if (moduleId === 'contracts' || moduleId === 'employee-cases') {
    return <AglPeopleControlWorkspace tenant={tenant} moduleId={moduleId} />;
  }
  if (moduleId === 'documents') {
    return <AglDocumentControlWorkspace tenant={tenant} />;
  }
  if (moduleId === 'manager-desk') {
    return <AglManagerDeskWorkspace tenant={tenant} />;
  }
  if (moduleId === 'daily-entry') {
    return <AglDailyOperationsWorkspace tenant={tenant} />;
  }
  if (moduleId === 'forms') {
    return <AglOperationalFormsWorkspace tenant={tenant} />;
  }
  if (moduleId === 'business-reports' || moduleId === 'managerial-reports') {
    return <AglReportingWorkspace tenant={tenant} moduleId={moduleId} />;
  }
  if (moduleId === 'exports') {
    return <AglExportCenterWorkspace tenant={tenant} />;
  }
  if (moduleId === 'archives') {
    return <AglArchivesWorkspace tenant={tenant} />;
  }
  if (moduleId === 'audit-log') {
    return <AglAuditLogWorkspace tenant={tenant} />;
  }
  if (['roles', 'users', 'locations', 'integrations', 'settings'].includes(moduleId)) {
    return <AglAdministrationWorkspace tenant={tenant} moduleId={moduleId as 'roles' | 'users' | 'locations' | 'integrations' | 'settings'} />;
  }
  return <AGLERPWorkspace tenant={tenant} moduleId={moduleId} />;
};

const LegacyAnalyticsRedirect = ({ basePath }: { basePath: string }) => {
  const location = useLocation();
  const relative = location.pathname.slice(basePath.length).replace(/^\/+/, '');
  return <Navigate to={`${basePath}/analytics${relative ? `/${relative}` : ''}`} replace />;
};
