export type EstateSourceState = 'Operational records' | 'Domain simulation';

export interface EstateEvidence {
  id: string;
  tenantId: string;
  domain: 'Property' | 'Title' | 'Viewing' | 'Inspection' | 'Offer' | 'Deposit' | 'Lease' | 'Maintenance';
  subject: string;
  detail: string;
  location: string;
  exposureGhs: number;
  state: 'Ready' | 'Watch' | 'Blocked';
  route: string;
}

export interface EstateLocationSnapshot {
  tenantId: string;
  country: string;
  city: string;
  office: string;
  portfolio: string;
  portfolioValueGhs: number;
  availableProperties: number;
  vacantRentalUnits: number;
  landPlots: number;
  maintenanceOpen: number;
  depositsHeldGhs: number;
  qualifiedDemand: number;
}

export interface EstateTenantSnapshot {
  id: string;
  name: string;
  kind: string;
  sourceState: EstateSourceState;
  countries: number;
  offices: number;
  activeProperties: number;
  availableProperties: number;
  rentalUnits: number;
  occupiedRentalUnits: number;
  landPlots: number;
  verifiedListings: number;
  titleReadyListings: number;
  qualifiedDemand: number;
  controlledOffers: number;
  viewingsDue: number;
  inspectionsDue: number;
  rentRollGhs: number;
  rentArrearsGhs: number;
  salesPipelineGhs: number;
  depositsHeldGhs: number;
  maintenanceOpen: number;
  agents: number;
  exceptions: number;
  confidence: number;
  propertyMix: Record<string, number>;
  monthlyControlledValueGhs: number[];
  locations: EstateLocationSnapshot[];
  evidence: EstateEvidence[];
}

export interface EstatePortfolioSnapshot {
  tenants: EstateTenantSnapshot[];
  activeProperties: number;
  availableProperties: number;
  rentalUnits: number;
  occupiedRentalUnits: number;
  landPlots: number;
  verifiedListings: number;
  titleReadyListings: number;
  qualifiedDemand: number;
  controlledOffers: number;
  depositsHeldGhs: number;
  rentRollGhs: number;
  rentArrearsGhs: number;
  salesPipelineGhs: number;
  maintenanceOpen: number;
  exceptions: number;
  propertyMix: Array<{ name: string; value: number }>;
  monthlyControlledValue: Array<{ month: string; value: number }>;
}

const estateOperatingRoute: Record<string, string> = {
  properties: 'property-register',
  verification: 'title-files',
  viewings: 'viewings',
  inspections: 'inspections',
  offers: 'offers',
  payments: 'deposits',
  leases: 'leases',
  maintenance: 'maintenance',
};

const routeFor = (tenantId: string, moduleId: string) => `/estate/tenant/${tenantId}/erp/${estateOperatingRoute[moduleId] ?? moduleId}`;

