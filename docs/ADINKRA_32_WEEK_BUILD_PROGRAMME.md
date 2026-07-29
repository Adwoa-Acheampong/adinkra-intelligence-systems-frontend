# Adinkra 32-Week Build Programme

**Status:** Proposed execution baseline  
**Programme type:** Frontend-first, contract-led, backend-ready  
**Cadence:** Eight four-week phases  
**Start condition:** Product owner accepts the architecture and sequence  
**Companion document:** `ADINKRA_CONTINENTAL_INTELLIGENCE_ARCHITECTURE.md`

## 1. Programme Outcome

At the end of 32 weeks, Adinkra Release 1 should demonstrate a coherent intelligence chain:

```text
Operational event
  → tenant ERP
    → department and tenant decisions
      → city and country aggregation
        → vertical intelligence
          → continental portfolio intelligence
            → evidence drill-through
              → controlled BLKK action
```

This programme does not attempt to perfect every industry in one shot. It builds a reusable intelligence kernel, proves it deeply in Autos, expands it through each vertical with controlled scope, and finishes with cross-vertical and institutional use cases.

## 2. Programme Rules

### Rule 1: Map before build

No module begins with a dashboard.

It begins with:

1. actor;
2. real activity;
3. entity or asset;
4. decision;
5. evidence;
6. event;
7. metric;
8. drill path;
9. action.

### Rule 2: Complete one vertical slice before broad replication

A vertical slice includes:

- the operational record;
- the tenant department workspace;
- the tenant aggregate;
- the vertical aggregate;
- at least one geographic aggregate;
- the metric definition;
- the evidence drill;
- the BLKK action handoff where relevant.

### Rule 3: Fixtures are contracts, not decoration

Mock data must:

- reflect real names, units, states, time, and geography;
- include good, bad, stale, missing, disputed, and restricted records;
- implement typed ports that the backend can later replace;
- preserve record identifiers and lineage;
- support interaction and drill-through.

### Rule 4: Every week closes with evidence

The weekly review must show:

- workflow map;
- updated system map;
- contracts;
- working route;
- realistic fixture;
- tested drill;
- tested action;
- known gaps;
- next-week gate.

### Rule 5: No dead-end interface

A visible control must:

- change the view;
- open a record;
- create a visible frontend state;
- or clearly identify itself as unavailable.

### Rule 6: Central dashboards change the decision

- Tenant ERP: execute work.
- Vertical central: compare tenants and resolve vertical constraints.
- City/country: allocate resources and coordinate geography.
- Continental command: allocate capital, monitor trust and risk, and identify opportunity.

## 3. Weekly Working Loop

The default weekly loop is:

| Day | Activity | Output |
|---|---|---|
| Monday | Observe and map | Workflow, actors, decisions, failures, source records |
| Tuesday | Model | Ontology, events, metrics, drill and action contracts |
| Wednesday | Build | Fixture adapter and main interface |
| Thursday | Connect | Drill-through, cross-module relationship, controlled action |
| Friday | Verify and map | Type/build/browser checks, scenario review, map and risk update |

The cadence may stretch for difficult slices, but no step is skipped.

## 4. Phase Overview

| Phase | Weeks | Theme | Exit gate |
|---|---:|---|---|
| 1 | 1–4 | Intelligence foundation | One definition of scope, metric, event, lineage, search, and drill |
| 2 | 5–8 | AGL tenant ERP exemplar | Autos tenant works across operations, inventory, sales, finance, HR, and audit |
| 3 | 9–12 | AutoHub aggregation | One complete tenant-to-continent drill-through and mechanic recommendation |
| 4 | 13–16 | Merchants and Field Agents | Mr Kofi product discovery and BLKK order handoff works end to end |
| 5 | 17–20 | Estate and Farmers | Property and agricultural chains prove ontology extensibility |
| 6 | 21–24 | Label, Susu, and Precious Metals | Remaining vertical kernels and trust/custody patterns are established |
| 7 | 25–28 | Digital products and action plane | Adinkra recommendations hand off into BLKK commerce, booking, escrow, and delivery |
| 8 | 29–32 | Continental intelligence and hardening | Banker, executive, mechanic, product, and employee-case scenarios pass |

