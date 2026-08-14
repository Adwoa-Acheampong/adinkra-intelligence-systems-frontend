# Estate vertical: gap, requirements, and iterative closure plan

## 1. Outcome and boundary

Estate must answer, at every authorized level, what is happening across property sales, rentals, land, developments, mandates, title verification, viewings, inspections, controlled offers, deposits, leases, rent collection, maintenance, agents, finance, and evidence.

BLKK remains the accountable intermediary. Buyers, renters, owners, landlords, agents, inspectors, and vendors contribute to a BLKK-controlled workflow; the system must not model an uncontrolled buyer-to-owner transaction.

The Estate vertical has three distinct product surfaces:

1. **Estate Command** — cross-tenant, time-sensitive intervention and market-flow control.
2. **Estate Tenant Control** — compare estate companies, then drill into one tenant, office, portfolio, or record.
3. **Estate tenant system** — a dual operating ERP and analytics system for each agency, landlord, developer, or property manager.

## 2. Current-state gap analysis

| Capability | Current evidence | Desired state | Gap |
| --- | --- | --- | --- |
| Estate central command | `/estate` uses the generic `VerticalDashboard` and one fixed Estate insight definition | Real-time control room with period, currency, country/city, workflow, and accountable intervention drill | Dedicated command surface missing |
| Tenant portfolio control | `/estate/tenants` uses the generic module dashboard and generic registry cards | Estate-specific comparison of verified supply, title readiness, demand, occupancy, rent, land, deposits, maintenance, and evidence | Estate tenant aggregation contract missing |
| Domain purity | Navigation is Estate-specific, but generic pages and shared placeholder data can surface unrelated entities | Property-only language and records: residential, commercial, rentals, land, developments, leases, inspections, facilities | Generic fall-through risks contamination |
| Tenant operating ERP | Non-AGL Estate tenant routes fall through to `GenericEntityTable` | Operational ledgers, forms, workflows, approvals, documents, and audit trail | Entire Estate tenant ERP missing |
| Property ontology | Mindmap names property, title, landlord, agent, inspection, viewing, offer, lease, and maintenance case | Typed entities, identifiers, state machines, relationships, and source lineage | No implemented Estate contracts or repository |
| Property lifecycle | One analytical funnel exists | Listing intake → ownership/mandate → verification → publication → enquiry → match → viewing/inspection → controlled offer → deposit → agreement/lease → handover → maintenance/renewal/exit | No transactional workflow implementation |
| Rentals | Only generic payment/finance navigation | Units, tenancy applications, lease terms, deposits, recurring rent schedule, arrears, renewals, notices, inspections, move-in/out | Missing |
| Land | `Properties & Listings` mentions land | Plot identity, GPS boundary, tenure/title, zoning, encumbrance, survey evidence, development status, price basis, controlled reservation | Missing |
| Verification and trust | One title-readiness metric and mock exception | Document checklist, owner identity, mandate validity, registry/survey evidence, risk state, reviewer, expiry, decision and evidence trail | Missing operating controls |
| Viewings and inspections | One attendance metric | Scheduling, access windows, assigned agent/inspector, attendance proof, condition report, findings, follow-up and SLA | Missing operating workflow |
| Offers and deposits | One funnel stage and held-deposit metric | BLKK-mediated negotiation, controlled offer versions, approvals, escrow conditions, release/refund/dispute gates | Missing operating workflow |
| Maintenance/facilities | Navigation only | Request intake, severity, unit, tenant, vendor, work order, cost approval, access, completion proof, charge allocation and SLA | Missing |
| Finance | Generic Estate finance module | Sales pipeline, commissions, deposits/escrow, rent roll, arrears, owner remittance, maintenance recoveries, tax, P&L and reconciliation | Missing Estate semantics |
| Analytics | Fixed values with limited drill | Tenant → country → city → office/portfolio → property/unit/plot → workflow case → document/evidence | Missing inherited filters and record lineage |
| Multi-currency/geography | Generic Ghana demonstration label | Local and reporting currency, visible FX basis, country/city/office scope, time window and data freshness | Missing |

