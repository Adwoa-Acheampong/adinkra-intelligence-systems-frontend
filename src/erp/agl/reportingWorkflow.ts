import { aglErpRepository } from './repository';
import type { AglOperationalRecord } from './contracts';
import {
  aglScopeLabel,
  readAglOperatingScope,
  recordDate,
} from './operatingScope';

export interface ReportingActor {
  name: string;
  role: string;
}

export interface AglFormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number';
  required?: boolean;
  placeholder?: string;
  auto?: 'today' | 'actor';
}

export interface AglFormTemplate {
  id: string;
  label: string;
  description: string;
  fields: AglFormField[];
}

export type AglReportFamilyId =
  | 'sales'
  | 'performance'
  | 'workshop'
  | 'inventory'
  | 'finance'
  | 'people'
  | 'customers'
  | 'governance';

export type AglReportFormat = 'text' | 'number' | 'money' | 'percent' | 'date';
export type AglReportAggregation = 'count' | 'sum' | 'average' | 'max' | 'rate' | 'distinct';

export interface AglReportDimension {
  key: string;
  label: string;
}

export interface AglReportMeasure {
  key: string;
  label: string;
  aggregation: AglReportAggregation;
  field?: string;
  format: Exclude<AglReportFormat, 'text' | 'date'>;
  matchField?: string;
  matchValue?: string;
}

export interface AglReportColumn {
  key: string;
  label: string;
  format?: AglReportFormat;
}

export interface AglReportSubject {
  id: string;
  familyId: AglReportFamilyId;
  label: string;
  description: string;
  sourceModules: string[];
  dimensions: AglReportDimension[];
  measures: AglReportMeasure[];
  columns: AglReportColumn[];
  defaultGroupBy: string;
  defaultMeasure: string;
  defaultMetricKeys: string[];
  defaultColumns: string[];
}

export interface AglReportConfig {
  title: string;
  subjectId: string;
  groupBy: string;
  primaryMeasure: string;
  metricKeys: string[];
  columns: string[];
  detailLevel: 'summary' | 'grouped' | 'evidence';
  search: string;
  filterFieldA: string;
  filterValueA: string;
  filterFieldB: string;
  filterValueB: string;
  minimumValue: string;
  maximumValue: string;
}

export interface AglReportRow {
  sourceId: string;
  sourceModule: string;
  sourceLabel: string;
  status: string;
  date: string;
  [key: string]: string | number;
}

export interface AglReportGroup {
  label: string;
  value: number;
  count: number;
  sourceIds: string[];
}

export interface AglReportMetric {
  key: string;
  label: string;
  value: number;
  format: Exclude<AglReportFormat, 'text' | 'date'>;
}

export interface AglReportResult {
  version: 2;
  subjectId: string;
  subjectLabel: string;
  familyLabel: string;
  generatedAt: string;
  scopeLabel: string;
  sourceModules: string[];
  methodology: string;
  rowCount: number;
  groupBy: AglReportDimension;
  primaryMeasure: AglReportMeasure;
  metrics: AglReportMetric[];
  groups: AglReportGroup[];
  columns: AglReportColumn[];
  rows: AglReportRow[];
}

export interface AglRetainedReportEnvelope {
  version: 2;
  frozenAt: string;
  scope: ReturnType<typeof readAglOperatingScope>;
  config: AglReportConfig;
  result: AglReportResult;
}

export const AGL_REPORT_FAMILIES: Array<{ id: AglReportFamilyId; label: string; description: string }> = [
  { id: 'sales', label: 'Sales', description: 'Revenue, transactions, customers, channels, tenders, and sales ownership.' },
  { id: 'performance', label: 'Performance', description: 'Mechanic and employee output traced to jobs, attendance, payroll, and performance records.' },
  { id: 'workshop', label: 'Workshop', description: 'Job flow, value, promise risk, bay load, mechanics, customers, and vehicles.' },
  { id: 'inventory', label: 'Inventory', description: 'On-hand units, reservations, available stock, value, ownership, and control state.' },
  { id: 'finance', label: 'Finance', description: 'Expenses, payroll, receivables, commitments, and accountable owners.' },
  { id: 'people', label: 'People', description: 'Attendance, payroll, leave, employee identity, and workforce control.' },
  { id: 'customers', label: 'Customers', description: 'Customer population, acquisition, account ownership, vehicles, and sales value.' },
  { id: 'governance', label: 'Audit & governance', description: 'Who changed what, where, when, and through which controlled action.' },
];

const commonDimensions: AglReportDimension[] = [
  { key: 'status', label: 'Status' },
  { key: 'siteName', label: 'Site' },
  { key: 'branchName', label: 'Branch' },
  { key: 'orgCity', label: 'City' },
  { key: 'orgCountry', label: 'Country' },
];

