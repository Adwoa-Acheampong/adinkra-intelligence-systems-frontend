import React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../components/ui/GlassPanel';
import { Settings, Shield, Users, Server, Database, Activity, Lock, AlertTriangle } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

export const SystemConfig: React.FC = () => {
  const { setCurrentVertical } = useTenant();

  React.useEffect(() => {
    setCurrentVertical('systemConfig');
  }, [setCurrentVertical]);

  const configModules = [
    { name: 'Tenant Registry', icon: Database, desc: 'Manage tenants and statuses' },
    { name: 'Users & Roles', icon: Users, desc: 'Permission matrix and access' },
    { name: 'Vertical Config', icon: Settings, desc: 'Vertical and tenant type registry' },
    { name: 'Feature Flags', icon: Server, desc: 'Subscription tiers and flags' },
    { name: 'Metric Catalog', icon: Activity, desc: 'Definitions and lineage' },
    { name: 'Alert Rules', icon: AlertTriangle, desc: 'Thresholds and triggers' },
    { name: 'Data Quality', icon: Shield, desc: 'Checks and audit logs' },
    { name: 'Integrations', icon: Lock, desc: 'API keys and webhooks' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col"
    >
      <div>
        <h2 className="text-3xl font-display font-semibold tracking-tight text-white">
          System <span style={{ color: 'var(--theme-accent)' }}>Config</span>
        </h2>
        <p className="text-gray-400 mt-2 text-sm max-w-2xl">
          Global settings, registries, and observability configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {configModules.map((mod, i) => (
          <GlassPanel key={i} interactive className="p-5 rounded-xl group border-l-2 border-l-transparent hover:border-l-vertical-accent transition-all cursor-pointer">
             <div className="w-10 h-10 rounded-lg bg-surface-glass border border-surface-border flex items-center justify-center text-gray-400 group-hover:text-vertical-accent transition-colors mb-4">
               <mod.icon size={20} />
             </div>
             <h4 className="font-medium text-white text-base">{mod.name}</h4>
             <p className="text-xs text-gray-500 mt-1">{mod.desc}</p>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="p-6 rounded-xl flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display text-white">Tenant Registry Overview</h3>
          <button className="px-3 py-1.5 bg-vertical-accent/10 border border-vertical-accent/30 text-vertical-accent rounded text-xs font-mono">
            + NEW TENANT
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border bg-black/20">
                <th className="px-4 py-3 text-xs font-mono tracking-wider text-gray-400 uppercase">Tenant ID</th>
                <th className="px-4 py-3 text-xs font-mono tracking-wider text-gray-400 uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-mono tracking-wider text-gray-400 uppercase">Vertical</th>
                <th className="px-4 py-3 text-xs font-mono tracking-wider text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-xs font-mono tracking-wider text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {['agl', 'techvalley', 'prime_accra', 'techiman_grain', 'havilah'].map((id, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors cursor-pointer group">
                  <td className="px-4 py-3 text-sm font-mono text-gray-300">{id}</td>
                  <td className="px-4 py-3 text-sm text-white">Example Tenant {i+1}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 capitalize">Multiple</td>
                  <td className="px-4 py-3 text-sm text-gray-400 capitalize">Enterprise</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-[10px] font-mono rounded bg-green-500/10 text-green-400 uppercase">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </motion.div>
  );
};
