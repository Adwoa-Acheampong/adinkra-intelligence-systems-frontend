export type AglErpModuleView =
  | 'assistant'
  | 'workflow'
  | 'ledger'
  | 'directory'
  | 'statement'
  | 'documents'
  | 'audit'
  | 'register';

export type AglFieldType = 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea';

export interface AglFieldDefinition {
  key: string;
  label: string;
  type: AglFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface AglColumnDefinition {
  key: string;
  label: string;
  format?: 'money' | 'status' | 'date' | 'number';
}

export type AglRecordValue = string | number | boolean | undefined;

export interface AglOperationalRecord {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orgCountry?: string;
  orgCountryCode?: string;
  orgCity?: string;
  branchId?: string;
  branchName?: string;
  siteId?: string;
  siteName?: string;
  [key: string]: AglRecordValue;
}

export interface AglModuleDefinition {
  id: string;
  title: string;
  description: string;
  entityName: string;
  primaryAction: string;
  view: AglErpModuleView;
  statuses: string[];
  fields: AglFieldDefinition[];
  columns: AglColumnDefinition[];
  seedRecords: AglOperationalRecord[];
}

export interface AglAuditEvent {
  id: string;
  tenantId: 'agl';
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 'LOGIN' | 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'EXPORT' | 'APPROVE' | 'SIGN' | 'PRINT' | 'IMPORT' | 'DELETE';
  moduleId: string;
  recordId: string;
  summary: string;
  occurredAt: string;
  correlationId: string;
  orgCountry?: string;
  orgCountryCode?: string;
  orgCity?: string;
  branchId?: string;
  branchName?: string;
  siteId?: string;
  siteName?: string;
  before?: Record<string, AglRecordValue>;
  after?: Record<string, AglRecordValue>;
}

export interface AglErpState {
  version: 24;
  records: Record<string, AglOperationalRecord[]>;
  audit: AglAuditEvent[];
}

export interface CreateAglRecordCommand {
  moduleId: string;
  actorName: string;
  actorRole: string;
  correlationId?: string;
  values: Record<string, AglRecordValue>;
}

export interface UpdateAglRecordCommand extends CreateAglRecordCommand {
  recordId: string;
}

export interface AglErpRepository {
  list(moduleId: string): AglOperationalRecord[];
  listAll(moduleId: string): AglOperationalRecord[];
  create(command: CreateAglRecordCommand): AglOperationalRecord;
  update(command: UpdateAglRecordCommand): AglOperationalRecord;
  delete(command: {
    moduleId: string;
    recordId: string;
    actorName: string;
    actorRole: string;
    correlationId?: string;
  }): void;
  changeStatus(command: UpdateAglRecordCommand & { status: string }): AglOperationalRecord;
  recordAction(command: {
    moduleId: string;
    recordId: string;
    actorName: string;
    actorRole: string;
    action: AglAuditEvent['action'];
    summary: string;
    correlationId?: string;
    values?: Record<string, AglRecordValue>;
  }): void;
  state(): AglErpState;
  restore(command: {
    snapshot: unknown;
    mode: 'merge' | 'replace';
    actorName: string;
    actorRole: string;
  }): { modules: number; records: number; auditEvents: number };
  audit(): AglAuditEvent[];
  auditAll(): AglAuditEvent[];
  reset(): void;
}
