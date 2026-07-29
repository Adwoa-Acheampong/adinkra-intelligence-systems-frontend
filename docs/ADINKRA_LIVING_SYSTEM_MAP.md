# Adinkra Living System Map

**Purpose:** The maintained map of what exists, what question it answers, what feeds it, and what remains incomplete.  
**Update rule:** Every accepted build slice updates this file in the same change.  
**Last reviewed:** 28 July 2026

## 1. Status Legend

| Status | Meaning |
|---|---|
| Operational | Purpose-built workflow, realistic fixture or live source, working drill and action |
| Analytical | Purpose-built intelligence, registered decision intent, meaningful drill |
| Partial | Useful implementation exists but lacks part of the contract, drill, action, state, or evidence |
| Declared | Route and navigation exist; content is generic or placeholder |
| Unmapped | Workflow and ontology have not been accepted |

## 2. Scope Map

| Scope | Route pattern | Primary question |
|---|---|---|
| Continental ecosystem | `/` | What requires executive attention across the conglomerate? |
| Evidence explorer | `/intelligence?metric=:metricId` | What does this claim mean, which records contribute, and what original evidence proves it? |
| Vertical central | `/:vertical` | What constraint, risk, or opportunity exists across this vertical? |
| Digital client central | `/apps-website` | What is happening across the website and native apps as software products? |
| Product telemetry | `/apps-website/website/:id`, `/apps-website/apps/:id` | What is happening in this specific website or app? |
| Tenant ERP | `/:vertical/tenant/:tenantId` | What is happening in this company across all departments? |
| Tenant module | `/:vertical/tenant/:tenantId/:module` | What is happening in this department and what work must be done? |
| System control | `/system-config` | What controls identity, ontology, data contracts, audit, and system health? |
| Entity drill | Planned `/entity/:type/:id` | What is happening to this exact person, asset, product, case, or transaction? |
| Metric drill | `/intelligence?metric=:metricId` | What does this value mean and what records create it? |
| Geographic scope | Planned `/scope/:scopeType/:scopeId` | What is happening in this city, country, or region? |
| Intelligence search | `/intelligence?q=:question` | Which registered claim answers this question and what evidence supports it? |

## 3. Central ERP Directory

| ERP | Route | Intended decision | Current status | Next acceptance need |
|---|---|---|---|---|
| Continental Command Center | `/` | Allocate capital and attention across verticals, countries, and constraints | Partial | Scope-aware portfolio, geography, trust, value at risk, metric drill |
| Evidence Explorer | `/intelligence` | Validate registered claims and drill through contributor, source event, and original evidence | Analytical | Backend adapters and migration of existing dashboard metrics |
| Merchants Central | `/merchant` | Improve verified availability, fulfilment, merchant trust, and working capital | Partial | Merchant-specific metrics and tenant/product drill |
| AutoHub Central | `/autos` | Improve service capacity, quality, parts coverage, and vehicle support | Partial | Multi-tenant/city aggregation and mechanic search |
| Estate Central | `/estate` | Improve verified supply, inspection, title trust, yield, and occupancy | Partial | Estate ontology, agencies, properties, documents, geography |
| Farmers Market Central | `/farmers` | Improve yield, quality, aggregation, fulfilment, finance, and loss | Partial | Plot-to-lot chain, loss denominator, co-op drill |
| BLKK Label Central | `/label` | Improve collection, production, inventory, fulfilment, and house performance | Partial | House/collection/production trace |
| Susu Rail | `/susu` | Improve contribution integrity, settlement, delinquency, and trust | Declared | Workflow map and financial-event model |
| Precious Metals Central | `/gold` | Improve verified value, assay, custody, compliance, and settlement | Partial | Lot/assay/custody trace |
| Field Agents Central | `/agents` | Improve coverage, verification, onboarding, sync, and agent quality | Partial | Connect accepted agent observations to tenant and entity records |
| Websites & Apps | `/apps-website` | Improve software acquisition, stability, performance, release, and sync | Partial | Clean web-versus-app central aggregate and product drill |
| System Configuration | `/system-config` | Govern shared system rules and health | Partial | Ontology, metric registry, scope, policy, contract, and lineage control |

