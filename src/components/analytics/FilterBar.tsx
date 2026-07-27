import React from 'react';
import { Globe, Smartphone } from 'lucide-react';
import { FilterState, Timeframe, Currency, SourceSurface } from '../../hooks/useAnalyticsFilters';

interface FilterBarProps {
  filters: FilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  allowedSources?: SourceSurface[];
}

const ALL_SOURCES: SourceSurface[] = [
  'All Sources',
  'BLKK Star Hub Website',
  'All Native Apps',
  'BLKK Autos App',
  'Merchants App',
  'Farmers App',
  'Estate App',
  'BLKK Label Admin App'
];

export const FilterBar: React.FC<FilterBarProps> = ({ filters, updateFilter, allowedSources = ALL_SOURCES }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Timeframe Filter */}
      <div className="flex items-center bg-[#0a0a0a] border border-surface-border rounded-lg p-1">
        {(['Real-time', 'Today', '7D', '30D', 'YTD'] as Timeframe[]).map(t => (
          <button 
            key={t}
            onClick={() => updateFilter('timeframe', t)}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${filters.timeframe === t ? 'bg-surface-border text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>
      
      {/* Currency Filter */}
      <div className="flex items-center bg-[#0a0a0a] border border-surface-border rounded-lg p-1">
        {(['GHS', 'USD'] as Currency[]).map(c => (
          <button 
            key={c}
            onClick={() => updateFilter('currency', c)}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${filters.currency === c ? 'bg-surface-border text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Region Filter */}
      <div className="relative">
        <select 
          value={filters.region}
          onChange={(e) => updateFilter('region', e.target.value)}
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

      {/* Source Surface Filter */}
      <div className="relative">
        <select 
          value={filters.source}
          onChange={(e) => updateFilter('source', e.target.value as SourceSurface)}
          className="appearance-none bg-[#0a0a0a] border border-surface-border text-white text-xs font-mono rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-vertical-accent"
        >
          {allowedSources.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <Smartphone size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
};
