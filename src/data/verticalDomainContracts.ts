import type { VerticalId } from '../types';

export type DomainVerticalId = 'merchant' | 'autos' | 'farmers' | 'label' | 'susu' | 'gold' | 'agents';
export type DomainFamily = 'tenant' | 'asset' | 'operations' | 'workflow' | 'logistics' | 'money' | 'customer' | 'workforce' | 'growth' | 'trust' | 'audit' | 'technology';
export type DomainStatus = 'Critical' | 'At risk' | 'Watch' | 'On track';

export interface DomainSeed {
  subject: string;
  segment: string;
  owner: string;
  impact: string;
  action: string;
  family: DomainFamily;
}

export interface VerticalDomainContract {
  id: DomainVerticalId;
  commandName: string;
  commandQuestion: string;
  commandDecision: string;
  asset: string;
  assets: string;
  outcome: string;
  locations: Array<{ country: string; city: string; branch: string; site: string }>;
  actors: string[];
  channels: string[];
  pipeline: string[];
  measures: [string, string, string, string];
  seeds: DomainSeed[];
  prohibited: string[];
}

export const DOMAIN_FAMILY_BY_MODULE: Record<string, DomainFamily> = {
  tenants: 'tenant', farmers: 'tenant',
  catalogue: 'asset', inventory: 'asset', vehicles: 'asset', parts: 'asset', properties: 'asset', owners: 'trust', plots: 'asset', yield: 'operations', quality: 'trust', aggregation: 'operations', collections: 'asset', design: 'operations', lots: 'asset', assay: 'trust', listings: 'asset',
  orders: 'workflow', fulfilment: 'workflow', workshops: 'operations', inspections: 'trust', 'test-drives': 'workflow', 'advisor-desk': 'customer', offers: 'workflow', viewings: 'workflow', maintenance: 'operations', production: 'operations', franchise: 'operations', pools: 'operations', assignments: 'workflow', visits: 'operations', verification: 'trust', onboarding: 'workflow',
  logistics: 'logistics', 'cold-chain': 'logistics', vault: 'trust', sync: 'technology',
  payments: 'money', payouts: 'money', procurement: 'money', financing: 'money', insurance: 'trust', 'trade-ins': 'workflow', credit: 'money', inputs: 'asset', settlement: 'money', escrow: 'money', wallets: 'money', ledger: 'money', collections_money: 'money', commissions: 'money', finance: 'money',
  customers: 'customer', support: 'customer', marketing: 'growth', workforce: 'workforce', traceability: 'audit', compliance: 'trust', risk: 'trust', quality_risk: 'trust', audit: 'audit',
};

const seed = (family: DomainFamily, subject: string, segment: string, owner: string, impact: string, action: string): DomainSeed => ({ family, subject, segment, owner, impact, action });