export const AGL_REPORT_SUBJECTS: AglReportSubject[] = [
  {
    id: 'sales-activity',
    familyId: 'sales',
    label: 'Sales activity',
    description: 'Generate a sales-only report and choose the selling channel, tender, customer, item, vehicle, mechanic, or salesperson used to explain it.',
    sourceModules: ['sales-ledger'],
    dimensions: [
      { key: 'owner', label: 'Salesperson' },
      { key: 'saleType', label: 'Sale type' },
      { key: 'channel', label: 'Channel' },
      { key: 'paymentMethod', label: 'Payment method' },
      { key: 'customer', label: 'Customer' },
      { key: 'item', label: 'Product / service' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'mechanic', label: 'Mechanic' },
      ...commonDimensions,
    ],
    measures: [
      { key: 'salesCount', label: 'Transactions', aggregation: 'count', format: 'number' },
      { key: 'revenue', label: 'Sales value', aggregation: 'sum', field: 'amount', format: 'money' },
      { key: 'averageSale', label: 'Average transaction', aggregation: 'average', field: 'amount', format: 'money' },
      { key: 'units', label: 'Units sold', aggregation: 'sum', field: 'quantity', format: 'number' },
      { key: 'largestSale', label: 'Largest transaction', aggregation: 'max', field: 'amount', format: 'money' },
    ],
    columns: [
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'sourceId', label: 'Sale ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'item', label: 'Product / service' },
      { key: 'saleType', label: 'Sale type' },
      { key: 'channel', label: 'Channel' },
      { key: 'paymentMethod', label: 'Tender' },
      { key: 'mechanic', label: 'Mechanic' },
      { key: 'owner', label: 'Salesperson' },
      { key: 'amount', label: 'Value', format: 'money' },
      { key: 'status', label: 'Status' },
    ],
    defaultGroupBy: 'owner',
    defaultMeasure: 'revenue',
    defaultMetricKeys: ['revenue', 'salesCount', 'averageSale', 'units'],
    defaultColumns: ['date', 'sourceId', 'customer', 'item', 'saleType', 'paymentMethod', 'owner', 'amount', 'status'],
  },
  {
    id: 'mechanic-performance',
    familyId: 'performance',
    label: 'Mechanic performance',
    description: 'Compare mechanics using the work orders they own, then drill to each contributing job card.',
    sourceModules: ['work-orders'],
    dimensions: [
      { key: 'mechanic', label: 'Mechanic' },
      { key: 'status', label: 'Job stage' },
      { key: 'bay', label: 'Bay' },
      { key: 'customer', label: 'Customer' },
      { key: 'vehicle', label: 'Vehicle' },
      ...commonDimensions.slice(1),
    ],
    measures: [
      { key: 'jobCount', label: 'Jobs', aggregation: 'count', format: 'number' },
      { key: 'approvedValue', label: 'Approved job value', aggregation: 'sum', field: 'amount', format: 'money' },
      { key: 'averageJobValue', label: 'Average job value', aggregation: 'average', field: 'amount', format: 'money' },
      { key: 'completionRate', label: 'Completion rate', aggregation: 'rate', matchField: 'status', matchValue: 'Closed', format: 'percent' },
      { key: 'promiseRisk', label: 'Jobs beyond promise', aggregation: 'sum', field: 'promiseRisk', format: 'number' },
    ],
    columns: [
      { key: 'sourceId', label: 'Job card' },
      { key: 'customer', label: 'Customer' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'mechanic', label: 'Mechanic' },
      { key: 'bay', label: 'Bay' },
      { key: 'promise', label: 'Promise', format: 'date' },
      { key: 'amount', label: 'Approved', format: 'money' },
      { key: 'status', label: 'Stage' },
    ],
    defaultGroupBy: 'mechanic',
    defaultMeasure: 'approvedValue',
    defaultMetricKeys: ['jobCount', 'approvedValue', 'averageJobValue', 'completionRate'],
    defaultColumns: ['sourceId', 'customer', 'vehicle', 'mechanic', 'promise', 'amount', 'status'],
  },
  {
    id: 'employee-performance',
    familyId: 'performance',
    label: 'Employee performance',
    description: 'Join the employee master to job, attendance, payroll, and performance evidence without collapsing the underlying records.',
    sourceModules: ['employees', 'work-orders', 'attendance', 'payroll', 'performance'],
    dimensions: [
      { key: 'department', label: 'Department' },
      { key: 'role', label: 'Role' },
      { key: 'name', label: 'Employee' },
      { key: 'status', label: 'Employment state' },
      ...commonDimensions.slice(1),
    ],
    measures: [
      { key: 'employeeCount', label: 'Employees', aggregation: 'count', format: 'number' },
      { key: 'jobsCompleted', label: 'Completed jobs', aggregation: 'sum', field: 'jobsCompleted', format: 'number' },
      { key: 'approvedJobValue', label: 'Approved job value', aggregation: 'sum', field: 'approvedJobValue', format: 'money' },
      { key: 'attendanceHours', label: 'Attendance hours', aggregation: 'sum', field: 'attendanceHours', format: 'number' },
      { key: 'netPay', label: 'Net payroll', aggregation: 'sum', field: 'netPay', format: 'money' },
      { key: 'performanceEntries', label: 'Performance records', aggregation: 'sum', field: 'performanceEntries', format: 'number' },
    ],
    columns: [
      { key: 'sourceId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'role', label: 'Role' },
      { key: 'department', label: 'Department' },
      { key: 'jobsCompleted', label: 'Completed jobs', format: 'number' },
      { key: 'approvedJobValue', label: 'Job value', format: 'money' },
      { key: 'attendanceHours', label: 'Hours', format: 'number' },
      { key: 'netPay', label: 'Net pay', format: 'money' },
      { key: 'performanceEntries', label: 'Performance records', format: 'number' },
      { key: 'status', label: 'State' },
    ],
    defaultGroupBy: 'department',
    defaultMeasure: 'approvedJobValue',
    defaultMetricKeys: ['employeeCount', 'jobsCompleted', 'approvedJobValue', 'attendanceHours'],
    defaultColumns: ['sourceId', 'name', 'role', 'department', 'jobsCompleted', 'approvedJobValue', 'attendanceHours', 'netPay', 'status'],
  },
  {
    id: 'workshop-flow',
    familyId: 'workshop',
    label: 'Workshop flow',
    description: 'Report job intake through release by stage, mechanic, bay, customer, vehicle, or promise risk.',
    sourceModules: ['work-orders'],
    dimensions: [
      { key: 'status', label: 'Job stage' },
      { key: 'mechanic', label: 'Mechanic' },
      { key: 'bay', label: 'Bay' },
      { key: 'customer', label: 'Customer' },
      { key: 'vehicle', label: 'Vehicle' },
      ...commonDimensions.slice(1),
    ],
    measures: [
      { key: 'jobCount', label: 'Jobs', aggregation: 'count', format: 'number' },
      { key: 'approvedValue', label: 'Approved value', aggregation: 'sum', field: 'amount', format: 'money' },
      { key: 'averageJobValue', label: 'Average job value', aggregation: 'average', field: 'amount', format: 'money' },
      { key: 'completionRate', label: 'Completion rate', aggregation: 'rate', matchField: 'status', matchValue: 'Closed', format: 'percent' },
      { key: 'promiseRisk', label: 'Jobs beyond promise', aggregation: 'sum', field: 'promiseRisk', format: 'number' },
    ],
    columns: [
      { key: 'sourceId', label: 'Job card' },
      { key: 'customer', label: 'Customer' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'concern', label: 'Concern / scope' },
      { key: 'mechanic', label: 'Mechanic' },
      { key: 'bay', label: 'Bay' },
      { key: 'promise', label: 'Promise', format: 'date' },
      { key: 'amount', label: 'Approved', format: 'money' },
      { key: 'status', label: 'Stage' },
    ],
    defaultGroupBy: 'status',
    defaultMeasure: 'jobCount',
    defaultMetricKeys: ['jobCount', 'approvedValue', 'completionRate', 'promiseRisk'],
    defaultColumns: ['sourceId', 'customer', 'vehicle', 'mechanic', 'bay', 'promise', 'amount', 'status'],
  },
  {
    id: 'inventory-position',
    familyId: 'inventory',
    label: 'Inventory position',
    description: 'Explain stock quantity and value by part, location, owner, site, or control state.',
    sourceModules: ['stock-ledger'],
    dimensions: [
      { key: 'status', label: 'Control state' },
      { key: 'name', label: 'Part' },
      { key: 'location', label: 'Stock location' },
      { key: 'owner', label: 'Stock owner' },
      ...commonDimensions.slice(1),
    ],
    measures: [
      { key: 'skuCount', label: 'SKUs', aggregation: 'count', format: 'number' },
      { key: 'stockValue', label: 'Inventory value', aggregation: 'sum', field: 'stockValue', format: 'money' },
      { key: 'unitsOnHand', label: 'Units on hand', aggregation: 'sum', field: 'quantity', format: 'number' },
      { key: 'unitsReserved', label: 'Units reserved', aggregation: 'sum', field: 'reserved', format: 'number' },
      { key: 'unitsAvailable', label: 'Units available', aggregation: 'sum', field: 'available', format: 'number' },
    ],
    columns: [
      { key: 'sourceId', label: 'Stock ID' },
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Part' },
      { key: 'location', label: 'Location' },
      { key: 'quantity', label: 'On hand', format: 'number' },
      { key: 'reserved', label: 'Reserved', format: 'number' },
      { key: 'available', label: 'Available', format: 'number' },
      { key: 'unitCost', label: 'Unit cost', format: 'money' },
      { key: 'stockValue', label: 'Stock value', format: 'money' },
      { key: 'status', label: 'State' },
    ],
    defaultGroupBy: 'status',
    defaultMeasure: 'stockValue',
    defaultMetricKeys: ['stockValue', 'skuCount', 'unitsOnHand', 'unitsAvailable'],
    defaultColumns: ['sourceId', 'sku', 'name', 'location', 'quantity', 'reserved', 'available', 'stockValue', 'status'],
  },
  {
    id: 'expense-control',
    familyId: 'finance',
    label: 'Expense control',
    description: 'Generate an expenses-only report by vendor, owner, status, site, or expense line.',
    sourceModules: ['expenses'],
    dimensions: [
      { key: 'name', label: 'Expense category' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'owner', label: 'Owner' },
      { key: 'status', label: 'Approval state' },
      ...commonDimensions.slice(1),
    ],
    measures: [
      { key: 'expenseCount', label: 'Expense entries', aggregation: 'count', format: 'number' },
      { key: 'spend', label: 'Expense value', aggregation: 'sum', field: 'amount', format: 'money' },
      { key: 'averageExpense', label: 'Average expense', aggregation: 'average', field: 'amount', format: 'money' },
      { key: 'largestExpense', label: 'Largest expense', aggregation: 'max', field: 'amount', format: 'money' },
    ],
    columns: [
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'sourceId', label: 'Expense ID' },
      { key: 'name', label: 'Expense' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'owner', label: 'Owner' },
      { key: 'amount', label: 'Amount', format: 'money' },
      { key: 'status', label: 'Approval state' },
    ],
    defaultGroupBy: 'name',
    defaultMeasure: 'spend',
    defaultMetricKeys: ['spend', 'expenseCount', 'averageExpense', 'largestExpense'],
    defaultColumns: ['date', 'sourceId', 'name', 'vendor', 'owner', 'amount', 'status'],
  },
  {
    id: 'payroll-control',
    familyId: 'people',
    label: 'Payroll',
    description: 'Generate payroll-only evidence with gross components, deductions, net pay, owner, and processing state.',
    sourceModules: ['payroll'],
    dimensions: [
      { key: 'name', label: 'Employee' },
      { key: 'status', label: 'Run state' },
      { key: 'owner', label: 'Payroll owner' },
      ...commonDimensions.slice(1),
    ],
    measures: [
      { key: 'employeeCount', label: 'Payroll lines', aggregation: 'count', format: 'number' },
      { key: 'basePay', label: 'Base pay', aggregation: 'sum', field: 'basePay', format: 'money' },
      { key: 'bonus', label: 'Bonus', aggregation: 'sum', field: 'bonus', format: 'money' },
      { key: 'overtime', label: 'Overtime', aggregation: 'sum', field: 'overtime', format: 'money' },
      { key: 'deductions', label: 'Tax & pension', aggregation: 'sum', field: 'deductions', format: 'money' },
      { key: 'netPay', label: 'Net payroll', aggregation: 'sum', field: 'amount', format: 'money' },
    ],
    columns: [
      { key: 'sourceId', label: 'Payroll ID' },
      { key: 'name', label: 'Employee' },
      { key: 'basePay', label: 'Base pay', format: 'money' },
      { key: 'bonus', label: 'Bonus', format: 'money' },
      { key: 'overtime', label: 'Overtime', format: 'money' },
      { key: 'tax', label: 'Tax', format: 'money' },
      { key: 'pension', label: 'Pension', format: 'money' },
      { key: 'amount', label: 'Net pay', format: 'money' },
      { key: 'status', label: 'State' },
    ],
    defaultGroupBy: 'name',
    defaultMeasure: 'netPay',
    defaultMetricKeys: ['netPay', 'basePay', 'bonus', 'deductions'],
    defaultColumns: ['sourceId', 'name', 'basePay', 'bonus', 'overtime', 'tax', 'pension', 'amount', 'status'],
  },
  {
    id: 'attendance-control',
    familyId: 'people',
    label: 'Attendance',
    description: 'Report attendance hours, exceptions, capture source, employee, and review state.',
    sourceModules: ['attendance'],
    dimensions: [
      { key: 'name', label: 'Employee' },
      { key: 'status', label: 'Control state' },
      { key: 'source', label: 'Capture source' },
      { key: 'owner', label: 'Reviewed by' },
      ...commonDimensions.slice(1),
    ],
    measures: [
      { key: 'attendanceRows', label: 'Attendance records', aggregation: 'count', format: 'number' },
      { key: 'hours', label: 'Hours recorded', aggregation: 'sum', field: 'hours', format: 'number' },
      { key: 'exceptions', label: 'Exceptions', aggregation: 'sum', field: 'exception', format: 'number' },
      { key: 'employees', label: 'Employees represented', aggregation: 'distinct', field: 'reference', format: 'number' },
    ],
    columns: [
      { key: 'date', label: 'Work date', format: 'date' },
      { key: 'sourceId', label: 'Attendance ID' },
      { key: 'reference', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'clockIn', label: 'Clock in' },
      { key: 'clockOut', label: 'Clock out' },
      { key: 'hours', label: 'Hours', format: 'number' },
      { key: 'source', label: 'Capture source' },
      { key: 'status', label: 'State' },
    ],
    defaultGroupBy: 'name',
    defaultMeasure: 'hours',
    defaultMetricKeys: ['hours', 'attendanceRows', 'employees', 'exceptions'],
    defaultColumns: ['date', 'sourceId', 'reference', 'name', 'clockIn', 'clockOut', 'hours', 'source', 'status'],
  },
  {
    id: 'customer-base',
    familyId: 'customers',
    label: 'Customer base',
    description: 'Explain the customer population by type, source, locality, owner, activity, and linked sales evidence.',
    sourceModules: ['customers', 'sales-ledger', 'vehicles'],
    dimensions: [
      { key: 'name', label: 'Customer' },
      { key: 'customerType', label: 'Customer type' },
      { key: 'acquisitionChannel', label: 'Acquisition source' },
      { key: 'locality', label: 'Locality' },
      { key: 'owner', label: 'Account owner' },
      { key: 'status', label: 'Customer state' },
      ...commonDimensions.slice(1),
    ],
    measures: [
      { key: 'customerCount', label: 'Customers', aggregation: 'count', format: 'number' },
      { key: 'salesCount', label: 'Transactions', aggregation: 'sum', field: 'salesCount', format: 'number' },
      { key: 'salesValue', label: 'Sales value', aggregation: 'sum', field: 'salesValue', format: 'money' },
      { key: 'vehicles', label: 'Linked vehicles', aggregation: 'sum', field: 'vehicles', format: 'number' },
    ],
    columns: [
      { key: 'sourceId', label: 'Customer ID' },
      { key: 'name', label: 'Customer' },
      { key: 'customerType', label: 'Type' },
      { key: 'acquisitionChannel', label: 'Source' },
      { key: 'locality', label: 'Locality' },
      { key: 'owner', label: 'Account owner' },
      { key: 'salesCount', label: 'Transactions', format: 'number' },
      { key: 'salesValue', label: 'Sales value', format: 'money' },
      { key: 'vehicles', label: 'Vehicles', format: 'number' },
      { key: 'status', label: 'State' },
    ],
    defaultGroupBy: 'acquisitionChannel',
    defaultMeasure: 'customerCount',
    defaultMetricKeys: ['customerCount', 'salesCount', 'salesValue', 'vehicles'],
    defaultColumns: ['sourceId', 'name', 'customerType', 'acquisitionChannel', 'locality', 'owner', 'salesCount', 'salesValue', 'vehicles', 'status'],
  },
  {
    id: 'audit-activity',
    familyId: 'governance',
    label: 'Audit activity',
    description: 'Report controlled actions by actor, module, action, record, branch, site, or date.',
    sourceModules: ['audit-log'],
    dimensions: [
      { key: 'actorName', label: 'Actor' },
      { key: 'actorRole', label: 'Role' },
      { key: 'action', label: 'Action' },
      { key: 'moduleId', label: 'Module' },
      { key: 'siteName', label: 'Site' },
      { key: 'branchName', label: 'Branch' },
    ],
    measures: [
      { key: 'eventCount', label: 'Audit events', aggregation: 'count', format: 'number' },
      { key: 'actors', label: 'Distinct actors', aggregation: 'distinct', field: 'actorName', format: 'number' },
      { key: 'records', label: 'Distinct records', aggregation: 'distinct', field: 'recordId', format: 'number' },
      { key: 'approvals', label: 'Approvals & signatures', aggregation: 'sum', field: 'approvalAction', format: 'number' },
    ],
    columns: [
      { key: 'date', label: 'Occurred', format: 'date' },
      { key: 'sourceId', label: 'Audit ID' },
      { key: 'actorName', label: 'Actor' },
      { key: 'actorRole', label: 'Role' },
      { key: 'action', label: 'Action' },
      { key: 'moduleId', label: 'Module' },
      { key: 'recordId', label: 'Record' },
      { key: 'summary', label: 'Summary' },
      { key: 'siteName', label: 'Site' },
    ],
    defaultGroupBy: 'action',
    defaultMeasure: 'eventCount',
    defaultMetricKeys: ['eventCount', 'actors', 'records', 'approvals'],
    defaultColumns: ['date', 'actorName', 'actorRole', 'action', 'moduleId', 'recordId', 'summary', 'siteName'],
  },
];

