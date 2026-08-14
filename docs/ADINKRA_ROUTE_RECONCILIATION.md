# Adinkra route-to-purpose reconciliation

Status: frontend contract reconciled on 2026-08-10. This document records what each route owns, what it may aggregate, and where a user must drill to reach the contributing operating evidence.

## Product boundary

- Adinkra Command Center answers what is happening across the conglomerate. It owns cross-vertical allocation, constraint, treasury, trust, institutional reporting, and platform-health decisions. It does not duplicate a vertical's operating dashboard.
- Each vertical command answers what is happening across tenants in one domain. It uses the vocabulary, measures, processes, and evidence of that domain only.
- Each tenant has two sibling systems: `/analytics` explains governed projections; `/erp` creates and changes operating records. Analytics is read-only and ERP does not contain a duplicate BI application.
- Every measure and chart must resolve to a tenant, branch/site, period, actor, source module, and source record. Backend integration will replace the typed mock repositories without changing these route contracts.
- BLKK remains the transaction intermediary. No route models direct buyer-to-seller settlement or fulfilment.

## Ecosystem command

| Route | Exact purpose | Drill destination |
| --- | --- | --- |
| `/` | Continental operating brief and cross-ERP exceptions | Vertical command, tenant analytics, source ERP record |
| `/portfolio-intelligence` | Capital allocation, concentration, return, and value-at-risk across verticals | Vertical and tenant contribution |
| `/cross-vertical-ops` | Shared constraints and hand-offs spanning three or more ERPs | Owning workflow and evidence event |
| `/central-logistics` | Shared fleet, routes, dispatch, fulfilment, and delivery exceptions | Vertical logistics record |
| `/treasury` | Consolidated cash, escrow, settlement, payout, FX, and liability position | Finance ledger and transaction evidence |
| `/trust-control` | KYC, verification, fraud, custody, and institutional trust exposure | Control case and original evidence |
| `/intelligence` | Searchable claim-to-record evidence explorer | Original source record |
| `/ontology` | Ontology view of canonical entities and relationships | `/intelligence?view=ontology` |
| `/ai-operations` | Model recommendations, exceptions, confidence, and human review | Recommendation and accepted/rejected source action |
| `/institutional-reporting` | Lender, regulator, insurer, tax, and board evidence packs | Frozen claim population and source records |
| `/system-health` | Availability, latency, incidents, connectors, and ingestion health | Service or integration incident |

## Vertical commands

Each path below is relative to the vertical base. The empty module is the bespoke command page; `tenants` is the tenant-control page. Remaining modules are decision workspaces, not copies of the command.

| Vertical | Base | Command modules |
| --- | --- | --- |
| Merchants | `/merchant` | `tenants`, `catalogue`, `inventory`, `orders`, `fulfilment`, `logistics`, `advisor-desk`, `customers`, `payments`, `payouts`, `procurement`, `marketing`, `workforce`, `support`, `finance`, `audit` |
| AutoHub | `/autos` | `tenants`, `vehicles`, `parts`, `workshops`, `inspections`, `test-drives`, `advisor-desk`, `orders`, `payments`, `logistics`, `financing`, `insurance`, `trade-ins`, `customers`, `workforce`, `marketing`, `finance`, `audit` |
| Estate | `/estate` | `tenants`, `properties`, `owners`, `verification`, `viewings`, `maintenance`, `advisor-desk`, `offers`, `payments`, `customers`, `marketing`, `workforce`, `finance`, `audit` |
| Farmers Market | `/farmers` | `tenants`, `farmers`, `plots`, `yield`, `quality`, `aggregation`, `inventory`, `orders`, `logistics`, `cold-chain`, `inputs`, `payments`, `credit`, `traceability`, `workforce`, `marketing`, `finance`, `audit` |
| BLKK Label | `/label` | `tenants`, `collections`, `design`, `production`, `inventory`, `orders`, `franchise`, `payments`, `logistics`, `customers`, `marketing`, `workforce`, `finance`, `audit` |
| Susu Rail | `/susu` | `tenants`, `wallets`, `payments`, `escrow`, `pools`, `settlement`, `risk`, `ledger`, `audit` |
| Precious Metals | `/gold` | `tenants`, `lots`, `assay`, `orders`, `vault`, `logistics`, `payments`, `compliance`, `finance`, `workforce`, `audit` |
| Field Agents | `/agents` | `tenants`, `assignments`, `visits`, `verification`, `listings`, `onboarding`, `collections`, `commissions`, `sync`, `quality`, `workforce`, `audit` |

The seven contract-driven verticals outside Estate have 91 explicit module profiles. Each profile declares its own decision purpose, measures, pipeline, facet, and route-clean seed records. Estate is deliberately specialized rather than forced through the generic profile renderer.

## Tenant inventory and dual-system doors

| Vertical | Tenant IDs |
| --- | --- |
| AutoHub | `agl`, `kumasi_motors`, `adinkra_motors`, `lagos_autocare` |
| Farmers Market | `techiman_grain`, `akumadan_farms`, `tamale_produce` |
| Estate | `prime_accra`, `heritage`, `lagos_habitat` |
| Merchants | `techvalley`, `osu_bespoke`, `abossey_parts`, `makola_home`, `kaneshie_electronics`, `kumasi_trade_depot` |
| BLKK Label | `crushed_diamonds`, `havilah`, `kente_collective` |
| Susu Rail | `accra_susu_union`, `kumasi_market_susu`, `lagos_trader_circle` |
| Precious Metals | `mining_gh`, `ashanti_bullion`, `tarkwa_artisanal` |
| Field Agents | `accra_field_network`, `ashanti_trade_desk`, `techiman_market_unit`, `tema_fulfilment_cell` |

