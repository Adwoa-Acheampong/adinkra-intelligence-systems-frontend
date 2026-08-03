import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface InventoryActor {
  name: string;
  role: string;
}

const requireRecord = (moduleId: string, recordId: string) => {
  const record = aglErpRepository.list(moduleId).find((candidate) => candidate.id === recordId);
  if (!record) throw new Error(`${recordId} was not found in ${moduleId}.`);
  return record;
};

const statusFor = (quantity: number, reserved: number, provenanceStatus?: string) => {
  if (provenanceStatus === 'Rejected' || provenanceStatus === 'Pending') return 'Quarantined';
  if (quantity <= 0) return 'Stockout';
  if (quantity - reserved <= 3) return 'Low stock';
  return 'Available';
};

export const aglInventoryWorkflow = {
  catalogue(): AglOperationalRecord[] {
    return aglErpRepository.list('parts');
  },

  positions(): AglOperationalRecord[] {
    return aglErpRepository.list('stock-ledger');
  },

  movements(): AglOperationalRecord[] {
    return aglErpRepository.list('stock-movements');
  },

  counts(): AglOperationalRecord[] {
    return aglErpRepository.list('stock-counts');
  },

  transfers(): AglOperationalRecord[] {
    return aglErpRepository.list('stock-transfers');
  },

  controls(): AglOperationalRecord[] {
    return aglErpRepository.list('stock-controls');
  },

  addPart(
    actor: InventoryActor,
    values: {
      sku: string;
      name: string;
      fitment: string;
      supplier: string;
      unitCost: number;
      salePrice: number;
      openingQuantity: number;
      location: string;
      owner: string;
    },
  ) {
    if (!values.sku.trim() || !values.name.trim() || !values.fitment.trim() || !values.supplier.trim()) {
      throw new Error('SKU, part name, fitment, and supplier are required.');
    }
    if (values.unitCost < 0 || values.salePrice < values.unitCost || values.openingQuantity < 0) {
      throw new Error('Opening quantity cannot be negative and sale price must cover unit cost.');
    }
    const duplicate = this.catalogue().find((item) => String(item.sku).toLowerCase() === values.sku.toLowerCase());
    if (duplicate) throw new Error(`SKU ${values.sku} already exists as ${String(duplicate.name)}.`);
    const correlationId = `CORR-PART-CREATE-${Date.now()}`;
    const part = aglErpRepository.create({
      moduleId: 'parts',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        sku: values.sku,
        name: values.name,
        fitment: values.fitment,
        supplier: values.supplier,
        quantity: values.openingQuantity,
        unitCost: values.unitCost,
        salePrice: values.salePrice,
        owner: values.owner,
      },
    });
    if (values.openingQuantity > 0) {
      aglErpRepository.create({
        moduleId: 'stock-movements',
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: {
          movementType: 'Receipt',
          sku: values.sku,
          name: values.name,
          quantity: values.openingQuantity,
          location: values.location,
          reference: part.id,
          owner: values.owner,
          notes: 'Opening quantity from part registration.',
          status: 'Posted',
        },
      });
    }
    return part;
  },

  updatePart(actor: InventoryActor, partId: string, values: Record<string, string | number | boolean | undefined>) {
    const part = requireRecord('parts', partId);
    if (values.salePrice !== undefined && Number(values.salePrice) < Number(values.unitCost ?? part.unitCost ?? 0)) {
      throw new Error('Sale price cannot be below unit cost.');
    }
    const correlationId = `CORR-PART-UPDATE-${Date.now()}`;
    const updated = aglErpRepository.update({
      moduleId: 'parts',
      recordId: partId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values,
    });
    this.positions().filter((position) => position.sku === part.sku).forEach((position) => {
      aglErpRepository.update({
        moduleId: 'stock-ledger',
        recordId: position.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: {
          name: updated.name,
          unitCost: updated.unitCost,
          salePrice: updated.salePrice,
        },
      });
    });
    return updated;
  },

  addFitment(actor: InventoryActor, partId: string, fitment: string) {
    const part = requireRecord('parts', partId);
    const next = fitment.trim();
    if (!next) throw new Error('Enter a vehicle fitment.');
    const current = String(part.fitment ?? '').split(/\s*[·,;]\s*/).map((value) => value.trim()).filter(Boolean);
    if (current.some((value) => value.toLowerCase() === next.toLowerCase())) throw new Error(`${next} is already linked to this part.`);
    return this.updatePart(actor, partId, { fitment: [...current, next].join(' · ') });
  },

  removeFitment(actor: InventoryActor, partId: string, fitment: string) {
    const part = requireRecord('parts', partId);
    const current = String(part.fitment ?? '').split(/\s*[·,;]\s*/).map((value) => value.trim()).filter(Boolean);
    const next = current.filter((value) => value.toLowerCase() !== fitment.toLowerCase());
    if (next.length === current.length) throw new Error(`${fitment} is not linked to this part.`);
    if (!next.length) throw new Error('A part must retain at least one fitment.');
    return this.updatePart(actor, partId, { fitment: next.join(' · ') });
  },

  retirePart(actor: InventoryActor, partId: string, reason: string) {
    const part = requireRecord('parts', partId);
    if (!reason.trim()) throw new Error('Record why this part is being retired.');
    const positions = this.positions().filter((position) => position.sku === part.sku);
    const onHand = positions.reduce((sum, position) => sum + Number(position.quantity ?? 0), 0);
    const reserved = positions.reduce((sum, position) => sum + Number(position.reserved ?? 0), 0);
    if (onHand > 0 || reserved > 0) throw new Error(`Post stock to zero before retiring this SKU (${onHand} on hand, ${reserved} reserved).`);
    const hasHistory = this.movements().some((item) => item.sku === part.sku)
      || aglErpRepository.list('job-parts').some((item) => item.sku === part.sku)
      || aglErpRepository.list('purchase-orders').some((item) => item.sku === part.sku || String(item.name).includes(String(part.name)));
    if (hasHistory) {
      return {
        action: 'archived' as const,
        part: aglErpRepository.update({
          moduleId: 'parts',
          recordId: partId,
          actorName: actor.name,
          actorRole: actor.role,
          values: { status: 'Archived', retirementReason: reason, retiredAt: new Date().toISOString(), retiredBy: actor.name },
        }),
      };
    }
    aglErpRepository.delete({ moduleId: 'parts', recordId: partId, actorName: actor.name, actorRole: actor.role });
    return { action: 'deleted' as const };
  },

  postMovement(
    actor: InventoryActor,
    values: {
      movementType: 'Receipt' | 'Issue' | 'Return' | 'Adjustment' | 'Reservation';
      sku: string;
      name: string;
      quantity: number;
      location: string;
      reference: string;
      owner: string;
      notes: string;
    },
  ) {
    if (!values.sku.trim() || !values.name.trim() || !values.location.trim() || !values.reference.trim()) {
      throw new Error('Part, location, and source reference are required.');
    }
    if (values.quantity <= 0) throw new Error('Movement quantity must be greater than zero.');
    return aglErpRepository.create({
      moduleId: 'stock-movements',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-STOCK-MOVEMENT-${Date.now()}`,
      values: { ...values, status: 'Posted' },
    });
  },

  startCount(
    positionId: string,
    actor: InventoryActor,
    values: { countedQuantity: number; evidenceReference: string; counter: string; reason: string },
  ) {
    const position = requireRecord('stock-ledger', positionId);
    if (values.countedQuantity < 0) throw new Error('Counted quantity cannot be negative.');
    if (!values.evidenceReference.trim() || !values.counter.trim()) {
      throw new Error('Counter and count evidence are required.');
    }
    const expectedQuantity = Number(position.quantity ?? 0);
    const variance = values.countedQuantity - expectedQuantity;
    const correlationId = `CORR-STOCK-COUNT-${Date.now()}`;
    return aglErpRepository.create({
      moduleId: 'stock-counts',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        stockPositionId: position.id,
        sku: position.sku,
        name: position.name,
        location: position.location,
        expectedQuantity,
        countedQuantity: values.countedQuantity,
        variance,
        evidenceReference: values.evidenceReference,
        counter: values.counter,
        owner: actor.name,
        notes: values.reason,
        status: variance === 0 ? 'Approved' : 'Approval required',
      },
    });
  },

  approveCount(countId: string, actor: InventoryActor, approver: string, basis: string) {
    const count = requireRecord('stock-counts', countId);
    if (count.status !== 'Approval required') throw new Error('Only a variance awaiting approval can be approved.');
    if (!approver.trim() || !basis.trim()) throw new Error('Approver and approval basis are required.');
    if (approver.trim().toLowerCase() === String(count.counter ?? '').trim().toLowerCase()) {
      throw new Error('The person who counted the stock cannot approve their own variance.');
    }
    return aglErpRepository.changeStatus({
      moduleId: 'stock-counts',
      recordId: countId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-STOCK-COUNT-APPROVAL-${Date.now()}`,
      status: 'Approved',
      values: { approver, approvalBasis: basis, approvedAt: new Date().toISOString() },
    });
  },

  postCount(countId: string, actor: InventoryActor) {
    const count = requireRecord('stock-counts', countId);
    if (count.status !== 'Approved') throw new Error('Approve the stock count before posting it.');
    const correlationId = `CORR-STOCK-COUNT-POST-${Date.now()}`;
    const movement = aglErpRepository.create({
      moduleId: 'stock-movements',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        movementType: 'Count',
        sku: count.sku,
        name: count.name,
        quantity: Number(count.countedQuantity ?? 0),
        location: count.location,
        reference: count.id,
        owner: actor.name,
        notes: `${String(count.evidenceReference ?? '')} · variance ${Number(count.variance ?? 0)}`,
        status: 'Posted',
      },
    });
    const posted = aglErpRepository.changeStatus({
      moduleId: 'stock-counts',
      recordId: count.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Posted',
      values: { movementId: movement.id, postedBy: actor.name, postedAt: new Date().toISOString() },
    });
    return { count: posted, movement };
  },

  requestTransfer(
    positionId: string,
    actor: InventoryActor,
    values: { quantity: number; destinationLocation: string; reason: string; evidenceReference: string },
  ) {
    const position = requireRecord('stock-ledger', positionId);
    const available = Number(position.quantity ?? 0) - Number(position.reserved ?? 0);
    if (values.quantity <= 0 || values.quantity > available) {
      throw new Error(`Transfer quantity must be between 1 and ${Math.max(0, available)} unreserved units.`);
    }
    if (!values.destinationLocation.trim() || values.destinationLocation === position.location) {
      throw new Error('Choose a different destination location.');
    }
    if (!values.reason.trim() || !values.evidenceReference.trim()) {
      throw new Error('Transfer reason and evidence reference are required.');
    }
    return aglErpRepository.create({
      moduleId: 'stock-transfers',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-STOCK-TRANSFER-${Date.now()}`,
      values: {
        stockPositionId: position.id,
        sku: position.sku,
        name: position.name,
        quantity: values.quantity,
        sourceLocation: position.location,
        destinationLocation: values.destinationLocation,
        unitCost: position.unitCost,
        evidenceReference: values.evidenceReference,
        owner: actor.name,
        notes: values.reason,
        status: 'Approval required',
      },
    });
  },

  approveTransfer(transferId: string, actor: InventoryActor, approver: string, basis: string) {
    const transfer = requireRecord('stock-transfers', transferId);
    if (transfer.status !== 'Approval required') throw new Error('This transfer is not awaiting approval.');
    if (!approver.trim() || !basis.trim()) throw new Error('Approver and approval basis are required.');
    if (approver.trim().toLowerCase() === String(transfer.owner ?? '').trim().toLowerCase()) {
      throw new Error('The requester cannot approve their own stock transfer.');
    }
    return aglErpRepository.changeStatus({
      moduleId: 'stock-transfers',
      recordId: transferId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-STOCK-TRANSFER-APPROVAL-${Date.now()}`,
      status: 'Approved',
      values: { approver, approvalBasis: basis, approvedAt: new Date().toISOString() },
    });
  },

  completeTransfer(transferId: string, actor: InventoryActor, receiptReference: string) {
    const transfer = requireRecord('stock-transfers', transferId);
    if (transfer.status !== 'Approved') throw new Error('Approve the transfer before dispatch and receipt.');
    if (!receiptReference.trim()) throw new Error('Destination receipt evidence is required.');
    const source = this.positions().find((position) => (
      String(position.sku) === String(transfer.sku)
      && String(position.location) === String(transfer.sourceLocation)
    ));
    const quantity = Number(transfer.quantity ?? 0);
    const available = Number(source?.quantity ?? 0) - Number(source?.reserved ?? 0);
    if (!source || quantity > available) throw new Error('The source no longer has enough unreserved stock.');
    const correlationId = `CORR-STOCK-TRANSFER-POST-${Date.now()}`;
    const issue = aglErpRepository.create({
      moduleId: 'stock-movements',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        movementType: 'Issue',
        sku: transfer.sku,
        name: transfer.name,
        quantity,
        location: transfer.sourceLocation,
        reference: transfer.id,
        owner: actor.name,
        notes: `Transfer dispatch · ${String(transfer.evidenceReference ?? '')}`,
        status: 'Posted',
      },
    });
    const receipt = aglErpRepository.create({
      moduleId: 'stock-movements',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        movementType: 'Receipt',
        sku: transfer.sku,
        name: transfer.name,
        quantity,
        location: transfer.destinationLocation,
        reference: transfer.id,
        owner: actor.name,
        notes: `Transfer receipt · ${receiptReference}`,
        status: 'Posted',
      },
    });
    const completed = aglErpRepository.changeStatus({
      moduleId: 'stock-transfers',
      recordId: transfer.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Completed',
      values: {
        issueMovementId: issue.id,
        receiptMovementId: receipt.id,
        receiptReference,
        completedBy: actor.name,
        completedAt: new Date().toISOString(),
      },
    });
    return { transfer: completed, issue, receipt };
  },

  reviewProvenance(
    positionId: string,
    actor: InventoryActor,
    values: {
      supplierDocument: string;
      batchReference: string;
      reviewer: string;
      decision: 'Accepted' | 'Rejected';
      reason: string;
    },
  ) {
    const position = requireRecord('stock-ledger', positionId);
    if (!values.supplierDocument.trim() || !values.batchReference.trim() || !values.reviewer.trim() || !values.reason.trim()) {
      throw new Error('Supplier document, batch, reviewer, and decision basis are required.');
    }
    const correlationId = `CORR-STOCK-PROVENANCE-${Date.now()}`;
    const control = aglErpRepository.create({
      moduleId: 'stock-controls',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        stockPositionId: position.id,
        sku: position.sku,
        name: position.name,
        location: position.location,
        supplierDocument: values.supplierDocument,
        batchReference: values.batchReference,
        reviewer: values.reviewer,
        decision: values.decision,
        owner: actor.name,
        notes: values.reason,
        status: values.decision,
      },
    });
    const provenanceStatus = values.decision;
    const updated = aglErpRepository.update({
      moduleId: 'stock-ledger',
      recordId: position.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        provenanceStatus,
        provenanceControlId: control.id,
        supplierDocument: values.supplierDocument,
        batchReference: values.batchReference,
        provenanceReviewedBy: values.reviewer,
        provenanceReviewedAt: new Date().toISOString(),
        status: statusFor(Number(position.quantity ?? 0), Number(position.reserved ?? 0), provenanceStatus),
      },
    });
    return { control, position: updated };
  },
};
