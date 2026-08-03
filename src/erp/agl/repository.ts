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
import {
  attachCurrentAglScope,
  filterAglRecords,
  getAglSite,
  getAglWriteSite,
  matchesAglOperatingScope,
  normalizeAglRecordScope,
  scopeFieldsForSite,
} from './operatingScope';

const STORAGE_KEY = 'adinkra_agl_operational_erp_v1';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const retiredFixtureIds = new Set([
  'PAY-8801',
  'PAY-8802',
  'GL-REV-01',
  'GL-COGS-01',
  'GL-OPEX-01',
  'EXP-701',
  'EXP-702',
  'CRE-701',
  'CRE-702',
  'DEB-701',
  'DEB-702',
  'REC-701',
  'REC-702',
  'STK-NGK-01',
  'STK-DEN-01',
  'STK-HYU-01',
  'CUS-8801',
  'CUS-8802',
  'SAL-8801',
  'CAM-1101',
  'SUB-1101',
  'FOR-1101',
  'FB-2048',
  'FB-2051',
  'VSR-2048',
  'VSR-2051',
  'VSR-2054',
  'VEH-918',
  'VEH-919',
  'USE-1101',
]);

const normalizeAuditIds = (events: AglAuditEvent[]): AglAuditEvent[] => {
  const seen = new Set<string>();
  return events.map((event, index) => {
    const source = event.after ?? event.before ?? {};
    const site = getAglSite(String(event.siteId ?? source.siteId ?? '')) ?? getAglWriteSite();
    const scopedEvent = { ...scopeFieldsForSite(site), ...event };
    if (!seen.has(event.id)) {
      seen.add(event.id);
      return scopedEvent;
    }
    const id = `${event.id}-${index + 1}`;
    seen.add(id);
    return { ...scopedEvent, id };
  });
};

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
    ...scopeFieldsForSite(getAglSite('SITE-GH-ACC-EL')!),
  },
];

