import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../components/ui/GlassPanel';
import { useTheme } from '../context/ThemeContext';
import { Database, Filter, ArrowRight, Building, Car, Briefcase, ChevronRight, BarChart2, TrendingUp, Users } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { VerticalId, Tenant } from '../types';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const MOCK_TENANTS: Record<VerticalId, Tenant[]> = {
  autos: [
    { id: 'agl', name: 'Automobiles Ghana Limited (AGL)', verticalId: 'autos', type: 'dealer' },
    { id: 'kumasi_motors', name: 'Kumasi Motors', verticalId: 'autos', type: 'dealer' },
    { id: 'adinkra_motors', name: 'Adinkra Motors Workshop', verticalId: 'autos', type: 'merchant' },
  ],
  farmers: [
    { id: 'techiman_grain', name: 'Techiman Grain Co-op', verticalId: 'farmers', type: 'coop' },
    { id: 'akumadan_farms', name: 'Akumadan Farms', verticalId: 'farmers', type: 'coop' },
  ],
  estate: [
    { id: 'prime_accra', name: 'Prime Accra Realty', verticalId: 'estate', type: 'agent' },
    { id: 'heritage', name: 'Heritage Estates', verticalId: 'estate', type: 'agent' },
  ],
  merchant: [
    { id: 'techvalley', name: 'TechValley GH', verticalId: 'merchant', type: 'merchant' },
    { id: 'osu_bespoke', name: 'Osu Bespoke', verticalId: 'merchant', type: 'merchant' },
  ],
  label: [
    { id: 'crushed_diamonds', name: 'Crushed Diamonds', verticalId: 'label', type: 'house' },
    { id: 'havilah', name: 'Havilah', verticalId: 'label', type: 'house' },
  ],
  global: [],
  gold: [],
  agents: [],
};

const perfData = [
  { name: 'Mon', revenue: 12000, orders: 45 },
  { name: 'Tue', revenue: 19000, orders: 62 },
  { name: 'Wed', revenue: 15000, orders: 54 },
  { name: 'Thu', revenue: 22000, orders: 71 },
  { name: 'Fri', revenue: 28000, orders: 89 },
  { name: 'Sat', revenue: 35000, orders: 110 },
  { name: 'Sun', revenue: 31000, orders: 95 },
];

export const VerticalDashboard: React.FC<{ verticalId: VerticalId }> = ({ verticalId }) => {
  const { theme } = useTheme();
  const { setCurrentVertical } = useTenant();
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentVertical(verticalId);
  }, [verticalId, setCurrentVertical]);

  const tenants = MOCK_TENANTS[verticalId] || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={verticalId} // Re-animate on vertical change
      className="space-y-8 max-w-7xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-4">
        <div>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-white">
            {theme.name} <span style={{ color: 'var(--theme-accent)' }}>Hub</span>
          </h2>
          <p className="text-gray-400 mt-2 text-sm max-w-2xl">
            Aggregated intelligence view for the {theme.name.toLowerCase()} domain. Drill down into individual tenant ERPS below.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-surface-glass border border-surface-border hover:border-vertical-accent/30 rounded flex items-center gap-2 text-xs font-mono text-gray-300 hover:text-white transition-colors cursor-pointer">
            <Filter size={14} />
            <span>FILTER</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ACTIVE TENANTS', value: tenants.length.toString(), icon: Building },
          { label: 'GMV (7D)', value: 'GHS 162K', icon: TrendingUp },
          { label: 'ACTIVE LISTINGS', value: '4,521', icon: Database },
          { label: 'CUSTOMER REACH', value: '18.2K', icon: Users },
        ].map((kpi, i) => (
          <GlassPanel key={i} className="p-5 rounded-xl h-[120px] flex flex-col justify-between relative overflow-hidden border-l-2 border-l-transparent hover:border-l-vertical-accent transition-colors">
             <div className="absolute top-0 right-0 w-24 h-24 bg-vertical-accent opacity-[0.03] rounded-bl-full blur-xl"></div>
             <div className="flex justify-between items-start z-10">
               <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{kpi.label}</div>
               <kpi.icon size={14} className="text-vertical-accent opacity-60" />
             </div>
             <div className="text-2xl font-display text-white relative z-10 font-medium">{kpi.value}</div>
          </GlassPanel>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassPanel className="lg:col-span-2 p-6 rounded-xl flex flex-col h-[320px]">
          <h3 className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-4">7-Day Revenue Trend (GHS)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPerfRev" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="revenue" stroke="var(--theme-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorPerfRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 rounded-xl flex flex-col h-[320px]">
          <h3 className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-4">Orders by Day</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="orders" fill="var(--theme-accent)" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 border-b border-surface-border pb-2">
          <h3 className="text-xs font-mono text-gray-500 tracking-widest uppercase">Registered Tenants (ERPs)</h3>
          <span className="text-[10px] text-vertical-accent bg-vertical-accent-glow px-2 py-0.5 rounded font-mono uppercase">
            {tenants.length} Active
          </span>
        </div>
        {tenants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map(tenant => (
              <GlassPanel 
                key={tenant.id} 
                interactive 
                onClick={() => navigate(`/${verticalId}/tenant/${tenant.id}`)}
                className="p-5 rounded-xl group border-l-2 border-l-transparent hover:border-l-vertical-accent transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-glass border border-surface-border flex items-center justify-center text-vertical-accent">
                    <Building size={20} />
                  </div>
                  <ChevronRight size={18} className="text-gray-500 group-hover:text-vertical-accent transition-colors" />
                </div>
                <h4 className="font-medium text-white text-base truncate">{tenant.name}</h4>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-border">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                    {tenant.type}
                  </div>
                  <div className="text-[10px] font-mono text-vertical-accent uppercase tracking-wider">
                    Enter ERP →
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        ) : (
          <GlassPanel className="flex-1 rounded-xl border-dashed border-2 p-8 flex flex-col items-center justify-center text-center" style={{ borderColor: 'var(--theme-accent-glow)' }}>
            <div className="w-16 h-16 rounded-full bg-vertical-accent-glow flex items-center justify-center mb-6 border border-vertical-accent/20">
              <Database size={28} className="text-vertical-accent" />
            </div>
            <h3 className="font-display text-xl text-white mb-2">No Active Tenants</h3>
            <p className="text-sm text-gray-400 max-w-md">
              The {theme.name} vertical currently has no registered tenants. Connect a business entity to begin collecting data.
            </p>
          </GlassPanel>
        )}
      </div>
    </motion.div>
  );
};