export const AGL_FORM_TEMPLATES: AglFormTemplate[] = [
  {
    id: 'customer-complaint',
    label: 'Customer complaint',
    description: 'Capture the customer’s words, affected vehicle, requested resolution, and receiving officer.',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true, auto: 'today' },
      { key: 'customer', label: 'Customer', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'vehicle', label: 'Vehicle / registration', type: 'text' },
      { key: 'description', label: 'Complaint in customer’s own words', type: 'textarea', required: true },
      { key: 'desiredResolution', label: 'Desired resolution', type: 'textarea' },
      { key: 'receivedBy', label: 'Received by', type: 'text', required: true, auto: 'actor' },
    ],
  },
  {
    id: 'parts-requisition',
    label: 'Parts / supplies requisition',
    description: 'Request operational materials with department, quantity, purpose, and estimate.',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true, auto: 'today' },
      { key: 'requestedBy', label: 'Requested by', type: 'text', required: true, auto: 'actor' },
      { key: 'department', label: 'Department', type: 'text', required: true },
      { key: 'items', label: 'Items and quantities', type: 'textarea', required: true },
      { key: 'reason', label: 'Operational reason', type: 'textarea', required: true },
      { key: 'estimatedCost', label: 'Estimated cost (GHS)', type: 'number' },
    ],
  },
  {
    id: 'procurement-authorisation',
    label: 'Procurement authorisation',
    description: 'Authorize a vendor purchase against a budget and business justification.',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true, auto: 'today' },
      { key: 'vendor', label: 'Vendor', type: 'text', required: true },
      { key: 'items', label: 'Items', type: 'textarea', required: true },
      { key: 'amount', label: 'Amount (GHS)', type: 'number', required: true },
      { key: 'budgetCode', label: 'Budget code', type: 'text' },
      { key: 'justification', label: 'Justification', type: 'textarea', required: true },
    ],
  },
  {
    id: 'resolution-letter',
    label: 'Resolution letter',
    description: 'Create a managed response letter that retains its author, approver, and final signature.',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true, auto: 'today' },
      { key: 'addressee', label: 'Addressee', type: 'text', required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'body', label: 'Letter body', type: 'textarea', required: true },
      { key: 'closing', label: 'Closing', type: 'text' },
      { key: 'signatory', label: 'Signatory', type: 'text', required: true, auto: 'actor' },
    ],
  },
  {
    id: 'workshop-incident',
    label: 'Workshop incident report',
    description: 'Preserve the event, people involved, loss estimate, evidence, and corrective action.',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true, auto: 'today' },
      { key: 'reporter', label: 'Reporter', type: 'text', required: true, auto: 'actor' },
      { key: 'incident', label: 'Incident summary', type: 'textarea', required: true },
      { key: 'persons', label: 'Persons involved', type: 'text' },
      { key: 'damage', label: 'Damage / loss estimate (GHS)', type: 'number' },
      { key: 'correctiveAction', label: 'Corrective action', type: 'textarea', required: true },
    ],
  },
];