For every tenant:

- chooser: `/{vertical}/tenant/{tenantId}`
- analytics: `/{vertical}/tenant/{tenantId}/analytics/{module?}`
- ERP: `/{vertical}/tenant/{tenantId}/erp/{module}`
- the chooser exposes both doors; tested total is 29 of 29 tenants.
- Analytics and ERP share record identities and filtering vocabulary but have separate responsibilities.

## AGL reference tenant

AGL is the full reference operational ERP. Its ERP starts at `/autos/tenant/agl/erp/work-orders`; its analytics starts at `/autos/tenant/agl/analytics`.

| ERP section | Operational routes |
| --- | --- |
| Service operations | `fixbot`, `intake`, `appointments`, `job-board`, `work-orders`, `job-cards`, `job-corrections`, `vehicle-handovers`, `vehicles`, `mechanics`, `inspections`, `recalls`, `complaints` |
| Inventory and procurement | `parts`, `inventory-control`, `stock-ledger`, `stock-movements`, `purchase-orders`, `suppliers` |
| Sales and customers | `new-sale`, `sales-ledger`, `customers`, `quotations`, `invoices`, `payments`, `subscriptions` |
| Marketing | `campaigns`, `promotions`, `leads`, `marketing-spend` |
| Finance | `finance-controls`, `profit-loss`, `expenses`, `petty-cash`, `creditors`, `debtors`, `reconciliation`, `finance-journals` |
| People | `employees`, `departments`, `organisation`, `onboarding`, `certifications`, `attendance`, `leave`, `payroll`, `payslips`, `performance`, `schedules`, `training`, `tasks`, `staff-portal`, `clock-kiosk`, `contracts`, `employee-cases` |
| Management and records | `daily-entry`, `manager-desk`, `documents`, `business-reports`, `managerial-reports`, `forms`, `archives`, `exports`, `reminders`, `notifications`, `audit-log` |
| Administration | `roles`, `users`, `locations`, `integrations`, `settings` |

The business-report route is a report builder, not a pre-generated pack: family, subject, breakdown, measure, starting detail, two field/value filters, numeric range, summary measures, evidence columns, frozen population, signature, approval, export, and source drill are independently controlled. Branch, site, country/city, and period come from Operating Scope.

## Specialized Estate tenant systems

Estate ERP starts at `property-register` and operates these exact records:

- property control: `property-register`, `listings`, `land-parcels`, `owners-mandates`, `title-files`
- demand and transactions: `enquiries`, `viewings`, `inspections`, `offers`, `agreements`, `deposits`, `handovers`
- rentals and facilities: `leases`, `rent-ledger`, `maintenance`, `vendors`
- enterprise control: `workforce`, `finance`, `reports`, `audit`, `settings`

Estate Analytics owns `dashboard`, `supply`, `rentals`, `land`, `title`, `demand`, `viewings`, `deals`, `maintenance`, `workforce`, `finance`, `marketing`, and `reports`. Visual intent changes by route: supply/demand comparison, occupancy and rent movement, title readiness, funnel loss, viewing conversion, agent relationships, finance composition, and source evidence.

## Websites and native applications

Digital portfolio command: `/apps-website`. Portfolio routes are `websites`, `native-apps`, `users`, `journeys`, `experiments`, `releases`, `reliability`, `notifications`, `attribution`, `integrations`, and `security`.

| Product base | Product routes |
| --- | --- |
| `/apps-website/website/blkk-star-hub` | `routes`, `search`, `catalogue`, `advisor-crm`, `commerce`, `payments`, `orders`, `logistics`, `trust`, `support`, `growth`, plus shared product controls |
| `/apps-website/apps/blkk-autos` | `discovery`, `vehicles`, `advisor-crm`, `parts`, `mechanics`, `orders`, `payments`, `delivery`, plus shared product controls |
| `/apps-website/apps/merchants` | `catalogue`, `inventory`, `orders`, `payouts`, `support`, plus shared product controls |
| `/apps-website/apps/farmers` | `farmers`, `plots`, `yield`, `aggregation`, `logistics`, `offline`, plus shared product controls |
| `/apps-website/apps/estate` | `discovery`, `properties`, `advisor-crm`, `inspections`, `documents`, `payments`, plus shared product controls |
| `/apps-website/apps/label-admin` | `houses`, `collections`, `production`, `inventory`, `orders`, `franchise`, plus shared product controls |

Shared product controls are `users`, `notifications`, `releases`, `reliability`, and `security`. Portfolio filters apply consistently to websites, routes, and native applications; selecting Estate cannot return Autos or Farmers products.

## Filter and evidence contract

- Central command filters: real-time window (`Today`, `7D`, `30D`, `YTD`), currency (`GHS`, `USD`), and geographic scope.
- Tenant filters: period/custom dates, country, city, branch, site, status, owner/actor, route-specific facet, currency, value range, and free-text record search as applicable.
- Filter state is URL-persisted where it must survive navigation and review.
- Operational changes produce a session mutation/audit trail and preserve record ID.
- Analytical rows are read-only projections; the evidence inspector exposes source module and source record.
- Tables are evidence detail, never the only analytical answer: route-specific KPI cards and visual comparisons precede them.

## Verification owner

`scripts/verify-domain-routes.mjs` is the executable reconciliation check. It verifies tenant counts and IDs, module/profile parity, prohibited cross-domain terms, seed uniqueness, route ownership, chooser doors, Websites and Apps filter surfaces, specialized Estate depth, and sidebar semantics. `npm run gate:frontend` combines this check with TypeScript and the production build.
