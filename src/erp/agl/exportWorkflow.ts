import * as XLSX from 'xlsx';
import type { AglAuditEvent, AglOperationalRecord, AglRecordValue } from './contracts';
import { aglErpRepository } from './repository';

export interface AglExportTarget {
  key: string;
  label: string;
  description: string;
  modules: string[];
}

export const AGL_EXPORT_TARGETS: AglExportTarget[] = [
  { key: 'sales', label: 'Sales & customer ledgers', description: 'Sales, quotations, invoices, payments, subscriptions, customers, and vehicles.', modules: ['new-sale', 'sales-ledger', 'quotations', 'invoices', 'payments', 'subscriptions', 'customers', 'vehicles'] },
  { key: 'workshop', label: 'Workshop operations', description: 'Intake, appointments, work orders, diagnostic findings, job detail, inspections, recalls, complaints, and handovers.', modules: ['intake', 'appointments', 'work-orders', 'diagnostic-findings', 'job-labour', 'job-parts', 'job-evidence', 'inspections', 'recalls', 'complaints', 'vehicle-handovers', 'job-corrections'] },
  { key: 'inventory', label: 'Inventory & procurement', description: 'Parts, stock position, movements, counts, transfers, suppliers, and purchase orders.', modules: ['parts', 'stock-ledger', 'stock-movements', 'stock-counts', 'stock-transfers', 'stock-controls', 'suppliers', 'purchase-orders'] },
  { key: 'finance', label: 'Finance books', description: 'P&L, expenses, cash, creditors, debtors, reconciliation, and journal entries.', modules: ['profit-loss', 'expenses', 'petty-cash', 'creditors', 'debtors', 'reconciliation', 'finance-journals'] },
  { key: 'people', label: 'People, attendance & payroll', description: 'Employees, organisation, onboarding, credentials, attendance, leave, payroll, performance, schedules, training, contracts, and cases.', modules: ['employees', 'departments', 'positions', 'onboarding', 'certifications', 'attendance', 'leave', 'payroll', 'payslips', 'performance', 'schedules', 'training', 'contracts', 'employee-cases', 'employment-case-events'] },
  { key: 'management', label: 'Management & evidence', description: 'Daily operations, manager desk, documents, versions, reports, forms, archives, notifications, and audit.', modules: ['daily-entry', 'manager-desk', 'documents', 'document-versions', 'business-reports', 'managerial-reports', 'forms', 'archives', 'notifications', 'audit-log'] },
  { key: 'administration', label: 'Administration', description: 'Users, roles, branches, integrations, and tenant settings.', modules: ['roles', 'users', 'locations', 'integrations', 'settings'] },
];

const actor = { name: 'AGL Admin', role: 'Administrator' };
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const download = (blob: Blob, filename: string) => {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
};

const moduleRows = (moduleId: string): Array<Record<string, AglRecordValue>> => (
  moduleId === 'audit-log'
    ? aglErpRepository.audit().map((event) => ({ ...event })) as unknown as Array<Record<string, AglRecordValue>>
    : aglErpRepository.list(moduleId).map((record) => ({ module: moduleId, ...record }))
);

const flattenedRows = (target: AglExportTarget) => target.modules.flatMap((moduleId) => moduleRows(moduleId));

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
const csvForRows = (rows: Array<Record<string, AglRecordValue>>) => {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [
    keys.map(csvEscape).join(','),
    ...rows.map((row) => keys.map((key) => csvEscape(row[key])).join(',')),
  ].join('\n');
};

const auditExport = (target: AglExportTarget, format: string) => {
  aglErpRepository.recordAction({
    moduleId: 'exports',
    recordId: `EXPORT-${target.key.toUpperCase()}-${Date.now()}`,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'EXPORT',
    summary: `Exported ${target.label} as ${format.toUpperCase()}.`,
    values: { target: target.key, format, moduleCount: target.modules.length },
  });
};

