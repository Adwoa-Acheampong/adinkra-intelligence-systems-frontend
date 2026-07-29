import { AGL_ERP_MODULES, getAglModuleDefinition } from './moduleDefinitions';
import type {
  AglAuditEvent,
  AglErpRepository,
  AglErpState,
  AglOperationalRecord,
  AglRecordValue,
  CreateAglRecordCommand,
  UpdateAglRecordCommand,
} from './contracts';

const STORAGE_KEY = 'adinkra_agl_operational_erp_v1';
const FIXTURE_TIMESTAMP = '2026-07-28T12:00:00.000Z';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const initialAudit = (): AglAuditEvent[] => [
  {
    id: 'AUD-LOGIN-0001',
    tenantId: 'agl',
    actorId: 'USR-AGL-ADMIN',
    actorName: 'AGL Admin',
    actorRole: 'Administrator',
    action: 'LOGIN',
    moduleId: 'admin',
    recordId: 'SESSION-20260728-01',
    summary: 'Authenticated session opened for Automobiles Ghana Limited.',
    occurredAt: '2026-07-28T08:02:11.000Z',
    correlationId: 'CORR-LOGIN-20260728-01',
  },
];

const seedState = (): AglErpState => ({
  version: 2,
  records: Object.fromEntries(
    Object.values(AGL_ERP_MODULES).map((definition) => [
      definition.id,
      clone(definition.seedRecords),
    ]),
  ),
  audit: initialAudit(),
});

const read = (): AglErpState => {
  if (typeof window === 'undefined') return seedState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const state = seedState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  try {
    const stored = JSON.parse(raw) as AglErpState;
    const currentSeed = seedState();
    if (stored.version !== 2) {
      const migratedRecords = Object.fromEntries(
        Object.entries(currentSeed.records).map(([moduleId, seeded]) => {
          const createdAfterFixture = (stored.records?.[moduleId] ?? []).filter(
            (item) => item.createdAt !== FIXTURE_TIMESTAMP,
          );
          return [moduleId, [...seeded, ...createdAfterFixture]];
        }),
      );
      const migrated: AglErpState = {
        version: 2,
        records: migratedRecords,
        audit: stored.audit?.length ? stored.audit : currentSeed.audit,
      };
      write(migrated);
      return migrated;
    }
    return {
      version: 2,
      records: {
        ...currentSeed.records,
        ...stored.records,
      },
      audit: stored.audit?.length ? stored.audit : currentSeed.audit,
    };
  } catch {
    return seedState();
  }
};

const write = (state: AglErpState) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('agl-erp-change'));
  }
};

const idPrefix = (moduleId: string) => moduleId
  .split('-')
  .map((part) => part.slice(0, 2))
  .join('')
  .toUpperCase()
  .slice(0, 5);

const createId = (moduleId: string) => {
  const suffix = `${Date.now()}`.slice(-7);
  return `${idPrefix(moduleId)}-${suffix}`;
};

const addAudit = (
  state: AglErpState,
  event: Omit<AglAuditEvent, 'id' | 'tenantId' | 'occurredAt' | 'correlationId' | 'actorId'>,
) => {
  const stamp = Date.now();
  state.audit.unshift({
    ...event,
    id: `AUD-${stamp}`,
    tenantId: 'agl',
    actorId: event.actorName === 'AGL Admin' ? 'USR-AGL-ADMIN' : `USR-${event.actorName.toUpperCase().replace(/\W+/g, '-').slice(0, 20)}`,
    occurredAt: new Date(stamp).toISOString(),
    correlationId: `CORR-${stamp}`,
  });
};

const mirrorRecord = (
  state: AglErpState,
  targetModuleId: string,
  source: AglOperationalRecord,
  overrides: Record<string, AglRecordValue> = {},
) => {
  const target = state.records[targetModuleId] ?? [];
  const mirrored = { ...source, ...overrides };
  const existingIndex = target.findIndex((item) => item.id === mirrored.id);
  if (existingIndex >= 0) target[existingIndex] = mirrored;
  else target.unshift(mirrored);
  state.records[targetModuleId] = target;
};