## 5. Phase 1 — Intelligence Foundation

**Frontend implementation:** [Phase 1 implementation record](ADINKRA_PHASE_1_IMPLEMENTATION.md) — foundation implemented with demonstration data; backend adapters remain unwired.

### Objective

Replace ad hoc pages and duplicated dashboard patterns with a shared scope, ontology, metric, drill, and evidence grammar.

### Week 1 — Scope grammar and living system map

**Questions**

- Who uses Adinkra at each level?
- What does store, shop, tenant, company, city, country, vertical, and continent mean?
- Which existing routes already represent those scopes?

**Build**

- Create the canonical scope hierarchy.
- Create the route-to-scope map.
- Inventory every current central dashboard, tenant route, app, and dead-end.
- Define the living system map format.
- Record representative acceptance scenarios.

**Deliverables**

- Continental architecture
- Current route inventory
- Scope glossary
- Scenario register
- Living system map

**Exit gate**

Every current and planned route has one declared scope, owner, primary decision, and parent drill path.

### Week 2 — Common ontology kernel

**Questions**

- Which entities exist in every vertical?
- Which entities remain vertical-specific?
- How do people, assets, work, transactions, evidence, and location relate?

**Build**

- Model common identity, location, tenant, actor, asset, work, commerce, employment, and evidence entities.
- Define extension rules for each vertical.
- Define stable IDs and relationship conventions.
- Map current AGL fixture objects into the kernel.

**Deliverables**

- Ontology catalogue v1
- Relationship catalogue v1
- Vertical extension templates
- Naming and ID conventions

**Exit gate**

Workshop job, inventory part, sales transaction, employee, merchant product, property, and farm lot can all be expressed without losing domain-specific meaning.

### Week 3 — Metric and drill registry

**Questions**

- What is being measured?
- What decision does it support?
- How is it aggregated?
- What proves it?

**Build**

- Create typed metric-definition, observation, dimension, confidence, and drill contracts.
- Create the first metric registry.
- Register at least 20 foundation metrics across inventory, operations, sales, finance, HR, trust, and telemetry.
- Define additive, ratio, latest-state, distinct, and ranking aggregation policies.

**Deliverables**

- Metric registry v1
- Drill registry v1
- Confidence policy v1
- Currency and unit rules

**Exit gate**

No foundation metric exists only as text or a component-level calculation.

### Week 4 — Intelligence shell and explorer

**Questions**

- How does a user always know where they are?
- How can the user search or move across scopes?
- How are freshness and confidence shown?

**Build**

- Finalise the collapsible ERP sidebar and ERP switcher.
- Add scope breadcrumbs and as-of state.
- Add global search shell and entity result contract.
- Add reusable metric drill container.
- Add empty, loading, stale, error, and restricted patterns.

**Deliverables**

- Scope-aware app shell
- Explorer/search prototype
- Metric drill prototype
- Accessibility and interaction baseline

**Exit gate**

The user can move from the continental shell to a tenant record and back without losing scope.

## 6. Phase 2 — AGL Tenant ERP Exemplar

**Implementation progress:** [Phase 2 implementation record](ADINKRA_PHASE_2_IMPLEMENTATION.md) — AGL now has sibling Analytics and ERP systems. The operational spine, grouped navigation, persistent command repository, cross-module effects, and Admin Audit are implemented; domain depth continues through the Week 5–8 gates.

### Objective

Use AGL as the reference tenant to prove that a tenant ERP is an operational sensing system rather than a themed analytics page.

### Week 5 — Workshop and vehicle operations

**Map**

- intake;
- vehicle;
- appointment;
- diagnosis;
- mechanic assignment;
- parts request;
- job execution;
- QC;
- release;
- invoice.

**Build**

- Complete workshop board states.
- Add job-card detail and evidence.
- Add vehicle and customer relationship drill.
- Add mechanic capacity, promised-time, and first-pass-quality decisions.
- Add recalls, complaints, inspection, and release controls.

