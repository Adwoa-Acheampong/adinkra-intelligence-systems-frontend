import { useState } from 'react';

export type Timeframe = 'Real-time' | 'Today' | '24H' | '7D' | '30D' | 'Quarter' | 'YTD' | 'Custom';
export type Currency = 'Native' | 'GHS' | 'USD' | 'EUR';
export type SourceSurface = 
  | 'All Sources'
  | 'BLKK Star Hub Website'
  | 'All Native Apps'
  | 'BLKK Autos App'
  | 'Merchants App'
  | 'Farmers App'
  | 'Estate App'
  | 'BLKK Label Admin App';

export interface FilterState {
  timeframe: Timeframe;
  currency: Currency;
  region: string;
  source: SourceSurface;
}

export const useAnalyticsFilters = (initialOverrides?: Partial<FilterState>) => {
  const [filters, setFilters] = useState<FilterState>({
    timeframe: '7D',
    currency: 'GHS',
    region: 'Global',
    source: 'All Sources',
    ...initialOverrides,
  });

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    filters,
    updateFilter,
  };
};
