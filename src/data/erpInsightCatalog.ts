import type { ERPWorkspaceDefinition } from '../config/erpWorkspaces';
import type { Tenant, VerticalId } from '../types';

export type InsightFamily =
  | 'portfolio'
  | 'commerce'
  | 'inventory'
  | 'logistics'
  | 'finance'
  | 'workforce'
  | 'risk'
  | 'product'
  | 'operations';

export interface InsightMetric {
  label: string;
  value: string;
  comparator: string;
  variance: string;
  tone: 'positive' | 'warning' | 'critical' | 'neutral';
  definition: string;
  performance: number;
  targetPosition: number;
}

export interface InsightDatum {
  label: string;
  value: number;
  display: string;
  comparator?: number;
  detail: string;
  tone?: 'positive' | 'warning' | 'critical' | 'neutral';
}

export interface InsightMatrixCell {
  row: string;
  column: string;
  value: number;
  display: string;
  detail: string;
}

export interface InsightException {
  id: string;
  subject: string;
  segment: string;
  owner: string;
  age: string;
  impact: string;
  nextAction: string;
  status: 'Watch' | 'At risk' | 'Critical' | 'On track';
}

export interface ERPInsightDefinition {
  id: string;
  family: InsightFamily;
  title: string;
  question: string;
  decisionOwner: string;
  decision: string;
  primaryMeasure: string;
  formula: string;
  comparator: string;
  grain: string;
  source: string;
  readiness: 'Fixture only' | 'Contract defined';
  drillHierarchy: string[];
  metrics: InsightMetric[];
  primaryTitle: string;
  primarySubtitle: string;
  breakdown: InsightDatum[];
  stages: InsightDatum[];
  matrix: InsightMatrixCell[];
  exceptions: InsightException[];
  meta: {
    period: string;
    asOf: string;
    population: string;
    observations: string;
    freshness: string;
    confidence: number;
    coverage: number;
  };
  trace: {
    objective: string;
    capability: string;
    valueStream: string;
    process: string;
    decision: string;
    event: string;
  };
}

const familyKeywords: Array<[InsightFamily, string[]]> = [
  ['finance', ['finance', 'treasury', 'payment', 'payout', 'settlement', 'escrow', 'wallet', 'ledger', 'credit', 'insurance', 'financing']],
  ['logistics', ['logistics', 'fulfilment', 'delivery', 'cold-chain']],
  ['workforce', ['workforce', 'agent', 'assignment', 'visit', 'onboarding', 'commission']],
  ['risk', ['audit', 'verification', 'trust', 'compliance', 'risk', 'security', 'assay', 'inspection', 'quality', 'traceability', 'document']],
  ['product', ['reliability', 'release', 'route', 'website', 'native-app', 'journey', 'experiment', 'notification', 'integration', 'offline', 'sync', 'attribution', 'user']],
  ['inventory', ['inventory', 'catalogue', 'vehicle', 'parts', 'properties', 'lots', 'vault', 'plots', 'collection', 'farmers', 'houses']],
  ['commerce', ['order', 'commerce', 'checkout', 'advisor', 'offer', 'customer', 'marketing', 'search', 'discovery', 'growth', 'franchise', 'test-drive', 'viewing', 'support']],
  ['operations', ['production', 'yield', 'aggregation', 'mechanic', 'workshop', 'maintenance', 'input', 'procurement', 'trade-in']],
  ['portfolio', ['tenant', 'portfolio', 'cross-vertical', 'ontology', 'ai-operation', 'institutional', 'system-health']],
];

const overviewFamily: Record<VerticalId, InsightFamily> = {
  global: 'portfolio',
  merchant: 'commerce',
  autos: 'operations',
  estate: 'commerce',
  farmers: 'operations',
  label: 'inventory',
  susu: 'finance',
  gold: 'risk',
  agents: 'workforce',
  appsWebsite: 'product',
  systemConfig: 'risk',
};

const metric = (
  label: string,
  value: string,
  comparator: string,
  variance: string,
  tone: InsightMetric['tone'],
  definition: string,
): InsightMetric => ({
  label,
  value,
  comparator,
  variance,
  tone,
  definition,
  performance: tone === 'positive' ? 90 : tone === 'neutral' ? 76 : tone === 'warning' ? 58 : 36,
  targetPosition: 82,
});

const datum = (
  label: string,
  value: number,
  display: string,
  detail: string,
  comparator?: number,
  tone: InsightDatum['tone'] = 'neutral',
): InsightDatum => ({ label, value, display, detail, comparator, tone });

const exception = (
  id: string,
  subject: string,
  segment: string,
  owner: string,
  age: string,
  impact: string,
  nextAction: string,
  status: InsightException['status'],
): InsightException => ({ id, subject, segment, owner, age, impact, nextAction, status });

