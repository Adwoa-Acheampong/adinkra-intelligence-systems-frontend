import * as XLSX from 'xlsx';
import type { AglErpState, AglRecordValue } from './contracts';
import { aglErpRepository } from './repository';

export interface ArchiveActor {
  name: string;
  role: string;
}

export const AGL_IMPORT_TARGETS = [
  { value: 'archives', label: 'Archive only' },
  { value: 'customers', label: 'Customers' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'employees', label: 'Employees' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'stock-ledger', label: 'Inventory opening balance' },
  { value: 'sales-ledger', label: 'Historical sales' },
] as const;

const normalizeKey = (value: string) => value
  .trim()
  .replace(/^\uFEFF/, '')
  .replace(/[^a-zA-Z0-9]+(.)/g, (_, letter: string) => letter.toUpperCase())
  .replace(/^[A-Z]/, (letter) => letter.toLowerCase());

const normalizeRow = (row: Record<string, unknown>): Record<string, AglRecordValue> => {
  const normalized: Record<string, AglRecordValue> = {};
  Object.entries(row).forEach(([key, value]) => {
    if (value === null || value === undefined) normalized[normalizeKey(key)] = '';
    else if (typeof value === 'number' || typeof value === 'boolean') normalized[normalizeKey(key)] = value;
    else normalized[normalizeKey(key)] = String(value).trim();
  });
  return normalized;
};

const first = (row: Record<string, AglRecordValue>, keys: string[], fallback: AglRecordValue = '') => {
  const key = keys.find((candidate) => row[candidate] !== undefined && String(row[candidate]).trim());
  return key ? row[key] : fallback;
};

const targetValues = (
  moduleId: string,
  row: Record<string, AglRecordValue>,
  file: File,
  rowNumber: number,
): Record<string, AglRecordValue> => {
  const common = {
    importFile: file.name,
    importRow: rowNumber,
    importEvidence: `FILE:${file.name}#ROW:${rowNumber}`,
    owner: String(first(row, ['owner', 'recordedBy', 'manager'], 'AGL Admin')),
  };
  if (moduleId === 'archives') {
    return {
      ...common,
      name: String(first(row, ['name', 'customer', 'vehicle', 'workOrder'], `Imported row ${rowNumber}`)),
      reference: String(first(row, ['reference', 'id', 'workOrder', 'invoice'], `${file.name}-${rowNumber}`)),
      sourceType: 'Structured file import',
      rawRecord: JSON.stringify(row),
      notes: String(first(row, ['notes', 'description', 'service'], 'Historical imported record.')),
    };
  }
  if (moduleId === 'customers') {
    return {
      ...common,
      name: String(first(row, ['name', 'customer', 'customerName'])),
      phone: String(first(row, ['phone', 'mobile', 'contact'])),
      email: String(first(row, ['email'])),
      address: String(first(row, ['address', 'location'])),
      locality: String(first(row, ['locality', 'city'])),
      reference: String(first(row, ['reference', 'customerId'], `LEGACY-CUS-${rowNumber}`)),
      notes: String(first(row, ['notes'])),
    };
  }
  if (moduleId === 'vehicles') {
    return {
      ...common,
      name: String(first(row, ['vehicle', 'name'], `${String(first(row, ['make']))} ${String(first(row, ['model']))}`.trim())),
      registration: String(first(row, ['registration', 'reg', 'vehicleRegistration'])),
      vin: String(first(row, ['vin', 'chassis'])),
      make: String(first(row, ['make'])),
      model: String(first(row, ['model'])),
      year: Number(first(row, ['year'], 0)),
      customerId: String(first(row, ['customerId', 'ownerId'])),
      reference: String(first(row, ['reference', 'registration'], `LEGACY-VEH-${rowNumber}`)),
    };
  }
  if (moduleId === 'employees') {
    return {
      ...common,
      name: String(first(row, ['name', 'employee', 'staffName'])),
      role: String(first(row, ['role', 'jobTitle', 'position'])),
      department: String(first(row, ['department'], 'Workshop')),
      phone: String(first(row, ['phone', 'mobile'])),
      email: String(first(row, ['email'])),
      reference: String(first(row, ['employeeId', 'reference', 'staffId'], `LEGACY-EMP-${rowNumber}`)),
      payBasis: String(first(row, ['payBasis'], 'Monthly')),
    };
  }
  if (moduleId === 'attendance') {
    return {
      ...common,
      name: String(first(row, ['name', 'employee', 'staffName'])),
      reference: String(first(row, ['employeeId', 'reference', 'staffId'])),
      date: String(first(row, ['date', 'workDate'])),
      clockIn: String(first(row, ['clockIn', 'timeIn'])),
      clockOut: String(first(row, ['clockOut', 'timeOut'])),
      hours: Number(first(row, ['hours', 'hoursWorked'], 0)),
      source: 'Imported record',
      absenceType: String(first(row, ['absenceType', 'leaveType'], 'None')),
      notes: String(first(row, ['notes'])),
    };
  }
  if (moduleId === 'stock-ledger') {
    return {
      ...common,
      name: String(first(row, ['name', 'part', 'description'])),
      sku: String(first(row, ['sku', 'partNumber', 'code'])),
      location: String(first(row, ['location', 'bin'], 'Main store')),
      quantity: Number(first(row, ['quantity', 'qty', 'onHand'], 0)),
      reserved: Number(first(row, ['reserved'], 0)),
      unitCost: Number(first(row, ['unitCost', 'cost'], 0)),
      reference: String(first(row, ['reference', 'sku'], `LEGACY-STK-${rowNumber}`)),
    };
  }
  return {
    ...common,
    name: String(first(row, ['name', 'customer', 'description'], `Historical sale ${rowNumber}`)),
    customer: String(first(row, ['customer', 'customerName'])),
    reference: String(first(row, ['receipt', 'invoice', 'reference'], `LEGACY-SALE-${rowNumber}`)),
    date: String(first(row, ['date', 'saleDate'])),
    amount: Number(first(row, ['amount', 'total', 'revenue'], 0)),
    paymentMethod: String(first(row, ['paymentMethod', 'tender'], 'Imported')),
    channel: String(first(row, ['channel'], 'Imported')),
    notes: String(first(row, ['notes', 'description'])),
  };
};

