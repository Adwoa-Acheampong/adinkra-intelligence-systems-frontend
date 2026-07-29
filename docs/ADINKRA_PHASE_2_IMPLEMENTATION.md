# Adinkra Phase 2 — AGL Reference Tenant

**Status:** In progress  
**Current slice:** Dual tenant systems and operational ERP spine  
**Date:** 28 July 2026

## Corrected Tenant Architecture

AGL now has two sibling applications:

```text
Autos
  → Tenants
    → AGL
      → Analytics
      → ERP
```

- **Analytics** preserves the existing tenant dashboards, visual analysis, comparisons, and evidence drills.
- **ERP** creates and changes the operational records that Analytics will later project.
- ERP contains no dashboard page, exploratory BI, or BLKK Agent Desk.
- Authorized platform personnel use the normal ERP under their authenticated identity.
- Admin Audit records the actor, role, action, module, record, timestamp, and correlation ID.

## Implemented Operational Spine

The AGL ERP is available under `/autos/tenant/agl/erp/*` and opens directly to work orders.

Its grouped operating directories are:

- service operations;
- inventory and procurement;
- sales and customers;
- finance;
- people;
- management and records;
- administration.

All declared ERP routes open working record surfaces. None fall through to `GenericEntityTable`.

The current frontend repository supports:

- create and edit commands;
- controlled workflow status changes;
- persistent mock operational records;
- actor-attributed audit events;
- cross-module record effects;
- CSV audit export;
- search and filtering;
- workflow boards, ledgers, directories, statements, document registers, and an assistant console;
- a small number of contextual operational totals on the relevant page.

## Proven End-to-End Effects

### Sale to finance evidence

```text
New sale
  → paid transaction
  → sales ledger
  → payment register
  → Admin Audit CREATE event
```

### Inventory movement to stock position

```text
Posted receipt / issue / return / adjustment / count
  → exact SKU stock position changes
  → stock control state recalculates
  → movement audit event
  → derived stock-ledger audit event
```

### Workshop record consistency

```text
Work order
  ↔ live job board
  → controlled status progression
  → mutation audit
```

### Expense to financial statement

```text
Approved expense
  → operating-expense general-ledger line
  → P&L recalculation
  → audit trail
```

### Payroll to employee document

```text
Processed payroll line
  → payslip register
  → employee and payroll references
  → audit trail
```

## Implemented Pages

### Service operations

FixBot, customer intake, appointments, job board, work orders, vehicles, mechanic tracker, inspections and QC, recalls, and complaints.

FixBot is operational and queryable. A query opens a diagnostic case requiring human review; it cannot silently mutate a work order, inventory position, sale, or customer record.

### Inventory and procurement

Parts catalogue, stock ledger, stock movements, purchase orders, and suppliers.

Stock movements explicitly distinguish receipt, reservation, issue, return, transfer, adjustment, and count.

### Sales and finance

New sale, sales ledger, customers, quotations, invoices, payments, subscriptions, P&L, expenses, petty cash, creditors, debtors, and reconciliation.

P&L is an operational financial control surface derived from ledgers, not an exploratory BI page.

### Marketing, people, and governance

Campaigns, promotions, leads, marketing spend, employees, departments, attendance, leave and overtime, payroll, payslips, performance, schedules, training, contracts, employee cases, manager desk, documents, business reports, managerial reports, forms, archives, exports, notifications, audit log, users, roles, permissions, branches, locations, integrations, and ERP settings.

## Contracts and Adapters

The frontend operational boundary is defined by:

- `src/erp/agl/contracts.ts`
- `src/erp/agl/moduleDefinitions.ts`
- `src/erp/agl/repository.ts`

The in-browser repository is replaceable. Its command and record boundaries are intended to align with the AGL Ops tRPC/MySQL engine when the frontend and backend repositories are merged.

Canonical backend references:

- `AGL-website/drizzle/schema.ts`
- `AGL-website/server/routers/appointments.ts`
- `AGL-website/server/routers/staff.ts`
- `AGL-website/server/routers/payroll.ts`
- `AGL-website/server/routers/transactions.ts`
- `AGL-website/server/routers/fixbot.ts`
- `AGL-website/server/routers/audit.ts`

`blkk-legacy` remains the marketplace, wallet, checkout, settlement, and dispute engine. It is not the source for AGL workshop, HR, payroll, or operational finance.

## Current Verification

- TypeScript: passed.
- Production build: passed.
- Browser: tenant two-door entry passed.
- Browser: Analytics/ERP switching passed.
- Browser: operational ERP route groups passed.
- Browser: sale creation → sales ledger → audit passed.
- Browser: posted stock receipt → stock ledger balance passed.
- Browser console errors: none.

## Remaining Phase 2 Depth

- Complete the full customer → vehicle → appointment → FixBot → work order → parts → QC → invoice → payment → close workflow.
- Add explicit labour-time, job-note, evidence-upload, estimate-authority, QC, and release commands.
- Add inventory reservations, issues, returns, stocktakes, quarantine, provenance, and PO receipt as first-class transactional dialogs.
- Derive creditors and P&L entirely from the shared finance journal.
- Add payroll-run calculation, approval, finalization, and immutable run snapshots.
- Add document attachment/version operations and generated report parameters.
- Add role-aware command permissions and backend-compatible actor/session context.
- Replace the local operational repository with AGL backend adapters after frontend acceptance.