const profiles: Record<InsightFamily, Omit<ERPInsightDefinition, 'id' | 'title' | 'meta' | 'trace'>> = {
  portfolio: {
    family: 'portfolio',
    question: 'Where is value at risk across the ERP portfolio, and which operating unit needs intervention first?',
    decisionOwner: 'Group COO · Portfolio analysts',
    decision: 'Reallocate operating attention, working capital and specialist support to the highest-value constraint.',
    primaryMeasure: 'Value at risk',
    formula: 'Sum of forecast value exposed by overdue, blocked or control-failed workflows',
    comparator: 'Operating plan and risk appetite',
    grain: 'Vertical → product → tenant → workflow',
    source: 'Prototype fixture · requires governed workflow, finance and control event contracts',
    readiness: 'Contract defined',
    drillHierarchy: ['Ecosystem', 'Vertical ERP', 'Product / tenant ERP', 'Workflow', 'Record'],
    metrics: [
      metric('Value at risk', 'GHS 1.84M', 'Appetite ≤ GHS 1.20M', '+GHS 640K', 'critical', 'Forecast value attached to unresolved high-risk workflows.'),
      metric('Plan attainment', '91.8%', 'Target 96.0%', '-4.2 pp', 'warning', 'Actual verified outcomes divided by planned outcomes.'),
      metric('Cross-ERP blockers', '17', 'Prior period 11', '+6', 'critical', 'Open dependencies preventing another ERP from completing work.'),
      metric('Data confidence', '86.4%', 'Minimum 92.0%', '-5.6 pp', 'warning', 'Weighted completeness, freshness and reconciliation score.'),
    ],
    primaryTitle: 'Value-at-risk concentration',
    primarySubtitle: 'Ranked by vertical; select a bar to isolate its contributing workflows.',
    breakdown: [
      datum('Estate', 620, 'GHS 620K', 'Title verification and deposit release', 420, 'critical'),
      datum('AutoHub', 465, 'GHS 465K', 'Inspection-to-order and parts availability', 380, 'warning'),
      datum('Farmers', 330, 'GHS 330K', 'Cold-chain dwell and rejected grades', 250, 'critical'),
      datum('Merchants', 205, 'GHS 205K', 'Stockouts and payout exceptions', 180, 'warning'),
      datum('Susu Rail', 120, 'GHS 120K', 'Callback and settlement breaks', 140, 'positive'),
      datum('Label', 65, 'GHS 65K', 'Production WIP beyond plan', 90, 'positive'),
      datum('Precious Metals', 35, 'GHS 35K', 'Assay review and custody evidence', 50, 'positive'),
    ],
    stages: [
      datum('Demand verified', 1240, '1,240', 'Qualified demand records'),
      datum('Supply verified', 982, '982', 'Demand with verified supply'),
      datum('Terms controlled', 741, '741', 'BLKK-mediated terms accepted'),
      datum('Fulfilled', 603, '603', 'Evidence-backed completion'),
    ],
    matrix: [
      { row: 'AutoHub', column: 'Commercial', value: 72, display: '72', detail: 'Order conversion below plan' },
      { row: 'AutoHub', column: 'Operations', value: 61, display: '61', detail: 'Inspection and parts constraints' },
      { row: 'Estate', column: 'Trust', value: 38, display: '38', detail: 'Title review backlog' },
      { row: 'Farmers', column: 'Logistics', value: 42, display: '42', detail: 'Cold-chain exposure' },
      { row: 'Merchants', column: 'Finance', value: 57, display: '57', detail: 'Payout exceptions' },
      { row: 'Susu Rail', column: 'Platform', value: 84, display: '84', detail: 'Payment rail health' },
    ],
    exceptions: [
      exception('POR-204', 'Airport Hills title release', 'Estate · Trust', 'Trust Control', '31 hr', 'GHS 420K deposit held', 'Escalate mandate evidence', 'Critical'),
      exception('POR-197', 'Toyota parts order cluster', 'AutoHub · Inventory', 'Auto Parts Control', '19 hr', 'GHS 186K orders exposed', 'Approve substitute stock', 'At risk'),
      exception('POR-188', 'Techiman cold-chain loads', 'Farmers · Logistics', 'Central Dispatch', '4 hr', '31.6 t at spoilage risk', 'Re-route to cold store', 'Critical'),
      exception('POR-176', 'Merchant payout batch 0726', 'Merchants · Finance', 'Treasury Desk', '11 hr', 'GHS 94K pending', 'Resolve MoMo variance', 'Watch'),
    ],
  },
  commerce: {
    family: 'commerce',
    question: 'Where does BLKK-mediated demand fail to become a verified order, and what intervention will recover it?',
    decisionOwner: 'Commercial operations · Advisor lead',
    decision: 'Assign advisors, correct offer friction and recover high-value stalled demand without bypassing BLKK.',
    primaryMeasure: 'Controlled-order conversion',
    formula: 'BLKK orders created ÷ qualified buyer intents',
    comparator: 'Target conversion by channel, vertical and advisor cohort',
    grain: 'Intent → advisor thread → controlled offer → BLKK order',
    source: 'Prototype fixture · requires intent, advisor activity, offer and order event contracts',
    readiness: 'Contract defined',
    drillHierarchy: ['Channel', 'Intent type', 'Advisor team', 'Stage', 'Buyer intent'],
    metrics: [
      metric('Controlled-order conversion', '38.7%', 'Target 46.0%', '-7.3 pp', 'critical', 'BLKK orders divided by qualified buyer intents.'),
      metric('Median advisor response', '11 min', 'SLA ≤ 15 min', '4 min inside', 'positive', 'Median time from qualified intent to first BLKK advisor response.'),
      metric('Stalled value', 'GHS 684K', 'Appetite ≤ GHS 400K', '+GHS 284K', 'critical', 'Quoted value in qualified intents stalled beyond stage SLA.'),
      metric('Escrow-ready orders', '73.2%', 'Target 80.0%', '-6.8 pp', 'warning', 'Orders with identity, delivery and payment requirements complete.'),
    ],
    primaryTitle: 'BLKK-mediated demand funnel',
    primarySubtitle: 'The loss between stages reveals the next recoverable commercial constraint.',
    breakdown: [
      datum('Advisor not reached', 31, '31%', 'Buyer was not reached inside response SLA', 18, 'critical'),
      datum('Terms unresolved', 26, '26%', 'Price, availability or delivery terms unresolved', 20, 'warning'),
      datum('Verification pending', 19, '19%', 'Asset or inventory evidence blocks order', 12, 'warning'),
      datum('Payment not completed', 15, '15%', 'Checkout opened but escrow funding incomplete', 10, 'warning'),
      datum('Other', 9, '9%', 'Duplicate, invalid or deferred demand', 8, 'neutral'),
    ],
    stages: [
      datum('Qualified intent', 1240, '1,240', 'Enquiries, bids and secure-now intents accepted as qualified'),
      datum('Advisor engaged', 986, '986 · 79.5%', 'Two-way BLKK-managed engagement'),
      datum('Terms controlled', 711, '711 · 57.3%', 'Price, supply and fulfilment terms confirmed'),
      datum('Order created', 480, '480 · 38.7%', 'BLKK order created for buyer completion'),
      datum('Escrow funded', 351, '351 · 28.3%', 'Payment secured by BLKK'),
    ],
    matrix: [],
    exceptions: [
      exception('COM-481', 'Fleet request: 12 pickups', 'Corporate · Accra', 'Enterprise Advisors', '22 hr', 'GHS 418K quoted value', 'Confirm inspection slots', 'Critical'),
      exception('COM-472', 'Airport Residential viewing cohort', 'Estate · Website', 'Estate Advisor Pod', '17 hr', '9 qualified intents', 'Resolve owner availability', 'At risk'),
      exception('COM-459', 'Toyota brake pad demand', 'Autos · App', 'Parts Advisor Pod', '8 hr', '46 intents / 18 stockouts', 'Source verified substitutes', 'At risk'),
      exception('COM-448', 'Abossey Okai merchant leads', 'Merchants · Field', 'Merchant Activation', '3 hr', '14 new catalogue orders', 'Assign next-call queue', 'On track'),
    ],
  },
  inventory: {
    family: 'inventory',
    question: 'Which verified assets are unavailable, ageing or commercially invisible, and what stock action protects demand?',
    decisionOwner: 'Inventory control · Commercial planning',
    decision: 'Replenish, transfer, verify, publish, discount or quarantine inventory by demand and risk.',
    primaryMeasure: 'Demand-weighted availability',
    formula: 'Demand served from verified available stock ÷ total qualified demand',
    comparator: 'Availability target by category, location and service promise',
    grain: 'Vertical → tenant → location → category → SKU / asset',
    source: 'Prototype fixture · requires stock movement, verification, demand and location contracts',
    readiness: 'Contract defined',
    drillHierarchy: ['Location', 'Category', 'Age band', 'Verification state', 'SKU / asset'],
    metrics: [
      metric('Demand-weighted availability', '78.4%', 'Target 92.0%', '-13.6 pp', 'critical', 'Qualified demand serviceable from verified, available stock.'),
      metric('Stockout exposure', 'GHS 392K', 'Prior period GHS 244K', '+60.7%', 'critical', 'Forecast gross value lost to unavailable demanded inventory.'),
      metric('Ageing over threshold', '16.8%', 'Limit ≤ 10.0%', '+6.8 pp', 'warning', 'Inventory value older than its category ageing threshold.'),
      metric('Verified & published', '84.1%', 'Target 96.0%', '-11.9 pp', 'warning', 'Assets complete enough to be trusted and visible to buyers.'),
    ],
    primaryTitle: 'Inventory ageing by value',
    primarySubtitle: 'Select an age band to expose locations, categories and records requiring action.',
    breakdown: [
      datum('0–30 days', 46, 'GHS 1.82M', 'Healthy working inventory', 50, 'positive'),
      datum('31–60 days', 24, 'GHS 950K', 'Monitor category velocity', 25, 'neutral'),
      datum('61–90 days', 13, 'GHS 514K', 'Transfer or promotion candidate', 12, 'warning'),
      datum('91–180 days', 11, 'GHS 435K', 'Working-capital intervention', 8, 'critical'),
      datum('180+ days', 6, 'GHS 237K', 'Quarantine, revalue or dispose', 5, 'critical'),
    ],
    stages: [],
    matrix: [
      { row: 'Accra', column: 'High demand', value: 74, display: '74%', detail: '18 priority stockouts' },
      { row: 'Accra', column: 'Long tail', value: 91, display: '91%', detail: 'Availability healthy' },
      { row: 'Kumasi', column: 'High demand', value: 68, display: '68%', detail: 'Toyota and building inputs constrained' },
      { row: 'Kumasi', column: 'Long tail', value: 83, display: '83%', detail: 'Verification gaps' },
      { row: 'Techiman', column: 'High demand', value: 81, display: '81%', detail: 'Storage release pending' },
      { row: 'Techiman', column: 'Long tail', value: 76, display: '76%', detail: 'Ageing agricultural inputs' },
    ],
    exceptions: [
      exception('INV-912', 'Toyota brake pads · genuine', 'Kumasi · Fast movers', 'Inventory Control', '2 days', '46 qualified intents unserved', 'Transfer 28 units from Accra', 'Critical'),
      exception('INV-894', 'NPK 15:15:15 batch', 'Techiman · Inputs', 'Warehouse Quality', '11 days', 'GHS 84K ageing stock', 'Re-grade and release', 'At risk'),
      exception('INV-871', 'Two-bedroom listings', 'Estate · Airport area', 'Listing Quality', '31 hr', '12 unpublished assets', 'Complete title evidence', 'At risk'),
      exception('INV-850', 'Label finished goods drop 06', 'Accra · Finished goods', 'Collection Control', '6 hr', '82% sell-through forecast', 'Publish approved variants', 'On track'),
    ],
  },
  logistics: {
    family: 'logistics',
    question: 'Which handoffs or corridors will breach the BLKK promise, and where should dispatch intervene now?',
    decisionOwner: 'Central dispatch · Fulfilment operations',
    decision: 'Reassign capacity, reroute loads, sequence stops and escalate evidence gaps before SLA breach.',
    primaryMeasure: 'On-time-in-full delivery',
    formula: 'Deliveries completed within promise window and full quantity ÷ completed deliveries',
    comparator: 'SLA by fulfilment type, corridor and carrier',
    grain: 'Order → consignment → stop → status event',
    source: 'Prototype fixture · requires order, route, location, carrier and proof-of-delivery contracts',
    readiness: 'Contract defined',
    drillHierarchy: ['Fulfilment type', 'Corridor', 'Carrier / fleet', 'Consignment', 'Status event'],
    metrics: [
      metric('On time, in full', '88.6%', 'SLA 95.0%', '-6.4 pp', 'critical', 'Completed deliveries both on time and with complete quantity.'),
      metric('At-risk consignments', '34', 'Prior period 21', '+13', 'critical', 'Open consignments forecast to miss promise or quantity.'),
      metric('Empty kilometres', '18.2%', 'Target ≤ 12.0%', '+6.2 pp', 'warning', 'Distance travelled without a revenue or consolidation load.'),
      metric('Proof completeness', '93.8%', 'Target 99.0%', '-5.2 pp', 'warning', 'Delivered consignments with required GPS, time, recipient and media evidence.'),
    ],
    primaryTitle: 'Fulfilment control tower',
    primarySubtitle: 'Live stage load shows where consignments accumulate and breach risk forms.',
    breakdown: [
      datum('Accra → Kumasi', 63, '63 consignments', 'OTIF 84% · congestion exposure', 95, 'critical'),
      datum('Techiman → Accra', 48, '48 consignments', 'OTIF 79% · cold-chain dwell', 95, 'critical'),
      datum('Tema → Accra', 41, '41 consignments', 'OTIF 94% · near target', 95, 'warning'),
      datum('Kumasi urban', 37, '37 consignments', 'OTIF 97% · capacity available', 95, 'positive'),
      datum('Accra urban', 112, '112 consignments', 'OTIF 92% · proof gaps', 95, 'warning'),
    ],
    stages: [
      datum('Ready for dispatch', 52, '52', '12 beyond assignment SLA'),
      datum('Driver assigned', 41, '41', '7 awaiting pickup'),
      datum('Picked up', 36, '36', '5 outside planned route window'),
      datum('In transit', 74, '74', '22 forecast at risk'),
      datum('Proof pending', 19, '19', '9 delivered without complete evidence'),
    ],
    matrix: [],
    exceptions: [
      exception('LOG-337', 'Fresh produce consolidation 881', 'Techiman → Accra', 'Cold Chain Desk', '4 hr', '18.4 t / GHS 126K', 'Move to Nkoranza cold store', 'Critical'),
      exception('LOG-329', 'Vehicle delivery BLK-2048', 'Tema → Kumasi', 'Auto Dispatch', '2 hr', 'Buyer promise in 5 hr', 'Reassign recovery driver', 'At risk'),
      exception('LOG-318', 'Parts multi-stop route 44', 'Accra urban', 'Merchant Dispatch', '76 min', '8 orders / GHS 21K', 'Resequence final 3 stops', 'Watch'),
      exception('LOG-301', 'Estate document handoff 92', 'Airport Residential', 'Secure Courier', '24 min', 'Deposit release dependency', 'Capture recipient proof', 'On track'),
    ],
  },
  finance: {
    family: 'finance',
    question: 'What explains the cash and margin variance, and which receivable, escrow or settlement action changes it?',
    decisionOwner: 'Finance controller · Treasury',
    decision: 'Release eligible escrow, collect receivables, resolve settlement breaks and contain margin leakage.',
    primaryMeasure: 'Operating cash variance',
    formula: 'Actual operating cash movement minus planned operating cash movement',
    comparator: 'Approved plan, prior period and liquidity floor',
    grain: 'Legal entity → account → transaction type → ledger event',
    source: 'Prototype fixture · requires reconciled payment, escrow, payout and general-ledger contracts',
    readiness: 'Contract defined',
    drillHierarchy: ['Legal entity', 'Account', 'Transaction type', 'Counterparty', 'Ledger event'],
    metrics: [
      metric('Operating cash variance', '-GHS 318K', 'Plan GHS +420K', '-75.7%', 'critical', 'Actual operating cash movement less approved plan.'),
      metric('Escrow eligible to release', 'GHS 486K', 'SLA ≤ 4 hr', 'GHS 192K overdue', 'warning', 'Held funds whose contractual release evidence is complete.'),
      metric('Settlement breaks', 'GHS 137K', 'Tolerance ≤ GHS 25K', '+GHS 112K', 'critical', 'Payment-to-ledger-to-payout differences outside tolerance.'),
      metric('Contribution margin', '19.8%', 'Plan 23.5%', '-3.7 pp', 'warning', 'Net platform revenue less directly attributable fulfilment and service cost.'),
    ],
    primaryTitle: 'Cash variance bridge',
    primarySubtitle: 'Drivers reconcile plan to actual; select a driver to inspect counterparties and events.',
    breakdown: [
      datum('Plan', 420, 'GHS +420K', 'Approved net operating cash', 420, 'neutral'),
      datum('Collections shortfall', -184, '−GHS 184K', 'Receivables collected below plan', -80, 'critical'),
      datum('Escrow release delay', -192, '−GHS 192K', 'Eligible releases beyond SLA', -40, 'critical'),
      datum('Payout timing', 88, '+GHS 88K', 'Payout timing temporarily preserves cash', 20, 'warning'),
      datum('Margin leakage', -30, '−GHS 30K', 'Unplanned fulfilment and recovery cost', -15, 'warning'),
      datum('Actual', 102, 'GHS +102K', 'Actual net operating cash', 420, 'critical'),
    ],
    stages: [
      datum('Current', 58, 'GHS 812K', 'Receivables not yet due'),
      datum('1–7 days', 17, 'GHS 238K', 'Collection queue'),
      datum('8–30 days', 14, 'GHS 196K', 'Escalated collection'),
      datum('31–60 days', 7, 'GHS 98K', 'Credit control'),
      datum('60+ days', 4, 'GHS 56K', 'Impairment review'),
    ],
    matrix: [],
    exceptions: [
      exception('FIN-620', 'MoMo settlement batch MTN-726B', 'Payments · MTN MoMo', 'Reconciliation Desk', '13 hr', 'GHS 92K unmatched', 'Reconcile callback references', 'Critical'),
      exception('FIN-612', 'Estate escrow release ER-221', 'Estate · Escrow', 'Treasury Control', '9 hr', 'GHS 240K eligible', 'Approve delivery evidence', 'At risk'),
      exception('FIN-603', 'Merchant payouts cycle 30', 'Merchants · Payouts', 'Merchant Finance', '5 hr', 'GHS 45K variance', 'Resolve fee calculation', 'At risk'),
      exception('FIN-588', 'Gold settlement GS-88', 'Gold · Settlement', 'Metals Finance', '44 min', 'GHS 164K scheduled', 'Final assay sign-off', 'Watch'),
    ],
  },
  workforce: {
    family: 'workforce',
    question: 'Where is capacity misaligned with workload, and which team needs reassignment, coaching or quality intervention?',
    decisionOwner: 'Operations manager · People analytics',
    decision: 'Rebalance assignments, protect SLA coverage and target coaching at quality-adjusted performance gaps.',
    primaryMeasure: 'Quality-adjusted capacity coverage',
    formula: 'Productive verified hours available ÷ hours required by forecast workload',
    comparator: 'Required coverage by region, skill and shift',
    grain: 'Region → team → skill → person → assignment',
    source: 'Prototype fixture · requires roster, attendance, assignment, outcome and quality contracts',
    readiness: 'Contract defined',
    drillHierarchy: ['Region', 'Team', 'Skill', 'Shift', 'Agent / employee', 'Assignment'],
    metrics: [
      metric('Capacity coverage', '87.3%', 'Required 100%', '-12.7 pp', 'critical', 'Quality-adjusted productive hours divided by forecast hours required.'),
      metric('First-pass acceptance', '91.2%', 'Target 96.0%', '-4.8 pp', 'warning', 'Outputs accepted without return, correction or rework.'),
      metric('SLA workload at risk', '146 jobs', 'Prior period 88', '+58', 'critical', 'Open assignments forecast to breach due to capacity or skill mismatch.'),
      metric('Training gap closure', '68.0%', 'Plan 85.0%', '-17.0 pp', 'warning', 'Required skills completed and demonstrated by assessed staff.'),
    ],
    primaryTitle: 'Capacity versus workload',
    primarySubtitle: 'Coverage intensity isolates the region and skill where reassignment changes SLA risk.',
    breakdown: [
      datum('Greater Accra', 94, '94% coverage', 'High workload · quality 95%', 100, 'warning'),
      datum('Ashanti', 76, '76% coverage', 'Verification skill shortage', 100, 'critical'),
      datum('Bono East', 82, '82% coverage', 'Harvest capture peak', 100, 'critical'),
      datum('Northern', 109, '109% coverage', 'Transferable field capacity', 100, 'positive'),
      datum('Volta', 97, '97% coverage', 'Near balanced', 100, 'neutral'),
    ],
    stages: [],
    matrix: [
      { row: 'Greater Accra', column: 'Verify', value: 92, display: '92%', detail: '6 hr shortage' },
      { row: 'Greater Accra', column: 'Capture', value: 108, display: '108%', detail: '4 hr transferable' },
      { row: 'Ashanti', column: 'Verify', value: 61, display: '61%', detail: '28 jobs at risk' },
      { row: 'Ashanti', column: 'Advisor', value: 84, display: '84%', detail: 'Response SLA pressure' },
      { row: 'Bono East', column: 'Capture', value: 72, display: '72%', detail: 'Harvest peak shortage' },
      { row: 'Northern', column: 'Capture', value: 118, display: '118%', detail: 'Capacity available' },
    ],
    exceptions: [
      exception('WRK-284', 'Ashanti verification queue', 'Ashanti · Verification', 'Regional Field Lead', '6 hr', '28 jobs forecast late', 'Transfer 3 qualified agents', 'Critical'),
      exception('WRK-273', 'Bono East harvest capture', 'Bono East · Capture', 'Agriculture Ops', '4 hr', '41 farms awaiting evidence', 'Open surge shift', 'At risk'),
      exception('WRK-264', 'Advisor response pod B', 'Accra · Advisor', 'Commercial Ops', '2 hr', '17 high-value intents', 'Rebalance call queue', 'At risk'),
      exception('WRK-251', 'Northern spare capacity', 'Northern · Capture', 'National Field Control', '31 min', '26 productive hours free', 'Offer cross-region work', 'On track'),
    ],
  },
  risk: {
    family: 'risk',
    question: 'Which control failure creates the largest trust or financial exposure, and what evidence closes it?',
    decisionOwner: 'Risk & compliance · Control owner',
    decision: 'Prioritize evidence review, restrict risky transactions and close overdue control actions.',
    primaryMeasure: 'Unmitigated exposure',
    formula: 'Probability × impact × open-control factor across unresolved risks',
    comparator: 'Approved risk appetite and control SLA',
    grain: 'Domain → control → entity → evidence item',
    source: 'Prototype fixture · requires identity, asset, transaction, evidence and control-decision contracts',
    readiness: 'Contract defined',
    drillHierarchy: ['Risk domain', 'Control', 'Severity', 'Entity', 'Evidence'],
    metrics: [
      metric('Unmitigated exposure', 'GHS 2.16M', 'Appetite ≤ GHS 1.00M', '+GHS 1.16M', 'critical', 'Probability-weighted financial impact after active mitigations.'),
      metric('Controls effective', '82.5%', 'Target 96.0%', '-13.5 pp', 'critical', 'Tested controls operating effectively in the review window.'),
      metric('Critical actions overdue', '14', 'Tolerance 0', '+14', 'critical', 'Critical remediation actions beyond agreed due date.'),
      metric('Evidence completeness', '89.7%', 'Minimum 98.0%', '-8.3 pp', 'warning', 'Required evidence present, current and linked to the controlled entity.'),
    ],
    primaryTitle: 'Risk and control matrix',
    primarySubtitle: 'Cells combine residual severity and open evidence; select one to inspect control failures.',
    breakdown: [
      datum('Title & authority', 38, 'GHS 820K', 'Property mandate and title exposure', 15, 'critical'),
      datum('Payment integrity', 27, 'GHS 583K', 'Callback, settlement and refund exposure', 15, 'critical'),
      datum('Asset authenticity', 18, 'GHS 389K', 'Parts, vehicle and gold authenticity', 15, 'warning'),
      datum('Chain of custody', 11, 'GHS 238K', 'Produce and gold custody gaps', 10, 'warning'),
      datum('Access & privacy', 6, 'GHS 130K', 'Permission and session exceptions', 10, 'positive'),
    ],
    stages: [],
    matrix: [
      { row: 'Critical impact', column: 'Likely', value: 94, display: '7', detail: '7 open risks · GHS 1.02M exposure' },
      { row: 'Critical impact', column: 'Possible', value: 76, display: '5', detail: '5 open risks · GHS 630K exposure' },
      { row: 'Major impact', column: 'Likely', value: 68, display: '9', detail: '9 open risks · GHS 310K exposure' },
      { row: 'Major impact', column: 'Possible', value: 46, display: '13', detail: '13 risks under active control' },
      { row: 'Moderate impact', column: 'Likely', value: 41, display: '8', detail: '8 watch-list risks' },
      { row: 'Moderate impact', column: 'Unlikely', value: 19, display: '21', detail: '21 accepted or monitored risks' },
    ],
    exceptions: [
      exception('RSK-441', 'Airport Hills owner mandate', 'Title & authority', 'Estate Trust Control', '31 hr', 'GHS 420K transaction', 'Obtain registry-backed mandate', 'Critical'),
      exception('RSK-432', 'Parts authenticity batch AB-19', 'Asset authenticity', 'Auto Verification', '16 hr', 'GHS 186K inventory', 'Complete supplier evidence', 'Critical'),
      exception('RSK-419', 'MoMo callback replay cluster', 'Payment integrity', 'Susu Risk', '7 hr', 'GHS 92K settlement', 'Restrict and reconcile events', 'At risk'),
      exception('RSK-405', 'Gold lot custody media', 'Chain of custody', 'Metals Compliance', '2 hr', '1.8 kg controlled lot', 'Capture vault handoff proof', 'Watch'),
    ],
  },
  product: {
    family: 'product',
    question: 'Which product journey or release is reducing successful outcomes, and what should product or engineering change next?',
    decisionOwner: 'Product operations · Engineering',
    decision: 'Hold or roll back releases, fix failing surfaces and prioritize the journey constraint with highest outcome impact.',
    primaryMeasure: 'Journey success rate',
    formula: 'Sessions completing the governed target outcome ÷ eligible journey starts',
    comparator: 'Previous stable release, target and platform cohort',
    grain: 'Product → release → journey → screen / route → event',
    source: 'Prototype fixture · requires versioned product, identity, event, error and business-outcome contracts',
    readiness: 'Contract defined',
    drillHierarchy: ['Product', 'Release', 'Journey', 'Screen / route', 'Session / event'],
    metrics: [
      metric('Journey success', '62.8%', 'Stable release 71.4%', '-8.6 pp', 'critical', 'Eligible journeys completing their governed business outcome.'),
      metric('Crash-free sessions', '98.71%', 'SLO 99.50%', '-0.79 pp', 'warning', 'Sessions without fatal client error or crash.'),
      metric('Payment callback success', '94.2%', 'SLO 99.0%', '-4.8 pp', 'critical', 'Payment attempts receiving a valid terminal callback inside SLA.'),
      metric('Offline sync freshness', '87.9%', 'Target 97.0%', '-9.1 pp', 'warning', 'Offline records synchronized within the freshness promise.'),
    ],
    primaryTitle: 'Release and journey quality',
    primarySubtitle: 'Compare adoption with outcome quality; high adoption does not excuse a bad release.',
    breakdown: [
      datum('BLKK Star Hub web', 74, '74.1% success', 'Search → advisor intent · stable', 72, 'positive'),
      datum('BLKK Autos 3.8.0', 58, '58.3% success', 'Checkout callback regression', 71, 'critical'),
      datum('Merchants 2.6.1', 69, '69.4% success', 'Inventory sync delays', 73, 'warning'),
      datum('Farmers 2.2.0', 81, '81.2% success', 'Offline capture improved', 76, 'positive'),
      datum('Estate 1.9.4', 64, '64.0% success', 'Document upload abandonment', 70, 'warning'),
      datum('Label Admin 1.4.2', 88, '88.1% success', 'Approval flow healthy', 84, 'positive'),
    ],
    stages: [
      datum('Eligible sessions', 48200, '48.2K', 'Sessions eligible for a governed journey'),
      datum('Core action reached', 36100, '36.1K · 74.9%', 'Search, capture or operational action reached'),
      datum('Validation passed', 31800, '31.8K · 66.0%', 'Required data and control checks passed'),
      datum('Outcome completed', 30270, '30.3K · 62.8%', 'Order, submission or controlled task completed'),
    ],
    matrix: [
      { row: 'Autos 3.8.0', column: 'Checkout', value: 38, display: '38', detail: 'Payment callback failures' },
      { row: 'Autos 3.8.0', column: 'Orders', value: 71, display: '71', detail: 'Status refresh delay' },
      { row: 'Merchants 2.6.1', column: 'Inventory', value: 54, display: '54', detail: 'Offline sync conflict rate' },
      { row: 'Estate 1.9.4', column: 'Documents', value: 49, display: '49', detail: 'Upload completion below target' },
      { row: 'Farmers 2.2.0', column: 'Offline', value: 91, display: '91', detail: 'Improved sync freshness' },
      { row: 'Label 1.4.2', column: 'Approvals', value: 95, display: '95', detail: 'Stable controlled workflow' },
    ],
    exceptions: [
      exception('PRD-808', 'Autos checkout callback', 'BLKK Autos · 3.8.0', 'Payments Engineering', '3 hr', '168 payment attempts', 'Pause rollout at 42%', 'Critical'),
      exception('PRD-795', 'Merchant inventory conflicts', 'Merchants · 2.6.1', 'Mobile Platform', '7 hr', '284 records delayed', 'Ship conflict-resolution flag', 'At risk'),
      exception('PRD-782', 'Estate document upload', 'Estate · 1.9.4', 'Estate Product', '11 hr', '31 qualified intents stalled', 'Reduce upload payload', 'At risk'),
      exception('PRD-770', 'Farmers offline sync', 'Farmers · 2.2.0', 'Field Platform', '42 min', 'Freshness +8.4 pp', 'Continue phased rollout', 'On track'),
    ],
  },
  operations: {
    family: 'operations',
    question: 'Which operating constraint limits verified throughput, and what capacity or quality action removes it?',
    decisionOwner: 'Vertical operations · Process owner',
    decision: 'Rebalance capacity, clear blocked work and correct the highest-yield process constraint.',
    primaryMeasure: 'Verified first-pass throughput',
    formula: 'Outputs completed and accepted first time ÷ planned productive capacity',
    comparator: 'Plan, prior period and rated capacity',
    grain: 'Process → site → team → work order / job / lot',
    source: 'Prototype fixture · requires work-order, capacity, quality, inventory and outcome contracts',
    readiness: 'Contract defined',
    drillHierarchy: ['Process', 'Site', 'Team / work centre', 'Shift', 'Work item'],
    metrics: [
      metric('Verified throughput', '73.6%', 'Plan 88.0%', '-14.4 pp', 'critical', 'Accepted first-pass output divided by planned productive capacity.'),
      metric('Constraint queue', '214 items', 'Limit ≤ 90', '+124', 'critical', 'Work waiting at the currently binding process constraint.'),
      metric('First-pass yield', '91.4%', 'Target 96.0%', '-4.6 pp', 'warning', 'Outputs accepted without rework, rejection or evidence correction.'),
      metric('Capacity lost', '486 hr', 'Prior period 312 hr', '+55.8%', 'warning', 'Rated productive hours lost to wait, failure, absence or missing input.'),
    ],
    primaryTitle: 'Constraint and throughput flow',
    primarySubtitle: 'Stage load and yield reveal the binding constraint—not just total activity.',
    breakdown: [
      datum('Inspection / intake', 118, '118% load', 'Queue growing · 94% first-pass yield', 100, 'critical'),
      datum('Verification', 126, '126% load', 'Binding constraint · evidence skill gap', 100, 'critical'),
      datum('Preparation', 84, '84% load', 'Available capacity', 100, 'positive'),
      datum('Fulfilment ready', 92, '92% load', 'Balanced with current demand', 100, 'neutral'),
      datum('Quality release', 107, '107% load', 'Rework feeds queue', 100, 'warning'),
    ],
    stages: [
      datum('Demand / work intake', 982, '982', 'Accepted work in the period'),
      datum('Evidence complete', 816, '816 · 83.1%', 'Required inputs present'),
      datum('Processed', 741, '741 · 75.5%', 'Core work completed'),
      datum('First-pass accepted', 723, '723 · 73.6%', 'Verified without rework'),
      datum('Outcome released', 681, '681 · 69.3%', 'Commercial or operational outcome available'),
    ],
    matrix: [],
    exceptions: [
      exception('OPS-711', 'Vehicle inspection bay 2', 'AutoHub · Inspection', 'Workshop Operations', '9 hr', '17 deals waiting', 'Extend qualified inspector shift', 'Critical'),
      exception('OPS-702', 'Harvest grade review', 'Farmers · Quality', 'Aggregation Control', '6 hr', '31.6 t awaiting allocation', 'Add second grader', 'Critical'),
      exception('OPS-690', 'Collection release drop 06', 'Label · Quality release', 'House Operations', '4 hr', 'GHS 118K stock blocked', 'Resolve size-spec rework', 'At risk'),
      exception('OPS-676', 'Estate inspection reports', 'Estate · Verification', 'Inspection Desk', '88 min', '12 offers awaiting reports', 'Batch reviewer allocation', 'Watch'),
    ],
  },
};