**Current baseline**

The workshop control slice exists with job states, constraints, filters, and evidence drawer. It is not accepted until the common Week 1–4 contracts replace local-only assumptions.

**Exit gate**

Every active job can be traced to customer, vehicle, mechanic, part, sale, evidence, and release decision.

### Week 6 — Inventory and procurement

**Map**

- catalogue;
- fitment;
- count;
- reservation;
- issue;
- receipt;
- transfer;
- adjustment;
- quarantine;
- reorder;
- purchase approval;
- receiving;
- supplier performance.

**Build**

- Complete controlled stock ledger.
- Add multi-location and availability states.
- Add job exposure and demand cover.
- Add provenance, quarantine, cycle count, reorder, and movement lineage.
- Separate raw valuation from trusted valuation.

**Current baseline**

The inventory control slice exists with an availability pressure rail, ledger, provenance, job exposure, PO-draft action, and valuation exception.

**Exit gate**

No stock number can affect service, collateral, or purchasing without count freshness, valuation rule, and provenance status.

### Week 7 — Sales, CRM, payments, and receivables

**Map**

- lead;
- customer;
- vehicle;
- quote;
- sale;
- line item;
- inventory issue;
- job linkage;
- payment;
- settlement;
- credit;
- refund;
- delivery.

**Build**

- Complete sales and POS ledger.
- Add customer CRM and history.
- Add tender reconciliation.
- Add receivables and credit exposure.
- Add sale-to-job and sale-to-inventory lineage.
- Add source channel and staff attribution.

**Current baseline**

The sales control slice exists with tender reconciliation, channel ladder, receivables, transaction lines, evidence, and settlement state.

**Exit gate**

Revenue, inventory consumption, customer history, staff contribution, payment, and fulfilment reconcile without double counting.

### Week 8 — Finance, HR, audit, and AGL tenant command

**Map**

- expenses and purchasing;
- payables and creditors;
- cash and bank;
- P&L and tax;
- roster and contract;
- attendance and leave;
- payroll;
- performance;
- complaint and termination;
- audit and export.

**Build**

- Build finance operational surfaces.
- Build workforce, contract, attendance, payroll, performance, and employee-relations surfaces.
- Build mutation and access audit.
- Preserve the AGL analytical system as the tenant Analytics sibling.
- Keep ERP free of a dashboard and BI page; open it directly into role-relevant operational work.
- Make fixed business, financial, statutory, and managerial reports reproducible from ERP records.

**Exit gate**

AGL can run work in ERP, investigate the resulting data in Analytics, and drill from an analytical claim back to its operational record and audit evidence.

## 7. Phase 3 — AutoHub Aggregation

### Objective

Prove that multiple automotive tenants can aggregate to city, country, and continental intelligence without duplicating the AGL ERP.

### Week 9 — Multi-tenant automotive fixture network

**Build**

- Create realistic tenants across Accra, Kumasi, Lagos, Abuja, Kigali, Harare, and Johannesburg.
- Add location, branch, currency, timezone, and operating-capacity dimensions.
- Include data-quality variation and restricted records.
- Establish comparison cohorts: dealer, workshop, parts seller, fleet operator.

**Exit gate**

At least 20 automotive tenants can contribute to the same registered metrics without sharing tenant data improperly.

### Week 10 — City and country AutoHub

**Build**

- Create city-level capacity, inventory, service quality, receivable, and demand views.
- Create country-level operating and financial views.
- Add tenant contribution and exclusion drills.
- Add stock-rebalancing opportunity between tenants.

**Exit gate**

A country inventory or workshop metric can drill through city, tenant, department, entity, and evidence.

### Week 11 — AutoHub vertical command

**Build**

- Replace generic AutoHub dashboards with:
  - service capacity and bottleneck allocation;
  - vehicle/parts demand;
  - inventory coverage and inter-tenant transfers;
  - quality and recall pressure;
  - receivables and working capital;
  - mechanic and workshop capability.

