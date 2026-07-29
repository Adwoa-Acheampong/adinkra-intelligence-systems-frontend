# Adinkra Decision Visualization Policy

**Status:** Governing frontend policy  
**Date:** 28 July 2026  

## Non-Negotiable Rule

Adinkra dashboards do not default to KPI-card strips.

Every visual must communicate its analytical intent before the user drills:

- comparison;
- trend;
- distribution;
- composition;
- relationship;
- flow;
- geography;
- investigation.

Chart variety is not a goal. The goal is to select the smallest visual form that makes the decision pattern visible.

## Decision-to-Visual Grammar

| Analytical intent | Human question | Preferred forms | Required comparison or context |
|---|---|---|---|
| Comparison | Which entity, cohort, plan or period differs? | Grouped column, ordered bar, bullet, variance bridge | Common baseline, comparator and material variance |
| Trend | When did direction, rate or stability change? | Line, area, small multiples | Time grain, target/prior period and annotations |
| Distribution | What is normal, variable or in the tail? | Histogram, box plot, percentile band | Population, bin/percentile rule and outliers |
| Composition | What makes up the whole? | Stacked column, 100% bar, limited-category donut, treemap | Whole, share and category treatment |
| Relationship | Which observations move together or stand apart? | Scatter, bubble, quadrant | X/Y meaning, reference lines and outlier drill |
| Flow | Where does a true sequence lose cases or time? | Funnel, stage conversion, Sankey when node magnitude matters | Ordered stages, entry population and stage loss |
| Geography | Where is location material to the decision? | Map plus ranked table, corridor flow | Geographic grain, normalisation and coverage |
| Investigation | Which exact record requires action? | Sortable table, matrix and evidence drawer | Record grain, owner, state, action and original evidence |

## Prohibited Defaults

- KPI-card strips as the primary dashboard structure.
- The same chart template across unrelated ERPs.
- Pie or donut charts with too many categories.
- Funnels for non-sequential categories.
- Dual axes without a compelling decision need.
- Decorative gauges, 3D charts or rainbow palettes.
- Averages without distributions when variability changes the decision.
- Charts that cannot filter or drill to an accessible record alternative.

## Required Chart Contract

Every material chart declares:

1. persona and decision;
2. question;
3. analytical intent;
4. metric definition and unit;
5. comparator or reference;
6. population, period and scope;
7. source and freshness;
8. action;
9. drill hierarchy;
10. accessible table or record alternative.

## Implemented Exemplar

AGL FixBot at `/autos/tenant/agl/fixbot` implements:

| Decision question | Visual | Drill |
|---|---|---|
| Where does technician judgment diverge from FixBot? | Grouped columns | Fault family → case queue → evidence |
| What diagnostic work is FixBot seeing? | Donut composition | Fault family → case queue |
| Does confidence translate into faster diagnosis? | Bubble scatter | Observation → FixBot case → evidence |
| Is agreement improving without harming first-pass quality? | Line plus area | Day → cases → evidence |
| Where does work leave the controlled path? | Sequential funnel | Stage → qualifying cases |
| Where is confidence concentrated? | Stacked histogram | Confidence bin → review cases |

The evidence drawer compares AI recommendation with technician finding and retains human approval as the controlling decision.