## 4. Website and Native App Map

There is one integrated commerce website.

| Product | Type | Route | Business-domain data lives in | This route measures |
|---|---|---|---|---|
| BLKK Star Hub | Website | `/apps-website/website/blkk-star-hub` | Relevant vertical and commerce domains | SEO, traffic, search, conversion, web runtime |
| BLKK Autos | Native iOS/Android app | `/apps-website/apps/blkk-autos` | Autos, orders, payments, logistics | Installs, sessions, searches, crashes, latency, releases |
| Merchants | Native iOS/Android app | `/apps-website/apps/merchants` | Merchant tenant and central domains | Sessions, catalogue sync, orders, crashes, latency |
| Farmers | Native iOS/Android app | `/apps-website/apps/farmers` | Farmer/co-op tenant and central domains | Field sessions, offline sync, GPS, battery/data, crashes |
| Estate | Native iOS/Android app | `/apps-website/apps/estate` | Estate tenant and central domains | Sessions, property discovery, inspections, runtime |
| BLKK Label Admin | Native iOS/Android app | `/apps-website/apps/label-admin` | Label and executive control domains | Secure sessions, approvals, alerts, runtime |

BLKK Star Hub business metrics do not move into Websites & Apps. Websites & Apps measures the client software. Domain dashboards may filter business activity by source surface.

## 5. AGL Autos Tenant Map

**Tenant:** Automobiles Ghana Limited (AGL)  
**Tenant entry:** `/autos/tenant/agl`

| System | Route | Purpose | Current source | Status | Missing for acceptance |
|---|---|---|---|---|---|
| Tenant system entry | `/autos/tenant/agl` | Choose Analytics or ERP without confusing investigation with operation | Tenant route contract | Implemented | Role-aware default selection |
| AGL Analytics | `/autos/tenant/agl/analytics` | Explain AGL performance and drill from measures to evidence | Existing tenant analytical workspaces | Preserved and renamed | Backend projections and shared metric registry |
| Analytics FixBot | `/autos/tenant/agl/analytics/fixbot` | Compare diagnostic behavior and inspect case evidence | `AutoFixbotPort` fixture | Analytical baseline | Backend analytical adapter |
| Analytics Workshop | `/autos/tenant/agl/analytics/workshop` | Investigate workshop capacity, promises, jobs, and evidence | `AutoOperationsPort` fixture | Analytical baseline | Shared analytical projections |
| Analytics Inventory | `/autos/tenant/agl/analytics/inventory` | Investigate stock constraints, provenance, and trusted valuation | `AutoInventoryOperationsPort` fixture | Analytical baseline | Shared analytical projections |
| Analytics Sales | `/autos/tenant/agl/analytics/sales` | Investigate sales, tenders, credit, and cross-ledger evidence | `AutoSalesOperationsPort` fixture | Analytical baseline | Shared analytical projections |
| AGL operational ERP | `/autos/tenant/agl/erp/work-orders` | Run AGL through operational records and commands | `aglErpRepository` and typed operational contracts | Operational spine implemented | Complete customer-to-cash depth and backend adapters |
| ERP service operations | `/autos/tenant/agl/erp/{fixbot,intake,appointments,job-board,work-orders,vehicles,mechanics,inspections,recalls,complaints}` | Create, progress, assign, verify, and close automotive service work | Shared persistent mock repository | Operational baseline | Full job-card evidence and resource transactions |
| ERP inventory and procurement | `/autos/tenant/agl/erp/{parts,stock-ledger,stock-movements,purchase-orders,suppliers}` | Maintain exact stock and supplier commitments | Shared persistent mock repository | Operational baseline | Reservation/issue/return and PO receipt depth |
| ERP sales and finance | `/autos/tenant/agl/erp/{new-sale,sales-ledger,customers,quotations,invoices,payments,profit-loss,expenses,petty-cash,creditors,debtors,reconciliation}` | Operate customer commerce and financial ledgers | Shared persistent mock repository | Operational baseline | Journal and period controls |
| ERP marketing | `/autos/tenant/agl/erp/{campaigns,promotions,leads,marketing-spend}` | Operate campaigns, promotions, attributed leads, and spend records | Shared persistent mock repository | Operational baseline | Lead-to-customer and sale attribution |
| ERP people | `/autos/tenant/agl/erp/{employees,departments,attendance,leave,payroll,payslips,performance}` | Operate employment, time, payroll, and performance records | Shared persistent mock repository | Operational baseline | Payroll-run engine and restricted evidence |
| ERP governance | `/autos/tenant/agl/erp/{manager-desk,documents,business-reports,managerial-reports,audit-log,roles,settings}` | Approve work, retain documents, reproduce reports, and identify every actor action | Shared persistent mock repository | Operational baseline | Role enforcement, document versions, backend audit |