const seedState = (): AglErpState => ({
  version: 24,
  records: Object.fromEntries(
    Object.values(AGL_ERP_MODULES).map((definition) => [
      definition.id,
      clone(definition.seedRecords.map((record, index) => normalizeAglRecordScope(definition.id, record, index))),
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
    if (stored.version !== 24) {
      const migratedRecords: Record<string, AglOperationalRecord[]> = {};
      const moduleIds = new Set([
        ...Object.keys(currentSeed.records),
        ...Object.keys(stored.records ?? {}),
      ]);
      moduleIds.forEach((moduleId) => {
        const seeded = currentSeed.records[moduleId] ?? [];
        const existing = stored.records?.[moduleId] ?? [];
        const existingById = new Map(existing.map((item) => [item.id, item]));
        const seededIds = new Set(seeded.map((item) => item.id));
        migratedRecords[moduleId] = [
          ...seeded.map((item) => {
            const existing = existingById.get(item.id);
            const merged = { ...item, ...existing };
            if (moduleId === 'roles' && existing && !existing.scope) {
              return {
                ...merged,
                name: item.name,
                scope: item.scope,
                permissions: item.permissions,
                owner: item.owner,
                notes: item.notes,
              };
            }
            if (['positions', 'onboarding', 'certifications'].includes(moduleId) && existing) {
              return {
                ...merged,
                orgCountry: item.orgCountry,
                orgCountryCode: item.orgCountryCode,
                orgCity: item.orgCity,
                branchId: item.branchId,
                branchName: item.branchName,
                siteId: item.siteId,
                siteName: item.siteName,
              };
            }
            return merged;
          }),
          ...existing.filter((item) => (
            !seededIds.has(item.id)
            && !retiredFixtureIds.has(item.id)
            && !(moduleId === 'locations' && (
              item.id === 'AGL-LOC-01'
              || item.reference === 'AGL-LOC-01'
              || item.name === 'Branches & locations record'
            ))
          )),
        ].map((record, index) => normalizeAglRecordScope(moduleId, record, index));
      });
      const migrated: AglErpState = {
        version: 24,
        records: migratedRecords,
        audit: normalizeAuditIds(stored.audit?.length ? stored.audit : currentSeed.audit),
      };
      // A schema migration can be discovered during a render-time read.
      // Persist it silently; dispatching the normal mutation event here would
      // update subscribed React components while another component is rendering.
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return {
      version: 24,
      records: {
        ...currentSeed.records,
        ...stored.records,
      },
      audit: normalizeAuditIds(stored.audit?.length ? stored.audit : currentSeed.audit),
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

const idPrefix = (moduleId: string) => {
  const operationalPrefixes: Record<string, string> = {
    'work-orders': 'VSR',
    'job-board': 'VSR',
    appointments: 'APT',
    intake: 'INT',
    customers: 'CUS',
    vehicles: 'VEH',
    'stock-counts': 'CNT',
    'stock-transfers': 'TRF',
    'stock-controls': 'SCT',
    'finance-journals': 'JRN',
    'document-versions': 'DOCV',
    'employment-case-events': 'CASEV',
  };
  return operationalPrefixes[moduleId] ?? moduleId
    .split('-')
    .map((part) => part.slice(0, 2))
    .join('')
    .toUpperCase()
    .slice(0, 5);
};

const createId = (moduleId: string) => {
  const suffix = `${Date.now()}`.slice(-7);
  return `${idPrefix(moduleId)}-${suffix}`;
};

const addAudit = (
  state: AglErpState,
  event: Omit<AglAuditEvent, 'id' | 'tenantId' | 'occurredAt' | 'correlationId' | 'actorId'>,
  correlationId?: string,
) => {
  const stamp = Date.now();
  state.audit.unshift({
    ...event,
    ...scopeFieldsForSite(
      getAglSite(String(event.after?.siteId ?? event.before?.siteId ?? '')) ?? getAglWriteSite(),
    ),
    id: `AUD-${stamp}-${state.audit.length + 1}`,
    tenantId: 'agl',
    actorId: event.actorName === 'AGL Admin' ? 'USR-AGL-ADMIN' : `USR-${event.actorName.toUpperCase().replace(/\W+/g, '-').slice(0, 20)}`,
    occurredAt: new Date(stamp).toISOString(),
    correlationId: correlationId ?? `CORR-${stamp}`,
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
  commandActor: { name: string; role: string; correlationId?: string },
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

  if (moduleId === 'appointments' && item.status === 'Converted') {
    const workOrders = state.records['work-orders'] ?? [];
    const existing = workOrders.find((workOrder) => workOrder.appointmentId === item.id);
    if (!existing) {
      const timestamp = new Date().toISOString();
      const workOrder: AglOperationalRecord = {
        id: createId('work-orders'),
        status: 'Diagnosis',
        createdAt: timestamp,
        updatedAt: timestamp,
        appointmentId: item.id,
        intakeId: item.intakeId,
        customerId: item.customerId,
        vehicleId: item.vehicleId,
        customer: item.customer,
        vehicle: item.vehicle,
        concern: item.customerComplaint || item.service,
        observedSymptoms: item.observedSymptoms,
        reasonForVisit: item.reasonForVisit,
        preExistingDamage: item.preExistingDamage,
        intakeCondition: item.intakeCondition,
        odometer: item.odometer,
        fuelLevel: item.fuelLevel,
        accessoriesReceived: item.accessoriesReceived,
        customerAuthorizedAt: item.customerAuthorizedAt,
        preferredContact: item.preferredContact,
        expectedCollection: item.expectedCollection,
        mechanic: item.mechanic || 'Unassigned',
        bay: item.bay || 'Unassigned',
        promise: item.date,
        amount: 0,
        advisor: item.owner,
        ...scopeFieldsForSite(getAglSite(String(item.siteId ?? '')) ?? getAglWriteSite()),
      };
      workOrders.unshift(workOrder);
      state.records['work-orders'] = workOrders;
      mirrorRecord(state, 'job-board', workOrder);
      addAudit(state, {
        actorName: commandActor.name,
        actorRole: commandActor.role,
        action: 'CREATE',
        moduleId: 'work-orders',
        recordId: workOrder.id,
        summary: `Converted appointment ${item.id} into work order ${workOrder.id}.`,
        after: workOrder,
      }, commandActor.correlationId);
    }
  }

  if (moduleId === 'fixbot' && item.status === 'Accepted' && item.jobId) {
    const workOrders = state.records['work-orders'] ?? [];
    const index = workOrders.findIndex((workOrder) => workOrder.id === item.jobId);
    if (index >= 0) {
      const before = clone(workOrders[index]);
      const updated: AglOperationalRecord = {
        ...before,
        fixbotCaseId: item.id,
        diagnostic: item.recommendation,
        diagnosticAcceptedBy: commandActor.name,
        diagnosticAcceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      workOrders[index] = updated;
      state.records['work-orders'] = workOrders;
      mirrorRecord(state, 'job-board', updated);
      addAudit(state, {
        actorName: commandActor.name,
        actorRole: commandActor.role,
        action: 'APPROVE',
        moduleId: 'work-orders',
        recordId: updated.id,
        summary: `Attached accepted FixBot case ${item.id} to ${updated.id}.`,
        before,
        after: updated,
      }, commandActor.correlationId);
    }
  }

  if (moduleId === 'expenses' && ['Approved', 'Settled'].includes(item.status)) {
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
    const itemLocation = String(item.location ?? '');
    const index = ledger.findIndex((position) => (
      String(position.sku) === String(item.sku)
      && (!itemLocation || String(position.location ?? '') === itemLocation)
    ));
    const before = index >= 0 ? clone(ledger[index]) : undefined;
    const movementType = String(item.movementType ?? 'Adjustment');
    const quantity = Number(item.quantity ?? 0);
    const currentQuantity = Number(before?.quantity ?? 0);
    const currentReserved = Number(before?.reserved ?? 0);
    let nextQuantity = currentQuantity;
    let nextReserved = currentReserved;

    if (movementType === 'Receipt' || movementType === 'Return') nextQuantity += quantity;
    if (movementType === 'Issue') {
      nextQuantity -= quantity;
      nextReserved = Math.max(0, currentReserved - quantity);
    }
    if (movementType === 'Adjustment') nextQuantity += quantity;
    if (movementType === 'Count') nextQuantity = quantity;
    if (movementType === 'Reservation') nextReserved += quantity;

    const updated: AglOperationalRecord = {
      id: before?.id ?? `STK-${String(item.sku).replace(/\W+/g, '-').slice(0, 18)}`,
      status: nextQuantity <= 0 ? 'Stockout' : nextQuantity - nextReserved <= 3 ? 'Low stock' : 'Available',
      createdAt: before?.createdAt ?? item.createdAt,
      updatedAt: item.updatedAt,
      ...scopeFieldsForSite(getAglSite(String(item.siteId ?? '')) ?? getAglWriteSite()),
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
    }, commandActor.correlationId);
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
  if (command.moduleId === 'stock-movements') {
    const quantity = Number(command.values.quantity ?? 0);
    const movementType = String(command.values.movementType ?? '');
    if (quantity <= 0) throw new Error('Stock movement quantity must be greater than zero.');
    const position = (state.records['stock-ledger'] ?? []).find(
      (candidate) => String(candidate.sku) === String(command.values.sku),
    );
    const onHand = Number(position?.quantity ?? 0);
    const reserved = Number(position?.reserved ?? 0);
    if (movementType === 'Reservation' && quantity > Math.max(0, onHand - reserved)) {
      throw new Error(`Only ${Math.max(0, onHand - reserved)} unreserved units are available.`);
    }
    if (movementType === 'Issue' && quantity > onHand) {
      throw new Error(`Only ${onHand} units are on hand for issue.`);
    }
  }
  const timestamp = new Date().toISOString();
  const item: AglOperationalRecord = {
    id: createId(command.moduleId),
    status: definition.statuses[0] ?? 'Open',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...attachCurrentAglScope(command.moduleId, command.values),
  };
  state.records[command.moduleId] = [item, ...(state.records[command.moduleId] ?? [])];
  applyCrossModuleEffects(state, command.moduleId, item, 'create', {
    name: command.actorName,
    role: command.actorRole,
    correlationId: command.correlationId,
  });
  addAudit(state, {
    actorName: command.actorName,
    actorRole: command.actorRole,
    action: 'CREATE',
    moduleId: command.moduleId,
    recordId: item.id,
    summary: `Created ${definition.entityName} ${item.id}.`,
    after: item,
  }, command.correlationId);
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
    ...(before.siteId ? command.values : attachCurrentAglScope(command.moduleId, command.values)),
    id: before.id,
    updatedAt: new Date().toISOString(),
  };
  records[index] = item;
  state.records[command.moduleId] = records;
  applyCrossModuleEffects(state, command.moduleId, item, 'update', {
    name: command.actorName,
    role: command.actorRole,
    correlationId: command.correlationId,
  });
  addAudit(state, {
    actorName: command.actorName,
    actorRole: command.actorRole,
    action: 'UPDATE',
    moduleId: command.moduleId,
    recordId: item.id,
    summary: `Updated ${getAglModuleDefinition(command.moduleId).entityName} ${item.id}.`,
    before,
    after: item,
  }, command.correlationId);
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
  applyCrossModuleEffects(state, command.moduleId, item, 'update', {
    name: command.actorName,
    role: command.actorRole,
    correlationId: command.correlationId,
  });
  addAudit(state, {
    actorName: command.actorName,
    actorRole: command.actorRole,
    action: command.status === 'Approved' ? 'APPROVE' : 'STATUS_CHANGE',
    moduleId: command.moduleId,
    recordId: item.id,
    summary: `Changed ${item.id} from ${before.status} to ${command.status}.`,
    before,
    after: item,
  }, command.correlationId);
  write(state);
  return item;
};

export const aglErpRepository: AglErpRepository = {
  list(moduleId) {
    return clone(filterAglRecords(moduleId, read().records[moduleId] ?? []));
  },
  listAll(moduleId) {
    return clone(read().records[moduleId] ?? []);
  },
  create,
  update,
  delete(command) {
    const state = read();
    const records = state.records[command.moduleId] ?? [];
    const index = records.findIndex((item) => item.id === command.recordId);
    if (index < 0) throw new Error(`Record ${command.recordId} was not found.`);
    const [before] = records.splice(index, 1);
    state.records[command.moduleId] = records;
    addAudit(state, {
      actorName: command.actorName,
      actorRole: command.actorRole,
      action: 'DELETE',
      moduleId: command.moduleId,
      recordId: command.recordId,
      summary: `Deleted ${getAglModuleDefinition(command.moduleId).entityName} ${command.recordId}.`,
      before,
    }, command.correlationId);
    write(state);
  },
  changeStatus,
  recordAction(command) {
    const state = read();
    addAudit(state, {
      actorName: command.actorName,
      actorRole: command.actorRole,
      action: command.action,
      moduleId: command.moduleId,
      recordId: command.recordId,
      summary: command.summary,
      after: command.values,
    }, command.correlationId);
    write(state);
  },
  state() {
    return clone(read());
  },
  restore(command) {
    if (!command.snapshot || typeof command.snapshot !== 'object') {
      throw new Error('The selected file is not an AGL ERP backup.');
    }
    const candidate = command.snapshot as {
      tenant?: unknown;
      records?: unknown;
      audit?: unknown;
    };
    if (candidate.tenant && candidate.tenant !== 'agl') {
      throw new Error('This backup belongs to another tenant.');
    }
    if (!candidate.records || typeof candidate.records !== 'object' || Array.isArray(candidate.records)) {
      throw new Error('Backup records are missing or malformed.');
    }
    if (candidate.audit !== undefined && !Array.isArray(candidate.audit)) {
      throw new Error('Backup audit history is malformed.');
    }
    const importedRecords: Record<string, AglOperationalRecord[]> = {};
    Object.entries(candidate.records as Record<string, unknown>).forEach(([moduleId, rows]) => {
      if (!Array.isArray(rows)) throw new Error(`Backup module ${moduleId} is not a record list.`);
      const seen = new Set<string>();
      importedRecords[moduleId] = rows.map((row, index) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          throw new Error(`Backup module ${moduleId} contains an invalid row.`);
        }
        const item = row as AglOperationalRecord;
        const id = String(item.id ?? `${idPrefix(moduleId)}-IMPORT-${index + 1}`);
        if (seen.has(id)) throw new Error(`Backup module ${moduleId} contains duplicate record ${id}.`);
        seen.add(id);
        return normalizeAglRecordScope(moduleId, {
          ...item,
          id,
          status: String(item.status ?? 'Imported'),
          createdAt: String(item.createdAt ?? new Date().toISOString()),
          updatedAt: String(item.updatedAt ?? new Date().toISOString()),
        }, index);
      });
    });

    const current = read();
    const next = command.mode === 'replace' ? seedState() : current;
    Object.entries(importedRecords).forEach(([moduleId, imported]) => {
      if (command.mode === 'replace') {
        next.records[moduleId] = imported;
        return;
      }
      const existing = next.records[moduleId] ?? [];
      const importedById = new Map(imported.map((item) => [item.id, item]));
      next.records[moduleId] = [
        ...existing.map((item) => importedById.get(item.id) ?? item),
        ...imported.filter((item) => !existing.some((currentItem) => currentItem.id === item.id)),
      ];
    });
    if (Array.isArray(candidate.audit)) {
      const importedAudit = candidate.audit as AglAuditEvent[];
      next.audit = command.mode === 'replace'
        ? normalizeAuditIds(importedAudit)
        : normalizeAuditIds([...current.audit, ...importedAudit]);
    }
    addAudit(next, {
      actorName: command.actorName,
      actorRole: command.actorRole,
      action: 'IMPORT',
      moduleId: 'archives',
      recordId: `RESTORE-${Date.now()}`,
      summary: `${command.mode === 'replace' ? 'Restored' : 'Merged'} ${Object.keys(importedRecords).length} modules from an AGL ERP JSON backup.`,
      after: {
        mode: command.mode,
        modules: Object.keys(importedRecords).length,
        records: Object.values(importedRecords).reduce((sum, rows) => sum + rows.length, 0),
      },
    });
    write(next);
    return {
      modules: Object.keys(importedRecords).length,
      records: Object.values(importedRecords).reduce((sum, rows) => sum + rows.length, 0),
      auditEvents: next.audit.length,
    };
  },
  audit() {
    return clone(read().audit.filter((event) => matchesAglOperatingScope(event)));
  },
  auditAll() {
    return clone(read().audit);
  },
  reset() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    write(seedState());
  },
};
