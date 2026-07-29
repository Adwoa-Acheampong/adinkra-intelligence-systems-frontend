# ADR-001: Adopt a Federated Intelligence Spine with Evidence-Linked Drill-Through

**Status:** Proposed  
**Date:** 28 July 2026  
**Deciders:** Founder/CEO, Adinkra product architecture, frontend lead, backend lead

## Context

Adinkra must support complete operational ERPs across different industries while also answering city, country, vertical, and continental questions.

The current frontend demonstrates two failure modes that this decision must prevent:

1. Repeating a generic KPI/chart/ledger dashboard across operationally different domains.
2. Building tenant modules independently without a shared metric, scope, lineage, and drill model.

The system must support:

- complete tenant ERPs;
- vertical-specific workflows;
- geographic and organisational aggregation;
- cross-vertical search;
- institutional-grade evidence;
- sensitive employee and customer records;
- controlled BLKK-mediated actions;
- a frontend-first build before the separate backend is wired;
- phased delivery over 32 weeks.

## Decision

Adopt a federated architecture with four rules:

1. **Common ontology kernel plus vertical extensions.** Shared identity, tenant, geography, actor, asset, work, commerce, employment, and evidence concepts form the kernel. Each vertical adds its own entities and rules.

2. **Canonical event and evidence envelope.** Tenant ERPs remain operational systems of record and publish accepted changes through a versioned envelope carrying scope, actor, source, evidence, confidence, and causation.

3. **Metric and drill registries.** Every material metric has one definition, aggregation rule, confidence policy, freshness target, access classification, and drill path.

4. **Frontend-first typed ports.** The 32-week frontend programme validates workflows using realistic fixtures behind replaceable ports. The separate backend later implements those ports without redefining accepted product behaviour.

The implementation sequence is exemplar-first:

```text
Foundation → deep AGL tenant → AutoHub aggregation → additional verticals
→ digital/action plane → continental command and institutional reporting
```

## Options Considered

### Option A: One Universal ERP and Dashboard Template

| Dimension | Assessment |
|---|---|
| Complexity | Low initially |
| Cost | Low initially, high rework |
| Scalability | Technically scalable, semantically weak |
| Team familiarity | High |
| Domain accuracy | Low |
| Drill integrity | Low |
| Time to first screens | Fast |

**Pros**

- Fast to scaffold.
- Consistent components.
- Small initial schema.

**Cons**

- Workshop, merchant, farm, estate, employment, and custody workflows become superficial.
- Central and tenant dashboards look the same.
- Metrics acquire ambiguous meanings.
- Real operational adoption suffers.
- Cross-scope claims cannot be defended.

### Option B: Independent Vertical Products with No Shared Intelligence Model

| Dimension | Assessment |
|---|---|
| Complexity | Medium |
| Cost | Medium initially, high integration cost |
| Scalability | Good within a vertical |
| Team familiarity | Medium |
| Domain accuracy | High |
| Drill integrity | High inside a tenant, low across ecosystem |
| Time to first screens | Medium |

**Pros**

- Each vertical can closely match real work.
- Teams can evolve independently.
- Operational ERPs can become deep.

**Cons**

- Metrics, identity, location, evidence, and access diverge.
- Continental aggregation becomes a series of custom joins.
- Search and ranking cannot work consistently.
- Duplicate definitions undermine institutional reporting.
- Cross-vertical questions become expensive.

### Option C: Federated ERPs with a Canonical Intelligence Spine

| Dimension | Assessment |
|---|---|
| Complexity | Medium-high |
| Cost | Higher foundation cost, lower long-term integration cost |
| Scalability | High |
| Team familiarity | Medium |
| Domain accuracy | High |
| Drill integrity | High |
| Time to first screens | Controlled through phased fixtures |

**Pros**

- Preserves real workflows.
- Enables consistent scope and geography.
- Supports city, country, vertical, and continental roll-ups.
- Makes search, ranking, confidence, and lineage first-class.
- Allows independent backend evolution behind adapters.
- Supports institutional claims and reproducible reports.

**Cons**

- Requires ontology and metric governance.
- Requires adapter ownership.
- Introduces eventual consistency in future event publication.
- Requires careful access filtering during cross-scope drill.
- Foundation work is less visually dramatic than rapid page creation.

## Trade-off Analysis

Option A optimises short-term page volume at the expense of product truth. It reproduces the exact problem the programme is intended to solve.

Option B protects vertical depth but cannot economically produce continental intelligence because every cross-scope question becomes bespoke.

Option C creates more up-front design work, but it is the only option that supports both:

- Mr Kofi’s one remaining scarf as an exact tenant inventory fact; and
- continent-wide trusted inventory value as an institutional claim.

The typed-port approach reduces the main timing risk of Option C. The frontend can validate scope, workflows, fixtures, decisions, and drill-through before backend integration, while the registries prevent fixtures from becoming arbitrary.

## Consequences

### What becomes easier

- Adding new verticals without losing cross-vertical meaning.
- Aggregating from tenant to city, country, and continent.
- Explaining numbers, exclusions, confidence, and rankings.
- Replacing fixtures with backend adapters.
- Creating institutional reports.
- Maintaining BLKK-mediated action paths.
- Auditing sensitive decisions.

### What becomes harder

- Every metric and entity requires governance.
- Route and data-contract reviews become mandatory.
- Teams cannot invent local definitions without registration.
- Permission-aware search and drill require careful design.
- Backend event and aggregate infrastructure must preserve lineage.

### What must be revisited

- Exact event-bus technology after backend review.
- Whether the relationship graph requires a graph database.
- Analytical datastore and materialisation strategy at measured scale.
- Country-specific privacy, employment, tax, and residency rules.
- Model governance for rankings and recommendations.

## Action Items

1. [ ] Accept the common scope hierarchy.
2. [ ] Accept the common ontology kernel and vertical extension rule.
3. [ ] Establish the metric and drill registry in Phase 1.
4. [ ] Create the living system map and update it with every slice.
5. [ ] Refactor existing workshop, inventory, and sales fixtures behind the common contracts.
6. [ ] Define the backend adapter interface before repository integration.
7. [ ] Require confidence, freshness, exclusions, and lineage for institutional metrics.
8. [ ] Require purpose-based access for sensitive employee and customer records.
9. [ ] Run the six Release 1 acceptance scenarios in Week 32.