## 6. Autos Contract Map

| Contract | Purpose | Fixture | UI consumer |
|---|---|---|---|
| `AutoFixbotPort` | Diagnostic comparison, confidence, flow, case and evidence | `autoFixbotFixtures.ts` | `AutoFixbotWorkspace.tsx` |
| `AutoOperationsPort` | Workshop snapshot and capacity | `autoOperationsFixtures.ts` | `AutoTenantWorkspace.tsx` |
| `AutoInventoryOperationsPort` | Inventory, movement, provenance, reorder | `autoInventoryFixtures.ts` | `AutoInventoryWorkspace.tsx` |
| `AutoSalesOperationsPort` | Sales, tenders, channels, evidence | `autoSalesFixtures.ts` | `AutoSalesWorkspace.tsx` |

Future backend adapters replace fixtures without changing the page contracts after acceptance.

## 6A. Intelligence Foundation Contract Map

| Contract or registry | Purpose | Current source | UI consumer |
|---|---|---|---|
| Scope and evidence contracts | Type claim, observation, contributor, event, evidence and search results | `src/intelligence/contracts.ts` | Evidence Explorer and future ERP adapters |
| Canonical scope registry | Define continent-to-evidence scope grammar | `src/intelligence/scopeRegistry.ts` | Evidence Explorer scope rail |
| Route-scope registry | Declare active route scope, owner, decision and parent path | `src/intelligence/routeScopeRegistry.ts` | App-shell integration |
| Common ontology kernel | Define shared entity meaning, IDs, relationships and extensions | `src/intelligence/ontologyRegistry.ts` | Ontology view |
| Metric registry v1 | Register 24 governed foundation metrics | `src/intelligence/metricRegistry.ts` | Metric registry and evidence drill |
| Confidence, currency and unit rules | Prevent unsupported aggregation and silent confidence loss | `src/intelligence/governance.ts` | Future adapters and metric computation |
| Intelligence state patterns | Loading, empty, error, stale and restricted states | `src/components/intelligence/IntelligenceState.tsx` | Intelligence surfaces |
| Metric evidence drill | Claim to contributor to record to event to evidence | `src/components/intelligence/MetricDrill.tsx` | `/intelligence` |

## 7. Required Drill Paths

| Starting claim | Required path |
|---|---|
| Continental trusted inventory value | Continent → country → city → vertical → tenant → category → SKU/batch → count/receipt/provenance |
| Country revenue | Country → vertical → tenant → department/channel → sale → line → payment |
| AutoHub service capacity | Vertical → city → tenant → workshop → bay/mechanic → job card |
| Best mechanic | Search/ranking → eligibility → mechanic → tenant → performance metric → job cards/evidence |
| Rare kente availability | Search → product/variant → merchant → tenant → stock position → count/provenance |
| Post-harvest loss | Country/vertical → route/co-op → lot → weights/grades → custody and evidence |
| Employee termination complaint | Case → employee → tenant → contract/payroll/performance/complaint → termination/audit |
| Website conversion | Websites & Apps → BLKK Star Hub → funnel step → session/search/page event |
| App crash rate | Websites & Apps → app → OS/build → crash group → device/session trace |

