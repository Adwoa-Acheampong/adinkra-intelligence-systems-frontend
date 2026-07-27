import React, { useState } from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { Search, Filter, Download, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const GenericEntityTable: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.split('/').pop() || 'Entities';
  const title = path.charAt(0).toUpperCase() + path.slice(1);
  const [selectedEntity, setSelectedEntity] = useState<number | null>(null);

  return (
    <div className="space-y-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-medium text-white">{title}</h2>
          <p className="text-sm text-gray-400 mt-1">Manage and track {title.toLowerCase()} records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder={`Search ${title.toLowerCase()}...`}
              className="pl-9 pr-4 py-2 bg-surface-glass border border-surface-border rounded-lg text-sm text-white focus:border-vertical-accent focus:outline-none transition-colors w-64"
            />
          </div>
          <button className="p-2 border border-surface-border rounded-lg bg-surface-glass text-gray-400 hover:text-white hover:border-vertical-accent transition-colors">
            <Filter size={18} />
          </button>
          <button className="p-2 border border-surface-border rounded-lg bg-surface-glass text-gray-400 hover:text-white hover:border-vertical-accent transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      <GlassPanel className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border bg-black/20">
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-gray-400 uppercase">ID</th>
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-gray-400 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-gray-400 uppercase">Reference</th>
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-gray-400 uppercase">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedEntity(i)}
                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 text-sm font-mono text-gray-300">
                    <span className="group-hover:text-vertical-accent transition-colors">#{1000 + i}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-green-500/10 text-green-400 uppercase tracking-wider border border-green-500/20">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">Oct {10 + i}, 2026</td>
                  <td className="px-6 py-4 text-sm text-gray-300">REF-{8000 + i}</td>
                  <td className="px-6 py-4 text-sm text-white font-mono">GHS {(1000 + i * 150).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-surface-border flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono uppercase">Showing 7 of 142 records</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-surface-border rounded text-xs text-gray-400 hover:text-white hover:bg-surface-glass transition-colors">Prev</button>
            <button className="px-3 py-1 border border-surface-border rounded text-xs text-gray-400 hover:text-white hover:bg-surface-glass transition-colors">Next</button>
          </div>
        </div>
      </GlassPanel>

      <AnimatePresence>
        {selectedEntity !== null && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed top-16 right-0 bottom-0 w-[400px] bg-adinkra-black border-l border-surface-border shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-surface-border flex justify-between items-center bg-black/40">
              <h3 className="text-lg font-display text-white">Record #{1000 + selectedEntity}</h3>
              <button onClick={() => setSelectedEntity(null)} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Metadata</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-glass p-3 rounded border border-surface-border">
                    <div className="text-xs text-gray-500 mb-1">Created</div>
                    <div className="text-sm text-white">Oct {10 + selectedEntity}, 2026</div>
                  </div>
                  <div className="bg-surface-glass p-3 rounded border border-surface-border">
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className="text-sm text-green-400">Active</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Audit Trail</h4>
                <div className="space-y-3">
                  {[1, 2, 3].map(step => (
                    <div key={step} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-vertical-accent"></div>
                      <div>
                        <div className="text-white">State updated to {step === 1 ? 'Initialized' : step === 2 ? 'Processing' : 'Active'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">by System • 10:4{step} AM</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
