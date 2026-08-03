import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface ProcurementActor {
  name: string;
  role: string;
}

export interface PurchaseOrderDraft {
  supplier: string;
  sku: string;
  name: string;
  quantity: number;
  unitCostGhs: number;
  expectedDate: string;
  location: string;
  demandReference: string;
  owner: string;
  notes: string;
}

const requirePo = (poId: string) => {
  const po = aglErpRepository.list('purchase-orders').find((candidate) => candidate.id === poId);
  if (!po) throw new Error(`Purchase order ${poId} was not found.`);
  return po;
};

export const aglProcurementWorkflow = {
  purchaseOrders(): AglOperationalRecord[] {
    return aglErpRepository.list('purchase-orders');
  },

  stock(): AglOperationalRecord[] {
    return aglErpRepository.list('stock-ledger');
  },

  suppliers(): AglOperationalRecord[] {
    return aglErpRepository.list('suppliers');
  },

  createSupplier(actor: ProcurementActor, values: {
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    categories: string;
    paymentTerms: string;
    taxId: string;
    address: string;
    owner: string;
  }) {
    if (!values.name.trim() || !values.phone.trim() || !values.categories.trim()) {
      throw new Error('Supplier name, phone, and supplied categories are required.');
    }
    const duplicate = this.suppliers().find((item) => String(item.name).toLowerCase() === values.name.toLowerCase());
    if (duplicate) throw new Error(`${values.name} is already in the supplier register.`);
    return aglErpRepository.create({
      moduleId: 'suppliers',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        reference: `SUP-${String(Date.now()).slice(-6)}`,
        approvalState: 'Pending due diligence',
        provenanceEligible: false,
        notes: 'Supplier requires due-diligence approval before provenance is trusted.',
      },
    });
  },

  approveSupplier(actor: ProcurementActor, supplierId: string, approver: string, evidenceReference: string) {
    if (!approver.trim() || !evidenceReference.trim()) throw new Error('Approver and due-diligence evidence are required.');
    return aglErpRepository.changeStatus({
      moduleId: 'suppliers',
      recordId: supplierId,
      actorName: actor.name,
      actorRole: actor.role,
      status: 'Active',
      values: {
        approvalState: 'Approved',
        provenanceEligible: true,
        approvedBy: approver,
        dueDiligenceEvidence: evidenceReference,
        approvedAt: new Date().toISOString(),
      },
    });
  },

  create(actor: ProcurementActor, draft: PurchaseOrderDraft) {
    if (!draft.supplier.trim() || !draft.sku.trim() || !draft.name.trim()) {
      throw new Error('Supplier, SKU, and description are required.');
    }
    if (draft.quantity <= 0 || draft.unitCostGhs < 0) {
      throw new Error('Quantity must be positive and unit cost cannot be negative.');
    }
    const correlationId = `CORR-PO-${Date.now()}`;
    return aglErpRepository.create({
      moduleId: 'purchase-orders',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        supplier: draft.supplier,
        sku: draft.sku,
        name: draft.name,
        quantity: draft.quantity,
        unitCostGhs: draft.unitCostGhs,
        amount: draft.quantity * draft.unitCostGhs,
        expectedDate: draft.expectedDate,
        location: draft.location,
        demandReference: draft.demandReference,
        owner: draft.owner,
        notes: draft.notes,
        receivedQuantity: 0,
        status: 'Draft',
      },
    });
  },

  submit(poId: string, actor: ProcurementActor) {
    const po = requirePo(poId);
    if (po.status !== 'Draft') throw new Error('Only a draft purchase order can be submitted.');
    return aglErpRepository.changeStatus({
      moduleId: 'purchase-orders',
      recordId: poId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-PO-${Date.now()}`,
      status: 'Approval required',
      values: { submittedAt: new Date().toISOString(), submittedBy: actor.name },
    });
  },

  approve(poId: string, actor: ProcurementActor, approver: string, approvalNote: string) {
    const po = requirePo(poId);
    if (po.status !== 'Approval required') throw new Error('This purchase order is not awaiting approval.');
    if (!approver.trim() || !approvalNote.trim()) throw new Error('Approver and approval basis are required.');
    if (approver.trim().toLowerCase() === String(po.owner ?? '').trim().toLowerCase()) {
      throw new Error('The buyer cannot approve their own purchase order.');
    }
    return aglErpRepository.changeStatus({
      moduleId: 'purchase-orders',
      recordId: poId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-PO-APPROVAL-${Date.now()}`,
      status: 'Approved',
      values: { approver, approvalNote, approvedAt: new Date().toISOString() },
    });
  },

  markOrdered(poId: string, actor: ProcurementActor, supplierReference: string) {
    const po = requirePo(poId);
    if (po.status !== 'Approved') throw new Error('Approve the purchase order before sending it to the supplier.');
    if (!supplierReference.trim()) throw new Error('Supplier order reference is required.');
    return aglErpRepository.changeStatus({
      moduleId: 'purchase-orders',
      recordId: poId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-PO-ORDER-${Date.now()}`,
      status: 'Ordered',
      values: { supplierReference, orderedAt: new Date().toISOString(), orderedBy: actor.name },
    });
  },

  receive(
    poId: string,
    actor: ProcurementActor,
    values: { quantity: number; goodsReceiptReference: string; inspectionResult: 'Accepted' | 'Quarantined'; location: string },
  ) {
    const po = requirePo(poId);
    if (!['Ordered', 'Part received'].includes(po.status)) throw new Error('Only an ordered purchase order can receive goods.');
    if (!String(po.sku ?? '').trim()) throw new Error('Add an exact SKU to this legacy purchase order before receipt.');
    if (values.quantity <= 0) throw new Error('Receipt quantity must be greater than zero.');
    if (!values.goodsReceiptReference.trim()) throw new Error('Goods receipt evidence is required.');
    const ordered = Number(po.quantity ?? 0);
    const received = Number(po.receivedQuantity ?? 0);
    if (received + values.quantity > ordered) {
      throw new Error(`Receipt exceeds the ${ordered - received} units still open on this purchase order.`);
    }
    const correlationId = `CORR-PO-RECEIPT-${Date.now()}`;
    const movement = aglErpRepository.create({
      moduleId: 'stock-movements',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        movementType: 'Receipt',
        sku: po.sku,
        name: po.name,
        quantity: values.quantity,
        location: values.location || po.location || 'Receiving bay',
        reference: po.id,
        owner: actor.name,
        notes: `${values.goodsReceiptReference} · ${values.inspectionResult}`,
        status: 'Posted',
      },
    });
    const totalReceived = received + values.quantity;
    const status = totalReceived >= ordered ? 'Received' : 'Part received';
    const updated = aglErpRepository.changeStatus({
      moduleId: 'purchase-orders',
      recordId: poId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status,
      values: {
        receivedQuantity: totalReceived,
        lastReceiptId: movement.id,
        lastGoodsReceiptReference: values.goodsReceiptReference,
        inspectionResult: values.inspectionResult,
        receivedAt: new Date().toISOString(),
        receivedBy: actor.name,
      },
    });
    if (values.inspectionResult === 'Quarantined') {
      const position = aglErpRepository.list('stock-ledger').find((candidate) => candidate.sku === po.sku);
      if (position) {
        aglErpRepository.update({
          moduleId: 'stock-ledger',
          recordId: position.id,
          actorName: actor.name,
          actorRole: actor.role,
          correlationId,
          values: { status: 'Quarantined', quarantineReference: values.goodsReceiptReference },
        });
      }
    }
    return { purchaseOrder: updated, movement };
  },
};