export const aglExportWorkflow = {
  targets() {
    return AGL_EXPORT_TARGETS.map((target) => ({
      ...target,
      records: target.modules.reduce((sum, moduleId) => sum + moduleRows(moduleId).length, 0),
    }));
  },

  csv(target: AglExportTarget) {
    const rows = flattenedRows(target);
    download(new Blob([csvForRows(rows)], { type: 'text/csv;charset=utf-8' }), `agl-${target.key}-${stamp()}.csv`);
    auditExport(target, 'csv');
  },

  xlsx(target: AglExportTarget) {
    const workbook = XLSX.utils.book_new();
    target.modules.forEach((moduleId) => {
      const rows = moduleRows(moduleId);
      const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ module: moduleId, note: 'No records' }]);
      XLSX.utils.book_append_sheet(workbook, sheet, moduleId.slice(0, 31));
    });
    XLSX.writeFile(workbook, `agl-${target.key}-${stamp()}.xlsx`, { compression: true });
    auditExport(target, 'xlsx');
  },

  xlsxRows(input: { key: string; label: string; rows: Array<Record<string, unknown>> }) {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(input.rows.length ? input.rows : [{ note: 'No evidence matched the report definition.' }]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'report-evidence');
    XLSX.writeFile(workbook, `agl-${input.key}-${stamp()}.xlsx`, { compression: true });
    aglErpRepository.recordAction({
      moduleId: 'exports',
      recordId: `REPORT-EXPORT-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'EXPORT',
      summary: `Exported ${input.label} evidence as XLSX.`,
      values: { target: input.key, format: 'xlsx', rows: input.rows.length },
    });
  },

  fullWorkbook() {
    const workbook = XLSX.utils.book_new();
    const state = aglErpRepository.state();
    Object.entries(state.records).forEach(([moduleId, rows]) => {
      const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ module: moduleId, note: 'No records' }]);
      const safeName = moduleId.slice(0, 27);
      const uniqueName = workbook.SheetNames.includes(safeName)
        ? `${safeName.slice(0, 24)}-${workbook.SheetNames.length}`
        : safeName;
      XLSX.utils.book_append_sheet(workbook, sheet, uniqueName);
    });
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(state.audit), 'admin-audit');
    XLSX.writeFile(workbook, `agl-full-erp-${stamp()}.xlsx`, { compression: true });
    aglErpRepository.recordAction({
      moduleId: 'exports',
      recordId: `EXPORT-FULL-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'EXPORT',
      summary: 'Exported the full AGL Operational ERP workbook.',
      values: { format: 'xlsx', moduleCount: Object.keys(state.records).length },
    });
  },

  fullJson() {
    const state = aglErpRepository.state();
    download(
      new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), tenant: 'agl', ...state }, null, 2)], { type: 'application/json' }),
      `agl-full-erp-${stamp()}.json`,
    );
    aglErpRepository.recordAction({
      moduleId: 'exports',
      recordId: `BACKUP-FULL-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'EXPORT',
      summary: 'Downloaded a full AGL Operational ERP JSON backup.',
      values: { format: 'json', moduleCount: Object.keys(state.records).length },
    });
  },

  auditCsv() {
    const rows = aglErpRepository.audit() as unknown as Array<Record<string, AglRecordValue>>;
    download(new Blob([csvForRows(rows)], { type: 'text/csv;charset=utf-8' }), `agl-admin-audit-${stamp()}.csv`);
    aglErpRepository.recordAction({
      moduleId: 'audit-log',
      recordId: `AUDIT-EXPORT-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'EXPORT',
      summary: 'Exported the AGL Admin Audit log as CSV.',
      values: { format: 'csv', rows: rows.length },
    });
  },
};

export const reportAuditRows = (): AglAuditEvent[] => aglErpRepository.audit();
export const reportModuleRows = (moduleId: string): AglOperationalRecord[] => aglErpRepository.list(moduleId);
