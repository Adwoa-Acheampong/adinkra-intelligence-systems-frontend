import { aglErpRepository } from '../erp/agl/repository';
import type { AglOperationalRecord } from '../erp/agl/contracts';

export type AutoHubSourceState = 'Operational records' | 'Connector simulation';

export interface AutoHubEvidence {
  tenantId: string;
  moduleId: string;
  recordId: string;
  label: string;
  detail: string;
  amount?: number;
  route: string;
}

export interface AutoHubTenantSnapshot {
  id: string;
  name: string;
  kind: string;
  sourceState: AutoHubSourceState;
  countries: number;
  sites: number;
  revenue: number;
  inventoryValue: number;
  inventoryUnits: number;
  activeJobs: number;
  completedJobs: number;
  customers: number;
  vehicles: number;
  staff: number;
  exceptions: number;
  confidence: number;
  topSeller: string;
  topSellerValue: number;
  paymentMix: Record<string, number>;
  monthlyRevenue: number[];
  evidence: AutoHubEvidence[];
  siteBreakdown: AutoHubSiteSnapshot[];
}

export interface AutoHubSiteSnapshot {
  tenantId: string;
  country: string;
  city: string;
  branch: string;
  site: string;
  revenue: number;
  inventoryValue: number;
  activeJobs: number;
  sourceRecords: number;
}