export const getInsightFamily = (verticalId: VerticalId, moduleId: string): InsightFamily => {
  if (!moduleId) return overviewFamily[verticalId];
  const normalized = moduleId.toLowerCase();
  return familyKeywords.find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))?.[0] ?? 'operations';
};

const familyContext: Record<InsightFamily, {
  objective: string;
  capability: string;
  valueStream: string;
  decision: string;
  population: string;
  observations: string;
  freshness: string;
  confidence: number;
  coverage: number;
}> = {
  portfolio: {
    objective: 'Realize verified enterprise value',
    capability: 'Portfolio governance',
    valueStream: 'Need to realized outcome',
    decision: 'Prioritize intervention',
    population: '9 ERPs · 31 tenants',
    observations: '18,420 workflow events',
    freshness: '15 min',
    confidence: 86,
    coverage: 91,
  },
  commerce: {
    objective: 'Convert verified demand',
    capability: 'BLKK-mediated commerce',
    valueStream: 'Intent to fulfilled order',
    decision: 'Recover stalled demand',
    population: '1,240 qualified intents',
    observations: '8,914 commercial events',
    freshness: '5 min',
    confidence: 89,
    coverage: 94,
  },
  inventory: {
    objective: 'Make verified supply available',
    capability: 'Asset and stock control',
    valueStream: 'Supply capture to allocation',
    decision: 'Replenish, move or restrict',
    population: '4,382 SKUs / assets',
    observations: '26,108 stock events',
    freshness: '12 min',
    confidence: 84,
    coverage: 88,
  },
  logistics: {
    objective: 'Deliver on the BLKK promise',
    capability: 'Dispatch and fulfilment',
    valueStream: 'Order release to proof',
    decision: 'Assign, reroute or escalate',
    population: '222 open consignments',
    observations: '6,742 status events',
    freshness: '2 min',
    confidence: 92,
    coverage: 96,
  },
  finance: {
    objective: 'Protect cash and margin',
    capability: 'Treasury and settlement',
    valueStream: 'Payment intent to reconciled ledger',
    decision: 'Release, collect or reconcile',
    population: '12,806 ledger events',
    observations: 'GHS 8.42M gross movement',
    freshness: '30 min',
    confidence: 94,
    coverage: 98,
  },
  workforce: {
    objective: 'Match capable people to work',
    capability: 'Workforce orchestration',
    valueStream: 'Demand forecast to accepted output',
    decision: 'Reassign, coach or staff',
    population: '684 active workers',
    observations: '3,906 assignments',
    freshness: '1 hr',
    confidence: 83,
    coverage: 89,
  },
  risk: {
    objective: 'Keep trade verifiable and trusted',
    capability: 'Trust and control',
    valueStream: 'Evidence capture to control decision',
    decision: 'Restrict, verify or accept',
    population: '1,806 controlled entities',
    observations: '9,220 evidence items',
    freshness: '20 min',
    confidence: 91,
    coverage: 93,
  },
  product: {
    objective: 'Complete reliable digital journeys',
    capability: 'Digital product operations',
    valueStream: 'Session start to governed outcome',
    decision: 'Release, hold or repair',
    population: '48.2K eligible sessions',
    observations: '1.84M product events',
    freshness: '3 min',
    confidence: 96,
    coverage: 99,
  },
  operations: {
    objective: 'Increase accepted throughput',
    capability: 'Process and capacity control',
    valueStream: 'Work intake to released outcome',
    decision: 'Clear the binding constraint',
    population: '982 work items',
    observations: '7,618 process events',
    freshness: '10 min',
    confidence: 88,
    coverage: 92,
  },
};