## 8. Living Metric Map Template

Each implemented metric adds a row.

| Metric ID | Question | Scope | Definition | Source grain | Freshness | Confidence | Drill | Action | Status |
|---|---|---|---|---|---|---|---|---|---|
| `inventory.trusted_value` | What inventory value can be defended? | Tenant → continent | Accepted on-hand × accepted cost, currency normalised | SKU × location × as-of | Operational | Evidence policy | Scope → SKU → evidence | Count, quarantine, correct, report | Seed |
| `inventory.service_demand_cover` | Can trusted stock cover upcoming work? | Tenant → vertical | Available trusted units / required units in horizon | SKU × job requirement | Operational | Stock + job freshness | Scope → SKU → job | Transfer, reserve, reorder | Seed |
| `workshop.first_pass_quality` | What share of completed work passes without repeat intervention? | Mechanic → continent | First-pass completions / eligible completions | Job card | Nearline | QC evidence | Scope → mechanic → job | Coach, reassign, investigate | Seed |
| `sales.payment_realization` | What share of billed value has settled? | Tenant → continent | Collected / billed | Transaction | Operational | Payment evidence | Scope → tender → transaction | Reconcile, collect, hold | Seed |
| `employment.contract_compliance` | Are employment actions consistent with contract and policy evidence? | Tenant → country | Policy-defined compliant cases / eligible cases | Employment case | Analytical | Restricted evidence | Scope → case → evidence | Review case | Seed |

### Registered Foundation Metrics v1

All entries below are typed in `src/intelligence/metricRegistry.ts`, render through the shared Evidence Explorer, and currently use demonstration events and evidence.

| Domain | Registered metric IDs | Count | Frontend status |
|---|---|---:|---|
| Inventory | `inventory.trusted_value`, `inventory.service_demand_cover`, `inventory.stock_accuracy`, `inventory.ageing_value` | 4 | Analytical fixture |
| Operations | `operations.accepted_throughput`, `operations.first_pass_quality`, `operations.release_cycle_time`, `operations.binding_constraint_load` | 4 | Analytical fixture |
| Sales | `sales.payment_realization`, `sales.fulfilment_rate`, `sales.order_conversion`, `sales.return_rate` | 4 | Analytical fixture |
| Finance | `finance.cash_conversion`, `finance.escrow_reconciliation`, `finance.receivables_at_risk` | 3 | Analytical fixture |
| Workforce | `workforce.contract_compliance`, `workforce.payroll_accuracy`, `workforce.productivity` | 3 | Analytical fixture; restricted evidence class supported |
| Trust | `trust.evidence_coverage`, `trust.kyc_currency`, `trust.dispute_resolution` | 3 | Analytical fixture |
| Telemetry | `telemetry.journey_completion`, `telemetry.crash_free_sessions`, `telemetry.data_freshness` | 3 | Analytical fixture |
| **Total** |  | **24** | Registry v1 |

## 9. Change Log

| Date | Change |
|---|---|
| 28 Jul 2026 | Replaced the generic AGL FixBot route with purpose-led grouped columns, donut, scatter, line/area, funnel and histogram views; every chart filters or drills to evidence-bearing cases. |
| 28 Jul 2026 | Implemented Phase 1 frontend foundation: route-scope and ontology registries, 24 governed metrics, cross-domain search, evidence drill, governance policies, and reusable intelligence states. |
| 28 Jul 2026 | Added the master Mermaid mindmap as the primary system orientation, joining every scale, ERP, decision, action, and metric to its original evidence. |
| 28 Jul 2026 | Created living map and recorded the current central directories, digital products, AGL module state, contracts, and required drills. |

## 10. Update Checklist

When a route changes:

1. Update its scope.
2. Update its primary question.
3. Update its status.
4. Update its data contract and source.
5. Update its drill path.
6. Update its action.
7. Add or revise metric rows.
8. Record the change date.
