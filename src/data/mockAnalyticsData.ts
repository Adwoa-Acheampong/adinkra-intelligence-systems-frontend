import { Tenant, VerticalId, SourceSurface } from '../types';

export const MOCK_TENANTS: Tenant[] = [
  { id: 'agl', name: 'Automobiles Ghana Limited (AGL)', verticalId: 'autos', type: 'dealer' },
  { id: 'kumasi_motors', name: 'Kumasi Motors', verticalId: 'autos', type: 'dealer' },
  { id: 'adinkra_motors', name: 'Adinkra Motors Workshop', verticalId: 'autos', type: 'workshop' },
  { id: 'techiman_grain', name: 'Techiman Grain Co-op', verticalId: 'farmers', type: 'coop' },
  { id: 'akumadan_farms', name: 'Akumadan Farms', verticalId: 'farmers', type: 'coop' },
  { id: 'prime_accra', name: 'Prime Accra Realty', verticalId: 'estate', type: 'agency' },
  { id: 'heritage', name: 'Heritage Estates', verticalId: 'estate', type: 'agency' },
  { id: 'techvalley', name: 'TechValley GH', verticalId: 'merchant', type: 'merchant' },
  { id: 'osu_bespoke', name: 'Osu Bespoke', verticalId: 'merchant', type: 'merchant' },
  { id: 'crushed_diamonds', name: 'Crushed Diamonds', verticalId: 'label', type: 'house' },
  { id: 'havilah', name: 'Havilah', verticalId: 'label', type: 'house' },
  { id: 'mining_gh', name: 'Ghana Mining Corp', verticalId: 'gold', type: 'miner' },
];

export const getTenantsByVertical = (verticalId: VerticalId): Tenant[] => {
  return MOCK_TENANTS.filter(t => t.verticalId === verticalId);
};

export const getTenantById = (tenantId: string): Tenant | undefined => {
  return MOCK_TENANTS.find(t => t.id === tenantId);
};

export const getMockVerticalCharts = (verticalId: VerticalId) => {
  const base = [
    { name: 'Mon', revenue: 12000, orders: 45 },
    { name: 'Tue', revenue: 19000, orders: 62 },
    { name: 'Wed', revenue: 15000, orders: 54 },
    { name: 'Thu', revenue: 22000, orders: 71 },
    { name: 'Fri', revenue: 28000, orders: 89 },
    { name: 'Sat', revenue: 35000, orders: 110 },
    { name: 'Sun', revenue: 31000, orders: 95 },
  ];

  if (verticalId === 'autos' || verticalId === 'estate') {
    return base.map(b => ({ ...b, revenue: b.revenue * 10, orders: Math.floor(b.orders / 2) }));
  }
  
  if (verticalId === 'gold') {
      return base.map(b => ({ ...b, revenue: b.revenue * 20, orders: Math.floor(b.orders / 4) }));
  }

  return base;
};

export const getMockVerticalKPIs = (verticalId: VerticalId) => {
  switch (verticalId) {
    case 'autos':
      return [
        { label: 'ACTIVE DEALERS', value: '42' },
        { label: 'GMV (7D)', value: 'GHS 4.2M' },
        { label: 'ACTIVE LISTINGS', value: '1,204' },
        { label: 'LEADS (7D)', value: '3,420' },
      ];
    case 'merchant':
      return [
        { label: 'ACTIVE STORES', value: '1,504' },
        { label: 'GMV (7D)', value: 'GHS 850K' },
        { label: 'ACTIVE SKUS', value: '45,210' },
        { label: 'ORDERS (7D)', value: '12.4K' },
      ];
    case 'estate':
      return [
        { label: 'ACTIVE AGENCIES', value: '85' },
        { label: 'GMV (7D)', value: 'GHS 12.5M' },
        { label: 'ACTIVE LISTINGS', value: '3,450' },
        { label: 'INSPECTIONS', value: '840' },
      ];
    case 'farmers':
      return [
        { label: 'CO-OPERATIVES', value: '24' },
        { label: 'GMV (7D)', value: 'GHS 320K' },
        { label: 'TONS TRADED', value: '450t' },
        { label: 'ACTIVE FARMERS', value: '8,400' },
      ];
    case 'label':
      return [
        { label: 'ACTIVE HOUSES', value: '12' },
        { label: 'GMV (7D)', value: 'GHS 1.2M' },
        { label: 'COLLECTIONS', value: '45' },
        { label: 'ORDERS (7D)', value: '3,200' },
      ];
    case 'appsWebsite':
      return [
        { label: 'MAU (HUB)', value: '1.2M' },
        { label: 'DAU (NATIVE)', value: '450K' },
        { label: 'SESSION DURATION', value: '4m 12s' },
        { label: 'CONVERSION', value: '3.4%' },
      ];
    case 'susu':
      return [
        { label: 'ACTIVE POOLS', value: '340' },
        { label: 'VOL (7D)', value: 'GHS 2.4M' },
        { label: 'WALLET BAL', value: 'GHS 8.5M' },
        { label: 'DELINQUENCY', value: '1.2%' },
      ];
    case 'gold':
      return [
        { label: 'ACTIVE MINERS', value: '14' },
        { label: 'GMV (7D)', value: 'GHS 8.4M' },
        { label: 'VAULT HOLDINGS', value: '124kg' },
        { label: 'ORDERS (7D)', value: '84' },
      ];
    case 'agents':
      return [
        { label: 'ACTIVE AGENTS', value: '450' },
        { label: 'VISITS (7D)', value: '12.4K' },
        { label: 'COMPLETION', value: '94%' },
        { label: 'COMMISSIONS', value: 'GHS 142K' },
      ];
    case 'systemConfig':
      return [
        { label: 'SYSTEM UPTIME', value: '99.99%' },
        { label: 'API ERRORS', value: '0.04%' },
        { label: 'TOTAL TENANTS', value: '2,400' },
        { label: 'AVG LATENCY', value: '142ms' },
      ];
    default:
      return [
        { label: 'ACTIVE TENANTS', value: '0' },
        { label: 'GMV (7D)', value: '0' },
        { label: 'ACTIVE LISTINGS', value: '0' },
        { label: 'CUSTOMER REACH', value: '0' },
      ];
  }
};
