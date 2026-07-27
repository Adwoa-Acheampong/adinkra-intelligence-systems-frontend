import React from 'react';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { useTenant } from '../../context/TenantContext';
import { Wallet, ShoppingCart, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const TenantOverview = () => {
  const { currentTenant } = useTenant();

  if (!currentTenant) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-6 border-b border-surface-border pb-4 overflow-x-auto custom-scrollbar">
        <button className="px-4 py-2 bg-vertical-accent text-[#050505] font-medium text-sm rounded-full whitespace-nowrap flex items-center gap-2">
          <ShoppingCart size={16} />
          Sales
        </button>
        <button className="px-4 py-2 bg-surface-glass text-gray-300 hover:text-white font-medium text-sm rounded-full whitespace-nowrap transition-colors">
          Operations
        </button>
        <button className="px-4 py-2 bg-surface-glass text-gray-300 hover:text-white font-medium text-sm rounded-full whitespace-nowrap transition-colors">
          HR
        </button>
        <button className="px-4 py-2 bg-surface-glass text-gray-300 hover:text-white font-medium text-sm rounded-full whitespace-nowrap transition-colors">
          Finance
        </button>
        <button className="px-4 py-2 bg-surface-glass text-gray-300 hover:text-white font-medium text-sm rounded-full whitespace-nowrap transition-colors">
          Inventory
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-6 rounded-xl relative overflow-hidden bg-white/5 border-white/10">
          <div className="flex justify-between items-start mb-6">
            <div className="text-xs font-mono font-bold tracking-widest text-gray-400">REVENUE</div>
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <Wallet size={14} />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-white mb-1">GHS 349,140.00</div>
          <div className="text-sm text-gray-500">72 orders</div>
        </GlassPanel>

        <GlassPanel className="p-6 rounded-xl relative overflow-hidden bg-white/5 border-white/10">
          <div className="flex justify-between items-start mb-6">
            <div className="text-xs font-mono font-bold tracking-widest text-gray-400">ORDERS</div>
            <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center">
              <ShoppingCart size={14} className="text-gray-300" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-white mb-1">72</div>
          <div className="text-sm text-gray-500">2 channels</div>
        </GlassPanel>

        <GlassPanel className="p-6 rounded-xl relative overflow-hidden bg-white/5 border-white/10">
          <div className="flex justify-between items-start mb-6">
            <div className="text-xs font-mono font-bold tracking-widest text-gray-400">AVERAGE ORDER</div>
            <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-gray-300" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-white mb-1">GHS 1,034.03</div>
          <div className="text-sm text-gray-500">Per transaction</div>
        </GlassPanel>

        <GlassPanel className="p-6 rounded-xl relative overflow-hidden bg-white/5 border-white/10">
          <div className="flex justify-between items-start mb-6">
            <div className="text-xs font-mono font-bold tracking-widest text-gray-400">CUSTOMERS</div>
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-white mb-1">100</div>
          <div className="text-sm text-gray-500">On the ledger</div>
        </GlassPanel>
      </div>

      <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} className="text-[#050505]" />
        </div>
        <div>
          <h4 className="font-bold text-green-400 text-sm tracking-wider uppercase mb-1">ALL CLEAR</h4>
          <p className="text-sm text-gray-300">No critical signals across operations. Inventory, creditors, workshop and marketing are all within thresholds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassPanel className="lg:col-span-2 p-6 rounded-xl bg-white/5 border-white/10 min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-medium text-white flex items-center gap-2">
              <TrendingUp size={16} /> Revenue — last 30 days
            </h3>
            <span className="text-sm text-gray-400">GHS 90,550.00 • 83 orders</span>
          </div>
          <div className="flex-1 border-b border-white/10 flex items-end relative overflow-hidden">
             {/* Mock area chart line */}
             <svg viewBox="0 0 100 40" className="absolute bottom-0 w-full h-full preserve-3d" preserveAspectRatio="none">
               <path d="M0,40 L0,25 L10,10 L20,30 L30,20 L40,35 L50,15 L60,30 L70,5 L80,35 L90,15 L100,25 L100,40 Z" fill="url(#grad)" opacity="0.3" />
               <path d="M0,25 L10,10 L20,30 L30,20 L40,35 L50,15 L60,30 L70,5 L80,35 L90,15 L100,25" fill="none" stroke="var(--theme-accent)" strokeWidth="0.5" />
               <defs>
                 <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                   <stop offset="0%" stopColor="var(--theme-accent)" />
                   <stop offset="100%" stopColor="transparent" />
                 </linearGradient>
               </defs>
             </svg>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>06-26</span>
            <span className="font-bold text-white">Today: GHS 0.00</span>
            <span>07-25</span>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 rounded-xl bg-white/5 border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-medium text-white flex items-center gap-2">
               Sales by channel
            </h3>
            <span className="text-sm text-gray-400">7 channels</span>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Walk-In', value: '259,635.00', count: 274, pct: 100 },
              { label: 'Delivery', value: '48,750.00', count: 41, pct: 30 },
              { label: 'Phone', value: '23,450.00', count: 20, pct: 15 },
              { label: 'WhatsApp', value: '2,505.00', count: 1, pct: 5 },
            ].map(ch => (
              <div key={ch.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-white">{ch.label}</span>
                  <span className="text-gray-400">GHS {ch.value} • {ch.count} orders</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${ch.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </motion.div>
  );
};