export interface AutoHubPortfolioSnapshot {
  tenants: AutoHubTenantSnapshot[];
  revenue: number;
  inventoryValue: number;
  inventoryUnits: number;
  activeJobs: number;
  completedJobs: number;
  customers: number;
  vehicles: number;
  staff: number;
  exceptions: number;
  verifiedTenants: number;
  paymentMix: Array<{ name: string; value: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

const asNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const sum = (records: AglOperationalRecord[], field: string) => records.reduce(
  (total, record) => total + asNumber(record[field]),
  0,
);

const stockValue = (record: AglOperationalRecord) => asNumber(record.quantity) * asNumber(record.unitCost);

const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const evidence = (
  moduleId: string,
  record: AglOperationalRecord,
  label: string,
  detail: string,
  amount?: number,
): AutoHubEvidence => ({
  tenantId: 'agl',
  moduleId,
  recordId: record.id,
  label,
  detail,
  amount,
  route: `/autos/tenant/agl/erp/${moduleId}`,
});

const buildAglSnapshot = (): { tenant: AutoHubTenantSnapshot; sites: AutoHubSiteSnapshot[] } => {
  const sales = aglErpRepository.listAll('sales-ledger').filter((record) => record.status !== 'Voided');
  const stock = aglErpRepository.listAll('stock-ledger');
  const jobs = aglErpRepository.listAll('work-orders');
  const customers = aglErpRepository.listAll('customers');
  const vehicles = aglErpRepository.listAll('vehicles');
  const staff = aglErpRepository.listAll('employees');
  const purchaseOrders = aglErpRepository.listAll('purchase-orders');
  const complaints = aglErpRepository.listAll('complaints');
  const recalls = aglErpRepository.listAll('recalls');
  const activeJobs = jobs.filter((record) => record.status !== 'Closed');
  const exceptionStock = stock.filter((record) => ['Low stock', 'Stockout', 'Quarantined'].includes(record.status));
  const approvalQueue = purchaseOrders.filter((record) => ['Draft', 'Approval required'].includes(record.status));
  const openComplaints = complaints.filter((record) => record.status !== 'Closed');
  const openRecalls = recalls.filter((record) => record.status !== 'Completed');
  const exceptions = exceptionStock.length + approvalQueue.length + openComplaints.length + openRecalls.length;
  const inventoryValue = stock.reduce((total, record) => total + stockValue(record), 0);
  const inventoryUnits = sum(stock, 'quantity');
  const revenue = sum(sales, 'amount');
  const scopedPopulation = [...sales, ...stock, ...jobs, ...customers, ...vehicles];
  const scopedRecords = scopedPopulation.filter((record) => Boolean(record.siteId && record.branchId && record.orgCountryCode)).length;
  const confidence = scopedPopulation.length ? Math.round((scopedRecords / scopedPopulation.length) * 100) : 0;

  const sellerTotals = new Map<string, number>();
  sales.forEach((record) => {
    const key = String(record.item ?? record.name ?? 'Unclassified sale');
    sellerTotals.set(key, (sellerTotals.get(key) ?? 0) + asNumber(record.amount));
  });
  const [topSeller = 'No sales recorded', topSellerValue = 0] = [...sellerTotals.entries()]
    .sort((left, right) => right[1] - left[1])[0] ?? [];

  const paymentMix: Record<string, number> = {};
  sales.forEach((record) => {
    const method = String(record.paymentMethod ?? 'Unspecified');
    paymentMix[method] = (paymentMix[method] ?? 0) + asNumber(record.amount);
  });

  const monthlyRevenue = months.map((_, index) => sales.reduce((total, record) => {
    const date = new Date(String(record.createdAt ?? ''));
    return date.getUTCMonth() === index + 2 ? total + asNumber(record.amount) : total;
  }, 0));

  const siteKeys = new Set<string>();
  [...sales, ...stock, ...jobs].forEach((record) => {
    if (record.siteId) siteKeys.add(String(record.siteId));
  });
  const sites = [...siteKeys].map((siteId): AutoHubSiteSnapshot => {
    const siteSales = sales.filter((record) => record.siteId === siteId);
    const siteStock = stock.filter((record) => record.siteId === siteId);
    const siteJobs = jobs.filter((record) => record.siteId === siteId);
    const representative = [...siteSales, ...siteStock, ...siteJobs][0];
    return {
      tenantId: 'agl',
      country: String(representative?.orgCountry ?? 'Not assigned'),
      city: String(representative?.orgCity ?? 'Not assigned'),
      branch: String(representative?.branchName ?? 'Not assigned'),
      site: String(representative?.siteName ?? siteId),
      revenue: sum(siteSales, 'amount'),
      inventoryValue: siteStock.reduce((total, record) => total + stockValue(record), 0),
      activeJobs: siteJobs.filter((record) => record.status !== 'Closed').length,
      sourceRecords: siteSales.length + siteStock.length + siteJobs.length,
    };
  }).sort((left, right) => right.revenue - left.revenue);

  const evidenceRows: AutoHubEvidence[] = [
    ...sales.slice().sort((left, right) => asNumber(right.amount) - asNumber(left.amount)).slice(0, 4).map((record) => evidence(
      'sales-ledger',
      record,
      String(record.item ?? record.name ?? record.id),
      `${String(record.customer ?? 'Customer not recorded')} · ${String(record.siteName ?? 'Site not assigned')}`,
      asNumber(record.amount),
    )),
    ...exceptionStock.slice(0, 3).map((record) => evidence(
      'stock-ledger',
      record,
      String(record.name ?? record.sku ?? record.id),
      `${record.status} · ${String(record.siteName ?? record.location ?? 'Site not assigned')}`,
      stockValue(record),
    )),
    ...activeJobs.slice(0, 4).map((record) => evidence(
      'work-orders',
      record,
      String(record.vehicle ?? record.id),
      `${record.status} · ${String(record.mechanic ?? 'Unassigned')} · ${String(record.siteName ?? 'Site not assigned')}`,
      asNumber(record.amount),
    )),
  ];

  return {
    tenant: {
      id: 'agl',
      name: 'Automobiles Ghana Limited (AGL)',
      kind: 'Dealer and workshop network',
      sourceState: 'Operational records',
      countries: new Set(scopedPopulation.map((record) => record.orgCountryCode).filter(Boolean)).size,
      sites: sites.length,
      revenue,
      inventoryValue,
      inventoryUnits,
      activeJobs: activeJobs.length,
      completedJobs: jobs.filter((record) => record.status === 'Closed').length,
      customers: customers.length,
      vehicles: vehicles.length,
      staff: staff.filter((record) => record.status === 'Active').length,
      exceptions,
      confidence,
      topSeller,
      topSellerValue,
      paymentMix,
      monthlyRevenue,
      evidence: evidenceRows,
      siteBreakdown: sites,
    },
    sites,
  };
};

const simulatedTenants: AutoHubTenantSnapshot[] = [
  {
    id: 'kumasi_motors',
    name: 'Kumasi Motors',
    kind: 'Dealer network',
    sourceState: 'Connector simulation',
    countries: 1,
    sites: 3,
    revenue: 318400,
    inventoryValue: 2465000,
    inventoryUnits: 74,
    activeJobs: 18,
    completedJobs: 72,
    customers: 488,
    vehicles: 326,
    staff: 29,
    exceptions: 12,
    confidence: 86,
    topSeller: 'Toyota Hilux 2022',
    topSellerValue: 326000,
    paymentMix: { MoMo: 112600, Cash: 48600, 'Bank transfer': 134200, Credit: 23000 },
    monthlyRevenue: [214000, 238000, 246000, 271000, 298000, 318400],
    evidence: [],
    siteBreakdown: [
      { tenantId: 'kumasi_motors', country: 'Ghana', city: 'Kumasi', branch: 'Kumasi Motors North', site: 'Suame', revenue: 142400, inventoryValue: 1150000, activeJobs: 8, sourceRecords: 0 },
      { tenantId: 'kumasi_motors', country: 'Ghana', city: 'Kumasi', branch: 'Kumasi Motors Central', site: 'Adum', revenue: 101000, inventoryValue: 780000, activeJobs: 5, sourceRecords: 0 },
      { tenantId: 'kumasi_motors', country: 'Ghana', city: 'Kumasi', branch: 'Kumasi Motors South', site: 'Asokwa', revenue: 75000, inventoryValue: 535000, activeJobs: 5, sourceRecords: 0 },
    ],
  },
  {
    id: 'adinkra_motors',
    name: 'Adinkra Motors Workshop',
    kind: 'Workshop and parts operation',
    sourceState: 'Connector simulation',
    countries: 1,
    sites: 2,
    revenue: 196850,
    inventoryValue: 684200,
    inventoryUnits: 1260,
    activeJobs: 31,
    completedJobs: 118,
    customers: 743,
    vehicles: 612,
    staff: 42,
    exceptions: 17,
    confidence: 82,
    topSeller: 'Preventive service package',
    topSellerValue: 68400,
    paymentMix: { MoMo: 98600, Cash: 62100, POS: 19400, 'Bank transfer': 16750 },
    monthlyRevenue: [148000, 152000, 169000, 181000, 188000, 196850],
    evidence: [],
    siteBreakdown: [
      { tenantId: 'adinkra_motors', country: 'Ghana', city: 'Accra', branch: 'Adinkra Motors Accra', site: 'Spintex', revenue: 118850, inventoryValue: 402200, activeJobs: 19, sourceRecords: 0 },
      { tenantId: 'adinkra_motors', country: 'Ghana', city: 'Tema', branch: 'Adinkra Motors Tema', site: 'Community 25', revenue: 78000, inventoryValue: 282000, activeJobs: 12, sourceRecords: 0 },
    ],
  },
  {
    id: 'lagos_autoworks',
    name: 'Lagos AutoWorks',
    kind: 'Workshop, parts, and fleet service',
    sourceState: 'Connector simulation',
    countries: 1,
    sites: 2,
    revenue: 472600,
    inventoryValue: 1920000,
    inventoryUnits: 842,
    activeJobs: 27,
    completedJobs: 146,
    customers: 936,
    vehicles: 704,
    staff: 51,
    exceptions: 14,
    confidence: 79,
    topSeller: 'Fleet preventive maintenance',
    topSellerValue: 128500,
    paymentMix: { Transfer: 226400, Cash: 74600, POS: 119800, Credit: 51800 },
    monthlyRevenue: [326000, 348000, 381000, 404000, 438000, 472600],
    evidence: [],
    siteBreakdown: [
      { tenantId: 'lagos_autoworks', country: 'Nigeria', city: 'Lagos', branch: 'Lagos AutoWorks Mainland', site: 'Ikeja', revenue: 292600, inventoryValue: 1180000, activeJobs: 17, sourceRecords: 0 },
      { tenantId: 'lagos_autoworks', country: 'Nigeria', city: 'Lagos', branch: 'Lagos AutoWorks Island', site: 'Lekki', revenue: 180000, inventoryValue: 740000, activeJobs: 10, sourceRecords: 0 },
    ],
  },
];

export const buildAutoHubPortfolio = (): AutoHubPortfolioSnapshot => {
  const agl = buildAglSnapshot();
  const tenants = [agl.tenant, ...simulatedTenants];
  const paymentTotals = new Map<string, number>();
  tenants.forEach((tenant) => Object.entries(tenant.paymentMix).forEach(([method, value]) => {
    paymentTotals.set(method, (paymentTotals.get(method) ?? 0) + value);
  }));

  return {
    tenants,
    revenue: tenants.reduce((total, tenant) => total + tenant.revenue, 0),
    inventoryValue: tenants.reduce((total, tenant) => total + tenant.inventoryValue, 0),
    inventoryUnits: tenants.reduce((total, tenant) => total + tenant.inventoryUnits, 0),
    activeJobs: tenants.reduce((total, tenant) => total + tenant.activeJobs, 0),
    completedJobs: tenants.reduce((total, tenant) => total + tenant.completedJobs, 0),
    customers: tenants.reduce((total, tenant) => total + tenant.customers, 0),
    vehicles: tenants.reduce((total, tenant) => total + tenant.vehicles, 0),
    staff: tenants.reduce((total, tenant) => total + tenant.staff, 0),
    exceptions: tenants.reduce((total, tenant) => total + tenant.exceptions, 0),
    verifiedTenants: tenants.filter((tenant) => tenant.sourceState === 'Operational records').length,
    paymentMix: [...paymentTotals.entries()].map(([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value),
    monthlyRevenue: months.map((month, index) => ({
      month,
      revenue: tenants.reduce((total, tenant) => total + tenant.monthlyRevenue[index], 0),
    })),
  };
};
