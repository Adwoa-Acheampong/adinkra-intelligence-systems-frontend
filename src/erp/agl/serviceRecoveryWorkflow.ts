import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';
import { aglServiceWorkflow } from './serviceWorkflow';

export interface RecoveryActor {
  name: string;
  role: string;
}

const requireText = (value: string, label: string) => {
  if (!value.trim()) throw new Error(`${label} is required.`);
};

export const aglServiceRecoveryWorkflow = {
  createComplaint(actor: RecoveryActor, values: {
    customerName: string;
    customerContact: string;
    vehicle: string;
    previousInvoiceRef: string;
    channel: string;
    categories: string;
    customerWords: string;
    staffInvolved: string;
    promisedResolution: string;
    resolutionDeadline: string;
    owner: string;
  }) {
    requireText(values.customerName, 'Customer name');
    requireText(values.customerWords, 'Complaint in the customer’s words');
    requireText(values.owner, 'Complaint owner');
    const record = aglErpRepository.create({
      moduleId: 'complaints',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        name: `${values.customerName} · ${values.categories || 'Service complaint'}`,
        reference: values.previousInvoiceRef || `CMP-${String(Date.now()).slice(-6)}`,
        receivedAt: new Date().toISOString(),
        notes: values.customerWords,
      },
    });
    return aglErpRepository.changeStatus({
      moduleId: 'complaints',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      status: 'New',
      values: {},
    });
  },

  updateComplaint(actor: RecoveryActor, record: AglOperationalRecord, values: {
    status: string;
    actualResolution: string;
    customerSatisfied: string;
    reviewedBy: string;
    escalatedToCeo: boolean;
    signatureDataUrl: string;
  }) {
    if (values.status === 'Closed') {
      requireText(values.actualResolution, 'Actual resolution');
      requireText(values.reviewedBy, 'Reviewer');
      if (!values.signatureDataUrl) throw new Error('A reviewer signature is required to close a complaint.');
    }
    return aglErpRepository.changeStatus({
      moduleId: 'complaints',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      status: values.status,
      values: {
        ...values,
        resolvedAt: values.status === 'Closed' ? new Date().toISOString() : '',
      },
    });
  },

  lodgeRecall(actor: RecoveryActor, values: {
    jobId: string;
    reason: string;
    penaltyGhs: number;
    mechanicIds: string;
    refundCustomer: boolean;
    restoreParts: boolean;
    owner: string;
  }) {
    const job = aglErpRepository.list('work-orders').find((item) => item.id === values.jobId);
    if (!job) throw new Error('Select a valid original work order.');
    requireText(values.reason, 'Recall reason');
    const correlationId = `RECALL-${Date.now()}`;
    const recall = aglErpRepository.create({
      moduleId: 'recalls',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        ...values,
        name: `Recall · ${String(job.vehicle)}`,
        reference: job.id,
        customer: job.customer,
        vehicle: job.vehicle,
        amount: values.penaltyGhs,
        originalStatus: job.status,
        lodgedAt: new Date().toISOString(),
        notes: values.reason,
      },
    });
    aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: job.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: { recallId: recall.id, recallState: 'Open', status: 'In progress' },
    });
    if (values.refundCustomer && values.penaltyGhs > 0) {
      aglErpRepository.create({
        moduleId: 'expenses',
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: {
          name: `Customer recall remedy · ${job.id}`,
          reference: recall.id,
          category: 'Service recovery',
          amount: values.penaltyGhs,
          date: new Date().toISOString().slice(0, 10),
          evidenceReference: recall.id,
          owner: values.owner,
          notes: values.reason,
        },
      });
    }
    if (values.restoreParts) {
      aglErpRepository.list('job-parts').filter((item) => item.jobId === job.id).forEach((part) => {
        const movement = aglErpRepository.create({
          moduleId: 'stock-movements',
          actorName: actor.name,
          actorRole: actor.role,
          correlationId,
          values: {
            name: String(part.name),
            sku: String(part.sku),
            movementType: 'Return',
            quantity: Number(part.quantity ?? 0),
            location: String(part.location ?? 'Main store'),
            reference: recall.id,
            owner: values.owner,
            notes: `Recall-authorized return from ${job.id}.`,
          },
        });
        aglErpRepository.changeStatus({
          moduleId: 'stock-movements',
          recordId: movement.id,
          actorName: actor.name,
          actorRole: actor.role,
          correlationId,
          status: 'Posted',
          values: {},
        });
      });
    }
    return recall;
  },

  resolveRecall(actor: RecoveryActor, record: AglOperationalRecord, resolution: string) {
    requireText(resolution, 'Recall resolution');
    const updated = aglErpRepository.changeStatus({
      moduleId: 'recalls',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      status: 'Completed',
      values: { resolution, resolvedAt: new Date().toISOString(), resolvedBy: actor.name },
    });
    const jobId = String(record.reference ?? '');
    const job = aglErpRepository.list('work-orders').find((item) => item.id === jobId);
    if (job) {
      aglErpRepository.update({
        moduleId: 'work-orders',
        recordId: job.id,
        actorName: actor.name,
        actorRole: actor.role,
        values: { recallState: 'Completed' },
      });
    }
    return updated;
  },

  completeInspection(actor: RecoveryActor, values: { jobId: string; outcome: 'Pass' | 'Rework required'; inspector: string; roadTest: string; notes: string }) {
    requireText(values.inspector, 'Inspector');
    requireText(values.notes, 'Inspection evidence notes');
    return aglServiceWorkflow.completeQc(values.jobId, actor, values);
  },
};
