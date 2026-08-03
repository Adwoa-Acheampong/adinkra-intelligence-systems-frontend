import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface ServiceActor {
  name: string;
  role: string;
}

export interface AglJobCardSnapshot {
  job: AglOperationalRecord;
  diagnosticFindings: AglOperationalRecord[];
  labour: AglOperationalRecord[];
  parts: AglOperationalRecord[];
  evidence: AglOperationalRecord[];
  inspections: AglOperationalRecord[];
  handovers: AglOperationalRecord[];
  corrections: AglOperationalRecord[];
  invoice?: AglOperationalRecord;
  payments: AglOperationalRecord[];
  labourTotalGhs: number;
  partsTotalGhs: number;
  paidGhs: number;
  balanceGhs: number;
}

const related = (moduleId: string, jobId: string) => (
  aglErpRepository.list(moduleId).filter((record) => record.jobId === jobId)
);

const amountTotal = (records: AglOperationalRecord[]) => records.reduce(
  (sum, record) => sum + Number(record.amount ?? 0),
  0,
);

const requireJob = (jobId: string) => {
  const job = aglErpRepository.list('work-orders').find((record) => record.id === jobId);
  if (!job) throw new Error(`Work order ${jobId} was not found.`);
  return job;
};

const requireOpenJob = (jobId: string) => {
  const job = requireJob(jobId);
  if (job.status === 'Closed') {
    throw new Error(`${jobId} is closed. Reopen it through an authorized correction workflow before changing operations.`);
  }
  return job;
};

const updateJobTotals = (jobId: string, actor: ServiceActor, values: Record<string, string | number | boolean | undefined> = {}) => {
  const labour = related('job-labour', jobId);
  const parts = related('job-parts', jobId).filter((record) => record.status === 'Issue');
  return aglErpRepository.update({
    moduleId: 'work-orders',
    recordId: jobId,
    actorName: actor.name,
    actorRole: actor.role,
    values: {
      labourTotalGhs: amountTotal(labour),
      partsTotalGhs: amountTotal(parts),
      ...values,
    },
  });
};