**Exit gate**

AutoHub supports vertical allocation decisions that no individual tenant dashboard can make.

### Week 12 — Mechanic search and booking handoff

**Build**

- Create make/model/engine/fault compatibility search.
- Create explainable mechanic and workshop ranking.
- Drill to evidence volume, job cards, quality, capacity, and tenant.
- Add controlled handoff to BLKK Autos service booking.

**Exit gate**

The Zimbabwe/Nigerian niche-car scenario can be completed without a phone call.

## 8. Phase 4 — Merchants and Field Agents

### Objective

Prove product visibility, availability, merchant trust, field verification, and BLKK-mediated commerce.

### Week 13 — Merchant tenant ERP

**Map and build**

- store and branch;
- catalogue;
- product and variant;
- price;
- inventory position;
- orders;
- fulfilment;
- supplier;
- staff;
- finance;
- customer and rating;
- audit.

**Exit gate**

A merchant tenant can run stock, sales, fulfilment, staff, finance, and evidence from one ERP.

### Week 14 — Product verification and merchant performance

**Build**

- Product and variant records with media, provenance, price, and availability.
- Merchant trust, fulfilment, rating, return, and dispute measures.
- Availability freshness and last-count evidence.
- Search eligibility rules.

**Exit gate**

“Available now” is backed by a recent stock observation, not only a listing flag.

### Week 15 — Field Agent ERP and verification chain

**Build**

- assignment;
- visit;
- merchant onboarding;
- product capture;
- KYC;
- verification queue;
- offline sync;
- supervisor acceptance;
- commissions and collections.

**Exit gate**

Every agent capture has location, actor, time, evidence, quality state, and tenant relationship.

### Week 16 — Kente discovery to BLKK order

**Build**

- Cross-merchant product search.
- Product, merchant, and location ranking.
- Drill from result to Mr Kofi’s tenant ERP and one-unit inventory.
- Handoff to BLKK Star Hub product/order flow.
- Preserve BLKK as intermediary.

**Exit gate**

The Paris/Koforidua rare-kente scenario works end to end.

## 9. Phase 5 — Estate and Farmers

### Objective

Prove that the common kernel supports long-lived assets, inspections, land evidence, agricultural production, loss, and aggregation.

### Week 17 — Estate tenant ERP

**Build**

- properties and units;
- owners and landlords;
- enquiries and appointments;
- inspection;
- title/document evidence;
- offers, deposits, escrow, leases;
- maintenance;
- agent performance;
- finance, HR, and audit.

**Exit gate**

Property truth, commercial activity, documents, payments, and responsible actors remain connected.

### Week 18 — Estate central and agent intelligence

**Build**

- verified supply;
- demand by city;
- inspection backlog;
- title/document risk;
- vacancy and yield;
- agent performance and complaint pressure;
- viewing or inspection handoff to Estate app.

**Exit gate**

Estate central can compare agencies without exposing restricted tenant records outside policy.

### Week 19 — Farmer/co-op tenant ERP

**Build**

- farmer roster;
- co-op;
- plots and GPS;
- crops and inputs;
- expected yield;
- harvest;
- grade;
- loss;
- input credit;
- orders and payments;
- staff/agent activity.

**Exit gate**

Yield and loss observations drill to plot, farmer, agent, evidence, and time.

### Week 20 — Aggregation, logistics, and post-harvest loss

**Build**

- aggregation lots;
- chain of custody;
- weight and grade reconciliation;
- transport;
- cold storage;
- buyer demand;
- loss attribution;
- finance and repayment.

**Exit gate**

A country post-harvest loss rate shows numerator, denominator, excluded lots, route, co-op, and evidence.

## 10. Phase 6 — Label, Susu, and Precious Metals

### Objective

Complete the remaining vertical kernels and prove production, recurring finance, and high-trust custody.

### Week 21 — BLKK Label tenant and vertical

**Build**

- house and franchise;
- collection and design;
- approval;
- production work order;
- materials;
- finished inventory;
- quality;
- order and fulfilment;
- royalty, fee, and payout.

