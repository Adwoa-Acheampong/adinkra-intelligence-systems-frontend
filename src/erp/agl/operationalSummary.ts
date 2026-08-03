import type { AglModuleDefinition, AglOperationalRecord } from './contracts';

export type AglSummarySemantic = 'records' | 'attention' | 'money' | 'quantity' | 'active' | 'evidence' | 'owned';

export interface AglOperationalSummaryMeasure {
  label: string;
  value: number;
  detail: string;
  semantic: AglSummarySemantic;
  warning?: boolean;
}

const FINANCIAL_MODULES = new Set([
  'new-sale',
  'sales-ledger',
  'quotations',
  'invoices',
  'payments',
  'subscriptions',
  'marketing-spend',
  'profit-loss',
  'expenses',
  'petty-cash',
  'creditors',
  'debtors',
  'reconciliation',
  'finance-journals',
]);

const QUANTITY_MODULES = new Set(['parts', 'stock-movements', 'stock-ledger']);
const ADMIN_MODULES = new Set(['roles', 'users', 'locations', 'integrations', 'settings']);
const DOCUMENT_MODULES = new Set([
  'documents',
  'contracts',
  'payslips',
  'business-reports',
  'managerial-reports',
  'forms',
  'archives',
  'exports',
]);

const ATTENTION_STATES = new Set([
  'Draft',
  'Pending',
  'Approval required',
  'In review',
  'Review required',
  'Correction requested',
  'Rework required',
  'Escalated',
  'Overdue',
  'Open',
  'New',
  'Investigating',
]);

const ACTIVE_STATES = new Set([
  'Active',
  'Available',
  'Approved',
  'Accepted',
  'Completed',
  'Connected',
  'Effective',
  'Paid',
  'Posted',
  'Processed',
  'Ready',
  'Recorded',
  'Settled',
]);

const sum = (records: AglOperationalRecord[], key: string) => (
  records.reduce((total, record) => total + Number(record[key] ?? 0), 0)
);

export const buildAglOperationalSummary = (
  moduleId: string,
  definition: AglModuleDefinition,
  records: AglOperationalRecord[],
): AglOperationalSummaryMeasure[] => {
  const attention = records.filter((record) => ATTENTION_STATES.has(record.status)).length;
  const active = records.filter((record) => ACTIVE_STATES.has(record.status)).length;
  const entityLabel = definition.entityName.replace(/\b\w/g, (letter) => letter.toUpperCase());

  const base: AglOperationalSummaryMeasure[] = [
    {
      label: `${entityLabel} records`,
      value: records.length,
      detail: `Entries in the ${definition.title.toLowerCase()} register`,
      semantic: 'records',
    },
    {
      label: 'Require action',
      value: attention,
      detail: attention
        ? 'Explicit pending, review, exception, or overdue states'
        : 'No records currently carry an action state',
      semantic: 'attention',
      warning: attention > 0,
    },
  ];

  if (FINANCIAL_MODULES.has(moduleId)) {
    return [...base, {
      label: moduleId === 'reconciliation' ? 'Expected value' : 'Recorded financial value',
      value: sum(records, 'amount'),
      detail: 'Monetary value recorded by this finance or commerce module',
      semantic: 'money',
    }];
  }

  if (QUANTITY_MODULES.has(moduleId)) {
    return [...base, {
      label: 'Units in scope',
      value: sum(records, 'quantity'),
      detail: 'Physical units represented by the current records',
      semantic: 'quantity',
    }];
  }

  if (ADMIN_MODULES.has(moduleId)) {
    return [...base, {
      label: 'Active controls',
      value: active,
      detail: 'Definitions or accounts currently enabled for use',
      semantic: 'active',
    }];
  }

  if (DOCUMENT_MODULES.has(moduleId) || definition.view === 'documents') {
    const evidence = records.filter((record) => (
      Boolean(record.reference)
      || Boolean(record.evidenceReference)
      || Boolean(record.currentVersionId)
    )).length;
    return [...base, {
      label: 'Evidence linked',
      value: evidence,
      detail: 'Records carrying a source, file, version, or evidence reference',
      semantic: 'evidence',
    }];
  }

  if (definition.view === 'workflow') {
    const owned = records.filter((record) => Boolean(record.owner)).length;
    return [...base, {
      label: 'Assigned owner',
      value: owned,
      detail: 'Workflow records with an accountable current owner',
      semantic: 'owned',
    }];
  }

  return [...base, {
    label: 'Active records',
    value: active,
    detail: 'Records currently active, approved, available, or completed',
    semantic: 'active',
  }];
};