export const getERPInsightDefinition = (
  workspace: ERPWorkspaceDefinition,
  moduleId: string,
  moduleLabel?: string,
): ERPInsightDefinition => {
  const family = getInsightFamily(workspace.verticalId, moduleId);
  const profile = profiles[family];
  const surface = moduleLabel || workspace.shortName;
  const context = familyContext[family];

  return {
    ...profile,
    id: `${workspace.id}:${moduleId || 'overview'}:${family}`,
    title: `${surface} decision intelligence`,
    meta: {
      period: '30 days',
      asOf: '28 Jul 2026 · 06:00 GMT',
      population: context.population,
      observations: context.observations,
      freshness: context.freshness,
      confidence: context.confidence,
      coverage: context.coverage,
    },
    trace: {
      objective: context.objective,
      capability: context.capability,
      valueStream: context.valueStream,
      process: moduleLabel || `${workspace.shortName} control`,
      decision: context.decision,
      event: moduleId ? `${moduleId.replace(/-/g, '_')}.status_changed` : `${family}.outcome_recorded`,
    },
  };
};

const verticalOverrides: Partial<Record<VerticalId, Partial<ERPInsightDefinition>>> = {
  merchant: {
    title: 'Merchant operating intelligence',
    question: 'Which merchant constraint is preventing verified demand from becoming a fulfilled BLKK order?',
    primaryMeasure: 'Verified order fulfilment',
    formula: 'Orders delivered with complete proof ÷ BLKK orders due in the period',
    metrics: [
      metric('Qualified intent → order', '34.8%', 'Target 44.0%', '-9.2 pp', 'critical', 'BLKK orders created divided by qualified product intents.'),
      metric('Demand-weighted in stock', '76.2%', 'Target 92.0%', '-15.8 pp', 'critical', 'Qualified product demand serviceable from verified merchant stock.'),
      metric('Pick-to-handoff SLA', '88.1%', 'Target 96.0%', '-7.9 pp', 'warning', 'Accepted orders handed to BLKK Logistics inside promise.'),
      metric('Payout exposure', 'GHS 94K', 'Tolerance ≤ GHS 25K', '+GHS 69K', 'warning', 'Eligible merchant payouts delayed by reconciliation or evidence.'),
    ],
    primaryTitle: 'Merchant order control funnel',
    primarySubtitle: 'Demand becomes an order only through BLKK-controlled advisor, stock and checkout stages.',
    stages: [
      datum('Qualified product intent', 742, '742', 'Verified enquiries and secure-now intents'),
      datum('Stock confirmed', 566, '566 · 76.3%', 'Merchant inventory verified as available'),
      datum('BLKK terms confirmed', 411, '411 · 55.4%', 'Price, delivery and service promise controlled'),
      datum('Order created', 258, '258 · 34.8%', 'BLKK order created'),
      datum('Delivered with proof', 219, '219 · 29.5%', 'Completed with required evidence'),
    ],
    breakdown: [
      datum('Fast-moving stockouts', 37, '37%', 'Demand lost to unavailable verified stock', 18, 'critical'),
      datum('Merchant response delay', 24, '24%', 'Confirmation beyond operating SLA', 15, 'warning'),
      datum('Delivery detail gaps', 18, '18%', 'Address, location or recipient incomplete', 8, 'warning'),
      datum('Payment abandonment', 13, '13%', 'Checkout opened but payment incomplete', 10, 'warning'),
      datum('Verification hold', 8, '8%', 'Catalogue authenticity or data evidence', 6, 'neutral'),
    ],
    exceptions: [
      exception('MER-481', 'Toyota brake pad stock cluster', 'Parts sellers · Kumasi', 'Merchant Inventory', '8 hr', '46 intents / GHS 72K', 'Transfer verified substitutes', 'Critical'),
      exception('MER-472', 'Abossey Okai response queue', 'Parts sellers · Accra', 'Merchant Advisors', '3 hr', '31 qualified intents', 'Assign next-call capacity', 'At risk'),
      exception('MER-459', 'Payout batch M-0726', 'Payouts · MTN MoMo', 'Merchant Finance', '11 hr', 'GHS 94K eligible', 'Resolve fee variance', 'At risk'),
      exception('MER-448', 'Osu catalogue activation', 'Fashion merchants · Accra', 'Catalogue Quality', '41 min', '84 verified SKUs ready', 'Publish approved stock', 'On track'),
    ],
  },
  autos: {
    title: 'AutoHub operating intelligence',
    question: 'Where does a verified vehicle, parts or workshop opportunity stall before BLKK-controlled fulfilment?',
    primaryMeasure: 'Inspection-to-order yield',
    formula: 'BLKK orders created from accepted inspections ÷ inspections accepted',
    metrics: [
      metric('Inspection → order', '41.6%', 'Target 55.0%', '-13.4 pp', 'critical', 'Vehicle opportunities becoming controlled orders after accepted inspection.'),
      metric('Vehicle inventory days', '67 days', 'Target ≤ 45 days', '+22 days', 'warning', 'Median age of verified vehicles available for sale.'),
      metric('Workshop bay utilization', '82.4%', 'Target 85–90%', '-2.6 pp', 'neutral', 'Productive booked bay hours divided by available bay hours.'),
      metric('Parts demand in stock', '68.1%', 'Target 92.0%', '-23.9 pp', 'critical', 'Qualified parts demand serviceable by verified available stock.'),
    ],
    primaryTitle: 'Automotive constraint flow',
    primarySubtitle: 'Inspection and verified parts availability are separated from general activity.',
    stages: [
      datum('Qualified automotive demand', 618, '618', 'Vehicles, parts and mechanic opportunities'),
      datum('Asset / need inspected', 492, '492 · 79.6%', 'Condition, fitment or symptoms verified'),
      datum('Supply and terms confirmed', 347, '347 · 56.1%', 'Vehicle, part or bay capacity confirmed'),
      datum('BLKK order created', 257, '257 · 41.6%', 'Buyer receives controlled order'),
      datum('Fulfilment released', 221, '221 · 35.8%', 'Escrow and operational gates complete'),
    ],
    breakdown: [
      datum('Vehicle inspections', 126, '126% load', '17 vehicle deals waiting', 100, 'critical'),
      datum('Parts verification', 119, '119% load', 'Authenticity and fitment constraint', 100, 'critical'),
      datum('Advisor capacity', 91, '91% load', 'Near balanced', 100, 'neutral'),
      datum('Workshop bays', 82, '82% load', 'Some capacity available', 88, 'positive'),
      datum('Vehicle delivery', 106, '106% load', 'Long-distance handoff pressure', 100, 'warning'),
    ],
    exceptions: [
      exception('AUT-711', 'Vehicle inspection bay 2', 'AGL · Inspection', 'Workshop Operations', '9 hr', '17 deals / GHS 1.1M', 'Extend inspector shift', 'Critical'),
      exception('AUT-702', 'Toyota brake pad authenticity', 'Parts · Kumasi', 'Parts Verification', '8 hr', '46 qualified intents', 'Approve verified supplier batch', 'Critical'),
      exception('AUT-690', 'Fleet bid FLEET-82', 'Advisor · Corporate', 'Enterprise Advisors', '22 hr', '12 pickups / GHS 418K', 'Confirm viewing route', 'At risk'),
      exception('AUT-676', 'Civic delivery BLK-2048', 'Delivery · Tema to Kumasi', 'Auto Dispatch', '2 hr', 'Buyer promise in 5 hr', 'Assign recovery driver', 'Watch'),
    ],
  },
  estate: {
    title: 'Estate operating intelligence',
    question: 'Which verified property demand is blocked by title, mandate, viewing or deposit controls?',
    primaryMeasure: 'Verified listing-to-offer conversion',
    formula: 'Controlled offers created ÷ qualified intents on verified available listings',
    metrics: [
      metric('Verified listing → offer', '21.4%', 'Target 32.0%', '-10.6 pp', 'critical', 'Controlled offers divided by qualified demand on verified listings.'),
      metric('Title-ready listings', '72.8%', 'Target 95.0%', '-22.2 pp', 'critical', 'Published listings with current ownership and mandate evidence.'),
      metric('Viewing attendance', '68.2%', 'Target 82.0%', '-13.8 pp', 'warning', 'Completed viewings divided by confirmed appointments.'),
      metric('Deposits on hold', 'GHS 660K', 'GHS 420K beyond SLA', '+GHS 240K', 'critical', 'Escrow deposits awaiting a title, agreement or handover control.'),
    ],
    primaryTitle: 'Verified property demand funnel',
    primarySubtitle: 'Separates listing interest from title-ready, attended and controlled commercial outcomes.',
    stages: [
      datum('Qualified property intent', 412, '412', 'Buyer and renter demand accepted'),
      datum('Title-ready match', 300, '300 · 72.8%', 'Available property with ownership and mandate evidence'),
      datum('Viewing completed', 204, '204 · 49.5%', 'Agent-led viewing with evidence'),
      datum('Controlled offer', 88, '88 · 21.4%', 'Terms mediated by BLKK'),
      datum('Deposit secured', 61, '61 · 14.8%', 'Escrow-funded agreement path'),
    ],
    breakdown: [
      datum('Title evidence incomplete', 39, '39%', 'Registry, mandate or owner identity gap', 12, 'critical'),
      datum('Viewing availability', 23, '23%', 'Owner, agent or property access conflict', 15, 'warning'),
      datum('Terms unresolved', 18, '18%', 'Price, rent or condition negotiation', 16, 'warning'),
      datum('Deposit incomplete', 13, '13%', 'Escrow checkout abandoned', 10, 'warning'),
      datum('Document access', 7, '7%', 'Controlled document permission delay', 5, 'neutral'),
    ],
    exceptions: [
      exception('EST-441', 'Airport Hills owner mandate', 'Title · Airport Hills', 'Estate Trust Control', '31 hr', 'GHS 420K deposit', 'Obtain registry-backed mandate', 'Critical'),
      exception('EST-432', 'Airport Residential viewings', 'Viewings · Accra', 'Estate Advisor Pod', '17 hr', '9 qualified intents', 'Resolve owner access windows', 'At risk'),
      exception('EST-419', 'Two-bedroom listing cohort', 'Listings · Accra', 'Listing Quality', '11 hr', '12 unpublished assets', 'Complete title evidence', 'At risk'),
      exception('EST-405', 'Handover ER-221', 'Escrow · Cantonments', 'Estate Finance', '2 hr', 'GHS 240K eligible', 'Approve handover proof', 'Watch'),
    ],
  },
  farmers: {
    title: 'Farmers Market operating intelligence',
    question: 'Which production, quality, storage or pickup constraint is converting harvest into preventable loss?',
    primaryMeasure: 'Marketable yield retained',
    formula: 'Accepted marketable quantity ÷ verified harvested quantity',
    metrics: [
      metric('Marketable yield retained', '78.6%', 'Target 92.0%', '-13.4 pp', 'critical', 'Harvest quantity accepted after loss, quality and custody controls.'),
      metric('Post-harvest loss', '14.8%', 'Limit ≤ 6.0%', '+8.8 pp', 'critical', 'Verified harvested quantity lost before accepted sale or storage.'),
      metric('Grade acceptance', '84.1%', 'Target 95.0%', '-10.9 pp', 'warning', 'Aggregation lots accepted at declared grade on first review.'),
      metric('Pickup inside window', '79.4%', 'SLA 94.0%', '-14.6 pp', 'critical', 'Scheduled produce collected inside crop-specific handling window.'),
    ],
    primaryTitle: 'Harvest-to-market constraint flow',
    primarySubtitle: 'Measures quantity retained at each physical and control handoff.',
    stages: [
      datum('Forecast harvest', 1260, '1,260 t', 'Agent-verified production forecast'),
      datum('Harvest captured', 1124, '1,124 t · 89.2%', 'Harvest with weight and field evidence'),
      datum('Grade accepted', 945, '945 t · 75.0%', 'First-pass quality acceptance'),
      datum('Stored / allocated', 881, '881 t · 69.9%', 'Controlled storage or buyer allocation'),
      datum('Delivered accepted', 842, '842 t · 66.8%', 'Buyer acceptance with custody evidence'),
    ],
    breakdown: [
      datum('Quality grading', 126, '126% load', '31.6 t awaiting grade decision', 100, 'critical'),
      datum('Cold storage', 118, '118% load', 'Techiman capacity exceeded', 100, 'critical'),
      datum('Pickup fleet', 111, '111% load', 'Route and consolidation pressure', 100, 'warning'),
      datum('Aggregation weighing', 93, '93% load', 'Near balanced', 100, 'neutral'),
      datum('Field capture', 82, '82% load', 'Northern capacity transferable', 100, 'positive'),
    ],
    exceptions: [
      exception('FAR-711', 'Techiman maize cold-chain', 'Storage · Techiman', 'Cold Chain Desk', '4 hr', '18.4 t / GHS 126K', 'Move to Nkoranza cold store', 'Critical'),
      exception('FAR-702', 'Harvest grade review 881', 'Quality · Bono East', 'Aggregation Control', '6 hr', '31.6 t awaiting allocation', 'Add second grader', 'Critical'),
      exception('FAR-690', 'Northern plot sync batch', 'Field data · Northern', 'Field Platform', '7 hr', '284 records delayed', 'Retry conflict-resolved sync', 'At risk'),
      exception('FAR-676', 'Techiman pickup route 44', 'Logistics · Techiman', 'Produce Dispatch', '88 min', '8 farm stops', 'Resequence consolidation stops', 'Watch'),
    ],
  },
  label: {
    title: 'BLKK Label operating intelligence',
    question: 'Which collection, material or production constraint is preventing approved designs from selling through?',
    primaryMeasure: 'Collection sell-through at full margin',
    formula: 'Full-margin units sold ÷ released units available',
    metrics: [
      metric('Full-margin sell-through', '64.2%', 'Target 78.0%', '-13.8 pp', 'warning', 'Released units sold without markdown divided by units available.'),
      metric('Production plan attainment', '81.6%', 'Target 95.0%', '-13.4 pp', 'critical', 'First-pass accepted units divided by planned completed units.'),
      metric('Material yield', '88.7%', 'Target 94.0%', '-5.3 pp', 'warning', 'Accepted finished material output divided by material issued.'),
      metric('Ageing finished goods', 'GHS 237K', 'Limit ≤ GHS 120K', '+GHS 117K', 'critical', 'Finished-goods value older than collection threshold.'),
    ],
    primaryTitle: 'Finished-goods ageing',
    primarySubtitle: 'Collection value segmented by the action it now requires.',
    exceptions: [
      exception('LBL-711', 'Collection drop 06 release', 'Quality release · Accra', 'House Operations', '4 hr', 'GHS 118K stock blocked', 'Resolve size-spec rework', 'Critical'),
      exception('LBL-702', 'Imported fabric batch FB-22', 'Materials · Tema', 'Materials Control', '2 days', 'GHS 84K production dependency', 'Complete shade acceptance', 'At risk'),
      exception('LBL-690', 'Franchise allocation cycle', 'Franchise · Kumasi', 'Franchise Operations', '7 hr', '186 units awaiting transfer', 'Approve territory allocation', 'Watch'),
      exception('LBL-676', 'Drop 05 slow sizes', 'Inventory · Accra', 'Commercial Planning', '11 days', 'GHS 63K ageing value', 'Launch size-specific transfer', 'At risk'),
    ],
  },
  susu: {
    title: 'Susu Rail financial intelligence',
    question: 'Which payment, escrow or settlement break threatens safeguarded funds and participant trust?',
    primaryMeasure: 'Safeguarded ledger reconciliation',
    formula: 'Reconciled safeguarded funds ÷ externally held safeguarded funds',
    metrics: [
      metric('Safeguarded reconciliation', '98.6%', 'Required 100%', '-1.4 pp', 'critical', 'Ledger safeguarded balance matched to external providers and banks.'),
      metric('Payment success', '94.2%', 'SLO 99.0%', '-4.8 pp', 'critical', 'Payment attempts reaching a valid terminal state inside SLA.'),
      metric('Escrow release SLA', '86.9%', 'Target 98.0%', '-11.1 pp', 'warning', 'Eligible escrow instructions completed inside four hours.'),
      metric('Pool delinquency', '7.4%', 'Limit ≤ 3.0%', '+4.4 pp', 'critical', 'Due contribution value unpaid after grace window.'),
    ],
    primaryTitle: 'Safeguarded cash variance bridge',
    exceptions: [
      exception('SUS-620', 'MTN MoMo settlement 726B', 'Payments · MTN MoMo', 'Rail Reconciliation', '13 hr', 'GHS 92K unmatched', 'Reconcile callback references', 'Critical'),
      exception('SUS-612', 'Escrow release batch ER-31', 'Escrow · AutoHub', 'Treasury Control', '9 hr', 'GHS 240K eligible', 'Approve completion evidence', 'At risk'),
      exception('SUS-603', 'Pool cohort ASH-14', 'Susu pool · Ashanti', 'Pool Operations', '2 days', 'GHS 48K delinquent', 'Start controlled recovery', 'Critical'),
      exception('SUS-588', 'Card settlement CB-88', 'Payments · Card', 'Rail Reconciliation', '44 min', 'GHS 31K pending', 'Await provider settlement file', 'Watch'),
    ],
  },
  gold: {
    title: 'Precious Metals trust intelligence',
    question: 'Which lot, assay or custody control prevents a verified metal transaction from safely settling?',
    primaryMeasure: 'Verified custody-adjusted inventory',
    formula: 'Lots with accepted assay and complete custody evidence ÷ controlled inventory',
    metrics: [
      metric('Verified custody inventory', '91.3%', 'Required 100%', '-8.7 pp', 'critical', 'Controlled metal weight with accepted assay and complete custody evidence.'),
      metric('Assay variance', '1.8%', 'Tolerance ≤ 0.5%', '+1.3 pp', 'critical', 'Absolute declared-versus-accepted purity or weight variance.'),
      metric('License current', '96.4%', 'Required 100%', '-3.6 pp', 'warning', 'Active counterparties with verified current operating authority.'),
      metric('Settlement exposure', 'GHS 583K', 'Appetite ≤ GHS 200K', '+GHS 383K', 'critical', 'Settlement value blocked by assay, AML or custody controls.'),
    ],
    primaryTitle: 'Lot risk and custody matrix',
    exceptions: [
      exception('GLD-441', 'Lot AU-881 assay variance', 'Assay · Tarkwa', 'Metals Verification', '16 hr', '1.8 kg / GHS 486K', 'Order independent re-assay', 'Critical'),
      exception('GLD-432', 'Vault handoff media AU-876', 'Custody · Accra', 'Vault Control', '2 hr', '1.2 kg controlled lot', 'Capture two-person handoff', 'At risk'),
      exception('GLD-419', 'Dealer licence renewal D-44', 'Compliance · Obuasi', 'Metals Compliance', '3 days', '4 open lots restricted', 'Verify renewal receipt', 'Critical'),
      exception('GLD-405', 'Settlement GS-88', 'Settlement · Institutional', 'Metals Finance', '44 min', 'GHS 164K scheduled', 'Final assay sign-off', 'Watch'),
    ],
  },
};

