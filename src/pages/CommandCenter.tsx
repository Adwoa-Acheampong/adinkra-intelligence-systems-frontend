import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../components/ui/GlassPanel';
import { useTenant } from '../context/TenantContext';
import { 
  ShieldAlert, Activity, Network, BrainCircuit, DollarSign, Users, Target, BarChart2, 
  ArrowRight, ArrowUpRight, ArrowDownRight, Globe, Filter, Truck, Package, Wrench, Sprout, Star 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- MOCK DATA ---
const revenueData = [
  { name: 'Jan', revenue: 420000, expenses: 280000 },
  { name: 'Feb', revenue: 480000, expenses: 310000 },
  { name: 'Mar', revenue: 510000, expenses: 320000 },
  { name: 'Apr', revenue: 640000, expenses: 380000 },
  { name: 'May', revenue: 720000, expenses: 410000 },
  { name: 'Jun', revenue: 850000, expenses: 460000 },
  { name: 'Jul', revenue: 910000, expenses: 490000 },
];

const verticalData = [
  { name: 'Merchants', volume: 14500, agents: 420 },
  { name: 'AutoHub', volume: 22000, agents: 180 },
  { name: 'Estate', volume: 45000, agents: 112 },
  { name: 'Farmers', volume: 18000, agents: 890 },
  { name: 'Label', volume: 8500, agents: 45 },
];

const tickers = [
  { label: 'FERTILIZER (NPK 15:15:15)', price: 'GHS 420/bag', change: '-2.4%', trend: 'down' },
  { label: 'TECHIMAN MAIZE', price: 'GHS 180/bag', change: '+1.2%', trend: 'up' },
  { label: 'GOLD SPOT', price: '$2,340/oz', change: '+0.5%', trend: 'up' },
  { label: 'AUTO PARTS INDEX', price: '142.5 pts', change: '-0.8%', trend: 'down' },
  { label: 'BRENT CRUDE', price: '$82.40/bbl', change: '+1.1%', trend: 'up' },
  { label: 'USD/GHS', price: '14.85', change: '+0.2%', trend: 'up' },
];

// --- SUB-COMPONENTS ---
const MetricCard = ({ title, value, change, trend = 'up', icon: Icon, highlight }: any) => (
  <GlassPanel className={`p-5 rounded-xl flex flex-col justify-between h-[130px] border-l-2 ${highlight ? 'border-l-vertical-accent' : 'border-l-transparent'}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">{title}</div>
      <Icon size={14} className="text-vertical-accent opacity-70" />
    </div>
    <div className="flex items-end justify-between">
      <div className="text-2xl font-display font-medium tracking-tight text-white">{value}</div>
      <div className={`text-[10px] font-mono flex items-center gap-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {change}
      </div>
    </div>
  </GlassPanel>
);

const LeaderboardRow = ({ rank, name, metric1, metric2, icon: Icon }: any) => (
  <div className="flex items-center justify-between p-2.5 hover:bg-surface-glass rounded-lg transition-colors border border-transparent hover:border-surface-border">
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : rank === 2 ? 'bg-gray-300/20 text-gray-300' : rank === 3 ? 'bg-orange-600/20 text-orange-500' : 'bg-surface-border text-gray-500'}`}>
        {rank}
      </div>
      <div>
        <div className="text-sm font-medium text-white flex items-center gap-2">
          {name}
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end">
      <div className="text-xs text-white font-mono">{metric1}</div>
      <div className="text-[10px] text-gray-500 font-mono">{metric2}</div>
    </div>
  </div>
);

export const CommandCenter = () => {
  const { setCurrentVertical } = useTenant();
  
  // Filter States
  const [timeframe, setTimeframe] = useState('7D');
  const [currency, setCurrency] = useState('GHS');
  const [region, setRegion] = useState('Global');

  useEffect(() => {
    setCurrentVertical('global');
  }, [setCurrentVertical]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1600px] mx-auto pb-12"
    >
      {/* Header & Global Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h2 className="text-3xl font-display font-semibold text-white tracking-tight">Global Command</h2>
          <p className="text-gray-400 mt-2 text-sm max-w-2xl">
            Palantir-grade macro-analytics across Finance, Operations, Marketing, and Human Capital.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[#0a0a0a] border border-surface-border rounded-lg p-1">
            {['Real-time', 'Today', '7D', '30D', 'YTD'].map(t => (
              <button 
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${timeframe === t ? 'bg-surface-border text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="flex items-center bg-[#0a0a0a] border border-surface-border rounded-lg p-1">
            {['GHS', 'USD'].map(c => (
              <button 
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${currency === c ? 'bg-surface-border text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative">
            <select 
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="appearance-none bg-[#0a0a0a] border border-surface-border text-white text-xs font-mono rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-vertical-accent"
            >
              <option value="Global">Global</option>
              <option value="Accra">Greater Accra</option>
              <option value="Kumasi">Ashanti (Kumasi)</option>
              <option value="Techiman">Bono East (Techiman)</option>
              <option value="Northern">Northern Region</option>
            </select>
            <Globe size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Ticker Bar */}
      <div className="w-full bg-[#050505] border border-surface-border rounded-lg overflow-hidden flex items-center py-2 relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#050505] to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#050505] to-transparent z-10"></div>
        <div className="animate-marquee whitespace-nowrap flex gap-8 px-4">
          {[...tickers, ...tickers, ...tickers].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono">
              <span className="text-gray-400">{item.label}:</span>
              <span className="text-white">{item.price}</span>
              <span className={`flex items-center gap-0.5 ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {item.trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Gross Merchandise Value" value={currency === 'GHS' ? 'GHS 4.2M' : '$282.8K'} change="18.4%" icon={DollarSign} highlight />
        <MetricCard title="Operating Revenue" value={currency === 'GHS' ? 'GHS 910K' : '$61.2K'} change="12.1%" icon={Activity} />
        <MetricCard title="Blended Margin" value="21.6%" change="1.2%" icon={BarChart2} />
        <MetricCard title="Net Cash Flow" value={currency === 'GHS' ? 'GHS 420K' : '$28.2K'} change="8.4%" icon={DollarSign} trend="up" />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <GlassPanel className="p-6 rounded-xl flex flex-col h-[360px]">
            <h3 className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-4">Revenue vs. Operating Expenses (YTD)</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D9A84E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D9A84E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(val) => `¢${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#D9A84E' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#D9A84E" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          {/* Cross-Vertical Synergy & Logistics */}
          <GlassPanel className="p-6 rounded-xl">
            <h3 className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-4">Cross-Vertical Logistics Synergy</h3>
            <div className="flex flex-col gap-6">
              
              <div className="relative flex items-center justify-between">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-border -translate-y-1/2 z-0">
                  <div className="h-full bg-vertical-accent w-[60%]"></div>
                </div>
                
                <div className="z-10 bg-[#050505] p-2 rounded-lg border border-surface-border text-center w-32">
                  <Sprout size={20} className="text-green-500 mx-auto mb-2" />
                  <div className="text-[10px] font-mono text-gray-400 uppercase">Farm Produce</div>
                  <div className="text-white font-medium text-sm">240 Tons</div>
                </div>

                <div className="z-10 bg-[#0a0a0a] p-3 rounded-full border-2 border-vertical-accent text-center relative shadow-[0_0_15px_rgba(217,168,78,0.2)]">
                  <Truck size={24} className="text-vertical-accent" />
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono text-gray-400">
                    AutoHub Fleet
                  </div>
                </div>

                <div className="z-10 bg-[#050505] p-2 rounded-lg border border-surface-border text-center w-32">
                  <Package size={20} className="text-blue-500 mx-auto mb-2" />
                  <div className="text-[10px] font-mono text-gray-400 uppercase">Central Market</div>
                  <div className="text-white font-medium text-sm">SLA: 94%</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-surface-border mt-4">
                 <div>
                   <div className="text-xs text-gray-500 mb-1">Fleet Utilization</div>
                   <div className="text-lg font-display text-white">82.4%</div>
                 </div>
                 <div>
                   <div className="text-xs text-gray-500 mb-1">On-Time Delivery</div>
                   <div className="text-lg font-display text-white">94.1%</div>
                 </div>
                 <div>
                   <div className="text-xs text-gray-500 mb-1">Transit Loss Rate</div>
                   <div className="text-lg font-display text-green-400">0.8% ↓</div>
                 </div>
              </div>

            </div>
          </GlassPanel>
        </div>

        {/* AI & Leaderboards Column */}
        <div className="flex flex-col gap-6">
          {/* AI Predictive Signals */}
          <GlassPanel className="p-5 rounded-xl h-[360px] flex flex-col">
            <h3 className="font-mono text-[10px] tracking-widest text-vertical-accent uppercase mb-4 flex items-center gap-2">
              <BrainCircuit size={14} /> Actionable AI Signals
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {[
                { 
                  id: 'PR-849', 
                  title: 'Fertilizer Price Drop', 
                  desc: 'Price dropped 12% in Techiman. Recommend triggering bulk buy protocol for Farmers Market Co-ops.', 
                  action: 'Trigger Buy', type: 'opportunity' 
                },
                { 
                  id: 'PR-848', 
                  title: 'Demand Spike: Toyota Parts', 
                  desc: 'High demand spike for Toyota brake pads in Kumasi. Recommend alerting top 3 parts dealers to adjust stock.', 
                  action: 'Alert Dealers', type: 'opportunity' 
                },
                { 
                  id: 'PR-847', 
                  title: 'Logistics SLA Warning', 
                  desc: 'Route congestion predicted on Accra-Kumasi highway. Re-route 12 pending produce deliveries.', 
                  action: 'Re-route Fleet', type: 'threat' 
                },
              ].map((signal, i) => (
                <div key={signal.id} className="p-3 rounded-lg bg-surface-glass border border-surface-border flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-white">{signal.title}</span>
                    <span className={`w-2 h-2 rounded-full ${signal.type === 'threat' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">{signal.desc}</p>
                  <button className={`w-full py-1.5 mt-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    signal.type === 'opportunity' 
                      ? 'bg-vertical-accent/10 text-vertical-accent hover:bg-vertical-accent/20 border border-vertical-accent/20' 
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                  }`}>
                    {signal.action}
                  </button>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* LTV & Omnichannel */}
          <GlassPanel className="p-5 rounded-xl">
            <h3 className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-4">Omni-Channel & LTV</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Cross-Vertical Retention</span>
                  <span className="text-white font-mono">42.8%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-vertical-accent rounded-full" style={{ width: '42.8%' }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-border">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase">Avg LTV</div>
                  <div className="text-sm text-white font-medium">GHS 14,250</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase">Comm Splits</div>
                  <div className="text-sm text-white font-medium">GHS 125K pending</div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Leaderboards Row */}
      <div>
        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4 border-b border-surface-border pb-2">Merchant & Operator Leaderboards</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <GlassPanel className="p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-4 text-white">
              <Wrench size={16} className="text-gray-400" />
              <h4 className="font-medium">Top Mechanics (AutoHub)</h4>
            </div>
            <div className="flex justify-between px-2.5 pb-2 text-[10px] font-mono text-gray-500 uppercase border-b border-surface-border mb-2">
              <span>Operator</span>
              <div className="flex gap-4 text-right">
                <span className="w-12">Jobs</span>
                <span className="w-8">CSAT</span>
              </div>
            </div>
            <div className="space-y-1">
              <LeaderboardRow rank={1} name="Kwame Osei" metric1="142" metric2="4.9/5" icon={Wrench} />
              <LeaderboardRow rank={2} name="Adinkra Workshop" metric1="118" metric2="4.8/5" />
              <LeaderboardRow rank={3} name="Sarah Mensah" metric1="104" metric2="4.7/5" />
              <LeaderboardRow rank={4} name="Osu Auto Repairs" metric1="95" metric2="4.6/5" />
              <LeaderboardRow rank={5} name="FixIt Garage" metric1="82" metric2="4.4/5" />
            </div>
          </GlassPanel>

          <GlassPanel className="p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-4 text-white">
              <Package size={16} className="text-gray-400" />
              <h4 className="font-medium">Top Parts Dealers (AutoHub)</h4>
            </div>
            <div className="flex justify-between px-2.5 pb-2 text-[10px] font-mono text-gray-500 uppercase border-b border-surface-border mb-2">
              <span>Dealer</span>
              <div className="flex gap-4 text-right">
                <span className="w-16">Revenue</span>
                <span className="w-8">Fulf.</span>
              </div>
            </div>
            <div className="space-y-1">
              <LeaderboardRow rank={1} name="AGL Parts Depot" metric1="¢840K" metric2="99%" />
              <LeaderboardRow rank={2} name="Kumasi Motors" metric1="¢620K" metric2="97%" />
              <LeaderboardRow rank={3} name="Genuine Spares" metric1="¢415K" metric2="98%" />
              <LeaderboardRow rank={4} name="Okaishie Auto" metric1="¢280K" metric2="94%" />
              <LeaderboardRow rank={5} name="Tech Auto" metric1="¢195K" metric2="91%" />
            </div>
          </GlassPanel>

          <GlassPanel className="p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-4 text-white">
              <Sprout size={16} className="text-gray-400" />
              <h4 className="font-medium">Top Farmers Co-ops</h4>
            </div>
            <div className="flex justify-between px-2.5 pb-2 text-[10px] font-mono text-gray-500 uppercase border-b border-surface-border mb-2">
              <span>Co-op</span>
              <div className="flex gap-4 text-right">
                <span className="w-12">Vol (T)</span>
                <span className="w-10">Yield</span>
              </div>
            </div>
            <div className="space-y-1">
              <LeaderboardRow rank={1} name="Techiman Grain" metric1="4,250" metric2="104%" />
              <LeaderboardRow rank={2} name="Akumadan Farms" metric1="3,840" metric2="98%" />
              <LeaderboardRow rank={3} name="Northern Agri" metric1="2,910" metric2="112%" />
              <LeaderboardRow rank={4} name="Sunyani Co-op" metric1="2,100" metric2="95%" />
              <LeaderboardRow rank={5} name="Volta Cashew" metric1="1,850" metric2="88%" />
            </div>
          </GlassPanel>
          
        </div>
      </div>
    </motion.div>
  );
};

