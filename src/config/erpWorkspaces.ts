import {
  Activity,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bot,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Car,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  CloudCog,
  Code2,
  Contact,
  CreditCard,
  Database,
  FileCheck2,
  FileText,
  FlaskConical,
  Globe2,
  HandCoins,
  Headphones,
  House,
  IdCard,
  Landmark,
  LayoutDashboard,
  Leaf,
  Megaphone,
  MessageSquare,
  MonitorSmartphone,
  Network,
  Package,
  PackageCheck,
  PanelTop,
  Radio,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  Tags,
  TestTube2,
  Truck,
  Users,
  UserRoundCog,
  WalletCards,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { VerticalId } from '../types';

export type ERPLevel = 'ecosystem' | 'vertical' | 'platform' | 'product' | 'tenant';

export interface ERPModuleDefinition {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface ERPSectionDefinition {
  label: string;
  modules: ERPModuleDefinition[];
}

export interface ERPWorkspaceDefinition {
  id: string;
  name: string;
  shortName: string;
  descriptor: string;
  level: ERPLevel;
  basePath: string;
  parentPath?: string;
  parentLabel?: string;
  verticalId: VerticalId;
  sections: ERPSectionDefinition[];
}

const module = (id: string, label: string, description: string, icon: LucideIcon): ERPModuleDefinition => ({
  id,
  label,
  description,
  icon,
});

const overview = (label = 'Central Hub') => module('', label, 'Executive pulse, operating signals and exceptions.', LayoutDashboard);

export const GLOBAL_ERP: ERPWorkspaceDefinition = {
  id: 'ecosystem',
  name: 'Adinkra Command Center',
  shortName: 'Command',
  descriptor: 'Ecosystem ERP',
  level: 'ecosystem',
  basePath: '/',
  verticalId: 'global',
  sections: [
    {
      label: 'Ecosystem control',
      modules: [
        overview('Command Center'),
        module('portfolio-intelligence', 'Portfolio Intelligence', 'Performance and risk across every vertical and product.', ChartNoAxesCombined),
        module('cross-vertical-ops', 'Cross-Vertical Ops', 'Dependencies, shared workflows and operational handoffs.', Network),
        module('central-logistics', 'Central Logistics', 'Fleet, routes, dispatch and fulfilment across the ecosystem.', Truck),
        module('treasury', 'Finance & Treasury', 'Revenue, cash, escrow, payouts and liabilities.', Landmark),
        module('trust-control', 'Trust & Verification', 'KYC, asset verification, fraud and institutional controls.', ShieldCheck),
      ],
    },
    {
      label: 'Intelligence',
      modules: [
        module('intelligence', 'Evidence Explorer', 'Registered claims, contributing records, events and original evidence.', Search),
        module('ontology', 'Ontology & Entities', 'Canonical entities, relationships and data lineage.', Database),
        module('ai-operations', 'AI Operations', 'Models, recommendations, exceptions and human review.', Bot),
        module('institutional-reporting', 'Institutional Reporting', 'Regulator, lender, insurer and tax-ready outputs.', FileText),
        module('system-health', 'Platform & SRE', 'Availability, latency, incidents and integrations.', CloudCog),
      ],
    },
  ],
};

const vertical = (
  id: VerticalId,
  name: string,
  shortName: string,
  basePath: string,
  sections: ERPSectionDefinition[],
): ERPWorkspaceDefinition => ({
  id,
  name,
  shortName,
  descriptor: 'Vertical ERP',
  level: 'vertical',
  basePath,
  parentPath: '/',
  parentLabel: 'Adinkra Command Center',
  verticalId: id,
  sections,
});

export const VERTICAL_ERPS: Partial<Record<VerticalId, ERPWorkspaceDefinition>> = {
  merchant: vertical('merchant', 'Merchants Central', 'Merchants', '/merchant', [
    {
      label: 'Commerce operations',
      modules: [
        overview(),
        module('tenants', 'Merchant Tenants', 'Stores, branches, traders and operating ERPs.', Building2),
        module('catalogue', 'Catalogue & Listings', 'Products, variants, media, quality and publication.', Tags),
        module('inventory', 'Inventory Control', 'Stock, batches, adjustments, ageing and availability.', Warehouse),
        module('orders', 'BLKK Orders', 'Platform-owned order lifecycle and SLA control.', ShoppingCart),
        module('fulfilment', 'Fulfilment', 'Pick, pack, handoff, delivery and proof of completion.', PackageCheck),
        module('logistics', 'BLKK Logistics', 'Dispatch, routing, drivers, exceptions and returns.', Truck),
      ],
    },
    {
      label: 'Commercial control',
      modules: [
        module('advisor-desk', 'Advisor & CRM', 'BLKK-managed leads, conversations and order creation.', Headphones),
        module('customers', 'Customer Intelligence', 'Cohorts, LTV, service history and consent.', Contact),
        module('payments', 'Payments & Escrow', 'MoMo, cards, holds, releases, refunds and disputes.', WalletCards),
        module('payouts', 'Payouts & Reconciliation', 'Merchant settlement, fees and variance resolution.', ReceiptText),
        module('procurement', 'Procurement & Suppliers', 'Purchase plans, supplier quality and replenishment.', Boxes),
        module('marketing', 'Growth & Marketing', 'Campaigns, attribution, promotions and retention.', Megaphone),
      ],
    },
    {
      label: 'Enterprise',
      modules: [
        module('workforce', 'Workforce', 'People, shifts, productivity, training and commissions.', Users),
        module('support', 'Support & Disputes', 'Cases, escalations, returns and service recovery.', MessageSquare),
        module('finance', 'Finance', 'P&L, cash, taxes, receivables and controls.', Banknote),
        module('audit', 'Reports & Audit', 'Evidence packs, ledger history and export controls.', FileCheck2),
      ],
    },
  ]),
  autos: vertical('autos', 'AutoHub Central', 'AutoHub', '/autos', [
    {
      label: 'Automotive operations',
      modules: [
        overview(),
        module('tenants', 'Auto Tenants', 'Dealers, workshops, parts sellers and fleet operators.', Building2),
        module('vehicles', 'Vehicles & Fleet', 'Vehicles, condition, provenance, pricing and availability.', Car),
        module('parts', 'Parts & Inventory', 'Parts catalogue, authenticity, fitment and stock.', Package),
        module('workshops', 'Workshops & Mechanics', 'Bookings, job cards, labour, bays and quality.', Wrench),
        module('inspections', 'Inspection Control', 'Vehicle evidence, checklists and third-party reports.', ClipboardCheck),
        module('test-drives', 'Test Drives & Viewings', 'Appointments, agents, routes and outcomes.', Activity),
      ],
    },
    {
      label: 'Deal and fulfilment',
      modules: [
        module('advisor-desk', 'Advisor & CRM', 'BLKK-managed enquiries, bids and deal progression.', Headphones),
        module('orders', 'Orders', 'Vehicles, parts and mechanic orders in one ledger.', ShoppingCart),
        module('payments', 'Escrow & Payments', 'Secure holds, releases, refunds and reconciliation.', HandCoins),
        module('logistics', 'Delivery & Logistics', 'White-labelled dispatch, tracking and proof of delivery.', Truck),
        module('financing', 'Financing', 'Pre-qualification, offers, affordability and lender handoff.', CircleDollarSign),
        module('insurance', 'Insurance', 'Quotes, policies, risk and claims handoff.', ShieldCheck),
        module('trade-ins', 'Trade-In Desk', 'Valuation, inspection and settlement differences.', Car),
      ],
    },
    {
      label: 'Enterprise',
      modules: [
        module('customers', 'Customer Intelligence', 'Ownership, service, purchase and engagement history.', Contact),
        module('workforce', 'Workforce', 'Mechanics, advisors, agents, shifts and productivity.', Users),
        module('marketing', 'Growth & Marketing', 'Demand, attribution, pricing alerts and retention.', Megaphone),
        module('finance', 'Finance', 'Margins, cash, receivables, taxes and controls.', Banknote),
        module('audit', 'Reports & Audit', 'Vehicle, payment and operational evidence packs.', FileCheck2),
      ],
    },
  ]),
  estate: vertical('estate', 'Estate Central', 'Estate', '/estate', [
    {
      label: 'Property operations',
      modules: [
        overview(),
        module('tenants', 'Estate Tenants', 'Agencies, landlords, developers and property managers.', Building2),
        module('properties', 'Properties & Listings', 'Units, land, media, pricing and publication.', House),
        module('owners', 'Owners & Mandates', 'Ownership, representation and listing authority.', IdCard),
        module('verification', 'Title & Verification', 'Documents, site evidence, identity and risk.', ShieldCheck),
        module('viewings', 'Viewings & Inspections', 'Appointments, agents, reports and follow-ups.', ClipboardCheck),
        module('maintenance', 'Maintenance', 'Requests, vendors, costs and completion evidence.', Wrench),
      ],
    },
    {
      label: 'Commercial control',
      modules: [
        module('advisor-desk', 'Advisor & CRM', 'BLKK-managed enquiries, negotiations and offers.', Headphones),
        module('offers', 'Offers & Agreements', 'Terms, approvals, reservations and controlled documents.', FileText),
        module('payments', 'Escrow & Payments', 'Deposits, rent, holds, releases and refunds.', WalletCards),
        module('customers', 'Customer Intelligence', 'Buyer, renter and investor cohorts and histories.', Contact),
        module('marketing', 'Growth & Marketing', 'Listing attribution, campaigns and demand gaps.', Megaphone),
      ],
    },
    {
      label: 'Enterprise',
      modules: [
        module('workforce', 'Workforce', 'Agents, inspectors, vendors and productivity.', Users),
        module('finance', 'Finance', 'Commissions, rent, deposits, receivables and tax.', Banknote),
        module('audit', 'Reports & Audit', 'Title, inspection, agreement and payment evidence.', FileCheck2),
      ],
    },
  ]),
  farmers: vertical('farmers', 'Farmers Market Central', 'Farmers', '/farmers', [
    {
      label: 'Production & supply',
      modules: [
        overview(),
        module('tenants', 'Farmer Tenants', 'Co-operatives, aggregators, farms and input suppliers.', Building2),
        module('farmers', 'Farmers & Co-ops', 'Identity, membership, capacity and relationships.', Users),
        module('plots', 'Farms & Plots', 'GPS boundaries, tenure, crop history and conditions.', Leaf),
        module('yield', 'Harvest & Yield', 'Forecasts, harvest evidence, loss and productivity.', BarChart3),
        module('quality', 'Quality & Grading', 'Grades, contamination, certification and rejection.', BadgeCheck),
        module('aggregation', 'Aggregation Lots', 'Batches, weights, custody, ownership and valuation.', Boxes),
        module('inventory', 'Inventory & Storage', 'Warehouses, ageing, conditions and loss controls.', Warehouse),
      ],
    },
    {
      label: 'Trade & fulfilment',
      modules: [
        module('orders', 'BLKK Orders', 'Institutionally controlled produce and input orders.', ShoppingCart),
        module('logistics', 'Logistics & Routing', 'Pickup, consolidation, transport and delivery evidence.', Truck),
        module('cold-chain', 'Cold Chain', 'Temperature, dwell time, spoilage and interventions.', Activity),
        module('inputs', 'Inputs & Procurement', 'Seed, fertiliser, equipment and group purchasing.', ShoppingBag),
        module('payments', 'Payments & Settlement', 'Escrow, farmer settlement and reconciliation.', HandCoins),
        module('credit', 'Credit & Insurance', 'Eligibility, risk, loans, cover and claims.', CircleDollarSign),
      ],
    },
    {
      label: 'Enterprise',
      modules: [
        module('traceability', 'Traceability', 'Farm-to-order lineage and compliance evidence.', FileCheck2),
        module('workforce', 'Agents & Workforce', 'Field agents, extension officers and productivity.', Users),
        module('marketing', 'Market Intelligence', 'Demand, price signals, seasonality and buyers.', Megaphone),
        module('finance', 'Finance', 'Margins, co-op accounts, receivables and controls.', Banknote),
        module('audit', 'Reports & Audit', 'Food security, sustainability and regulator outputs.', FileText),
      ],
    },
  ]),
  label: vertical('label', 'BLKK Label Central', 'Label', '/label', [
    {
      label: 'House operations',
      modules: [
        overview(),
        module('tenants', 'Houses & Franchises', 'Fashion houses, studios, stores and franchise operators.', Building2),
        module('collections', 'Collections', 'Concepts, approvals, drops and commercial readiness.', Sparkles),
        module('design', 'Design & Sampling', 'Design files, samples, revisions and sign-off.', TestTube2),
        module('production', 'Production', 'Work orders, capacity, quality and completion.', Settings),
        module('inventory', 'Materials & Inventory', 'Fabric, trims, finished goods and stock movement.', Warehouse),
        module('orders', 'BLKK Orders', 'Platform orders, fulfilment and returns.', ShoppingCart),
      ],
    },
    {
      label: 'Commercial & enterprise',
      modules: [
        module('franchise', 'Franchise Operations', 'Territories, standards, fees and performance.', Store),
        module('payments', 'Payments & Payouts', 'Escrow, settlements, royalties and reconciliation.', WalletCards),
        module('logistics', 'Logistics', 'Production movement, dispatch and delivery.', Truck),
        module('customers', 'Customer Intelligence', 'Cohorts, sizing, preferences and lifetime value.', Contact),
        module('marketing', 'Campaigns & Drops', 'Launches, creators, attribution and sell-through.', Megaphone),
        module('workforce', 'Workforce', 'Designers, makers, stores and productivity.', Users),
        module('finance', 'Finance', 'Collection economics, cash and controls.', Banknote),
        module('audit', 'Reports & Audit', 'Approval, production and payment history.', FileCheck2),
      ],
    },
  ]),
  susu: vertical('susu', 'Susu Rail & Payments', 'Susu Rail', '/susu', [
    {
      label: 'Financial operations',
      modules: [
        overview(),
        module('wallets', 'Wallets & Accounts', 'Balances, holds, limits and account state.', WalletCards),
        module('payments', 'Payment Orchestration', 'MoMo, cards, bank, cash and callback control.', CreditCard),
        module('escrow', 'Escrow Control', 'Holds, conditions, releases, refunds and disputes.', ShieldCheck),
        module('pools', 'Susu Pools', 'Membership, contribution cycles, turns and delinquency.', Users),
        module('settlement', 'Settlement', 'Merchant and participant payouts and reconciliation.', ReceiptText),
        module('risk', 'Risk & Compliance', 'AML, KYC, fraud signals, limits and review.', BadgeCheck),
        module('ledger', 'Ledger & Treasury', 'Double-entry events, cash position and safeguarding.', Landmark),
        module('audit', 'Reports & Audit', 'Regulatory, tax and financial evidence packs.', FileCheck2),
      ],
    },
  ]),
  gold: vertical('gold', 'Precious Metals Central', 'Precious Metals', '/gold', [
    {
      label: 'Metals operations',
      modules: [
        overview(),
        module('tenants', 'Miner & Dealer Tenants', 'Licensed actors and their operating ERPs.', Building2),
        module('lots', 'Lots & Inventory', 'Weight, purity, valuation, custody and availability.', Boxes),
        module('assay', 'Assay & Verification', 'Testing, certificates, anomalies and acceptance.', FlaskConical),
        module('orders', 'BLKK Orders', 'Controlled offers, orders and institutional buyers.', ShoppingCart),
        module('vault', 'Vault & Custody', 'Locations, movements, access and balances.', ShieldCheck),
        module('logistics', 'Secure Logistics', 'Chain of custody, routing and delivery evidence.', Truck),
        module('payments', 'Escrow & Settlement', 'Holds, settlement, fees and reconciliation.', HandCoins),
        module('compliance', 'Compliance', 'Licensing, AML, provenance and regulator reporting.', FileCheck2),
        module('finance', 'Finance', 'Valuation, exposure, margin, taxes and cash.', Landmark),
      ],
    },
  ]),
  agents: vertical('agents', 'Field Agents Central', 'Agents', '/agents', [
    {
      label: 'Field operations',
      modules: [
        overview(),
        module('tenants', 'Agent Networks', 'Regional networks, franchise cells and field teams.', Building2),
        module('assignments', 'Assignments', 'Issued jobs, ownership, deadlines and outcomes.', BriefcaseBusiness),
        module('visits', 'Field Visits', 'GPS visits, duration, forms and evidence.', Activity),
        module('verification', 'Verification Queue', 'KYC, inventory and asset adjudication.', BadgeCheck),
        module('listings', 'Listings Capture', 'Ground-truth inventory and asset digitisation.', Package),
        module('onboarding', 'Merchant Onboarding', 'KYC, storefront evidence and activation.', IdCard),
        module('collections', 'Collections', 'Receipts, custody and reconciliation.', HandCoins),
        module('commissions', 'Commissions', 'Accepted work, earnings and payouts.', CircleDollarSign),
        module('sync', 'Offline Sync', 'Device payloads, retries and data freshness.', Radio),
        module('quality', 'Quality & Risk', 'Duplicates, evidence gaps and anomalies.', ShieldCheck),
        module('workforce', 'Workforce & Training', 'Roster, training, safety and productivity.', Users),
        module('audit', 'Reports & Audit', 'Field evidence and immutable activity history.', FileCheck2),
      ],
    },
  ]),
};

export const DIGITAL_PLATFORM_ERP: ERPWorkspaceDefinition = {
  id: 'digital-platforms',
  name: 'Digital Products Central',
  shortName: 'Digital',
  descriptor: 'Platform ERP',
  level: 'platform',
  basePath: '/apps-website',
  parentPath: '/',
  parentLabel: 'Adinkra Command Center',
  verticalId: 'appsWebsite',
  sections: [
    {
      label: 'Portfolio control',
      modules: [
        overview('Portfolio Command'),
        module('websites', 'Website Portfolio', 'Properties, routes, journeys and runtime quality.', Globe2),
        module('native-apps', 'Native App Portfolio', 'Apps, screens, workflows, releases and quality.', Smartphone),
        module('users', 'Identity & Audience', 'Anonymous-to-account identity and cross-product cohorts.', Users),
        module('journeys', 'Cross-Product Journeys', 'Handoffs between web, apps, advisors and fulfilment.', Network),
        module('experiments', 'Experiments', 'Feature tests, cohorts, outcomes and guardrails.', FlaskConical),
      ],
    },
    {
      label: 'Product operations',
      modules: [
        module('releases', 'Release Control', 'Versions, rollout, adoption and rollback readiness.', Code2),
        module('reliability', 'Reliability & SRE', 'Crashes, errors, latency, incidents and dependencies.', CloudCog),
        module('notifications', 'Notifications', 'Push, SMS, email and in-app delivery outcomes.', MessageSquare),
        module('attribution', 'Growth Attribution', 'Campaign, source, conversion and retention.', Megaphone),
        module('integrations', 'Integrations', 'APIs, SDKs, partners and data contracts.', Settings),
        module('security', 'Security & Audit', 'Sessions, permissions, threats and event lineage.', ShieldCheck),
      ],
    },
  ],
};

const product = (
  id: string,
  name: string,
  shortName: string,
  basePath: string,
  modules: ERPModuleDefinition[],
): ERPWorkspaceDefinition => ({
  id,
  name,
  shortName,
  descriptor: 'Product ERP',
  level: 'product',
  basePath,
  parentPath: '/apps-website',
  parentLabel: 'Digital Products Central',
  verticalId: 'appsWebsite',
  sections: [
    { label: 'Product operations', modules },
    {
      label: 'Technology & control',
      modules: [
        module('users', 'Users & Cohorts', 'Identity, consent, cohorts and retention.', Users),
        module('notifications', 'Notifications', 'Push, SMS, email and delivery outcomes.', MessageSquare),
        module('releases', 'Releases', 'Versions, adoption, flags and rollback readiness.', Code2),
        module('reliability', 'Reliability', 'Errors, crashes, latency, sync and incidents.', CloudCog),
        module('security', 'Security & Audit', 'Sessions, permissions, threats and event lineage.', ShieldCheck),
      ],
    },
  ],
});

export const PRODUCT_ERPS: Record<string, ERPWorkspaceDefinition> = {
  'blkk-star-hub': product('blkk-star-hub', 'BLKK Star Hub', 'Star Hub', '/apps-website/website/blkk-star-hub', [
    overview('Website Command'),
    module('routes', 'Routes & Surfaces', 'Pages, vertical hubs, traffic and runtime quality.', PanelTop),
    module('search', 'Search & Discovery', 'Queries, filters, ranking, zero results and recommendations.', Search),
    module('catalogue', 'Marketplace Catalogue', 'Cross-vertical assets, products and publication quality.', Tags),
    module('advisor-crm', 'Advisor & CRM', 'BLKK-managed enquiries, bids, threads and order creation.', Headphones),
    module('commerce', 'Commerce & Checkout', 'Cart, delivery details, price and order orchestration.', ShoppingCart),
    module('payments', 'Escrow & Payments', 'MoMo, cards, holds, releases, refunds and disputes.', WalletCards),
    module('orders', 'Orders', 'Cross-vertical order status, ownership and SLA.', ReceiptText),
    module('logistics', 'BLKK Delivery', 'Dispatch, white-labelled tracking and delivery evidence.', Truck),
    module('trust', 'Trust & Verification', 'Seller, asset, listing and document credibility.', BadgeCheck),
    module('support', 'Customer Support', 'Cases, conversations and service recovery.', Headphones),
    module('growth', 'Growth & Content', 'CMS, SEO, campaigns, attribution and experiments.', Megaphone),
  ]),
  'blkk-autos': product('blkk-autos', 'BLKK Autos App', 'Autos App', '/apps-website/apps/blkk-autos', [
    overview('App Command'),
    module('discovery', 'Vehicle Discovery', 'Search, recommendations, compare and saved vehicles.', Search),
    module('vehicles', 'Vehicle Detail', 'Verified asset content, condition and engagement.', Car),
    module('advisor-crm', 'Advisor & Leads', 'Enquiries, bids, appointments and order creation.', Headphones),
    module('parts', 'Parts Commerce', 'Catalogue, fitment, secure-part and fulfilment.', Package),
    module('mechanics', 'Mechanics', 'Service discovery, booking, diagnostic payment and tracking.', Wrench),
    module('orders', 'Orders', 'Vehicle, part and mechanic orders in one lifecycle.', ShoppingCart),
    module('payments', 'Payments', 'Wallet, MoMo, escrow and payment recovery.', WalletCards),
    module('delivery', 'Blkk Delivery', 'Status, live tracking, ETA and proof of delivery.', Truck),
  ]),
  merchants: product('merchants', 'BLKK Merchants App', 'Merchant App', '/apps-website/apps/merchants', [
    overview('App Command'),
    module('catalogue', 'Catalogue Capture', 'Products, variants, media, quality and publication.', Tags),
    module('inventory', 'Inventory', 'Counts, movements, availability and offline changes.', Warehouse),
    module('orders', 'BLKK Orders', 'Acceptance, pick, pack and fulfilment handoff.', ShoppingCart),
    module('payouts', 'Payouts', 'Settlement, fees, variance and history.', ReceiptText),
    module('support', 'Merchant Support', 'Cases, guidance and operational recovery.', Headphones),
  ]),
  farmers: product('farmers', 'BLKK Farmers App', 'Farmers App', '/apps-website/apps/farmers', [
    overview('App Command'),
    module('farmers', 'Farmer Roster', 'Identity, co-op and relationship records.', Users),
    module('plots', 'Plot Surveys', 'GPS, land, crop and condition capture.', Leaf),
    module('yield', 'Yield Capture', 'Harvest, loss, media and form evidence.', BarChart3),
    module('aggregation', 'Aggregation', 'Lots, grades, weights and chain of custody.', Boxes),
    module('logistics', 'Pickup & Logistics', 'Handoffs, routing and delivery evidence.', Truck),
    module('offline', 'Offline Operations', 'Payloads, storage, retries and conflict resolution.', Radio),
  ]),
  estate: product('estate', 'BLKK Estate App', 'Estate App', '/apps-website/apps/estate', [
    overview('App Command'),
    module('discovery', 'Property Discovery', 'Search, filters, recommendations and saved properties.', Search),
    module('properties', 'Property Detail', 'Verified content, media and document visibility.', House),
    module('advisor-crm', 'Advisor & Enquiries', 'BLKK-managed interest, conversations and offers.', Headphones),
    module('inspections', 'Inspections', 'Bookings, reports, issues and evidence.', ClipboardCheck),
    module('documents', 'Documents', 'Title, agreements and controlled access.', FileText),
    module('payments', 'Deposits & Escrow', 'Secure holds, releases and refunds.', WalletCards),
  ]),
  'label-admin': product('label-admin', 'BLKK Label Admin', 'Label Admin', '/apps-website/apps/label-admin', [
    overview('Admin Command'),
    module('houses', 'Houses & Access', 'House identities, roles and restricted access.', Building2),
    module('collections', 'Collection Approval', 'Submission, four-eye approval and publication.', Sparkles),
    module('production', 'Production Board', 'Work orders, capacity, quality and completion.', Settings),
    module('inventory', 'Inventory', 'Materials, finished goods and stock movement.', Warehouse),
    module('orders', 'Orders & Fulfilment', 'BLKK orders, handoff, delivery and returns.', ShoppingCart),
    module('franchise', 'Franchise Oversight', 'Standards, fees, territories and performance.', Store),
  ]),
};

export const ERP_SWITCHER = [
  { label: 'Command Center', path: '/', icon: LayoutDashboard, verticalId: 'global' as VerticalId },
  { label: 'Merchants', path: '/merchant', icon: Store, verticalId: 'merchant' as VerticalId },
  { label: 'AutoHub', path: '/autos', icon: Car, verticalId: 'autos' as VerticalId },
  { label: 'Estate', path: '/estate', icon: House, verticalId: 'estate' as VerticalId },
  { label: 'Farmers Market', path: '/farmers', icon: Leaf, verticalId: 'farmers' as VerticalId },
  { label: 'BLKK Label', path: '/label', icon: Sparkles, verticalId: 'label' as VerticalId },
  { label: 'Digital Products', path: '/apps-website', icon: MonitorSmartphone, verticalId: 'appsWebsite' as VerticalId },
  { label: 'Susu Rail', path: '/susu', icon: WalletCards, verticalId: 'susu' as VerticalId },
  { label: 'Precious Metals', path: '/gold', icon: Landmark, verticalId: 'gold' as VerticalId },
  { label: 'Field Agents', path: '/agents', icon: UserRoundCog, verticalId: 'agents' as VerticalId },
];

export const getWorkspaceForPath = (pathname: string): ERPWorkspaceDefinition => {
  if (pathname.startsWith('/apps-website/website/blkk-star-hub')) return PRODUCT_ERPS['blkk-star-hub'];

  const appMatch = pathname.match(/^\/apps-website\/apps\/([^/]+)/);
  if (appMatch && PRODUCT_ERPS[appMatch[1]]) return PRODUCT_ERPS[appMatch[1]];

  if (pathname.startsWith('/apps-website')) return DIGITAL_PLATFORM_ERP;

  const firstSegment = pathname.split('/').filter(Boolean)[0] as VerticalId | undefined;
  if (firstSegment && VERTICAL_ERPS[firstSegment]) return VERTICAL_ERPS[firstSegment]!;

  return GLOBAL_ERP;
};

export const getModuleHref = (workspace: ERPWorkspaceDefinition, moduleId: string) => {
  if (!moduleId) return workspace.basePath;
  return workspace.basePath === '/' ? `/${moduleId}` : `${workspace.basePath}/${moduleId}`;
};

export const getModuleForWorkspace = (workspace: ERPWorkspaceDefinition, moduleId: string) =>
  workspace.sections.flatMap((section) => section.modules).find((item) => item.id === moduleId);