**Exit gate**

A collection’s commercial and production performance drills to house, design, material, work order, item, order, and payout.

### Week 22 — Susu Rail and payments

**Build**

- member identity;
- contribution cycle;
- mandate;
- collection;
- wallet;
- missed contribution;
- settlement;
- agent;
- dispute;
- compliance.

**Exit gate**

Contribution and delinquency metrics reconcile to member, cycle, collection event, settlement, and evidence.

### Week 23 — Precious Metals trust and custody

**Build**

- miner and licence;
- site;
- assay;
- lot;
- weight and purity;
- purchase;
- custody transfer;
- vault;
- export;
- payment and compliance.

**Exit gate**

Trusted metal value drills to lot, assay, weight, custody, licence, payment, and audit.

### Week 24 — Vertical template and acceptance

**Build**

- Extract reusable tenant/vertical patterns without flattening domain workflows.
- Standardise scope, metric, search, evidence, action, access, and fixture templates.
- Audit every sidebar for wrong-vertical tenants or modules.
- Close dead routes and false affordances.

**Exit gate**

Each vertical has its own coherent ERP and central command, while common intelligence behaviours remain consistent.

## 11. Phase 7 — Digital Products and BLKK Action Plane

### Objective

Separate software telemetry from domain performance and connect Adinkra intelligence to BLKK-mediated action.

### Week 25 — Websites & Apps central telemetry

**Build**

- One website: BLKK Star Hub integrated commerce website.
- Native iOS/Android apps:
  - BLKK Autos;
  - Merchants;
  - Farmers;
  - Estate;
  - BLKK Label Admin.
- Central web-versus-app telemetry.
- Product-level traffic, acquisition, crash, latency, release, sync, and conversion drills.

**Exit gate**

Software health is not confused with business performance, but source-surface attribution can connect them.

### Week 26 — Orders, checkout, escrow, and delivery

**Build**

- BLKK advisor/order creation;
- delivery details and map location;
- MoMo-first payments;
- escrow holds and release;
- order timeline;
- white-labelled BLKK Delivery;
- dispatch, routing, ETA, proof, dispute;
- vehicle, parts, mechanics, merchant, property, and agricultural fulfilment variants.

**Exit gate**

No direct buyer-to-seller path exists; every commerce path is BLKK-mediated and auditable.

### Week 27 — Cross-vertical search and recommendations

**Build**

- Search products, services, vehicles, mechanics, properties, merchants, farms, lots, and capabilities.
- Add explainable eligibility and ranking.
- Add location, availability, confidence, performance, and evidence filters.
- Add restricted-result policy.

**Exit gate**

Search can answer a real-world question without requiring the user to know the system’s organisational structure.

### Week 28 — Intelligence-to-action handoffs

**Build**

- Product → BLKK Star Hub order
- Mechanic → BLKK Autos booking
- Property → Estate inspection/viewing
- Merchant → advisor/order
- Farmer lot → buyer/order/logistics
- Risk → case/approval
- Employee complaint → controlled review case

**Exit gate**

Every recommendation has one valid next action and preserves the initiating scope and evidence.

## 12. Phase 8 — Continental Intelligence and Hardening

### Objective

Complete the executive, institutional, governance, and operational-readiness layer.

### Week 29 — Continental portfolio command

**Build**

- allocation by country, city, vertical, tenant, and department;
- trusted value and value at risk;
- working-capital exposure;
- capacity and binding constraints;
- institutional trust;
- compliance and audit exceptions;
- cross-vertical dependencies;
- material opportunities.

**Exit gate**

The top page shows what requires executive attention and drills to evidence; it does not reproduce every vertical dashboard.

### Week 30 — Institutional reporting

**Build**

- banker inventory and cash-flow pack;
- government and regulator summaries;
- tax and employment evidence packs;
- country and continental operating reports;
- signed as-of state;
- definitions, confidence, exclusions, lineage, and export audit.

**Exit gate**