export const getVerticalOverviewInsight = (
  workspace: ERPWorkspaceDefinition,
): ERPInsightDefinition => {
  const base = getERPInsightDefinition(workspace, '', workspace.shortName);
  return { ...base, ...(verticalOverrides[workspace.verticalId] || {}) };
};

export const getTenantRegistryInsight = (
  workspace: ERPWorkspaceDefinition,
  tenants: Tenant[],
): ERPInsightDefinition => {
  const registered = tenants.length;
  const evidenceReady = Math.max(0, registered - 1);
  const operating = Math.max(0, registered - 2);
  const slaHealthy = Math.max(0, registered - 3);
  const evidenceCoverage = registered ? Math.round((evidenceReady / registered) * 100) : 0;
  const operatingRate = registered ? Math.round((operating / registered) * 100) : 0;
  const exposure = tenants.reduce((sum, _, index) => sum + 38 + index * 17, 0);

  return {
    ...profiles.operations,
    id: `${workspace.id}:tenant-registry`,
    family: 'operations',
    title: `${workspace.shortName} tenant control`,
    question: `Which ${workspace.shortName.toLowerCase()} tenant ERP needs intervention before it can operate reliably?`,
    decisionOwner: `${workspace.shortName} Operations`,
    decision: 'Activate, support, restrict or escalate the tenant ERP',
    primaryMeasure: 'Operating tenant rate',
    formula: 'Tenant ERPs with accepted operating events in period ÷ registered tenant ERPs',
    comparator: 'Target ≥ 90%',
    grain: `${workspace.shortName} tenant ERP → capability → work item → event`,
    source: `${workspace.shortName} tenant registry fixture · operating-event fixture`,
    readiness: 'Fixture only',
    drillHierarchy: [workspace.shortName, 'Tenant ERP', 'Capability', 'Work item', 'Event'],
    metrics: [
      metric('Registered tenant ERPs', String(registered), 'Registry scope', `${registered} in scope`, 'neutral', 'Tenant ERPs assigned to this vertical only.'),
      metric('Evidence-ready', `${evidenceCoverage}%`, 'Target 100%', `${Math.max(0, registered - evidenceReady)} incomplete`, evidenceCoverage >= 90 ? 'positive' : 'warning', 'Tenant identity, authority and required operating evidence accepted.'),
      metric('Operating in period', `${operatingRate}%`, 'Target ≥ 90%', `${operating} of ${registered}`, operatingRate >= 90 ? 'positive' : 'critical', 'Tenant ERPs with accepted operating events in the current period.'),
      metric('Value at intervention', `GHS ${exposure}K`, 'Tolerance ≤ GHS 120K', `GHS ${Math.max(0, exposure - 120)}K above`, exposure <= 120 ? 'positive' : 'warning', 'Mock value exposed by unresolved tenant-level constraints.'),
    ],
    primaryTitle: `${workspace.shortName} activation flow`,
    primarySubtitle: 'Registered tenant ERPs progressing into reliable operations.',
    stages: [
      datum('Registered', registered, String(registered), `${registered} tenant ERPs assigned to ${workspace.shortName}`),
      datum('Authority verified', evidenceReady, `${evidenceReady} · ${evidenceCoverage}%`, 'Identity, ownership and operating authority accepted'),
      datum('Operating data ready', Math.max(0, registered - 2), String(Math.max(0, registered - 2)), 'Required catalogue, service or asset data accepted'),
      datum('Operating in period', operating, `${operating} · ${operatingRate}%`, 'Accepted commercial or operational event recorded'),
      datum('SLA healthy', slaHealthy, String(slaHealthy), 'No material overdue intervention'),
    ],
    breakdown: tenants.map((tenant, index) => {
      const pressure = Math.max(18, 82 - index * 9);
      return datum(
        tenant.name,
        pressure,
        `${pressure}% load`,
        `${4 + index * 3} open actions · GHS ${38 + index * 17}K exposed`,
        65,
        pressure > 75 ? 'critical' : pressure > 60 ? 'warning' : 'neutral',
      );
    }),
    matrix: [],
    exceptions: tenants.map((tenant, index) => exception(
      `TEN-${String(421 + index * 9)}`,
      `${tenant.name} operating constraint`,
      `${workspace.shortName} · ${tenant.type.replace(/_/g, ' ')}`,
      index % 2 === 0 ? `${workspace.shortName} Activation` : `${workspace.shortName} Operations`,
      `${2 + index * 3} hr`,
      `GHS ${38 + index * 17}K · ${4 + index * 3} actions`,
      index % 3 === 0 ? 'Complete operating evidence' : index % 3 === 1 ? 'Clear fulfilment backlog' : 'Reconcile inventory events',
      index === 0 ? 'Critical' : index < 3 ? 'At risk' : index === tenants.length - 1 ? 'On track' : 'Watch',
    )),
    meta: {
      period: '30 days',
      asOf: '28 Jul 2026 · 06:00 GMT',
      population: `${registered} ${workspace.shortName} tenant ERPs`,
      observations: `${(registered * 1247).toLocaleString('en-GH')} tenant events`,
      freshness: '10 min',
      confidence: 88,
      coverage: evidenceCoverage,
    },
    trace: {
      objective: `Operate reliable ${workspace.shortName.toLowerCase()} tenant ERPs`,
      capability: 'Tenant lifecycle control',
      valueStream: 'Tenant registration to accepted operation',
      process: `${workspace.shortName} tenant registry`,
      decision: 'Activate, support, restrict or escalate',
      event: 'tenant.operating_status_changed',
    },
  };
};