const total = (moduleId: string, key = 'amount') => aglErpRepository.list(moduleId).reduce(
  (sum, item) => sum + Number(item[key] ?? 0),
  0,
);

const legacyReportSnapshot = () => {
  const sales = aglErpRepository.list('sales-ledger');
  const workOrders = aglErpRepository.list('work-orders');
  const stock = aglErpRepository.list('stock-ledger');
  const employees = aglErpRepository.list('employees');
  const attendance = aglErpRepository.list('attendance');
  const payroll = aglErpRepository.list('payroll');
  const revenue = total('sales-ledger');
  const expenses = Math.abs(total('expenses'));
  const purchaseCommitments = total('purchase-orders');
  return {
    generatedAt: new Date().toISOString(),
    revenue,
    orders: sales.length,
    averageOrder: sales.length ? revenue / sales.length : 0,
    operatingExpenses: expenses,
    purchaseCommitments,
    operatingPosition: revenue - expenses,
    activeJobs: workOrders.filter((job) => !['Closed'].includes(job.status)).length,
    completedJobs: workOrders.filter((job) => job.status === 'Closed').length,
    promiseRisk: workOrders.filter((job) => job.status !== 'Closed' && new Date(String(job.promise ?? '')) < new Date()).length,
    inventoryValue: stock.reduce((sum, item) => sum + Number(item.quantity ?? 0) * Number(item.unitCost ?? 0), 0),
    inventoryUnits: stock.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
    activeStaff: employees.filter((employee) => employee.status === 'Active').length,
    attendanceRows: attendance.length,
    excusedAbsences: attendance.filter((item) => item.status === 'Excused').length,
    netPayroll: payroll.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
  };
};

const asNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const primitiveValues = (record: Record<string, unknown>) => Object.fromEntries(
  Object.entries(record)
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => [key, typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value as string | number]),
);

const recordRow = (moduleId: string, record: Record<string, unknown>): AglReportRow => ({
  ...primitiveValues(record),
  sourceId: String(record.id ?? ''),
  sourceModule: moduleId,
  sourceLabel: String(record.name ?? record.reference ?? record.id ?? ''),
  status: String(record.status ?? ''),
  date: recordDate(record as AglOperationalRecord),
});

const scopedRecords = (moduleId: string) => aglErpRepository.list(moduleId);

const reportRows = (subjectId: string): AglReportRow[] => {
  if (subjectId === 'sales-activity') {
    return scopedRecords('sales-ledger').map((record) => recordRow('sales-ledger', record));
  }
  if (subjectId === 'mechanic-performance' || subjectId === 'workshop-flow') {
    return scopedRecords('work-orders').map((record) => ({
      ...recordRow('work-orders', record),
      promiseRisk: record.status !== 'Closed'
        && Boolean(record.promise)
        && new Date(String(record.promise)).getTime() < Date.now()
        ? 1
        : 0,
    }));
  }
  if (subjectId === 'employee-performance') {
    const workOrders = scopedRecords('work-orders');
    const attendance = scopedRecords('attendance');
    const payroll = scopedRecords('payroll');
    const performance = scopedRecords('performance');
    return scopedRecords('employees').map((employee) => {
      const name = String(employee.name ?? '');
      const employeeJobs = workOrders.filter((job) => String(job.mechanic ?? '') === name);
      const employeeAttendance = attendance.filter((row) => (
        String(row.reference ?? '') === employee.id || String(row.name ?? '') === name
      ));
      const employeePayroll = payroll.filter((row) => (
        String(row.reference ?? '') === employee.id || String(row.name ?? '') === name
      ));
      const employeePerformance = performance.filter((row) => (
        String(row.reference ?? '') === employee.id || String(row.name ?? '') === name
      ));
      return {
        ...recordRow('employees', employee),
        jobsCompleted: employeeJobs.filter((job) => job.status === 'Closed').length,
        approvedJobValue: employeeJobs.reduce((sum, job) => sum + asNumber(job.amount), 0),
        attendanceHours: employeeAttendance.reduce((sum, row) => sum + asNumber(row.hours), 0),
        netPay: employeePayroll.reduce((sum, row) => sum + asNumber(row.amount), 0),
        performanceEntries: employeePerformance.length,
      };
    });
  }
  if (subjectId === 'inventory-position') {
    return scopedRecords('stock-ledger').map((record) => ({
      ...recordRow('stock-ledger', record),
      available: Math.max(0, asNumber(record.quantity) - asNumber(record.reserved)),
      stockValue: asNumber(record.quantity) * asNumber(record.unitCost),
    }));
  }
  if (subjectId === 'expense-control') {
    return scopedRecords('expenses').map((record) => recordRow('expenses', record));
  }
  if (subjectId === 'payroll-control') {
    return scopedRecords('payroll').map((record) => ({
      ...recordRow('payroll', record),
      deductions: asNumber(record.tax) + asNumber(record.pension),
    }));
  }
  if (subjectId === 'attendance-control') {
    return scopedRecords('attendance').map((record) => ({
      ...recordRow('attendance', record),
      exception: ['Recorded', 'Approved'].includes(record.status) ? 0 : 1,
    }));
  }
  if (subjectId === 'customer-base') {
    const sales = scopedRecords('sales-ledger');
    const vehicles = scopedRecords('vehicles');
    return scopedRecords('customers').map((customer) => {
      const name = String(customer.name ?? '');
      const customerSales = sales.filter((sale) => String(sale.customer ?? sale.name ?? '') === name);
      return {
        ...recordRow('customers', customer),
        salesCount: customerSales.length,
        salesValue: customerSales.reduce((sum, sale) => sum + asNumber(sale.amount), 0),
        vehicles: vehicles.filter((vehicle) => String(vehicle.customer ?? '') === name).length,
      };
    });
  }
  if (subjectId === 'audit-activity') {
    return aglErpRepository.audit().map((event) => ({
      ...recordRow('audit-log', event as unknown as Record<string, unknown>),
      recordId: event.recordId,
      moduleId: event.moduleId,
      actorName: event.actorName,
      actorRole: event.actorRole,
      action: event.action,
      summary: event.summary,
      approvalAction: ['APPROVE', 'SIGN'].includes(event.action) ? 1 : 0,
    }));
  }
  return [];
};

