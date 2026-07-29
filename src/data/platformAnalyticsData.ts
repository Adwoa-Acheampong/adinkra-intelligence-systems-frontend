export interface WebsiteRouteMetric {
  id: string;
  route: string;
  surface: string;
  vertical: string;
  sessions: number;
  conversion: number;
  exit: number;
  lcp: number;
  errorRate: number;
  zeroResult: number;
  owner: string;
}

export interface AppScreenMetric {
  id: string;
  screen: string;
  workflow: string;
  views: number;
  completion: number;
  medianMs: number;
  errorRate: number;
  offlinePending: number;
}

export interface NativeAppMetric {
  id: string;
  name: string;
  shortName: string;
  purpose: string;
  accent: string;
  version: string;
  mau: number;
  dau: number;
  crashFree: number;
  apiMs: number;
  syncBacklog: number;
  releaseAdoption: number;
  screens: AppScreenMetric[];
  funnel: Array<{ step: string; users: number }>;
}

export const WEBSITE_ROUTES: WebsiteRouteMetric[] = [
  { id: 'hub-home', route: '/', surface: 'Hub home', vertical: 'Cross-platform', sessions: 182420, conversion: 4.8, exit: 22.1, lcp: 1.18, errorRate: 0.08, zeroResult: 0, owner: 'Growth' },
  { id: 'unified-search', route: '/search', surface: 'Unified search', vertical: 'Cross-platform', sessions: 96420, conversion: 7.1, exit: 16.8, lcp: 1.42, errorRate: 0.16, zeroResult: 8.4, owner: 'Discovery' },
  { id: 'autos-listings', route: '/autos', surface: 'Vehicle discovery', vertical: 'Autos', sessions: 81762, conversion: 5.9, exit: 18.4, lcp: 1.36, errorRate: 0.11, zeroResult: 2.7, owner: 'Autos' },
  { id: 'vehicle-detail', route: '/autos/vehicles/:id', surface: 'Vehicle detail', vertical: 'Autos', sessions: 59420, conversion: 8.8, exit: 14.2, lcp: 1.61, errorRate: 0.18, zeroResult: 0, owner: 'Autos' },
  { id: 'parts-catalog', route: '/autos/parts', surface: 'Parts catalogue', vertical: 'Autos', sessions: 42988, conversion: 6.7, exit: 20.1, lcp: 1.29, errorRate: 0.12, zeroResult: 6.2, owner: 'Parts' },
  { id: 'merchant-market', route: '/marketplace', surface: 'Merchant marketplace', vertical: 'Merchants', sessions: 76830, conversion: 4.4, exit: 24.8, lcp: 1.47, errorRate: 0.13, zeroResult: 3.4, owner: 'Merchants' },
  { id: 'merchant-store', route: '/stores/:slug', surface: 'Verified store', vertical: 'Merchants', sessions: 48290, conversion: 6.2, exit: 17.5, lcp: 1.22, errorRate: 0.09, zeroResult: 0, owner: 'Merchants' },
  { id: 'farmers-market', route: '/farmers', surface: 'Farmers market', vertical: 'Farmers', sessions: 33840, conversion: 5.1, exit: 21.6, lcp: 1.32, errorRate: 0.1, zeroResult: 4.6, owner: 'Farmers' },
  { id: 'estate-search', route: '/estate', surface: 'Property search', vertical: 'Estate', sessions: 46518, conversion: 4.9, exit: 19.2, lcp: 1.74, errorRate: 0.21, zeroResult: 5.8, owner: 'Estate' },
  { id: 'label-shop', route: '/label/shop', surface: 'Label collections', vertical: 'BLKK Label', sessions: 29182, conversion: 3.8, exit: 27.4, lcp: 1.28, errorRate: 0.08, zeroResult: 1.2, owner: 'Label' },
  { id: 'checkout', route: '/checkout', surface: 'BLKK checkout', vertical: 'Cross-platform', sessions: 22540, conversion: 68.4, exit: 18.7, lcp: 1.08, errorRate: 0.34, zeroResult: 0, owner: 'Commerce' },
  { id: 'momo-payment', route: '/checkout/payment', surface: 'MoMo payment', vertical: 'Susu Rail', sessions: 18302, conversion: 78.1, exit: 11.6, lcp: 0.94, errorRate: 0.61, zeroResult: 0, owner: 'Payments' },
  { id: 'orders', route: '/account/orders', surface: 'My orders', vertical: 'Cross-platform', sessions: 31284, conversion: 21.2, exit: 12.8, lcp: 1.04, errorRate: 0.09, zeroResult: 0, owner: 'Commerce' },
  { id: 'order-tracking', route: '/account/orders/:id/track', surface: 'Blkk Delivery tracking', vertical: 'Logistics', sessions: 24666, conversion: 34.5, exit: 9.4, lcp: 1.52, errorRate: 0.27, zeroResult: 0, owner: 'Logistics' },
  { id: 'advisor-thread', route: '/account/advisor/:threadId', surface: 'BLKK advisor thread', vertical: 'Cross-platform', sessions: 12480, conversion: 42.7, exit: 8.2, lcp: 0.88, errorRate: 0.06, zeroResult: 0, owner: 'CRM' },
  { id: 'franchise-apply', route: '/franchise/apply', surface: 'Franchise application', vertical: 'Agents', sessions: 8622, conversion: 12.4, exit: 31.5, lcp: 1.12, errorRate: 0.14, zeroResult: 0, owner: 'Expansion' },
];