const tenants: EstateTenantSnapshot[] = [
  {
    id: 'prime_accra',
    name: 'Prime Accra Realty',
    kind: 'Agency, rentals, and property management',
    sourceState: 'Domain simulation',
    countries: 1,
    offices: 3,
    activeProperties: 286,
    availableProperties: 94,
    rentalUnits: 118,
    occupiedRentalUnits: 102,
    landPlots: 18,
    verifiedListings: 78,
    titleReadyListings: 71,
    qualifiedDemand: 412,
    controlledOffers: 88,
    viewingsDue: 34,
    inspectionsDue: 23,
    rentRollGhs: 1184000,
    rentArrearsGhs: 142000,
    salesPipelineGhs: 9400000,
    depositsHeldGhs: 660000,
    maintenanceOpen: 19,
    agents: 34,
    exceptions: 21,
    confidence: 91,
    propertyMix: { 'Residential sale': 76, 'Residential rental': 118, Commercial: 42, Land: 18, Development: 32 },
    monthlyControlledValueGhs: [2420000, 2680000, 2510000, 2940000, 3180000, 3470000],
    locations: [
      { tenantId: 'prime_accra', country: 'Ghana', city: 'Accra', office: 'Airport Office', portfolio: 'Airport Residential & Hills', portfolioValueGhs: 24600000, availableProperties: 34, vacantRentalUnits: 6, landPlots: 5, maintenanceOpen: 7, depositsHeldGhs: 420000, qualifiedDemand: 166 },
      { tenantId: 'prime_accra', country: 'Ghana', city: 'Accra', office: 'Cantonments Office', portfolio: 'Cantonments & Labone', portfolioValueGhs: 19800000, availableProperties: 28, vacantRentalUnits: 4, landPlots: 2, maintenanceOpen: 5, depositsHeldGhs: 180000, qualifiedDemand: 142 },
      { tenantId: 'prime_accra', country: 'Ghana', city: 'Accra', office: 'East Legon Office', portfolio: 'East Legon & Adjiringanor', portfolioValueGhs: 17400000, availableProperties: 32, vacantRentalUnits: 6, landPlots: 11, maintenanceOpen: 7, depositsHeldGhs: 60000, qualifiedDemand: 104 },
    ],
    evidence: [
      { id: 'EST-441', tenantId: 'prime_accra', domain: 'Title', subject: 'Airport Hills owner mandate', detail: 'Registry-backed mandate and owner identity review incomplete.', location: 'Accra / Airport Hills', exposureGhs: 420000, state: 'Blocked', route: routeFor('prime_accra', 'verification') },
      { id: 'EST-432', tenantId: 'prime_accra', domain: 'Viewing', subject: 'Airport Residential viewing cohort', detail: 'Nine qualified intents need confirmed owner access windows.', location: 'Accra / Airport Residential', exposureGhs: 0, state: 'Watch', route: routeFor('prime_accra', 'viewings') },
      { id: 'EST-405', tenantId: 'prime_accra', domain: 'Deposit', subject: 'Cantonments handover ER-221', detail: 'Handover evidence is complete; release approval is pending.', location: 'Accra / Cantonments', exposureGhs: 240000, state: 'Watch', route: routeFor('prime_accra', 'payments') },
      { id: 'EST-398', tenantId: 'prime_accra', domain: 'Maintenance', subject: 'Labone unit AC failure', detail: 'Occupied rental unit has exceeded the emergency response SLA.', location: 'Accra / Labone', exposureGhs: 14800, state: 'Blocked', route: routeFor('prime_accra', 'maintenance') },
    ],
  },
  {
    id: 'heritage',
    name: 'Heritage Estates',
    kind: 'Developer, land, and residential rentals',
    sourceState: 'Domain simulation',
    countries: 1,
    offices: 3,
    activeProperties: 214,
    availableProperties: 83,
    rentalUnits: 72,
    occupiedRentalUnits: 58,
    landPlots: 64,
    verifiedListings: 69,
    titleReadyListings: 57,
    qualifiedDemand: 276,
    controlledOffers: 61,
    viewingsDue: 29,
    inspectionsDue: 31,
    rentRollGhs: 684000,
    rentArrearsGhs: 96000,
    salesPipelineGhs: 12600000,
    depositsHeldGhs: 510000,
    maintenanceOpen: 14,
    agents: 26,
    exceptions: 27,
    confidence: 84,
    propertyMix: { 'Residential sale': 48, 'Residential rental': 72, Commercial: 12, Land: 64, Development: 18 },
    monthlyControlledValueGhs: [1840000, 1920000, 2170000, 2080000, 2460000, 2710000],
    locations: [
      { tenantId: 'heritage', country: 'Ghana', city: 'Kumasi', office: 'Kumasi Central', portfolio: 'Ahodwo & Nhyiaeso', portfolioValueGhs: 14800000, availableProperties: 31, vacantRentalUnits: 7, landPlots: 8, maintenanceOpen: 6, depositsHeldGhs: 160000, qualifiedDemand: 118 },
      { tenantId: 'heritage', country: 'Ghana', city: 'Kumasi', office: 'Oduom Land Desk', portfolio: 'Oduom & Ejisu Plots', portfolioValueGhs: 9200000, availableProperties: 29, vacantRentalUnits: 2, landPlots: 41, maintenanceOpen: 3, depositsHeldGhs: 270000, qualifiedDemand: 96 },
      { tenantId: 'heritage', country: 'Ghana', city: 'Cape Coast', office: 'Coastal Office', portfolio: 'Cape Coast Residential', portfolioValueGhs: 7800000, availableProperties: 23, vacantRentalUnits: 5, landPlots: 15, maintenanceOpen: 5, depositsHeldGhs: 80000, qualifiedDemand: 62 },
    ],
    evidence: [
      { id: 'EST-517', tenantId: 'heritage', domain: 'Title', subject: 'Ejisu plot cluster 14', detail: 'Survey plan references do not reconcile to the declared parcel schedule.', location: 'Kumasi / Ejisu', exposureGhs: 1180000, state: 'Blocked', route: routeFor('heritage', 'verification') },
      { id: 'EST-509', tenantId: 'heritage', domain: 'Inspection', subject: 'Ahodwo development phase B', detail: 'Seven units await snag and condition inspection before publication.', location: 'Kumasi / Ahodwo', exposureGhs: 2240000, state: 'Watch', route: routeFor('heritage', 'viewings') },
      { id: 'EST-502', tenantId: 'heritage', domain: 'Lease', subject: 'Nhyiaeso renewal cohort', detail: 'Eleven leases enter notice window without approved renewal terms.', location: 'Kumasi / Nhyiaeso', exposureGhs: 184000, state: 'Watch', route: routeFor('heritage', 'offers') },
      { id: 'EST-488', tenantId: 'heritage', domain: 'Maintenance', subject: 'Cape Coast roof remediation', detail: 'Vendor estimate exceeds landlord approval threshold.', location: 'Cape Coast', exposureGhs: 46000, state: 'Blocked', route: routeFor('heritage', 'maintenance') },
    ],
  },
  {
    id: 'lagos_habitat',
    name: 'Lagos Habitat Partners',
    kind: 'Urban rentals, commercial, and development advisory',
    sourceState: 'Domain simulation',
    countries: 1,
    offices: 2,
    activeProperties: 338,
    availableProperties: 107,
    rentalUnits: 186,
    occupiedRentalUnits: 159,
    landPlots: 22,
    verifiedListings: 91,
    titleReadyListings: 76,
    qualifiedDemand: 528,
    controlledOffers: 114,
    viewingsDue: 48,
    inspectionsDue: 37,
    rentRollGhs: 1680000,
    rentArrearsGhs: 214000,
    salesPipelineGhs: 17400000,
    depositsHeldGhs: 940000,
    maintenanceOpen: 32,
    agents: 47,
    exceptions: 34,
    confidence: 81,
    propertyMix: { 'Residential sale': 62, 'Residential rental': 186, Commercial: 48, Land: 22, Development: 20 },
    monthlyControlledValueGhs: [3260000, 3480000, 3710000, 4040000, 4380000, 4720000],
    locations: [
      { tenantId: 'lagos_habitat', country: 'Nigeria', city: 'Lagos', office: 'Island Office', portfolio: 'Lekki, Ikoyi & Victoria Island', portfolioValueGhs: 42800000, availableProperties: 62, vacantRentalUnits: 14, landPlots: 9, maintenanceOpen: 18, depositsHeldGhs: 610000, qualifiedDemand: 326 },
      { tenantId: 'lagos_habitat', country: 'Nigeria', city: 'Lagos', office: 'Mainland Office', portfolio: 'Ikeja, Yaba & Surulere', portfolioValueGhs: 28600000, availableProperties: 45, vacantRentalUnits: 13, landPlots: 13, maintenanceOpen: 14, depositsHeldGhs: 330000, qualifiedDemand: 202 },
    ],
    evidence: [
      { id: 'EST-622', tenantId: 'lagos_habitat', domain: 'Title', subject: 'Lekki development authority pack', detail: 'Development authority and encumbrance evidence need legal review.', location: 'Lagos / Lekki', exposureGhs: 2880000, state: 'Blocked', route: routeFor('lagos_habitat', 'verification') },
      { id: 'EST-614', tenantId: 'lagos_habitat', domain: 'Viewing', subject: 'Ikoyi executive rental cohort', detail: 'Thirteen confirmed viewings exceed available access windows.', location: 'Lagos / Ikoyi', exposureGhs: 0, state: 'Watch', route: routeFor('lagos_habitat', 'viewings') },
      { id: 'EST-601', tenantId: 'lagos_habitat', domain: 'Deposit', subject: 'Victoria Island deposit batch', detail: 'Five deposits await tenancy screening and agreement countersignature.', location: 'Lagos / Victoria Island', exposureGhs: 540000, state: 'Watch', route: routeFor('lagos_habitat', 'payments') },
      { id: 'EST-588', tenantId: 'lagos_habitat', domain: 'Maintenance', subject: 'Yaba lift service case', detail: 'Commercial building lift is unavailable beyond service SLA.', location: 'Lagos / Yaba', exposureGhs: 78000, state: 'Blocked', route: routeFor('lagos_habitat', 'maintenance') },
    ],
  },
];

