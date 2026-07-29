import React, { useEffect, useState } from 'react';
import { ArrowRight, Users, Search, Bell, ChevronRight } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export const Topbar = () => {
  const { currentTenant } = useTenant();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    if (location.pathname === '/intelligence') setQuery(searchParams.get('q') || '');
  }, [location.pathname, searchParams]);

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
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = query.trim();
    navigate(normalized ? `/intelligence?q=${encodeURIComponent(normalized)}` : '/intelligence');
  };

  return (
    <header className="h-16 bg-adinkra-black border-b border-surface-border flex items-center justify-between gap-4 px-4 md:px-6 shrink-0 relative z-20">
      <div className="flex min-w-0 items-center gap-4">
        <div className="custom-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap text-[9px] font-mono uppercase tracking-widest text-gray-500 md:text-xs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={12} className="text-gray-600" />}
              <span className={idx === breadcrumbs.length - 1 ? "text-gray-300" : "text-vertical-accent transition-colors duration-500"}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
        <span className="hidden shrink-0 rounded border border-emerald-400/15 bg-emerald-400/[0.04] px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-emerald-300/70 xl:block">
          As of 06:00 GMT
        </span>
      </div>
      
      <div className="flex shrink-0 items-center gap-3 md:gap-6">
        <form onSubmit={submitSearch} className="hidden md:flex items-center gap-3 bg-surface-glass border border-surface-border rounded-md px-3 py-1.5 focus-within:border-vertical-accent/50 transition-colors">
          <Search size={14} className="text-gray-400" />
          <input 
            type="text" 
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask a claim or find evidence…"
            aria-label="Search metrics, entities and evidence"
            className="bg-transparent border-none outline-none text-xs text-white w-48 font-mono placeholder:text-gray-600"
          />
          <button
            type="submit"
            aria-label="Run intelligence search"
            className="flex h-7 w-7 items-center justify-center rounded text-gray-600 transition hover:bg-white/[0.05] hover:text-vertical-accent focus:outline-none focus:ring-2 focus:ring-vertical-accent"
          >
            <ArrowRight size={13} />
          </button>
        </form>

        <div className="flex items-center gap-4">
          <button className="relative text-gray-400 hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-vertical-accent animate-pulse"></span>
          </button>
          
          <div className="h-6 w-px bg-surface-border"></div>

          <div className="hidden flex-col items-end justify-center lg:flex">
            <span className="text-xs font-medium text-white">{currentTenant?.name || 'Global Operations'}</span>
            <span className="text-[10px] font-mono text-gray-500">{currentTenant ? `${currentTenant.type} tenant` : 'Adinkra Admin'}</span>
          </div>

          <div className="w-8 h-8 rounded-md bg-surface-glass border border-surface-border flex items-center justify-center">
            <Users size={14} className="text-gray-300" />
          </div>
        </div>
      </div>
    </header>
  );
};