The USD 5M inventory claim can be reproduced later from the same metric definition and evidence set.

### Week 31 — Security, performance, data quality, and resilience

**Build**

- RBAC and ABAC review;
- tenant isolation tests;
- restricted employee and complaint access;
- audit coverage;
- stale and degraded modes;
- route-level code splitting;
- performance budgets;
- accessibility;
- mobile and offline states;
- data-quality operations;
- failure and retry surfaces.

**Exit gate**

No critical cross-tenant leak, dead route, silent stale state, untraceable metric, or unaudited material action remains.

### Week 32 — Scenario acceptance and Release 1

**Run**

1. Banker inventory valuation
2. Mr Kofi rare kente availability and order handoff
3. Niche-car mechanic search and booking handoff
4. Kigali employee complaint and termination evidence
5. AGL tenant company health across all departments
6. Country and continental allocation decision

**Deliver**

- release candidate;
- complete living system map;
- metric and ontology registries;
- backend integration contract pack;
- known-gaps register;
- Release 2 roadmap;
- stakeholder demonstration.

**Exit gate**

Every scenario completes from executive question to authorised evidence without a phone call.

## 13. Current Frontend Baseline

### Present strengths

- Distinct central ERP shells exist.
- Tenant routing and collapsible sidebar exist.
- AGL workshop has a substantive operational slice.
- AGL inventory has a substantive operational slice.
- AGL sales has a substantive operational slice.
- Agent ERP work exists.
- Vertical and product workspaces are declared.
- Mock and contract patterns are emerging.

### Present risks

- Some metrics remain local calculations rather than registry definitions.
- Many tenant modules still route to generic tables.
- Central dashboards may still share generic layouts.
- Geography is not yet a first-class scope.
- Search is not yet a continental entity explorer.
- Drill paths are not governed by a registry.
- Confidence, exclusions, and freshness are not universal.
- Backend contracts are not yet reconciled with the separate backend repository.
- The production bundle is over the current chunk-size warning threshold.

### Interpretation

Existing workshop, inventory, and sales work maps to Phase 2, but it is not a reason to skip Phase 1. Phase 1 will rationalise those slices into the shared architecture instead of discarding them.

## 14. Programme Scorecard

Track progress by capability, not page count.

| Measure | Target by Week 32 |
|---|---:|
| Current routes with declared scope and decision | 100% |
| Displayed material metrics registered | 100% |
| Registered metrics with working drill | 100% |
| Material values showing freshness | 100% |
| Institutional values showing confidence/exclusions | 100% |
| Visible controls that act or drill | 100% |
| Tenant operational mutations with audit intent | 100% |
| Cross-tenant isolation critical failures | 0 |
| Acceptance scenarios completed without phone call | 6/6 |
| Generic placeholder tenant modules | 0 in Release 1 scope |

## 15. Programme Risks and Responses

| Risk | Response |
|---|---|
| Trying to build every vertical at once | Enforce phase gates and exemplar-first expansion |
| Screens without real workflow meaning | Monday workflow map is mandatory |
| Mock data becoming fiction | Fixtures name source, grain, failure state, and future port |
| Same metric means different things | Metric registry approval before rendering |
| Central pages repeat tenant dashboards | Define the decision at each scope before UI |
| Backend mismatch discovered late | Typed ports now; backend contract review at every phase gate |
| Sensitive employee/customer exposure | RBAC + ABAC + purpose + audit |
| AI creates unreviewed business truth | Human approval for material state changes |
| Rankings become unfair or misleading | Eligibility, evidence volume, confidence, and explanation |
| Programme becomes documentation-only | Every week closes with a working route and tested drill |

## 16. Phase-Gate Review Template

At the end of every four-week phase, answer:

1. Which real-world question now works?
2. Which user can answer it?
3. At which scopes?
4. Which events feed it?
5. Which metrics are registered?
6. How does it drill to evidence?
7. Which action can be taken?
8. What is still fixture-only?
9. What backend contract is required?
10. What should not be built next?

The product owner approves or redirects the next phase based on this review.
