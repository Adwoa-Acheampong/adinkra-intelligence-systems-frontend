import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, Car, Leaf, Home as HomeIcon, Coins, Zap, Shield, Settings
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { VerticalId } from '../../types';
import { useTheme } from '../../context/ThemeContext';

export const Sidebar = () => {
  const { currentVertical, setCurrentVertical } = useTenant();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleNav = (path: string, verticalId: VerticalId) => {
    setCurrentVertical(verticalId);
    navigate(path);
  };

  const navItems: { id: VerticalId; name: string; path: string; icon: React.ReactNode }[] = [
    { id: 'global', name: 'Command Center', path: '/', icon: <Activity size={18} /> },
    { id: 'merchant', name: 'Merchants', path: '/merchant', icon: <HomeIcon size={18} /> },
    { id: 'autos', name: 'AutoHub', path: '/autos', icon: <Car size={18} /> },
    { id: 'estate', name: 'Estate', path: '/estate', icon: <Shield size={18} /> },
    { id: 'farmers', name: 'Farmers Market', path: '/farmers', icon: <Leaf size={18} /> },
    { id: 'label', name: 'Blkk Label', path: '/label', icon: <Zap size={18} /> },
    { id: 'gold', name: 'Precious Metals', path: '/gold', icon: <Coins size={18} /> },
  ];

  return (
    <aside className="w-64 bg-adinkra-dark border-r border-surface-border flex flex-col h-full shrink-0 relative z-20">
      <div className="p-6 flex items-center gap-3">
        <Shield size={28} className="text-vertical-accent transition-colors duration-500" />
        <div>
          <h1 className="font-display font-bold text-lg tracking-wider text-white leading-tight">ADINKRA</h1>
          <p className="text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase">Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="mb-4 px-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">Modules</div>
        {navItems.map((item) => {
          const isActive = currentVertical === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.path, item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-300 group ${
                isActive 
                  ? 'bg-vertical-accent-glow text-vertical-accent shadow-[inset_2px_0_0_0_var(--theme-accent)]' 
                  : 'text-gray-400 hover:text-white hover:bg-surface-glass'
              }`}
            >
              <div className={isActive ? 'text-vertical-accent' : 'text-gray-500 group-hover:text-gray-300 transition-colors'}>
                {item.icon}
              </div>
              <span className="text-sm font-medium tracking-wide">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-border">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-surface-glass">
          <Settings size={18} />
          <span className="text-sm font-medium">System Config</span>
        </button>
      </div>
    </aside>
  );
};