const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

export const buildEstatePortfolio = (): EstatePortfolioSnapshot => {
  const propertyMix = new Map<string, number>();
  tenants.forEach((tenant) => Object.entries(tenant.propertyMix).forEach(([type, count]) => propertyMix.set(type, (propertyMix.get(type) ?? 0) + count)));
  return {
    tenants,
    activeProperties: tenants.reduce((total, tenant) => total + tenant.activeProperties, 0),
    availableProperties: tenants.reduce((total, tenant) => total + tenant.availableProperties, 0),
    rentalUnits: tenants.reduce((total, tenant) => total + tenant.rentalUnits, 0),
    occupiedRentalUnits: tenants.reduce((total, tenant) => total + tenant.occupiedRentalUnits, 0),
    landPlots: tenants.reduce((total, tenant) => total + tenant.landPlots, 0),
    verifiedListings: tenants.reduce((total, tenant) => total + tenant.verifiedListings, 0),
    titleReadyListings: tenants.reduce((total, tenant) => total + tenant.titleReadyListings, 0),
    qualifiedDemand: tenants.reduce((total, tenant) => total + tenant.qualifiedDemand, 0),
    controlledOffers: tenants.reduce((total, tenant) => total + tenant.controlledOffers, 0),
    depositsHeldGhs: tenants.reduce((total, tenant) => total + tenant.depositsHeldGhs, 0),
    rentRollGhs: tenants.reduce((total, tenant) => total + tenant.rentRollGhs, 0),
    rentArrearsGhs: tenants.reduce((total, tenant) => total + tenant.rentArrearsGhs, 0),
    salesPipelineGhs: tenants.reduce((total, tenant) => total + tenant.salesPipelineGhs, 0),
    maintenanceOpen: tenants.reduce((total, tenant) => total + tenant.maintenanceOpen, 0),
    exceptions: tenants.reduce((total, tenant) => total + tenant.exceptions, 0),
    propertyMix: [...propertyMix.entries()].map(([name, value]) => ({ name, value })),
    monthlyControlledValue: months.map((month, index) => ({ month, value: tenants.reduce((total, tenant) => total + tenant.monthlyControlledValueGhs[index], 0) })),
  };
};
