import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface FixBotActor {
  name: string;
  role: string;
}

export interface FixBotCaseInput {
  customerId: string;
  vehicleId: string;
  jobId?: string;
  category: string;
  urgency: string;
  symptoms: string;
  warningLights?: string;
  obdCodes?: string;
  mileage?: number;
  priorWork?: string;
  testHistory?: string;
  reviewer: string;
  customerConsent: boolean;
}

const requireRecord = (moduleId: string, recordId: string) => {
  const record = aglErpRepository.list(moduleId).find((candidate) => candidate.id === recordId);
  if (!record) throw new Error(`${recordId} was not found in ${moduleId}.`);
  return record;
};

const recommendationFor = (input: FixBotCaseInput) => {
  const context = `${input.category} ${input.symptoms} ${input.obdCodes ?? ''}`.toLowerCase();
  if (context.includes('brake') || context.includes('abs')) {
    return 'Confirm pad and disc thickness, inspect hydraulic pressure and wheel-speed signals, then road-test only after the safety check is signed. Do not replace parts from the symptom alone.';
  }
  if (context.includes('electrical') || context.includes('battery') || context.includes('alternator')) {
    return 'Load-test the battery, record charging voltage and voltage drop, inspect grounds and connectors, then compare the result with stored fault and freeze-frame evidence before authorising components.';
  }
  if (context.includes('cool') || context.includes('overheat')) {
    return 'Pressure-test the cooling circuit, verify fan command and temperature-sensor plausibility, inspect for combustion-gas evidence, and isolate the leak path before authorising repair.';
  }
  if (context.includes('suspension') || context.includes('steering')) {
    return 'Complete a lift inspection, record joint play and tyre condition, verify alignment readings, and identify the binding or worn component before preparing the estimate.';
  }
  return 'Read stored and pending fault codes with freeze-frame data, reproduce the symptom safely, test the affected system against manufacturer values, and compare the result with vehicle history before authorising parts.';
};

const confidenceFor = (input: FixBotCaseInput) => {
  let confidence = 48;
  if (input.obdCodes?.trim()) confidence += 14;
  if (input.warningLights?.trim()) confidence += 7;
  if (input.mileage && input.mileage > 0) confidence += 6;
  if (input.priorWork?.trim()) confidence += 8;
  if (input.testHistory?.trim()) confidence += 12;
  return Math.min(92, confidence);
};