export const aglServiceWorkflow = {
  listJobs(): AglOperationalRecord[] {
    return aglErpRepository.list('work-orders');
  },

  snapshot(jobId: string): AglJobCardSnapshot {
    const job = requireJob(jobId);
    const diagnosticFindings = related('diagnostic-findings', jobId);
    const labour = related('job-labour', jobId);
    const parts = related('job-parts', jobId);
    const evidence = related('job-evidence', jobId);
    const inspections = related('inspections', jobId);
    const handovers = related('vehicle-handovers', jobId);
    const corrections = related('job-corrections', jobId);
    const invoice = aglErpRepository.list('invoices').find((record) => record.jobId === jobId);
    const payments = related('payments', jobId);
    const labourTotalGhs = amountTotal(labour);
    const partsTotalGhs = amountTotal(parts.filter((record) => record.status === 'Issue'));
    const paidGhs = amountTotal(payments.filter((record) => record.status !== 'Voided'));
    const invoiceTotal = Number(invoice?.amount ?? job.amount ?? labourTotalGhs + partsTotalGhs);
    return {
      job,
      diagnosticFindings,
      labour,
      parts,
      evidence,
      inspections,
      handovers,
      corrections,
      invoice,
      payments,
      labourTotalGhs,
      partsTotalGhs,
      paidGhs,
      balanceGhs: Math.max(0, invoiceTotal - paidGhs),
    };
  },

  saveDiagnosis(jobId: string, actor: ServiceActor, diagnosis: string) {
    requireOpenJob(jobId);
    return aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: jobId,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        diagnostic: diagnosis,
        diagnosticRecordedBy: actor.name,
        diagnosticRecordedAt: new Date().toISOString(),
        status: 'Diagnosis',
      },
    });
  },

  saveDiagnosticFindings(
    jobId: string,
    actor: ServiceActor,
    findings: Array<{
      systemComponent: string;
      faultCode: string;
      severity: 'Low' | 'Medium' | 'High' | 'Critical';
      finding: string;
      actionRequired: string;
    }>,
  ) {
    requireOpenJob(jobId);
    findings.forEach((finding, index) => {
      if (!finding.systemComponent.trim()) throw new Error(`System / component is required on diagnostic row ${index + 1}.`);
      if (!finding.finding.trim()) throw new Error(`Fault description is required on diagnostic row ${index + 1}.`);
      if (!finding.actionRequired.trim()) throw new Error(`Required action is required on diagnostic row ${index + 1}.`);
    });
    const correlationId = `DIAG-${Date.now()}`;
    related('diagnostic-findings', jobId).forEach((record) => aglErpRepository.delete({
      moduleId: 'diagnostic-findings',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
    }));
    const records = findings.map((finding) => aglErpRepository.create({
      moduleId: 'diagnostic-findings',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        jobId,
        name: finding.systemComponent,
        systemComponent: finding.systemComponent,
        faultCode: finding.faultCode,
        severity: finding.severity,
        finding: finding.finding,
        actionRequired: finding.actionRequired,
        owner: actor.name,
        status: 'Recorded',
      },
    }));
    aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: jobId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        diagnosticFindingCount: records.length,
        diagnosticFindingsRecordedBy: actor.name,
        diagnosticFindingsRecordedAt: new Date().toISOString(),
        status: 'Diagnosis',
      },
    });
    return records;
  },

  addLabour(
    jobId: string,
    actor: ServiceActor,
    values: { mechanic: string; description: string; hours: number; rateGhs: number },
  ) {
    requireOpenJob(jobId);
    const labour = aglErpRepository.create({
      moduleId: 'job-labour',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        jobId,
        name: values.description,
        mechanic: values.mechanic,
        hours: values.hours,
        rateGhs: values.rateGhs,
        amount: values.hours * values.rateGhs,
        owner: actor.name,
        status: 'Posted',
      },
    });
    updateJobTotals(jobId, actor, { status: 'In progress' });
    return labour;
  },

  addPart(
    jobId: string,
    actor: ServiceActor,
    values: {
      movementType: 'Reservation' | 'Issue' | 'Return';
      sku: string;
      name: string;
      quantity: number;
      unitPriceGhs: number;
      location: string;
    },
  ) {
    requireOpenJob(jobId);
    const line = aglErpRepository.create({
      moduleId: 'job-parts',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        jobId,
        sku: values.sku,
        name: values.name,
        quantity: values.quantity,
        unitPriceGhs: values.unitPriceGhs,
        amount: values.quantity * values.unitPriceGhs,
        movementType: values.movementType,
        owner: actor.name,
        status: values.movementType === 'Return' ? 'Returned' : values.movementType,
      },
    });
    aglErpRepository.create({
      moduleId: 'stock-movements',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        movementType: values.movementType,
        sku: values.sku,
        name: values.name,
        quantity: values.quantity,
        location: values.location,
        reference: jobId,
        jobId,
        owner: actor.name,
        notes: `${values.movementType} from operational job card ${jobId}.`,
        status: 'Posted',
      },
    });
    updateJobTotals(jobId, actor, {
      status: values.movementType === 'Reservation' ? 'Awaiting parts' : 'In progress',
    });
    return line;
  },

  addEvidence(
    jobId: string,
    actor: ServiceActor,
    values: { evidenceType: string; reference: string; notes: string },
  ) {
    requireJob(jobId);
    return aglErpRepository.create({
      moduleId: 'job-evidence',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        jobId,
        name: values.evidenceType,
        reference: values.reference,
        notes: values.notes,
        owner: actor.name,
        status: 'Accepted',
      },
    });
  },

  approveEstimate(jobId: string, actor: ServiceActor) {
    requireOpenJob(jobId);
    const snapshot = this.snapshot(jobId);
    const amount = snapshot.labourTotalGhs + snapshot.partsTotalGhs;
    if (amount <= 0) throw new Error('Add labour or parts before approving an estimate.');
    return aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: jobId,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        amount,
        estimateApprovedBy: actor.name,
        estimateApprovedAt: new Date().toISOString(),
        status: 'In progress',
      },
    });
  },

  completeQc(
    jobId: string,
    actor: ServiceActor,
    values: { outcome: 'Pass' | 'Rework required'; inspector: string; roadTest: string; notes: string },
  ) {
    requireOpenJob(jobId);
    const inspection = aglErpRepository.create({
      moduleId: 'inspections',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        jobId,
        name: `Final QC · ${jobId}`,
        reference: jobId,
        owner: values.inspector,
        outcome: values.outcome,
        roadTest: values.roadTest,
        notes: values.notes,
        status: values.outcome === 'Pass' ? 'Pass' : 'Rework required',
      },
    });
    aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: jobId,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        qcState: values.outcome,
        qcInspector: values.inspector,
        qcAt: new Date().toISOString(),
        status: values.outcome === 'Pass' ? 'Ready' : 'In progress',
      },
    });
    return inspection;
  },

  createInvoice(jobId: string, actor: ServiceActor) {
    requireOpenJob(jobId);
    const snapshot = this.snapshot(jobId);
    if (snapshot.invoice) return snapshot.invoice;
    const amount = Number(snapshot.job.amount ?? snapshot.labourTotalGhs + snapshot.partsTotalGhs);
    if (amount <= 0) throw new Error('Approve an estimate before creating the invoice.');
    const invoice = aglErpRepository.create({
      moduleId: 'invoices',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        jobId,
        customer: snapshot.job.customer,
        name: `Workshop invoice · ${jobId}`,
        reference: jobId,
        owner: actor.name,
        amount,
        status: 'Open',
      },
    });
    aglErpRepository.create({
      moduleId: 'sales-ledger',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        jobId,
        customer: snapshot.job.customer,
        name: `Workshop service · ${jobId}`,
        reference: invoice.id,
        owner: actor.name,
        amount,
        status: 'Open',
      },
    });
    aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: jobId,
      actorName: actor.name,
      actorRole: actor.role,
      values: { invoiceId: invoice.id },
    });
    return invoice;
  },

  recordPayment(
    jobId: string,
    actor: ServiceActor,
    values: { paymentMethod: string; amountGhs: number; reference: string },
  ) {
    requireOpenJob(jobId);
    const before = this.snapshot(jobId);
    if (before.balanceGhs <= 0) throw new Error('This invoice has no outstanding balance.');
    if (values.amountGhs <= 0 || values.amountGhs > before.balanceGhs) {
      throw new Error(`Payment must be greater than zero and no more than ${before.balanceGhs.toFixed(2)} GHS.`);
    }
    const invoice = before.invoice ?? this.createInvoice(jobId, actor);
    const payment = aglErpRepository.create({
      moduleId: 'payments',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        jobId,
        invoiceId: invoice.id,
        customer: before.job.customer,
        name: `${values.paymentMethod} · ${before.job.customer}`,
        reference: values.reference,
        paymentMethod: values.paymentMethod,
        owner: actor.name,
        amount: values.amountGhs,
        status: 'Paid',
      },
    });
    const afterPaid = before.paidGhs + values.amountGhs;
    const invoiceTotal = Number(invoice.amount ?? 0);
    const invoiceStatus = afterPaid >= invoiceTotal ? 'Paid' : 'Part paid';
    aglErpRepository.update({
      moduleId: 'invoices',
      recordId: invoice.id,
      actorName: actor.name,
      actorRole: actor.role,
      values: { status: invoiceStatus, paidGhs: afterPaid },
    });
    aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: jobId,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        paymentState: invoiceStatus,
        status: invoiceStatus === 'Paid' && before.job.qcState === 'Pass' ? 'Ready' : before.job.status,
      },
    });
    return payment;
  },

  releaseVehicle(
    jobId: string,
    actor: ServiceActor,
    values?: {
      vehicleCleaned: boolean;
      testDriveStatus: 'Passed' | 'Not required';
      supervisor: string;
      careAdvice: string;
      collectedBy: string;
      customerFeedback: string;
    },
  ) {
    requireOpenJob(jobId);
    const snapshot = this.snapshot(jobId);
    const handoverValues = values ?? {
      vehicleCleaned: false,
      testDriveStatus: 'Not required' as const,
      supervisor: '',
      careAdvice: '',
      collectedBy: '',
      customerFeedback: '',
    };
    if (snapshot.job.qcState !== 'Pass') throw new Error('A passed QC inspection is required before release.');
    if (snapshot.invoice?.status !== 'Paid') throw new Error('The invoice must be paid before release.');
    if (!handoverValues.vehicleCleaned) throw new Error('Confirm final vehicle preparation before release.');
    if (!handoverValues.supervisor.trim()) throw new Error('Supervisor sign-off is required before release.');
    if (!handoverValues.collectedBy.trim()) throw new Error('Record who collected the vehicle.');
    const correlationId = `CORR-HANDOVER-${Date.now()}`;
    const handover = aglErpRepository.create({
      moduleId: 'vehicle-handovers',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        jobId,
        customer: snapshot.job.customer,
        vehicle: snapshot.job.vehicle,
        vehicleCleaned: handoverValues.vehicleCleaned,
        testDriveStatus: handoverValues.testDriveStatus,
        supervisor: handoverValues.supervisor,
        careAdvice: handoverValues.careAdvice,
        collectedBy: handoverValues.collectedBy,
        customerFeedback: handoverValues.customerFeedback,
        owner: actor.name,
        status: 'Released',
      },
    });
    const released = aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: jobId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        status: 'Closed',
        handoverId: handover.id,
        vehicleCleaned: handoverValues.vehicleCleaned,
        testDriveStatus: handoverValues.testDriveStatus,
        supervisorSignoff: handoverValues.supervisor,
        careAdvice: handoverValues.careAdvice,
        collectedBy: handoverValues.collectedBy,
        customerFeedback: handoverValues.customerFeedback,
        releasedBy: actor.name,
        releasedAt: new Date().toISOString(),
      },
    });
    const vehicle = aglErpRepository.list('vehicles').find((candidate) => (
      String(snapshot.job.vehicle).includes(String(candidate.registration))
    ));
    if (vehicle) {
      aglErpRepository.update({
        moduleId: 'vehicles',
        recordId: vehicle.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: { status: 'Active', lastJobId: jobId, lastServiceAt: new Date().toISOString() },
      });
    }
    return released;
  },

  reopenJob(
    jobId: string,
    actor: ServiceActor,
    values: { reason: string; approver: string; evidenceReference: string },
  ) {
    const job = requireJob(jobId);
    if (job.status !== 'Closed') throw new Error('Only a closed job can enter the correction workflow.');
    if (!values.reason.trim()) throw new Error('A correction reason is required.');
    if (!values.approver.trim()) throw new Error('A named approver is required.');
    if (!values.evidenceReference.trim()) throw new Error('Attach an evidence reference for the reopen decision.');
    const correlationId = `CORR-CORRECTION-${Date.now()}`;
    const correction = aglErpRepository.create({
      moduleId: 'job-corrections',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        jobId,
        reason: values.reason,
        approver: values.approver,
        evidenceReference: values.evidenceReference,
        originalReleaseAt: job.releasedAt,
        owner: actor.name,
        status: 'Approved',
      },
    });
    const reopened = aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: jobId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        status: 'In progress',
        correctionId: correction.id,
        reopenedAt: new Date().toISOString(),
        reopenedBy: actor.name,
        reopenApprover: values.approver,
        reopenReason: values.reason,
        qcState: 'Reinspection required',
        previousReleaseAt: job.releasedAt,
      },
    });
    const vehicle = aglErpRepository.list('vehicles').find((candidate) => (
      String(job.vehicle).includes(String(candidate.registration))
      || candidate.id === job.vehicleId
    ));
    if (vehicle) {
      aglErpRepository.update({
        moduleId: 'vehicles',
        recordId: vehicle.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: { status: 'In workshop', currentJobId: jobId },
      });
    }
    return { correction, job: reopened };
  },
};