## 3. Estate domain model

### Core asset hierarchy

`Estate vertical → estate tenant → country → city/market → office/portfolio → property → building/block → unit or plot`

### Core entities

- Estate tenant, office, portfolio, owner/landlord, agent, inspector, vendor, customer/prospect.
- Property, building, unit, land plot, development phase, amenity, media asset.
- Ownership claim, title document, survey/site plan, mandate, encumbrance, verification case.
- Enquiry, qualified intent, match, viewing, inspection, controlled offer, reservation.
- Escrow instruction, deposit, agreement, lease, rent schedule, invoice, receipt, owner remittance.
- Maintenance request, work order, access appointment, completion evidence, charge allocation.
- Document, signature, approval, audit event, source record and evidence lineage.

### Required property classifications

- Residential sale, residential rental, short stay, commercial, industrial, land, and development/off-plan.
- Availability: draft, verification blocked, ready to publish, published, reserved, under offer, leased, sold, withdrawn.
- Tenure/title state, mandate state, occupancy state, furnishing, condition, usage/zoning, price/rent basis, currency, service charge, deposit terms.

## 4. Decision and functional requirements

| ID | Requirement | Acceptance measure |
| --- | --- | --- |
| EST-CMD-001 | Estate Command shall recalculate all visible measures by Real-time, Today, 7D, 30D, and YTD. | Changing the period changes flow values, queue population, and monetary window values. |
| EST-CMD-002 | Estate Command shall support GHS and USD with a visible rate basis. | Every monetary value changes consistently and the rate assumption is visible. |
| EST-CMD-003 | Estate Command shall filter by Global and available countries without mixing hidden geographies. | Country selection changes tenants, offices, assets, risks, and market pulse. |
| EST-CMD-004 | Estate Command shall prioritize intervention decisions, not duplicate tenant comparison. | Command contains market flow, live queue, geographic pulse, and constraint heatmap; tenant comparison remains on `/estate/tenants`. |
| EST-TEN-001 | Estate Tenant Control shall compare verified supply, title readiness, demand, occupancy, rent, land, deposits, maintenance, and exceptions. | One comparison surface answers which tenant needs investigation and why. |
| EST-TEN-002 | Selected-tenant details shall drive every dependent component. | Selecting Heritage replaces Prime Accra payment/asset/location/evidence content. |
| EST-TEN-003 | Location contribution shall follow tenant → country → city → office/portfolio. | No contribution card remains pinned to another tenant. |
| EST-ERP-001 | Every Estate tenant shall have distinct Analytics and ERP systems. | Tenant entry offers both systems; ERP routes mutate operational ledgers, Analytics reads governed projections. |
| EST-ERP-002 | Property registry shall support properties, buildings, units, plots, ownership, mandates, listing state, pricing, media, and location. | User can create, edit, filter, and open the complete asset record. |
| EST-ERP-003 | Verification shall block publication or deposit release when required ownership, title, mandate, survey, or identity evidence is missing/expired. | State transition is rejected and logged until controls pass. |
| EST-ERP-004 | CRM shall preserve BLKK mediation from enquiry through controlled offer. | The counterparty workflow is buyer/renter ↔ BLKK ↔ owner/landlord, with a complete conversation and decision trail. |
| EST-ERP-005 | Rentals shall support tenancy application, lease, deposit, recurring rent, arrears, renewal, notice, inspection, move-in and move-out. | One rental can be operated from application to closed tenancy with reconciled balances. |
| EST-ERP-006 | Land shall support plot GPS/boundary, survey, title/tenure, zoning, encumbrance, valuation basis and controlled reservation. | Land records cannot be confused with houses or generic inventory. |
| EST-ERP-007 | Maintenance shall link request, unit, occupant, landlord, vendor, cost approval, access, work completion, evidence and recovery. | Request can progress through a controlled SLA lifecycle and update finance. |
| EST-ERP-008 | Estate finance shall reconcile deposits, escrow, rent roll, arrears, commissions, owner remittances, maintenance recoveries and tax. | Subledgers reconcile to the Estate finance position by tenant and office. |
| EST-DATA-001 | Every aggregate shall retain tenant, geography, asset, person, workflow, period, currency, source and evidence identifiers. | Drill reaches the original contributing record and preserves inherited filters. |
| EST-NFR-001 | Domain purity shall be tested. | Estate routes contain no crop, harvest, vehicle, mechanic, parts, or unrelated vertical fixtures. |

