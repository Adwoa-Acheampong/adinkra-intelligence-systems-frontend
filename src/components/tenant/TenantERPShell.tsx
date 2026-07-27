import React, { useEffect } from 'react';
import { useParams, Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { VerticalId, Tenant } from '../../types';
import { Shield, ArrowLeft, LayoutDashboard, Wrench, Package, ShoppingCart, DollarSign, Users, Bot, MessageSquare, Briefcase, Truck, Activity, FileText, Settings, Heart, Cpu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { GlassPanel } from '../ui/GlassPanel';
import { TenantOverview } from '../../pages/tenant/TenantOverview';
import { getTenantById } from '../../data/mockAnalyticsData';

import { getTenantModules } from '../../config/routes';

import { GenericEntityTable } from './GenericEntityTable';

const TenantSidebar = ({ tenant }: { tenant: Tenant }) => {
  const { theme } = useTheme();
  
  const navItems = getTenantModules(tenant.verticalId, tenant.type);

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-surface-border flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-surface-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-surface-glass border border-surface-border flex items-center justify-center font-display font-bold text-vertical-accent">
            {tenant.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-white truncate max-w-[150px]">{tenant.name}</h2>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{tenant.type} ERP</div>
          </div>
        </div>
        <Link 
          to={`/${tenant.verticalId}`}
          className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to {theme.name}
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="mb-4 px-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Modules</div>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-300 group hover:bg-surface-glass text-gray-400 hover:text-white`}
          >
            <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
              {item.icon}
            </div>
            <span className="text-sm font-medium tracking-wide">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export const TenantERPShell = () => {
  const { verticalId, tenantId } = useParams<{ verticalId: VerticalId; tenantId: string }>();
  const { setCurrentVertical, setCurrentTenant, currentTenant } = useTenant();
  const navigate = useNavigate();

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050505] text-white">
      {/* We could keep a thin global rail here, but for now we replace the sidebar with the Tenant Sidebar */}
      <TenantSidebar tenant={currentTenant} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div 
          className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-[0.1] transition-colors duration-1000 z-0"
          style={{ background: 'var(--theme-accent)' }}
        />
        
        <header className="h-16 bg-[#050505]/80 backdrop-blur-md border-b border-surface-border flex items-center justify-between px-6 shrink-0 relative z-20">
          <div className="flex items-center gap-4">
            <span className="font-display font-medium text-white">{currentTenant.name} Command Center</span>
            <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-mono text-green-400 uppercase tracking-widest">PROD</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-glass border border-surface-border flex items-center justify-center text-xs font-medium text-gray-300">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8 relative z-10 custom-scrollbar">
          <Routes>
            <Route path="/" element={<TenantOverview />} />
            <Route path="*" element={<GenericEntityTable />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
