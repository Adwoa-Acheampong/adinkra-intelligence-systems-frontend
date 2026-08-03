import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface PeopleActor {
  name: string;
  role: string;
}

const requireRecord = (moduleId: string, recordId: string) => {
  const record = aglErpRepository.list(moduleId).find((candidate) => candidate.id === recordId);
  if (!record) throw new Error(`${recordId} was not found.`);
  return record;
};

export const aglPeopleWorkflow = {
  employees(): AglOperationalRecord[] {
    return aglErpRepository.list('employees');
  },

  contracts(): AglOperationalRecord[] {
    return aglErpRepository.list('contracts');
  },

  cases(): AglOperationalRecord[] {
    return aglErpRepository.list('employee-cases');
  },

  caseEvents(caseId?: string): AglOperationalRecord[] {
    const events = aglErpRepository.list('employment-case-events');
    return caseId ? events.filter((event) => event.caseId === caseId) : events;
  },

  registerContract(actor: PeopleActor, values: {
    employeeId: string;
    contractType: string;
    jobTitle: string;
    department: string;
    startDate: string;
    endDate: string;
    payBasis: string;
    basePayGhs: number;
    noticeTerms: string;
    policyVersion: string;
    signedEvidenceReference: string;
    owner: string;
  }) {
    const employee = requireRecord('employees', values.employeeId);
    if (!values.contractType.trim() || !values.jobTitle.trim() || !values.startDate || !values.noticeTerms.trim()) {
      throw new Error('Contract type, role, start date, and notice terms are required.');
    }
    if (!values.signedEvidenceReference.trim()) throw new Error('Signed contract evidence is required before activation.');
    const prior = this.contracts().filter((contract) => contract.employeeId === employee.id);
    const version = Math.max(0, ...prior.map((contract) => Number(contract.version ?? 0))) + 1;
    const correlationId = `CORR-CONTRACT-${Date.now()}`;
    prior.filter((contract) => contract.status === 'Active').forEach((contract) => {
      aglErpRepository.changeStatus({
        moduleId: 'contracts',
        recordId: contract.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        status: 'Superseded',
        values: { supersededAt: new Date().toISOString(), supersededByVersion: version },
      });
    });
    const contract = aglErpRepository.create({
      moduleId: 'contracts',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        ...values,
        employee: employee.name,
        name: `${String(employee.name)} · ${values.jobTitle}`,
        reference: values.signedEvidenceReference,
        version,
        effectiveAt: values.startDate,
        status: 'Active',
      },
    });
    aglErpRepository.update({
      moduleId: 'employees',
      recordId: employee.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        role: values.jobTitle,
        department: values.department,
        payBasis: values.payBasis,
        basePayGhs: values.basePayGhs,
        compensationEffectiveDate: values.startDate,
        compensationSource: `Contract ${contract.id}`,
        currentContractId: contract.id,
        contractVersion: version,
      },
    });
    return contract;
  },

  openCase(actor: PeopleActor, values: {
    employeeId: string;
    caseType: string;
    subject: string;
    summary: string;
    raisedBy: string;
    receivedDate: string;
    contractId: string;
    initialEvidenceReference: string;
    caseOwner: string;
    accessClass: string;
  }) {
    const employee = requireRecord('employees', values.employeeId);
    if (!values.caseType.trim() || !values.subject.trim() || !values.summary.trim() || !values.raisedBy.trim()) {
      throw new Error('Case type, subject, summary, and reporting party are required.');
    }
    if (!values.initialEvidenceReference.trim()) throw new Error('Initial complaint or case evidence is required.');
    const correlationId = `CORR-EMPLOYMENT-CASE-${Date.now()}`;
    const employmentCase = aglErpRepository.create({
      moduleId: 'employee-cases',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        ...values,
        employee: employee.name,
        name: values.subject,
        reference: values.initialEvidenceReference,
        owner: values.caseOwner,
        status: 'Open',
        openedAt: new Date().toISOString(),
      },
    });
    aglErpRepository.create({
      moduleId: 'employment-case-events',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        caseId: employmentCase.id,
        employeeId: employee.id,
        eventType: 'Complaint received',
        eventDate: values.receivedDate,
        summary: values.summary,
        evidenceReference: values.initialEvidenceReference,
        recordedBy: actor.name,
        owner: values.caseOwner,
        accessClass: values.accessClass,
        status: 'Restricted',
      },
    });
    return employmentCase;
  },

  addCaseEvent(caseId: string, actor: PeopleActor, values: {
    eventType: string;
    eventDate: string;
    summary: string;
    evidenceReference: string;
    recordedBy: string;
  }) {
    const employmentCase = requireRecord('employee-cases', caseId);
    if (['Closed', 'Terminated'].includes(employmentCase.status)) throw new Error('Closed cases require an approved reopen event.');
    if (!values.eventType.trim() || !values.summary.trim() || !values.evidenceReference.trim()) {
      throw new Error('Event type, factual summary, and evidence reference are required.');
    }
    const correlationId = `CORR-EMPLOYMENT-CASE-EVENT-${Date.now()}`;
    const event = aglErpRepository.create({
      moduleId: 'employment-case-events',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        ...values,
        caseId: employmentCase.id,
        employeeId: employmentCase.employeeId,
        owner: employmentCase.owner,
        accessClass: employmentCase.accessClass,
        status: 'Restricted',
      },
    });
    aglErpRepository.changeStatus({
      moduleId: 'employee-cases',
      recordId: employmentCase.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: values.eventType === 'Appeal received' ? 'Appealed' : 'In review',
      values: { lastEventId: event.id, lastEventType: values.eventType, lastEventAt: values.eventDate },
    });
    return event;
  },

  decideCase(caseId: string, actor: PeopleActor, values: {
    outcome: 'No action' | 'Remediation' | 'Written warning' | 'Suspension' | 'Termination';
    decisionMaker: string;
    decisionBasis: string;
    decisionEvidenceReference: string;
    effectiveDate: string;
  }) {
    const employmentCase = requireRecord('employee-cases', caseId);
    if (!values.decisionMaker.trim() || !values.decisionBasis.trim() || !values.decisionEvidenceReference.trim()) {
      throw new Error('Decision maker, basis, and decision evidence are required.');
    }
    const events = this.caseEvents(caseId);
    if (values.outcome === 'Termination') {
      if (!String(employmentCase.contractId ?? '').trim()) throw new Error('A termination decision must identify the governing employment contract.');
      const required = ['Contract review', 'Employee response', 'Payroll review'];
      const missing = required.filter((type) => !events.some((event) => event.eventType === type));
      if (missing.length) throw new Error(`Record these procedural events before termination: ${missing.join(', ')}.`);
    }
    const correlationId = `CORR-EMPLOYMENT-CASE-DECISION-${Date.now()}`;
    const decisionEvent = aglErpRepository.create({
      moduleId: 'employment-case-events',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        caseId,
        employeeId: employmentCase.employeeId,
        eventType: 'Decision recorded',
        eventDate: values.effectiveDate,
        summary: `${values.outcome}: ${values.decisionBasis}`,
        evidenceReference: values.decisionEvidenceReference,
        recordedBy: actor.name,
        decisionMaker: values.decisionMaker,
        outcome: values.outcome,
        owner: employmentCase.owner,
        accessClass: employmentCase.accessClass,
        status: 'Restricted',
      },
    });
    const decided = aglErpRepository.changeStatus({
      moduleId: 'employee-cases',
      recordId: caseId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: values.outcome === 'Termination' ? 'Terminated' : 'Closed',
      values: {
        ...values,
        decisionEventId: decisionEvent.id,
        decidedAt: new Date().toISOString(),
      },
    });
    if (values.outcome === 'Termination') {
      const employee = requireRecord('employees', String(employmentCase.employeeId));
      aglErpRepository.changeStatus({
        moduleId: 'employees',
        recordId: employee.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        status: 'Terminated',
        values: {
          terminationCaseId: employmentCase.id,
          terminationEffectiveDate: values.effectiveDate,
          terminationEvidenceReference: values.decisionEvidenceReference,
        },
      });
    }
    return { employmentCase: decided, decisionEvent };
  },
};