const tenantDisplayValue = (value: string, seed: number, index: number) => {
  const match = value.match(/-?[\d,.]+/);
  if (!match) return value;
  const numeric = Number(match[0].replace(/,/g, ''));
  if (!Number.isFinite(numeric)) return value;
  const shift = ((seed + index * 3) % 7) - 3;
  let adjusted = numeric;

  if (value.includes('%')) adjusted = Math.max(0, Math.min(100, numeric + shift * 0.8));
  else if (value.toLowerCase().includes('day')) adjusted = Math.max(1, numeric + shift * 2);
  else adjusted = Math.max(1, numeric * (0.42 + (seed % 5) * 0.06));

  const precision = value.includes('.') ? 1 : 0;
  const rendered = adjusted.toLocaleString('en-GH', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  return value.replace(match[0], rendered);
};

export const getTenantOverviewInsight = (
  workspace: ERPWorkspaceDefinition,
  tenant: Tenant,
): ERPInsightDefinition => {
  const base = getVerticalOverviewInsight(workspace);
  const seed = tenant.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const observationCount = 1380 + seed % 4200;

  return {
    ...base,
    id: `${workspace.id}:tenant:${tenant.id}`,
    title: `${tenant.name} operating view`,
    grain: `${tenant.name} → process → work item → event`,
    metrics: base.metrics.map((item, index) => ({
      ...item,
      value: tenantDisplayValue(item.value, seed, index),
      performance: Math.max(18, Math.min(96, item.performance + ((seed + index * 5) % 17) - 8)),
    })),
    exceptions: base.exceptions.map((item, index) => ({
      ...item,
      id: `${tenant.id.slice(0, 3).toUpperCase()}-${String(410 + index * 9 + seed % 31)}`,
      segment: `${tenant.name} · ${item.segment.split('·').pop()?.trim() || item.segment}`,
    })),
    meta: {
      ...base.meta,
      population: `${tenant.name} · tenant scope`,
      observations: `${observationCount.toLocaleString('en-GH')} tenant events`,
      confidence: Math.max(72, Math.min(97, base.meta.confidence + (seed % 9) - 4)),
      coverage: Math.max(75, Math.min(99, base.meta.coverage + (seed % 7) - 3)),
    },
    trace: {
      ...base.trace,
      process: tenant.name,
      event: `${tenant.id}.work_item_status_changed`,
    },
  };
};