export const aglFixBotWorkflow = {
  cases(): AglOperationalRecord[] {
    return aglErpRepository.list('fixbot');
  },

  customers(): AglOperationalRecord[] {
    return aglErpRepository.list('customers').filter((customer) => customer.status !== 'Archived');
  },

  vehicles(customerId?: string): AglOperationalRecord[] {
    const vehicles = aglErpRepository.list('vehicles').filter((vehicle) => vehicle.status !== 'Archived');
    if (!customerId) return vehicles;
    const customer = this.customers().find((candidate) => candidate.id === customerId);
    return vehicles.filter((vehicle) => (
      vehicle.customerId === customerId
      || String(vehicle.customer ?? '').toLowerCase() === String(customer?.name ?? '').toLowerCase()
    ));
  },

  jobs(vehicleId?: string): AglOperationalRecord[] {
    return aglErpRepository.list('work-orders').filter((job) => (
      job.status !== 'Closed'
      && (!vehicleId || job.vehicleId === vehicleId)
    ));
  },

  reviewers(): AglOperationalRecord[] {
    const employees = aglErpRepository.list('employees');
    return employees.filter((employee) => (
      employee.status === 'Active'
      && ['Workshop', 'Management'].includes(String(employee.department ?? ''))
    ));
  },

  createCase(actor: FixBotActor, input: FixBotCaseInput) {
    if (!input.customerConsent) throw new Error('Customer diagnostic consent is required before opening a case.');
    if (!input.symptoms.trim()) throw new Error('Record the observed symptoms before analysis.');
    const customer = requireRecord('customers', input.customerId);
    const vehicle = requireRecord('vehicles', input.vehicleId);
    const belongsToCustomer = vehicle.customerId === customer.id
      || String(vehicle.customer ?? '').toLowerCase() === String(customer.name ?? '').toLowerCase();
    if (!belongsToCustomer) throw new Error('The selected vehicle is not linked to this customer.');
    if (input.jobId) requireRecord('work-orders', input.jobId);

    const confidence = confidenceFor(input);
    const correlationId = `CORR-FIXBOT-${Date.now()}`;
    return aglErpRepository.create({
      moduleId: 'fixbot',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        customer: String(customer.name),
        vehicle: `${String(vehicle.vehicle ?? '')} · ${String(vehicle.registration ?? '')}`,
        registration: String(vehicle.registration ?? ''),
        jobId: input.jobId,
        category: input.category,
        urgency: input.urgency,
        symptoms: input.symptoms,
        warningLights: input.warningLights,
        obdCodes: input.obdCodes,
        mileage: input.mileage ?? Number(vehicle.mileage ?? 0),
        priorWork: input.priorWork,
        testHistory: input.testHistory,
        recommendation: recommendationFor(input),
        confidence,
        risk: input.urgency === 'Vehicle unsafe' ? 'Safety hold' : input.urgency === 'Urgent' ? 'Priority review' : 'Standard control',
        customerConsent: true,
        consentRecordedAt: new Date().toISOString(),
        owner: input.reviewer,
        status: 'Human review',
      },
    });
  },

  accept(caseId: string, actor: FixBotActor) {
    const diagnosticCase = requireRecord('fixbot', caseId);
    if (!['Human review', 'Escalated'].includes(diagnosticCase.status)) {
      throw new Error('Only reviewed or escalated cases can be accepted.');
    }
    return aglErpRepository.changeStatus({
      moduleId: 'fixbot',
      recordId: caseId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-FIXBOT-ACCEPT-${Date.now()}`,
      status: 'Accepted',
      values: {
        acceptedBy: actor.name,
        acceptedAt: new Date().toISOString(),
        humanDecision: 'Recommendation accepted after human review',
      },
    });
  },

  escalate(caseId: string, actor: FixBotActor, reason: string) {
    if (!reason.trim()) throw new Error('Record an escalation reason.');
    requireRecord('fixbot', caseId);
    return aglErpRepository.changeStatus({
      moduleId: 'fixbot',
      recordId: caseId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-FIXBOT-ESCALATE-${Date.now()}`,
      status: 'Escalated',
      values: {
        escalationReason: reason,
        escalatedBy: actor.name,
        escalatedAt: new Date().toISOString(),
      },
    });
  },

  attachToJob(caseId: string, jobId: string, actor: FixBotActor) {
    requireRecord('fixbot', caseId);
    const job = requireRecord('work-orders', jobId);
    if (job.status === 'Closed') throw new Error('A diagnostic case cannot be attached to a closed job.');
    const correlationId = `CORR-FIXBOT-ATTACH-${Date.now()}`;
    const attached = aglErpRepository.update({
      moduleId: 'fixbot',
      recordId: caseId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: { jobId: job.id },
    });
    if (attached.status === 'Accepted') {
      return aglErpRepository.changeStatus({
        moduleId: 'fixbot',
        recordId: caseId,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        status: 'Accepted',
        values: { jobId: job.id, attachedBy: actor.name, attachedAt: new Date().toISOString() },
      });
    }
    return attached;
  },

  createJob(caseId: string, actor: FixBotActor) {
    const diagnosticCase = requireRecord('fixbot', caseId);
    if (diagnosticCase.jobId) throw new Error(`${caseId} is already linked to ${String(diagnosticCase.jobId)}.`);
    const correlationId = `CORR-FIXBOT-JOB-${Date.now()}`;
    const job = aglErpRepository.create({
      moduleId: 'work-orders',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        customerId: diagnosticCase.customerId,
        vehicleId: diagnosticCase.vehicleId,
        customer: diagnosticCase.customer,
        vehicle: diagnosticCase.vehicle,
        registration: diagnosticCase.registration,
        concern: diagnosticCase.symptoms,
        diagnostic: diagnosticCase.recommendation,
        fixbotCaseId: diagnosticCase.id,
        mechanic: 'Unassigned',
        bay: 'Unassigned',
        promise: new Date().toISOString().slice(0, 10),
        amount: 0,
        advisor: actor.name,
        customerAuthorizedAt: diagnosticCase.consentRecordedAt,
        owner: actor.name,
        status: 'Diagnosis',
      },
    });
    aglErpRepository.changeStatus({
      moduleId: 'fixbot',
      recordId: caseId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Accepted',
      values: {
        jobId: job.id,
        acceptedBy: actor.name,
        acceptedAt: new Date().toISOString(),
        humanDecision: 'Accepted and converted to work order',
      },
    });
    return job;
  },
};