const calculateMeasure = (rows: AglReportRow[], measure: AglReportMeasure) => {
  if (measure.aggregation === 'count') return rows.length;
  if (measure.aggregation === 'distinct') {
    return new Set(rows.map((row) => String(row[measure.field ?? 'sourceId'] ?? '')).filter(Boolean)).size;
  }
  if (measure.aggregation === 'rate') {
    if (!rows.length) return 0;
    const matches = rows.filter((row) => String(row[measure.matchField ?? 'status'] ?? '') === String(measure.matchValue ?? '')).length;
    return (matches / rows.length) * 100;
  }
  const values = rows.map((row) => asNumber(row[measure.field ?? 'amount']));
  if (!values.length) return 0;
  if (measure.aggregation === 'average') return values.reduce((sum, value) => sum + value, 0) / values.length;
  if (measure.aggregation === 'max') return Math.max(...values);
  return values.reduce((sum, value) => sum + value, 0);
};

export const defaultAglReportConfig = (subjectId = AGL_REPORT_SUBJECTS[0].id): AglReportConfig => {
  const subject = AGL_REPORT_SUBJECTS.find((candidate) => candidate.id === subjectId) ?? AGL_REPORT_SUBJECTS[0];
  return {
    title: `${subject.label} report`,
    subjectId: subject.id,
    groupBy: subject.defaultGroupBy,
    primaryMeasure: subject.defaultMeasure,
    metricKeys: subject.defaultMetricKeys,
    columns: subject.defaultColumns,
    detailLevel: 'evidence',
    search: '',
    filterFieldA: '',
    filterValueA: '',
    filterFieldB: '',
    filterValueB: '',
    minimumValue: '',
    maximumValue: '',
  };
};