## 5. Phased iterative closure plan

### Phase 1 — Estate central foundation

- Create typed Estate mock/data-adapter boundary.
- Build dedicated Estate Command.
- Build dedicated Estate Tenant Control.
- Implement period, currency, geography, tenant, office, and evidence drills.
- Add domain-purity and filter-behavior checks.

### Phase 2 — Estate tenant shell and asset registry

- Add dual Analytics/ERP chooser for Estate tenants.
- Build Estate ERP sidebar by operating department.
- Implement properties, buildings, units, land plots, owners, mandates, documents, media and publication controls.
- Add location and reporting-period scope inherited across ERP and Analytics.

### Phase 3 — Demand, viewing, inspection, and controlled deal

- Implement enquiries, qualification, matching, advisor CRM, appointments, access windows, inspections, reports, offer versions and approvals.
- Implement BLKK-controlled reservations, deposit/escrow, agreements, signatures and handover.

### Phase 4 — Rentals, leases, and facilities

- Implement tenancy applications, screening, leases, recurring rent schedules, arrears, renewals, notices and move-in/out.
- Implement maintenance intake, triage, vendor assignment, approvals, access, completion evidence, recoveries and SLA analytics.

### Phase 5 — Enterprise control

- Implement Estate finance, commissions, landlord statements, owner remittances, tax, P&L, reconciliation, workforce, roles, documents, audit log, reports, signatures and PDF/XLSX exports.

### Phase 6 — Estate analytics and institutional evidence

- Build dashboard, BI, performance, reports and property/agent/owner/customer analytics from the operational repository.
- Add yield, vacancy, absorption, price/rent movement, demand-supply mismatch, title risk, viewing conversion, arrears, maintenance and agent quality.
- Complete record lineage and lender/insurer/regulator-ready evidence packs.

## 6. Phase 1 acceptance

- `/estate` is visually and analytically distinct from Autos and other verticals.
- `/estate/tenants` is not a duplicate of Estate Command.
- Real-time/Today/7D/30D/YTD, GHS/USD, and Global/country controls alter derived results.
- Selecting an Estate tenant changes asset mix, commercial position, office/location contribution, and evidence.
- Residential sale, rental, commercial, land, and development are represented without agricultural or automotive entities.
- Simulation data is labelled, isolated, and replaceable through one typed adapter.

## 7. Implemented closure status

### Complete in the frontend

- Phase 1 Estate Command and Estate Tenant Control, with period, currency, country, tenant, office/portfolio, and evidence interaction.
- Phase 2 dual Estate tenant systems, department-based sidebars, property register, listings, land, owners/mandates, and title-file operating ledgers.
- Phase 3 enquiry, viewing, inspection, offer, agreement, deposit, and handover ledgers with module-specific states, filters, forms, and controlled record persistence.
- Phase 4 lease, rent, maintenance, and vendor ledgers.
- Phase 5 workforce and Estate finance ledgers, selectable report builder, print/PDF workflow, Estate audit log, location hierarchy, and technical-only settings.
- Phase 6 tenant Analytics pages for supply, rentals, land, title, demand, viewings, deals, maintenance, workforce, finance, marketing, and reports. Visual form follows the decision: composition, funnel, trend, relationship, comparison, and evidence drill.

### Preserved backend integration seam

- The frontend uses isolated, labelled Estate domain simulation data and local operational persistence.
- The typed Estate tenant, location, property-mix, metric, and evidence contracts are the adapter boundary for the later backend merge.
- Server-enforced authorization, registry checks, escrow release, signatures, recurring billing, accounting posting, files/media, and immutable audit persistence remain backend responsibilities. The frontend does not falsely present those external controls as live integrations.
