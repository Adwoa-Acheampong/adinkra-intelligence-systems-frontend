import React from 'react';
import { Users, Search, Bell, ChevronRight } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocation } from 'react-router-dom';

export const Topbar = () => {
  const { tenantId, merchantId } = useTenant();
  const { theme } = useTheme();
  const location = useLocation();

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return ['Ecosystem Command Center'];
    
    // Capitalize and format paths
    const formatted = paths.map(p => 
      p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    );
    
    return [theme.name, ...formatted];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-adinkra-black border-b border-surface-border flex items-center justify-between px-6 shrink-0 relative z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={12} className="text-gray-600" />}
              <span className={idx === breadcrumbs.length - 1 ? "text-gray-300" : "text-vertical-accent transition-colors duration-500"}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 bg-surface-glass border border-surface-border rounded-md px-3 py-1.5 focus-within:border-vertical-accent/50 transition-colors">
          <Search size={14} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search entities, signals..." 
            className="bg-transparent border-none outline-none text-xs text-white w-48 font-mono placeholder:text-gray-600"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative text-gray-400 hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-vertical-accent animate-pulse"></span>
          </button>
          
          <div className="h-6 w-px bg-surface-border"></div>

          <div className="flex flex-col items-end justify-center">
            <span className="text-xs font-medium text-white">{tenantId}</span>
            <span className="text-[10px] font-mono text-gray-500">{merchantId}</span>
          </div>

          <div className="w-8 h-8 rounded-md bg-surface-glass border border-surface-border flex items-center justify-center">
            <Users size={14} className="text-gray-300" />
          </div>
        </div>
      </div>
    </header>
  );
};