export const buildAglReport = (config: AglReportConfig): AglReportResult => {
  const subject = AGL_REPORT_SUBJECTS.find((candidate) => candidate.id === config.subjectId) ?? AGL_REPORT_SUBJECTS[0];
  const groupBy = subject.dimensions.find((dimension) => dimension.key === config.groupBy) ?? subject.dimensions[0];
  const primaryMeasure = subject.measures.find((measure) => measure.key === config.primaryMeasure) ?? subject.measures[0];
  const search = config.search.trim().toLowerCase();
  const thresholdField = primaryMeasure.field ?? 'amount';
  const minimum = config.minimumValue === '' ? null : Number(config.minimumValue);
  const maximum = config.maximumValue === '' ? null : Number(config.maximumValue);
  const rows = reportRows(subject.id).filter((row) => {
    if (search && !Object.values(row).some((value) => String(value).toLowerCase().includes(search))) return false;
    if (config.filterFieldA && config.filterValueA && String(row[config.filterFieldA] ?? '') !== config.filterValueA) return false;
    if (config.filterFieldB && config.filterValueB && String(row[config.filterFieldB] ?? '') !== config.filterValueB) return false;
    const thresholdValue = asNumber(row[thresholdField]);
    if (minimum !== null && Number.isFinite(minimum) && thresholdValue < minimum) return false;
    if (maximum !== null && Number.isFinite(maximum) && thresholdValue > maximum) return false;
    return true;
  });
  const groupedRows = new Map<string, AglReportRow[]>();
  rows.forEach((row) => {
    const label = String(row[groupBy.key] ?? '').trim() || '(Not recorded)';
    groupedRows.set(label, [...(groupedRows.get(label) ?? []), row]);
  });
  const groups = [...groupedRows.entries()]
    .map(([label, members]) => ({
      label,
      value: calculateMeasure(members, primaryMeasure),
      count: members.length,
      sourceIds: members.map((row) => row.sourceId),
    }))
    .sort((left, right) => right.value - left.value);
  const metricKeys = config.metricKeys.length ? config.metricKeys : subject.defaultMetricKeys;
  const metrics = metricKeys
    .map((key) => subject.measures.find((measure) => measure.key === key))
    .filter((measure): measure is AglReportMeasure => Boolean(measure))
    .map((measure) => ({
      key: measure.key,
      label: measure.label,
      value: calculateMeasure(rows, measure),
      format: measure.format,
    }));
  const selectedColumns = config.columns.length ? config.columns : subject.defaultColumns;
  const columns = selectedColumns
    .map((key) => subject.columns.find((column) => column.key === key))
    .filter((column): column is AglReportColumn => Boolean(column));
  const filterDescription = [
    config.filterFieldA && config.filterValueA ? `${config.filterFieldA} = ${config.filterValueA}` : '',
    config.filterFieldB && config.filterValueB ? `${config.filterFieldB} = ${config.filterValueB}` : '',
    search ? `search contains "${config.search.trim()}"` : '',
    minimum !== null ? `${thresholdField} ≥ ${minimum}` : '',
    maximum !== null ? `${thresholdField} ≤ ${maximum}` : '',
  ].filter(Boolean);
  const family = AGL_REPORT_FAMILIES.find((candidate) => candidate.id === subject.familyId)!;
  return {
    version: 2,
    subjectId: subject.id,
    subjectLabel: subject.label,
    familyLabel: family.label,
    generatedAt: new Date().toISOString(),
    scopeLabel: aglScopeLabel(readAglOperatingScope()),
    sourceModules: subject.sourceModules,
    methodology: `${primaryMeasure.label} is calculated as ${primaryMeasure.aggregation}${primaryMeasure.field ? ` of ${primaryMeasure.field}` : ''}. Population: ${rows.length} scoped evidence record${rows.length === 1 ? '' : 's'}${filterDescription.length ? `. Filters: ${filterDescription.join('; ')}` : ''}.`,
    rowCount: rows.length,
    groupBy,
    primaryMeasure,
    metrics,
    groups,
    columns,
    rows,
  };
};

