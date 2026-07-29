import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronsRight,
  Grid2X2,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import type { Tenant, VerticalId } from '../../types';
import { getAglErpModuleSections, getTenantModules } from '../../config/routes';
import {
  ERP_SWITCHER,
  getModuleHref,
  getWorkspaceForPath,
} from '../../config/erpWorkspaces';

interface SidebarItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

interface SidebarContext {
  name: string;
  shortName: string;
  descriptor: string;
  level: string;
  homePath: string;
  parentPath?: string;
  parentLabel?: string;
  sections: SidebarSection[];
}

export interface SidebarProps {
  tenant?: Tenant;
  tenantMode?: 'analytics' | 'erp';
}

const readCollapsedPreference = () => {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem('adinkra_sidebar_collapsed');
  if (stored !== null) return stored === 'true';
  return window.innerWidth < 1100;
};

export const Sidebar: React.FC<SidebarProps> = ({ tenant, tenantMode = 'analytics' }) => {
  const { currentVertical, setCurrentVertical } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const workspace = useMemo(() => getWorkspaceForPath(location.pathname), [location.pathname]);

  useEffect(() => {
    window.localStorage.setItem('adinkra_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setSwitcherOpen(false);
  }, [location.pathname]);

  const context = useMemo<SidebarContext>(() => {
    if (tenant) {
      const tenantBasePath = `/${tenant.verticalId}/tenant/${tenant.id}`;
      const basePath = `${tenantBasePath}/${tenantMode}`;
      const tenantSections = tenantMode === 'erp' && tenant.id === 'agl'
        ? getAglErpModuleSections().map((section) => ({
            label: section.label,
            items: section.modules.map((item) => ({
              id: item.path,
              label: item.name,
              href: `${basePath}/${item.path}`,
              icon: item.icon,
            })),
          }))
        : [{
            label: 'Analytics',
            items: getTenantModules(tenant.verticalId, tenant.type).map((item) => ({
              id: item.path || 'overview',
              label: item.path ? item.name : 'Analytics overview',
              href: item.path ? `${basePath}/${item.path}` : basePath,
              icon: item.icon,
            })),
          }];
      return {
        name: tenant.name,
        shortName: tenant.name.charAt(0),
        descriptor: tenantMode === 'erp'
          ? `${tenant.type.replace(/_/g, ' ')} operational ERP`
          : `${tenant.type.replace(/_/g, ' ')} tenant analytics`,
        level: 'tenant',
        homePath: basePath,
        parentPath: tenantBasePath,
        parentLabel: `${tenant.name} systems`,
        sections: tenantSections,
      };
    }

    const sections: SidebarSection[] = workspace.sections.map((section) => ({
      label: section.label,
      items: section.modules.map((item) => ({
        id: item.id || 'overview',
        label: item.label,
        description: item.description,
        href: getModuleHref(workspace, item.id),
        icon: React.createElement(item.icon, { size: 18 }),
      })),
    }));

    return {
      name: workspace.name,
      shortName: workspace.shortName,
      descriptor: workspace.descriptor,
      level: workspace.level,
      homePath: workspace.basePath,
      parentPath: workspace.parentPath,
      parentLabel: workspace.parentLabel,
      sections,
    };
  }, [tenant, tenantMode, workspace]);

  const isActive = (href: string) => {
    if (href === context.homePath) return location.pathname === href;
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const moveToERP = (path: string, verticalId: VerticalId) => {
    setCurrentVertical(verticalId);
    navigate(path);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative z-30 flex h-full shrink-0 flex-col overflow-visible border-r border-surface-border bg-[#080808]"
      aria-label={`${context.name} navigation`}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-white/[0.07] px-3">
        <button
          onClick={() => navigate(context.homePath)}
          className={`flex min-w-0 flex-1 items-center rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-vertical-accent ${collapsed ? 'justify-center' : 'gap-3 px-2'}`}
          aria-label={`Open ${context.name} home`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vertical-accent/25 bg-vertical-accent-glow text-vertical-accent">
            {context.level === 'tenant' ? <span className="font-display font-semibold">{context.shortName}</span> : <Shield size={19} />}
          </div>
          {!collapsed && (
            <motion.div key={context.homePath} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="min-w-0">
              <div className="truncate text-sm font-display font-semibold text-white">{context.name}</div>
              <div className="mt-0.5 truncate text-[9px] font-mono uppercase tracking-[0.18em] text-gray-600">{context.descriptor}</div>
            </motion.div>
          )}
        </button>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {context.parentPath && (
        <div className={`border-b border-white/[0.06] ${collapsed ? 'p-2' : 'p-3'}`}>
          <button
            onClick={() => navigate(context.parentPath!)}
            className={`flex min-h-11 w-full items-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.04] hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}
            title={context.parentLabel}
            aria-label={`Back to ${context.parentLabel}`}
          >
            <ArrowLeft size={16} className="shrink-0" />
            {!collapsed && <span className="truncate text-xs">{context.parentLabel}</span>}
          </button>
        </div>
      )}

      <motion.nav
        key={`${context.level}:${context.homePath}`}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={`custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}
      >
        {context.sections.map((section) => (
          <div key={section.label} className="mb-5">
            {!collapsed && <div className="mb-2 px-3 text-[9px] font-mono uppercase tracking-[0.2em] text-gray-600">{section.label}</div>}
            {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-white/10" />}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    className={`group relative flex min-h-11 w-full items-center rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vertical-accent ${
                      collapsed ? 'justify-center px-2' : 'gap-3 px-3 text-left'
                    } ${
                      active
                        ? 'bg-vertical-accent-glow text-vertical-accent shadow-[inset_2px_0_0_var(--theme-accent)]'
                        : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-200'
                    }`}
                    title={collapsed ? `${item.label}${item.description ? ` — ${item.description}` : ''}` : item.description}
                    aria-current={active ? 'page' : undefined}
                    aria-label={item.label}
                  >
                    <span className={`shrink-0 transition-colors ${active ? 'text-vertical-accent' : 'text-gray-600 group-hover:text-gray-300'}`}>{item.icon}</span>
                    {!collapsed && <span className="min-w-0 truncate text-[13px] font-medium">{item.label}</span>}
                    {active && collapsed && <span className="absolute right-0 h-5 w-0.5 rounded-l bg-vertical-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </motion.nav>

      <div className={`relative border-t border-white/[0.07] ${collapsed ? 'p-2' : 'p-3'}`}>
        <button
          onClick={() => setSwitcherOpen((value) => !value)}
          className={`flex min-h-11 w-full items-center rounded-lg text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}
          aria-expanded={switcherOpen}
          aria-label="Switch ERP"
          title="Switch ERP"
        >
          <Grid2X2 size={18} />
          {!collapsed && <><span className="flex-1 text-left text-[13px] font-medium">Switch ERP</span><ChevronsRight size={14} className={switcherOpen ? 'rotate-90' : ''} /></>}
        </button>
        <button
          onClick={() => moveToERP('/system-config', 'systemConfig')}
          className={`mt-1 flex min-h-11 w-full items-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-vertical-accent ${
            collapsed ? 'justify-center' : 'gap-3 px-3'
          } ${currentVertical === 'systemConfig' ? 'bg-vertical-accent-glow text-vertical-accent' : 'text-gray-500 hover:bg-white/[0.05] hover:text-white'}`}
          aria-label="System configuration"
          title="System configuration"
        >
          <Settings size={18} />
          {!collapsed && <span className="text-[13px] font-medium">System Config</span>}
        </button>
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mt-1 flex h-11 w-full items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.05] hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        <AnimatePresence>
          {switcherOpen && (
            <>
              <button className="fixed inset-0 z-40 cursor-default" aria-label="Close ERP switcher" onClick={() => setSwitcherOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className={`absolute bottom-16 z-50 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0b] shadow-2xl ${collapsed ? 'left-16' : 'left-3'}`}
              >
                <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                  <div><div className="text-xs font-medium text-white">Switch operating ERP</div><div className="mt-1 text-[10px] text-gray-600">Each opens its own command shell.</div></div>
                  <button onClick={() => setSwitcherOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-white" aria-label="Close switcher"><X size={15} /></button>
                </div>
                <div className="custom-scrollbar max-h-[420px] overflow-y-auto p-2">
                  {ERP_SWITCHER.map((item) => {
                    const Icon = item.icon;
                    const active = workspace.basePath === item.path && !tenant;
                    return (
                      <button
                        key={item.path}
                        onClick={() => moveToERP(item.path, item.verticalId)}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors ${active ? 'bg-vertical-accent-glow text-vertical-accent' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'}`}
                      >
                        <Icon size={17} className="shrink-0" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
