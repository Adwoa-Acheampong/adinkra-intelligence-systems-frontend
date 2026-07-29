# Adinkra Phase 1 — Intelligence Foundation Implementation

**Status:** Frontend foundation implemented with demonstration data  
**Date:** 28 July 2026  
**Backend:** Separate repository; adapters remain intentionally unwired  

## Outcome

Phase 1 establishes the grammar every later ERP slice must use. It does not declare existing dashboards complete. It supplies the shared scope, ontology, metric, confidence, drill, evidence and interaction contracts that Phase 2 will use to rationalise AGL.

The working prototype is available at `/intelligence`.

The first acceptance claim is:

```text
USD 5,000,000 trusted inventory value
  → contributing tenant
  → tenant source record
  → accepted inventory event
  → original stock-count evidence
```

## Week 1 — Scope Grammar

| Deliverable | Implementation | Status |
|---|---|---|
| Continental architecture | `ADINKRA_CONTINENTAL_INTELLIGENCE_ARCHITECTURE.md` | Complete |
| Master orientation | `ADINKRA_MASTER_MINDMAP.md` | Complete |
| Living system map | `ADINKRA_LIVING_SYSTEM_MAP.md` | Complete and maintained |
| Canonical scope hierarchy | `src/intelligence/scopeRegistry.ts` | Implemented |
| Active route-to-scope registry | `src/intelligence/routeScopeRegistry.ts` | Implemented |
| Acceptance scenarios | Architecture and 32-week programme | Complete |

## Week 2 — Common Ontology Kernel

`src/intelligence/ontologyRegistry.ts` registers person, organisation, location, asset, work item, transaction, employment case and evidence.

Each entity carries a meaning, stable-ID convention, common relationships and vertical extensions. This keeps a vehicle, product, property, farm lot and metal lot comparable as assets without erasing their domain meaning.

## Week 3 — Metric and Drill Registry

`src/intelligence/contracts.ts` defines scope, metric definition, observation, contributor, source event, evidence reference, ontology entity and search result.

`src/intelligence/metricRegistry.ts` registers 24 frontend foundation metrics across inventory, operations, sales, finance, workforce, trust and telemetry.

Each registered metric includes its business question, supported decision, owner, formula, unit, aggregation policy, grain, events, dimensions, scopes, freshness target, confidence policy, inclusion rules, exclusion rules, access class and action.

`src/intelligence/governance.ts` defines the initial confidence, currency and unit rules.

## Week 4 — Intelligence Shell and Explorer

The implementation includes:

- collapsible, context-switching ERP sidebar;
- scope breadcrumbs and as-of state;
- working global search handoff;
- Evidence Explorer route;
- metric-domain navigation;
- ontology view;
- contributor selection;
- claim → record → event → original-evidence drill;
- visible freshness, confidence, coverage and exclusions;
- reusable loading, empty, error, stale and restricted state patterns;
- keyboard focus and reduced-motion support;
- responsive layout without horizontal overflow.

## Verification

| Check | Result |
|---|---|
| Production TypeScript/Vite build | Pass |
| Browser console errors | None |
| Metric domain switch | Pass |
| Search across domains | Pass |
| Contributor selection changes source record | Pass |
| Contributor selection changes source event | Pass |
| Contributor selection changes evidence receipt | Pass |
| Ontology route resolves to ontology registry | Pass |
| Mobile horizontal overflow | None at 390 px |

## Phase Gate

The frontend foundation is accepted for use by Phase 2:

- scope is explicit;
- foundation metrics are registered;
- the prototype drill reaches original evidence;
- the ontology and governance contracts are reusable;
- the backend boundary remains explicit.

Phase 2 must now migrate the AGL tenant exemplar away from local-only metric assumptions and onto these shared contracts. Existing generic tenant modules are not accepted merely because the Phase 1 foundation exists.
