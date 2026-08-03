# Adinkra Phase 2 — AGL Reference Tenant

**Status:** In progress  
**Current slice:** AGL workshop service workflow and operational evidence chain
**Date:** 29 July 2026

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

FixBot, customer intake, appointments, job board, work orders, job cards, vehicles, mechanic tracker, inspections and QC, recalls, and complaints.

FixBot is operational and queryable. A query opens a diagnostic case requiring human review; it cannot silently mutate a work order, inventory position, sale, or customer record.

Job Cards is a purpose-built workshop operating instrument rather than another
dashboard. It keeps diagnosis, labour, issued parts, QC, invoice, payment,
evidence, release controls, and lifecycle state attached to one VSR.

Customer Intake is now a purpose-built connected operating instrument. It can
select an existing customer and vehicle or register both with richer contact,
identity, condition, document-expiry, odometer, fuel, damage, accessory, and
authority details. A checked-in intake writes:

```text
Customer master
  -> vehicle registry
  -> intake and arrival-condition evidence
  -> appointment
  -> VSR work order
  -> mirrored Kanban item
  -> dedicated Job Card
  -> one correlated Admin Audit chain
```

The separate Customers, Vehicles, Intake, Appointments, Work Orders, Job Board,
and Job Cards pages remain independently accessible. The connected intake adds
relationships; it does not collapse or replace those registers.

Appointment Control is capacity-first. It binds each booking to the customer
and vehicle masters, reserves a real bay and mechanic, rejects overlapping
resource commitments, retains cancellation reasons, and converts confirmed or
checked-in appointments into linked VSR Job Cards.

Purchase Orders now operate through draft, independent approval, supplier
commitment, partial/full goods receipt, stock posting, quarantine, creditor
evidence, and correlated audit events. Payroll now separates calculation,
readiness, independent batch approval, payment processing, and payslip
generation.

Inventory control now operates at exact SKU and location grain. Cycle counts
retain expected quantity, blind count, variance, independent approval, and the
posted count movement. Transfers use separate request, approval, dispatch, and
destination-receipt evidence. Provenance decisions retain supplier and batch
evidence and change stock eligibility without deleting the received quantity.

Operational finance now separates expense preparation, approval, settlement,
petty-cash custody, tender reconciliation, and immutable journal postings. A
reconciliation variance remains visible after resolution and points to the
adjustment journal and external evidence.

Employment control now versions signed contracts and retains restricted case
chronologies. Termination is blocked until a governing contract, employee
response, contract review, payroll review, decision maker, and decision evidence
are present. Document control versions business records with independent
approval, effective dates, access classes, retention rules, and supersession.

Closed Job Cards now use a controlled correction workflow. Reopening retains
the original release, requires a named approver and evidence reference, creates
a separate correction record, and returns the linked vehicle to workshop
control. New releases create a structured handover record before close.

### Workshop service to vehicle release

```text
Appointment conversion / existing work order
  -> controlled job card
  -> human diagnosis with optional FixBot recommendation
  -> labour ledger
  -> stock reservation / issue / return
  -> evidence references
  -> approved estimate
  -> invoice and sales-ledger entry
  -> final QC
  -> payment register
  -> vehicle release and immutable close
  -> Admin Audit events for every mutation
```

Reservations affect availability but are not billed. Only issued parts contribute
to the approved workshop estimate. Vehicle release is blocked until QC passes and
the invoice is fully paid.

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
- `src/erp/agl/intakeWorkflow.ts`
- `src/erp/agl/appointmentWorkflow.ts`
- `src/erp/agl/procurementWorkflow.ts`
- `src/erp/agl/payrollWorkflow.ts`
- `src/erp/agl/serviceWorkflow.ts`
- `src/erp/agl/inventoryWorkflow.ts`
- `src/erp/agl/financeWorkflow.ts`
- `src/erp/agl/peopleWorkflow.ts`
- `src/erp/agl/documentWorkflow.ts`
- `src/pages/tenant/AglCustomerIntakeWorkspace.tsx`
- `src/pages/tenant/AglAppointmentScheduler.tsx`
- `src/pages/tenant/AglProcurementWorkspace.tsx`
- `src/pages/tenant/AglPayrollWorkspace.tsx`
- `src/pages/tenant/AglQualityHandoverPanel.tsx`
- `src/pages/tenant/AglJobCardWorkspace.tsx`
- `src/pages/tenant/AglInventoryControlWorkspace.tsx`
- `src/pages/tenant/AglFinanceControlWorkspace.tsx`
- `src/pages/tenant/AglPeopleControlWorkspace.tsx`
- `src/pages/tenant/AglDocumentControlWorkspace.tsx`

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
- Browser: diagnosis → labour → stock issue → estimate → invoice → evidence → QC → MoMo payment → vehicle release passed.
- Browser: stock issue reduced the matched steering-rack SKU from 3 to 2.
- Browser: the GHS 5,620 workshop estimate reconciled to GHS 770 labour plus GHS 4,850 issued parts.
- Browser: closed work order, paid invoice, evidence, QC, and actor-attributed audit records persisted after reload.
- Browser: confirmed appointment APT-882 checked in and converted into a fourth job card with linked audit correlation.
- Browser: richer customer and vehicle intake created customer, vehicle, intake, appointment, Kanban item, and a preselected Job Card.
- Browser: generated workshop identity `VSR-4726203` appeared in both the Kanban and dedicated Job Card.
- Browser: eight intake create/update events shared `CORR-INTAKE-1785374726156` while retaining unique audit event IDs.
- Browser: duplicate-phone, duplicate-registration, customer/vehicle ownership, and customer-authorization guards compiled into the intake contract.
- Browser: capacity booking APT-6833214 checked in and converted to VSR-6885856 without re-keying operational context.
- Browser: PUOR-7029634 passed approval and receipt; HYU-RACK-TL-22 moved from 2 to 6 units.
- Browser: payroll moved Ready to Approved to Processed and generated July 2026 payslips.
- Browser: closed VSR-2054 created JOCO-7386417 and reopened only after approver, reason, and evidence.
- Browser: cycle count CNT-9101783 retained count-sheet evidence and posted through a correlated stock movement.
- Browser: MTN MoMo reconciliation RE-9156747 retained its GHS 80 break after resolution and created immutable journal JRN-9188401.
- Browser: contract CO-9315411 activated signed terms for EMP-10023 and updated the governed employee record.
- Browser: employment case EMCA-9344786 retained the initial grievance and correctly blocked termination until Contract review, Employee response, and Payroll review events exist.
- Browser: document DO-9396211 made approved version v1.0 effective while retaining the document/version separation.
- Browser: no new runtime errors observed during the final operational workflow checks.

## Remaining Phase 2 Depth

- Derive creditors and P&L entirely from the shared finance journal.
- Add tax-period close, bank-statement import, and creditor settlement controls.
- Add payroll-correction runs and attendance-to-payroll exception cases.
- Add generated report parameters, saved report runs, and export evidence.
- Add role-aware command permissions and backend-compatible actor/session context.
- Replace the local operational repository with AGL backend adapters after frontend acceptance.
