import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../components/ui/GlassPanel';
import { useTheme } from '../context/ThemeContext';
import { useTenant } from '../context/TenantContext';
import { Smartphone, Monitor, Activity, Users, Zap, Clock, Shield } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const perfData = [
  { name: 'Mon', website: 12000, apps: 4500 },
  { name: 'Tue', website: 19000, apps: 6200 },
  { name: 'Wed', website: 15000, apps: 5400 },
  { name: 'Thu', website: 22000, apps: 7100 },
  { name: 'Fri', website: 28000, apps: 8900 },
  { name: 'Sat', website: 35000, apps: 11000 },
  { name: 'Sun', website: 31000, apps: 9500 },
];

import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters';
import { FilterBar } from '../components/analytics/FilterBar';

export const WebsitesApps: React.FC = () => {
  const { theme } = useTheme();
  const { setCurrentVertical } = useTenant();
  const { filters, updateFilter } = useAnalyticsFilters({ source: 'All Sources' });

  useEffect(() => {
    setCurrentVertical('appsWebsite');
  }, [setCurrentVertical]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col"
    >
      <div className="flex flex-col xl:flex-row xl:items-start justify-between mb-2 gap-4">
        <div>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-white">
            Websites & <span style={{ color: 'var(--theme-accent)' }}>Apps</span>
          </h2>
          <p className="text-gray-400 mt-2 text-sm max-w-2xl">
            Digital product analytics and client/runtime telemetry. 
          </p>
        </div>
        <FilterBar filters={filters} updateFilter={updateFilter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Website Central */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-surface-border">
            <Monitor className="text-vertical-accent" size={24} />
            <h3 className="text-xl font-display text-white">Website Central</h3>
            <span className="px-2 py-0.5 rounded-full bg-vertical-accent/10 border border-vertical-accent/30 text-[10px] font-mono text-vertical-accent uppercase">BLKK Star Hub</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'MAU', value: '1.2M', icon: Users },
              { label: 'ENGAGEMENT RATE', value: '64%', icon: Activity },
              { label: 'AVG LCP', value: '1.2s', icon: Zap },
              { label: 'CONVERSION', value: '3.4%', icon: Clock },
            ].map((kpi, i) => (
              <GlassPanel key={i} className="p-4 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{kpi.label}</div>
                  <kpi.icon size={14} className="text-gray-500" />
                </div>
                <div className="text-2xl font-display text-white">{kpi.value}</div>
              </GlassPanel>
            ))}
          </div>
          
          <GlassPanel className="p-6 rounded-xl flex flex-col h-[280px]">
            <h3 className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-4">Website Traffic (7D)</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--theme-accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--theme-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--theme-accent)' }}
                  />
                  <Area type="monotone" dataKey="website" stroke="var(--theme-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorWeb)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </div>

        {/* Apps Central */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-surface-border">
            <Smartphone className="text-vertical-accent" size={24} />
            <h3 className="text-xl font-display text-white">Apps Central</h3>
            <span className="px-2 py-0.5 rounded-full bg-vertical-accent/10 border border-vertical-accent/30 text-[10px] font-mono text-vertical-accent uppercase">5 Native Apps</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'DAU (PORTFOLIO)', value: '450K', icon: Users },
              { label: 'CRASH-FREE (SESSION)', value: '99.8%', icon: Shield },
              { label: 'API LATENCY', value: '142ms', icon: Clock },
              { label: 'D1 RETENTION', value: '42%', icon: Activity },
            ].map((kpi, i) => (
              <GlassPanel key={i} className="p-4 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{kpi.label}</div>
                  <kpi.icon size={14} className="text-gray-500" />
                </div>
                <div className="text-2xl font-display text-white">{kpi.value}</div>
              </GlassPanel>
            ))}
          </div>

          <GlassPanel className="p-6 rounded-xl flex flex-col h-[280px]">
            <h3 className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-4">Native App Sessions (7D)</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C084FC" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C084FC" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#C084FC' }}
                  />
                  <Area type="monotone" dataKey="apps" stroke="#C084FC" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-xs font-mono text-gray-500 tracking-widest uppercase mb-4">App Portfolio Drill-through</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
           {['BLKK Autos', 'Merchants', 'Farmers', 'Estate', 'BLKK Label Admin'].map((app, i) => (
             <GlassPanel key={i} interactive className="p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-vertical-accent transition-colors">
                <span className="font-medium text-sm text-gray-300 group-hover:text-white transition-colors">{app} App</span>
                <Smartphone size={14} className="text-gray-500 group-hover:text-vertical-accent transition-colors" />
             </GlassPanel>
           ))}
        </div>
      </div>
    </motion.div>
  );
};