const requireRecord = (moduleId: string, recordId: string) => {
  const record = aglErpRepository.list(moduleId).find((item) => item.id === recordId);
  if (!record) throw new Error(`${recordId} was not found.`);
  return record;
};

export const aglReportingWorkflow = {
  templates() {
    return AGL_FORM_TEMPLATES;
  },

  formSubmissions() {
    return aglErpRepository.list('forms');
  },

  reports(moduleId: 'business-reports' | 'managerial-reports') {
    return aglErpRepository.list(moduleId);
  },

  submitForm(actor: ReportingActor, templateId: string, values: Record<string, string>, signature?: string | null) {
    const template = AGL_FORM_TEMPLATES.find((item) => item.id === templateId);
    if (!template) throw new Error('Select a valid form template.');
    const missing = template.fields.filter((field) => field.required && !String(values[field.key] ?? '').trim());
    if (missing.length) throw new Error(`${missing.map((field) => field.label).join(', ')} must be completed.`);
    return aglErpRepository.create({
      moduleId: 'forms',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-FORM-${Date.now()}`,
      values: {
        name: template.label,
        templateId,
        reference: String(values.vehicle ?? values.employee ?? values.vendor ?? values.customer ?? ''),
        owner: actor.name,
        submittedBy: actor.name,
        submittedAt: new Date().toISOString(),
        payload: JSON.stringify(values),
        signature: signature ?? '',
        status: signature ? 'Approved' : 'Pending',
      },
    });
  },

  approveForm(actor: ReportingActor, recordId: string, signature: string, approver: string) {
    if (!signature) throw new Error('Capture an approval signature.');
    if (!approver.trim()) throw new Error('Name the approving manager.');
    const record = requireRecord('forms', recordId);
    if (!['Pending', 'Draft'].includes(record.status)) throw new Error('Only a pending or draft form can be approved.');
    const updated = aglErpRepository.changeStatus({
      moduleId: 'forms',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-FORM-SIGN-${Date.now()}`,
      status: 'Approved',
      values: {
        signature,
        approvedBy: approver,
        approvedAt: new Date().toISOString(),
      },
    });
    aglErpRepository.recordAction({
      moduleId: 'forms',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SIGN',
      summary: `${approver} signed and approved ${recordId}.`,
      values: { approvedBy: approver },
    });
    return updated;
  },

  generateReport(
    actor: ReportingActor,
    moduleId: 'business-reports' | 'managerial-reports',
    config: AglReportConfig,
    suppliedResult?: AglReportResult,
  ) {
    if (!config.title.trim()) throw new Error('Name the report before retaining it.');
    if (!config.metricKeys.length) throw new Error('Select at least one report measure.');
    if (!config.columns.length) throw new Error('Select at least one evidence column.');
    const result = suppliedResult ?? buildAglReport(config);
    const frozenAt = new Date().toISOString();
    const envelope: AglRetainedReportEnvelope = {
      version: 2,
      frozenAt,
      scope: readAglOperatingScope(),
      config: { ...config, title: config.title.trim() },
      result: { ...result, generatedAt: frozenAt },
    };
    return aglErpRepository.create({
      moduleId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-REPORT-${Date.now()}`,
      values: {
        name: config.title.trim(),
        reference: result.subjectLabel,
        period: result.scopeLabel,
        reportFamily: result.familyLabel,
        subjectId: result.subjectId,
        recordCount: result.rowCount,
        owner: actor.name,
        generatedAt: frozenAt,
        payload: JSON.stringify(envelope),
        status: 'Draft',
      },
    });
  },

  signReport(actor: ReportingActor, moduleId: 'business-reports' | 'managerial-reports', reportId: string, signature: string, signatory: string) {
    if (!signature || !signatory.trim()) throw new Error('Signatory and signature are required.');
    const report = requireRecord(moduleId, reportId);
    const updated = aglErpRepository.changeStatus({
      moduleId,
      recordId: reportId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-REPORT-SIGN-${Date.now()}`,
      status: 'Approved',
      values: { signature, signatory, signedAt: new Date().toISOString() },
    });
    aglErpRepository.recordAction({
      moduleId,
      recordId: reportId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SIGN',
      summary: `${signatory} signed ${String(report.name)}.`,
      values: { signatory },
    });
    return updated;
  },

  recordPrint(actor: ReportingActor, moduleId: string, recordId: string) {
    aglErpRepository.recordAction({
      moduleId,
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'PRINT',
      summary: `Opened ${recordId} for print or PDF transfer.`,
      values: { printedAt: new Date().toISOString() },
    });
  },

  buildReport: buildAglReport,
  defaultConfig: defaultAglReportConfig,
  subjects: AGL_REPORT_SUBJECTS,
  families: AGL_REPORT_FAMILIES,
  currentSnapshot: legacyReportSnapshot,
};