export const VERTICAL_DOMAIN_CONTRACTS: Record<DomainVerticalId, VerticalDomainContract> = {
  merchant: {
    id: 'merchant', commandName: 'Merchant commerce command', asset: 'SKU', assets: 'products and stock', outcome: 'fulfilled BLKK order',
    commandQuestion: 'Where are verified merchant products failing to become fulfilled, settled BLKK orders?',
    commandDecision: 'Replenish, publish, assign fulfilment, reconcile payout, or recover the customer',
    locations: [{ country: 'Ghana', city: 'Accra', branch: 'Makola Trade Branch', site: 'Ground Floor Store' }, { country: 'Ghana', city: 'Kumasi', branch: 'Kejetia Branch', site: 'Electronics Hall' }, { country: 'Nigeria', city: 'Lagos', branch: 'Balogun Branch', site: 'Textile Arcade' }],
    actors: ['Catalogue Control', 'Stock Controller', 'Order Desk', 'Fulfilment Lead', 'Merchant Finance'], channels: ['Storefront', 'BLKK Star Hub', 'WhatsApp advisor', 'Merchant app'],
    pipeline: ['Qualified demand', 'Verified product match', 'BLKK order', 'Payment secured', 'Picked and packed', 'Delivered'], measures: ['Verified GMV', 'Fulfilment SLA', 'Stock availability', 'Payout accuracy'],
    seeds: [
      seed('asset', 'Handwoven kente stole · royal blue', 'Apparel · verified craft', 'Catalogue Control', '18 qualified intents / 3 units left', 'Confirm count and publish scarcity alert'),
      seed('asset', '65-inch smart television batch TV-44', 'Electronics · fast movers', 'Stock Controller', 'GHS 186K inventory / 9 units', 'Reconcile reserved and physical quantity'),
      seed('workflow', 'BLKK order MER-24018', 'Homeware · nationwide delivery', 'Order Desk', 'GHS 12,840 customer commitment', 'Release pick list after payment confirmation'),
      seed('workflow', 'Makola multi-item fulfilment wave', 'Store pickup · 14 orders', 'Fulfilment Lead', '6 orders approaching SLA', 'Open second packing station'),
      seed('logistics', 'Tema delivery route MD-82', 'Accra · last mile', 'Dispatch Control', '11 deliveries / 2 access exceptions', 'Re-sequence route and confirm recipients'),
      seed('money', 'Merchant payout batch PAY-731', 'Settlement · MoMo and bank', 'Merchant Finance', 'GHS 94K eligible / GHS 1.2K variance', 'Resolve fee variance before release'),
      seed('customer', 'Repeat homeware buyer cohort', 'CRM · Accra', 'Customer Success', '31 customers due replenishment', 'Open advisor follow-up sequence'),
      seed('growth', 'Kente origin-story campaign', 'Instagram · diaspora audience', 'Growth Desk', '6.4× return / 42 qualified intents', 'Scale verified listings only'),
      seed('workforce', 'Kejetia fulfilment evening shift', 'Operations · capacity', 'People Operations', '82% utilization / 3 late picks', 'Move one trained packer to priority queue'),
      seed('trust', 'Vendor authenticity file V-118', 'Electronics supplier', 'Trust Control', 'GHS 210K purchasable stock', 'Renew supplier evidence before replenishment'),
      seed('audit', 'Order-to-payout evidence pack EP-302', 'Institutional audit', 'Audit Control', '44 orders / complete lineage', 'Retain and sign monthly evidence pack'),
    ],
    prohibited: ['harvest', 'maize', 'cocoa pod', 'vehicle inspection', 'gold lot', 'assay', 'title deed', 'rent roll'],
  },
  autos: {
    id: 'autos', commandName: 'Automotive command', asset: 'vehicle or part', assets: 'vehicles, parts, and service capacity', outcome: 'delivered vehicle, part, or completed service',
    commandQuestion: 'Where is verified automotive demand blocked across vehicles, parts, workshop capacity, payment, and delivery?',
    commandDecision: 'Verify, price, source, assign a mechanic, secure payment, dispatch, or release',
    locations: [{ country: 'Ghana', city: 'Accra', branch: 'AGL Accra', site: 'East Legon Workshop' }, { country: 'Ghana', city: 'Kumasi', branch: 'Kumasi Motors', site: 'Asokwa Showroom' }, { country: 'Ghana', city: 'Tema', branch: 'Adinkra Motors', site: 'Community 25 Workshop' }, { country: 'Nigeria', city: 'Lagos', branch: 'Lagos Autocare', site: 'Ikeja Service Bay' }],
    actors: ['Vehicle Control', 'Parts Verification', 'Workshop Operations', 'Inspection Desk', 'Automotive Finance'], channels: ['BLKK Autos app', 'Showroom', 'Workshop intake', 'Advisor desk'],
    pipeline: ['Qualified vehicle intent', 'Verified match', 'Inspection or diagnosis', 'Controlled order', 'Payment secured', 'Delivered or released'], measures: ['Automotive value', 'Workshop throughput', 'Verified availability', 'Promise reliability'],
    seeds: [
      seed('asset', '2022 Toyota Corolla LE · GR 4821-26', 'Vehicle · pre-owned sedan', 'Vehicle Control', 'GHS 286K listing / 14 qualified intents', 'Complete condition media and publish'),
      seed('asset', 'Genuine Toyota front brake pad set', 'Parts · Corolla fitment', 'Parts Verification', '46 intents / 18-unit shortage', 'Transfer verified stock from Accra'),
      seed('operations', 'Engine diagnosis job WO-1842', 'Workshop · bay 3', 'Workshop Operations', 'Customer promise due in 4 hr', 'Assign certified electrical technician'),
      seed('trust', 'Mercedes GLC inspection INS-218', 'Inspection · imported SUV', 'Inspection Desk', 'GHS 620K offer waiting', 'Complete chassis and diagnostic evidence'),
      seed('workflow', 'Honda Civic test drive TD-911', 'Viewing · East Legon', 'Advisor Desk', '3 qualified buyers / one vehicle', 'Confirm route and identity checks'),
      seed('workflow', 'Vehicle order AUT-8021', 'Dealer sale · Accra', 'Deal Control', 'GHS 410K controlled order', 'Issue agreement after inspection acceptance'),
      seed('logistics', 'Parts delivery route AD-76', 'Accra · workshop delivery', 'Auto Dispatch', '12 service jobs depend on delivery', 'Prioritize workshop-critical parcels'),
      seed('money', 'Vehicle escrow release ESC-322', 'Payment · handover condition', 'Automotive Finance', 'GHS 240K held', 'Validate handover proof and release'),
      seed('customer', 'SUV finance-ready buyer cohort', 'CRM · Accra', 'Automotive Advisor', '22 pre-qualified customer intents', 'Match to verified available SUVs'),
      seed('growth', 'Certified service campaign', 'Retention · owners', 'Auto Growth', '64 service bookings / 18% repeat uplift', 'Extend to overdue maintenance cohort'),
      seed('workforce', 'Senior mechanic workload', 'Workshop · skills matrix', 'Workshop Manager', '91% utilization / 7 jobs waiting', 'Rebalance diagnostics to qualified technicians'),
      seed('audit', 'Vehicle provenance evidence VP-82', 'Vehicle · ownership chain', 'Audit Control', 'GHS 510K asset claim', 'Seal source documents and inspection lineage'),
    ],
    prohibited: ['harvest', 'maize', 'cocoa pod', 'gold lot', 'assay certificate', 'title deed', 'rent roll', 'fashion drop'],
  },
  farmers: {
    id: 'farmers', commandName: 'Food supply command', asset: 'farm, crop, input, or aggregation lot', assets: 'farms, crops, inputs, and produce lots', outcome: 'graded, traceable produce delivered and farmers settled',
    commandQuestion: 'Where is food value being lost between farm evidence, harvest, grading, storage, order, delivery, and settlement?',
    commandDecision: 'Capture, grade, aggregate, store, route, sell, settle, insure, or intervene',
    locations: [{ country: 'Ghana', city: 'Techiman', branch: 'Techiman Grain Co-op', site: 'Main Aggregation Shed' }, { country: 'Ghana', city: 'Akumadan', branch: 'Akumadan Farms', site: 'Tomato Packhouse' }, { country: 'Ghana', city: 'Tamale', branch: 'Tamale Produce Union', site: 'Northern Warehouse' }],
    actors: ['Field Agent', 'Aggregation Control', 'Quality Grader', 'Cold-chain Desk', 'Farmer Settlement'], channels: ['Farm agent app', 'Aggregation centre', 'BLKK Farmers market', 'Institutional order'],
    pipeline: ['Expected harvest', 'Harvest captured', 'Grade accepted', 'Aggregation lot formed', 'Order allocated', 'Delivered and settled'], measures: ['Marketable tonnes', 'Post-harvest loss', 'Farmer settlement', 'Traceability coverage'],
    seeds: [
      seed('tenant', 'Techiman maize producer cohort', 'Co-op · 184 farmers', 'Co-op Control', '612 ha declared / 92% identity complete', 'Resolve 14 membership evidence gaps'),
      seed('asset', 'Maize plot cluster TM-44', 'Farm plots · Techiman', 'Field Evidence', '86 ha / harvest due in 9 days', 'Complete GPS boundary validation'),
      seed('operations', 'Maize harvest lot H-882', 'Harvest · yellow maize', 'Aggregation Control', '31.6 t awaiting grade', 'Add second grader for peak window'),
      seed('trust', 'Aflatoxin test batch Q-228', 'Quality · maize', 'Quality Grader', '18.4 t held from allocation', 'Complete retest and release decision'),
      seed('operations', 'Tomato aggregation lot AG-119', 'Fresh produce · Akumadan', 'Aggregation Control', '12.8 t / 6 farmer owners', 'Reconcile weights and custody shares'),
      seed('asset', 'NPK 15:15:15 input stock', 'Inputs · Techiman', 'Input Store', 'GHS 84K ageing / 112 bags', 'Re-grade and allocate before expiry'),
      seed('logistics', 'Tomato cold-chain route CC-71', 'Akumadan to Accra', 'Cold-chain Desk', '8.2 t / temperature excursion risk', 'Move departure forward 90 minutes'),
      seed('workflow', 'School feeding maize order FM-420', 'Institutional buyer', 'Order Control', '54 t contracted / 41 t allocated', 'Source verified balance from Tamale'),
      seed('money', 'Farmer settlement batch FS-210', '184 farmer shares', 'Farmer Settlement', 'GHS 318K payable', 'Resolve six mobile-money account exceptions'),
      seed('money', 'Seasonal input credit cohort', 'Credit · maize farmers', 'Rural Finance', 'GHS 126K outstanding', 'Apply delivery proceeds to due balances'),
      seed('workforce', 'Bono East harvest capture shift', 'Field operations', 'Agent Manager', '41 farms awaiting evidence', 'Open surge shift and offline capture pack'),
      seed('audit', 'Farm-to-order trace pack TR-602', 'Food security evidence', 'Traceability Control', '112.4 t represented', 'Publish buyer and regulator evidence pack'),
    ],
    prohibited: ['brake pad', 'vehicle listing', 'vehicle workshop', 'gold lot', 'assay', 'title deed', 'rent roll', 'fashion collection'],
  },
  label: {
    id: 'label', commandName: 'Fashion house command', asset: 'design, material, style, or finished garment', assets: 'collections, designs, materials, and finished goods', outcome: 'approved collection sold and fulfilled',
    commandQuestion: 'Where is collection value blocked between design, sampling, production, quality, launch, order, and fulfilment?',
    commandDecision: 'Approve, revise, schedule, source, release, publish, allocate, or replenish',
    locations: [{ country: 'Ghana', city: 'Accra', branch: 'Crushed Diamonds Studio', site: 'Osu Atelier' }, { country: 'Ghana', city: 'Accra', branch: 'Havilah House', site: 'East Legon Studio' }, { country: 'Ghana', city: 'Koforidua', branch: 'Kente Collective', site: 'Weaving Centre' }],
    actors: ['Creative Director', 'Sampling Lead', 'Production Control', 'Quality Release', 'Collection Finance'], channels: ['House showroom', 'BLKK Label app', 'Wholesale desk', 'Creator campaign'],
    pipeline: ['Approved concept', 'Sample signed off', 'Production released', 'Quality passed', 'Drop published', 'Order fulfilled'], measures: ['Collection value', 'Sell-through', 'First-pass quality', 'On-time drop release'],
    seeds: [
      seed('asset', 'Heritage Loom collection · drop 06', 'Collection · occasion wear', 'Creative Director', 'GHS 420K planned drop value', 'Approve remaining two commercial styles'),
      seed('operations', 'Kente jacket sample ST-118', 'Sampling · menswear', 'Sampling Lead', 'Launch gate due in 18 hr', 'Resolve sleeve specification revision'),
      seed('operations', 'Drop 06 production order PO-441', 'Production · 186 units', 'Production Control', '82% complete / 14 units blocked', 'Add finishing capacity to critical sizes'),
      seed('trust', 'Finished-goods quality release QR-82', 'Quality · drop 06', 'Quality Release', 'GHS 118K inventory blocked', 'Resolve size-spec rework and re-inspect'),
      seed('asset', 'Handwoven kente inventory KI-72', 'Material · woven cloth', 'Materials Control', '32 yards reserved / 8 yards free', 'Confirm loom replenishment date'),
      seed('workflow', 'Wholesale order LAB-220', 'Retail partner · Lagos', 'Order Control', '64 garments / GHS 96K', 'Allocate passed sizes and split backorder'),
      seed('logistics', 'Studio-to-store movement MV-41', 'Osu to Airport store', 'Fashion Logistics', '42 launch units due before 17:00', 'Dispatch after quality seal scan'),
      seed('operations', 'Kumasi franchise standards review', 'Franchise · retail', 'Franchise Control', '3 visual-merchandising breaches', 'Issue correction plan before campaign'),
      seed('money', 'House payout and royalty batch', 'Settlement · drop 06', 'Collection Finance', 'GHS 74K payable', 'Reconcile returns before royalty release'),
      seed('customer', 'Made-to-measure client cohort', 'CRM · occasion wear', 'Client Experience', '18 fittings due this week', 'Confirm measurements and appointment windows'),
      seed('growth', 'Drop 06 creator launch', 'Campaign · Instagram and TikTok', 'Campaign Desk', '4.8× attributed return', 'Shift spend to sold-size availability'),
      seed('workforce', 'Finishing team capacity', 'Production · evening shift', 'People Operations', '94% utilization / overtime rising', 'Move trained maker from sampling support'),
      seed('audit', 'Design-to-sale approval pack', 'Collection governance', 'Audit Control', '18 styles / 186 units', 'Seal design, sample, production, and sale lineage'),
    ],
    prohibited: ['harvest', 'maize', 'fertiliser', 'brake pad', 'vehicle inspection', 'gold lot', 'assay', 'title deed', 'rent roll'],
  },
  susu: {
    id: 'susu', commandName: 'Susu rail command', asset: 'wallet, contribution, pool, or settlement', assets: 'wallets, contributions, pools, and safeguarded funds', outcome: 'reconciled contribution and authorized settlement',
    commandQuestion: 'Where is money or trust blocked across wallet funding, contribution, pool obligation, escrow, settlement, and reconciliation?',
    commandDecision: 'Authorize, hold, restrict, reconcile, collect, settle, refund, or investigate',
    locations: [{ country: 'Ghana', city: 'Accra', branch: 'Accra Susu Union', site: 'Makola Collection Desk' }, { country: 'Ghana', city: 'Kumasi', branch: 'Kumasi Market Network', site: 'Kejetia Collection Desk' }, { country: 'Nigeria', city: 'Lagos', branch: 'Lagos Trader Circle', site: 'Balogun Collection Desk' }],
    actors: ['Wallet Operations', 'Pool Administrator', 'Settlement Control', 'Risk Review', 'Treasury Control'], channels: ['MTN MoMo', 'Telecel Cash', 'Bank transfer', 'Authorized collector'],
    pipeline: ['Contribution due', 'Payment initiated', 'Callback verified', 'Ledger posted', 'Pool obligation met', 'Settlement released'], measures: ['Safeguarded balance', 'Contribution completion', 'Settlement accuracy', 'Delinquency'],
    seeds: [
      seed('money', 'Trader wallet WAL-8802', 'Wallet · Makola', 'Wallet Operations', 'GHS 82K balance / GHS 12K held', 'Resolve identity-limit review'),
      seed('money', 'MTN callback batch CB-726B', 'Payment orchestration', 'Rail Reconciliation', 'GHS 92K unmatched callbacks', 'Reconcile provider references'),
      seed('money', 'Market pool SP-118 cycle 14', 'Susu pool · 42 members', 'Pool Administrator', '4 contributions overdue', 'Open compliant reminder and grace workflow'),
      seed('money', 'Escrow condition ESC-410', 'Trade order hold', 'Escrow Control', 'GHS 240K held', 'Validate delivery condition before release'),
      seed('money', 'Merchant settlement ST-731', 'Settlement · MoMo', 'Settlement Control', 'GHS 318K payable / GHS 840 variance', 'Resolve fee variance and sign batch'),
      seed('trust', 'Wallet velocity anomaly RV-44', 'Risk · account cluster', 'Risk Review', '17 linked transactions / GHS 61K', 'Restrict outbound settlement pending review'),
      seed('trust', 'Pool member KYC cohort', 'Compliance · Kejetia', 'Compliance Desk', '11 expired identity documents', 'Request refreshed identity evidence'),
      seed('money', 'Safeguarding bank reconciliation', 'Treasury · daily close', 'Treasury Control', 'GHS 8.5M protected balance', 'Resolve GHS 3.2K timing difference'),
      seed('audit', 'Contribution-to-settlement pack', 'Regulatory evidence', 'Audit Control', '18,420 ledger events', 'Sign daily control and retain evidence'),
      seed('workforce', 'Authorized collector route load', 'Field collection · Accra', 'Collections Manager', '28 stops / 3 receipt exceptions', 'Reassign late route and reconcile custody'),
    ],
    prohibited: ['harvest', 'maize', 'brake pad', 'vehicle', 'gold lot', 'assay', 'title deed', 'rent roll', 'fashion drop'],
  },
  gold: {
    id: 'gold', commandName: 'Precious metals command', asset: 'controlled metal lot', assets: 'licensed metal lots and custody balances', outcome: 'verified, traceable lot settled to an authorized buyer',
    commandQuestion: 'Where is a licensed precious-metal lot blocked across provenance, assay, custody, order, logistics, compliance, and settlement?',
    commandDecision: 'Accept, assay, quarantine, vault, allocate, dispatch, settle, or report',
    locations: [{ country: 'Ghana', city: 'Accra', branch: 'Accra Bullion Desk', site: 'Airport Vault' }, { country: 'Ghana', city: 'Obuasi', branch: 'Ashanti Bullion Cooperative', site: 'Obuasi Intake' }, { country: 'Ghana', city: 'Tarkwa', branch: 'Tarkwa Mining Union', site: 'Tarkwa Assay Room' }],
    actors: ['Licensed Intake', 'Assay Control', 'Vault Custody', 'Secure Logistics', 'Metals Compliance'], channels: ['Licensed dealer desk', 'Institutional order', 'Secure intake', 'Bank settlement'],
    pipeline: ['Licensed lot intake', 'Provenance accepted', 'Assay certified', 'Vault custody', 'Buyer allocation', 'Secure delivery and settlement'], measures: ['Controlled weight', 'Assay variance', 'Custody integrity', 'Settlement exposure'],
    seeds: [
      seed('asset', 'Gold doré lot GL-204', 'Lot · Obuasi intake', 'Licensed Intake', '8.42 kg declared weight', 'Complete producer and licence validation'),
      seed('trust', 'Assay certificate AS-881', 'Purity · lot GL-204', 'Assay Control', '91.8% purity / 0.7 pp variance', 'Run referee assay before acceptance'),
      seed('trust', 'Vault custody balance VB-72', 'Airport Vault · cage 4', 'Vault Custody', '31.6 kg controlled holdings', 'Reconcile dual-control physical count'),
      seed('workflow', 'Institutional order GO-118', 'Buyer · refinery allocation', 'Order Control', '12.4 kg / GHS 11.8M', 'Allocate accepted lots by purity band'),
      seed('logistics', 'Secure movement SM-44', 'Tarkwa to Airport Vault', 'Secure Logistics', '4.8 kg in controlled transit', 'Confirm handoff media and seal identity'),
      seed('money', 'Lot settlement GS-731', 'Bank settlement · GL-188', 'Metals Finance', 'GHS 4.2M payable', 'Release after buyer receipt and assay acceptance'),
      seed('trust', 'Dealer licence DL-82 renewal', 'Compliance · counterparty', 'Metals Compliance', '3 lots / 18.2 kg restricted', 'Validate regulator renewal before trading'),
      seed('audit', 'Mine-to-vault trace pack TP-118', 'Provenance evidence', 'Audit Control', '6 custody handoffs represented', 'Seal identity, assay, custody, and settlement lineage'),
      seed('workforce', 'Assay room qualified capacity', 'Tarkwa · day shift', 'Laboratory Manager', '9 lots waiting / two assayers', 'Prioritize high-exposure lots'),
    ],
    prohibited: ['harvest', 'maize', 'fertiliser', 'brake pad', 'vehicle listing', 'vehicle workshop', 'title deed', 'rent roll', 'fashion collection'],
  },
  agents: {
    id: 'agents', commandName: 'Field network command', asset: 'assignment or captured evidence', assets: 'assignments, visits, listings, and verified field evidence', outcome: 'accepted field outcome with attributable evidence',
    commandQuestion: 'Where is assigned field work blocked between dispatch, arrival, capture, review, acceptance, and commission?',
    commandDecision: 'Assign, route, support, review, accept, reject, retrain, sync, or pay',
    locations: [{ country: 'Ghana', city: 'Accra', branch: 'Greater Accra Network', site: 'Central Dispatch' }, { country: 'Ghana', city: 'Kumasi', branch: 'Ashanti Trade Desk', site: 'Kejetia Field Cell' }, { country: 'Ghana', city: 'Techiman', branch: 'Techiman Verification Unit', site: 'Market Field Cell' }],
    actors: ['Dispatch Control', 'Field Agent', 'Verification Review', 'Sync Operations', 'Commission Control'], channels: ['Agent mobile app', 'Offline capture', 'Supervisor desk', 'Assignment API'],
    pipeline: ['Assignment issued', 'Agent accepted', 'Site visited', 'Evidence submitted', 'Review passed', 'Commission approved'], measures: ['Accepted assignments', 'Evidence quality', 'First-pass acceptance', 'Commission due'],
    seeds: [
      seed('workflow', 'Merchant inventory capture ASG-881', 'Assignment · Makola', 'Dispatch Control', '84 SKUs / due in 3 hr', 'Assign trained catalogue agent'),
      seed('operations', 'Storefront verification visit FV-204', 'Field visit · Kejetia', 'Field Agent', 'GPS arrival / 18 evidence fields', 'Complete owner identity interview'),
      seed('trust', 'Listing evidence review VR-118', 'Verification · property media', 'Verification Review', '12 submissions awaiting decision', 'Batch reviewer allocation'),
      seed('asset', 'Parts catalogue capture LC-72', 'Listing · Abossey Okai', 'Capture Quality', '46 fitment records / 8 evidence gaps', 'Return incomplete records to agent'),
      seed('workflow', 'Trader onboarding case ON-441', 'Onboarding · Makola', 'Onboarding Review', 'Business identity and storefront proof', 'Approve after owner match'),
      seed('money', 'Cash collection route CR-82', 'Collections · Techiman', 'Custody Control', 'GHS 18.4K / 11 receipts', 'Reconcile receipt sequence before handoff'),
      seed('money', 'Accepted-work commission CM-731', 'Commissions · weekly batch', 'Commission Control', 'GHS 42K payable', 'Resolve three rejected-task adjustments'),
      seed('technology', 'Offline payload sync SY-218', 'Device · northern route', 'Sync Operations', '118 records / 9 retries', 'Resume chunk upload on stable network'),
      seed('trust', 'Duplicate storefront cluster QR-44', 'Quality · identity resolution', 'Quality Control', '7 records / one real entity', 'Merge duplicates and coach capture team'),
      seed('workforce', 'Agent certification cohort TR-92', 'Training · asset verification', 'People Operations', '24 agents / 6 assessments due', 'Schedule observed field assessment'),
      seed('audit', 'Assignment-to-commission pack AU-118', 'Field evidence audit', 'Audit Control', '312 accepted tasks', 'Seal assignment, GPS, evidence, review, and payout lineage'),
    ],
    prohibited: ['harvest lot', 'maize stock', 'brake pad stock', 'vehicle workshop', 'gold lot', 'assay', 'title deed', 'rent roll', 'fashion drop'],
  },
};