const applyCrossModuleEffects = (
  state: AglErpState,
  moduleId: string,
  item: AglOperationalRecord,
  operation: 'create' | 'update',
  commandActor: { name: string; role: string },
) => {
  if (moduleId === 'new-sale') {
    mirrorRecord(state, 'sales-ledger', item, {
      name: String(item.item ?? 'Sale'),
      reference: item.id,
      owner: String(item.owner ?? 'AGL Admin'),
      notes: String(item.notes ?? 'Recorded from New sale.'),
    });
    if (item.status === 'Paid') {
      mirrorRecord(state, 'payments', item, {
        name: `${String(item.paymentMethod ?? 'Payment')} · ${String(item.customer ?? 'Customer')}`,
        reference: item.id,
        owner: String(item.owner ?? 'AGL Admin'),
      });
    }
  }

  if (moduleId === 'work-orders') mirrorRecord(state, 'job-board', item);
  if (moduleId === 'job-board') mirrorRecord(state, 'work-orders', item);

  if (moduleId === 'expenses') {
    mirrorRecord(state, 'profit-loss', item, {
      id: `GL-${item.id}`,
      category: 'Operating expense',
      amount: -Math.abs(Number(item.amount ?? 0)),
      reference: item.id,
      name: String(item.name ?? 'Operating expense'),
    });
  }

  if (moduleId === 'stock-movements' && operation === 'create' && item.status === 'Posted') {
    const ledger = state.records['stock-ledger'] ?? [];
    const index = ledger.findIndex((position) => String(position.sku) === String(item.sku));
    const before = index >= 0 ? clone(ledger[index]) : undefined;
    const movementType = String(item.movementType ?? 'Adjustment');
    const quantity = Number(item.quantity ?? 0);
    const currentQuantity = Number(before?.quantity ?? 0);
    const currentReserved = Number(before?.reserved ?? 0);
    let nextQuantity = currentQuantity;
    let nextReserved = currentReserved;

    if (movementType === 'Receipt' || movementType === 'Return') nextQuantity += quantity;
    if (movementType === 'Issue') nextQuantity -= quantity;
    if (movementType === 'Adjustment') nextQuantity += quantity;
    if (movementType === 'Count') nextQuantity = quantity;
    if (movementType === 'Reservation') nextReserved += quantity;

    const updated: AglOperationalRecord = {
      id: before?.id ?? `STK-${String(item.sku).replace(/\W+/g, '-').slice(0, 18)}`,
      status: nextQuantity <= 0 ? 'Stockout' : nextQuantity - nextReserved <= 3 ? 'Low stock' : 'Available',
      createdAt: before?.createdAt ?? item.createdAt,
      updatedAt: item.updatedAt,
      sku: item.sku,
      name: item.name,
      location: item.location,
      quantity: nextQuantity,
      reserved: nextReserved,
      unitCost: before?.unitCost ?? 0,
      owner: item.owner,
    };
    if (index >= 0) ledger[index] = updated;
    else ledger.unshift(updated);
    state.records['stock-ledger'] = ledger;
    addAudit(state, {
      actorName: commandActor.name,
      actorRole: commandActor.role,
      action: 'UPDATE',
      moduleId: 'stock-ledger',
      recordId: updated.id,
      summary: `${movementType} ${item.id} changed ${String(item.sku)} on-hand from ${currentQuantity} to ${nextQuantity}.`,
      before,
      after: updated,
    });
  }

  if (moduleId === 'purchase-orders' && ['Approved', 'Ordered', 'Part received', 'Received'].includes(item.status)) {
    mirrorRecord(state, 'creditors', item, {
      name: String(item.supplier ?? 'Supplier'),
      reference: item.id,
      owner: String(item.owner ?? 'AGL Admin'),
      notes: `${String(item.name ?? 'Purchase order')} · ${item.status}`,
      status: item.status === 'Received' ? 'Approval required' : 'Draft',
    });
  }

  if (moduleId === 'payroll' && item.status === 'Processed') {
    mirrorRecord(state, 'payslips', item, {
      name: `${String(item.name ?? 'Employee')} · July 2026 payslip`,
      reference: item.id,
      owner: String(item.owner ?? 'AGL Admin'),
      status: 'Active',
    });
  }
};

const create = (command: CreateAglRecordCommand): AglOperationalRecord => {
  const state = read();
  const definition = getAglModuleDefinition(command.moduleId);
  const timestamp = new Date().toISOString();
  const item: AglOperationalRecord = {
    id: createId(command.moduleId),
    status: definition.statuses[0] ?? 'Open',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...command.values,
  };
  state.records[command.moduleId] = [item, ...(state.records[command.moduleId] ?? [])];
  applyCrossModuleEffects(state, command.moduleId, item, 'create', { name: command.actorName, role: command.actorRole });
  addAudit(state, {
    actorName: command.actorName,
    actorRole: command.actorRole,
    action: 'CREATE',
    moduleId: command.moduleId,
    recordId: item.id,
    summary: `Created ${definition.entityName} ${item.id}.`,
    after: item,
  });
  write(state);
  return item;
};

const update = (command: UpdateAglRecordCommand): AglOperationalRecord => {
  const state = read();
  const records = state.records[command.moduleId] ?? [];
  const index = records.findIndex((item) => item.id === command.recordId);
  if (index < 0) throw new Error(`Record ${command.recordId} was not found.`);
  const before = clone(records[index]);
  const item: AglOperationalRecord = {
    ...before,
    ...command.values,
    id: before.id,
    updatedAt: new Date().toISOString(),
  };
  records[index] = item;
  state.records[command.moduleId] = records;
  applyCrossModuleEffects(state, command.moduleId, item, 'update', { name: command.actorName, role: command.actorRole });
  addAudit(state, {
    actorName: command.actorName,
    actorRole: command.actorRole,
    action: 'UPDATE',
    moduleId: command.moduleId,
    recordId: item.id,
    summary: `Updated ${getAglModuleDefinition(command.moduleId).entityName} ${item.id}.`,
    before,
    after: item,
  });
  write(state);
  return item;
};

const changeStatus: AglErpRepository['changeStatus'] = (command) => {
  const state = read();
  const records = state.records[command.moduleId] ?? [];
  const index = records.findIndex((item) => item.id === command.recordId);
  if (index < 0) throw new Error(`Record ${command.recordId} was not found.`);
  const before = clone(records[index]);
  const item = {
    ...before,
    ...command.values,
    status: command.status,
    updatedAt: new Date().toISOString(),
  };
  records[index] = item;
  state.records[command.moduleId] = records;
  applyCrossModuleEffects(state, command.moduleId, item, 'update', { name: command.actorName, role: command.actorRole });
  addAudit(state, {
    actorName: command.actorName,
    actorRole: command.actorRole,
    action: command.status === 'Approved' ? 'APPROVE' : 'STATUS_CHANGE',
    moduleId: command.moduleId,
    recordId: item.id,
    summary: `Changed ${item.id} from ${before.status} to ${command.status}.`,
    before,
    after: item,
  });
  write(state);
  return item;
};

export const aglErpRepository: AglErpRepository = {
  list(moduleId) {
    return clone(read().records[moduleId] ?? []);
  },
  create,
  update,
  changeStatus,
  audit() {
    return clone(read().audit);
  },
  reset() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    write(seedState());
  },
};