export const WEBSITE_FUNNEL = [
  { step: 'Qualified discovery session', users: 118420 },
  { step: 'Verified asset / product viewed', users: 76380 },
  { step: 'BLKK enquiry, bid or secure action', users: 22640 },
  { step: 'BLKK-generated order', users: 11920 },
  { step: 'Checkout details completed', users: 9148 },
  { step: 'Escrow / payment authorised', users: 7142 },
  { step: 'BLKK fulfilment confirmed', users: 6644 },
];

export const NATIVE_APPS: NativeAppMetric[] = [
  {
    id: 'blkk-autos',
    name: 'BLKK Autos',
    shortName: 'Autos',
    purpose: 'Buyer discovery, advisor-led deal flow, parts, mechanics and Blkk Delivery tracking.',
    accent: '#22d3ee',
    version: '6.8.2',
    mau: 148200,
    dau: 46320,
    crashFree: 99.82,
    apiMs: 138,
    syncBacklog: 84,
    releaseAdoption: 78,
    screens: [
      { id: 'autos-discover', screen: 'Discover', workflow: 'Vehicle discovery', views: 268420, completion: 72.4, medianMs: 820, errorRate: 0.11, offlinePending: 0 },
      { id: 'autos-detail', screen: 'Vehicle detail', workflow: 'Verified asset review', views: 184240, completion: 58.8, medianMs: 980, errorRate: 0.16, offlinePending: 0 },
      { id: 'autos-enquiry', screen: 'Enquire / bid', workflow: 'BLKK advisor intake', views: 42180, completion: 67.1, medianMs: 720, errorRate: 0.08, offlinePending: 12 },
      { id: 'autos-checkout', screen: 'Checkout', workflow: 'Order + MoMo', views: 18120, completion: 71.4, medianMs: 1040, errorRate: 0.38, offlinePending: 3 },
      { id: 'autos-track', screen: 'My orders', workflow: 'Blkk Delivery tracking', views: 28420, completion: 88.2, medianMs: 640, errorRate: 0.12, offlinePending: 18 },
    ],
    funnel: [{ step: 'Search', users: 94820 }, { step: 'Detail', users: 64820 }, { step: 'BLKK enquiry', users: 22180 }, { step: 'Order created', users: 8910 }, { step: 'Paid', users: 6418 }],
  },
  {
    id: 'merchants',
    name: 'BLKK Merchants',
    shortName: 'Merchants',
    purpose: 'Agent-assisted catalogue, inventory, order preparation and platform payout operations.',
    accent: '#ef4444',
    version: '5.4.0',
    mau: 172800,
    dau: 58240,
    crashFree: 99.74,
    apiMs: 146,
    syncBacklog: 318,
    releaseAdoption: 64,
    screens: [
      { id: 'merchant-home', screen: 'Business home', workflow: 'Daily operations', views: 312800, completion: 84.2, medianMs: 760, errorRate: 0.09, offlinePending: 12 },
      { id: 'catalog-capture', screen: 'Catalogue capture', workflow: 'SKU digitisation', views: 88420, completion: 62.4, medianMs: 1190, errorRate: 0.22, offlinePending: 184 },
      { id: 'stock-count', screen: 'Stock count', workflow: 'Inventory control', views: 66480, completion: 74.8, medianMs: 940, errorRate: 0.18, offlinePending: 96 },
      { id: 'merchant-orders', screen: 'BLKK orders', workflow: 'Pick · pack · handoff', views: 52180, completion: 86.1, medianMs: 680, errorRate: 0.1, offlinePending: 21 },
      { id: 'merchant-payouts', screen: 'Payouts', workflow: 'Platform settlement', views: 31840, completion: 91.2, medianMs: 560, errorRate: 0.07, offlinePending: 5 },
    ],
    funnel: [{ step: 'Stock captured', users: 68240 }, { step: 'Quality accepted', users: 58180 }, { step: 'Published by BLKK', users: 52740 }, { step: 'Order accepted', users: 28120 }, { step: 'Fulfilled', users: 24680 }],
  },
  {
    id: 'farmers',
    name: 'BLKK Farmers',
    shortName: 'Farmers',
    purpose: 'Offline-first farm visits, yield capture, aggregation, orders and logistics evidence.',
    accent: '#bef264',
    version: '4.9.1',
    mau: 86400,
    dau: 24860,
    crashFree: 99.68,
    apiMs: 184,
    syncBacklog: 824,
    releaseAdoption: 58,
    screens: [
      { id: 'farmer-roster', screen: 'Farmer roster', workflow: 'Identity + relationships', views: 142240, completion: 82.1, medianMs: 780, errorRate: 0.12, offlinePending: 88 },
      { id: 'plot-survey', screen: 'Plot survey', workflow: 'GPS plot capture', views: 68420, completion: 69.8, medianMs: 1320, errorRate: 0.31, offlinePending: 382 },
      { id: 'yield-capture', screen: 'Yield capture', workflow: 'Harvest evidence', views: 52180, completion: 73.4, medianMs: 1180, errorRate: 0.24, offlinePending: 246 },
      { id: 'aggregation', screen: 'Aggregation lot', workflow: 'Batch + grade', views: 36420, completion: 78.2, medianMs: 960, errorRate: 0.18, offlinePending: 91 },
      { id: 'farm-logistics', screen: 'Pickup handoff', workflow: 'Blkk fulfilment', views: 18140, completion: 89.1, medianMs: 740, errorRate: 0.1, offlinePending: 17 },
    ],
    funnel: [{ step: 'Farm visited', users: 38240 }, { step: 'Yield captured', users: 30680 }, { step: 'Quality accepted', users: 27240 }, { step: 'Lot aggregated', users: 18280 }, { step: 'BLKK order fulfilled', users: 12160 }],
  },
  {
    id: 'estate',
    name: 'BLKK Estate',
    shortName: 'Estate',
    purpose: 'Verified property discovery, BLKK-managed enquiries, inspections and document workflows.',
    accent: '#10b981',
    version: '3.7.4',
    mau: 72800,
    dau: 19420,
    crashFree: 99.88,
    apiMs: 132,
    syncBacklog: 42,
    releaseAdoption: 82,
    screens: [
      { id: 'estate-search', screen: 'Property search', workflow: 'Discovery', views: 128420, completion: 76.4, medianMs: 720, errorRate: 0.08, offlinePending: 0 },
      { id: 'estate-detail', screen: 'Property detail', workflow: 'Verification review', views: 96240, completion: 61.2, medianMs: 880, errorRate: 0.12, offlinePending: 0 },
      { id: 'inspection-booking', screen: 'Book inspection', workflow: 'BLKK appointment', views: 24180, completion: 72.8, medianMs: 640, errorRate: 0.09, offlinePending: 5 },
      { id: 'inspection-report', screen: 'Inspection report', workflow: 'Evidence + issues', views: 16840, completion: 88.4, medianMs: 820, errorRate: 0.07, offlinePending: 28 },
      { id: 'estate-documents', screen: 'Documents', workflow: 'Document control', views: 11280, completion: 92.1, medianMs: 610, errorRate: 0.05, offlinePending: 9 },
    ],
    funnel: [{ step: 'Search', users: 58420 }, { step: 'Property detail', users: 39180 }, { step: 'BLKK enquiry', users: 14240 }, { step: 'Inspection', users: 7280 }, { step: 'Verified offer', users: 2860 }],
  },
  {
    id: 'label-admin',
    name: 'BLKK Label Admin',
    shortName: 'Label Admin',
    purpose: 'Restricted house operations, collections, approval control, fulfilment and franchise oversight.',
    accent: '#ff5e9c',
    version: '2.6.0',
    mau: 9800,
    dau: 3120,
    crashFree: 99.94,
    apiMs: 118,
    syncBacklog: 12,
    releaseAdoption: 91,
    screens: [
      { id: 'label-command', screen: 'House command', workflow: 'Operations pulse', views: 28640, completion: 91.2, medianMs: 610, errorRate: 0.04, offlinePending: 0 },
      { id: 'collection-approval', screen: 'Collection approval', workflow: 'Four-eye approval', views: 12180, completion: 86.8, medianMs: 740, errorRate: 0.06, offlinePending: 2 },
      { id: 'production-board', screen: 'Production board', workflow: 'Design to production', views: 18420, completion: 82.4, medianMs: 690, errorRate: 0.08, offlinePending: 4 },
      { id: 'label-orders', screen: 'Orders', workflow: 'BLKK fulfilment', views: 22480, completion: 93.1, medianMs: 520, errorRate: 0.03, offlinePending: 3 },
      { id: 'franchise-oversight', screen: 'Franchise oversight', workflow: 'Compliance + performance', views: 8640, completion: 88.2, medianMs: 660, errorRate: 0.05, offlinePending: 3 },
    ],
    funnel: [{ step: 'Design submitted', users: 4280 }, { step: 'Approved', users: 3640 }, { step: 'Production ready', users: 3280 }, { step: 'Published by BLKK', users: 2980 }, { step: 'Order fulfilled', users: 2140 }],
  },
];

export const getWebsiteRoute = (id: string) => WEBSITE_ROUTES.find((item) => item.id === id);
export const getNativeApp = (id: string) => NATIVE_APPS.find((item) => item.id === id);

