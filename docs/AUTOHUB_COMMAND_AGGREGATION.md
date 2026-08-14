# AutoHub command aggregation

AutoHub Central has two separate decision surfaces:

- **Automotive Command (`/autos`)** is the real-time cross-tenant control room. It answers what needs intervention now across the selected period, currency, and geography.
- **Auto Tenant Control (`/autos/tenants`)** compares tenant operating positions, then drills into one tenant's evidence and branch/site hierarchy.

Neither surface replaces the tenant operational ERP.

## Current frontend data boundary

- AGL is connected through `aglErpRepository.listAll(...)` and is labelled **Operational records**.
- Kumasi Motors, Adinkra Motors Workshop, and Lagos AutoWorks use isolated connector simulations until their tenant ERPs publish governed records.
- Simulation figures never appear as AGL evidence and never create links to fictitious records.
- The backend merge seam is `buildAutoHubPortfolio()`. A later API adapter can return the same `AutoHubPortfolioSnapshot` contract without rewriting either workspace.

## Metric sources

| AutoHub measure | AGL source | Calculation |
| --- | --- | --- |
| Revenue position | `sales-ledger` | Sum of non-voided sale amounts |
| Inventory value | `stock-ledger` | Sum of on-hand quantity multiplied by unit cost |
| Inventory units | `stock-ledger` | Sum of on-hand quantity |
| Workshop load | `work-orders` | Count where status is not Closed |
| Completed work | `work-orders` | Count where status is Closed |
| Customers | `customers` | Distinct governed customer records |
| Vehicles | `vehicles` | Governed vehicle records |
| Active staff | `employees` | Count where employment status is Active |
| Promise exceptions | stock, purchase orders, complaints, recalls | Low/stockout/quarantined stock plus approval, open complaint, and open recall records |
| Coverage | sales, stock, work orders, customers, vehicles | Share of records carrying country, branch, and site identifiers |

Command-window values are prototype projections from the current tenant snapshots. The selected Real-time/Today/7D/30D/YTD factor is applied consistently, while point-in-time measures such as stock exposure and active jobs are not period-scaled. USD is a visible demonstration conversion at 15.65 GHS/USD until the backend supplies an approved rate source and rate date.

## Drill path

`Automotive Command → tenant → Auto Tenant Control → branch/site → department ledger → record ID`

AutoHub evidence links currently open the AGL sales ledger, stock ledger, or work-order register. Tenant buttons open either the tenant Analytics system or the tenant operational ERP. Branch cards are owned by the selected tenant, so selecting another tenant replaces AGL's site hierarchy instead of leaving it pinned on screen.

## Double-counting rule

Revenue comes from the sales ledger only. Work-order estimates, invoices, and payments are not added to revenue because they may represent the same economic event at different workflow stages.