export const isDomainVertical = (verticalId: VerticalId): verticalId is DomainVerticalId => verticalId in VERTICAL_DOMAIN_CONTRACTS;

export const familyForModule = (moduleId: string): DomainFamily => {
  if (moduleId === 'quality') return 'trust';
  return DOMAIN_FAMILY_BY_MODULE[moduleId] ?? 'operations';
};

export const domainSeedsForModule = (verticalId: DomainVerticalId, moduleId: string) => {
  const contract = VERTICAL_DOMAIN_CONTRACTS[verticalId];
  const family = verticalId === 'label' && moduleId === 'collections' ? 'asset' : familyForModule(moduleId);
  const exact = contract.seeds.filter((item) => item.family === family);
  const adjacentFamilies: Record<DomainFamily, DomainFamily[]> = {
    tenant: ['workforce', 'audit'], asset: ['trust', 'operations'], operations: ['workflow', 'asset'], workflow: ['customer', 'operations'], logistics: ['workflow', 'trust'], money: ['audit', 'workflow'], customer: ['growth', 'workflow'], workforce: ['operations', 'audit'], growth: ['customer', 'asset'], trust: ['audit', 'asset'], audit: ['trust', 'operations'], technology: ['audit', 'operations'],
  };
  return [...exact, ...contract.seeds.filter((item) => adjacentFamilies[family].includes(item.family))].slice(0, 8);
};