const readRows = async (file: File): Promise<Array<Record<string, unknown>>> => {
  if (file.size > 5 * 1024 * 1024) throw new Error('Import files are limited to 5 MB in the frontend beta.');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('The import file does not contain a worksheet.');
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });
};

export const aglArchiveWorkflow = {
  async importStructured(actor: ArchiveActor, file: File, targetModuleId: string) {
    const sourceRows = await readRows(file);
    if (!sourceRows.length) throw new Error('No data rows were found in the import file.');
    if (sourceRows.length > 2_000) throw new Error('A single frontend import is limited to 2,000 rows.');
    const correlationId = `IMPORT-${Date.now()}`;
    sourceRows.forEach((source, index) => {
      const row = normalizeRow(source);
      const created = aglErpRepository.create({
        moduleId: targetModuleId,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: targetValues(targetModuleId, row, file, index + 2),
      });
      aglErpRepository.changeStatus({
        moduleId: targetModuleId,
        recordId: created.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        status: targetModuleId === 'archives' ? 'Archived' : created.status,
        values: {},
      });
    });
    aglErpRepository.recordAction({
      moduleId: 'archives',
      recordId: correlationId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'IMPORT',
      summary: `Imported ${sourceRows.length} rows from ${file.name} into ${targetModuleId}.`,
      correlationId,
      values: { fileName: file.name, rows: sourceRows.length, targetModuleId },
    });
    return { rows: sourceRows.length, targetModuleId };
  },

  async restoreJson(actor: ArchiveActor, file: File, mode: 'merge' | 'replace') {
    if (file.size > 20 * 1024 * 1024) throw new Error('Backup files are limited to 20 MB in the frontend beta.');
    const text = await file.text();
    let snapshot: unknown;
    try {
      snapshot = JSON.parse(text) as AglErpState;
    } catch {
      throw new Error('The selected JSON file cannot be parsed.');
    }
    return aglErpRepository.restore({ snapshot, mode, actorName: actor.name, actorRole: actor.role });
  },
};
